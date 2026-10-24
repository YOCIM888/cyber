<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { formatMoney, formatPercent, formatSignedMoney } from '../game/format'

const props = defineProps({
  result: { type: Object, required: true },
  isNewRecord: { type: Boolean, default: false },
})

const emit = defineEmits(['replay', 'home'])

const isCampaign = computed(() => props.result.mode === 'campaign')
const rank = computed(() => props.result.rank)
const benchmarkMax = computed(() =>
  Math.max(0.08, Math.abs(props.result.totalReturn), Math.abs(props.result.indexReturn)),
)
const selfBarWidth = computed(() =>
  Math.min(100, (Math.abs(props.result.totalReturn) / benchmarkMax.value) * 100),
)
const indexBarWidth = computed(() =>
  Math.min(100, (Math.abs(props.result.indexReturn) / benchmarkMax.value) * 100),
)
const resultVerb = computed(() => (isCampaign.value ? '完成 10 次收盘' : '主动切断交易连接'))

onMounted(() => {
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div class="result-shell" :class="`tone-${rank.tone}`">
        <div class="result-bg" aria-hidden="true">
          <span class="result-bg-word mono">TERMINAL</span>
          <span class="result-scan"></span>
        </div>

        <header class="result-topbar">
          <div class="result-brand">
            <span class="result-brand-mark">NX</span>
            <span class="mono">NEON EXCHANGE / SETTLEMENT ENGINE</span>
          </div>
          <span class="result-status mono">
            <i></i>
            SESSION TERMINATED
          </span>
        </header>

        <div class="result-main">
          <section class="rank-section">
            <span class="eyebrow">
              {{ isCampaign ? '10 DAY PROTOCOL / FINAL' : 'ENDLESS PROTOCOL / MANUAL EXIT' }}
            </span>
            <div class="rank-title-row">
              <h2 id="result-title" class="rank-grade">{{ rank.grade }}</h2>
              <div class="rank-copy">
                <span class="rank-label">{{ rank.label }}</span>
                <span class="rank-verb mono">{{ resultVerb }}</span>
              </div>
            </div>
            <p class="rank-blurb">{{ rank.blurb }}</p>

            <div class="result-asset">
              <span>最终资产 / FINAL CAPITAL</span>
              <strong class="num">₱{{ formatMoney(result.netWorth) }}</strong>
              <span class="result-return num" :class="result.totalReturn >= 0 ? 'up' : 'down'">
                {{ formatPercent(result.totalReturn) }} 总收益
              </span>
            </div>

            <div v-if="isNewRecord" class="new-record">
              <span class="mono">NEW LOCAL RECORD</span>
              <span>已刷新你的本地最佳战绩</span>
            </div>
          </section>

          <section class="result-data">
            <div class="result-block">
              <div class="result-block-head">
                <span class="eyebrow">PERFORMANCE VS BENCHMARK</span>
                <span class="mono result-days">{{ result.daysPlayed }} CLOSES</span>
              </div>

              <div class="benchmark-bars">
                <div class="benchmark-row">
                  <span class="benchmark-name">你的账户</span>
                  <span class="benchmark-track">
                    <i
                      class="benchmark-fill self-fill"
                      :class="result.totalReturn >= 0 ? 'is-up' : 'is-down'"
                      :style="{ width: `${selfBarWidth}%` }"
                    ></i>
                  </span>
                  <strong class="num" :class="result.totalReturn >= 0 ? 'up' : 'down'">
                    {{ formatPercent(result.totalReturn) }}
                  </strong>
                </div>
                <div class="benchmark-row">
                  <span class="benchmark-name">霓虹综指</span>
                  <span class="benchmark-track">
                    <i
                      class="benchmark-fill index-fill"
                      :class="result.indexReturn >= 0 ? 'is-up' : 'is-down'"
                      :style="{ width: `${indexBarWidth}%` }"
                    ></i>
                  </span>
                  <strong class="num" :class="result.indexReturn >= 0 ? 'up' : 'down'">
                    {{ formatPercent(result.indexReturn) }}
                  </strong>
                </div>
              </div>

              <div class="result-verdict" :class="result.excessReturn >= 0 ? 'up' : 'down'">
                {{ result.excessReturn >= 0 ? '跑赢指数' : '落后指数' }}
                <b class="num">{{ formatPercent(result.excessReturn) }}</b>
              </div>
            </div>

            <div class="stat-grid">
              <div class="result-stat">
                <span>最大回撤</span>
                <strong class="num">{{ formatPercent(-result.maxDrawdown) }}</strong>
              </div>
              <div class="result-stat">
                <span>交易次数</span>
                <strong class="num">{{ result.tradeCount }}</strong>
              </div>
              <div class="result-stat">
                <span>平仓胜率</span>
                <strong class="num">
                  {{ result.sellCount ? formatPercent(result.winRate, 0).replace('+', '') : '—' }}
                </strong>
              </div>
              <div class="result-stat">
                <span>已实现盈亏</span>
                <strong class="num" :class="result.realizedPnl >= 0 ? 'up' : 'down'">
                  {{ result.realizedPnl >= 0 ? '+' : '-' }}₱{{ formatMoney(Math.abs(result.realizedPnl)) }}
                </strong>
              </div>
            </div>

            <div class="result-settlement">
              <span class="mono">SETTLEMENT COMPLETE</span>
              <span>本局数据已记入本地战绩。市场会继续运行，账户却不会。</span>
            </div>
          </section>
        </div>

        <footer class="result-footer">
          <div class="result-footer-meta">
            <span class="mono">PUNK CAPITAL / NO REAL SECURITIES</span>
            <span class="mono">
              PEAK ₱{{ formatMoney(result.peakNetWorth) }}
              · {{ formatSignedMoney(result.realizedPnl) }} REALIZED
            </span>
          </div>
          <div class="result-actions">
            <button type="button" class="btn btn-primary" @click="emit('replay')">
              再来一局
              <span class="mono">↻</span>
            </button>
            <button type="button" class="btn" @click="emit('home')">返回主界面</button>
          </div>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.result-overlay {
  position: fixed;
  inset: 0;
  z-index: 320;
  display: grid;
  place-items: center;
  padding: 22px;
  overflow-y: auto;
  background:
    radial-gradient(circle at 30% 20%, rgba(88, 247, 255, 0.08), transparent 30%),
    rgba(1, 3, 7, 0.88);
  backdrop-filter: blur(11px);
  animation: backdrop-in 200ms ease both;
}

.result-shell {
  --tone-color: var(--cyan);
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(1040px, 100%);
  max-height: calc(100vh - 44px);
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--tone-color) 35%, transparent);
  background:
    linear-gradient(150deg, rgba(14, 24, 39, 0.98), rgba(4, 7, 12, 0.99)),
    #04070c;
  box-shadow:
    0 40px 120px rgba(0, 0, 0, 0.72),
    0 0 100px color-mix(in srgb, var(--tone-color) 8%, transparent);
  animation: modal-in 280ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.result-shell::before {
  content: '';
  position: absolute;
  top: 0;
  left: 34px;
  z-index: 3;
  width: 90px;
  height: 2px;
  background: var(--tone-color);
  box-shadow: 0 0 16px var(--tone-color);
}

.tone-myth {
  --tone-color: var(--amber);
}

.tone-legend {
  --tone-color: var(--cyan);
}

.tone-elite {
  --tone-color: var(--violet);
}

.tone-good {
  --tone-color: var(--mint);
}

.tone-stable {
  --tone-color: #8aa6bb;
}

.tone-warn {
  --tone-color: var(--amber);
}

.tone-danger {
  --tone-color: var(--pink);
}

.result-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.result-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(color-mix(in srgb, var(--tone-color) 3%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--tone-color) 3%, transparent) 1px, transparent 1px);
  background-size: 68px 68px;
  mask-image: linear-gradient(180deg, black, transparent 84%);
}

