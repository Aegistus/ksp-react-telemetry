'use strict';
const net = require('net');
const path = require('path');
const protobuf = require('protobufjs');

const HOST = '127.0.0.1';
const RPC_PORT = 50000;
const STREAM_PORT = 50001;

// ---- varint helpers -----------------------------------------------------
// Used both for the outer message-length prefix kRPC puts on every frame,
// and for encoding/decoding uint64 object references inside argument/result
// payloads (kRPC object IDs are just varints, per its wire format).
function encodeVarint(n) {
  const bytes = [];
  let v = n;
  while (v > 0x7f) {
    bytes.push((v & 0x7f) | 0x80);
    v = Math.floor(v / 128);
  }
  bytes.push(v & 0x7f);
  return Buffer.from(bytes);
}

function decodeVarint(buf, offset) {
  let result = 0;
  let shift = 0;
  let pos = offset;
  for (;;) {
    if (pos >= buf.length) throw new Error('incomplete varint');
    const byte = buf[pos++];
    result += (byte & 0x7f) * Math.pow(2, shift);
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }
  return { value: result, next: pos };
}

// ---- scalar value codecs --------------------------------------------------
// kRPC's Argument.value / ProcedureResult.value fields hold the *raw*
// wire-format bytes for whatever scalar type the procedure expects/returns
// (no field tag, since the type is already known from the service schema).
const Value = {
  encodeUInt64: (n) => encodeVarint(n),
  decodeUInt64: (buf) => decodeVarint(buf, 0).value,
  decodeDouble: (buf) => buf.readDoubleLE(0),
  decodeFloat: (buf) => buf.readFloatLE(0),
  decodeBool: (buf) => buf[0] !== 0,
  decodeString: (buf) => {
    const { value: len, next } = decodeVarint(buf, 0);
    return buf.slice(next, next + len).toString('utf8');
  },
  encodeString: (str) => {
    const utf8 = Buffer.from(str, 'utf8');
    return Buffer.concat([encodeVarint(utf8.length), utf8]);
  },
  // proto3 sint32 uses zigzag encoding, not a plain varint — decode accordingly.
  decodeSInt32: (buf) => {
    const raw = decodeVarint(buf, 0).value;
    return (raw >>> 1) ^ -(raw & 1);
  },
  // Tuple and List values are both wire-identical: a message wrapping
  // `repeated bytes items`, where each item is itself a raw scalar/object-id
  // encoding. This unwraps that envelope into an array of item byte-buffers;
  // callers then decode each item with whatever scalar decoder fits.
  decodeItems: (buf) => {
    const items = [];
    let pos = 0;
    while (pos < buf.length) {
      const tag = decodeVarint(buf, pos); // field 1, wire type 2 (length-delimited)
      pos = tag.next;
      const { value: len, next } = decodeVarint(buf, pos);
      pos = next;
      items.push(buf.slice(pos, pos + len));
      pos += len;
    }
    return items;
  },
  // A TUPLE(DOUBLE, DOUBLE, DOUBLE) — e.g. Direction, Position — as {x, y, z}.
  decodeVector: (buf) => {
    const items = Value.decodeItems(buf);
    return {
      x: Value.decodeDouble(items[0]),
      y: Value.decodeDouble(items[1]),
      z: Value.decodeDouble(items[2]),
    };
  },
  // A LIST(CLASS(...)) — e.g. Vessel_get_Stages — as an array of object ids.
  decodeObjectList: (buf) => Value.decodeItems(buf).map(Value.decodeUInt64),
};

// ---- framed TCP reader -----------------------------------------------------
// Every kRPC message on the wire is [varint length][protobuf bytes].
// TCP doesn't preserve message boundaries, so we buffer incoming bytes
// and only resolve a read once a full frame has arrived.
class FrameReader {
  constructor(socket) {
    this.buffer = Buffer.alloc(0);
    this.waiters = [];
    socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this._drain();
    });
    socket.on('error', (err) => {
      while (this.waiters.length) this.waiters.shift().reject(err);
    });
  }
  _drain() {
    while (this.waiters.length) {
      let len, next;
      try {
        ({ value: len, next } = decodeVarint(this.buffer, 0));
      } catch {
        return; // haven't received the length prefix yet
      }
      if (this.buffer.length < next + len) return; // waiting on more bytes
      const payload = this.buffer.slice(next, next + len);
      this.buffer = this.buffer.slice(next + len);
      this.waiters.shift().resolve(payload);
    }
  }
  readMessage() {
    return new Promise((resolve, reject) => {
      this.waiters.push({ resolve, reject });
      this._drain();
    });
  }
}

