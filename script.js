// PurposeInfo 구조체
class PurposeInfo {
  constructor(purpose, unitLoad, example) {
    this.purpose = purpose;
    this.unitLoad = unitLoad;
    this.example = example;
  }
  toString() {
    return this.purpose;
  }
}

// 데이터 정의
const buildingPurposeTypeArray = [
  "일반건물(근생 등)",
  "공동주택(아파트, 연립주택)"
];

const buildingPurposeOptionsForGeneral = [
  new PurposeInfo("근린생활시설", 86, "예 : 관리사무소, 사회복지관, 아파트형공장 등"),
  new PurposeInfo("근린공공시설", 89, "예 : 동사무소, 소방파출소, 파출소, 우체국 등"),
  new PurposeInfo("종교시설", 115, "예 : 교회, 성당, 절 등"),
  new PurposeInfo("노유자시설", 86, "예 : 유치원, 노인정"),
  new PurposeInfo("의료시설", 105, "예 : 병원급 이하"),
  new PurposeInfo("교육연구시설", 89, "예 : 학교, 교육원, 직업훈련소 등"),
  new PurposeInfo("업무시설", 86, "예 : 오피스텔, 사무실 등"),
  new PurposeInfo("숙박시설", 89, "예 : 모텔, 호텔, 펜션 등"),
  new PurposeInfo("판매시설", 98, "예 : 식당, 상점 등 판매점"),
  new PurposeInfo("위락시설", 110, "예 : 수영장, 목욕장이외의 시설은 판매시설 기준"),
  new PurposeInfo("관람집회시설", 115, "예 : 체육관 등운동 시설 포함"),
  new PurposeInfo("전시시설", 115, "예 : 미술관, 공연장 등")
];

const buildingPurposeOptionsForHousing = [
  new PurposeInfo("아파트", 45, "-"),
  new PurposeInfo("연립주택", 55, "-")
];

const NOMINAL_DIAMETERS = [
  "15A", "20A", "25A", "32A", "40A",
  "50A", "65A", "80A", "90A", "100A",
  "125A", "150A", "200A", "250A", "300A"
];
const ACTUAL_DIAMETERS = [
  17.5, 23, 28.4, 37.1, 43,
  54.9, 70.3, 83.1, 95.6, 108.3,
  133, 158.4, 208.3, 259.4, 309.5
];

// 페이지 전환 함수
function showPage(pageNum) {
  for (let i = 1; i <= 3; i++) {
    document.getElementById(`page${i}`).style.display = (i === pageNum) ? "block" : "none";
  }
}

// Spinner(Select) 옵션 세팅
function setBuildingPurposeAdapter(typePosition) {
  const select = document.getElementById("buildingPurpose");
  select.innerHTML = "";
  const options = (typePosition === 0) ? buildingPurposeOptionsForGeneral : buildingPurposeOptionsForHousing;
  options.forEach((info, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = info.purpose;
    select.appendChild(opt);
  });
  document.getElementById("buildingPurposeExample").style.display = "none";
}

// 건물 용도 예시 표시
function updatePurposeExample() {
  const typeIdx = document.getElementById("buildingPurposeType").selectedIndex;
  const options = (typeIdx === 0) ? buildingPurposeOptionsForGeneral : buildingPurposeOptionsForHousing;
  const idx = document.getElementById("buildingPurpose").selectedIndex;
  const info = options[idx];
  const exampleDiv = document.getElementById("buildingPurposeExample");
  if (info.example && info.example !== "-") {
    exampleDiv.style.display = "block";
    exampleDiv.textContent = info.example;
  } else {
    exampleDiv.style.display = "none";
  }
}

// 동적 객실 Row 추가/삭제
function addRoomTypeRow(isDefault = false) {
  const container = document.getElementById("roomTypeContainer");
  const row = document.createElement("div");

  // 모바일에서도 1줄로 유지: flex-nowrap + 각 필드 유연 폭
  row.className = "linear-horizontal flex items-center gap-2 flex-nowrap";

  row.innerHTML = `
    <input type="text"
           class="roomType w-0 flex-[1.2] min-w-[90px] border border-gray-300 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
           placeholder="객실 타입">

    <input type="number"
           class="roomCount w-0 flex-[0.7] min-w-[70px] border border-gray-300 rounded-md p-1.5 text-sm text-right focus:ring-2 focus:ring-blue-400 focus:outline-none"
           placeholder="객실 수">

    <input type="number"
           class="unitHeatingArea w-0 flex-[1] min-w-[90px] border border-gray-300 rounded-md p-1.5 text-sm text-right focus:ring-2 focus:ring-blue-400 focus:outline-none"
           placeholder="단위 난방 면적">

    <button type="button"
            class="removeRowBtn flex-none px-2.5 py-1.5 text-sm rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition"
            ${isDefault ? "disabled" : ""}>
      삭제
    </button>
  `;

  if (!isDefault) {
    row.querySelector(".removeRowBtn").onclick = () => row.remove();
  }
  container.appendChild(row);
}



