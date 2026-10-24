<script setup>
import { computed } from 'vue'
import { formatPercent, formatPrice } from '../game/format'
import { getIndexChange, getStockChange } from '../game/engine'

const props = defineProps({
  game: { type: Object, required: true },
})

const items = computed(() => [
  {
    key: 'index',
    label: 'NCI 霓虹综指',
    value: props.game.index.toFixed(2),
    change: getIndexChange(props.game),
    accent: '#58f7ff',
  },
  ...props.game.stocks.map((stock) => ({
    key: stock.id,
    label: `${stock.code} ${stock.name}`,
    value: formatPrice(stock.price),
    change: getStockChange(stock),
    accent: '#8ea4b8',
  })),
])

const loop = computed(() => [...items.value, ...items.value])
</script>

<template>
  <div class="ticker" aria-hidden="true">
    <div class="ticker-tag">
      <span class="ticker-tag-dot"></span>
      MARKET FEED
    </div>
    <div class="ticker-viewport">
      <div class="ticker-track">
        <div v-for="(item, index) in loop" :key="`${item.key}-${index}`" class="ticker-item">
          <span class="ticker-name" :style="{ color: item.accent }">{{ item.label }}</span>
          <span class="ticker-value num">{{ item.value }}</span>
          <span class="ticker-change num" :class="item.change >= 0 ? 'up' : 'down'">
            {{ formatPercent(item.change) }}
          </span>
          <span class="ticker-separator">◇</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: stretch;
  height: 34px;
  overflow: hidden;
  border-top: 1px solid rgba(118, 228, 255, 0.09);
  border-bottom: 1px solid rgba(118, 228, 255, 0.12);
  background: rgba(4, 8, 14, 0.78);
  backdrop-filter: blur(10px);
}

.ticker::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(4, 8, 14, 0.92), transparent 7%, transparent 93%, rgba(4, 8, 14, 0.92));
}

.ticker-tag {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
  padding: 0 16px;
  border-right: 1px solid var(--line);
  background: rgba(8, 14, 24, 0.98);
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.1em;
}

.ticker-tag-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 7px var(--cyan);
}

.ticker-viewport {
  min-width: 0;
  overflow: hidden;
  flex: 1;
}

.ticker-track {
  display: flex;
  width: max-content;
  height: 100%;
  animation: marquee 56s linear infinite;
}

.ticker:hover .ticker-track {
  animation-play-state: paused;
}

.ticker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
  padding-left: 21px;
  font-size: 11px;
  white-space: nowrap;
}

.ticker-name {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.04em;
  opacity: 0.76;
}

.ticker-value {
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 600;
}

.ticker-change {
  font-size: 12px;
  font-weight: 600;
}

.ticker-separator {
  padding-left: 10px;
  color: rgba(88, 247, 255, 0.2);
  font-size: 9px;
}

@media (max-width: 700px) {
  .ticker-tag {
    padding: 0 11px;
    font-size: 8px;
  }

  .ticker-item {
    gap: 6px;
    padding-left: 15px;
  }
}
</style>
