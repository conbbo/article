<template>
  <div class="daily-task">
    <!-- Pre-session config -->
    <div v-if="phase === 'config'" class="config-phase fade-in">
      <h2>Daily Task</h2>
      <p class="subtitle">{{ t('daily.subtitle').value }}</p>

      <div v-if="levelRec" class="level-rec card">
        <p v-if="levelRec.suggestion === 'advance'">Trend: {{ levelRec.reason }}. Consider advancing to the next level.</p>
        <p v-else-if="levelRec.suggestion === 'review'">Trend: {{ levelRec.reason }}.</p>
        <p v-else>Current level: {{ levelRec.reason }}</p>
      </div>

      <div class="config-card card">
        <div class="config-row">
          <label>{{ t('daily.wordLevel').value }}</label>
          <select v-model="configLevel" class="config-select">
            <option v-for="key in levelKeys" :key="key" :value="key">
              {{ cambridgeWordBank[key].level }} ({{ cambridgeWordBank[key].cefr }})
            </option>
          </select>
        </div>
        <div class="config-row">
          <label>{{ t('daily.wordsToLearn').value }}</label>
          <div class="number-control">
            <button @click="configWords = Math.max(3, configWords - 1)">-</button>
            <span class="number-value">{{ configWords }}</span>
            <button @click="configWords = Math.min(20, configWords + 1)">+</button>
          </div>
        </div>
        <div class="config-row">
          <label>{{ t('daily.practiceQuestions').value }}</label>
          <div class="number-control">
            <button @click="configQuestions = Math.max(5, configQuestions - 5)">-</button>
            <span class="number-value">{{ configQuestions }}</span>
            <button @click="configQuestions = Math.min(50, configQuestions + 5)">+</button>
          </div>
        </div>
        <div class="config-summary">
          <p>{{ configWords }} words (engine-recommended) + {{ configQuestions }} adaptive questions</p>
          <p class="hint">Words due for review are prioritized. Game modes adapt to your weaknesses.</p>
        </div>
        <div class="start-buttons">
          <button class="btn-primary start-btn" @click="startSession">{{ t('daily.start').value }}</button>
          <button class="btn-secondary skip-btn" @click="skipToPractice">{{ t('daily.skipToPractice').value }}</button>
        </div>
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
          <div v-if="currentWord?.reason" class="word-reason">{{ reasonLabel(currentWord.reason) }}</div>
          <div class="word-image" v-if="currentImageUrl">
            <img :src="currentImageUrl" :alt="currentWord?.word" @error="currentImageUrl = ''" />
          </div>
          <h1 class="word-text">{{ currentWord?.word }}</h1>
          <p class="word-phonetic">{{ currentWord?.phonetic }}</p>
          <div class="word-actions">
            <button class="btn-secondary" @click="speak(currentWord?.word, settings.ttsRate)">{{ t('daily.pronounce').value }}</button>
            <button class="btn-secondary" @click="speak(currentWord?.example, settings.ttsRate)">{{ t('daily.example').value }}</button>
          </div>
          <div class="word-detail">
            <p class="word-meaning">{{ currentWord?.meaning }}</p>
            <p class="word-example">{{ currentWord?.example }}</p>
            <p class="word-example-cn">{{ currentWord?.exampleCn }}</p>
          </div>
          <button class="btn-primary next-word-btn" @click="nextLearnWord">
            {{ learnIndex < sessionWords.length - 1 ? t('daily.nextWord').value : t('daily.startPractice').value }}
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
        <p>{{ t('daily.generating').value }}</p>
      </div>

      <div v-else-if="currentQuestion" class="question-area slide-in">
        <!-- Cloze -->
        <div v-if="currentGameMode === 'cloze'" class="game-content">
          <p class="game-instruction">{{ t('daily.fillBlank').value }}</p>
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
            <button class="btn-secondary" @click="removeLetter" :disabled="answered">{{ t('daily.backspace').value }}</button>
            <button class="btn-primary" @click="submitSpelling" :disabled="spelledLetters.length === 0 || answered">{{ t('daily.submit').value }}</button>
          </div>
        </div>

        <!-- Image -->
        <div v-if="currentGameMode === 'image'" class="game-content">
          <p class="game-instruction">{{ currentQuestion.question }}</p>
          <div class="image-display">
            <img v-if="currentImageUrl" :src="currentImageUrl" :alt="currentQuestion.word" @error="currentImageUrl = ''" />
            <span v-else class="img-placeholder">{{ t('daily.noImage').value }}</span>
          </div>
          <div class="options-grid">
            <button v-for="opt in currentQuestion.options" :key="opt"
              :class="['option-btn', getOptionClass(opt)]"
              :disabled="answered" @click="answerQuestion(opt)">
              {{ opt }}
            </button>
          </div>
        </div>

        <!-- Word Order (sentence unscramble) -->
        <div v-if="currentGameMode === 'wordOrder'" class="game-content">
          <p class="game-instruction">{{ t('daily.wordOrderInstruction').value }}</p>
          <p class="game-hint">{{ currentQuestion.translation }}</p>
          <div class="word-order-slots">
            <span v-for="(w, i) in placedWords" :key="i" class="word-slot" @click="unplaceWord(i)">{{ w }}</span>
          </div>
          <div class="word-pool">
            <button v-for="(w, i) in currentQuestion.shuffled" :key="i"
              :class="['word-btn', { used: usedWordIndices[i] }]"
              :disabled="usedWordIndices[i] || answered" @click="placeWord(i)">
              {{ w }}
            </button>
          </div>
          <div class="spelling-controls">
            <button class="btn-secondary" @click="clearPlacedWords" :disabled="answered">{{ t('daily.clear').value }}</button>
            <button class="btn-primary" @click="submitWordOrder" :disabled="placedWords.length === 0 || answered">{{ t('daily.submit').value }}</button>
          </div>
        </div>

        <!-- Listening Choice -->
        <div v-if="currentGameMode === 'listening'" class="game-content">
          <p class="game-instruction">{{ t('daily.listeningInstruction').value }}</p>
          <div class="listening-area">
            <button class="listen-btn" @click="speak(currentQuestion.answer, settings.ttsRate)" :disabled="answered">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              {{ t('daily.playAudio').value }}
            </button>
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
            <span v-if="feedbackType === 'correct'">{{ t('daily.correct').value }}</span>
            <span v-else>Wrong. Answer: {{ currentQuestion.answer }}</span>
          </div>
        </transition>
      </div>
    </div>

    <!-- Phase: Complete -->
    <div v-else-if="phase === 'complete'" class="complete-phase fade-in">
      <div class="complete-card card">
        <h2>{{ t('daily.complete').value }}</h2>
        <div class="complete-stats">
          <div class="cs-item">
            <span class="cs-value">{{ sessionWords.length }}</span>
            <span class="cs-label">Words</span>
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
          <button class="btn-secondary" @click="goHome">{{ t('daily.dashboard').value }}</button>
          <button class="btn-primary" @click="resetSession">{{ t('daily.newSession').value }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cambridgeWordBank, levelKeys } from '../data/wordBank'
