// 스피너 기본 항목 (리소스 대체 예정)
const locationOptions = ["옥탑", "지상", "지하"];
const startFloorOptions = ["저층", "중층", "고층"]; // 실제는 텍스트+숫자 조합이었으나 간소화
const simRateOptions = ["저", "중", "고"];

// 위생기구 FU 테이블 (placeholder): 실제 리소스 fixture_fu_values 배열로 교체 필요
const fixtureNames = ["세면기", "양변기", "샤워기", "주방싱크", "세탁기"]; // 예시
const fixtureFU     = [1.0,     2.0,     2.5,     1.5,       3.0    ];

function fillSelect(el, arr){
  el.innerHTML = "";
  arr.forEach((t,i)=>{ const o = document.createElement('option'); o.value=i; o.textContent=t; el.appendChild(o); });
}

function addFixtureRow(){
  const container = document.getElementById('containerFixtures2');
  const row = document.createElement('div');
  row.className = 'linear-horizontal';
  row.style.marginTop = '8px';
  row.innerHTML = `
    <select class="fixtureType" style="flex:2;"></select>
    <input type="number" class="fixtureCount" placeholder="수량" style="flex:1;">
    <button type="button" class="btn removeFixture" style="flex:0;">-</button>
  `;
  container.appendChild(row);
  // 채우기
  const sel = row.querySelector('.fixtureType');
  fillSelect(sel, fixtureNames);
  row.querySelector('.removeFixture').onclick = () => row.remove();
}

function simFlowFromFU(FU, simLevel){
  if (FU === 1) return 7.8;
  if (FU === 2) return 9.6;
  if (FU === 3) return 11.4;
  const isLow  = simLevel === '저';
  const isMed  = simLevel === '중';
  const isHigh = simLevel === '고';
  if (FU <= 300){
    if (isLow) {
      return -7.34266293145236E-13 * Math.pow(FU, 6)
        + 8.24364433215773E-10   * Math.pow(FU, 5)
        - 3.67623047947685E-07   * Math.pow(FU, 4)
        + 0.0000835334142479383  * Math.pow(FU, 3)
        - 0.0106863068061784     * Math.pow(FU, 2)
        + 1.03901033786315        * FU
        + 10.3065662117733;
    } else if (isMed) {
      return -5.58969487184094E-12 * Math.pow(FU, 6)
        + 5.5198149323879E-09    * Math.pow(FU, 5)
        - 2.12975636242063E-06   * Math.pow(FU, 4)
        + 0.000408212629528393   * Math.pow(FU, 3)
        - 0.0416090203859767     * Math.pow(FU, 2)
        + 2.60903116097325        * FU
        + 6.8942602428142;
    } else {
      return -5.2966673850354E-12 * Math.pow(FU, 6)
        + 5.19212173868142E-09   * Math.pow(FU, 5)
        - 2.00990732009132E-06   * Math.pow(FU, 4)
        + 0.000397273992081892   * Math.pow(FU, 3)
        - 0.0441504929335679     * Math.pow(FU, 2)
        + 3.23296711534203        * FU
        + 2.90046660689404;
    }
  } else {
    if (isLow) {
      return -5.78071790852124E-12 * Math.pow(FU, 4)
        + 4.48754830115002E-08   * Math.pow(FU, 3)
        - 0.000121651117208227   * Math.pow(FU, 2)
        + 0.238172412179429      * FU
        + 44.0773124243857;
    } else if (isMed) {
      return 4.43110839931032E-15  * Math.pow(FU, 5)
        - 4.44423672204488E-11   * Math.pow(FU, 4)
        + 1.73645699808511E-07   * Math.pow(FU, 3)
        - 0.000329851778772949   * Math.pow(FU, 2)
        + 0.45432073826998       * FU
        + 42.5269660647083;
    } else {
      return -1.38307854755904E-18 * Math.pow(FU, 6)
        + 1.85777296868538E-14   * Math.pow(FU, 5)
        - 9.91631634616567E-11   * Math.pow(FU, 4)
        - 0.000417317847888106   * Math.pow(FU, 2)
        + 0.537679297150273      * FU
        + 74.4517179332899;
    }
  }
}

