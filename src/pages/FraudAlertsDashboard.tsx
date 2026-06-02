import { useMemo, useState } from 'react'
import { Breadcrumb, Button, Form, Table } from 'react-bootstrap'
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
  FRAUD_DASHBOARD_DATA,
  exportFraudAlertsCsv,
  formatCurrency,
  formatFraudStatus,
  formatPercent,
  getFraudStatusClassName,
  getRiskClassName,
} from '../utils/fraud'

type DateRangeFilter = 'last_30' | 'last_90' | 'year_to_date'
type SortField = 'riskScore' | 'claimAmount' | 'dateSubmitted'

const RISK_COLOR_MAP = {
  Low: '#15803d',
  Medium: '#ca8a04',
  High: '#b91c1c',
}

function FraudAlertsDashboard() {
  const [query, setQuery] = useState('')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('last_90')
  const [department, setDepartment] = useState('all')
  const [riskLevel, setRiskLevel] = useState('all')
  const [sortField, setSortField] = useState<SortField>('riskScore')

  const departments = useMemo(
    () => Array.from(new Set(FRAUD_DASHBOARD_DATA.alerts.map((item) => item.department))),
    [],
  )

  const filteredAlerts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const rows = FRAUD_DASHBOARD_DATA.alerts.filter((row) => {
      const departmentMatch = department === 'all' || row.department === department
      const riskMatch = riskLevel === 'all' || row.riskLevel === riskLevel
      const queryMatch =
        !normalizedQuery ||
        row.alertId.toLowerCase().includes(normalizedQuery) ||
        row.claimNumber.toLowerCase().includes(normalizedQuery) ||
        row.employeeName.toLowerCase().includes(normalizedQuery) ||
        row.department.toLowerCase().includes(normalizedQuery) ||
        row.fraudType.toLowerCase().includes(normalizedQuery)

      return departmentMatch && riskMatch && queryMatch
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
  }, [department, query, riskLevel, sortField])

  const filteredKpis = useMemo(() => {
    const totalAlerts = filteredAlerts.length
    const highRisk = filteredAlerts.filter((row) => row.riskScore >= 80).length
    const underInvestigation = filteredAlerts.filter((row) => row.status === 'under_review').length
    const resolved = filteredAlerts.filter((row) => row.status === 'resolved').length
    const exposure = filteredAlerts.reduce((sum, row) => sum + row.claimAmount, 0)
    const detectionRate =
      FRAUD_DASHBOARD_DATA.kpis.totalClaimsProcessed > 0
        ? (totalAlerts / FRAUD_DASHBOARD_DATA.kpis.totalClaimsProcessed) * 100
        : 0

    return {
      totalClaimsProcessed: FRAUD_DASHBOARD_DATA.kpis.totalClaimsProcessed,
      totalFraudAlertsGenerated: totalAlerts,
      highRiskClaims: highRisk,
      claimsUnderInvestigation: underInvestigation,
      resolvedAlerts: resolved,
      fraudDetectionRate: detectionRate,
      potentialFinancialExposureUsd: exposure,
    }
  }, [filteredAlerts])

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
                  <LineChart data={FRAUD_DASHBOARD_DATA.alertsOverTime}>
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
                      data={FRAUD_DASHBOARD_DATA.riskLevelDistribution}
                      dataKey='count'
                      nameKey='riskLevel'
                      outerRadius={92}
                      label
                    >
                      {FRAUD_DASHBOARD_DATA.riskLevelDistribution.map((entry) => (
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
                  <BarChart data={FRAUD_DASHBOARD_DATA.monthlyDetectionTrends}>
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
                  <BarChart data={FRAUD_DASHBOARD_DATA.alertsByDepartment} layout='vertical'>
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
              <BarChart data={FRAUD_DASHBOARD_DATA.alertsByFraudType}>
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
              {filteredAlerts.map((row) => (
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
                      <Button size='sm' variant='outline-primary'>
                        View
                      </Button>
                      <Button size='sm' variant='outline-warning'>
                        Investigate
                      </Button>
                      <Button size='sm' variant='outline-danger'>
                        Escalate
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
            {FRAUD_DASHBOARD_DATA.categories.map((item) => (
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

      <div className='card mb-4'>
        <div className='card-body'>
          <h5 className='mb-3'>AI Investigation Panel</h5>
          <div className='row g-4'>
            <div className='col-xl-4'>
              <div className='fraud-investigation-block'>
                <div className='fraud-investigation-title'>Financial Verification</div>
                <div className='fraud-detail-row'><span>Claimed Amount</span><strong>{formatCurrency(FRAUD_DASHBOARD_DATA.investigation.claimedAmount)}</strong></div>
                <div className='fraud-detail-row'><span>OCR Extracted Amount</span><strong>{formatCurrency(FRAUD_DASHBOARD_DATA.investigation.ocrExtractedAmount)}</strong></div>
                <div className='fraud-detail-row'><span>Variance %</span><strong>{formatPercent(FRAUD_DASHBOARD_DATA.investigation.variancePercent)}</strong></div>
                <div className='fraud-detail-row'><span>Flag Status</span><span className={getRiskClassName('high')}>{FRAUD_DASHBOARD_DATA.investigation.financialFlagStatus}</span></div>
              </div>
            </div>
            <div className='col-xl-4'>
              <div className='fraud-investigation-block'>
                <div className='fraud-investigation-title'>Distance Verification</div>
                <div className='fraud-detail-row'><span>Claimed Distance</span><strong>{FRAUD_DASHBOARD_DATA.investigation.claimedDistanceKm} km</strong></div>
                <div className='fraud-detail-row'><span>Verified Driving Distance</span><strong>{FRAUD_DASHBOARD_DATA.investigation.verifiedDrivingDistanceKm} km</strong></div>
                <div className='fraud-detail-row'><span>Difference</span><strong>{FRAUD_DASHBOARD_DATA.investigation.distanceDifferenceKm} km</strong></div>
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
                <div className='fraud-detail-row'><span>AI Confidence</span><strong>{FRAUD_DASHBOARD_DATA.investigation.aiConfidenceScore}%</strong></div>
                <div className='fraud-detail-row'><span>Risk Classification</span><span className={getRiskClassName('high')}>{FRAUD_DASHBOARD_DATA.investigation.riskClassification}</span></div>
                <div className='fraud-anomalies-list'>
                  {FRAUD_DASHBOARD_DATA.investigation.detectedAnomalies.map((item) => (
                    <div key={item} className='fraud-anomaly-item'>{item}</div>
                  ))}
                </div>
                <p className='text-muted mb-0'>{FRAUD_DASHBOARD_DATA.investigation.investigationSummary}</p>
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

      <div className='card'>
        <div className='card-body'>
          <h5 className='mb-3'>Recent Critical Alerts</h5>
          <div className='row g-3'>
            {FRAUD_DASHBOARD_DATA.criticalAlerts.map((card) => (
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
    </div>
  )
}

export default FraudAlertsDashboard
