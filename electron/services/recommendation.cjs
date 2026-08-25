// Recommendation Engine — Decides which words to study next based on SRS state,
// mastery levels, and learning history. Implements adaptive difficulty selection.

const { isDueForReview, MASTERY_LEVELS } = require('./learningEngine.cjs')

/**
 * Recommend words for a study session.
 * Strategy:
 *   1. Words due for SRS review (highest priority — spaced repetition)
 *   2. New words not yet learned (introduce new vocabulary)
 *   3. Weak words (low accuracy) that aren't due yet but need reinforcement
 *
 * @param {Array} allWords - all words from DB
 * @param {Array} learnedWords - list of learned word strings
 * @param {Object} srsMap - { word: srsState }
 * @param {Array} practiceRecords - recent practice history
 * @param {Array} weakWords - from analytics
 * @param {number} count - how many words to recommend
 * @param {string} level - target level
 * @returns {Array} recommended word objects with reason
 */
function recommendWords(allWords, learnedWords, srsMap, practiceRecords, weakWords, count, level) {
  const learnedSet = new Set(learnedWords)
  const levelWords = level ? allWords.filter(w => w.level === level) : allWords
  const result = []

  // 1. Words due for SRS review
  const dueForReview = levelWords.filter(w => {
    const srs = srsMap[w.word]
    return srs && isDueForReview(srs) && learnedSet.has(w.word)
  })

  for (const w of dueForReview) {
    if (result.length >= count) break
    result.push({ ...w, reason: 'review', priority: 1 })
  }

  // 2. New words (not yet learned)
  if (result.length < count) {
    const newWords = levelWords.filter(w => !learnedSet.has(w.word))
    // Shuffle for variety
    const shuffled = [...newWords].sort(() => Math.random() - 0.5)
    for (const w of shuffled) {
      if (result.length >= count) break
      result.push({ ...w, reason: 'new', priority: 2 })
    }
  }

  // 3. Weak words reinforcement
  if (result.length < count) {
    const weakSet = new Set(weakWords.map(w => w.word))
    const weakInLevel = levelWords.filter(w => weakSet.has(w.word) && !result.find(r => r.word === w.word))
    for (const w of weakInLevel) {
      if (result.length >= count) break
      result.push({ ...w, reason: 'reinforce', priority: 3 })
    }
  }

  return result.slice(0, count)
}

/**
 * Recommend practice questions for the session.
 * Picks words and assigns game modes adaptively:
 * - Words with low accuracy get the game mode they fail most
 * - New words get varied game modes
 * - Randomization for engagement
 *
 * @param {Array} sessionWords - words selected for this session
 * @param {Array} practiceRecords - for mode weakness detection
 * @param {number} questionCount
 * @returns {Array} [{ word, gameMode, reason }]
 */
function recommendQuestions(sessionWords, practiceRecords, questionCount) {
  const GAME_MODES = ['cloze', 'spelling', 'image']
  const questions = []

  // Analyze which game modes the user struggles with
  const modeAccuracy = {}
  for (const p of practiceRecords) {
    if (!modeAccuracy[p.game_mode]) {
      modeAccuracy[p.game_mode] = { correct: 0, total: 0 }
    }
    modeAccuracy[p.game_mode].total++
    if (p.correct === 1) modeAccuracy[p.game_mode].correct++
  }

  // Sort game modes by accuracy (ascending — weakest first for more practice)
  const sortedModes = [...GAME_MODES].sort((a, b) => {
    const accA = modeAccuracy[a] ? modeAccuracy[a].correct / modeAccuracy[a].total : 1
    const accB = modeAccuracy[b] ? modeAccuracy[b].correct / modeAccuracy[b].total : 1
    return accA - accB
  })

  for (let i = 0; i < questionCount; i++) {
    const word = sessionWords[i % sessionWords.length]
    // Use weakest mode 50% of the time, random 50%
    let gameMode
    if (i % 2 === 0 && sortedModes.length > 0) {
      gameMode = sortedModes[i % sortedModes.length]
    } else {
      gameMode = GAME_MODES[Math.floor(Math.random() * GAME_MODES.length)]
    }

    questions.push({
      word: word.word,
      wordObj: word,
      gameMode,
      reason: i % 2 === 0 ? 'weakness-focused' : 'variety'
    })
  }

  // Shuffle questions so weak-mode focus isn't sequential
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }

  return questions
}

/**
 * Calculate adaptive difficulty level.
 * Based on recent accuracy: if > 85%, suggest moving up a level; if < 50%, suggest moving down.
 */
function recommendLevel(currentLevel, practiceRecords) {
  const LEVELS = ['starters', 'movers', 'flyers', 'ket']
  const currentIdx = LEVELS.indexOf(currentLevel)
  if (currentIdx === -1) return { level: currentLevel, suggestion: 'stay', reason: 'Unknown level' }

  // Look at last 20 practices
  const recent = practiceRecords.slice(0, 20)
  if (recent.length < 10) {
    return { level: currentLevel, suggestion: 'stay', reason: 'Not enough data' }
  }

  const accuracy = recent.filter(p => p.correct === 1).length / recent.length

  if (accuracy > 0.85 && currentIdx < LEVELS.length - 1) {
    return {
      level: LEVELS[currentIdx + 1],
      suggestion: 'advance',
      reason: `Accuracy ${Math.round(accuracy * 100)}% — ready for ${LEVELS[currentIdx + 1]}`
    }
  } else if (accuracy < 0.5 && currentIdx > 0) {
    return {
      level: LEVELS[currentIdx - 1],
      suggestion: 'review',
      reason: `Accuracy ${Math.round(accuracy * 100)}% — consider reviewing ${LEVELS[currentIdx - 1]}`
    }
  }

  return {
    level: currentLevel,
    suggestion: 'stay',
    reason: `Accuracy ${Math.round(accuracy * 100)}% — on track`
  }
}

module.exports = {
  recommendWords,
  recommendQuestions,
  recommendLevel
}