import { useSettingsStore } from '../stores/settings'
import { useProgressStore } from '../stores/progress'
import { generateCloze, generateSpelling, generateImageDescription } from '../utils/aiService'
import { generateWordOrder, generateListening } from '../utils/aiService'
import { getWordImage } from '../utils/imageService'
import { speak } from '../utils/tts'
import { useI18n } from '../i18n'

const router = useRouter()
const settings = useSettingsStore()
const progress = useProgressStore()
const { t } = useI18n()

const phase = ref('config')
const configLevel = ref('starters')
const configWords = ref(10)
const configQuestions = ref(20)
const levelRec = ref(null)

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

const spelledLetters = ref([])
const usedLetters = ref([])
const pickedIndices = ref([])

const GAME_NAMES = { cloze: 'Cloze Fill-in', spelling: 'Spelling', image: 'Picture Match', wordOrder: 'Word Order', listening: 'Listening Choice' }

const currentWord = computed(() => sessionWords.value[learnIndex.value] || null)
const currentGameName = computed(() => GAME_NAMES[currentGameMode.value] || '')
const placedWords = ref([])
const usedWordIndices = ref([])
const clozeDisplay = computed(() => {
  if (!currentQuestion.value || currentGameMode.value !== 'cloze') return ''
  return currentQuestion.value.sentence.replace('___', '<span class="blank">_____</span>')
})

