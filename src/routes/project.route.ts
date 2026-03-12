import { Router } from 'express'
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember
} from '../controllers/project.controller.js'

import { validate, projectValidation, idValidation } from '../middlewares/validation.middleware.js'
import { authenticate } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(authenticate)

router.post('/', validate(projectValidation), createProject)
router.get('/', getAllProjects)
router.get('/:id', validate(idValidation), getProjectById)
router.put('/:id', validate([...idValidation, ...projectValidation]), updateProject)
router.delete('/:id', validate(idValidation), deleteProject)
router.post('/:id/members', validate(idValidation), addMember)

router.delete('/:id/members/:userId', validate(idValidation), removeMember)

export default router