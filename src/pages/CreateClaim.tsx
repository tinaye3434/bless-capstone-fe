import { useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row, Table } from 'react-bootstrap'

type ClaimForm = {
  employee: string
  purpose: string
  departure_date: string
  return_date: string
  origin: string
  destination: string
  user_distance: string
}

type AllowanceRow = {
  id: number
  allowance: string
  quantity: string
  amount: string
}

const employees = [
  { value: '1', label: 'John Moyo' },
  { value: '2', label: 'Tariro Ncube' },
  { value: '3', label: 'Nyasha Dube' },
]

const locations = [
  'Harare',
  'Bulawayo',
  'Mutare',
  'Gweru',
  'Masvingo',
  'Chinhoyi',
  'Kadoma',
]

const allowanceOptions = ['Accommodation', 'Meal', 'Transport', 'Fuel', 'Incidentals']

const initialClaimForm: ClaimForm = {
  employee: '',
  purpose: '',
  departure_date: '',
  return_date: '',
  origin: '',
  destination: '',
  user_distance: '',
}

const createAllowanceRow = (id: number): AllowanceRow => ({
  id,
  allowance: '',
  quantity: '',
  amount: '',
})

const getTripValues = (departureDateTime: string, returnDateTime: string) => {
  if (!departureDateTime || !returnDateTime) {
    return { nights: 0, days: 0 }
  }

  const departure = new Date(departureDateTime)
  const returned = new Date(returnDateTime)

  if (
    Number.isNaN(departure.getTime()) ||
    Number.isNaN(returned.getTime()) ||
    returned <= departure
  ) {
    return { nights: 0, days: 0 }
  }

  const oneDayMs = 1000 * 60 * 60 * 24
  const differenceMs = returned.getTime() - departure.getTime()
  const days = Math.ceil(differenceMs / oneDayMs)
  const nights = Math.max(0, days - 1)

  return { nights, days }
}

