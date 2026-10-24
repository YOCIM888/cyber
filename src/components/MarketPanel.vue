<script setup>
import { computed, ref } from 'vue'
import { getIndexChange, getStockChange } from '../game/engine'
import { SECTOR_META } from '../game/stocks'
import { formatPercent, formatPrice } from '../game/format'
import Sparkline from './Sparkline.vue'

const props = defineProps({
  game: { type: Object, required: true },
  selectedId: { type: String, required: true },
})

const emit = defineEmits(['select'])

const filter = ref('all')

const holdingCount = computed(() => Object.keys(props.game.holdings).length)
const indexChange = computed(() => getIndexChange(props.game))
const indexValues = computed(() => props.game.indexHistory.slice(-28))
const advancers = computed(
  () => props.game.stocks.filter((stock) => getStockChange(stock) >= 0).length,
)
const decliners = computed(() => props.game.stocks.length - advancers.value)

const visibleStocks = computed(() => {
  if (filter.value === 'holdings') {
    return props.game.stocks.filter((stock) => props.game.holdings[stock.id]?.shares > 0)
  }
  return props.game.stocks
})

const signals = computed(() => {
  const map = {}
  for (const item of props.game.intel || []) {
    if (item.scope === 'market') continue
    if (item.scope === 'stock') {
      const prior = map[item.stockId]
      map[item.stockId] = {
        sentiment: (prior?.sentiment || 0) + item.sentiment * (item.tier || 1),
        tier: Math.max(prior?.tier || 1, item.tier || 1),
      }
    } else if (item.scope === 'sector') {
      for (const stock of props.game.stocks) {
        if (stock.sector !== item.sector) continue
        const prior = map[stock.id]
        map[stock.id] = {
          sentiment: (prior?.sentiment || 0) + item.sentiment * (item.tier || 1),
          tier: Math.max(prior?.tier || 1, item.tier || 1),
        }
      }
    }
  }
  return map
})

const regimeClass = computed(() => {
  const tone = props.game.regime?.tone
  if (tone === 'up') return 'up'
  if (tone === 'down') return 'down'
  return 'neutral'
})

function sectorColor(stock) {
  return SECTOR_META[stock.sector]?.color || '#58f7ff'
}

function rowSignal(stock) {
  return signals.value[stock.id] || null
}

function changeClass(change) {
  return change >= 0 ? 'up' : 'down'
}
</script>

