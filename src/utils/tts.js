// Text-to-Speech using Web Speech API
let currentUtterance = null

export function speak(text, rate = 0.9) {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported')
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  utterance.pitch = 1.1

  // Try to find an English voice
  const voices = window.speechSynthesis.getVoices()
  if (voices.length > 0) {
    const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) ||
                    voices.find(v => v.lang.startsWith('en')) ||
                    voices[0]
    if (enVoice) utterance.voice = enVoice
  }

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeaking() {
  return 'speechSynthesis' in window && window.speechSynthesis.speaking
}

// Preload voices (some browsers load asynchronously)
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}
