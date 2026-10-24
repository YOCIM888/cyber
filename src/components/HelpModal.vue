<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { CAMPAIGN_DAYS, FEE_RATE, STARTING_CASH } from '../game/stocks'
import { formatInteger } from '../game/format'

const emit = defineEmits(['close'])

function close() {
  emit('close')
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.body.style.overflow = 'hidden'
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="close">
      <div
        class="modal-shell help-shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <header class="modal-head">
          <div>
            <span class="eyebrow">OPERATOR MANUAL / V1.0</span>
            <h2 id="help-title">交易手册</h2>
          </div>
          <button type="button" class="modal-close" aria-label="关闭交易手册" @click="close">
            ×
          </button>
        </header>

        <div class="modal-body help-body">
          <div class="help-intro">
            <span class="help-hex mono">NX</span>
            <div>
              <strong>从 {{ formatInteger(STARTING_CASH) }} 朋克币开始。</strong>
              <p>
                这是一场只存在于夜之城的模拟资本实验。价格由大盘情绪、板块情报、公司事件与随机波动共同驱动。
                你的目标不是预测一切，而是在错误发生前控制仓位。
              </p>
            </div>
          </div>

          <div class="help-steps">
            <article class="help-step">
              <span class="step-index mono">01</span>
              <h3>选中目标</h3>
              <p>在左侧行情列表点击任意企业，查看价格走势、当日涨跌与今日情报标记。</p>
            </article>
            <article class="help-step">
              <span class="step-index mono">02</span>
              <h3>建立仓位</h3>
              <p>
                在右侧下单终端输入整数股数。买入与卖出各收取
                {{ (FEE_RATE * 100).toFixed(2) }}% 交易税，不收杠杆、不做空。
              </p>
            </article>
            <article class="help-step">
              <span class="step-index mono">03</span>
              <h3>读懂情报</h3>
              <p>
                每天开盘时出现的情报，会在下一次收盘结算时影响价格。可信度与信号强度只是概率线索，噪声仍会扰动市场。
              </p>
            </article>
            <article class="help-step">
              <span class="step-index mono">04</span>
              <h3>收盘推进</h3>
              <p>
                点击右上角「结束今日」推进收盘。所有持仓会按最新价重新估值。在第
                {{ CAMPAIGN_DAYS }} 日收盘后，10 日协议自动结算。
              </p>
            </article>
          </div>

          <section class="mode-guide">
            <div class="mode-guide-card">
              <span class="eyebrow">PROTOCOL A / 10 DAYS</span>
              <h3>10 日冲刺</h3>
              <p>
                共 {{ CAMPAIGN_DAYS }} 次收盘。最大化最终资产，系统会给出收益率、最大回撤和终局评级。
                跑赢霓虹综合指数会记录为超额收益。
              </p>
              <div class="mode-guide-meta mono">
                <span>资金 {{ formatInteger(STARTING_CASH) }} P</span>
                <span>不可提前结束</span>
              </div>
            </div>
            <div class="mode-guide-card mode-guide-alt">
              <span class="eyebrow">PROTOCOL B / OPEN END</span>
              <h3>无尽投资</h3>
              <p>
                没有最终交易日。每笔交易和每个收盘日都会自动存档，随时可以从资产负载面板「结算离场」。
              </p>
              <div class="mode-guide-meta mono">
                <span>自动存档</span>
                <span>随时离场</span>
              </div>
            </div>
          </section>

          <div class="intel-primer">
            <span class="primer-label mono">INTEL PRIMER</span>
            <div class="primer-row">
              <span class="scope-chip scope-market">大盘</span>
              <p>宏观事件会同时影响所有企业，通常强度较低但覆盖面最广。</p>
            </div>
            <div class="primer-row">
              <span class="scope-chip scope-sector">板块</span>
              <p>板块事件会影响同一行业内的所有成分股，是你调整组合押注的主要线索。</p>
            </div>
            <div class="primer-row">
              <span class="scope-chip scope-stock">个股</span>
              <p>公司情报只改变单只股票的预期，强度通常最高，也可能被大盘噪声抵消。</p>
            </div>
          </div>

          <div class="help-notes">
            <span><i></i>所有价格、企业、情报均为虚构，不构成任何投资建议。</span>
            <span><i></i>平均成本已包含买入交易税；卖出时再次扣除交易税。</span>
            <span><i></i>本地浏览器自动存档，刷新页面后可从主界面恢复。</span>
          </div>

          <div class="help-footer">
            <span class="mono">PRESS <b>ESC</b> TO CLOSE MANUAL</span>
            <button type="button" class="btn btn-cyan" @click="close">返回交易终端</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.help-shell {
  width: min(820px, 100%);
}

.help-body {
  padding-top: 21px;
}

.help-intro {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding-bottom: 19px;
  border-bottom: 1px solid var(--line);
}

.help-hex {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  flex: none;
  color: var(--cyan);
  border: 1px solid rgba(88, 247, 255, 0.28);
  background: rgba(88, 247, 255, 0.05);
  clip-path: polygon(25% 0, 100% 0, 100% 75%, 75% 100%, 0 100%, 0 25%);
  font-size: 10px;
}

.help-intro strong {
  color: var(--text);
  font-size: 15px;
  font-weight: 600;
}

.help-intro p {
  max-width: 680px;
  margin-top: 5px;
  color: var(--muted);
  font-size: 11.5px;
  line-height: 1.7;
}

.help-steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1px;
  margin: 20px 0;
  border: 1px solid var(--line);
  background: var(--line);
}

