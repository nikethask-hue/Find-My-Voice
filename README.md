# Who Do You Sing Like?

Single-page app (vanilla HTML/CSS/JS) that asks about your voice and queries the Anthropic Claude API to suggest artist matches.

Usage

- Open `index.html` in your browser (double-click or a static server).
- Paste your Anthropic API key into the top field (it's kept in memory only).
- Answer the questions and click "Find my artist match".

Notes

- The app uses `fetch` to call `https://api.anthropic.com/v1/messages` with model `claude-opus-4-6`.
- Some browsers may block direct calls to the Anthropic API due to CORS; if you see CORS errors, run a small proxy server or test from an environment that allows server-side calls (or use a local dev proxy).
- The API key is never stored—only kept in memory in the browser session.
# Find-My-Voice