import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Breadcrumb, Button, Form, Modal, Spinner, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  exportFraudAlertsCsv,
  formatCurrency,
  formatFraudStatus,
  formatPercent,
  getFraudStatusClassName,
  getRiskClassName,
  type FraudDashboardData,
} from '../utils/fraud'

type DateRangeFilter = 'last_30' | 'last_90' | 'year_to_date'
type SortField = 'riskScore' | 'claimAmount' | 'dateSubmitted'

const RISK_COLOR_MAP = {
  Low: '#15803d',
  Medium: '#ca8a04',
  High: '#b91c1c',
}

const FRAUD_ALERTS_DASHBOARD_ENDPOINT = '/api/fraud/alerts-dashboard/'
const FRAUD_ALERT_RESOLVE_ENDPOINT = (id: number) => `/api/fraud/alerts/${id}/resolve/`

const emptyDashboardData: FraudDashboardData = {
  kpis: {
    totalClaimsProcessed: 0,
    totalFraudAlertsGenerated: 0,
    highRiskClaims: 0,
    claimsUnderInvestigation: 0,
    resolvedAlerts: 0,
    fraudDetectionRate: 0,
    potentialFinancialExposureUsd: 0,
  },
  alertsOverTime: [],
  monthlyDetectionTrends: [],
  alertsByDepartment: [],
  alertsByFraudType: [],
  riskLevelDistribution: [
    { riskLevel: 'Low', count: 0 },
    { riskLevel: 'Medium', count: 0 },
    { riskLevel: 'High', count: 0 },
  ],
  categories: [],
  alerts: [],
  investigation: null,
  criticalAlerts: [],
}

const isWithinDateRange = (dateSubmitted: string, range: DateRangeFilter) => {
  const submitted = new Date(dateSubmitted)
  if (Number.isNaN(submitted.getTime())) {
    return true
  }

  const now = new Date()
  if (range === 'year_to_date') {
    return submitted.getFullYear() === now.getFullYear()
  }

  const days = range === 'last_30' ? 30 : 90
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return submitted >= cutoff
}

