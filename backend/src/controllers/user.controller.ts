import { Request, Response } from 'express'
import { asyncHandler } from '../middleware'
import { supabaseAdmin } from '../config/supabase.config'
import { UserProfile, UserRole } from '../types/database.types'

export class UserController {
  /**
   * Get all users with filtering and pagination
   */
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      institution,
      sortBy = 'created_at',
      sortDirection = 'desc'
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    let query = supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .range(offset, offset + Number(limit) - 1)

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (role) {
      query = query.eq('role', role)
    }

    if (institution) {
      query = query.eq('institution', institution)
    }

    // Apply sorting
    query = query.order(sortBy as string, { ascending: sortDirection === 'asc' })

    const { data: users, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    res.json({
      success: true,
      data: {
        users: users || [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count || 0,
          totalPages: Math.ceil((count || 0) / Number(limit))
        }
      }
    })
  })

  /**
   * Get user by ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params

    const { data: user, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        })
      }
      throw new Error(`Failed to fetch user: ${error.message}`)
    }

    res.json({
      success: true,
      data: user
    })
  })

  /**
   * Create new user
   */
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const { full_name, email, role, institution, phone } = req.body

    // Validate required fields
    if (!full_name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, and role are required'
      })
    }

    // Validate role
    const validRoles: UserRole[] = ['clerk', 'archivist', 'citizen', 'media', 'inspector', 'admin']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      })
    }

    try {
      // First create the user in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          full_name,
          role
        }
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      // Then create the user profile
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authUser.user!.id,
          full_name,
          email,
          role,
          institution,
          phone
        })
        .select()
        .single()

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user!.id)
        throw new Error(`Failed to create user profile: ${profileError.message}`)
      }

      // Log the user creation
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'USER_CREATED',
        p_entity_type: 'user',
        p_entity_id: authUser.user!.id,
        p_details: {
          email,
          role,
          created_by: req.userId
        }
      })

      res.status(201).json({
        success: true,
        data: userProfile,
        message: 'User created successfully'
      })
    } catch (error) {
      console.error('User creation error:', error)
      throw error
    }
  })

  /**
   * Update user
   */
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params
    const { full_name, email, role, institution, phone } = req.body

    // Validate role if provided
    if (role) {
      const validRoles: UserRole[] = ['clerk', 'archivist', 'citizen', 'media', 'inspector', 'admin']
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role'
        })
      }
    }

    try {
      // Get current user data for audit log
      const { data: currentUser } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const updateData: Partial<UserProfile> = {}
      if (full_name !== undefined) updateData.full_name = full_name
      if (email !== undefined) updateData.email = email
      if (role !== undefined) updateData.role = role
      if (institution !== undefined) updateData.institution = institution
      if (phone !== undefined) updateData.phone = phone

      const { data: updatedUser, error } = await supabaseAdmin
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          })
        }
        throw new Error(`Failed to update user: ${error.message}`)
      }

      // Update auth user email if changed
      if (email && email !== currentUser?.email) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          email
        })
        
        if (authError) {
          console.error('Failed to update auth email:', authError)
        }
      }

      // Log the user update
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'USER_UPDATED',
        p_entity_type: 'user',
        p_entity_id: userId,
        p_details: {
          changes: updateData,
          updated_by: req.userId
        }
      })

      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      })
    } catch (error) {
      console.error('User update error:', error)
      throw error
    }
  })

  /**
   * Delete user
   */
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params

    // Prevent self-deletion
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      })
    }

    try {
      // Get user data for audit log
      const { data: user } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Delete from user_profiles first
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          })
        }
        throw new Error(`Failed to delete user profile: ${profileError.message}`)
      }

      // Delete from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.error('Failed to delete auth user:', authError)
      }

      // Log the user deletion
      await supabaseAdmin.rpc('create_audit_log', {
        p_action: 'USER_DELETED',
        p_entity_type: 'user',
        p_entity_id: userId,
        p_details: {
          deleted_user: user,
          deleted_by: req.userId
        }
      })

      res.json({
        success: true,
        message: 'User deleted successfully'
      })
    } catch (error) {
      console.error('User deletion error:', error)
      throw error
    }
  })

  /**
   * Get user statistics
   */
  getUserStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { data: totalUsers, error: totalError } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    if (totalError) {
      throw new Error(`Failed to get total users: ${totalError.message}`)
    }

    const { data: roleStats, error: roleError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')

    if (roleError) {
      throw new Error(`Failed to get role statistics: ${roleError.message}`)
    }

    // Count by role
    const roleCounts = roleStats?.reduce((acc: Record<string, number>, user: { role: string }) => {
      acc[user.role] = (acc[user.role] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentUsers, error: recentError } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo)

    if (recentError) {
      throw new Error(`Failed to get recent users: ${recentError.message}`)
    }

    res.json({
      success: true,
      data: {
        total: totalUsers?.length || 0,
        byRole: roleCounts,
        recentRegistrations: recentUsers?.length || 0,
        period: '30 days'
      }
    })
  })

  /**
   * Get institutions list
   */
  getInstitutions = asyncHandler(async (req: Request, res: Response) => {
    const { data: institutions, error } = await supabaseAdmin
      .from('user_profiles')
      .select('institution')
      .not('institution', 'is', null)

    if (error) {
      throw new Error(`Failed to get institutions: ${error.message}`)
    }

    const uniqueInstitutions = [...new Set(institutions?.map((u: { institution: string | null }) => u.institution).filter(Boolean))]

    res.json({
      success: true,
      data: uniqueInstitutions
    })
  })
}

export const userController = new UserController() 