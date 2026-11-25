// Synthetic lab only. No network, credentials or hardware control.
function snapshot(step=0) {
  if (!Number.isSafeInteger(step)||step<0||step>1000000) throw new RangeError("step must be an integer from 0 to 1000000");
  const racks=["LAB-R01","LAB-R02","LAB-R03"].map((id,i)=>({id,ambientC:22+i+(step%4)*0.5,capacityW:6000}));
  const servers=racks.flatMap((rack,i)=>[0,1].map(j=>{
    const n=i*2+j+1, id="SIM-S"+String(n).padStart(2,"0");
    const utilization=(step*17+n*13)%91+5;
    return {id,rackId:rack.id,pduId:"SIM-P"+(i+1),outlet:j+1,cpuPercent:(utilization+11)%101,gpuPercent:utilization,gpuTemperatureC:step%5===4&&n===4?88:Math.round(34+utilization*0.45),powerW:450+utilization*22,memoryUsedGiB:16+utilization,memoryTotalGiB:128,status:"online"};
  }));
  const pdus=racks.map((r,i)=>{
    const id="SIM-P"+(i+1),outlets=servers.filter(s=>s.pduId===id).map(s=>({number:s.outlet,serverId:s.id,powerW:s.powerW,state:"on"}));
    return {id,rackId:r.id,ratedW:r.capacityW,powerW:outlets.reduce((sum,o)=>sum+o.powerW,0),outlets};
  });
  return {schemaVersion:1,mode:"simulation",step,racks,servers,pdus};
}

function analyze(data) {
  if(data.mode!=="simulation") throw new Error("Only synthetic snapshots are supported");
  const alerts=[];
  for(const s of data.servers) if(s.gpuTemperatureC>=80) alerts.push({severity:"warning",assetId:s.id,metric:"gpuTemperatureC",value:s.gpuTemperatureC,threshold:80,recommendation:"Investigate cooling and workload; no automatic action."});
  for(const p of data.pdus) if(p.powerW/p.ratedW>=0.8) alerts.push({severity:"warning",assetId:p.id,metric:"powerUtilization",value:p.powerW/p.ratedW,threshold:0.8,recommendation:"Review simulated rack power budget."});
  return {mode:data.mode,step:data.step,serverCount:data.servers.length,totalPowerW:data.pdus.reduce((sum,p)=>sum+p.powerW,0),alerts};
}

export { snapshot, analyze };
