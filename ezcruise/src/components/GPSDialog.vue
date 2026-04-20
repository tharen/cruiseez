<template>
  <!-- Trigger Button -->
  <button class="gps-trigger-btn" @click="openModal">
    <span class="btn-icon">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        <circle cx="12" cy="12" r="9" stroke-dasharray="2 4" />
      </svg>
    </span>
    GPS Lock
  </button>

  <!-- Modal Backdrop -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="gps-backdrop" @click.self="handleBackdropClick">
        <div class="gps-modal" role="dialog" aria-modal="true" aria-label="GPS Status">

          <!-- Header -->
          <header class="modal-header">
            <div class="header-left">
              <div class="signal-badge" :class="signalClass">
                <span class="signal-dot" />
                {{ signalLabel }}
              </div>
              <h2 class="modal-title">GPS Averaging</h2>
            </div>
            <button class="close-btn" @click="closeModal" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          <!-- GPS Raw Info Strip -->
          <div class="info-strip">
            <div class="info-item">
              <span class="info-label">LAT</span>
              <span class="info-value mono">{{ formatCoord(currentPosition?.latitude) }}</span>
            </div>
            <div class="info-divider" />
            <div class="info-item">
              <span class="info-label">LON</span>
              <span class="info-value mono">{{ formatCoord(currentPosition?.longitude) }}</span>
            </div>
            <div class="info-divider" />
            <div class="info-item">
              <span class="info-label">ACC</span>
              <span class="info-value mono">{{ currentPosition ? `±${currentPosition.accuracy.toFixed(1)}m` : '—' }}</span>
            </div>
            <div class="info-divider" />
            <div class="info-item">
              <span class="info-label">PTS</span>
              <span class="info-value mono">{{ recentPoints.length }}/30</span>
            </div>
          </div>

          <!-- Canvas Plot -->
          <div class="canvas-wrapper">
            <canvas ref="canvasRef" :width="canvasSize" :height="canvasSize" class="scatter-canvas" />
            <div class="ring-labels">
              <span class="ring-label" style="bottom: 4px; right: 6px">1m</span>
              <span class="ring-label" style="bottom: 4px; right: 6px; opacity: 0">·</span>
            </div>
            <div class="canvas-legend">
              <span class="legend-dot recent" />
              <span class="legend-text">Recent</span>
              <span class="legend-dot old" />
              <span class="legend-text">30s ago</span>
            </div>
          </div>

          <!-- Statistics Section -->
          <div class="stats-section">
            <div class="stats-header">
              <span class="stats-title">Statistics</span>
              <span class="stats-n">N = {{ sliderValue }}</span>
            </div>

            <!-- Slider -->
            <div class="slider-row">
              <span class="slider-label">1</span>
              <input
                type="range"
                class="n-slider"
                v-model.number="sliderValue"
                :min="1"
                :max="Math.max(1, recentPoints.length)"
                step="1"
              />
              <span class="slider-label">{{ Math.max(1, recentPoints.length) }}</span>
            </div>

            <!-- Stats Grid -->
            <div class="stats-grid">
              <div class="stats-col-header" />
              <div class="stats-col-header">Mean</div>
              <div class="stats-col-header">Std Dev</div>
              <div class="stats-col-header">CV%</div>

              <div class="stats-row-label">Latitude</div>
              <div class="stats-value mono">{{ stats.lat.mean }}</div>
              <div class="stats-value mono">{{ stats.lat.std }}</div>
              <div class="stats-value mono cv" :class="cvClass(stats.lat.cvRaw)">{{ stats.lat.cv }}</div>

              <div class="stats-row-label">Longitude</div>
              <div class="stats-value mono">{{ stats.lon.mean }}</div>
              <div class="stats-value mono">{{ stats.lon.std }}</div>
              <div class="stats-value mono cv" :class="cvClass(stats.lon.cvRaw)">{{ stats.lon.cv }}</div>
            </div>
          </div>

          <!-- Estimated Error -->
          <div class="error-section">
            <div class="error-item">
              <span class="error-label">Positional Error (CEP50)</span>
              <span class="error-value mono" :class="errorClass">{{ estimatedError }}</span>
            </div>
            <div class="error-item">
              <span class="error-label">Samples Used</span>
              <span class="error-value mono">{{ Math.min(sliderValue, recentPoints.length) }}</span>
            </div>
          </div>

          <!-- Footer Actions -->
          <footer class="modal-footer">
            <button class="btn-secondary" @click="clearPoints">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.4" />
              </svg>
              Reset
            </button>
            <button class="btn-primary" @click="acceptResult" :disabled="recentPoints.length < 3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Use Averaged Position
            </button>
          </footer>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GpsPoint {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface GpsResult {
  latitude: number
  longitude: number
  accuracy: number        // CEP50 in metres
  sampleCount: number
  stdLat: number
  stdLon: number
}

// ─── Emits ───────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  accept: [result: GpsResult]
}>()

