import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Form, Modal, Spinner, Table } from 'react-bootstrap'

type ThresholdConfig = {
  id: number
  key: string
  value: number
  unit?: string
  description?: string
  updated_at?: string
}

type ThresholdForm = {
  key: string
  value: string
  unit: string
  description: string
}

const THRESHOLDS_ENDPOINT = '/api/threshold-configs/'

const initialForm: ThresholdForm = {
  key: '',
  value: '',
  unit: '',
  description: '',
}

const normalizeThresholdsResponse = (payload: unknown): ThresholdConfig[] => {
  if (Array.isArray(payload)) {
    return payload as ThresholdConfig[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.data)) {
      return record.data as ThresholdConfig[]
    }
    if (Array.isArray(record.results)) {
      return record.results as ThresholdConfig[]
    }
    if (Array.isArray(record.thresholds)) {
      return record.thresholds as ThresholdConfig[]
    }
  }

  return []
}

function Thresholds() {
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [show, setShow] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<ThresholdForm>(initialForm)

  const isEditing = useMemo(() => editingId !== null, [editingId])

  const fetchThresholds = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(THRESHOLDS_ENDPOINT)
      setThresholds(normalizeThresholdsResponse(response.data))
    } catch (err) {
      setError('Failed to load thresholds.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchThresholds()
  }, [])

  const handleClose = () => {
    setShow(false)
    setFormData(initialForm)
    setEditingId(null)
  }

  const handleShowCreate = () => {
    setFormData(initialForm)
    setEditingId(null)
    setShow(true)
  }

  const handleShowEdit = (item: ThresholdConfig) => {
    setFormData({
      key: item.key,
      value: String(item.value ?? ''),
      unit: item.unit ?? '',
      description: item.description ?? '',
    })
    setEditingId(item.id)
    setShow(true)
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        key: formData.key.trim(),
        value: Number(formData.value),
        unit: formData.unit.trim(),
        description: formData.description.trim(),
      }

      if (editingId === null) {
        await axios.post(THRESHOLDS_ENDPOINT, payload)
      } else {
        await axios.put(`${THRESHOLDS_ENDPOINT}${editingId}/`, payload)
      }

      await fetchThresholds()
      handleClose()
    } catch (err) {
      setError('Failed to save threshold.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className='d-flex justify-content-end mb-3'>
        <Button variant='primary' onClick={handleShowCreate}>
          Add Threshold
        </Button>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}

      <Table hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Key</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className='text-center py-4'>
                <Spinner animation='border' size='sm' className='me-2' />
                Loading thresholds...
              </td>
            </tr>
          ) : thresholds.length === 0 ? (
            <tr>
              <td colSpan={6} className='text-center py-4'>
                No thresholds found.
              </td>
            </tr>
          ) : (
            thresholds.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.key}</td>
                <td>{item.value}</td>
                <td>{item.unit || '-'}</td>
                <td>{item.description || '-'}</td>
                <td>
                  <Button
                    size='sm'
                    variant='outline-primary'
                    onClick={() => handleShowEdit(item)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Threshold' : 'Add Threshold'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className='mb-3' controlId='thresholdKey'>
              <Form.Label>Key</Form.Label>
              <Form.Control
                name='key'
                value={formData.key}
                onChange={handleInputChange}
                required
                disabled={isEditing}
              />
            </Form.Group>
            <Form.Group className='mb-3' controlId='thresholdValue'>
              <Form.Label>Value</Form.Label>
              <Form.Control
                type='number'
                step='0.01'
                name='value'
                value={formData.value}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className='mb-3' controlId='thresholdUnit'>
              <Form.Label>Unit</Form.Label>
              <Form.Control
                name='unit'
                value={formData.unit}
                onChange={handleInputChange}
                placeholder='e.g. percent'
              />
            </Form.Group>
            <Form.Group className='mb-3' controlId='thresholdDescription'>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as='textarea'
                rows={2}
                name='description'
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            <div className='d-flex justify-content-end'>
              <Button variant='secondary' onClick={handleClose} disabled={saving} className='me-2'>
                Close
              </Button>
              <Button variant='primary' type='submit' disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default Thresholds
