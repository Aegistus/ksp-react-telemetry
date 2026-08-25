# KSP Telemetry Framework — a walkthrough

This is a small framework with one job: get rocket telemetry out of Kerbal
Space Program (or a realistic simulation of it) and into your React
components as plain, ready-to-use data. Everything about _how_ that happens —
network connections, protocol details, physics math — lives in files you
should never need to open. Your job is everything downstream of that: what
the dashboard looks like, what it shows, how it's laid out.

## What's in this folder

```
useKspTelemetry.js   <- the framework. One hook, import it and use it.
StarterExample.jsx   <- a tiny proof-of-wiring, not a dashboard. Build over it.
bridge/               <- the Node.js backend that talks to KSP. Run it, don't read it.
```

You will spend basically all your time in files you create yourself — not in
these three.

## Two ways to develop: demo mode vs. live mode

Building a UI while also needing KSP open and a vessel launched is annoying,
especially while you're learning. So the framework has two data sources
behind the exact same interface:

- **`source: 'demo'`** — runs a built-in, physically-simulated rocket launch
  entirely in the browser. No KSP, no backend, nothing to start. Good default
  while you're learning React — you can refresh the page anytime and watch a
  full launch happen again.
- **`source: 'live'`** — connects to the real bridge in `bridge/`, which talks
  to a running KSP instance. Use this once your UI is built and you want to
  see your actual gameplay.

Because both sources hand your components the exact same shape of data,
switching between them is a one-word change — see below.

## Step 1 — get the hook into your project

Copy `useKspTelemetry.js` into your project's `src/` folder (or wherever your
components live). It's a plain ES module — no build step, no install, beyond
having React itself (it uses `useState` and `useEffect`, which ship with
React).

## Step 2 — the absolute minimum usage

```jsx
import { useKspTelemetry } from "./useKspTelemetry";

function MyComponent() {
  const { data } = useKspTelemetry({ source: "demo" });

  if (!data) return <p>Waiting for data…</p>;

  return <p>Altitude: {data.altitude.toFixed(0)} m</p>;
}
```

That's a complete, working component. `StarterExample.jsx` is this same idea
with a couple more fields — run it, confirm you see numbers changing every
tenth of a second, and you know the wiring works.

## Step 3 — understanding what the hook gives you

`useKspTelemetry(options)` returns an object with four things:

| Key       | Type                                                       | What it is                                       |
| --------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `status`  | `'connecting' \| 'connected' \| 'disconnected' \| 'error'` | Where things stand right now                     |
| `data`    | object or `null`                                           | The most recent telemetry snapshot               |
| `history` | array of objects                                           | The last 600 snapshots, oldest first             |
| `error`   | string or `null`                                           | A human-readable message if something went wrong |

`data` (and every entry in `history`) looks like this:

```js
{
  t: 42.3,              // mission time, seconds
  altitude: 12980,      // meters
  speed: 812,            // m/s, total
  verticalSpeed: 640,     // m/s
  horizontalSpeed: 512,   // m/s
  gForce: 1.8,
  apoapsis: 21500,        // meters
  periapsis: -580000,     // meters (negative = still suborbital)
  phase: 'ASCENT_S2',      // see below
}
```

`phase` is one of: `STANDBY`, `ASCENT_S1`, `STAGE_SEP`, `ASCENT_S2`, `COAST`,
`CIRC_BURN`, `ORBIT`. It's a plain string — useful for things like showing a
different badge color per phase, or conditionally rendering a "circularizing"
message.

If you want labels/units without hardcoding strings, `TELEMETRY_FIELDS` is
exported alongside the hook:

```js
import { TELEMETRY_FIELDS } from "./useKspTelemetry";

TELEMETRY_FIELDS.altitude; // { label: 'Altitude', unit: 'm' }
```

That's handy for something like: `${TELEMETRY_FIELDS.altitude.label} (${TELEMETRY_FIELDS.altitude.unit})`.

## Running live mode

```
cd bridge
npm install
npm start
```

With KSP running, its kRPC server started (protocol set to "Protobuf over
TCP"), and a vessel active, the bridge prints `telemetry available at
ws://localhost:8765`. At that point:

```jsx
useKspTelemetry({ source: "live" });
```

is all you need to change.

## If something doesn't work

- **`status` stuck on `'connecting'`, never `'connected'`, in live mode** —
  the bridge probably isn't running, or KSP's kRPC server isn't started.
  Check the bridge's terminal output.
- **`error` is set** — read the message; it's written to be specific about
  what failed (usually "can't reach the bridge" or a kRPC procedure-name
  mismatch printed in the bridge's own terminal, not in `error` itself).
- **Demo mode shows nothing** — this one's on the framework, not you; the
  simulation should always produce data within 100ms of mounting. Worth
  checking your browser console for an error before assuming your own code
  is at fault.
