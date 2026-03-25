import { api } from './api'
import type { Project, PaginatedResponse } from '@/types'

export const projectService = {
  async getProjects(page = 1, pageSize = 10): Promise<PaginatedResponse<Project>> {
    const { data } = await api.get<{ data: PaginatedResponse<Project> }>('/projects', {
      params: { page, pageSize },
    })
    return data.data
  },

  async getProject(id: string): Promise<Project> {
    const { data } = await api.get<{ data: Project }>(`/projects/${id}`)
    return data.data
  },

  async createProject(payload: { name: string; description?: string }): Promise<Project> {
    const { data } = await api.post<{ data: Project }>('/projects', payload)
    return data.data
  },

  async updateProject(id: string, payload: Partial<Project>): Promise<Project> {
    const { data } = await api.put<{ data: Project }>(`/projects/${id}`, payload)
    return data.data
  },

  async deleteProject(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },

  async addKeyword(
    projectId: string,
    keyword: { keyword: string; matchType: string; excludeKeywords?: string[] }
  ) {
    const { data } = await api.post(`/projects/${projectId}/keywords`, keyword)
    return data.data
  },

  async deleteKeyword(projectId: string, keywordId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/keywords/${keywordId}`)
  },

  async connectSocialPlatform(projectId: string, platform: string) {
    const { data } = await api.post(`/projects/${projectId}/connections/${platform}`)
    return data.data
  },

  async disconnectSocialPlatform(projectId: string, platform: string): Promise<void> {
    await api.delete(`/projects/${projectId}/connections/${platform}`)
  },

  async inviteTeamMember(
    projectId: string,
    payload: { email: string; role: string }
  ) {
    const { data } = await api.post(`/projects/${projectId}/members`, payload)
    return data.data
  },

  async removeTeamMember(projectId: string, memberId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${memberId}`)
  },
}
