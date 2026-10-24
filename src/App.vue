<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import TitleScreen from './components/TitleScreen.vue'
import GameHeader from './components/GameHeader.vue'
import TickerTape from './components/TickerTape.vue'
import MarketPanel from './components/MarketPanel.vue'
import StockChart from './components/StockChart.vue'
import PortfolioPanel from './components/PortfolioPanel.vue'
import TradePanel from './components/TradePanel.vue'
import NewsPanel from './components/NewsPanel.vue'
import HelpModal from './components/HelpModal.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import ResultModal from './components/ResultModal.vue'
import { FEE_RATE, GAME_VERSION, SECTOR_META } from './game/stocks'
import {
  buildResult,
  computeNetWorth,
  createGame,
  executeTrade,
  finishSession,
  getStockChange,
  settleDay,
} from './game/engine'
import {
  formatMoney,
  formatPercent,
  formatPrice,
  formatVolume,
} from './game/format'

const SAVE_KEY = 'neon-exchange.save.v1'
const RECORDS_KEY = 'neon-exchange.records.v1'
const MAX_RECORDS = 8

const screen = ref('title')
const game = ref(null)
const savedGame = ref(loadSave())
const records = ref(loadRecords())
const busy = ref(false)
const helpOpen = ref(false)
const confirmFinish = ref(false)
const resultData = ref(null)
const isNewRecord = ref(false)
const toast = ref(null)
let toastTimer = null

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const valid =
      parsed &&
      parsed.version === GAME_VERSION &&
      !parsed.finished &&
      Array.isArray(parsed.stocks) &&
      parsed.stocks.length > 0 &&
      Array.isArray(parsed.netWorthHistory) &&
      typeof parsed.cash === 'number' &&
      typeof parsed.day === 'number' &&
      parsed.holdings &&
      typeof parsed.holdings === 'object'
    return valid ? parsed : null
  } catch {
    return null
  }
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (record) => record && typeof record.totalReturn === 'number' && record.rank,
    )
  } catch {
    return []
  }
}

function persistGame() {
  if (!game.value || game.value.finished) return
  game.value.updatedAt = new Date().toISOString()
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(game.value))
  } catch {
    /* 存储不可用时仍可继续游戏 */
  }
  savedGame.value = game.value
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
  savedGame.value = null
}

function persistRecords() {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records.value))
  } catch {
    /* ignore */
  }
}

function recordResult(result) {
  const bestBefore = records.value.length
    ? Math.max(...records.value.map((item) => item.totalReturn))
    : -Infinity
  const isNew = result.totalReturn > bestBefore
  records.value = [
    ...records.value,
    { ...result, id: `record-${Date.now()}`, at: new Date().toISOString() },
  ]
    .sort((a, b) => b.totalReturn - a.totalReturn)
    .slice(0, MAX_RECORDS)
  persistRecords()
  return isNew
}

function showToast(message, type = 'info') {
  toast.value = { message, type }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.value = null
  }, 3200)
}

const saveInfo = computed(() => {
  const save = savedGame.value
  if (!save) return null
  return {
    mode: save.mode,
    day: save.day,
    netWorth: computeNetWorth(save),
    updatedAt: save.updatedAt,
  }
})

const bestRecord = computed(() => {
  if (!records.value.length) return null
  return [...records.value].sort((a, b) => b.totalReturn - a.totalReturn)[0]
})

const selectedStock = computed(() => {
  if (!game.value) return null
  return (
    game.value.stocks.find((stock) => stock.id === game.value.selectedStockId) ||
    game.value.stocks[0] ||
    null
  )
})

const accent = computed(() => {
  const sector = selectedStock.value?.sector
  return (sector && SECTOR_META[sector]?.color) || '#58f7ff'
})

const selectedChange = computed(() =>
  selectedStock.value ? getStockChange(selectedStock.value) : 0,
)

const selectedHolding = computed(() => {
  if (!game.value || !selectedStock.value) return null
  return game.value.holdings[selectedStock.value.id] || null
})

const stockIntel = computed(() => {
  if (!game.value || !selectedStock.value) return []
  const stock = selectedStock.value
  return game.value.intel.filter(
    (item) =>
      item.scope === 'market' ||
      (item.scope === 'sector' && item.sector === stock.sector) ||
      (item.scope === 'stock' && item.stockId === stock.id),
  )
})

const intelScore = computed(() =>
  stockIntel.value.reduce(
    (total, item) => total + item.sentiment * (item.tier || 1),
    0,
  ),
)

