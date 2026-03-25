import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { updateProject, addKeyword, removeKeyword } from '@/store/slices/projectSlice'
import { useForm } from 'react-hook-form'
import { api } from '@/services/api'

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const dispatch = useAppDispatch()
  const project = useAppSelector((s) => s.projects.currentProject)

  useEffect(() => {
    if (projectId && !project) {
      import('@/store/slices/projectSlice').then(({ fetchProject }) => {
        dispatch(fetchProject(projectId))
      })
    }
  }, [projectId, project, dispatch])
  const [activeTab, setActiveTab] = useState<'general' | 'keywords' | 'team' | 'connections' | 'notifications'>('general')
  const [saved, setSaved] = useState(false)
  const [showAddKeyword, setShowAddKeyword] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [matchType, setMatchType] = useState<'exact' | 'phrase' | 'broad'>('broad')
  const [keywordSaving, setKeywordSaving] = useState(false)
  const [keywordError, setKeywordError] = useState('')
  const [collecting, setCollecting] = useState(false)
  const [collectMsg, setCollectMsg] = useState('')

  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: project?.name ?? '',
      description: project?.description ?? '',
    },
  })

  function onSave(data: { name: string; description?: string }) {
    if (!projectId) return
    dispatch(updateProject({ id: projectId, data }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function onAddKeyword() {
    if (!projectId || !newKeyword.trim()) return
    setKeywordSaving(true)
    setKeywordError('')
    try {
      await dispatch(addKeyword({ projectId, keyword: newKeyword.trim(), matchType })).unwrap()
      setNewKeyword('')
      setShowAddKeyword(false)
    } catch (err) {
      setKeywordError(err instanceof Error ? err.message : 'Failed to add keyword')
    } finally {
      setKeywordSaving(false)
    }
  }

  async function onRemoveKeyword(keywordId: string) {
    if (!projectId) return
    await dispatch(removeKeyword({ projectId, keywordId }))
  }

  async function onTriggerCollection() {
    if (!projectId) return
    setCollecting(true)
    setCollectMsg('')
    try {
      await api.post(`/collection/trigger/${projectId}`)
      setCollectMsg('Collection started! Data will appear in a few minutes.')
    } catch (err) {
      setCollectMsg(err instanceof Error ? err.message : 'Failed to trigger collection')
    } finally {
      setCollecting(false)
      setTimeout(() => setCollectMsg(''), 5000)
    }
  }

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'keywords', label: 'Keywords' },
    { key: 'connections', label: 'Connections' },
    { key: 'team', label: 'Team' },
    { key: 'notifications', label: 'Notifications' },
  ] as const

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-900">Project Settings</h1>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* General tab */}
      {activeTab === 'general' && (
        <div className="card p-6 max-w-lg">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Basic Information</h2>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div>
              <label className="label">Project Name *</label>
              <input {...register('name', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                {...register('description')}
                className="input resize-none"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary">
                Save Changes
              </button>
              {saved && (
                <span className="text-sm text-green-600 font-medium">✓ Saved</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Keywords tab */}
      {activeTab === 'keywords' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Keywords</h2>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary text-sm"
                onClick={onTriggerCollection}
                disabled={collecting || !project?.keywords.length}
                title="Manually trigger data collection now"
              >
                {collecting ? 'Collecting...' : '⚡ Collect Now'}
              </button>
              <button className="btn-primary text-sm" onClick={() => setShowAddKeyword(true)}>
                + Add Keyword
              </button>
            </div>
          </div>
          {collectMsg && (
            <p className={`text-xs mb-3 ${collectMsg.includes('started') ? 'text-green-600' : 'text-red-500'}`}>
              {collectMsg}
            </p>
          )}

          {/* Add keyword form */}
          {showAddKeyword && (
            <div className="mb-5 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-3">New Keyword</p>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  className="input flex-1 min-w-[180px]"
                  placeholder="e.g. Tesla, iPhone, your brand..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onAddKeyword()}
                  autoFocus
                />
                <select
                  className="input w-auto"
                  value={matchType}
                  onChange={(e) => setMatchType(e.target.value as 'exact' | 'phrase' | 'broad')}
                >
                  <option value="broad">Broad</option>
                  <option value="phrase">Phrase</option>
                  <option value="exact">Exact</option>
                </select>
                <button
                  className="btn-primary text-sm"
                  onClick={onAddKeyword}
                  disabled={keywordSaving || !newKeyword.trim()}
                >
                  {keywordSaving ? 'Adding...' : 'Add'}
                </button>
                <button
                  className="btn-secondary text-sm"
                  onClick={() => { setShowAddKeyword(false); setNewKeyword(''); setKeywordError('') }}
                >
                  Cancel
                </button>
              </div>
              {keywordError && (
                <p className="text-xs text-red-500 mt-2">{keywordError}</p>
              )}
            </div>
          )}

          {project?.keywords.length === 0 ? (
            <p className="text-sm text-slate-400">No keywords configured yet. Add one above to start collecting mentions.</p>
          ) : (
            <div className="space-y-2">
              {project?.keywords.map((kw) => (
                <div
                  key={kw.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-slate-800">{kw.keyword}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full capitalize">
                      {kw.matchType}
                    </span>
                    {!kw.isActive && (
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{kw.mentionCount.toLocaleString()} mentions</span>
                    <button
                      className="text-slate-400 hover:text-red-600 p-1"
                      onClick={() => onRemoveKeyword(kw.id)}
                      title="Remove keyword"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Connections tab */}
      {activeTab === 'connections' && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Social Media Connections</h2>
          <div className="space-y-3">
            {project?.socialConnections.map((conn) => (
              <div
                key={conn.platform}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="capitalize font-medium text-slate-800">{conn.platform}</span>
                  {conn.accountName && (
                    <span className="text-xs text-slate-400">@{conn.accountName}</span>
                  )}
                </div>
                {conn.isConnected ? (
                  <button className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                    Disconnect
                  </button>
                ) : (
                  <button className="text-xs px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
                    Connect
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team tab */}
      {activeTab === 'team' && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Team Members</h2>
            <button className="btn-primary text-sm">Invite Member</button>
          </div>
          <div className="space-y-3">
            {project?.teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold">
                    {member.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{member.name}</p>
                    <p className="text-xs text-slate-400">{member.email}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full capitalize">
                  {member.role.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications tab */}
      {activeTab === 'notifications' && (
        <div className="card p-6 max-w-lg">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Alert Settings</h2>
          <div className="space-y-4">
            {[
              { label: 'New mention alerts', desc: 'Notify when new mentions arrive' },
              { label: 'Negative sentiment spike', desc: 'Alert when negative mentions exceed 30%' },
              { label: 'Viral mention', desc: 'Alert when a mention goes viral' },
              { label: 'Weekly digest', desc: 'Receive weekly summary via email' },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <input type="checkbox" className="w-4 h-4 accent-brand-600 mt-0.5" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
