'use strict';
const { connectKRPC, Value } = require('./bridge.cjs');
const WebSocket = require('ws');

const WS_PORT = 8765;

async function main() {
  const krpc = await connectKRPC();

  // Get the active vessel and its Orbit object.
  const vesselId = Value.decodeUInt64(await krpc.call('SpaceCenter', 'get_ActiveVessel'));
  const orbitId = Value.decodeUInt64(
    await krpc.call('SpaceCenter', 'Vessel_get_Orbit', [Value.encodeUInt64(vesselId)])
  );

  // Vessel_Flight's reference frame defaults to the vessel's own surface frame,
  // which moves *with* the vessel — so speed/verticalSpeed/horizontalSpeed would
  // always read 0. Use the orbited body's reference frame instead (fixed to the
  // planet), which gives real ground-relative speed.
  const bodyId = Value.decodeUInt64(
    await krpc.call('SpaceCenter', 'Orbit_get_Body', [Value.encodeUInt64(orbitId)])
  );
  const refFrameId = Value.decodeUInt64(
    await krpc.call('SpaceCenter', 'CelestialBody_get_ReferenceFrame', [Value.encodeUInt64(bodyId)])
  );
  const flightId = Value.decodeUInt64(
    await krpc.call('SpaceCenter', 'Vessel_Flight', [
      Value.encodeUInt64(vesselId),
      Value.encodeUInt64(refFrameId),
    ])
  );

  // Field name -> [procedure, argument bytes, decoder]
  // Most calls take one object-id argument; get_UT is a bare service-level
  // call with none at all, hence the mix of encodeUInt64(...) and [].
  const fields = {
    altitude: ['Flight_get_MeanAltitude', [Value.encodeUInt64(flightId)], Value.decodeDouble],
    speed: ['Flight_get_Speed', [Value.encodeUInt64(flightId)], Value.decodeDouble],
    verticalSpeed: ['Flight_get_VerticalSpeed', [Value.encodeUInt64(flightId)], Value.decodeDouble],
    horizontalSpeed: ['Flight_get_HorizontalSpeed', [Value.encodeUInt64(flightId)], Value.decodeDouble],
    gForce: ['Flight_get_GForce', [Value.encodeUInt64(flightId)], Value.decodeFloat],
    apoapsis: ['Orbit_get_ApoapsisAltitude', [Value.encodeUInt64(orbitId)], Value.decodeDouble],
    periapsis: ['Orbit_get_PeriapsisAltitude', [Value.encodeUInt64(orbitId)], Value.decodeDouble],
    latitude: ['Flight_get_Latitude', [Value.encodeUInt64(flightId)], Value.decodeDouble],
    longitude: ['Flight_get_Longitude', [Value.encodeUInt64(flightId)], Value.decodeDouble],
    direction: ['Flight_get_Direction', [Value.encodeUInt64(flightId)], Value.decodeVector],
    pitch: ['Flight_get_Pitch', [Value.encodeUInt64(flightId)], Value.decodeFloat],
    roll: ['Flight_get_Roll', [Value.encodeUInt64(flightId)], Value.decodeFloat],
    heading: ['Flight_get_Heading', [Value.encodeUInt64(flightId)], Value.decodeFloat],
    deltaV: ['Vessel_get_DeltaV', [Value.encodeUInt64(vesselId)], Value.decodeFloat],
    stageIds: ['Vessel_get_Stages', [Value.encodeUInt64(vesselId)], Value.decodeObjectList],
    missionTime: ['Vessel_get_MET', [Value.encodeUInt64(vesselId)], Value.decodeDouble],
    universalTime: ['get_UT', [], Value.decodeDouble],
  };

  const idToField = {};
  const decoders = {};
  for (const [field, [procedure, args, decoder]] of Object.entries(fields)) {
    const streamId = await krpc.addStream('SpaceCenter', procedure, args);
    idToField[streamId] = field;
    decoders[field] = decoder;
    console.log(`[bridge] streaming ${field} (SpaceCenter.${procedure}) as stream #${streamId}`);
  }

  // The vessel's name rarely changes mid-flight — fetch it once rather than
  // stream it, and merge it into every outgoing payload below.
  const name = Value.decodeString(await krpc.call('SpaceCenter', 'Vessel_get_Name', [Value.encodeUInt64(vesselId)]));

  // Vessel_get_Stages gives object ids, not the human stage numbers — resolve
  // each id's number with its own call whenever the list changes (staging
  // events), rather than blocking the main per-tick update loop on it.
  let stageNumbers = [];
  let resolvingStages = false;
  async function resolveStageNumbers(stageIds) {
    if (resolvingStages) return; // a resolution is already in flight; the next update will retry
    resolvingStages = true;
    try {
      const numbers = [];
      for (const stageId of stageIds) {
        const raw = await krpc.call('SpaceCenter', 'Stage_get_Number', [Value.encodeUInt64(stageId)]);
        numbers.push(Value.decodeSInt32(raw));
      }
      stageNumbers = numbers.sort((a, b) => b - a); // highest (earliest) stage first
    } catch (err) {
      console.error('[bridge] failed to resolve stage numbers:', err.message);
    } finally {
      resolvingStages = false;
    }
  }

  const latest = { name };
  const wss = new WebSocket.Server({ port: WS_PORT });
  console.log(`[bridge] telemetry available at ws://localhost:${WS_PORT}`);

  krpc.onStreamUpdate((results) => {
    for (const r of results) {
      const field = idToField[r.id.toString()];
      if (!field || r.result.isNull) continue;
      latest[field] = decoders[field](r.result.value);
      if (field === 'stageIds') resolveStageNumbers(latest.stageIds); // fire-and-forget
    }
    const { stageIds, ...visible } = latest; // stageIds is internal; send resolved numbers instead
    // "receivedAt" is this bridge's own wall-clock time — for latency/debugging
    // only. For time since launch, use missionTime; for the game's own clock,
    // use universalTime — both come straight from KSP itself.
    const payload = JSON.stringify({ receivedAt: Date.now() / 1000, ...visible, stages: stageNumbers });
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
  });
}

main().catch((err) => {
  console.error('[bridge] failed to start:', err.message);
  console.error('If this is "procedure not found", the SpaceCenter wire names may');
  console.error('differ from what this script assumes — see the README for how to');
  console.error('use listServices() to look up the exact names for your kRPC version.');
  process.exit(1);
});
