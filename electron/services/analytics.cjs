// Analytics Engine — Learning curve analysis, weakness detection, trend computation
// Runs in Electron main process as a backend service.

/**
 * Compute learning curve data over time.
 * Returns daily aggregates: words learned, questions answered, accuracy, mastery growth.
 */
function computeLearningCurve(practiceRecords, learnedWords, days = 30) {
  const curve = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const dayPractices = practiceRecords.filter(p =>
      p.practiced_at.startsWith(dateStr)
    )

    const correct = dayPractices.filter(p => p.correct === 1).length
    const wrong = dayPractices.filter(p => p.correct === 0).length
    const total = correct + wrong
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    const wordsLearnedToday = learnedWords.filter(w =>
      w.learned_at && w.learned_at.startsWith(dateStr)
    ).length

    curve.push({
      date: dateStr,
      questionsAnswered: total,
      correct,
      wrong,
      accuracy,
      wordsLearned: wordsLearnedToday
    })
  }

  return curve
}

/**
 * Detect weak words — words with low accuracy or frequent failures.
 * Returns sorted list of words needing attention.
 */
function detectWeakWords(practiceRecords) {
  const wordStats = {}

  for (const p of practiceRecords) {
    if (!wordStats[p.word]) {
      wordStats[p.word] = { word: p.word, correct: 0, wrong: 0, total: 0, lastSeen: p.practiced_at }
    }
    wordStats[p.word].total++
    if (p.correct === 1) {
      wordStats[p.word].correct++
    } else {
      wordStats[p.word].wrong++
    }
    if (p.practiced_at > wordStats[p.word].lastSeen) {
      wordStats[p.word].lastSeen = p.practiced_at
    }
  }

  const weakWords = Object.values(wordStats)
    .map(s => ({
      ...s,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      weaknessScore: s.total > 0 ? Math.round((s.wrong / s.total) * 100) : 0
    }))
    .filter(s => s.total >= 1 && s.accuracy < 70)
    .sort((a, b) => b.weaknessScore - a.weaknessScore || b.total - a.total)
    .slice(0, 20)

  return weakWords
}

/**
 * Compute learning trend: is the user improving, declining, or stable?
 * Compares accuracy of last 7 days vs previous 7 days.
 */
function computeTrend(practiceRecords) {
  const now = new Date()
  const last7Start = new Date(now)
  last7Start.setDate(last7Start.getDate() - 7)
  const prev7Start = new Date(now)
  prev7Start.setDate(prev7Start.getDate() - 14)

  const last7 = practiceRecords.filter(p => new Date(p.practiced_at) >= last7Start)
  const prev7 = practiceRecords.filter(p => {
    const d = new Date(p.practiced_at)
    return d >= prev7Start && d < last7Start
  })

  const last7Accuracy = last7.length > 0
    ? last7.filter(p => p.correct === 1).length / last7.length
    : 0
  const prev7Accuracy = prev7.length > 0
    ? prev7.filter(p => p.correct === 1).length / prev7.length
    : 0

  const delta = last7Accuracy - prev7Accuracy
  let trend = 'stable'
  if (delta > 0.05) trend = 'improving'
  else if (delta < -0.05) trend = 'declining'

  return {
    trend,
    delta: Math.round(delta * 100),
    currentAccuracy: Math.round(last7Accuracy * 100),
    previousAccuracy: Math.round(prev7Accuracy * 100),
    last7Count: last7.length,
    prev7Count: prev7.length
  }
}

/**
 * Compute overall statistics summary.
 */
function computeSummary(practiceRecords, learnedWords, masteryScores) {
  const totalPractice = practiceRecords.length
  const correctCount = practiceRecords.filter(p => p.correct === 1).length
  const wrongCount = totalPractice - correctCount
  const accuracy = totalPractice > 0 ? Math.round((correctCount / totalPractice) * 100) : 0

  const avgMastery = masteryScores.length > 0
    ? Math.round(masteryScores.reduce((s, m) => s + m.score, 0) / masteryScores.length)
    : 0

  // Game mode breakdown
  const modeStats = {}
  for (const p of practiceRecords) {
    if (!modeStats[p.game_mode]) {
      modeStats[p.game_mode] = { total: 0, correct: 0 }
    }
    modeStats[p.game_mode].total++
    if (p.correct === 1) modeStats[p.game_mode].correct++
  }

  const modeBreakdown = Object.entries(modeStats).map(([mode, s]) => ({
    mode,
    total: s.total,
    correct: s.correct,
    accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  }))

  return {
    totalPractice,
    correctCount,
    wrongCount,
    accuracy,
    learnedCount: learnedWords.length,
    avgMastery,
    modeBreakdown
  }
}

module.exports = {
  computeLearningCurve,
  detectWeakWords,
  computeTrend,
  computeSummary
}
