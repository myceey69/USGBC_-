import { useEffect, useRef, useState } from 'react'

const hubData = {
  hubs: [
    { name: 'Recovery Hub — 540 W Woodbury Rd, Altadena', coords: [34.1705, -118.1610] },
    { name: 'Pasadena Disaster Recovery Center', coords: [34.1479, -118.1445] },
    { name: 'Pasadena City College — Workshops', coords: [34.1476, -118.1219] },
    { name: 'Flintridge Center', coords: [34.2086, -118.2052] },
    { name: 'Pasadena Convention Center — Logistics & Outreach', coords: [34.1569, -118.1306] },
  ],
  health: [
    { name: 'AltaMed Health Services — Pasadena', coords: [34.1447, -118.1356] },
    { name: 'Kaiser Permanente Medical — Pasadena', coords: [34.1520, -118.1280] },
    { name: 'Pasadena Public Health Department', coords: [34.1573, -118.1316] },
    { name: 'Wesley Health Centers', coords: [34.1502, -118.1425] },
    { name: 'CHAP Community Health', coords: [34.1760, -118.1320] },
  ],
  schools: [
    { name: 'Longfellow Elementary School', coords: [34.1782, -118.1282] },
    { name: 'Washington STEM Magnet School', coords: [34.1478, -118.1304] },
    { name: 'Altadena Arts Magnet', coords: [34.1956, -118.1345] },
  ],
  fire: [
    { name: 'LACoFD Station 11 — Altadena', coords: [34.1950, -118.1270] },
    { name: 'LACoFD Station 12 — Temple City', coords: [34.1003, -118.0522] },
    { name: 'LACoFD Station 66 — Altadena (Foothill)', coords: [34.1975, -118.1065] },
    { name: 'Pasadena FD Station 32', coords: [34.1453, -118.1312] },
    { name: 'Pasadena FD Station 33', coords: [34.1432, -118.1481] },
    { name: 'Pasadena FD Station 36', coords: [34.1751, -118.0823] },
    { name: 'Pasadena FD Station 38', coords: [34.1886, -118.1710] },
  ],
  water: [
    { name: 'Lincoln Ave Water Facility', coords: [34.1730, -118.1172] },
    { name: 'Rubio Canon Water Station', coords: [34.2090, -118.0902] },
    { name: 'Las Flores Water Facility', coords: [34.2050, -118.1180] },
    { name: 'Foothill Municipal Water District', coords: [34.1940, -118.1560] },
  ],
  parks: [
    { name: 'Washington Park', coords: [34.1497, -118.1380] },
    { name: 'La Pintoresca Park', coords: [34.1832, -118.1320] },
    { name: 'Loma Alta Park', coords: [34.1966, -118.1528] },
    { name: 'Farnsworth Park — Altadena', coords: [34.2015, -118.1390] },
    { name: 'Hahamongna Watershed Park', coords: [34.2220, -118.1690] },
  ],
}

const layerColors = {
  hubs: '#4ade80',
  health: '#f87171',
  schools: '#fbbf24',
  fire: '#fb923c',
  water: '#60a5fa',
  parks: '#a78bfa',
}

const layerEmojis = {
  hubs: '🏢',
  health: '🏥',
  schools: '🏫',
  fire: '🚒',
  water: '💧',
  parks: '🌳',
}

export default function MapSection({ wildfireEvents = [] }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const leafletLayersRef = useRef({})
  const [activeLayers, setActiveLayers] = useState(new Set(Object.keys(hubData)))

  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return

    const L = require('leaflet')
    // Fix default icon paths broken by webpack
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const map = L.map(mapRef.current, { scrollWheelZoom: false }).setView([34.19, -118.13], 12)
    mapInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    const layers = {}
    Object.keys(hubData).forEach((cat) => {
      layers[cat] = L.layerGroup()
      hubData[cat].forEach((h) => {
        const color = layerColors[cat]
        const icon = L.divIcon({
          html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 2px 6px rgba(0,0,0,0.4)"></div>`,
          className: '',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
        L.marker(h.coords, { icon })
          .addTo(layers[cat])
          .bindPopup(
            `<strong>${layerEmojis[cat]} ${h.name}</strong><br><small>${cat.charAt(0).toUpperCase() + cat.slice(1)}</small>`
          )
      })
      layers[cat].addTo(map)
    })

    leafletLayersRef.current = layers

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  const toggleLayer = (layer) => {
    const map = mapInstanceRef.current
    const layers = leafletLayersRef.current
    if (!map || !layers) return

    const L = require('leaflet')

    if (layer === 'all') {
      const anyOff = activeLayers.size < Object.keys(hubData).length
      const newActive = new Set(Object.keys(hubData))
      if (anyOff) {
        Object.keys(hubData).forEach((cat) => {
          if (!activeLayers.has(cat)) layers[cat].addTo(map)
        })
        setActiveLayers(newActive)
      } else {
        Object.keys(hubData).forEach((cat) => map.removeLayer(layers[cat]))
        setActiveLayers(new Set())
      }
    } else {
      const next = new Set(activeLayers)
      if (next.has(layer)) {
        next.delete(layer)
        map.removeLayer(layers[layer])
      } else {
        next.add(layer)
        layers[layer].addTo(map)
      }
      setActiveLayers(next)
    }
  }

  const allActive = activeLayers.size === Object.keys(hubData).length

  return (
    <>
      <div className="map-filters">
        <button
          className={`map-filter-btn${allActive ? ' active' : ''}`}
          onClick={() => toggleLayer('all')}
        >
          🗺️ All
        </button>
        {Object.keys(hubData).map((cat) => (
          <button
            key={cat}
            className={`map-filter-btn${activeLayers.has(cat) ? ' active' : ''}`}
            onClick={() => toggleLayer(cat)}
          >
            {layerEmojis[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div id="map" ref={mapRef} role="region" aria-label="Map of recovery hubs" />
    </>
  )
}
