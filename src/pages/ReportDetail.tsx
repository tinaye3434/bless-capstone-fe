import { useEffect, useMemo, useState } from 'react'
import { Alert, Breadcrumb, Button, Form, Spinner, Table } from 'react-bootstrap'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Bar, BarChart, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatClaimStatus } from '../utils/claims'
import {
  type ApprovalAgingReport,
  type AuditActivityReport,
  type ClaimsVolumeReport,
  type FraudTrendsReport,
  type HighRiskExposureReport,
  downloadReportCsv,
  fetchApprovalAgingReport,
  fetchAuditActivityReport,
  fetchClaimsVolumeReport,
  fetchFraudTrendsReport,
  fetchHighRiskExposureReport,
  type ReportFilters,
} from '../utils/reports'
import { getReportByKey, type ReportKey } from '../utils/reportRegistry'

const COLORS = ['#0f766e', '#ca8a04', '#b91c1c', '#1d4ed8', '#7c3aed']

function ReportDetail() {
  const { reportType } = useParams()
  const report = getReportByKey(reportType)

  const [filters, setFilters] = useState<ReportFilters>({ group_by: 'month', risk_level: 'all' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [claimsVolume, setClaimsVolume] = useState<ClaimsVolumeReport | null>(null)
  const [approvalAging, setApprovalAging] = useState<ApprovalAgingReport | null>(null)
  const [fraudTrends, setFraudTrends] = useState<FraudTrendsReport | null>(null)
  const [highRiskExposure, setHighRiskExposure] = useState<HighRiskExposureReport | null>(null)
  const [auditActivity, setAuditActivity] = useState<AuditActivityReport | null>(null)

  const detailKey = report?.key as ReportKey | undefined

  useEffect(() => {
    if (!detailKey) return
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        if (detailKey === 'claims-volume') setClaimsVolume(await fetchClaimsVolumeReport(filters))
        if (detailKey === 'approval-aging') setApprovalAging(await fetchApprovalAgingReport(filters))
        if (detailKey === 'fraud-trends') setFraudTrends(await fetchFraudTrendsReport(filters))
        if (detailKey === 'high-risk-exposure') setHighRiskExposure(await fetchHighRiskExposureReport(filters))
        if (detailKey === 'audit-activity') setAuditActivity(await fetchAuditActivityReport(filters))
      } catch (err) {
        console.error(err)
        setError('Failed to load report.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [detailKey, filters])

  const showRiskFilter = useMemo(
    () => detailKey === 'fraud-trends' || detailKey === 'high-risk-exposure',
    [detailKey],
  )

  if (!report || !detailKey) {
    return <Navigate to='/reports' replace />
  }

  return (
    <div className='reports-dashboard'>
      <div className='d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3'>
        <div>
          <div className='badge-soft mb-2'>Reporting</div>
          <h2 className='page-title mb-1'>{report.title}</h2>
          <Breadcrumb className='mb-0'>
            <Breadcrumb.Item href='/dashboard'>Dashboard</Breadcrumb.Item>
            <Breadcrumb.Item href='/reports'>Reports</Breadcrumb.Item>
            <Breadcrumb.Item active>Detail</Breadcrumb.Item>
          </Breadcrumb>
        </div>
        <div className='d-flex gap-2'>
          <Link to='/reports' className='btn btn-outline-secondary'>Back to Reports</Link>
          <Button variant='primary' onClick={() => void downloadReportCsv(report.endpoint, filters)}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className='card mb-4'>
        <div className='card-body'>
          <div className='row g-3'>
            <div className='col-lg-3 col-md-6'>
              <Form.Label>From</Form.Label>
              <Form.Control type='date' value={filters.from ?? ''} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value || undefined }))} />
            </div>
            <div className='col-lg-3 col-md-6'>
              <Form.Label>To</Form.Label>
              <Form.Control type='date' value={filters.to ?? ''} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value || undefined }))} />
            </div>
            <div className='col-lg-2 col-md-6'>
              <Form.Label>Department</Form.Label>
              <Form.Select value={filters.department ?? 'ALL'} onChange={(e) => setFilters((p) => ({ ...p, department: e.target.value === 'ALL' ? undefined : e.target.value }))}>
                <option value='ALL'>All</option>
                <option value='FINANCE'>Finance</option>
                <option value='HUMAN_RESOURCES'>Human Resources</option>
                <option value='ENGINEERING'>Engineering</option>
              </Form.Select>
            </div>
            {showRiskFilter ? (
              <div className='col-lg-2 col-md-6'>
                <Form.Label>Risk Level</Form.Label>
                <Form.Select value={filters.risk_level ?? 'all'} onChange={(e) => setFilters((p) => ({ ...p, risk_level: e.target.value }))}>
                  <option value='all'>All</option>
                  <option value='high'>High</option>
                  <option value='medium'>Medium</option>
                  <option value='low'>Low</option>
                </Form.Select>
              </div>
            ) : null}
            <div className='col-lg-2 col-md-6'>
              <Form.Label>Group By</Form.Label>
              <Form.Select value={filters.group_by ?? 'month'} onChange={(e) => setFilters((p) => ({ ...p, group_by: e.target.value as 'day' | 'week' | 'month' }))}>
                <option value='day'>Day</option>
                <option value='week'>Week</option>
                <option value='month'>Month</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </div>

      {loading ? <div className='card'><div className='card-body text-center py-5'><Spinner animation='border' size='sm' className='me-2' />Loading report...</div></div> : null}
      {error ? <Alert variant='danger'>{error}</Alert> : null}

      {!loading && !error && detailKey === 'claims-volume' && claimsVolume ? (
        <div className='card'><div className='card-body'>
          <div className='reports-chart'><ResponsiveContainer width='100%' height={320}><LineChart data={claimsVolume.series}><XAxis dataKey='period' /><YAxis /><Tooltip /><Line dataKey='total' stroke='#0f766e' strokeWidth={3} /><Line dataKey='pending' stroke='#ca8a04' /><Line dataKey='approved' stroke='#15803d' /><Line dataKey='rejected' stroke='#b91c1c' /></LineChart></ResponsiveContainer></div>
          <Table hover responsive><thead><tr><th>Period</th><th>Pending</th><th>Approved</th><th>Rejected</th><th>Total</th></tr></thead><tbody>{claimsVolume.series.map((r) => <tr key={r.period}><td>{r.period}</td><td>{r.pending}</td><td>{r.approved}</td><td>{r.rejected}</td><td>{r.total}</td></tr>)}</tbody></Table>
        </div></div>
      ) : null}

      {!loading && !error && detailKey === 'approval-aging' && approvalAging ? (
        <div className='card'><div className='card-body'>
          <div className='reports-chart'><ResponsiveContainer width='100%' height={260}><BarChart data={Object.entries(approvalAging.summary.buckets).map(([bucket, count]) => ({ bucket, count }))}><XAxis dataKey='bucket' /><YAxis /><Tooltip /><Bar dataKey='count' fill='#1d4ed8' /></BarChart></ResponsiveContainer></div>
          <Table hover responsive><thead><tr><th>Claim</th><th>Employee</th><th>Stage</th><th>Submitted</th><th>Age Days</th><th>Bucket</th><th>Total</th></tr></thead><tbody>{approvalAging.rows.map((r) => <tr key={r.claim_id}><td>{r.claim_id}</td><td>{r.employee_name}</td><td>{r.stage}</td><td>{r.submitted_date}</td><td>{r.age_days}</td><td>{r.aging_bucket}</td><td>{r.total_amount.toFixed(2)}</td></tr>)}</tbody></Table>
        </div></div>
      ) : null}

      {!loading && !error && detailKey === 'fraud-trends' && fraudTrends ? (
        <div className='card'><div className='card-body'>
          <div className='row g-4'><div className='col-xl-7'><div className='reports-chart'><ResponsiveContainer width='100%' height={260}><LineChart data={fraudTrends.trend_series}><XAxis dataKey='period' /><YAxis /><Tooltip /><Line dataKey='alerts' stroke='#b91c1c' strokeWidth={3} /></LineChart></ResponsiveContainer></div></div><div className='col-xl-5'><div className='reports-chart'><ResponsiveContainer width='100%' height={260}><PieChart><Pie data={fraudTrends.type_breakdown} dataKey='count' nameKey='fraud_type' outerRadius={90}>{fraudTrends.type_breakdown.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></div></div>
          <Table hover responsive><thead><tr><th>Fraud Type</th><th>Count</th></tr></thead><tbody>{fraudTrends.type_breakdown.map((r) => <tr key={r.fraud_type}><td>{r.fraud_type}</td><td>{r.count}</td></tr>)}</tbody></Table>
        </div></div>
      ) : null}

      {!loading && !error && detailKey === 'high-risk-exposure' && highRiskExposure ? (
        <div className='card'><div className='card-body'>
          <div className='d-flex gap-3 mb-3'><span className='badge-soft'>High-Risk Claims: {highRiskExposure.summary.high_risk_claims}</span><span className='badge-soft'>Total Exposure: ${highRiskExposure.summary.total_exposure.toFixed(2)}</span></div>
          <Table hover responsive><thead><tr><th>Claim</th><th>Employee</th><th>Department</th><th>Amount</th><th>Risk</th><th>Level</th><th>Submitted</th><th>Status</th></tr></thead><tbody>{highRiskExposure.rows.map((r) => <tr key={r.claim_id}><td>{r.claim_id}</td><td>{r.employee_name}</td><td>{r.department}</td><td>{r.claim_amount.toFixed(2)}</td><td>{r.risk_score.toFixed(1)}</td><td>{r.risk_level}</td><td>{r.submitted_date}</td><td>{formatClaimStatus(r.approval_status)}</td></tr>)}</tbody></Table>
        </div></div>
      ) : null}

      {!loading && !error && detailKey === 'audit-activity' && auditActivity ? (
        <div className='card'><div className='card-body'>
          <div className='reports-chart'><ResponsiveContainer width='100%' height={260}><BarChart data={auditActivity.actions}><XAxis dataKey='action' /><YAxis /><Tooltip /><Bar dataKey='count' fill='#0f766e' /></BarChart></ResponsiveContainer></div>
          <Table hover responsive><thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target User</th><th>Metadata</th></tr></thead><tbody>{auditActivity.rows.map((r) => <tr key={`${r.timestamp}-${r.action}`}><td>{new Date(r.timestamp).toLocaleString()}</td><td>{r.actor || '-'}</td><td>{r.action}</td><td>{r.target_user || '-'}</td><td><code>{JSON.stringify(r.metadata)}</code></td></tr>)}</tbody></Table>
        </div></div>
      ) : null}
    </div>
  )
}

export default ReportDetail