// 총 면적 계산
function calculateTotalArea() {
  let totalArea = 0;
  document.querySelectorAll("#roomTypeContainer .linear-horizontal").forEach(row => {
    const roomCount = parseInt(row.querySelector(".roomCount").value) || 0;
    const unitArea = parseFloat(row.querySelector(".unitHeatingArea").value) || 0;
    totalArea += roomCount * unitArea;
  });
  document.getElementById("totalHeatingArea").textContent = totalArea;
}

// 부속류 총 압력손실 계산
function updateAccessoryTotal() {
  let total = 0;
  if (document.getElementById("balancingValve").checked)
    total += parseFloat(document.getElementById("balancingValveValue").value) || 0;
  if (document.getElementById("heatMeter").checked)
    total += parseFloat(document.getElementById("heatMeterValue").value) || 0;
  if (document.getElementById("waterDistributor").checked)
    total += parseFloat(document.getElementById("waterDistributorValue").value) || 0;
  if (document.getElementById("tempControlValve").checked)
    total += parseFloat(document.getElementById("tempControlValveValue").value) || 0;
  if (document.getElementById("householdFlowValve").checked)
    total += parseFloat(document.getElementById("householdFlowValveValue").value) || 0;
  document.getElementById("totalPressureLoss").value = total;
}

// Spinner, Row, 버튼 등 이벤트 연결
function setupEventHandlers() {
  // 건물 용도 구분 스피너
  const typeSelect = document.getElementById("buildingPurposeType");
  buildingPurposeTypeArray.forEach((txt, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = txt;
    typeSelect.appendChild(opt);
  });
  setBuildingPurposeAdapter(0);
  typeSelect.onchange = () => {
    setBuildingPurposeAdapter(typeSelect.selectedIndex);
    updatePurposeExample();
  };
  document.getElementById("buildingPurpose").onchange = updatePurposeExample;

  // 객실 Row
  document.getElementById("addRoomType").onclick = () => addRoomTypeRow(false);
  addRoomTypeRow(true); // 기본 Row 1개

  // 총 면적 계산
  document.getElementById("calculateTotalArea").onclick = calculateTotalArea;

  // 부속류 항목 보기
  if (document.getElementById("accessoryItemsBtn")) {
    document.getElementById("accessoryItemsBtn").onclick = () => {
      const el = document.getElementById("accessoryItems");
      el.style.display = (el.style.display === "none" ? "block" : "none");
    };
    // 부속류 체크/입력 이벤트
    ["balancingValve", "heatMeter", "waterDistributor", "tempControlValve", "householdFlowValve"].forEach(id => {
      document.getElementById(id).onchange = updateAccessoryTotal;
      document.getElementById(id + "Value").oninput = updateAccessoryTotal;
    });
    updateAccessoryTotal();
  }

  // 페이지 이동
  document.getElementById("nextPage1").onclick = () => {
    // 필수 입력값 검증
    const width = document.getElementById("buildingWidth").value;
    const length = document.getElementById("buildingLength").value;
    const height = document.getElementById("buildingHeight").value;
    let warning = document.getElementById("warning");
    if (!width || !length || !height) {
      warning.textContent = "값을 확인해주세요";
      warning.style.display = "inline";
      return;
    }
    // 객실 Row 검증
    let valid = true;
    document.querySelectorAll("#roomTypeContainer .linear-horizontal").forEach(row => {
      const roomCount = row.querySelector(".roomCount").value;
      const unitArea = row.querySelector(".unitHeatingArea").value;
      if (!roomCount || !unitArea) valid = false;
    });
    if (!valid) {
      warning.textContent = "값을 확인해주세요";
      warning.style.display = "inline";
      return;
    }
    warning.style.display = "none";
    // 1페이지 선택된 건물 용도 정보를 2페이지에 반영
    const typeIdx = typeSelect.selectedIndex;
    const options = (typeIdx === 0) ? buildingPurposeOptionsForGeneral : buildingPurposeOptionsForHousing;
    const idx = document.getElementById("buildingPurpose").selectedIndex;
    const selected = options[idx];
    document.getElementById("pipeBuildingPurpose").value = selected.purpose;
    document.getElementById("pipeBuildingPurpose").disabled = true;
    document.getElementById("unitHeatingLoad").value = selected.unitLoad;
    showPage(2);
  };
  document.getElementById("prevPage1").onclick = () => {}; // 첫 페이지는 이전 없음

  // Page2 기본값
  if (document.getElementById("safetyRate")) document.getElementById("safetyRate").value = 20;
  if (document.getElementById("longestPipeLength")) document.getElementById("longestPipeLength").value = 100;
  if (document.getElementById("heatingCoilLength")) document.getElementById("heatingCoilLength").value = 80;

  if (document.getElementById("prevPage2")) document.getElementById("prevPage2").onclick = () => showPage(1);
  if (document.getElementById("nextPage2")) document.getElementById("nextPage2").onclick = () => {
    calculateResults();
    showPage(3);
  };

  if (document.getElementById("prevPage3")) document.getElementById("prevPage3").onclick = () => showPage(2);
  if (document.getElementById("reset")) document.getElementById("reset").onclick = () => window.location.reload();
}

