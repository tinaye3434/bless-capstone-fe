import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  APPROVAL_STAGES_ENDPOINT,
  CLAIMS_ENDPOINT,
  EMPLOYEES_ENDPOINT,
  formatClaimStatus,
  getEmployeeLabel,
  getFinalStageId,
  getClaimStatusClassName,
  mapClaimRow,
  normalizeClaimsResponse,
  normalizeEmployeesResponse,
  normalizeStagesResponse,
  type ClaimRow,
} from '../utils/claims'

function AllClaims() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [claims, setClaims] = useState<ClaimRow[]>([])
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

        const normalizedClaims = normalizeClaimsResponse(claimsResponse.data)
        const employees = normalizeEmployeesResponse(employeesResponse.data)
        const stages = normalizeStagesResponse(stagesResponse.data)
        const finalStageId = getFinalStageId(stages)
        const employeeMap = new Map(
          employees.map((employee) => [String(employee.id), getEmployeeLabel(employee)]),
        )

        setClaims(normalizedClaims.map((claim) => mapClaimRow(claim, employeeMap, finalStageId)))
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
        claim.status.toLowerCase().includes(query) ||
        String(claim.id).includes(query)
      )
    })
  }, [claims, search])

  return (
    <>
      <div className='mb-4'>
        <h2 className='page-title'>All Claims</h2>
        <p className='page-subtitle'>A complete view of every claim in the system.</p>
      </div>

      <div className='row mb-3'>
        <div className='col-md-6'>
          <Form.Control
            placeholder='Search by employee, purpose, route, status, or claim ID...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <Table hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Employee</th>
            <th>Purpose</th>
            <th>Route</th>
            <th>Days</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={8} className='text-center py-4'>
                <Spinner animation='border' size='sm' className='me-2' />
                Loading claims...
              </td>
            </tr>
          ) : filteredClaims.length === 0 ? (
            <tr>
              <td colSpan={8} className='text-center py-4'>
                No claims found.
              </td>
            </tr>
          ) : (
            filteredClaims.map((claim) => (
              <tr key={claim.id}>
                <td>{claim.id}</td>
                <td>{claim.employee}</td>
                <td>{claim.purpose}</td>
                <td>{claim.origin} to {claim.destination}</td>
                <td>{claim.days}</td>
                <td>{claim.total_allowances.toFixed(2)}</td>
                <td>
                  <span className={getClaimStatusClassName(claim.status)}>
                    {formatClaimStatus(claim.status)}
                  </span>
                </td>
                <td>
                  <Button
                    variant='outline-primary'
                    size='sm'
                    onClick={() => navigate(`/claims/${claim.id}`)}
                  >
                    Preview
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {error ? (
        <Alert variant='danger' className='mt-3'>
          {error}
        </Alert>
      ) : null}
    </>
  )
}

export default AllClaims
