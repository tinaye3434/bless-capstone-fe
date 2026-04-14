export type ClaimApi = {
  id: number
  employee?: string
  employee_id?: number | string
  purpose?: string
  origin?: string
  destination?: string
  days?: number
  nights?: number
  total_allowances?: number
  total?: number
  approval_status?: string
  documents_submitted?: boolean
  stage_id?: number
}

export type Employee = {
  id: number | string
  first_name?: string
  surname?: string
  name?: string
  full_name?: string
}

export type ApprovalStage = {
  id: number
  order?: number
}

export type LocationPoint = {
  id?: number | string
  name: string
  longitude: number
  latitude: number
}

export type ClaimRow = {
  id: number
  employee: string
  purpose: string
  origin: string
  destination: string
  days: number
  nights: number
  total_allowances: number
  status: string
  documents_submitted: boolean
}

export const CLAIMS_ENDPOINT = '/api/claims/'
export const EMPLOYEES_ENDPOINT = '/api/employee/'
export const APPROVAL_STAGES_ENDPOINT = '/api/approval-stages/'
export const LOCATIONS_ENDPOINT = '/api/locations/'

export const normalizeEmployeesResponse = (payload: unknown): Employee[] => {
  if (Array.isArray(payload)) {
    return payload as Employee[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as Employee[]
    }

    if (Array.isArray(record.results)) {
      return record.results as Employee[]
    }

    if (Array.isArray(record.employees)) {
      return record.employees as Employee[]
    }
  }

  return []
}

export const normalizeClaimsResponse = (payload: unknown): ClaimApi[] => {
  if (Array.isArray(payload)) {
    return payload as ClaimApi[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as ClaimApi[]
    }

    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>
      if (Array.isArray(nested.results)) {
        return nested.results as ClaimApi[]
      }
      if (Array.isArray(nested.data)) {
        return nested.data as ClaimApi[]
      }
      if (Array.isArray(nested.claims)) {
        return nested.claims as ClaimApi[]
      }
    }

    if (Array.isArray(record.results)) {
      return record.results as ClaimApi[]
    }

    if (Array.isArray(record.claims)) {
      return record.claims as ClaimApi[]
    }
  }

  return []
}

export const normalizeStagesResponse = (payload: unknown): ApprovalStage[] => {
  if (Array.isArray(payload)) {
    return payload as ApprovalStage[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as ApprovalStage[]
    }

    if (Array.isArray(record.results)) {
      return record.results as ApprovalStage[]
    }

    if (Array.isArray(record.stages)) {
      return record.stages as ApprovalStage[]
    }
  }

  return []
}

export const normalizeLocationsResponse = (payload: unknown): LocationPoint[] => {
  if (Array.isArray(payload)) {
    return payload as LocationPoint[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as LocationPoint[]
    }

    if (Array.isArray(record.results)) {
      return record.results as LocationPoint[]
    }

    if (Array.isArray(record.locations)) {
      return record.locations as LocationPoint[]
    }
  }

  return []
}

export const getEmployeeLabel = (employee: Employee): string => {
  const fullName =
    employee.full_name?.trim() ||
    employee.name?.trim() ||
    `${employee.first_name ?? ''} ${employee.surname ?? ''}`.trim()

  return fullName || `Employee ${employee.id}`
}

export const getFinalStageId = (stages: ApprovalStage[]): number | null => {
  if (!stages.length) {
    return null
  }

  return stages
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)
    .at(-1)?.id ?? null
}

export const mapClaimRow = (
  claim: ClaimApi,
  employeeMap: Map<string, string>,
  finalStageId: number | null,
): ClaimRow => {
  const employeeId = String(claim.employee_id ?? '')
  const employeeName = claim.employee ?? employeeMap.get(employeeId) ?? employeeId
  const stageId = claim.stage_id ?? null
  const statusLabel =
    claim.approval_status?.toLowerCase() ||
    (finalStageId && stageId === finalStageId ? 'approved' : 'pending')

  return {
    id: Number(claim.id),
    employee: employeeName,
    purpose: claim.purpose ?? '',
    origin: claim.origin ?? '',
    destination: claim.destination ?? '',
    days: Number(claim.days ?? 0),
    nights: Number(claim.nights ?? 0),
    total_allowances: Number(claim.total_allowances ?? claim.total ?? 0),
    status: statusLabel,
    documents_submitted: Boolean(claim.documents_submitted),
  }
}
