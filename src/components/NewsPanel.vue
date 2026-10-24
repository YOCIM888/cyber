<script setup>
import { computed, ref, watch } from 'vue'
import { formatMoney, formatPercent } from '../game/format'

const props = defineProps({
  game: { type: Object, required: true },
})

const activeTab = ref('intel')

const intel = computed(() => props.game.intel || [])
const reports = computed(() => [...props.game.dailyReports].reverse())

watch(
  () => props.game.day,
  () => {
    if (activeTab.value === 'log') activeTab.value = 'intel'
  },
)

function scopeClass(item) {
  return item.scope === 'market' ? 'scope-market' : item.scope === 'sector' ? 'scope-sector' : 'scope-stock'
}

function tierLabel(tier) {
  return tier === 3 ? '强' : tier === 2 ? '中' : '弱'
}
</script>

<template>
  <section class="news-panel cyber-panel">
    <header class="panel-head news-head">
      <div class="panel-headline">
        <span class="eyebrow">INTEL FEED / UNDERGROUND</span>
        <h2 class="panel-title">街头情报 <small>PRE-CLOSE</small></h2>
      </div>
      <span class="live-status">INTERCEPT</span>
    </header>

    <div class="news-tabs">
      <button
        type="button"
        class="news-tab"
        :class="{ active: activeTab === 'intel' }"
        @click="activeTab = 'intel'"
      >
        今日情报
        <span class="tab-count mono">{{ intel.length }}</span>
      </button>
      <button
        type="button"
        class="news-tab"
        :class="{ active: activeTab === 'log' }"
        @click="activeTab = 'log'"
      >
        收盘记录
        <span class="tab-count mono">{{ reports.length }}</span>
      </button>
    </div>

    <div v-if="activeTab === 'intel'" class="intel-list">
      <article
        v-for="item in intel"
        :key="item.id"
        class="intel-card"
        :class="item.sentiment >= 0 ? 'positive' : 'negative'"
      >
        <div class="intel-topline">
          <span class="scope-chip" :class="scopeClass(item)">{{ item.scopeLabel }}</span>
          <span class="sentiment-label" :class="item.sentiment >= 0 ? 'up' : 'down'">
            <span>{{ item.sentiment >= 0 ? '↗' : '↘' }}</span>
            {{ item.sentiment >= 0 ? '利好' : '利空' }}
          </span>
          <span class="confidence mono">可信度 {{ Math.round(item.confidence * 100) }}%</span>
        </div>

        <h3>{{ item.title }}</h3>
        <p>{{ item.detail }}</p>

        <div class="intel-footer">
          <span class="intel-source mono">
            <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden="true">
              <circle cx="6" cy="6" r="2" fill="none" stroke="currentColor" stroke-width="1" />
              <path d="M6 1v2M6 9v2M1 6h2M9 6h2" stroke="currentColor" stroke-width="1" />
            </svg>
            {{ item.source }}
          </span>
          <span class="impact">
            <span class="impact-label mono">信号强度</span>
            <span class="impact-bars" :class="`tier-${item.tier}`">
              <i></i><i></i><i></i>
            </span>
            <span class="mono impact-word">{{ tierLabel(item.tier) }}</span>
          </span>
        </div>
        <div class="target-line">
          <span class="mono">TARGET</span>
          {{ item.targetLabel }}
        </div>
      </article>

      <div v-if="!intel.length" class="intel-empty">
        <span class="empty-signal mono">NO SIGNAL</span>
        <p>今日情报已归档。查看收盘记录复盘上一交易日的市场反应。</p>
      </div>
    </div>

    <div v-else class="log-list">
      <article v-for="report in reports" :key="report.day" class="log-card">
        <div class="log-topline">
          <span class="log-day mono">D{{ String(report.day).padStart(2, '0') }} CLOSED</span>
          <span class="log-index num" :class="report.indexChange >= 0 ? 'up' : 'down'">
            NCI {{ formatPercent(report.indexChange) }}
          </span>
        </div>
        <div class="log-assets">
          <span>
            收盘资产
            <strong class="num">₱{{ formatMoney(report.netWorth) }}</strong>
          </span>
          <span class="num" :class="report.netWorthChange >= 0 ? 'up' : 'down'">
            {{ report.netWorthChange >= 0 ? '+' : '-' }}₱{{ formatMoney(Math.abs(report.netWorthChange)) }}
          </span>
        </div>
        <div class="log-movers">
          <span class="up">
            <b>TOP</b>
            {{ report.topGainer?.name }}
            {{ formatPercent(report.topGainer?.change) }}
          </span>
          <span class="down">
            <b>LOW</b>
            {{ report.topLoser?.name }}
            {{ formatPercent(report.topLoser?.change) }}
          </span>
        </div>
      </article>

      <div v-if="!reports.length" class="intel-empty">
        <span class="empty-signal mono">AWAITING CLOSE</span>
        <p>完成第一次收盘后，这里会留下市场的当日切片。</p>
      </div>
    </div>

    <footer class="news-footer">
      <span>
        <i></i>
        情报将在今日收盘时兑现，可信度不等于结果
      </span>
    </footer>
  </section>
</template>

<style scoped>
.news-panel {
  display: flex;
  flex-direction: column;
  min-height: 308px;
  overflow: hidden;
}

.news-head {
  padding: 14px 17px 13px;
}

.news-tabs {
  display: flex;
  flex: none;
  padding: 0 10px;
  border-bottom: 1px solid var(--line);
}

.news-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: 1;
  min-height: 37px;
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

.news-tab:hover {
  color: var(--text-soft);
}

.news-tab.active {
  border-bottom-color: var(--pink);
  color: var(--text);
}

.tab-count {
  color: var(--muted);
  font-size: 8px;
}

