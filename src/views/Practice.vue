<template>
  <div class="practice">
    <!-- Mode selection -->
    <div v-if="!selectedMode" class="mode-select fade-in">
      <h2>🎮 Choose a Game</h2>
      <div class="mode-grid">
        <div class="mode-card" @click="selectMode('cloze')">
          <div class="mode-icon">✏️</div>
          <h3>Cloze Fill-in</h3>
          <p>Pick the right word to complete the sentence</p>
        </div>
        <div class="mode-card" @click="selectMode('spelling')">
          <div class="mode-icon">🔤</div>
          <h3>Spelling Bee</h3>
          <p>Arrange letters to spell the word</p>
        </div>
        <div class="mode-card" @click="selectMode('image')">
          <div class="mode-icon">🖼️</div>
          <h3>Picture Match</h3>
          <p>Match the picture with the correct word</p>
        </div>
      </div>
    </div>

    <!-- Game area -->
    <div v-else class="game-area">
      <div class="game-header">
        <button class="back-btn" @click="exitMode">← Back</button>
        <h2>{{ modeTitles[selectedMode] }}</h2>
        <div class="game-score">⭐ {{ sessionScore }}</div>
      </div>

      <div class="game-progress">
        <span>Question {{ questionNum }} / 10</span>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (questionNum / 10 * 100) + '%' }"></div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Creating your question... 🤖</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <p>😅 {{ error }}</p>
        <p class="error-hint">Using built-in questions instead!</p>
      </div>

      <!-- Cloze mode -->
      <div v-else-if="selectedMode === 'cloze' && currentQuestion" class="question-area pop-in">
        <div class="cloze-sentence" v-html="clozeDisplay"></div>
        <div class="options-grid">
          <button v-for="opt in currentQuestion.options" :key="opt"
            :class="['option-btn', getOptionClass(opt)]"
            :disabled="answered"
            @click="answer(opt)">
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- Spelling mode -->
      <div v-else-if="selectedMode === 'spelling' && currentQuestion" class="question-area pop-in">
        <div class="spelling-meaning">{{ currentQuestion.meaning }}</div>
        <div class="spelling-hint">{{ currentQuestion.hint }}</div>
        <div class="spelling-answer-area">
          <div class="letter-slots">
            <span v-for="(letter, i) in spelledLetters" :key="i" class="letter-slot">
              {{ letter }}
            </span>
          </div>
        </div>
        <div class="letter-pool">
          <button v-for="(letter, i) in currentQuestion.letters" :key="i"
            :class="['letter-btn', { used: usedLetters[i] }]"
            :disabled="usedLetters[i] || answered"
            @click="pickLetter(i)">
            {{ letter }}
          </button>
        </div>
        <div class="spelling-controls">
          <button class="ctrl-btn" @click="removeLetter" :disabled="answered">⌫ Back</button>
          <button class="ctrl-btn submit" @click="submitSpelling" :disabled="spelledLetters.length === 0 || answered">✓ Submit</button>
        </div>
      </div>

      <!-- Image description mode -->
      <div v-else-if="selectedMode === 'image' && currentQuestion" class="question-area pop-in">
        <div class="image-display">
          <img v-if="currentImageUrl" :src="currentImageUrl" :alt="currentQuestion.word" @error="currentImageUrl = ''" />
          <div v-else class="image-emoji">🔍</div>
        </div>
        <p class="image-question">{{ currentQuestion.question }}</p>
        <div class="options-grid">
          <button v-for="opt in currentQuestion.options" :key="opt"
            :class="['option-btn', getOptionClass(opt)]"
            :disabled="answered"
            @click="answer(opt)">
            {{ opt }}
          </button>
        </div>
      </div>

      <!-- Feedback -->
      <transition name="fade">
        <div v-if="showFeedback" class="feedback-overlay" :class="feedbackType">
          <div class="feedback-content celebrate">
            <span class="feedback-emoji">{{ feedbackType === 'correct' ? '🎉' : '💪' }}</span>
            <p class="feedback-text">{{ feedbackType === 'correct' ? 'Great job!' : 'Keep trying!' }}</p>
            <p class="feedback-answer" v-if="feedbackType === 'wrong'">Answer: {{ currentQuestion.answer }}</p>
          </div>
        </div>
      </transition>

      <!-- Session complete -->
      <transition name="fade">
        <div v-if="sessionComplete" class="session-complete">
          <div class="complete-card pop-in">
            <span class="complete-emoji">🏆</span>
            <h2>Session Complete!</h2>
            <div class="complete-stats">
              <div class="complete-stat">
                <span class="cs-value">{{ sessionCorrect }}</span>
                <span class="cs-label">Correct</span>
              </div>
              <div class="complete-stat">
                <span class="cs-value">{{ 10 - sessionCorrect }}</span>
                <span class="cs-label">Wrong</span>
              </div>
              <div class="complete-stat">
                <span class="cs-value">+{{ sessionScore }}</span>
                <span class="cs-label">Score</span>
              </div>
            </div>
            <button class="btn-primary" @click="exitMode">Back to Games</button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { cambridgeWordBank, levelKeys, getWordsByLevel } from '../data/wordBank'
