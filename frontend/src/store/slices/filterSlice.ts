import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { FiltersState, MentionFilters, SavedFilter } from '@/types'
import { mentionService } from '@/services/mentionService'

const defaultFilters: MentionFilters = {
  search: '',
  dateRange: { preset: 'last_30d' },
  sentiments: [],
  sources: [],
  languages: [],
  keywords: [],
  tags: [],
  sortBy: 'relevance',
}

const initialState: FiltersState = {
  active: defaultFilters,
  saved: [],
  isFilterPanelOpen: true,
}

export const fetchSavedFilters = createAsyncThunk(
  'filters/fetchSaved',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await mentionService.getSavedFilters(projectId)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch saved filters')
    }
  }
)

export const saveFilter = createAsyncThunk(
  'filters/save',
  async (
    { projectId, name, filters }: { projectId: string; name: string; filters: MentionFilters },
    { rejectWithValue }
  ) => {
    try {
      return await mentionService.saveFilter(projectId, name, filters)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to save filter')
    }
  }
)

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setFilter<K extends keyof MentionFilters>(
      state: FiltersState,
      action: { payload: { key: K; value: MentionFilters[K] } }
    ) {
      state.active[action.payload.key] = action.payload.value
    },
    setFilters(state, action: { payload: Partial<MentionFilters> }) {
      state.active = { ...state.active, ...action.payload }
    },
    resetFilters(state) {
      state.active = defaultFilters
    },
    applySavedFilter(state, action: { payload: SavedFilter }) {
      state.active = action.payload.filters
    },
    toggleFilterPanel(state) {
      state.isFilterPanelOpen = !state.isFilterPanelOpen
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavedFilters.fulfilled, (state, action) => {
        state.saved = action.payload
      })
      .addCase(saveFilter.fulfilled, (state, action) => {
        state.saved.push(action.payload)
      })
  },
})

export const { setFilter, setFilters, resetFilters, applySavedFilter, toggleFilterPanel } =
  filterSlice.actions
export default filterSlice.reducer
