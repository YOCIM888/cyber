<script setup>
import { computed } from 'vue'
import { computeNetWorth, getPositionRows } from '../game/engine'
import { SECTOR_META } from '../game/stocks'
import { formatMoney, formatPercent, formatPrice } from '../game/format'

const props = defineProps({
  game: { type: Object, required: true },
})

const emit = defineEmits(['select', 'finish'])

const netWorth = computed(() => computeNetWorth(props.game))
const positions = computed(() => getPositionRows(props.game))
const marketValue = computed(() =>
  positions.value.reduce((total, row) => total + row.marketValue, 0),
)
const unrealizedPnl = computed(() =>
  positions.value.reduce((total, row) => total + row.pnl, 0),
)
const exposure = computed(() => (netWorth.value > 0 ? marketValue.value / netWorth.value : 0))

const cashWeight = computed(() => Math.max(0, 1 - exposure.value))
const allocationSegments = computed(() => {
  const segments = positions.value.map((row) => ({
    id: row.id,
    color: SECTOR_META[row.sector]?.color || '#58f7ff',
    width: Math.max(0, (row.marketValue / Math.max(1, netWorth.value)) * 100),
  }))
  return [
    ...segments,
    { id: 'cash', color: 'rgba(128, 151, 171, 0.32)', width: cashWeight.value * 100 },
  ].filter((segment) => segment.width > 0.25)
})

const dayPnl = computed(() => {
  const previousClose = props.game.netWorthHistory[props.game.netWorthHistory.length - 1]
  if (previousClose === undefined) return 0
  return netWorth.value - previousClose
})

function rowColor(sector) {
  return SECTOR_META[sector]?.color || '#58f7ff'
}
</script>

<template>
  <section class="portfolio-panel cyber-panel">
    <header class="panel-head portfolio-head">
      <div class="panel-headline">
        <span class="eyebrow">PORTFOLIO / EXPOSURE</span>
        <h2 class="panel-title">资产负载 <small>{{ positions.length }} POSITIONS</small></h2>
      </div>
      <div class="exposure-tag">
        <span class="mono">EXPOSURE</span>
        <strong class="num">{{ formatPercent(exposure, 1).replace('+', '') }}</strong>
      </div>
    </header>

    <div class="portfolio-summary">
      <div class="summary-metric">
        <span>持仓市值</span>
        <strong class="num">₱{{ formatMoney(marketValue) }}</strong>
      </div>
      <div class="summary-metric">
        <span>浮动盈亏</span>
        <strong class="num" :class="unrealizedPnl >= 0 ? 'up' : 'down'">
          {{ unrealizedPnl >= 0 ? '+' : '-' }}₱{{ formatMoney(Math.abs(unrealizedPnl)) }}
        </strong>
      </div>
      <div class="summary-metric">
        <span>较上次收盘</span>
        <strong class="num" :class="dayPnl >= 0 ? 'up' : 'down'">
          {{ dayPnl >= 0 ? '+' : '-' }}₱{{ formatMoney(Math.abs(dayPnl)) }}
        </strong>
      </div>
      <div class="allocation">
        <div class="allocation-bar" aria-hidden="true">
          <span
            v-for="segment in allocationSegments"
            :key="segment.id"
            :style="{ width: `${segment.width}%`, background: segment.color }"
          ></span>
        </div>
        <span class="allocation-label mono">CASH {{ formatPercent(cashWeight, 0).replace('+', '') }}</span>
      </div>
    </div>

    <div class="positions-table">
      <div class="position-head mono">
        <span>持仓标的</span>
        <span>持有 / 成本</span>
        <span>市值</span>
        <span>浮动盈亏</span>
      </div>

      <button
        v-for="row in positions"
        :key="row.id"
        type="button"
        class="position-row"
        :style="{ '--row-color': rowColor(row.sector) }"
        @click="emit('select', row.id)"
      >
        <span class="position-identity">
          <span class="position-code mono">{{ row.code }}</span>
          <span class="position-name">
            {{ row.name }}
            <small class="mono">{{ formatPercent(row.weight, 1).replace('+', '') }} 仓位</small>
          </span>
        </span>
        <span class="position-shares num">
          {{ row.shares }} 股
          <small>₱{{ formatPrice(row.avgCost) }}</small>
        </span>
        <span class="position-value num">
          ₱{{ formatMoney(row.marketValue) }}
          <small>现价 {{ formatPrice(row.price) }}</small>
        </span>
        <span class="position-pnl num" :class="row.pnl >= 0 ? 'up' : 'down'">
          {{ row.pnl >= 0 ? '+' : '-' }}₱{{ formatMoney(Math.abs(row.pnl)) }}
          <small>{{ formatPercent(row.pnlPct) }}</small>
        </span>
      </button>

      <div v-if="!positions.length" class="portfolio-empty">
        <span class="empty-symbol">[ ]</span>
        <div>
          <strong>账户处于空仓状态</strong>
          <p>现金正在等待一个足够好的故事。选择标的，在右侧终端建立你的第一个仓位。</p>
        </div>
      </div>
    </div>

    <footer class="portfolio-footer">
      <span class="mono">
        可用 ₱{{ formatMoney(game.cash) }} · 已实现
        <b :class="game.realizedPnl >= 0 ? 'up' : 'down'">
          {{ game.realizedPnl >= 0 ? '+' : '-' }}₱{{ formatMoney(Math.abs(game.realizedPnl)) }}
        </b>
      </span>
      <button
        v-if="game.mode === 'endless'"
        type="button"
        class="leave-button mono"
        @click="emit('finish')"
      >
        结算离场
        <span>↗</span>
      </button>
      <span v-else class="mono campaign-foot">
        收盘时按最新价自动估值
      </span>
    </footer>
  </section>
