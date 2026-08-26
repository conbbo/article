<template>
  <div class="assessment">
    <div v-if="phase === 'intro'" class="intro-phase fade-in">
      <h2>{{ t('assessment.title').value }}</h2>
      <p class="subtitle">{{ t('assessment.subtitle').value }}</p>
      <div class="info-card card">
        <div class="info-item">
          <span class="info-icon">📝</span>
          <span>{{ t('assessment.desc').value }}</span>
        </div>
        <div class="info-item">
          <span class="info-icon">🎯</span>
          <span>{{ t('assessment.format').value }}</span>
        </div>
        <div class="info-item">
          <span class="info-icon">📊</span>
          <span>{{ t('assessment.result').value }}</span>
        </div>
      </div>
      <button class="btn-primary start-btn" @click="startAssessment">{{ t('assessment.start').value }}</button>
    </div>
    <div v-else-if="phase === 'testing'" class="testing-phase fade-in">
      <div class="phase-header">
        <div class="phase-info">
          <span class="phase-tag">{{ t('assessment.title').value }}</span>
          <span class="phase-progress">{{ currentIndex + 1 }} / {{ questions.length }}</span>
        </div>
        <div class="phase-bar">
          <div class="phase-bar-fill" :style="{ width: ((currentIndex + 1) / questions.length * 100) + '%' }"></div>
        </div>
      </div>
      <div class="question-area slide-in" v-if="currentQ">
        <p class="game-instruction">{{ t('assessment.question').value }}: <strong>{{ currentQ.meaning }}</strong></p>
        <p class="game-hint">{{ currentQ.example }}</p>
        <button class="listen-btn-sm" @click="speak(currentQ.word, settings.ttsRate)">
          {{ t('assessment.listenAgain').value }}
        </button>
        <div class="options-grid">
          <button v-for="opt in currentQ.options" :key="opt" :class="['option-btn', getOptionClass(opt)]" :disabled="answered" @click="selectAnswer(opt)">{{ opt }}</button>
        </div>
        <transition name="fade">
          <div v-if="showFeedback" class="feedback-bar" :class="feedbackType">
            <span v-if="feedbackType === 'correct'">{{ t('daily.correct').value }}</span>
            <span v-else>{{ t('daily.wrong').value }} {{ currentQ.word }}</span>
          </div>
        </transition>
      </div>
    </div>
    <div v-else-if="phase === 'result'" class="result-phase fade-in">
      <div class="result-card card">
        <h2>{{ t('assessment.complete').value }}</h2>
        <div class="result-level" :style="{ background: resultColor }">
          <span class="result-level-name">{{ resultLevelName }}</span>
          <span class="result-cefr">{{ resultCefr }}</span>
        </div>
        <div class="result-stats">
          <div class="rs-item"><span class="rs-value">{{ correctCount }}</span><span class="rs-label">{{ t('assessment.correct').value }}</span></div>
          <div class="rs-item"><span class="rs-value">{{ questions.length - correctCount }}</span><span class="rs-label">{{ t('assessment.wrong').value }}</span></div>
          <div class="rs-item"><span class="rs-value">{{ accuracy }}%</span><span class="rs-label">{{ t('assessment.accuracy').value }}</span></div>
        </div>
        <p class="result-advice">{{ resultAdvice }}</p>
        <div class="result-actions">
          <button class="btn-secondary" @click="$router.push('/')">{{ t('daily.dashboard').value }}</button>
          <button class="btn-primary" @click="startAssessment">{{ t('assessment.retry').value }}</button>
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
import { speak } from '../utils/tts'
import { useI18n } from '../i18n'
const router = useRouter()
const settings = useSettingsStore()
const progress = useProgressStore()
const { t } = useI18n()
const phase = ref('intro')
const questions = ref([])
const currentIndex = ref(0)
const answered = ref(false)
const selectedAnswer = ref('')
const showFeedback = ref(false)
const feedbackType = ref('correct')
const correctCount = ref(0)
const currentQ = computed(() => questions.value[currentIndex.value] || null)
const accuracy = computed(() => questions.value.length > 0 ? Math.round(correctCount.value / questions.value.length * 100) : 0)
const LEVEL_ORDER = ['starters', 'movers', 'flyers', 'ket']
function determineLevel() {
  const pct = accuracy.value
  if (pct >= 75) return 'ket'
  if (pct >= 50) return 'flyers'
  if (pct >= 25) return 'movers'
  return 'starters'
}
const resultLevelName = computed(() => ({ starters: 'Starters', movers: 'Movers', flyers: 'Flyers', ket: 'KET' }[determineLevel()] || 'Starters'))
const resultCefr = computed(() => ({ starters: 'Pre-A1', movers: 'A1', flyers: 'A2', ket: 'A2+' }[determineLevel()] || 'Pre-A1'))
const resultColor = computed(() => ({ starters: '#6366F1', movers: '#0EA5E9', flyers: '#EC4899', ket: '#10B981' }[determineLevel()] || '#6366F1'))
const resultAdvice = computed(() => {
  const level = determineLevel()
  if (level === 'ket') return t('assessment.adviceKet').value
  if (level === 'flyers') return t('assessment.adviceFlyers').value
  if (level === 'movers') return t('assessment.adviceMovers').value
  return t('assessment.adviceStarters').value
})
function shuffleArray(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]] }
  return copy
}
function generateDistractors(word, count = 3) {
  const allWords = levelKeys.flatMap(k => cambridgeWordBank[k].words).map(w => w.word)
  return shuffleArray(allWords.filter(w => w !== word)).slice(0, count)
}
function startAssessment() {
  const selected = []
  for (const level of LEVEL_ORDER) {
    const pool = cambridgeWordBank[level]?.words || []
    selected.push(...shuffleArray([...pool]).slice(0, 5).map(w => ({ ...w, level })))
  }
  questions.value = shuffleArray(selected).map(w => ({
    word: w.word, meaning: w.meaning, example: w.example,
    options: shuffleArray([w.word, ...generateDistractors(w.word, 3)]), answer: w.word, level: w.level
  }))
  currentIndex.value = 0
  correctCount.value = 0
  phase.value = 'testing'
  setTimeout(() => { if (currentQ.value) speak(currentQ.value.word, settings.ttsRate) }, 500)
}
function selectAnswer(opt) {
  if (answered.value) return
  answered.value = true
  selectedAnswer.value = opt
  const correct = opt === currentQ.value.answer
  if (correct) { correctCount.value++; feedbackType.value = 'correct' }
  else { feedbackType.value = 'wrong' }
  progress.recordAnswer(correct, currentQ.value.answer, 'assessment')
  showFeedback.value = true
  setTimeout(() => {
    showFeedback.value = false
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
      answered.value = false
      selectedAnswer.value = ''
      setTimeout(() => { if (currentQ.value) speak(currentQ.value.word, settings.ttsRate) }, 300)
    } else { phase.value = 'result' }
  }, 1500)
}
function getOptionClass(opt) {
  if (!answered.value) return ''
  if (opt === currentQ.value.answer) return 'correct'
  if (opt === selectedAnswer.value && opt !== currentQ.value.answer) return 'wrong'
  return 'dim'
}
onMounted(async () => { await Promise.all([progress.init(), settings.init()]) })
</script>
<style scoped>
.assessment { max-width: 640px; margin: 0 auto; }
h2 { font-size: 22px; font-weight: 800; color: var(--color-text); margin-bottom: 4px; }
.subtitle { font-size: 14px; color: var(--color-text-light); margin-bottom: 16px; }
.info-card { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.info-item { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--color-text); }
.info-icon { font-size: 20px; }
.start-btn { padding: 14px 48px; font-size: 15px; margin: 0 auto; display: block; }
.phase-header { margin-bottom: 20px; }
.phase-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.phase-tag { font-size: 13px; font-weight: 700; color: var(--color-primary); }
.phase-progress { font-size: 13px; color: var(--color-text-light); font-weight: 600; }
.phase-bar { height: 6px; background: #E0E7FF; border-radius: 3px; overflow: hidden; }
.phase-bar-fill { height: 100%; background: var(--gradient-primary); border-radius: 3px; transition: width 0.3s ease; }
.question-area { background: white; border: 1px solid rgba(99,102,241,0.08); border-radius: 20px; padding: 28px; box-shadow: var(--shadow-card); }
.game-instruction { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
.game-hint { font-size: 13px; color: var(--color-text-light); margin-bottom: 16px; font-style: italic; }
.listen-btn-sm { background: #F5F3FF; border: 1px solid #C7D2FE; border-radius: var(--radius-sm); padding: 6px 16px; font-size: 13px; color: var(--color-primary); cursor: pointer; margin-bottom: 16px; }
.options-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.option-btn { background: white; border: 1px solid var(--color-border); padding: 14px; border-radius: var(--radius-sm); font-size: 15px; font-weight: 600; }
.option-btn:hover:not(:disabled) { border-color: var(--color-primary); background: #F5F3FF; }
.option-btn.correct { background: #D1FAE5; border-color: var(--color-success); color: #065F46; }
.option-btn.wrong { background: #FEE2E2; border-color: var(--color-danger); color: #991B1B; }
.option-btn.dim { opacity: 0.5; }
.feedback-bar { margin-top: 16px; padding: 12px 18px; border-radius: var(--radius-sm); text-align: center; font-weight: 700; font-size: 14px; }
.feedback-bar.correct { background: #D1FAE5; color: #065F46; }
.feedback-bar.wrong { background: #FEE2E2; color: #991B1B; }
.result-card { text-align: center; }
.result-card h2 { font-size: 26px; font-weight: 800; margin-bottom: 20px; }
.result-level { display: inline-flex; flex-direction: column; align-items: center; padding: 20px 40px; border-radius: var(--radius); color: white; margin-bottom: 20px; }
.result-level-name { font-size: 28px; font-weight: 800; }
.result-cefr { font-size: 16px; opacity: 0.9; }
.result-stats { display: flex; justify-content: center; gap: 36px; margin-bottom: 20px; }
.rs-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.rs-value { font-size: 30px; font-weight: 800; background: var(--gradient-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.rs-label { font-size: 12px; color: var(--color-text-light); }
.result-advice { font-size: 14px; color: var(--color-text); margin-bottom: 20px; padding: 14px; background: linear-gradient(135deg, #F5F3FF 0%, #F0F9FF 100%); border-radius: var(--radius-sm); }
.result-actions { display: flex; gap: 8px; justify-content: center; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
