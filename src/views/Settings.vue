<template>
  <div class="settings">
    <h2>⚙️ Settings</h2>

    <div class="settings-section">
      <h3>🤖 AI Provider</h3>
      <p class="section-desc">Choose the AI model for generating practice questions. We recommend DeepSeek for the best price/performance ratio.</p>
      <div class="provider-grid">
        <div v-for="(info, key) in providers" :key="key"
          :class="['provider-card', { active: settings.apiProvider === key }]"
          @click="settings.updateProvider(key)">
          <div class="provider-header">
            <span class="provider-name">{{ info.name }}</span>
            <span class="provider-rec" v-if="key === 'deepseek'">Recommended</span>
          </div>
          <p class="provider-price">{{ info.price }}</p>
          <p class="provider-note">{{ info.recommendation }}</p>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>🔑 API Key</h3>
      <p class="section-desc">Enter your API key for the selected provider. Without a key, the app will use built-in questions.</p>
      <input type="password" v-model="apiKeyInput" class="key-input" :placeholder="`Enter ${providers[settings.apiProvider]?.name || ''} API key`" />
      <button class="btn-primary" @click="saveKey">Save Key</button>
      <p class="key-status" v-if="settings.apiKey">✅ API key saved</p>
    </div>

    <div class="settings-section">
      <h3>🔊 Speech Settings</h3>
      <div class="setting-row">
        <label>Speech Rate</label>
        <input type="range" min="0.5" max="1.5" step="0.1" v-model="rateInput" @change="saveRate" class="slider" />
        <span class="rate-value">{{ rateInput }}x</span>
      </div>
      <button class="btn-secondary" @click="testSpeech">🔊 Test Speech</button>
    </div>

    <div class="settings-section">
      <h3>📊 Data Management</h3>
      <button class="btn-danger" @click="confirmReset">Reset All Progress</button>
      <p class="warning-text">This will delete all learning records and achievements.</p>
    </div>

    <div class="settings-section about">
      <h3>ℹ️ About</h3>
      <p>WordMagic v1.0.0</p>
      <p>AI-driven English vocabulary learning for primary school students</p>
      <p>Based on Cambridge English graded word system</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { getProviderInfo } from '../utils/aiService'
import { speak } from '../utils/tts'

const settings = useSettingsStore()
const progress = useProgressStore()

const providers = getProviderInfo()
const apiKeyInput = ref(settings.apiKey)
const rateInput = ref(settings.ttsRate)

function saveKey() {
  settings.updateApiKey(apiKeyInput.value.trim())
}

function saveRate() {
  settings.updateTtsRate(parseFloat(rateInput.value))
}

function testSpeech() {
  speak('Hello! I am your English learning assistant. Let us learn together!', settings.ttsRate)
}

function confirmReset() {
  if (confirm('Are you sure? This will delete ALL progress and achievements!')) {
    progress.reset()
    alert('Progress has been reset.')
  }
}
</script>

<style scoped>
.settings { max-width: 700px; margin: 0 auto; }

h2 { font-size: 28px; font-weight: 800; color: var(--color-primary); margin-bottom: 24px; }

.settings-section {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: var(--shadow);
  margin-bottom: 20px;
}

.settings-section h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
.section-desc { font-size: 14px; color: var(--color-text-light); margin-bottom: 16px; }

.provider-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px; }

.provider-card {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.provider-card.active { border-color: var(--color-primary); background: #F0EDFF; }
.provider-card:hover { border-color: var(--color-primary-light); }

.provider-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.provider-name { font-weight: 700; font-size: 15px; }
.provider-rec { font-size: 11px; background: var(--color-green); color: white; padding: 2px 8px; border-radius: 8px; }
.provider-price { font-size: 13px; color: var(--color-primary); font-weight: 600; margin-bottom: 4px; }
.provider-note { font-size: 12px; color: var(--color-text-light); }

.key-input {
  width: 100%;
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 15px;
  margin-bottom: 12px;
}

.key-status { color: var(--color-green); font-weight: 600; margin-top: 8px; }

.setting-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.setting-row label { font-weight: 600; min-width: 100px; }

.slider { flex: 1; height: 6px; accent-color: var(--color-primary); }
.rate-value { font-weight: 700; color: var(--color-primary); min-width: 40px; }

.warning-text { font-size: 13px; color: var(--color-orange); margin-top: 8px; }

.about p { font-size: 14px; color: var(--color-text-light); margin-bottom: 4px; }
</style>
