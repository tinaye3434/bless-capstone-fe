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

const asText = (value: unknown): string => (typeof value === 'string' ? value : '')

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

  const firstName = asText(user.first_name).trim()
  const lastName = asText(user.last_name).trim()
  const username = asText(user.username).trim()
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || username || 'User'
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
  const role = auth?.user?.role
  if (typeof role !== 'string') {
    return null
  }
  return role
}

export const isSuperUser = (): boolean => getRole() === 'SUPERUSER'
export const isManagement = (): boolean => getRole() === 'MANAGEMENT'
export const isAdmin = (): boolean => {
  const role = getRole()
  return role === 'ADMIN' || role === 'SUPERUSER'
}
export const hasManagementAccess = (): boolean => {
  const role = getRole()
  return role === 'MANAGEMENT' || role === 'ADMIN' || role === 'SUPERUSER'
}
