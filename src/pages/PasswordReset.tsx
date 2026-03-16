import { useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Form, Spinner } from 'react-bootstrap'

type UserOption = {
  id: number | string
  username: string
  email?: string
  role?: string
}

const USERS_ENDPOINT = '/api/users/'
const RESET_ENDPOINT = '/api/auth/password-reset/'

function PasswordReset() {
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true)
      setError(null)
      try {
        const response = await axios.get<UserOption[]>(USERS_ENDPOINT)
        setUsers(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        setError('Failed to load users.')
        console.error(err)
      } finally {
        setLoadingUsers(false)
      }
    }

    void fetchUsers()
  }, [])

  const handleReset = async () => {
    if (!selectedUserId) {
      setError('Select a user first.')
      return
    }
    setResetting(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await axios.post(RESET_ENDPOINT, {
        user_id: selectedUserId,
      })
      const tempPassword = (response.data as { temporary_password?: string }).temporary_password
      setSuccess(
        tempPassword
          ? `Temporary password: ${tempPassword}`
          : 'Password reset successfully.',
      )
    } catch (err) {
      setError('Failed to reset password.')
      console.error(err)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div>
      <h6 className='mb-3'>Password Reset</h6>
      {error ? <Alert variant='danger'>{error}</Alert> : null}
      {success ? <Alert variant='success'>{success}</Alert> : null}
      {loadingUsers ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          Loading users...
        </div>
      ) : (
        <Form>
          <Form.Group className='mb-3' controlId='resetUserSelect'>
            <Form.Label>User</Form.Label>
            <Form.Select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            >
              <option value=''>Choose user...</option>
              {users.map((user) => (
                <option key={String(user.id)} value={String(user.id)}>
                  {user.username} {user.email ? `(${user.email})` : ''}{' '}
                  {user.role ? `- ${user.role}` : ''}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Button variant='primary' type='button' onClick={handleReset} disabled={resetting}>
            {resetting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </Form>
      )}
    </div>
  )
}

export default PasswordReset
