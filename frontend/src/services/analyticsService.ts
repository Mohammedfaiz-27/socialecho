import { api } from './api'
import type { AnalyticsMetrics, Influencer, HashtagItem, KeywordPerformance, SpikeEvent, WordCloudItem, LanguageItem, HeatmapDay, GeoItem, CompetitorItem } from '@/types'

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

  async getTopHashtags(projectId: string, from: string, to: string): Promise<HashtagItem[]> {
    const { data } = await api.get<{ data: HashtagItem[] }>(
      `/projects/${projectId}/analytics/hashtags`,
      { params: { from, to } }
    )
    return data.data
  },

  async getKeywordPerformance(projectId: string, from: string, to: string): Promise<KeywordPerformance[]> {
    const { data } = await api.get<{ data: KeywordPerformance[] }>(
      `/projects/${projectId}/analytics/keywords`,
      { params: { from, to } }
    )
    return data.data
  },

  async getSpikes(projectId: string, from: string, to: string): Promise<SpikeEvent[]> {
    const { data } = await api.get<{ data: SpikeEvent[] }>(
      `/projects/${projectId}/analytics/spikes`,
      { params: { from, to } }
    )
    return data.data
  },

  async getWordCloud(projectId: string, from: string, to: string): Promise<WordCloudItem[]> {
    const { data } = await api.get<{ data: WordCloudItem[] }>(`/projects/${projectId}/analytics/wordcloud`, { params: { from, to } })
    return data.data
  },

  async getLanguageBreakdown(projectId: string, from: string, to: string): Promise<LanguageItem[]> {
    const { data } = await api.get<{ data: LanguageItem[] }>(`/projects/${projectId}/analytics/languages`, { params: { from, to } })
    return data.data
  },

  async getMentionHeatmap(projectId: string): Promise<HeatmapDay[]> {
    const { data } = await api.get<{ data: HeatmapDay[] }>(`/projects/${projectId}/analytics/heatmap`)
    return data.data
  },

  async getGeoBreakdown(projectId: string, from: string, to: string): Promise<GeoItem[]> {
    const { data } = await api.get<{ data: GeoItem[] }>(`/projects/${projectId}/analytics/geo`, { params: { from, to } })
    return data.data
  },

  async getCompetitors(projectId: string, names: string[], from: string, to: string): Promise<CompetitorItem[]> {
    const { data } = await api.get<{ data: CompetitorItem[] }>(`/projects/${projectId}/analytics/competitors`, { params: { from, to, names: names.join(',') } })
    return data.data
  },

  async generateAiSummary(projectId: string, from: string, to: string): Promise<string> {
    const { data } = await api.post<{ data: { summary: string } }>(
      `/projects/${projectId}/analytics/ai-summary`,
      {},
      { params: { from, to } }
    )
    return data.data.summary
  },

  async exportCSV(projectId: string, from: string, to: string): Promise<void> {
    const { data } = await api.get(`/projects/${projectId}/analytics/export`, {
      params: { from, to },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(new Blob([data as BlobPart], { type: 'text/csv' }))
    const a = document.createElement('a')
    const fromDate = from.split('T')[0]
    const toDate = to.split('T')[0]
    a.href = url
    a.download = `mentions-${fromDate}-to-${toDate}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}
