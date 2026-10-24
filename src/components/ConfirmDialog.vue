<script setup>
import { onBeforeUnmount, onMounted } from 'vue'

const props = defineProps({
  eyebrow: { type: String, default: 'CONFIRM ACTION' },
  title: { type: String, default: '确认操作' },
  description: { type: String, default: '' },
  confirmLabel: { type: String, default: '确认' },
  cancelLabel: { type: String, default: '取消' },
  danger: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])

function cancel() {
  emit('cancel')
}

function onKeydown(event) {
  if (event.key === 'Escape') cancel()
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
    <div class="modal-backdrop" @click.self="cancel">
      <div class="modal-shell confirm-shell" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <header class="modal-head">
          <div>
            <span class="eyebrow">{{ eyebrow }}</span>
            <h2 id="confirm-title">{{ title }}</h2>
          </div>
          <button type="button" class="modal-close" aria-label="关闭确认窗口" @click="cancel">
            ×
          </button>
        </header>

        <div class="modal-body">
          <div class="confirm-sign" :class="{ danger }">
            <span class="mono">!</span>
          </div>
          <p class="confirm-description">{{ description }}</p>
          <div class="confirm-actions">
            <button type="button" class="btn btn-ghost" @click="cancel">{{ cancelLabel }}</button>
            <button
              type="button"
              class="btn"
              :class="danger ? 'btn-sell' : 'btn-primary'"
              @click="emit('confirm')"
            >
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.confirm-shell {
  width: min(444px, 100%);
}

.modal-body {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 26px;
}

.confirm-sign {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  margin-bottom: 17px;
  border: 1px solid rgba(88, 247, 255, 0.28);
  background: rgba(88, 247, 255, 0.05);
  color: var(--cyan);
  font-size: 17px;
}

.confirm-sign.danger {
  border-color: rgba(255, 63, 145, 0.3);
  background: rgba(255, 63, 145, 0.06);
  color: var(--pink);
}

.confirm-description {
  max-width: 350px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.75;
  text-align: center;
}

.confirm-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  width: 100%;
  margin-top: 24px;
}

.confirm-actions .btn {
  flex: 1;
  min-height: 41px;
}
</style>
