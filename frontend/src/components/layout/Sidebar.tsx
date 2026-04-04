import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAuth } from '@/hooks/useAuth'
import clsx from 'clsx'

interface NavItem {
  label: string
  icon: React.ReactNode
  to: (pid: string) => string
  badge?: string
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
      </svg>
    ),
    to: (pid: string) => `/projects/${pid}`,
  },
  {
    label: 'Mentions',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    to: (pid: string) => `/projects/${pid}/mentions`,
  },
  {
    label: 'Analytics',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    to: (pid: string) => `/projects/${pid}/analytics`,
  },
  {
    label: 'Influencers',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    to: (pid: string) => `/projects/${pid}/influencers`,
  },
  {
    label: 'Reports',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    to: (pid: string) => `/projects/${pid}/reports`,
  },
  {
    label: 'AI Summary',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    to: (pid: string) => `/projects/${pid}/ai-summary`,
    badge: 'AI',
  },
]

export default function Sidebar() {
  const { projectId } = useParams<{ projectId: string }>()
  const currentProject = useAppSelector((s) => s.projects.currentProject)
  const allProjects = useAppSelector((s) => s.projects.projects)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <aside className="w-[220px] shrink-0 flex flex-col h-screen sticky top-0 bg-[#1a2236]">
      {/* Logo */}
      <div className="px-5 h-14 flex items-center border-b border-[#253047]">
        <NavLink to="/projects" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-bold text-sm tracking-tight">SocialEcho</span>
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* All Projects */}
        <NavLink
          to="/projects"
          end
          className={({ isActive }) =>
            clsx(
              'sidebar-item',
              isActive ? 'sidebar-item-active' : 'sidebar-item-default'
            )
          }
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M3 7a2 2 0 012-2h4a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm10-2h4a2 2 0 012 2v10a2 2 0 01-2 2h-4a2 2 0 01-2-2V7a2 2 0 012-2z" />
          </svg>
          All Projects
        </NavLink>

        {/* Project list */}
        {!projectId && allProjects.length > 0 && (
          <>
            <p className="pt-4 pb-1 px-3 text-[10px] font-semibold text-[#64748b] uppercase tracking-widest">
              Projects
            </p>
            {allProjects.map((project) => (
              <NavLink
                key={project.id}
                to={`/projects/${project.id}`}
                end
                className={({ isActive }) =>
                  clsx(
                    'sidebar-item',
                    isActive ? 'sidebar-item-active' : 'sidebar-item-default'
                  )
                }
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                <span className="truncate">{project.name}</span>
              </NavLink>
            ))}
          </>
        )}

        {/* Current project sub-nav */}
        {projectId && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-widest truncate">
                {currentProject?.name ?? 'Project'}
              </p>
            </div>
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to(projectId)}
                end={item.label === 'Dashboard'}
                className={({ isActive }) =>
                  clsx(
                    'sidebar-item',
                    isActive ? 'sidebar-item-active' : 'sidebar-item-default'
                  )
                }
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500 text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#253047] px-3 py-3 space-y-0.5">
        {/* Settings */}
        {projectId && (
          <button
            onClick={() => navigate(`/projects/${projectId}/settings`)}
            className="sidebar-item sidebar-item-default w-full"
          >
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
        )}

        {/* User */}
        <div className="flex items-center gap-2 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <span className="text-sm font-medium text-slate-300 truncate flex-1 leading-none">
            {user?.name}
          </span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            title="Sign Out"
            className="p-1 text-[#64748b] hover:text-red-400 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
