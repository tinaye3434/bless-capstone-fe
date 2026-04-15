import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../utils/auth'
import {
  loadClaimsTableData,
  mapClaimRow,
  type ClaimRow,
  type Employee,
} from '../utils/claims'

function MyClaims() {
  const navigate = useNavigate()
  const currentUser = getUser()
  const currentUserId = String(currentUser?.id ?? '')
  const [search, setSearch] = useState('')
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true)
      setError(null)

      try {
        const { claims: normalizedClaims, employees, employeeMap, finalStageId } =
          await loadClaimsTableData()
        setEmployees(employees)

        const currentEmployeeIds = new Set(
          employees
            .filter((employee) => String(employee.user_id ?? '') === currentUserId)
            .map((employee) => String(employee.id)),
        )

        const scopedClaims =
          currentEmployeeIds.size === 0
            ? []
            : normalizedClaims.filter((claim) =>
                currentEmployeeIds.has(String(claim.employee_id ?? '')),
              )

        setClaims(scopedClaims.map((claim) => mapClaimRow(claim, employeeMap, finalStageId)))
      } catch (err) {
        setError('Failed to load claims.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchClaims()
  }, [currentUserId])

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

  const canCreateClaim = useMemo(() => {
    const currentUserId = String(currentUser?.id ?? '')
    if (!currentUserId) {
      return true
    }

    const currentEmployeeIds = new Set(
      employees
        .filter((employee) => String(employee.user_id ?? '') === currentUserId)
        .map((employee) => String(employee.id)),
    )

    if (currentEmployeeIds.size === 0) {
      return true
    }

    return !claims.some(
      (claim) =>
        currentEmployeeIds.has(claim.employee_id) &&
        claim.status === 'pending' &&
        !claim.documents_submitted,
    )
  }, [claims, currentUserId, employees])

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
          {canCreateClaim ? (
            <Button variant='primary' onClick={() => navigate('/create-claim')}>
              Create Claim
            </Button>
          ) : null}
        </div>
      </div>

      {!canCreateClaim ? (
        <Alert variant='warning'>
          Submit documents for your previous pending claim before creating a new one.
        </Alert>
      ) : null}

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
                    Loading claims...
                  </td>
                </tr>
              ) : filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className='text-center py-4'>
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
