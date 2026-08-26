// AI service - supports local LLM (Codex/WorkBuddy/Ollama), DeepSeek, Qwen, and Doubao
// All providers use OpenAI-compatible chat completions API

const API_CONFIGS = {
  local: {
    name: 'Local LLM (Codex / WorkBuddy / Ollama)',
    needsKey: false,
    needsBaseUrl: true,
    defaultBaseUrl: 'http://localhost:11434/v1',
    defaultModel: 'gpt-4o-mini',
    description: 'Connect to a local OpenAI-compatible endpoint'
  },
  deepseek: {
    name: 'DeepSeek',
    needsKey: true,
    needsBaseUrl: false,
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    description: 'Best price/performance: $0.27/M input, $1.10/M output'
  },
  qwen: {
    name: 'Qwen (通义千问)',
    needsKey: true,
    needsBaseUrl: false,
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-turbo',
    description: 'Good Chinese support: ¥0.004/1K tokens'
  },
  doubao: {
    name: 'Doubao (豆包)',
    needsKey: true,
    needsBaseUrl: false,
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: 'ep-20240901-doubao-pro-32k',
    description: 'ByteDance ecosystem: ¥0.005/1K tokens'
  }
}

export function getProviderInfo() {
  return API_CONFIGS
}

export async function callAI(provider, apiKey, messages, baseUrl = '', model = '') {
  const config = API_CONFIGS[provider]
  if (!config) throw new Error(`Unknown provider: ${provider}`)

  let url, reqModel, authHeader

  if (provider === 'local') {
    url = `${(baseUrl || config.defaultBaseUrl).replace(/\/$/, '')}/chat/completions`
    reqModel = model || config.defaultModel
    authHeader = apiKey || 'no-key-needed'
  } else {
    url = config.url
    reqModel = model || config.model
    authHeader = apiKey
  }

  const headers = { 'Content-Type': 'application/json' }
  if (provider === 'local' && !apiKey) {
    // Some local servers don't need auth
  } else {
    headers['Authorization'] = `Bearer ${authHeader}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: reqModel,
      messages,
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

export async function generateCloze(provider, apiKey, word, baseUrl, model) {
  const prompt = `You are an English teacher for primary school students. Create a cloze (fill-in-the-blank) exercise for the word "${word}".

Return JSON in this exact format:
{"sentence": "A sentence with ___ where the word should be", "answer": "${word}", "options": ["${word}", "wrong1", "wrong2", "wrong3"], "hint": "A short hint in Chinese"}

Make the sentence simple and fun. Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ], baseUrl, model)
  return JSON.parse(result)
}

export async function generateSpelling(provider, apiKey, word, baseUrl, model) {
  const prompt = `You are an English teacher for primary school students. Create a spelling exercise for the word "${word}".

Return JSON in this exact format:
{"meaning": "Chinese meaning of ${word}", "hint": "A short English hint sentence (not containing the word)", "letters": ["array","of","individual","letters","of","the","word","plus","3","extra","random","letters"], "answer": "${word}"}

The letters array should contain all letters of the word plus 3 extra distractor letters, shuffled. Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ], baseUrl, model)
  return JSON.parse(result)
}

export async function generateImageDescription(provider, apiKey, word, baseUrl, model) {
  const prompt = `You are an English teacher for primary school students. Create an image description exercise for the word "${word}".

Return JSON in this exact format:
{"word": "${word}", "description": "A vivid description of an image related to ${word}", "question": "What word does this picture show?", "options": ["${word}", "wrong1", "wrong2", "wrong3"], "answer": "${word}"}

Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ], baseUrl, model)
  return JSON.parse(result)
}

export async function generateWordOrder(provider, apiKey, word, baseUrl, model) {
  const prompt = `You are an English teacher. Create a sentence unscramble exercise for the word "${word}".
Write a NEW original sentence (not a common template) that uses the word "${word}". Keep it 5-10 words, simple enough for young learners.

Return JSON in this exact format:
{"translation": "Chinese translation of the sentence", "shuffled": ["word1","word2",...], "answer": "the correct sentence", "correctOrder": ["word1","word2",...]}

The shuffled array must be the same words as correctOrder but in random order. Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ], baseUrl, model)
  return JSON.parse(result)
}

export async function generateListening(provider, apiKey, word, baseUrl, model) {
  const prompt = `You are an English teacher. Create a listening exercise for the word "${word}".
Provide 4 similar-looking English words as options, one of which is "${word}".

Return JSON in this exact format:
{"answer": "${word}", "options": ["${word}", "similar1", "similar2", "similar3"], "meaning": "Chinese meaning of ${word}"}

Choose distractors that look or sound similar to make it challenging. Return ONLY the JSON.`

  const result = await callAI(provider, apiKey, [
    { role: 'system', content: 'You are a helpful English teaching assistant. Always respond with valid JSON only.' },
    { role: 'user', content: prompt }
  ], baseUrl, model)
  return JSON.parse(result)
}
