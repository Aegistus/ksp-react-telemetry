import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// useKspTelemetry — a React hook that gives you live (or simulated) rocket
// telemetry as plain data. Everything about *how* the data gets to you —
// WebSocket connections, reconnect logic, JSON parsing, orbital physics math
// — is handled inside this file. Your components never need to touch any of
// it; they just read the values this hook returns.
//
// You should not need to edit this file to build your dashboard. Treat it
// like a library you imported — read the "HOW TO USE THIS" section below,
// then go build in your own components.
// ---------------------------------------------------------------------------

// Every field this hook can give you, with a human label and unit — handy
// for building labels in your UI without hardcoding strings everywhere.
export const TELEMETRY_FIELDS = {
  altitude: { label: 'Altitude', unit: 'm' },
  speed: { label: 'Speed', unit: 'm/s' },
  verticalSpeed: { label: 'Vertical Speed', unit: 'm/s' },
  horizontalSpeed: { label: 'Horizontal Speed', unit: 'm/s' },
  gForce: { label: 'G-Force', unit: 'g' },
  apoapsis: { label: 'Apoapsis Altitude', unit: 'm' },
  periapsis: { label: 'Periapsis Altitude', unit: 'm' },
  phase: { label: 'Mission Phase', unit: '' },
  latitude: { label: 'Latitude', unit: '°' },
  longitude: { label: 'Longitude', unit: '°' },
  direction: { label: 'Direction', unit: 'vector' },
  pitch: { label: 'Pitch', unit: '°' },
  roll: { label: 'Roll', unit: '°' },
  heading: { label: 'Heading', unit: '°' },
  deltaV: { label: 'Delta-V', unit: 'm/s' },
  name: { label: 'Vessel Name', unit: '' },
  stages: { label: 'Stage Numbers', unit: '' },
  missionTime: { label: 'Mission Elapsed Time', unit: 's' },
  universalTime: { label: 'Universal Time', unit: 's' },
};

const MAX_HISTORY = 600;
const RECONNECT_DELAY_MS = 2000;

/**
 * @param {Object} options
 * @param {'live'|'demo'} [options.source='live'] - 'live' connects to the
 *   krpc-bridge WebSocket server. 'demo' runs a built-in simulated launch,
 *   so you can build your UI without KSP or the bridge running at all.
 * @param {string} [options.url='ws://localhost:8765'] - only used in 'live' mode.
 * @param {number} [options.demoSpeed=2] - time-warp multiplier for 'demo' mode.
 *
 * @returns {{
 *   status: 'connecting'|'connected'|'disconnected'|'error',
 *   data: object|null,   // the latest telemetry snapshot, e.g. { altitude, speed, ... }
 *   history: object[],   // up to the last 600 snapshots, oldest first — feed this to a chart
 *   error: string|null,
 * }}
 */
export function useKspTelemetry({ url = 'ws://localhost:8765', source = 'live', demoSpeed = 2 } = {}) {
  const [status, setStatus] = useState('connecting');
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setStatus('connecting');
    setData(null);
    setHistory([]);
    setError(null);

    const pushSnapshot = (snapshot) => {
      setData(snapshot);
      setHistory((prev) => {
        const next = [...prev, snapshot];
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
    };

    if (source === 'demo') {
      return runDemoSource(pushSnapshot, setStatus, demoSpeed);
    }
    return runLiveSource(url, pushSnapshot, setStatus, setError);
  }, [url, source, demoSpeed]);

  return { status, data, history, error };
}

// ---------------------------------------------------------------------------
// Everything below this line is internal plumbing. You don't need to read
// or understand it to use the hook above — it's here so the framework is
// transparent, not because you need to touch it.
// ---------------------------------------------------------------------------

