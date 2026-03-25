import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { AnalyticsMetrics } from '@/types'
import { analyticsService } from '@/services/analyticsService'

interface AnalyticsState {
  metrics: AnalyticsMetrics | null
  isLoading: boolean
  error: string | null
}

const initialState: AnalyticsState = {
  metrics: null,
  isLoading: false,
  error: null,
}

export const fetchAnalytics = createAsyncThunk(
  'analytics/fetch',
  async (
    { projectId, from, to }: { projectId: string; from: string; to: string },
    { rejectWithValue }
  ) => {
    try {
      return await analyticsService.getMetrics(projectId, from, to)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch analytics')
    }
  }
)

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.isLoading = false
        state.metrics = action.payload
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = analyticsSlice.actions
export default analyticsSlice.reducer
