import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Badge, Button, Card, ProgressBar, Spinner, Table } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'

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

type SummaryResponse = {
  claim_id: number | string
  documents_submitted: boolean
  total_receipts: number
  processed_receipts: number
  pending_receipts: number
  valid_receipts: number
  mismatch_receipts: number
  error_receipts: number
  other_receipts: number
  receipts: Receipt[]
}

const CLAIMS_ENDPOINT = '/api/claims/'

function ClaimDocumentsSummary() {
  const { id: claimId } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [runningOcr, setRunningOcr] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    if (!claimId) {
      return
    }
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await axios.get<SummaryResponse>(
        `${CLAIMS_ENDPOINT}${claimId}/documents-summary/`,
      )
      setSummary(response.data)
    } catch (err) {
      setError('Failed to load OCR summary.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [claimId])

  const handleRunOcr = async () => {
    if (!claimId) {
      return
    }
    setRunningOcr(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await axios.post(`${CLAIMS_ENDPOINT}${claimId}/reprocess-ocr/`)
      const detail =
        (response.data && typeof response.data.detail === 'string' && response.data.detail) ||
        'OCR reprocessing started in the background.'
      setSuccess(detail)
      await fetchSummary()
    } catch (err) {
      setError('Failed to start OCR processing.')
      console.error(err)
    } finally {
      setRunningOcr(false)
    }
  }

  useEffect(() => {
    void fetchSummary()
  }, [fetchSummary])

  const progressPct = useMemo(() => {
    if (!summary || summary.total_receipts === 0) {
      return 0
    }
    return Math.round((summary.processed_receipts / summary.total_receipts) * 100)
  }, [summary])

  const renderStatusBadge = (status?: string) => {
    if (!status || status === 'pending') {
      return <Badge bg='secondary'>Pending</Badge>
    }
    if (status === 'valid') {
      return <Badge bg='success'>Valid</Badge>
    }
    if (status === 'mismatch') {
      return <Badge bg='danger'>Mismatch</Badge>
    }
    if (status === 'error') {
      return <Badge bg='warning' text='dark'>Error</Badge>
    }
    return <Badge bg='secondary'>{status}</Badge>
  }

  if (!claimId) {
    return <Alert variant='danger'>Missing claim id.</Alert>
  }

  return (
    <div>
      <div className='d-flex justify-content-between align-items-center mb-3'>
        <div>
          <h5 className='mb-1'>OCR Summary</h5>
          <div className='text-muted'>Claim #{claimId}</div>
        </div>
        <div className='d-flex gap-2'>
          <Button variant='outline-primary' onClick={() => void handleRunOcr()} disabled={runningOcr || loading}>
            {runningOcr ? 'Starting OCR...' : 'Run OCR'}
          </Button>
          <Button variant='outline-secondary' onClick={() => navigate(`/claims/${claimId}/documents`)}>
            Receipts
          </Button>
          <Button variant='outline-secondary' onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}
      {success ? <Alert variant='success'>{success}</Alert> : null}

      {loading ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          Loading summary...
        </div>
      ) : summary ? (
        <>
          <Card className='mb-4'>
            <Card.Body>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <div>
                  <div className='fw-semibold'>Processing Progress</div>
                  <div className='text-muted'>
                    {summary.processed_receipts} of {summary.total_receipts} processed
                  </div>
                </div>
                <div className='fw-semibold'>{progressPct}%</div>
              </div>
              <ProgressBar now={progressPct} label={`${progressPct}%`} />
              <div className='d-flex flex-wrap gap-3 mt-3 text-muted'>
                <div>Pending: {summary.pending_receipts}</div>
                <div>Valid: {summary.valid_receipts}</div>
                <div>Mismatch: {summary.mismatch_receipts}</div>
                <div>Error: {summary.error_receipts}</div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Body>
              <h6 className='mb-3'>Submitted Receipts</h6>
              <Table hover responsive>
                <thead>
                  <tr>
                    <th>Receipt</th>
                    <th>Line</th>
                    <th>Status</th>
                    <th>Vendor</th>
                    <th>Total</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.receipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className='text-center py-3'>
                        No receipts uploaded.
                      </td>
                    </tr>
                  ) : (
                    summary.receipts.map((receipt) => (
                      <tr key={String(receipt.id)}>
                        <td>{receipt.file_name}</td>
                        <td>{receipt.claim_line}</td>
                        <td>{renderStatusBadge(receipt.ocr_result?.match_status)}</td>
                        <td>{receipt.ocr_result?.vendor_name ?? '-'}</td>
                        <td>
                          {receipt.ocr_result?.total_amount !== undefined &&
                          receipt.ocr_result?.total_amount !== null
                            ? receipt.ocr_result.total_amount.toFixed(2)
                            : '-'}
                        </td>
                        <td>{receipt.ocr_result?.notes ?? '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      ) : null}
    </div>
  )
}

export default ClaimDocumentsSummary
