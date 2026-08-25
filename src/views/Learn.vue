<template>
  <div class="learn">
    <div class="header">
      <h2>📖 Learn New Words</h2>
      <div class="level-selector">
        <button v-for="key in levelKeys" :key="key"
          :class="['level-btn', { active: settings.currentLevel === key }]"
          :style="settings.currentLevel === key ? { background: cambridgeWordBank[key].color } : {}"
          @click="changeLevel(key)">
          {{ cambridgeWordBank[key].level }}
        </button>
      </div>
    </div>

    <div class="card-area" v-if="currentWord">
      <transition name="card-flip" mode="out-in">
        <div class="word-card" :key="currentIndex" :class="{ flipped: isFlipped }">
          <div class="card-front" v-if="!isFlipped">
            <div class="word-level-badge" :style="{ background: currentLevelData.color }">
              {{ currentLevelData.cefr }}
            </div>
            <div class="word-image" v-if="imageUrl">
              <img :src="imageUrl" :alt="currentWord.word" @error="imageError = true" />
            </div>
            <div class="word-image-placeholder" v-else>
              <span class="placeholder-icon">🖼️</span>
            </div>
            <h1 class="word-text">{{ currentWord.word }}</h1>
            <p class="word-phonetic">{{ currentWord.phonetic }}</p>
            <div class="audio-buttons">
              <button class="audio-btn" @click="speakWord" title="Pronounce word">
                🔊 Word
              </button>
              <button class="audio-btn" @click="speakExample" title="Read example sentence">
                📢 Sentence
              </button>
            </div>
            <p class="flip-hint" @click="isFlipped = true">Tap to see meaning 👆</p>
          </div>
          <div class="card-back" v-else>
            <div class="meaning-section">
              <span class="meaning-label">Meaning</span>
              <h2 class="word-meaning">{{ currentWord.meaning }}</h2>
            </div>
            <div class="example-section">
              <span class="meaning-label">Example</span>
              <p class="example-en">{{ currentWord.example }}</p>
              <p class="example-cn">{{ currentWord.exampleCn }}</p>
            </div>
            <button class="audio-btn" @click="speakExample">📢 Read Sentence</button>
            <p class="flip-hint" @click="isFlipped = false">👈 Back to word</p>
          </div>
        </div>
      </transition>
    </div>

    <div class="card-nav">
      <button class="nav-btn" @click="prevWord" :disabled="currentIndex === 0">⬅️ Prev</button>
      <div class="progress-dots">
        <span v-for="(w, i) in currentWords" :key="i"
          :class="['dot', { active: i === currentIndex, learned: progress.learnedWords.includes(w.word) }]">
        </span>
      </div>
      <button class="nav-btn" @click="nextWord">Next ➡️</button>
    </div>

    <div class="learned-badge" v-if="currentWord && progress.learnedWords.includes(currentWord.word)">
      ✅ Learned!
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { cambridgeWordBank, levelKeys } from '../data/wordBank'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { speak } from '../utils/tts'
import { getWordImage } from '../utils/imageService'

const settings = useSettingsStore()
const progress = useProgressStore()

const currentIndex = ref(0)
const isFlipped = ref(false)
const imageUrl = ref(null)
const imageError = ref(false)

const currentLevelData = computed(() => cambridgeWordBank[settings.currentLevel])
const currentWords = computed(() => currentLevelData.value.words)
const currentWord = computed(() => currentWords.value[currentIndex.value])

function changeLevel(key) {
  settings.updateLevel(key)
  currentIndex.value = 0
  isFlipped.value = false
}

function speakWord() {
  if (currentWord.value) {
    speak(currentWord.value.word, settings.ttsRate)
  }
}

function speakExample() {
  if (currentWord.value) {
    speak(currentWord.value.example, settings.ttsRate)
  }
}

function prevWord() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    isFlipped.value = false
  }
}

function nextWord() {
  if (currentWord.value) {
    progress.markLearned(currentWord.value.word)
  }
  if (currentIndex.value < currentWords.value.length - 1) {
    currentIndex.value++
    isFlipped.value = false
  } else {
    currentIndex.value = 0
  }
}

async function loadImage() {
  imageError.value = false
  imageUrl.value = null
  if (currentWord.value) {
    imageUrl.value = await getWordImage(currentWord.value.word)
  }
}

watch(currentIndex, loadImage)
watch(() => settings.currentLevel, loadImage)
onMounted(loadImage)
</script>

<style scoped>
.learn { max-width: 700px; margin: 0 auto; }

.header { text-align: center; margin-bottom: 24px; }

.header h2 { font-size: 28px; font-weight: 800; color: var(--color-primary); margin-bottom: 16px; }

.level-selector { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

.level-btn {
  padding: 8px 20px;
  border-radius: 20px;
  background: #E8E8ED;
  color: var(--color-text-light);
  font-weight: 600;
  font-size: 14px;
}

.level-btn.active { color: white; }

.card-area {
  perspective: 1000px;
  margin-bottom: 24px;
}

.word-card {
  background: var(--color-card);
  border-radius: 24px;
  box-shadow: var(--shadow);
  padding: 40px 32px;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.word-level-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 14px;
  border-radius: 12px;
  color: white;
  font-size: 13px;
  font-weight: 700;
}

.word-image, .word-image-placeholder {
  width: 200px;
  height: 150px;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  background: #F0F0F5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.word-image img { width: 100%; height: 100%; object-fit: cover; }

.placeholder-icon { font-size: 48px; }

.word-text { font-size: 48px; font-weight: 800; color: var(--color-text); }

.word-phonetic { font-size: 20px; color: var(--color-text-light); margin-top: 8px; }

.audio-buttons { display: flex; gap: 12px; margin-top: 20px; }

.audio-btn {
  background: var(--color-primary);
  color: white;
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.audio-btn:hover { background: var(--color-primary-light); }

.flip-hint {
  margin-top: 20px;
  color: var(--color-text-light);
  font-size: 14px;
  cursor: pointer;
}

.card-back { width: 100%; text-align: center; }

.meaning-section, .example-section { margin-bottom: 20px; }

.meaning-label {
  display: block;
  font-size: 13px;
  color: var(--color-text-light);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}

.word-meaning { font-size: 36px; font-weight: 800; color: var(--color-primary); }

.example-en { font-size: 20px; color: var(--color-text); margin-bottom: 6px; }
.example-cn { font-size: 16px; color: var(--color-text-light); }

.card-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.nav-btn {
  background: var(--color-card);
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.progress-dots { display: flex; gap: 6px; }

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #DDD;
  transition: all 0.2s;
}

.dot.active { background: var(--color-primary); transform: scale(1.3); }
.dot.learned { background: var(--color-green); }

.learned-badge {
  text-align: center;
  margin-top: 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-green);
}

.card-flip-enter-active, .card-flip-leave-active {
  transition: all 0.3s ease;
}
.card-flip-enter-from { opacity: 0; transform: rotateY(-90deg); }
.card-flip-leave-to { opacity: 0; transform: rotateY(90deg); }
</style>
