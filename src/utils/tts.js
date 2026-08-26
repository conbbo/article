// Text-to-Speech using Web Speech API
// Handles async voice loading (critical for Chrome/Electron)

let cachedVoices = []
let voicesReady = false

function loadVoices() {
  if (!('speechSynthesis' in window)) return
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    cachedVoices = voices
    voicesReady = true
  }
}

// Initialize voice loading
if ('speechSynthesis' in window) {
  loadVoices()
  // Chrome loads voices asynchronously
  window.speechSynthesis.onvoiceschanged = () => {
    loadVoices()
  }
  // Some browsers need a tick
  setTimeout(loadVoices, 100)
  setTimeout(loadVoices, 500)
}

function findBestVoice() {
  if (cachedVoices.length === 0) {
    loadVoices()
  }
  // Prefer high-quality English voices
  return cachedVoices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
         cachedVoices.find(v => v.lang === 'en-US') ||
         cachedVoices.find(v => v.lang.startsWith('en')) ||
         cachedVoices[0] ||
         null
}

export function speak(text, rate = 0.9) {
  if (!('speechSynthesis' in window)) {
    console.warn('[TTS] Speech synthesis not supported in this browser')
    return false
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel()

  // Small delay after cancel (Chrome bug workaround)
  setTimeout(() => {
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

    window.speechSynthesis.speak(utterance)
  }, 50)

  return true
}

export function stopSpeaking() {
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
