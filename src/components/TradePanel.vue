<script setup>
import { computed, ref, watch } from 'vue'
import { getMaxBuyQuantity } from '../game/engine'
import { formatMoney, formatPercent, formatPrice } from '../game/format'

const props = defineProps({
  stock: { type: Object, required: true },
  cash: { type: Number, required: true },
  holding: { type: Object, default: null },
  feeRate: { type: Number, required: true },
})

const emit = defineEmits(['trade'])

const side = ref('buy')
const quantity = ref('')
const error = ref('')

const holdingShares = computed(() => props.holding?.shares || 0)
const maxBuy = computed(() => getMaxBuyQuantity(props.stock, props.cash))
const maxSell = computed(() => holdingShares.value)
const available = computed(() => (side.value === 'buy' ? maxBuy.value : maxSell.value))

const parsedQuantity = computed(() => {
  const parsed = Math.floor(Number(quantity.value))
  return Number.isFinite(parsed) ? parsed : 0
})

const quantityError = computed(() => {
  if (!quantity.value) return ''
  if (parsedQuantity.value <= 0) return '请输入大于 0 的整数股数'
  if (parsedQuantity.value > available.value) {
    return side.value === 'buy' ? '可用现金不足以买入该数量' : '持仓数量不足'
  }
  return ''
})

const canSubmit = computed(
  () => parsedQuantity.value > 0 && parsedQuantity.value <= available.value && available.value > 0,
)

const gross = computed(() => parsedQuantity.value * props.stock.price)
const fee = computed(() => gross.value * props.feeRate)
const total = computed(() =>
  side.value === 'buy' ? gross.value + fee.value : gross.value - fee.value,
)

const estimatedPnl = computed(() => {
  if (side.value !== 'sell' || !props.holding) return null
  return gross.value - fee.value - parsedQuantity.value * props.holding.avgCost
})

const sectorColor = computed(() => {
  const colors = {
    义体: '#ff5b9d',
    食品: '#8fffd2',
    能源: '#ffd166',
    娱乐: '#c79bff',
    军工: '#ff7a52',
    航天: '#63c9ff',
    消费: '#ff91b7',
    医疗: '#51ffd2',
    科技: '#7ea6ff',
    殡葬: '#a9a7ff',
  }
  return colors[props.stock.sector] || '#58f7ff'
})

const actionLabel = computed(() => `${side.value === 'buy' ? '确认买入' : '确认卖出'} ${props.stock.code}`)
const availabilityLabel = computed(() =>
  side.value === 'buy' ? '可用现金' : '可卖数量',
)
const availabilityValue = computed(() =>
  side.value === 'buy'
    ? `₱${formatMoney(props.cash)}`
    : `${holdingShares.value} 股`,
)

watch(
  () => props.stock.id,
  () => {
    quantity.value = ''
    error.value = ''
  },
)

watch(side, () => {
  quantity.value = ''
  error.value = ''
})

function sanitizeQuantity(event) {
  quantity.value = event.target.value.replace(/[^\d]/g, '').slice(0, 9)
  error.value = ''
}

function adjustQuantity(amount) {
  const next = Math.max(0, Math.min(available.value, parsedQuantity.value + amount))
  quantity.value = next > 0 ? String(next) : ''
  error.value = ''
}

function setPercent(percent) {
  quantity.value = available.value > 0 ? String(Math.floor(available.value * percent)) : ''
  error.value = ''
}

function submit() {
  if (!canSubmit.value) {
    error.value = quantityError.value || '当前没有可交易的数量'
    return
  }

  error.value = ''
  emit('trade', {
    side: side.value,
    stockId: props.stock.id,
    quantity: parsedQuantity.value,
  })
  quantity.value = ''
}
</script>

