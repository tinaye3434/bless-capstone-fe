import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'

type ClaimDetail = {
  id: number | string
  employee_id?: number | string
  employee?: string
  purpose?: string
  departure_date?: string
  return_date?: string
  nights?: number
  days?: number
  origin?: string
  destination?: string
  user_distance?: number
  calculated_distance?: number
  total?: number
  total_allowances?: number
  stage_id?: number | string
  status?: string
}

type ClaimLine = {
  id?: number | string
  claim_id?: number | string
  allowance_id?: number | string
  quantity?: number
  amount?: number
}

type Employee = {
  id: number | string
  first_name?: string
  surname?: string
  name?: string
  full_name?: string
}

type AllowanceOption = {
  id: number | string
  title?: string
  name?: string
  label?: string
}

const CLAIMS_ENDPOINT = '/api/claims/'
const CLAIM_LINES_ENDPOINT = '/api/claim-lines/'
const EMPLOYEES_ENDPOINT = '/api/employee/'
const ALLOWANCES_ENDPOINT = '/api/allowances/'

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

const normalizeAllowancesResponse = (payload: unknown): AllowanceOption[] => {
  if (Array.isArray(payload)) {
    return payload as AllowanceOption[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as AllowanceOption[]
    }

    if (Array.isArray(record.results)) {
      return record.results as AllowanceOption[]
    }

    if (Array.isArray(record.allowances)) {
      return record.allowances as AllowanceOption[]
    }
  }

  return []
}

const normalizeClaimLinesResponse = (payload: unknown): ClaimLine[] => {
  if (Array.isArray(payload)) {
    return payload as ClaimLine[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as ClaimLine[]
    }

    if (Array.isArray(record.results)) {
      return record.results as ClaimLine[]
    }

    if (Array.isArray(record.claim_lines)) {
      return record.claim_lines as ClaimLine[]
    }
  }

  return []
}

