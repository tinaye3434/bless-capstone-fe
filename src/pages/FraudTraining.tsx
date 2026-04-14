import { useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'

const FRAUD_TRAIN_CSV_ENDPOINT = '/api/fraud/train-csv/'
const FRAUD_MODEL_STATUS_ENDPOINT = '/api/fraud/model/'

const FEATURE_COLUMNS = [
  'claim_total',
  'claim_line_sum',
  'avg_line_amount',
  'claims_last_30d',
  'claims_last_90d',
  'days_since_last_claim',
  'claim_duration_days',
  'departure_hour',
  'departure_weekday',
]

type ModelStatus = {
  has_model: boolean
  snapshot_id?: number
  created_at?: string
  training_rows?: number
  training_quality?: 'low' | 'medium' | 'high'
  trained_from?: string | null
  trained_to?: string | null
  feature_columns?: string[]
}

const SAMPLE_ROW = [
  120.5,
  120.5,
  60.25,
  1,
  2,
  14,
  2,
  9,
  2,
]

function FraudTraining() {
  const [file, setFile] = useState<File | null>(null)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [qualityNotice, setQualityNotice] = useState<string | null>(null)
  const [status, setStatus] = useState<ModelStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  const loadStatus = async () => {
    setStatusLoading(true)
    setStatusError(null)
    try {
      const response = await axios.get<ModelStatus>(FRAUD_MODEL_STATUS_ENDPOINT)
      setStatus(response.data)
    } catch (err) {
      const fallback = 'Failed to load model status.'
      if (axios.isAxiosError(err)) {
        const detail = (err.response?.data as { detail?: string } | undefined)?.detail
        setStatusError(detail || fallback)
      } else {
        setStatusError(fallback)
      }
      console.error(err)
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const handleDownloadSample = () => {
    const header = FEATURE_COLUMNS.join(',')
    const row = SAMPLE_ROW.map((value) => String(value)).join(',')
    const content = `${header}\n${row}\n`
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fraud-training-sample.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setResult(null)
    setQualityNotice(null)

    if (!file) {
      setError('Please select a CSV file to upload.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    if (fromDate) {
      formData.append('from_date', fromDate)
    }
    if (toDate) {
      formData.append('to_date', toDate)
    }

    setLoading(true)
    try {
      const response = await axios.post(FRAUD_TRAIN_CSV_ENDPOINT, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setSuccess('Fraud model trained from CSV.')
      setResult(response.data)
      const quality = (response.data as { training_quality?: string } | undefined)?.training_quality
      if (quality === 'low') {
        setQualityNotice('Training completed, but data volume is low. Scores may be unstable.')
      } else if (quality === 'medium') {
        setQualityNotice('Training completed with a moderate data volume.')
      } else if (quality === 'high') {
        setQualityNotice('Training completed with a strong data volume.')
      }
      void loadStatus()
    } catch (err) {
      const fallback = 'Failed to train fraud model from CSV.'
      if (axios.isAxiosError(err)) {
        const detail = (err.response?.data as { detail?: string } | undefined)?.detail
        setError(detail || fallback)
      } else {
        setError(fallback)
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className='mb-4'>
        <h2 className='page-title'>Fraud Model Training</h2>
        <p className='page-subtitle'>Upload a CSV file to train the fraud detection model.</p>
      </div>

      <Card className='mb-4'>
        <Card.Body>
          <div className='d-flex justify-content-between align-items-center mb-3'>
            <h5 className='mb-0'>Model Status</h5>
            <Button variant='outline-secondary' size='sm' onClick={loadStatus} disabled={statusLoading}>
              {statusLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {statusError ? <Alert variant='danger'>{statusError}</Alert> : null}
          {!statusLoading && status && !status.has_model ? (
            <Alert variant='warning'>No model trained yet.</Alert>
          ) : null}
          {statusLoading ? (
            <div className='d-flex align-items-center text-muted'>
              <Spinner animation='border' size='sm' className='me-2' />
              Loading model status...
            </div>
          ) : status?.has_model ? (
            <div className='text-muted small'>
              <div>Snapshot ID: {status.snapshot_id}</div>
              <div>Trained Rows: {status.training_rows}</div>
              <div>
                Training Quality: {status.training_quality ? status.training_quality : 'unknown'}
              </div>
              <div>Created At: {status.created_at || '-'}</div>
              <div>Trained From: {status.trained_from || '-'}</div>
              <div>Trained To: {status.trained_to || '-'}</div>
            </div>
          ) : null}
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {error ? <Alert variant='danger'>{error}</Alert> : null}
          {success ? <Alert variant='success'>{success}</Alert> : null}
          {qualityNotice ? <Alert variant='warning'>{qualityNotice}</Alert> : null}

          <Form onSubmit={handleSubmit}>
            <Form.Group className='mb-3' controlId='fraudCsv'>
              <Form.Label>CSV File</Form.Label>
              <Form.Control
                type='file'
                accept='.csv,text/csv'
                onChange={(event) => {
                  const input = event.currentTarget as HTMLInputElement
                  const selected = input.files?.[0] ?? null
                  setFile(selected)
                }}
              />
              <Form.Text className='text-muted'>
                CSV must include all required feature columns.
              </Form.Text>
            </Form.Group>

            <div className='row'>
              <div className='col-md-6'>
                <Form.Group className='mb-3' controlId='fraudFromDate'>
                  <Form.Label>From Date (optional)</Form.Label>
                  <Form.Control
                    type='date'
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                  />
                </Form.Group>
              </div>
              <div className='col-md-6'>
                <Form.Group className='mb-3' controlId='fraudToDate'>
                  <Form.Label>To Date (optional)</Form.Label>
                  <Form.Control
                    type='date'
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                  />
                </Form.Group>
              </div>
            </div>

            <Button type='submit' variant='primary' disabled={loading}>
              {loading ? 'Training...' : 'Train Model'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card className='mt-4'>
        <Card.Body>
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <h5 className='mb-0'>Required CSV Columns</h5>
            <Button variant='outline-primary' size='sm' onClick={handleDownloadSample}>
              Download Sample CSV
            </Button>
          </div>
          <div className='text-muted small mb-2'>
            Use these exact column names in the header row.
          </div>
          <pre className='mb-0'>
{FEATURE_COLUMNS.join(',')}
          </pre>
        </Card.Body>
      </Card>

      {result ? (
        <Card className='mt-4'>
          <Card.Body>
            <h5 className='mb-2'>Training Result</h5>
            <pre className='mb-0'>{JSON.stringify(result, null, 2)}</pre>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  )
}

export default FraudTraining