<template>
  <section class="trade-panel cyber-panel">
    <header class="panel-head trade-head">
      <div class="panel-headline">
        <span class="eyebrow">ORDER TERMINAL</span>
        <h2 class="panel-title">下单终端 <small>SPOT ONLY</small></h2>
      </div>
      <span class="terminal-indicator mono">ARMED</span>
    </header>

    <div class="trade-body">
      <div class="instrument-bar">
        <span class="instrument-code mono" :style="{ color: sectorColor, borderColor: `${sectorColor}44` }">
          {{ stock.code }}
        </span>
        <span class="instrument-identity">
          <strong>{{ stock.name }}</strong>
          <small>{{ stock.sector }} / {{ stock.code }}-P</small>
        </span>
        <span class="instrument-price">
          <strong class="num">₱{{ formatPrice(stock.price) }}</strong>
          <small class="num" :class="stock.price >= stock.prevClose ? 'up' : 'down'">
            {{ formatPercent(stock.price / stock.prevClose - 1) }}
          </small>
        </span>
      </div>

      <div class="side-switch" role="tablist" aria-label="交易方向">
        <button
          type="button"
          role="tab"
          class="side-button"
          :class="{ active: side === 'buy' }"
          :aria-selected="side === 'buy'"
          @click="side = 'buy'"
        >
          <span class="side-mark">BUY</span>
          <span>买入</span>
        </button>
        <button
          type="button"
          role="tab"
          class="side-button side-sell"
          :class="{ active: side === 'sell' }"
          :aria-selected="side === 'sell'"
          @click="side = 'sell'"
        >
          <span class="side-mark">SELL</span>
          <span>卖出</span>
        </button>
      </div>

      <div class="holding-strip">
        <span class="holding-label">{{ availabilityLabel }}</span>
        <strong class="num">{{ availabilityValue }}</strong>
        <span v-if="holding" class="holding-meta mono">
          持仓 {{ holding.shares }} 股 · 均价 ₱{{ formatPrice(holding.avgCost) }}
        </span>
        <span v-else class="holding-meta mono">当前未持有 {{ stock.code }}</span>
      </div>

      <div class="quantity-block">
        <div class="field-label">
          <span>交易数量 / SHARES</span>
          <span class="mono qty-unit">整数单位</span>
        </div>
        <div class="quantity-control">
          <button
            type="button"
            class="qty-step"
            aria-label="减少一股"
            :disabled="parsedQuantity <= 0"
            @click="adjustQuantity(-1)"
          >
            −
          </button>
          <input
            :value="quantity"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="0"
            aria-label="交易股数"
            @input="sanitizeQuantity"
            @keyup.enter="submit"
          />
          <button
            type="button"
            class="qty-step"
            aria-label="增加一股"
            :disabled="parsedQuantity >= available"
            @click="adjustQuantity(1)"
          >
            +
          </button>
        </div>
        <div class="quick-quantities">
          <button type="button" :disabled="!available" @click="setPercent(0.25)">25%</button>
          <button type="button" :disabled="!available" @click="setPercent(0.5)">50%</button>
          <button type="button" :disabled="!available" @click="setPercent(0.75)">75%</button>
          <button type="button" class="all-quantity" :disabled="!available" @click="setPercent(1)">
            MAX
          </button>
        </div>
      </div>

      <div class="order-summary">
        <div class="summary-row">
          <span>参考成交价</span>
          <strong class="num">₱{{ formatPrice(stock.price) }}</strong>
        </div>
        <div class="summary-row">
          <span>成交金额</span>
          <strong class="num">₱{{ formatMoney(gross) }}</strong>
        </div>
        <div class="summary-row">
          <span>交易税 {{ (feeRate * 100).toFixed(2) }}%</span>
          <strong class="num fee-value">−₱{{ formatMoney(fee) }}</strong>
        </div>
        <div v-if="estimatedPnl !== null" class="summary-row pnl-row">
          <span>预计已实现盈亏</span>
          <strong class="num" :class="estimatedPnl >= 0 ? 'up' : 'down'">
            {{ estimatedPnl >= 0 ? '+' : '-' }}₱{{ formatMoney(Math.abs(estimatedPnl)) }}
          </strong>
        </div>
        <div class="summary-row total-row">
          <span>{{ side === 'buy' ? '预计支出' : '预计到账' }}</span>
          <strong class="num">₱{{ formatMoney(Math.max(0, total)) }}</strong>
        </div>
      </div>

      <div v-if="error || quantityError" class="trade-error" role="alert">
        <span class="mono">ERR</span>
        {{ error || quantityError }}
      </div>
      <div v-else-if="side === 'sell' && !holding" class="trade-hint">
        先在左侧行情中选择标的并买入，才能进行卖出操作。
      </div>

      <button
        type="button"
        class="btn trade-submit"
        :class="side === 'buy' ? 'btn-buy' : 'btn-sell'"
        :disabled="!canSubmit"
        @click="submit"
      >
        {{ actionLabel }}
        <span class="submit-arrow">→</span>
      </button>

      <div class="trade-footnote">
        <span><i></i>收盘价成交模拟</span>
        <span class="mono">NO LEVERAGE</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.trade-panel {
  flex: none;
}

.trade-head {
  padding: 15px 17px 14px;
}

.terminal-indicator {
  padding: 2px 6px;
  color: var(--mint);
  border: 1px solid rgba(84, 255, 178, 0.24);
  font-size: 7px;
  letter-spacing: 0.08em;
}

.trade-body {
  padding: 15px 17px 14px;
}

.instrument-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(118, 228, 255, 0.08);
}

.instrument-code {
  display: inline-grid;
  place-items: center;
  width: 39px;
  height: 29px;
  flex: none;
  border: 1px solid;
  background: rgba(88, 247, 255, 0.04);
  font-size: 9px;
  letter-spacing: 0.02em;
}

.instrument-identity {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 1px;
}

.instrument-identity strong {
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.instrument-identity small {
  overflow: hidden;
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.03em;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.instrument-price {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 1px;
  margin-left: auto;
}

.instrument-price strong {
  color: var(--text);
  font-size: 17px;
  font-weight: 600;
}

.instrument-price small {
  font-size: 9px;
  font-weight: 600;
}

.side-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  margin-top: 14px;
  padding: 3px;
  border: 1px solid var(--line);
  background: rgba(3, 7, 12, 0.65);
}

.side-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-height: 34px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--dim);
  font-size: 12px;
  font-weight: 600;
  transition:
    background 160ms ease,
    color 160ms ease,
    border-color 160ms ease;
}

