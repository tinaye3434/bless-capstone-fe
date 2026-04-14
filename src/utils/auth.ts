export type AuthUser = {
  id: number | string
  username: string
  email?: string
  first_name?: string
  last_name?: string
  role?: string
}

export type AuthPayload = {
  token: string
  user: AuthUser
}

const STORAGE_KEY = 'tns_auth'

export const getAuth = (): AuthPayload | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return null
    }
    return JSON.parse(stored) as AuthPayload
  } catch {
    return null
  }
}

export const setAuth = (payload: AuthPayload) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export const updateStoredUser = (updates: Partial<AuthUser>) => {
  const auth = getAuth()
  if (!auth) {
    return
  }

  setAuth({
    ...auth,
    user: {
      ...auth.user,
      ...updates,
    },
  })
}

export const clearAuth = () => {
  localStorage.removeItem(STORAGE_KEY)
}

export const getToken = (): string | null => {
  const auth = getAuth()
  return auth?.token ?? null
}

export const getUser = (): AuthUser | null => {
  const auth = getAuth()
  return auth?.user ?? null
}

export const getDisplayName = (user?: AuthUser | null): string => {
  if (!user) {
    return 'User'
  }

  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
  return fullName || user.username || 'User'
}

export const getInitials = (user?: AuthUser | null): string => {
  const name = getDisplayName(user).trim()
  if (!name) {
    return 'U'
  }

  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export const getRole = (): string | null => {
  const auth = getAuth()
  return auth?.user?.role ?? null
}

export const isSuperUser = (): boolean => getRole() === 'SUPERUSER'
export const isAdmin = (): boolean => {
  const role = getRole()
  return role === 'ADMIN' || role === 'SUPERUSER'
}
export const isApprover = (): boolean => {
  const role = getRole()
  return role === 'APPROVER' || role === 'ADMIN' || role === 'SUPERUSER'
}
