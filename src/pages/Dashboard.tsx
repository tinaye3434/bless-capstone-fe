import { Link } from 'react-router-dom'
import { isAdmin, isApprover } from '../utils/auth'
import DashboardZimbabweHeatmap from '../components/DashboardZimbabweHeatmap'

function Dashboard() {
  const canManageClaims = isAdmin() || isApprover()
  const showSettings = isAdmin()

  return (
    <div>
      <div className='mb-4'>
        <div className='badge-soft mb-2'>Travel Claims</div>
        <h2 className='page-title'>Welcome back</h2>
        <p className='page-subtitle'>
          Track submissions, review approvals, and keep reimbursements moving.
        </p>
      </div>

      <div className='row g-4 mb-4'>
        <div className='col-md-4'>
          <div className='stat-card'>
            <h6>Pending Claims</h6>
            <div className='stat-value'>--</div>
            <div className='text-muted'>Awaiting review</div>
          </div>
        </div>
        <div className='col-md-4'>
          <div className='stat-card'>
            <h6>Flagged for Review</h6>
            <div className='stat-value'>--</div>
            <div className='text-muted'>Needs attention</div>
          </div>
        </div>
        <div className='col-md-4'>
          <div className='stat-card'>
            <h6>Approved This Month</h6>
            <div className='stat-value'>--</div>
            <div className='text-muted'>Completed reimbursements</div>
          </div>
        </div>
      </div>

      <div className='row g-4'>
        <div className='col-lg-7'>
          <div className='card'>
            <div className='card-body'>
              <h5 className='mb-2'>Quick Actions</h5>
              <p className='text-muted'>
                Start a new claim or jump straight into the approval queue.
              </p>
              <div className='d-flex flex-wrap gap-2'>
                <Link to='/create-claim' className='btn btn-primary'>
                  Create Claim
                </Link>
                <Link to='/my-claims' className='btn btn-outline-primary'>
                  View My Claims
                </Link>
                {canManageClaims ? (
                  <Link to='/all-claims' className='btn btn-outline-primary'>
                    Review Claims
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
              <h5 className='mb-2'>Workflow Snapshot</h5>
              <p className='text-muted mb-3'>
                Check how claims are moving through each stage.
              </p>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <span>Submitted</span>
                <span className='badge-soft'>--</span>
              </div>
              <div className='d-flex justify-content-between align-items-center mb-2'>
                <span>Under Review</span>
                <span className='badge-soft'>--</span>
              </div>
              <div className='d-flex justify-content-between align-items-center'>
                <span>Approved</span>
                <span className='badge-soft'>--</span>
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
