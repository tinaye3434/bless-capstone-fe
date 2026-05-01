import { Link } from 'react-router-dom'
import businessTravelHero from '../assets/business-travel-hero.jpg'

const featureCards = [
  {
    title: 'Easy Submission',
    text: 'Fill out the form in minutes with a simple and intuitive process.',
    tone: 'blue',
  },
  {
    title: 'Real-time Tracking',
    text: 'Track the status of your claim at every stage of the process.',
    tone: 'mint',
  },
  {
    title: 'Secure & Compliant',
    text: 'Your data is safe with us. We ensure compliance and confidentiality.',
    tone: 'gold',
  },
  {
    title: 'Faster Reimbursement',
    text: 'Streamlined approvals help you get reimbursed faster.',
    tone: 'violet',
  },
] as const

const workflowSteps = [
  {
    title: 'Create your claim',
    text: 'Start a new travel and subsistence claim with journey details, dates, and supporting notes.',
  },
  {
    title: 'Upload proof',
    text: 'Attach required receipts once so reviewers have everything in one place.',
  },
  {
    title: 'Track and reimburse',
    text: 'Follow approvals in real time and respond quickly if any clarification is needed.',
  },
] as const

const guidelineItems = [
  'Confirm travel dates, destinations, and claim amounts before submitting.',
  'Upload clear receipts for fuel and out of station allowances to avoid processing delays.',
  'Check the tracking screen regularly so missing information is resolved early.',
] as const

const contactItems = [
  { label: 'Support desk', value: 'travelclaims@uz.ac.zw' },
  { label: 'Office hours', value: 'Monday to Friday, 8:00 AM to 4:30 PM' },
  {
    label: 'Response target',
    value: 'Most first-line queries are answered within one business day',
  },
] as const

const footerLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Guidelines', href: '#guidelines' },
  { label: 'Contact', href: '#contact' },
] as const

function BrandIcon() {
  return (
    <svg viewBox='0 0 48 48' aria-hidden='true'>
      <rect x='4' y='4' width='40' height='40' rx='11' fill='currentColor' opacity='0.18' />
      <rect x='10' y='10' width='28' height='28' rx='8' fill='currentColor' />
      <path
        d='M19 29.5L26.5 22M25 17.5L29.5 18.5L30.5 23M18 18.5V15.5C18 14.7 18.7 14 19.5 14H23M14.5 18H17.5M16 16.5L14 18.5L16 20.5'
        fill='none'
        stroke='#ffffff'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2.2'
      />
    </svg>
  )
}

function SubmitIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M14 3H7.5A2.5 2.5 0 0 0 5 5.5v13A2.5 2.5 0 0 0 7.5 21h9A2.5 2.5 0 0 0 19 18.5V8z'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
      <path
        d='M14 3v5h5M12 11v6M9 14h6'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
    </svg>
  )
}

function TrackIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M6 18V11M12 18V6M18 18v-9'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.9'
      />
      <path
        d='M4 20h16'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.9'
      />
    </svg>
  )
}

function PaperPlaneIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M20 4L11 13M20 4L14 20L11 13L4 10z'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M12 3l7 3v5c0 4.6-2.8 7.9-7 10-4.2-2.1-7-5.4-7-10V6z'
        fill='none'
        stroke='currentColor'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
      <path
        d='M9.5 12.2l1.8 1.8 3.7-3.7'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6.5A2.5 2.5 0 0 1 4 15.5z'
        fill='none'
        stroke='currentColor'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
      <path
        d='M16 12h4M8 8V6.5A1.5 1.5 0 0 1 9.5 5H18'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
      <circle cx='16' cy='12' r='1' fill='currentColor' />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M7 10a5 5 0 1 1 10 0c0 4 1.6 5.8 2 6H5c.4-.2 2-2 2-6z'
        fill='none'
        stroke='currentColor'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
      <path
        d='M10.5 19a1.5 1.5 0 0 0 3 0'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeWidth='1.9'
      />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true'>
      <path
        d='M5 12h14M13 6l6 6-6 6'
        fill='none'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='1.9'
      />
    </svg>
  )
}

