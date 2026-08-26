// Image service — uses Openverse API + Wikimedia Commons search for word-relevant images
// Falls back to an emoji-based SVG data URI if no image is found
// In Electron mode, downloads and caches via IPC for offline reuse

const imageCache = new Map()

const wordEmojis = {
  apple: '🍎', banana: '🍌', orange: '🍊', egg: '🥚', cake: '🎂', milk: '🥛', bread: '🍞',
  rice: '🍚', meat: '🥩', fish: '🐟', sandwich: '🥪', juice: '🧃', tea: '🍵', candy: '🍬',
  'ice cream': '🍦', water: '💧', coffee: '☕', breakfast: '🍳',
  cat: '🐱', dog: '🐶', bird: '🐦', horse: '🐴', rabbit: '🐰', elephant: '🐘', crocodile: '🐊',
  dolphin: '🐬', animal: '🐾', mouse: '🐭', lion: '🦁', tiger: '🐯', bear: '🐻', panda: '🐼',
  monkey: '🐵', snake: '🐍', duck: '🦆', chicken: '🐔', cow: '🐮', pig: '🐷', sheep: '🐑',
  frog: '🐸', bee: '🐝', butterfly: '🦋', turtle: '🐢', penguin: '🐧',
  red: '🔴', blue: '🔵', green: '🟢', yellow: '🟡', black: '⬛', white: '⬜', pink: '🩷', purple: '🟣', brown: '🟤',
  sun: '☀️', moon: '🌙', star: '⭐', rain: '🌧️', snow: '❄️', cloud: '☁️', wind: '💨', thunder: '⛈️',
  spring: '🌸', summer: '☀️', autumn: '🍂', winter: '⛄', weather: '🌤️',
  tree: '🌳', flower: '🌸', forest: '🌲', grass: '🌱', mountain: '⛰️', island: '🏝️', beach: '🏖️',
  river: '🏞️', sea: '🌊', field: '🌾', garden: '🌷', volcano: '🌋',
  book: '📚', pen: '🖊️', pencil: '✏️', ruler: '📏', clock: '⏰', phone: '📱', key: '🔑', computer: '💻', robot: '🤖',
  keyboard: '⌨️', screen: '🖥️', scissors: '✂️', envelope: '✉️', umbrella: '☂️',
  hat: '🎩', shoe: '👟', shirt: '👕', uniform: '👔', glove: '🧤', blanket: '🛏️',
  door: '🚪', window: '🪟', house: '🏠', building: '🏢', hospital: '🏥', school: '🏫',
  library: '📚', museum: '🏛️', cinema: '🎬', concert: '🎵', stadium: '🏟️', airport: '✈️',
  station: '🚉', hotel: '🏨', restaurant: '🍴', garage: '🚗', bridge: '🌉',
  car: '🚗', bus: '🚌', boat: '⛵', bicycle: '🚲', train: '🚂', plane: '✈️', flight: '✈️',
  rocket: '🚀', helicopter: '🚁', motorbike: '🏍️', ambulance: '🚑', police: '👮', doctor: '👨‍⚕️',
  teacher: '👨‍🏫', student: '👨‍🎓', scientist: '👨‍🔬', astronaut: '👨‍🚀', farmer: '👨‍🌾', chef: '👨‍🍳',
  friend: '👫', family: '👪', father: '👨', mother: '👩', brother: '👦', sister: '👧',
  grandpa: '👴', grandma: '👵', baby: '👶', boy: '👦', girl: '👧', man: '👨', woman: '👩',
  happy: '😊', sad: '😢', angry: '😠', tired: '😴', sick: '🤒', afraid: '😨', nervous: '😰',
  excited: '🤩', bored: '😑', confused: '😕', surprised: '😲', proud: '😌', brave: '💪',
  music: '🎵', piano: '🎹', guitar: '🎸', violin: '🎻', drum: '🥁',
  sport: '⚽', football: '⚽', basketball: '🏀', baseball: '⚾', swimming: '🏊',
  dance: '💃', sing: '🎤', draw: '🎨', read: '📖', write: '✍️', play: '🎮',
  game: '🎮', chess: '♟️', 'board game': '🎲', fishing: '🎣', camping: '⛺',
  picnic: '🧺', travel: '✈️', tour: '🗺️', holiday: '🏖️', vacation: '🏖️', party: '🎉',
  birthday: '🎂', festival: '🎊', fireworks: '🎆', gift: '🎁',
  trophy: '🏆', champion: '🏆', competition: '🏆',
  money: '💰', coin: '🪙', ticket: '🎫', receipt: '🧾', mail: '📬', message: '💬',
  email: '📧', internet: '🌐', software: '💿', program: '💾',
  medicine: '💊', health: '💊', exercise: '🏃',
  earth: '🌍', world: '🌍', map: '🗺️', space: '🌌', planet: '🪐',
  satellite: '🛰️', energy: '⚡', battery: '🔋',
  fire: '🔥', ice: '🧊', diamond: '💎',
  language: '🔤', word: '📝', sentence: '📝',
  story: '📖', news: '📰', magazine: '📖', newspaper: '📰',
  art: '🎨', science: '🔬', math: '🔢', history: '📜', geography: '🗺️', physics: '⚛️', chemistry: '🧪', biology: '🧬',
  exam: '📝', test: '📝', homework: '📚', lesson: '📖', class: '🏫',
  success: '✅', error: '❌', correct: '✅', wrong: '❌',
  love: '❤️', peace: '☮️', freedom: '🕊️', courage: '🦁', hope: '🙏', dream: '💭',
  goal: '🎯', future: '🔮', memory: '🧠', idea: '💡',
  weather: '🌤️', temperature: '🌡️', forecast: '🌦️',
  city: '🏙️', village: '🏘️', shop: '🛒', market: '🏪',
}

