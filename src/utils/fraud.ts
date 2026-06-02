export type RiskLevel = 'low' | 'medium' | 'high'

export type FraudAlertStatus = 'open' | 'under_review' | 'confirmed_fraud' | 'resolved'

export type FraudKpis = {
  totalClaimsProcessed: number
  totalFraudAlertsGenerated: number
  highRiskClaims: number
  claimsUnderInvestigation: number
  resolvedAlerts: number
  fraudDetectionRate: number
  potentialFinancialExposureUsd: number
}

export type FraudTrendPoint = {
  label: string
  alerts: number
}

export type FraudDepartmentPoint = {
  department: string
  alerts: number
}

export type FraudTypePoint = {
  fraudType: string
  alerts: number
}

export type RiskDistributionPoint = {
  riskLevel: 'Low' | 'Medium' | 'High'
  count: number
}

export type FraudCategoryMetric = {
  name: string
  count: number
  severity: RiskLevel
}

export type FraudAlertRow = {
  alertId: string
  claimNumber: string
  employeeName: string
  department: string
  claimAmount: number
  riskScore: number
  fraudType: string
  dateSubmitted: string
  status: FraudAlertStatus
  riskLevel: RiskLevel
}

export type InvestigationRecord = {
  alertId: string
  claimedAmount: number
  ocrExtractedAmount: number
  variancePercent: number
  financialFlagStatus: 'Flagged' | 'Clear'
  claimedDistanceKm: number
  verifiedDrivingDistanceKm: number
  distanceDifferenceKm: number
  aiConfidenceScore: number
  riskClassification: 'Low' | 'Medium' | 'High'
  detectedAnomalies: string[]
  investigationSummary: string
}

export type CriticalAlertCard = {
  title: string
  description: string
  value: string
  severity: RiskLevel
}

