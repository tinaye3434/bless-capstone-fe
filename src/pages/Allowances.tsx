import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Table, Button, Modal, Form, Row, Col, Alert, Spinner } from 'react-bootstrap'

type EnumValue = string | number

type EnumOption = {
  value: EnumValue
  label: string
}

type Allowance = {
  id: number
  title: string
  cost: number
  status: EnumValue
}

type AllowanceForm = {
  title: string
  cost: string
  status: string
}

type AllowanceEnums = {
  status: EnumOption[]
}

const ALLOWANCES_ENDPOINT = '/api/allowances/'
const ENUMS_ENDPOINT = '/api/enums/'

const initialFormData: AllowanceForm = {
  title: '',
  cost: '',
  status: '',
}

const initialEnums: AllowanceEnums = {
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

  const getPayloadStatus = (selectedValue: string): EnumValue => {
    const matched = enums.status.find((option) => String(option.value) === selectedValue)
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const basePayload = {
        title: formData.title.trim(),
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
                <th>Cost</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className='text-center py-4'>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Loading allowances...
                  </td>
                </tr>
              ) : allowances.length === 0 ? (
                <tr>
                  <td colSpan={5} className='text-center py-4'>
                    No allowances found.
                  </td>
                </tr>
              ) : (
                allowances.map((allowance, index) => (
                  <tr key={allowance.id}>
                    <td>{index + 1}</td>
                    <td>{allowance.title}</td>
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

            {isEditing ? (
              <Row className='mb-3'>
                <Form.Group as={Col} controlId='allowanceStatus'>
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

export default Allowances
