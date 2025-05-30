import { Router } from 'express'
import { authController } from '../controllers'
import {
  authenticateToken,
  requireAdmin,
  validateLogin,
  validateRegister,
  validateUUID,
  handleValidationErrors
} from '../middleware'

const router = Router()

// Public routes (no authentication required)
router.post('/register', validateRegister, authController.register)
router.post('/login', validateLogin, authController.login)
router.post('/oauth/google', authController.loginWithOAuth)
router.post('/oauth/github', authController.loginWithOAuth)
router.get('/oauth/callback', authController.oauthCallback)
router.post('/password/reset', authController.requestPasswordReset)
router.post('/refresh', authController.refreshToken)

// Protected routes (authentication required)
router.use(authenticateToken)

router.post('/logout', authController.logout)
router.get('/profile', authController.getProfile) // deprecated
router.get('/profile/:id', validateUUID('id'), authController.getProfileById)
router.put('/profile', authController.updateProfile)

export default router 