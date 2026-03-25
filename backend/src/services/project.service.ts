import { Op } from 'sequelize'
import { Project } from '../models/postgres/Project'
import { TeamMember } from '../models/postgres/TeamMember'
import { User } from '../models/postgres/User'
import { Mention } from '../models/mongo/Mention'
import { cache } from '../config/redis'
import { v4 as uuidv4 } from 'uuid'

export const projectService = {
  async getProjects(userId: string, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize
    const { rows, count } = await Project.findAndCountAll({
      where: { userId },
      limit: pageSize,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{ model: TeamMember, as: 'teamMembers', include: [User] }],
    })
    return { data: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) }
  },

  async getProject(projectId: string, userId: string) {
    const project = await Project.findOne({
      where: { id: projectId, userId },
      include: [{ model: TeamMember, as: 'teamMembers', include: [User] }],
    })
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'NOT_FOUND' })
    return project
  },

  async createProject(userId: string, name: string, description?: string) {
    const existing = await Project.findOne({ where: { userId, name } })
    if (existing)
      throw Object.assign(new Error('This project name already exists. Please choose a different name.'), {
        status: 409,
        code: 'DUPLICATE_NAME',
      })

    const project = await Project.create({
      id: uuidv4(),
      userId,
      name,
      description,
      keywords: [],
      socialConnections: {},
      settings: {},
    })

    // Auto-add creator as admin team member
    await TeamMember.create({ id: uuidv4(), projectId: project.id, userId, role: 'admin' })

    await cache.del(`projects:${userId}`)
    return project
  },

  async updateProject(projectId: string, userId: string, data: Partial<{ name: string; description: string }>) {
    const project = await Project.findOne({ where: { id: projectId, userId } })
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'NOT_FOUND' })

    if (data.name && data.name !== project.name) {
      const dup = await Project.findOne({ where: { userId, name: data.name, id: { [Op.ne]: projectId } } })
      if (dup) throw Object.assign(new Error('Project name already in use'), { status: 409, code: 'DUPLICATE_NAME' })
    }

    await project.update(data)
    await cache.del(`project:${projectId}`)
    return project
  },

  async deleteProject(projectId: string, userId: string) {
    const project = await Project.findOne({ where: { id: projectId, userId } })
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'NOT_FOUND' })

    await project.destroy()
    // Delete all associated MongoDB mentions
    await Mention.deleteMany({ projectId })
    await cache.del(`project:${projectId}`)
  },

  async addKeyword(
    projectId: string,
    userId: string,
    keyword: string,
    matchType: string,
    excludeKeywords: string[] = []
  ) {
    const project = await Project.findOne({ where: { id: projectId, userId } })
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'NOT_FOUND' })

    const keywords = [...((project.keywords as object[]) ?? [])]
    keywords.push({ id: uuidv4(), keyword, matchType, excludeKeywords, isActive: true, mentionCount: 0, createdAt: new Date() })
    project.set('keywords', keywords)
    await project.save()
    return project
  },

  async deleteKeyword(projectId: string, userId: string, keywordId: string) {
    const project = await Project.findOne({ where: { id: projectId, userId } })
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'NOT_FOUND' })

    const keywords = (project.keywords as Array<{ id: string }>).filter((k) => k.id !== keywordId)
    await project.update({ keywords })
    return project
  },
}
