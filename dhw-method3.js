// 기구 옵션 및 유량 (placeholder). 실제 리소스 제공 시 교체.
const m3FixtureOptions = ["샤워기", "대형샤워기", "세면기", "주방싱크", "식기세척기"];
const m3FixtureFlows   = [ 8.0,     12.0,       4.0,     10.0,       12.0     ]; // L/min 예시

function fillOptions(select, opts){
  select.innerHTML = "";
  opts.forEach((t,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=t; select.appendChild(o); });
}

function addFixtureRow3(){
  const container = document.getElementById('containerFixtures3');
  const row = document.createElement('div');
  row.className = 'linear-horizontal';
  row.style.marginTop = '8px';
  row.innerHTML = `
    <select class="fixtureType3" style="flex:2;"></select>
    <input type="number" class="fixtureCount3" placeholder="수량" style="flex:1;">
    <button type="button" class="btn removeFixture3" style="flex:0;">-</button>
  `;
  container.appendChild(row);
  fillOptions(row.querySelector('.fixtureType3'), m3FixtureOptions);
  row.querySelector('.removeFixture3').onclick = () => row.remove();
}

// 동시사용률 함수 (Java 매핑)
function rateShower(total){
  if (total <= 4) return 1.00;
  if (total <= 9) return 0.90;
  if (total <= 11) return 0.85;
  if (total <= 13) return 0.80;
  if (total <= 15) return 0.75;
  return 0.70;
}
function rateWashbasin(cnt){
  if (cnt <= 1)  return 1.00;
  if (cnt === 2) return 0.70;
  if (cnt === 3) return 0.60;
  if (cnt === 4) return 0.50;
  if (cnt <= 7)  return 0.40;
  if (cnt <= 10) return 0.35;
  if (cnt <= 40) return 0.30;
  return 0.25;
}
function rateKitchen(cnt){
  if (cnt <= 2)  return 1.00;
  if (cnt <= 5)  return 0.90;
  if (cnt <= 10) return 0.80;
  if (cnt <= 12) return 0.75;
  if (cnt === 13) return 0.70;
  if (cnt <= 18) return 0.65;
  if (cnt === 19) return 0.60;
  if (cnt <= 29) return 0.50;
  return 0.40;
}

function pickDiameter(calcDia){
  const NOMINALS = ["15A","20A","25A","32A","40A","50A","65A","80A","90A","100A","125A","150A","200A","250A","300A"];
  const INNERS  = [17.5,23,28.4,37.1,43,54.9,70.3,83.1,95.6,108.3,133,158.4,208.3,259.4,309.5];
  let idx = INNERS.length-1; for(let i=0;i<INNERS.length;i++){ if(INNERS[i] >= calcDia){ idx=i; break; } }
  return { nominal:NOMINALS[idx], inner:INNERS[idx] };
}

function fmtInt(n){ return Math.round(n).toLocaleString(); }
function fmtDec1(n){ return (Math.round(n*10)/10).toLocaleString(undefined,{minimumFractionDigits:1,maximumFractionDigits:1}); }

