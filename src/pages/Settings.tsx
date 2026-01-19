import Employees from './Employees'
import Tab from 'react-bootstrap/Tab'
import Tabs from 'react-bootstrap/Tabs'

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
                <Tab eventKey='currencies' title='Currencies'>
                  Tab content for Profile
                </Tab>
                <Tab eventKey='grade-ranges' title='Grade Ranges'>
                  Tab content for Loooonger Tab
                </Tab>
                <Tab eventKey='allowances' title='Allowances'>
                  Tab content for Loooonger Tab
                </Tab>
                <Tab eventKey='approval-stages' title='Approval Stages'>
                  Tab content for Loooonger Tab
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
