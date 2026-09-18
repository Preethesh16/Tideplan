# Reproduce the product walkthrough

The published walkthrough is a 2 minute 47 second real-browser cut with generated narration. It has no artificial zoom or slideshow transitions. Its source script is `scripts/demo-scenes.json`.

## Requirements

- Node.js 20+, project dependencies and Playwright Chromium
- Python and `edge-tts` for narration; the speech service requires network access
- FFmpeg and FFprobe on PATH

```bash
npm ci
npx playwright install chromium
python -m venv .voice-venv
.voice-venv/bin/pip install edge-tts
.voice-venv/bin/python scripts/generate-voice.py
```

Start `npm run dev` in one terminal. In another:

```bash
npm run record
node scripts/render-demo.mjs
```

The recording starts with a clean browser profile. It demonstrates synthetic data, including failed import/approval cases. Do not reuse the script against real borrower records or a production payment system.

## Outputs

- `public/demo/tideplan-demo.mp4`: H.264 video with AAC narration, preserving the browser aspect ratio.
- `public/demo/captions.vtt`: English captions; timing is sentence-level and approximate.
- `public/demo/chapters.json`: scene entry points for the player.
- `public/demo/transcript.txt`: accessible text version of the narration.
- `work/`: ignored temporary audio and recording artifacts.

The player is served at `/demo/`. GitHub README links open this player rather than the repository's binary file preview. Narration uses the `en-IN-PrabhatNeural` voice via `edge-tts`; the app itself does not use an LLM.

## Presenter notes

1. Start at Asha's overview and explain that timing and ability are different questions.
2. Show the original obligation, buffer and fixed/aligned comparison before moving a slider.
3. Use Ravi to demonstrate that a sustained decline is not treated as normal seasonality.
4. Show a 60% shock: a failed plan is a meaningful outcome, not a broken UI.
5. Return to a 5% shock for the approval, consent and reserve demonstration.
6. Explain the exact-scenario approval binding and local-only role simulation.
7. Verify the evidence and demonstrate tamper rejection.
8. Finish with the method, limitations and next validation steps.
