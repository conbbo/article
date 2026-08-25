<template>
  <div class="wordbank">
    <h2>Word Bank</h2>

    <div class="level-tabs">
      <button v-for="key in levelKeys" :key="key"
        :class="['tab', { active: selectedLevel === key }]"
        @click="selectedLevel = key">
        {{ cambridgeWordBank[key].level }}
        <span class="tab-cefr">{{ cambridgeWordBank[key].cefr }}</span>
      </button>
    </div>

    <div class="level-info">
      <p>{{ currentLevelData.description }}</p>
      <span class="word-count">{{ currentLevelData.words.length }} words</span>
    </div>

    <div class="import-section card">
      <h3>Import Custom Words</h3>
      <p class="hint">Format: word,meaning (one per line)</p>
      <div class="import-area">
        <textarea v-model="importText" placeholder="happy,开心&#10;run,跑" rows="3" class="import-input"></textarea>
        <button class="btn-primary" @click="importWords">Import</button>
      </div>
    </div>

    <div class="word-list">
      <div v-for="(w, i) in currentLevelData.words" :key="i" class="word-row" :class="{ learned: progress.learnedWords.includes(w.word) }">
        <div class="word-info">
          <span class="word-en">{{ w.word }}</span>
          <span class="word-phonetic">{{ w.phonetic }}</span>
          <span class="word-cn">{{ w.meaning }}</span>
        </div>
        <div class="word-actions">
          <button class="icon-btn" @click="speak(w.word, settings.ttsRate)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
          <span v-if="progress.learnedWords.includes(w.word)" class="check-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        </div>
      </div>
    </div>

    <div v-if="customWords.length > 0" class="custom-section">
      <h3>Custom Words ({{ customWords.length }})</h3>
      <div v-for="(w, i) in customWords" :key="'c'+i" class="word-row">
        <div class="word-info">
          <span class="word-en">{{ w.word }}</span>
          <span class="word-cn">{{ w.meaning }}</span>
        </div>
        <button class="icon-btn" @click="speak(w.word, settings.ttsRate)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { cambridgeWordBank, levelKeys } from '../data/wordBank'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { speak } from '../utils/tts'

const settings = useSettingsStore()
const progress = useProgressStore()
const selectedLevel = ref('starters')
const importText = ref('')
const customWords = ref([])

const currentLevelData = computed(() => cambridgeWordBank[selectedLevel.value])

function importWords() {
  const lines = importText.value.trim().split('\n')
  for (const line of lines) {
    const parts = line.trim().split(',')
    if (parts.length >= 2) {
      customWords.value.push({ word: parts[0].trim(), meaning: parts[1].trim() })
    }
  }
  importText.value = ''
}

onMounted(async () => {
  await Promise.all([progress.init(), settings.init()])
  selectedLevel.value = settings.currentLevel
})
</script>

<style scoped>
.wordbank { max-width: 700px; margin: 0 auto; }
h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; }

.level-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
.tab { padding: 6px 16px; border-radius: var(--radius-xs); background: white; border: 1px solid var(--color-border); color: var(--color-text-light); font-weight: 500; font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 1px; }
.tab.active { background: var(--color-primary); color: white; border-color: var(--color-primary); }
.tab-cefr { font-size: 11px; opacity: 0.8; }

.level-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 10px 16px; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
.level-info p { font-size: 13px; color: var(--color-text-light); }
.word-count { font-weight: 600; color: var(--color-primary); font-size: 13px; }

.import-section { margin-bottom: 20px; }
.import-section h3 { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
.import-section .hint { font-size: 12px; color: var(--color-text-muted); margin-bottom: 8px; }
.import-area { display: flex; gap: 8px; align-items: flex-start; }
.import-input { flex: 1; padding: 8px; border: 1px solid var(--color-border-dark); border-radius: var(--radius-sm); font-size: 13px; resize: vertical; }

.word-list { display: flex; flex-direction: column; gap: 4px; }
.word-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
.word-row.learned { border-left: 3px solid var(--color-success); }

.word-info { display: flex; align-items: center; gap: 12px; }
.word-en { font-size: 15px; font-weight: 600; }
.word-phonetic { font-size: 13px; color: var(--color-text-muted); }
.word-cn { font-size: 13px; color: var(--color-text-light); }

.word-actions { display: flex; align-items: center; gap: 8px; }
.icon-btn { width: 32px; height: 32px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: white; color: var(--color-text-light); display: flex; align-items: center; justify-content: center; }
.icon-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
.check-icon { color: var(--color-success); }

.custom-section { margin-top: 24px; }
.custom-section h3 { font-size: 15px; font-weight: 600; margin-bottom: 8px; }
</style>
