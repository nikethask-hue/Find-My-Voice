# Who Do You Sing Like?

Single-page app (vanilla HTML/CSS/JS) that asks about your voice and returns artist matches using a backend Anthropic Claude proxy.

Usage

- Install dependencies and run the server locally.
  ```bash
  npm install
  ANTHROPIC_API_KEY=your_key_here npm start
  ```
- Open `http://localhost:3000` in your browser.
- Answer the questions and click "Find my artist match".

Notes

- The browser does not require an API key; the server stores the Anthropic key behind the scenes.
- The server side calls `https://api.anthropic.com/v1/messages` with model `claude-opus-4-6`.
- If you deploy this app, keep `ANTHROPIC_API_KEY` in server-side environment configuration only.
# Find-My-Voice