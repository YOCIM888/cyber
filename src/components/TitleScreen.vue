<script setup>
import { computed, ref } from 'vue'
import {
  CAMPAIGN_DAYS,
  CURRENCY,
  FEE_RATE,
  STARTING_CASH,
  STOCKS,
} from '../game/stocks'
import { formatInteger, formatPercent, formatPrice } from '../game/format'

const props = defineProps({
  saveInfo: { type: Object, default: null },
  bestRecord: { type: Object, default: null },
})

const emit = defineEmits(['start', 'continue'])

const selectedMode = ref('campaign')

const towers = [
  { left: -1, width: 8, height: 24, tone: 'dim', sign: '' },
  { left: 8, width: 6, height: 33, tone: 'cyan', sign: '食' },
  { left: 16, width: 10, height: 20, tone: 'dim', sign: '' },
  { left: 28, width: 7, height: 42, tone: 'pink', sign: '梦' },
  { left: 38, width: 11, height: 28, tone: 'dim', sign: '' },
  { left: 51, width: 7, height: 48, tone: 'cyan', sign: '义' },
  { left: 60, width: 12, height: 22, tone: 'dim', sign: '' },
  { left: 74, width: 8, height: 36, tone: 'pink', sign: '星' },
  { left: 84, width: 6, height: 27, tone: 'dim', sign: '' },
  { left: 92, width: 10, height: 39, tone: 'cyan', sign: '' },
]

const openingTape = computed(() => [...STOCKS, ...STOCKS])

const saveModeLabel = computed(() =>
  props.saveInfo?.mode === 'endless' ? '无尽协议' : `${CAMPAIGN_DAYS} 日协议`,
)

function launch() {
  emit('start', selectedMode.value)
}
</script>