function reasonLabel(reason) {
  return { review: 'Review', new: 'New', reinforce: 'Reinforce' }[reason] || ''
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
  const allWords = levelKeys.flatMap(k => cambridgeWordBank[k].words).map(w => w.word)
  return shuffleArray(allWords.filter(w => w !== word)).slice(0, count)
}

function generateLocalQuestion(mode, wordObj) {
  const word = wordObj.word
  if (mode === 'cloze') {
    const clozeTemplates = [
      `I saw a ${word} yesterday.`,
      `The ${word} is on the table.`,
      `She has a new ${word}.`,
      `We found the ${word} in the garden.`,
      `He likes to play with the ${word}.`,
      `Can you pass me the ${word}?`,
      `There is a ${word} in my room.`,
      `My ${word} is very beautiful.`,
      `I want to buy a ${word}.`,
      `The ${word} looks amazing today.`,
      `Do you have a ${word}?`,
      `The teacher showed us a ${word}.`,
    ]
    const useOriginal = Math.random() < 0.3
    const baseSentence = useOriginal && wordObj.example ? wordObj.example : clozeTemplates[Math.floor(Math.random() * clozeTemplates.length)]
    const sentence = baseSentence.replace(new RegExp(word, 'i'), '___')
    return { sentence, answer: word, options: shuffleArray([word, ...generateDistractors(word, 3)]), hint: wordObj.meaning }
  } else if (mode === 'spelling') {
    const letters = word.split('')
    const extra = 'abcdefghijklmnopqrstuvwxyz'.split('')
    const distractors = shuffleArray(extra.filter(l => !letters.includes(l))).slice(0, 3)
    return { meaning: wordObj.meaning, hint: wordObj.example, letters: shuffleArray([...letters, ...distractors]), answer: word }
  } else {
    return { word, description: wordObj.example, question: 'What word does this picture show?', options: shuffleArray([word, ...generateDistractors(word, 3)]), answer: word }
  }
}

function generateLocalQuestionExtended(mode, wordObj) {
  const word = wordObj.word
  if (mode === 'wordOrder') {
    const wordOrderTemplates = [
      `I saw a ${word} in the park.`,
      `She put the ${word} on the desk.`,
      `We found a ${word} under the tree.`,
      `He gave me a ${word} yesterday.`,
      `The ${word} is on the table.`,
      `I like this ${word} very much.`,
      `My ${word} is very big.`,
      `Can you see the ${word}?`,
    ]
    const useOriginal = Math.random() < 0.3
    const sentence = useOriginal && wordObj.example ? wordObj.example : wordOrderTemplates[Math.floor(Math.random() * wordOrderTemplates.length)]
    const words = sentence.replace(/[.,!?]/g, '').split(/\s+/)
    return {
      translation: wordObj.exampleCn || wordObj.meaning,
      shuffled: shuffleArray(words),
      answer: words.join(' '),
      correctOrder: words
    }
  } else if (mode === 'listening') {
    // Use similar-looking distractors for better challenge
    const allWords = levelKeys.flatMap(k => cambridgeWordBank[k].words).map(w => w.word)
    const similar = allWords.filter(w => w !== word && (w.length === word.length || w.startsWith(word[0]))).slice(0, 10)
    const distractors = similar.length >= 3 ? shuffleArray(similar).slice(0, 3) : generateDistractors(word, 3)
    return {
      answer: word,
      options: shuffleArray([word, ...distractors]),
      meaning: wordObj.meaning
    }
  }
  return generateLocalQuestion(mode, wordObj)
}

async function startSession() {
  progress.setDailyConfig(configWords.value, configQuestions.value)

  // Use recommendation engine if in Electron, otherwise fall back to random
  if (window.electronAPI) {
    try {
      const recommended = await window.electronAPI.recommendWords(configWords.value, configLevel.value)
      sessionWords.value = recommended.length > 0 ? recommended : getRandomFallback()
    } catch (e) {
      sessionWords.value = getRandomFallback()
    }
  } else {
    sessionWords.value = getRandomFallback()
  }

  // Use recommendation engine for question sequence
  if (window.electronAPI) {
    try {
      const questions = await window.electronAPI.recommendQuestions(sessionWords.value, configQuestions.value)
      sessionQuestions.value = questions.length > 0 ? questions : generateGameFallback()
    } catch (e) {
      sessionQuestions.value = generateGameFallback()
    }
  } else {
    sessionQuestions.value = generateGameFallback()
  }

  learnIndex.value = 0
  sessionCorrect.value = 0
  sessionScore.value = 0
  phase.value = 'learn'
  await loadImage()
}

