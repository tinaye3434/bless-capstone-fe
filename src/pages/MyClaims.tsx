import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

type ClaimStatus = string

type Claim = {
  id: number
  employee: string
  purpose: string
  destination: string
  days: number
  nights: number
  total_allowances: number
  status: ClaimStatus
}

type ClaimApi = {
  id: number
  employee?: string
  employee_id?: number | string
  purpose?: string
  destination?: string
  days?: number
  nights?: number
  total_allowances?: number
  total?: number
  status?: string
}

const CLAIMS_ENDPOINT = '/api/claims/'
const EMPLOYEES_ENDPOINT = '/api/employee/'

type Employee = {
  id: number | string
  first_name?: string
  surname?: string
  name?: string
  full_name?: string
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

const mapClaim = (claim: ClaimApi, employeeMap: Map<string, string>): Claim => {
  const employeeId = String(claim.employee_id ?? '')
  const employeeName = claim.employee ?? employeeMap.get(employeeId) ?? employeeId

  return {
    id: Number(claim.id),
    employee: employeeName,
    purpose: claim.purpose ?? '',
    destination: claim.destination ?? '',
    days: Number(claim.days ?? 0),
    nights: Number(claim.nights ?? 0),
    total_allowances: Number(claim.total_allowances ?? claim.total ?? 0),
    status: String(claim.status ?? 'pending'),
  }
}

function MyClaims() {
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
        const [claimsResponse, employeesResponse] = await Promise.all([
          axios.get(CLAIMS_ENDPOINT),
          axios.get(EMPLOYEES_ENDPOINT),
        ])
        console.log('Claims API response:', claimsResponse.data)
        const normalized = normalizeClaimsResponse(claimsResponse.data)
        console.log('Normalized claims:', normalized)
        const employees = normalizeEmployeesResponse(employeesResponse.data)
        const employeeMap = new Map(
          employees.map((employee) => [String(employee.id), getEmployeeLabel(employee)]),
        )
        setClaims(normalized.map((claim) => mapClaim(claim, employeeMap)))
      } catch (err) {
        setError('Failed to load claims.')
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
        <h2 className='page-title'>Claims</h2>
        <p className='page-subtitle'>Search, review, and manage travel claims.</p>
      </div>

      <div className='row mb-3'>
        <div className='col-md-6'>
          <Form.Control
            placeholder='Search claims by employee, purpose, route, or claim ID...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className='col-md-6 d-flex justify-content-md-end mt-2 mt-md-0'>
          <Button variant='primary' onClick={() => navigate('/create-claim')}>
            Create Claim
          </Button>
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className='text-center py-4'>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Loading claims...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className='text-center py-4'>
                    No claims found.
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
                          onClick={() => navigate(`/claims/${claim.id}/documents`)}
                        >
                          Documents
                        </Button>
                        <Button
                          variant='outline-primary'
                          size='sm'
                          onClick={() => navigate(`/claims/${claim.id}/edit`)}
                        >
                          Edit
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

export default MyClaims