.result-bg::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -15%;
  width: 60%;
  aspect-ratio: 1;
  border: 1px solid color-mix(in srgb, var(--tone-color) 12%, transparent);
  border-radius: 50%;
  box-shadow: inset 0 0 80px color-mix(in srgb, var(--tone-color) 4%, transparent);
}

.result-bg-word {
  position: absolute;
  right: -20px;
  bottom: 4%;
  color: color-mix(in srgb, var(--tone-color) 4%, transparent);
  font-size: clamp(75px, 13vw, 170px);
  letter-spacing: -0.03em;
  line-height: 1;
}

.result-scan {
  position: absolute;
  top: 0;
  left: 32%;
  width: 1px;
  height: 100%;
  opacity: 0.25;
  background: linear-gradient(180deg, transparent, var(--tone-color), transparent);
}

.result-topbar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 46px;
  padding: 0 26px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.result-brand {
  display: flex;
  align-items: center;
  gap: 9px;
}

.result-brand-mark {
  color: var(--tone-color);
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 800;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--tone-color);
  font-size: 8px;
}

.result-status i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 7px currentColor;
}

.result-main {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  overflow-y: auto;
}

.rank-section {
  padding: clamp(26px, 4vw, 45px) clamp(24px, 3.4vw, 42px);
  border-right: 1px solid var(--line);
}

