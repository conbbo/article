// Text-to-Speech using Web Speech API
// Handles async voice loading (critical for Chrome/Electron)

let cachedVoices = []
let voicesReady = false
let speakTimeout = null

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    cachedVoices = voices
    voicesReady = true
  }
}

if ('speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices()
  }
  setTimeout(loadVoices, 100)
  setTimeout(loadVoices, 500)
}

function findBestVoice() {
  if (cachedVoices.length === 0) {
    loadVoices()
  }
  return cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
         cachedVoices.find(v => v.lang === 'en-US') ||
         cachedVoices.find(v => v.lang.startsWith('en')) ||
         cachedVoices[0] ||
         null
}

export function speak(text, rate = 0.9) {
  if (!('speechSynthesis' in window)) {
    console.warn('[TTS] Speech synthesis not supported')
    return false
  }

  // Clear any pending speak from a previous call
  if (speakTimeout) {
    clearTimeout(speakTimeout)
    speakTimeout = null
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()
  // Resume after cancel — Chrome bug workaround
  window.speechSynthesis.resume()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  utterance.pitch = 1.0
  utterance.volume = 1.0

  const voice = findBestVoice()
  if (voice) {
    utterance.voice = voice
  }

  utterance.onerror = (e) => {
    console.warn('[TTS] Speech error:', e.error)
  }

  speakTimeout = setTimeout(() => {
    window.speechSynthesis.speak(utterance)
    speakTimeout = null
  }, 50)

  return true
}

export function stopSpeaking() {
  if (speakTimeout) {
    clearTimeout(speakTimeout)
    speakTimeout = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeaking() {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking
}

export function isSupported() {
  return 'speechSynthesis' in window
}

export function getAvailableVoices() {
  loadVoices()
  return cachedVoices.filter(v => v.lang.startsWith('en'))
}