function FraudAlertsDashboard() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('last_90')
  const [department, setDepartment] = useState('all')
  const [riskLevel, setRiskLevel] = useState('all')
  const [sortField, setSortField] = useState<SortField>('riskScore')
  const [dashboardData, setDashboardData] = useState<FraudDashboardData>(emptyDashboardData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resolveAlert, setResolveAlert] = useState<{
    fraudScoreId: number
    alertId: string
    claimNumber: string
  } | null>(null)
  const [resolveJustification, setResolveJustification] = useState('')
  const [resolving, setResolving] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<FraudDashboardData>(FRAUD_ALERTS_DASHBOARD_ENDPOINT)
      setDashboardData({
        ...emptyDashboardData,
        ...response.data,
        kpis: {
          ...emptyDashboardData.kpis,
          ...(response.data.kpis ?? {}),
        },
        investigation: response.data.investigation ?? null,
      })
    } catch (fetchError) {
      setError('Failed to load real fraud alert data.')
      console.error(fetchError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDashboardData()
  }, [fetchDashboardData])

  const closeResolveModal = () => {
    if (resolving) {
      return
    }
    setResolveAlert(null)
    setResolveJustification('')
  }

  const submitResolve = async () => {
    if (!resolveAlert) {
      return
    }

    const trimmedJustification = resolveJustification.trim()
    if (!trimmedJustification) {
      setError('Resolution justification is required.')
      return
    }

    setResolving(true)
    setError(null)
    setSuccess(null)

    try {
      await axios.post(FRAUD_ALERT_RESOLVE_ENDPOINT(resolveAlert.fraudScoreId), {
        justification: trimmedJustification,
      })
      setSuccess(`${resolveAlert.alertId} resolved.`)
      setResolveAlert(null)
      setResolveJustification('')
      await fetchDashboardData()
    } catch (resolveError) {
      if (axios.isAxiosError(resolveError)) {
        const detail = (resolveError.response?.data as { detail?: string } | undefined)?.detail
        setError(detail || 'Failed to resolve fraud alert.')
      } else {
        setError('Failed to resolve fraud alert.')
      }
      console.error(resolveError)
    } finally {
      setResolving(false)
    }
  }

  const departments = useMemo(
    () => Array.from(new Set(dashboardData.alerts.map((item) => item.department))),
    [dashboardData.alerts],
  )

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const rows = dashboardData.alerts.filter((row) => {
      const departmentMatch = department === 'all' || row.department === department
      const riskMatch = riskLevel === 'all' || row.riskLevel === riskLevel
      const dateMatch = isWithinDateRange(row.dateSubmitted, dateRange)
      const queryMatch =
        !normalizedQuery ||
        row.alertId.toLowerCase().includes(normalizedQuery) ||
        row.claimNumber.toLowerCase().includes(normalizedQuery) ||
        row.employeeName.toLowerCase().includes(normalizedQuery) ||
        row.department.toLowerCase().includes(normalizedQuery) ||
        row.fraudType.toLowerCase().includes(normalizedQuery)

      return departmentMatch && riskMatch && dateMatch && queryMatch
    })

    return rows.sort((a, b) => {
      if (sortField === 'riskScore') {
        return b.riskScore - a.riskScore
      }
      if (sortField === 'claimAmount') {
        return b.claimAmount - a.claimAmount
      }
      return new Date(b.dateSubmitted).getTime() - new Date(a.dateSubmitted).getTime()
    })
  }, [dashboardData.alerts, dateRange, department, query, riskLevel, sortField])

  const filteredKpis = useMemo(() => {
    const totalAlerts = filteredAlerts.length
    const highRisk = filteredAlerts.filter((row) => row.riskScore >= 80).length
    const underInvestigation = filteredAlerts.filter((row) => row.status === 'under_review').length
    const resolved = filteredAlerts.filter((row) => row.status === 'resolved').length
    const exposure = filteredAlerts.reduce((sum, row) => sum + row.claimAmount, 0)
    const detectionRate =
      dashboardData.kpis.totalClaimsProcessed > 0
        ? (totalAlerts / dashboardData.kpis.totalClaimsProcessed) * 100
        : 0

    return {
      totalClaimsProcessed: dashboardData.kpis.totalClaimsProcessed,
      totalFraudAlertsGenerated: totalAlerts,
      highRiskClaims: highRisk,
      claimsUnderInvestigation: underInvestigation,
      resolvedAlerts: resolved,
      fraudDetectionRate: detectionRate,
      potentialFinancialExposureUsd: exposure,
    }
  }, [dashboardData.kpis.totalClaimsProcessed, filteredAlerts])

  const exportLabel = `Export (${filteredAlerts.length} alerts)`

  return (
    <div className='fraud-dashboard'>
      <div className='d-flex flex-wrap justify-content-between align-items-start mb-3 gap-3'>
        <div>
          <div className='badge-soft mb-2'>Fraud Monitoring</div>
          <h2 className='page-title mb-1'>Fraud Alerts Dashboard</h2>
          <Breadcrumb className='fraud-breadcrumb mb-0'>
            <Breadcrumb.Item href='/dashboard'>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item active>Fraud Alerts</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <Button
          variant='primary'
          onClick={() =>
            exportFraudAlertsCsv(filteredAlerts, {
              dateRange,
              department,
              riskLevel,
              query,
            })
          }
        >
          {exportLabel}
        </Button>
      </div>

      <div className='card mb-4'>
        <div className='card-body'>
          {error ? <Alert variant='danger'>{error}</Alert> : null}
          {success ? <Alert variant='success'>{success}</Alert> : null}
          {loading ? (
            <div className='d-flex align-items-center'>
              <Spinner animation='border' size='sm' className='me-2' />
              Loading real fraud alert data...
            </div>
          ) : null}
          <div className='row g-3'>
            <div className='col-lg-4 col-md-6'>
              <Form.Control
                placeholder='Search alerts, claim numbers, staff, fraud type...'
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <div className='col-lg-2 col-md-6'>
              <Form.Select value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRangeFilter)}>
                <option value='last_30'>Last 30 days</option>
                <option value='last_90'>Last 90 days</option>
                <option value='year_to_date'>Year to date</option>
              </Form.Select>
            </div>
            <div className='col-lg-2 col-md-6'>
              <Form.Select value={department} onChange={(event) => setDepartment(event.target.value)}>
                <option value='all'>All departments</option>
                {departments.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className='col-lg-2 col-md-6'>
              <Form.Select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>
                <option value='all'>All risk levels</option>
                <option value='high'>High</option>
                <option value='medium'>Medium</option>
                <option value='low'>Low</option>
              </Form.Select>
            </div>
            <div className='col-lg-2 col-md-6'>
              <Form.Select value={sortField} onChange={(event) => setSortField(event.target.value as SortField)}>
                <option value='riskScore'>Sort: Risk Score</option>
                <option value='claimAmount'>Sort: Claim Amount</option>
                <option value='dateSubmitted'>Sort: Date</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </div>

      <div className='row g-3 mb-4'>
        <div className='col-xxl col-lg-3 col-md-4 col-sm-6'>
          <div className='stat-card fraud-stat-card'>
            <h6>Total Claims Processed</h6>
            <div className='stat-value'>{filteredKpis.totalClaimsProcessed.toLocaleString()}</div>
          </div>
        </div>
        <div className='col-xxl col-lg-3 col-md-4 col-sm-6'>
          <div className='stat-card fraud-stat-card'>
            <h6>Total Fraud Alerts</h6>
            <div className='stat-value'>{filteredKpis.totalFraudAlertsGenerated}</div>
          </div>
        </div>
        <div className='col-xxl col-lg-3 col-md-4 col-sm-6'>
          <div className='stat-card fraud-stat-card'>
            <h6>High-Risk Claims</h6>
            <div className='stat-value text-danger'>{filteredKpis.highRiskClaims}</div>
          </div>
        </div>
        <div className='col-xxl col-lg-3 col-md-4 col-sm-6'>
          <div className='stat-card fraud-stat-card'>
            <h6>Claims Under Investigation</h6>
            <div className='stat-value text-warning'>{filteredKpis.claimsUnderInvestigation}</div>
          </div>
        </div>
        <div className='col-xxl col-lg-3 col-md-4 col-sm-6'>
          <div className='stat-card fraud-stat-card'>
            <h6>Resolved Alerts</h6>
            <div className='stat-value text-success'>{filteredKpis.resolvedAlerts}</div>
          </div>
        </div>
        <div className='col-xxl col-lg-3 col-md-4 col-sm-6'>
          <div className='stat-card fraud-stat-card'>
            <h6>Fraud Detection Rate</h6>
            <div className='stat-value'>{formatPercent(filteredKpis.fraudDetectionRate)}</div>
          </div>
        </div>
        <div className='col-xxl col-lg-3 col-md-4 col-sm-6'>
          <div className='stat-card fraud-stat-card'>
            <h6>Potential Exposure (USD)</h6>
            <div className='stat-value'>{formatCurrency(filteredKpis.potentialFinancialExposureUsd)}</div>
          </div>
        </div>
      </div>

      <div className='row g-4 mb-4'>
        <div className='col-xl-8'>
          <div className='card h-100'>
            <div className='card-body'>
              <h5 className='mb-3'>Fraud Alerts Over Time</h5>
              <div className='fraud-chart-wrap'>
                <ResponsiveContainer width='100%' height={280}>
                  <LineChart data={dashboardData.alertsOverTime}>
                    <XAxis dataKey='label' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type='monotone' dataKey='alerts' stroke='#0f766e' strokeWidth={3} name='Alerts' />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        <div className='col-xl-4'>
          <div className='card h-100'>
            <div className='card-body'>
              <h5 className='mb-3'>Risk Level Distribution</h5>
              <div className='fraud-chart-wrap'>
                <ResponsiveContainer width='100%' height={280}>
                  <PieChart>
                    <Pie
                      data={dashboardData.riskLevelDistribution}
                      dataKey='count'
                      nameKey='riskLevel'
                      outerRadius={92}
                      label
                    >
                      {dashboardData.riskLevelDistribution.map((entry) => (
                        <Cell key={entry.riskLevel} fill={RISK_COLOR_MAP[entry.riskLevel]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='row g-4 mb-4'>
        <div className='col-xl-6'>
          <div className='card h-100'>
            <div className='card-body'>
              <h5 className='mb-3'>Monthly Fraud Detection Trends</h5>
              <div className='fraud-chart-wrap'>
                <ResponsiveContainer width='100%' height={240}>
                  <BarChart data={dashboardData.monthlyDetectionTrends}>
                    <XAxis dataKey='label' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='alerts' fill='#0f766e' radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        <div className='col-xl-6'>
          <div className='card h-100'>
            <div className='card-body'>
              <h5 className='mb-3'>Alerts by Department</h5>
              <div className='fraud-chart-wrap'>
                <ResponsiveContainer width='100%' height={240}>
                  <BarChart data={dashboardData.alertsByDepartment} layout='vertical'>
                    <XAxis type='number' />
                    <YAxis dataKey='department' type='category' width={96} />
                    <Tooltip />
                    <Bar dataKey='alerts' fill='#115e59' radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='card mb-4'>
        <div className='card-body'>
          <h5 className='mb-3'>Alerts by Fraud Type</h5>
          <div className='fraud-chart-wrap'>
            <ResponsiveContainer width='100%' height={280}>
              <BarChart data={dashboardData.alertsByFraudType}>
                <XAxis dataKey='fraudType' />
                <YAxis />
                <Tooltip />
                <Bar dataKey='alerts' fill='#0f766e' radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className='card mb-4'>
        <div className='card-body'>
          <div className='d-flex justify-content-between align-items-center mb-3'>
            <h5 className='mb-0'>Fraud Alerts Table</h5>
            <span className='badge-soft'>{filteredAlerts.length} records</span>
          </div>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Claim Number</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Claim Amount</th>
                <th>Risk Score</th>
                <th>Fraud Type</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={10} className='text-center py-4 text-muted'>
                    No fraud alerts found from current system data.
                  </td>
                </tr>
              ) : filteredAlerts.map((row) => (
                <tr key={row.alertId}>
                  <td>{row.alertId}</td>
                  <td>{row.claimNumber}</td>
                  <td>{row.employeeName}</td>
                  <td>{row.department}</td>
                  <td>{formatCurrency(row.claimAmount)}</td>
                  <td>
                    <span className={getRiskClassName(row.riskScore)}>{row.riskScore}</span>
                  </td>
                  <td>{row.fraudType}</td>
                  <td>{row.dateSubmitted}</td>
                  <td>
                    <span className={getFraudStatusClassName(row.status)}>{formatFraudStatus(row.status)}</span>
                  </td>
                  <td>
                    <div className='d-flex gap-2 flex-wrap'>
                      <Button
                        size='sm'
                        variant='outline-primary'
                        onClick={() => navigate(`/fraud-alerts/${row.fraudScoreId}`)}
                      >
                        View
                      </Button>
                      <Button
                        size='sm'
                        variant='outline-warning'
                        onClick={() => navigate(`/fraud-alerts/${row.fraudScoreId}/investigate`)}
                      >
                        Investigate
                      </Button>
                      <Button
                        size='sm'
                        variant='outline-success'
                        disabled={row.status === 'resolved'}
                        onClick={() => {
                          setError(null)
                          setSuccess(null)
                          setResolveJustification('')
                          setResolveAlert({
                            fraudScoreId: row.fraudScoreId,
                            alertId: row.alertId,
                            claimNumber: row.claimNumber,
                          })
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      <div className='card mb-4'>
        <div className='card-body'>
          <h5 className='mb-3'>Fraud Detection Categories</h5>
          <div className='fraud-categories-grid'>
            {dashboardData.categories.length === 0 ? (
              <div className='text-muted'>No fraud categories have been detected yet.</div>
            ) : dashboardData.categories.map((item) => (
              <div key={item.name} className='fraud-category-card'>
                <div className='d-flex justify-content-between align-items-center gap-2'>
                  <span>{item.name}</span>
                  <span className={getRiskClassName(item.severity)}>{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {dashboardData.investigation ? (
      <div className='card mb-4'>
        <div className='card-body'>
          <h5 className='mb-3'>AI Investigation Panel</h5>
          <div className='row g-4'>
            <div className='col-xl-4'>
              <div className='fraud-investigation-block'>
                <div className='fraud-investigation-title'>Financial Verification</div>
                <div className='fraud-detail-row'><span>Claimed Amount</span><strong>{formatCurrency(dashboardData.investigation.claimedAmount)}</strong></div>
                <div className='fraud-detail-row'><span>OCR Extracted Amount</span><strong>{dashboardData.investigation.ocrExtractedAmount === null ? '-' : formatCurrency(dashboardData.investigation.ocrExtractedAmount)}</strong></div>
                <div className='fraud-detail-row'><span>Variance %</span><strong>{formatPercent(dashboardData.investigation.variancePercent)}</strong></div>
                <div className='fraud-detail-row'><span>Flag Status</span><span className={getRiskClassName(dashboardData.investigation.financialFlagStatus === 'Flagged' ? 'high' : 'low')}>{dashboardData.investigation.financialFlagStatus}</span></div>
              </div>
            </div>
            <div className='col-xl-4'>
              <div className='fraud-investigation-block'>
                <div className='fraud-investigation-title'>Distance Verification</div>
                <div className='fraud-detail-row'><span>Claimed Distance</span><strong>{dashboardData.investigation.claimedDistanceKm.toFixed(1)} km</strong></div>
                <div className='fraud-detail-row'><span>Verified Driving Distance</span><strong>{dashboardData.investigation.verifiedDrivingDistanceKm.toFixed(1)} km</strong></div>
                <div className='fraud-detail-row'><span>Difference</span><strong>{dashboardData.investigation.distanceDifferenceKm.toFixed(1)} km</strong></div>
                <div className='fraud-route-preview'>
                  <div className='fraud-route-line'></div>
                  <div className='fraud-route-dot start'></div>
                  <div className='fraud-route-dot end'></div>
                  <span>Route Map Preview</span>
                </div>
              </div>
            </div>
            <div className='col-xl-4'>
              <div className='fraud-investigation-block'>
                <div className='fraud-investigation-title'>AI Analysis</div>
                <div className='fraud-detail-row'><span>AI Confidence</span><strong>{dashboardData.investigation.aiConfidenceScore}%</strong></div>
                <div className='fraud-detail-row'><span>Risk Classification</span><span className={getRiskClassName(dashboardData.investigation.riskClassification.toLowerCase() as 'low' | 'medium' | 'high')}>{dashboardData.investigation.riskClassification}</span></div>
                <div className='fraud-anomalies-list'>
                  {dashboardData.investigation.detectedAnomalies.map((item) => (
                    <div key={item} className='fraud-anomaly-item'>{item}</div>
                  ))}
                </div>
                <p className='text-muted mb-0'>{dashboardData.investigation.investigationSummary}</p>
              </div>
            </div>
          </div>
          <div className='d-flex flex-wrap gap-2 mt-4'>
            <Button variant='outline-success'>Approve Claim</Button>
            <Button variant='outline-danger'>Reject Claim</Button>
            <Button variant='outline-warning'>Escalate Investigation</Button>
            <Button variant='primary'>Request Additional Evidence</Button>
          </div>
        </div>
      </div>
      ) : null}

      <div className='card'>
        <div className='card-body'>
          <h5 className='mb-3'>Recent Critical Alerts</h5>
          <div className='row g-3'>
            {dashboardData.criticalAlerts.length === 0 ? (
              <div className='col-12 text-muted'>No critical alerts have been generated yet.</div>
            ) : dashboardData.criticalAlerts.map((card) => (
              <div className='col-lg-3 col-md-6' key={card.title}>
                <div className='fraud-critical-card'>
                  <div className='fraud-critical-title'>{card.title}</div>
                  <div className='fraud-critical-value'>{card.value}</div>
                  <div className='fraud-critical-description'>{card.description}</div>
                  <span className={getRiskClassName(card.severity)}>{card.severity.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal show={resolveAlert !== null} onHide={closeResolveModal} centered>
        <Modal.Header closeButton={!resolving}>
          <Modal.Title>Resolve Fraud Alert</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className='text-muted mb-3'>
            {resolveAlert?.alertId} for {resolveAlert?.claimNumber}
          </p>
          <Form.Group controlId='fraudResolveJustification'>
            <Form.Label>Resolution Justification</Form.Label>
            <Form.Control
              as='textarea'
              rows={5}
              value={resolveJustification}
              onChange={(event) => setResolveJustification(event.target.value)}
              placeholder='Explain why this fraud alert is being resolved.'
              disabled={resolving}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='outline-secondary' onClick={closeResolveModal} disabled={resolving}>
            Cancel
          </Button>
          <Button variant='success' onClick={() => void submitResolve()} disabled={resolving}>
            {resolving ? 'Resolving...' : 'Resolve Alert'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default FraudAlertsDashboard
