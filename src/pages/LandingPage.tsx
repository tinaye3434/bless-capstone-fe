import { Link } from 'react-router-dom'

const benefits = [
  {
    title: 'Insights at your fingertips',
    text: 'See your claims, receipts, and approval progress in one place without chasing spreadsheets or email threads.',
  },
  {
    title: 'Manage in real time',
    text: 'Employees submit trips quickly, approvers act fast, and admins can adjust thresholds and workflows instantly.',
  },
  {
    title: 'Important business alerts',
    text: 'Mileage anomalies, threshold gaming, and repeated route patterns surface before risky claims get approved.',
  },
  {
    title: 'You are in control',
    text: 'Every user lands in a dashboard built around their own role, workload, and next action.',
  },
]

function LandingPage() {
  return (
    <div className='landing-page landing-page-cobalt'>
      <div className='landing-shell'>
        <div className='landing-cobalt-nav'>
          <div className='landing-cobalt-brand'>
            <div className='landing-cobalt-mark'>TC</div>
            <span>Travel Claims</span>
          </div>
          <div className='d-flex gap-2'>
            <Link to='/login' className='btn btn-outline-primary'>
              Login
            </Link>
            <Link to='/signup' className='btn btn-primary'>
              Sign Up
            </Link>
          </div>
        </div>

        <section className='landing-cobalt-hero'>
          <div className='badge-soft mb-3'>Travel Claims System</div>
          <h1 className='landing-cobalt-title'>
            Unleash faster, clearer travel claims for every employee.
          </h1>
          <p className='landing-cobalt-subtitle'>
            Replace outdated claim forms and slow follow-ups with one intuitive platform for
            employee submissions, approver decisions, fraud checks, and admin control.
          </p>
          <div className='d-flex justify-content-center flex-wrap gap-3'>
            <Link to='/signup' className='btn btn-primary btn-lg'>
              Sign Up
            </Link>
            <Link to='/login' className='btn btn-outline-primary btn-lg'>
              Login
            </Link>
          </div>
        </section>

        <section className='landing-cobalt-showcase'>
          <div className='landing-cobalt-device'>
            <div className='landing-cobalt-device-top'>
              <span className='landing-dot' />
              <span className='landing-dot' />
              <span className='landing-dot' />
            </div>
            <div className='landing-cobalt-device-screen'>
              <div className='landing-screen-sidebar'>
                <div className='landing-screen-pill active'>Dashboard</div>
                <div className='landing-screen-pill'>My Claims</div>
                <div className='landing-screen-pill'>Pending</div>
                <div className='landing-screen-pill'>Settings</div>
              </div>
              <div className='landing-screen-main'>
                <div className='landing-screen-hero'>
                  <div>
                    <div className='text-muted small'>Today</div>
                    <h4 className='mb-1'>Your claims at a glance</h4>
                    <div className='text-muted small'>
                      Personalized dashboards for employees, approvers, and admins
                    </div>
                  </div>
                  <div className='badge-soft'>Auto approval active</div>
                </div>
                <div className='landing-screen-stats'>
                  <div className='landing-screen-stat'>
                    <span>Pending claims</span>
                    <strong>03</strong>
                  </div>
                  <div className='landing-screen-stat'>
                    <span>Approved this month</span>
                    <strong>08</strong>
                  </div>
                  <div className='landing-screen-stat'>
                    <span>Flagged alerts</span>
                    <strong>02</strong>
                  </div>
                </div>
                <div className='landing-screen-panels'>
                  <div className='landing-screen-card primary'>
                    <div className='landing-mini-label'>Claim Risk</div>
                    <div className='landing-mini-value'>Low</div>
                    <p>Claims at or below 500 can auto-approve when hard-stop flags are absent.</p>
                  </div>
                  <div className='landing-screen-card'>
                    <div className='landing-mini-label'>Latest Route</div>
                    <div className='landing-route-row'>
                      <span>Harare</span>
                      <span className='landing-route-connector' />
                      <span>Mutare</span>
                    </div>
                    <p>Receipts uploaded and fraud rules attached directly to the claim preview.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='landing-floating-card landing-floating-left'>
            <div className='landing-mini-label'>Large expense alert</div>
            <strong>$2,487.92</strong>
            <p>Rules surface unusual patterns before approval.</p>
          </div>

          <div className='landing-floating-card landing-floating-right'>
            <div className='landing-mini-label'>Approval request</div>
            <strong>Claim #1042</strong>
            <p>Approve or deny with a required justification.</p>
          </div>
        </section>

        <section className='landing-cobalt-intro'>
          <h2>Who said travel claims have to be boring?</h2>
          <p>
            With Travel Claims, employees file faster, approvers review smarter, and admins get
            the visibility they need without drowning in spreadsheets, paper trails, or guesswork.
          </p>
        </section>

        <section className='landing-cobalt-features'>
          {benefits.map((benefit) => (
            <div key={benefit.title} className='landing-cobalt-feature'>
              <h4>{benefit.title}</h4>
              <p>{benefit.text}</p>
            </div>
          ))}
        </section>

        <section className='landing-cobalt-cta'>
          <h2>See where modern claim automation can take your team.</h2>
          <p>
            The first claims tool your employees will enjoy using, and the one your approvers will
            actually trust.
          </p>
          <div className='d-flex justify-content-center flex-wrap gap-3'>
            <Link to='/signup' className='btn btn-primary btn-lg'>
              Create Account
            </Link>
            <Link to='/login' className='btn btn-outline-primary btn-lg'>
              Login
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LandingPage