export const FRAUD_DASHBOARD_DATA: {
  kpis: FraudKpis
  alertsOverTime: FraudTrendPoint[]
  monthlyDetectionTrends: FraudTrendPoint[]
  alertsByDepartment: FraudDepartmentPoint[]
  alertsByFraudType: FraudTypePoint[]
  riskLevelDistribution: RiskDistributionPoint[]
  categories: FraudCategoryMetric[]
  alerts: FraudAlertRow[]
  investigation: InvestigationRecord
  criticalAlerts: CriticalAlertCard[]
} = {
  kpis: {
    totalClaimsProcessed: 1248,
    totalFraudAlertsGenerated: 186,
    highRiskClaims: 42,
    claimsUnderInvestigation: 28,
    resolvedAlerts: 119,
    fraudDetectionRate: 14.9,
    potentialFinancialExposureUsd: 218430,
  },
  alertsOverTime: [
    { label: 'May 24', alerts: 11 },
    { label: 'Jun 24', alerts: 13 },
    { label: 'Jul 24', alerts: 16 },
    { label: 'Aug 24', alerts: 15 },
    { label: 'Sep 24', alerts: 17 },
    { label: 'Oct 24', alerts: 20 },
    { label: 'Nov 24', alerts: 18 },
    { label: 'Dec 24', alerts: 14 },
    { label: 'Jan 25', alerts: 19 },
    { label: 'Feb 25', alerts: 21 },
    { label: 'Mar 25', alerts: 22 },
    { label: 'Apr 25', alerts: 24 },
  ],
  monthlyDetectionTrends: [
    { label: 'Jan', alerts: 19 },
    { label: 'Feb', alerts: 21 },
    { label: 'Mar', alerts: 22 },
    { label: 'Apr', alerts: 24 },
    { label: 'May', alerts: 18 },
    { label: 'Jun', alerts: 20 },
  ],
  alertsByDepartment: [
    { department: 'Finance', alerts: 38 },
    { department: 'Operations', alerts: 31 },
    { department: 'Procurement', alerts: 26 },
    { department: 'HR', alerts: 18 },
    { department: 'ICT', alerts: 14 },
    { department: 'Projects', alerts: 22 },
  ],
  alertsByFraudType: [
    { fraudType: 'Receipt mismatch', alerts: 44 },
    { fraudType: 'Duplicate receipt', alerts: 31 },
    { fraudType: 'Mileage anomaly', alerts: 27 },
    { fraudType: 'Out-of-policy expense', alerts: 24 },
    { fraudType: 'Missing documents', alerts: 20 },
    { fraudType: 'Per diem excess', alerts: 16 },
  ],
  riskLevelDistribution: [
    { riskLevel: 'Low', count: 63 },
    { riskLevel: 'Medium', count: 81 },
    { riskLevel: 'High', count: 42 },
  ],
  categories: [
    { name: 'Receipt Amount Mismatch (>5% variance)', count: 44, severity: 'high' },
    { name: 'OCR Extraction Discrepancies', count: 29, severity: 'medium' },
    { name: 'Suspicious Mileage Claims', count: 27, severity: 'high' },
    { name: 'Claimed Distance Exceeds Verified Driving Distance', count: 23, severity: 'high' },
    { name: 'Duplicate Receipt Submission', count: 31, severity: 'high' },
    { name: 'Reused Receipt Detection', count: 17, severity: 'medium' },
    { name: 'Missing Supporting Documents', count: 20, severity: 'medium' },
    { name: 'Excessive Per Diem Claims', count: 16, severity: 'medium' },
    { name: 'Out-of-Policy Expenses', count: 24, severity: 'high' },
    { name: 'Multiple Claims for Same Trip', count: 11, severity: 'low' },
  ],
  alerts: [
    {
      alertId: 'FA-2026-001',
      claimNumber: 'CLM-7821',
      employeeName: 'Tendai Moyo',
      department: 'Finance',
      claimAmount: 1285.4,
      riskScore: 93,
      fraudType: 'Duplicate Receipt Submission',
      dateSubmitted: '2026-05-24',
      status: 'under_review',
      riskLevel: 'high',
    },
    {
      alertId: 'FA-2026-002',
      claimNumber: 'CLM-7825',
      employeeName: 'Rudo Chikafu',
      department: 'Operations',
      claimAmount: 945.12,
      riskScore: 88,
      fraudType: 'Receipt Amount Mismatch',
      dateSubmitted: '2026-05-25',
      status: 'open',
      riskLevel: 'high',
    },
    {
      alertId: 'FA-2026-003',
      claimNumber: 'CLM-7833',
      employeeName: 'Munashe Dube',
      department: 'HR',
      claimAmount: 420.55,
      riskScore: 71,
      fraudType: 'Missing Supporting Documents',
      dateSubmitted: '2026-05-26',
      status: 'resolved',
      riskLevel: 'medium',
    },
    {
      alertId: 'FA-2026-004',
      claimNumber: 'CLM-7839',
      employeeName: 'Ashley Sibanda',
      department: 'Projects',
      claimAmount: 1678.92,
      riskScore: 96,
      fraudType: 'Claimed Distance Exceeds Verified Driving Distance',
      dateSubmitted: '2026-05-26',
      status: 'confirmed_fraud',
      riskLevel: 'high',
    },
    {
      alertId: 'FA-2026-005',
      claimNumber: 'CLM-7842',
      employeeName: 'John Ncube',
      department: 'ICT',
      claimAmount: 590,
      riskScore: 62,
      fraudType: 'OCR Extraction Discrepancies',
      dateSubmitted: '2026-05-27',
      status: 'under_review',
      riskLevel: 'medium',
    },
    {
      alertId: 'FA-2026-006',
      claimNumber: 'CLM-7848',
      employeeName: 'Precious Mhlanga',
      department: 'Procurement',
      claimAmount: 1122.8,
      riskScore: 54,
      fraudType: 'Excessive Per Diem Claims',
      dateSubmitted: '2026-05-29',
      status: 'open',
      riskLevel: 'low',
    },
  ],
  investigation: {
    alertId: 'FA-2026-004',
    claimedAmount: 1678.92,
    ocrExtractedAmount: 1297.4,
    variancePercent: 29.4,
    financialFlagStatus: 'Flagged',
    claimedDistanceKm: 514,
    verifiedDrivingDistanceKm: 378,
    distanceDifferenceKm: 136,
    aiConfidenceScore: 97,
    riskClassification: 'High',
    detectedAnomalies: [
      'Mileage exceeds route baseline by 36%',
      'Receipt serial appears in prior claim CLM-7510',
      'Per diem line item is 2.1x policy threshold',
    ],
    investigationSummary:
      'AI verification indicates a high probability of coordinated claim inflation involving duplicated receipt metadata and overstated route distance.',
  },
  criticalAlerts: [
    {
      title: 'Highest Risk Claim',
      description: 'Risk score 96, Projects department',
      value: 'CLM-7839',
      severity: 'high',
    },
    {
      title: 'Largest Financial Discrepancy',
      description: 'Variance between claimed and OCR totals',
      value: '$381.52',
      severity: 'high',
    },
    {
      title: 'Recently Detected Fraud Cases',
      description: 'Last 7 days confirmed fraud',
      value: '8 cases',
      severity: 'medium',
    },
    {
      title: 'Unresolved Alerts',
      description: 'Open and under-review alerts',
      value: '67 alerts',
      severity: 'medium',
    },
  ],
}

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export const formatPercent = (value: number) => `${value.toFixed(1)}%`

