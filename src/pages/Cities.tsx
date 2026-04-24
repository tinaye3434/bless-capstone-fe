import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Button, Col, Form, Modal, Row, Spinner, Table } from 'react-bootstrap'
import {
  LOCATIONS_ENDPOINT,
  normalizeLocationsResponse,
  type LocationPoint,
} from '../utils/claims'

type CityForm = {
  name: string
  longitude: string
  latitude: string
}

const initialFormData: CityForm = {
  name: '',
  longitude: '',
  latitude: '',
}

function Cities() {
  const [show, setShow] = useState(false)
  const [cities, setCities] = useState<LocationPoint[]>([])
  const [formData, setFormData] = useState<CityForm>(initialFormData)
  const [editingCityId, setEditingCityId] = useState<number | string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = useMemo(() => editingCityId !== null, [editingCityId])

  const fetchCities = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(LOCATIONS_ENDPOINT)
      setCities(normalizeLocationsResponse(response.data))
    } catch (err) {
      setError('Failed to load cities.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchCities()
  }, [])

  const resetForm = () => {
    setFormData(initialFormData)
    setEditingCityId(null)
  }

  const handleClose = () => {
    setShow(false)
    resetForm()
  }

  const handleShowCreate = () => {
    resetForm()
    setShow(true)
  }

  const handleShowEdit = (city: LocationPoint) => {
    setFormData({
      name: city.name,
      longitude: String(city.longitude ?? ''),
      latitude: String(city.latitude ?? ''),
    })
    setEditingCityId(city.id ?? null)
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
      const payload = {
        name: formData.name.trim(),
        longitude: Number(formData.longitude),
        latitude: Number(formData.latitude),
      }

      if (editingCityId === null) {
        await axios.post(LOCATIONS_ENDPOINT, payload)
      } else {
        await axios.put(`${LOCATIONS_ENDPOINT}${editingCityId}/`, payload)
      }

      await fetchCities()
      handleClose()
    } catch (err) {
      setError('Failed to save city.')
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
            Add City
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
                <th>Name</th>
                <th>Longitude</th>
                <th>Latitude</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className='text-center py-4'>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Loading cities...
                  </td>
                </tr>
              ) : cities.length === 0 ? (
                <tr>
                  <td colSpan={5} className='text-center py-4'>
                    No cities found.
                  </td>
                </tr>
              ) : (
                cities.map((city, index) => (
                  <tr key={String(city.id ?? city.name)}>
                    <td>{index + 1}</td>
                    <td>{city.name}</td>
                    <td>{city.longitude}</td>
                    <td>{city.latitude}</td>
                    <td>
                      <Button size='sm' variant='outline-primary' onClick={() => handleShowEdit(city)}>
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
          <Modal.Title>{isEditing ? 'Edit City' : 'Add City'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className='mb-3'>
              <Form.Group as={Col} controlId='cityName'>
                <Form.Label>City Name</Form.Label>
                <Form.Control name='name' value={formData.name} onChange={handleInputChange} required />
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='cityLongitude'>
                <Form.Label>Longitude</Form.Label>
                <Form.Control
                  type='number'
                  step='any'
                  name='longitude'
                  value={formData.longitude}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>

              <Form.Group as={Col} controlId='cityLatitude'>
                <Form.Label>Latitude</Form.Label>
                <Form.Control
                  type='number'
                  step='any'
                  name='latitude'
                  value={formData.latitude}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Row>

            <Modal.Footer className='px-0 pb-0'>
              <Button variant='secondary' onClick={handleClose} disabled={saving}>
                Close
              </Button>
              <Button variant='primary' type='submit' disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default Cities
