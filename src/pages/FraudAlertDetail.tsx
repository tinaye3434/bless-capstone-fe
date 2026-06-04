import { useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Card, Col, Row, Spinner } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  formatCurrency,
  formatDisplayValue,
  formatFraudStatus,
  formatPercent,
  getFraudStatusClassName,
  type FraudAlertDetail as FraudAlertDetailData,
} from '../utils/fraud'

const FRAUD_ALERT_ENDPOINT = (id: string) => `/api/fraud/alerts/${id}/`

const formatDate = (value?: string | null) => {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const formatDistance = (value?: number | null) =>
  value === null || value === undefined ? '-' : `${value.toFixed(1)} km`

function DetailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className='d-flex justify-content-between gap-3 py-2 border-bottom'>
      <span className='text-muted'>{label}</span>
      <strong className='text-end'>{value}</strong>
    </div>
  )
}

function FraudAlertDetail() {
  const { fraudScoreId } = useParams()
  const navigate = useNavigate()
  const [alert, setAlert] = useState<FraudAlertDetailData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const flagReasons = alert?.risk.flagReasons.map(formatDisplayValue).filter(Boolean) ?? []
  const validationMessage = formatDisplayValue(alert?.validation.message)

  useEffect(() => {
    if (!fraudScoreId) {
      return
    }

    const fetchAlert = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get<FraudAlertDetailData>(FRAUD_ALERT_ENDPOINT(fraudScoreId))
        setAlert(response.data)
      } catch (fetchError) {
        setError('Failed to load fraud alert details.')
        console.error(fetchError)
      } finally {
        setLoading(false)
      }
    }

    void fetchAlert()
  }, [fraudScoreId])

  if (!fraudScoreId) {
    return <Alert variant='danger'>Missing fraud alert id.</Alert>
  }

  return (
    <div>
      <div className='d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4'>
        <div>
          <div className='badge-soft mb-2'>Fraud Alert</div>
          <h2 className='page-title mb-1'>{alert?.alertId ?? `Alert #${fraudScoreId}`}</h2>
          <p className='page-subtitle mb-0'>Detailed explanation of why this claim was flagged.</p>
        </div>
        <div className='d-flex gap-2 flex-wrap'>
          <Button variant='outline-secondary' onClick={() => navigate('/fraud-alerts')}>
            Back to Alerts
          </Button>
          {alert ? (
            <>
              <Link to={`/fraud-alerts/${alert.fraudScoreId}/investigate`} className='btn btn-outline-warning'>
                Investigate
              </Link>
              <Link to={`/claims/${alert.claim.id}`} className='btn btn-primary'>
                Claim Preview
              </Link>
            </>
          ) : null}
        </div>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}
      {loading ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          Loading fraud alert...
        </div>
      ) : null}

      {alert ? (
        <>
          <Row className='g-4 mb-4'>
            <Col lg={8}>
              <Card className='h-100'>
                <Card.Body>
                  <div className='d-flex justify-content-between align-items-start gap-3 mb-3'>
                    <div>
                      <h5 className='mb-1'>Why This Claim Was Flagged</h5>
                      <p className='text-muted mb-0'>{alert.risk.fraudType}</p>
                    </div>
                    <span className={getFraudStatusClassName(alert.alertStatus)}>
                      {formatFraudStatus(alert.alertStatus)}
                    </span>
                  </div>

                  {flagReasons.length === 0 ? (
                    <Alert variant='secondary'>No specific rule messages were recorded.</Alert>
                  ) : (
                    <div className='d-grid gap-2'>
                      {flagReasons.map((reason, index) => (
                        <div key={`${reason}-${index}`} className='p-3 rounded border bg-light-subtle'>
                          {reason}
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4}>
              <Card className='h-100'>
                <Card.Body>
                  <h5 className='mb-3'>Risk Summary</h5>
                  <DetailRow label='Risk score' value={alert.risk.score.toFixed(1)} />
                  <DetailRow label='Risk level' value={alert.risk.riskLevel.toUpperCase()} />
                  <DetailRow label='Rule flags' value={alert.risk.ruleFlags.length} />
                  <DetailRow label='Last updated' value={formatDate(alert.risk.updatedAt)} />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className='g-4 mb-4'>
            <Col lg={6}>
              <Card className='h-100'>
                <Card.Body>
                  <h5 className='mb-3'>Claim Context</h5>
                  <DetailRow label='Claim' value={alert.claim.claimNumber} />
                  <DetailRow label='Employee' value={alert.claim.employeeName} />
                  <DetailRow label='Department' value={alert.claim.department} />
                  <DetailRow label='Amount' value={formatCurrency(alert.claim.total)} />
                  <DetailRow label='Route' value={`${alert.claim.origin} to ${alert.claim.destination}`} />
                  <DetailRow label='Approval status' value={alert.claim.approvalStatus} />
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className='h-100'>
                <Card.Body>
                  <h5 className='mb-3'>Validation Signals</h5>
                  <DetailRow label='Validation status' value={alert.validation.status || '-'} />
                  <DetailRow label='OCR status' value={alert.validation.ocrStatus || '-'} />
                  <DetailRow label='Distance status' value={alert.validation.distanceStatus || '-'} />
                  <DetailRow label='Manual review' value={alert.validation.needsManualReview ? 'Yes' : 'No'} />
                  {validationMessage ? (
                    <Alert variant='warning' className='mt-3 mb-0'>
                      {validationMessage}
                    </Alert>
                  ) : null}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className='g-4 mb-4'>
            <Col lg={6}>
              <Card className='h-100'>
                <Card.Body>
                  <h5 className='mb-3'>Distance Verification</h5>
                  <DetailRow label='Claimed distance' value={formatDistance(alert.gps.claimedDistanceKm)} />
                  <DetailRow label='Adjusted driving route' value={formatDistance(alert.gps.adjustedDistanceKm)} />
                  <DetailRow label='Variance' value={formatDistance(alert.gps.varianceKm)} />
                  <DetailRow
                    label='Variance %'
                    value={alert.gps.variancePercent === null ? '-' : formatPercent(alert.gps.variancePercent)}
                  />
                  <DetailRow label='Source' value={alert.gps.source || '-'} />
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className='h-100'>
                <Card.Body>
                  <h5 className='mb-3'>OCR / Receipt Verification</h5>
                  <DetailRow label='Receipts processed' value={alert.ocr.totalReceiptsProcessed} />
                  <DetailRow label='Mismatches' value={alert.ocr.mismatches} />
                  <DetailRow label='Errors' value={alert.ocr.errors} />
                  <DetailRow label='Claimed fee' value={formatCurrency(alert.ocr.claimedFee)} />
                  <DetailRow
                    label='Extracted total'
                    value={alert.ocr.extractedTotal === null ? '-' : formatCurrency(alert.ocr.extractedTotal)}
                  />
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card>
            <Card.Body>
              <h5 className='mb-3'>Recorded Workflow Notes</h5>
              <div className='mb-3'>
                <div className='text-muted small mb-1'>Investigation Findings</div>
                <div className='p-3 rounded border bg-light-subtle'>
                  {alert.investigationFindings || 'No findings recorded yet.'}
                </div>
              </div>
              <div>
                <div className='text-muted small mb-1'>Resolution Justification</div>
                <div className='p-3 rounded border bg-light-subtle'>
                  {alert.resolutionJustification || 'Not resolved yet.'}
                </div>
              </div>
            </Card.Body>
          </Card>
        </>
      ) : null}
    </div>
  )
}

export default FraudAlertDetail
