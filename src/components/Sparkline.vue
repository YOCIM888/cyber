<script setup>
import { computed } from 'vue'

const props = defineProps({
  values: { type: Array, default: () => [] },
  width: { type: Number, default: 52 },
  height: { type: Number, default: 20 },
  area: { type: Boolean, default: false },
  endDot: { type: Boolean, default: false },
  strokeWidth: { type: Number, default: 1.4 },
})

const plot = computed(() => {
  const values = props.values.filter((value) => Number.isFinite(value))
  if (values.length < 2) {
    return {
      points: [],
      line: '',
      areaPath: '',
      end: null,
    }
  }

  const paddingX = 2
  const paddingY = 2
  const plotWidth = Math.max(1, props.width - paddingX * 2)
  const plotHeight = Math.max(1, props.height - paddingY * 2)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const spread = max - min || Math.max(1, Math.abs(max) * 0.01)

  const points = values.map((value, index) => ({
    x: paddingX + (index / (values.length - 1)) * plotWidth,
    y: paddingY + (1 - (value - min) / spread) * plotHeight,
  }))

  return {
    points,
    line: points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' '),
    areaPath: `M ${points[0].x.toFixed(2)} ${props.height - 1} L ${points
      .map((point) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' L ')} L ${points[points.length - 1].x.toFixed(2)} ${props.height - 1} Z`,
    end: points[points.length - 1],
  }
})
</script>

<template>
  <svg
    class="sparkline"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    aria-hidden="true"
  >
    <path
      v-if="area && plot.areaPath"
      :d="plot.areaPath"
      fill="currentColor"
      opacity="0.1"
    />
    <polyline
      v-if="plot.line"
      :points="plot.line"
      fill="none"
      stroke="currentColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.9"
    />
    <circle
      v-if="endDot && plot.end"
      :cx="plot.end.x"
      :cy="plot.end.y"
      r="1.6"
      fill="currentColor"
    />
  </svg>
</template>

<style scoped>
.sparkline {
  display: block;
  overflow: visible;
}
</style>
