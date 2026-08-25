<template>
  <div class="daily-task">
    <!-- Pre-session config -->
    <div v-if="phase === 'config'" class="config-phase fade-in">
      <h2>Daily Task</h2>
      <p class="subtitle">Configure your daily study session. Game modes will be assigned randomly.</p>

      <div class="config-card card">
        <div class="config-row">
          <label>Word Level</label>
          <select v-model="configLevel" class="config-select">
            <option v-for="key in levelKeys" :key="key" :value="key">
              {{ cambridgeWordBank[key].level }} ({{ cambridgeWordBank[key].cefr }})
            </option>
          </select>
        </div>
        <div class="config-row">
          <label>Words to Learn</label>
          <div class="number-control">
            <button @click="configWords = Math.max(3, configWords - 1)">-</button>
            <span class="number-value">{{ configWords }}</span>
            <button @click="configWords = Math.min(20, configWords + 1)">+</button>
          </div>
        </div>
        <div class="config-row">
          <label>Practice Questions</label>
          <div class="number-control">
            <button @click="configQuestions = Math.max(5, configQuestions - 5)">-</button>
            <span class="number-value">{{ configQuestions }}</span>
            <button @click="configQuestions = Math.min(50, configQuestions + 5)">+</button>
          </div>
        </div>
        <div class="config-summary">
          <p>{{ configWords }} words to learn + {{ configQuestions }} practice questions</p>
          <p class="hint">Game modes (Cloze, Spelling, Picture Match) will be randomly assigned.</p>
        </div>
        <button class="btn-primary start-btn" @click="startSession">Start Session</button>
      </div>
    </div>

    <!-- Phase: Learning words -->
    <div v-else-if="phase === 'learn'" class="learn-phase fade-in">
      <div class="phase-header">
        <div class="phase-info">
          <span class="phase-tag">Step 1: Learn Words</span>
          <span class="phase-progress">{{ learnIndex + 1 }} / {{ sessionWords.length }}</span>
        </div>
        <div class="phase-bar">
          <div class="phase-bar-fill" :style="{ width: ((learnIndex + 1) / sessionWords.length * 100) + '%' }"></div>
        </div>
      </div>

      <div class="word-card-area">
        <div class="word-card" :key="learnIndex">
          <div class="word-level-tag" :style="{ background: cambridgeWordBank[configLevel].color }">
            {{ cambridgeWordBank[configLevel].cefr }}
          </div>
          <div class="word-image" v-if="currentImageUrl">
            <img :src="currentImageUrl" :alt="currentWord.word" @error="currentImageUrl = ''" />
          </div>
          <h1 class="word-text">{{ currentWord.word }}</h1>
          <p class="word-phonetic">{{ currentWord.phonetic }}</p>
          <div class="word-actions">
            <button class="btn-secondary" @click="speak(currentWord.word, settings.ttsRate)">Pronounce</button>
            <button class="btn-secondary" @click="speak(currentWord.example, settings.ttsRate)">Example</button>
          </div>
          <div class="word-detail">
            <p class="word-meaning">{{ currentWord.meaning }}</p>
            <p class="word-example">{{ currentWord.example }}</p>
            <p class="word-example-cn">{{ currentWord.exampleCn }}</p>
          </div>
          <button class="btn-primary next-word-btn" @click="nextLearnWord">
            {{ learnIndex < sessionWords.length - 1 ? 'Next Word' : 'Start Practice' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Phase: Practice -->
    <div v-else-if="phase === 'practice'" class="practice-phase fade-in">
      <div class="phase-header">
        <div class="phase-info">
          <span class="phase-tag">Step 2: Practice ({{ currentGameName }})</span>
          <span class="phase-progress">{{ practiceIndex + 1 }} / {{ sessionQuestions.length }}</span>
        </div>
        <div class="phase-bar">
          <div class="phase-bar-fill" :style="{ width: ((practiceIndex + 1) / sessionQuestions.length * 100) + '%' }"></div>
        </div>
      </div>

      <div v-if="practiceLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Generating question...</p>
      </div>

      <div v-else-if="currentQuestion" class="question-area slide-in">
        <!-- Cloze -->
        <div v-if="currentGameMode === 'cloze'" class="game-content">
          <p class="game-instruction">Fill in the blank:</p>
          <div class="cloze-sentence" v-html="clozeDisplay"></div>
          <div class="options-grid">
            <button v-for="opt in currentQuestion.options" :key="opt"
              :class="['option-btn', getOptionClass(opt)]"
              :disabled="answered" @click="answerQuestion(opt)">
              {{ opt }}
            </button>
          </div>
        </div>

        <!-- Spelling -->
        <div v-if="currentGameMode === 'spelling'" class="game-content">
          <p class="game-instruction">Spell the word for: <strong>{{ currentQuestion.meaning }}</strong></p>
          <p class="game-hint">{{ currentQuestion.hint }}</p>
          <div class="letter-slots">
            <span v-for="(letter, i) in spelledLetters" :key="i" class="letter-slot">{{ letter }}</span>
          </div>
          <div class="letter-pool">
            <button v-for="(letter, i) in currentQuestion.letters" :key="i"
              :class="['letter-btn', { used: usedLetters[i] }]"
              :disabled="usedLetters[i] || answered" @click="pickLetter(i)">
              {{ letter }}
            </button>
          </div>
          <div class="spelling-controls">
            <button class="btn-secondary" @click="removeLetter" :disabled="answered">Backspace</button>
            <button class="btn-primary" @click="submitSpelling" :disabled="spelledLetters.length === 0 || answered">Submit</button>
          </div>
        </div>

        <!-- Image -->
        <div v-if="currentGameMode === 'image'" class="game-content">
          <p class="game-instruction">{{ currentQuestion.question }}</p>
          <div class="image-display">
            <img v-if="currentImageUrl" :src="currentImageUrl" :alt="currentQuestion.word" @error="currentImageUrl = ''" />
            <span v-else class="img-placeholder">No image</span>
          </div>
          <div class="options-grid">
            <button v-for="opt in currentQuestion.options" :key="opt"
              :class="['option-btn', getOptionClass(opt)]"
              :disabled="answered" @click="answerQuestion(opt)">
              {{ opt }}
            </button>
          </div>
        </div>

        <!-- Feedback -->
        <transition name="fade">
          <div v-if="showFeedback" class="feedback-bar" :class="feedbackType">
            <span v-if="feedbackType === 'correct'">Correct! +10 points</span>
            <span v-else>Wrong. Answer: {{ currentQuestion.answer }}</span>
          </div>
        </transition>
      </div>
    </div>

    <!-- Phase: Complete -->
    <div v-else-if="phase === 'complete'" class="complete-phase fade-in">
      <div class="complete-card card">
        <h2>Session Complete</h2>
        <div class="complete-stats">
          <div class="cs-item">
            <span class="cs-value">{{ sessionWords.length }}</span>
            <span class="cs-label">Words Learned</span>
          </div>
          <div class="cs-item">
            <span class="cs-value">{{ sessionCorrect }}</span>
            <span class="cs-label">Correct</span>
          </div>
          <div class="cs-item">
            <span class="cs-value">{{ sessionQuestions.length - sessionCorrect }}</span>
            <span class="cs-label">Wrong</span>
          </div>
          <div class="cs-item">
            <span class="cs-value">{{ sessionScore }}</span>
            <span class="cs-label">Score</span>
          </div>
        </div>
        <div class="complete-actions">
          <button class="btn-secondary" @click="goHome">Back to Dashboard</button>
          <button class="btn-primary" @click="resetSession">New Session</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { cambridgeWordBank, levelKeys } from '../data/wordBank'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { generateCloze, generateSpelling, generateImageDescription } from '../utils/aiService'
import { getWordImage } from '../utils/imageService'
import { speak } from '../utils/tts'

const router = useRouter()
const settings = useSettingsStore()
const progress = useProgressStore()

const phase = ref('config')
const configLevel = ref(settings.currentLevel)
const configWords = ref(10)
const configQuestions = ref(20)

const sessionWords = ref([])
const learnIndex = ref(0)
const currentImageUrl = ref('')

const sessionQuestions = ref([])
const practiceIndex = ref(0)
const currentGameMode = ref('cloze')
const currentQuestion = ref(null)
const practiceLoading = ref(false)
const answered = ref(false)
const selectedAnswer = ref('')
const showFeedback = ref(false)
const feedbackType = ref('correct')

const sessionCorrect = ref(0)
const sessionScore = ref(0)

// Spelling state
const spelledLetters = ref([])
const usedLetters = ref([])

const GAME_MODES = ['cloze', 'spelling', 'image']
const GAME_NAMES = { cloze: 'Cloze Fill-in', spelling: 'Spelling', image: 'Picture Match' }

const currentWord = computed(() => sessionWords.value[learnIndex.value] || null)
const currentGameName = computed(() => GAME_NAMES[currentGameMode.value] || '')
const clozeDisplay = computed(() => {
  if (!currentQuestion.value || currentGameMode.value !== 'cloze') return ''
  return currentQuestion.value.sentence.replace('___', '<span class="blank">_____</span>')
})

function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function getRandomWords(level, count) {
  const allWords = cambridgeWordBank[level]?.words || []
  return shuffleArray([...allWords]).slice(0, Math.min(count, allWords.length))
}

function generateGameSequence(count) {
  const seq = []
  for (let i = 0; i < count; i++) {
    seq.push(GAME_MODES[i % GAME_MODES.length])
  }
  return shuffleArray(seq)
}

function generateDistractors(word, count = 3) {
  const allWords = levelKeys.flatMap(k => cambridgeWordBank[k].words).map(w => w.word)
  return shuffleArray(allWords.filter(w => w !== word)).slice(0, count)
}

function generateLocalQuestion(mode, wordObj) {
  const word = wordObj.word
  if (mode === 'cloze') {
    const sentence = wordObj.example.replace(new RegExp(word, 'i'), '___')
    return {
      sentence, answer: word,
      options: shuffleArray([word, ...generateDistractors(word, 3)]),
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
  } else {
    return {
      word, description: wordObj.example,
      question: 'What word does this picture show?',
      options: shuffleArray([word, ...generateDistractors(word, 3)]),
      answer: word
    }
  }
}

async function startSession() {
  progress.setDailyConfig(configWords.value, configQuestions.value)
  sessionWords.value = getRandomWords(configLevel.value, configWords.value)
  sessionQuestions.value = generateGameSequence(configQuestions.value)
  learnIndex.value = 0
  sessionCorrect.value = 0
  sessionScore.value = 0
  phase.value = 'learn'
  await loadImage()
}

async function loadImage() {
  currentImageUrl.value = ''
  if (currentWord.value) {
    currentImageUrl.value = await getWordImage(currentWord.value.word)
  }
}

async function nextLearnWord() {
  if (currentWord.value) {
    await progress.markLearned(currentWord.value.word)
  }
  if (learnIndex.value < sessionWords.value.length - 1) {
    learnIndex.value++
    await loadImage()
  } else {
    practiceIndex.value = 0
    phase.value = 'practice'
    await nextQuestion()
  }
}

async function nextQuestion() {
  if (practiceIndex.value >= sessionQuestions.value.length) {
    phase.value = 'complete'
    return
  }

  currentGameMode.value = sessionQuestions.value[practiceIndex.value]
  practiceLoading.value = true
  answered.value = false
  selectedAnswer.value = ''
  currentQuestion.value = null
  currentImageUrl.value = ''
  spelledLetters.value = []
  usedLetters.value = []

  const wordObj = sessionWords.value[practiceIndex.value % sessionWords.value.length]
  const word = wordObj.word

  try {
    if (settings.apiKey || settings.apiProvider === 'local') {
      const opts = [settings.apiProvider, settings.apiKey, word, settings.apiBaseUrl, settings.apiModel]
      if (currentGameMode.value === 'cloze') {
        currentQuestion.value = await generateCloze(...opts)
      } else if (currentGameMode.value === 'spelling') {
        currentQuestion.value = await generateSpelling(...opts)
      } else {
        currentQuestion.value = await generateImageDescription(...opts)
      }
    } else {
      throw new Error('No API key')
    }
  } catch (e) {
    currentQuestion.value = generateLocalQuestion(currentGameMode.value, wordObj)
  }

  if (currentGameMode.value === 'image' && currentQuestion.value) {
    currentImageUrl.value = await getWordImage(currentQuestion.value.word)
  }

  practiceLoading.value = false
}

function answerQuestion(opt) {
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
  progress.recordAnswer(correct, currentQuestion.value.answer, currentGameMode.value)
  showFeedback.value = true
  setTimeout(() => {
    showFeedback.value = false
    practiceIndex.value++
    nextQuestion()
  }, 1500)
}

function getOptionClass(opt) {
  if (!answered.value) return ''
  if (opt === currentQuestion.value.answer) return 'correct'
  if (opt === selectedAnswer.value && opt !== currentQuestion.value.answer) return 'wrong'
  return 'dim'
}

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
  progress.recordAnswer(correct, currentQuestion.value.answer, 'spelling')
  showFeedback.value = true
  setTimeout(() => {
    showFeedback.value = false
    practiceIndex.value++
    nextQuestion()
  }, 1500)
}

function resetSession() {
  phase.value = 'config'
  sessionWords.value = []
  sessionQuestions.value = []
}

function goHome() {
  router.push('/')
}

onMounted(async () => {
  await progress.init()
  await settings.init()
  configLevel.value = settings.currentLevel
})

watch(learnIndex, loadImage)
</script>

<style scoped>
.daily-task { max-width: 640px; margin: 0 auto; }

h2 { font-size: 22px; font-weight: 700; color: var(--color-text); margin-bottom: 4px; }
.subtitle { font-size: 14px; color: var(--color-text-light); margin-bottom: 24px; }

/* Config */
.config-card { display: flex; flex-direction: column; gap: 20px; }
.config-row { display: flex; align-items: center; justify-content: space-between; }
.config-row label { font-weight: 600; font-size: 14px; }
.config-select { padding: 8px 12px; border: 1px solid var(--color-border-dark); border-radius: var(--radius-sm); background: white; }

.number-control { display: flex; align-items: center; gap: 12px; }
.number-control button { width: 32px; height: 32px; border: 1px solid var(--color-border-dark); border-radius: var(--radius-xs); background: white; font-size: 16px; font-weight: 600; }
.number-value { font-size: 18px; font-weight: 700; min-width: 24px; text-align: center; }

.config-summary { padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm); border: 1px solid var(--color-border); }
.config-summary p { font-size: 14px; font-weight: 500; }
.config-summary .hint { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; }

.start-btn { align-self: center; margin-top: 8px; }

/* Phase header */
.phase-header { margin-bottom: 20px; }
.phase-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.phase-tag { font-size: 13px; font-weight: 600; color: var(--color-primary); }
.phase-progress { font-size: 13px; color: var(--color-text-light); }
.phase-bar { height: 4px; background: var(--color-border); border-radius: 2px; overflow: hidden; }
.phase-bar-fill { height: 100%; background: var(--color-primary); border-radius: 2px; transition: width 0.3s ease; }

/* Learn phase */
.word-card-area { display: flex; justify-content: center; }
.word-card { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 32px; text-align: center; max-width: 480px; width: 100%; position: relative; }
.word-level-tag { position: absolute; top: 12px; right: 12px; padding: 3px 10px; border-radius: var(--radius-xs); color: white; font-size: 12px; font-weight: 600; }
.word-image { width: 200px; height: 140px; border-radius: var(--radius-sm); overflow: hidden; margin: 0 auto 16px; background: #F1F5F9; }
.word-image img { width: 100%; height: 100%; object-fit: cover; }
.word-text { font-size: 36px; font-weight: 700; color: var(--color-text); }
.word-phonetic { font-size: 16px; color: var(--color-text-light); margin-top: 4px; }
.word-actions { display: flex; gap: 8px; justify-content: center; margin: 16px 0; }
.word-detail { padding: 12px; background: #F8FAFC; border-radius: var(--radius-sm); margin: 16px 0; text-align: left; }
.word-meaning { font-size: 18px; font-weight: 600; }
.word-example { font-size: 14px; color: var(--color-text); margin-top: 6px; }
.word-example-cn { font-size: 13px; color: var(--color-text-light); margin-top: 2px; }
.next-word-btn { margin-top: 8px; }

/* Practice phase */
.loading-state { text-align: center; padding: 48px 0; }
.spinner { width: 32px; height: 32px; border: 3px solid var(--color-border); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.question-area { background: white; border: 1px solid var(--color-border); border-radius: var(--radius); padding: 28px; }
.game-instruction { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
.game-hint { font-size: 13px; color: var(--color-text-light); margin-bottom: 16px; }

.cloze-sentence { font-size: 18px; line-height: 1.6; padding: 16px; background: #F8FAFC; border-radius: var(--radius-sm); margin-bottom: 20px; }
.blank { color: var(--color-primary); font-weight: 700; border-bottom: 2px solid var(--color-primary); padding: 0 8px; }

.options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.option-btn { background: white; border: 1px solid var(--color-border-dark); padding: 12px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; color: var(--color-text); }
.option-btn:hover:not(:disabled) { border-color: var(--color-primary); background: #EFF6FF; }
.option-btn.correct { background: #DCFCE7; border-color: var(--color-success); color: #15803D; }
.option-btn.wrong { background: #FEE2E2; border-color: var(--color-danger); color: #B91C1C; }
.option-btn.dim { opacity: 0.5; }

.letter-slots { display: flex; gap: 6px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
.letter-slot { width: 36px; height: 44px; border: 2px solid var(--color-primary); border-radius: var(--radius-xs); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; text-transform: uppercase; color: var(--color-primary); background: #EFF6FF; }
.letter-pool { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
.letter-btn { width: 40px; height: 40px; border-radius: var(--radius-xs); background: white; border: 1px solid var(--color-border-dark); font-size: 18px; font-weight: 600; text-transform: uppercase; }
.letter-btn:hover:not(:disabled) { border-color: var(--color-primary); }
.letter-btn.used { opacity: 0.3; cursor: not-allowed; }
.spelling-controls { display: flex; gap: 8px; justify-content: center; }

.image-display { width: 240px; height: 180px; border-radius: var(--radius-sm); overflow: hidden; margin: 0 auto 16px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; }
.image-display img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { color: var(--color-text-muted); font-size: 14px; }

.feedback-bar { margin-top: 16px; padding: 10px 16px; border-radius: var(--radius-sm); text-align: center; font-weight: 600; font-size: 14px; }
.feedback-bar.correct { background: #DCFCE7; color: #15803D; }
.feedback-bar.wrong { background: #FEE2E2; color: #B91C1C; }

/* Complete phase */
.complete-card { text-align: center; }
.complete-card h2 { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
.complete-stats { display: flex; justify-content: center; gap: 32px; margin-bottom: 24px; }
.cs-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cs-value { font-size: 28px; font-weight: 700; color: var(--color-primary); }
.cs-label { font-size: 12px; color: var(--color-text-light); }
.complete-actions { display: flex; gap: 8px; justify-content: center; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