function sendFrame(socket, payloadBuffer) {
  socket.write(Buffer.concat([encodeVarint(payloadBuffer.length), payloadBuffer]));
}

function connectSocket(port) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(port, HOST);
    socket.once('connect', () => resolve(socket));
    socket.once('error', reject);
  });
}

// ---- main client ------------------------------------------------------------
async function connectKRPC(clientName = 'Telemetry Bridge') {
  const root = await protobuf.load(path.join(__dirname, 'krpc.proto'));
  const ConnectionRequest = root.lookupType('krpc.schema.ConnectionRequest');
  const ConnectionResponse = root.lookupType('krpc.schema.ConnectionResponse');
  const ProcedureCall = root.lookupType('krpc.schema.ProcedureCall');
  const Request = root.lookupType('krpc.schema.Request');
  const Response = root.lookupType('krpc.schema.Response');
  const StreamUpdate = root.lookupType('krpc.schema.StreamUpdate');
  const StreamMsg = root.lookupType('krpc.schema.Stream');

  // --- RPC connection & handshake ---
  const rpcSocket = await connectSocket(RPC_PORT);
  const rpcReader = new FrameReader(rpcSocket);
  sendFrame(rpcSocket, ConnectionRequest.encode(
    ConnectionRequest.create({ type: 0 /* RPC */, clientName })
  ).finish());
  const rpcHello = ConnectionResponse.decode(await rpcReader.readMessage());
  if (rpcHello.status !== 0) throw new Error('RPC connection failed: ' + rpcHello.message);
  console.log('[bridge] connected to kRPC RPC server');

  // --- Stream connection & handshake (reuses the RPC client identifier) ---
  const streamSocket = await connectSocket(STREAM_PORT);
  const streamReader = new FrameReader(streamSocket);
  sendFrame(streamSocket, ConnectionRequest.encode(
    ConnectionRequest.create({ type: 1 /* STREAM */, clientIdentifier: rpcHello.clientIdentifier })
  ).finish());
  const streamHello = ConnectionResponse.decode(await streamReader.readMessage());
  if (streamHello.status !== 0) throw new Error('Stream connection failed: ' + streamHello.message);
  console.log('[bridge] connected to kRPC stream server');

  // Calls are sent and answered one at a time on the RPC socket.
  async function call(service, procedure, args = []) {
    const request = Request.create({
      calls: [{ service, procedure, arguments: args.map((value, position) => ({ position, value })) }],
    });
    sendFrame(rpcSocket, Request.encode(request).finish());
    const response = Response.decode(await rpcReader.readMessage());
    if (response.error) throw new Error(`${service}.${procedure}: ${response.error.description}`);
    const result = response.results[0];
    if (result.error) throw new Error(`${service}.${procedure}: ${result.error.description}`);
    return result.value; // raw bytes — caller decodes with Value.decodeX
  }

  // AddStream's argument is a serialized ProcedureCall for the thing to stream.
  // Its return value is itself a serialized Stream message ({ id }), not a bare
  // scalar — decode it as a message, and normalize the id to a string, since
  // protobufjs represents uint64 fields as Long objects rather than plain
  // numbers (keeping both sides as strings avoids any mismatch when the id
  // is used as an object key).
  async function addStream(service, procedure, args = []) {
    const callMsg = ProcedureCall.create({
      service, procedure, arguments: args.map((value, position) => ({ position, value })),
    });
    const streamRefBytes = await call('KRPC', 'AddStream', [ProcedureCall.encode(callMsg).finish()]);
    return StreamMsg.decode(streamRefBytes).id.toString();
  }

  // Fires handler(results) for every StreamUpdate frame, forever.
  function onStreamUpdate(handler) {
    (async () => {
      for (;;) {
        const update = StreamUpdate.decode(await streamReader.readMessage());
        handler(update.results);
      }
    })().catch((err) => console.error('[bridge] stream reader stopped:', err.message));
  }

  // Debugging aid: if a procedure name is wrong, list what's actually on the
  // server so you can find the right one instead of guessing.
  async function listServices() {
    const bytes = await call('KRPC', 'GetServices');
    const Services = root.lookupType('krpc.schema.Services'); // not in the trimmed schema by default
    return Services.decode(bytes);
  }

  return { call, addStream, onStreamUpdate, listServices, Value };
}

module.exports = { connectKRPC, Value };
