import { useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Form, Spinner, Table } from 'react-bootstrap'
import { getUser, updateStoredUser } from '../utils/auth'

type User = {
  id: number | string
  username: string
  email?: string
  first_name?: string
  last_name?: string
  role?: string
  is_active?: boolean
}

const USERS_ENDPOINT = '/api/users/'
const USER_ROLE_ENDPOINT = (userId: number | string) => `/api/users/${userId}/role/`
const RESET_ENDPOINT = '/api/auth/password-reset/'
const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'APPROVER', label: 'Approver' },
  { value: 'ADMIN', label: 'System Administrator' },
  { value: 'SUPERUSER', label: 'Super User' },
]

function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await axios.get<User[]>(USERS_ENDPOINT)
        setUsers(Array.isArray(response.data) ? response.data : [])
      } catch (err) {
        setError('Failed to load users.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchUsers()
  }, [])

  const handleResetPassword = async (userId: string) => {
    setResettingId(userId)
    setError(null)
    setSuccess(null)
    try {
      const response = await axios.post(RESET_ENDPOINT, { user_id: userId })
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
      setResettingId(null)
    }
  }

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingRoleId(userId)
    setError(null)
    setSuccess(null)
    try {
      const response = await axios.post<User>(USER_ROLE_ENDPOINT(userId), { role })
      const updatedUser = response.data
      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          String(user.id) === userId ? { ...user, role: updatedUser.role } : user,
        ),
      )

      if (String(getUser()?.id) === userId) {
        updateStoredUser({ role: updatedUser.role })
      }

      setSuccess(`Role updated to ${updatedUser.role}.`)
    } catch (err) {
      setError('Failed to update role.')
      console.error(err)
    } finally {
      setUpdatingRoleId(null)
    }
  }

  const getDisplayName = (user: User) => {
    const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
    return name || user.username
  }

  return (
    <div>
      <h6 className='mb-3'>System Users</h6>
      {error ? <Alert variant='danger'>{error}</Alert> : null}
      {success ? <Alert variant='success'>{success}</Alert> : null}
      {loading ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          Loading users...
        </div>
      ) : (
        <Table hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className='text-center py-4'>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={String(user.id)}>
                  <td>{index + 1}</td>
                  <td>{getDisplayName(user)}</td>
                  <td>{user.username}</td>
                  <td>{user.email || '-'}</td>
                  <td style={{ minWidth: 220 }}>
                    <Form.Select
                      size='sm'
                      value={user.role || 'EMPLOYEE'}
                      onChange={(event) =>
                        void handleRoleChange(String(user.id), event.target.value)
                      }
                      disabled={updatingRoleId === String(user.id)}
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </td>
                  <td>{user.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <Button
                      variant='outline-primary'
                      size='sm'
                      onClick={() => handleResetPassword(String(user.id))}
                      disabled={
                        resettingId === String(user.id) || updatingRoleId === String(user.id)
                      }
                    >
                      {resettingId === String(user.id) ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </div>
  )
}

export default Users