<template>
  <section class="title-screen">
    <div class="atmosphere" aria-hidden="true">
      <div class="sky-glow"></div>
      <div class="neon-orbit orbit-one"></div>
      <div class="neon-orbit orbit-two"></div>
      <div class="scan-beam"></div>
      <div class="perspective-grid"></div>
      <div class="city-towers">
        <div
          v-for="(tower, index) in towers"
          :key="index"
          class="tower"
          :class="`tower-${tower.tone}`"
          :style="{ left: `${tower.left}%`, width: `${tower.width}%`, height: `${tower.height}%` }"
        >
          <span v-if="tower.sign" class="tower-sign">{{ tower.sign }}</span>
        </div>
      </div>
      <div class="city-fog"></div>
      <div class="air-traffic traffic-one"></div>
      <div class="air-traffic traffic-two"></div>
    </div>

    <header class="landing-nav">
      <div class="brand-lockup">
        <span class="brand-glyph">NX</span>
        <span class="brand-copy">
          <strong>NEON EXCHANGE</strong>
          <small>NIGHT CITY SECURITIES</small>
        </span>
      </div>
      <div class="node-status">
        <span class="node-ping"></span>
        <span>NODE 07 / SECURE LINK</span>
        <span class="node-time mono">2049.10.24&nbsp;&nbsp;23:47</span>
      </div>
    </header>

    <main class="landing-main">
      <div class="hero">
        <div class="hero-kicker">
          <span class="hero-kicker-line"></span>
          <span>NIGHT CITY STOCK EXCHANGE // BUILD 2049.10</span>
        </div>

        <h1 class="hero-title" aria-label="Neon Exchange">
          <span class="glitch" data-text="NEON">NEON</span>
          <span class="glitch glitch-alt" data-text="EXCHANGE">EXCHANGE</span>
        </h1>

        <div class="hero-cn">
          <span>霓虹交易所</span>
          <span class="hero-cn-line"></span>
          <span class="mono">/ PUNK CAPITAL TERMINAL</span>
        </div>

        <p class="hero-tagline">霓虹会熄灭，资本不会。</p>
        <p class="hero-description">
          在夜之城最后未熄灯的交易大厅里，用一万朋克币穿行于十二家赛博企业之间。
          读懂情报、押注波动，然后带着利润离开——或者成为下一条坏消息。
        </p>

        <div class="hero-metrics">
          <div class="metric">
            <span class="metric-value mono">12</span>
            <span class="metric-label">赛博股票</span>
          </div>
          <div class="metric">
            <span class="metric-value mono">{{ formatInteger(STARTING_CASH) }}</span>
            <span class="metric-label">初始{{ CURRENCY }}</span>
          </div>
          <div class="metric">
            <span class="metric-value mono">10 / ∞</span>
            <span class="metric-label">投资协议</span>
          </div>
        </div>
      </div>

      <section class="launch-console" aria-label="选择交易协议并进入游戏">
        <div class="console-head">
          <span><span class="console-dot"></span> ACCESS PROTOCOL</span>
          <span class="mono">[ READY ]</span>
        </div>

        <div class="console-title">
          <span class="eyebrow">CHOOSE YOUR TERMINAL</span>
          <h2>选择投资协议</h2>
        </div>

        <div class="mode-options">
          <button
            type="button"
            class="mode-card"
            :class="{ active: selectedMode === 'campaign' }"
            @click="selectedMode = 'campaign'"
          >
            <span class="mode-index mono">10D</span>
            <span class="mode-copy">
              <span class="mode-name">10 日冲刺</span>
              <span class="mode-desc">十个交易日内最大化资产，收盘自动结算评级。</span>
            </span>
            <span class="mode-tag">推荐</span>
            <span class="mode-radio"></span>
          </button>

          <button
            type="button"
            class="mode-card"
            :class="{ active: selectedMode === 'endless' }"
            @click="selectedMode = 'endless'"
          >
            <span class="mode-index mono">∞</span>
            <span class="mode-copy">
              <span class="mode-name">无尽投资</span>
              <span class="mode-desc">没有终点，也没有救市。随时主动离场，带走你剩下的筹码。</span>
            </span>
            <span class="mode-tag mode-tag-alt">开放</span>
            <span class="mode-radio"></span>
          </button>
        </div>

        <div class="console-rules">
          <span>
            <i></i>
            情报在每天开盘时刷新，收盘时兑现
          </span>
          <span>
            <i></i>
            买卖各收取 {{ (FEE_RATE * 100).toFixed(2) }}% 交易税
          </span>
        </div>

        <button type="button" class="btn btn-primary console-launch" @click="launch">
          接入交易终端
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <path
              d="M4 10h11M11 6l4 4-4 4"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="square"
            />
          </svg>
        </button>

        <button
          v-if="saveInfo"
          type="button"
          class="btn console-continue"
          @click="emit('continue')"
        >
          <span class="continue-main">恢复上次会话</span>
          <span class="continue-meta mono">
            {{ saveModeLabel }} / DAY {{ String(saveInfo.day).padStart(2, '0') }}
          </span>
        </button>

        <div v-if="saveInfo" class="overwrite-hint">
          <span class="mono">!</span>
          开始新局将覆盖本地存档。恢复会话不会。
        </div>

        <div v-if="bestRecord" class="best-record">
          <span class="mono">LOCAL BEST</span>
          <span class="best-rank">{{ bestRecord.rank?.grade || 'C' }}</span>
          <span class="mono" :class="bestRecord.totalReturn >= 0 ? 'up' : 'down'">
            {{ formatPercent(bestRecord.totalReturn) }}
          </span>
          <span class="best-mode">{{ bestRecord.mode === 'endless' ? '无尽' : '10 日' }}</span>
        </div>

        <div class="console-footer">
          <span><i></i>本地自动存档</span>
          <span class="mono">v1.0.4</span>
        </div>
      </section>
    </main>

    <div class="opening-tape" aria-hidden="true">
      <div class="opening-label">
        <span class="eyebrow">OPENING QUOTES</span>
        <span class="opening-arrow">↘</span>
      </div>
      <div class="opening-viewport">
        <div class="opening-track">
          <span
            v-for="(stock, index) in openingTape"
            :key="`${stock.id}-${index}`"
            class="opening-item"
          >
            <span class="opening-code mono">{{ stock.code }}</span>
            <span class="opening-name">{{ stock.name }}</span>
            <span class="opening-price num">₱{{ formatPrice(stock.price) }}</span>
            <span class="opening-dot">·</span>
          </span>
        </div>
      </div>
    </div>

    <footer class="landing-footer">
      <span>NEON EXCHANGE IS A FICTIONAL INVESTMENT GAME.</span>
      <span class="footer-center">NO REAL SECURITIES · NO REAL MONEY · ALL CAPITAL IS PUNK CAPITAL</span>
      <span class="mono">© 2049 NIGHT CITY</span>
    </footer>
  </section>
