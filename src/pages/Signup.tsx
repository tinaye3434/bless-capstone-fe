import { useEffect, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { setAuth, type AuthPayload } from '../utils/auth'

type EnumValue = string | number
type EnumField = 'department' | 'position' | 'grade' | 'gender'

type EnumOption = {
  value: EnumValue
  label: string
}

type SignupEnums = Record<EnumField, EnumOption[]>

type SignupForm = {
  first_name: string
  surname: string
  email: string
  phone_number: string
  department: string
  position: string
  grade: string
  gender: string
  password: string
  confirm_password: string
}

const ENUMS_ENDPOINT = '/api/enums/'
const SIGNUP_ENDPOINT = '/api/auth/signup/'

const initialForm: SignupForm = {
  first_name: '',
  surname: '',
  email: '',
  phone_number: '',
  department: '',
  position: '',
  grade: '',
  gender: '',
  password: '',
  confirm_password: '',
}

const initialEnums: SignupEnums = {
  department: [],
  position: [],
  grade: [],
  gender: [],
}

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SignupForm>(initialForm)
  const [enums, setEnums] = useState<SignupEnums>(initialEnums)
  const [loadingEnums, setLoadingEnums] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEnums = async () => {
      setLoadingEnums(true)
      try {
        const response = await axios.get<Record<string, EnumOption[]>>(ENUMS_ENDPOINT)
        const data = response.data ?? {}
        setEnums({
          department: Array.isArray(data.department) ? data.department : [],
          position: Array.isArray(data.position) ? data.position : [],
          grade: Array.isArray(data.grade) ? data.grade : [],
          gender: Array.isArray(data.gender) ? data.gender : [],
        })
      } catch (err) {
        setError('Failed to load signup form options.')
        console.error(err)
      } finally {
        setLoadingEnums(false)
      }
    }

    void fetchEnums()
  }, [])

  const handleChange = (event: React.ChangeEvent<any>) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (formData.password !== formData.confirm_password) {
      setError('Password confirmation does not match.')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post(SIGNUP_ENDPOINT, formData)
      const payload = response.data as AuthPayload
      setAuth(payload)
      axios.defaults.headers.common.Authorization = `Token ${payload.token}`
      navigate('/dashboard')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as Record<string, string[] | string> | undefined
        if (data?.detail && typeof data.detail === 'string') {
          setError(data.detail)
        } else if (data) {
          const message = Object.entries(data)
            .map(([field, value]) => `${field}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join(' | ')
          setError(message || 'Signup failed.')
        } else {
          setError('Signup failed.')
        }
      } else {
        setError('Signup failed.')
      }
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='auth-shell'>
      <Card className='auth-card auth-card-wide'>
        <Card.Body>
          <div className='mb-3'>
            <h4 className='mb-1'>Create Your Account</h4>
            <p className='text-muted mb-0'>Sign up with your employee details to access your dashboard.</p>
          </div>
          {error ? <Alert variant='danger'>{error}</Alert> : null}
          <Form onSubmit={handleSubmit}>
            <Row className='g-3'>
              <Col md={6}>
                <Form.Group controlId='signupFirstName'>
                  <Form.Label>First Name</Form.Label>
                  <Form.Control name='first_name' value={formData.first_name} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupSurname'>
                  <Form.Label>Surname</Form.Label>
                  <Form.Control name='surname' value={formData.surname} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupEmail'>
                  <Form.Label>Email</Form.Label>
                  <Form.Control type='email' name='email' value={formData.email} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupPhone'>
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control name='phone_number' value={formData.phone_number} onChange={handleChange} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupDepartment'>
                  <Form.Label>Department</Form.Label>
                  <Form.Select name='department' value={formData.department} onChange={handleChange} disabled={loadingEnums} required>
                    <option value=''>Choose...</option>
                    {enums.department.map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupPosition'>
                  <Form.Label>Position</Form.Label>
                  <Form.Select name='position' value={formData.position} onChange={handleChange} disabled={loadingEnums} required>
                    <option value=''>Choose...</option>
                    {enums.position.map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupGrade'>
                  <Form.Label>Grade</Form.Label>
                  <Form.Select name='grade' value={formData.grade} onChange={handleChange} disabled={loadingEnums} required>
                    <option value=''>Choose...</option>
                    {enums.grade.map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupGender'>
                  <Form.Label>Gender</Form.Label>
                  <Form.Select name='gender' value={formData.gender} onChange={handleChange} disabled={loadingEnums} required>
                    <option value=''>Choose...</option>
                    {enums.gender.map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupPassword'>
                  <Form.Label>Password</Form.Label>
                  <Form.Control type='password' name='password' value={formData.password} onChange={handleChange} minLength={8} required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='signupConfirmPassword'>
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control type='password' name='confirm_password' value={formData.confirm_password} onChange={handleChange} minLength={8} required />
                </Form.Group>
              </Col>
            </Row>

            <Button type='submit' variant='primary' disabled={loading || loadingEnums} className='w-100 mt-4'>
              {loading ? (
                <>
                  <Spinner animation='border' size='sm' className='me-2' />
                  Creating account...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </Form>
          <div className='text-center text-muted mt-3'>
            Already have an account? <Link to='/login'>Login</Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

export default Signup