function pickDiameter(calcDia){
  const NOMINALS = ["15A","20A","25A","32A","40A","50A","65A","80A","90A","100A","125A","150A","200A","250A","300A"];
  const INNERS  = [17.5,23,28.4,37.1,43,54.9,70.3,83.1,95.6,108.3,133,158.4,208.3,259.4,309.5];
  let idx = INNERS.length-1; for(let i=0;i<INNERS.length;i++){ if(INNERS[i] >= calcDia){ idx=i; break; } }
  return { nominal:NOMINALS[idx], inner:INNERS[idx] };
}

function fmtInt(n){ return Math.round(n).toLocaleString(); }
function fmtDec1(n){ return (Math.round(n*10)/10).toLocaleString(undefined,{minimumFractionDigits:1,maximumFractionDigits:1}); }

function calcMethod2(){
  // 입력 파싱
  const width        = parseFloat(document.getElementById('etWidth2').value) || 0;
  const length       = parseFloat(document.getElementById('etLength2').value) || 0;
  const aboveFloors  = parseInt(document.getElementById('etAboveFloors2').value || '0', 10);
  const machineFloor = parseInt(document.getElementById('etMachineRoomFloor2').value || '0', 10);
  const startFloor   = parseInt(document.getElementById('etStartFloor2').value || '1', 10);
  const simLevel     = simRateOptions[document.getElementById('spinnerSimultaneous2').selectedIndex] || '중';

  // FU 합산
  let FU = 0;
  document.querySelectorAll('#containerFixtures2 .linear-horizontal').forEach(row=>{
    const typeIdx = row.querySelector('.fixtureType').selectedIndex;
    const cnt = parseInt(row.querySelector('.fixtureCount').value || '0', 10);
    FU += cnt * (fixtureFU[typeIdx] || 0);
  });

  // simFlow → totalLoad2
  const simFlow = simFlowFromFU(FU, simLevel);
  const totalLoad2 = Math.round(simFlow * 55.0 * 60.0);

  // 캐스케이드, 용량
  const cascadeCount = Math.ceil(totalLoad2 / 48000.0);
  const equipmentCapacity = cascadeCount * 48000;

  // 환탕펌프 유량
  const rawFlow = cascadeCount * 10.0 / 2.0;
  const flow1d  = Math.ceil(rawFlow * 10.0) / 10.0;
  const flowInt = Math.ceil(flow1d);

  // 환탕펌프 양정
  const part1 = (width + length) * 0.5;
  const part2 = (machineFloor * 4.0 + aboveFloors * 3.0);
  const part3 = (width + length) * 0.5;
  const headRaw = (part1 + part2 + part3) * 2 * 1.5 * 0.02 + 5.0;
  const head2d  = Math.ceil(headRaw * 10.0) / 10.0;

  // 배관경 계산
  const Qhot = cascadeCount * 16.0 / 60.0 / 1000.0;
  const calcHot = 1.6258 * Math.pow(130, -0.38) * Math.pow(Qhot, 0.38) * Math.pow(20.0/1000.0, -0.205) * 1000.0;
  const main = pickDiameter(calcHot);

  const Qret = flowInt / 60.0 / 1000.0;
  const calcRet = 1.6258 * Math.pow(130, -0.38) * Math.pow(Qret, 0.38) * Math.pow(20.0/1000.0, -0.205) * 1000.0;
  const ret = pickDiameter(calcRet);

  // 팽창탱크 계산 (Method2ResultActivity와 동일 구조)
  const pi = Math.PI;
  const mpInner_mm = main.inner;
  const rpInner_mm = ret.inner;

  const A1 = pi * Math.pow(mpInner_mm / 1000.0, 2) / 4 * 1000.0;
  const vol1 = A1*(width + length)*0.7 + A1*(machineFloor*4 + (startFloor-1)*3);
  const A2 = pi * Math.pow((mpInner_mm / 1000.0)*0.8, 2) / 4 * 1000.0;
  const vol2 = A2*(aboveFloors - startFloor +1)*3;
  const A3 = pi * Math.pow((mpInner_mm / 1000.0)*0.7, 2) / 4 * 1000.0;
  const vol3 = A3*(width + length)*0.8*(aboveFloors - startFloor +1);

  const B1 = pi * Math.pow(rpInner_mm / 1000.0, 2) / 4 * 1000.0;
  const vol4 = B1*(width + length)*0.7 + B1*(machineFloor*4 + (startFloor-1)*3);
  const B2 = pi * Math.pow((rpInner_mm / 1000.0)*0.8, 2) / 4 * 1000.0;
  const vol5 = B2*(aboveFloors - startFloor +1)*3;
  const B3 = pi * Math.pow((rpInner_mm / 1000.0)*0.7, 2) / 4 * 1000.0;
  const vol6 = B3*(width + length)*0.8*(aboveFloors - startFloor +1);

  const totalVol = 1.2 * (vol1 + vol2 + vol3 + vol4 + vol5 + vol6);
  const expVol = totalVol * 0.01678;
  const minPress = ((machineFloor*4 + aboveFloors*3) + (machineFloor*4 + aboveFloors*3)*1.5*0.03 + 20) / 10.0;
  const effCoeff = 1.5 / (minPress + 1.03);
  const tankCap = expVol / effCoeff;
  const tankRounded = Math.round(tankCap * 10.0) / 10.0;

  // 결과 표시
  document.getElementById('tv2EquipmentLoad').textContent     = `${fmtInt(totalLoad2)} kcal/h`;
  document.getElementById('tv2EquipmentCascade').textContent  = `${fmtInt(cascadeCount)} 대`;
  document.getElementById('tv2EquipmentCapacity').textContent = `${fmtInt(equipmentCapacity)} kcal/h`;
  document.getElementById('tv2PumpFlow').textContent          = `${fmtInt(flowInt)} Lpm`;
  document.getElementById('tv2PumpHead').textContent          = `${fmtDec1(head2d)} m`;
  document.getElementById('tv2TankCapacity').textContent      = `${fmtDec1(tankRounded)} L`;
  document.getElementById('tv2MainPipeCalc').textContent      = `${calcHot.toFixed(1)} mm`;
  document.getElementById('tv2MainPipeNominal').textContent   = `${main.nominal} A`;
  document.getElementById('tv2MainPipeInner').textContent     = `${main.inner.toFixed(1)} mm`;
  document.getElementById('tv2ReturnPipeCalc').textContent    = `${calcRet.toFixed(1)} mm`;
  document.getElementById('tv2ReturnPipeNominal').textContent = `${ret.nominal} A`;
  document.getElementById('tv2ReturnPipeInner').textContent   = `${ret.inner.toFixed(1)} mm`;
}

function resetMethod2(){
  ['etWidth2','etLength2','etAboveFloors2','etMachineRoomFloor2','etStartFloor2'].forEach(id=>{ const el = document.getElementById(id); if(el) el.value=''; });
  document.getElementById('spinnerMachineRoom2').selectedIndex = 0;
  document.getElementById('spinnerStartFloor2').selectedIndex  = 0;
  document.getElementById('spinnerSimultaneous2').selectedIndex= 0;
  document.getElementById('containerFixtures2').innerHTML = '';
}

window.addEventListener('DOMContentLoaded', ()=>{
  fillSelect(document.getElementById('spinnerMachineRoom2'), locationOptions);
  fillSelect(document.getElementById('spinnerStartFloor2'),  startFloorOptions);
  fillSelect(document.getElementById('spinnerSimultaneous2'), simRateOptions);

  document.getElementById('btnAddFixture2').addEventListener('click', addFixtureRow);
  document.getElementById('btnMethod2Calculate').addEventListener('click', calcMethod2);
  document.getElementById('btnMethod2Reset').addEventListener('click', resetMethod2);

  // 기본 행 1개 추가
  addFixtureRow();
}); 