</template>

<style scoped>
.title-screen {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow: hidden;
  padding: 0 clamp(20px, 4vw, 64px);
}

.atmosphere {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.sky-glow {
  position: absolute;
  inset: -30% -15% auto;
  height: 100%;
  background:
    radial-gradient(ellipse at 62% 34%, rgba(255, 43, 125, 0.19), transparent 30%),
    radial-gradient(ellipse at 74% 20%, rgba(47, 233, 255, 0.13), transparent 38%),
    linear-gradient(180deg, rgba(8, 10, 22, 0.1), transparent 68%);
}

.neon-orbit {
  position: absolute;
  border: 1px solid rgba(88, 247, 255, 0.17);
  border-radius: 50%;
  box-shadow:
    inset 0 0 24px rgba(88, 247, 255, 0.04),
    0 0 24px rgba(88, 247, 255, 0.04);
}

.orbit-one {
  top: 8%;
  right: 12%;
  width: min(48vw, 700px);
  aspect-ratio: 1;
  transform: rotate(-13deg);
  border-top-color: rgba(255, 63, 145, 0.32);
}

.orbit-two {
  top: 19%;
  right: 21%;
  width: min(36vw, 520px);
  aspect-ratio: 1;
  transform: rotate(8deg);
  opacity: 0.55;
}

.perspective-grid {
  position: absolute;
  right: -30%;
  bottom: -10%;
  left: -30%;
  height: 59%;
  opacity: 0.5;
  background-image:
    linear-gradient(rgba(88, 247, 255, 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 63, 145, 0.12) 1px, transparent 1px);
  background-size: 62px 44px;
  transform: perspective(430px) rotateX(64deg);
  transform-origin: center bottom;
  mask-image: linear-gradient(to top, black 8%, rgba(0, 0, 0, 0.2) 56%, transparent 92%);
}

.city-towers {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 53%;
  opacity: 0.9;
  mask-image: linear-gradient(to top, black 15%, rgba(0, 0, 0, 0.8) 68%, transparent 100%);
}

.tower {
  position: absolute;
  bottom: 0;
  min-width: 38px;
  border-top: 1px solid rgba(88, 247, 255, 0.38);
  background:
    linear-gradient(180deg, rgba(8, 17, 27, 0.84), rgba(3, 6, 11, 0.98)),
    #050a11;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.5);
}

.tower::before {
  content: '';
  position: absolute;
  inset: 8px 6px;
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent 0 7px,
      rgba(88, 247, 255, 0.24) 7px 9px,
      transparent 9px 16px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0 8px,
      rgba(255, 75, 147, 0.18) 8px 9px,
      transparent 9px 17px
    );
  opacity: 0.55;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent 82%);
}

.tower::after {
  content: '';
  position: absolute;
  top: -9px;
  left: 50%;
  width: 1px;
  height: 9px;
  background: rgba(88, 247, 255, 0.55);
}

.tower-cyan {
  border-top-color: rgba(88, 247, 255, 0.72);
}

.tower-pink {
  border-top-color: rgba(255, 63, 145, 0.72);
}

.tower-pink::before {
  background-image:
    repeating-linear-gradient(
      90deg,
      transparent 0 8px,
      rgba(255, 63, 145, 0.2) 8px 10px,
      transparent 10px 17px
    ),
    repeating-linear-gradient(
      0deg,
      transparent 0 9px,
      rgba(88, 247, 255, 0.15) 9px 10px,
      transparent 10px 18px
    );
}

.tower-sign {
  position: absolute;
  top: 18%;
  left: 50%;
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1;
  text-shadow: 0 0 14px currentColor;
  transform: translateX(-50%);
}

.tower-pink .tower-sign {
  color: var(--pink);
}

