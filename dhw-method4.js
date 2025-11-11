// 스피너 및 기구 옵션 (placeholder)
const m4LocationOptions = ["옥탑", "지상", "지하"];
const m4StartFloorOptions = ["저층", "중층", "고층"];
const m4BuildingUsageOptions = ["선택", "공동주택", "체육관", "병원", "호텔", "공장", "업무용건물", "주택", "학교"];

const m4FixtureOptions = ["세면기","양변기","샤워기","주방싱크","욕조","세탁기","식기세척기","대형샤워기"]; // 예시

function fillSelectM4(el, arr){ el.innerHTML = ""; arr.forEach((t,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=t; el.appendChild(o); }); }

function addFixtureRow4(){
  const container = document.getElementById('containerFixtures4');
  const row = document.createElement('div');
  row.className = 'linear-horizontal';
  row.style.marginTop = '8px';
  row.innerHTML = `
    <select class="fixtureType4" style="flex:2;"></select>
    <input type="number" class="fixtureCount4" placeholder="수량" style="flex:1;">
    <button type="button" class="btn removeFixture4" style="flex:0;">-</button>
  `;
  container.appendChild(row);
  fillSelectM4(row.querySelector('.fixtureType4'), m4FixtureOptions);
  row.querySelector('.removeFixture4').onclick = () => row.remove();
}

function pipePick(calcDia){
  const NOMINALS = ["15A","20A","25A","32A","40A","50A","65A","80A","90A","100A","125A","150A","200A","250A","300A"];
  const INNERS  = [17.5,23,28.4,37.1,43,54.9,70.3,83.1,95.6,108.3,133,158.4,208.3,259.4,309.5];
  let idx = INNERS.length-1; for(let i=0;i<INNERS.length;i++){ if(INNERS[i] >= calcDia){ idx=i; break; } }
  return { nominal: NOMINALS[idx], inner: INNERS[idx] };
}

function fmtInt(n){ return Math.round(n).toLocaleString(); }
function fmtDec1(n){ return (Math.round(n*10)/10).toLocaleString(undefined,{minimumFractionDigits:1,maximumFractionDigits:1}); }

function calcPipeDiaFromQ(Q){
  return 1.6258 * Math.pow(130, -0.38) * Math.pow(Q, 0.38) * Math.pow(20.0/1000.0, -0.205) * 1000.0;
}