<template>
  <aside class="market-panel cyber-panel">
    <header class="panel-head market-head">
      <div class="panel-headline">
        <span class="eyebrow">MARKET WATCH</span>
        <h2 class="panel-title">市场行情 <small>12 ASSETS</small></h2>
      </div>
      <span class="live-status">ONLINE</span>
    </header>

    <section class="index-card" :class="changeClass(indexChange)">
      <div class="index-topline">
        <span class="eyebrow">NCI / 霓虹综合指数</span>
        <span class="index-tag mono">EQUAL WEIGHT</span>
      </div>
      <div class="index-main">
        <div class="index-quote">
          <strong class="num">{{ props.game.index.toFixed(2) }}</strong>
          <span class="index-change num">{{ formatPercent(indexChange) }}</span>
        </div>
        <div class="index-spark" :class="changeClass(indexChange)">
          <Sparkline :values="indexValues" :width="93" :height="31" area end-dot />
        </div>
      </div>
      <div class="index-meta">
        <span class="breadth">
          <span class="up">↑ {{ advancers }}</span>
          <i></i>
          <span class="down">↓ {{ decliners }}</span>
        </span>
        <span class="regime" :class="regimeClass">
          <span class="regime-dot"></span>
          {{ game.regime.label }}情绪
        </span>
      </div>
    </section>

    <div class="market-tabs">
      <button
        type="button"
        class="market-tab"
        :class="{ active: filter === 'all' }"
        @click="filter = 'all'"
      >
        全部合约
        <span class="mono">12</span>
      </button>
      <button
        type="button"
        class="market-tab"
        :class="{ active: filter === 'holdings' }"
        @click="filter = 'holdings'"
      >
        当前持仓
        <span class="mono">{{ holdingCount }}</span>
      </button>
    </div>

    <div class="stock-scroll">
      <div class="list-head mono">
        <span>CONTRACT / SECTOR</span>
        <span>LAST / Δ%</span>
      </div>

      <button
        v-for="stock in visibleStocks"
        :key="stock.id"
        type="button"
        class="stock-row"
        :class="{
          selected: selectedId === stock.id,
          held: game.holdings[stock.id]?.shares > 0,
        }"
        :style="{ '--sector-color': sectorColor(stock) }"
        @click="emit('select', stock.id)"
      >
        <span class="stock-accent"></span>
        <span class="stock-code mono">{{ stock.code }}</span>
        <span class="stock-identity">
          <span class="stock-name">
            {{ stock.name }}
            <span v-if="game.holdings[stock.id]?.shares" class="held-dot"></span>
            <span
              v-if="rowSignal(stock)"
              class="signal-flag"
              :class="rowSignal(stock).sentiment >= 0 ? 'up' : 'down'"
              :title="rowSignal(stock).sentiment >= 0 ? '今日存在利好情报' : '今日存在利空情报'"
            >
              <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true">
                <path
                  v-if="rowSignal(stock).sentiment >= 0"
                  d="M5 1L9 8H1L5 1Z"
                  fill="currentColor"
                />
                <path v-else d="M5 9L1 2H9L5 9Z" fill="currentColor" />
              </svg>
            </span>
          </span>
          <span class="stock-sector">{{ stock.sector }}</span>
        </span>

        <span class="stock-quote">
          <span class="stock-price num">{{ formatPrice(stock.price) }}</span>
          <span class="stock-change num" :class="changeClass(getStockChange(stock))">
            {{ formatPercent(getStockChange(stock)) }}
          </span>
        </span>

        <span class="row-spark" :class="changeClass(getStockChange(stock))">
          <Sparkline
            :values="stock.history.slice(-12)"
            :width="45"
            :height="19"
            :stroke-width="1.2"
          />
        </span>
      </button>

      <div v-if="!visibleStocks.length" class="market-empty">
        <span class="empty-mark">∅</span>
        <span>尚未建立任何仓位</span>
        <small>从行情列表挑选标的后开始交易</small>
      </div>
    </div>

    <footer class="market-footer">
      <span><i></i>收盘后更新</span>
      <span class="mono">{{ visibleStocks.length }} / 12 LISTED</span>
    </footer>
  </aside>
</template>

<style scoped>
.market-panel {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 142px);
  min-height: 590px;
  overflow: hidden;
}

.market-head {
  flex: none;
  padding: 15px 17px 14px;
}

.index-card {
  position: relative;
  flex: none;
  padding: 15px 17px 13px;
  border-bottom: 1px solid var(--line);
  background:
    linear-gradient(115deg, rgba(88, 247, 255, 0.045), transparent 52%),
    rgba(5, 9, 16, 0.48);
  overflow: hidden;
}

.index-card::after {
  content: 'NCI';
  position: absolute;
  right: -2px;
  bottom: -26px;
  color: rgba(88, 247, 255, 0.035);
  font-family: var(--font-display);
  font-size: 89px;
  font-weight: 800;
  letter-spacing: -0.08em;
  pointer-events: none;
}

.index-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.index-topline .eyebrow {
  font-size: 8.5px;
}

.index-tag {
  color: var(--dim);
  font-size: 7px;
  letter-spacing: 0.04em;
}

.index-main {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
  margin-top: 6px;
}

.index-quote {
  display: flex;
  align-items: baseline;
  gap: 9px;
}

.index-quote strong {
  color: var(--text);
  font-size: 31px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.015em;
}

.index-change {
  font-size: 12px;
  font-weight: 600;
}

.index-card.up .index-change {
  color: var(--up);
}

.index-card.down .index-change {
  color: var(--down);
}

.index-spark {
  margin-bottom: 2px;
  opacity: 0.9;
}

.index-spark.up {
  color: var(--mint);
}

.index-spark.down {
  color: var(--pink);
}

.index-meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  color: var(--dim);
}

.breadth {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-mono);
  font-size: 9px;
}

.breadth i {
  width: 1px;
  height: 9px;
  background: var(--line);
}

.regime {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.04em;
}

.regime-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

.regime.up {
  color: var(--mint);
}

.regime.down {
  color: var(--pink);
}

.regime.neutral {
  color: var(--muted);
}

.market-tabs {
  display: flex;
  flex: none;
  padding: 0 10px;
  border-bottom: 1px solid var(--line);
}

