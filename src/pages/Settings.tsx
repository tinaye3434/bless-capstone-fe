import Employees from './Employees'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'
import Currencies from './Currencies'
import Allowances from './Allowances'
import ApprovalStages from './ApprovalStages'

function Settings() {
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
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Settings
