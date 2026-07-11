# Scheme Sathi AI Chatbot

Scheme Sathi includes a multilingual government-schemes chatbot. It answers using the schemes held in `backend/data/schemes.json`, carries short-term conversation context, and can work in English, Hindi, and Telugu.

## Run it

1. In `backend/.env`, replace `YOUR_GEMINI_API_KEY_HERE` with a Google Gemini API key. Without a key, the built-in rule-based demo replies are still available.
2. Start the backend: `cd backend` then `npm run dev`.
3. Start the frontend in another terminal: `cd frontend` then `npm run dev`.
4. Open the Vite address shown in the terminal and use the chat button at bottom-right.

## Deployment setting

When the frontend API is not at `http://localhost:5050/api`, create `frontend/.env` with:

```env
VITE_API_URL=https://your-api.example.com/api
```

The chat widget now includes starter prompts, a visible connection/error message, and disables duplicate sends while the AI is responding.
