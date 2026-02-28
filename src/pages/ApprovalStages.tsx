import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Table, Button, Modal, Form, Row, Col, Alert, Spinner } from 'react-bootstrap'

type EnumValue = string | number

type EnumOption = {
  value: EnumValue
  label: string
}

type ApprovalStage = {
  id: number
  title: string
  order: number
  status: EnumValue
}

type ApprovalStageForm = {
  title: string
  order: string
  status: string
}

type ApprovalStageEnums = {
  status: EnumOption[]
}

const APPROVAL_STAGES_ENDPOINT = '/api/approval-stages/'
const ENUMS_ENDPOINT = '/api/enums/'

const initialFormData: ApprovalStageForm = {
  title: '',
  order: '',
  status: '',
}

const initialEnums: ApprovalStageEnums = {
  status: [],
}

const normalizeApprovalStagesResponse = (payload: unknown): ApprovalStage[] => {
  if (Array.isArray(payload)) {
    return payload as ApprovalStage[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as ApprovalStage[]
    }

    if (Array.isArray(record.results)) {
      return record.results as ApprovalStage[]
    }

    if (Array.isArray(record.approval_stages)) {
      return record.approval_stages as ApprovalStage[]
    }
  }

  return []
}

function ApprovalStages() {
  const [show, setShow] = useState(false)
  const [stages, setStages] = useState<ApprovalStage[]>([])
  const [formData, setFormData] = useState<ApprovalStageForm>(initialFormData)
  const [enums, setEnums] = useState<ApprovalStageEnums>(initialEnums)
  const [editingStageId, setEditingStageId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingEnums, setLoadingEnums] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [draggingStageId, setDraggingStageId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isEditing = useMemo(() => editingStageId !== null, [editingStageId])
  const orderedStages = useMemo(
    () => [...stages].sort((left, right) => Number(left.order) - Number(right.order)),
    [stages]
  )

  const fetchStages = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(APPROVAL_STAGES_ENDPOINT)
      setStages(normalizeApprovalStagesResponse(response.data))
    } catch (err) {
      setError('Failed to load approval stages.')
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
    void Promise.all([fetchStages(), fetchEnums()])
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
    setEditingStageId(null)
  }

  const handleClose = () => {
    setShow(false)
    resetForm()
  }

  const handleShowCreate = () => {
    resetForm()
    setShow(true)
  }

  const handleShowEdit = (stage: ApprovalStage) => {
    setFormData({
      title: stage.title,
      order: String(stage.order ?? ''),
      status: String(stage.status ?? ''),
    })
    setEditingStageId(stage.id)
    setShow(true)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        order: Number(formData.order),
      }

      if (editingStageId === null) {
        await axios.post(APPROVAL_STAGES_ENDPOINT, basePayload)
      } else {
        await axios.put(`${APPROVAL_STAGES_ENDPOINT}${editingStageId}/`, {
          ...basePayload,
          status: getPayloadStatus(formData.status),
        })
      }

      await fetchStages()
      handleClose()
    } catch (err) {
      setError('Failed to save approval stage.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const persistReorderedStages = async (reorderedStages: ApprovalStage[]) => {
    setReordering(true)
    setError(null)
    try {
      await Promise.all(
        reorderedStages.map((stage) =>
          axios.put(`${APPROVAL_STAGES_ENDPOINT}${stage.id}/`, {
            title: stage.title,
            order: stage.order,
            status: stage.status,
          })
        )
      )
      await fetchStages()
    } catch (err) {
      setError('Failed to reorder approval stages.')
      console.error(err)
      await fetchStages()
    } finally {
      setReordering(false)
    }
  }

  const handleDragStart = (stageId: number) => {
    setDraggingStageId(stageId)
  }

  const handleDragEnd = () => {
    setDraggingStageId(null)
  }

  const handleDrop = (targetStageId: number) => {
    if (draggingStageId === null || draggingStageId === targetStageId || reordering) {
      setDraggingStageId(null)
      return
    }

    const sourceIndex = orderedStages.findIndex((stage) => stage.id === draggingStageId)
    const targetIndex = orderedStages.findIndex((stage) => stage.id === targetStageId)

    if (sourceIndex < 0 || targetIndex < 0) {
      setDraggingStageId(null)
      return
    }

    const reordered = [...orderedStages]
    const [movedStage] = reordered.splice(sourceIndex, 1)
    reordered.splice(targetIndex, 0, movedStage)

    const normalized = reordered.map((stage, index) => ({
      ...stage,
      order: index + 1,
    }))

    setStages(normalized)
    setDraggingStageId(null)
    void persistReorderedStages(normalized)
  }

  return (
    <>
      <div className='row'>
        <div className='d-flex justify-content-end'>
          <Button variant='primary' onClick={handleShowCreate}>
            Add Stage
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
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className='text-center py-4'>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Loading approval stages...
                  </td>
                </tr>
              ) : stages.length === 0 ? (
                <tr>
                  <td colSpan={5} className='text-center py-4'>
                    No approval stages found.
                  </td>
                </tr>
              ) : (
                orderedStages.map((stage, index) => (
                  <tr
                    key={stage.id}
                    draggable={!reordering}
                    onDragStart={() => handleDragStart(stage.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDrop(stage.id)}
                    onDragEnd={handleDragEnd}
                    style={{
                      cursor: reordering ? 'not-allowed' : 'grab',
                      opacity: draggingStageId === stage.id ? 0.5 : 1,
                    }}
                  >
                    <td>{index + 1}</td>
                    <td>{stage.title}</td>
                    <td>{stage.order}</td>
                    <td>{getStatusLabel(stage.status)}</td>
                    <td>
                      <Button
                        size='sm'
                        variant='outline-primary'
                        onClick={() => handleShowEdit(stage)}
                        disabled={reordering}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
          {reordering ? <div className='text-muted'>Saving stage order...</div> : null}
        </div>
      </div>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? 'Edit Stage' : 'Add Stage'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Row className='mb-3'>
              <Form.Group as={Col} controlId='stageTitle'>
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
              <Form.Group as={Col} controlId='stageOrder'>
                <Form.Label>Order</Form.Label>
                <Form.Control
                  type='number'
                  min='1'
                  step='1'
                  name='order'
                  value={formData.order}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Row>

            {isEditing ? (
              <Row className='mb-3'>
                <Form.Group as={Col} controlId='stageStatus'>
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

export default ApprovalStages
