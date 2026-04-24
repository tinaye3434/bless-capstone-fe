import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Table, Button, Modal, Form, Row, Col, Alert, Spinner } from 'react-bootstrap'
import AppSelect, { type AppSelectOption } from '../components/AppSelect'

type EnumValue = string | number

type EnumOption = {
  value: EnumValue
  label: string
}

type Allowance = {
  id: number
  title: string
  nature: EnumValue | null
  grade_range: EnumValue | null
  cost: number
  status: EnumValue
}

type AllowanceForm = {
  title: string
  nature: string
  grade_range: string
  cost: string
  status: string
}

type AllowanceEnums = {
  allowance_nature: EnumOption[]
  grade_range: EnumOption[]
  status: EnumOption[]
}

const ALLOWANCES_ENDPOINT = '/api/allowances/'
const ENUMS_ENDPOINT = '/api/enums/'

const initialFormData: AllowanceForm = {
  title: '',
  nature: '',
  grade_range: '',
  cost: '',
  status: '',
}

const initialEnums: AllowanceEnums = {
  allowance_nature: [],
  grade_range: [],
  status: [],
}

const normalizeAllowancesResponse = (payload: unknown): Allowance[] => {
  if (Array.isArray(payload)) {
    return payload as Allowance[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as Allowance[]
    }

    if (Array.isArray(record.results)) {
      return record.results as Allowance[]
    }

    if (Array.isArray(record.allowances)) {
      return record.allowances as Allowance[]
    }
  }

  return []
}

