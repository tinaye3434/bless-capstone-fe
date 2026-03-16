import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Table, Button, Modal, Form, Row, Col, Alert, Spinner, Badge } from 'react-bootstrap'

type ApprovalStage = {
  id: number
  title: string
  order: number
  employee_ids?: number[]
  employees?: Array<number | { id?: number }>
}

type ApprovalStageForm = {
  title: string
}

type Employee = {
  id: number
  first_name: string
  surname: string
  email: string
}

const APPROVAL_STAGES_ENDPOINT = '/api/approval-stages/'
const APPROVAL_STAGES_REORDER_ENDPOINT = '/api/approval-stages/reorder/'
const EMPLOYEES_ENDPOINT = '/api/employee/'

const initialFormData: ApprovalStageForm = {
  title: '',
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

const extractStageEmployeeIds = (stage: ApprovalStage): number[] => {
  if (Array.isArray(stage.employee_ids)) {
    return stage.employee_ids.filter((value): value is number => Number.isFinite(Number(value)))
  }

  if (Array.isArray(stage.employees)) {
    return stage.employees
      .map((value) => {
        if (typeof value === 'number') {
          return value
        }

        if (value && typeof value === 'object' && typeof value.id === 'number') {
          return value.id
        }

        return null
      })
      .filter((value): value is number => value !== null)
  }

  return []
}

function ApprovalStages() {
  const [show, setShow] = useState(false)
  const [showEmployeesModal, setShowEmployeesModal] = useState(false)
  const [stages, setStages] = useState<ApprovalStage[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState<ApprovalStageForm>(initialFormData)
  const [editingStageId, setEditingStageId] = useState<number | null>(null)
  const [managingStage, setManagingStage] = useState<ApprovalStage | null>(null)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([])
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingEmployees, setSavingEmployees] = useState(false)
  const [deletingStageId, setDeletingStageId] = useState<number | null>(null)
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

  const fetchEmployees = async () => {
    setLoadingEmployees(true)
    setError(null)
    try {
      const response = await axios.get(EMPLOYEES_ENDPOINT)
      setEmployees(normalizeEmployeesResponse(response.data))
    } catch (err) {
      setError('Failed to load employees.')
      console.error(err)
    } finally {
      setLoadingEmployees(false)
    }
  }

  useEffect(() => {
    void fetchStages()
  }, [])

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
    })
    setEditingStageId(stage.id)
    setShow(true)
  }

  const handleShowManageEmployees = async (stage: ApprovalStage) => {
    setManagingStage(stage)
    setSelectedEmployeeIds(extractStageEmployeeIds(stage))
    setShowEmployeesModal(true)

    if (employees.length === 0) {
      await fetchEmployees()
    }
  }

  const handleCloseManageEmployees = () => {
    setShowEmployeesModal(false)
    setManagingStage(null)
    setSelectedEmployeeIds([])
    setEmployeeSearch('')
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
      const payload = {
        title: formData.title.trim(),
      }

      if (editingStageId === null) {
        await axios.post(APPROVAL_STAGES_ENDPOINT, payload)
      } else {
        await axios.patch(`${APPROVAL_STAGES_ENDPOINT}${editingStageId}/`, payload)
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

  const handleDelete = async (stageId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this stage?')
    if (!confirmed) {
      return
    }

    setDeletingStageId(stageId)
    setError(null)
    try {
      await axios.delete(`${APPROVAL_STAGES_ENDPOINT}${stageId}/`)
      await fetchStages()
    } catch (err) {
      setError('Failed to delete approval stage.')
      console.error(err)
    } finally {
      setDeletingStageId(null)
    }
  }

  const toggleEmployeeSelection = (employeeId: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
    )
  }

  const filteredEmployees = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase()
    if (!query) {
      return employees
    }
    return employees.filter((employee) => {
      const name = `${employee.first_name} ${employee.surname}`.toLowerCase()
      return (
        name.includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        String(employee.id).includes(query)
      )
    })
  }, [employees, employeeSearch])

  const handleSelectAll = () => {
    setSelectedEmployeeIds(filteredEmployees.map((employee) => employee.id))
  }

  const handleClearAll = () => {
    setSelectedEmployeeIds([])
  }

  const handleSaveEmployees = async () => {
    if (!managingStage) {
      return
    }

    setSavingEmployees(true)
    setError(null)
    try {
      await axios.put(`${APPROVAL_STAGES_ENDPOINT}${managingStage.id}/employees/`, {
        ids: selectedEmployeeIds,
      })
      await fetchStages()
      handleCloseManageEmployees()
    } catch (err) {
      setError('Failed to update stage employees.')
      console.error(err)
    } finally {
      setSavingEmployees(false)
    }
  }

  const persistReorderedStages = async (reorderedStages: ApprovalStage[]) => {
    setReordering(true)
    setError(null)
    try {
      await axios.post(APPROVAL_STAGES_REORDER_ENDPOINT, {
        ids: reorderedStages.map((stage) => stage.id),
      })
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className='text-center py-4'>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Loading approval stages...
                  </td>
                </tr>
              ) : stages.length === 0 ? (
                <tr>
                  <td colSpan={3} className='text-center py-4'>
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
                    <td>
                      <Badge bg='secondary' className='me-2'>
                        {extractStageEmployeeIds(stage).length} assigned
                      </Badge>
                      <Button
                        size='sm'
                        variant='outline-primary'
                        onClick={() => handleShowEdit(stage)}
                        disabled={reordering || deletingStageId === stage.id || savingEmployees}
                      >
                        Edit
                      </Button>
                      {' '}
                      <Button
                        size='sm'
                        variant='outline-secondary'
                        onClick={() => void handleShowManageEmployees(stage)}
                        disabled={reordering || deletingStageId === stage.id || savingEmployees}
                      >
                        Employees
                      </Button>
                      {' '}
                      <Button
                        size='sm'
                        variant='outline-danger'
                        onClick={() => handleDelete(stage.id)}
                        disabled={reordering || deletingStageId !== null || savingEmployees}
                      >
                        {deletingStageId === stage.id ? 'Deleting...' : 'Delete'}
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

      <Modal size='lg' show={showEmployeesModal} onHide={handleCloseManageEmployees}>
        <Modal.Header closeButton>
          <Modal.Title>
            {managingStage ? `Manage Employees: ${managingStage.title}` : 'Manage Employees'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2'>
            <div className='text-muted'>
              Selected {selectedEmployeeIds.length} of {employees.length}
            </div>
            <div className='d-flex gap-2'>
              <Button
                size='sm'
                variant='outline-secondary'
                onClick={handleSelectAll}
                disabled={savingEmployees || loadingEmployees || employees.length === 0}
              >
                Select All
              </Button>
              <Button
                size='sm'
                variant='outline-secondary'
                onClick={handleClearAll}
                disabled={savingEmployees || loadingEmployees || selectedEmployeeIds.length === 0}
              >
                Clear
              </Button>
            </div>
          </div>
          <Form.Control
            className='mb-3'
            placeholder='Search employees by name, email, or ID...'
            value={employeeSearch}
            onChange={(event) => setEmployeeSearch(event.target.value)}
            disabled={loadingEmployees}
          />
          {loadingEmployees ? (
            <div className='text-center py-3'>
              <Spinner animation='border' size='sm' className='me-2' />
              Loading employees...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <Alert variant='warning' className='mb-0'>
              No employees match your search.
            </Alert>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              <Table hover responsive className='mb-0'>
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>Add</th>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <Form.Check
                          type='checkbox'
                          checked={selectedEmployeeIds.includes(employee.id)}
                          onChange={() => toggleEmployeeSelection(employee.id)}
                          disabled={savingEmployees}
                        />
                      </td>
                      <td>{`${employee.first_name} ${employee.surname}`.trim()}</td>
                      <td>{employee.email}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleCloseManageEmployees} disabled={savingEmployees}>
            Close
          </Button>
          <Button
            variant='primary'
            onClick={handleSaveEmployees}
            disabled={savingEmployees || loadingEmployees || managingStage === null}
          >
            {savingEmployees ? 'Saving...' : 'Save Employees'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default ApprovalStages