function calcMethod3(){
  // 행 수집
  let cntShowerSmall=0, cntShowerLarge=0, cntWash=0, cntKitchen=0, cntDish=0;
  document.querySelectorAll('#containerFixtures3 .linear-horizontal').forEach(row=>{
    const type = m3FixtureOptions[row.querySelector('.fixtureType3').selectedIndex];
    const c = parseInt(row.querySelector('.fixtureCount3').value || '0', 10);
    if (type === '샤워기') cntShowerSmall += c;
    else if (type === '대형샤워기') cntShowerLarge += c;
    else if (type === '세면기') cntWash += c;
    else if (type === '주방싱크') cntKitchen += c;
    else if (type === '식기세척기') cntDish += c;
  });

  const pipeLength = parseFloat(document.getElementById('etPipeLength').value) || 0;

  // 동시사용률
  const totalShower = cntShowerSmall + cntShowerLarge;
  const rShower = rateShower(totalShower);
  const rWash   = rateWashbasin(cntWash);
  const rKit    = rateKitchen(cntKitchen);
  const rDish   = 1.0;

  // 기구별 유량 (placeholder 값 매핑)
  const fShower= m3FixtureFlows[m3FixtureOptions.indexOf('샤워기')];
  const fLarge = m3FixtureFlows[m3FixtureOptions.indexOf('대형샤워기')];
  const fWash  = m3FixtureFlows[m3FixtureOptions.indexOf('세면기')];
  const fKit   = m3FixtureFlows[m3FixtureOptions.indexOf('주방싱크')];
  const fDish  = m3FixtureFlows[m3FixtureOptions.indexOf('식기세척기')];

  // 부하 계산 (Java 수식)
  const loadShowerPart = ((fShower*cntShowerSmall)+(fLarge*cntShowerLarge)) * rShower * 60.0 * 35.0;
  const loadWashPart   = fWash  * cntWash    * rWash * 60.0 * 30.0;
  const loadKitchen    = fKit   * cntKitchen * rKit  * 60.0 * 45.0;
  const loadDish       = fDish  * cntDish    * rDish * 60.0 * 50.0;
  const totalLoad3 = loadShowerPart + loadWashPart + loadKitchen + loadDish;

  // 캐스케이드/용량
  const cascadeCount = Math.ceil(totalLoad3 / 48000.0);
  const equipmentCapacity = cascadeCount * 48000;

  // 펌프
  const rawFlow = cascadeCount * 10.0 / 2.0; // 5*count
  const flowCeil1 = Math.ceil(rawFlow * 10.0) / 10.0;
  const flowLpm = Math.ceil(flowCeil1);
  const headRaw = pipeLength * 1.5 * 0.02 + 5.0;
  const headCeil2 = Math.ceil(headRaw * 10.0) / 10.0;

  // 배관경
  const Qhot = cascadeCount * 16.0 / 60.0 / 1000.0;
  const calcHot = 1.6258 * Math.pow(130, -0.38) * Math.pow(Qhot, 0.38) * Math.pow(20.0/1000.0, -0.205) * 1000.0;
  const main = pickDiameter(calcHot);
  const Qret = flowLpm / 60.0 / 1000.0;
  const calcRet = 1.6258 * Math.pow(130, -0.38) * Math.pow(Qret, 0.38) * Math.pow(20.0/1000.0, -0.205) * 1000.0;
  const ret = pickDiameter(calcRet);

  // 탱크 (vol1, vol2만 사용)
  const pi = Math.PI;
  const mp = main.inner, rp = ret.inner;
  const A1 = pi * Math.pow(mp/1000.0,2)/4 * 1000.0;
  const vol1 = A1 * pipeLength * 2;
  const A2 = pi * Math.pow(rp/1000.0,2)/4 * 1000.0;
  const vol2 = A2 * pipeLength * 2;
  const totalVol = 1.2 * (vol1 + vol2);
  const expVol = totalVol * 0.01678;
  const minPress = (cascadeCount*4.0 + cascadeCount*3.0 + 20) / 10.0;
  const effCoeff = 1.5 / (minPress + 1.03);
  const tankCap = expVol / effCoeff;
  const tankRounded = Math.round(tankCap*10.0)/10.0;

  // 출력
  document.getElementById('tv3EquipmentLoad').textContent     = `${fmtInt(totalLoad3)} kcal/h`;
  document.getElementById('tv3EquipmentCascade').textContent  = `${fmtInt(cascadeCount)} 대`;
  document.getElementById('tv3EquipmentCapacity').textContent = `${fmtInt(equipmentCapacity)} kcal/h`;
  document.getElementById('tv3PumpFlow').textContent          = `${fmtInt(flowLpm)} Lpm`;
  document.getElementById('tv3PumpHead').textContent          = `${fmtDec1(headCeil2)} m`;
  document.getElementById('tv3TankCapacity').textContent      = `${fmtDec1(tankRounded)} L`;
  document.getElementById('tv3MainPipeInner').textContent     = `${calcHot.toFixed(1)} mm`;
  document.getElementById('tv3MainPipeNominal').textContent   = `${main.nominal} A`;
  document.getElementById('tv3MainPipeOuter').textContent     = `${main.inner.toFixed(1)} mm`;
  document.getElementById('tv3ReturnPipeInner').textContent   = `${calcRet.toFixed(1)} mm`;
  document.getElementById('tv3ReturnPipeNominal').textContent = `${ret.nominal} A`;
  document.getElementById('tv3ReturnPipeOuter').textContent   = `${ret.inner.toFixed(1)} mm`;
}

function resetMethod3(){
  document.getElementById('etPipeLength').value = '';
  document.getElementById('containerFixtures3').innerHTML = '';
}

window.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('btnAddFixture3').addEventListener('click', addFixtureRow3);
  document.getElementById('btnMethod3Calculate').addEventListener('click', calcMethod3);
  document.getElementById('btnMethod3Reset').addEventListener('click', resetMethod3);
  // 초기 1행
  addFixtureRow3();
}); 