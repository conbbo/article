<template>
  <div class="settings">
    <h2>Settings</h2>

    <div class="section card">
      <h3>AI Provider</h3>
      <p class="desc">Choose an AI model for generating practice questions. Local LLM connects to any OpenAI-compatible endpoint running on your machine (Codex, WorkBuddy, Ollama, etc.).</p>
      <div class="provider-grid">
        <div v-for="(info, key) in providers" :key="key"
          :class="['provider-card', { active: settings.apiProvider === key }]"
          @click="selectProvider(key)">
          <span class="provider-name">{{ info.name }}</span>
          <span class="provider-desc">{{ info.description }}</span>
        </div>
      </div>
    </div>

    <div v-if="settings.apiProvider === 'local'" class="section card">
      <h3>Local LLM Configuration</h3>
      <p class="desc">Enter the base URL and model name for your local OpenAI-compatible endpoint.</p>
      <div class="field">
        <label>Base URL</label>
        <input type="text" v-model="baseUrlInput" class="text-input" placeholder="http://localhost:11434/v1" />
        <p class="field-hint">Ollama: http://localhost:11434/v1 | Codex: http://localhost:8080/v1 | WorkBuddy: check your local server</p>
      </div>
      <div class="field">
        <label>Model Name</label>
        <input type="text" v-model="modelInput" class="text-input" placeholder="gpt-4o-mini" />
        <p class="field-hint">The model name your local server exposes (e.g. gpt-4o-mini, llama3, qwen2.5)</p>
      </div>
      <div class="field">
        <label>API Key (optional)</label>
        <input type="password" v-model="apiKeyInput" class="text-input" placeholder="Leave empty if not required" />
      </div>
      <button class="btn-primary" @click="saveLocalConfig">Save Configuration</button>
    </div>

    <div v-else class="section card">
      <h3>API Key</h3>
      <p class="desc">Enter your API key for {{ providers[settings.apiProvider]?.name }}.</p>
      <input type="password" v-model="apiKeyInput" class="text-input" :placeholder="`Enter ${providers[settings.apiProvider]?.name} API key`" />
      <button class="btn-primary" @click="saveKey">Save Key</button>
      <p class="key-status" v-if="settings.apiKey">API key saved.</p>
    </div>

    <div class="section card">
      <h3>Speech</h3>
      <div class="field-row">
        <label>Speech Rate</label>
        <input type="range" min="0.5" max="1.5" step="0.1" v-model="rateInput" @change="saveRate" class="slider" />
        <span class="rate-value">{{ rateInput }}x</span>
      </div>
      <button class="btn-secondary" @click="testSpeech">Test Speech</button>
    </div>

    <div class="section card">
      <h3>Data Management</h3>
      <p class="desc">Reset all learning progress and achievements. This cannot be undone.</p>
      <button class="btn-danger" @click="confirmReset">Reset All Progress</button>
    </div>

    <div class="section card about">
      <h3>About</h3>
      <p>WordMagic v2.0.0</p>
      <p class="muted">AI-powered English vocabulary learning desktop app</p>
      <p class="muted">Storage: SQLite (local) | LLM: {{ providers[settings.apiProvider]?.name || 'Not configured' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { getProviderInfo } from '../utils/aiService'
import { speak } from '../utils/tts'

const settings = useSettingsStore()
const progress = useProgressStore()
const providers = getProviderInfo()

const apiKeyInput = ref('')
const baseUrlInput = ref('http://localhost:11434/v1')
const modelInput = ref('gpt-4o-mini')
const rateInput = ref(0.9)

function selectProvider(key) {
  settings.updateProvider(key)
  if (key === 'local') {
    baseUrlInput.value = settings.apiBaseUrl || 'http://localhost:11434/v1'
    modelInput.value = settings.apiModel || 'gpt-4o-mini'
    apiKeyInput.value = settings.apiKey || ''
  } else {
    apiKeyInput.value = settings.apiKey || ''
  }
}

function saveKey() {
  settings.updateApiKey(apiKeyInput.value.trim())
}

function saveLocalConfig() {
  settings.updateApiBaseUrl(baseUrlInput.value.trim())
  settings.updateApiModel(modelInput.value.trim())
  settings.updateApiKey(apiKeyInput.value.trim())
}

function saveRate() {
  settings.updateTtsRate(parseFloat(rateInput.value))
}

function testSpeech() {
  speak('Hello! I am your English learning assistant.', settings.ttsRate)
}

function confirmReset() {
  if (confirm('Reset ALL progress and achievements? This cannot be undone.')) {
    progress.reset()
  }
}

onMounted(async () => {
  await Promise.all([settings.init(), progress.init()])
  apiKeyInput.value = settings.apiKey || ''
  baseUrlInput.value = settings.apiBaseUrl || 'http://localhost:11434/v1'
  modelInput.value = settings.apiModel || 'gpt-4o-mini'
  rateInput.value = settings.ttsRate
})
</script>

<style scoped>
.settings { max-width: 600px; margin: 0 auto; }
h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }

.section { margin-bottom: 12px; }
.section h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.desc { font-size: 13px; color: var(--color-text-light); margin-bottom: 12px; }

.provider-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.provider-card { border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: 12px; cursor: pointer; transition: all 0.15s ease; display: flex; flex-direction: column; gap: 4px; }
.provider-card.active { border-color: var(--color-primary); background: #EFF6FF; }
.provider-card:hover { border-color: var(--color-primary-light); }
.provider-name { font-weight: 600; font-size: 14px; }
.provider-desc { font-size: 12px; color: var(--color-text-light); }

.field { margin-bottom: 12px; }
.field label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.text-input { width: 100%; padding: 8px 12px; border: 1px solid var(--color-border-dark); border-radius: var(--radius-sm); font-size: 14px; }
.field-hint { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; }
.key-status { color: var(--color-success); font-weight: 500; margin-top: 8px; font-size: 13px; }

.field-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.field-row label { font-weight: 600; font-size: 13px; min-width: 80px; }
.slider { flex: 1; accent-color: var(--color-primary); }
.rate-value { font-weight: 600; color: var(--color-primary); min-width: 36px; font-size: 14px; }

.about p { font-size: 13px; margin-bottom: 2px; }
.about .muted { color: var(--color-text-light); }
</style>
