import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Button, Modal, Table, Row, Form, Col, Alert, Spinner } from 'react-bootstrap'

type EnumValue = string | number
type EnumField = 'department' | 'position' | 'grade' | 'gender' | 'status'

type EnumOption = {
  value: EnumValue
  label: string
}

type EmployeeEnums = Record<EnumField, EnumOption[]>

type Employee = {
  id: number
  first_name: string
  surname: string
  email: string
  phone_number: string
  department: EnumValue
  position: EnumValue
  grade: EnumValue
  gender: EnumValue
  status: EnumValue
}

type EmployeeForm = {
  first_name: string
  surname: string
  email: string
  phone_number: string
  department: string
  position: string
  grade: string
  gender: string
  status: string
}

const EMPLOYEES_ENDPOINT = '/api/employee/'
const ENUMS_ENDPOINT = '/api/enums/'

const initialEnums: EmployeeEnums = {
  department: [],
  position: [],
  grade: [],
  gender: [],
  status: [],
}

const initialFormData: EmployeeForm = {
  first_name: '',
  surname: '',
  email: '',
  phone_number: '',
  department: '',
  position: '',
  grade: '',
  gender: '',
  status: '',
}

const normalizeEmployeesResponse = (payload: unknown): Employee[] => {
  if (Array.isArray(payload)) {
    return payload as Employee[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as Employee[]
    }

    if (Array.isArray(record.results)) {
      return record.results as Employee[]
    }

    if (Array.isArray(record.employees)) {
      return record.employees as Employee[]
    }
  }

  return []
}

function Employees() {
  const [show, setShow] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [enums, setEnums] = useState<EmployeeEnums>(initialEnums)
  const [formData, setFormData] = useState<EmployeeForm>(initialFormData)
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingEnums, setLoadingEnums] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = useMemo(() => editingEmployeeId !== null, [editingEmployeeId])

  const fetchEmployees = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(EMPLOYEES_ENDPOINT)
      setEmployees(normalizeEmployeesResponse(response.data))
    } catch (err) {
      setError('Failed to load employees.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
        status: Array.isArray(data.status) ? data.status : [],
      })
    } catch (err) {
      setError('Failed to load enum options.')
      console.error(err)
    } finally {
      setLoadingEnums(false)
    }
  }

  useEffect(() => {
    void Promise.all([fetchEmployees(), fetchEnums()])
  }, [])

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingEmployeeId(null)
  }

  const handleClose = () => {
    setShow(false)
    resetForm()
  }

  const handleShowCreate = () => {
    resetForm()
    setShow(true)
  }

  const handleShowEdit = (employee: Employee) => {
    setFormData({
      first_name: employee.first_name,
      surname: employee.surname,
      email: employee.email,
      phone_number: employee.phone_number,
      department: String(employee.department ?? ''),
      position: String(employee.position ?? ''),
      grade: String(employee.grade ?? ''),
      gender: String(employee.gender ?? ''),
      status: String(employee.status ?? ''),
    })
    setEditingEmployeeId(employee.id)
    setShow(true)
  }

  const handleInputChange = (event: React.ChangeEvent<any>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const getPayloadEnumValue = (field: EnumField, selectedValue: string): EnumValue => {
        const matchedOption = enums[field].find((option) => String(option.value) === selectedValue)
        return matchedOption ? matchedOption.value : selectedValue
      }

      const payload = {
        ...formData,
        department: getPayloadEnumValue('department', formData.department),
        position: getPayloadEnumValue('position', formData.position),
        grade: getPayloadEnumValue('grade', formData.grade),
        gender: getPayloadEnumValue('gender', formData.gender),
      }

      if (editingEmployeeId === null) {
        await axios.post(EMPLOYEES_ENDPOINT, payload)
      } else {
        await axios.put(`${EMPLOYEES_ENDPOINT}${editingEmployeeId}/`, {
          ...payload,
          status: getPayloadEnumValue('status', formData.status),
        })
      }
      await fetchEmployees()
      handleClose()
    } catch (err) {
      setError('Failed to save employee.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const getEnumLabel = (field: EnumField, value: EnumValue) => {
    const matchedOption = enums[field].find((option) => String(option.value) === String(value))
    return matchedOption ? matchedOption.label : String(value ?? '')
  }

  return (
    <>
      <div className='row'>
        <div className='d-flex justify-content-end'>
          <Button variant='primary' onClick={handleShowCreate}>
            Add Employee
          </Button>
        </div>
      </div>
      {error ? (
        <div className='mt-3'>
          <Alert variant='danger' className='mb-0'>
            {error}
          </Alert>
        </div>
      ) : null}
      <div className='row'>
        <div className='col-12'>
          <Table hover>
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className='text-center py-4'>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className='text-center py-4'>
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((employee, index) => (
                  <tr key={employee.id}>
                    <td>{index + 1}</td>
                    <td>{`${employee.first_name} ${employee.surname}`}</td>
                    <td>{getEnumLabel('department', employee.department)}</td>
                    <td>{getEnumLabel('gender', employee.gender)}</td>
                    <td>{getEnumLabel('status', employee.status)}</td>
                    <td>
                      <Button
                        size='sm'
                        variant='outline-primary'
                        onClick={() => handleShowEdit(employee)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>

      <Modal size='lg' show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Employee' : 'Add Employee'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className='mb-3'>
              <Form.Group as={Col} controlId='formGridFirstName'>
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  name='first_name'
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group as={Col} controlId='formGridSurname'>
                <Form.Label>Surname</Form.Label>
                <Form.Control
                  name='surname'
                  value={formData.surname}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='formGridAddress1'>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type='email'
                  name='email'
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group as={Col} controlId='formGridPhone'>
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  name='phone_number'
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='formGridCity'>
                <Form.Label>Department</Form.Label>
                <Form.Select
                  name='department'
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  disabled={loadingEnums}
                >
                  <option value=''>Choose...</option>
                  {enums.department.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group as={Col} controlId='formGridPosition'>
                <Form.Label>Position</Form.Label>
                <Form.Select
                  name='position'
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                  disabled={loadingEnums}
                >
                  <option value=''>Choose...</option>
                  {enums.position.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='formGridState'>
                <Form.Label>Grade</Form.Label>
                <Form.Select
                  name='grade'
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                  disabled={loadingEnums}
                >
                  <option value=''>Choose...</option>
                  {enums.grade.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group as={Col} controlId='formGridGender'>
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  name='gender'
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                  disabled={loadingEnums}
                >
                  <option value=''>Choose...</option>
                  {enums.gender.map((option) => (
                    <option key={String(option.value)} value={String(option.value)}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Row>
            {isEditing ? (
              <Row className='mb-3'>
                <Form.Group as={Col} controlId='formGridStatus'>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name='status'
                    value={formData.status}
                    onChange={handleInputChange}
                    required
                    disabled={loadingEnums}
                  >
                    <option value=''>Choose...</option>
                    {enums.status.map((option) => (
                      <option key={String(option.value)} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Row>
            ) : null}
            <Modal.Footer className='px-0 pb-0'>
              <Button variant='secondary' onClick={handleClose} disabled={saving}>
                Close
              </Button>
              <Button variant='primary' type='submit' disabled={saving || loadingEnums}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default Employees
