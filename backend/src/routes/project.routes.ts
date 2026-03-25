import { Router } from 'express'
import Joi from 'joi'
import { projectService } from '../services/project.service'
import { authenticate } from '../middleware/auth'
import { validate } from '../middleware/validate'
import { success, paginated } from '../utils/response'
import type { AuthRequest } from '../types'

const router = Router()

router.use(authenticate)

const createSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(1000).allow('').optional(),
})

const updateSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(1000).allow('').optional(),
})

const keywordSchema = Joi.object({
  keyword: Joi.string().min(1).max(100).required(),
  matchType: Joi.string().valid('exact', 'phrase', 'broad').required(),
  excludeKeywords: Joi.array().items(Joi.string()).optional(),
})

// List projects
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(String(req.query.page ?? 1))
    const pageSize = parseInt(String(req.query.pageSize ?? 10))
    const result = await projectService.getProjects(req.user!.userId, page, pageSize)
    paginated(res, result.data, result.total, result.page, result.pageSize)
  } catch (err) { next(err) }
})

// Create project
router.post('/', validate(createSchema), async (req: AuthRequest, res, next) => {
  try {
    const project = await projectService.createProject(
      req.user!.userId,
      req.body.name,
      req.body.description
    )
    success(res, project, 201)
  } catch (err) { next(err) }
})

// Get project
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const project = await projectService.getProject(req.params.id, req.user!.userId)
    success(res, project)
  } catch (err) { next(err) }
})

// Update project
router.put('/:id', validate(updateSchema), async (req: AuthRequest, res, next) => {
  try {
    const project = await projectService.updateProject(req.params.id, req.user!.userId, req.body)
    success(res, project)
  } catch (err) { next(err) }
})

// Delete project
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    await projectService.deleteProject(req.params.id, req.user!.userId)
    success(res, { message: 'Project deleted successfully' })
  } catch (err) { next(err) }
})

// Add keyword
router.post('/:id/keywords', validate(keywordSchema), async (req: AuthRequest, res, next) => {
  try {
    const project = await projectService.addKeyword(
      req.params.id,
      req.user!.userId,
      req.body.keyword,
      req.body.matchType,
      req.body.excludeKeywords
    )
    success(res, project, 201)
  } catch (err) { next(err) }
})

// Delete keyword
router.delete('/:id/keywords/:keywordId', async (req: AuthRequest, res, next) => {
  try {
    const project = await projectService.deleteKeyword(
      req.params.id,
      req.user!.userId,
      req.params.keywordId
    )
    success(res, project)
  } catch (err) { next(err) }
})

export default router