function getRandomFallback() {
  const allWords = cambridgeWordBank[configLevel.value]?.words || []
  return shuffleArray([...allWords]).slice(0, Math.min(configWords.value, allWords.length))
}

function generateGameFallback() {
  const modes = ['cloze', 'spelling', 'image', 'wordOrder', 'listening']
  const seq = []
  const wordsPool = [...sessionWords.value]
  const usedPairs = new Set()
  for (let i = 0; i < configQuestions.value; i++) {
    let attempts = 0
    let wordObj, mode
    do {
      wordObj = wordsPool[Math.floor(Math.random() * wordsPool.length)]
      mode = modes[Math.floor(Math.random() * modes.length)]
      attempts++
    } while (usedPairs.has(`${wordObj.word}-${mode}`) && attempts < 20)
    usedPairs.add(`${wordObj.word}-${mode}`)
    seq.push({ word: wordObj.word, wordObj, gameMode: mode, reason: 'random' })
  }
  return shuffleArray(seq)
}

function skipToPractice() {
  progress.setDailyConfig(configWords.value, configQuestions.value)
  const doPrepare = () => {
    learnIndex.value = 0
    sessionCorrect.value = 0
    sessionScore.value = 0
    if (window.electronAPI) {
      window.electronAPI.recommendQuestions(sessionWords.value, configQuestions.value).then(questions => {
        sessionQuestions.value = questions.length > 0 ? questions : generateGameFallback()
        phase.value = 'practice'
        practiceIndex.value = 0
        nextQuestion()
      }).catch(() => {
        sessionQuestions.value = generateGameFallback()
        phase.value = 'practice'
        practiceIndex.value = 0
        nextQuestion()
      })
    } else {
      sessionQuestions.value = generateGameFallback()
      phase.value = 'practice'
      practiceIndex.value = 0
      nextQuestion()
    }
  }

  if (window.electronAPI) {
    try {
      window.electronAPI.recommendWords(configWords.value, configLevel.value).then(r => {
        sessionWords.value = r.length > 0 ? r : getRandomFallback()
        doPrepare()
      }).catch(() => {
        sessionWords.value = getRandomFallback()
        doPrepare()
      })
    } catch (e) {
      sessionWords.value = getRandomFallback()
      doPrepare()
    }
  } else {
    sessionWords.value = getRandomFallback()
    doPrepare()
  }
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

  const q = sessionQuestions.value[practiceIndex.value]
  currentGameMode.value = q.gameMode || q
  practiceLoading.value = true
  answered.value = false
  selectedAnswer.value = ''
  currentQuestion.value = null
  currentImageUrl.value = ''
 spelledLetters.value = []
 usedLetters.value = []
  pickedIndices.value = []

 const wordObj = q.wordObj || sessionWords.value.find(w => w.word === q.word) || sessionWords.value[practiceIndex.value % sessionWords.value.length]
  const word = wordObj?.word || q.word

  try {
    if (settings.apiKey || settings.apiProvider === 'local') {
      const opts = [settings.apiProvider, settings.apiKey, word, settings.apiBaseUrl, settings.apiModel]
     if (currentGameMode.value === 'cloze') currentQuestion.value = await generateCloze(...opts)
     else if (currentGameMode.value === 'spelling') currentQuestion.value = await generateSpelling(...opts)
     else if (currentGameMode.value === 'image') currentQuestion.value = await generateImageDescription(...opts)
      else if (currentGameMode.value === 'wordOrder') currentQuestion.value = await generateWordOrder(...opts)
      else if (currentGameMode.value === 'listening') currentQuestion.value = await generateListening(...opts)
      else currentQuestion.value = generateLocalQuestionExtended(currentGameMode.value, wordObj || { word, meaning: '', example: '', exampleCn: '' })
   } else {
     throw new Error('No API key')
   }
 } catch (e) {
    currentQuestion.value = generateLocalQuestionExtended(currentGameMode.value, wordObj || { word, meaning: '', example: '', exampleCn: '' })
 }

  if (currentGameMode.value === 'image' && currentQuestion.value) {
    currentImageUrl.value = await getWordImage(currentQuestion.value.word)
  }

  if (currentGameMode.value === 'wordOrder') {
    placedWords.value = []
    usedWordIndices.value = new Array(currentQuestion.value?.shuffled?.length || 0).fill(false)
  }

  practiceLoading.value = false
}

