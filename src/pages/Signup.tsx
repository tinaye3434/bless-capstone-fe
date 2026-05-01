import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Col, Form, Row, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import businessTravelHero from '../assets/business-travel-hero.jpg'
import AppSelect, { type AppSelectOption } from '../components/AppSelect'
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

type SignupStepId = 'personal' | 'work' | 'security'

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

const signupSteps: Array<{
  id: SignupStepId
  label: string
  title: string
  description: string
}> = [
  {
    id: 'personal',
    label: 'Personal',
    title: 'Personal details',
    description: 'Tell us who you are so your claims link to the right profile.',
  },
  {
    id: 'work',
    label: 'Work',
    title: 'Work details',
    description: 'These details route your claims to the right approval path.',
  },
  {
    id: 'security',
    label: 'Security',
    title: 'Security',
    description: 'Create a password for secure access to your claims.',
  },
]

function Signup() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<SignupForm>(initialForm)
  const [enums, setEnums] = useState<SignupEnums>(initialEnums)
  const [loadingEnums, setLoadingEnums] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const departmentOptions = useMemo<AppSelectOption[]>(
    () =>
      enums.department.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    [enums.department],
  )
  const positionOptions = useMemo<AppSelectOption[]>(
    () =>
      enums.position.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    [enums.position],
  )
  const gradeOptions = useMemo<AppSelectOption[]>(
    () =>
      enums.grade.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    [enums.grade],
  )
  const genderOptions = useMemo<AppSelectOption[]>(
    () =>
      enums.gender.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    [enums.gender],
  )

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

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleSelectChange = (
    field: keyof Pick<SignupForm, 'department' | 'position' | 'grade' | 'gender'>,
    value: string,
  ) => {
    setFormData((previous) => ({ ...previous, [field]: value }))
  }

  const validateStep = (step: number) => {
    if (step === 0) {
      if (
        !formData.first_name.trim() ||
        !formData.surname.trim() ||
        !formData.email.trim() ||
        !formData.phone_number.trim()
      ) {
        return 'Please complete all personal details before continuing.'
      }
    }

    if (step === 1) {
      if (!formData.department || !formData.position || !formData.grade || !formData.gender) {
        return 'Please complete all work details before continuing.'
      }
    }

    if (step === 2) {
      if (!formData.password || !formData.confirm_password) {
        return 'Please complete your password details before creating the account.'
      }

      if (formData.password.length < 8) {
        return 'Your password must be at least 8 characters long.'
      }

      if (formData.password !== formData.confirm_password) {
        return 'Password confirmation does not match.'
      }
    }

    return null
  }

  const goToNextStep = () => {
    const validationError = validateStep(currentStep)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setCurrentStep((previous) => Math.min(previous + 1, signupSteps.length - 1))
  }

  const goToPreviousStep = () => {
    setError(null)
    setCurrentStep((previous) => Math.max(previous - 1, 0))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const validationError = validateStep(currentStep)
    if (validationError) {
      setError(validationError)
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
      <div className='auth-layout auth-layout-signup'>
        <section className='auth-showcase'>
          <div className='auth-showcase-media'>
            <img src={businessTravelHero} alt='Business travel at the airport' />
          </div>
          <div className='auth-showcase-overlay' />
          <div className='auth-showcase-content'>
            <span className='auth-showcase-badge'>Get started in minutes</span>
            <h1 className='auth-showcase-heading'>
              Create your profile and start managing claims.
            </h1>
            <p className='auth-showcase-copy'>
              Register with your staff details to submit claims and receive updates.
            </p>

            <div className='auth-showcase-points'>
              <div className='auth-showcase-point'>
                <strong>Simple onboarding</strong>
                <span>Enter your details once to unlock the portal.</span>
              </div>
              <div className='auth-showcase-point'>
                <strong>Guided submission flow</strong>
                <span>Move through the claim process with less friction.</span>
              </div>
            </div>
          </div>
        </section>

        <section className='auth-panel auth-panel-wide'>
          <div className='auth-panel-top'>
            <Link to='/' className='auth-back-link'>
              Back to Home
            </Link>
            <span className='auth-panel-alt-copy'>
              Already registered? <Link to='/login'>Log in</Link>
            </span>
          </div>

          <div className='auth-panel-intro'>
            <span className='auth-panel-kicker'>Create account</span>
            <h2 className='auth-panel-title'>Set up your travel portal access</h2>
            <p className='auth-panel-subtitle'>
              Complete your profile to submit and track travel claims.
            </p>
          </div>

          <div className='auth-stepper' aria-label='Signup progress'>
            {signupSteps.map((step, index) => {
              const isActive = currentStep === index
              const isComplete = index < currentStep

              return (
                <div
                  key={step.id}
                  className={`auth-stepper-item${isActive ? ' active' : ''}${isComplete ? ' complete' : ''}`}
                >
                  <span className='auth-stepper-index'>{index + 1}</span>
                  <div className='auth-stepper-copy'>
                    <strong>{step.label}</strong>
                    <span>{step.title}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {error ? (
            <Alert variant='danger' className='auth-error-alert'>
              {error}
            </Alert>
          ) : null}

          <Form onSubmit={handleSubmit} className='auth-form-stack'>
            {currentStep === 0 ? (
              <section className='auth-form-section'>
                <div className='auth-form-section-header'>
                  <h3>{signupSteps[0].title}</h3>
                  <p>{signupSteps[0].description}</p>
                </div>

                <Row className='g-3'>
                  <Col md={6}>
                    <Form.Group controlId='signupFirstName'>
                      <Form.Label>First Name</Form.Label>
                      <Form.Control
                        name='first_name'
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder='Enter your first name'
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId='signupSurname'>
                      <Form.Label>Surname</Form.Label>
                      <Form.Control
                        name='surname'
                        value={formData.surname}
                        onChange={handleChange}
                        placeholder='Enter your surname'
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId='signupEmail'>
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        placeholder='name@example.com'
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId='signupPhone'>
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control
                        name='phone_number'
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder='Enter your phone number'
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </section>
            ) : null}

            {currentStep === 1 ? (
              <section className='auth-form-section'>
                <div className='auth-form-section-header'>
                  <h3>{signupSteps[1].title}</h3>
                  <p>{signupSteps[1].description}</p>
                </div>

                <Row className='g-3'>
                  <Col md={6}>
                    <Form.Group controlId='signupDepartment'>
                      <Form.Label>Department</Form.Label>
                      <AppSelect
                        inputId='signupDepartment'
                        value={formData.department}
                        options={departmentOptions}
                        onChange={(value) => handleSelectChange('department', value)}
                        isDisabled={loadingEnums}
                        placeholder='Choose department'
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId='signupPosition'>
                      <Form.Label>Position</Form.Label>
                      <AppSelect
                        inputId='signupPosition'
                        value={formData.position}
                        options={positionOptions}
                        onChange={(value) => handleSelectChange('position', value)}
                        isDisabled={loadingEnums}
                        placeholder='Choose position'
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId='signupGrade'>
                      <Form.Label>Grade</Form.Label>
                      <AppSelect
                        inputId='signupGrade'
                        value={formData.grade}
                        options={gradeOptions}
                        onChange={(value) => handleSelectChange('grade', value)}
                        isDisabled={loadingEnums}
                        placeholder='Choose grade'
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId='signupGender'>
                      <Form.Label>Gender</Form.Label>
                      <AppSelect
                        inputId='signupGender'
                        value={formData.gender}
                        options={genderOptions}
                        onChange={(value) => handleSelectChange('gender', value)}
                        isDisabled={loadingEnums}
                        placeholder='Choose gender'
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </section>
            ) : null}

            {currentStep === 2 ? (
              <section className='auth-form-section'>
                <div className='auth-form-section-header'>
                  <h3>{signupSteps[2].title}</h3>
                  <p>{signupSteps[2].description}</p>
                </div>

                <Row className='g-3'>
                  <Col md={6}>
                    <Form.Group controlId='signupPassword'>
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type='password'
                        name='password'
                        value={formData.password}
                        onChange={handleChange}
                        minLength={8}
                        placeholder='Create a password'
                        required
                      />
                      <Form.Text className='auth-helper-text'>
                        Use at least 8 characters for stronger account protection.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId='signupConfirmPassword'>
                      <Form.Label>Confirm Password</Form.Label>
                      <Form.Control
                        type='password'
                        name='confirm_password'
                        value={formData.confirm_password}
                        onChange={handleChange}
                        minLength={8}
                        placeholder='Confirm your password'
                        required
                      />
                      <Form.Text className='auth-helper-text'>
                        Re-enter your password exactly as above before continuing.
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </section>
            ) : null}

            <div className='auth-step-actions'>
              {currentStep > 0 ? (
                <Button
                  type='button'
                  variant='outline-primary'
                  onClick={goToPreviousStep}
                  className='auth-step-button auth-step-button-secondary'
                >
                  Back
                </Button>
              ) : (
                <span />
              )}

              {currentStep < signupSteps.length - 1 ? (
                <Button
                  type='button'
                  variant='primary'
                  onClick={goToNextStep}
                  disabled={loadingEnums && currentStep === 1}
                  className='auth-step-button auth-submit'
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type='submit'
                  variant='primary'
                  disabled={loading || loadingEnums}
                  className='auth-step-button auth-submit'
                >
                  {loading ? (
                    <>
                      <Spinner animation='border' size='sm' className='me-2' />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              )}
            </div>
          </Form>
        </section>
      </div>
    </div>
  )
}

export default Signup
