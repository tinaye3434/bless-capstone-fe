import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Alert, Spinner } from 'react-bootstrap'
import {
  CLAIMS_ENDPOINT,
  LOCATIONS_ENDPOINT,
  normalizeClaimsResponse,
  normalizeLocationsResponse,
  type ClaimApi,
  type LocationPoint,
} from '../utils/claims'

type HeatSpot = {
  name: string
  count: number
  latitude: number
  longitude: number
}

type LeafletLike = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMapLike
  tileLayer: (url: string, options?: Record<string, unknown>) => { addTo: (map: LeafletMapLike) => void }
  circle: (
    coordinates: [number, number],
    options?: Record<string, unknown>,
  ) => {
    bindTooltip: (content: string) => { addTo: (map: LeafletMapLike) => void }
    addTo: (map: LeafletMapLike) => void
  }
  latLngBounds: (points: [number, number][]) => unknown
}

type LeafletMapLike = {
  fitBounds: (bounds: unknown, options?: Record<string, unknown>) => void
  remove: () => void
  invalidateSize: () => void
}

declare global {
  interface Window {
    L?: LeafletLike
  }
}

const LEAFLET_SCRIPT_ID = 'leaflet-script'
const LEAFLET_STYLE_ID = 'leaflet-style'
const ZIMBABWE_BOUNDS: [number, number][] = [
  [-22.5, 25.0],
  [-15.5, 33.2],
]

const normalizeName = (value?: string) => (value ?? '').trim().toLowerCase()

const loadLeafletAssets = async (): Promise<LeafletLike> => {
  if (!document.getElementById(LEAFLET_STYLE_ID)) {
    const link = document.createElement('link')
    link.id = LEAFLET_STYLE_ID
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }

  if (window.L) {
    return window.L
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

  if (!window.L) {
    throw new Error('Leaflet did not initialize.')
  }

  return window.L
}

const buildHeatSpots = (claims: ClaimApi[], locations: LocationPoint[], field: 'origin' | 'destination') => {
  const locationMap = new Map(
    locations
      .filter(
        (location) =>
          !!normalizeName(location.name) &&
          Number.isFinite(location.latitude) &&
          Number.isFinite(location.longitude),
      )
      .map((location) => [normalizeName(location.name), location]),
  )

  const counts = new Map<string, number>()
  claims.forEach((claim) => {
    const key = normalizeName(field === 'origin' ? claim.origin : claim.destination)
    if (!key || !locationMap.has(key)) {
      return
    }
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })

  return Array.from(counts.entries()).map(([key, count]) => {
    const location = locationMap.get(key)!
    return {
      name: location.name,
      count,
      latitude: location.latitude,
      longitude: location.longitude,
    }
  })
}

function HeatMapPanel({
  title,
  description,
  color,
  spots,
}: {
  title: string
  description: string
  color: string
  spots: HeatSpot[]
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMapLike | null>(null)
  const topSpots = useMemo(() => spots.slice().sort((a, b) => b.count - a.count).slice(0, 5), [spots])

  useEffect(() => {
    let cancelled = false

    const renderMap = async () => {
      if (!containerRef.current) {
        return
      }

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

      const bounds = leaflet.latLngBounds(ZIMBABWE_BOUNDS)
      map.fitBounds(bounds, { padding: [16, 16] })

      const maxCount = Math.max(...spots.map((spot) => spot.count), 1)
      spots.forEach((spot) => {
        const radius = 12000 + (spot.count / maxCount) * 28000
        leaflet
          .circle([spot.latitude, spot.longitude], {
            radius,
            color,
            weight: 1,
            fillColor: color,
            fillOpacity: 0.25,
          })
          .bindTooltip(`${spot.name}: ${spot.count}`)
          .addTo(map)
      })

      setTimeout(() => {
        map.invalidateSize()
      }, 0)
    }

    void renderMap()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [color, spots])

  return (
    <div className='card h-100'>
      <div className='card-body'>
        <div className='d-flex justify-content-between align-items-start mb-3'>
          <div>
            <h5 className='mb-1'>{title}</h5>
            <p className='text-muted mb-0'>{description}</p>
          </div>
          <span className='badge-soft'>{spots.length} locations</span>
        </div>

        <div ref={containerRef} className='osm-map-panel' />

        <div className='d-flex justify-content-between align-items-center mt-3 mb-2'>
          <h6 className='mb-0'>Top Hotspots</h6>
          <small className='text-muted'>Larger circles = more claims</small>
        </div>
        <div className='zim-hotspot-list'>
          {topSpots.length === 0 ? (
            <div className='text-muted'>No mapped locations yet.</div>
          ) : (
            topSpots.map((spot, index) => (
              <div key={`${spot.name}-${index}`} className='zim-hotspot-item'>
                <div className='d-flex align-items-center gap-2'>
                  <span className='zim-hotspot-rank'>{index + 1}</span>
                  <span>{spot.name}</span>
                </div>
                <span className='badge-soft'>{spot.count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function DashboardZimbabweHeatmap() {
  const [claims, setClaims] = useState<ClaimApi[]>([])
  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMapData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [claimsResponse, locationsResponse] = await Promise.all([
          axios.get(CLAIMS_ENDPOINT),
          axios.get(LOCATIONS_ENDPOINT),
        ])

        setClaims(normalizeClaimsResponse(claimsResponse.data))
        setLocations(normalizeLocationsResponse(locationsResponse.data))
      } catch (err) {
        setError('Failed to load route heat map data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchMapData()
  }, [])

  const originSpots = useMemo(() => buildHeatSpots(claims, locations, 'origin'), [claims, locations])
  const destinationSpots = useMemo(
    () => buildHeatSpots(claims, locations, 'destination'),
    [claims, locations],
  )

  if (loading) {
    return (
      <div className='card'>
        <div className='card-body d-flex align-items-center'>
          <Spinner animation='border' size='sm' className='me-2' />
          Loading Zimbabwe travel heat maps...
        </div>
      </div>
    )
  }

  if (error) {
    return <Alert variant='danger'>{error}</Alert>
  }

  return (
    <div className='row g-4'>
      <div className='col-lg-6'>
        <HeatMapPanel
          title='Origins Heat Map'
          description='Where trips are starting across Zimbabwe.'
          color='#0f766e'
          spots={originSpots}
        />
      </div>
      <div className='col-lg-6'>
        <HeatMapPanel
          title='Destinations Heat Map'
          description='Where claim travel is concentrating most often.'
          color='#ea580c'
          spots={destinationSpots}
        />
      </div>
    </div>
  )
}

export default DashboardZimbabweHeatmap
