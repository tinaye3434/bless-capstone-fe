import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import axios from 'axios'
import { Alert, Button, Card, Col, Row, Spinner, Table } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CLAIMS_ENDPOINT,
  EMPLOYEES_ENDPOINT,
  LOCATIONS_ENDPOINT,
  formatClaimStatus,
  getClaimStatusClassName,
  getEmployeeLabel,
  normalizeEmployeesResponse,
  normalizeLocationsResponse,
  type Employee,
  type LocationPoint,
} from '../utils/claims'

type ClaimDetail = {
  id: number | string
  employee_id?: number | string
  employee?: string
  purpose?: string
  departure_date?: string
  return_date?: string
  nights?: number
  days?: number
  origin?: string
  destination?: string
  user_distance?: number
  calculated_distance?: number
  total?: number
  total_allowances?: number
  stage_id?: number | string
  approval_status?: string
}

type ClaimLine = {
  id?: number | string
  claim_id?: number | string
  allowance_id?: number | string
  quantity?: number
  amount?: number
}

type GPSValidation = {
  id: number | string
  claim: number | string
  origin: string
  destination: string
  base_distance_km: number
  adjusted_distance_km: number
  errands_factor: number
  source?: string
  created_at?: string
}

type AllowanceOption = {
  id: number | string
  title?: string
  name?: string
  label?: string
}

type RiskScore = {
  score?: number
  risk_level?: string
  model_snapshot_id?: number
  auto_approve?: boolean
  manual_review_required?: boolean
  rule_flags?: Array<{
    code?: string
    severity?: string
    message?: string
  }>
}

type ResolvedLocation = LocationPoint & {
  latitude: number
  longitude: number
}

type DrivingRoute = {
  distanceKm: number
  durationMinutes: number
  points: [number, number][]
}

type LeafletLayerLike = {
  addTo: (map: LeafletMapLike) => LeafletLayerLike
  bindTooltip: (content: string) => LeafletLayerLike
}

type LeafletMapLike = {
  fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void
  invalidateSize: () => void
  remove: () => void
}

type LeafletLike = {
  circleMarker: (
    coordinates: [number, number],
    options?: Record<string, unknown>,
  ) => LeafletLayerLike
  latLngBounds: (points: [number, number][]) => unknown
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMapLike
  polyline: (points: [number, number][], options?: Record<string, unknown>) => LeafletLayerLike
  tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMapLike) => void }
}

type LeafletWindow = Window & {
  L?: LeafletLike
}

type DrivingRouteApiResponse = {
  distance_km?: number
  duration_minutes?: number
  coordinates?: Array<[number, number]>
}

const CLAIM_LINES_ENDPOINT = '/api/claim-lines/'
const ALLOWANCES_ENDPOINT = '/api/allowances/'
const GPS_VALIDATIONS_ENDPOINT = '/api/gps-validations/'
const LEAFLET_SCRIPT_ID = 'leaflet-script'
const LEAFLET_STYLE_ID = 'leaflet-style'
const DRIVING_ROUTE_ENDPOINT = '/api/routes/driving/'

const normalizeName = (value?: string) => (value ?? '').trim().toLowerCase()

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatAmount = (value: number): string => value.toFixed(2)

const formatDistance = (value: number | null, fallback = '-'): string => {
  if (value === null) {
    return fallback
  }

  return `${value.toFixed(1)} km`
}

const formatSignedDistance = (value: number | null, fallback = 'Pending'): string => {
  if (value === null) {
    return fallback
  }

  if (Math.abs(value) < 0.05) {
    return '0.0 km'
  }

  return `${value > 0 ? '+' : '-'}${Math.abs(value).toFixed(1)} km`
}