.rank-title-row {
  display: flex;
  align-items: center;
  gap: clamp(16px, 2.4vw, 26px);
  margin-top: 15px;
}

.rank-grade {
  color: var(--tone-color);
  font-family: var(--font-display);
  font-size: clamp(82px, 10vw, 136px);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 0.8;
  text-shadow:
    0 0 36px color-mix(in srgb, var(--tone-color) 38%, transparent),
    4px 0 0 rgba(255, 255, 255, 0.04);
}

.rank-copy {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rank-label {
  color: var(--text);
  font-size: clamp(18px, 2.2vw, 25px);
  font-weight: 600;
  letter-spacing: 0.07em;
}

.rank-verb {
  color: var(--muted);
  font-size: 8px;
  letter-spacing: 0.06em;
}

.rank-blurb {
  max-width: 390px;
  margin-top: 17px;
  padding-left: 13px;
  border-left: 1px solid color-mix(in srgb, var(--tone-color) 35%, transparent);
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.result-asset {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: clamp(23px, 4vh, 36px);
}

.result-asset > span:first-child {
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.1em;
}

.result-asset strong {
  color: var(--text);
  font-size: clamp(30px, 3.5vw, 43px);
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.015em;
}

.result-return {
  font-size: 12px;
  font-weight: 600;
}

.new-record {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 23px;
  padding: 9px 11px;
  border: 1px solid rgba(255, 209, 102, 0.25);
  background: rgba(255, 209, 102, 0.05);
}

.new-record span:first-child {
  color: var(--amber);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.new-record span:last-child {
  color: var(--muted);
  font-size: 9px;
}

.result-data {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(24px, 3.3vw, 38px);
}

.result-block {
  padding: 18px;
  border: 1px solid var(--line);
  background: rgba(3, 8, 14, 0.42);
}

.result-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.result-days {
  color: var(--dim);
  font-size: 8px;
}

.benchmark-bars {
  display: flex;
  flex-direction: column;
  gap: 13px;
  margin-top: 21px;
}

.benchmark-row {
  display: grid;
  grid-template-columns: 66px minmax(0, 1fr) 66px;
  align-items: center;
  gap: 11px;
}

.benchmark-name {
  color: var(--muted);
  font-size: 9.5px;
}

.benchmark-track {
  position: relative;
  height: 4px;
  overflow: hidden;
  background: rgba(126, 166, 197, 0.12);
}

.benchmark-fill {
  display: block;
  height: 100%;
  min-width: 2px;
  transition: width 700ms cubic-bezier(0.2, 0.7, 0.2, 1);
}

.self-fill.is-up {
  background: var(--mint);
  box-shadow: 0 0 10px rgba(84, 255, 178, 0.4);
}

.self-fill.is-down {
  background: var(--pink);
  box-shadow: 0 0 10px rgba(255, 63, 145, 0.4);
}

.index-fill.is-up {
  background: rgba(88, 247, 255, 0.7);
}

.index-fill.is-down {
  background: rgba(255, 209, 102, 0.7);
}

.benchmark-row strong {
  font-size: 11px;
  font-weight: 600;
  text-align: right;
}

.result-verdict {
  margin-top: 17px;
  padding-top: 12px;
  border-top: 1px dashed var(--line);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.04em;
}

.result-verdict b {
  margin-left: 7px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  border: 1px solid var(--line);
  background: var(--line);
}

.result-stat {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 13px 16px;
  background: #060c15;
}

.result-stat span {
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.04em;
}

.result-stat strong {
  color: var(--text-soft);
  font-size: 16px;
  font-weight: 500;
}

.result-settlement {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: auto;
  padding-top: 6px;
  color: var(--dim);
  font-size: 8.5px;
  line-height: 1.5;
}

.result-settlement span:first-child {
  color: color-mix(in srgb, var(--tone-color) 55%, transparent);
  font-size: 7px;
  letter-spacing: 0.1em;
}

.result-footer {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 17px 26px;
  border-top: 1px solid var(--line);
  background: rgba(4, 8, 14, 0.72);
}

.result-footer-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #405262;
  font-size: 7.5px;
  letter-spacing: 0.04em;
}

.result-actions {
  display: flex;
  gap: 8px;
  flex: none;
}

.result-actions .btn {
  min-width: 120px;
  min-height: 41px;
}

.result-actions .mono {
  font-size: 13px;
}

@media (max-width: 830px) {
  .result-overlay {
    align-items: start;
    padding: 12px;
  }

  .result-shell {
    max-height: calc(100vh - 24px);
  }

  .result-main {
    grid-template-columns: 1fr;
  }

  .rank-section {
    padding: 26px 22px 24px;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }

  .result-data {
    padding: 22px;
  }

  .rank-title-row {
    gap: 18px;
  }

  .rank-grade {
    font-size: 92px;
  }

  .result-asset {
    margin-top: 24px;
  }

  .result-footer {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
    padding: 16px 22px;
  }

  .result-actions {
    width: 100%;
  }

  .result-actions .btn {
    flex: 1;
  }

  .result-footer-meta {
    flex-direction: row;
    justify-content: space-between;
    gap: 12px;
    font-size: 6.5px;
  }
}

@media (max-width: 520px) {
  .result-topbar {
    padding: 0 18px;
  }

  .result-brand > span:last-child,
  .result-status {
    font-size: 7px;
  }

  .rank-section {
    padding: 23px 18px 21px;
  }

  .rank-title-row {
    margin-top: 12px;
  }

  .rank-grade {
    font-size: 78px;
  }

  .rank-label {
    font-size: 19px;
  }

  .rank-blurb {
    margin-top: 13px;
    font-size: 11px;
  }

  .result-asset strong {
    font-size: 31px;
  }

  .result-data {
    padding: 18px;
  }

  .result-block {
    padding: 14px;
  }

  .benchmark-row {
    grid-template-columns: 53px minmax(0, 1fr) 57px;
    gap: 8px;
  }

  .benchmark-name {
    font-size: 8.5px;
  }

  .result-stat {
    padding: 11px 12px;
  }

  .result-stat strong {
    font-size: 14px;
  }

  .result-footer {
    padding: 14px 18px;
  }

  .result-footer-meta span:last-child {
    display: none;
  }

  .result-actions {
    flex-direction: column-reverse;
  }

  .result-actions .btn {
    width: 100%;
    min-height: 40px;
  }
}
</style>
