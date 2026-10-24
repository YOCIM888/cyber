<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getStockChange } from '../game/engine'
import { formatPercent, formatPrice } from '../game/format'

const props = defineProps({
  stock: { type: Object, required: true },
  trades: { type: Array, default: () => [] },
  prehistoryLength: { type: Number, default: 10 },
  accent: { type: String, default: '#58f7ff' },
})

const wrapper = ref(null)
const width = ref(760)
const height = ref(292)
const hoverLocal = ref(null)
let resizeObserver = null

const gradientId = `chart-fill-${Math.random().toString(36).slice(2, 9)}`
const blurId = `chart-glow-${Math.random().toString(36).slice(2, 9)}`

const maxPoints = computed(() => {
  const basedOnWidth = Math.floor(width.value / 33)
  return Math.min(30, Math.max(12, basedOnWidth))
})

const visible = computed(() => {
  const history = props.stock.history || []
  const count = Math.min(maxPoints.value, history.length)
  const start = history.length - count
  return history.slice(start).map((price, index) => ({
    price,
    index: start + index,
  }))
})

const padding = computed(() => ({
  left: width.value < 440 ? 7 : 11,
  right: width.value < 440 ? 44 : 56,
  top: 18,
  bottom: 27,
}))

const plotWidth = computed(() => Math.max(1, width.value - padding.value.left - padding.value.right))
const plotHeight = computed(() => Math.max(1, height.value - padding.value.top - padding.value.bottom))

const bounds = computed(() => {
  const values = visible.value.map((point) => point.price)
  if (!values.length) return { min: 0, max: 1, range: 1 }
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const naturalRange = rawMax - rawMin
  const range = naturalRange || Math.max(1, rawMax * 0.025)
  return {
    min: rawMin - range * 0.16,
    max: rawMax + range * 0.16,
    range: range * 1.32,
  }
})

const geometry = computed(() => {
  const points = visible.value.map((point, localIndex) => {
    const x =
      padding.value.left +
      (visible.value.length <= 1
        ? 0
        : (localIndex / (visible.value.length - 1)) * plotWidth.value)
    const y =
      padding.value.top +
      (1 - (point.price - bounds.value.min) / bounds.value.range) * plotHeight.value
    return { x, y, price: point.price, index: point.index }
  })

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')

  const baseline = padding.value.top + plotHeight.value
  const area = points.length
    ? `${line} L ${points[points.length - 1].x.toFixed(2)} ${baseline.toFixed(2)} L ${points[0].x.toFixed(2)} ${baseline.toFixed(2)} Z`
    : ''

  return { points, line, area, baseline }
})

const currentPoint = computed(() => geometry.value.points[geometry.value.points.length - 1] || null)
const chartChange = computed(() => getStockChange(props.stock))
const currentPriceY = computed(() => currentPoint.value?.y ?? padding.value.top)

const yTicks = computed(() => {
  const count = 3
  return Array.from({ length: count + 1 }, (_, index) => {
    const ratio = index / count
    return {
      y: padding.value.top + ratio * plotHeight.value,
      value: bounds.value.max - ratio * bounds.value.range,
    }
  })
})

const xTicks = computed(() => {
  const count = visible.value.length
  if (!count) return []
  const wanted = width.value < 420 ? 3 : 5
  const indexes = new Set()
  for (let index = 0; index < wanted; index += 1) {
    indexes.add(Math.round((index / (wanted - 1)) * (count - 1)))
  }
  return [...indexes].sort((a, b) => a - b).map((localIndex) => {
    const point = visible.value[localIndex]
    return {
      x: geometry.value.points[localIndex]?.x || 0,
      localIndex,
      label: pointLabel(point.index),
    }
  })
})

const markers = computed(() => {
  const indexMap = new Map(geometry.value.points.map((point, localIndex) => [point.index, localIndex]))
  return props.trades
    .filter((trade) => trade.stockId === props.stock.id)
    .map((trade) => {
      const localIndex = indexMap.get(trade.historyIndex)
      if (localIndex === undefined) return null
      const point = geometry.value.points[localIndex]
      const rawY =
        padding.value.top +
        (1 - (trade.price - bounds.value.min) / bounds.value.range) * plotHeight.value
      const y = Math.max(padding.value.top + 10, Math.min(padding.value.top + plotHeight.value - 10, rawY))
      return {
        ...trade,
        markerX: point.x,
        markerY: y,
      }
    })
    .filter(Boolean)
})

