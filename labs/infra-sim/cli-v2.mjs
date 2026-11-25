import { analyze, createSnapshot } from './simulator-v2.mjs';

const [scenario = 'normal', rawStep = '0', ...rest] = process.argv.slice(2);
try {
  if (rest.length || !/^\d{1,7}$/.test(rawStep)) throw new RangeError('Usage: node cli-v2.mjs [normal|warning|critical|recovery] [step]');
  const snapshot = createSnapshot({ scenario, step: Number(rawStep) });
  console.log(JSON.stringify({ snapshot, health: analyze(snapshot) }, null, 2));
} catch (error) {
  if (!(error instanceof RangeError)) throw error;
  console.error(error.message);
  process.exitCode = 1;
}
