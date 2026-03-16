import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Alert, Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'

type ClaimForm = {
  employee: string
  purpose: string
  departure_date: string
  return_date: string
  origin: string
  destination: string
}

type AllowanceRow = {
  id: number
  allowance: string
  quantity: string
  amount: string
}

type AllowanceOption = {
  id: number | string
  title?: string
  name?: string
  label?: string
  cost?: number
}

type Employee = {
  id: number | string
  first_name?: string
  surname?: string
  name?: string
  full_name?: string
}

type ClaimDetail = {
  id: number | string
  employee_id?: number | string
  purpose?: string
  departure_date?: string
  return_date?: string
  origin?: string
  destination?: string
  user_distance?: number
  nights?: number
  days?: number
}

type ClaimLine = {
  id?: number | string
  claim_id?: number | string
  allowance_id?: number | string
  quantity?: number
  amount?: number
}

type Coordinates = {
  lat: number
  lon: number
}

const EMPLOYEES_ENDPOINT = '/api/employee/'
const CITIES_ENDPOINT = '/api/cities/'
const ALLOWANCES_ENDPOINT = '/api/allowances/'
const CLAIMS_ENDPOINT = '/api/claims/'
const CLAIM_LINES_ENDPOINT = '/api/claim-lines/'

const initialClaimForm: ClaimForm = {
  employee: '',
  purpose: '',
  departure_date: '',
  return_date: '',
  origin: '',
  destination: '',
}

const createAllowanceRow = (id: number): AllowanceRow => ({
  id,
  allowance: '',
  quantity: '',
  amount: '',
})

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

const normalizeCitiesResponse = (payload: unknown): string[] => {
  const extractCityName = (value: unknown): string => {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value).trim()
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>
      const candidates = [record.name, record.city, record.title, record.label]
      const matched = candidates.find(
        (candidate) => typeof candidate === 'string' || typeof candidate === 'number',
      )

      return matched === undefined ? '' : String(matched).trim()
    }

    return ''
  }

  const toCityList = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((city) => extractCityName(city))
      .filter((city): city is string => city.length > 0)
  }

  if (Array.isArray(payload)) {
    return toCityList(payload)
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const knownCollections = [record.data, record.results, record.cities]

    for (const collection of knownCollections) {
      const normalized = toCityList(collection)
      if (normalized.length > 0) {
        return normalized
      }
    }
  }

  return []
}

const getEmployeeLabel = (employee: Employee): string => {
  const fullName =
    employee.full_name?.trim() ||
    employee.name?.trim() ||
    `${employee.first_name ?? ''} ${employee.surname ?? ''}`.trim()

  return fullName || `Employee ${employee.id}`
}

const normalizeAllowancesResponse = (payload: unknown): AllowanceOption[] => {
  if (Array.isArray(payload)) {
    return payload as AllowanceOption[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as AllowanceOption[]
    }

    if (Array.isArray(record.results)) {
      return record.results as AllowanceOption[]
    }

    if (Array.isArray(record.allowances)) {
      return record.allowances as AllowanceOption[]
    }
  }

  return []
}

const getAllowanceLabel = (allowance: AllowanceOption): string => {
  const label = allowance.title?.trim() || allowance.name?.trim() || allowance.label?.trim()
  return label || `Allowance ${allowance.id}`
}

const normalizeClaimLinesResponse = (payload: unknown): ClaimLine[] => {
  if (Array.isArray(payload)) {
    return payload as ClaimLine[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as ClaimLine[]
    }

    if (Array.isArray(record.results)) {
      return record.results as ClaimLine[]
    }

    if (Array.isArray(record.claim_lines)) {
      return record.claim_lines as ClaimLine[]
    }
  }

  return []
}

const fetchClaimLines = async (claimId: string): Promise<ClaimLine[]> => {
  try {
    const response = await axios.get(`${CLAIMS_ENDPOINT}${claimId}/lines/`)
    const lines = normalizeClaimLinesResponse(response.data)
    return lines.filter((line) => String(line.claim_id ?? claimId) === String(claimId))
  } catch (error) {
    console.warn('Claim lines not available at /claims/:id/lines/.', error)
  }

  try {
    const response = await axios.get(`${CLAIM_LINES_ENDPOINT}?claim_id=${claimId}`)
    const lines = normalizeClaimLinesResponse(response.data)
    return lines.filter((line) => String(line.claim_id ?? claimId) === String(claimId))
  } catch (error) {
    console.warn('Claim lines not available at /claim-lines/.', error)
  }

  return []
}

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