.intel-list,
.log-list {
  overflow-y: auto;
  max-height: 380px;
  padding: 10px 11px 12px;
  overscroll-behavior: contain;
}

.intel-card {
  position: relative;
  padding: 12px 12px 11px;
  border: 1px solid rgba(118, 228, 255, 0.1);
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.015), transparent 50%),
    rgba(4, 8, 14, 0.5);
}

.intel-card + .intel-card {
  margin-top: 8px;
}

.intel-card::before {
  content: '';
  position: absolute;
  top: 11px;
  bottom: 11px;
  left: 0;
  width: 2px;
  background: var(--mint);
  opacity: 0.68;
}

.intel-card.negative::before {
  background: var(--pink);
}

.intel-topline {
  display: flex;
  align-items: center;
  gap: 7px;
}

.scope-chip {
  display: inline-flex;
  align-items: center;
  height: 17px;
  padding: 0 6px;
  border: 1px solid rgba(88, 247, 255, 0.18);
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 7px;
  letter-spacing: 0.06em;
}

.scope-sector {
  border-color: rgba(198, 155, 255, 0.22);
  color: var(--violet);
}

.scope-stock {
  border-color: rgba(255, 209, 102, 0.2);
  color: var(--amber);
}

.sentiment-label {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-family: var(--font-mono);
  font-size: 8px;
}

.sentiment-label span {
  font-size: 10px;
}

.confidence {
  margin-left: auto;
  color: var(--dim);
  font-size: 7px;
}

.intel-card h3 {
  margin-top: 8px;
  color: var(--text);
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: 0.015em;
}

.intel-card.positive h3 {
  text-shadow: 0 0 22px rgba(84, 255, 178, 0.08);
}

.intel-card.negative h3 {
  text-shadow: 0 0 22px rgba(255, 63, 145, 0.08);
}

.intel-card p {
  margin-top: 4px;
  color: var(--muted);
  font-size: 9.5px;
  line-height: 1.6;
}

.intel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 9px;
  padding-top: 7px;
  border-top: 1px solid rgba(118, 228, 255, 0.07);
}

.intel-source {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--dim);
  font-size: 7px;
}

.intel-source svg {
  color: var(--muted);
}

.impact {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--dim);
}

.impact-label {
  font-size: 7px;
}

.impact-bars {
  display: inline-flex;
  gap: 2px;
}

.impact-bars i {
  display: block;
  width: 2px;
  height: 6px;
  background: rgba(126, 166, 197, 0.18);
}

.impact-bars i:nth-child(2) {
  height: 8px;
}

.impact-bars i:nth-child(3) {
  height: 10px;
}

.impact-bars.tier-1 i:first-child,
.impact-bars.tier-2 i:nth-child(-n + 2),
.impact-bars.tier-3 i {
  background: var(--amber);
  box-shadow: 0 0 5px rgba(255, 209, 102, 0.35);
}

.intel-card.negative .impact-bars.tier-1 i:first-child,
.intel-card.negative .impact-bars.tier-2 i:nth-child(-n + 2),
.intel-card.negative .impact-bars.tier-3 i {
  background: var(--pink);
  box-shadow: 0 0 5px rgba(255, 63, 145, 0.35);
}

.impact-word {
  color: var(--dim);
  font-size: 7px;
}

.target-line {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  overflow: hidden;
  color: var(--dim);
  font-size: 8px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.target-line .mono {
  flex: none;
  color: #394b5b;
  font-size: 7px;
  letter-spacing: 0.04em;
}

.intel-empty {
  padding: 34px 18px;
  text-align: center;
}

.empty-signal {
  color: rgba(255, 63, 145, 0.5);
  font-size: 9px;
  letter-spacing: 0.1em;
}

.intel-empty p {
  max-width: 250px;
  margin: 9px auto 0;
  color: var(--dim);
  font-size: 9.5px;
  line-height: 1.6;
}

.log-card {
  padding: 11px 12px;
  border: 1px solid rgba(118, 228, 255, 0.08);
  background: rgba(4, 8, 14, 0.4);
}

.log-card + .log-card {
  margin-top: 7px;
}

.log-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.log-day {
  color: var(--cyan);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.log-index {
  font-size: 9px;
  font-weight: 600;
}

.log-assets {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin-top: 7px;
  color: var(--muted);
  font-size: 8px;
}

.log-assets strong {
  margin-left: 5px;
  color: var(--text-soft);
  font-size: 11px;
  font-weight: 500;
}

.log-assets > span:last-child {
  font-size: 9px;
}

.log-movers {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 13px;
  margin-top: 7px;
  padding-top: 7px;
  border-top: 1px solid rgba(118, 228, 255, 0.06);
  font-size: 8px;
}

.log-movers b {
  margin-right: 4px;
  font-family: var(--font-mono);
  font-size: 7px;
  font-weight: 400;
  opacity: 0.55;
}

.news-footer {
  display: flex;
  align-items: center;
  flex: none;
  min-height: 32px;
  padding: 0 16px;
  border-top: 1px solid var(--line);
  color: var(--dim);
  font-size: 8px;
}

.news-footer span {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.news-footer i {
  width: 3px;
  height: 3px;
  flex: none;
  border-radius: 50%;
  background: var(--amber);
  box-shadow: 0 0 6px rgba(255, 209, 102, 0.45);
}

@media (max-width: 1240px) {
  .intel-list,
  .log-list {
    max-height: 330px;
  }
}

@media (max-width: 560px) {
  .news-head {
    padding: 13px 14px;
  }

  .intel-list,
  .log-list {
    max-height: 340px;
    padding: 9px;
  }

  .intel-card {
    padding: 11px;
  }

  .news-footer {
    padding: 0 12px;
    font-size: 7.5px;
  }
}
</style>
