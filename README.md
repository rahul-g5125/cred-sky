# SKY CRED

**Live weather, read like a credit report.**

SKY CRED turns real-time conditions from [WeatherAPI.com](https://www.weatherapi.com/) into a clear sky verdict. No mock data, no hardcoded temperatures — every number, condition, timestamp, and JSON payload comes from the live `/v1/current.json` endpoint.

## Live demo

Deployed on Vercel: _URL added after deployment._

## Features

- **Mumbai on load**, plus 10 popular cities on speed dial: Mumbai, Delhi, Bengaluru, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad, New York, London.
- **Weather personality verdict** with a plain-language recommendation and a clear favourable / caution / unfavourable status.
- **Primary metrics** for humidity, wind, and UV, each with context notes and visual meters.
- **Secondary details**: feels-like, cloud cover, visibility, pressure, wind speed, Fahrenheit, API update time, timezone, and local clock.
- **Live JSON viewer** with formatted and raw tabs, syntax highlighting, byte/line metadata, keyboard navigation, and one-click copy.
- **Resilient states**: initial loader, refresh strip, inline validation, stale-report alerts, full error cards, and retry actions.
- **Stale-response protection**: each search is versioned and previous requests are aborted, so a slow earlier city can never overwrite a newer result.
- **Responsive editorial design** with dynamic weather themes, custom SVG icons, reduced-motion support, and accessible live regions.

## Getting started

```bash
npm install
cp .env.example .env
# Add your WeatherAPI.com key to .env
npm run dev
```

Open the URL printed by Vite (defaults to `http://localhost:5173`).

### Environment

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_WEATHER_API_KEY` | Yes | WeatherAPI.com API key used for `/v1/current.json` requests |

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Node test runner suites (weather logic + API error mapping) |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Preview the production build locally |

## Verdict logic

Verdicts are evaluated in a fixed priority order. A thunderstorm therefore beats rain, freezing conditions beat a warm spell, and heat beats wind.

| Priority | Verdict | Trigger | Status |
| --- | --- | --- | --- |
| 1 | Storm Watch | Condition contains thunder/storm | Unfavourable |
| 2 | Freeze Frame | Temp ≤ 10°C, snow/sleet, or freezing conditions | Unfavourable |
| 3 | Rain Check | Rain, drizzle, or showers | Caution |
| 4 | Sun Alert | Temp ≥ 35°C or UV ≥ 8 | Unfavourable |
| 5 | Breezy Mode | Wind ≥ 35 km/h | Caution |
| 6 | Perfect Day | Temp 18–30°C | Favourable |
| 7 | Layer Up | Temp < 18°C | Caution |
| 8 | Warm Spell | Temp > 30°C | Caution |
| 9 | Sky Report | Safe fallback when data is incomplete | Caution |

Thresholds live in [`src/constants.js`](src/constants.js); classification and priority live in [`src/weather.js`](src/weather.js).

## Error handling

| Condition | UI behaviour |
| --- | --- |
| Empty/whitespace city | Inline validation, focus returned to the input, no request made |
| City not found (WeatherAPI 1006 / 404) | "City not found" message; retry hidden |
| Rate limit (429 / 2007) | Temporary-limit message with retry |
| Network failure | No-connection message with retry |
| Timeout (15s) | Timeout message with retry |
| Server error (5xx) | Service-unavailable message with retry |
| Malformed payload | Unexpected-response message with retry |

If a report is already on screen, failures appear as a dismissible alert above the last successful report instead of destroying it. The JSON viewer stays in sync with the report being shown.

WeatherAPI error mapping is covered by tests in [`src/api.test.js`](src/api.test.js).

## Project structure

```text
index.html            App shell, sections, and all UI states
src/main.js           State, search flow, validation, retry, stale-response guard
src/api.js            WeatherAPI request, timeout/abort, error classification
src/weather.js        Condition classification, themes, verdict priority
src/render.js         DOM rendering, loading/error states, chips, clock
src/json-view.js      Formatted/raw JSON, highlighting, tabs, copy
src/icons.js          Custom weather and verdict SVGs
src/format.js         Units, timestamps, UV/humidity/wind notes
src/dom.js            Cached element references
src/constants.js      Cities, endpoint, thresholds
src/styles.css        Theme system, layout, responsive rules, motion
```

## Testing

```bash
npm test
```

The suites use Node's built-in test runner and cover:

- verdict thresholds and priority ordering
- condition classification, day/night themes, icon selection
- missing/invalid temperature fallbacks
- WeatherAPI status/code error mapping

Manual QA completed against the live API at 360, 390, 768, 1024, and 1440 px:

- [x] Mumbai loads by default with live values and no console errors
- [x] All 10 city chips load the correct city and active state
- [x] Empty and whitespace-only searches show inline validation without a request
- [x] Unknown city shows "City not found" and keeps the last report visible
- [x] Keyboard submission (Enter) works
- [x] Formatted/raw JSON tabs, highlighting, metadata, and copy work
- [x] Rapid sequential searches resolve to the newest city (stale responses ignored)
- [x] Network failure + retry restores live data
- [x] Full initial-load error state and retry work
- [x] No horizontal page overflow on mobile
- [x] Responsive layouts fit at 360, 390, 768, 1024, and 1440 px

## Deployment

The project is configured for Vercel via [`vercel.json`](vercel.json).

```bash
npx vercel --prod
```

Set `VITE_WEATHER_API_KEY` in the Vercel project's environment variables before deploying — Vite injects it at build time.

## Security note

WeatherAPI.com keys are designed to be used from the browser, but any `VITE_*` value is inlined into the client bundle and is therefore public. This app only exposes the WeatherAPI key, which is rate-limited and can be rotated. Never place server secrets, database credentials, or private tokens in `VITE_*` variables. For stricter production use, proxy WeatherAPI through a serverless function and keep the key server-side.

## Credits

- Weather data: [WeatherAPI.com](https://www.weatherapi.com/)
- Weather icons: custom inline SVG artwork
- Typefaces: served via Google Fonts
