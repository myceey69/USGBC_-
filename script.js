// --------- Search / TOC highlighting ----------
const search = document.querySelector('#search');
const tocLinks = [...document.querySelectorAll('#toc a')];
const sections = tocLinks.map(a => document.querySelector(a.getAttribute('href')));

function filterTOC(q){
  const t = q.trim().toLowerCase();
  tocLinks.forEach(a=>{
    const match = a.textContent.toLowerCase().includes(t);
    a.style.display = match ? 'block' : 'none';
  });
}

search?.addEventListener('input', e=>filterTOC(e.target.value));

// Active link on scroll
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    const id = '#' + e.target.id;
    const link = tocLinks.find(a => a.getAttribute('href')===id);
    if(e.isIntersecting){
      tocLinks.forEach(x=>x.classList.remove('active'));
      link?.classList.add('active');
    }
  });
}, { rootMargin: "-30% 0px -60% 0px", threshold: 0.01 });

sections.forEach(s=>s && obs.observe(s));



// --------- Tank sizing calculator ----------
function calcTank(){
  const A = +roofArea.value;     // sq ft
  const R = +rainIn.value;       // inches
  const eff = +effEl.value;
  const gpm = +gpmEl.value;
  const min = +minutesEl.value;
  const days = +daysEl.value;

  const harvested = A * R * 0.623 * eff;          // gallons/year
  const fire = gpm * min;                         // gallons
  const domestic = 50 * 3 * days;                 // gallons
  const needed = Math.ceil(fire + domestic);
  const recommended = Math.ceil(Math.max(needed, harvested * 0.25));

  tankResult.textContent =
    `Recommended storage ≈ ${recommended.toLocaleString()} gallons `
    + `(fire: ${fire.toLocaleString()} + domestic: ${domestic.toLocaleString()}, `
    + `annual harvest ~ ${Math.ceil(harvested).toLocaleString()} gal).`;

  // --------- Tank donut chart ----------
  const chartWrap = document.getElementById('tankChartWrap');
  const chartCanvas = document.getElementById('tankDonut');
  if (chartWrap && chartCanvas) {
    chartWrap.classList.add('visible');
    if (window._tankChart) window._tankChart.destroy();
    window._tankChart = new Chart(chartCanvas, {
      type: 'doughnut',
      data: {
        labels: ['Fire Reserve', 'Domestic Reserve', 'Additional Harvest Capture'],
        datasets: [{
          data: [fire, domestic, Math.max(0, recommended - needed)],
          backgroundColor: ['#ef4444','#60a5fa','#4ade80'],
          borderColor: ['#991b1b','#1e3a8a','#15803d'],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cfe3ff', font: { size: 12 } } },
          title: { display: false }
        },
        cutout: '60%'
      }
    });
  }
}

const roofArea = document.getElementById('roofArea');
const rainIn   = document.getElementById('rainIn');
const effEl    = document.getElementById('eff');
const gpmEl    = document.getElementById('gpm');
const minutesEl= document.getElementById('minutes');
const daysEl   = document.getElementById('days');

document.getElementById('calcBtn')?.addEventListener('click', calcTank);

// --------- Checklist ----------
const checklistItems = [
  "Non-combustible exterior cladding (Class A or metal/cementitious)",
  "Tempered glass windows; ember-resistant attic/soffit vents",
  "Class A roof; clear debris from gutters & roof valleys",
  "0–5 ft ‘ignition-free’ zone: gravel/hardscape only",
  "5–30 ft lean, clean, and green landscaping (native/drought-tolerant)",
  "Ladder fuels removed; limb trees 6–10 ft up from ground",
  "Metal mesh (1/8” or less) on vents; seal gaps, weatherstrip doors",
  "Addressable signage; visible hydrant/standpipe access",
  "Solar + battery storage for outage resilience",
  "Rainwater tank with firefighter outlet (NST thread or local standard)"
];

const checklistItemsES = [
  "Revestimiento exterior no combustible (Clase A o metal/cemento)",
  "Ventanas de vidrio templado; ventilaciones resistentes a brasas en ático",
  "Techo Clase A; limpiar escombros de canaletas y valles del techo",
  "Zona de 0–5 ft 'libre de ignición': solo grava/pavimento",
  "Paisajismo limpio y verde de 5–30 ft (plantas nativas/resistentes a sequía)",
  "Combustibles tipo escalera removidos; podar árboles 6–10 ft desde el suelo",
  "Malla metálica (1/8\" o menos) en ventilaciones; sellar grietas y puertas",
  "Señalización visible; acceso a hidrante/tubería visible",
  "Solar + batería de almacenamiento para resiliencia ante cortes eléctricos",
  "Tanque de agua pluvial con salida para bomberos (rosca NST o estándar local)"
];

const checklist = document.getElementById('checklist');
const progress = document.getElementById('progress');

function renderChecklist(){
  if (!checklist) return;
  checklist.innerHTML = "";
  const lang = window._currentLang || 'en';
  const items = lang === 'es' ? checklistItemsES : checklistItems;
  const saved = JSON.parse(localStorage.getItem('checklistState') || '{}');
  items.forEach((t,i)=>{
    const id = "c"+i;
    const wrap = document.createElement('label');
    wrap.className = 'check-item';
    wrap.innerHTML = `<input id="${id}" type="checkbox" /> <span>${t}</span>`;
    checklist.appendChild(wrap);
    // restore saved state
    if (saved[id]) wrap.querySelector('input').checked = true;
  });
  checklist.addEventListener('change', () => {
    updateProgress();
    updateSafetyMeter();
    // persist state
    const state = {};
    checklist.querySelectorAll('input[type=checkbox]').forEach(c => { state[c.id] = c.checked; });
    localStorage.setItem('checklistState', JSON.stringify(state));
  });
  updateProgress();
  updateSafetyMeter();
}

function updateProgress(){
  if (!checklist || !progress) return;
  const checks = checklist.querySelectorAll('input[type=checkbox]');
  const done = Array.from(checks).filter(c=>c.checked).length;
  const lang = window._currentLang || 'en';
  progress.textContent = lang === 'es'
    ? `${done} de ${checks.length} completados`
    : `${done} of ${checks.length} completed`;
}

if (checklist) renderChecklist();

// --------- Map ----------
if (document.getElementById('map')) {
const map = L.map('map', { scrollWheelZoom:false }).setView([34.19, -118.13], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, attribution: '&copy; OpenStreetMap'
}).addTo(map);

// Real hub data with categories
const hubData = {
  hubs: [
    { name: "Recovery Hub — 540 W Woodbury Rd, Altadena", coords:[34.1705, -118.1610] },
    { name: "Pasadena Disaster Recovery Center", coords:[34.1479, -118.1445] },
    { name: "Pasadena City College — Workshops", coords:[34.1476, -118.1219] },
    { name: "Flintridge Center", coords:[34.2086, -118.2052] },
    { name: "Pasadena Convention Center — Logistics & Outreach", coords:[34.1569, -118.1306] },
  ],
  health: [
    { name: "AltaMed Health Services — Pasadena", coords:[34.1447, -118.1356] },
    { name: "Kaiser Permanente Medical — Pasadena", coords:[34.1520, -118.1280] },
    { name: "Pasadena Public Health Department", coords:[34.1573, -118.1316] },
    { name: "Wesley Health Centers", coords:[34.1502, -118.1425] },
    { name: "CHAP Community Health", coords:[34.1760, -118.1320] },
  ],
  schools: [
    { name: "Longfellow Elementary School", coords:[34.1782, -118.1282] },
    { name: "Washington STEM Magnet School", coords:[34.1478, -118.1304] },
    { name: "Altadena Arts Magnet", coords:[34.1956, -118.1345] },
  ],
  fire: [
    { name: "LACoFD Station 11 — Altadena", coords:[34.1950, -118.1270] },
    { name: "LACoFD Station 12 — Temple City", coords:[34.1003, -118.0522] },
    { name: "LACoFD Station 66 — Altadena (Foothill)", coords:[34.1975, -118.1065] },
    { name: "Pasadena FD Station 32", coords:[34.1453, -118.1312] },
    { name: "Pasadena FD Station 33", coords:[34.1432, -118.1481] },
    { name: "Pasadena FD Station 36", coords:[34.1751, -118.0823] },
    { name: "Pasadena FD Station 38", coords:[34.1886, -118.1710] },
  ],
  water: [
    { name: "Lincoln Ave Water Facility", coords:[34.1730, -118.1172] },
    { name: "Rubio Canon Water Station", coords:[34.2090, -118.0902] },
    { name: "Las Flores Water Facility", coords:[34.2050, -118.1180] },
    { name: "Foothill Municipal Water District", coords:[34.1940, -118.1560] },
  ],
  parks: [
    { name: "Washington Park", coords:[34.1497, -118.1380] },
    { name: "La Pintoresca Park", coords:[34.1832, -118.1320] },
    { name: "Loma Alta Park", coords:[34.1966, -118.1528] },
    { name: "Farnsworth Park — Altadena", coords:[34.2015, -118.1390] },
    { name: "Hahamongna Watershed Park", coords:[34.2220, -118.1690] },
  ]
};

const layerColors = {
  hubs: '#4ade80', health: '#f87171', schools: '#fbbf24',
  fire: '#fb923c', water: '#60a5fa', parks: '#a78bfa'
};
const layerEmojis = {
  hubs: '🏢', health: '🏥', schools: '🏫', fire: '🚒', water: '💧', parks: '🌳'
};

// Create Leaflet layer groups
const leafletLayers = {};
Object.keys(hubData).forEach(cat => {
  leafletLayers[cat] = L.layerGroup();
  hubData[cat].forEach(h => {
    const color = layerColors[cat];
    const icon = L.divIcon({
      html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
      className: '', iconSize: [14,14], iconAnchor: [7,7]
    });
    L.marker(h.coords, { icon }).addTo(leafletLayers[cat])
      .bindPopup(`<strong>${layerEmojis[cat]} ${h.name}</strong><br><small>${cat.charAt(0).toUpperCase()+cat.slice(1)}</small>`);
  });
  leafletLayers[cat].addTo(map);
});

// --------- Map filter buttons ----------
const activeLayers = new Set(Object.keys(hubData));
document.querySelectorAll('.map-filter-btn').forEach(btn => {
  const layer = btn.dataset.layer;
  btn.addEventListener('click', () => {
    if (layer === 'all') {
      // toggle all
      const anyOff = [...activeLayers].length < Object.keys(hubData).length;
      if (anyOff) {
        Object.keys(hubData).forEach(cat => {
          activeLayers.add(cat);
          leafletLayers[cat].addTo(map);
        });
        document.querySelectorAll('.map-filter-btn').forEach(b => b.classList.add('active'));
      } else {
        Object.keys(hubData).forEach(cat => {
          activeLayers.delete(cat);
          map.removeLayer(leafletLayers[cat]);
        });
        document.querySelectorAll('.map-filter-btn[data-layer!="all"]').forEach(b => b.classList.remove('active'));
      }
    } else {
      if (activeLayers.has(layer)) {
        activeLayers.delete(layer);
        map.removeLayer(leafletLayers[layer]);
        btn.classList.remove('active');
      } else {
        activeLayers.add(layer);
        leafletLayers[layer].addTo(map);
        btn.classList.add('active');
      }
      // update "all" button state
      const allBtn = document.querySelector('.map-filter-btn[data-layer="all"]');
      if (allBtn) allBtn.classList.toggle('active', activeLayers.size === Object.keys(hubData).length);
    }
  });
});

} // end map guard

