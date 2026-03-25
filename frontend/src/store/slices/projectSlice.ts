import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import type { ProjectsState, Project } from '@/types'
import { projectService } from '@/services/projectService'

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  page: 1,
  pageSize: 10,
}

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async ({ page, pageSize }: { page: number; pageSize: number }, { rejectWithValue }) => {
    try {
      return await projectService.getProjects(page, pageSize)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch projects')
    }
  }
)

export const fetchProject = createAsyncThunk(
  'projects/fetchOne',
  async (id: string, { rejectWithValue }) => {
    try {
      return await projectService.getProject(id)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch project')
    }
  }
)

export const createProject = createAsyncThunk(
  'projects/create',
  async (data: { name: string; description?: string }, { rejectWithValue }) => {
    try {
      return await projectService.createProject(data)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to create project')
    }
  }
)

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, data }: { id: string; data: Partial<Project> }, { rejectWithValue }) => {
    try {
      return await projectService.updateProject(id, data)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to update project')
    }
  }
)

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await projectService.deleteProject(id)
      return id
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }
)

export const addKeyword = createAsyncThunk(
  'projects/addKeyword',
  async (
    { projectId, keyword, matchType }: { projectId: string; keyword: string; matchType: string },
    { rejectWithValue }
  ) => {
    try {
      return await projectService.addKeyword(projectId, { keyword, matchType })
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to add keyword')
    }
  }
)

export const removeKeyword = createAsyncThunk(
  'projects/removeKeyword',
  async ({ projectId, keywordId }: { projectId: string; keywordId: string }, { rejectWithValue }) => {
    try {
      await projectService.deleteKeyword(projectId, keywordId)
      return await projectService.getProject(projectId)
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to remove keyword')
    }
  }
)

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCurrentProject(state, action) {
      state.currentProject = action.payload
    },
    clearCurrentProject(state) {
      state.currentProject = null
    },
    clearError(state) {
      state.error = null
    },
    incrementNewMentions(state, action: { payload: { projectId: string; count: number } }) {
      const project = state.projects.find((p) => p.id === action.payload.projectId)
      if (project) project.newMentionsCount += action.payload.count
      if (state.currentProject?.id === action.payload.projectId) {
        state.currentProject.newMentionsCount += action.payload.count
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false
        state.projects = action.payload.data
        state.totalCount = action.payload.total
        state.page = action.payload.page
        state.pageSize = action.payload.pageSize
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(fetchProject.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.isLoading = false
        state.currentProject = action.payload
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload)
        state.totalCount += 1
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const idx = state.projects.findIndex((p) => p.id === action.payload.id)
        if (idx !== -1) state.projects[idx] = action.payload
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload
        }
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p.id !== action.payload)
        state.totalCount -= 1
        if (state.currentProject?.id === action.payload) state.currentProject = null
      })
      .addCase(addKeyword.fulfilled, (state, action) => {
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload
        }
        const idx = state.projects.findIndex((p) => p.id === action.payload.id)
        if (idx !== -1) state.projects[idx] = action.payload
      })
      .addCase(removeKeyword.fulfilled, (state, action) => {
        if (state.currentProject?.id === action.payload.id) {
          state.currentProject = action.payload
        }
        const idx = state.projects.findIndex((p) => p.id === action.payload.id)
        if (idx !== -1) state.projects[idx] = action.payload
      })
  },
})

export const { setCurrentProject, clearCurrentProject, clearError, incrementNewMentions } =
  projectSlice.actions
export default projectSlice.reducer