function calcMethod4(){
  const width        = parseFloat(document.getElementById('etWidth4').value) || 0;
  const length       = parseFloat(document.getElementById('etLength4').value) || 0;
  const aboveFloors  = parseInt(document.getElementById('etAboveFloors4').value || '0', 10);
  const machineFloor = parseInt(document.getElementById('etMachineRoomFloor4').value || '0', 10);
  const startFloor   = parseInt(document.getElementById('etStartFloor4').value || '1', 10);
  const usageIdx     = document.getElementById('spinnerBuildingUsage').selectedIndex;
  const usageText    = m4BuildingUsageOptions[usageIdx] || '선택';

  if (usageIdx === 0){ alert('건물용도를 선택해 주세요.'); return; }

  // 동적 기구 수집(입력은 사용량 계산에 직접 쓰지 않지만, 실제 구현 시 hourlyLoad 구성에 반영 가능)
  const rows = document.querySelectorAll('#containerFixtures4 .linear-horizontal').length;

  // 건물용도별 계수 (Java 매핑)
  let tankCoeff=1.0, simultaneousRate=0.3; // fallback
  let loadPerUnit = [];
  switch(usageText){
    case '공동주택': loadPerUnit=[7.6,15,114,76,38,76,57,76]; simultaneousRate=0.30; tankCoeff=1.25; break;
    case '체육관'  : loadPerUnit=[7.6,30,550,114,0,0,0,0];    simultaneousRate=0.40; tankCoeff=1.00; break;
    case '병원'    : loadPerUnit=[7.6,23,284,76,76,76,380,106]; simultaneousRate=0.25; tankCoeff=0.60; break;
    case '호텔'    : loadPerUnit=[7.6,30,284,76,114,114,475,106]; simultaneousRate=0.25; tankCoeff=0.80; break;
    case '공장'    : loadPerUnit=[7.6,45.5,550,0,76,76,228,106]; simultaneousRate=0.40; tankCoeff=1.00; break;
    case '업무용건물':loadPerUnit=[7.6,23,114,0,76,76,228,0];  simultaneousRate=0.40; tankCoeff=2.00; break;
    case '주택'    : loadPerUnit=[7.6,0,114,76,38,57,57,76];   simultaneousRate=0.40; tankCoeff=0.70; break;
    case '학교'    : loadPerUnit=[7.6,57,284,0,76,76,228,0];   simultaneousRate=0.30; tankCoeff=1.00; break;
  }

  // hourlyLoad는 실제론 위생기구 종류/수량의 합산으로 구성. placeholder로 0 처리 후, 필요 시 연동.
  let hourlyLoad = 0; // TODO: 필요 시 fixtureRows 연동

  // 급탕부하(kcal/h): hourlyLoad * 45.0 (Android와 동일)
  const totalLoad4 = hourlyLoad * 45.0;

  // 장비/탱크
  const cascadeCount = Math.ceil(totalLoad4 / 48000.0);
  const equipmentCapacity = cascadeCount * 48000;
  const rawTank = hourlyLoad * tankCoeff / 1000.0;
  const roundedTank = Math.round(rawTank * 10.0) / 10.0; // 톤

  // 환탕펌프 (유량/양정)
  const rawFlow = cascadeCount * 10.0 * 1.5 / 2.0;
  const flowOneDec = Math.ceil(rawFlow * 10.0) / 10.0;
  const flowLpm = Math.ceil(flowOneDec);
  const part1 = (width + length) * 0.5;
  const part2 = (machineFloor * 4.0 + aboveFloors * 3.0);
  const part3 = (width + length) * 0.5;
  const rawHead = (part1 + part2 + part3) * 2 * 1.5 * 0.02;
  const headCeil2 = Math.ceil(rawHead * 10.0) / 10.0;

  // 대류펌프
  const convFlow = Math.ceil(cascadeCount * 20.0);
  const convHead = 15.0;

  // 배관경
  const Qfirst = cascadeCount * 20.0 / 60.0 / 1000.0; // 1차
  const calcFirst = calcPipeDiaFromQ(Qfirst);
  const first = pipePick(calcFirst);

  const Qhot = hourlyLoad * 1.5 / 3600.0 / 1000.0;    // 급탕 주배관
  const calcHotMain = calcPipeDiaFromQ(Qhot);
  const hot = pipePick(calcHotMain);

  const Qret = flowLpm / 60.0 / 1000.0;               // 환탕 주배관
  const calcRet = calcPipeDiaFromQ(Qret);
  const ret = pipePick(calcRet);

  // 팽창탱크 (전체 합산)
  const pi = Math.PI;
  const mpInner = first.inner; // 1차 주배관 선정내경
  const rpInner = ret.inner;   // 환탕 주배관 선정내경
  const A1 = pi * Math.pow(mpInner/1000.0,2)/4*1000.0;
  const vol1 = A1*(width+length)*0.7 + A1*(machineFloor*4 + (startFloor-1)*3);
  const A2 = pi * Math.pow((mpInner/1000.0)*0.8,2)/4*1000.0;
  const vol2 = A2*(aboveFloors-startFloor+1)*3;
  const A3 = pi * Math.pow((mpInner/1000.0)*0.8,2)/4*1000.0;
  const vol3 = A3*(width+length)*0.8*(aboveFloors-startFloor+1);
  const B1 = pi * Math.pow(rpInner/1000.0,2)/4*1000.0;
  const vol4 = B1*(width+length)*0.7 + B1*(machineFloor*4 + (startFloor-1)*3);
  const B2 = pi * Math.pow((rpInner/1000.0)*0.8,2)/4*1000.0;
  const vol5 = B2*(aboveFloors-startFloor+1)*3;
  const B3 = pi * Math.pow((rpInner/1000.0)*0.8,2)/4*1000.0;
  const vol6 = B3*(width+length)*0.8*(aboveFloors-startFloor+1);
  const vol7 = roundedTank * 1000.0; // 톤 → 리터
  const totalVol = vol1+vol2+vol3+vol4+vol5+vol6+vol7;
  const expVol = totalVol * 0.01678;
  const minPress = ((machineFloor*4 + aboveFloors*3) + (machineFloor*4 + aboveFloors*3)*1.5*0.03 + 20)/10.0;
  const effCoeff = 1.5/(minPress+1.03);
  const etCapRounded = Math.round(expVol/effCoeff);

  // 출력
  document.getElementById('tv4EquipmentLoad').textContent     = `${fmtInt(totalLoad4)} kcal/h`;
  document.getElementById('tv4EquipmentCascade').textContent  = `${fmtInt(cascadeCount)} 대`;
  document.getElementById('tv4EquipmentCapacity').textContent = `${fmtInt(equipmentCapacity)} kcal/h`;
  document.getElementById('tv4TankCapacity').textContent      = `${fmtDec1(roundedTank)} 톤`;
  document.getElementById('tv4PumpFlow').textContent          = `${fmtInt(flowLpm)} Lpm`;
  document.getElementById('tv4PumpHead').textContent          = `${fmtDec1(headCeil2)} m`;
  document.getElementById('tv4ConvPumpFlow').textContent      = `${fmtInt(convFlow)} Lpm`;
  document.getElementById('tv4ConvPumpHead').textContent      = `${fmtDec1(convHead)} m`;
  document.getElementById('tv4ExpansionTankCapacity').textContent = `${fmtInt(etCapRounded)} L`;
  document.getElementById('tv4FirstPipeInner').textContent    = `${calcFirst.toFixed(1)} mm`;
  document.getElementById('tv4FirstPipeNominal').textContent  = `${first.nominal} A`;
  document.getElementById('tv4FirstPipeOuter').textContent    = `${first.inner.toFixed(1)} mm`;
  document.getElementById('tv4HotMainPipeInner').textContent  = `${calcHotMain.toFixed(1)} mm`;
  document.getElementById('tv4HotMainPipeNominal').textContent= `${hot.nominal} A`;
  document.getElementById('tv4HotMainPipeOuter').textContent  = `${hot.inner.toFixed(1)} mm`;
  document.getElementById('tv4ReturnPipeInner').textContent   = `${calcRet.toFixed(1)} mm`;
  document.getElementById('tv4ReturnPipeNominal').textContent = `${ret.nominal} A`;
  document.getElementById('tv4ReturnPipeOuter').textContent   = `${ret.inner.toFixed(1)} mm`;
}

function resetMethod4(){
  ['etWidth4','etLength4','etAboveFloors4','etMachineRoomFloor4','etStartFloor4'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
  document.getElementById('spinnerMachineRoom4').selectedIndex = 0;
  document.getElementById('spinnerStartFloor4').selectedIndex  = 0;
  document.getElementById('spinnerBuildingUsage').selectedIndex= 0;
  document.getElementById('containerFixtures4').innerHTML='';
}

window.addEventListener('DOMContentLoaded', ()=>{
  fillSelectM4(document.getElementById('spinnerMachineRoom4'), m4LocationOptions);
  fillSelectM4(document.getElementById('spinnerStartFloor4'),  m4StartFloorOptions);
  fillSelectM4(document.getElementById('spinnerBuildingUsage'), m4BuildingUsageOptions);
  document.getElementById('btnAddFixture4').addEventListener('click', addFixtureRow4);
  document.getElementById('btnMethod4Calculate').addEventListener('click', calcMethod4);
  document.getElementById('btnMethod4Reset').addEventListener('click', resetMethod4);
  // 기본 행 1개 추가
  addFixtureRow4();
}); 