// ─── State ───────────────────────────────────────────────────────────────────

const isOpen = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasSize = 280
const allPoints = ref<GpsPoint[]>([])
const currentPosition = ref<GpsPoint | null>(null)
const sliderValue = ref(10)
const watchId = ref<number | null>(null)
const animationId = ref<number | null>(null)
const lastRender = ref(0)

// ─── Computed ─────────────────────────────────────────────────────────────────

// Only keep points from the last 30 seconds
const recentPoints = computed(() => {
  const cutoff = Date.now() - 30_000
  return allPoints.value.filter(p => p.timestamp >= cutoff)
})

// The N most recent points for stats
const statPoints = computed(() => {
  const pts = recentPoints.value
  const n = Math.min(sliderValue.value, pts.length)
  return pts.slice(-n)
})

// Clamp slider when point count changes
watch(() => recentPoints.value.length, (len) => {
  if (sliderValue.value > len && len > 0) sliderValue.value = len
  if (len === 0) sliderValue.value = 1
})

function computeStats(values: number[]) {
  if (values.length === 0) return { mean: '—', std: '—', cv: '—', cvRaw: null as number | null }
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length
  const std = Math.sqrt(variance)
  const cvRaw = mean !== 0 ? (std / Math.abs(mean)) * 100 : null
  return {
    mean: mean.toFixed(7),
    std: std.toFixed(7),
    cv: cvRaw !== null ? cvRaw.toFixed(3) + '%' : '—',
    cvRaw,
  }
}

const stats = computed(() => {
  const pts = statPoints.value
  return {
    lat: computeStats(pts.map(p => p.latitude)),
    lon: computeStats(pts.map(p => p.longitude)),
  }
})

// CEP50 estimate: RMS of lat/lon standard deviations converted to metres
// 1° lat ≈ 111,320 m; 1° lon ≈ 111,320 * cos(lat) m
const estimatedErrorMeters = computed<number | null>(() => {
  const pts = statPoints.value
  if (pts.length < 2) return null
  const latVals = pts.map(p => p.latitude)
  const lonVals = pts.map(p => p.longitude)
  const meanLat = latVals.reduce((a, b) => a + b, 0) / latVals.length

  const varLat = latVals.reduce((a, b) => a + (b - (latVals.reduce((x,y)=>x+y,0)/latVals.length))**2, 0) / latVals.length
  const varLon = lonVals.reduce((a, b) => a + (b - (lonVals.reduce((x,y)=>x+y,0)/lonVals.length))**2, 0) / lonVals.length

  const mPerDegLat = 111_320
  const mPerDegLon = 111_320 * Math.cos((meanLat * Math.PI) / 180)

  const stdLatM = Math.sqrt(varLat) * mPerDegLat
  const stdLonM = Math.sqrt(varLon) * mPerDegLon

  // CEP50 ≈ 0.59 * (σ_lat + σ_lon) for circular normal
  return 0.59 * (stdLatM + stdLonM)
})

const estimatedError = computed(() => {
  const e = estimatedErrorMeters.value
  if (e === null) return '—'
  if (e < 1) return `${(e * 100).toFixed(1)} cm`
  return `${e.toFixed(2)} m`
})

