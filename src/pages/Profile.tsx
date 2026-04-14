import { useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Card, Col, Row, Spinner } from 'react-bootstrap'
import { getDisplayName, getInitials, getUser, updateStoredUser, type AuthUser } from '../utils/auth'

const PROFILE_ENDPOINT = '/api/auth/me/'

function Profile() {
  const [user, setUser] = useState<AuthUser | null>(getUser())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await axios.get<AuthUser>(PROFILE_ENDPOINT)
        setUser(response.data)
        updateStoredUser(response.data)
      } catch (err) {
        setError('Failed to load profile.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchProfile()
  }, [])

  return (
    <div>
      <div className='mb-4'>
        <h2 className='page-title'>Profile</h2>
        <p className='page-subtitle'>Your account details and access level.</p>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}

      {loading ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          Loading profile...
        </div>
      ) : user ? (
        <Card>
          <Card.Body>
            <Row className='g-4 align-items-center'>
              <Col md={4} className='text-center text-md-start'>
                <div className='app-avatar-circle app-avatar-circle-lg mx-auto mx-md-0'>
                  {getInitials(user)}
                </div>
              </Col>
              <Col md={8}>
                <h4 className='mb-1'>{getDisplayName(user)}</h4>
                <p className='text-muted mb-4'>{user.email || 'No email address set'}</p>
                <Row className='g-3'>
                  <Col sm={6}>
                    <div className='text-muted small'>Username</div>
                    <div>{user.username}</div>
                  </Col>
                  <Col sm={6}>
                    <div className='text-muted small'>Role</div>
                    <div>{user.role || '-'}</div>
                  </Col>
                  <Col sm={6}>
                    <div className='text-muted small'>First Name</div>
                    <div>{user.first_name || '-'}</div>
                  </Col>
                  <Col sm={6}>
                    <div className='text-muted small'>Last Name</div>
                    <div>{user.last_name || '-'}</div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ) : null}
    </div>
  )
}

export default Profile
