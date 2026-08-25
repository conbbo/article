<template>
  <div class="wordbank">
    <h2>📚 Word Bank</h2>

    <div class="level-tabs">
      <button v-for="key in levelKeys" :key="key"
        :class="['tab', { active: selectedLevel === key }]"
        :style="selectedLevel === key ? { background: cambridgeWordBank[key].color } : {}"
        @click="selectedLevel = key">
        {{ cambridgeWordBank[key].level }}
        <span class="tab-cefr">{{ cambridgeWordBank[key].cefr }}</span>
      </button>
    </div>

    <div class="level-info">
      <p>{{ currentLevelData.description }}</p>
      <span class="word-count">{{ currentLevelData.words.length }} words</span>
    </div>

    <div class="import-section">
      <h3>Import Custom Words</h3>
      <div class="import-area">
        <textarea v-model="importText" placeholder="Format: word,meaning&#10;Example:&#10;happy,开心&#10;run,跑"
          rows="4" class="import-input"></textarea>
        <button class="btn-primary" @click="importWords">Import</button>
      </div>
    </div>

    <div class="word-list">
      <div v-for="(wordObj, i) in currentLevelData.words" :key="i"
        class="word-row"
        :class="{ learned: progress.learnedWords.includes(wordObj.word) }">
        <div class="word-info">
          <span class="word-en">{{ wordObj.word }}</span>
          <span class="word-phonetic">{{ wordObj.phonetic }}</span>
          <span class="word-cn">{{ wordObj.meaning }}</span>
        </div>
        <div class="word-actions">
          <button class="speak-btn" @click="speak(wordObj.word, settings.ttsRate)">🔊</button>
          <span class="learned-mark" v-if="progress.learnedWords.includes(wordObj.word)">✅</span>
        </div>
      </div>
    </div>

    <div v-if="customWords.length > 0" class="custom-section">
      <h3>Custom Words ({{ customWords.length }})</h3>
      <div v-for="(wordObj, i) in customWords" :key="'custom-' + i" class="word-row">
        <div class="word-info">
          <span class="word-en">{{ wordObj.word }}</span>
          <span class="word-cn">{{ wordObj.meaning }}</span>
        </div>
        <button class="speak-btn" @click="speak(wordObj.word, settings.ttsRate)">🔊</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { cambridgeWordBank, levelKeys } from '../data/wordBank'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { speak } from '../utils/tts'

const settings = useSettingsStore()
const progress = useProgressStore()

const selectedLevel = ref(settings.currentLevel)
const importText = ref('')
const customWords = ref([])

const currentLevelData = computed(() => cambridgeWordBank[selectedLevel.value])

function importWords() {
  const lines = importText.value.trim().split('\n')
  for (const line of lines) {
    const parts = line.trim().split(',')
    if (parts.length >= 2) {
      customWords.value.push({
        word: parts[0].trim(),
        meaning: parts[1].trim(),
        phonetic: '',
        example: '',
        exampleCn: ''
      })
    }
  }
  importText.value = ''
}
</script>

<style scoped>
.wordbank { max-width: 800px; margin: 0 auto; }

h2 { font-size: 28px; font-weight: 800; color: var(--color-primary); margin-bottom: 20px; }

.level-tabs { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

.tab {
  padding: 10px 20px;
  border-radius: 16px;
  background: #E8E8ED;
  color: var(--color-text-light);
  font-weight: 600;
  font-size: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.tab.active { color: white; }
.tab-cefr { font-size: 11px; opacity: 0.8; }

.level-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 12px 20px;
  background: var(--color-card);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
}
.level-info p { font-size: 14px; color: var(--color-text-light); }
.word-count { font-weight: 700; color: var(--color-primary); }

.import-section { margin-bottom: 24px; }
.import-section h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
.import-area { display: flex; gap: 12px; align-items: flex-start; }
.import-input {
  flex: 1;
  padding: 12px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 14px;
  resize: vertical;
}

.word-list { display: flex; flex-direction: column; gap: 8px; }

.word-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--color-card);
  border-radius: var(--radius-sm);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.word-row.learned { border-left: 4px solid var(--color-green); }

.word-info { display: flex; align-items: center; gap: 16px; }
.word-en { font-size: 18px; font-weight: 700; color: var(--color-text); }
.word-phonetic { font-size: 14px; color: var(--color-text-light); }
.word-cn { font-size: 15px; color: var(--color-text-light); }

.word-actions { display: flex; align-items: center; gap: 10px; }
.speak-btn {
  background: #F0EDFF;
  border: none;
  width: 36px; height: 36px;
  border-radius: 10px;
  font-size: 18px;
}
.learned-mark { font-size: 18px; }

.custom-section { margin-top: 32px; }
.custom-section h3 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
</style>
