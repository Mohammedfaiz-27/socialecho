import { api } from './api'
import type { AnalyticsMetrics, Influencer } from '@/types'

export const analyticsService = {
  async getMetrics(projectId: string, from: string, to: string): Promise<AnalyticsMetrics> {
    const { data } = await api.get<{ data: AnalyticsMetrics }>(
      `/projects/${projectId}/analytics/metrics`,
      { params: { from, to } }
    )
    return data.data
  },

  async getSentimentTrend(projectId: string, from: string, to: string, granularity = 'day') {
    const { data } = await api.get(`/projects/${projectId}/analytics/sentiment`, {
      params: { from, to, granularity },
    })
    return data.data
  },

  async getTopInfluencers(projectId: string, limit = 10): Promise<Influencer[]> {
    const { data } = await api.get<{ data: Influencer[] }>(
      `/projects/${projectId}/analytics/influencers`,
      { params: { limit } }
    )
    return data.data
  },

  async getTopics(projectId: string, from: string, to: string) {
    const { data } = await api.get(`/projects/${projectId}/analytics/topics`, {
      params: { from, to },
    })
    return data.data
  },

  async getSourceBreakdown(projectId: string, from: string, to: string) {
    const { data } = await api.get(`/projects/${projectId}/analytics/sources`, {
      params: { from, to },
    })
    return data.data
  },
}
