// Image search service - searches for word images and caches locally
// Uses Unsplash Source API (free, no key needed) as fallback
// In Electron mode, downloads and caches via IPC

const imageCache = new Map()

export async function getWordImage(word) {
  // Check in-memory cache
  if (imageCache.has(word)) {
    return imageCache.get(word)
  }

  // Check if running in Electron with local cache
  if (window.electronAPI) {
    try {
      const localPath = await window.electronAPI.downloadImage({
        url: `https://source.unsplash.com/400x300/?${encodeURIComponent(word)}`,
        word: word
      })
      if (localPath) {
        const url = `file://${localPath}`
        imageCache.set(word, url)
        return url
      }
    } catch (e) {
      console.warn('Electron image download failed, falling back to online')
    }
  }

  // Fallback: use Unsplash source URL directly (online mode)
  const url = `https://source.unsplash.com/400x300/?${encodeURIComponent(word)}`
  imageCache.set(word, url)
  return url
}

// Alternative: use a more reliable free image API
export async function getWordImageAlt(word) {
  // Using picsum as a reliable placeholder image service
  const seed = word.charCodeAt(0) + word.length
  const url = `https://picsum.photos/seed/${seed}/400/300`
  imageCache.set(word, url)
  return url
}

export function clearImageCache() {
  imageCache.clear()
}
