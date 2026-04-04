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

    // Compute today's new mentions from MongoDB for all projects in one query
    const projectIds = rows.map((p) => p.id)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const newCounts = await Mention.aggregate([
      {
        $match: {
          projectId: { $in: projectIds },
          'temporal.collectedAt': { $gte: todayStart },
        },
      },
      { $group: { _id: '$projectId', count: { $sum: 1 } } },
    ]) as Array<{ _id: string; count: number }>
    const newCountMap = new Map(newCounts.map((r) => [r._id, r.count]))

    const data = rows.map((p) => {
      const plain = p.get({ plain: true }) as Record<string, unknown>
      const total = plain.totalMentionsCount as number ?? 0
      return {
        ...plain,
        newMentionsCount: newCountMap.get(p.id) ?? 0,
        presenceScore: computePresenceScore(total),
      }
    })

    return { data, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) }
  },

  async getProject(projectId: string, userId: string) {
    const project = await Project.findOne({
      where: { id: projectId, userId },
      include: [{ model: TeamMember, as: 'teamMembers', include: [User] }],
    })
    if (!project) throw Object.assign(new Error('Project not found'), { status: 404, code: 'NOT_FOUND' })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const newCount = await Mention.countDocuments({ projectId, 'temporal.collectedAt': { $gte: todayStart } })
    const plain = project.get({ plain: true }) as Record<string, unknown>
    const total = plain.totalMentionsCount as number ?? 0
    return {
      ...plain,
      newMentionsCount: newCount,
      presenceScore: computePresenceScore(total),
    }
  },

  async createProject(userId: string, name: string, description?: string, projectType: 'own' | 'competitor' = 'own') {
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
      settings: { projectType },
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

// Logarithmic presence score: 0 mentions=0, ~100 mentions=25, ~1000 mentions=50, ~10000 mentions=75, ~100000=100
function computePresenceScore(totalMentions: number): number {
  if (totalMentions <= 0) return 0
  return Math.min(100, Math.round(Math.log10(totalMentions + 1) * 25))
}
