import { Breadcrumb } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { REPORTS_REGISTRY } from '../utils/reportRegistry'

function Reports() {
  return (
    <div className='reports-dashboard'>
      <div className='mb-4'>
        <div className='badge-soft mb-2'>Reporting</div>
        <h2 className='page-title mb-1'>Reports Center</h2>
        <Breadcrumb className='mb-0'>
          <Breadcrumb.Item href='/dashboard'>Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item active>Reports</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <div className='reports-gallery-grid'>
        {REPORTS_REGISTRY.map((report) => (
          <article className='reports-gallery-card' key={report.key}>
            <h5>{report.title}</h5>
            <p>{report.description}</p>
            <Link to={report.route} className='btn btn-outline-primary btn-sm'>
              Open Report
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

export default Reports