// --------- Keyboard focus for a11y ----------
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if(el){
      e.preventDefault();
      el.scrollIntoView({ behavior:'smooth', block:'start' });
      history.replaceState(null, "", id);
    }
  })
});

/* ==================== Wildfire Events (added; scoped; runs after map) ==================== */
(function () {
  const form = document.getElementById('wf-form');
  if (!form) return; // only if widget exists

  const els = {
    minLon: document.getElementById('wfMinLon'),
    minLat: document.getElementById('wfMinLat'),
    maxLon: document.getElementById('wfMaxLon'),
    maxLat: document.getElementById('wfMaxLat'),
    days:   document.getElementById('wfDays'),
    start:  document.getElementById('wfStart'),
    end:    document.getElementById('wfEnd'),
    run:    document.getElementById('wfRun'),
    clear:  document.getElementById('wfClear'),
    summary:document.getElementById('wfSummary'),
    tbody:  document.getElementById('wfTbody')
  };

  // Chart.js setup
  let wildfireChart = null;
  const chartCtx = document.getElementById('wildfireChart');
  
  if (chartCtx) {
    wildfireChart = new Chart(chartCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'California Wildfires Over Time',
          data: [],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'California Wildfire Events Timeline'
          },
          legend: {
            display: true
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Number of Wildfires'
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  // Set California bounds as default
  els.minLon.value = '-125';
  els.minLat.value = '32';
  els.maxLon.value = '-114';
  els.maxLat.value = '42';
  els.days.value = '365';

  const wfLayer = L.layerGroup().addTo(map);

  // locale-safe decimal parsing; accepts comma and Unicode minus
  function parseDec(v){
    if (v == null) return NaN;
    let s = String(v).trim();
    s = s.replace(/\u2212|\u2012|\u2013|\u2014/g, '-'); // minus variants
    s = s.replace(/,/g, '.').replace(/\s+/g, '');
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function clearAll() {
    els.minLon.value = '';
    els.minLat.value = '';
    els.maxLon.value = '';
    els.maxLat.value = '';
    els.days.value   = '';
    els.start.value    = '';
    els.end.value    = '';
    els.summary.textContent = 'No data yet.';
    els.tbody.innerHTML = '';
    wfLayer.clearLayers();
    
    // Clear the chart data
    if (wildfireChart) {
      wildfireChart.data.labels = [];
      wildfireChart.data.datasets[0].data = [];
      wildfireChart.update();
    }
  }
  els.clear.addEventListener('click', clearAll);

  function buildEonetURL(p) {
    const bbox = [p.minLon, p.maxLat, p.maxLon, p.minLat].join(',');
    const u = new URL('https://eonet.gsfc.nasa.gov/api/v3/events/geojson');
    u.searchParams.set('category', 'wildfires');
    u.searchParams.set('bbox', bbox);
    if (p.days && p.days > 0) {
      u.searchParams.set('days', String(p.days));
    } else {
      if (p.start) u.searchParams.set('start', p.start);
      if (p.end)   u.searchParams.set('end', p.end);
    }
    return u.toString();
  }

  function updateWildfireChart(features) {
    if (!wildfireChart || !features.length) return;

    // Aggregate wildfire data by date
    const dateCounts = {};
    
    features.forEach(f => {
      const p = f.properties || {};
      if (p.date) {
        const date = new Date(p.date).toISOString().split('T')[0]; // YYYY-MM-DD format
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    // Sort dates and prepare chart data
    const sortedDates = Object.keys(dateCounts).sort();
    const labels = sortedDates.map(date => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const data = sortedDates.map(date => dateCounts[date]);

    // Update chart
    wildfireChart.data.labels = labels;
    wildfireChart.data.datasets[0].data = data;
    wildfireChart.update();
  }

  function renderTable(features) {
    els.tbody.innerHTML = '';
    wfLayer.clearLayers();

    features.forEach((f, i) => {
      const p = f.properties || {};
      const g = f.geometry || {};
      let lat = null, lon = null;

      if (g.type === 'Point' && Array.isArray(g.coordinates)) {
        [lon, lat] = g.coordinates;
      } else if (g.type === 'Polygon' && g.coordinates?.[0]?.[0]) {
        lon = g.coordinates[0][0][0]; lat = g.coordinates[0][0][1];
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${p.date || '—'}</td>
        <td>${p.title || 'Wildfire event'}</td>
        <td>${lat != null ? lat.toFixed(3) : '—'}</td>
        <td>${lon != null ? lon.toFixed(3) : '—'}</td>
        <td>${p.closed ? 'closed' : 'open'}</td>
        <td>${(p.sources||[]).map(s=>s.id).join(', ') || '—'}</td>
      `;
      els.tbody.appendChild(tr);

      if (lat != null && lon != null) {
        const m = L.marker([lat, lon]).bindPopup(`<b>${p.title || 'Wildfire'}</b><br>${p.date || ''}`);
        wfLayer.addLayer(m);
      }
    });

    // Update chart with wildfire data
    updateWildfireChart(features);

    // Heatmap overlay (requires Leaflet.heat)
    if (window._heatLayer) { window._heatLayer.remove(); window._heatLayer = null; }
    if (typeof L.heatLayer === 'function') {
      const heatPts = [];
      features.forEach(f => {
        const g = f.geometry || {};
        let lat = null, lon = null;
        if (g.type === 'Point' && g.coordinates) { [lon, lat] = g.coordinates; }
        else if (g.type === 'Polygon' && g.coordinates?.[0]?.[0]) { lon = g.coordinates[0][0][0]; lat = g.coordinates[0][0][1]; }
        if (lat != null && lon != null) heatPts.push([lat, lon, 0.8]);
      });
      if (heatPts.length) { window._heatLayer = L.heatLayer(heatPts, { radius: 25, blur: 20, maxZoom: 10 }).addTo(map); }
    }

    const pts = [];
    wfLayer.eachLayer(l => { if(l.getLatLng) pts.push(l.getLatLng()); });
    if (pts.length) map.fitBounds(L.latLngBounds(pts).pad(0.2));
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // prevent jump to top

    const minLon = parseDec(els.minLon.value);
    const minLat = parseDec(els.minLat.value);
    const maxLon = parseDec(els.maxLon.value);
    const maxLat = parseDec(els.maxLat.value);
    const days   = parseInt(String(parseDec(els.days.value) || 0), 10);

    const firstBad =
      [ [els.minLon,minLon], [els.minLat,minLat], [els.maxLon,maxLon], [els.maxLat,maxLat], [els.days, days] ]
      .find(([el,val]) => !Number.isFinite(val));
    if (firstBad) {
      els.summary.textContent = 'Please enter valid numbers (decimals with dot or comma).';
      firstBad[0].focus();
      return;
    }

    const params = {
      minLon: Math.min(Math.max(minLon, -180), 180),
      minLat: Math.min(Math.max(minLat,  -90),  90),
      maxLon: Math.min(Math.max(maxLon, -180), 180),
      maxLat: Math.min(Math.max(maxLat,  -90),  90),
      days:   Math.max(days, 0),
      start:  (els.start.value || '').trim(),
      end:    (els.end.value || '').trim()
    };

    els.summary.textContent = 'Loading…';

    try {
      const url = buildEonetURL(params);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      els.summary.textContent = `${features.length} event(s) loaded.`;
      renderTable(features);
    } catch (err) {
      console.error(err);
      els.summary.textContent = `Error: ${err.message}`;
      els.tbody.innerHTML = '';
      wfLayer.clearLayers();
    }
  });
  
  /* ==================== ADU Explorer ==================== */
const adus = [
  
 
  {
    name: "Monique's ADU",
    cost: "$$$",
    energy: "A++",
    water: "B",
    wildfire: "High",
    equity: "Moderate",
    desc: "Off-grid capable micro-unit ideal for community hubs or senior housing.",
    model:"https://raw.githubusercontent.com/myceey69/USGBC-/11b43160127e1125453599d02581e49f5c4ed225/ADU_Final_Magie.glb",
    mapTag: "solar"
  }, 
  

  
  
 {
  name: "Yiceth's ADU",
  cost: "$$",
  energy: "A",
  water: "A",
  wildfire: "High",
  equity: "Moderate",
  desc: "Fire-resistant ADU with optional marble or ceramic exterior materials.",
  model: {
    marble: "https://raw.githubusercontent.com/myceey69/USGBC-/032e246e40c0b3a5761a32d25e34d88fda6014ec/FireResCosby.glb",
    ceramic: "https://raw.githubusercontent.com/myceey69/USGBC-/42013288126c5f8f7c92481945b2fb057c4c6818/FireResCosby2.glb",
	granite: "https://raw.githubusercontent.com/myceey69/USGBC-/feae388d162ac7c5ec471bca23aefd64416e9f9d/FireResCosby3.glb"
  },
  mapTag: "FireResCosby"
}, 

   {
    name: "Yiceth's ADU 2",
    cost: "$$$",
    energy: "A++",
    water: "B",
    wildfire: "High",
    equity: "Moderate",
    desc: "Off-grid capable micro-unit ideal for community hubs or senior housing.",
    model:"https://raw.githubusercontent.com/myceey69/USGBC-/14a16da16591e8b3f72e129919f5ebe8cfbec729/MoniqueADU.glb",
    mapTag: "solar"
   }


];

const aduGrid = document.getElementById('aduGrid');
const aduViewer = document.getElementById('aduViewer');
const aduModel = document.getElementById('aduModel');
const aduTitle = document.getElementById('aduTitle');
const aduDesc = document.getElementById('aduDesc');
const aduClose = document.getElementById('aduClose');

adus.forEach(a => {
  const card = document.createElement('div');
  card.className = 'adu-card';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View ${a.name} ADU model`);
  card.innerHTML = `
    <h4>${a.name}</h4>
    <p class="small">${a.desc}</p>
    <ul class="metrics">
      <li><b>Energy:</b> ${a.energy}</li>
      <li><b>Water:</b> ${a.water}</li>
      <li><b>Wildfire safety:</b> ${a.wildfire}</li>
      <li><b>Equity:</b> ${a.equity}</li>
      <li><b>Cost:</b> ${a.cost}</li>
    </ul>`;
  card.addEventListener('click', () => handleAduCardClick(a, card));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAduCardClick(a, card); }
  });
  aduGrid.appendChild(card);
});

// --------- ADU Side-by-Side Comparison ----------
const compareItems = [];
const compareSection = document.getElementById('aduCompareSection');
const clearCompareBtn = document.getElementById('clearCompareBtn');

function handleAduCardClick(a, card) {
  // If compare mode has 0 or 1 selected, add to compare
  const allCards = [...aduGrid.querySelectorAll('.adu-card')];
  const alreadyIdx = compareItems.findIndex(i => i.name === a.name);
  if (alreadyIdx !== -1) {
    // deselect
    compareItems.splice(alreadyIdx, 1);
    card.classList.remove('selected-compare');
    card.querySelector('.compare-badge')?.remove();
  } else if (compareItems.length < 2) {
    compareItems.push({ adu: a, card });
    card.classList.add('selected-compare');
    const badge = document.createElement('span');
    badge.className = 'compare-badge';
    badge.textContent = compareItems.length === 1 ? 'A' : 'B';
    card.appendChild(badge);
  }

  if (compareItems.length === 2) {
    if (compareSection) compareSection.classList.add('active');
    // Slot A
    const slotA = document.getElementById('compareModel1');
    const titleA = document.getElementById('compareTitle1');
    if (slotA && titleA) {
      titleA.textContent = compareItems[0].adu.name;
      const mA = compareItems[0].adu.model;
      slotA.src = typeof mA === 'object' ? mA.marble : mA;
      slotA.alt = `3D model of ${compareItems[0].adu.name}`;
    }
    // Slot B
    const slotB = document.getElementById('compareModel2');
    const titleB = document.getElementById('compareTitle2');
    if (slotB && titleB) {
      titleB.textContent = compareItems[1].adu.name;
      const mB = compareItems[1].adu.model;
      slotB.src = typeof mB === 'object' ? mB.marble : mB;
      slotB.alt = `3D model of ${compareItems[1].adu.name}`;
    }
    compareSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    if (compareSection) compareSection.classList.remove('active');
  }

  // Also open main viewer on single click
  if (compareItems.length <= 1) showADU(a);
}

if (clearCompareBtn) {
  clearCompareBtn.addEventListener('click', () => {
    compareItems.length = 0;
    aduGrid.querySelectorAll('.adu-card').forEach(c => {
      c.classList.remove('selected-compare');
      c.querySelector('.compare-badge')?.remove();
    });
    if (compareSection) compareSection.classList.remove('active');
  });
}

function showADU(a) {
  aduViewer.hidden = false;
  aduTitle.textContent = a.name;
  aduDesc.textContent = a.desc;

  const materialUI = document.querySelector('.material-select');

  // Check if this ADU has multiple materials
  const hasMaterials = typeof a.model === "object";

  // Show or hide material selector
  materialUI.style.display = hasMaterials ? "flex" : "none";

  // Determine selected material
  let selectedMaterial = "marble";
  const materialRadio = document.querySelector('input[name="material"]:checked');
  if (materialRadio) selectedMaterial = materialRadio.value;

  // Load model
  if (hasMaterials) {
    aduModel.src = a.model[selectedMaterial];
  } else {
    aduModel.src = a.model; // single GLB
  }

  // Update on material change
  document.querySelectorAll('input[name="material"]').forEach(radio => {
    radio.onchange = (e) => {
      if (hasMaterials) {
        aduModel.src = a.model[e.target.value];
      }
    };
  });

  // Hotspot logic
  clearHotspots();
  addHotspots(a.hotspots || []);

  // Map highlight
  if (window.map && a.mapTag) {
    map.eachLayer(l => {
      if (l.getPopup && l.getPopup().getContent().includes(a.mapTag)) {
        l.openPopup();
      }
    });
  }
}


aduClose?.addEventListener('click', () => {
  aduViewer.hidden = true;
  aduModel.src = '';
});

/* === Hotspots for ADU models (add below your ADU Explorer code) === */
adus[0].hotspots = [
  {label:"Reason 1",      pos:"0 0 1.55", normal:"0 0 -1"},
  {label:"Reason 2",      pos:"-1.6 5 0.9", normal:"1 0 0"}
];
adus[1].hotspots = [
  {label:"Reason 1",      pos:"-1.4 -0.9 0.9", normal:"1 0 0"},
  {label:"Reason 2",      pos:"0 5 0.1", normal:"0 0 1"}
];
adus[2].hotspots = [
  {label:"Reason 1",      pos:"0 -0.1 1.1", normal:"0 0 -1"},
  {label:"Reason 2",      pos:"1.2 5 0.5", normal:"-1 0 0"}
];

function clearHotspots() {
  // remove previous hotspots
  [...aduModel.querySelectorAll('button[slot^="hotspot"]')].forEach(b=>b.remove());
}

function addHotspots(hs=[]) {
  hs.forEach((h, idx) => {
    const btn = document.createElement('button');
    btn.className = 'hotspot';
    btn.setAttribute('slot', `hotspot-${idx}`);
    btn.setAttribute('data-position', h.pos);   // "x y z"
    btn.setAttribute('data-normal', h.normal);  // "nx ny nz"
    btn.textContent = h.label;
    aduModel.appendChild(btn);
  });
}

// augment showADU to render hotspots


/* ==================== House / ADU Wildfire Tester logic ==================== */

const wtRun = document.getElementById('wtRun');
const wtResult = document.getElementById('wtResult');

function computeWildfireRating() {
  if (!wtRun || !wtResult) return;

  const getVal = id => {
    const el = document.getElementById(id);
    const v = el ? parseFloat(el.value) : 0;
    return Number.isFinite(v) ? v : 0;
  };

  const roof       = getVal('wtRoof');
  const walls      = getVal('wtWalls');
  const space      = getVal('wtSpace');
  const vents      = getVal('wtVents');
  const windows    = getVal('wtWindows');
  const water      = getVal('wtWater');
  const exposure   = getVal('wtExposure');
  const sprinklers = getVal('wtSprinklers');

  // Raw score can be slightly negative if exposure is bad; shift to 0–24,
  // then map to 1–10.
  let raw = roof + walls + space + vents + windows + water + exposure + sprinklers;
  let shifted = raw + 2; // move -2..22 range to 0..24
  if (shifted < 0) shifted = 0;
  if (shifted > 24) shifted = 24;

  let rating = Math.round(1 + (shifted * 9) / 24);
  if (rating < 1) rating = 1;
  if (rating > 10) rating = 10;

  let status;
  let advice;

  if (rating <= 3) {
    status = 'Not wildfire-hardened / not approved';
    advice = 'Add a Class A roof, non-combustible siding, an ignition-free 0–5 ft zone, and ember-resistant vents as a starting point.';
  } else if (rating <= 6) {
    status = 'Partially hardened – needs work before approval';
    advice = 'Focus on vents/eaves, windows, and defensible space to reduce ember exposure and radiant heat.';
  } else if (rating <= 8) {
    status = 'Substantially hardened – close to good practice';
    advice = 'Work with your local fire authority or WUI code official to confirm details and address any remaining weak spots.';
  } else {
    status = 'Highly hardened – best-practice features present';
    advice = 'Verify tank sizing, hose connections, and maintenance plans with local fire codes and water providers.';
  }

  wtResult.textContent =
    `Wildfire safety rating: ${rating}/10 – ${status}. ${advice}`;
}

if (wtRun) {
  wtRun.addEventListener('click', computeWildfireRating);
}

// --------- Wildfire Tester Share Link ----------
const wtShare = document.getElementById('wtShare');
if (wtShare) {
  wtShare.addEventListener('click', () => {
    const fields = ['wtRoof','wtWalls','wtSpace','wtVents','wtWindows','wtWater','wtExposure','wtSprinklers'];
    const params = new URLSearchParams();
    fields.forEach(id => {
      const el = document.getElementById(id);
      if (el) params.set(id, el.value);
    });
    const url = location.origin + location.pathname + '?' + params.toString() + '#adu-tester';
    navigator.clipboard.writeText(url).then(() => {
      const toast = document.getElementById('shareToast');
      if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2500); }
    }).catch(() => { prompt('Copy this link:', url); });
  });
}

// Restore wildfire tester values from URL params on load
(function restoreShareParams() {
  const p = new URLSearchParams(location.search);
  ['wtRoof','wtWalls','wtSpace','wtVents','wtWindows','wtWater','wtExposure','wtSprinklers'].forEach(id => {
    const val = p.get(id);
    const el = document.getElementById(id);
    if (val && el) { el.value = val; }
  });
  if ([...p.keys()].some(k => k.startsWith('wt'))) {
    computeWildfireRating();
  }
})();

// Initialize wildfire tool state at load
  clearAll();
})();

/* ==================== House Photo Upload With Size Limit + Styled Warning ==================== */

const photoInput = document.getElementById('housePhotoInput');
const photoPreview = document.getElementById('housePhotoPreview');
const photoWrapper = document.getElementById('photoPreviewWrapper');
const photoError = document.getElementById('photoError');

const MAX_SIZE_MB = 3;  // Set your limit here
const MAX_BYTES = MAX_SIZE_MB * 1024 * 1024;

if (photoInput) {
  photoInput.addEventListener('change', function () {
    const file = photoInput.files[0];
    if (!file) return;

    // Reset previous messages
    photoError.style.display = "none";
    photoError.textContent = "";

    // Check size
    if (file.size > MAX_BYTES) {

      photoError.textContent = `⚠️ Image too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`;
      photoError.style.display = "block";

      // Reset preview
      photoInput.value = "";
      photoWrapper.hidden = true;
      photoPreview.src = "";

      return;
    }

    // Display preview
    const url = URL.createObjectURL(file);
    photoPreview.src = url;
    photoWrapper.hidden = false;
  });
}

/* ==================== Delete House Photo Function ==================== */

const deleteBtn = document.getElementById('deletePhotoBtn');

if (deleteBtn) {
  deleteBtn.addEventListener('click', function () {
    // Clear preview
    photoPreview.src = "";
    photoWrapper.hidden = true;

    // Reset file input
    photoInput.value = "";

    // Hide error message if any
    if (photoError) {
      photoError.style.display = "none";
      photoError.textContent = "";
    }
  });
}

// === SAFETY METER ===
function updateSafetyMeter() {
  const checks = checklist.querySelectorAll('input[type=checkbox]');
  const done = Array.from(checks).filter(c => c.checked).length;
  const percent = Math.round((done / checks.length) * 100);

  const fill = document.getElementById('meterFill');
  const text = document.getElementById('meterText');

  if (fill) fill.style.width = percent + "%";
  if (text) text.textContent = percent + "% complete";
}

document.addEventListener("change", function(e) {
    if (e.target.closest("#checklist")) {
        updateSafetyMeter();
    }
});

const preview = document.getElementById("materialPreview");
const previewImg = preview.querySelector("img");

document.querySelectorAll(".fire-materials-text li").forEach(item => {

  item.addEventListener("mouseenter", () => {
    const img = item.getAttribute("data-img");
    if (!img) return;
    previewImg.src = img;
    // set descriptive alt text from the item text content
    previewImg.alt = `Fire-resistant material: ${item.textContent.trim()}`;
  });

});

// --------- GLB Preload (first ADU model) ----------
if (adus && adus[0]) {
  const firstModel = adus[0].model;
  const firstSrc = typeof firstModel === 'object' ? firstModel.marble : firstModel;
  if (firstSrc) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = firstSrc;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}
// ======== EN/ES Language Toggle ========

const translations = {
  en: {
    "brand-title": "Altadena/Pasadena Wildfire Resilience &amp; Rebuilding Guide",
    "nav-guides": "📖 Go to Guides",
    "nav-tools": "🛠️ Go to Tools",
    "pdf-link": "📄 Download PDF",
    "last-updated": "Last updated: January 2025",
    "toc-overview": "Overview &amp; KPIs",
    "toc-risk": "Risk Assessment",
    "toc-hubs": "Recovery Hubs",
    "toc-water": "Water Resilience",
    "toc-mobility": "Mobility &amp; Evacuation",
    "toc-green": "Green Rebuilding",
    "toc-equity": "Equity &amp; Resources",
    "toc-monitoring": "Monitoring &amp; Data",
    "toc-cesium": "3D Map",
    "toc-tools": "Home-Hardening Checklist",
    "toc-tank": "Tank Sizing Calculator",
    "toc-fire-materials": "Fire-Smart Materials",
    "toc-adu": "ADU Explorer",
    "toc-photo": "Photo Upload",
    "toc-wildfire-tester": "Wildfire Safety Tester",
    "toc-wildfire-events": "Wildfire Events",
    "toc-map": "Recovery Hub Map",
    "hero-badge": "🌿 USGBC-Aligned Resource",
    "hero-h2": "Rebuild Smarter. Recover Together.",
    "kpi-structures": "structures damaged or destroyed",
    "kpi-residents": "residents displaced",
    "kpi-leed": "LEED projects in region",
    "kpi-resilience": "resilience funding available",
    // tools page
    "cesium-h3": "3D Terrain &amp; Structure Viewer",
    "tools-h3": "Home-Hardening Checklist",
    "checklist-h4": "✅ Checklist",
    "risk-snapshot-h4": "📊 Risk Snapshot",
    "safety-meter-h4": "🛡️ Safety Meter",
    "policy-card-h4": "📋 Policy Card",
    "tank-h3": "🪣 Rainwater Tank Sizing Calculator",
    "tank-desc": "Calculate your recommended tank size based on roof area, local rainfall, and fire-flow needs.",
    "tank-label-roof": "Roof Area (sq ft)",
    "tank-label-rain": "Annual Rainfall (in)",
    "tank-label-eff": "Efficiency (%)",
    "tank-label-gpm": "Fire Flow (gpm)",
    "tank-label-minutes": "Duration (min)",
    "tank-label-days": "Domestic Reserve (days)",
    "tank-calc-btn": "Calculate",
    "tank-print-btn": "🖨️ Print",
    "tank-note": "Note: This is an estimate. Consult a licensed civil engineer for final design.",
    "fire-materials-h3": "🔥 Fire-Smart Building Materials",
    "mat-roofing-h4": "Roofing",
    "mat-siding-h4": "Siding",
    "mat-windows-h4": "Windows",
    "mat-doors-h4": "Doors",
    "mat-decking-h4": "Decking",
    "mat-vents-h4": "Vents",
    "mat-insulation-h4": "Insulation",
    "mat-landscape-h4": "Landscaping",
    "adu-h3": "🏠 ADU 3D Model Explorer",
    "adu-desc": "Click a card to view the 3D model. Click two cards to compare side-by-side.",
    "compare-h4": "🔍 Comparison View",
    "compare-desc": "Select two ADU models above to compare them here.",
    "adu-clear-btn": "Clear Comparison",
    "photo-h3": "📷 Site Photo Upload",
    "photo-desc": "Upload photos of your property for documentation and assessment.",
    "photo-label": "Choose Photos",
    "delete-photo-btn": "Delete All",
    "wt-h3": "House / ADU Wildfire Safety Tester",
    "wt-desc": "Answer these quick questions about your house or ADU. You\u2019ll get a <strong>1\u201310 wildfire safety rating</strong> (1 = less safe, 10 = safest) and an informal \u201capproval\u201d style status. This is a heuristic tool only; always confirm with local codes.",
    "wt-label-roof": "Roof rating",
    "wt-label-walls": "Exterior walls",
    "wt-label-space": "Defensible space",
    "wt-label-vents": "Vents &amp; eaves",
    "wt-label-windows": "Windows &amp; openings",
    "wt-label-water": "Onsite water &amp; access",
    "wt-label-exposure": "Adjacent fuels / exposure",
    "wt-label-sprinklers": "Sprinklers / interior systems",
    "wt-run-btn": "Rate my wildfire safety",
    "wt-share-btn": "\uD83D\uDD17 Share Result",
    "wt-note": "This tool gives an <strong>approximate</strong> rating only and does not replace a WUI code review, local fire department inspection, or guidance from a wildfire specialist.",
    "wildfire-events-h3": "Wildfire Events",
    "wildfire-events-desc": "Enter an area and time window. Results will appear below and on the map.",
    "map-h3": "Map: Recovery Hubs &amp; Wildfire Events"
  },
  es: {
    "brand-title": "Guía de Resiliencia y Reconstrucción ante Incendios — Altadena/Pasadena",
    "nav-guides": "📖 Ir a Guías",
    "nav-tools": "🛠️ Ir a Herramientas",
    "pdf-link": "📄 Descargar PDF",
    "last-updated": "Última actualización: Enero 2025",
    "toc-overview": "Resumen y KPIs",
    "toc-risk": "Evaluación de Riesgo",
    "toc-hubs": "Centros de Recuperación",
    "toc-water": "Resiliencia Hídrica",
    "toc-mobility": "Movilidad y Evacuación",
    "toc-green": "Reconstrucción Verde",
    "toc-equity": "Equidad y Recursos",
    "toc-monitoring": "Monitoreo y Datos",
    "toc-cesium": "Mapa 3D",
    "toc-tools": "Lista de Verificación",
    "toc-tank": "Calculadora de Tanques",
    "toc-fire-materials": "Materiales Resistentes al Fuego",
    "toc-adu": "Explorador de ADU",
    "toc-photo": "Subida de Fotos",
    "toc-wildfire-tester": "Prueba de Seguridad ante Incendios",
    "toc-wildfire-events": "Eventos de Incendios",
    "toc-map": "Mapa de Centros de Recuperación",
    "hero-badge": "🌿 Recurso Alineado con USGBC",
    "hero-h2": "Reconstruye con Inteligencia. Recupérate Juntos.",
    "kpi-structures": "estructuras dañadas o destruidas",
    "kpi-residents": "residentes desplazados",
    "kpi-leed": "proyectos LEED en la región",
    "kpi-resilience": "fondos de resiliencia disponibles",
    // tools page
    "cesium-h3": "Visor de Terreno y Estructuras 3D",
    "tools-h3": "Lista de Verificación del Hogar",
    "checklist-h4": "✅ Lista de Verificación",
    "risk-snapshot-h4": "📊 Resumen de Riesgo",
    "safety-meter-h4": "🛡️ Medidor de Seguridad",
    "policy-card-h4": "📋 Tarjeta de Política",
    "tank-h3": "🪣 Calculadora de Tanque de Agua Pluvial",
    "tank-desc": "Calcule el tamaño recomendado de su tanque según el área del techo, lluvias locales y necesidades de extinción.",
    "tank-label-roof": "Área del Techo (pies²)",
    "tank-label-rain": "Lluvia Anual (pulgadas)",
    "tank-label-eff": "Eficiencia (%)",
    "tank-label-gpm": "Flujo de Extinción (gpm)",
    "tank-label-minutes": "Duración (min)",
    "tank-label-days": "Reserva Doméstica (días)",
    "tank-calc-btn": "Calcular",
    "tank-print-btn": "🖨️ Imprimir",
    "tank-note": "Nota: Esta es una estimación. Consulte a un ingeniero civil certificado para el diseño final.",
    "fire-materials-h3": "🔥 Materiales de Construcción Resistentes al Fuego",
    "mat-roofing-h4": "Techado",
    "mat-siding-h4": "Revestimiento",
    "mat-windows-h4": "Ventanas",
    "mat-doors-h4": "Puertas",
    "mat-decking-h4": "Terrazas",
    "mat-vents-h4": "Ventilaciones",
    "mat-insulation-h4": "Aislamiento",
    "mat-landscape-h4": "Paisajismo",
    "adu-h3": "🏠 Explorador de Modelos 3D de ADU",
    "adu-desc": "Haga clic en una tarjeta para ver el modelo 3D. Haga clic en dos para comparar lado a lado.",
    "compare-h4": "🔍 Vista Comparativa",
    "compare-desc": "Seleccione dos modelos ADU arriba para compararlos aquí.",
    "adu-clear-btn": "Limpiar Comparación",
    "photo-h3": "📷 Subida de Fotos del Sitio",
    "photo-desc": "Suba fotos de su propiedad para documentación y evaluación.",
    "photo-label": "Elegir Fotos",
    "delete-photo-btn": "Eliminar Todo",
    "wt-h3": "Prueba de Seguridad ante Incendios — Casa / ADU",
    "wt-desc": "Responda estas preguntas sobre su casa o ADU. Obtendrá una <strong>calificación de seguridad 1–10</strong> (1 = menos seguro, 10 = más seguro) y un estado de aprobación informal. Esta es solo una herramienta heurística; confirme siempre con los códigos locales.",
    "wt-label-roof": "Clasificación del techo",
    "wt-label-walls": "Paredes exteriores",
    "wt-label-space": "Espacio defensible",
    "wt-label-vents": "Ventilaciones y aleros",
    "wt-label-windows": "Ventanas y aperturas",
    "wt-label-water": "Agua en sitio y acceso",
    "wt-label-exposure": "Combustibles adyacentes / exposición",
    "wt-label-sprinklers": "Rociadores / sistemas interiores",
    "wt-run-btn": "Calificar mi seguridad ante incendios",
    "wt-share-btn": "\uD83D\uDD17 Compartir Resultado",
    "wt-note": "Esta herramienta proporciona una calificación <strong>aproximada</strong> y no reemplaza una revisión del código WUI, inspección del cuerpo de bomberos o la orientación de un especialista en incendios.",
    "wildfire-events-h3": "Eventos de Incendios Forestales",
    "wildfire-events-desc": "Ingrese un área y ventana de tiempo. Los resultados aparecerán abajo y en el mapa.",
    "map-h3": "Mapa: Centros de Recuperación y Eventos de Incendios"
  }
};

// Section headings in index.html that contain embedded 🔊 buttons
// Translated via text-node replacement to avoid destroying child elements
const sectionHeadings = {
  en: {
    "risk":       "⚠️ Risk Assessment",
    "hubs":       "🏥 Recovery Hubs & Resources",
    "water":      "💧 Water Resilience",
    "mobility":   "🚗 Mobility & Evacuation",
    "green":      "🌱 Green Rebuilding Standards",
    "equity":     "⚖️ Equity & Community Resources",
    "monitoring": "📡 Monitoring & Real-Time Data"
  },
  es: {
    "risk":       "⚠️ Evaluación de Riesgo",
    "hubs":       "🏥 Centros de Recuperación y Recursos",
    "water":      "💧 Resiliencia Hídrica",
    "mobility":   "🚗 Movilidad y Evacuación",
    "green":      "🌱 Estándares de Reconstrucción Verde",
    "equity":     "⚖️ Equidad y Recursos Comunitarios",
    "monitoring": "📡 Monitoreo y Datos en Tiempo Real"
  }
};

function updateFirstTextNode(el, text) {
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      node.textContent = text + ' ';
      return;
    }
  }
  // fallback: prepend a text node
  el.insertBefore(document.createTextNode(text + ' '), el.firstChild);
}

function applyLanguage(lang) {
  window._currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;

  const t = translations[lang] || translations.en;

  // Apply data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      el.innerHTML = t[key];
    }
  });

  // Update section headings in index.html (have embedded 🔊 buttons)
  const sh = sectionHeadings[lang] || sectionHeadings.en;
  Object.keys(sh).forEach(id => {
    const section = document.getElementById(id);
    if (!section) return;
    const h3 = section.querySelector('h3');
    if (h3) updateFirstTextNode(h3, sh[id]);
  });

  // Re-render checklist with translated items
  const checklistEl = document.getElementById('checklist');
  if (checklistEl) renderChecklist();

  // Toggle active state on lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  // Update single toggle button label (shows the other language, like a switch)
  const ltBtn = document.getElementById('langToggle');
  if (ltBtn) ltBtn.textContent = lang === 'en' ? 'ES' : 'EN';
}

// Wire single lang toggle button
const langToggleBtn = document.getElementById('langToggle');
if (langToggleBtn) {
  langToggleBtn.addEventListener('click', () => {
    const next = (window._currentLang || 'en') === 'en' ? 'es' : 'en';
    applyLanguage(next);
  });
}

// Apply saved or default language on load
applyLanguage(localStorage.getItem('lang') || 'en');
