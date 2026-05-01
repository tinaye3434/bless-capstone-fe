import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { getDisplayName, getUser, isAdmin, isApprover } from '../utils/auth'
import DashboardZimbabweHeatmap from '../components/DashboardZimbabweHeatmap'
import {
  APPROVAL_STAGES_ENDPOINT,
  CLAIMS_ENDPOINT,
  EMPLOYEES_ENDPOINT,
  getEmployeeLabel,
  getFinalStageId,
  mapClaimRow,
  normalizeClaimsResponse,
  normalizeEmployeesResponse,
  normalizeStagesResponse,
  type ClaimApi,
  type ClaimRow,
  type Employee,
} from '../utils/claims'

function Dashboard() {
  const currentUser = getUser()
  const canManageClaims = isAdmin() || isApprover()
  const showSettings = isAdmin()
  const [claims, setClaims] = useState<ClaimApi[]>([])
  const [claimRows, setClaimRows] = useState<ClaimRow[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      setError(null)
      try {
        const [claimsResponse, employeesResponse, stagesResponse] = await Promise.all([
          axios.get(CLAIMS_ENDPOINT),
          axios.get(EMPLOYEES_ENDPOINT),
          axios.get(APPROVAL_STAGES_ENDPOINT),
        ])

        const normalizedClaims = normalizeClaimsResponse(claimsResponse.data)
        const normalizedEmployees = normalizeEmployeesResponse(employeesResponse.data)
        const stages = normalizeStagesResponse(stagesResponse.data)
        const finalStageId = getFinalStageId(stages)
        const employeeMap = new Map(
          normalizedEmployees.map((employee) => [String(employee.id), getEmployeeLabel(employee)]),
        )

        setClaims(normalizedClaims)
        setEmployees(normalizedEmployees)
        setClaimRows(normalizedClaims.map((claim) => mapClaimRow(claim, employeeMap, finalStageId)))
      } catch (fetchError) {
        setError('Failed to load dashboard insights.')
        console.error(fetchError)
      }
    }

    void fetchDashboardData()
  }, [])

  const currentEmployeeIds = useMemo(() => {
    const currentUserId = String(currentUser?.id ?? '')
    if (!currentUserId) {
      return new Set<string>()
    }

    return new Set(
      employees
        .filter((employee) => String(employee.user_id ?? '') === currentUserId)
        .map((employee) => String(employee.id)),
    )
  }, [currentUser, employees])

  const myClaims = useMemo(
    () => claims.filter((claim) => currentEmployeeIds.has(String(claim.employee_id ?? ''))),
    [claims, currentEmployeeIds],
  )

  const myClaimRows = useMemo(
    () => claimRows.filter((claim) => currentEmployeeIds.has(String(claim.employee_id ?? ''))),
    [claimRows, currentEmployeeIds],
  )

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const pendingMyClaims = myClaimRows.filter((claim) => claim.status === 'pending').length
  const approvedThisMonth = myClaims.filter((claim) => {
    if ((claim.approval_status ?? '').toLowerCase() !== 'approved' || !claim.departure_date) {
      return false
    }
    const departure = new Date(claim.departure_date)
    return departure.getMonth() === currentMonth && departure.getFullYear() === currentYear
  }).length
  const travelDaysThisMonth = myClaims.reduce((sum, claim) => {
    if (!claim.departure_date) {
      return sum
    }
    const departure = new Date(claim.departure_date)
    if (departure.getMonth() !== currentMonth || departure.getFullYear() !== currentYear) {
      return sum
    }
    return sum + Number(claim.days ?? 0)
  }, 0)
  const pendingReviews = claimRows.filter(
    (claim) => claim.status === 'pending' && claim.documents_submitted,
  ).length

  const canCreateClaim = useMemo(() => {
    if (currentEmployeeIds.size === 0) {
      return true
    }

    return !claimRows.some(
      (claim) =>
        currentEmployeeIds.has(String(claim.employee_id ?? '')) &&
        claim.status === 'pending' &&
        !claim.documents_submitted,
    )
  }, [claimRows, currentEmployeeIds])

  return (
    <div>
      <div className='mb-4'>
        <div className='badge-soft mb-2'>Travel Claims</div>
        <h2 className='page-title'>Welcome back, {getDisplayName(currentUser)}</h2>
        <p className='page-subtitle'>
          Your dashboard reflects your own claims, receipts, approvals, and workflow activity.
        </p>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}

      <div className='row g-4 mb-4'>
        <div className='col-md-3'>
          <div className='stat-card'>
            <h6>My Pending Claims</h6>
            <div className='stat-value'>{pendingMyClaims}</div>
            <div className='text-muted'>Still moving through approval</div>
          </div>
        </div>
        <div className='col-md-3'>
          <div className='stat-card'>
            <h6>Approved This Month</h6>
            <div className='stat-value'>{approvedThisMonth}</div>
            <div className='text-muted'>Claims completed this month</div>
          </div>
        </div>
        <div className='col-md-3'>
          <div className='stat-card'>
            <h6>Travel Days This Month</h6>
            <div className='stat-value'>{travelDaysThisMonth}</div>
            <div className='text-muted'>Based on your current month claims</div>
          </div>
        </div>
        <div className='col-md-3'>
          <div className='stat-card'>
            <h6>{canManageClaims ? 'Pending Reviews' : 'My Claims'}</h6>
            <div className='stat-value'>{canManageClaims ? pendingReviews : myClaimRows.length}</div>
            <div className='text-muted'>
              {canManageClaims ? 'Submitted claims waiting for action' : 'Claims linked to your account'}
            </div>
          </div>
        </div>
      </div>

      <div className='row g-4'>
        <div className='col-lg-7'>
          <div className='card'>
            <div className='card-body'>
              <h5 className='mb-2'>Quick Actions</h5>
              <p className='text-muted'>
                Start work from the actions that matter most for your role.
              </p>
              {!canCreateClaim ? (
                <Alert variant='warning' className='mb-3'>
                  Submit receipts for your previous pending claim before creating a new one.
                </Alert>
              ) : null}
              <div className='d-flex flex-wrap gap-2'>
                {canCreateClaim ? (
                  <Link to='/create-claim' className='btn btn-primary'>
                    Create Claim
                  </Link>
                ) : null}
                <Link to='/my-claims' className='btn btn-outline-primary'>
                  View My Claims
                </Link>
                <Link to='/profile' className='btn btn-outline-primary'>
                  View Profile
                </Link>
                {canManageClaims ? (
                  <Link to='/pending-claims' className='btn btn-outline-primary'>
                    Review Queue
                  </Link>
                ) : null}
                {showSettings ? (
                  <Link to='/settings' className='btn btn-outline-primary'>
                    Admin Settings
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>
        <div className='col-lg-5'>
          <div className='card'>
            <div className='card-body'>
              <h5 className='mb-2'>Your Snapshot</h5>
              <p className='text-muted mb-3'>
                A quick summary of your current travel-claim activity.
              </p>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <span>Registered Employee Profile</span>
                <span className='badge-soft'>{currentEmployeeIds.size > 0 ? 'Yes' : 'No'}</span>
              </div>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <span>Claims Submitted</span>
                <span className='badge-soft'>{myClaimRows.length}</span>
              </div>
              <div className='d-flex justify-content-between align-items-center'>
                <span>Role</span>
                <span className='badge-soft'>{currentUser?.role ?? 'EMPLOYEE'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='mt-4'>
        <div className='mb-3'>
          <h4 className='mb-1'>Zimbabwe Travel Heat Map</h4>
          <p className='text-muted mb-0'>
            Claim origins and destinations plotted against your Zimbabwe location registry.
          </p>
        </div>
        <DashboardZimbabweHeatmap />
      </div>
    </div>
  )
}

export default Dashboard
