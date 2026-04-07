import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

type ClaimStatus = string

type Claim = {
  id: number
  employee: string
  purpose: string
  origin: string
  destination: string
  days: number
  nights: number
  total_allowances: number
  status: ClaimStatus
  documents_submitted: boolean
}

type ClaimApi = {
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

const CLAIMS_ENDPOINT = '/api/claims/'
const EMPLOYEES_ENDPOINT = '/api/employee/'
const APPROVAL_STAGES_ENDPOINT = '/api/approval-stages/'

type Employee = {
  id: number | string
  first_name?: string
  surname?: string
  name?: string
  full_name?: string
}

type ApprovalStage = {
  id: number
  order?: number
}

const normalizeEmployeesResponse = (payload: unknown): Employee[] => {
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

const getEmployeeLabel = (employee: Employee): string => {
  const fullName =
    employee.full_name?.trim() ||
    employee.name?.trim() ||
    `${employee.first_name ?? ''} ${employee.surname ?? ''}`.trim()

  return fullName || `Employee ${employee.id}`
}

const normalizeClaimsResponse = (payload: unknown): ClaimApi[] => {
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

const normalizeStagesResponse = (payload: unknown): ApprovalStage[] => {
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

const getFinalStageId = (stages: ApprovalStage[]): number | null => {
  if (!stages.length) {
    return null
  }

  return stages
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)
    .at(-1)?.id ?? null
}

const mapClaim = (
  claim: ClaimApi,
  employeeMap: Map<string, string>,
  finalStageId: number | null,
): Claim => {
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

function Submissions() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true)
      setError(null)

      try {
        const [claimsResponse, employeesResponse, stagesResponse] = await Promise.all([
          axios.get(CLAIMS_ENDPOINT),
          axios.get(EMPLOYEES_ENDPOINT),
          axios.get(APPROVAL_STAGES_ENDPOINT),
        ])
        const normalized = normalizeClaimsResponse(claimsResponse.data)
        const employees = normalizeEmployeesResponse(employeesResponse.data)
        const stages = normalizeStagesResponse(stagesResponse.data)
        const finalStageId = getFinalStageId(stages)
        const employeeMap = new Map(
          employees.map((employee) => [String(employee.id), getEmployeeLabel(employee)]),
        )
        const mappedClaims = normalized.map((claim) => mapClaim(claim, employeeMap, finalStageId))
        setClaims(mappedClaims.filter((claim) => claim.documents_submitted))
      } catch (err) {
        setError('Failed to load submissions.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchClaims()
  }, [])

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return claims
    }

    return claims.filter((claim) => {
      return (
        claim.employee.toLowerCase().includes(query) ||
        claim.purpose.toLowerCase().includes(query) ||
        claim.origin.toLowerCase().includes(query) ||
        claim.destination.toLowerCase().includes(query) ||
        String(claim.id).includes(query)
      )
    })
  }, [search, claims])

  return (
    <>
      <div className='mb-4'>
        <h2 className='page-title'>Submissions</h2>
        <p className='page-subtitle'>Track submitted receipts and OCR results.</p>
      </div>

      <div className='row mb-3'>
        <div className='col-md-6'>
          <Form.Control
            placeholder='Search submissions by employee, purpose, route, or claim ID...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <div className='row'>
        <div className='col-12'>
          <Table hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Purpose</th>
                <th>Days</th>
                <th>Nights</th>
                <th>Destination</th>
                <th>Total Allowances</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className='text-center py-4'>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Loading submissions...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className='text-center py-4'>
                    No submissions found.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.id}</td>
                    <td>{claim.employee}</td>
                    <td>{claim.purpose}</td>
                    <td>{claim.days}</td>
                    <td>{claim.nights}</td>
                    <td>{claim.destination}</td>
                    <td>{claim.total_allowances.toFixed(2)}</td>
                    <td className='text-capitalize'>{claim.status}</td>
                    <td>
                      <div className='d-flex gap-2'>
                        <Button
                          variant='outline-secondary'
                          size='sm'
                          onClick={() => navigate(`/claims/${claim.id}`)}
                        >
                          View
                        </Button>
                        <Button
                          variant='outline-success'
                          size='sm'
                          onClick={() => navigate(`/claims/${claim.id}/documents/summary`)}
                        >
                          View Results
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
      {error ? (
        <Alert variant='danger' className='mt-3'>
          {error}
        </Alert>
      ) : null}
    </>
  )
}

export default Submissions
