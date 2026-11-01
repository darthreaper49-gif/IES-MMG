# Vigil — intelligent surveillance dashboard

A responsive, frontend-only CCTV workspace built with React, TypeScript, Vite, and Lucide icons. The interface is ready to explore; real camera connections and security-sensitive backend work are intentionally deferred.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The development server binds to `0.0.0.0` for workspace previews.

```bash
npm run build       # Type-check and create a production build
npm run preview     # Serve the production build locally
npm test            # Run browser interaction tests
```

For a fresh testing environment, install the browser once with `npx playwright install chromium`. An existing Chromium binary can be supplied with `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

## Explore the interface

- **Overview:** camera fleet metrics, a four-camera wall, recent AI activity, recordings, and detection insights.
- **Live view:** grid/focus layouts, camera pagination, sample detection overlays, pause/resume, expanded camera details, and downloadable PNG snapshots.
- **Events & alerts:** search, camera/type filters, event details, individual/bulk review, and CSV export.
- **Recordings:** a searchable sample library with simulated play/pause, seeking, playback speed, fullscreen, and snapshots.
- **Analytics:** date-range and interval controls, sample activity charts, detection breakdowns, and CSV export.
- **Cameras:** add/edit demo entries, search, and enable/pause cameras. New entries start offline and do not collect stream URLs or credentials.
- **Detection rules:** create, edit, enable/pause, and delete rules; assign cameras and adjust sensitivity.
- **Settings:** workspace/profile details, timezone, notification preferences, retention, and a clear security-readiness checklist.
- **Workspace search:** use Cmd/Ctrl + K to find pages, cameras, and events.

Camera settings, reviewed events, rules, and preferences persist in this browser's `localStorage`. They are not sent to a server. Clear site data to restore the original demo workspace.

## Demo boundaries

**This is not a production monitoring or security system.**

- Camera imagery is generated sample imagery, bundled locally in `public/images/`.
- “Demo live” previews are still images with a simulated clock, not real video streams.
- Detection boxes, confidence values, events, analytics, and storage figures are illustrative.
- Playback animates a sample still; no recording files are played or stored.
- Audio controls demonstrate the intended interface only.
- Rules and notification preferences do not trigger real inference or notifications.
- No authentication, authorization, camera control, network camera discovery, or secure streaming is implemented.

## Structure

```text
src/
  App.tsx                 App shell, navigation, shared demo state
  data.ts                 Typed sample cameras, events, recordings, rules
  types.ts                Shared domain types
  components/             Camera wall, activity, dialogs, layout, UI helpers
  pages/                  Supporting workspace screens
  styles*.css             Responsive visual system
public/images/            Local sample camera imagery
tests/                    Browser interactions, mobile layout, and accessibility
```

## Next phase: backend and secure wiring

The current UI uses typed data and shared state rather than a live API. Suggested integration boundaries are:

1. Authenticate users server-side; enforce workspace membership and role-based authorization on every request and stream.
2. Replace the sample camera/event/recording data with authorized API calls and a real-time event channel.
3. Keep camera credentials exclusively in server-side secret storage. Never put RTSP credentials in browser code or local storage.
4. Use an authenticated media gateway to translate camera protocols into browser-compatible, authorized streaming.
5. Persist reviews, camera configuration, rules, and retention policies with audit logging and server-side validation.
6. Wire inference results to the existing event model; calibrate overlays to actual stream dimensions.
7. Add signed, short-lived recording access, encrypted storage, retention enforcement, and real notification delivery.
8. Add connection health, reconnection states, rate limiting, and security testing before relying on any alerts.

No backend endpoints or production security guarantees are implied by this preview.