const intelTone = computed(() => {
  if (intelScore.value > 0) return 'tone-up'
  if (intelScore.value < 0) return 'tone-down'
  return 'tone-neutral'
})

const intelVerdict = computed(() => {
  if (intelScore.value > 0) return '信号偏多'
  if (intelScore.value < 0) return '信号偏空'
  return '信号中性'
})

const quoteStats = computed(() => {
  const stock = selectedStock.value
  if (!stock) return []
  return [
    { label: '昨收', value: formatPrice(stock.prevClose), tone: '' },
    { label: '今开', value: formatPrice(stock.open), tone: '' },
    { label: '最高', value: formatPrice(stock.high), tone: 'up' },
    { label: '最低', value: formatPrice(stock.low), tone: 'down' },
    { label: '成交量', value: formatVolume(stock.volume), tone: '' },
    {
      label: '日均波动',
      value: `${(stock.volatility * 100).toFixed(1)}%`,
      tone: '',
    },
  ]
})

const stockTrades = computed(() => {
  if (!game.value || !selectedStock.value) return []
  return game.value.trades.filter(
    (trade) => trade.stockId === selectedStock.value.id,
  )
})

const buyCount = computed(
  () => stockTrades.value.filter((trade) => trade.side === 'buy').length,
)
const sellCount = computed(
  () => stockTrades.value.filter((trade) => trade.side === 'sell').length,
)

function startGame(mode) {
  game.value = createGame(mode)
  resultData.value = null
  isNewRecord.value = false
  busy.value = false
  screen.value = 'game'
  persistGame()
  showToast(
    mode === 'endless'
      ? '无尽协议上线 · 可随时结算离场'
      : '10 日协议上线 · 第 1 交易日',
    'info',
  )
}

function continueGame() {
  const restored = loadSave()
  if (!restored) {
    savedGame.value = null
    showToast('未找到可恢复的存档。', 'error')
    return
  }
  game.value = restored
  resultData.value = null
  isNewRecord.value = false
  busy.value = false
  screen.value = 'game'
  showToast(`会话已恢复 · DAY ${String(restored.day).padStart(2, '0')}`, 'info')
}

function selectStock(stockId) {
  if (!game.value) return
  if (!game.value.stocks.some((stock) => stock.id === stockId)) return
  game.value.selectedStockId = stockId
  persistGame()
}

function handleTrade(payload) {
  if (!game.value || busy.value) return
  try {
    const trade = executeTrade(game.value, payload)
    if (trade.side === 'buy') {
      showToast(
        `买入成交 · ${trade.name} ${trade.quantity} 股 @ ₱${formatPrice(trade.price)}`,
        'ok',
      )
    } else {
      const profit = trade.realizedPnl >= 0
      showToast(
        `卖出成交 · ${trade.name} ${trade.quantity} 股 · 已实现 ${profit ? '+' : '-'}₱${formatMoney(Math.abs(trade.realizedPnl))}`,
        profit ? 'ok' : 'info',
      )
    }
    persistGame()
  } catch (error) {
    showToast(error.message || '交易失败。', 'error')
  }
}

async function advanceDay() {
  if (!game.value || busy.value || game.value.finished) return
  busy.value = true
  await new Promise((resolve) => setTimeout(resolve, 360))
  try {
    const report = settleDay(game.value)
    if (game.value.finished) {
      const result = buildResult(game.value)
      resultData.value = result
      isNewRecord.value = recordResult(result)
      clearSave()
      showToast(`协议结束 · ${result.rank.grade} 级 / ${result.rank.label}`, 'info')
    } else if (report) {
      persistGame()
      const delta = report.netWorthChange || 0
      showToast(
        `DAY ${String(report.day).padStart(2, '0')} 收盘 · 资产 ${delta >= 0 ? '+' : '-'}₱${formatMoney(Math.abs(delta))}`,
        delta >= 0 ? 'ok' : 'error',
      )
    }
  } catch (error) {
    showToast(error.message || '收盘结算失败。', 'error')
  } finally {
    busy.value = false
  }
}

function finishEndless() {
  if (!game.value || game.value.finished) return
  confirmFinish.value = false
  const result = finishSession(game.value)
  if (!result) return
  resultData.value = result
  isNewRecord.value = recordResult(result)
  clearSave()
  showToast(`已结算离场 · ${result.rank.grade} 级`, 'info')
}

