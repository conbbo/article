// AI service - supports DeepSeek, Qwen (通义千问), and Doubao (豆包)
// Recommendation: DeepSeek offers the best price/performance ratio
// - DeepSeek: $0.27/M input, $1.10/M output (cheapest, high quality)
// - Qwen: ¥0.004/1K tokens (moderate price, good Chinese support)
// - Doubao: ¥0.005/1K tokens (moderate price, ByteDance ecosystem)

const API_CONFIGS = {
  deepseek: {
    name: 'DeepSeek',
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    headerKey: 'Authorization',
    headerPrefix: 'Bearer '
  },
  qwen: {
    name: '通义千问 (Qwen)',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-turbo',
    headerKey: 'Authorization',
    headerPrefix: 'Bearer '
  },
  doubao: {
    name: '豆包 (Doubao)',
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'ep-20240901-doubao-pro-32k',
    headerKey: 'Authorization',
    headerPrefix: 'Bearer '
  }
}

export function getProviderInfo() {
  return {
    deepseek: { name: 'DeepSeek', price: '$0.27/M input, $1.10/M output', recommendation: 'Best price/performance' },
    qwen: { name: '通义千问', price: '¥0.004/1K tokens', recommendation: 'Good Chinese support' },
    doubao: { name: '豆包', price: '¥0.005/1K tokens', recommendation: 'ByteDance ecosystem' }
  }
}

export async function callAI(provider, apiKey, messages) {
  const config = API_CONFIGS[provider]
  if (!config) throw new Error(`Unknown provider: ${provider}`)

  const response = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [config.headerKey]: config.headerPrefix + apiKey
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      temperature: 0.8,
      max_tokens: 2000
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API error ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

// Generate cloze (fill-in-the-blank) exercise
export async function generateCloze(provider, apiKey, word) {
  const prompt = `You are an English teacher for primary school students. Create a cloze (fill-in-the-blank) exercise for the word "${word}".

Return JSON in this exact format:
{
  "sentence": "A sentence with ___ where the word should be",
  "answer": "${word}",
  "options": ["${word}", "wrong1", "wrong2", "wrong3"],
  "hint": "A short hint in Chinese"
}

Make the sentence simple and fun for kids. Options should be shuffled logically. Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant for children. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ])
  return JSON.parse(result)
}

// Generate spelling exercise
export async function generateSpelling(provider, apiKey, word) {
  const prompt = `You are an English teacher for primary school students. Create a spelling exercise for the word "${word}".

Return JSON in this exact format:
{
  "meaning": "Chinese meaning of ${word}",
  "hint": "A short English hint sentence (not containing the word)",
  "letters": ["array", "of", "individual", "letters", "of", "the", "word", "plus", "3", "extra", "random", "letters"],
  "answer": "${word}"
}

The letters array should contain all letters of the word plus 3 extra distractor letters, shuffled. Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant for children. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ])
  return JSON.parse(result)
}

// Generate image description exercise
export async function generateImageDescription(provider, apiKey, word) {
  const prompt = `You are an English teacher for primary school students. Create an image description exercise for the word "${word}".

Return JSON in this exact format:
{
  "word": "${word}",
  "description": "A vivid description of an image related to ${word}, suitable for children",
  "question": "What word does this picture show?",
  "options": ["${word}", "wrong1", "wrong2", "wrong3"],
  "answer": "${word}"
}

Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant for children. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ])
  return JSON.parse(result)
}

// Generate example sentence
export async function generateExample(provider, apiKey, word) {
  const prompt = `Create a simple, fun example sentence using the word "${word}" for primary school students. 
Return JSON: {"sentence": "the sentence", "translation": "中文翻译"}
Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant for children.' },
    { role: 'user', content: prompt }
  ])
  return JSON.parse(result)
}
