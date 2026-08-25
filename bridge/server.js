'use strict';
const { connectKRPC, Value } = require('./bridge');
const WebSocket = require('ws');

const WS_PORT = 8765;

async function main() {
  const krpc = await connectKRPC();

  // Get the active vessel, its Flight telemetry object, and its Orbit object.
  const vesselId = Value.decodeUInt64(await krpc.call('SpaceCenter', 'get_ActiveVessel'));
  const flightId = Value.decodeUInt64(
    await krpc.call('SpaceCenter', 'Vessel_Flight', [Value.encodeUInt64(vesselId)])
  );
  const orbitId = Value.decodeUInt64(
    await krpc.call('SpaceCenter', 'Vessel_get_Orbit', [Value.encodeUInt64(vesselId)])
  );

  // Field name -> [procedure, target object id, decoder]
  const fields = {
    altitude: ['Flight_get_MeanAltitude', flightId, Value.decodeDouble],
    speed: ['Flight_get_Speed', flightId, Value.decodeDouble],
    verticalSpeed: ['Flight_get_VerticalSpeed', flightId, Value.decodeDouble],
    horizontalSpeed: ['Flight_get_HorizontalSpeed', flightId, Value.decodeDouble],
    gForce: ['Flight_get_GForce', flightId, Value.decodeFloat],
    apoapsis: ['Orbit_get_ApoapsisAltitude', orbitId, Value.decodeDouble],
    periapsis: ['Orbit_get_PeriapsisAltitude', orbitId, Value.decodeDouble],
  };

  const idToField = {};
  const decoders = {};
  for (const [field, [procedure, objectId, decoder]] of Object.entries(fields)) {
    const streamId = await krpc.addStream('SpaceCenter', procedure, [Value.encodeUInt64(objectId)]);
    idToField[streamId] = field;
    decoders[field] = decoder;
    console.log(`[bridge] streaming ${field} (SpaceCenter.${procedure}) as stream #${streamId}`);
  }

  const latest = {};
  const wss = new WebSocket.Server({ port: WS_PORT });
  console.log(`[bridge] telemetry available at ws://localhost:${WS_PORT}`);

  krpc.onStreamUpdate((results) => {
    for (const r of results) {
      const field = idToField[r.id.toString()];
      if (!field || r.result.isNull) continue;
      latest[field] = decoders[field](r.result.value);
    }
    const payload = JSON.stringify({ t: Date.now() / 1000, ...latest });
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