function replay() {
  const mode = game.value?.mode === 'endless' ? 'endless' : 'campaign'
  game.value = createGame(mode)
  resultData.value = null
  isNewRecord.value = false
  busy.value = false
  persistGame()
  showToast(
    mode === 'campaign' ? '新的 10 日协议已启动。' : '新的无尽协议已启动。',
    'info',
  )
}

function goHome() {
  resultData.value = null
  game.value = null
  screen.value = 'title'
  savedGame.value = loadSave()
  records.value = loadRecords()
}

function leaveToTitle() {
  if (game.value && !game.value.finished) persistGame()
  helpOpen.value = false
  confirmFinish.value = false
  game.value = null
  savedGame.value = loadSave()
  screen.value = 'title'
}

onBeforeUnmount(() => {
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="app-root">
    <Transition name="screen" mode="out-in">
      <TitleScreen
        v-if="screen === 'title'"
        key="title"
        :save-info="saveInfo"
        :best-record="bestRecord"
        @start="startGame"
        @continue="continueGame"
      />

      <div v-else-if="game" key="game" class="game-screen">
        <GameHeader
          :game="game"
          :busy="busy"
          @end-day="advanceDay"
          @help="helpOpen = true"
          @exit="leaveToTitle"
        />
        <TickerTape :game="game" />

        <main class="game-main">
          <MarketPanel
            class="market-column"
            :game="game"
            :selected-id="selectedStock ? selectedStock.id : ''"
            @select="selectStock"
          />

          <div class="center-column">
            <section
              v-if="selectedStock"
              class="quote-panel cyber-panel"
              :style="{ '--accent': accent }"
            >
              <header class="quote-head">
                <div class="quote-identity">
                  <div class="quote-meta">
                    <span class="sector-pill">{{ selectedStock.sector }}</span>
                    <span class="quote-code mono">
                      {{ selectedStock.code }} / NCI-12
                    </span>
                    <span v-if="selectedHolding" class="holding-pill mono">
                      HOLD {{ selectedHolding.shares }} 股 · 均价
                      {{ formatPrice(selectedHolding.avgCost) }}
                    </span>
                  </div>
                  <h2 class="quote-name">{{ selectedStock.name }}</h2>
                  <p class="quote-description">{{ selectedStock.description }}</p>
                </div>

                <div class="quote-price-block">
                  <span class="quote-price-label mono">LAST PRICE</span>
                  <strong
                    class="quote-price num"
                    :class="selectedChange >= 0 ? 'up' : 'down'"
                  >
                    <small>₱</small>{{ formatPrice(selectedStock.price) }}
                  </strong>
                  <span
                    class="quote-change mono"
                    :class="selectedChange >= 0 ? 'up' : 'down'"
                  >
                    {{ formatPercent(selectedChange) }}
                    <em>今日</em>
                  </span>
                </div>
              </header>

              <div class="quote-stats">
                <div
                  v-for="stat in quoteStats"
                  :key="stat.label"
                  class="quote-stat"
                >
                  <span>{{ stat.label }}</span>
                  <strong class="mono" :class="stat.tone">{{ stat.value }}</strong>
                </div>
              </div>

              <div
                v-if="stockIntel.length"
                class="intel-strip"
                :class="intelTone"
              >
                <span class="intel-tag mono">SIGNAL</span>
                <span class="intel-count">{{ stockIntel.length }} 条情报</span>
                <span class="intel-verdict" :class="intelTone">
                  {{ intelVerdict }}
                </span>
                <span class="intel-title">{{ stockIntel[0].title }}</span>
              </div>

              <div class="chart-frame">
                <StockChart
                  :stock="selectedStock"
                  :trades="game.trades"
                  :prehistory-length="game.prehistoryLength"
                  :accent="accent"
                />
                <div class="chart-legend">
                  <span class="legend-buy"><i></i>买入 {{ buyCount }}</span>
                  <span class="legend-sell"><i></i>卖出 {{ sellCount }}</span>
                  <span class="legend-note mono">HOVER FOR DETAIL</span>
                </div>
              </div>
            </section>

            <PortfolioPanel
              class="portfolio-card"
              :game="game"
              @select="selectStock"
              @finish="confirmFinish = true"
            />
          </div>

          <div class="side-column">
            <TradePanel
              v-if="selectedStock"
              class="trade-card"
              :stock="selectedStock"
              :cash="game.cash"
              :holding="selectedHolding"
              :fee-rate="FEE_RATE"
              @trade="handleTrade"
            />
            <NewsPanel class="news-card" :game="game" />
          </div>
        </main>
      </div>
    </Transition>

    <HelpModal v-if="helpOpen" @close="helpOpen = false" />

    <ConfirmDialog
      v-if="confirmFinish && game"
      eyebrow="ENDLESS PROTOCOL"
      title="切断交易连接？"
      :description="`当前资产 ₱${formatMoney(computeNetWorth(game))}，本轮已收盘 ${game.dailyReports.length} 次。离场后将立刻结算评级，无法继续本局。`"
      confirm-label="结算离场"
      cancel-label="继续交易"
      danger
      @confirm="finishEndless"
      @cancel="confirmFinish = false"
    />

    <ResultModal
      v-if="resultData"
      :result="resultData"
      :is-new-record="isNewRecord"
      @replay="replay"
      @home="goHome"
    />

    <Transition name="toast">
      <div
        v-if="toast"
        class="toast"
        :class="`is-${toast.type}`"
        role="status"
        aria-live="polite"
      >
        <span class="toast-tag mono">
          {{ toast.type === 'ok' ? 'EXECUTED' : toast.type === 'error' ? 'ALERT' : 'SYSTEM' }}
        </span>
        <p>{{ toast.message }}</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.game-screen {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.game-main {
  display: grid;
  grid-template-columns:
    minmax(258px, 288px)
    minmax(0, 1fr)
    minmax(316px, 348px);
  gap: 13px;
  align-items: start;
  max-width: 1760px;
  margin: 0 auto;
  padding: 13px;
}

.market-column {
  min-width: 0;
}

.center-column {
  display: flex;
  flex-direction: column;
  gap: 13px;
  min-width: 0;
  max-height: calc(100vh - 142px);
}

.side-column {
  display: flex;
  flex-direction: column;
  gap: 13px;
  min-width: 0;
  max-height: calc(100vh - 142px);
  overflow-y: auto;
  padding-right: 2px;
}

.side-column::-webkit-scrollbar {
  width: 4px;
}

.side-column::-webkit-scrollbar-thumb {
  background: rgba(88, 247, 255, 0.18);
}

.portfolio-card {
  flex: 1 1 0;
  min-height: 0;
}

/* 报价面板 */
.quote-panel {
  --accent: var(--cyan);
  position: relative;
  flex: 0 0 auto;
  overflow: hidden;
}

.quote-panel::before {
  background: var(--accent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 70%, transparent);
}

.quote-head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 17px 20px 15px;
  border-bottom: 1px solid var(--line);
}

.quote-head::after {
  content: '';
  position: absolute;
  top: -40px;
  right: -10px;
  width: 220px;
  height: 120px;
  pointer-events: none;
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--accent) 13%, transparent),
    transparent 68%
  );
}

