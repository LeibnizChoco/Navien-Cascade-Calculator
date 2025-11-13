// 급탕 – 방식 4 (저탕탱크 방식)
// Android Method4InputActivity / Method4ResultActivity 로직을 JS로 그대로 포팅

// ===== 상수 (arrays.xml 기반) =====

// 방식2, 4 공통 위생기구 종류
const FIXTURE_OPTIONS = [
  "개인용세면기",
  "공중용세면기",
  "샤워",
  "욕조",
  "주방싱크",
  "청소싱크",
  "식기세척기",
  "세탁싱크",
];

// 건물용도 선택 (첫 항목은 placeholder)
const BUILDING_USAGE_OPTIONS = [
  "건물용도 선택",
  "공동주택",
  "체육관",
  "병원",
  "호텔",
  "공장",
  "업무용건물",
  "주택",
  "학교",
];

// 저탕탱크 계수 (tank_coefficients) – BUILDING_USAGE_OPTIONS 에서 첫 항목(placeholder)를 제외한 순서
const TANK_COEFFICIENTS = [
  1.25, // 공동주택
  1.0,  // 체육관
  0.6,  // 병원
  0.8,  // 호텔
  1.0,  // 공장
  2.0,  // 업무용건물
  0.7,  // 주택
  1.0,  // 학교
];

// 파이프 내경(mm) / 호칭(A)
const PIPE_INNER_DIAMS = [
  17.5,
  23.0,
  28.4,
  37.1,
  43.0,
  54.9,
  70.3,
  83.1,
  108.3,
  133.0,
  158.4,
  208.3,
  259.4,
  309.5,
];

const PIPE_NOMINALS = [
  15,
  20,
  25,
  32,
  40,
  50,
  65,
  80,
  100,
  125,
  150,
  200,
  250,
  300,
];

// 숫자 포맷터
function fmtInt(value) {
  if (!isFinite(value)) return "--";
  return Math.round(value).toLocaleString("ko-KR", {
    maximumFractionDigits: 0,
  });
}

function fmt1(value) {
  if (!isFinite(value)) return "--";
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

// 파이프 직경 계산식 (Method4ResultActivity.calcPipeDiameter)
function calcPipeDiameter(flowQ) {
  return (
    1.6258 *
    Math.pow(130, -0.38) *
    Math.pow(flowQ, 0.38) *
    Math.pow(20.0 / 1000.0, -0.205) *
    1000.0
  );
}

// 계산내경을 기준으로 pipeInner / 호칭 선택
function selectPipeFromDia(calcDia) {
  let selDia = PIPE_INNER_DIAMS[PIPE_INNER_DIAMS.length - 1];
  let selNom = PIPE_NOMINALS[PIPE_NOMINALS.length - 1];

  for (let i = 0; i < PIPE_INNER_DIAMS.length; i++) {
    const d = PIPE_INNER_DIAMS[i];
    if (d >= calcDia) {
      selDia = d;
      selNom = PIPE_NOMINALS[i];
      break;
    }
  }
  return { calcDia, selDia, selNom };
}

// 로컬스토리지 키
const STORAGE_KEY = "dhw_method4_state";

// 상태 저장
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // 무시
  }
}