const hover = computed(() => {
  if (hoverLocal.value === null) return null
  const point = visible.value[hoverLocal.value]
  const geometryPoint = geometry.value.points[hoverLocal.value]
  if (!point || !geometryPoint) return null
  const previous = visible.value[hoverLocal.value - 1]
  const change = previous ? point.price / previous.price - 1 : 0
  return {
    ...geometryPoint,
    dayLabel: pointLabel(point.index),
    change,
    tooltipLeft: Math.max(8, Math.min(width.value - 138, geometryPoint.x + 12)),
    tooltipTop: Math.max(8, Math.min(height.value - 82, geometryPoint.y - 66)),
  }
})

function pointLabel(index) {
  const tradingDay = index - (props.prehistoryLength - 1) + 1
  if (tradingDay >= 1) return `D${tradingDay}`
  return `T${index - (props.prehistoryLength - 1)}`
}

function onPointerMove(event) {
  if (!geometry.value.points.length) return
  const rect = wrapper.value?.getBoundingClientRect()
  if (!rect) return
  const localX = event.clientX - rect.left
  const ratio = Math.max(
    0,
    Math.min(1, (localX - padding.value.left) / Math.max(1, plotWidth.value)),
  )
  hoverLocal.value = Math.round(ratio * (visible.value.length - 1))
}

function clearHover() {
  hoverLocal.value = null
}

function measure() {
  if (!wrapper.value) return
  const rect = wrapper.value.getBoundingClientRect()
  width.value = Math.max(280, Math.round(rect.width))
  height.value = Math.max(200, Math.round(rect.height))
}