const toDateTimeLocal = (value?: string): string => {
  if (!value) {
    return ''
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  const local = new Date(date.getTime() - offsetMs)
  return local.toISOString().slice(0, 16)
}

function CreateClaim() {
  const navigate = useNavigate()
  const { id: claimId } = useParams()
  const isEditing = Boolean(claimId)
  const [formData, setFormData] = useState<ClaimForm>(initialClaimForm)
  const [allowances, setAllowances] = useState<AllowanceRow[]>([createAllowanceRow(1)])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [locations, setLocations] = useState<string[]>([])
  const [allowanceOptions, setAllowanceOptions] = useState<AllowanceOption[]>([])
  const [nextAllowanceId, setNextAllowanceId] = useState(2)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingClaim, setLoadingClaim] = useState(false)
  const [savingClaim, setSavingClaim] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([])
  const [suggestError, setSuggestError] = useState<string | null>(null)
  const [distancePreview, setDistancePreview] = useState<{ base: number; adjusted: number } | null>(
    null,
  )
  const [distanceLoading, setDistanceLoading] = useState(false)
  const [distanceError, setDistanceError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true)
      setLoadError(null)

      try {
        const [allowancesResponse, employeesResponse, citiesResponse] = await Promise.all([
          axios.get(ALLOWANCES_ENDPOINT),
          axios.get(EMPLOYEES_ENDPOINT),
          axios.get(CITIES_ENDPOINT),
        ])

        setAllowanceOptions(normalizeAllowancesResponse(allowancesResponse.data))
        setEmployees(normalizeEmployeesResponse(employeesResponse.data))
        setLocations(normalizeCitiesResponse(citiesResponse.data))
      } catch (error) {
        setLoadError('Failed to load employees, cities, and allowances.')
        console.error(error)
      } finally {
        setLoadingOptions(false)
      }
    }

    void fetchOptions()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const loadSuggestions = async (query: string, setter: (value: string[]) => void) => {
      if (!query || query.trim().length < 2) {
        setter([])
        return
      }
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '8',
          countrycodes: 'zw',
        })
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { signal: controller.signal, headers: { 'Accept': 'application/json' } },
        )
        const data = (await response.json()) as Array<{ display_name?: string }>
        const items = Array.from(
          new Set(
            data
              .map((item) => (item.display_name ?? '').split(',')[0].trim())
              .filter((item) => item.length > 0),
          ),
        )
        setter(items)
      } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError') {
          setSuggestError('Failed to load location suggestions.')
        }
      }
    }

    const timeout = window.setTimeout(() => {
      void loadSuggestions(formData.origin, setOriginSuggestions)
    }, 400)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [formData.origin])

  useEffect(() => {
    const controller = new AbortController()
    const loadSuggestions = async (query: string, setter: (value: string[]) => void) => {
      if (!query || query.trim().length < 2) {
        setter([])
        return
      }
      try {
        const params = new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '8',
          countrycodes: 'zw',
        })
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`,
          { signal: controller.signal, headers: { 'Accept': 'application/json' } },
        )
        const data = (await response.json()) as Array<{ display_name?: string }>
        const items = Array.from(
          new Set(
            data
              .map((item) => (item.display_name ?? '').split(',')[0].trim())
              .filter((item) => item.length > 0),
          ),
        )
        setter(items)
      } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError') {
          setSuggestError('Failed to load location suggestions.')
        }
      }
    }

    const timeout = window.setTimeout(() => {
      void loadSuggestions(formData.destination, setDestinationSuggestions)
    }, 400)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [formData.destination])

  useEffect(() => {
    const controller = new AbortController()
    const fetchCoords = async (query: string): Promise<Coordinates | null> => {
      if (!query || query.trim().length < 2) {
        return null
      }
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '1',
        countrycodes: 'zw',
      })
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        { signal: controller.signal, headers: { Accept: 'application/json' } },
      )
      const data = (await response.json()) as Array<{ lat?: string; lon?: string }>
      if (!data || data.length === 0) {
        return null
      }
      return {
        lat: Number(data[0].lat),
        lon: Number(data[0].lon),
      }
    }

    const haversineKm = (a: Coordinates, b: Coordinates) => {
      const radius = 6371
      const dLat = ((b.lat - a.lat) * Math.PI) / 180
      const dLon = ((b.lon - a.lon) * Math.PI) / 180
      const lat1 = (a.lat * Math.PI) / 180
      const lat2 = (b.lat * Math.PI) / 180
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
      return 2 * radius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
    }

    const computeDistance = async () => {
      if (!formData.origin || !formData.destination) {
        setDistancePreview(null)
        setDistanceError(null)
        return
      }
      setDistanceLoading(true)
      setDistanceError(null)
      try {
        const [origin, destination] = await Promise.all([
          fetchCoords(formData.origin),
          fetchCoords(formData.destination),
        ])
        if (!origin || !destination) {
          setDistancePreview(null)
          setDistanceError('Unable to estimate distance for these locations yet.')
          return
        }
        const base = haversineKm(origin, destination)
        const adjusted = base * 1.2
        setDistancePreview({ base, adjusted })
      } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError') {
          setDistancePreview(null)
          setDistanceError('Failed to calculate distance preview.')
        }
      } finally {
        setDistanceLoading(false)
      }
    }

    const timeout = window.setTimeout(() => {
      void computeDistance()
    }, 500)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [formData.origin, formData.destination])

  useEffect(() => {
    if (!claimId) {
      return
    }

    const fetchClaim = async () => {
      setLoadingClaim(true)
      setLoadError(null)

      try {
        const [claimResponse, claimLines] = await Promise.all([
          axios.get<ClaimDetail>(`${CLAIMS_ENDPOINT}${claimId}/`),
          fetchClaimLines(claimId),
        ])

        const claim = claimResponse.data
        setFormData({
          employee: claim.employee_id !== undefined ? String(claim.employee_id) : '',
          purpose: claim.purpose ?? '',
          departure_date: toDateTimeLocal(claim.departure_date),
          return_date: toDateTimeLocal(claim.return_date),
          origin: claim.origin ?? '',
          destination: claim.destination ?? '',
        })

        if (claimLines.length > 0) {
          const mappedRows = claimLines.map((line, index) => {
            const allowanceId = line.allowance_id !== undefined ? String(line.allowance_id) : ''
            const matchedAllowance = allowanceOptions.find(
              (option) => String(option.id) === allowanceId,
            )
            const amount =
              line.amount !== undefined
                ? String(line.amount)
                : matchedAllowance?.cost !== undefined
                  ? String(matchedAllowance.cost)
                  : ''

            return {
              id: index + 1,
              allowance: allowanceId,
              quantity: line.quantity !== undefined ? String(line.quantity) : '',
              amount,
            }
          })
          setAllowances(mappedRows)
          setNextAllowanceId(mappedRows.length + 1)
        }
      } catch (error) {
        setLoadError('Failed to load claim details.')
        console.error(error)
      } finally {
        setLoadingClaim(false)
      }
    }

    void fetchClaim()
  }, [claimId])

  useEffect(() => {
    if (!isEditing || allowanceOptions.length === 0) {
      return
    }

    setAllowances((previous) =>
      previous.map((row) => {
        if (row.amount) {
          return row
        }
        const matched = allowanceOptions.find(
          (option) => String(option.id) === String(row.allowance),
        )
        if (!matched || matched.cost === undefined) {
          return row
        }
        return { ...row, amount: String(matched.cost) }
      }),
    )
  }, [isEditing, allowanceOptions])

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
      previous.map((row) => {
        if (row.id !== id) {
          return row
        }

        if (field === 'allowance') {
          const matched = allowanceOptions.find((option) => String(option.id) === String(value))
          const amount = matched?.cost !== undefined ? String(matched.cost) : ''
          return { ...row, allowance: value, amount }
        }

        return { ...row, [field]: value }
      }),
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSavingClaim(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    const parseId = (value: string) => {
      const numeric = Number(value)
      return Number.isNaN(numeric) ? value : numeric
    }

    const allowancePayload = allowances
      .filter((row) => row.allowance)
      .map((row) => ({
        allowance_id: parseId(row.allowance),
        quantity: Number(row.quantity) || 0,
        amount: Number(row.amount) || 0,
      }))

    const payload = {
      employee_id: parseId(formData.employee),
      purpose: formData.purpose.trim(),
      departure_date: formData.departure_date,
      return_date: formData.return_date,
      origin: formData.origin,
      destination: formData.destination,
      nights,
      days,
      total_allowances: allowancesTotal,
      allowances: allowancePayload,
      auto_distance: true,
    }

    try {
      const response = isEditing
        ? await axios.put(`${CLAIMS_ENDPOINT}${claimId}/`, payload)
        : await axios.post(CLAIMS_ENDPOINT, payload)
      console.log('Save claim response:', response.data)
      setSubmitted(true)
      setSubmitSuccess(isEditing ? 'Claim updated successfully.' : 'Claim submitted successfully.')
      navigate('/my-claims')
    } catch (error) {
      setSubmitError(isEditing ? 'Failed to update claim.' : 'Failed to submit claim.')
      console.error(error)
    } finally {
      setSavingClaim(false)
    }
  }

  return (
    <div>
      <div className='mb-4'>
        <h2 className='page-title'>{isEditing ? 'Edit Claim' : 'Create Claim'}</h2>
        <p className='page-subtitle'>Capture trip details, allowances, and submit for review.</p>
      </div>
      <div className='row'>
        <div className='col-12'>
          <Card>
            <Card.Body>
              <h5 className='mb-3'>Trip Details</h5>
            {loadError ? <Alert variant='danger'>{loadError}</Alert> : null}
            {submitError ? <Alert variant='danger'>{submitError}</Alert> : null}
            {suggestError ? <Alert variant='warning'>{suggestError}</Alert> : null}
            {distanceError ? <Alert variant='warning'>{distanceError}</Alert> : null}
            {submitSuccess ? <Alert variant='success'>{submitSuccess}</Alert> : null}
            {loadingOptions || loadingClaim ? (
              <div className='d-flex align-items-center mb-3'>
                <Spinner animation='border' size='sm' className='me-2' />
                <span>
                  {loadingClaim
                    ? 'Loading claim details...'
                    : 'Loading employees, cities, and allowances...'}
                </span>
              </div>
            ) : null}
            <Form onSubmit={handleSubmit}>
              <Row className='mb-3'>
                <Form.Group as={Col} md={12} controlId='claimEmployee'>
                  <Form.Label>Employee</Form.Label>
                  <Form.Select
                    name='employee'
                    value={formData.employee}
                    onChange={handleInputChange}
                    disabled={loadingOptions}
                    required
                  >
                    <option value=''>Choose employee...</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={String(employee.id)}>
                        {getEmployeeLabel(employee)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Row>

              <Row className='mb-3'>
                <Form.Group as={Col} md={12} controlId='claimPurpose'>
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
                  <Form.Control
                    list='origin-suggestions'
                    name='origin'
                    value={formData.origin}
                    onChange={handleInputChange}
                    disabled={loadingOptions}
                    required
                    placeholder='Start typing a town or city...'
                  />
                  <datalist id='origin-suggestions'>
                    {originSuggestions.length > 0
                      ? originSuggestions.map((option) => (
                          <option key={option} value={option} />
                        ))
                      : locations.map((location) => (
                          <option key={location} value={location} />
                        ))}
                  </datalist>
                </Form.Group>

                <Form.Group as={Col} md={4} controlId='claimDestination'>
                  <Form.Label>Destination</Form.Label>
                  <Form.Control
                    list='destination-suggestions'
                    name='destination'
                    value={formData.destination}
                    onChange={handleInputChange}
                    disabled={loadingOptions}
                    required
                    placeholder='Start typing a town or city...'
                  />
                  <datalist id='destination-suggestions'>
                    {destinationSuggestions.length > 0
                      ? destinationSuggestions.map((option) => (
                          <option key={option} value={option} />
                        ))
                      : locations.map((location) => (
                          <option key={location} value={location} />
                        ))}
                  </datalist>
                </Form.Group>
                <Col md={4} className='d-flex align-items-end'>
                  <div className='text-muted small'>
                    Distance is calculated automatically (+20% local errands).
                  </div>
                </Col>
              </Row>

              <Row className='mb-4'>
                <Col>
                  <Card className='border-0 bg-light'>
                    <Card.Body className='d-flex align-items-center justify-content-between'>
                      <div>
                        <div className='text-muted small mb-1'>Estimated Distance</div>
                        <div className='fw-semibold'>
                          {distanceLoading
                            ? 'Calculating...'
                            : distancePreview
                              ? `${distancePreview.adjusted.toFixed(1)} km (includes errands)`
                              : 'Enter origin and destination'}
                        </div>
                        {distancePreview ? (
                          <div className='text-muted small'>
                            Base route: {distancePreview.base.toFixed(1)} km
                          </div>
                        ) : null}
                      </div>
                      {distancePreview ? (
                        <Badge bg='success' className='px-3 py-2'>
                          Auto-calculated
                        </Badge>
                      ) : (
                        <Badge bg='secondary' className='px-3 py-2'>
                          Waiting
                        </Badge>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
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
                              <option key={allowance.id} value={String(allowance.id)}>
                                {getAllowanceLabel(allowance)}
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
                            readOnly
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

              <div className='d-flex justify-content-end'>
                <Button type='submit' variant='primary' disabled={savingClaim || loadingOptions}>
                  {savingClaim ? 'Saving...' : 'Save Claim'}
                </Button>
              </div>
            </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreateClaim
