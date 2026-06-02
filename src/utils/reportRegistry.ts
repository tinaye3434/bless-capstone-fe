export type ReportKey =
  | 'claims-volume'
  | 'approval-aging'
  | 'fraud-trends'
  | 'high-risk-exposure'
  | 'audit-activity'

export type ReportMeta = {
  key: ReportKey
  title: string
  description: string
  endpoint: ReportKey
  route: string
}

export const REPORTS_REGISTRY: ReportMeta[] = [
  {
    key: 'claims-volume',
    title: 'Claims Status & Volume Trend',
    description: 'Tracks total claims and status split (pending, approved, rejected) over time.',
    endpoint: 'claims-volume',
    route: '/reports/claims-volume',
  },
  {
    key: 'approval-aging',
    title: 'Approval Aging Report',
    description: 'Shows pending claims aging by bucket and approval-stage backlog signals.',
    endpoint: 'approval-aging',
    route: '/reports/approval-aging',
  },
  {
    key: 'fraud-trends',
    title: 'Fraud Alerts Trend & Type Breakdown',
    description: 'Displays fraud alert trends and anomaly-type distribution for investigation focus.',
    endpoint: 'fraud-trends',
    route: '/reports/fraud-trends',
  },
  {
    key: 'high-risk-exposure',
    title: 'High-Risk Exposure Report',
    description: 'Lists high-risk claims and potential financial exposure by department and claimant.',
    endpoint: 'high-risk-exposure',
    route: '/reports/high-risk-exposure',
  },
  {
    key: 'audit-activity',
    title: 'Audit Trail Activity Report',
    description: 'Captures approval/admin actions with actor and timestamp for compliance audits.',
    endpoint: 'audit-activity',
    route: '/reports/audit-activity',
  },
]

export const getReportByKey = (key: string | undefined) =>
  REPORTS_REGISTRY.find((report) => report.key === key)