</template>

<style scoped>
.portfolio-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.portfolio-head {
  padding: 14px 18px 13px;
}

.exposure-tag {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 1px;
}

.exposure-tag span {
  color: var(--dim);
  font-size: 7px;
  letter-spacing: 0.08em;
}

.exposure-tag strong {
  color: var(--cyan);
  font-size: 15px;
  font-weight: 500;
}

.portfolio-summary {
  display: grid;
  grid-template-columns: repeat(3, auto) minmax(90px, 1fr);
  align-items: center;
  gap: 17px;
  padding: 12px 18px 13px;
  border-bottom: 1px solid var(--line);
  background: rgba(4, 8, 14, 0.34);
}

.summary-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-metric > span {
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.04em;
}

.summary-metric strong {
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.allocation {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.allocation-bar {
  display: flex;
  width: 100%;
  height: 3px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.allocation-bar span {
  display: block;
  height: 100%;
  min-width: 1px;
  transition: width 420ms ease;
}

.allocation-label {
  color: var(--dim);
  font-size: 7px;
  letter-spacing: 0.03em;
}

.positions-table {
  min-height: 0;
  overflow-y: auto;
}

.position-head {
  display: grid;
  grid-template-columns: minmax(120px, 1.35fr) minmax(80px, 0.9fr) minmax(96px, 1fr) minmax(94px, 0.95fr);
  gap: 12px;
  padding: 9px 18px 7px;
  color: #3b4c5d;
  font-size: 7px;
  letter-spacing: 0.04em;
}

.position-head span:nth-child(n + 3) {
  text-align: right;
}

.position-row {
  display: grid;
  grid-template-columns: minmax(120px, 1.35fr) minmax(80px, 0.9fr) minmax(96px, 1fr) minmax(94px, 0.95fr);
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 46px;
  padding: 6px 18px 6px 15px;
  border: 0;
  border-top: 1px solid rgba(118, 228, 255, 0.06);
  border-left: 1px solid transparent;
  background: transparent;
  text-align: left;
  transition:
    background 150ms ease,
    border-color 150ms ease;
}

.position-row:hover {
  border-left-color: var(--row-color);
  background: rgba(88, 247, 255, 0.04);
}

.position-identity {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.position-code {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 23px;
  flex: none;
  color: var(--row-color);
  border: 1px solid color-mix(in srgb, var(--row-color) 26%, transparent);
  background: color-mix(in srgb, var(--row-color) 5%, transparent);
  font-size: 8px;
}

.position-name {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
  color: var(--text-soft);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.position-name small {
  color: var(--dim);
  font-size: 7.5px;
  font-weight: 400;
}

.position-shares,
.position-value,
.position-pnl {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 1px;
  color: var(--text-soft);
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.position-shares small,
.position-value small,
.position-pnl small {
  color: var(--dim);
  font-size: 8px;
  font-weight: 400;
}

.position-value,
.position-pnl {
  text-align: right;
}

.position-pnl {
  font-weight: 600;
}

.portfolio-empty {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 27px 18px;
  color: var(--muted);
}

.empty-symbol {
  color: rgba(88, 247, 255, 0.23);
  font-family: var(--font-mono);
  font-size: 21px;
}

.portfolio-empty strong {
  color: var(--text-soft);
  font-size: 11.5px;
  font-weight: 600;
}

.portfolio-empty p {
  margin-top: 3px;
  color: var(--dim);
  font-size: 9.5px;
  line-height: 1.5;
}

.portfolio-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex: none;
  min-height: 33px;
  padding: 0 18px;
  border-top: 1px solid var(--line);
  background: rgba(4, 8, 14, 0.3);
  color: var(--dim);
  font-size: 8px;
}

.portfolio-footer b {
  font-weight: 500;
}

.leave-button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 7px;
  border: 1px solid rgba(255, 209, 102, 0.22);
  background: transparent;
  color: var(--amber);
  font-size: 8px;
  letter-spacing: 0.03em;
  transition:
    color 150ms ease,
    border-color 150ms ease;
}

.leave-button:hover {
  color: #ffe7a8;
  border-color: rgba(255, 209, 102, 0.5);
}

.leave-button span {
  font-size: 10px;
}

.campaign-foot {
  color: #3c4e5e;
}

@media (max-width: 760px) {
  .portfolio-summary {
    grid-template-columns: repeat(3, 1fr);
    gap: 11px;
  }

  .allocation {
    grid-column: 1 / -1;
    align-items: flex-start;
  }

  .allocation-bar {
    max-width: 100%;
  }

  .position-head,
  .position-row {
    grid-template-columns: minmax(105px, 1.3fr) minmax(76px, 0.8fr) minmax(88px, 1fr);
    grid-template-rows: auto auto;
    gap: 2px 8px;
    padding-right: 13px;
    padding-left: 13px;
  }

  .position-head span:last-child {
    display: none;
  }

  .position-identity,
  .position-shares {
    grid-row: 1 / span 2;
  }

  .position-value {
    grid-column: 3;
    grid-row: 1;
    line-height: 1.1;
  }

  .position-pnl {
    grid-column: 3;
    grid-row: 2;
    font-size: 9px;
    line-height: 1.1;
  }
}

@media (max-width: 480px) {
  .portfolio-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-metric:nth-child(3) {
    display: none;
  }

  .position-head,
  .position-row {
    grid-template-columns: minmax(105px, 1.25fr) minmax(80px, 0.85fr) minmax(85px, 0.9fr);
  }

  .position-shares small,
  .position-value small {
    display: none;
  }

  .portfolio-footer {
    padding: 0 13px;
  }

  .campaign-foot {
    display: none;
  }
}
</style>