function CreateClaim() {
  const [formData, setFormData] = useState<ClaimForm>(initialClaimForm)
  const [allowances, setAllowances] = useState<AllowanceRow[]>([createAllowanceRow(1)])
  const [nextAllowanceId, setNextAllowanceId] = useState(2)
  const [submitted, setSubmitted] = useState(false)

  const { nights, days } = useMemo(
    () => getTripValues(formData.departure_date, formData.return_date),
    [formData.departure_date, formData.return_date],
  )

  const allowancesTotal = useMemo(() => {
    return allowances.reduce((total, row) => {
      const quantity = Number(row.quantity) || 0
      const amount = Number(row.amount) || 0
      return total + quantity * amount
    }, 0)
  }, [allowances])

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
  }

  const handleAllowanceChange = (
    id: number,
    field: keyof Pick<AllowanceRow, 'allowance' | 'quantity' | 'amount'>,
    value: string,
  ) => {
    setAllowances((previous) =>
      previous.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  const addAllowanceRow = () => {
    setAllowances((previous) => [...previous, createAllowanceRow(nextAllowanceId)])
    setNextAllowanceId((previous) => previous + 1)
  }

  const removeAllowanceRow = (id: number) => {
    setAllowances((previous) => {
      if (previous.length === 1) {
        return previous
      }
      return previous.filter((row) => row.id !== id)
    })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className='row'>
      <div className='col-12'>
        <Card>
          <Card.Body>
            <h5 className='mb-3'>Create Claim</h5>
            <Form onSubmit={handleSubmit}>
              <Row className='mb-3'>
                <Form.Group as={Col} md={6} controlId='claimEmployee'>
                  <Form.Label>Employee</Form.Label>
                  <Form.Select
                    name='employee'
                    value={formData.employee}
                    onChange={handleInputChange}
                    required
                  >
                    <option value=''>Choose employee...</option>
                    {employees.map((employee) => (
                      <option key={employee.value} value={employee.value}>
                        {employee.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group as={Col} md={6} controlId='claimPurpose'>
                  <Form.Label>Purpose</Form.Label>
                  <Form.Control
                    as='textarea'
                    rows={1}
                    name='purpose'
                    value={formData.purpose}
                    onChange={handleInputChange}
                    placeholder='Trip purpose'
                    required
                  />
                </Form.Group>
              </Row>

              <Row className='mb-3'>
                <Form.Group as={Col} md={4} controlId='claimDepartureDate'>
                  <Form.Label>Departure Date & Time</Form.Label>
                  <Form.Control
                    type='datetime-local'
                    name='departure_date'
                    value={formData.departure_date}
                    onChange={handleInputChange}
                    step={60}
                    required
                  />
                </Form.Group>

                <Form.Group as={Col} md={4} controlId='claimReturnDate'>
                  <Form.Label>Return Date & Time</Form.Label>
                  <Form.Control
                    type='datetime-local'
                    name='return_date'
                    value={formData.return_date}
                    onChange={handleInputChange}
                    min={formData.departure_date || undefined}
                    step={60}
                    required
                  />
                </Form.Group>

                <Form.Group as={Col} md={2} controlId='claimNights'>
                  <Form.Label>Nights</Form.Label>
                  <Form.Control value={nights} readOnly />
                </Form.Group>

                <Form.Group as={Col} md={2} controlId='claimDays'>
                  <Form.Label>Days</Form.Label>
                  <Form.Control value={days} readOnly />
                </Form.Group>
              </Row>

              <Row className='mb-4'>
                <Form.Group as={Col} md={4} controlId='claimOrigin'>
                  <Form.Label>Origin</Form.Label>
                  <Form.Select
                    name='origin'
                    value={formData.origin}
                    onChange={handleInputChange}
                    required
                  >
                    <option value=''>Choose origin...</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group as={Col} md={4} controlId='claimDestination'>
                  <Form.Label>Destination</Form.Label>
                  <Form.Select
                    name='destination'
                    value={formData.destination}
                    onChange={handleInputChange}
                    required
                  >
                    <option value=''>Choose destination...</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group as={Col} md={4} controlId='claimDistance'>
                  <Form.Label>User Distance (km)</Form.Label>
                  <Form.Control
                    type='number'
                    min='0'
                    step='0.1'
                    name='user_distance'
                    value={formData.user_distance}
                    onChange={handleInputChange}
                    placeholder='Distance'
                    required
                  />
                </Form.Group>
              </Row>

              <div className='d-flex justify-content-between align-items-center mb-2'>
                <h6 className='mb-0'>Allowances</h6>
                <Button variant='outline-primary' onClick={addAllowanceRow} type='button' size='sm'>
                  Add Row
                </Button>
              </div>

              <Table hover>
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Allowance</th>
                    <th style={{ width: '20%' }}>Quantity</th>
                    <th style={{ width: '20%' }}>Amount</th>
                    <th style={{ width: '20%' }}>Row Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allowances.map((row) => {
                    const quantity = Number(row.quantity) || 0
                    const amount = Number(row.amount) || 0
                    const rowTotal = quantity * amount

                    return (
                      <tr key={row.id}>
                        <td>
                          <Form.Select
                            value={row.allowance}
                            onChange={(event) =>
                              handleAllowanceChange(row.id, 'allowance', event.target.value)
                            }
                            required
                          >
                            <option value=''>Choose allowance...</option>
                            {allowanceOptions.map((allowance) => (
                              <option key={allowance} value={allowance}>
                                {allowance}
                              </option>
                            ))}
                          </Form.Select>
                        </td>
                        <td>
                          <Form.Control
                            type='number'
                            min='0'
                            step='1'
                            value={row.quantity}
                            onChange={(event) =>
                              handleAllowanceChange(row.id, 'quantity', event.target.value)
                            }
                            required
                          />
                        </td>
                        <td>
                          <Form.Control
                            type='number'
                            min='0'
                            step='0.01'
                            value={row.amount}
                            onChange={(event) =>
                              handleAllowanceChange(row.id, 'amount', event.target.value)
                            }
                            required
                          />
                        </td>
                        <td className='align-middle'>{rowTotal.toFixed(2)}</td>
                        <td className='align-middle'>
                          <Button
                            variant='outline-danger'
                            size='sm'
                            type='button'
                            onClick={() => removeAllowanceRow(row.id)}
                            disabled={allowances.length === 1}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>

              <div className='d-flex justify-content-end mb-3'>
                <div>
                  <strong>Total Allowances: {allowancesTotal.toFixed(2)}</strong>
                </div>
              </div>

              {submitted ? (
                <Alert variant='success'>
                  Claim captured on the screen. Connect submit handler to your API when ready.
                </Alert>
              ) : null}

              <div className='d-flex justify-content-end'>
                <Button type='submit' variant='primary'>
                  Save Claim
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default CreateClaim