const formatDateValue = (value?: string): string => {
  if (!value) {
    return '-'
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Intl.DateTimeFormat('en-ZW', { dateStyle: 'medium' }).format(
      new Date(year, month - 1, day),
    )
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-ZW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

const getInitials = (value?: string): string => {
  const cleaned = value?.trim()
  if (!cleaned) {
    return 'CL'
  }

  const parts = cleaned.split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

const getSeverityClassName = (severity?: string): string => {
  const normalized = normalizeName(severity)
  if (normalized === 'high') {
    return 'claim-review-severity-pill severity-high'
  }
  if (normalized === 'medium') {
    return 'claim-review-severity-pill severity-medium'
  }
  if (normalized === 'low' || normalized === 'info') {
    return 'claim-review-severity-pill severity-low'
  }
  return 'claim-review-severity-pill severity-unknown'
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

const normalizeGpsValidationsResponse = (payload: unknown): GPSValidation[] => {
  if (Array.isArray(payload)) {
    return payload as GPSValidation[]
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>

    if (Array.isArray(record.data)) {
      return record.data as GPSValidation[]
    }

    if (Array.isArray(record.results)) {
      return record.results as GPSValidation[]
    }

    if (Array.isArray(record.validations)) {
      return record.validations as GPSValidation[]
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

const getAllowanceLabel = (allowance: AllowanceOption): string => {
  const label = allowance.title?.trim() || allowance.name?.trim() || allowance.label?.trim()
  return label || `Allowance ${allowance.id}`
}

const resolveLocationByName = (
  locations: LocationPoint[],
  candidate?: string,
): ResolvedLocation | null => {
  const target = normalizeName(candidate)
  if (!target) {
    return null
  }

  for (const location of locations) {
    if (normalizeName(location.name) !== target) {
      continue
    }

    const latitude = toFiniteNumber(location.latitude)
    const longitude = toFiniteNumber(location.longitude)
    if (latitude === null || longitude === null) {
      continue
    }

    return {
      ...location,
      latitude,
      longitude,
    }
  }

  return null
}

const loadLeafletAssets = async (): Promise<LeafletLike> => {
  if (!document.getElementById(LEAFLET_STYLE_ID)) {
    const link = document.createElement('link')
    link.id = LEAFLET_STYLE_ID
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }

  const leafletWindow = window as LeafletWindow
  if (leafletWindow.L) {
    return leafletWindow.L
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Failed to load Leaflet.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.id = LEAFLET_SCRIPT_ID
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Leaflet.'))
    document.body.appendChild(script)
  })

  if (!leafletWindow.L) {
    throw new Error('Leaflet did not initialize.')
  }

  return leafletWindow.L
}

const fetchDrivingRoute = async (
  origin: ResolvedLocation,
  destination: ResolvedLocation,
): Promise<DrivingRoute> => {
  const response = await axios.get<DrivingRouteApiResponse>(DRIVING_ROUTE_ENDPOINT, {
    params: {
      origin_lat: origin.latitude,
      origin_lng: origin.longitude,
      destination_lat: destination.latitude,
      destination_lng: destination.longitude,
    },
    timeout: 15000,
  })

  const geometryPoints =
    response.data.coordinates
      ?.map(([latitude, longitude]) => {
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          return null
        }
        return [latitude, longitude] as [number, number]
      })
      .filter((point): point is [number, number] => point !== null) ?? []

  if (geometryPoints.length < 2) {
    throw new Error('Driving route unavailable.')
  }

  return {
    distanceKm: Number(response.data.distance_km ?? 0),
    durationMinutes: Number(response.data.duration_minutes ?? 0),
    points: geometryPoints,
  }
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className='claim-review-detail-row'>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function SummaryMetric({
  label,
  value,
  note,
}: {
  label: string
  value: string
  note: string
}) {
  return (
    <div className='claim-review-metric-card'>
      <span className='claim-review-metric-label'>{label}</span>
      <strong className='claim-review-metric-value'>{value}</strong>
      <span className='claim-review-metric-note'>{note}</span>
    </div>
  )
}

function ClaimRouteMap({
  origin,
  destination,
  claimOrigin,
  claimDestination,
}: {
  origin: ResolvedLocation | null
  destination: ResolvedLocation | null
  claimOrigin?: string
  claimDestination?: string
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMapLike | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [routeWarning, setRouteWarning] = useState<string | null>(null)

  const unresolvedLocations = useMemo(() => {
    const missing: string[] = []
    if (!origin && claimOrigin) {
      missing.push(`origin "${claimOrigin}"`)
    }
    if (!destination && claimDestination) {
      missing.push(`destination "${claimDestination}"`)
    }
    return missing
  }, [claimDestination, claimOrigin, destination, origin])

  useEffect(() => {
    let cancelled = false

    const renderMap = async () => {
      if (!containerRef.current || !origin || !destination) {
        return
      }

      try {
        setMapError(null)
        setRouteWarning(null)

        const leaflet = await loadLeafletAssets()
        if (cancelled || !containerRef.current) {
          return
        }

        if (mapRef.current) {
          mapRef.current.remove()
        }

        const map = leaflet.map(containerRef.current, {
          zoomControl: true,
          scrollWheelZoom: false,
        })

        mapRef.current = map

        leaflet
          .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
          })
          .addTo(map)

        const routePoints: [number, number][] = [
          [origin.latitude, origin.longitude],
          [destination.latitude, destination.longitude],
        ]
        const sameCoordinates =
          Math.abs(origin.latitude - destination.latitude) < 0.0001 &&
          Math.abs(origin.longitude - destination.longitude) < 0.0001
        let drivingRoute: DrivingRoute | null = null

        if (!sameCoordinates) {
          try {
            drivingRoute = await fetchDrivingRoute(origin, destination)
          } catch (routeError) {
            console.warn('Failed to resolve driving route.', routeError)
            let detail = 'Driving route could not be loaded right now. Showing the trip stops only.'
            if (axios.isAxiosError(routeError)) {
              const responseDetail = (routeError.response?.data as { detail?: string } | undefined)?.detail
              if (responseDetail) {
                detail = responseDetail
              }
            } else if (routeError instanceof Error && routeError.message) {
              detail = routeError.message
            }
            if (!cancelled) {
              setRouteWarning(`${detail} Showing the trip stops only.`)
            }
          }
        }

        if (drivingRoute) {
          leaflet
            .polyline(drivingRoute.points, {
              color: '#0f766e',
              weight: 4,
              opacity: 0.88,
            })
            .bindTooltip(
              `${origin.name} to ${destination.name} • ${drivingRoute.distanceKm.toFixed(1)} km • ${drivingRoute.durationMinutes.toFixed(0)} min`,
            )
            .addTo(map)
        }

        leaflet
          .circleMarker([origin.latitude, origin.longitude], {
            radius: 10,
            color: '#0f766e',
            weight: 3,
            fillColor: '#ffffff',
            fillOpacity: 1,
          })
          .bindTooltip(`Origin: ${origin.name}`)
          .addTo(map)

        leaflet
          .circleMarker([destination.latitude, destination.longitude], {
            radius: sameCoordinates ? 7 : 10,
            color: '#ea580c',
            weight: 3,
            fillColor: '#ffffff',
            fillOpacity: 1,
          })
          .bindTooltip(`Destination: ${destination.name}`)
          .addTo(map)

        const bounds = sameCoordinates
          ? leaflet.latLngBounds([
              [origin.latitude - 0.18, origin.longitude - 0.18],
              [origin.latitude + 0.18, origin.longitude + 0.18],
            ])
          : leaflet.latLngBounds(drivingRoute?.points.length ? drivingRoute.points : routePoints)

        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 8 })

        setTimeout(() => {
          map.invalidateSize()
        }, 0)
      } catch (error) {
        if (!cancelled) {
          console.error(error)
          setMapError('Failed to load the route map.')
        }
      }
    }

    void renderMap()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [destination, origin])

  if (!origin || !destination) {
    return (
      <div className='claim-review-map-empty print-hidden'>
        <strong>Route map unavailable</strong>
        <span>
          {unresolvedLocations.length > 0
            ? `Add coordinates for ${unresolvedLocations.join(' and ')} under Cities to plot this trip.`
            : 'Origin and destination coordinates are required to draw this route.'}
        </span>
      </div>
    )
  }

  return (
    <div className='print-hidden'>
      {routeWarning ? <Alert variant='warning'>{routeWarning}</Alert> : null}
      {mapError ? <Alert variant='warning'>{mapError}</Alert> : null}
      <div ref={containerRef} className={`osm-map-panel claim-review-map-panel${mapError ? ' d-none' : ''}`} />
    </div>
  )
}

function ClaimPreview() {
  const { id: claimId } = useParams()
  const navigate = useNavigate()
  const [claim, setClaim] = useState<ClaimDetail | null>(null)
  const [claimLines, setClaimLines] = useState<ClaimLine[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [allowances, setAllowances] = useState<AllowanceOption[]>([])
  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [gpsValidation, setGpsValidation] = useState<GPSValidation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null)
  const [riskLoading, setRiskLoading] = useState(false)
  const [riskError, setRiskError] = useState<string | null>(null)

  useEffect(() => {
    if (!claimId) {
      return
    }

    const fetchClaim = async () => {
      setLoading(true)
      setError(null)

      try {
        const [
          claimResult,
          claimLinesResult,
          employeesResult,
          allowancesResult,
          locationsResult,
          gpsResult,
        ] = await Promise.allSettled([
          axios.get<ClaimDetail>(`${CLAIMS_ENDPOINT}${claimId}/`),
          fetchClaimLines(claimId),
          axios.get(EMPLOYEES_ENDPOINT),
          axios.get(ALLOWANCES_ENDPOINT),
          axios.get(LOCATIONS_ENDPOINT),
          axios.get(GPS_VALIDATIONS_ENDPOINT),
        ])

        if (claimResult.status !== 'fulfilled') {
          throw claimResult.reason
        }

        setClaim(claimResult.value.data)
        setClaimLines(claimLinesResult.status === 'fulfilled' ? claimLinesResult.value : [])
        setEmployees(
          employeesResult.status === 'fulfilled'
            ? normalizeEmployeesResponse(employeesResult.value.data)
            : [],
        )
        setAllowances(
          allowancesResult.status === 'fulfilled'
            ? normalizeAllowancesResponse(allowancesResult.value.data)
            : [],
        )
        setLocations(
          locationsResult.status === 'fulfilled'
            ? normalizeLocationsResponse(locationsResult.value.data)
            : [],
        )

        if (gpsResult.status === 'fulfilled') {
          const validations = normalizeGpsValidationsResponse(gpsResult.value.data)
          const matched = validations.find((validation) => String(validation.claim) === String(claimId))
          setGpsValidation(matched ?? null)
        } else {
          console.warn('Failed to load GPS validations.', gpsResult.reason)
          setGpsValidation(null)
        }
      } catch (fetchError) {
        setError('Failed to load claim review.')
        console.error(fetchError)
      } finally {
        setLoading(false)
      }
    }

    void fetchClaim()
  }, [claimId])

  useEffect(() => {
    if (!claimId) {
      return
    }

    const fetchRiskScore = async () => {
      setRiskLoading(true)
      setRiskError(null)

      try {
        const response = await axios.get<RiskScore>(`${CLAIMS_ENDPOINT}${claimId}/risk-score/`)
        setRiskScore(response.data)
      } catch (fetchError) {
        if (axios.isAxiosError(fetchError)) {
          const detail = (fetchError.response?.data as { detail?: string } | undefined)?.detail
          setRiskError(detail || 'Risk score not available.')
        } else {
          setRiskError('Risk score not available.')
        }
      } finally {
        setRiskLoading(false)
      }
    }

    void fetchRiskScore()
  }, [claimId])

  const employeeName = useMemo(() => {
    if (!claim) {
      return ''
    }
    if (claim.employee) {
      return claim.employee
    }
    const match = employees.find((employee) => String(employee.id) === String(claim.employee_id))
    return match ? getEmployeeLabel(match) : String(claim.employee_id ?? '')
  }, [claim, employees])

  const allowanceMap = useMemo(() => {
    return new Map(
      allowances.map((allowance) => [String(allowance.id), getAllowanceLabel(allowance)]),
    )
  }, [allowances])

  const lineItems = useMemo(() => {
    return claimLines.map((line) => {
      const allowanceName = allowanceMap.get(String(line.allowance_id)) ?? String(line.allowance_id)
      const quantity = Number(line.quantity ?? 0)
      const amount = Number(line.amount ?? 0)
      return {
        id: line.id ?? `${line.allowance_id}-${quantity}-${amount}`,
        allowance: allowanceName,
        quantity,
        amount,
        total: quantity * amount,
      }
    })
  }, [allowanceMap, claimLines])

  const totalAllowances = useMemo(() => {
    if (claim?.total_allowances !== undefined) {
      return Number(claim.total_allowances)
    }
    if (claim?.total !== undefined) {
      return Number(claim.total)
    }
    return lineItems.reduce((sum, item) => sum + item.total, 0)
  }, [claim, lineItems])

  const claimStatusLabel = useMemo(() => formatClaimStatus(claim?.approval_status), [claim?.approval_status])
  const claimStatusClassName = useMemo(
    () => getClaimStatusClassName(claim?.approval_status),
    [claim?.approval_status],
  )
  const ruleFlags = riskScore?.rule_flags ?? []

  const submittedDistance = useMemo(() => {
    const value = toFiniteNumber(claim?.user_distance)
    return value !== null && value > 0 ? value : null
  }, [claim?.user_distance])

  const calculatedDistance = useMemo(() => toFiniteNumber(claim?.calculated_distance), [claim?.calculated_distance])

  const distanceVariance = useMemo(() => {
    if (submittedDistance === null || calculatedDistance === null) {
      return null
    }
    return submittedDistance - calculatedDistance
  }, [calculatedDistance, submittedDistance])

  const distanceVarianceNote = useMemo(() => {
    if (submittedDistance === null) {
      return 'Submitted after receipts'
    }
    if (calculatedDistance === null) {
      return 'No mapped baseline available'
    }
    if (Math.abs(submittedDistance - calculatedDistance) < 0.05) {
      return 'Matches mapped baseline'
    }
    return submittedDistance > calculatedDistance
      ? 'Above the mapped baseline'
      : 'Below the mapped baseline'
  }, [calculatedDistance, submittedDistance])

  const routeOrigin = useMemo(
    () => resolveLocationByName(locations, claim?.origin),
    [claim?.origin, locations],
  )
  const routeDestination = useMemo(
    () => resolveLocationByName(locations, claim?.destination),
    [claim?.destination, locations],
  )

  const routeCoverageLabel = useMemo(() => {
    if (routeOrigin && routeDestination) {
      return 'Driving route preview from the registered city coordinates'
    }
    return 'Waiting on city coordinates before the driving route can be plotted'
  }, [routeDestination, routeOrigin])

  const gpsNote = useMemo(() => {
    if (!gpsValidation) {
      return 'No GPS validation record available'
    }

    const errandsFactor = toFiniteNumber(gpsValidation.errands_factor)
    return errandsFactor !== null
      ? `Base ${formatDistance(toFiniteNumber(gpsValidation.base_distance_km))}, errands factor ${errandsFactor.toFixed(2)}x`
      : `Base ${formatDistance(toFiniteNumber(gpsValidation.base_distance_km))}`
  }, [gpsValidation])

  const riskScoreValue = useMemo(() => {
    if (riskLoading) {
      return 'Loading...'
    }
    if (riskScore?.score !== undefined) {
      return riskScore.score.toFixed(1)
    }
    return 'N/A'
  }, [riskLoading, riskScore?.score])

  const riskScoreNote = useMemo(() => {
    if (riskLoading) {
      return 'Running fraud checks'
    }
    if (riskError) {
      return riskError
    }
    if (ruleFlags.length === 0) {
      return 'No rules triggered'
    }
    return `${ruleFlags.length} rule${ruleFlags.length === 1 ? '' : 's'} triggered`
  }, [riskError, riskLoading, ruleFlags.length])

  const decisionPath = useMemo(() => {
    if (riskLoading) {
      return 'Assessing'
    }
    if (riskScore?.auto_approve) {
      return 'Auto approved'
    }
    if (riskScore?.manual_review_required) {
      return 'Manual review required'
    }
    return 'Standard approval path'
  }, [riskLoading, riskScore])

  if (!claimId) {
    return <Alert variant='danger'>Missing claim id.</Alert>
  }

  return (
    <>
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          .print-card { box-shadow: none !important; border: 1px solid #dee2e6 !important; }
          .claim-review-hero { background: #fff !important; }
          body { background: #fff !important; }
        }
      `}</style>

      <div className='claim-review-toolbar d-flex justify-content-between align-items-center gap-3 mb-4 print-hidden'>
        <div>
          <div className='claim-review-toolbar-label'>Review Workspace</div>
          <h5 className='mb-1'>Claim Review</h5>
          <div className='text-muted'>Claim #{claimId}</div>
        </div>
        <div className='d-flex gap-2 flex-wrap justify-content-end'>
          <Button variant='outline-secondary' onClick={() => navigate(-1)}>
            Back
          </Button>
          <Button variant='primary' onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      {error ? <Alert variant='danger'>{error}</Alert> : null}

      {loading ? (
        <div className='d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          <span>Loading claim review...</span>
        </div>
      ) : claim ? (
        <div className='claim-review-shell'>
          <Card className='claim-review-hero print-card mb-4'>
            <Card.Body>
              <div className='claim-review-hero-grid'>
                <div className='claim-review-identity'>
                  <span className='app-avatar-circle app-avatar-circle-lg'>{getInitials(employeeName)}</span>
                  <div>
                    <div className='claim-review-kicker'>Travel Claim</div>
                    <h1 className='claim-review-title'>{claim.purpose?.trim() || `Claim #${claimId}`}</h1>
                    <div className='claim-review-subtitle'>
                      <span>{employeeName || 'Employee not available'}</span>
                      <span className={claimStatusClassName}>{claimStatusLabel}</span>
                    </div>
                    <div className='claim-review-route-strip'>
                      <div className='claim-review-stop-tag'>
                        <span className='claim-review-stop-tag-label'>Origin</span>
                        <strong>{claim.origin || '-'}</strong>
                      </div>
                      <div className='claim-review-route-line' />
                      <div className='claim-review-stop-tag'>
                        <span className='claim-review-stop-tag-label'>Destination</span>
                        <strong>{claim.destination || '-'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className='claim-review-hero-aside'>
                  <DetailRow label='Departure' value={formatDateValue(claim.departure_date)} />
                  <DetailRow label='Return' value={formatDateValue(claim.return_date)} />
                  <DetailRow
                    label='Stage'
                    value={claim.stage_id !== undefined && claim.stage_id !== null ? `Stage ${claim.stage_id}` : '-'}
                  />
                  <DetailRow label='Decision Path' value={decisionPath} />
                </div>
              </div>

              <div className='claim-review-metric-grid'>
                <SummaryMetric
                  label='Allowance Total'
                  value={formatAmount(totalAllowances)}
                  note='Calculated from the claim lines'
                />
                <SummaryMetric
                  label='Trip Duration'
                  value={`${claim.days ?? 0} day${Number(claim.days ?? 0) === 1 ? '' : 's'}`}
                  note={`${claim.nights ?? 0} night${Number(claim.nights ?? 0) === 1 ? '' : 's'}`}
                />
                <SummaryMetric
                  label='Mileage Variance'
                  value={formatSignedDistance(distanceVariance)}
                  note={distanceVarianceNote}
                />
                <SummaryMetric label='Risk Score' value={riskScoreValue} note={riskScoreNote} />
              </div>
            </Card.Body>
          </Card>

          <Row className='g-4 mb-4'>
            <Col xl={8}>
              <Card className='print-card h-100'>
                <Card.Body>
                  <div className='claim-review-section-head'>
                    <div>
                      <div className='claim-review-section-kicker'>Route View</div>
                      <h6 className='mb-1'>Origin, destination, and driving path</h6>
                      <p className='claim-review-section-copy mb-0'>
                        {routeCoverageLabel}
                      </p>
                    </div>
                    <span className='badge-soft'>{routeOrigin && routeDestination ? 'Mapped' : 'Partial data'}</span>
                  </div>

                  <ClaimRouteMap
                    origin={routeOrigin}
                    destination={routeDestination}
                    claimOrigin={claim.origin}
                    claimDestination={claim.destination}
                  />

                  <div className='claim-review-route-summary'>
                    <div className='claim-review-route-card'>
                      <span className='claim-review-route-card-label'>Origin stop</span>
                      <strong>{claim.origin || '-'}</strong>
                      <span>
                        {routeOrigin
                          ? `${routeOrigin.latitude.toFixed(4)}, ${routeOrigin.longitude.toFixed(4)}`
                          : 'No saved coordinates yet'}
                      </span>
                    </div>
                    <div className='claim-review-route-card'>
                      <span className='claim-review-route-card-label'>Destination stop</span>
                      <strong>{claim.destination || '-'}</strong>
                      <span>
                        {routeDestination
                          ? `${routeDestination.latitude.toFixed(4)}, ${routeDestination.longitude.toFixed(4)}`
                          : 'No saved coordinates yet'}
                      </span>
                    </div>
                    <div className='claim-review-route-card'>
                      <span className='claim-review-route-card-label'>Mapped baseline</span>
                      <strong>{formatDistance(calculatedDistance)}</strong>
                      <span>{gpsNote}</span>
                    </div>
                    <div className='claim-review-route-card'>
                      <span className='claim-review-route-card-label'>Submitted mileage</span>
                      <strong>{formatDistance(submittedDistance, 'Pending')}</strong>
                      <span>User-supplied distance at receipt submission</span>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={4}>
              <div className='claim-review-side-stack'>
                <Card className='print-card'>
                  <Card.Body>
                    <div className='claim-review-section-kicker'>Trip Details</div>
                    <h6 className='mb-3'>Claim summary</h6>
                    <div className='claim-review-detail-list'>
                      <DetailRow label='Employee' value={employeeName || '-'} />
                      <DetailRow label='Purpose' value={claim.purpose || '-'} />
                      <DetailRow label='Submitted distance' value={formatDistance(submittedDistance)} />
                      <DetailRow
                        label='Calculated distance'
                        value={formatDistance(calculatedDistance)}
                      />
                      <DetailRow label='Approval status' value={claimStatusLabel} />
                    </div>
                  </Card.Body>
                </Card>

                <Card className='print-card'>
                  <Card.Body>
                    <div className='claim-review-section-kicker'>Review Signals</div>
                    <h6 className='mb-3'>System checks</h6>
                    <div className='claim-review-detail-list'>
                      <DetailRow label='Risk level' value={formatClaimStatus(riskScore?.risk_level)} />
                      <DetailRow
                        label='Rules triggered'
                        value={`${ruleFlags.length} rule${ruleFlags.length === 1 ? '' : 's'}`}
                      />
                      <DetailRow
                        label='GPS adjusted route'
                        value={
                          gpsValidation
                            ? formatDistance(toFiniteNumber(gpsValidation.adjusted_distance_km))
                            : 'Not available'
                        }
                      />
                      <DetailRow label='GPS source' value={gpsValidation?.source || 'Not available'} />
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Col>
          </Row>

          <Row className='g-4'>
            <Col lg={7}>
              <Card className='print-card h-100'>
                <Card.Body>
                  <div className='claim-review-section-head'>
                    <div>
                      <div className='claim-review-section-kicker'>Allowance Lines</div>
                      <h6 className='mb-1'>Claimed items</h6>
                      <p className='claim-review-section-copy mb-0'>
                        Review each allowance, quantity, and amount before approval.
                      </p>
                    </div>
                    <span className='badge-soft'>{lineItems.length} items</span>
                  </div>

                  <Table hover responsive className='claim-review-lines-table'>
                    <thead>
                      <tr>
                        <th>Allowance</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className='text-center py-4'>
                            No claim lines found.
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((line) => (
                          <tr key={String(line.id)}>
                            <td>{line.allowance}</td>
                            <td>{line.quantity}</td>
                            <td>{formatAmount(line.amount)}</td>
                            <td>{formatAmount(line.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>

                  <div className='claim-review-total-row'>
                    <span>Total allowances</span>
                    <strong>{formatAmount(totalAllowances)}</strong>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={5}>
              <Card className='print-card h-100'>
                <Card.Body>
                  <div className='claim-review-section-head'>
                    <div>
                      <div className='claim-review-section-kicker'>Fraud Rules</div>
                      <h6 className='mb-1'>Risk and exception signals</h6>
                      <p className='claim-review-section-copy mb-0'>
                        Rules raised by the scoring model for this claim.
                      </p>
                    </div>
                    <span className='badge-soft'>{ruleFlags.length}</span>
                  </div>

                  {riskLoading ? (
                    <div className='d-flex align-items-center'>
                      <Spinner animation='border' size='sm' className='me-2' />
                      <span>Loading fraud rule details...</span>
                    </div>
                  ) : riskError ? (
                    <Alert variant='warning'>{riskError}</Alert>
                  ) : ruleFlags.length === 0 ? (
                    <div className='claim-review-empty-state'>
                      <strong>No fraud rules were triggered</strong>
                      <span>This claim is currently following the expected review path.</span>
                    </div>
                  ) : (
                    <div className='claim-review-flag-list'>
                      {ruleFlags.map((flag, index) => (
                        <div key={`${flag.code ?? 'flag'}-${index}`} className='claim-review-flag-item'>
                          <div>
                            <div className='claim-review-flag-code'>{flag.code ?? 'rule_flag'}</div>
                            <div className='claim-review-flag-message'>
                              {flag.message ?? 'Rule triggered.'}
                            </div>
                          </div>
                          <span className={getSeverityClassName(flag.severity)}>
                            {formatClaimStatus(flag.severity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      ) : null}
    </>
  )
}

export default ClaimPreview