function answerQuestion(opt) {
  if (answered.value) return
  answered.value = true
  selectedAnswer.value = opt
  const correct = opt === currentQuestion.value.answer
  if (correct) { sessionCorrect.value++; sessionScore.value += 10; feedbackType.value = 'correct'; speak(currentQuestion.value.answer, settings.ttsRate) }
  else { feedbackType.value = 'wrong' }
  progress.recordAnswer(correct, currentQuestion.value.answer, currentGameMode.value)
  showFeedback.value = true
  setTimeout(() => { showFeedback.value = false; practiceIndex.value++; nextQuestion() }, 1500)
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
  pickedIndices.value.push(index)
  spelledLetters.value.push(currentQuestion.value.letters[index])
}

function removeLetter() {
  if (answered.value || spelledLetters.value.length === 0) return
  const lastIdx = pickedIndices.value.pop()
  if (lastIdx !== undefined) {
    usedLetters.value[lastIdx] = false
    spelledLetters.value.pop()
  }
}

function submitSpelling() {
  if (answered.value || spelledLetters.value.length === 0) return
  answered.value = true
  const spelled = spelledLetters.value.join('').toLowerCase()
  const correct = spelled === currentQuestion.value.answer.toLowerCase()
  if (correct) { sessionCorrect.value++; sessionScore.value += 10; feedbackType.value = 'correct'; speak(currentQuestion.value.answer, settings.ttsRate) }
  else { feedbackType.value = 'wrong' }
  progress.recordAnswer(correct, currentQuestion.value.answer, 'spelling')
  showFeedback.value = true
  setTimeout(() => { showFeedback.value = false; practiceIndex.value++; nextQuestion() }, 1500)
}

function placeWord(index) {
  if (answered.value || usedWordIndices.value[index]) return
  usedWordIndices.value[index] = true
  placedWords.value.push(currentQuestion.value.shuffled[index])
}

function unplaceWord(slotIndex) {
  if (answered.value) return
  const w = placedWords.value[slotIndex]
  placedWords.value.splice(slotIndex, 1)
  for (let i = currentQuestion.value.shuffled.length - 1; i >= 0; i--) {
    if (usedWordIndices.value[i] && currentQuestion.value.shuffled[i] === w) {
      usedWordIndices.value[i] = false
      break
    }
  }
}

function clearPlacedWords() {
  placedWords.value = []
  usedWordIndices.value = usedWordIndices.value.map(() => false)
}

function submitWordOrder() {
  if (answered.value || placedWords.value.length === 0) return
  answered.value = true
  const assembled = placedWords.value.join(' ')
  const correct = assembled.toLowerCase() === currentQuestion.value.answer.toLowerCase()
  if (correct) { sessionCorrect.value++; sessionScore.value += 10; feedbackType.value = 'correct'; speak(currentQuestion.value.answer, settings.ttsRate) }
  else { feedbackType.value = 'wrong' }
  progress.recordAnswer(correct, currentQuestion.value.answer, 'wordOrder')
  showFeedback.value = true
  setTimeout(() => { showFeedback.value = false; practiceIndex.value++; nextQuestion() }, 1500)
}

function resetSession() {
  phase.value = 'config'
  sessionWords.value = []
  sessionQuestions.value = []
}

function goHome() { router.push('/') }

onMounted(async () => {
  await Promise.all([progress.init(), settings.init()])
  configLevel.value = settings.currentLevel

  // Get level recommendation from the engine
  if (window.electronAPI) {
    try { levelRec.value = await window.electronAPI.recommendLevel(settings.currentLevel) } catch (e) { /* ignore */ }
  }
})
</script>

