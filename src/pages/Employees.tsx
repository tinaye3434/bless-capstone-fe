import { useState } from 'react'
import { Button, Modal, Table, Row, Form, Col } from 'react-bootstrap'

function Employees() {
  const [show, setShow] = useState(false)

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <>
      <div className='row'>
        <div className='d-flex justify-content-end'>
          <Button variant='primary' onClick={handleShow}>
            Add Employee
          </Button>
        </div>
      </div>
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
            <tbody></tbody>
          </Table>
        </div>
      </div>

      <Modal size='lg' show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className='mb-3'>
              <Form.Group as={Col} controlId='formGridFirstName'>
                <Form.Label>First Name</Form.Label>
                <Form.Control />
              </Form.Group>

              <Form.Group as={Col} controlId='formGridSurname'>
                <Form.Label>Surname</Form.Label>
                <Form.Control />
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='formGridAddress1'>
                <Form.Label>Email</Form.Label>
                <Form.Control type='email' />
              </Form.Group>

              <Form.Group as={Col} controlId='formGridPhone'>
                <Form.Label>Phone Number</Form.Label>
                <Form.Control />
              </Form.Group>
            </Row>

            <Row className='mb-3'>
              <Form.Group as={Col} controlId='formGridCity'>
                <Form.Label>Department</Form.Label>
                <Form.Select defaultValue='Choose...'>
                  <option>Choose...</option>
                  <option>...</option>
                </Form.Select>
              </Form.Group>

              <Form.Group as={Col} controlId='formGridState'>
                <Form.Label>Grade</Form.Label>
                <Form.Select defaultValue='Choose...'>
                  <option>Choose...</option>
                  <option>...</option>
                </Form.Select>
              </Form.Group>

              <Form.Group as={Col} controlId='formGridZip'>
                <Form.Label>Position</Form.Label>
                <Form.Select defaultValue='Choose...'>
                  <option>Choose...</option>
                  <option>...</option>
                </Form.Select>
              </Form.Group>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Close
          </Button>
          <Button variant='primary' onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Employees
