import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'

type ClaimDetail = {
  id: number | string
  employee_id?: number | string
  purpose?: string
  origin?: string
  destination?: string
  actual_mileage?: number | null
}

type ClaimLine = {
  id?: number | string
  claim_id?: number | string
  allowance_id?: number | string
  quantity?: number
  amount?: number
}

type Receipt = {
  id: number | string
  claim_line: number | string
  file: string
  file_name: string
  file_type?: string
  uploaded_at?: string
  ocr_result?: {
    vendor_name?: string
    receipt_date?: string
    total_amount?: number
    tax_amount?: number
    receipt_number?: string
    match_status?: string
    notes?: string
  } | null
}

type AllowanceOption = {
  id: number | string
  title?: string
  name?: string
  label?: string
}

const CLAIMS_ENDPOINT = '/api/claims/'
const CLAIM_LINES_ENDPOINT = '/api/claim-lines/'
const RECEIPTS_ENDPOINT = '/api/receipts/'
const ALLOWANCES_ENDPOINT = '/api/allowances/'

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

const fetchClaimLines = async (claimId: string): Promise<ClaimLine[]> => {
  try {
    const response = await axios.get(`${CLAIMS_ENDPOINT}${claimId}/lines/`)
    const lines = normalizeClaimLinesResponse(response.data)
    return lines.filter((line) => String(line.claim_id ?? claimId) === String(claimId))
  } catch (error) {
    console.warn('Claim lines not available at /claims/:id/lines/.', error)
  }

  try {
    const response = await axios.get(`${CLAIM_LINES_ENDPOINT}?claim_id=${claimId}`)
    const lines = normalizeClaimLinesResponse(response.data)
    return lines.filter((line) => String(line.claim_id ?? claimId) === String(claimId))
  } catch (error) {
    console.warn('Claim lines not available at /claim-lines/.', error)
  }

  return []
}

const getAllowanceLabel = (allowance: AllowanceOption): string => {
  const label = allowance.title?.trim() || allowance.name?.trim() || allowance.label?.trim()
  return label || `Allowance ${allowance.id}`
}

