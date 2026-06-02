import axios from 'axios'

export type ReportFilters = {
  from?: string
  to?: string
  department?: string
  risk_level?: string
  group_by?: 'day' | 'week' | 'month'
}

export type ClaimsVolumeReport = {
  summary: { pending: number; approved: number; rejected: number; total: number }
  group_by: string
  series: Array<{ period: string; pending: number; approved: number; rejected: number; total: number }>
}

export type ApprovalAgingReport = {
  summary: { pending_claims: number; buckets: Record<string, number> }
  rows: Array<{
    claim_id: number
    employee_name: string
    stage: string
    submitted_date: string
    age_days: number
    aging_bucket: string
    total_amount: number
  }>
}

export type FraudTrendsReport = {
  summary: { total_alerts: number; risk_distribution: Record<string, number> }
  trend_series: Array<{ period: string; alerts: number }>
  type_breakdown: Array<{ fraud_type: string; count: number }>
}

export type HighRiskExposureReport = {
  summary: { high_risk_claims: number; total_exposure: number }
  rows: Array<{
    claim_id: number
    employee_name: string
    department: string
    claim_amount: number
    risk_score: number
    risk_level: string
    submitted_date: string
    approval_status: string
  }>
}

export type AuditActivityReport = {
  summary: { total_events: number }
  actions: Array<{ action: string; count: number }>
  rows: Array<{
    timestamp: string
    actor: string
    action: string
    target_user: string
    metadata: Record<string, unknown>
  }>
}

const REPORTS_BASE = '/api/reports'

const buildParams = (filters: ReportFilters) => {
  const params = new URLSearchParams()
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.department && filters.department !== 'ALL') params.set('department', filters.department)
  if (filters.risk_level && filters.risk_level !== 'all') params.set('risk_level', filters.risk_level)
  if (filters.group_by) params.set('group_by', filters.group_by)
  return params.toString()
}

const fetchReport = async <T>(endpoint: string, filters: ReportFilters): Promise<T> => {
  const query = buildParams(filters)
  const { data } = await axios.get<T>(`${REPORTS_BASE}/${endpoint}${query ? `?${query}` : ''}`)
  return data
}

export const fetchClaimsVolumeReport = (filters: ReportFilters) =>
  fetchReport<ClaimsVolumeReport>('claims-volume', filters)
export const fetchApprovalAgingReport = (filters: ReportFilters) =>
  fetchReport<ApprovalAgingReport>('approval-aging', filters)
export const fetchFraudTrendsReport = (filters: ReportFilters) =>
  fetchReport<FraudTrendsReport>('fraud-trends', filters)
export const fetchHighRiskExposureReport = (filters: ReportFilters) =>
  fetchReport<HighRiskExposureReport>('high-risk-exposure', filters)
export const fetchAuditActivityReport = (filters: ReportFilters) =>
  fetchReport<AuditActivityReport>('audit-activity', filters)

export const downloadReportCsv = async (endpoint: string, filters: ReportFilters) => {
  const params = new URLSearchParams(buildParams(filters))
  params.set('format', 'csv')
  const response = await axios.get(`${REPORTS_BASE}/${endpoint}?${params.toString()}`, {
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${endpoint}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