import { generateCloze, generateSpelling, generateImageDescription } from '../utils/aiService'
import { getWordImage } from '../utils/imageService'
import { speak } from '../utils/tts'

const settings = useSettingsStore()
const progress = useProgressStore()

const selectedMode = ref(null)
const loading = ref(false)
const error = ref('')
const currentQuestion = ref(null)
const currentImageUrl = ref('')
const answered = ref(false)
const selectedAnswer = ref('')
const showFeedback = ref(false)
const feedbackType = ref('correct')
const questionNum = ref(0)
const sessionScore = ref(0)
const sessionCorrect = ref(0)
const sessionComplete = ref(false)

// Spelling state
const spelledLetters = ref([])
const usedLetters = ref([])

const modeTitles = {
  cloze: '✏️ Cloze Fill-in',
  spelling: '🔤 Spelling Bee',
  image: '🖼️ Picture Match'
}

const clozeDisplay = computed(() => {
  if (!currentQuestion.value || selectedMode.value !== 'cloze') return ''
  return currentQuestion.value.sentence.replace('___', '<span class="blank">_____</span>')
})

function selectMode(mode) {
  selectedMode.value = mode
  resetSession()
  nextQuestion()
}

function resetSession() {
  questionNum.value = 0
  sessionScore.value = 0
  sessionCorrect.value = 0
  sessionComplete.value = false
  showFeedback.value = false
  answered.value = false
}

function exitMode() {
  selectedMode.value = null
  currentQuestion.value = null
  showFeedback.value = false
  sessionComplete.value = false
}

function getRandomWord() {
  const words = getWordsByLevel(settings.currentLevel)
  return words[Math.floor(Math.random() * words.length)]
}

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function generateDistractors(word, count = 3) {
  const allWords = levelKeys.flatMap(k => getWordsByLevel(k)).map(w => w.word)
  const distractors = shuffleArray(allWords.filter(w => w !== word)).slice(0, count)
  return distractors
}

async function nextQuestion() {
  if (questionNum.value >= 10) {
    sessionComplete.value = true
    return
  }

  questionNum.value++
  loading.value = true
  error.value = ''
  answered.value = false
  selectedAnswer.value = ''
  currentQuestion.value = null
  currentImageUrl.value = ''
  spelledLetters.value = []
  usedLetters.value = []

  const wordObj = getRandomWord()
  const word = wordObj.word

  // Try AI generation, fall back to local generation
  try {
    if (settings.apiKey) {
      const aiData = await generateWithAI(selectedMode.value, word)
      currentQuestion.value = aiData
    } else {
      throw new Error('No API key')
    }
  } catch (e) {
    error.value = e.message || 'AI unavailable'
    currentQuestion.value = generateLocal(selectedMode.value, wordObj)
  }

  // Load image for image mode
  if (selectedMode.value === 'image' && currentQuestion.value) {
    currentImageUrl.value = await getWordImage(currentQuestion.value.word)
  }

  loading.value = false
}

async function generateWithAI(mode, word) {
  if (mode === 'cloze') {
    return await generateCloze(settings.apiProvider, settings.apiKey, word)
  } else if (mode === 'spelling') {
    return await generateSpelling(settings.apiProvider, settings.apiKey, word)
  } else if (mode === 'image') {
    return await generateImageDescription(settings.apiProvider, settings.apiKey, word)
  }
}