.city-fog {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 30%;
  background:
    linear-gradient(0deg, rgba(4, 6, 10, 0.98) 0%, rgba(4, 6, 10, 0.5) 36%, transparent 100%),
    radial-gradient(ellipse at 50% 82%, rgba(255, 46, 121, 0.1), transparent 60%);
}

.scan-beam {
  position: absolute;
  top: 0;
  left: 9%;
  width: 1px;
  height: 72%;
  background: linear-gradient(180deg, transparent, rgba(88, 247, 255, 0.28), transparent);
  opacity: 0.38;
}

.air-traffic {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--pink);
  box-shadow:
    0 0 12px var(--pink),
    -22px 0 9px rgba(255, 230, 221, 0.34);
  opacity: 0.8;
}

.traffic-one {
  top: 31%;
  left: 56%;
  animation: air-move 11s linear infinite;
}

.traffic-two {
  top: 18%;
  left: 78%;
  background: var(--cyan);
  box-shadow:
    0 0 12px var(--cyan),
    -18px 0 8px rgba(88, 247, 255, 0.26);
  animation: air-move 15s linear infinite 2.5s reverse;
}

.landing-nav {
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  height: 76px;
  border-bottom: 1px solid rgba(118, 228, 255, 0.11);
}

.brand-lockup {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-glyph {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  color: #021014;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--cyan), #61ffcf);
  clip-path: polygon(0 0, 100% 0, 100% 72%, 72% 100%, 0 100%);
  box-shadow: 0 0 22px rgba(88, 247, 255, 0.24);
}

.brand-copy {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-copy strong {
  color: var(--text);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.17em;
}

.brand-copy small {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.14em;
}

.node-status {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.node-ping {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--mint);
  box-shadow: 0 0 8px var(--mint);
  animation: pulse-dot 2.2s ease-in-out infinite;
}

.node-time {
  padding-left: 21px;
  border-left: 1px solid var(--line);
  color: var(--muted);
}

.landing-main {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(0, 1.22fr) minmax(380px, 0.78fr);
  align-items: center;
  gap: clamp(42px, 6vw, 100px);
  width: min(1460px, 100%);
  margin: auto;
  padding: clamp(56px, 8vh, 108px) 0 clamp(38px, 6vh, 72px);
}

.hero {
  position: relative;
  max-width: 820px;
  animation: fade-up 680ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.hero-kicker {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-bottom: 25px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
}

.hero-kicker-line {
  display: inline-block;
  width: 46px;
  height: 1px;
  background: var(--pink);
  box-shadow: 0 0 10px rgba(255, 63, 145, 0.55);
}

.hero-title {
  display: flex;
  flex-direction: column;
  margin-left: -4px;
  font-family: var(--font-display);
  font-size: clamp(58px, 8.4vw, 126px);
  font-weight: 800;
  letter-spacing: 0.015em;
  line-height: 0.9;
  text-transform: uppercase;
}

.hero-title > span {
  display: block;
  width: max-content;
  color: var(--text);
  text-shadow:
    0 0 30px rgba(88, 247, 255, 0.16),
    5px 0 0 rgba(255, 63, 145, 0.1);
}

.hero-title > span:first-child {
  color: var(--cyan);
  text-shadow:
    0 0 38px rgba(88, 247, 255, 0.3),
    -5px 0 0 rgba(255, 63, 145, 0.32);
}

.glitch {
  position: relative;
  isolation: isolate;
}

.glitch::before,
.glitch::after {
  content: attr(data-text);
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: 0;
}

.glitch::before {
  color: var(--pink);
  clip-path: inset(14% 0 57% 0);
  animation: glitch-a 6.5s steps(1, end) infinite;
}

.glitch::after {
  color: var(--cyan);
  clip-path: inset(62% 0 9% 0);
  animation: glitch-b 5.2s steps(1, end) infinite 0.8s;
}

.glitch-alt::before {
  animation-delay: 1.8s;
}

.glitch-alt::after {
  animation-delay: 0.4s;
}

.hero-cn {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 25px;
  color: var(--text-soft);
  font-size: 13px;
  letter-spacing: 0.36em;
}

.hero-cn-line {
  display: inline-block;
  width: 34px;
  height: 1px;
  background: rgba(88, 247, 255, 0.4);
}

.hero-cn .mono {
  color: var(--muted);
  font-size: 9px;
  letter-spacing: 0.12em;
}

.hero-tagline {
  margin-top: clamp(24px, 4vh, 38px);
  color: var(--text);
  font-size: clamp(24px, 2.4vw, 34px);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.hero-tagline::after {
  content: '';
  display: block;
  width: 44px;
  height: 2px;
  margin-top: 16px;
  background: linear-gradient(90deg, var(--cyan), transparent);
  box-shadow: 0 0 12px rgba(88, 247, 255, 0.58);
}

.hero-description {
  max-width: 600px;
  margin-top: 19px;
  color: #8ca0b5;
  font-size: 15px;
  line-height: 1.85;
  letter-spacing: 0.025em;
}

.hero-metrics {
  display: flex;
  gap: clamp(24px, 4vw, 56px);
  margin-top: 36px;
}

.metric {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 15px;
  border-left: 1px solid rgba(88, 247, 255, 0.24);
}

.metric-value {
  color: var(--text);
  font-size: clamp(20px, 1.9vw, 26px);
  line-height: 1;
}

.metric-label {
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.launch-console {
  position: relative;
  padding: 0 24px 20px;
  border: 1px solid rgba(118, 228, 255, 0.2);
  background:
    linear-gradient(155deg, rgba(15, 26, 42, 0.84), rgba(4, 8, 14, 0.95)),
    rgba(7, 12, 20, 0.94);
  box-shadow:
    0 32px 90px rgba(0, 0, 0, 0.5),
    0 0 80px rgba(88, 247, 255, 0.04);
  backdrop-filter: blur(20px);
  clip-path: polygon(0 0, calc(100% - 19px) 0, 100% 19px, 100% 100%, 0 100%);
  animation: fade-up 680ms 140ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.launch-console::before {
  content: '';
  position: absolute;
  top: 0;
  left: 25px;
  width: 64px;
  height: 1px;
  background: var(--pink);
  box-shadow: 0 0 12px rgba(255, 63, 145, 0.7);
}

.launch-console::after {
  content: '';
  position: absolute;
  right: 18px;
  bottom: 11px;
  width: 34px;
  height: 1px;
  background: rgba(88, 247, 255, 0.25);
}

.console-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 43px;
  border-bottom: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.09em;
}

.console-head > span:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
}

.console-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--mint);
  box-shadow: 0 0 9px rgba(84, 255, 178, 0.75);
}

.console-head > span:last-child {
  color: var(--mint);
}

.console-title {
  padding: 23px 0 17px;
}

.console-title h2 {
  margin-top: 5px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.mode-card {
  position: relative;
  display: grid;
  grid-template-columns: 49px minmax(0, 1fr) auto;
  align-items: center;
  gap: 13px;
  width: 100%;
  padding: 15px 15px 14px;
  text-align: left;
  border: 1px solid rgba(118, 228, 255, 0.12);
  background: rgba(5, 10, 17, 0.62);
  transition:
    border-color 170ms ease,
    background 170ms ease,
    transform 170ms ease;
}

.mode-card:hover {
  border-color: rgba(118, 228, 255, 0.32);
  background: rgba(20, 34, 48, 0.48);
}

.mode-card.active {
  border-color: rgba(88, 247, 255, 0.55);
  background:
    linear-gradient(90deg, rgba(88, 247, 255, 0.09), transparent 60%),
    rgba(9, 18, 28, 0.8);
  box-shadow: inset 2px 0 0 var(--cyan);
}

.mode-index {
  color: var(--muted);
  font-size: 21px;
  line-height: 1;
  text-align: center;
  letter-spacing: -0.04em;
}

.mode-card.active .mode-index {
  color: var(--cyan);
  text-shadow: 0 0 16px rgba(88, 247, 255, 0.4);
}

.mode-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.mode-name {
  color: var(--text);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.045em;
}

.mode-desc {
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.55;
}

.mode-tag {
  align-self: flex-start;
  padding: 2px 6px;
  border: 1px solid rgba(84, 255, 178, 0.3);
  color: var(--mint);
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.06em;
}

.mode-tag-alt {
  border-color: rgba(198, 155, 255, 0.28);
  color: var(--violet);
}

.mode-radio {
  position: absolute;
  right: 14px;
  bottom: 12px;
  width: 4px;
  height: 4px;
  border: 1px solid var(--dim);
  transform: rotate(45deg);
}

.mode-card.active .mode-radio {
  border-color: var(--cyan);
  background: var(--cyan);
  box-shadow: 0 0 7px var(--cyan);
}

.console-rules {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 0 16px;
  color: var(--dim);
  font-size: 10.5px;
}

.console-rules span {
  display: flex;
  align-items: center;
  gap: 7px;
}

.console-rules i {
  width: 3px;
  height: 3px;
  background: rgba(88, 247, 255, 0.45);
  transform: rotate(45deg);
}

.console-launch {
  width: 100%;
  min-height: 47px;
  font-family: var(--font-body);
  font-size: 14px;
  letter-spacing: 0.13em;
}

.console-continue {
  width: 100%;
  margin-top: 8px;
  justify-content: space-between;
  min-height: 42px;
  color: var(--text-soft);
}

.continue-main {
  font-size: 12px;
}

.continue-meta {
  color: var(--muted);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.overwrite-hint {
  margin-top: 9px;
  color: var(--dim);
  font-size: 10px;
  text-align: center;
}

.overwrite-hint .mono {
  display: inline-grid;
  place-items: center;
  width: 13px;
  height: 13px;
  margin-right: 5px;
  border: 1px solid rgba(255, 209, 102, 0.32);
  color: var(--amber);
  font-size: 8px;
}

.best-record {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-top: 15px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.best-rank {
  color: var(--amber);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
}

.best-mode {
  margin-left: auto;
  color: var(--dim);
  font-size: 9px;
}

.console-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 17px;
  padding-top: 13px;
  border-top: 1px solid rgba(118, 228, 255, 0.08);
  color: var(--dim);
  font-size: 9px;
}

.console-footer span:first-child {
  display: flex;
  align-items: center;
  gap: 6px;
}

.console-footer i {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--mint);
  box-shadow: 0 0 6px rgba(84, 255, 178, 0.6);
}

.opening-tape {
  position: relative;
  z-index: 3;
  display: flex;
  width: min(1460px, 100%);
  margin: 0 auto;
  border-top: 1px solid rgba(118, 228, 255, 0.12);
  border-bottom: 1px solid rgba(118, 228, 255, 0.09);
  background: rgba(4, 8, 14, 0.62);
  backdrop-filter: blur(12px);
}

.opening-label {
  display: flex;
  align-items: center;
  gap: 11px;
  flex: none;
  padding: 12px 21px 12px 0;
  border-right: 1px solid var(--line);
}

.opening-arrow {
  color: var(--pink);
  font-family: var(--font-mono);
  font-size: 14px;
}

.opening-viewport {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  mask-image: linear-gradient(90deg, transparent, black 4%, black 96%, transparent);
}

.opening-track {
  display: flex;
  align-items: center;
  width: max-content;
  height: 37px;
  animation: marquee 52s linear infinite;
}

.opening-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex: none;
  padding-left: 24px;
  font-size: 10px;
  white-space: nowrap;
}

.opening-code {
  color: var(--cyan);
  font-size: 9px;
}

.opening-name {
  color: var(--muted);
}

.opening-price {
  color: var(--text-soft);
  font-size: 11px;
}

.opening-dot {
  padding-left: 10px;
  color: rgba(255, 63, 145, 0.36);
}

.landing-footer {
  position: relative;
  z-index: 3;
  display: flex;
  justify-content: space-between;
  gap: 20px;
  width: min(1460px, 100%);
  margin: 0 auto;
  padding: 15px 0 19px;
  color: #334451;
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.08em;
}

.footer-center {
  color: #3f5363;
}

@keyframes glitch-a {
  0%,
  92%,
  96%,
  100% {
    opacity: 0;
    transform: translate(0);
  }
  93% {
    opacity: 0.7;
    transform: translate(5px, -2px);
  }
  94% {
    opacity: 0.35;
    transform: translate(-4px, 1px);
  }
  95% {
    opacity: 0.55;
    transform: translate(2px, 0);
  }
}

@keyframes glitch-b {
  0%,
  88%,
  92%,
  100% {
    opacity: 0;
    transform: translate(0);
  }
  89% {
    opacity: 0.6;
    transform: translate(-4px, 1px);
  }
  90% {
    opacity: 0.25;
    transform: translate(3px, -1px);
  }
  91% {
    opacity: 0.45;
    transform: translate(-2px, 0);
  }
}

@keyframes air-move {
  0% {
    transform: translate(-24vw, 8vh);
    opacity: 0;
  }
  12% {
    opacity: 0.8;
  }
  88% {
    opacity: 0.8;
  }
  100% {
    transform: translate(24vw, -6vh);
    opacity: 0;
  }
}

@media (max-width: 1080px) {
  .landing-main {
    grid-template-columns: minmax(0, 1.1fr) minmax(340px, 0.9fr);
    gap: 42px;
  }

  .hero-title {
    font-size: clamp(52px, 7.8vw, 88px);
  }

  .hero-description {
    font-size: 14px;
  }

  .node-time {
    display: none;
  }
}

@media (max-width: 860px) {
  .title-screen {
    padding: 0 20px;
  }

  .landing-nav {
    height: 64px;
  }

  .node-status span:not(.node-ping) {
    font-size: 8px;
  }

  .landing-main {
    grid-template-columns: 1fr;
    gap: 33px;
    padding: 42px 0 36px;
  }

  .hero {
    max-width: none;
  }

  .hero-title {
    font-size: clamp(58px, 13vw, 108px);
  }

  .hero-description {
    max-width: 620px;
  }

  .launch-console {
    max-width: none;
  }

  .city-towers {
    opacity: 0.38;
  }
}

@media (max-width: 560px) {
  .brand-copy strong {
    font-size: 10px;
  }

  .brand-copy small {
    font-size: 7px;
  }

  .node-status {
    display: none;
  }

  .landing-main {
    padding-top: 31px;
    padding-bottom: 30px;
  }

  .hero-kicker {
    margin-bottom: 19px;
    font-size: 8px;
    letter-spacing: 0.1em;
  }

  .hero-kicker-line {
    width: 25px;
  }

  .hero-title {
    font-size: clamp(50px, 14vw, 76px);
    line-height: 0.92;
  }

  .hero-cn {
    gap: 10px;
    margin-top: 19px;
    font-size: 11px;
    letter-spacing: 0.24em;
  }

  .hero-cn .mono {
    display: none;
  }

  .hero-tagline {
    margin-top: 23px;
    font-size: 22px;
  }

  .hero-description {
    margin-top: 15px;
    font-size: 13px;
    line-height: 1.75;
  }

  .hero-metrics {
    gap: 20px;
    margin-top: 27px;
    flex-wrap: wrap;
  }

  .metric {
    padding-left: 11px;
  }

  .metric-value {
    font-size: 18px;
  }

  .metric-label {
    font-size: 8px;
  }

  .launch-console {
    padding: 0 16px 16px;
  }

  .console-title {
    padding: 19px 0 14px;
  }

  .console-title h2 {
    font-size: 19px;
  }

  .mode-card {
    grid-template-columns: 38px minmax(0, 1fr);
    gap: 10px;
    padding: 13px 12px;
  }

  .mode-index {
    font-size: 18px;
  }

  .mode-name {
    font-size: 14px;
  }

  .mode-desc {
    font-size: 10.5px;
  }

  .mode-tag {
    display: none;
  }

  .console-rules {
    font-size: 9.5px;
    line-height: 1.55;
  }

  .console-launch {
    min-height: 44px;
    font-size: 13px;
  }

  .best-record {
    flex-wrap: wrap;
  }

  .opening-label {
    display: none;
  }

  .landing-footer {
    justify-content: center;
    padding: 12px 0 15px;
    text-align: center;
  }

  .footer-center {
    display: none;
  }

  .landing-footer > span:first-child {
    display: none;
  }

  .city-towers {
    opacity: 0.22;
  }

  .perspective-grid {
    opacity: 0.26;
  }
}
</style>
