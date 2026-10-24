<script setup>
import { computed } from 'vue'
import { CAMPAIGN_DAYS } from '../game/stocks'
import { computeNetWorth } from '../game/engine'
import { formatMoney, formatPercent } from '../game/format'

const props = defineProps({
  game: { type: Object, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['end-day', 'help', 'exit'])

const isCampaign = computed(() => props.game.mode === 'campaign')
const isLastDay = computed(() => isCampaign.value && props.game.day >= CAMPAIGN_DAYS)
const completedDays = computed(() => props.game.dailyReports.length)
const netWorth = computed(() => computeNetWorth(props.game))
const totalReturn = computed(() => netWorth.value / props.game.startingCash - 1)
const totalPnl = computed(() => netWorth.value - props.game.startingCash)
const dayLabel = computed(() => String(props.game.day).padStart(2, '0'))

const actionLabel = computed(() => {
  if (props.busy) return '结算中'
  if (isLastDay.value) return '收盘结算'
  return '结束今日'
})

const modeLabel = computed(() => (isCampaign.value ? '10 日协议' : '无尽协议'))
</script>

<template>
  <header class="game-header">
    <div class="header-brand">
      <div class="brand-mark">NX</div>
      <div class="brand-text">
        <strong>NEON EXCHANGE</strong>
        <span>
          <i></i>
          夜之城证券终端
        </span>
      </div>
    </div>

    <div class="header-session">
      <div class="session-topline">
        <span class="session-mode">{{ modeLabel }}</span>
        <span class="session-live mono">
          <i></i>
          SIM LIVE
        </span>
      </div>
      <div class="session-day">
        <span class="mono day-label">DAY</span>
        <strong class="mono">{{ dayLabel }}</strong>
        <span class="day-total mono">/ {{ isCampaign ? String(CAMPAIGN_DAYS).padStart(2, '0') : '∞' }}</span>
      </div>
      <div v-if="isCampaign" class="day-progress" :aria-label="`已完成 ${completedDays} 个交易日`">
        <span
          v-for="day in CAMPAIGN_DAYS"
          :key="day"
          class="day-pip"
          :class="{
            done: day <= completedDays,
            current: day === game.day && !isLastDay,
            final: isLastDay && day === CAMPAIGN_DAYS,
          }"
        ></span>
      </div>
      <div v-else class="endless-meter">
        <span class="endless-mark">∞</span>
        <span class="mono">已完成 {{ completedDays }} 次收盘</span>
      </div>
    </div>

    <div class="header-metrics">
      <div class="header-metric metric-primary">
        <span>总资产</span>
        <strong class="num">₱{{ formatMoney(netWorth) }}</strong>
      </div>
      <div class="header-metric">
        <span>可用现金</span>
        <strong class="num">₱{{ formatMoney(game.cash) }}</strong>
      </div>
      <div class="header-metric">
        <span>累计收益</span>
        <strong class="num" :class="totalReturn >= 0 ? 'up' : 'down'">
          {{ formatPercent(totalReturn) }}
        </strong>
        <small class="num" :class="totalPnl >= 0 ? 'up' : 'down'">
          {{ totalPnl >= 0 ? '+' : '-' }}₱{{ formatMoney(Math.abs(totalPnl)) }}
        </small>
      </div>
    </div>

    <div class="header-actions">
      <div class="header-icon-group">
        <button
          type="button"
          class="icon-button"
          title="交易手册"
          aria-label="打开交易手册"
          @click="emit('help')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M9.8 9.2a2.3 2.3 0 1 1 3.1 2.2c-.7.3-.9.8-.9 1.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <circle cx="12" cy="16.1" r="0.9" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          class="icon-button"
          title="返回主界面"
          aria-label="返回主界面"
          @click="emit('exit')"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              d="M9 5H6v14h3M14 8l4 4-4 4M8 12h10"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="square"
            />
          </svg>
        </button>
      </div>

      <button
        type="button"
        class="btn btn-primary end-day-button"
        :disabled="busy"
        @click="emit('end-day')"
      >
        <span class="end-day-copy">
          <span class="end-day-main">{{ actionLabel }}</span>
          <span class="end-day-sub mono">{{ isLastDay ? 'FINAL CLOSE' : 'CLOSE THE DAY' }}</span>
        </span>
        <svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true">
          <path
            d="M3 10h12M11 6l5 4-5 4"
            fill="none"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="square"
          />
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.game-header {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: clamp(16px, 2vw, 31px);
  min-height: 82px;
  padding: 0 clamp(14px, 2.2vw, 30px);
  border-bottom: 1px solid rgba(118, 228, 255, 0.13);
  background:
    linear-gradient(180deg, rgba(7, 12, 20, 0.96), rgba(4, 8, 14, 0.9)),
    rgba(5, 9, 15, 0.94);
  backdrop-filter: blur(18px);
}

.game-header::before {
  content: '';
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(88, 247, 255, 0.18) 23%, transparent 52%, rgba(255, 63, 145, 0.14) 78%, transparent);
  pointer-events: none;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  flex: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 35px;
  height: 35px;
  color: #031012;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--cyan), #66ffcf);
  clip-path: polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%);
  box-shadow: 0 0 22px rgba(88, 247, 255, 0.2);
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.brand-text strong {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.14em;
}

