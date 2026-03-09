import { useMemo, useState } from 'react'
import { Badge, Button, Form, Table } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

type ClaimStatus = 'Pending' | 'Approved' | 'Rejected'

type Claim = {
  id: number
  employee: string
  purpose: string
  departure_date: string
  return_date: string
  origin: string
  destination: string
  total_allowances: number
  status: ClaimStatus
}

const initialClaims: Claim[] = [
  {
    id: 1001,
    employee: 'John Moyo',
    purpose: 'Regional planning workshop',
    departure_date: '2026-03-01',
    return_date: '2026-03-03',
    origin: 'Harare',
    destination: 'Bulawayo',
    total_allowances: 285,
    status: 'Pending',
  },
  {
    id: 1002,
    employee: 'Tariro Ncube',
    purpose: 'Supplier contract meeting',
    departure_date: '2026-02-19',
    return_date: '2026-02-20',
    origin: 'Mutare',
    destination: 'Harare',
    total_allowances: 120,
    status: 'Approved',
  },
  {
    id: 1003,
    employee: 'Nyasha Dube',
    purpose: 'Site inspection',
    departure_date: '2026-02-12',
    return_date: '2026-02-14',
    origin: 'Gweru',
    destination: 'Masvingo',
    total_allowances: 210,
    status: 'Rejected',
  },
]

function Dashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filteredClaims = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return initialClaims
    }

    return initialClaims.filter((claim) => {
      return (
        claim.employee.toLowerCase().includes(query) ||
        claim.purpose.toLowerCase().includes(query) ||
        claim.origin.toLowerCase().includes(query) ||
        claim.destination.toLowerCase().includes(query) ||
        String(claim.id).includes(query)
      )
    })
  }, [search])

  const getStatusVariant = (status: ClaimStatus) => {
    if (status === 'Approved') {
      return 'success'
    }

    if (status === 'Rejected') {
      return 'danger'
    }

    return 'warning'
  }

  return (
    <>
      <div className='row mb-3'>
        <div className='col-md-6'>
          <Form.Control
            placeholder='Search claims by employee, purpose, route, or claim ID...'
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className='col-md-6 d-flex justify-content-md-end mt-2 mt-md-0'>
          <Button variant='primary' onClick={() => navigate('/create-claim')}>
            Create Claim
          </Button>
        </div>
      </div>

      <div className='row'>
        <div className='col-12'>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Claim #</th>
                <th>Employee</th>
                <th>Purpose</th>
                <th>Travel Dates</th>
                <th>Route</th>
                <th>Total Allowances</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className='text-center py-4'>
                    No claims found.
                  </td>
                </tr>
              ) : (
                filteredClaims.map((claim) => (
                  <tr key={claim.id}>
                    <td>{claim.id}</td>
                    <td>{claim.employee}</td>
                    <td>{claim.purpose}</td>
                    <td>{claim.departure_date} - {claim.return_date}</td>
                    <td>
                      {claim.origin} to {claim.destination}
                    </td>
                    <td>{claim.total_allowances.toFixed(2)}</td>
                    <td>
                      <Badge bg={getStatusVariant(claim.status)}>{claim.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  )
}

export default Dashboard
