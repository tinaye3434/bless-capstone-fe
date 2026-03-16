import Employees from './Employees'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import Allowances from './Allowances'
import ApprovalStages from './ApprovalStages'
import { isAdmin } from '../utils/auth'
import Alert from 'react-bootstrap/Alert'
import Users from './Users'
import Thresholds from './Thresholds'

function Settings() {
  const showAdminTabs = isAdmin()

  if (!showAdminTabs) {
    return <Alert variant='danger'>You do not have permission to view settings.</Alert>
  }

  return (
    <>
      <div className='row'>
        <div className='col-md-12'>
          <div className='card'>
            <div className='card-body'>
              <Tabs
                defaultActiveKey='employees'
                id='fill-tab-example'
                className='mb-3 nav nav-tabs nav-line'
                fill
              >
                <Tab eventKey='employees' title='Employees'>
                  <Employees />
                </Tab>
                <Tab eventKey='allowances' title='Allowances'>
                  <Allowances />
                </Tab>
                <Tab eventKey='approval-stages' title='Approval Stages'>
                  <ApprovalStages />
                </Tab>
                <Tab eventKey='users' title='Users'>
                  <Users />
                </Tab>
                <Tab eventKey='thresholds' title='Thresholds'>
                  <Thresholds />
                </Tab>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
