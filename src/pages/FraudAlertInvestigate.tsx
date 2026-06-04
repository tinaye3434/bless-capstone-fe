import { useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  formatCurrency,
  formatDisplayValue,
  getRiskClassName,
  type FraudAlertDetail,
} from '../utils/fraud'

const FRAUD_ALERT_ENDPOINT = (id: string) => `/api/fraud/alerts/${id}/`
const FRAUD_ALERT_INVESTIGATE_ENDPOINT = (id: string) => `/api/fraud/alerts/${id}/investigate/`

function FraudAlertInvestigate() {
  const { fraudScoreId } = useParams()
  const navigate = useNavigate()
  const [alert, setAlert] = useState<FraudAlertDetail | null>(null)
  const [findings, setFindings] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const flagReasons = alert?.risk.flagReasons.map(formatDisplayValue).filter(Boolean) ?? []

  useEffect(() => {
    if (!fraudScoreId) {
      return
    }

    const fetchAlert = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get<FraudAlertDetail>(FRAUD_ALERT_ENDPOINT(fraudScoreId))
        setAlert(response.data)
        setFindings(response.data.investigationFindings ?? '')
      } catch (fetchError) {
        setError('Failed to load fraud alert.')
        console.error(fetchError)
      } finally {
        setLoading(false)
      }
    }

    void fetchAlert()
  }, [fraudScoreId])

  const submitFindings = async () => {
    if (!fraudScoreId) {
      return
    }

    const trimmedFindings = findings.trim()
    if (!trimmedFindings) {
      setError('Investigation findings are required.')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post(FRAUD_ALERT_INVESTIGATE_ENDPOINT(fraudScoreId), {
        findings: trimmedFindings,
      })
      setSuccess('Investigation findings saved.')
      navigate(`/fraud-alerts/${fraudScoreId}`)
    } catch (saveError) {
      if (axios.isAxiosError(saveError)) {
        const detail = (saveError.response?.data as { detail?: string } | undefined)?.detail
        setError(detail || 'Failed to save investigation findings.')
      } else {
        setError('Failed to save investigation findings.')
      }
      console.error(saveError)
    } finally {
      setSaving(false)
    }
  }

  if (!fraudScoreId) {
    return <Alert variant='danger'>Missing fraud alert id.</Alert>
  }

  return (
    <div>
      <div className='d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4'>
        <div>
          <div className='badge-soft mb-2'>Fraud Investigation</div>
          <h2 className='page-title mb-1'>{alert?.alertId ?? `Alert #${fraudScoreId}`}</h2>
          <p className='page-subtitle mb-0'>Record review findings for this flagged claim.</p>
        </div>
        <div className='d-flex gap-2 flex-wrap'>
          <Link to='/fraud-alerts' className='btn btn-outline-secondary'>
            Back to Alerts
          </Link>
          <Link to={`/fraud-alerts/${fraudScoreId}`} className='btn btn-outline-primary'>
            View Details
          </Link>
        </div>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}
      {success ? <Alert variant='success'>{success}</Alert> : null}

      {loading ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          Loading fraud alert...
        </div>
      ) : null}

      {alert ? (
        <div className='row g-4'>
          <div className='col-xl-5'>
            <Card className='h-100'>
              <Card.Body>
                <h5 className='mb-3'>Alert Summary</h5>
                <div className='d-flex justify-content-between py-2 border-bottom'>
                  <span className='text-muted'>Claim</span>
                  <strong>{alert.claim.claimNumber}</strong>
                </div>
                <div className='d-flex justify-content-between py-2 border-bottom'>
                  <span className='text-muted'>Employee</span>
                  <strong>{alert.claim.employeeName}</strong>
                </div>
                <div className='d-flex justify-content-between py-2 border-bottom'>
                  <span className='text-muted'>Amount</span>
                  <strong>{formatCurrency(alert.claim.total)}</strong>
                </div>
                <div className='d-flex justify-content-between py-2 border-bottom'>
                  <span className='text-muted'>Risk</span>
                  <span className={getRiskClassName(alert.risk.riskLevel)}>
                    {alert.risk.score.toFixed(1)} {alert.risk.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div className='mt-3'>
                  <div className='text-muted small mb-2'>Flag reasons</div>
                  <div className='d-grid gap-2'>
                    {flagReasons.length === 0 ? (
                      <div className='p-3 rounded border bg-light-subtle'>No rule messages recorded.</div>
                    ) : (
                      flagReasons.map((reason, index) => (
                        <div key={`${reason}-${index}`} className='p-3 rounded border bg-light-subtle'>
                          {reason}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
          <div className='col-xl-7'>
            <Card>
              <Card.Body>
                <h5 className='mb-3'>Investigation Findings</h5>
                <Form.Group controlId='fraudInvestigationFindings'>
                  <Form.Label>Findings</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={12}
                    value={findings}
                    onChange={(event) => setFindings(event.target.value)}
                    placeholder='Capture what was reviewed, evidence found, conversations, documents checked, and recommended next steps.'
                    disabled={saving}
                  />
                </Form.Group>
                <div className='d-flex justify-content-end gap-2 mt-3'>
                  <Button variant='outline-secondary' onClick={() => navigate(-1)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button variant='primary' onClick={() => void submitFindings()} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Findings'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default FraudAlertInvestigate