.quote-identity {
  min-width: 0;
}

.quote-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 7px;
}

.sector-pill {
  padding: 2px 8px;
  color: var(--accent);
  border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  font-size: 9.5px;
  letter-spacing: 0.12em;
}

.quote-code {
  color: var(--dim);
  font-size: 10px;
  letter-spacing: 0.1em;
}

.holding-pill {
  padding: 2px 7px;
  color: var(--mint);
  border: 1px solid rgba(84, 255, 178, 0.24);
  background: rgba(84, 255, 178, 0.06);
  font-size: 9px;
  letter-spacing: 0.06em;
}

.quote-name {
  font-family: var(--font-display);
  font-size: clamp(20px, 1.7vw, 25px);
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.2;
}

.quote-description {
  max-width: 470px;
  margin-top: 5px;
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.5;
}

.quote-price-block {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  text-align: right;
}

.quote-price-label {
  color: var(--dim);
  font-size: 8.5px;
  letter-spacing: 0.16em;
}

.quote-price {
  font-family: var(--font-display);
  font-size: clamp(27px, 2.4vw, 38px);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.05;
  text-shadow: 0 0 16px color-mix(in srgb, currentColor 30%, transparent);
}

.quote-price small {
  margin-right: 2px;
  font-size: 0.48em;
  opacity: 0.65;
}

.quote-change {
  font-size: 11.5px;
  letter-spacing: 0.03em;
}

.quote-change em {
  margin-left: 4px;
  color: var(--dim);
  font-size: 9px;
  font-style: normal;
}

.quote-stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  border-bottom: 1px solid var(--line);
}

.quote-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 16px;
  border-right: 1px solid rgba(118, 228, 255, 0.07);
}

.quote-stat:last-child {
  border-right: 0;
}

.quote-stat span {
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8.5px;
  letter-spacing: 0.1em;
}

.quote-stat strong {
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 500;
}

