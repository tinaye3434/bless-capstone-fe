export type AuthUser = {
  id: number | string
  username: string
  email?: string
  first_name?: string
  last_name?: string
  role?: string
}

type AuthPayload = {
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

export const getRole = (): string | null => {
  const auth = getAuth()
  return auth?.user?.role ?? null
}

export const isAdmin = (): boolean => getRole() === 'ADMIN'
export const isApprover = (): boolean => getRole() === 'APPROVER'