// 보조 함수들
function parseDouble(s) {
  const v = parseFloat(s);
  return isNaN(v) ? 0.0 : v;
}

// 배관경 결정 함수
function pickDiameter(calculatedDiameter) {
  for (let i = 0; i < ACTUAL_DIAMETERS.length; i++) {
    if (calculatedDiameter <= ACTUAL_DIAMETERS[i]) {
      return { nominal: NOMINAL_DIAMETERS[i], actual: ACTUAL_DIAMETERS[i] };
    }
  }
  const last = ACTUAL_DIAMETERS.length - 1;
  return { nominal: NOMINAL_DIAMETERS[last], actual: ACTUAL_DIAMETERS[last] };
}

// 층수 보정 계수 함수
function heightCoefficient(h) {
  const halfH = h / 2.0;
  const N = Math.floor(halfH / 9.0);
  const remainder = halfH - 9 * N;
  let sum = halfH;
  for (let n = 0; n < N; n++) {
    sum += 9.0 * Math.pow(0.75, 2 * (n + 1));
  }
  sum += remainder * Math.pow(0.75, 2 * (N + 1));
  return sum;
}

// 결과 계산 함수 (Page2 → Page3)
function calculateResults() {
  const unitHeatingLoad = parseDouble(document.getElementById("unitHeatingLoad").value);
  const safetyRate = parseDouble(document.getElementById("safetyRate").value);
  const totalHeatingArea = parseDouble(document.getElementById("totalHeatingArea").textContent);

  // 1) 계산 난방 부하
  const calculatedHeatingLoad = unitHeatingLoad * totalHeatingArea * (1 + safetyRate / 100.0);

  // 2) 난방 캐스케이드 수량 (올림)
  let cascadeCount = Math.ceil(calculatedHeatingLoad / 45000.0);
  let cascadeMinMessage = "";
  if (cascadeCount < 2) {
    cascadeCount = 2;
    cascadeMinMessage = "순간식 난방 캐스케이드 최소 수량은 2대입니다.";
  }

  // 3) 난방 캐스케이드 용량
  const cascadeCapacity = cascadeCount * 45000.0;

  // 4) 2차측 순환펌프 유량
  const secondaryPumpFlow = calculatedHeatingLoad / 600.0;

  // 2차측 펌프 양정 계산
  let inputLongestPipeLength = parseDouble(document.getElementById("longestPipeLength").value);
  let resolvedLongestPipeLength = inputLongestPipeLength > 0 ? inputLongestPipeLength : 0;
  if (inputLongestPipeLength <= 0) {
    const buildingWidth = parseDouble(document.getElementById("buildingWidth").value);
    const buildingLength = parseDouble(document.getElementById("buildingLength").value);
    const buildingHeight = parseDouble(document.getElementById("buildingHeight").value);
    resolvedLongestPipeLength = (buildingLength + buildingWidth) * 0.75 * 2 + 2 * (buildingHeight - 3);
  }

  let inputHeatingCoilLength = parseDouble(document.getElementById("heatingCoilLength").value);
  let resolvedHeatingCoilLength = inputHeatingCoilLength > 0 ? inputHeatingCoilLength : 0;
  if (inputHeatingCoilLength <= 0) {
    let maxUnitHeatingArea = 0.0;
    document.querySelectorAll("#roomTypeContainer .linear-horizontal").forEach(row => {
      const unitArea = parseDouble(row.querySelector(".unitHeatingArea").value);
      if (unitArea > maxUnitHeatingArea) maxUnitHeatingArea = unitArea;
    });
    const calculatedCoil = maxUnitHeatingArea * 3;
    resolvedHeatingCoilLength = (calculatedCoil > 120) ? 120 : calculatedCoil;
  }

  const totalPressureLoss = parseDouble(document.getElementById("totalPressureLoss").value);

  const secondaryPumpHead = 1.5 * (resolvedLongestPipeLength * 0.02 + resolvedHeatingCoilLength * 0.005) + totalPressureLoss;

  // 배관경 결정 함수들 - 1차측 유량 = CAS 수량 * 25Lpm
  const calcPrim = 1.6258
    * Math.pow(130.0, -0.38)
    * Math.pow((cascadeCount * 25.0 / 60.0 / 1000.0), 0.38)
    * Math.pow((20.0 / 1000.0), -0.205)
    * 1000.0;
  const primaryResult = pickDiameter(calcPrim);

  // 2차측
  const calcSec = 1.6258
    * Math.pow(130.0, -0.38)
    * Math.pow((secondaryPumpFlow / 60.0 / 1000.0), 0.38)
    * Math.pow((20.0 / 1000.0), -0.205)
    * 1000.0;
  const secondaryResult = pickDiameter(calcSec);

  // 팽창탱크 용량 계산
  const buildingWidth = parseDouble(document.getElementById("buildingWidth").value);
  const buildingLength = parseDouble(document.getElementById("buildingLength").value);
  const buildingHeight = parseDouble(document.getElementById("buildingHeight").value);

  const coilWaterAmount = 0.201062 * totalHeatingArea * 3.8;
  const facilityWaterAmount = Math.PI * Math.pow(primaryResult.actual / 2000.0, 2.0) * 15 * 1000 + 4 * cascadeCount;
  const mainWaterAmount = Math.PI * Math.pow(secondaryResult.actual / 2000.0, 2.0)
    * 2 * heightCoefficient(buildingHeight) * 1000;
  const branchWaterAmount = Math.PI * Math.pow(secondaryResult.actual / 2000.0, 2.0)
    * (buildingWidth + buildingLength) * 0.6 * (buildingHeight / 3.0) * 1000 * 0.58;
  const totalWaterAmount = (coilWaterAmount + facilityWaterAmount + mainWaterAmount + branchWaterAmount) * (1 + safetyRate / 200);
  const expansionTankVolume = (totalWaterAmount * 0.02233) * ((buildingHeight / 10.0) + 2.833) / 1.5;

  // 결과 표시
  document.getElementById("calculatedHeatingLoad").textContent = `${Math.round(calculatedHeatingLoad).toLocaleString()} kcal/hr`;
  document.getElementById("cascadeCount").textContent = `NCB790-45LS x ${cascadeCount}대`;
  document.getElementById("cascadeMinMessage").textContent = cascadeMinMessage;
  document.getElementById("cascadeMinMessage").style.display = cascadeMinMessage ? "inline" : "none";
  document.getElementById("cascadeCapacity").textContent = `${Math.round(cascadeCapacity).toLocaleString()} kcal/hr`;
  document.getElementById("secondaryPumpFlow").textContent = `${Math.round(secondaryPumpFlow).toLocaleString()} ℓpm`;
  document.getElementById("secondaryPumpHead").textContent = `${secondaryPumpHead.toFixed(1)} m`;
  document.getElementById("expansionTankVolume").textContent = `${Math.round(expansionTankVolume).toLocaleString()} ℓ`;
  document.getElementById("totalWaterAmount").textContent = `${totalWaterAmount.toFixed(1)} ℓ`;
  document.getElementById("calculatedPrimaryDiameter").textContent = `${calcPrim.toFixed(2)} mm`;
  document.getElementById("selectedPrimaryDiameter").textContent = primaryResult.nominal;
  document.getElementById("actualPrimaryDiameter").textContent = `${primaryResult.actual.toFixed(2)} mm`;
  document.getElementById("calculatedSecondaryDiameter").textContent = `${calcSec.toFixed(2)} mm`;
  document.getElementById("selectedSecondaryDiameter").textContent = secondaryResult.nominal;
  document.getElementById("actualSecondaryDiameter").textContent = `${secondaryResult.actual.toFixed(2)} mm`;

  // 팽창탱크 경고
  const expansionTankWarning = document.getElementById("expansionTankWarning");
  if (Math.round(expansionTankVolume) >= 2500) {
    expansionTankWarning.textContent = "팽창탱크 용량이 2,500ℓ를 초과하므로, \n난방 존 분할이나 팽창기수분리기 사용 검토를 권장합니다";
    expansionTankWarning.style.display = "block";
  } else {
    expansionTankWarning.style.display = "none";
  }
}

// 초기화
window.onload = () => {
  showPage(1);
  setupEventHandlers();

}; 
