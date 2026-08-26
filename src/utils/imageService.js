

// Image service — uses Wikimedia Commons API for word-relevant images
// Falls back to an emoji-based SVG data URI if no image is found
// In Electron mode, downloads and caches via IPC for offline reuse

const imageCache = new Map()

// Emoji mapping for common word categories (used as visual fallback)
const wordEmojis = {
  apple: '🍎', banana: '🍌', orange: '🍊', egg: '🥚', cake: '🎂', milk: '🥛', bread: '🍞',
  rice: '🍚', meat: '🥩', fish: '🐟', sandwich: '🥪', juice: '🧃', tea: '🍵', candy: '🍬',
  'ice cream': '🍦', water: '💧', coffee: '☕', breakfast: '🍳', lunch: '🍱', dinner: '🍽️',
  cat: '🐱', dog: '🐶', bird: '🐦', horse: '🐴', rabbit: '🐰', elephant: '🐘', crocodile: '🐊',
  dolphin: '🐬', animal: '🐾', mouse: '🐭', lion: '🦁', tiger: '🐯', bear: '🐻', panda: '🐼',
  monkey: '🐵', snake: '🐍', duck: '🦆', chicken: '🐔', cow: '🐮', pig: '🐷', sheep: '🐑',
  frog: '🐸', bee: '🐝', butterfly: '🦋', spider: '🕷️', turtle: '🐢', penguin: '🐧',
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', black: '⬛', white: '⬜', pink: '🩷', purple: '🟣', brown: '🟤', orange: '🟠',
  sun: '☀️', moon: '🌙', star: '⭐', rain: '🌧️', snow: '❄️', cloud: '☁️', wind: '💨', thunder: '⛈️',
  spring: '🌸', summer: '☀️', autumn: '🍂', winter: '⛄', weather: '🌤️',
  tree: '🌳', flower: '🌸', forest: '🌲', grass: '🌱', mountain: '⛰️', island: '🏝️', beach: '🏖️',
  river: '🏞️', sea: '🌊', lake: '🏞️', field: '🌾', garden: '🌷', volcano: '🌋', earthquake: '🌋',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', desk: '🪑', chair: '🪑', table: '🪑',
  bag: '🎒', schoolbag: '🎒', clock: '⏰', phone: '📱', key: '🔑', computer: '💻', robot: '🤖',
  keyboard: '⌨️', screen: '🖥️', camera: '📷', scissors: '✂️', envelope: '✉️', umbrella: '☂️',
  hat: '🎩', shoe: '👟', shirt: '👕', uniform: '👔', glove: '🧤', blanket: '🛏️', carpet: '🟫',
  door: '🚪', window: '🪟', house: '🏠', building: '🏢', hospital: '🏥', school: '🏫',
  library: '📚', museum: '🏛️', cinema: '🎬', concert: '🎵', stadium: '🏟️', airport: '✈️',
  station: '🚉', hotel: '🏨', restaurant: '🍴', garage: '🚗', bridge: '🌉', castle: '🏰',
  car: '🚗', bus: '🚌', boat: '⛵', bicycle: '🚲', train: '🚂', plane: '✈️', flight: '✈️',
  rocket: '🚀', helicopter: '🚁', motorbike: '🏍️', ambulance: '🚑', police: '👮', doctor: '👨‍⚕️',
  teacher: '👨‍🏫', student: '👨‍🎓', scientist: '👨‍🔬', astronaut: '👨‍🚀', farmer: '👨‍🌾', chef: '👨‍🍳',
  friend: '👫', family: '👪', father: '👨', mother: '👩', brother: '👦', sister: '👧',
  grandpa: '👴', grandma: '👵', baby: '👶', boy: '👦', girl: '👧', man: '👨', woman: '👩',
  happy: '😊', sad: '😢', angry: '😠', tired: '😴', sick: '🤒', afraid: '😨', nervous: '😰',
  excited: '🤩', bored: '😑', confused: '😕', surprised: '😲', proud: '😌', brave: '💪',
  music: '🎵', piano: '🎹', guitar: '🎸', violin: '🎻', drum: '🥁',
  sport: '⚽', football: '⚽', basketball: '🏀', baseball: '⚾', swimming: '🏊', running: '🏃',
  dance: '💃', sing: '🎤', draw: '🎨', paint: '🎨', read: '📖', write: '✍️', play: '🎮',
  game: '🎮', chess: '♟️', 'board game': '🎲', fishing: '🎣', camping: '⛺', hiking: '🥾',
  picnic: '🧺', travel: '✈️', tour: '🗺️', holiday: '🏖️', vacation: '🏖️', party: '🎉',
  birthday: '🎂', christmas: '🎄', festival: '🎊', fireworks: '🎆', gift: '🎁', cake: '🎂',
  trophy: '🏆', medal: '🏅', champion: '🏆', competition: '🏆', race: '🏃', team: '👥',
  money: '💰', coin: '🪙', ticket: '🎫', receipt: '🧾', card: '💳', mail: '📬', message: '💬',
  email: '📧', internet: '🌐', website: '🌐', online: '💻', software: '💿', program: '💾',
  time: '⏰', hour: '⏰', minute: '⏱️', day: '📅', week: '📅', month: '📅', year: '📅',
  today: '📅', tomorrow: '📅', yesterday: '📅', morning: '🌅', afternoon: '🌇', evening: '🌆', night: '🌃',
  monday: '📅', tuesday: '📅', wednesday: '📅', thursday: '📅', friday: '📅', saturday: '📅', sunday: '📅',
  hand: '✋', eye: '👁️', nose: '👃', mouth: '👄', ear: '👂', face: '😀', head: '🧑', hair: '💇',
  arm: '💪', leg: '🦵', foot: '🦶', tooth: '🦷', heart: '❤️', brain: '🧠', bone: '🦴',
  ball: '⚽', toy: '🧸', doll: '🪆', kite: '🪁', puzzle: '🧩', card: '🎴',
  medicine: '💊', hospital: '🏥', health: '💊', exercise: '🏃', diet: '🥗',
  earth: '🌍', world: '🌍', map: '🗺️', globe: '🌍', space: '🌌', star: '⭐', planet: '🪐',
  satellite: '🛰️', energy: '⚡', electricity: '⚡', battery: '🔋', solar: '☀️',
  fire: '🔥', ice: '🧊', gold: '🥇', silver: '🥈', bronze: '🥉', diamond: '💎',
  tree: '🌳', leaf: '🍃', seed: '🌱', root: '🌿', branch: '🌿',
  language: '🔤', english: '🇬🇧', chinese: '🇨🇳', word: '📝', letter: '✉️', sentence: '📝',
  story: '📖', news: '📰', magazine: '📖', newspaper: '📰', headline: '📰',
  art: '🎨', science: '🔬', math: '🔢', history: '📜', geography: '🗺️', physics: '⚛️', chemistry: '🧪', biology: '🧬',
  exam: '📝', test: '📝', homework: '📚', lesson: '📖', class: '🏫', classroom: '🏫', grade: '🏆',
  success: '✅', failure: '❌', error: '❌', correct: '✅', wrong: '❌',
  love: '❤️', peace: '☮️', freedom: '🕊️', courage: '🦁', hope: '🙏', dream: '💭',
  goal: '🎯', future: '🔮', past: '📜', memory: '🧠', idea: '💡', plan: '📋',
  weather: '🌤️', temperature: '🌡️', degree: '🌡️', forecast: '🌦️',
  city: '🏙️', village: '🏘️', country: '🗺️', road: '🛣️', street: '🛣️', bridge: '🌉',
  shop: '🛒', store: '🛒', market: '🏪', supermarket: '🛒', bookshop: '📚',
  dog: '🐶', cat: '🐱', fish: '🐟', bird: '🐦', horse: '🐴', rabbit: '🐰', elephant: '🐘',
}