.brand-text span {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--dim);
  font-size: 9px;
  letter-spacing: 0.1em;
}

.brand-text i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--mint);
  box-shadow: 0 0 6px rgba(84, 255, 178, 0.7);
}

.header-session {
  display: flex;
  flex-direction: column;
  flex: none;
  gap: 7px;
  min-width: 150px;
  padding-left: clamp(15px, 2vw, 28px);
  border-left: 1px solid var(--line);
}

.session-topline {
  display: flex;
  align-items: center;
  gap: 13px;
}

.session-mode {
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.13em;
}

.session-live {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--dim);
  font-size: 8px;
  letter-spacing: 0.07em;
}

.session-live i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--pink);
  animation: pulse-dot 1.7s ease-in-out infinite;
}

.session-day {
  display: flex;
  align-items: baseline;
  gap: 5px;
  line-height: 1;
}

.day-label {
  color: var(--dim);
  font-size: 9px;
  letter-spacing: 0.1em;
}

.session-day strong {
  color: var(--text);
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.day-total {
  color: var(--muted);
  font-size: 10px;
}

.day-progress {
  display: flex;
  gap: 3px;
  width: 100%;
  max-width: 137px;
}

.day-pip {
  height: 2px;
  flex: 1;
  background: rgba(126, 166, 197, 0.16);
  transition:
    background 260ms ease,
    box-shadow 260ms ease;
}

.day-pip.done {
  background: rgba(88, 247, 255, 0.6);
}

.day-pip.current {
  background: var(--pink);
  box-shadow: 0 0 8px rgba(255, 63, 145, 0.65);
}

.day-pip.final {
  background: var(--amber);
  box-shadow: 0 0 8px rgba(255, 209, 102, 0.45);
}

.endless-meter {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--dim);
  font-size: 8px;
  letter-spacing: 0.05em;
}

.endless-mark {
  color: var(--violet);
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1;
}

.header-metrics {
  display: flex;
  align-items: stretch;
  gap: clamp(17px, 2.2vw, 35px);
  margin-left: auto;
}

.header-metric {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  min-width: 95px;
}

.header-metric > span {
  color: var(--dim);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.1em;
}

.header-metric strong {
  color: var(--text-soft);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.015em;
  line-height: 1.1;
}

.header-metric.metric-primary strong {
  color: var(--cyan);
  font-size: 19px;
  text-shadow: 0 0 16px rgba(88, 247, 255, 0.16);
}

.header-metric small {
  font-size: 10px;
  opacity: 0.8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}

.header-icon-group {
  display: flex;
  gap: 5px;
}

.end-day-button {
  min-width: 134px;
  min-height: 49px;
  justify-content: space-between;
  padding: 0 15px 0 17px;
  text-align: left;
}

.end-day-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.end-day-main {
  color: #031014;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.1;
}

.end-day-sub {
  color: rgba(3, 16, 20, 0.55);
  font-size: 7px;
  letter-spacing: 0.11em;
}

@media (max-width: 1240px) {
  .game-header {
    flex-wrap: wrap;
    gap: 13px 24px;
    padding-top: 13px;
    padding-bottom: 13px;
  }

  .header-session {
    min-width: 128px;
  }

  .header-metrics {
    gap: 17px;
  }

  .header-metric {
    min-width: 82px;
  }

  .header-actions {
    margin-left: auto;
  }
}

@media (max-width: 930px) {
  .game-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 11px 15px;
    padding: 13px 16px;
  }

  .header-brand {
    grid-column: 1;
    grid-row: 1;
  }

  .header-actions {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
  }

  .header-session {
    grid-column: 1;
    grid-row: 2;
    padding-left: 0;
    border-left: 0;
    min-width: 0;
  }

  .session-topline {
    gap: 9px;
  }

  .day-progress {
    max-width: 122px;
  }

  .header-metrics {
    display: none;
  }

  .header-actions {
    gap: 8px;
  }

  .header-icon-group {
    flex-direction: column;
    gap: 5px;
  }

  .header-icon-group .icon-button {
    width: 27px;
    height: 27px;
  }

  .end-day-button {
    min-width: 117px;
    min-height: 44px;
    padding-right: 12px;
    padding-left: 13px;
  }

  .end-day-main {
    font-size: 12px;
  }
}

@media (max-width: 520px) {
  .brand-text strong {
    font-size: 10px;
    letter-spacing: 0.1em;
  }

  .brand-text span {
    font-size: 8px;
  }

  .session-day strong {
    font-size: 18px;
  }

  .session-topline {
    display: none;
  }

  .header-session {
    gap: 5px;
  }

  .endless-meter {
    font-size: 7px;
  }

  .end-day-sub {
    display: none;
  }

  .end-day-button {
    min-width: 96px;
    min-height: 39px;
  }

  .end-day-button svg {
    width: 14px;
  }
}

@media (max-width: 360px) {
  .brand-text {
    display: none;
  }

  .header-actions {
    gap: 6px;
  }

  .end-day-button {
    min-width: 88px;
    padding: 0 9px 0 10px;
  }
}
</style>