.help-step {
  min-height: 122px;
  padding: 16px;
  background: #070d16;
}

.step-index {
  display: block;
  margin-bottom: 8px;
  color: var(--pink);
  font-size: 9px;
  letter-spacing: 0.08em;
}

.help-step h3 {
  color: var(--text-soft);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.help-step p {
  margin-top: 5px;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.65;
}

.mode-guide {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.mode-guide-card {
  padding: 16px;
  border: 1px solid rgba(88, 247, 255, 0.16);
  background:
    linear-gradient(130deg, rgba(88, 247, 255, 0.05), transparent 58%),
    rgba(6, 12, 20, 0.7);
}

.mode-guide-alt {
  border-color: rgba(198, 155, 255, 0.16);
  background:
    linear-gradient(130deg, rgba(198, 155, 255, 0.05), transparent 58%),
    rgba(6, 12, 20, 0.7);
}

.mode-guide-card h3 {
  margin-top: 5px;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
}

.mode-guide-card p {
  margin-top: 5px;
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.65;
}

.mode-guide-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(118, 228, 255, 0.08);
  color: var(--dim);
  font-size: 8px;
  letter-spacing: 0.02em;
}

.intel-primer {
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  background: rgba(4, 8, 14, 0.45);
}

.primer-label {
  display: block;
  margin-bottom: 9px;
  color: var(--dim);
  font-size: 8px;
  letter-spacing: 0.1em;
}

.primer-row {
  display: flex;
  align-items: baseline;
  gap: 9px;
  padding: 5px 0;
}

.primer-row + .primer-row {
  border-top: 1px solid rgba(118, 228, 255, 0.05);
}

.primer-row p {
  color: var(--muted);
  font-size: 10.5px;
  line-height: 1.55;
}

.scope-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 17px;
  min-width: 34px;
  padding: 0 5px;
  border: 1px solid rgba(88, 247, 255, 0.2);
  color: var(--cyan);
  font-family: var(--font-mono);
  font-size: 7px;
  line-height: 1;
}

.scope-sector {
  border-color: rgba(198, 155, 255, 0.25);
  color: var(--violet);
}

.scope-stock {
  border-color: rgba(255, 209, 102, 0.24);
  color: var(--amber);
}

.help-notes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 17px;
  color: var(--dim);
  font-size: 9.5px;
}

.help-notes span {
  display: flex;
  gap: 7px;
}

.help-notes i {
  width: 3px;
  height: 3px;
  flex: none;
  margin-top: 6px;
  background: var(--dim);
  transform: rotate(45deg);
}

.help-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.help-footer .mono {
  color: var(--dim);
  font-size: 8px;
}

.help-footer b {
  color: var(--muted);
  font-weight: 400;
}

@media (max-width: 680px) {
  .help-steps,
  .mode-guide {
    grid-template-columns: 1fr;
  }

  .help-step {
    min-height: auto;
    padding: 14px;
  }

  .help-intro {
    padding-bottom: 15px;
  }

  .help-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .help-footer .mono {
    text-align: center;
  }
}
</style>
