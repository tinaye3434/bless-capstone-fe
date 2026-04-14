import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  APPROVAL_STAGES_ENDPOINT,
  CLAIMS_ENDPOINT,
  EMPLOYEES_ENDPOINT,
  getEmployeeLabel,
  getFinalStageId,
  mapClaimRow,
  normalizeClaimsResponse,
  normalizeEmployeesResponse,
  normalizeStagesResponse,
  type ClaimRow,
} from '../utils/claims'

type ActionModalState = {
  claimId: number
  employee: string
  decision: 'approve' | 'deny'
} | null

function PendingClaims() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [claims, setClaims] = useState<ClaimRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modalState, setModalState] = useState<ActionModalState>(null)
  const [justification, setJustification] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

      const mappedClaims = normalizedClaims.map((claim) =>
        mapClaimRow(claim, employeeMap, finalStageId),
      )
      setClaims(
        mappedClaims.filter(
          (claim) =>
            claim.documents_submitted &&
            claim.status.toLowerCase() === 'pending',
        ),
      )
    } catch (err) {
      setError('Failed to load pending claims.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
  }, [claims, search])

  const openModal = (claim: ClaimRow, decision: 'approve' | 'deny') => {
    setSuccess(null)
    setError(null)
    setJustification('')
    setModalState({
      claimId: claim.id,
      employee: claim.employee,
      decision,
    })
  }

  const closeModal = () => {
    if (submitting) {
      return
    }
    setModalState(null)
    setJustification('')
  }

  const submitDecision = async () => {
    if (!modalState) {
      return
    }

    const trimmedJustification = justification.trim()
    if (!trimmedJustification) {
      setError('A justification is required before approving or denying.')
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await axios.post(`${CLAIMS_ENDPOINT}${modalState.claimId}/decision/`, {
        decision: modalState.decision,
        justification: trimmedJustification,
      })

      const detail = (response.data as { detail?: string }).detail
      setSuccess(detail || `Claim ${modalState.decision}d successfully.`)
      setModalState(null)
      setJustification('')
      await fetchClaims()
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = (err.response?.data as { detail?: string } | undefined)?.detail
        setError(detail || 'Failed to action claim.')
      } else {
        setError('Failed to action claim.')
      }
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className='mb-4'>
        <h2 className='page-title'>Pending Claims</h2>
        <p className='page-subtitle'>
          Review submitted pending claims and record an approval or denial with justification.
        </p>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}
      {success ? <Alert variant='success'>{success}</Alert> : null}

      <div className='row mb-3'>
        <div className='col-md-6'>
          <Form.Control
            placeholder='Search by employee, purpose, route, or claim ID...'
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className='text-center py-4'>
                <Spinner animation='border' size='sm' className='me-2' />
                Loading pending claims...
              </td>
            </tr>
          ) : filteredClaims.length === 0 ? (
            <tr>
              <td colSpan={7} className='text-center py-4'>
                No pending claims found.
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
                  <div className='d-flex gap-2 flex-wrap'>
                    <Button
                      variant='outline-secondary'
                      size='sm'
                      onClick={() => navigate(`/claims/${claim.id}`)}
                    >
                      Preview
                    </Button>
                    <Button
                      variant='outline-success'
                      size='sm'
                      onClick={() => openModal(claim, 'approve')}
                    >
                      Action
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Modal show={modalState !== null} onHide={closeModal} centered>
        <Modal.Header closeButton={!submitting}>
          <Modal.Title>
            {modalState?.decision === 'approve' ? 'Approve Claim' : 'Deny Claim'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className='text-muted mb-3'>
            Claim #{modalState?.claimId} for {modalState?.employee}
          </p>
          <Form.Group controlId='claimJustification'>
            <Form.Label>Justification</Form.Label>
            <Form.Control
              as='textarea'
              rows={4}
              value={justification}
              onChange={(event) => setJustification(event.target.value)}
              placeholder='Explain why you are approving or denying this claim.'
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='outline-secondary' onClick={closeModal} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant='danger'
            onClick={() => {
              if (modalState) {
                setModalState({ ...modalState, decision: 'deny' })
              }
            }}
            disabled={submitting || modalState?.decision === 'deny'}
          >
            Deny
          </Button>
          <Button
            variant='success'
            onClick={() => {
              if (modalState) {
                setModalState({ ...modalState, decision: 'approve' })
              }
            }}
            disabled={submitting || modalState?.decision === 'approve'}
          >
            Approve
          </Button>
          <Button variant='primary' onClick={() => void submitDecision()} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Decision'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default PendingClaims
