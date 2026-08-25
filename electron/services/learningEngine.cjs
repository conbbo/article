// Learning Engine — Spaced Repetition (SM-2 variant) + Mastery Scoring
// This module runs in the Electron main process and acts as the "backend" service layer.

// SM-2 Algorithm (SuperMemo 2) adaptation for vocabulary learning
// Each word has: interval, repetitions, easeFactor, nextReviewDate, masteryLevel

const MASTERY_LEVELS = {
  NEW: 0,        // Never studied
  LEARNING: 1,   // Just started, needs frequent review
  FAMILIAR: 2,   // Getting better, moderate review
  MASTERED: 3,   // Known well, infrequent review
  EXPERT: 4      // Fully mastered, rare review
}

/**
 * Calculate the next review schedule for a word based on SM-2 algorithm.
 * @param {Object} srs - current SRS state { interval, repetitions, easeFactor }
 * @param {boolean} correct - whether the answer was correct
 * @param {number} responseQuality - 0-5 quality rating (derived from correctness + speed)
 * @returns {Object} updated SRS state
 */
function calculateNextReview(srs, correct, responseQuality = null) {
  let { interval = 0, repetitions = 0, easeFactor = 2.5 } = srs

  // Quality: 0-5. If not provided, derive from correctness.
  // Correct = quality 4-5, Wrong = quality 0-2
  let q = responseQuality !== null ? responseQuality : (correct ? 5 : 1)

  // SM-2 core algorithm
  if (q < 3) {
    // Failed — reset repetitions, restart with short interval
    repetitions = 0
    interval = 1
  } else {
    // Passed — increase interval
    repetitions += 1
    if (repetitions === 1) {
      interval = 1
    } else if (repetitions === 2) {
      interval = 3
    } else {
      interval = Math.round(interval * easeFactor)
    }
  }

  // Update ease factor (clamped to 1.3 minimum)
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  // Calculate next review date
  const now = new Date()
  const nextReview = new Date(now)
  nextReview.setDate(nextReview.getDate() + interval)

  // Determine mastery level based on repetitions and interval
  let masteryLevel = MASTERY_LEVELS.NEW
  if (repetitions === 0) masteryLevel = MASTERY_LEVELS.LEARNING
  else if (repetitions <= 2) masteryLevel = MASTERY_LEVELS.FAMILIAR
  else if (interval < 14) masteryLevel = MASTERY_LEVELS.MASTERED
  else masteryLevel = MASTERY_LEVELS.EXPERT

  return {
    interval,
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate: nextReview.toISOString(),
    masteryLevel,
    lastReviewed: now.toISOString()
  }
}

/**
 * Calculate mastery score (0-100) for a word based on practice history.
 * Factors: correctness rate, total practices, recency, SRS interval.
 */
function calculateMasteryScore(practices, srs) {
  if (!practices || practices.length === 0) return 0

  const correctCount = practices.filter(p => p.correct === 1).length
  const accuracy = correctCount / practices.length
  const practiceCount = Math.min(practices.length, 10) // cap influence at 10 practices
  const practiceFactor = practiceCount / 10

  // Recency: last practice within 3 days = full weight, decays after
  const lastPractice = new Date(practices[0].practiced_at)
  const daysSince = (Date.now() - lastPractice.getTime()) / (1000 * 60 * 60 * 24)
  const recencyFactor = Math.max(0, 1 - daysSince / 30) // decays over 30 days

  // SRS interval factor: longer intervals indicate stronger memory
  const intervalFactor = srs?.interval ? Math.min(srs.interval / 21, 1) : 0

  const score = Math.round(
    (accuracy * 40 + practiceFactor * 20 + recencyFactor * 20 + intervalFactor * 20)
  )
  return Math.min(100, Math.max(0, score))
}

/**
 * Determine if a word is due for review.
 */
function isDueForReview(srs) {
  if (!srs || !srs.nextReviewDate) return true
  const nextReview = new Date(srs.nextReviewDate)
  return nextReview <= new Date()
}

/**
 * Get mastery level label.
 */
function getMasteryLabel(level) {
  const labels = ['New', 'Learning', 'Familiar', 'Mastered', 'Expert']
  return labels[level] || 'New'
}

module.exports = {
  MASTERY_LEVELS,
  calculateNextReview,
  calculateMasteryScore,
  isDueForReview,
  getMasteryLabel
}
