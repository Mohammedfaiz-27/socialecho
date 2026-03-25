import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { MentionsState, Mention, MentionFilters } from '@/types'
import { mentionService } from '@/services/mentionService'

const initialState: MentionsState = {
  mentions: [],
  currentMention: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  totalPages: 0,
  page: 1,
  pageSize: 25,
}

export const fetchMentions = createAsyncThunk(
  'mentions/fetchAll',
  async (
    {
      projectId,
      filters,
      page,
      pageSize,
    }: { projectId: string; filters: MentionFilters; page: number; pageSize: number },
    { rejectWithValue }
  ) => {
    try {
      return await mentionService.getMentions(projectId, filters, page, pageSize)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch mentions')
    }
  }
)

export const fetchMention = createAsyncThunk(
  'mentions/fetchOne',
  async ({ projectId, mentionId }: { projectId: string; mentionId: string }, { rejectWithValue }) => {
    try {
      return await mentionService.getMention(projectId, mentionId)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch mention')
    }
  }
)

export const updateMentionTags = createAsyncThunk(
  'mentions/updateTags',
  async (
    { projectId, mentionId, tags }: { projectId: string; mentionId: string; tags: string[] },
    { rejectWithValue }
  ) => {
    try {
      return await mentionService.updateMention(projectId, mentionId, { tags })
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to update tags')
    }
  }
)

export const toggleStarMention = createAsyncThunk(
  'mentions/toggleStar',
  async (
    { projectId, mentionId, isStarred }: { projectId: string; mentionId: string; isStarred: boolean },
    { rejectWithValue }
  ) => {
    try {
      return await mentionService.updateMention(projectId, mentionId, { isStarred })
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to star mention')
    }
  }
)

const mentionSlice = createSlice({
  name: 'mentions',
  initialState,
  reducers: {
    setCurrentMention(state, action) {
      state.currentMention = action.payload
    },
    clearCurrentMention(state) {
      state.currentMention = null
    },
    prependMention(state, action: { payload: Mention }) {
      state.mentions.unshift(action.payload)
      state.totalCount += 1
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentions.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMentions.fulfilled, (state, action) => {
        state.isLoading = false
        state.mentions = action.payload.data
        state.totalCount = action.payload.total
        state.totalPages = action.payload.totalPages
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
      })
      .addCase(fetchMentions.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchMention.fulfilled, (state, action) => {
        state.currentMention = action.payload
      })
      .addCase(updateMentionTags.fulfilled, (state, action) => {
        const idx = state.mentions.findIndex((m) => m.id === action.payload.id)
        if (idx !== -1) state.mentions[idx] = action.payload
        if (state.currentMention?.id === action.payload.id) state.currentMention = action.payload
      })
      .addCase(toggleStarMention.fulfilled, (state, action) => {
        const idx = state.mentions.findIndex((m) => m.id === action.payload.id)
        if (idx !== -1) state.mentions[idx] = action.payload
        if (state.currentMention?.id === action.payload.id) state.currentMention = action.payload
      })
  },
})

export const { setCurrentMention, clearCurrentMention, prependMention, clearError } =
  mentionSlice.actions
export default mentionSlice.reducer