function getEmojiForWord(word) {
  const lower = word.toLowerCase().trim()
  if (wordEmojis[lower]) return wordEmojis[lower]
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

// Try Openverse API (free, no key, searches millions of CC-licensed images)
async function tryOpenverse(word) {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(word)}&page_size=1&mature=false`
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!resp.ok) return null
    const data = await resp.json()
    if (data?.results?.length > 0) {
      const img = data.results[0]
      if (img.thumbnail || img.url) return img.thumbnail || img.url
    }
  } catch (e) { /* network */ }
  return null
}

// Try Wikimedia Commons search (searches file namespace, broader than pageimages)
async function tryWikimediaSearch(word) {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&list=search&srsearch=${encodeURIComponent(word)}&srnamespace=6&srlimit=3`
    const resp = await fetch(searchUrl)
    if (!resp.ok) return null
    const data = await resp.json()
    const results = data?.query?.search
    if (!results || results.length === 0) return null

    // Get image info for the first matching file
    for (const result of results) {
      const title = result.title
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url&iiurlwidth=400`
      const infoResp = await fetch(infoUrl)
      if (!infoResp.ok) continue
      const infoData = await infoResp.json()
      const pages = infoData?.query?.pages
      if (pages) {
        for (const key of Object.keys(pages)) {
          const thumbUrl = pages[key]?.imageinfo?.[0]?.thumburl
          if (thumbUrl) return thumbUrl
        }
      }
    }
  } catch (e) { /* network */ }
  return null
}

// Try Wikimedia pageimages (works for words that match Wikipedia articles)
async function tryWikimediaPageImages(word) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&titles=${encodeURIComponent(word)}&pithumbsize=400`
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data = await resp.json()
    const pages = data?.query?.pages
    if (pages) {
      for (const key of Object.keys(pages)) {
        const thumb = pages[key]?.thumbnail?.source
        if (thumb) return thumb
      }
    }
  } catch (e) { /* network */ }
  return null
}

export async function getWordImage(word) {
  if (imageCache.has(word)) {
    return imageCache.get(word)
  }

  // Try multiple image sources in order of quality
  let imageUrl = null

  // 1. Openverse API (best for concrete nouns)
  imageUrl = await tryOpenverse(word)

  // 2. Wikimedia Commons search (broader than pageimages)
  if (!imageUrl) imageUrl = await tryWikimediaSearch(word)

  // 3. Wikimedia pageimages (works for exact article matches)
  if (!imageUrl) imageUrl = await tryWikimediaPageImages(word)

  // 4. Fallback to emoji SVG
  if (!imageUrl) imageUrl = generateEmojiSvg(word)

  // In Electron mode, try to download and cache locally (skip for data URIs)
  if (window.electronAPI && !imageUrl.startsWith('data:')) {
    try {
      const localPath = await window.electronAPI.downloadImage({ url: imageUrl, word })
      if (localPath) {
        const localUrl = `file://${localPath}`
        imageCache.set(word, localUrl)
        return localUrl
      }
    } catch (e) { /* fall through */ }
  }

  imageCache.set(word, imageUrl)
  return imageUrl
}

export function clearImageCache() {
  imageCache.clear()
}
