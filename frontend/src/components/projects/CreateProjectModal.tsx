import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { createProject } from '@/store/slices/projectSlice'
import { useNavigate } from 'react-router-dom'

interface Props {
  onClose: () => void
}

interface FormData {
  name: string
  description?: string
}

export default function CreateProjectModal({ onClose }: Props) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [projectType, setProjectType] = useState<'own' | 'competitor'>('own')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    try {
      const result = await dispatch(createProject({ ...data, projectType })).unwrap()
      onClose()
      navigate(`/projects/${result.id}`)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">New Project</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-5">
          {/* Type picker */}
          <div>
            <label className="label mb-2">Project Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Own */}
              <button
                type="button"
                onClick={() => setProjectType('own')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                  projectType === 'own'
                    ? 'border-brand-600 bg-brand-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  projectType === 'own' ? 'bg-brand-100' : 'bg-slate-100'
                }`}>
                  <svg className={`w-5 h-5 ${projectType === 'own' ? 'text-brand-600' : 'text-slate-400'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-semibold text-center ${projectType === 'own' ? 'text-brand-700' : 'text-slate-700'}`}>
                    Own Brand
                  </p>
                  <p className="text-xs text-slate-400 text-center mt-0.5">Monitor your brand</p>
                </div>
                {projectType === 'own' && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Competitor */}
              <button
                type="button"
                onClick={() => setProjectType('competitor')}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${
                  projectType === 'competitor'
                    ? 'border-rose-500 bg-rose-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  projectType === 'competitor' ? 'bg-rose-100' : 'bg-slate-100'
                }`}>
                  <svg className={`w-5 h-5 ${projectType === 'competitor' ? 'text-rose-600' : 'text-slate-400'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-semibold text-center ${projectType === 'competitor' ? 'text-rose-700' : 'text-slate-700'}`}>
                    Competitor
                  </p>
                  <p className="text-xs text-slate-400 text-center mt-0.5">Track a competitor</p>
                </div>
                {projectType === 'competitor' && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Project Name *</label>
            <input
              {...register('name', {
                required: 'Project name is required',
                minLength: { value: 1, message: 'Name is too short' },
                maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
              })}
              className="input"
              placeholder={projectType === 'competitor' ? 'e.g. Nike, Apple, Samsung…' : 'e.g. My Brand Q1 2025'}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea
              {...register('description', {
                maxLength: { value: 1000, message: 'Description cannot exceed 1000 characters' },
              })}
              className="input resize-none"
              rows={2}
              placeholder="What are you monitoring in this project?"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                projectType === 'competitor'
                  ? 'bg-rose-500 hover:bg-rose-600'
                  : 'bg-brand-600 hover:bg-brand-700'
              }`}
            >
              {isSubmitting ? 'Creating…' : 'Create Project'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