const errorClass = computed(() => {
  const e = estimatedErrorMeters.value
  if (e === null) return ''
  if (e < 1) return 'error-good'
  if (e < 5) return 'error-ok'
  return 'error-bad'
})

const signalClass = computed(() => {
  if (!currentPosition.value) return 'signal-none'
  const acc = currentPosition.value.accuracy
  if (acc <= 5) return 'signal-good'
  if (acc <= 15) return 'signal-ok'
  return 'signal-bad'
})

const signalLabel = computed(() => {
  if (!currentPosition.value) return 'NO FIX'
  const acc = currentPosition.value.accuracy
  if (acc <= 5) return 'STRONG'
  if (acc <= 15) return 'FAIR'
  return 'WEAK'
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCoord(val?: number) {
  if (val === undefined || val === null) return '—'
  return val.toFixed(6)
}

function cvClass(cvRaw: number | null) {
  if (cvRaw === null) return ''
  if (cvRaw < 0.001) return 'cv-good'
  if (cvRaw < 0.01) return 'cv-ok'
  return 'cv-bad'
}

// ─── Geolocation ─────────────────────────────────────────────────────────────

function startWatching() {
  if (!navigator.geolocation) return
  watchId.value = navigator.geolocation.watchPosition(
    (pos) => {
      const pt: GpsPoint = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: Date.now(),
      }
      currentPosition.value = pt
      allPoints.value.push(pt)
      // Prune anything older than 35s
      const cutoff = Date.now() - 35_000
      allPoints.value = allPoints.value.filter(p => p.timestamp >= cutoff)
    },
    (err) => console.warn('GPS error:', err),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 }
  )
}

function stopWatching() {
  if (watchId.value !== null) {
    navigator.geolocation.clearWatch(watchId.value)
    watchId.value = null
  }
}

// ─── Canvas Rendering ─────────────────────────────────────────────────────────

const RING_RADII_M = [1, 5, 10, 15, 20, 30, 40]
const RING_FILLS = [
    'rgba(0,64,204,0.04)',
    'rgba(0,64,204,0.03)',
    'rgba(0,64,204,0.03)',
    'rgba(0,64,204,0.02)',
    'rgba(0,64,204,0.02)',
    'rgba(0,64,204,0.01)',
    'rgba(0,64,204,0.01)'
]

// Smooth animated scale — interpolated every frame rather than snapping
const currentScale = ref(0)  // px per metre, animated

/**
 * Pick the viewport radius in metres based on the device accuracy value.
 * The outermost visible ring should comfortably contain the accuracy circle,
 * so we pick the smallest ring level whose radius is >= accuracy, then add
 * one level of headroom so the accuracy arc isn't right at the edge.
 */
function targetViewRadiusM(accuracyM: number): number {
  // Find the first ring level that is at least as large as the accuracy radius
  for (let i = 0; i < RING_RADII_M.length; i++) {
    if (RING_RADII_M[i] >= accuracyM) {
      // Return one level up for headroom, or this level if already at max
      return RING_RADII_M[Math.min(i, RING_RADII_M.length - 1)]
    }
  }
  // Accuracy exceeds all ring levels — add 40 % headroom beyond accuracy
  return accuracyM * 1.4
}

function drawCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const W = canvasSize
  const cx = W / 2
  const cy = W / 2
  const padding = 28

  ctx.clearRect(0, 0, W, W)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, W)

  const pts = recentPoints.value
  const acc = currentPosition.value?.accuracy ?? null

  // ── Determine target scale ────────────────────────────────────────────────
  let targetViewRadius: number
  if (acc !== null) {
    // Primary driver: device-reported accuracy
    targetViewRadius = targetViewRadiusM(acc)
  } else if (pts.length >= 2) {
    // Fallback: fit the spread of collected points
    const latVals = pts.map(p => p.latitude)
    const lonVals = pts.map(p => p.longitude)
    const mLat = latVals.reduce((a, b) => a + b, 0) / latVals.length
    const mLon = lonVals.reduce((a, b) => a + b, 0) / lonVals.length
    const mPerDegLat = 111_320
    const mPerDegLon = 111_320 * Math.cos((mLat * Math.PI) / 180)
    const maxSpread = Math.max(...pts.map(p =>
      Math.sqrt(((p.longitude - mLon) * mPerDegLon) ** 2 + ((p.latitude - mLat) * mPerDegLat) ** 2)
    ))
    targetViewRadius = targetViewRadiusM(maxSpread)
  } else {
    // No data yet — show outermost ring
    targetViewRadius = RING_RADII_M[RING_RADII_M.length - 1]
  }

  const targetScale = (W / 2 - padding) / targetViewRadius  // px per metre

  // ── Smooth zoom via exponential lerp ─────────────────────────────────────
  if (currentScale.value === 0) {
    currentScale.value = targetScale  // instant on first draw
  } else {
    // ~5 % approach per frame at 1 fps tick; feels deliberate but not laggy
    currentScale.value += (targetScale - currentScale.value) * 0.12
    // Snap when close enough to avoid endless drift
    if (Math.abs(currentScale.value - targetScale) < 0.001) {
      currentScale.value = targetScale
    }
  }
  const scale = currentScale.value

  // ── Compute origin (mean of all recent points) ────────────────────────────
  let meanLat = 0, meanLon = 0, mPerDegLat = 111_320, mPerDegLon = 111_320
  let localPts: { x: number; y: number }[] = []

  if (pts.length >= 1) {
    const latVals = pts.map(p => p.latitude)
    const lonVals = pts.map(p => p.longitude)
    meanLat = latVals.reduce((a, b) => a + b, 0) / latVals.length
    meanLon = lonVals.reduce((a, b) => a + b, 0) / lonVals.length
    mPerDegLon = 111_320 * Math.cos((meanLat * Math.PI) / 180)
    localPts = pts.map(p => ({
      x: (p.longitude - meanLon) * mPerDegLon,
      y: (p.latitude - meanLat) * mPerDegLat,
    }))
  }

  // ── Draw concentric rings (outermost first so inner ones paint over) ──────
  const now = Date.now()
  ;[...RING_RADII_M].reverse().forEach((r, ri) => {
    const i = RING_RADII_M.length - 1 - ri
    const rpx = r * scale
    ctx.beginPath()
    ctx.arc(cx, cy, rpx, 0, Math.PI * 2)
    ctx.fillStyle = RING_FILLS[i]
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,64,204,0.25)'
    ctx.lineWidth = 1
    ctx.stroke()
    // Label — only if it fits inside the canvas
    if (rpx + 18 < W / 2) {
      ctx.fillStyle = 'rgba(0,40,140,0.55)'
      ctx.font = 'bold 9px "IBM Plex Mono", monospace'
      ctx.fillText(`${r}m`, cx + rpx + 2, cy - 3)
    }
  })

  // ── Accuracy circle (device-reported) ────────────────────────────────────
  if (acc !== null) {
    const accPx = acc * scale
    ctx.beginPath()
    ctx.arc(cx, cy, accPx, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(180,0,0,0.55)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.setLineDash([])
    // Label
    if (accPx + 24 < W / 2) {
      ctx.fillStyle = 'rgba(160,0,0,0.7)'
      ctx.font = 'bold 9px "IBM Plex Mono", monospace'
      ctx.fillText(`±${acc.toFixed(1)}m`, cx + accPx + 3, cy + 10)
    }
  }

  // ── Crosshair ─────────────────────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 0.75
  ctx.setLineDash([3, 4])
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, W); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
  ctx.setLineDash([])

  if (pts.length === 0) {
    drawNoDataOverlay(ctx, W)
    return
  }

  // ── Plot points ───────────────────────────────────────────────────────────
  const maxAge = 30_000
  localPts.forEach((p, i) => {
    const age = now - pts[i].timestamp
    const ageFraction = age / maxAge
    const alpha = Math.max(0.1, 1 - ageFraction * 0.90)
    const isNewest = i === localPts.length - 1

    const px = cx + p.x * scale
    const py = cy - p.y * scale

    if (isNewest) {
      ctx.beginPath()
      ctx.arc(px, py, 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,64,204,0.25)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(px, py, 5, 0, Math.PI * 2)
      ctx.fillStyle = '#0040cc'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,64,204,${alpha})`
      ctx.fill()
    }
  })

  // ── Mean crosshair ────────────────────────────────────────────────────────
  if (localPts.length >= 2) {
    const meanX = localPts.reduce((a, b) => a + b.x, 0) / localPts.length
    const meanY = localPts.reduce((a, b) => a + b.y, 0) / localPts.length
    const mpx = cx + meanX * scale
    const mpy = cy - meanY * scale

    ctx.strokeStyle = '#c05000'
    ctx.lineWidth = 1.5
    const s = 7
    ctx.beginPath(); ctx.moveTo(mpx - s, mpy); ctx.lineTo(mpx + s, mpy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(mpx, mpy - s); ctx.lineTo(mpx, mpy + s); ctx.stroke()
  }
}

function drawNoDataOverlay(ctx: CanvasRenderingContext2D, W: number) {
  ctx.fillStyle = 'rgba(0,40,140,0.45)'
  ctx.font = 'bold 11px "IBM Plex Mono", monospace'
  ctx.textAlign = 'center'
  ctx.fillText('Acquiring signal…', W / 2, W / 2 + 4)
  ctx.textAlign = 'left'
}

// ─── Animation Loop ───────────────────────────────────────────────────────────

function startRenderLoop() {
  const loop = (ts: number) => {
    // Redraw every frame so the zoom lerp is smooth.
    // GPS data itself only arrives at ~1 Hz from watchPosition.
    drawCanvas()
    lastRender.value = ts
    animationId.value = requestAnimationFrame(loop)
  }
  animationId.value = requestAnimationFrame(loop)
}

function stopRenderLoop() {
  if (animationId.value !== null) {
    cancelAnimationFrame(animationId.value)
    animationId.value = null
  }
}

// ─── Modal Controls ───────────────────────────────────────────────────────────

function openModal() {
  isOpen.value = true
  nextTick(() => {
    drawCanvas()
    startWatching()
    startRenderLoop()
  })
}

function closeModal() {
  isOpen.value = false
  stopRenderLoop()
  stopWatching()
}

function handleBackdropClick() {
  closeModal()
}

function clearPoints() {
  allPoints.value = []
  currentPosition.value = null
  currentScale.value = 0
  drawCanvas()
}

function acceptResult() {
  const pts = statPoints.value
  if (pts.length < 3) return

  const meanLat = pts.reduce((a, b) => a + b.latitude, 0) / pts.length
  const meanLon = pts.reduce((a, b) => a + b.longitude, 0) / pts.length

  const varLat = pts.reduce((a, b) => a + (b.latitude - meanLat) ** 2, 0) / pts.length
  const varLon = pts.reduce((a, b) => a + (b.longitude - meanLon) ** 2, 0) / pts.length

  const mPerDegLat = 111_320
  const mPerDegLon = 111_320 * Math.cos((meanLat * Math.PI) / 180)

  const stdLatM = Math.sqrt(varLat) * mPerDegLat
  const stdLonM = Math.sqrt(varLon) * mPerDegLon
  const cep50 = 0.59 * (stdLatM + stdLonM)

  const result: GpsResult = {
    latitude: meanLat,
    longitude: meanLon,
    accuracy: cep50,
    sampleCount: pts.length,
    stdLat: Math.sqrt(varLat),
    stdLon: Math.sqrt(varLon),
  }

  emit('accept', result)
  closeModal()
}

// ─── Lifecycle ───────────────────────────────────────────────────────────────

onUnmounted(() => {
  stopRenderLoop()
  stopWatching()
})
</script>

<style scoped>
/* ─── Fonts ──────────────────────────────────────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600&display=swap');

/* ─── Variables ──────────────────────────────────────────────────────────── */
:root {
  --gps-bg: #ffffff;
  --gps-surface: #ffffff;
  --gps-border: #d0d5dd;
  --gps-border-light: #e8ebf0;
  --gps-accent: #0040cc;
  --gps-accent-hover: #0033a8;
  --gps-text: #0a0a0a;
  --gps-muted: #4a5568;
  --gps-good: #006b3c;
  --gps-good-bg: #e6f4ed;
  --gps-ok: #7a4d00;
  --gps-ok-bg: #fef3cd;
  --gps-bad: #9b1c2e;
  --gps-bad-bg: #720c1b;
  --gps-row-alt: #f7f8fa;
  --gps-radius: 18px;
}

/* ─── Trigger Button ─────────────────────────────────────────────────────── */
.gps-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 18px;
  background: #ffffff;
  border: 1.5px solid #0040cc;
  border-radius: 10px;
  color: #0040cc;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: all 0.2s;
}
.gps-trigger-btn:hover {
  background: #f0f4ff;
  border-color: #0033a8;
  color: #0033a8;
}
.btn-icon { display: flex; align-items: center; }

/* ─── Backdrop ───────────────────────────────────────────────────────────── */
.gps-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
.gps-modal {
  width: 100%;
  max-width: 420px;
  max-height: 96dvh;
  overflow-y: auto;
  background: #ffffff;
  border: 1.5px solid var(--gps-border);
  border-bottom: none;
  border-radius: var(--gps-radius) var(--gps-radius) 0 0;
  font-family: 'Space Grotesk', sans-serif;
  color: var(--gps-text);
  overscroll-behavior: contain;
  box-shadow: 0 -4px 32px rgba(0,0,0,0.12);
}
.gps-modal::-webkit-scrollbar { width: 4px; }
.gps-modal::-webkit-scrollbar-thumb { background: var(--gps-border); border-radius: 2px; }

/* ─── Header ─────────────────────────────────────────────────────────────── */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px 12px;
  border-bottom: 1.5px solid var(--gps-border);
  background: #f7f8fa;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.modal-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #0a0a0a;
  margin: 0;
}
.signal-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 600;
  letter-spacing: 0.1em;
  padding: 3px 9px;
  border-radius: 20px;
  border: 1.5px solid;
}
.signal-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.signal-good { color: var(--gps-good); border-color: #006b3c; background: var(--gps-good-bg); }
.signal-good .signal-dot { background: var(--gps-good); }
.signal-ok { color: var(--gps-ok); border-color: #7a4d00; background: var(--gps-ok-bg); }
.signal-ok .signal-dot { background: var(--gps-ok); }
.signal-bad { color: var(--gps-bad); border-color: #9b1c2e; background: var(--gps-bad-bg); }
.signal-bad .signal-dot { background: var(--gps-bad); }
.signal-none { color: #4a5568; border-color: #a0aec0; background: #f0f2f5; }
.signal-none .signal-dot { background: #a0aec0; animation: none; }

.close-btn {
  background: #fff;
  border: 1.5px solid var(--gps-border);
  border-radius: 8px;
  color: #4a5568;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}
.close-btn:hover { color: #0a0a0a; border-color: #0040cc; background: #f0f4ff; }

/* ─── Info Strip ─────────────────────────────────────────────────────────── */
.info-strip {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  background: #f7f8fa;
  border-bottom: 1.5px solid var(--gps-border);
}
.info-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.info-label {
  font-size: 9px;
  font-family: 'IBM Plex Mono', monospace;
  letter-spacing: 0.12em;
  color: #4a5568;
  text-transform: uppercase;
  font-weight: 600;
}
.info-value { font-size: 12px; font-weight: 600; color: #0a0a0a; }
.info-divider { width: 1.5px; height: 28px; background: var(--gps-border); }
.mono { font-family: 'IBM Plex Mono', monospace; }

/* ─── Canvas ─────────────────────────────────────────────────────────────── */
.canvas-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 18px 8px;
  background: #ffffff;
  border-bottom: 1.5px solid var(--gps-border);
}
.scatter-canvas {
  border-radius: 10px;
  border: 1.5px solid var(--gps-border);
  display: block;
  width: 280px;
  height: 280px;
}
.canvas-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 11px;
  color: #4a5568;
  font-family: 'IBM Plex Mono', monospace;
}
.legend-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
}
.legend-dot.recent { background: #0040cc; }
.legend-dot.old { background: #b0c4f0; border: 1px solid #8aaae8; }
.legend-text { margin-right: 8px; }
.ring-labels { display: none; }

/* ─── Stats ──────────────────────────────────────────────────────────────── */
.stats-section {
  padding: 14px 18px;
  border-bottom: 1.5px solid var(--gps-border);
}
.stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.stats-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #4a5568;
}
.stats-n {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  color: #0040cc;
  background: #e8eeff;
  padding: 2px 9px;
  border-radius: 12px;
  border: 1.5px solid #0040cc;
}
.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.slider-label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #4a5568;
  min-width: 16px;
  text-align: center;
}
.n-slider {
  flex: 1;
  -webkit-appearance: none;
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(to right, #0040cc, #c8d6f8);
  outline: none;
}
.n-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #0040cc;
  cursor: pointer;
  border: 3px solid #ffffff;
  box-shadow: 0 0 0 1.5px #0040cc, 0 2px 6px rgba(0,0,0,0.2);
}
.stats-grid {
  display: grid;
  grid-template-columns: 72px 1fr 1fr 72px;
  gap: 1.5px;
  background: var(--gps-border);
  border: 1.5px solid var(--gps-border);
  border-radius: 8px;
  overflow: hidden;
  font-size: 11px;
}
.stats-col-header, .stats-row-label, .stats-value {
  padding: 7px 8px;
  background: #ffffff;
}
.stats-col-header {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #4a5568;
  text-align: center;
  background: #f7f8fa;
}
.stats-row-label {
  font-size: 11px;
  font-weight: 600;
  color: #0a0a0a;
  display: flex;
  align-items: center;
  background: #f7f8fa;
}
.stats-value {
  font-size: 10.5px;
  text-align: center;
  color: #0a0a0a;
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-all;
}
.cv-good { color: var(--gps-good) !important; font-weight: 700 !important; background: var(--gps-good-bg) !important; }
.cv-ok   { color: var(--gps-ok)   !important; font-weight: 700 !important; background: var(--gps-ok-bg)   !important; }
.cv-bad  { color: var(--gps-bad)  !important; font-weight: 700 !important; background: var(--gps-bad-bg)  !important; }

/* ─── Error Section ──────────────────────────────────────────────────────── */
.error-section {
  padding: 12px 18px;
  border-bottom: 1.5px solid var(--gps-border);
  display: flex;
  gap: 0;
  background: #f7f8fa;
}
.error-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.error-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4a5568;
}
.error-value {
  font-size: 18px;
  font-weight: 700;
  color: #0a0a0a;
}
.error-good { color: var(--gps-good) !important; }
.error-ok   { color: var(--gps-ok)   !important; }
.error-bad  { color: var(--gps-bad)  !important; }

/* ─── Footer ─────────────────────────────────────────────────────────────── */
.modal-footer {
  display: flex;
  gap: 10px;
  padding: 14px 18px;
  padding-bottom: max(14px, env(safe-area-inset-bottom));
  background: #ffffff;
}
.btn-secondary, .btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 16px;
  border-radius: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  flex: 1;
}
.btn-secondary {
  background: #ffffff;
  border: 1.5px solid var(--gps-border);
  color: #0a0a0a;
}
.btn-secondary:hover { border-color: #0040cc; color: #0040cc; background: #f0f4ff; }
.btn-primary {
  background: #0040cc;
  border: none;
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(0,64,204,0.25);
}
.btn-primary:hover:not(:disabled) { background: #0033a8; }
.btn-primary:disabled { opacity: 0.35; cursor: not-allowed; box-shadow: none; }

/* ─── Transition ─────────────────────────────────────────────────────────── */
.modal-fade-enter-active {
  transition: opacity 0.25s ease;
}
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .gps-modal {
  animation: slide-up 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.modal-fade-leave-active .gps-modal {
  animation: slide-down 0.2s ease forwards;
}
@keyframes slide-up {
  from { transform: translateY(40px); }
  to { transform: translateY(0); }
}
@keyframes slide-down {
  from { transform: translateY(0); }
  to { transform: translateY(60px); }
}
</style>