.market-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  min-height: 39px;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  color: var(--dim);
  font-size: 10px;
  letter-spacing: 0.04em;
  transition:
    color 160ms ease,
    border-color 160ms ease;
}

.market-tab span {
  color: inherit;
  font-size: 8px;
  opacity: 0.7;
}

.market-tab:hover {
  color: var(--text-soft);
}

.market-tab.active {
  border-bottom-color: var(--cyan);
  color: var(--cyan);
}

.stock-scroll {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.list-head {
  display: flex;
  justify-content: space-between;
  padding: 11px 17px 8px 47px;
  color: #3d5062;
  font-size: 7px;
  letter-spacing: 0.07em;
}

.stock-row {
  position: relative;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto 45px;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-height: 49px;
  padding: 6px 12px 6px 12px;
  border: 0;
  border-top: 1px solid rgba(118, 228, 255, 0.055);
  background: transparent;
  text-align: left;
  transition:
    background 140ms ease,
    color 140ms ease;
}

.stock-row:hover {
  background: rgba(88, 247, 255, 0.045);
}

.stock-row.selected {
  background:
    linear-gradient(90deg, rgba(88, 247, 255, 0.1), transparent 88%),
    rgba(13, 23, 36, 0.5);
}

.stock-accent {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0;
  width: 2px;
  background: var(--sector-color);
  opacity: 0;
  box-shadow: 0 0 9px var(--sector-color);
  transition: opacity 160ms ease;
}

.stock-row.selected .stock-accent {
  opacity: 1;
}

.stock-code {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 25px;
  color: var(--sector-color);
  border: 1px solid color-mix(in srgb, var(--sector-color) 28%, transparent);
  background: color-mix(in srgb, var(--sector-color) 7%, transparent);
  font-size: 8px;
  letter-spacing: 0.025em;
}

.stock-identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.stock-name {
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.held-dot {
  width: 4px;
  height: 4px;
  flex: none;
  border-radius: 50%;
  background: var(--mint);
  box-shadow: 0 0 6px rgba(84, 255, 178, 0.8);
}

.stock-sector {
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8px;
}

.signal-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
}

.signal-flag.up {
  color: var(--mint);
  filter: drop-shadow(0 0 3px rgba(84, 255, 178, 0.45));
}

.signal-flag.down {
  color: var(--pink);
  filter: drop-shadow(0 0 3px rgba(255, 63, 145, 0.45));
}

.stock-quote {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 1px;
  min-width: 64px;
}

.stock-price {
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.stock-row.selected .stock-price {
  color: var(--text);
}

.stock-change {
  font-size: 9.5px;
  font-weight: 600;
  line-height: 1.1;
}

.row-spark {
  width: 45px;
  opacity: 0.66;
}

.row-spark.up {
  color: var(--mint);
}

.row-spark.down {
  color: var(--pink);
}

.stock-row:hover .row-spark,
.stock-row.selected .row-spark {
  opacity: 1;
}

.market-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 50px 20px;
  color: var(--muted);
  text-align: center;
}

.empty-mark {
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 23px;
}

.market-empty span:nth-child(2) {
  font-size: 12px;
}

.market-empty small {
  color: var(--dim);
  font-size: 9px;
}

.market-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  min-height: 31px;
  padding: 0 17px;
  border-top: 1px solid var(--line);
  color: var(--dim);
  font-size: 8px;
}

.market-footer > span:first-child {
  display: flex;
  align-items: center;
  gap: 5px;
}

.market-footer i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(84, 255, 178, 0.5);
}

@media (max-width: 1240px) {
  .market-panel {
    height: calc(100vh - 170px);
  }
}

@media (max-width: 930px) {
  .market-panel {
    height: auto;
    min-height: 0;
    max-height: none;
  }

  .stock-scroll {
    max-height: 500px;
  }
}

@media (max-width: 560px) {
  .market-head {
    padding: 13px 14px;
  }

  .index-card {
    padding: 13px 14px 11px;
  }

  .index-quote strong {
    font-size: 26px;
  }

  .index-spark {
    display: none;
  }

  .stock-row {
    grid-template-columns: 32px minmax(0, 1fr) auto;
    gap: 8px;
    padding-right: 14px;
  }

  .row-spark {
    display: none;
  }

  .stock-scroll {
    max-height: 440px;
  }

  .list-head {
    padding-left: 48px;
  }
}
</style>
