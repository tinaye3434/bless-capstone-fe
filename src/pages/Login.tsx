import { useState } from 'react'
import axios from 'axios'
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { setAuth } from '../utils/auth'

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
      const payload = response.data as { token: string; user: unknown }
      setAuth(payload)
      axios.defaults.headers.common.Authorization = `Token ${payload.token}`
      navigate('/')
    } catch (err) {
      setError('Invalid username or password.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='d-flex justify-content-center align-items-center' style={{ minHeight: '70vh' }}>
      <Card style={{ width: 420 }}>
        <Card.Body>
          <h5 className='mb-3'>Sign In</h5>
          {error ? <Alert variant='danger'>{error}</Alert> : null}
          <Form onSubmit={handleSubmit}>
            <Form.Group className='mb-3' controlId='loginUsername'>
              <Form.Label>Username</Form.Label>
              <Form.Control
                name='username'
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete='username'
                required
              />
            </Form.Group>
            <Form.Group className='mb-3' controlId='loginPassword'>
              <Form.Label>Password</Form.Label>
              <Form.Control
                type='password'
                name='password'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete='current-password'
                required
              />
            </Form.Group>
            <Button type='submit' variant='primary' disabled={loading} className='w-100'>
              {loading ? (
                <>
                  <Spinner animation='border' size='sm' className='me-2' />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Login