function getEmojiForWord(word) {
  const lower = word.toLowerCase().trim()
  if (wordEmojis[lower]) return wordEmojis[lower]
  // Try partial match
  for (const key of Object.keys(wordEmojis)) {
    if (lower.includes(key) || key.includes(lower)) return wordEmojis[key]
  }
  return '📖'
}

function generateEmojiSvg(word) {
  const emoji = getEmojiForWord(word)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#F5F3FF"/><text x="200" y="170" font-size="120" text-anchor="middle" dominant-baseline="middle">${emoji}</text><text x="200" y="250" font-size="20" text-anchor="middle" fill="#6366F1" font-family="sans-serif">${word}</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

export async function getWordImage(word) {
  if (imageCache.has(word)) {
    return imageCache.get(word)
  }

  // Try Wikimedia Commons API for a real image of the word
  const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&titles=${encodeURIComponent(word)}&pithumbsize=400`

  let imageUrl = null
  try {
    const resp = await fetch(wikiUrl)
    if (resp.ok) {
      const data = await resp.json()
      const pages = data?.query?.pages
      if (pages) {
        for (const key of Object.keys(pages)) {
          const thumb = pages[key]?.thumbnail?.source
          if (thumb) { imageUrl = thumb; break }
        }
      }
    }
  } catch (e) {
    // network error, fall through to emoji
  }

  if (!imageUrl) {
    // Fallback to emoji-based SVG
    imageUrl = generateEmojiSvg(word)
  }

  // In Electron mode, try to download and cache locally (skip for data URIs)
  if (window.electronAPI && !imageUrl.startsWith('data:')) {
    try {
      const localPath = await window.electronAPI.downloadImage({ url: imageUrl, word })
      if (localPath) {
        const localUrl = `file://${localPath}`
        imageCache.set(word, localUrl)
        return localUrl
      }
    } catch (e) {
      // fall through to online URL
    }
  }

  imageCache.set(word, imageUrl)
  return imageUrl
}

export function clearImageCache() {
  imageCache.clear()
}