const fetchClaimLines = async (claimId: string): Promise<ClaimLine[]> => {
  try {
    const response = await axios.get(`${CLAIMS_ENDPOINT}${claimId}/lines/`)
    const lines = normalizeClaimLinesResponse(response.data)
    return lines.filter(
      (line) => String(line.claim_id ?? claimId) === String(claimId),
    )
  } catch (error) {
    console.warn('Claim lines not available at /claims/:id/lines/.', error)
  }

  try {
    const response = await axios.get(`${CLAIM_LINES_ENDPOINT}?claim_id=${claimId}`)
    const lines = normalizeClaimLinesResponse(response.data)
    return lines.filter(
      (line) => String(line.claim_id ?? claimId) === String(claimId),
    )
  } catch (error) {
    console.warn('Claim lines not available at /claim-lines/.', error)
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

const getAllowanceLabel = (allowance: AllowanceOption): string => {
  const label = allowance.title?.trim() || allowance.name?.trim() || allowance.label?.trim()
  return label || `Allowance ${allowance.id}`
}

function ClaimPreview() {
  const { id: claimId } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [claimLines, setClaimLines] = useState<ClaimLine[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [allowances, setAllowances] = useState<AllowanceOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!claimId) {
      return
    }

    const fetchClaim = async () => {
      setLoading(true)
      setError(null)

      try {
        const [claimResponse, claimLinesResponse, employeesResponse, allowancesResponse] =
          await Promise.all([
            axios.get<ClaimDetail>(`${CLAIMS_ENDPOINT}${claimId}/`),
            fetchClaimLines(claimId),
            axios.get(EMPLOYEES_ENDPOINT),
            axios.get(ALLOWANCES_ENDPOINT),
          ])

        setClaim(claimResponse.data)
        setClaimLines(claimLinesResponse)
        setEmployees(normalizeEmployeesResponse(employeesResponse.data))
        setAllowances(normalizeAllowancesResponse(allowancesResponse.data))
      } catch (err) {
        setError('Failed to load claim preview.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchClaim()
  }, [claimId])

  const employeeName = useMemo(() => {
    if (!claim) {
      return ''
    }
    if (claim.employee) {
      return claim.employee
    }
    const match = employees.find((employee) => String(employee.id) === String(claim.employee_id))
    return match ? getEmployeeLabel(match) : String(claim.employee_id ?? '')
  }, [claim, employees])

  const allowanceMap = useMemo(() => {
    return new Map(allowances.map((allowance) => [String(allowance.id), getAllowanceLabel(allowance)]))
  }, [allowances])

  const lineItems = useMemo(() => {
    return claimLines.map((line) => {
      const allowanceName = allowanceMap.get(String(line.allowance_id)) ?? String(line.allowance_id)
      const quantity = Number(line.quantity ?? 0)
      const amount = Number(line.amount ?? 0)
      return {
        id: line.id ?? `${line.allowance_id}-${quantity}-${amount}`,
        allowance: allowanceName,
        quantity,
        amount,
        total: quantity * amount,
      }
    })
  }, [claimLines, allowanceMap])

  const totalAllowances = useMemo(() => {
    if (claim?.total_allowances !== undefined) {
      return Number(claim.total_allowances)
    }
    if (claim?.total !== undefined) {
      return Number(claim.total)
    }
    return lineItems.reduce((sum, item) => sum + item.total, 0)
  }, [claim, lineItems])

  if (!claimId) {
    return <Alert variant='danger'>Missing claim id.</Alert>
  }

  return (
    <>
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #dee2e6 !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className='d-flex justify-content-between align-items-center mb-3 print-hidden'>
        <div>
          <h5 className='mb-1'>Claim Preview</h5>
          <div className='text-muted'>Claim #{claimId}</div>
        </div>
        <div className='d-flex gap-2'>
          <Button variant='outline-secondary' onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant='primary' onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}

      {loading ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          <span>Loading claim preview...</span>
        </div>
      ) : claim ? (
        <Card className='print-card'>
          <Card.Body>
            <Row className='mb-3'>
              <Col md={6}>
                <h6 className='mb-3'>Claim Details</h6>
                <div className='mb-2'><strong>Employee:</strong> {employeeName || '-'}</div>
                <div className='mb-2'><strong>Purpose:</strong> {claim.purpose || '-'}</div>
                <div className='mb-2'><strong>Origin:</strong> {claim.origin || '-'}</div>
                <div className='mb-2'><strong>Destination:</strong> {claim.destination || '-'}</div>
                <div className='mb-2'><strong>Departure:</strong> {claim.departure_date || '-'}</div>
                <div className='mb-2'><strong>Return:</strong> {claim.return_date || '-'}</div>
              </Col>
              <Col md={6}>
                <h6 className='mb-3'>Trip Summary</h6>
                <div className='mb-2'><strong>Days:</strong> {claim.days ?? '-'}</div>
                <div className='mb-2'><strong>Nights:</strong> {claim.nights ?? '-'}</div>
                <div className='mb-2'><strong>User Distance:</strong> {claim.user_distance ?? '-'}</div>
                <div className='mb-2'><strong>Calculated Distance:</strong> {claim.calculated_distance ?? '-'}</div>
                <div className='mb-2'><strong>Status:</strong> {claim.status ?? '-'}</div>
                <div className='mb-2'><strong>Stage:</strong> {claim.stage_id ?? '-'}</div>
              </Col>
            </Row>

            <h6 className='mb-3'>Claim Lines</h6>
            <Table hover responsive>
              <thead>
                <tr>
                  <th>Allowance</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className='text-center py-3'>
                      No claim lines found.
                    </td>
                  </tr>
                ) : (
                  lineItems.map((line) => (
                    <tr key={String(line.id)}>
                      <td>{line.allowance}</td>
                      <td>{line.quantity}</td>
                      <td>{line.amount.toFixed(2)}</td>
                      <td>{line.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            <div className='d-flex justify-content-end'>
              <div>
                <strong>Total Allowances: {totalAllowances.toFixed(2)}</strong>
              </div>
            </div>
          </Card.Body>
        </Card>
      ) : null}
    </>
  )
}

export default ClaimPreview