.side-button:hover {
  color: var(--text-soft);
}

.side-button.active {
  border-color: rgba(84, 255, 178, 0.28);
  background: rgba(84, 255, 178, 0.09);
  color: var(--mint);
}

.side-button.side-sell.active {
  border-color: rgba(255, 63, 145, 0.3);
  background: rgba(255, 63, 145, 0.09);
  color: var(--pink);
}

.side-mark {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
  opacity: 0.65;
}

.holding-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 11px 0;
  color: var(--dim);
  font-size: 9px;
}

.holding-label {
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.05em;
}

.holding-strip strong {
  color: var(--text-soft);
  font-size: 11px;
  font-weight: 600;
}

.holding-meta {
  margin-left: auto;
  color: var(--dim);
  font-size: 7.5px;
  letter-spacing: 0.02em;
}

.quantity-block {
  padding-top: 2px;
}

.field-label {
  margin-bottom: 7px;
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.qty-unit {
  font-size: 7px;
  text-transform: lowercase;
}

.quantity-control {
  display: flex;
  height: 46px;
  border: 1px solid rgba(118, 228, 255, 0.19);
  background: rgba(3, 7, 12, 0.52);
  transition: border-color 160ms ease;
}

.quantity-control:focus-within {
  border-color: rgba(88, 247, 255, 0.48);
  box-shadow: 0 0 18px rgba(88, 247, 255, 0.04);
}

.quantity-control input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 21px;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-align: center;
  outline: 0;
}

.quantity-control input::placeholder {
  color: #304252;
}

.qty-step {
  width: 42px;
  flex: none;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 18px;
  line-height: 1;
  transition:
    color 150ms ease,
    background 150ms ease;
}

.qty-step:first-child {
  border-right: 1px solid rgba(118, 228, 255, 0.08);
}

.qty-step:last-child {
  border-left: 1px solid rgba(118, 228, 255, 0.08);
}

.qty-step:hover:not(:disabled) {
  color: var(--cyan);
  background: rgba(88, 247, 255, 0.05);
}

.qty-step:disabled {
  opacity: 0.3;
}

.quick-quantities {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: 6px;
}

.quick-quantities button {
  height: 26px;
  border: 1px solid rgba(118, 228, 255, 0.11);
  background: transparent;
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8px;
  transition:
    color 150ms ease,
    border-color 150ms ease;
}

.quick-quantities button:hover:not(:disabled) {
  color: var(--cyan);
  border-color: rgba(88, 247, 255, 0.3);
}

.quick-quantities button:disabled {
  opacity: 0.3;
}

.quick-quantities .all-quantity {
  color: var(--cyan);
  border-color: rgba(88, 247, 255, 0.22);
}

.order-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 15px;
  padding: 12px 0 11px;
  border-top: 1px dashed rgba(118, 228, 255, 0.13);
  border-bottom: 1px dashed rgba(118, 228, 255, 0.13);
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--dim);
  font-size: 9.5px;
}

.summary-row strong {
  color: var(--text-soft);
  font-size: 11px;
  font-weight: 500;
}

.summary-row .fee-value {
  color: var(--muted);
  font-size: 10px;
}

.pnl-row {
  padding: 4px 0;
  border-top: 1px solid rgba(118, 228, 255, 0.05);
  border-bottom: 1px solid rgba(118, 228, 255, 0.05);
}

.total-row {
  margin-top: 2px;
  color: var(--muted);
  font-size: 10px;
}

.total-row span {
  color: var(--text-soft);
}

.total-row strong {
  color: var(--cyan);
  font-size: 16px;
  font-weight: 600;
}

.trade-error,
.trade-hint {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 9px;
  color: var(--pink);
  font-size: 9.5px;
  line-height: 1.4;
}

.trade-error .mono {
  padding: 1px 4px;
  border: 1px solid rgba(255, 63, 145, 0.34);
  font-size: 7px;
}

.trade-hint {
  color: var(--dim);
}

.trade-submit {
  width: 100%;
  min-height: 42px;
  margin-top: 12px;
  font-size: 12px;
  justify-content: space-between;
  padding: 0 16px;
}

.submit-arrow {
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 400;
}

.trade-footnote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 11px;
  color: #3b4c5c;
  font-size: 8px;
}

.trade-footnote span:first-child {
  display: flex;
  align-items: center;
  gap: 5px;
}

.trade-footnote i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(88, 247, 255, 0.35);
}

@media (max-width: 560px) {
  .trade-head {
    padding: 13px 14px;
  }

  .trade-body {
    padding: 13px 14px 12px;
  }

  .holding-meta {
    flex-basis: 100%;
    margin-left: 0;
  }
}
</style>
