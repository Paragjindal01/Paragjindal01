import { snapshot, analyze } from "./simulator.mjs";
try {
  const step=Number(process.argv[2]??0);
  const data=snapshot(step);
  console.log(JSON.stringify({data,report:analyze(data)},null,2));
} catch(error) { console.error(error.message); process.exitCode=1; }
