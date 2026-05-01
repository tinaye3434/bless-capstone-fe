import { useState } from 'react'
import axios from 'axios'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import businessTravelHero from '../assets/business-travel-hero.jpg'
import { setAuth, type AuthPayload } from '../utils/auth'

const LOGIN_ENDPOINT = '/api/auth/login/'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await axios.post(LOGIN_ENDPOINT, {
        username: username.trim(),
        password,
      })
      const payload = response.data as AuthPayload
      setAuth(payload)
      axios.defaults.headers.common.Authorization = `Token ${payload.token}`
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid username or password.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='auth-shell'>
      <div className='auth-layout auth-layout-login'>
        <section className='auth-showcase'>
          <div className='auth-showcase-media'>
            <img src={businessTravelHero} alt='Business travel at the airport' />
          </div>
          <div className='auth-showcase-overlay' />
          <div className='auth-showcase-content'>
            <span className='auth-showcase-badge'>Travel & Subsistence Portal</span>
            <h1 className='auth-showcase-heading'>
              Track travel claims from one secure workspace.
            </h1>
            <p className='auth-showcase-copy'>
              Monitor approvals and reimbursement progress in one place.
            </p>

            <div className='auth-showcase-points'>
              <div className='auth-showcase-point'>
                <strong>Real-time updates</strong>
                <span>Follow every claim stage without manual follow-ups.</span>
              </div>
              <div className='auth-showcase-point'>
                <strong>Secure document handling</strong>
                <span>Keep receipts and approvals in one protected flow.</span>
              </div>
            </div>
          </div>
        </section>

        <section className='auth-panel'>
          <div className='auth-panel-top'>
            <Link to='/' className='auth-back-link'>
              Back to Home
            </Link>
            <span className='auth-panel-alt-copy'>
              Need an account? <Link to='/signup'>Register</Link>
            </span>
          </div>

          <div className='auth-panel-intro'>
            <span className='auth-panel-kicker'>Welcome back</span>
            <h2 className='auth-panel-title'>Log in to your account</h2>
            <p className='auth-panel-subtitle'>
              Continue to your dashboard to submit and track claims.
            </p>
          </div>

          {error ? (
            <Alert variant='danger' className='auth-error-alert'>
              {error}
            </Alert>
          ) : null}

          <Form onSubmit={handleSubmit} className='auth-form-stack'>
            <div className='auth-form-section'>
              <div className='auth-form-section-header'>
                <h3>Account access</h3>
                <p>Use the same credentials you created during registration.</p>
              </div>

              <Form.Group controlId='loginUsername'>
                <Form.Label>Username</Form.Label>
                <Form.Control
                  name='username'
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete='username'
                  placeholder='Enter your username'
                  required
                />
              </Form.Group>

              <Form.Group controlId='loginPassword'>
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type='password'
                  name='password'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete='current-password'
                  placeholder='Enter your password'
                  required
                />
              </Form.Group>
            </div>

            <Button type='submit' variant='primary' disabled={loading} className='auth-submit'>
              {loading ? (
                <>
                  <Spinner animation='border' size='sm' className='me-2' />
                  Signing in...
                </>
              ) : (
                'Log In'
              )}
            </Button>
          </Form>
        </section>
      </div>
    </div>
  )
}

export default Login