function generateLocal(mode, wordObj) {
  const word = wordObj.word
  if (mode === 'cloze') {
    const sentence = wordObj.example.replace(new RegExp(word, 'i'), '___')
    const distractors = generateDistractors(word, 3)
    return {
      sentence: sentence,
      answer: word,
      options: shuffleArray([word, ...distractors]),
      hint: wordObj.meaning
    }
  } else if (mode === 'spelling') {
    const letters = word.split('')
    const extra = 'abcdefghijklmnopqrstuvwxyz'.split('')
    const distractors = shuffleArray(extra.filter(l => !letters.includes(l))).slice(0, 3)
    return {
      meaning: wordObj.meaning,
      hint: wordObj.example,
      letters: shuffleArray([...letters, ...distractors]),
      answer: word
    }
  } else if (mode === 'image') {
    const distractors = generateDistractors(word, 3)
    return {
      word: word,
      description: wordObj.example,
      question: 'What word does this picture show?',
      options: shuffleArray([word, ...distractors]),
      answer: word
    }
  }
}

// Cloze and image mode answering
function answer(opt) {
  if (answered.value) return
  answered.value = true
  selectedAnswer.value = opt
  const correct = opt === currentQuestion.value.answer

  if (correct) {
    sessionCorrect.value++
    sessionScore.value += 10
    feedbackType.value = 'correct'
    speak(currentQuestion.value.answer, settings.ttsRate)
  } else {
    feedbackType.value = 'wrong'
  }

  progress.recordAnswer(correct, currentQuestion.value.answer)
  showFeedback.value = true

  setTimeout(() => {
    showFeedback.value = false
    nextQuestion()
  }, 1800)
}

function getOptionClass(opt) {
  if (!answered.value) return ''
  if (opt === currentQuestion.value.answer) return 'correct'
  if (opt === selectedAnswer.value && opt !== currentQuestion.value.answer) return 'wrong'
  return 'dim'
}

// Spelling mode
function pickLetter(index) {
  if (answered.value || usedLetters.value[index]) return
  usedLetters.value[index] = true
  spelledLetters.value.push(currentQuestion.value.letters[index])
}

function removeLetter() {
  if (answered.value || spelledLetters.value.length === 0) return
  const lastIdx = usedLetters.value.lastIndexOf(true)
  if (lastIdx !== -1) {
    usedLetters.value[lastIdx] = false
    spelledLetters.value.pop()
  }
}

function submitSpelling() {
  if (answered.value || spelledLetters.value.length === 0) return
  answered.value = true
  const spelled = spelledLetters.value.join('').toLowerCase()
  const correct = spelled === currentQuestion.value.answer.toLowerCase()

  if (correct) {
    sessionCorrect.value++
    sessionScore.value += 10
    feedbackType.value = 'correct'
    speak(currentQuestion.value.answer, settings.ttsRate)
  } else {
    feedbackType.value = 'wrong'
  }

  progress.recordAnswer(correct, currentQuestion.value.answer)
  showFeedback.value = true

  setTimeout(() => {
    showFeedback.value = false
    nextQuestion()
  }, 1800)
}
</script>

<style scoped>
.practice { max-width: 700px; margin: 0 auto; }

.mode-select { text-align: center; }
.mode-select h2 { font-size: 28px; font-weight: 800; color: var(--color-primary); margin-bottom: 24px; }

