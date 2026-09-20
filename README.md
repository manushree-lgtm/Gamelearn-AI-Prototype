# GameLearn AI — Error Detective

## Run
1. Install Node.js 18+ (Node 20+ recommended).
2. Open this folder in VS Code terminal.
3. Run `npm install`.
4. Open `.env` and set `GEMINI_API_KEY=YOUR_KEY`. Keep the key only on the server.
5. Run `npm start`.
6. Open `http://localhost:3000`.

## Gemini API
The custom-topic flow calls Gemini through the server route `/api/generate-case`. The browser never receives the API key.

The project is deliberately fault-tolerant: if the key is missing, invalid, the model is unavailable, the request times out, or Gemini returns unusable JSON, the app automatically opens a built-in learning case instead of crashing. Pre-built cases always work without an API key.

`/api/health` reports whether the Gemini key is configured.

Optional `.env` values:
- `GEMINI_MODEL=gemini-2.5-flash`
- `GEMINI_TIMEOUT_MS=25000`
- `PORT=3000`

## Rewards
- Correct without hint: +100 XP, +15 coins
- Correct after hint: +75 XP, +10 coins
- Wrong answer: no deduction
- Final detection: +100 XP, +20 coins

## Interactive learning loop
The game now uses a three-phase loop: **study the evidence cards**, pass a short **knowledge scan**, then enter Detective City to clear four investigations. Lesson cards open on click and remain marked as studied, the mission HUD tracks the six-part case progress, and consecutive correct investigations show a streak indicator. The city stays locked until the learner has actively reviewed the learning file and passed the scan, keeping the game focused on understanding rather than guessing.

The learning loop also includes a short **Match the Following** clue board before Detective City. Learners click a concept and its rearranged meaning; the answer column is shifted each round so the exact answer is not beside its concept, and each correct pair simply turns green without drawing connector lines. The meanings are intentionally concise so the game is quick to scan. Investigation challenges have a 30-second focus timer, but the learner can still answer after the timer reaches zero. The hint button opens the supplied illustrated **Detective Guide** artwork, with a deerstalker-style hat and magnifying glass, in the corner of the challenge. Correct matches, investigations, and the final answer trigger a confetti celebration.

Every button click and keyboard key press has a short interface sound. Wrong choices play a descending error sound, while correct scans, line connections, investigation answers, and the final answer play a brighter success chime generated in the browser with the Web Audio API. The final detection adds a fanfare, two animated crackers, star bursts, and an extra confetti wave; no external sound file is required.

The final celebration uses the selected **detective magnifying-glass popper artwork** from `public/detective-popper-magnifier.png`, launching it from both sides of the screen with one mirrored copy.

The visual theme now uses `public/mysterious-detective-bg.jpg`: a dark Victorian study with rain, fog, gaslight, case notes, and a Sherlock-Holmes-inspired detective silhouette. A navy-and-oxblood overlay keeps the learning panels readable while adding a more mysterious investigation atmosphere.

Timer behavior is difficulty-aware: **Beginner** cases show no timer at all, while **Intermediate** and **Advanced** cases get a compact running 30-second progress bar for each investigation and the final detection. When the timer reaches zero, the answer buttons are disabled and an animated retry panel lets the learner retry the case or return to Detective City. The final answer opens a centered **CASE CRACKED!** reward screen with the detective popper model rising beneath it.