<style scoped>
.daily-task { max-width: 640px; margin: 0 auto; }
h2 { font-size: 22px; font-weight: 800; color: var(--color-text); margin-bottom: 4px; }
.subtitle { font-size: 14px; color: var(--color-text-light); margin-bottom: 16px; }

.level-rec { margin-bottom: 16px; padding: 12px 20px; background: linear-gradient(135deg, #EEF2FF 0%, #F0F9FF 100%); border: 1px solid #C7D2FE; border-radius: var(--radius); }
.level-rec p { font-size: 13px; color: var(--color-text); font-weight: 500; }

.config-card { display: flex; flex-direction: column; gap: 20px; }
.config-row { display: flex; align-items: center; justify-content: space-between; }
.config-row label { font-weight: 600; font-size: 14px; }
.config-select { padding: 8px 14px; border: 1px solid var(--color-border-dark); border-radius: var(--radius-sm); background: white; font-size: 14px; }
.number-control { display: flex; align-items: center; gap: 12px; }
.number-control button { width: 34px; height: 34px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); background: white; font-size: 18px; font-weight: 600; color: var(--color-primary); }
.number-control button:hover { background: #F5F3FF; border-color: var(--color-primary); }
.number-value { font-size: 20px; font-weight: 800; min-width: 28px; text-align: center; color: var(--color-primary); }
.config-summary { padding: 14px 16px; background: linear-gradient(135deg, #F5F3FF 0%, #F0F9FF 100%); border-radius: var(--radius-sm); border: 1px solid #E0E7FF; }
.config-summary p { font-size: 14px; font-weight: 600; color: var(--color-text); }
.config-summary .hint { font-size: 13px; color: var(--color-text-muted); margin-top: 4px; font-weight: 400; }
.start-btn { align-self: center; margin-top: 8px; padding: 14px 48px; font-size: 15px; }
.skip-btn { padding: 14px 28px; font-size: 14px; }
.start-buttons { display: flex; gap: 8px; justify-content: center; }
.word-order-slots { display: flex; gap: 6px; justify-content: center; margin-bottom: 16px; flex-wrap: wrap; min-height: 50px; padding: 10px; border: 2px dashed #C7D2FE; border-radius: var(--radius-sm); }
.word-slot { padding: 8px 16px; background: #E0E7FF; border-radius: var(--radius-xs); font-size: 15px; font-weight: 600; cursor: pointer; color: var(--color-primary); }
.word-pool { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
.word-btn { padding: 8px 16px; border-radius: var(--radius-xs); background: white; border: 1px solid var(--color-border); font-size: 15px; font-weight: 600; }
.word-btn:hover:not(:disabled) { border-color: var(--color-primary); background: #F5F3FF; }
.word-btn.used { opacity: 0.3; cursor: not-allowed; }
.listening-area { display: flex; justify-content: center; margin-bottom: 20px; }
.listen-btn { display: flex; align-items: center; gap: 8px; padding: 16px 32px; background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white; border: none; border-radius: var(--radius); font-size: 16px; font-weight: 700; cursor: pointer; }
.listen-btn:hover { opacity: 0.9; transform: translateY(-1px); }

.phase-header { margin-bottom: 20px; }
.phase-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.phase-tag { font-size: 13px; font-weight: 700; color: var(--color-primary); }
.phase-progress { font-size: 13px; color: var(--color-text-light); font-weight: 600; }
.phase-bar { height: 6px; background: #E0E7FF; border-radius: 3px; overflow: hidden; }
.phase-bar-fill { height: 100%; background: var(--gradient-primary); border-radius: 3px; transition: width 0.3s ease; }

.word-card-area { display: flex; justify-content: center; }
.word-card { background: white; border: 1px solid rgba(99,102,241,0.08); border-radius: 20px; padding: 36px; text-align: center; max-width: 480px; width: 100%; position: relative; box-shadow: var(--shadow-card); }
.word-level-tag { position: absolute; top: 14px; right: 14px; padding: 4px 12px; border-radius: var(--radius-xs); color: white; font-size: 12px; font-weight: 700; }
.word-reason { position: absolute; top: 14px; left: 14px; padding: 4px 12px; border-radius: var(--radius-xs); background: #EEF2FF; color: var(--color-primary); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.word-image { width: 200px; height: 140px; border-radius: 12px; overflow: hidden; margin: 0 auto 16px; background: #F5F3FF; }
.word-image img { width: 100%; height: 100%; object-fit: cover; }
.word-text { font-size: 36px; font-weight: 800; color: var(--color-text); }
.word-phonetic { font-size: 16px; color: var(--color-text-light); margin-top: 4px; }
.word-actions { display: flex; gap: 8px; justify-content: center; margin: 16px 0; }
.word-detail { padding: 14px; background: linear-gradient(135deg, #F5F3FF 0%, #F0F9FF 100%); border-radius: var(--radius-sm); margin: 16px 0; text-align: left; }
.word-meaning { font-size: 18px; font-weight: 700; }
.word-example { font-size: 14px; color: var(--color-text); margin-top: 6px; }
.word-example-cn { font-size: 13px; color: var(--color-text-light); margin-top: 2px; }
.next-word-btn { margin-top: 8px; padding: 12px 36px; }

.loading-state { text-align: center; padding: 48px 0; }
.spinner { width: 36px; height: 36px; border: 3px solid #E0E7FF; border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
@keyframes spin { to { transform: rotate(360deg); } }

.question-area { background: white; border: 1px solid rgba(99,102,241,0.08); border-radius: 20px; padding: 28px; box-shadow: var(--shadow-card); }
.game-instruction { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.game-hint { font-size: 13px; color: var(--color-text-light); margin-bottom: 16px; }
.cloze-sentence { font-size: 18px; line-height: 1.6; padding: 18px; background: linear-gradient(135deg, #F5F3FF 0%, #F0F9FF 100%); border-radius: var(--radius-sm); margin-bottom: 20px; }
.blank { color: var(--color-primary); font-weight: 800; border-bottom: 2px solid var(--color-primary); padding: 0 8px; }
.options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.option-btn { background: white; border: 1px solid var(--color-border); padding: 14px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; color: var(--color-text); }
.option-btn:hover:not(:disabled) { border-color: var(--color-primary); background: #F5F3FF; transform: translateY(-1px); }
.option-btn.correct { background: #D1FAE5; border-color: var(--color-success); color: #065F46; }
.option-btn.wrong { background: #FEE2E2; border-color: var(--color-danger); color: #991B1B; }
.option-btn.dim { opacity: 0.5; }

.letter-slots { display: flex; gap: 6px; justify-content: center; margin-bottom: 20px; flex-wrap: wrap; }
.letter-slot { width: 38px; height: 46px; border: 2px solid var(--color-primary); border-radius: var(--radius-xs); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; text-transform: uppercase; color: var(--color-primary); background: #F5F3FF; }
.letter-pool { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 16px; }
.letter-btn { width: 42px; height: 42px; border-radius: var(--radius-xs); background: white; border: 1px solid var(--color-border); font-size: 18px; font-weight: 700; text-transform: uppercase; }
.letter-btn:hover:not(:disabled) { border-color: var(--color-primary); background: #F5F3FF; }
.letter-btn.used { opacity: 0.3; cursor: not-allowed; }
.spelling-controls { display: flex; gap: 8px; justify-content: center; }

.image-display { width: 240px; height: 180px; border-radius: 12px; overflow: hidden; margin: 0 auto 16px; background: #F5F3FF; display: flex; align-items: center; justify-content: center; }
.image-display img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { color: var(--color-text-muted); font-size: 14px; }

.feedback-bar { margin-top: 16px; padding: 12px 18px; border-radius: var(--radius-sm); text-align: center; font-weight: 700; font-size: 14px; }
.feedback-bar.correct { background: #D1FAE5; color: #065F46; }
.feedback-bar.wrong { background: #FEE2E2; color: #991B1B; }

.complete-card { text-align: center; }
.complete-card h2 { font-size: 26px; font-weight: 800; margin-bottom: 24px; }
.complete-stats { display: flex; justify-content: center; gap: 36px; margin-bottom: 24px; }
.cs-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.cs-value { font-size: 30px; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.cs-label { font-size: 12px; color: var(--color-text-light); }
.complete-actions { display: flex; gap: 8px; justify-content: center; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
