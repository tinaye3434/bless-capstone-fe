import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../utils/auth'
import { loadClaimsTableData, mapClaimRow, type ClaimRow } from '../utils/claims'

function Submissions() {
  const navigate = useNavigate()
  const currentUser = getUser()
  const currentUserId = String(currentUser?.id ?? '')
  const [search, setSearch] = useState('')
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClaims = async () => {
      setLoading(true)
      setError(null)

      try {
        const { claims: normalizedClaims, employees, employeeMap, finalStageId } =
          await loadClaimsTableData()
        const currentEmployeeIds = new Set(
          employees
            .filter((employee) => String(employee.user_id ?? '') === currentUserId)
            .map((employee) => String(employee.id)),
        )
        const mappedClaims = normalizedClaims.map((claim) =>
          mapClaimRow(claim, employeeMap, finalStageId),
        )
        setClaims(
          mappedClaims.filter(
            (claim) =>
              claim.documents_submitted &&
              currentEmployeeIds.has(claim.employee_id),
          ),
        )
      } catch (err) {
        setError('Failed to load submissions.')
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
