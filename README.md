# WordMagic

AI-driven English vocabulary learning desktop app, based on the Cambridge English graded word system.

## Features

- **Daily Task**: Unified study flow — learn words, then practice with randomly assigned game modes (Cloze, Spelling, Picture Match). Configurable word count and question count.
- **AI-Powered Questions**: Dynamic question generation via local LLM (Codex / WorkBuddy / Ollama), DeepSeek, Qwen, or Doubao
- **Cambridge Word Bank**: Graded vocabulary across Starters (Pre-A1), Movers (A1), Flyers (A2), and KET (A2+)
- **Custom Word Import**: Add your own word lists
- **Progress Tracking**: Learning stats, 7-day activity chart, achievement system
- **SQLite Storage**: All data stored locally in SQLite — words, learning records, practice history, settings
- **TTS Pronunciation**: Web Speech API for word and sentence audio

## Tech Stack

- **Frontend**: Vue 3 (Composition API) + Vite + Pinia + Vue Router
- **Desktop**: Electron
- **Database**: SQLite (better-sqlite3)
- **AI**: Local LLM (OpenAI-compatible) / DeepSeek / Qwen / Doubao
- **TTS**: Web Speech API

## Getting Started

```bash
npm install
npm run dev              # Browser dev mode
npm run electron:dev     # Electron desktop app
npm run electron:build   # Package as desktop installer
```

## AI Configuration

### Local LLM (Codex / WorkBuddy / Ollama)

1. Go to Settings
2. Select "Local LLM" as provider
3. Enter Base URL (e.g. `http://localhost:11434/v1` for Ollama, `http://localhost:8080/v1` for Codex)
4. Enter Model Name (e.g. `gpt-4o-mini`, `llama3`, `qwen2.5`)
5. Leave API Key empty if your server doesn't require auth

Any OpenAI-compatible `/v1/chat/completions` endpoint will work.

### Cloud Providers

- **DeepSeek**: Recommended for best price/performance ($0.27/M input)
- **Qwen (通义千问)**: Good Chinese support (¥0.004/1K tokens)
- **Doubao (豆包)**: ByteDance ecosystem (¥0.005/1K tokens)

Without an API key or local server, the app uses built-in question templates.

## Project Structure

```
src/
├── views/          # Dashboard, DailyTask, WordBank, Progress, Settings
├── stores/         # Pinia stores (progress, settings) — SQLite-backed
├── data/           # Cambridge word bank data (browser fallback)
├── utils/          # AI service, TTS, image search
├── styles/         # Global CSS
└── router/         # Vue Router config
electron/
├── main.js         # Electron main process + SQLite database
├── preload.js      # Context bridge for IPC
└── seedWords.js    # Initial word bank data for SQLite
```