// 상태 복원
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// DOM 로드 후 초기화
document.addEventListener("DOMContentLoaded", () => {
  const widthInput = document.getElementById("input-width4");
  const lengthInput = document.getElementById("input-length4");
  const aboveFloorsInput = document.getElementById("input-aboveFloors4");
  const machineLocSelect = document.getElementById("select-machineRoomLoc4");
  const machineFloorInput = document.getElementById("input-machineRoomFloor4");
  const startLocSelect = document.getElementById("select-startFloorLoc4");
  const startFloorInput = document.getElementById("input-startFloor4");
  const buildingUsageSelect = document.getElementById("select-buildingUsage4");

  const fixtureContainer = document.getElementById("fixture-rows4");
  const btnAddFixture = document.getElementById("btn-add-fixture4");
  const btnBack = document.getElementById("btnMethod4Back");
  const btnCalc = document.getElementById("btnMethod4Calculate");
  const btnReset = document.getElementById("btnMethod4Reset");
  const btnResultBack = document.getElementById("btnMethod4ResultBack");

  // 결과 영역 텍스트 요소
  const tvEquipmentLoad = document.getElementById("tv4EquipmentLoad");
  const tvEquipmentCascade = document.getElementById("tv4EquipmentCascade");
  const tvEquipmentCapacity = document.getElementById("tv4EquipmentCapacity");
  const tvTankCapacity = document.getElementById("tv4TankCapacity");

  const tvPumpFlow = document.getElementById("tv4PumpFlow");
  const tvPumpHead = document.getElementById("tv4PumpHead");
  const tvConvPumpFlow = document.getElementById("tv4ConvPumpFlow");
  const tvConvPumpHead = document.getElementById("tv4ConvPumpHead");
  const tvExpansionTankCapacity = document.getElementById(
    "tv4ExpansionTankCapacity"
  );

  const tvFirstPipeInner = document.getElementById("tv4FirstPipeInner");
  const tvFirstPipeNominal = document.getElementById("tv4FirstPipeNominal");
  const tvFirstPipeOuter = document.getElementById("tv4FirstPipeOuter");

  const tvHotMainPipeInner = document.getElementById("tv4HotMainPipeInner");
  const tvHotMainPipeNominal = document.getElementById("tv4HotMainPipeNominal");
  const tvHotMainPipeOuter = document.getElementById("tv4HotMainPipeOuter");

  const tvReturnPipeInner = document.getElementById("tv4ReturnPipeInner");
  const tvReturnPipeNominal = document.getElementById("tv4ReturnPipeNominal");
  const tvReturnPipeOuter = document.getElementById("tv4ReturnPipeOuter");

  // 건물용도 select 옵션 구성 (arrays.xml 기반)
  BUILDING_USAGE_OPTIONS.forEach((label, idx) => {
    const opt = document.createElement("option");
    opt.value = label;
    opt.textContent = label;
    if (idx === 0) {
      opt.disabled = true;
      opt.selected = true;
      opt.hidden = true;
    }
    buildingUsageSelect.appendChild(opt);
  });

  // 위생기구 행 생성
  function createFixtureRow(initialType = "", initialCount = "") {
    const row = document.createElement("div");
    row.className =
      "grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] gap-2 items-center";

    // 위생기구 select
    const sel = document.createElement("select");
    sel.className =
      "w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500";

    FIXTURE_OPTIONS.forEach((label) => {
      const opt = document.createElement("option");
      opt.value = label;
      opt.textContent = label;
      sel.appendChild(opt);
    });

    if (initialType && FIXTURE_OPTIONS.includes(initialType)) {
      sel.value = initialType;
    }

    // 개수 input
    const cnt = document.createElement("input");
    cnt.type = "number";
    cnt.inputMode = "numeric";
    cnt.min = "0";
    cnt.className =
      "w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500";
    cnt.placeholder = "수량";
    if (initialCount !== "") cnt.value = initialCount;

    // 삭제 버튼
    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className =
      "inline-flex items-center justify-center w-8 h-8 rounded-full border border-rose-400 text-rose-600 text-base hover:bg-rose-50";
    btnDel.textContent = "–";
    btnDel.addEventListener("click", () => {
      row.remove();
    });

    row.appendChild(sel);
    row.appendChild(cnt);
    row.appendChild(btnDel);

    return row;
  }

  // 상태 복원
  const saved = loadState();
  if (saved) {
    widthInput.value = saved.width ?? "";
    lengthInput.value = saved.length ?? "";
    aboveFloorsInput.value = saved.aboveFloors ?? "";

    if (saved.machineRoomLoc) machineLocSelect.value = saved.machineRoomLoc;
    if (saved.machineRoomFloor != null)
      machineFloorInput.value = saved.machineRoomFloor;

    if (saved.startFloorLoc) startLocSelect.value = saved.startFloorLoc;
    if (saved.startFloorNum != null) startFloorInput.value = saved.startFloorNum;

    if (saved.buildingUsage) {
      // placeholder가 아닌 경우에만
      if (BUILDING_USAGE_OPTIONS.includes(saved.buildingUsage)) {
        buildingUsageSelect.value = saved.buildingUsage;
      }
    }

    if (Array.isArray(saved.fixtures) && saved.fixtures.length > 0) {
      saved.fixtures.forEach((fx) => {
        const row = createFixtureRow(fx.type, String(fx.count ?? ""));
        fixtureContainer.appendChild(row);
      });
    }
  }

  // 저장값이 없으면 기본 행 하나 추가
  if (fixtureContainer.children.length === 0) {
    fixtureContainer.appendChild(createFixtureRow());
  }

  // “+” 버튼 – 위생기구 행 추가
  btnAddFixture.addEventListener("click", () => {
    fixtureContainer.appendChild(createFixtureRow());
  });

  // “이전” 버튼 – 브라우저 뒤로가기
  btnBack.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // 단독 페이지로 열렸을 때는 그냥 맨 위로
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // 결과 카드의 "입력 영역으로 이동"
  btnResultBack.addEventListener("click", () => {
    const card = document.getElementById("method4-input-card");
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  // 리셋 버튼 – 입력 및 로컬스토리지 초기화
  btnReset.addEventListener("click", () => {
    widthInput.value = "";
    lengthInput.value = "";
    aboveFloorsInput.value = "";
    machineLocSelect.value = "지하";
    machineFloorInput.value = "";
    startLocSelect.value = "지상";
    startFloorInput.value = "";
    buildingUsageSelect.value = BUILDING_USAGE_OPTIONS[0];

    fixtureContainer.innerHTML = "";
    fixtureContainer.appendChild(createFixtureRow());

    // 결과값 초기화
    [
      tvEquipmentLoad,
      tvEquipmentCascade,
      tvEquipmentCapacity,
      tvTankCapacity,
      tvPumpFlow,
      tvPumpHead,
      tvConvPumpFlow,
      tvConvPumpHead,
      tvExpansionTankCapacity,
      tvFirstPipeInner,
      tvFirstPipeNominal,
      tvFirstPipeOuter,
      tvHotMainPipeInner,
      tvHotMainPipeNominal,
      tvHotMainPipeOuter,
      tvReturnPipeInner,
      tvReturnPipeNominal,
      tvReturnPipeOuter,
    ].forEach((el) => (el.textContent = el.textContent.includes("kcal")
      ? "-- kcal/h"
      : el.textContent.includes("톤")
      ? "-- 톤"
      : el.textContent.includes("Lpm")
      ? "-- Lpm"
      : el.textContent.includes("m")
      ? "-- m"
      : el.textContent.includes("A")
      ? "-- A"
      : el.textContent.includes("mm")
      ? "-- mm"
      : el.id === "tv4ExpansionTankCapacity"
      ? "-- L"
      : "--"));

    // 저장 상태 초기화
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}

    alert("입력값이 초기화되었습니다.");
  });

  // 계산 버튼
  btnCalc.addEventListener("click", () => {
    // 1) 입력 검증
    if (
      !widthInput.value ||
      !lengthInput.value ||
      !aboveFloorsInput.value ||
      !machineFloorInput.value ||
      !startFloorInput.value ||
      buildingUsageSelect.value === BUILDING_USAGE_OPTIONS[0] ||
      fixtureContainer.children.length === 0
    ) {
      alert("현장정보와 위생기구를 모두 입력해주세요.");
      return;
    }

    const width = parseFloat(widthInput.value);
    const length = parseFloat(lengthInput.value);
    const aboveFloors = parseInt(aboveFloorsInput.value, 10);
    const machineRoomLoc = machineLocSelect.value; // 지하/지상 (계산식에는 숫자만 사용)
    const machineRoomFloor = parseInt(machineFloorInput.value, 10);
    const startFloorLoc = startLocSelect.value;
    const startFloorNum = parseInt(startFloorInput.value, 10);
    const usage = buildingUsageSelect.value;

    if (
      !isFinite(width) ||
      !isFinite(length) ||
      !Number.isInteger(aboveFloors) ||
      !Number.isInteger(machineRoomFloor) ||
      !Number.isInteger(startFloorNum)
    ) {
      alert("숫자 입력값을 다시 확인해주세요.");
      return;
    }

    // 위생기구 데이터
    const types = [];
    const counts = [];

    Array.from(fixtureContainer.children).forEach((row) => {
      const [sel, cntInput] = row.querySelectorAll("select, input");
      const type = sel.value;
      const cnt = parseInt(cntInput.value || "0", 10);
      if (cnt > 0) {
        types.push(type);
        counts.push(cnt);
      }
    });

    if (types.length === 0) {
      alert("위생기구 수량을 1개 이상 입력해주세요.");
      return;
    }

    // 2) 건물용도별 로직 (Method4InputActivity와 동일)
    let loadPerUnit;
    let simultaneousRate;
    let tankCoeff;

    switch (usage) {
      case "공동주택":
        loadPerUnit = [7.6, 15, 114, 76, 38, 76, 57, 76];
        simultaneousRate = 0.3;
        tankCoeff = 1.25;
        break;
      case "체육관":
        loadPerUnit = [7.6, 30, 550, 114, 0, 0, 0, 0];
        simultaneousRate = 0.4;
        tankCoeff = 1.0;
        break;
      case "병원":
        loadPerUnit = [7.6, 23, 284, 76, 76, 76, 380, 106];
        simultaneousRate = 0.25;
        tankCoeff = 0.6;
        break;
      case "호텔":
        loadPerUnit = [7.6, 30, 284, 76, 114, 114, 475, 106];
        simultaneousRate = 0.25;
        tankCoeff = 0.8;
        break;
      case "공장":
        loadPerUnit = [7.6, 45.5, 550, 0, 76, 76, 228, 106];
        simultaneousRate = 0.4;
        tankCoeff = 1.0;
        break;
      case "업무용건물":
        loadPerUnit = [7.6, 23, 114, 0, 76, 76, 228, 0];