function Allowances() {
  const [show, setShow] = useState(false)
  const [allowances, setAllowances] = useState<Allowance[]>([])
  const [formData, setFormData] = useState<AllowanceForm>(initialFormData)
  const [enums, setEnums] = useState<AllowanceEnums>(initialEnums)
  const [editingAllowanceId, setEditingAllowanceId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingEnums, setLoadingEnums] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = useMemo(() => editingAllowanceId !== null, [editingAllowanceId])
  const natureOptions = useMemo<AppSelectOption[]>(
    () =>
      enums.allowance_nature.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    [enums.allowance_nature],
  )
  const gradeRangeOptions = useMemo<AppSelectOption[]>(
    () =>
      enums.grade_range.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    [enums.grade_range],
  )
  const statusOptions = useMemo<AppSelectOption[]>(
    () =>
      enums.status.map((option) => ({
        value: String(option.value),
        label: option.label,
      })),
    [enums.status],
  )

  const fetchAllowances = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(ALLOWANCES_ENDPOINT)
      setAllowances(normalizeAllowancesResponse(response.data))
    } catch (err) {
      setError('Failed to load allowances.')
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
        allowance_nature: Array.isArray(data.allowance_nature) ? data.allowance_nature : [],
        grade_range: Array.isArray(data.grade_range) ? data.grade_range : [],
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
    void Promise.all([fetchAllowances(), fetchEnums()])
  }, [])

  const getStatusLabel = (value: EnumValue) => {
    const matched = enums.status.find((option) => String(option.value) === String(value))
    return matched ? matched.label : String(value ?? '')
  }

  const getNatureLabel = (value: EnumValue | null) => {
    if (value === null || value === undefined || value === '') {
      return 'Not set'
    }
    const matched = enums.allowance_nature.find((option) => String(option.value) === String(value))
    return matched ? matched.label : String(value)
  }

  const getGradeRangeLabel = (value: EnumValue | null) => {
    if (value === null || value === undefined || value === '') {
      return 'Not set'
    }
    const matched = enums.grade_range.find((option) => String(option.value) === String(value))
    return matched ? matched.label : String(value)
  }

  const getPayloadStatus = (selectedValue: string): EnumValue => {
    const matched = enums.status.find((option) => String(option.value) === selectedValue)
    return matched ? matched.value : selectedValue
  }

  const getPayloadNature = (selectedValue: string): EnumValue | null => {
    if (!selectedValue) {
      return null
    }
    const matched = enums.allowance_nature.find((option) => String(option.value) === selectedValue)
    return matched ? matched.value : selectedValue
  }

  const getPayloadGradeRange = (selectedValue: string): EnumValue | null => {
    if (!selectedValue) {
      return null
    }
    const matched = enums.grade_range.find((option) => String(option.value) === selectedValue)
    return matched ? matched.value : selectedValue
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingAllowanceId(null)
  }

  const handleClose = () => {
    setShow(false)
    resetForm()
  }

  const handleShowCreate = () => {
    resetForm()
    setShow(true)
  }

  const handleShowEdit = (allowance: Allowance) => {
    setFormData({
      title: allowance.title,
      nature: String(allowance.nature ?? ''),
      grade_range: String(allowance.grade_range ?? ''),
      cost: String(allowance.cost ?? ''),
      status: String(allowance.status ?? ''),
    })
    setEditingAllowanceId(allowance.id)
    setShow(true)
  }

  const handleInputChange = (event: React.ChangeEvent<any>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (field: keyof Pick<AllowanceForm, 'nature' | 'grade_range' | 'status'>, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    if (isEditing && !formData.status) {
      setError('Please choose a status.')
      setSaving(false)
      return
    }
    try {
      const basePayload = {
        title: formData.title.trim(),
        nature: getPayloadNature(formData.nature),
        grade_range: getPayloadGradeRange(formData.grade_range),
        cost: Number(formData.cost),
      }

      if (editingAllowanceId === null) {
        await axios.post(ALLOWANCES_ENDPOINT, basePayload)
      } else {
        await axios.put(`${ALLOWANCES_ENDPOINT}${editingAllowanceId}/`, {
          ...basePayload,
          status: getPayloadStatus(formData.status),
        })
      }

      await fetchAllowances()
      handleClose()
    } catch (err) {
      setError('Failed to save allowance.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className='row'>
        <div className='d-flex justify-content-end'>
          <Button variant='primary' onClick={handleShowCreate}>
            Add Allowance
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
                <th>Title</th>
                <th>Nature</th>
                <th>Grade Range</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className='text-center py-4'>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Loading allowances...
                  </td>
                </tr>
              ) : allowances.length === 0 ? (
                <tr>
                  <td colSpan={7} className='text-center py-4'>
                    No allowances found.
                  </td>
                </tr>
              ) : (
                allowances.map((allowance, index) => (
                  <tr key={allowance.id}>
                    <td>{index + 1}</td>
                    <td>{allowance.title}</td>
                    <td>{getNatureLabel(allowance.nature)}</td>
                    <td>{getGradeRangeLabel(allowance.grade_range)}</td>
                    <td>{allowance.cost}</td>
                    <td>{getStatusLabel(allowance.status)}</td>
                    <td>
                      <Button
                        size='sm'
                        variant='outline-primary'
                        onClick={() => handleShowEdit(allowance)}
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

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Allowance' : 'Add Allowance'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className='mb-3'>
              <Form.Group as={Col} controlId='allowanceTitle'>
                <Form.Label>Title</Form.Label>
                <Form.Control
                  name='title'
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='allowanceCost'>
                <Form.Label>Cost</Form.Label>
                <Form.Control
                  type='number'
                  min='0'
                  step='0.01'
                  name='cost'
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='allowanceNature'>
                <Form.Label>Nature</Form.Label>
                <AppSelect
                  inputId='allowanceNature'
                  value={formData.nature}
                  options={natureOptions}
                  onChange={(value) => handleSelectChange('nature', value)}
                  isDisabled={loadingEnums}
                  isClearable
                  placeholder='Not set'
                />
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='allowanceGradeRange'>
                <Form.Label>Grade Range</Form.Label>
                <AppSelect
                  inputId='allowanceGradeRange'
                  value={formData.grade_range}
                  options={gradeRangeOptions}
                  onChange={(value) => handleSelectChange('grade_range', value)}
                  isDisabled={loadingEnums}
                  isClearable
                  placeholder='Not set'
                />
              </Form.Group>
            </Row>

            {isEditing ? (
              <Row className='mb-3'>
                <Form.Group as={Col} controlId='allowanceStatus'>
                  <Form.Label>Status</Form.Label>
                  <AppSelect
                    inputId='allowanceStatus'
                    value={formData.status}
                    options={statusOptions}
                    onChange={(value) => handleSelectChange('status', value)}
                    isDisabled={loadingEnums}
                    placeholder='Choose...'
                  />
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

export default Allowances
