'use strict';
// A standalone exploration tool — not part of the running telemetry feed.
// Run it on its own (node explore-services.js) whenever you need to check
// a procedure name or its parameter/return types against your actual
// installed kRPC version, rather than guessing from documentation.
const { connectKRPC } = require('./bridge.cjs');

const TYPE_CODE_NAMES = {
  0: 'NONE', 1: 'DOUBLE', 2: 'FLOAT', 3: 'SINT32', 4: 'SINT64',
  5: 'UINT32', 6: 'UINT64', 7: 'BOOL', 8: 'STRING', 9: 'BYTES',
  100: 'CLASS', 101: 'ENUMERATION',
  200: 'EVENT', 201: 'PROCEDURE_CALL', 202: 'STREAM', 203: 'STATUS', 204: 'SERVICES',
  300: 'TUPLE', 301: 'LIST', 302: 'SET', 303: 'DICTIONARY',
};

function describeType(type) {
  const name = TYPE_CODE_NAMES[type.code] ?? `code ${type.code}`;
  if (type.code === 100 || type.code === 101) return `${name}(${type.service}.${type.name})`;
  if (type.code === 300) return `TUPLE(${type.types.map(describeType).join(', ')})`;
  if (type.code === 301 || type.code === 302) return `${name}(${describeType(type.types[0])})`;
  return name;
}

function describeProcedure(proc) {
  const params = proc.parameters.map((p) => `${p.name}: ${describeType(p.type)}`).join(', ');
  const returns = proc.returnType ? describeType(proc.returnType) : 'void';
  return `${proc.name}(${params}) -> ${returns}`;
}

async function main() {
  const krpc = await connectKRPC();
  const services = await krpc.listServices();

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Services available:');
    for (const s of services.services) console.log(`  ${s.name} (${s.procedures.length} procedures)`);
    console.log('\nUsage:');
    console.log('  node explore-services.js <ServiceName>            # list its procedures');
    console.log('  node explore-services.js <ServiceName> <filter>   # filter procedure names');
    return;
  }

  const service = services.services.find((s) => s.name === args[0]);
  if (!service) {
    console.log(`No service named "${args[0]}". Run with no arguments to see what's available.`);
    return;
  }

  const filter = args[1];
  const procedures = filter
    ? service.procedures.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))
    : service.procedures;

  console.log(`${service.name}${filter ? ` (matching "${filter}")` : ''}:`);
  for (const proc of procedures) console.log(`  ${describeProcedure(proc)}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
