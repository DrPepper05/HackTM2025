import { supabaseAdmin, withMonitoring, verifyUserRole } from '../config/supabase.config'
import { UserProfile, UserRole, isUserRole } from '../types/database.types'
import { Provider } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'

export interface RegisterUserDto {
  email: string
  password: string
  full_name: string
  role?: UserRole
  institution?: string
  phone?: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface OAuthLoginDto {
  provider: 'google' | 'github'
  redirectTo?: string
}

export interface UpdateProfileDto {
  full_name?: string
  institution?: string
  phone?: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    profile: UserProfile
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
}

export interface OAuthResponse {
  url: string
  provider: string
}

export interface PasswordResetRequest {
  email: string
}

export class AuthService {
  /**
   * Register a new user with email/password
   */
  async register(data: RegisterUserDto): Promise<AuthResponse> {
    return withMonitoring('create', 'auth.users', async () => {
      // Validate role
      if (data.role && !isUserRole(data.role)) {
        throw new Error(`Invalid role: ${data.role}`)
      }

      const role = data.role || 'citizen'

      try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true, // Auto-confirm for hackathon
          user_metadata: {
            full_name: data.full_name
          }
        })

        if (authError) throw authError

        // 2. Create user profile
        const profile = await this.createUserProfile({
          id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          role,
          institution: data.institution,
          phone: data.phone
        })

        // 3. Create audit log
        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'USER_REGISTERED',
          p_entity_type: 'user',
          p_entity_id: authData.user.id,
          p_details: {
            email: data.email,
            role,
            institution: data.institution,
            auth_provider: 'email'
          }
        })

