import { Request, Response } from 'express'
import { authService } from '../services'
import { asyncHandler } from '../middleware'

// Type for authenticated requests
interface AuthenticatedRequest extends Request {
  user: any
  userId: string
}

export class AuthController {
  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, full_name, role = 'citizen', institution, phone } = req.body

    const result = await authService.register({
      email,
      password,
      full_name,
      role,
      institution,
      phone
    })

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        session: result.session
      }
    })
  })

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body

    const result = await authService.login({ email, password })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        session: result.session
      }
    })
  })

  /**
   * OAuth login
   */
  loginWithOAuth = asyncHandler(async (req: Request, res: Response) => {
    const { provider, redirectTo } = req.body

    const result = await authService.loginWithOAuth({ provider, redirectTo })

    res.json({
      success: true,
      message: 'OAuth login initiated',
      data: result
    })
  })

  /**
   * OAuth callback
   */
  oauthCallback = asyncHandler(async (req: Request, res: Response) => {
    const { code, provider } = req.query

    if (!code || !provider) {
      return res.status(400).json({
        success: false,
        message: 'Missing code or provider parameter'
      })
    }

    const result = await authService.handleOAuthCallback(
      code as string, 
      provider as string
    )

    res.json({
      success: true,
      message: 'OAuth authentication successful',
      data: result
    })
  })

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!
    await authService.logout(userId)

    res.json({
      success: true,
      message: 'Logout successful'
    })
  })

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!
    const profile = await authService.getUserProfile(userId)

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
    }

    res.json({
      success: true,
      data: profile
    })
  })

  /**
   * Get user profile by ID (admin only or own profile)
   */
  getProfileById = asyncHandler(async (req: Request, res: Response) => {
    const requestingUserId = req.userId!
    const requestingUser = req.user!
    const targetUserId = req.params.id

    // Check authorization: user can only access their own profile unless they're admin
    if (targetUserId !== requestingUserId && requestingUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own profile unless you are an admin.'
      })
    }

    const profile = await authService.getUserProfile(targetUserId)

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      })
    }

    res.json({
      success: true,
      data: profile
    })
  })

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!
    const updates = req.body
    const updatedProfile = await authService.updateProfile(userId, updates)

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    })
  })

  /**
   * Request password reset
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body

    await authService.requestPasswordReset(email)

    res.json({
      success: true,
      message: 'Password reset email sent'
    })
  })

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body

    const result = await authService.refreshSession(refreshToken)

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    })
  })
}

export const authController = new AuthController() 