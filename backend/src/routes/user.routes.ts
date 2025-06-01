import { Router } from 'express'
import { userController } from '../controllers/user.controller'
import { authenticateToken, requireRoles } from '../middleware/auth.middleware'

const router = Router()

// All user management routes require authentication and admin role
router.use(authenticateToken)
router.use(requireRoles(['admin']))

// User CRUD routes
router.get('/users', userController.getUsers)
router.get('/users/statistics', userController.getUserStatistics)
router.get('/users/institutions', userController.getInstitutions)
router.get('/users/:userId', userController.getUserById)
router.post('/users', userController.createUser)
router.put('/users/:userId', userController.updateUser)
router.delete('/users/:userId', userController.deleteUser)

export default router 