        // 4. For hackathon: return mock session
        return {
          user: {
            id: authData.user.id,
            email: data.email,
            profile
          },
          session: {
            access_token: this.generateMockToken(authData.user.id, role),
            refresh_token: randomBytes(32).toString('hex'),
            expires_at: Date.now() + 3600000 // 1 hour
          }
        }
      } catch (error) {
        console.error('Registration error:', error)
        throw error
      }
    })
  }

  /**
   * Login with email/password
   */
  async login(credentials: LoginDto): Promise<AuthResponse> {
    return withMonitoring('signIn', 'auth.users', async () => {
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) {
        await this.logFailedLogin(credentials.email, 'email', authError.message)
        throw authError
      }

      return this.handleSuccessfulAuth(authData.user, authData.session, 'email')
    })
  }

  /**
   * Initialize OAuth login
   */
  async loginWithOAuth(data: OAuthLoginDto): Promise<OAuthResponse> {
    const redirectTo = data.redirectTo || `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    
    const { data: authData, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: data.provider as Provider,
      options: {
        redirectTo,
        scopes: data.provider === 'github' ? 'read:user user:email' : 'email profile'
      }
    })

    if (error) throw error

    return {
      url: authData.url,
      provider: data.provider
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code: string, provider: string): Promise<AuthResponse> {
    return withMonitoring('oauth_callback', 'auth.users', async () => {
      // Exchange code for session
      const { data: authData, error } = await supabaseAdmin.auth.exchangeCodeForSession(code)

      if (error) {
        await this.logFailedLogin('unknown', provider, error.message)
        throw error
      }

      // Check if user profile exists
      let profile = await this.getUserProfile(authData.user.id)

      if (!profile) {
        // First time OAuth login - create profile
        profile = await this.createUserProfile({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: authData.user.user_metadata?.full_name || 
                     authData.user.user_metadata?.name || 
                     authData.user.email!.split('@')[0],
          role: 'citizen', // Default role for OAuth users
          institution: null,
          phone: null
        })

        // Log first OAuth login
        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'USER_REGISTERED_OAUTH',
          p_entity_type: 'user',
          p_entity_id: authData.user.id,
          p_details: {
            email: authData.user.email,
            provider,
            metadata: authData.user.user_metadata
          }
        })
      }

      return this.handleSuccessfulAuth(authData.user, authData.session, provider)
    })
  }

  /**
   * Create or update user profile
   */
  private async createUserProfile(data: {
    id: string
    email: string
    full_name: string
    role: UserRole
    institution?: string | null
    phone?: string | null
  }): Promise<UserProfile> {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        institution: data.institution,
        phone: data.phone
      })
      .select()
      .single()

    if (error) throw error
    return profile
  }

  /**
   * Handle successful authentication
   */
  private async handleSuccessfulAuth(
    user: any,
    session: any,
    provider: string
  ): Promise<AuthResponse> {
    // Get user profile
    const profile = await this.getUserProfile(user.id)
    if (!profile) {
      throw new Error('User profile not found')
    }

    // Log successful login
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'USER_LOGIN',
      p_entity_type: 'user',
      p_entity_id: user.id,
      p_details: {
        email: user.email,
        role: profile.role,
        provider
      }
    })

    // Convert expires_at from seconds to milliseconds if needed
    let expiresAt = session.expires_at
    if (expiresAt && expiresAt < 10000000000) {
      // If less than 10 billion, it's likely in seconds, convert to milliseconds
      expiresAt = expiresAt * 1000
    } else if (!expiresAt) {
      // Default to 1 hour from now if not provided
      expiresAt = Date.now() + 3600000
    }

    return {
      user: {
        id: user.id,
        email: user.email!,
        profile
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: expiresAt
      }
    }
  }

  /**
   * Log failed login attempt
   */
  private async logFailedLogin(
    email: string,
    provider: string,
    error: string
  ): Promise<void> {
    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'LOGIN_FAILED',
      p_entity_type: 'auth',
      p_entity_id: null,
      p_details: {
        email,
        provider,
        error
      }
    })
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    await withMonitoring('signOut', 'auth.users', async () => {
      try {
        // For user logout, we mainly need to log the audit trail
        // The actual token invalidation happens on the client side
        // or through Supabase's built-in session management
        
        await supabaseAdmin.rpc('create_audit_log', {
          p_action: 'USER_LOGOUT',
          p_entity_type: 'user',
          p_entity_id: userId,
          p_details: {}
        })
      } catch (error) {
        // If audit logging fails, don't fail the logout operation
        console.error('Error logging logout audit:', error)
      }
    })
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return data
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: UpdateProfileDto
  ): Promise<UserProfile> {
    return withMonitoring('update', 'user_profiles', async () => {
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error

      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'PROFILE_UPDATED',
        p_entity_type: 'user',
        p_entity_id: userId,
        p_details: updates
      })

      return data
    })
  }

  /**
   * Change user role (admin only)
   */
  async changeUserRole(
    targetUserId: string,
    newRole: UserRole,
    adminUserId: string
  ): Promise<UserProfile> {
    // Verify admin has permission
    const isAdmin = await verifyUserRole(adminUserId, ['admin'])
    if (!isAdmin) {
      throw new Error('Unauthorized: Admin role required')
    }

    if (!isUserRole(newRole)) {
      throw new Error(`Invalid role: ${newRole}`)
    }

    return withMonitoring('update', 'user_profiles', async () => {
      // Get current role for audit
      const { data: currentProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('role')
        .eq('id', targetUserId)
        .single()

      // Update role
      const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId)
        .select()
        .single()

      if (error) throw error

      // Log role change
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'USER_ROLE_CHANGED',
        p_entity_type: 'user',
        p_entity_id: targetUserId,
        p_details: {
          previous_role: currentProfile?.role,
          new_role: newRole,
          changed_by: adminUserId
        }
      })

      return data
    })
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`
    })

    if (error) throw error

    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'PASSWORD_RESET_REQUESTED',
      p_entity_type: 'auth',
      p_entity_id: null,
      p_details: { email }
    })
  }

  /**
   * Update password with reset token
   */
  async updatePasswordWithToken(token: string, newPassword: string): Promise<void> {
    const { data, error } = await supabaseAdmin.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'PASSWORD_RESET_COMPLETED',
      p_entity_type: 'user',
      p_entity_id: data.user.id,
      p_details: {}
    })
  }

  /**
   * Verify user has required role
   */
  async verifyUserAccess(
    userId: string,
    requiredRoles: UserRole[]
  ): Promise<boolean> {
    const profile = await this.getUserProfile(userId)
    if (!profile) return false
    
    return requiredRoles.includes(profile.role)
  }

  /**
   * Get all users (admin only)
   */
  async getUsers(
    adminUserId: string,
    filters?: {
      role?: UserRole
      institution?: string
      search?: string
      limit?: number
      offset?: number
    }
  ): Promise<{ users: UserProfile[]; total: number }> {
    // Verify admin access
        // Verify admin access
        const isAdmin = await verifyUserRole(adminUserId, ['admin', 'inspector'])
        if (!isAdmin) {
          throw new Error('Unauthorized: Admin or Inspector role required')
        }
    
        let query = supabaseAdmin
          .from('user_profiles')
          .select('*', { count: 'exact' })
    
        if (filters?.role) {
          query = query.eq('role', filters.role)
        }
    
        if (filters?.institution) {
          query = query.ilike('institution', `%${filters.institution}%`)
        }
    
        if (filters?.search) {
          query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`)
        }
    
        // Pagination
        const limit = filters?.limit || 20
        const offset = filters?.offset || 0
        query = query.range(offset, offset + limit - 1)
        query = query.order('created_at', { ascending: false })
    
        const { data, error, count } = await query
    
        if (error) throw error
    
        return {
          users: data || [],
          total: count || 0
        }
      }
    
    /**
     * Link OAuth provider to existing account
     */
    async linkOAuthProvider(
    userId: string,
    provider: 'google' | 'github'
    ): Promise<OAuthResponse> {
    const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL}/profile/linked`
    
    // Note: This method requires user to be authenticated
    const { data, error } = await supabaseAdmin.auth.linkIdentity({
        provider: provider as Provider,
        options: { redirectTo }
    })

    if (error) throw error

    await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'OAUTH_PROVIDER_LINKED',
        p_entity_type: 'user',
        p_entity_id: userId,
        p_details: { provider }
    })

    return {
        url: data.url,
        provider
    }
    }

    /**
     * Unlink OAuth provider
     */
    async unlinkOAuthProvider(
    userId: string,
    provider: 'google' | 'github'
    ): Promise<void> {
    // Get user identities first
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (userError) throw userError

    const identity = userData.user.identities?.find(id => id.provider === provider)
    if (!identity) {
        throw new Error(`Provider ${provider} is not linked to this account`)
    }

    // Ensure user has another way to login
    const hasEmail = userData.user.email && userData.user.email_confirmed_at
    const otherProviders = userData.user.identities?.filter(id => id.provider !== provider) || []
    
    if (!hasEmail && otherProviders.length === 0) {
        throw new Error('Cannot unlink the only authentication method')
    }

    // For now, use the user management API to update the user
    // Note: This is a simplified approach for the hackathon
    // In production, you might need to use the Management API directly
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...userData.user.user_metadata,
        [`${provider}_unlinked`]: true
      }
    })

    if (error) throw error

    await supabaseAdmin.rpc('create_audit_log', {
      p_action: 'OAUTH_PROVIDER_UNLINKED',
      p_entity_type: 'user',
      p_entity_id: userId,
      p_details: { provider }
    })
    }

    /**
     * Get user's linked providers
     */
    async getLinkedProviders(userId: string): Promise<{
    email: boolean
    providers: string[]
    }> {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (error) throw error

    const providers = data.user.identities?.map(identity => identity.provider) || []
    const hasEmail = !!data.user.email && !!data.user.email_confirmed_at

    return {
        email: hasEmail,
        providers
    }
    }

    /**
     * Refresh session token
     */
    async refreshSession(refreshToken: string): Promise<AuthResponse> {
    const { data, error } = await supabaseAdmin.auth.refreshSession({
        refresh_token: refreshToken
    })

    if (error) throw error

    const profile = await this.getUserProfile(data.user!.id)
    if (!profile) {
        throw new Error('User profile not found')
    }

    // Convert expires_at from seconds to milliseconds if needed
    let expiresAt = data.session!.expires_at
    if (expiresAt && expiresAt < 10000000000) {
      // If less than 10 billion, it's likely in seconds, convert to milliseconds
      expiresAt = expiresAt * 1000
    } else if (!expiresAt) {
      // Default to 1 hour from now if not provided
      expiresAt = Date.now() + 3600000
    }

    return {
        user: {
        id: data.user!.id,
        email: data.user!.email!,
        profile
        },
        session: {
        access_token: data.session!.access_token,
        refresh_token: data.session!.refresh_token,
        expires_at: expiresAt
        }
    }
    }

    /**
     * Generate mock JWT token for development
     */
    private generateMockToken(userId: string, role: string): string {
    const payload = {
        sub: userId,
        role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    }

    // In production: use proper JWT secret
    return jwt.sign(payload, process.env.JWT_SECRET || 'mock-secret')
    }

    /**
     * Validate session token
     */
    async validateSession(token: string): Promise<{
    valid: boolean
    userId?: string
    role?: string
    }> {
    try {
        // For Supabase tokens
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
        
        if (error || !user) {
        return { valid: false }
        }

        const profile = await this.getUserProfile(user.id)
        
        return {
        valid: true,
        userId: user.id,
        role: profile?.role
        }
    } catch (error) {
        // Try mock token validation
        try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mock-secret') as any
        return {
            valid: true,
            userId: decoded.sub,
            role: decoded.role
        }
        } catch {
        return { valid: false }
        }
    }
    }

    /**
     * Get user statistics for admin dashboard
     */
    async getUserStatistics(adminUserId: string): Promise<{
    total: number
    byRole: Record<string, number>
    recentRegistrations: number
    activeToday: number
    }> {
    // Verify admin access
    const isAdmin = await verifyUserRole(adminUserId, ['admin'])
    if (!isAdmin) {
        throw new Error('Unauthorized: Admin role required')
    }

    // Get total users
    const { count: total } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

    // Get users by role
    const roles: UserRole[] = ['admin', 'archivist', 'clerk', 'inspector', 'citizen', 'media']
    const byRole: Record<string, number> = {}
    
    for (const role of roles) {
        const { count } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', role)
        
        byRole[role] = count || 0
    }

    // Get recent registrations (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentRegistrations } = await supabaseAdmin
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString())

    // Get active users today (from audit logs)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const { data: activeUsers } = await supabaseAdmin
        .from('audit_logs')
        .select('user_id')
        .gte('timestamp', todayStart.toISOString())
        .eq('action', 'USER_LOGIN')
    
    const uniqueActiveUsers = new Set(activeUsers?.map(log => log.user_id) || [])

    return {
        total: total || 0,
        byRole,
        recentRegistrations: recentRegistrations || 0,
        activeToday: uniqueActiveUsers.size
    }
    }

    /**
     * Check if email is already registered
     */
    async checkEmailExists(email: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

    return !!data && !error
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.resend({
        type: 'signup',
        email,
        options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify`
        }
    })

    if (error) throw error

    await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'VERIFICATION_EMAIL_RESENT',
        p_entity_type: 'auth',
        p_entity_id: null,
        p_details: { email }
    })
    }

    /**
     * Delete user account (admin only or self)
     */
    async deleteUser(
    targetUserId: string,
    requestingUserId: string,
    reason?: string
    ): Promise<void> {
    // Check if self-deletion or admin deletion
    const isSelf = targetUserId === requestingUserId
    const isAdmin = await verifyUserRole(requestingUserId, ['admin'])

    if (!isSelf && !isAdmin) {
        throw new Error('Unauthorized: Can only delete own account or requires admin role')
    }

    // Soft delete approach - mark as deleted but keep data for audit
    const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .update({
        email: `deleted_${targetUserId}@deleted.local`,
        full_name: 'Deleted User',
        phone: null,
        institution: null,
        updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId)

    if (profileError) throw profileError

    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
    
    if (authError) throw authError

    // Log deletion
    await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'USER_DELETED',
        p_entity_type: 'user',
        p_entity_id: targetUserId,
        p_details: {
        deleted_by: requestingUserId,
        is_self_deletion: isSelf,
        reason
        }
    })
    }
}

// Export singleton instance
export const authService = new AuthService()