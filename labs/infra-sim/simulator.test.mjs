import { test } from "node:test";
import { snapshot, analyze } from "./simulator.mjs";
function checks() {
  const check=(v,m)=>{if(!v)throw Error(m)};
  check(JSON.stringify(snapshot(7))===JSON.stringify(snapshot(7)),"determinism");
  check(JSON.stringify(snapshot(1))!==JSON.stringify(snapshot(2)),"step variation");
  check(snapshot().servers.length===6&&snapshot().pdus.length===3,"inventory count");
  for(let step=0;step<100;step++){
    const d=snapshot(step), r=analyze(d);
    check(new Set(d.servers.map(s=>s.id)).size===6,"unique servers");
    check(d.servers.every(s=>d.racks.some(r=>r.id===s.rackId)&&d.pdus.some(p=>p.id===s.pduId)),"inventory associations");
    check(d.pdus.every(p=>p.powerW===p.outlets.reduce((a,o)=>a+o.powerW,0)),"outlet totals");
    check(r.totalPowerW===d.servers.reduce((a,s)=>a+s.powerW,0),"power conservation");
    check(d.servers.every(s=>s.gpuPercent>=0&&s.gpuPercent<=100&&s.memoryUsedGiB<=s.memoryTotalGiB),"metric bounds");
  }
  check(analyze(snapshot(4)).alerts.some(a=>a.assetId==="SIM-S04"&&a.metric==="gpuTemperatureC"),"thermal scenario");
  const overload=snapshot(0);overload.pdus[0].ratedW=overload.pdus[0].powerW;
  check(analyze(overload).alerts.some(a=>a.metric==="powerUtilization"),"power alert");
  for(const v of [-1,1.2,Infinity,1000001]){let rejected=false;try{snapshot(v)}catch(e){rejected=e instanceof RangeError}check(rejected,"invalid step");}
  let rejected=false;try{analyze({...snapshot(),mode:"production"})}catch(e){rejected=true}check(rejected,"production rejection");
}
test("inventory, telemetry, alerts and safety invariants", checks);