onMounted(() => {
  measure()
  resizeObserver = new ResizeObserver(measure)
  if (wrapper.value) resizeObserver.observe(wrapper.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div
    ref="wrapper"
    class="chart-canvas"
    role="img"
    :aria-label="`${stock.name}价格走势，当前 ${formatPrice(stock.price)}，今日 ${formatPercent(chartChange)}`"
    @pointermove="onPointerMove"
    @pointerleave="clearHover"
  >
    <svg
      v-if="visible.length"
      class="price-chart"
      :viewBox="`0 0 ${width} ${height}`"
      :width="width"
      :height="height"
      aria-hidden="true"
    >
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="accent" stop-opacity="0.23" />
          <stop offset="54%" :stop-color="accent" stop-opacity="0.07" />
          <stop offset="100%" :stop-color="accent" stop-opacity="0" />
        </linearGradient>
        <filter :id="blurId" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      <g class="chart-grid">
        <g v-for="tick in yTicks" :key="`y-${tick.y}`">
          <line
            :x1="padding.left"
            :x2="width - padding.right + 5"
            :y1="tick.y"
            :y2="tick.y"
            stroke="rgba(113, 180, 208, 0.12)"
            stroke-width="1"
            :stroke-dasharray="tick.y === padding.top ? '0' : '2 6'"
          />
          <text
            :x="width - 5"
            :y="tick.y + 3"
            text-anchor="end"
            class="axis-label axis-price"
          >
            {{ tick.value.toFixed(2) }}
          </text>
        </g>
      </g>

      <g class="x-axis">
        <text
          v-for="tick in xTicks"
          :key="`x-${tick.localIndex}`"
          :x="tick.x"
          :y="height - 7"
          :text-anchor="tick.localIndex === 0 ? 'start' : tick.localIndex === visible.length - 1 ? 'end' : 'middle'"
          class="axis-label"
        >
          {{ tick.label }}
        </text>
      </g>

      <line
        :x1="padding.left"
        :x2="width - padding.right"
        :y1="currentPriceY"
        :y2="currentPriceY"
        :stroke="accent"
        stroke-width="1"
        stroke-opacity="0.26"
        stroke-dasharray="3 6"
      />

      <path
        :d="geometry.area"
        :fill="`url(#${gradientId})`"
      />
      <path
        :d="geometry.line"
        fill="none"
        :stroke="accent"
        :stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        :filter="`url(#${blurId})`"
        stroke-opacity="0.28"
      />
      <path
        :d="geometry.line"
        fill="none"
        :stroke="accent"
        :stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      />

      <g v-if="currentPoint" class="current-point">
        <circle
          :cx="currentPoint.x"
          :cy="currentPoint.y"
          r="7"
          :fill="accent"
          opacity="0.12"
        />
        <circle :cx="currentPoint.x" :cy="currentPoint.y" r="2.5" :fill="accent" />
        <circle
          :cx="currentPoint.x"
          :cy="currentPoint.y"
          r="4.5"
          fill="none"
          :stroke="accent"
          stroke-width="1"
          opacity="0.35"
        />
      </g>

      <g class="trade-markers">
        <g v-for="marker in markers" :key="marker.id">
          <line
            :x1="marker.markerX"
            :x2="marker.markerX"
            :y1="marker.markerY - (marker.side === 'buy' ? 6 : -6)"
            :y2="marker.markerY"
            :stroke="marker.side === 'buy' ? '#54ffb2' : '#ff3f91'"
            stroke-width="1"
            opacity="0.65"
          />
          <circle
            :cx="marker.markerX"
            :cy="marker.markerY"
            r="3"
            :fill="marker.side === 'buy' ? '#54ffb2' : '#ff3f91'"
          />
          <path
            v-if="marker.side === 'buy'"
            :d="`M ${marker.markerX} ${marker.markerY - 11} L ${marker.markerX - 3} ${marker.markerY - 6} L ${marker.markerX + 3} ${marker.markerY - 6} Z`"
            fill="#54ffb2"
            opacity="0.9"
          />
          <path
            v-else
            :d="`M ${marker.markerX} ${marker.markerY + 11} L ${marker.markerX - 3} ${marker.markerY + 6} L ${marker.markerX + 3} ${marker.markerY + 6} Z`"
            fill="#ff3f91"
            opacity="0.9"
          />
        </g>
      </g>

      <g v-if="hover" class="chart-hover">
        <line
          :x1="hover.x"
          :x2="hover.x"
          :y1="padding.top"
          :y2="padding.top + plotHeight"
          stroke="rgba(174, 236, 255, 0.28)"
          stroke-width="1"
          stroke-dasharray="2 4"
        />
        <line
          :x1="padding.left"
          :x2="width - padding.right"
          :y1="hover.y"
          :y2="hover.y"
          stroke="rgba(174, 236, 255, 0.1)"
          stroke-width="1"
        />
        <circle :cx="hover.x" :cy="hover.y" r="3.5" fill="#e8fbff" />
        <circle :cx="hover.x" :cy="hover.y" r="8" fill="none" stroke="#e8fbff" stroke-opacity="0.25" />
      </g>
    </svg>

    <div
      v-if="hover"
      class="chart-tooltip"
      :style="{ left: `${hover.tooltipLeft}px`, top: `${hover.tooltipTop}px` }"
    >
      <span class="tooltip-day mono">{{ hover.dayLabel }}</span>
      <strong class="num">₱{{ formatPrice(hover.price) }}</strong>
      <span class="tooltip-change num" :class="hover.change >= 0 ? 'up' : 'down'">
        {{ formatPercent(hover.change) }}
      </span>
    </div>

    <div v-else class="chart-watermark mono" aria-hidden="true">
      <span>NEX//PRICE_FEED</span>
      <span>1D INTERVAL · SIMULATED</span>
    </div>
  </div>
</template>

<style scoped>
.chart-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  touch-action: pan-y;
}

.price-chart {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.axis-label {
  fill: #506678;
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.02em;
}

.axis-price {
  font-size: 8px;
  opacity: 0.8;
}

.chart-hover {
  pointer-events: none;
}

.chart-tooltip {
  position: absolute;
  z-index: 4;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 2px 11px;
  min-width: 127px;
  padding: 8px 10px;
  border: 1px solid rgba(88, 247, 255, 0.26);
  background: rgba(4, 9, 16, 0.94);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  backdrop-filter: blur(8px);
}

.tooltip-day {
  color: var(--cyan);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.chart-tooltip strong {
  grid-row: 2;
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
}

.tooltip-change {
  grid-row: 2;
  font-size: 9px;
  font-weight: 600;
}

.chart-watermark {
  position: absolute;
  right: 13px;
  bottom: 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  color: rgba(122, 165, 190, 0.28);
  font-size: 7px;
  letter-spacing: 0.09em;
  pointer-events: none;
  line-height: 1.5;
}

@media (max-width: 560px) {
  .chart-watermark {
    display: none;
  }

  .axis-label {
    font-size: 8px;
  }
}
</style>