export const formatFraudStatus = (status: FraudAlertStatus): string => {
  const byStatus: Record<FraudAlertStatus, string> = {
    open: 'Open',
    under_review: 'Under Review',
    confirmed_fraud: 'Confirmed Fraud',
    resolved: 'Resolved',
  }
  return byStatus[status]
}

export const getFraudStatusClassName = (status: FraudAlertStatus): string => {
  if (status === 'resolved') {
    return 'claim-status-pill claim-status-approved'
  }
  if (status === 'confirmed_fraud') {
    return 'claim-status-pill claim-status-rejected'
  }
  if (status === 'under_review') {
    return 'claim-status-pill claim-status-pending'
  }
  return 'claim-status-pill claim-status-unknown'
}

export const getRiskClassName = (scoreOrLevel: number | RiskLevel): string => {
  const level =
    typeof scoreOrLevel === 'number'
      ? scoreOrLevel >= 80
        ? 'high'
        : scoreOrLevel >= 60
          ? 'medium'
          : 'low'
      : scoreOrLevel

  if (level === 'high') {
    return 'risk-indicator risk-indicator-high'
  }
  if (level === 'medium') {
    return 'risk-indicator risk-indicator-medium'
  }
  return 'risk-indicator risk-indicator-low'
}

export const exportFraudAlertsCsv = (
  rows: FraudAlertRow[],
  filters: { dateRange: string; department: string; riskLevel: string; query: string },
) => {
  const headers = [
    'Alert ID',
    'Claim Number',
    'Employee Name',
    'Department',
    'Claim Amount',
    'Risk Score',
    'Fraud Type',
    'Date Submitted',
    'Status',
  ]
  const content = rows.map((row) => [
    row.alertId,
    row.claimNumber,
    row.employeeName,
    row.department,
    row.claimAmount.toFixed(2),
    String(row.riskScore),
    row.fraudType,
    row.dateSubmitted,
    formatFraudStatus(row.status),
  ])

  const filterNotes = [
    ['Date Range', filters.dateRange],
    ['Department', filters.department],
    ['Risk Level', filters.riskLevel],
    ['Search Query', filters.query || 'All'],
  ]

  const lines = [
    'Fraud Alerts Export',
    ...filterNotes.map(([k, v]) => `"${k}","${String(v).replace(/"/g, '""')}"`),
    '',
    headers.join(','),
    ...content.map((cols) => cols.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
  ]

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'fraud-alerts.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
