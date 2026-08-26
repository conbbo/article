// Image service — uses Lorem Picsum (reliable, no key needed) with deterministic per-word seeds
// In Electron mode, downloads and caches via IPC for offline reuse

const imageCache = new Map()

export async function getWordImage(word) {
  if (imageCache.has(word)) {
    return imageCache.get(word)
  }

  // Generate a deterministic seed from the word so each word always gets the same image
  let seed = 0
  for (let i = 0; i < word.length; i++) {
    seed = ((seed << 5) - seed) + word.charCodeAt(i)
    seed = seed & 0x7fffffff
  }

  // Use Picsum (always works, no rate limits, no key needed)
  const url = `https://picsum.photos/seed/${seed}/400/300`

  // In Electron mode, try to download and cache locally
  if (window.electronAPI) {
    try {
      const localPath = await window.electronAPI.downloadImage({ url, word })
      if (localPath) {
        const localUrl = `file://${localPath}`
        imageCache.set(word, localUrl)
        return localUrl
      }
    } catch (e) {
      // fall through to online URL
    }
  }

  imageCache.set(word, url)
  return url
}

export function clearImageCache() {
  imageCache.clear()
}
