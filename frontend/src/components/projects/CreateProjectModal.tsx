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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>()

  async function onSubmit(data: FormData) {
    setIsSubmitting(true)
    try {
      const result = await dispatch(createProject(data)).unwrap()
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
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Project Name *</label>
            <input
              {...register('name', {
                required: 'Project name is required',
                minLength: { value: 1, message: 'Name is too short' },
                maxLength: { value: 100, message: 'Name cannot exceed 100 characters' },
              })}
              className="input"
              placeholder="e.g. Brand Monitoring Q1 2025"
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
              rows={3}
              placeholder="What are you monitoring in this project?"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1"
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