.intel-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 20px;
  border-bottom: 1px solid var(--line);
  background: rgba(88, 247, 255, 0.028);
  font-size: 10.5px;
}

.intel-tag {
  flex: none;
  color: var(--dim);
  font-size: 8px;
  letter-spacing: 0.14em;
}

.intel-count {
  flex: none;
  color: var(--text-soft);
  font-size: 10px;
  white-space: nowrap;
}

.intel-verdict {
  flex: none;
  padding: 1px 6px;
  border: 1px solid transparent;
  font-size: 9.5px;
  white-space: nowrap;
}

.intel-verdict.tone-up {
  color: var(--mint);
  border-color: rgba(84, 255, 178, 0.3);
  background: rgba(84, 255, 178, 0.07);
}

.intel-verdict.tone-down {
  color: var(--pink);
  border-color: rgba(255, 63, 145, 0.3);
  background: rgba(255, 63, 145, 0.07);
}

.intel-verdict.tone-neutral {
  color: var(--muted);
  border-color: var(--line);
  background: rgba(127, 148, 169, 0.05);
}

.intel-title {
  overflow: hidden;
  color: var(--muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chart-frame {
  position: relative;
  height: clamp(214px, 27vh, 292px);
  background: radial-gradient(
    ellipse at 62% 18%,
    color-mix(in srgb, var(--accent) 7%, transparent),
    transparent 66%
  );
}

.chart-legend {
  position: absolute;
  top: 6px;
  left: 14px;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--dim);
  font-size: 9px;
  pointer-events: none;
}

.chart-legend i {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 4px;
  transform: rotate(45deg);
  vertical-align: 1px;
}

.legend-buy i {
  background: var(--mint);
  box-shadow: 0 0 6px rgba(84, 255, 178, 0.7);
}

.legend-sell i {
  background: var(--pink);
  box-shadow: 0 0 6px rgba(255, 63, 145, 0.7);
}

.legend-note {
  color: #38495b;
  font-size: 7.5px;
  letter-spacing: 0.12em;
}

/* 全局提示 */
.toast {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 210;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 250px;
  max-width: 380px;
  padding: 11px 15px;
  border: 1px solid var(--line-strong);
  border-left: 2px solid var(--cyan);
  background: rgba(6, 12, 20, 0.97);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.58);
  backdrop-filter: blur(12px);
}

.toast.is-ok {
  border-left-color: var(--mint);
}

.toast.is-error {
  border-left-color: var(--danger);
}

.toast-tag {
  flex: none;
  padding-top: 1px;
  color: var(--dim);
  font-size: 8px;
  letter-spacing: 0.12em;
}

.toast p {
  color: var(--text-soft);
  font-size: 11.5px;
  line-height: 1.5;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 240ms ease,
    transform 280ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 1240px) and (min-width: 931px) {
  .game-main {
    grid-template-columns: 246px minmax(0, 1fr) 304px;
  }

  .center-column,
  .side-column {
    max-height: calc(100vh - 174px);
  }
}

@media (max-width: 1180px) {
  .quote-head {
    flex-direction: column;
    gap: 10px;
  }

  .quote-price-block {
    flex-direction: row;
    align-items: baseline;
    gap: 10px;
  }

  .quote-price-label {
    display: none;
  }
}

@media (max-width: 930px) {
  .game-main {
    grid-template-columns: minmax(0, 1fr);
  }

  .center-column,
  .side-column {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .portfolio-card {
    flex: none;
  }

  .quote-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .quote-stat {
    border-bottom: 1px solid rgba(118, 228, 255, 0.07);
  }

  .quote-stat:nth-child(3n) {
    border-right: 0;
  }

  .quote-stat:nth-child(n + 4) {
    border-bottom: 0;
  }

  .chart-frame {
    height: clamp(220px, 46vw, 320px);
  }
}

@media (max-width: 560px) {
  .game-main {
    padding: 9px;
    gap: 9px;
  }

  .quote-head {
    padding: 14px;
  }

  .quote-description {
    font-size: 11px;
  }

  .quote-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .quote-stat {
    padding: 8px 12px;
  }

  .quote-stat strong {
    font-size: 11px;
  }

  .intel-strip {
    gap: 7px;
    padding: 6px 14px;
  }

  .intel-title {
    display: none;
  }

  .legend-note {
    display: none;
  }

  .toast {
    right: 10px;
    bottom: 10px;
    left: 10px;
    min-width: 0;
    max-width: none;
  }
}
</style>