function ClaimDocuments() {
  const { id: claimId } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [claimLines, setClaimLines] = useState<ClaimLine[]>([])
  const [allowances, setAllowances] = useState<AllowanceOption[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [actualMileage, setActualMileage] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [savingMileage, setSavingMileage] = useState(false)
  const [uploadingLineId, setUploadingLineId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!claimId) {
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [claimResponse, linesResponse, allowancesResponse, receiptsResponse] =
          await Promise.all([
            axios.get<ClaimDetail>(`${CLAIMS_ENDPOINT}${claimId}/`),
            fetchClaimLines(claimId),
            axios.get(ALLOWANCES_ENDPOINT),
            axios.get<Receipt[]>(RECEIPTS_ENDPOINT),
          ])

        setClaim(claimResponse.data)
        setClaimLines(linesResponse)
        setAllowances(normalizeAllowancesResponse(allowancesResponse.data))
        setReceipts(Array.isArray(receiptsResponse.data) ? receiptsResponse.data : [])
        if (claimResponse.data.actual_mileage !== undefined && claimResponse.data.actual_mileage !== null) {
          setActualMileage(String(claimResponse.data.actual_mileage))
        }
      } catch (err) {
        setError('Failed to load claim documents.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [claimId])

  const allowanceMap = useMemo(() => {
    return new Map(allowances.map((allowance) => [String(allowance.id), getAllowanceLabel(allowance)]))
  }, [allowances])

  const lineItems = useMemo(() => {
    return claimLines.map((line) => {
      const allowanceName = allowanceMap.get(String(line.allowance_id)) ?? String(line.allowance_id)
      const lineId = String(line.id ?? '')
      const lineReceipts = receipts.filter((receipt) => String(receipt.claim_line) === lineId)
      return {
        id: line.id ?? `${line.allowance_id}`,
        allowance: allowanceName,
        receipts: lineReceipts,
      }
    })
  }, [claimLines, allowanceMap, receipts])

  const renderStatusBadge = (status?: string) => {
    if (!status) {
      return <Badge bg='secondary'>Pending</Badge>
    }
    if (status === 'valid') {
      return <Badge bg='success'>Valid</Badge>
    }
    if (status === 'mismatch') {
      return <Badge bg='danger'>Mismatch</Badge>
    }
    return <Badge bg='secondary'>{status}</Badge>
  }

  const handleUpload = async (lineId: string, files: FileList | null) => {
    if (!files || files.length === 0) {
      return
    }
    setError(null)
    setSuccess(null)
    setUploadingLineId(lineId)

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('files', file))
      const response = await axios.post(
        `${CLAIM_LINES_ENDPOINT}${lineId}/receipts/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      const created = response.data as Receipt[]
      setReceipts((prev) => [...created, ...prev])
      setSuccess('Receipts uploaded.')
    } catch (err) {
      setError('Failed to upload receipts.')
      console.error(err)
    } finally {
      setUploadingLineId(null)
    }
  }

  const handleSaveMileage = async () => {
    if (!claimId) {
      return
    }
    setSavingMileage(true)
    setError(null)
    setSuccess(null)
    try {
      await axios.patch(`${CLAIMS_ENDPOINT}${claimId}/`, {
        actual_mileage: actualMileage ? Number(actualMileage) : null,
      })
      setSuccess('Mileage updated.')
    } catch (err) {
      setError('Failed to update mileage.')
      console.error(err)
    } finally {
      setSavingMileage(false)
    }
  }

  if (!claimId) {
    return <Alert variant='danger'>Missing claim id.</Alert>
  }

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div>
          <h5 className='mb-1'>Claim Documents</h5>
          <div className='text-muted'>Claim #{claimId}</div>
        </div>
        <Button variant='outline-secondary' onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}
      {success ? <Alert variant='success'>{success}</Alert> : null}

      {loading ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          Loading documents...
        </div>
      ) : (
        <>
          <Card className='mb-4'>
            <Card.Body>
              <Row className='align-items-end'>
                <Col md={8}>
                  <Form.Group controlId='actualMileage'>
                    <Form.Label>Actual Mileage (km)</Form.Label>
                    <Form.Control
                      type='number'
                      min='0'
                      step='0.1'
                      value={actualMileage}
                      onChange={(event) => setActualMileage(event.target.value)}
                      placeholder='Enter actual mileage after trip completion'
                    />
                  </Form.Group>
                </Col>
                <Col md={4} className='d-flex justify-content-end'>
                  <Button variant='primary' onClick={handleSaveMileage} disabled={savingMileage}>
                    {savingMileage ? 'Saving...' : 'Save Mileage'}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h6 className='mb-3'>Receipts per Allowance</h6>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Allowance</th>
                    <th>Receipts</th>
                    <th>OCR Status</th>
                    <th>Upload</th>
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
                    lineItems.map((line) => {
                      const statuses = line.receipts
                        .map((receipt) => receipt.ocr_result?.match_status)
                        .filter((status): status is string => Boolean(status))
                      const statusSummary =
                        statuses.length === 0
                          ? renderStatusBadge()
                          : statuses.every((status) => status === 'valid')
                            ? renderStatusBadge('valid')
                            : statuses.some((status) => status === 'mismatch')
                              ? renderStatusBadge('mismatch')
                              : renderStatusBadge('pending')

                      return (
                        <tr key={String(line.id)}>
                          <td>{line.allowance}</td>
                          <td>{line.receipts.length}</td>
                          <td>{statusSummary}</td>
                          <td>
                            <Form.Control
                              type='file'
                              multiple
                              onChange={(event) =>
                                handleUpload(String(line.id), event.target.files)
                              }
                              disabled={uploadingLineId === String(line.id)}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  )
}

export default ClaimDocuments
