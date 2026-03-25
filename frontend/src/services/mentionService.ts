import { api } from './api'
import type { Mention, MentionFilters, PaginatedResponse, SavedFilter } from '@/types'

function buildParams(filters: MentionFilters, page: number, pageSize: number) {
  const params: Record<string, unknown> = { page, pageSize }
  if (filters.search) params.search = filters.search
  if (filters.sentiments.length) params.sentiments = filters.sentiments.join(',')
  if (filters.sources.length) params.sources = filters.sources.join(',')
  if (filters.languages.length) params.languages = filters.languages.join(',')
  if (filters.keywords.length) params.keywords = filters.keywords.join(',')
  if (filters.tags.length) params.tags = filters.tags.join(',')
  if (filters.minFollowers) params.minFollowers = filters.minFollowers
  if (filters.minEngagement) params.minEngagement = filters.minEngagement
  params.sortBy = filters.sortBy
  if (filters.dateRange.preset !== 'custom') {
    params.datePreset = filters.dateRange.preset
  } else {
    if (filters.dateRange.from) params.from = filters.dateRange.from
    if (filters.dateRange.to) params.to = filters.dateRange.to
  }
  return params
}

export const mentionService = {
  async getMentions(
    projectId: string,
    filters: MentionFilters,
    page: number,
    pageSize: number
  ): Promise<PaginatedResponse<Mention>> {
    const { data } = await api.get<{ data: PaginatedResponse<Mention> }>(
      `/projects/${projectId}/mentions`,
      { params: buildParams(filters, page, pageSize) }
    )
    return data.data
  },

  async getMention(projectId: string, mentionId: string): Promise<Mention> {
    const { data } = await api.get<{ data: Mention }>(
      `/projects/${projectId}/mentions/${mentionId}`
    )
    return data.data
  },

  async updateMention(
    projectId: string,
    mentionId: string,
    payload: Partial<Pick<Mention, 'tags' | 'notes' | 'status' | 'isStarred'>>
  ): Promise<Mention> {
    const { data } = await api.put<{ data: Mention }>(
      `/projects/${projectId}/mentions/${mentionId}`,
      payload
    )
    return data.data
  },

  async getMentionStats(projectId: string) {
    const { data } = await api.get(`/projects/${projectId}/mentions/stats`)
    return data.data
  },

  async getSavedFilters(projectId: string): Promise<SavedFilter[]> {
    const { data } = await api.get<{ data: SavedFilter[] }>(
      `/projects/${projectId}/saved-filters`
    )
    return data.data
  },

  async saveFilter(
    projectId: string,
    name: string,
    filters: MentionFilters
  ): Promise<SavedFilter> {
    const { data } = await api.post<{ data: SavedFilter }>(
      `/projects/${projectId}/saved-filters`,
      { name, filters }
    )
    return data.data
  },
}
