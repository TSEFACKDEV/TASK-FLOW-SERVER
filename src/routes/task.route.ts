import { Router } from 'express'
import {
  createTask,
  updateTaskStatus,
  updateTaskAssignment, // NOUVEAU
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  addComment
} from '../controllers/task.controller.js'
import { authenticate } from '../middlewares/auth.middleware.js'
import {
  validate,
  taskValidation,
  taskStatusValidation,
  taskAssignmentValidation, // NOUVEAU
  idValidation
} from '../middlewares/validation.middleware.js'

const router = Router()

router.use(authenticate)

// Routes CRUD complètes
router.post('/', validate(taskValidation), createTask)
router.get('/', getTasks)
router.get('/:id', validate(idValidation), getTaskById)
router.put('/:id', validate([...idValidation, ...taskValidation]), updateTask)
router.patch('/:id/status', validate([...idValidation, ...taskStatusValidation]), updateTaskStatus)
router.patch('/:id/assign', validate([...idValidation, ...taskAssignmentValidation]), updateTaskAssignment) // NOUVEAU
router.delete('/:id', validate(idValidation), deleteTask)
router.post('/:id/comments', validate(idValidation), addComment)

export default router