function FeatureIcon({ tone }: { tone: (typeof featureCards)[number]['tone'] }) {
  if (tone === 'mint') {
    return <PaperPlaneIcon />
  }

  if (tone === 'gold') {
    return <ShieldIcon />
  }

  if (tone === 'violet') {
    return <WalletIcon />
  }

  return <SubmitIcon />
}

function LandingPage() {
  return (
    <div className='ts-landing-page' id='home'>
      <div className='ts-landing-shell'>
        <header className='ts-landing-header'>
          <div className='ts-landing-header-inner'>
            <div className='ts-landing-brand'>
              <span className='ts-landing-brand-mark'>
                <BrandIcon />
              </span>
              <div className='ts-landing-brand-title'>Travel &amp; Subsistence</div>
            </div>

            <nav className='ts-landing-nav' aria-label='Landing page'>
              <a href='#home' className='ts-landing-nav-link active'>
                Home
              </a>
              <a href='#about' className='ts-landing-nav-link'>
                About
              </a>
              <a href='#how-it-works' className='ts-landing-nav-link'>
                How It Works
              </a>
              <a href='#guidelines' className='ts-landing-nav-link'>
                Guidelines
              </a>
              <a href='#contact' className='ts-landing-nav-link'>
                Contact
              </a>
            </nav>

            <div className='ts-landing-auth-group'>
              <Link to='/login' className='ts-landing-auth-link ts-landing-auth-link-secondary'>
                Login
              </Link>
              <Link to='/signup' className='ts-landing-auth-link'>
                Register
              </Link>
            </div>
          </div>
        </header>

        <section className='ts-landing-hero'>
          <div className='ts-landing-photo-panel'>
            <div className='ts-landing-photo-label'>Business travel</div>
            <img
              src={businessTravelHero}
              alt='Suitcase and backpack at an airport terminal window'
              className='ts-landing-photo'
            />
          </div>

          <div className='ts-landing-hero-inner'>
            <div className='ts-landing-copy'>
              <h1 className='ts-landing-title'>
                <span className='ts-landing-title-line'>TRAVEL &amp;</span>
                <span className='ts-landing-title-line'>SUBSISTENCE FORM</span>
              </h1>
              <p className='ts-landing-tagline'>Submit. Track. Reimburse. Simplified.</p>
              <p className='ts-landing-description'>
                Easily submit your travel and subsistence claims, track approvals in real-time, and
                get reimbursed faster - all in one place.
              </p>

              <div className='ts-landing-actions'>
                <Link to='/signup' className='ts-landing-button ts-landing-button-primary'>
                  <span className='ts-landing-button-icon'>
                    <SubmitIcon />
                  </span>
                  Submit New Claim
                </Link>
                <Link to='/login' className='ts-landing-button ts-landing-button-secondary'>
                  <span className='ts-landing-button-icon'>
                    <TrackIcon />
                  </span>
                  Track My Claim
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className='ts-landing-notice'>
          <div className='ts-landing-notice-inner'>
            <div className='ts-landing-notice-icon'>
              <BellIcon />
            </div>
            <div className='ts-landing-notice-copy'>
              <h2>Important Notice</h2>
              <p>
                Please ensure all information is accurate and all required receipts are uploaded to
                avoid delays in processing your claim.
              </p>
            </div>
            <a href='#guidelines' className='ts-landing-guideline-link'>
              View Guidelines
              <span className='ts-landing-inline-icon'>
                <ArrowRightIcon />
              </span>
            </a>
          </div>
        </section>

        <section className='ts-landing-section ts-landing-section-about section-anchor' id='about'>
          <div className='ts-landing-section-inner'>
            <div className='ts-landing-section-heading'>
              <span className='ts-landing-detail-label'>About</span>
              <h2>One travel claims portal for submissions, approvals, and reimbursements.</h2>
              <p>
                The system brings claim creation, review visibility, reimbursement follow-up, and
                compliance checks into one clear workflow for staff and reviewers.
              </p>
            </div>

            <div className='ts-landing-feature-grid'>
              {featureCards.map((feature) => (
                <article key={feature.title} className='ts-landing-feature-card'>
                  <span className={`ts-landing-feature-icon ${feature.tone}`}>
                    <FeatureIcon tone={feature.tone} />
                  </span>
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className='ts-landing-section ts-landing-section-workflow section-anchor'
          id='how-it-works'
        >
          <div className='ts-landing-section-inner ts-landing-section-split'>
            <div className='ts-landing-section-heading'>
              <span className='ts-landing-detail-label'>How It Works</span>
              <h2>Move from submission to approval without the usual back and forth.</h2>
              <p>
                Staff submit once, attach required receipts, and follow progress while reviewers
                act from a single workflow view.
              </p>
            </div>

            <div className='ts-landing-detail-panel'>
              <div className='ts-landing-step-list'>
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className='ts-landing-step-item'>
                    <span className='ts-landing-step-number'>{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className='ts-landing-section ts-landing-section-guidelines section-anchor'
          id='guidelines'
        >
          <div className='ts-landing-section-inner ts-landing-section-split'>
            <div className='ts-landing-section-heading'>
              <span className='ts-landing-detail-label'>Guidelines</span>
              <h2>Keep every claim review-ready from the moment you submit it.</h2>
              <p>
                Strong submissions reduce processing delays and help reviewers verify travel claims
                more quickly and consistently.
              </p>
            </div>

            <div className='ts-landing-detail-panel'>
              <div className='ts-landing-guideline-list'>
                {guidelineItems.map((item) => (
                  <div key={item} className='ts-landing-guideline-item'>
                    <span className='ts-landing-guideline-bullet' />
                    <p>{item}</p>
                  </div>
                ))}
              </div>
              <div className='ts-landing-guideline-callout'>
                <strong>Processing tip</strong>
                <p>
                  Claims with complete dates, destinations, amounts, and readable attachments move
                  through review much faster.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className='ts-landing-footer section-anchor' id='contact'>
          <div className='ts-landing-footer-inner'>
            <div className='ts-landing-footer-brand'>
              <div className='ts-landing-brand'>
                <span className='ts-landing-brand-mark'>
                  <BrandIcon />
                </span>
                <div className='ts-landing-brand-title'>Travel &amp; Subsistence</div>
              </div>
              <p>
                A modern claims portal for travel submissions, compliance, approval tracking, and
                faster reimbursement across the institution.
              </p>
              <div className='ts-landing-footer-actions'>
                <Link to='/signup' className='ts-landing-button ts-landing-button-primary'>
                  Submit a Claim
                </Link>
                <Link to='/login' className='ts-landing-button ts-landing-button-secondary'>
                  Login
                </Link>
              </div>
            </div>

            <div className='ts-landing-footer-column'>
              <h3>Quick Links</h3>
              <div className='ts-landing-footer-links'>
                {footerLinks.map((item) => (
                  <a key={item.label} href={item.href}>
                    {item.label}
                  </a>
                ))}
              </div>
            </div>

            <div className='ts-landing-footer-column'>
              <h3>Support</h3>
              <div className='ts-landing-footer-support'>
                {contactItems.map((item) => (
                  <div key={item.label} className='ts-landing-footer-support-item'>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className='ts-landing-footer-column'>
              <h3>Contact</h3>
              <div className='ts-landing-footer-meta'>
                <p>For urgent reimbursement or claim status queries, contact the support desk.</p>
                <a href='mailto:travelclaims@uz.ac.zw'>travelclaims@uz.ac.zw</a>
                <span>Travel &amp; Subsistence Portal</span>
              </div>
            </div>

            <div className='ts-landing-footer-bottom'>
              <span>Travel &amp; Subsistence Claim Management</span>
              <span>Built for clear approvals, accountable documentation, and faster payouts.</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage
