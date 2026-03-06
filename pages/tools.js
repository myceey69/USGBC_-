import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import Layout from '../components/Layout'
import { useI18n } from '../lib/i18n'

const MapSection = dynamic(() => import('../components/MapSection'), { ssr: false })

const tocLinks = [
  { href: '#cesium-story', key: 'toc-3d-viewer' },
  { href: '#tools', key: 'toc-tools-checklist' },
  { href: '#fire-materials', key: 'toc-fire-materials' },
  { href: '#adu', key: 'toc-adu' },
  { href: '#adu-tester', key: 'toc-adu-tester' },
  { href: '#wildfire-tools', key: 'toc-wildfire-events' },
  { href: '#mapSection', key: 'toc-map' },
]

const checklistItemsEN = [
  'Non-combustible exterior cladding (Class A or metal/cementitious)',
  'Tempered glass windows; ember-resistant attic/soffit vents',
  'Class A roof; clear debris from gutters & roof valleys',
  "0–5 ft 'ignition-free' zone: gravel/hardscape only",
  '5–30 ft lean, clean, and green landscaping (native/drought-tolerant)',
  'Ladder fuels removed; limb trees 6–10 ft up from ground',
  'Metal mesh (1/8" or less) on vents; seal gaps, weatherstrip doors',
  'Addressable signage; visible hydrant/standpipe access',
  'Solar + battery storage for outage resilience',
  'Rainwater tank with firefighter outlet (NST thread or local standard)',
]
const checklistItemsES = [
  'Revestimiento exterior no combustible (Clase A o metal/cemento)',
  'Ventanas de vidrio templado; ventilaciones resistentes a brasas en ático',
  'Techo Clase A; limpiar escombros de canaletas y valles del techo',
  "Zona de 0–5 ft 'libre de ignición': solo grava/pavimento",
  'Paisajismo limpio y verde de 5–30 ft (plantas nativas/resistentes a sequía)',
  'Combustibles tipo escalera removidos; podar árboles 6–10 ft desde el suelo',
  'Malla metálica (1/8" o menos) en ventilaciones; sellar grietas y puertas',
  'Señalización visible; acceso a hidrante/tubería visible',
  'Solar + batería de almacenamiento para resiliencia ante cortes eléctricos',
  'Tanque de agua pluvial con salida para bomberos (rosca NST o estándar local)',
]

const checklistGroups = [
  { label: 'Exterior',      labelES: 'Exterior',         icon: '🏠', indices: [0,1,2], color: '#60a5fa' },
  { label: 'Landscaping',   labelES: 'Paisajismo',        icon: '🌿', indices: [3,4,5], color: '#4ade80' },
  { label: 'Gaps & Access', labelES: 'Sellado y Acceso',  icon: '🔧', indices: [6,7],   color: '#fbbf24' },
  { label: 'Systems',       labelES: 'Sistemas',          icon: '⚡', indices: [8,9],   color: '#c084fc' },
]
const checklistShortEN = [
  'Exterior Cladding','Windows & Vents','Class A Roof',
  '0–5 ft Zone','5–30 ft Zone','Ladder Fuels',
  'Mesh & Sealing','Signage & Hydrant',
  'Solar + Battery','Rainwater Tank',
]
const checklistPriority = ['Critical','Critical','Critical','Critical','Important','Important','Critical','Important','Bonus','Important']
const materialCategories = [
  {
    id: 'roof',
    labelKey: 'cfg-cat-roof',
    icon: '🏠',
    options: [
      { id: 'metal',          labelKey: 'cfg-roof-metal',     wildfire: 95, energy: 80, water: 85, eco: 75, cost: 55 },
      { id: 'clay-tile',      labelKey: 'cfg-roof-clay',      wildfire: 90, energy: 75, water: 80, eco: 70, cost: 50 },
      { id: 'concrete-tile',  labelKey: 'cfg-roof-concrete',  wildfire: 88, energy: 72, water: 78, eco: 65, cost: 60 },
      { id: 'wood-shingle',   labelKey: 'cfg-roof-wood',      wildfire: 15, energy: 55, water: 35, eco: 50, cost: 80 },
      { id: 'living-roof',    labelKey: 'cfg-roof-living',    wildfire: 70, energy: 90, water: 95, eco: 98, cost: 30 },
    ],
  },
  {
    id: 'walls',
    labelKey: 'cfg-cat-walls',
    icon: '🧱',
    options: [
      { id: 'stucco',        labelKey: 'cfg-walls-stucco',  wildfire: 75, energy: 68, water: 65, eco: 62, cost: 72 },
      { id: 'fiber-cement',  labelKey: 'cfg-walls-fiber',   wildfire: 88, energy: 72, water: 78, eco: 75, cost: 65 },
      { id: 'wood-siding',   labelKey: 'cfg-walls-wood',    wildfire: 20, energy: 60, water: 45, eco: 55, cost: 78 },
      { id: 'icf',           labelKey: 'cfg-walls-icf',     wildfire: 98, energy: 95, water: 88, eco: 80, cost: 40 },
      { id: 'brick',         labelKey: 'cfg-walls-brick',   wildfire: 92, energy: 78, water: 82, eco: 68, cost: 45 },
    ],
  },
  {
    id: 'insulation',
    labelKey: 'cfg-cat-insulation',
    icon: '🌡️',
    options: [
      { id: 'spray-foam',   labelKey: 'cfg-ins-spray',      wildfire: 60, energy: 95, water: 85, eco: 55, cost: 45 },
      { id: 'fiberglass',   labelKey: 'cfg-ins-fiberglass', wildfire: 70, energy: 72, water: 65, eco: 62, cost: 75 },
      { id: 'cellulose',    labelKey: 'cfg-ins-cellulose',  wildfire: 65, energy: 78, water: 60, eco: 90, cost: 70 },
      { id: 'mineral-wool', labelKey: 'cfg-ins-mineral',    wildfire: 95, energy: 82, water: 78, eco: 75, cost: 55 },
    ],
  },
  {
    id: 'windows',
    labelKey: 'cfg-cat-windows',
    icon: '🪟',
    options: [
      { id: 'single',      labelKey: 'cfg-win-single',  wildfire: 20, energy: 30, water: 45, eco: 40, cost: 90 },
      { id: 'double-lowe', labelKey: 'cfg-win-double',  wildfire: 75, energy: 80, water: 70, eco: 72, cost: 65 },
      { id: 'triple',      labelKey: 'cfg-win-triple',  wildfire: 85, energy: 95, water: 75, eco: 78, cost: 40 },
      { id: 'fire-rated',  labelKey: 'cfg-win-fire',    wildfire: 98, energy: 85, water: 80, eco: 75, cost: 35 },
    ],
  },
  {
    id: 'foundation',
    labelKey: 'cfg-cat-foundation',
    icon: '🏗️',
    options: [
      { id: 'concrete-slab', labelKey: 'cfg-found-slab',   wildfire: 85, energy: 75, water: 80, eco: 65, cost: 70 },
      { id: 'raised-wood',   labelKey: 'cfg-found-raised', wildfire: 30, energy: 65, water: 55, eco: 60, cost: 75 },
      { id: 'pier-beam',     labelKey: 'cfg-found-pier',   wildfire: 40, energy: 68, water: 60, eco: 65, cost: 72 },
    ],
  },
  {
    id: 'flooring',
    labelKey: 'cfg-cat-flooring',
    icon: '🪵',
    options: [
      { id: 'concrete-floor', labelKey: 'cfg-floor-concrete', wildfire: 90, energy: 80, water: 85, eco: 65, cost: 68 },
      { id: 'bamboo',         labelKey: 'cfg-floor-bamboo',   wildfire: 55, energy: 70, water: 60, eco: 95, cost: 68 },
      { id: 'hardwood',       labelKey: 'cfg-floor-hardwood', wildfire: 35, energy: 65, water: 45, eco: 50, cost: 55 },
      { id: 'ceramic-tile',   labelKey: 'cfg-floor-tile',     wildfire: 92, energy: 75, water: 90, eco: 72, cost: 65 },
      { id: 'cork',           labelKey: 'cfg-floor-cork',     wildfire: 45, energy: 78, water: 55, eco: 92, cost: 70 },
    ],
  },
]

const CFG_WEIGHTS = { wildfire: 0.30, energy: 0.25, water: 0.20, eco: 0.15, cost: 0.10 }

function calcCfgScore(config) {
  const selected = Object.values(config).filter(Boolean)
  if (selected.length === 0) return { overall: 0, wildfire: 0, energy: 0, water: 0, eco: 0, cost: 0, grade: '–', count: 0 }
  const avg = (key) => Math.round(selected.reduce((s, m) => s + m[key], 0) / selected.length)
  const wildfire = avg('wildfire')
  const energy = avg('energy')
  const water = avg('water')
  const eco = avg('eco')
  const cost = avg('cost')
  const overall = Math.round(wildfire * CFG_WEIGHTS.wildfire + energy * CFG_WEIGHTS.energy + water * CFG_WEIGHTS.water + eco * CFG_WEIGHTS.eco + cost * CFG_WEIGHTS.cost)
  let grade = 'D'
  if (overall >= 90) grade = 'A+'
  else if (overall >= 80) grade = 'A'
  else if (overall >= 70) grade = 'B'
  else if (overall >= 60) grade = 'C'
  return { overall, wildfire, energy, water, eco, cost, grade, count: selected.length }
}

function gradeColor(grade) {
  if (grade === 'A+') return 'linear-gradient(135deg,#4ade80,#22d3ee)'
  if (grade === 'A')  return 'linear-gradient(135deg,#4ade80,#86efac)'
  if (grade === 'B')  return 'linear-gradient(135deg,#fbbf24,#fde68a)'
  if (grade === 'C')  return 'linear-gradient(135deg,#f97316,#fed7aa)'
  return 'linear-gradient(135deg,#f87171,#fecaca)'
}

function scoreBarColor(val) {
  if (val >= 80) return '#4ade80'
  if (val >= 60) return '#fbbf24'
  return '#f87171'
}

const adus = [
  {
    name: "Monique's ADU",
    cost: '$$$',
    energy: 'A++',
    water: 'B',
    wildfire: 'High',
    equity: 'Moderate',
    descKey: 'adu-desc-monique',
    model: 'https://raw.githubusercontent.com/myceey69/USGBC-/11b43160127e1125453599d02581e49f5c4ed225/ADU_Final_Magie.glb',
  },
  {
    name: "Yiceth's ADU",
    cost: '$$',
    energy: 'A',
    water: 'A',
    wildfire: 'High',
    equity: 'Moderate',
    descKey: 'adu-desc-yiceth',
    model: {
      marble: 'https://raw.githubusercontent.com/myceey69/USGBC-/032e246e40c0b3a5761a32d25e34d88fda6014ec/FireResCosby.glb',
      ceramic: 'https://raw.githubusercontent.com/myceey69/USGBC-/42013288126c5f8f7c92481945b2fb057c4c6818/FireResCosby2.glb',
      granite: 'https://raw.githubusercontent.com/myceey69/USGBC-/feae388d162ac7c5ec471bca23aefd64416e9f9d/FireResCosby3.glb',
    },
  },
  {
    name: "Yiceth's ADU 2",
    cost: '$$$',
    energy: 'A++',
    water: 'B',
    wildfire: 'High',
    equity: 'Moderate',
    descKey: 'adu-desc-yiceth2',
    model: 'https://raw.githubusercontent.com/myceey69/USGBC-/14a16da16591e8b3f72e129919f5ebe8cfbec729/MoniqueADU.glb',
  },
]

export default function ToolsPage() {
  const { t, lang } = useI18n()
  const { basePath } = useRouter()
  // ADU Configurator state
  const [aduConfig, setAduConfig] = useState({})
  const [aduStep, setAduStep] = useState(0)
  const [cfgDone, setCfgDone] = useState(false)
  const [showAduGallery, setShowAduGallery] = useState(false)

  // Checklist state
  const [checkedItems, setCheckedItems] = useState({})
  const checklistItems = lang === 'es' ? checklistItemsES : checklistItemsEN

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('checklistState') || '{}')
    setCheckedItems(saved)
  }, [])

  const handleCheck = (i, checked) => {
    const id = 'c' + i
    const next = { ...checkedItems, [id]: checked }
    setCheckedItems(next)
    localStorage.setItem('checklistState', JSON.stringify(next))
  }

  const doneCount = checklistItems.filter((_, i) => checkedItems['c' + i]).length
  const pct = checklistItems.length ? Math.round((doneCount / checklistItems.length) * 100) : 0

  // Tank sizing state
  const [roofArea, setRoofArea] = useState('1500')
  const [rainIn, setRainIn] = useState('18')
  const [efficiencyVal, setEfficiencyVal] = useState('0.75')
  const [gpmVal, setGpmVal] = useState('10')
  const [minutesVal, setMinutesVal] = useState('30')
  const [daysVal, setDaysVal] = useState('3')
  const [tankResult, setTankResult] = useState('')

  const calcTank = () => {
    const A = +roofArea; const R = +rainIn; const eff = +efficiencyVal
    const gpm = +gpmVal; const min = +minutesVal; const days = +daysVal
    const harvested = A * R * 0.623 * eff
    const fire = gpm * min
    const domestic = 50 * 3 * days
    const needed = Math.ceil(fire + domestic)
    const recommended = Math.ceil(Math.max(needed, harvested * 0.25))
    setTankResult(
      lang === 'es'
        ? `Almacenamiento recomendado ≈ ${recommended.toLocaleString()} galones (incendio: ${fire.toLocaleString()} + doméstico: ${domestic.toLocaleString()}, cosecha anual ~ ${Math.ceil(harvested).toLocaleString()} gal).`
        : `Recommended storage ≈ ${recommended.toLocaleString()} gallons (fire: ${fire.toLocaleString()} + domestic: ${domestic.toLocaleString()}, annual harvest ~ ${Math.ceil(harvested).toLocaleString()} gal).`
    )
  }

  // Fire materials hover
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewAlt, setPreviewAlt] = useState('')
  const [isHoveringMaterials, setIsHoveringMaterials] = useState(false)
  const autoSlideRef = useRef(null)
  const autoSlideIdxRef = useRef(0)

  const allMaterialImgs = [
    '/materials/ficesipanels.jpg', '/materials/cefiboards.jpg',
    '/materials/conblocks.jpg', '/materials/soconmanunits.jpg',
    '/materials/roofpanels.jpg', '/materials/calrooftiles.jpg',
    '/materials/tempglasswindows.jpg', '/materials/mewinframes.jpg',
    '/materials/steexdoords.jpg', '/materials/firecomdeckboards.jpg',
    '/materials/conpavers.jpg', '/materials/stopavers.jpg',
    '/materials/emrevenscreens.jpg', '/materials/gravels.jpg',
    '/materials/firesplants.jpg',
  ].map(p => basePath + p)

  useEffect(() => {
    if (isHoveringMaterials) { clearInterval(autoSlideRef.current); return }
    autoSlideRef.current = setInterval(() => {
      autoSlideIdxRef.current = (autoSlideIdxRef.current + 1) % allMaterialImgs.length
      setPreviewSrc(allMaterialImgs[autoSlideIdxRef.current])
      setPreviewAlt('Fire-resistant material')
    }, 2200)
    return () => clearInterval(autoSlideRef.current)
  }, [isHoveringMaterials])

  // ADU state
  const [activeAdu, setActiveAdu] = useState(null)
  const [aduMaterial, setAduMaterial] = useState('marble')
  const [compareSlots, setCompareSlots] = useState([null, null])
  const [selectedCards, setSelectedCards] = useState([])

  const handleAduCard = (adu) => {
    setActiveAdu(adu)
    setAduMaterial('marble')
  }

  const handleAduCompare = (adu) => {
    setSelectedCards((prev) => {
      if (prev.includes(adu.name)) return prev.filter((n) => n !== adu.name)
      const next = [...prev, adu.name].slice(-2)
      return next
    })
    setCompareSlots((prev) => {
      if (prev[0]?.name === adu.name || prev[1]?.name === adu.name) {
        return prev.map((s) => (s?.name === adu.name ? null : s))
      }
      if (!prev[0]) return [adu, prev[1]]
      if (!prev[1]) return [prev[0], adu]
      return [prev[1], adu]
    })
  }

  const getAduSrc = (adu, mat) => {
    if (!adu) return ''
    if (typeof adu.model === 'string') return adu.model
    return adu.model[mat] || adu.model.marble || ''
  }

  // Wildfire tester
  const [wtRoof, setWtRoof] = useState('0')
  const [wtWalls, setWtWalls] = useState('0')
  const [wtSpace, setWtSpace] = useState('0')
  const [wtVents, setWtVents] = useState('0')
  const [wtWindows, setWtWindows] = useState('0')
  const [wtWater, setWtWater] = useState('0')
  const [wtExposure, setWtExposure] = useState('-2')
  const [wtSprinklers, setWtSprinklers] = useState('0')
  const [wtResult, setWtResult] = useState('')

  const computeWildfireRating = useCallback(() => {
    const raw = [wtRoof, wtWalls, wtSpace, wtVents, wtWindows, wtWater, wtExposure, wtSprinklers]
      .map(Number).reduce((a, b) => a + b, 0)
    let shifted = raw + 2
    if (shifted < 0) shifted = 0
    if (shifted > 24) shifted = 24
    let rating = Math.round(1 + (shifted * 9) / 24)
    if (rating < 1) rating = 1
    if (rating > 10) rating = 10
    let statusKey, adviceKey
    if (rating <= 3) {
      statusKey = 'wt-status-1'
      adviceKey = 'wt-advice-1'
    } else if (rating <= 6) {
      statusKey = 'wt-status-2'
      adviceKey = 'wt-advice-2'
    } else if (rating <= 8) {
      statusKey = 'wt-status-3'
      adviceKey = 'wt-advice-3'
    } else {
      statusKey = 'wt-status-4'
      adviceKey = 'wt-advice-4'
    }
    setWtResult(`${t('wt-rating-label')} ${rating}/10 – ${t(statusKey)}. ${t(adviceKey)}`)
  }, [wtRoof, wtWalls, wtSpace, wtVents, wtWindows, wtWater, wtExposure, wtSprinklers, t])

  const shareWtResult = () => {
    const params = new URLSearchParams({ wtRoof, wtWalls, wtSpace, wtVents, wtWindows, wtWater, wtExposure, wtSprinklers })
    const url = window.location.origin + '/tools?' + params.toString() + '#adu-tester'
    navigator.clipboard.writeText(url).then(() => {
      const toast = document.getElementById('shareToast')
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500) }
    }).catch(() => prompt('Copy this link:', url))
  }

  // Restore wildfire tester from URL params
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    if (p.get('wtRoof')) setWtRoof(p.get('wtRoof'))
    if (p.get('wtWalls')) setWtWalls(p.get('wtWalls'))
    if (p.get('wtSpace')) setWtSpace(p.get('wtSpace'))
    if (p.get('wtVents')) setWtVents(p.get('wtVents'))
    if (p.get('wtWindows')) setWtWindows(p.get('wtWindows'))
    if (p.get('wtWater')) setWtWater(p.get('wtWater'))
    if (p.get('wtExposure')) setWtExposure(p.get('wtExposure'))
    if (p.get('wtSprinklers')) setWtSprinklers(p.get('wtSprinklers'))
  }, [])

  // Wildfire events widget
  const [wfMinLon, setWfMinLon] = useState('0')
  const [wfMinLat, setWfMinLat] = useState('0')
  const [wfMaxLon, setWfMaxLon] = useState('0')
  const [wfMaxLat, setWfMaxLat] = useState('0')
  const [wfDays, setWfDays] = useState('0')
  const [wfStart, setWfStart] = useState('')
  const [wfEnd, setWfEnd] = useState('')
  const [wfSummary, setWfSummary] = useState('No data yet.')
  const [wfRows, setWfRows] = useState([])
  const [wfShowAll, setWfShowAll] = useState(false)
  const [wfLoading, setWfLoading] = useState(false)

  const fetchWildfires = async (e) => {
    e.preventDefault()
    setWfLoading(true)
    setWfSummary(t('wf-fetching'))
    setWfRows([])
    try {
      let url = 'https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=all&limit=500'
      const bbox = [wfMinLon, wfMinLat, wfMaxLon, wfMaxLat].map(Number)
      const hasBbox = bbox.some(v => v !== 0)
      if (hasBbox) url += `&bbox=${bbox.join(',')}`
      if (+wfDays > 0) url += `&days=${wfDays}`
      else if (wfStart && wfEnd) url += `&start=${wfStart}&end=${wfEnd}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const events = data.events || []
      setWfSummary(lang === 'es' ? `Se encontraron ${events.length} evento(s) de incendio.` : `Found ${events.length} wildfire event(s).`)
      const rows = events.map((ev) => {
        const geo = ev.geometry?.[ev.geometry.length - 1]
        const coords = geo?.coordinates || []
        const date = geo?.date ? new Date(geo.date).toLocaleDateString() : 'N/A'
        const sources = ev.sources?.map(s => s.url ? `<a href="${s.url}" target="_blank" rel="noreferrer">${s.id}</a>` : s.id).join(', ') || ''
        return { date, title: ev.title, lat: coords[1] ?? '—', lon: coords[0] ?? '—', status: ev.closed ? 'Closed' : 'Open', sources }
      })
      setWfRows(rows)
      setWfShowAll(false)
    } catch (err) {
      setWfSummary(`Error: ${err.message}`)
    }
    setWfLoading(false)
  }

  const clearWf = () => {
    setWfMinLon('0'); setWfMinLat('0'); setWfMaxLon('0'); setWfMaxLat('0')
    setWfDays('0'); setWfStart(''); setWfEnd('')
    setWfSummary(t('wf-no-data')); setWfRows([])
  }

  return (
    <Layout tocLinks={tocLinks} activePage="tools">

      {/* 3D STORY VIEWER */}
      <section className="panel" id="cesium-story">
        <h3 dangerouslySetInnerHTML={{ __html: t('cesium-h3') }} />
        <p className="small">{t('cesium-p')}</p>
        <div className="cesium-container" style={{ height: '600px', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
          <iframe
            src="https://ion.cesium.com/stories/viewer/?id=3b56607d-2e71-41b9-aa84-682b0be291d6"
            style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }}
            title="Cesium ion 3D Story Viewer"
            allowFullScreen
          />
        </div>
        <div className="small" style={{ marginTop: '12px' }}>
          <p><strong>{t('cesium-nav-h')}</strong></p>
          <ul>
            <li>{t('cesium-nav-li1')}</li>
            <li>{t('cesium-nav-li2')}</li>
            <li>{t('cesium-nav-li3')}</li>
            <li>{t('cesium-nav-li4')}</li>
          </ul>
        </div>
      </section>

      {/* CHECKLIST + RISK + SAFETY METER */}
      <section className="panel" id="tools">
        <h3 dangerouslySetInnerHTML={{ __html: t('tools-h3') }} />
        <div className="grid cols-2">
          {/* LEFT: grouped checklist */}
          <div>
            <h4 dangerouslySetInnerHTML={{ __html: t('checklist-h4') }} />
            <br/>
            {checklistGroups.map(grp => {
              const grpDone = grp.indices.filter(i => !!checkedItems['c'+i]).length
              const grpPct = Math.round((grpDone / grp.indices.length) * 100)
              return (
                <div key={grp.label} className="cg-group">
                  <div className="cg-group-header">
                    <span className="cg-group-icon">{grp.icon}</span>
                    <span className="cg-group-label">{lang === 'es' ? grp.labelES : grp.label}</span>
                    <div className="cg-mini-bar-track">
                      <div className="cg-mini-bar-fill" style={{width:`${grpPct}%`,background:grp.color}}/>
                    </div>
                    <span className="cg-group-count" style={{color:grp.color}}>{grpDone}/{grp.indices.length}</span>
                  </div>
                  <div className="checklist">
                    {grp.indices.map(i => (
                      <label key={i} className="check-item">
                        <input type="checkbox" checked={!!checkedItems['c'+i]} onChange={e => handleCheck(i, e.target.checked)}/>
                        <span>{checklistItems[i]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            })}
            <div className="small" id="progress">
              {lang === 'es' ? `${doneCount} de ${checklistItems.length} completados` : `${doneCount} of ${checklistItems.length} completed`}
            </div>
          </div>

          {/* RIGHT: donut + flame + badges + policy */}
          <div className="right-tools" style={{paddingTop:'48px'}}>
            {/* Donut ring + Flame side by side */}
            <div className="cg-donut-flame">
              {(() => {
                const R = 54, circ = 2 * Math.PI * R
                const dash = (pct / 100) * circ
                const donutC = pct < 34 ? '#f87171' : pct < 67 ? '#fb923c' : '#4ade80'
                return (
                  <svg viewBox="0 0 140 140" className="cg-donut-svg">
                    <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(96,165,250,0.1)" strokeWidth="14"/>
                    <circle cx="70" cy="70" r={R} fill="none" stroke={donutC} strokeWidth="14" strokeLinecap="round"
                      strokeDasharray={`${dash.toFixed(1)} ${circ.toFixed(1)}`}
                      style={{transform:'rotate(-90deg)',transformOrigin:'70px 70px',transition:'stroke-dasharray 0.5s ease'}}/>
                    <text x="70" y="64" fontSize="28" fontWeight="700" fill={donutC} textAnchor="middle" fontFamily="inherit">{pct}%</text>
                    <text x="70" y="80" fontSize="9" fill="#8aa0b7" textAnchor="middle" fontFamily="inherit">{lang==='es'?'completado':'complete'}</text>
                    <text x="70" y="93" fontSize="8.5" fill="#8aa0b7" textAnchor="middle" fontFamily="inherit">{doneCount}/{checklistItems.length} items</text>
                  </svg>
                )
              })()}
              {(() => {
                const risk = Math.max(0.04, 1 - pct / 100)
                const flameC = pct >= 100 ? '#94a3b8' : risk > 0.66 ? '#f87171' : risk > 0.33 ? '#fb923c' : '#fbbf24'
                const innerC = pct >= 100 ? '#64748b' : risk > 0.66 ? '#fde68a' : '#fef9c3'
                return (
                  <div className="cg-flame-wrap">
                    <svg viewBox="0 0 80 140" className="cg-flame-svg">
                      <defs>
                        <radialGradient id="emberGlow2" cx="50%" cy="90%" r="50%">
                          <stop offset="0%" stopColor={flameC} stopOpacity="0.5"/>
                          <stop offset="100%" stopColor={flameC} stopOpacity="0"/>
                        </radialGradient>
                      </defs>
                      <ellipse cx="40" cy="133" rx="22" ry="6" fill="url(#emberGlow2)"/>
                      <g style={{transformOrigin:'40px 133px',transform:`scaleY(${risk})`,transition:'transform 0.6s cubic-bezier(0.4,0,0.2,1)'}}>
                        <path d="M40,133 C14,96 7,68 22,42 C28,25 35,9 40,17 C45,9 52,25 58,42 C73,68 66,96 40,133Z" fill={flameC} opacity="0.88"/>
                        <path d="M40,133 C27,108 25,88 34,67 C37,59 39,52 40,57 C41,52 43,59 46,67 C55,88 53,108 40,133Z" fill={innerC} opacity="0.82"/>
                      </g>
                    </svg>
                    <p style={{textAlign:'center',fontSize:'0.68rem',color:flameC,marginTop:'2px',fontWeight:600}}>
                      {pct>=100?(lang==='es'?'¡Extinto!':'Extinguished!'):(lang==='es'?'Riesgo':'Fire risk')}
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* Achievement badges */}
            <div className="cg-badges">
              {[
                {icon:'🏠',label:'Exterior Ready', labelES:'Exterior Listo',  indices:[0,1,2]},
                {icon:'🌿',label:'Zone Cleared',   labelES:'Zona Limpia',     indices:[3,4,5]},
                {icon:'🚒',label:'Access Ready',   labelES:'Acceso Listo',    indices:[6,7]},
                {icon:'⚡',label:'Systems Online', labelES:'Sistemas Activos',indices:[8,9]},
                {icon:'🏆',label:'Fire Ready!',    labelES:'¡Listo!',         indices:[0,1,2,3,4,5,6,7,8,9]},
              ].map(({icon,label,labelES,indices:idx})=>{
                const unlocked = idx.every(i => !!checkedItems['c'+i])
                return (
                  <div key={label} className={`cg-badge${unlocked?' unlocked':''}`}>
                    <span className="cg-badge-icon">{unlocked?icon:'🔒'}</span>
                    <span className="cg-badge-label">{lang==='es'?labelES:label}</span>
                  </div>
                )
              })}
            </div>

            {/* Policy card */}
            <div className="policy-card">
              <h4 dangerouslySetInnerHTML={{ __html: t('policy-card-h4') }} />
              <ul>
                <li>{t('policy-li1')}</li>
                <li>{t('policy-li2')}</li>
                <li>{t('policy-li3')}</li>
              </ul>
            </div>
          </div>
        </div>


      </section>

      {/* TANK SIZING */}
      <section className="panel" id="tank-sizing">
        <h3 dangerouslySetInnerHTML={{ __html: t('tank-h3') }} />
        <p className="small" dangerouslySetInnerHTML={{ __html: t('tank-desc') }} />
        <div className="tank-layout">
          {/* ── FORM ── */}
          <div className="calc">
            <div className="row">
              <label>
                <span dangerouslySetInnerHTML={{ __html: t('tank-label-roof') }} />
                <input type="number" value={roofArea} min="0" onChange={e => setRoofArea(e.target.value)} />
              </label>
              <label>
                <span dangerouslySetInnerHTML={{ __html: t('tank-label-rain') }} />
                <input type="number" value={rainIn} min="0" onChange={e => setRainIn(e.target.value)} />
              </label>
              <label>
                <span dangerouslySetInnerHTML={{ __html: t('tank-label-eff') }} />
                <select value={efficiencyVal} onChange={e => setEfficiencyVal(e.target.value)}>
                  <option value="0.75">75% (typical)</option>
                  <option value="0.85">85% (good)</option>
                  <option value="0.9">90% (excellent)</option>
                </select>
              </label>
            </div>
            <div className="row">
              <label>
                <span dangerouslySetInnerHTML={{ __html: t('tank-label-gpm') }} />
                <input type="number" value={gpmVal} min="0" onChange={e => setGpmVal(e.target.value)} />
              </label>
              <label>
                <span dangerouslySetInnerHTML={{ __html: t('tank-label-min') }} />
                <input type="number" value={minutesVal} min="0" onChange={e => setMinutesVal(e.target.value)} />
              </label>
              <label>
                <span dangerouslySetInnerHTML={{ __html: t('tank-label-days') }} />
                <input type="number" value={daysVal} min="0" onChange={e => setDaysVal(e.target.value)} />
              </label>
            </div>
            <button className="btn brand" onClick={calcTank} dangerouslySetInnerHTML={{ __html: t('tank-calc-btn') }} />
            {tankResult && <p className="result" aria-live="polite">{tankResult}</p>}
            <p className="note" style={{marginTop:'18px'}} dangerouslySetInnerHTML={{ __html: t('tank-note') }} />
          </div>

          {/* ── LIVE SVG TANK ── */}
          {(() => {
            const A = +roofArea || 0, R = +rainIn || 0, eff = +efficiencyVal || 0.75
            const gpm = +gpmVal || 0, mins = +minutesVal || 0, days = +daysVal || 0
            const harvested = A * R * 0.623 * eff
            const fire      = gpm * mins
            const domestic  = 50 * 3 * days
            const recommended = Math.max(fire + domestic, harvested * 0.25, 100)

            // Tank pixel geometry
            const TH = 220, TX = 60, TY = 50, TW = 110

            // Fill fractions (capped at 1)
            const waterFrac   = Math.min(harvested / recommended, 1)
            const fireFrac    = Math.min(fire / recommended, 1)
            const domFrac     = Math.min(domestic / recommended, fireFrac + (1 - fireFrac) > 0 ? (domestic / recommended) : 0, 1 - fireFrac)

            // Pixel heights
            const waterH = waterFrac * TH
            const fireH  = fireFrac * TH
            const domH   = Math.min(domFrac * TH, TH - fireH)

            // Y positions (tank bottom = TY + TH)
            const bottomY  = TY + TH
            const fireTop  = bottomY - fireH
            const domTop   = fireTop - domH
            const waterTop = bottomY - waterH

            // Harvest-above-reserves band
            const extraH   = Math.max(waterH - fireH - domH, 0)
            const extraTop = domTop - extraH

            const pct = Math.round(waterFrac * 100)
            const sufficient = harvested >= recommended

            return (
              <div className="tank-svg-wrap">
                <svg viewBox="0 0 240 380" role="img" aria-label="Tank fill diagram">
                  <defs>
                    <clipPath id="tankClip">
                      <rect x={TX} y={TY} width={TW} height={TH} rx="10" />
                    </clipPath>
                    <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(74,222,128,0.55)" />
                      <stop offset="100%" stopColor="rgba(34,211,238,0.35)" />
                    </linearGradient>
                  </defs>

                  {/* Tank body background */}
                  <rect x={TX} y={TY} width={TW} height={TH} rx="10"
                    fill="rgba(10,18,30,0.85)" stroke="rgba(96,165,250,0.35)" strokeWidth="1.5" />

                  {/* Fills (clipped) */}
                  <g clipPath="url(#tankClip)">
                    {/* Fire reserve */}
                    {fireH > 0 && (
                      <rect x={TX} y={fireTop} width={TW} height={fireH}
                        fill="rgba(239,68,68,0.55)"
                        style={{ transition: 'y 0.5s ease, height 0.5s ease' }} />
                    )}
                    {/* Domestic reserve */}
                    {domH > 0 && (
                      <rect x={TX} y={domTop} width={TW} height={domH}
                        fill="rgba(96,165,250,0.5)"
                        style={{ transition: 'y 0.5s ease, height 0.5s ease' }} />
                    )}
                    {/* Extra harvest above reserves */}
                    {extraH > 0 && (
                      <rect x={TX} y={extraTop} width={TW} height={extraH}
                        fill="url(#waterGrad)"
                        style={{ transition: 'y 0.5s ease, height 0.5s ease' }} />
                    )}
                    {/* Water surface shimmer line */}
                    {waterH > 3 && (
                      <rect x={TX} y={waterTop} width={TW} height="3"
                        fill="rgba(255,255,255,0.18)"
                        style={{ transition: 'y 0.5s ease' }} />
                    )}
                    {/* Tick marks inside tank */}
                    {[0.25, 0.5, 0.75].map(f => (
                      <line key={f}
                        x1={TX} y1={TY + (1 - f) * TH}
                        x2={TX + 12} y2={TY + (1 - f) * TH}
                        stroke="rgba(96,165,250,0.2)" strokeWidth="1" />
                    ))}
                  </g>

                  {/* Tank outline */}
                  <rect x={TX} y={TY} width={TW} height={TH} rx="10"
                    fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="1.5" />

                  {/* Top cap ellipse */}
                  <ellipse cx={TX + TW / 2} cy={TY} rx={TW / 2} ry="9"
                    fill="rgba(15,26,46,0.95)" stroke="rgba(96,165,250,0.5)" strokeWidth="1.5" />

                  {/* Pipe at top */}
                  <rect x={TX + TW / 2 - 6} y={TY - 22} width="12" height="22" rx="3"
                    fill="rgba(96,165,250,0.25)" stroke="rgba(96,165,250,0.4)" strokeWidth="1" />

                  {/* Base */}
                  <rect x={TX - 12} y={TY + TH} width={TW + 24} height="10" rx="5"
                    fill="rgba(96,165,250,0.15)" stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
                  <rect x={TX + 10} y={TY + TH + 10} width={TW - 20} height="6" rx="3"
                    fill="rgba(96,165,250,0.1)" />

                  {/* Right-side labels */}
                  {/* Total capacity */}
                  <line x1={TX + TW} y1={TY} x2={TX + TW + 14} y2={TY}
                    stroke="rgba(96,165,250,0.4)" strokeWidth="1" strokeDasharray="3,2" />
                  <text x={TX + TW + 17} y={TY + 4} fill="#8aa0b7" fontSize="9" fontFamily="inherit">
                    {`${Math.ceil(recommended).toLocaleString()} gal`}
                  </text>

                  {/* Water level label */}
                  {waterH > 8 && (
                    <>
                      <line x1={TX + TW} y1={waterTop} x2={TX + TW + 14} y2={waterTop}
                        stroke="#4ade80" strokeWidth="1" strokeDasharray="3,2"
                        style={{ transition: 'y 0.5s ease' }} />
                      <text x={TX + TW + 17} y={waterTop + 4} fill="#4ade80" fontSize="9" fontFamily="inherit"
                        style={{ transition: 'y 0.5s ease' }}>
                        {`${Math.ceil(harvested).toLocaleString()}`}
                      </text>
                    </>
                  )}

                  {/* Fire label inside */}
                  {fireH > 16 && (
                    <text x={TX + TW / 2} y={fireTop + fireH / 2 + 4}
                      fill="#fca5a5" fontSize="9" textAnchor="middle" fontFamily="inherit">
                      🔥 {Math.ceil(fire).toLocaleString()} gal
                    </text>
                  )}

                  {/* Domestic label inside */}
                  {domH > 16 && (
                    <text x={TX + TW / 2} y={domTop + domH / 2 + 4}
                      fill="#93c5fd" fontSize="9" textAnchor="middle" fontFamily="inherit">
                      🏠 {Math.ceil(domestic).toLocaleString()} gal
                    </text>
                  )}

                  {/* Percent fill badge */}
                  <text x={TX + TW / 2} y={TY - 32} fill={sufficient ? '#4ade80' : '#fbbf24'}
                    fontSize="13" fontWeight="700" textAnchor="middle" fontFamily="inherit">
                    {pct}% filled
                  </text>

                  {/* Legend */}
                  <rect x="8" y="305" width="11" height="9" rx="2" fill="rgba(239,68,68,0.6)" />
                  <text x="23" y="313" fill="#fca5a5" fontSize="9" fontFamily="inherit">Fire reserve</text>
                  <rect x="8" y="320" width="11" height="9" rx="2" fill="rgba(96,165,250,0.5)" />
                  <text x="23" y="328" fill="#93c5fd" fontSize="9" fontFamily="inherit">Domestic</text>
                  <rect x="8" y="335" width="11" height="9" rx="2" fill="url(#waterGrad)" />
                  <text x="23" y="343" fill="#86efac" fontSize="9" fontFamily="inherit">Rainwater harvest</text>
                  <rect x="8" y="350" width="11" height="9" rx="2" fill="rgba(10,18,30,0.8)" stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
                  <text x="23" y="358" fill="#8aa0b7" fontSize="9" fontFamily="inherit">Empty capacity</text>
                </svg>
              </div>
            )
          })()}
        </div>
      </section>

      {/* FIRE-RESISTANT MATERIALS */}
      <section className="panel" id="fire-materials">
        <h3 dangerouslySetInnerHTML={{ __html: t('fire-materials-h3') }} />
        <div className="fire-materials-grid">
          <div className="fire-materials-text">
            <h4 dangerouslySetInnerHTML={{ __html: t('mat-walls-h4') }} />
            <ul>
              {[
                { img: `${basePath}/materials/ficesipanels.jpg`, key: 'mat-walls-li1' },
                { img: `${basePath}/materials/cefiboards.jpg`, key: 'mat-walls-li2' },
                { img: `${basePath}/materials/conblocks.jpg`, key: 'mat-walls-li3' },
                { img: `${basePath}/materials/soconmanunits.jpg`, key: 'mat-walls-li4' },
              ].map((item) => (
                <li key={item.img}
                  onMouseEnter={() => { setIsHoveringMaterials(true); setPreviewSrc(item.img); setPreviewAlt(`${t('fire-resistant-material')}: ${t(item.key)}`) }}
                  onMouseLeave={() => setIsHoveringMaterials(false)}>
                  {t(item.key)}
                </li>
              ))}
            </ul>
            <h4 dangerouslySetInnerHTML={{ __html: t('mat-roofing-h4') }} />
            <ul>
              {[
                { img: `${basePath}/materials/roofpanels.jpg`, key: 'mat-roofing-li1' },
                { img: `${basePath}/materials/calrooftiles.jpg`, key: 'mat-roofing-li2' },
              ].map((item) => (
                <li key={item.img}
                  onMouseEnter={() => { setIsHoveringMaterials(true); setPreviewSrc(item.img); setPreviewAlt(`${t('fire-resistant-material')}: ${t(item.key)}`) }}
                  onMouseLeave={() => setIsHoveringMaterials(false)}>
                  {t(item.key)}
                </li>
              ))}
            </ul>
            <h4 dangerouslySetInnerHTML={{ __html: t('mat-windows-h4') }} />
            <ul>
              {[
                { img: `${basePath}/materials/tempglasswindows.jpg`, key: 'mat-windows-li1' },
                { img: `${basePath}/materials/mewinframes.jpg`, key: 'mat-windows-li2' },
              ].map((item) => (
                <li key={item.img}
                  onMouseEnter={() => { setIsHoveringMaterials(true); setPreviewSrc(item.img); setPreviewAlt(`${t('fire-resistant-material')}: ${t(item.key)}`) }}
                  onMouseLeave={() => setIsHoveringMaterials(false)}>
                  {t(item.key)}
                </li>
              ))}
            </ul>
            <h4 dangerouslySetInnerHTML={{ __html: t('mat-doors-h4') }} />
            <ul>
              <li
                onMouseEnter={() => { setIsHoveringMaterials(true); setPreviewSrc(`${basePath}/materials/steexdoords.jpg`); setPreviewAlt(`${t('fire-resistant-material')}: ${t('mat-doors-li1')}`) }}
                onMouseLeave={() => setIsHoveringMaterials(false)}>
                {t('mat-doors-li1')}
              </li>
            </ul>
            <h4 dangerouslySetInnerHTML={{ __html: t('mat-exterior-h4') }} />
            <ul>
              <li
                onMouseEnter={() => { setIsHoveringMaterials(true); setPreviewSrc(`${basePath}/materials/firecomdeckboards.jpg`); setPreviewAlt(`${t('fire-resistant-material')}: ${t('mat-exterior-li1')}`) }}
                onMouseLeave={() => setIsHoveringMaterials(false)}>
                {t('mat-exterior-li1')}
              </li>
            </ul>
            <h4 dangerouslySetInnerHTML={{ __html: t('mat-paving-h4') }} />
            <ul>
              {[
                { img: `${basePath}/materials/conpavers.jpg`, key: 'mat-paving-li1' },
                { img: `${basePath}/materials/stopavers.jpg`, key: 'mat-paving-li2' },
              ].map((item) => (
                <li key={item.img}
                  onMouseEnter={() => { setIsHoveringMaterials(true); setPreviewSrc(item.img); setPreviewAlt(`${t('fire-resistant-material')}: ${t(item.key)}`) }}
                  onMouseLeave={() => setIsHoveringMaterials(false)}>
                  {t(item.key)}
                </li>
              ))}
            </ul>
            <h4 dangerouslySetInnerHTML={{ __html: t('mat-vent-h4') }} />
            <ul>
              <li
                onMouseEnter={() => { setIsHoveringMaterials(true); setPreviewSrc(`${basePath}/materials/emrevenscreens.jpg`); setPreviewAlt(`${t('fire-resistant-material')}: ${t('mat-vent-li1')}`) }}
                onMouseLeave={() => setIsHoveringMaterials(false)}>
                {t('mat-vent-li1')}
              </li>
            </ul>
            <h4 dangerouslySetInnerHTML={{ __html: t('mat-landscape-h4') }} />
            <ul>
              {[
                { img: `${basePath}/materials/gravels.jpg`, key: 'mat-landscape-li1' },
                { img: `${basePath}/materials/firesplants.jpg`, key: 'mat-landscape-li2' },
              ].map((item) => (
                <li key={item.img}
                  onMouseEnter={() => { setIsHoveringMaterials(true); setPreviewSrc(item.img); setPreviewAlt(`${t('fire-resistant-material')}: ${t(item.key)}`) }}
                  onMouseLeave={() => setIsHoveringMaterials(false)}>
                  {t(item.key)}
                </li>
              ))}
            </ul>
          </div>
          <div id="materialPreview">
            {previewSrc && <img src={previewSrc} alt={previewAlt} />}
          </div>
        </div>
      </section>

      {/* ADU CONFIGURATOR */}
      <section className="panel" id="adu">
        <h3 dangerouslySetInnerHTML={{ __html: t('cfg-h3') }} />
        <p className="small" dangerouslySetInnerHTML={{ __html: t('cfg-desc') }} />

        <div className="adu-configurator">
          {/* ── LEFT: step content ── */}
          <div className="cfg-left">
            {/* Stepper */}
            <div className="cfg-stepper">
              {materialCategories.map((cat, i) => (
                <button
                  key={cat.id}
                  className={`cfg-step-btn${i === aduStep ? ' active' : ''}${aduConfig[cat.id] ? ' done' : ''}`}
                  onClick={() => { if (!cfgDone) setAduStep(i) }}
                >
                  <span className="cfg-step-icon">{cat.icon}</span>
                  <span className="cfg-step-label">{t(cat.labelKey)}</span>
                  {aduConfig[cat.id] && <span className="cfg-step-check">✓</span>}
                </button>
              ))}
            </div>

            {!cfgDone ? (
              <div className="cfg-step-content">
                <h4 style={{ color: '#e6f0ff', marginBottom: '14px' }}>
                  {materialCategories[aduStep].icon} {t(materialCategories[aduStep].labelKey)}
                </h4>
                <div className="cfg-options-grid">
                  {materialCategories[aduStep].options.map((opt) => {
                    const isSelected = aduConfig[materialCategories[aduStep].id]?.id === opt.id
                    return (
                      <button
                        key={opt.id}
                        className={`cfg-option${isSelected ? ' selected' : ''}`}
                        onClick={() => setAduConfig(prev => ({ ...prev, [materialCategories[aduStep].id]: opt }))}
                      >
                        <span className="cfg-opt-name">{t(opt.labelKey)}</span>
                        <div className="cfg-opt-mini-scores">
                          <span title={t('cfg-score-wildfire')}>🔥 {opt.wildfire}</span>
                          <span title={t('cfg-score-energy')}>⚡ {opt.energy}</span>
                          <span title={t('cfg-score-water')}>💧 {opt.water}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="cfg-nav-btns">
                  {aduStep > 0 && (
                    <button className="btn" onClick={() => setAduStep(s => s - 1)}>
                      {t('cfg-btn-back')}
                    </button>
                  )}
                  {aduStep < materialCategories.length - 1 ? (
                    <button
                      className="btn"
                      disabled={!aduConfig[materialCategories[aduStep].id]}
                      onClick={() => setAduStep(s => s + 1)}
                    >
                      {t('cfg-btn-next')}
                    </button>
                  ) : (
                    <button
                      className="btn"
                      style={{ background: 'linear-gradient(135deg,#4ade80,#22d3ee)', color: '#0a121e', fontWeight: 700 }}
                      disabled={Object.keys(aduConfig).length < materialCategories.length}
                      onClick={() => setCfgDone(true)}
                    >
                      {t('cfg-btn-build')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* ── SUMMARY ── */
              <div className="cfg-summary">
                <h4 style={{ color: '#e6f0ff', marginBottom: '16px' }}>🏡 {t('cfg-summary-title')}</h4>
                <table className="cfg-summary-table">
                  <tbody>
                    {materialCategories.map(cat => (
                      <tr key={cat.id}>
                        <td className="cfg-sum-cat">{cat.icon} {t(cat.labelKey)}</td>
                        <td className="cfg-sum-val">{aduConfig[cat.id] ? t(aduConfig[cat.id].labelKey) : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* 3D reference model */}
                <div style={{ marginTop: '20px' }}>
                  <p className="small" style={{ color: '#8aa0b7', marginBottom: '10px' }}>{t('cfg-model-label')}</p>
                  {/* @ts-ignore */}
                  <model-viewer
                    src={
                      calcCfgScore(aduConfig).overall >= 80
                        ? 'https://raw.githubusercontent.com/myceey69/USGBC-/032e246e40c0b3a5761a32d25e34d88fda6014ec/FireResCosby.glb'
                        : 'https://raw.githubusercontent.com/myceey69/USGBC-/11b43160127e1125453599d02581e49f5c4ed225/ADU_Final_Magie.glb'
                    }
                    alt="Reference ADU model"
                    auto-rotate
                    camera-controls
                    ar
                    ar-modes="webxr scene-viewer quick-look"
                    exposure="1.1"
                    shadow-intensity="0.8"
                  />
                </div>

                <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    className="btn"
                    onClick={() => { setCfgDone(false); setAduStep(0); setAduConfig({}) }}
                  >
                    {t('cfg-btn-reset')}
                  </button>
                  <button
                    className="btn"
                    onClick={() => { setCfgDone(false); setAduStep(0) }}
                  >
                    {t('cfg-btn-edit')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: live score dashboard ── */}
          <div className="cfg-right">
            <div className="score-dashboard">
              {(() => {
                const scores = calcCfgScore(aduConfig)
                return (
                  <>
                    <div className="score-grade-badge" style={{ background: gradeColor(scores.grade) }}>
                      {scores.grade}
                    </div>
                    <div className="score-overall-num">{scores.overall}<span>/100</span></div>
                    <p className="small" style={{ color: '#8aa0b7', marginBottom: '16px' }}>{t('cfg-overall-label')}</p>

                    <div className="score-metrics">
                      {[
                        { key: 'wildfire', icon: '🔥', labelKey: 'cfg-score-wildfire' },
                        { key: 'energy',   icon: '⚡', labelKey: 'cfg-score-energy'   },
                        { key: 'water',    icon: '💧', labelKey: 'cfg-score-water'    },
                        { key: 'eco',      icon: '🌱', labelKey: 'cfg-score-eco'      },
                        { key: 'cost',     icon: '💰', labelKey: 'cfg-score-cost'     },
                      ].map(({ key, icon, labelKey }) => (
                        <div key={key} className="score-metric-row">
                          <span className="score-metric-label">{icon} {t(labelKey)}</span>
                          <div className="score-bar-track">
                            <div
                              className="score-bar-fill"
                              style={{ width: `${scores[key]}%`, background: scoreBarColor(scores[key]) }}
                            />
                          </div>
                          <span className="score-metric-val">{scores[key] || 0}</span>
                        </div>
                      ))}
                    </div>

                    {Object.keys(aduConfig).length > 0 && (
                      <div className="score-tips">
                        {scores.wildfire < 60 && <p className="cfg-tip cfg-tip-warn">🔥 {t('tip-wildfire-low')}</p>}
                        {scores.energy < 60 && <p className="cfg-tip cfg-tip-warn">⚡ {t('tip-energy-low')}</p>}
                        {scores.water < 60 && <p className="cfg-tip cfg-tip-warn">💧 {t('tip-water-low')}</p>}
                        {scores.eco < 60 && <p className="cfg-tip cfg-tip-warn">🌱 {t('tip-eco-low')}</p>}
                        {scores.overall >= 80 && <p className="cfg-tip cfg-tip-good">✅ {t('tip-great-build')}</p>}
                      </div>
                    )}

                    {Object.keys(aduConfig).length === 0 && (
                      <p className="small" style={{ color: '#4a6580', textAlign: 'center', marginTop: '20px' }}>
                        {t('cfg-start-hint')}
                      </p>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>

        {/* ── BROWSE EXISTING ADUs ── */}
        <div style={{ marginTop: '32px' }}>
          <button
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}
            onClick={() => setShowAduGallery(v => !v)}
          >
            {showAduGallery ? '▲' : '▼'} {t('adu-gallery-toggle')}
          </button>

          {showAduGallery && (
            <div>
              <p className="small" style={{ color: '#8aa0b7', marginBottom: '16px' }}
                dangerouslySetInnerHTML={{ __html: t('adu-gallery-desc') }} />
              <div className="adu-grid">
                {adus.map((adu) => {
                  const isOpen = activeAdu?.name === adu.name
                  return (
                    <div
                      key={adu.name}
                      className={`adu-card${isOpen ? ' adu-card-open' : ''}`}
                    >
                      {/* Clickable header area */}
                      <div
                        tabIndex={0}
                        role="button"
                        style={{ cursor: 'pointer' }}
                        aria-expanded={isOpen}
                        onClick={() => { setActiveAdu(isOpen ? null : adu); setAduMaterial('marble') }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveAdu(isOpen ? null : adu); setAduMaterial('marble') } }}
                      >
                        <h4>{adu.name}</h4>
                        <p className="small">{t(adu.descKey)}</p>
                        <ul className="metrics">
                          <li><b>{t('adu-energy-label')}</b> {adu.energy}</li>
                          <li><b>{t('adu-water-label')}</b> {adu.water}</li>
                          <li><b>{t('adu-wildfire-label')}</b> {adu.wildfire}</li>
                          <li><b>{t('adu-equity-label')}</b> {adu.equity}</li>
                          <li><b>{t('adu-cost-label')}</b> {adu.cost}</li>
                        </ul>
                        <p className="small" style={{ color: '#60a5fa', marginTop: '10px' }}>
                          {isOpen ? t('adu-gallery-close') : t('adu-gallery-view3d')}
                        </p>
                      </div>

                      {/* Inline 3D viewer — expands inside the card */}
                      {isOpen && (
                        <div className="adu-inline-viewer" onClick={(e) => e.stopPropagation()}>
                          {typeof adu.model === 'object' && (
                            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                              {['marble', 'ceramic', 'granite'].map((mat) => (
                                <label key={mat} style={{ cursor: 'pointer', fontSize: '0.82rem', color: '#cfe3ff' }}>
                                  <input type="radio" name="galleryMaterial" value={mat} checked={aduMaterial === mat} onChange={() => setAduMaterial(mat)} />
                                  {' '}{mat.charAt(0).toUpperCase() + mat.slice(1)}
                                </label>
                              ))}
                            </div>
                          )}
                          {/* @ts-ignore */}
                          <model-viewer
                            src={getAduSrc(adu, aduMaterial)}
                            alt={`${adu.name} model`}
                            auto-rotate
                            camera-controls
                            ar
                            ar-modes="webxr scene-viewer quick-look"
                            exposure="1.1"
                            shadow-intensity="0.8"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* WILDFIRE SAFETY TESTER */}
      <section className="panel" id="adu-tester">
        <h3 dangerouslySetInnerHTML={{ __html: t('wt-h3') }} />
        <p className="small">{t('wt-intro')}</p>
        {(() => {
          const toRad = d => d * Math.PI / 180
          const norms = [+wtRoof/3, +wtWalls/3, +wtSpace/3, +wtVents/3, +wtWindows/3, +wtWater/3, (+wtExposure+2)/4, +wtSprinklers/2]
          const raw = [+wtRoof,+wtWalls,+wtSpace,+wtVents,+wtWindows,+wtWater,+wtExposure,+wtSprinklers].reduce((a,b)=>a+b,0)
          const rating = Math.max(1,Math.min(10,Math.round(1+(Math.max(0,Math.min(24,raw+2))*9)/24)))
          const cc = n => n < 0.35 ? '#f87171' : n < 0.7 ? '#fb923c' : '#4ade80'
          const ratingColor = rating<=3?'#f87171':rating<=6?'#fb923c':rating<=8?'#86efac':'#4ade80'
          const ratingLabel = rating<=3?(lang==='es'?'Alto Riesgo':'High Risk'):rating<=6?(lang==='es'?'Moderado':'Moderate'):rating<=8?(lang==='es'?'Bueno':'Good'):(lang==='es'?'Excelente':'Excellent')

          // House colors
          const roofC=cc(norms[0]), wallC=cc(norms[1]), spaceC=cc(norms[2])
          const ventC=cc(norms[3]), winC=cc(norms[4]), waterC=cc(norms[5]), sprC=cc(norms[7])
          const expGlow = norms[6]<0.35?'rgba(248,113,113,0.15)':norms[6]<0.7?'rgba(251,146,60,0.08)':'rgba(74,222,128,0.07)'

          // Gauge geometry
          const GCX=110, GCY=112, GRO=88, GRI=60
          const arcPt = (deg,r) => [GCX+r*Math.cos(toRad(deg)), GCY-r*Math.sin(toRad(deg))]
          const sectorD = (a1,a2,ro,ri) => {
            const [ox1,oy1]=arcPt(a1,ro),[ox2,oy2]=arcPt(a2,ro)
            const [ix2,iy2]=arcPt(a2,ri),[ix1,iy1]=arcPt(a1,ri)
            const lg=Math.abs(a1-a2)>180?1:0
            return `M${ox1.toFixed(1)},${oy1.toFixed(1)} A${ro},${ro} 0 ${lg},0 ${ox2.toFixed(1)},${oy2.toFixed(1)} L${ix2.toFixed(1)},${iy2.toFixed(1)} A${ri},${ri} 0 ${lg},1 ${ix1.toFixed(1)},${iy1.toFixed(1)}Z`
          }
          const needleDeg = 180-(rating-1)/9*180
          const [ntx,nty]=arcPt(needleDeg,GRO-4)

          // Radar geometry
          const RCX=110,RCY=110,RR=78
          const catLabels=['Roof','Walls','Space','Vents','Windows','Water','Exposure','Sprinklers']
          const radarPts=norms.map((v,i)=>{const a=toRad(i*45-90);return[RCX+v*RR*Math.cos(a),RCY+v*RR*Math.sin(a)]})
          const radarPoly=radarPts.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
          const labelPts=Array.from({length:8},(_,i)=>{const a=toRad(i*45-90);return[RCX+(RR+18)*Math.cos(a),RCY+(RR+18)*Math.sin(a)]})

          return (
            <div>
              <div className="wt-layout">
                {/* LEFT: form */}
                <div className="calc">
                  <div className="row">
                    <label><span dangerouslySetInnerHTML={{__html:t('wt-label-roof')}}/><select value={wtRoof} onChange={e=>setWtRoof(e.target.value)}><option value="0">{t('wt-roof-0')}</option><option value="2">{t('wt-roof-2')}</option><option value="3">{t('wt-roof-3')}</option></select></label>
                    <label><span dangerouslySetInnerHTML={{__html:t('wt-label-walls')}}/><select value={wtWalls} onChange={e=>setWtWalls(e.target.value)}><option value="0">{t('wt-walls-0')}</option><option value="2">{t('wt-walls-2')}</option><option value="3">{t('wt-walls-3')}</option></select></label>
                    <label><span dangerouslySetInnerHTML={{__html:t('wt-label-space')}}/><select value={wtSpace} onChange={e=>setWtSpace(e.target.value)}><option value="0">{t('wt-space-0')}</option><option value="2">{t('wt-space-2')}</option><option value="3">{t('wt-space-3')}</option></select></label>
                  </div>
                  <div className="row">
                    <label><span dangerouslySetInnerHTML={{__html:t('wt-label-vents')}}/><select value={wtVents} onChange={e=>setWtVents(e.target.value)}><option value="0">{t('wt-vents-0')}</option><option value="2">{t('wt-vents-2')}</option><option value="3">{t('wt-vents-3')}</option></select></label>
                    <label><span dangerouslySetInnerHTML={{__html:t('wt-label-windows')}}/><select value={wtWindows} onChange={e=>setWtWindows(e.target.value)}><option value="0">{t('wt-windows-0')}</option><option value="2">{t('wt-windows-2')}</option><option value="3">{t('wt-windows-3')}</option></select></label>
                    <label><span dangerouslySetInnerHTML={{__html:t('wt-label-water')}}/><select value={wtWater} onChange={e=>setWtWater(e.target.value)}><option value="0">{t('wt-water-0')}</option><option value="2">{t('wt-water-2')}</option><option value="3">{t('wt-water-3')}</option></select></label>
                  </div>
                  <div className="row">
                    <label><span dangerouslySetInnerHTML={{__html:t('wt-label-exposure')}}/><select value={wtExposure} onChange={e=>setWtExposure(e.target.value)}><option value="-2">{t('wt-exp-neg2')}</option><option value="0">{t('wt-exp-0')}</option><option value="2">{t('wt-exp-2')}</option></select></label>
                    <label><span dangerouslySetInnerHTML={{__html:t('wt-label-sprinklers')}}/><select value={wtSprinklers} onChange={e=>setWtSprinklers(e.target.value)}><option value="0">{t('wt-spr-0')}</option><option value="1">{t('wt-spr-1')}</option><option value="2">{t('wt-spr-2')}</option></select></label>
                  </div>
                  <button className="btn brand" type="button" onClick={computeWildfireRating} dangerouslySetInnerHTML={{__html:t('wt-run-btn')}}/>
                  <button className="btn" type="button" style={{marginLeft:'8px'}} onClick={shareWtResult} dangerouslySetInnerHTML={{__html:t('wt-share-btn')}}/>
                  {wtResult && <p className="result" aria-live="polite">{wtResult}</p>}
                  <p className="note small" dangerouslySetInnerHTML={{__html:t('wt-note')}}/>
                </div>

                {/* RIGHT: house diagram + gauge */}
                <div className="wt-visuals">
                  {/* House SVG */}
                  <svg viewBox="0 0 200 168" className="wt-house-svg">
                    {/* Exposure background glow */}
                    <rect x="0" y="0" width="200" height="168" fill={expGlow} rx="8"/>
                    {/* Defensible space ground zone */}
                    <rect x="0" y="140" width="200" height="28" fill={spaceC} opacity="0.22" rx="0"/>
                    <rect x="0" y="140" width="200" height="3" fill={spaceC} opacity="0.55"/>
                    {/* Walls */}
                    <rect x="32" y="66" width="136" height="76" fill={wallC} opacity="0.8" rx="2"/>
                    {/* Roof */}
                    <polygon points="18,68 100,12 182,68" fill={roofC} opacity="0.88"/>
                    <line x1="18" y1="68" x2="182" y2="68" stroke="#0a121e" strokeWidth="2"/>
                    {/* Chimney */}
                    <rect x="132" y="24" width="14" height="32" fill="#374151" rx="1"/>
                    <rect x="129" y="22" width="20" height="5" fill="#4b5563" rx="1"/>
                    {/* Left window */}
                    <rect x="46" y="82" width="34" height="26" fill={winC} opacity="0.78" rx="2"/>
                    <line x1="63" y1="82" x2="63" y2="108" stroke="#0a121e" strokeWidth="1.2" opacity="0.45"/>
                    <line x1="46" y1="95" x2="80" y2="95" stroke="#0a121e" strokeWidth="1.2" opacity="0.45"/>
                    {/* Right window */}
                    <rect x="120" y="82" width="34" height="26" fill={winC} opacity="0.78" rx="2"/>
                    <line x1="137" y1="82" x2="137" y2="108" stroke="#0a121e" strokeWidth="1.2" opacity="0.45"/>
                    <line x1="120" y1="95" x2="154" y2="95" stroke="#0a121e" strokeWidth="1.2" opacity="0.45"/>
                    {/* Door */}
                    <rect x="82" y="100" width="36" height="42" fill="#1e3a5f" rx="3"/>
                    <circle cx="115" cy="122" r="2.5" fill="#94a3b8"/>
                    {/* Left vent */}
                    <rect x="48" y="50" width="20" height="8" fill={ventC} opacity="0.9" rx="1"/>
                    <line x1="54" y1="50" x2="54" y2="58" stroke="#0a121e" strokeWidth="0.8" opacity="0.4"/>
                    <line x1="60" y1="50" x2="60" y2="58" stroke="#0a121e" strokeWidth="0.8" opacity="0.4"/>
                    {/* Right vent */}
                    <rect x="132" y="50" width="20" height="8" fill={ventC} opacity="0.9" rx="1"/>
                    <line x1="138" y1="50" x2="138" y2="58" stroke="#0a121e" strokeWidth="0.8" opacity="0.4"/>
                    <line x1="144" y1="50" x2="144" y2="58" stroke="#0a121e" strokeWidth="0.8" opacity="0.4"/>
                    {/* Water tank */}
                    <rect x="158" y="108" width="18" height="30" fill={waterC} opacity="0.75" rx="2"/>
                    <rect x="155" y="106" width="24" height="5" fill={waterC} opacity="0.55" rx="1"/>
                    <text x="167" y="127" fontSize="5.5" fill="#0a121e" textAnchor="middle" fontFamily="inherit" fontWeight="700">H₂O</text>
                    {/* Sprinkler heads */}
                    {norms[7]>0 && [60,100,140].map(sx=>(
                      <g key={sx}>
                        <circle cx={sx} cy="138" r="3.5" fill={sprC} opacity="0.8"/>
                        <line x1={sx} y1="134" x2={sx} y2="143" stroke="#0a121e" strokeWidth="1"/>
                      </g>
                    ))}
                    {/* Part labels on hover area - just small icons */}
                    <text x="100" y="161" fontSize="7" fill="#8aa0b7" textAnchor="middle" fontFamily="inherit">Defensible Space</text>
                  </svg>

                  {/* Safety Gauge */}
                  <svg viewBox="0 0 220 128" className="wt-gauge-svg">
                    {/* Background track */}
                    <path d={sectorD(180,0,GRO,GRI)} fill="rgba(15,26,46,0.6)" stroke="rgba(96,165,250,0.1)" strokeWidth="1"/>
                    {/* Zone sectors */}
                    <path d={sectorD(180,120,GRO,GRI)} fill="rgba(248,113,113,0.2)"/>
                    <path d={sectorD(120,60,GRO,GRI)} fill="rgba(251,146,60,0.2)"/>
                    <path d={sectorD(60,20,GRO,GRI)} fill="rgba(134,239,172,0.2)"/>
                    <path d={sectorD(20,0,GRO,GRI)} fill="rgba(74,222,128,0.25)"/>
                    {/* Active zone glow */}
                    {rating<=3&&<path d={sectorD(180,120,GRO,GRI)} fill="rgba(248,113,113,0.45)"/>}
                    {rating>3&&rating<=6&&<path d={sectorD(120,60,GRO,GRI)} fill="rgba(251,146,60,0.45)"/>}
                    {rating>6&&rating<=8&&<path d={sectorD(60,20,GRO,GRI)} fill="rgba(134,239,172,0.45)"/>}
                    {rating>8&&<path d={sectorD(20,0,GRO,GRI)} fill="rgba(74,222,128,0.55)"/>}
                    {/* Zone boundary ticks */}
                    {[180,120,60,20,0].map(deg=>{const[tx,ty]=arcPt(deg,GRO+3);const[bx,by]=arcPt(deg,GRI-3);return<line key={deg} x1={tx.toFixed(1)} y1={ty.toFixed(1)} x2={bx.toFixed(1)} y2={by.toFixed(1)} stroke="rgba(96,165,250,0.3)" strokeWidth="1.5"/>})}
                    {/* Score in center */}
                    <text x={GCX} y="82" fontSize="30" fontWeight="700" fill={ratingColor} textAnchor="middle" fontFamily="inherit">{rating}</text>
                    <text x={GCX} y="96" fontSize="9" fill="#8aa0b7" textAnchor="middle" fontFamily="inherit">/10</text>
                    {/* Needle */}
                    <line x1={GCX} y1={GCY} x2={ntx.toFixed(1)} y2={nty.toFixed(1)} stroke={ratingColor} strokeWidth="3" strokeLinecap="round"/>
                    <circle cx={GCX} cy={GCY} r="7" fill="#0a121e" stroke={ratingColor} strokeWidth="2.5"/>
                    <circle cx={GCX} cy={GCY} r="3.5" fill={ratingColor}/>
                    {/* Zone labels */}
                    <text x="24" y="122" fontSize="7.5" fill="#f87171" textAnchor="middle" fontFamily="inherit">Risk</text>
                    <text x="82" y="108" fontSize="7.5" fill="#fb923c" textAnchor="middle" fontFamily="inherit">Mod</text>
                    <text x="148" y="108" fontSize="7.5" fill="#86efac" textAnchor="middle" fontFamily="inherit">Good</text>
                    <text x="196" y="122" fontSize="7.5" fill="#4ade80" textAnchor="middle" fontFamily="inherit">Safe</text>
                    {/* Rating label */}
                    <text x={GCX} y="122" fontSize="9" fill={ratingColor} textAnchor="middle" fontFamily="inherit" fontWeight="600">{ratingLabel}</text>
                  </svg>
                </div>
              </div>

              {/* Bottom row: per-category bars + radar */}
              <div className="wt-bottom">
                {/* Per-category bars */}
                <div className="wt-bars">
                  <p style={{fontSize:'0.8rem',color:'#8aa0b7',marginBottom:'10px',fontWeight:600}}>
                    {lang==='es'?'Puntuación por categoría':'Category breakdown'}
                  </p>
                  {[
                    {label:t('wt-label-roof'),n:norms[0]},
                    {label:t('wt-label-walls'),n:norms[1]},
                    {label:t('wt-label-space'),n:norms[2]},
                    {label:t('wt-label-vents'),n:norms[3]},
                    {label:t('wt-label-windows'),n:norms[4]},
                    {label:t('wt-label-water'),n:norms[5]},
                    {label:t('wt-label-exposure'),n:norms[6]},
                    {label:t('wt-label-sprinklers'),n:norms[7]},
                  ].map(({label,n},i)=>(
                    <div key={i} className="wt-bar-row">
                      <span className="wt-bar-label">{label.replace(/<[^>]*>/g,'').replace(':','').trim()}</span>
                      <div className="wt-bar-track"><div className="wt-bar-fill" style={{width:`${n*100}%`,background:cc(n)}}/></div>
                      <span className="wt-bar-pct" style={{color:cc(n)}}>{Math.round(n*100)}%</span>
                    </div>
                  ))}
                </div>

                {/* Radar / spider chart */}
                <div className="wt-radar">
                  <p style={{fontSize:'0.8rem',color:'#8aa0b7',marginBottom:'6px',fontWeight:600,textAlign:'center'}}>
                    {lang==='es'?'Perfil de resiliencia':'Resilience profile'}
                  </p>
                  <svg viewBox="0 0 220 220" style={{width:'100%',maxWidth:'220px',margin:'0 auto',display:'block'}}>
                    {/* Grid rings */}
                    {[1,0.66,0.33].map((s,si)=>(
                      <polygon key={si} points={Array.from({length:8},(_,i)=>{const a=toRad(i*45-90);return`${(RCX+RR*s*Math.cos(a)).toFixed(1)},${(RCY+RR*s*Math.sin(a)).toFixed(1)}`}).join(' ')} fill="none" stroke="rgba(96,165,250,0.12)" strokeWidth="1"/>
                    ))}
                    {/* Axis spokes */}
                    {Array.from({length:8},(_,i)=>{const a=toRad(i*45-90);return<line key={i} x1={RCX} y1={RCY} x2={(RCX+RR*Math.cos(a)).toFixed(1)} y2={(RCY+RR*Math.sin(a)).toFixed(1)} stroke="rgba(96,165,250,0.1)" strokeWidth="1"/>})}
                    {/* Data polygon fill */}
                    <polygon points={radarPoly} fill="rgba(96,165,250,0.12)" stroke="rgba(96,165,250,0.4)" strokeWidth="1.5"/>
                    {/* Data dots */}
                    {radarPts.map(([x,y],i)=>(
                      <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="4.5" fill={cc(norms[i])} stroke="#0a121e" strokeWidth="1.5">
                        <title>{catLabels[i]}: {Math.round(norms[i]*100)}%</title>
                      </circle>
                    ))}
                    {/* Axis labels */}
                    {labelPts.map(([x,y],i)=>(
                      <text key={i} x={x.toFixed(1)} y={y.toFixed(1)} fontSize="8.5" fill="#8aa0b7" textAnchor="middle" dominantBaseline="middle" fontFamily="inherit">{catLabels[i]}</text>
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          )
        })()}
      </section>

      {/* WILDFIRE EVENTS */}
      <section className="panel" id="wildfire-tools">
        <h3 dangerouslySetInnerHTML={{ __html: t('wildfire-events-h3') }} />
        <p className="small" dangerouslySetInnerHTML={{ __html: t('wildfire-events-desc') }} />
        <form className="wf-form" noValidate onSubmit={fetchWildfires}>
          <fieldset className="wf-fieldset">
            <legend><span>{t('wf-area-legend')}</span></legend>
            <div className="wf-row">
              <label>{t('wf-min-lon')} <input inputMode="decimal" type="text" value={wfMinLon} onChange={e => setWfMinLon(e.target.value)} /></label>
              <label>{t('wf-max-lon')} <input inputMode="decimal" type="text" value={wfMaxLon} onChange={e => setWfMaxLon(e.target.value)} /></label>
              <label>{t('wf-min-lat')} <input inputMode="decimal" type="text" value={wfMinLat} onChange={e => setWfMinLat(e.target.value)} /></label>
              <label>{t('wf-max-lat')} <input inputMode="decimal" type="text" value={wfMaxLat} onChange={e => setWfMaxLat(e.target.value)} /></label>
            </div>
            <div className="wf-input-help">
              <p className="small"><strong>{t('wf-ca-bounds')}</strong> {t('wf-ca-bounds-val')}</p>
              <p className="small"><strong>{t('wf-example')}</strong> {t('wf-example-val')}</p>
            </div>
          </fieldset>
          <fieldset className="wf-fieldset">
            <legend><span>{t('wf-time-legend')}</span></legend>
            <div className="wf-row">
              <label>{t('wf-days-lookback')} <input inputMode="numeric" type="text" value={wfDays} onChange={e => setWfDays(e.target.value)} /></label>
              <span className="wf-or" aria-hidden="true">{t('wf-or')}</span>
              <label>{t('wf-start-label')} <input type="date" value={wfStart} onChange={e => setWfStart(e.target.value)} /></label>
              <label>{t('wf-end-label')} <input type="date" value={wfEnd} onChange={e => setWfEnd(e.target.value)} /></label>
            </div>
            <div className="wf-input-help">
              <p className="small"><strong>{t('wf-days-help')}</strong> {t('wf-days-help-val')}</p>
            </div>
          </fieldset>
          <div className="wf-actions">
            <button type="submit" className="btn brand" disabled={wfLoading}>{t('wf-fetch-btn')}</button>
            <button type="button" className="btn" onClick={clearWf}>{t('wf-clear-btn')}</button>
          </div>
        </form>
        <div className="wf-results-layout">
          {/* Left: summary + table */}
          <div>
            <div className="wf-summary" role="status" aria-live="polite">{wfSummary}</div>
            {wfRows.length > 0 && (
              <div className="wf-table-wrap">
                <table className="wf-table">
                  <thead>
                    <tr><th>{t('wf-th-num')}</th><th>{t('wf-th-date')}</th><th>{t('wf-th-title')}</th><th>{t('wf-th-lat')}</th><th>{t('wf-th-lon')}</th><th>{t('wf-th-status')}</th><th>{t('wf-th-sources')}</th></tr>
                  </thead>
                  <tbody>
                    {(wfShowAll ? wfRows : wfRows.slice(0, 12)).map((row, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{row.date}</td>
                        <td>{row.title}</td>
                        <td>{row.lat}</td>
                        <td>{row.lon}</td>
                        <td>{row.status}</td>
                        <td dangerouslySetInnerHTML={{ __html: row.sources }} />
                      </tr>
                    ))}
                  </tbody>
                </table>
                {wfRows.length > 12 && (
                  <div style={{ textAlign: 'center', padding: '10px 0 4px' }}>
                    <button className="tool-btn" onClick={() => setWfShowAll(v => !v)}
                      style={{ fontSize: '0.82rem', padding: '6px 20px' }}>
                      {wfShowAll
                        ? (lang === 'es' ? '▲ Ver menos' : '▲ Show less')
                        : (lang === 'es' ? `▼ Ver más (${wfRows.length - 12} más)` : `▼ Read more (${wfRows.length - 12} more)`)}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: line chart */}
          {wfRows.length > 0 && (() => {
            // Group events by date, then sort chronologically
            const counts = {}
            wfRows.forEach(r => {
              if (r.date && r.date !== 'N/A') counts[r.date] = (counts[r.date] || 0) + 1
            })
            let entries = Object.entries(counts)
              .map(([d, v]) => [d, v, new Date(d)])
              .filter(([, , dt]) => !isNaN(dt))
              .sort((a, b) => a[2] - b[2])
              .map(([d, v]) => [d, v])

            // If too many points, group by month
            if (entries.length > 30) {
              const monthly = {}
              entries.forEach(([d, v]) => {
                const dt = new Date(d)
                const key = dt.toLocaleString('en', { month: 'short' }) + ' ' + dt.getFullYear()
                monthly[key] = (monthly[key] || 0) + v
              })
              entries = Object.entries(monthly)
            }

            if (entries.length < 2) return (
              <div className="wf-chart-container">
                <p className="small" style={{ color: '#8aa0b7' }}>Not enough dated events to plot a trend.</p>
              </div>
            )

            const W = 360, H = 240
            const PAD = { top: 28, right: 20, bottom: 52, left: 42 }
            const plotW = W - PAD.left - PAD.right
            const plotH = H - PAD.top - PAD.bottom
            const n = entries.length
            const maxVal = Math.max(...entries.map(([, v]) => v))

            const xPos = i => PAD.left + (i / (n - 1)) * plotW
            const yPos = v => PAD.top + plotH - (v / maxVal) * plotH

            const linePoints = entries.map(([, v], i) => `${xPos(i)},${yPos(v)}`).join(' ')
            const areaPoints = `${xPos(0)},${PAD.top + plotH} ${linePoints} ${xPos(n - 1)},${PAD.top + plotH}`

            const step = Math.max(1, Math.ceil(n / 6))
            const yTicks = [0, Math.round(maxVal / 2), maxVal].filter((v, i, a) => a.indexOf(v) === i)

            // Open vs closed counts
            const openCount = wfRows.filter(r => r.status === 'Open').length
            const closedCount = wfRows.length - openCount

            return (
              <div className="wf-chart-container">
                <p className="small" style={{ color: '#e6f0ff', fontWeight: 600, marginBottom: '4px' }}>
                  {lang === 'es' ? 'Eventos por fecha' : 'Events over time'}
                </p>
                <p className="small" style={{ color: '#8aa0b7', marginBottom: '12px', fontSize: '0.75rem' }}>
                  {lang === 'es' ? `${openCount} activos · ${closedCount} cerrados` : `${openCount} active · ${closedCount} closed`}
                </p>

                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="wfAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(248,113,113,0.45)" />
                      <stop offset="100%" stopColor="rgba(248,113,113,0.02)" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {yTicks.map(v => (
                    <line key={v} x1={PAD.left} y1={yPos(v)} x2={PAD.left + plotW} y2={yPos(v)}
                      stroke="rgba(96,165,250,0.12)" strokeWidth="1" strokeDasharray="4,3" />
                  ))}

                  {/* Y labels */}
                  {yTicks.map(v => (
                    <text key={v} x={PAD.left - 6} y={yPos(v) + 4}
                      fill="#8aa0b7" fontSize="10" textAnchor="end" fontFamily="inherit">{v}</text>
                  ))}

                  {/* X labels */}
                  {entries.map(([label], i) => {
                    if (i % step !== 0 && i !== n - 1) return null
                    const short = label.length > 9 ? label.slice(0, 9) : label
                    return (
                      <text key={i} x={xPos(i)} y={PAD.top + plotH + 14}
                        fill="#8aa0b7" fontSize="9" textAnchor="middle" fontFamily="inherit"
                        transform={`rotate(-35,${xPos(i)},${PAD.top + plotH + 14})`}>
                        {short}
                      </text>
                    )
                  })}

                  {/* Area fill */}
                  <polygon points={areaPoints} fill="url(#wfAreaGrad)" />

                  {/* Line */}
                  <polyline points={linePoints} fill="none"
                    stroke="#f87171" strokeWidth="2"
                    strokeLinejoin="round" strokeLinecap="round" />

                  {/* Dots */}
                  {entries.map(([label, v], i) => (
                    <circle key={i} cx={xPos(i)} cy={yPos(v)} r={n > 20 ? 2.5 : 4}
                      fill="#f87171" stroke="#0a121e" strokeWidth="1.5">
                      <title>{`${label}: ${v} event${v !== 1 ? 's' : ''}`}</title>
                    </circle>
                  ))}

                  {/* Peak label */}
                  {(() => {
                    const peakIdx = entries.reduce((mi, [, v], i) => v > entries[mi][1] ? i : mi, 0)
                    const [peakLabel, peakVal] = entries[peakIdx]
                    const px = xPos(peakIdx), py = yPos(peakVal)
                    return (
                      <g>
                        <rect x={px - 28} y={py - 22} width="56" height="16" rx="4"
                          fill="rgba(248,113,113,0.2)" stroke="rgba(248,113,113,0.4)" strokeWidth="1" />
                        <text x={px} y={py - 11} fill="#fca5a5" fontSize="9.5" textAnchor="middle" fontFamily="inherit">
                          peak: {peakVal}
                        </text>
                      </g>
                    )
                  })()}

                  {/* Axes */}
                  <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH}
                    stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
                  <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH}
                    stroke="rgba(96,165,250,0.3)" strokeWidth="1" />
                </svg>

                {/* Status breakdown mini bars */}
                <div style={{ marginTop: '14px', borderTop: '1px solid rgba(96,165,250,0.1)', paddingTop: '12px' }}>
                  <p className="small" style={{ color: '#8aa0b7', marginBottom: '8px', fontSize: '0.75rem' }}>
                    {lang === 'es' ? 'Estado de los eventos' : 'Event status breakdown'}
                  </p>
                  <div style={{ display: 'flex', gap: '6px', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ flex: openCount, background: '#f87171', borderRadius: '4px 0 0 4px' }} title={`Open: ${openCount}`} />
                    <div style={{ flex: closedCount, background: 'rgba(96,165,250,0.5)', borderRadius: '0 4px 4px 0' }} title={`Closed: ${closedCount}`} />
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>● {lang === 'es' ? 'Activo' : 'Active'} {openCount}</span>
                    <span style={{ fontSize: '0.72rem', color: '#93c5fd' }}>● {lang === 'es' ? 'Cerrado' : 'Closed'} {closedCount}</span>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* MAP */}
      <section className="panel" id="mapSection">
        <h3 dangerouslySetInnerHTML={{ __html: t('map-h3') }} />
        <p className="small">{t('map-p')}</p>
        <MapSection />
      </section>

      <footer>
        <div>{t('footer-text')} <strong>{t('footer-source-label')}</strong> {t('footer-source-val')}</div>
        <div style={{ marginTop: '6px' }} className="small">{t('footer-accessibility')}</div>
      </footer>
    </Layout>
  )
}