function runLiveSource(url, pushSnapshot, setStatus, setError) {
  let socket;
  let reconnectTimer;
  let cancelled = false;

  function connect() {
    socket = new WebSocket(url);
    socket.onopen = () => {
      setStatus('connected');
      setError(null);
    };
    socket.onmessage = (event) => {
      try {
        pushSnapshot(JSON.parse(event.data));
      } catch {
        // ignore a malformed frame rather than crash the UI
      }
    };
    socket.onerror = () => setError('Could not reach the telemetry bridge — is it running?');
    socket.onclose = () => {
      setStatus('disconnected');
      if (!cancelled) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
    };
  }

  connect();
  return () => {
    cancelled = true;
    clearTimeout(reconnectTimer);
    if (socket) socket.close();
  };
}

function runDemoSource(pushSnapshot, setStatus, demoSpeed) {
  setStatus('connected');
  const sim = createSimulatedLaunch();
  const interval = setInterval(() => {
    pushSnapshot(sim.step(demoSpeed));
  }, 100);
  return () => clearInterval(interval);
}

// A simplified two-body physics simulation of a Kerbin ascent, used only in
// 'demo' mode. It emits the exact same field shape as the live bridge, so
// switching source: 'demo' -> 'live' later requires no changes to your UI.
function createSimulatedLaunch() {
  const R = 600000; // Kerbin radius, m
  const MU = 3.5316e12; // Kerbin standard gravitational parameter
  const G0 = 9.81;
  const TARGET_AP = 80000;
  const ATMO_TOP = 70000;

  let s = { t: 0, pos: { x: 0, y: R }, vel: { x: 0, y: 0 }, phase: 'STANDBY', phaseEnterT: 0, stage2StartT: null, circBurnStartT: null, lastAccelG: 0, deltaVSpent: 0 };

  function computeOrbit(pos, vel) {
    const r = Math.hypot(pos.x, pos.y);
    const v = Math.hypot(vel.x, vel.y);
    const energy = (v * v) / 2 - MU / r;
    const a = -MU / (2 * energy);
    const h = pos.x * vel.y - pos.y * vel.x;
    const e = Math.sqrt(Math.max(0, 1 - (h * h) / (MU * a)));
    return { apoapsis: a * (1 + e) - R, periapsis: a * (1 - e) - R };
  }

  function thrustProfile(phase, t, altitude) {
    if (phase === 'ASCENT_S1') return { accel: 22, angle: Math.min(45, Math.max(0, (t - 8) * 1.6)) };
    if (phase === 'ASCENT_S2') return { accel: 14, angle: Math.min(88, 45 + (altitude / 80000) * 45) };
    if (phase === 'CIRC_BURN') return { accel: 10, angle: 90 };
    return { accel: 0, angle: 0 };
  }

  function advance(dt) {
    const subDt = 0.2;
    let remaining = dt;
    while (remaining > 0) {
      const h = Math.min(subDt, remaining);
      remaining -= h;
      s.t += h;
      const r = Math.hypot(s.pos.x, s.pos.y);
      const altitude = r - R;
      const up = { x: s.pos.x / r, y: s.pos.y / r };
      const horiz = { x: up.y, y: -up.x };

      if (s.phase === 'STANDBY') {
        s.phase = 'ASCENT_S1'; s.phaseEnterT = s.t;
      } else if (s.phase === 'ASCENT_S1' && s.t - s.phaseEnterT >= 42) {
        s.phase = 'STAGE_SEP'; s.phaseEnterT = s.t;
      } else if (s.phase === 'STAGE_SEP' && s.t - s.phaseEnterT >= 1.5) {
        s.phase = 'ASCENT_S2'; s.stage2StartT = s.t;
      } else if (s.phase === 'ASCENT_S2') {
        const orbit = computeOrbit(s.pos, s.vel);
        const burnT = s.t - s.stage2StartT;
        if ((orbit.apoapsis >= TARGET_AP && burnT > 10) || burnT > 160) s.phase = 'COAST';
      } else if (s.phase === 'COAST') {
        const vAlt = s.vel.x * up.x + s.vel.y * up.y;
        const orbit = computeOrbit(s.pos, s.vel);
        if (Math.abs(vAlt) < 2 && altitude > orbit.apoapsis - 800) {
          s.phase = 'CIRC_BURN'; s.circBurnStartT = s.t;
        }
      } else if (s.phase === 'CIRC_BURN') {
        const orbit = computeOrbit(s.pos, s.vel);
        const burnT = s.t - s.circBurnStartT;
        if (orbit.periapsis >= ATMO_TOP || burnT > 40) s.phase = 'ORBIT';
      } else if (s.phase === 'ORBIT') {
        // mission complete — hold position, stop expending fuel
      }

      const { accel, angle } = thrustProfile(s.phase, s.t, altitude);
      const rad = (angle * Math.PI) / 180;
      const thrustVec = {
        x: accel * (Math.cos(rad) * up.x + Math.sin(rad) * horiz.x),
        y: accel * (Math.cos(rad) * up.y + Math.sin(rad) * horiz.y),
      };
      const gAccel = MU / (r * r);
      s.vel.x += (thrustVec.x - gAccel * up.x) * h;
      s.vel.y += (thrustVec.y - gAccel * up.y) * h;
      s.pos.x += s.vel.x * h;
      s.pos.y += s.vel.y * h;
      s.lastAccelG = accel / G0;
      s.deltaVSpent += accel * h; // rough proxy: thrust-time integral, not a true rocket-equation figure
    }
  }

  function snapshot() {
    const r = Math.hypot(s.pos.x, s.pos.y);
    const altitude = r - R;
    const up = { x: s.pos.x / r, y: s.pos.y / r };
    const horiz = { x: up.y, y: -up.x };
    const verticalSpeed = s.vel.x * up.x + s.vel.y * up.y;
    const horizontalSpeed = s.vel.x * horiz.x + s.vel.y * horiz.y;
    const speed = Math.hypot(s.vel.x, s.vel.y);
    const orbit = altitude > 5 ? computeOrbit(s.pos, s.vel) : { apoapsis: 0, periapsis: -R };

    // This 2D physics model doesn't track true 3D orientation, so the fields
    // below are reasonable decorative approximations for demo mode, not a
    // physically simulated attitude — the live bridge gives you the real
    // values from KSP's own Flight/Vessel objects instead.
    const downrangeAngle = (Math.atan2(s.pos.x, s.pos.y) * 180) / Math.PI;
    const direction = speed > 0.5
      ? { x: s.vel.x / speed, y: s.vel.y / speed, z: 0 }
      : { x: 0, y: 1, z: 0 };
    const pitch = speed > 0.5 ? (Math.atan2(verticalSpeed, horizontalSpeed) * 180) / Math.PI : 90;

    return {
      t: s.t,
      altitude,
      speed,
      verticalSpeed,
      horizontalSpeed,
      gForce: s.lastAccelG,
      apoapsis: orbit.apoapsis,
      periapsis: orbit.periapsis,
      phase: s.phase,
      latitude: -0.0972, // KSC's real latitude — this sim only flies in one plane
      longitude: -74.5 + downrangeAngle,
      direction,
      pitch,
      roll: 0, // not modeled
      heading: 90, // due east — the standard equatorial launch heading, not modeled dynamically
      deltaV: Math.max(0, 4500 - s.deltaVSpent),
      name: 'Simulated Vessel',
      stages: s.phase === 'STANDBY' || s.phase === 'ASCENT_S1' ? [1, 0] : [0],
      missionTime: s.t, // demo mode's mission clock already starts at liftoff, same meaning as live MET
      universalTime: 3600 * 24 * 120 + s.t, // an arbitrary "day 120 of the game" epoch — decorative only
    };
  }

  return {
    step(warp) {
      if (s.phase !== 'ORBIT') advance(warp);
      return snapshot();
    },
  };
}