.mode-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.mode-card {
  background: var(--color-card);
  border-radius: var(--radius);
  padding: 28px 20px;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.mode-card:hover { box-shadow: var(--shadow-hover); transform: translateY(-4px); }

.mode-icon { font-size: 48px; margin-bottom: 12px; }
.mode-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
.mode-card p { font-size: 13px; color: var(--color-text-light); }

.game-area { position: relative; }

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.back-btn {
  background: var(--color-card);
  color: var(--color-primary);
  border: 2px solid var(--color-primary);
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 600;
}

.game-header h2 { font-size: 22px; font-weight: 700; color: var(--color-text); }

.game-score {
  background: var(--color-yellow);
  color: var(--color-text);
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 18px;
}

.game-progress { margin-bottom: 28px; }
.game-progress span { font-size: 14px; color: var(--color-text-light); }
.progress-bar { height: 8px; background: #E8E8ED; border-radius: 4px; margin-top: 6px; overflow: hidden; }
.progress-fill { height: 100%; background: var(--color-primary); border-radius: 4px; transition: width 0.3s ease; }

.loading-state { text-align: center; padding: 60px 0; }
.loading-spinner {
  width: 48px; height: 48px;
  border: 4px solid #E8E8ED;
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-state { text-align: center; padding: 20px; }
.error-hint { font-size: 14px; color: var(--color-text-light); }

.question-area { text-align: center; }

.cloze-sentence {
  font-size: 24px;
  line-height: 1.6;
  margin-bottom: 28px;
  padding: 24px;
  background: var(--color-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.blank { color: var(--color-primary); font-weight: 800; border-bottom: 3px solid var(--color-primary); padding: 0 12px; }

.options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }

.option-btn {
  background: var(--color-card);
  border: 3px solid var(--color-border);
  padding: 18px;
  border-radius: var(--radius-sm);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  transition: all 0.2s ease;
}
.option-btn:hover:not(:disabled) { border-color: var(--color-primary); background: #F0EDFF; }
.option-btn.correct { background: var(--color-green); color: white; border-color: var(--color-green); }
.option-btn.wrong { background: var(--color-orange); color: white; border-color: var(--color-orange); }
.option-btn.dim { opacity: 0.4; }

.spelling-meaning { font-size: 28px; font-weight: 800; color: var(--color-primary); margin-bottom: 8px; }
.spelling-hint { font-size: 16px; color: var(--color-text-light); margin-bottom: 24px; }

.letter-slots { display: flex; gap: 8px; justify-content: center; margin-bottom: 28px; flex-wrap: wrap; }
.letter-slot {
  width: 44px; height: 52px;
  border: 3px solid var(--color-primary);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 800;
  text-transform: uppercase;
  color: var(--color-primary);
  background: #F0EDFF;
}

.letter-pool { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px; }
.letter-btn {
  width: 48px; height: 48px;
  border-radius: 12px;
  background: var(--color-card);
  border: 2px solid var(--color-border);
  font-size: 22px; font-weight: 700;
  text-transform: uppercase;
  color: var(--color-text);
}
.letter-btn:hover:not(:disabled) { border-color: var(--color-primary); background: #F0EDFF; }
.letter-btn.used { opacity: 0.3; cursor: not-allowed; }

.spelling-controls { display: flex; gap: 12px; justify-content: center; }
.ctrl-btn {
  padding: 10px 24px;
  border-radius: 12px;
  font-size: 16px; font-weight: 600;
  border: 2px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-text);
}
.ctrl-btn.submit { background: var(--color-green); color: white; border-color: var(--color-green); }

.image-display {
  width: 280px; height: 210px;
  border-radius: var(--radius);
  overflow: hidden;
  margin: 0 auto 20px;
  background: #F0F0F5;
  display: flex; align-items: center; justify-content: center;
}
.image-display img { width: 100%; height: 100%; object-fit: cover; }
.image-emoji { font-size: 64px; }

.image-question { font-size: 20px; font-weight: 600; margin-bottom: 24px; }

.feedback-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  background: rgba(0, 0, 0, 0.3);
}
.feedback-overlay.correct { background: rgba(0, 184, 148, 0.3); }
.feedback-overlay.wrong { background: rgba(255, 118, 117, 0.3); }

.feedback-content { text-align: center; }
.feedback-emoji { font-size: 80px; display: block; }
.feedback-text { font-size: 28px; font-weight: 800; color: white; margin-top: 8px; }
.feedback-answer { font-size: 20px; color: white; margin-top: 4px; }

.session-complete {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
}

.complete-card {
  background: var(--color-card);
  border-radius: 24px;
  padding: 40px 48px;
  text-align: center;
  box-shadow: var(--shadow-hover);
}

.complete-emoji { font-size: 72px; display: block; }
.complete-card h2 { font-size: 28px; font-weight: 800; color: var(--color-primary); margin: 12px 0 24px; }

.complete-stats { display: flex; gap: 32px; margin-bottom: 28px; }
.complete-stat { display: flex; flex-direction: column; align-items: center; }
.cs-value { font-size: 32px; font-weight: 800; color: var(--color-primary); }
.cs-label { font-size: 14px; color: var(--color-text-light); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
