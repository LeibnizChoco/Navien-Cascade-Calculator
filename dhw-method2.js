// dhw-method2.js
// 방식2(WSFU) 계산 로직: Method2InputActivity / Method2ResultActivity Java 를 JS로 포팅

(() => {
  const STORAGE_KEY = "dhw_method2_prefs";

  // DOM 헬퍼
  function $(id) {
    return document.getElementById(id);
  }

  // 위생기구별 FU 값 (fixture_options + fixture_fu_values)
  // 개인용세면기, 공중용세면기, 샤워, 욕조, 주방싱크, 청소싱크, 식기세척기, 세탁싱크
  const fixtureFuMap = {
    "개인용세면기": 0.75,
    "공중용세면기": 1.0,
    "샤워": 1.5,
    "욕조": 1.5,
    "주방싱크": 1.5,
    "청소싱크": 2.5,
    "식기세척기": 5.0,
    "세탁싱크": 2.5
  };

  // pipe_inner_diams, pipe_nominals (arrays.xml 값 그대로)
  const pipeInnerDiams = [
    17.5, 23.0, 28.4, 37.1, 43.0, 54.9, 70.3,
    83.1, 108.3, 133.0, 158.4, 208.3, 259.4, 309.5
  ];

  const pipeNominals = [
    "15", "20", "25", "32", "40", "50", "65",
    "80", "100", "125", "150", "200", "250", "300"
  ];

  // 숫자 포맷
  const nfInt = new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 0
  });

  const nfDec1 = new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  // 페이지 초기화
  document.addEventListener("DOMContentLoaded", () => {
    const etWidth2 = $("etWidth2");
    const etLength2 = $("etLength2");
    const etAboveFloors2 = $("etAboveFloors2");
    const spinnerMachineRoom2 = $("spinnerMachineRoom2");
    const etMachineRoomFloor2 = $("etMachineRoomFloor2");
    const spinnerStartFloor2 = $("spinnerStartFloor2");
    const etStartFloor2 = $("etStartFloor2");
    const spinnerSimultaneous2 = $("spinnerSimultaneous2");

    const btnAddFixture2 = $("btnAddFixture2");
    const btnMethod2Back = $("btnMethod2Back");
    const btnMethod2Calculate = $("btnMethod2Calculate");
    const btnMethod2Reset = $("btnMethod2Reset");

    const fixtureContainer = $("containerFixtures2");
    const fixtureTemplate = $("fixture-row-template");

    const resultCard = $("m2-result-card");
    const btnResultBack = $("btnMethod2ResultBack");

    // 결과 영역 DOM
    const tvEquipmentLoad = $("tv2EquipmentLoad");
    const tvEquipmentCascade = $("tv2EquipmentCascade");
    const tvEquipmentCapacity = $("tv2EquipmentCapacity");
    const tvPumpFlow = $("tv2PumpFlow");
    const tvPumpHead = $("tv2PumpHead");
    const tvTankCapacity = $("tv2TankCapacity");
    const tvMainCalc = $("tv2MainPipeCalc");
    const tvMainNominal = $("tv2MainPipeNominal");
    const tvMainInner = $("tv2MainPipeInner");
    const tvRetCalc = $("tv2ReturnPipeCalc");
    const tvRetNominal = $("tv2ReturnPipeNominal");
    const tvRetInner = $("tv2ReturnPipeInner");

    // --- localStorage ↔ SharedPreferences 역할 ---

    function savePrefs() {
      const data = {
        width2: etWidth2.value || "",
        length2: etLength2.value || "",
        aboveFloors2: etAboveFloors2.value || "",
        machineFloor2: etMachineRoomFloor2.value || "",
        startFloor2: etStartFloor2.value || "",
        machineRoom2Pos: spinnerMachineRoom2.selectedIndex,
        startFloor2Pos: spinnerStartFloor2.selectedIndex,
        sim2Pos: spinnerSimultaneous2.selectedIndex,
        fixtures: []
      };

      const rows = fixtureContainer.querySelectorAll(".fixture-row");
      rows.forEach((row) => {
        const typeSel = row.querySelector(".fixture-type");
        const cntInput = row.querySelector(".fixture-count");
        data.fixtures.push({
          type: typeSel.value,
          count: cntInput.value || ""
        });
      });

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn("localStorage 저장 실패", e);
      }
    }

    function loadPrefs() {
      let data = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) data = JSON.parse(raw);
      } catch (e) {
        console.warn("localStorage 읽기 실패", e);
      }
      if (!data) return;

      etWidth2.value = data.width2 ?? "";
      etLength2.value = data.length2 ?? "";
      etAboveFloors2.value = data.aboveFloors2 ?? "";
      etMachineRoomFloor2.value = data.machineFloor2 ?? "";
      etStartFloor2.value = data.startFloor2 ?? "";

      if (Number.isInteger(data.machineRoom2Pos))
        spinnerMachineRoom2.selectedIndex = data.machineRoom2Pos;
      if (Number.isInteger(data.startFloor2Pos))
        spinnerStartFloor2.selectedIndex = data.startFloor2Pos;
      if (Number.isInteger(data.sim2Pos))
        spinnerSimultaneous2.selectedIndex = data.sim2Pos;

      // 위생기구 복원
      fixtureContainer.innerHTML = "";
      if (Array.isArray(data.fixtures)) {
        data.fixtures.forEach((fx) => {
          addFixtureRow(fx.type, fx.count);
        });
      }
    }

    // --- 위생기구 행 추가/삭제 ---

    function addFixtureRow(initialType = "개인용세면기", initialCount = "") {
      const node = fixtureTemplate.content.firstElementChild.cloneNode(true);

      const typeSel = node.querySelector(".fixture-type");
      const cntInput = node.querySelector(".fixture-count");
      const btnRemove = node.querySelector(".btn-remove-fixture");

      if (initialType) {
        typeSel.value = initialType;
      }
      cntInput.value = initialCount ?? "";

      btnRemove.addEventListener("click", () => {
        fixtureContainer.removeChild(node);
        savePrefs();
      });

      fixtureContainer.appendChild(node);
    }

    // + 버튼
    btnAddFixture2.addEventListener("click", () => {
      addFixtureRow();
      savePrefs();
    });

    // 이전 버튼 (메인으로)
    btnMethod2Back.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "index.html";
      }
    });

    // 결과 화면에서 "입력으로 돌아가기"
    btnResultBack.addEventListener("click", () => {
      resultCard.classList.add("hidden");
      $("m2-input-card").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // 리셋
    btnMethod2Reset.addEventListener("click", () => {
      etWidth2.value = "";
      etLength2.value = "";
      etAboveFloors2.value = "";
      etMachineRoomFloor2.value = "";
      etStartFloor2.value = "";

      spinnerMachineRoom2.selectedIndex = 0;
      spinnerStartFloor2.selectedIndex = 0;
      spinnerSimultaneous2.selectedIndex = 0;

      fixtureContainer.innerHTML = "";
      localStorage.removeItem(STORAGE_KEY);
      resultCard.classList.add("hidden");
    });

    // 계산 버튼
    btnMethod2Calculate.addEventListener("click", () => {
      if (
        !etWidth2.value.trim() ||
        !etLength2.value.trim() ||
        !etAboveFloors2.value.trim() ||
        !etMachineRoomFloor2.value.trim() ||
        !etStartFloor2.value.trim() ||
        fixtureContainer.children.length === 0
      ) {
        alert("현장정보와 최소 한 개 이상의 위생기구를 입력하세요.");
        return;
      }

      try {
        const width = parseFloat(etWidth2.value);
        const length = parseFloat(etLength2.value);
        const aboveFloors = parseInt(etAboveFloors2.value, 10);
        const machineFloor = parseInt(etMachineRoomFloor2.value, 10);
        const startFloor = parseInt(etStartFloor2.value, 10);

        const simLevel = spinnerSimultaneous2.value; // "저" / "중" / "고"

        // FU 합산
        let FU = 0;
        const rows = fixtureContainer.querySelectorAll(".fixture-row");
        rows.forEach((row) => {
          const typeSel = row.querySelector(".fixture-type");
          const cntInput = row.querySelector(".fixture-count");

          const type = typeSel.value;
          const fuPerFixture = fixtureFuMap[type] ?? 0;
          const cnt = cntInput.value.trim()
            ? parseInt(cntInput.value, 10)
            : 0;

          FU += fuPerFixture * cnt;
        });

        if (!(FU > 0)) {
          alert("FU 값이 0입니다. 위생기구 수량을 확인해주세요.");
          return;
        }

        // WSFU → 동시사용유량
        const simFlow = calculateSimFlow(FU, simLevel);

        // 급탕부하 (kcal/h)
        const totalLoad2 = Math.round(simFlow * 55.0 * 60.0);

        // 입력 저장
        savePrefs();

        // 결과 채우기
        fillResults({
          totalLoad: totalLoad2,
          width,
          length,
          aboveFloors,
          machineFloor,
          startFloor,
          tvEquipmentLoad,
          tvEquipmentCascade,
          tvEquipmentCapacity,
          tvPumpFlow,
          tvPumpHead,
          tvTankCapacity,
          tvMainCalc,
          tvMainNominal,
          tvMainInner,
          tvRetCalc,
          tvRetNominal,
          tvRetInner
        });

        resultCard.classList.remove("hidden");
        resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) {
        console.error(e);
        alert("숫자를 올바르게 입력해주세요.");
      }
    });

    // 페이지 로딩 시 저장값 복원
    loadPrefs();
  });

  // --- Method2InputActivity.calculateSimFlow(FU, simLevel) 포팅 ---

  function calculateSimFlow(FU, simLevel) {
    if (FU === 1) return 7.8;
    if (FU === 2) return 9.6;
    if (FU === 3) return 11.4;

    const isLow = simLevel === "저";
    const isMed = simLevel === "중";
    const isHigh = simLevel === "고";

    if (FU <= 300) {
      if (isLow) {
        return (
          -7.34266293145236e-13 * Math.pow(FU, 6) +
          8.24364433215773e-10 * Math.pow(FU, 5) -
          3.67623047947685e-7 * Math.pow(FU, 4) +
          8.35334142479383e-5 * Math.pow(FU, 3) -
          0.0106863068061784 * Math.pow(FU, 2) +
          1.03901033786315 * FU +
          10.3065662117733
        );
      } else if (isMed) {
        return (
          -5.58969487184094e-12 * Math.pow(FU, 6) +
          5.5198149323879e-9 * Math.pow(FU, 5) -
          2.12975636242063e-6 * Math.pow(FU, 4) +
          4.08212629528393e-4 * Math.pow(FU, 3) -
          0.0416090203859767 * Math.pow(FU, 2) +
          2.60903116097325 * FU +
          6.8942602428142
        );
      } else {
        // 고
        return (
          -5.2966673850354e-12 * Math.pow(FU, 6) +
          5.19212173868142e-9 * Math.pow(FU, 5) -
          2.00990732009132e-6 * Math.pow(FU, 4) +
          3.97273992081892e-4 * Math.pow(FU, 3) -
          0.0441504929335679 * Math.pow(FU, 2) +
          3.23296711534203 * FU +
          2.90046660689404
        );
      }
    } else {
      if (isLow) {
        return (
          -5.78071790852124e-12 * Math.pow(FU, 4) +
          4.48754830115002e-8 * Math.pow(FU, 3) -
          1.21651117208227e-4 * Math.pow(FU, 2) +
          0.238172412179429 * FU +
          44.0773124243857
        );
      } else if (isMed) {
        return (
          4.43110839931032e-15 * Math.pow(FU, 5) -
          4.44423672204488e-11 * Math.pow(FU, 4) +
          1.73645699808511e-7 * Math.pow(FU, 3) -
          3.29851778772949e-4 * Math.pow(FU, 2) +
          0.45432073826998 * FU +
          42.5269660647083
        );
      } else {
        // 고
        return (
          -1.38307854755904e-18 * Math.pow(FU, 6) +
          1.85777296868538e-14 * Math.pow(FU, 5) -
          9.91631634616567e-11 * Math.pow(FU, 4) -
          4.17317847888106e-4 * Math.pow(FU, 2) +
          0.537679297150273 * FU +
          74.4517179332899
        );
      }
    }
  }

  // --- Method2ResultActivity 계산 포팅 ---

  function fillResults(params) {
    const {
      totalLoad,
      width,
      length,
      aboveFloors,
      machineFloor,
      startFloor,
      tvEquipmentLoad,
      tvEquipmentCascade,
      tvEquipmentCapacity,
      tvPumpFlow,
      tvPumpHead,
      tvTankCapacity,
      tvMainCalc,
      tvMainNominal,
      tvMainInner,
      tvRetCalc,
      tvRetNominal,
      tvRetInner
    } = params;

    // 4) 장비용량
    tvEquipmentLoad.textContent = `${nfInt.format(Math.round(totalLoad))} kcal/h`;
    const cascadeCount = Math.ceil(totalLoad / 48000.0);
    tvEquipmentCascade.textContent = `${nfInt.format(cascadeCount)} 대`;
    const equipmentCapacity = cascadeCount * 48000;
    tvEquipmentCapacity.textContent = `${nfInt.format(equipmentCapacity)} kcal/h`;

    // 5) 환탕펌프 유량
    const rawFlow = (cascadeCount * 10.0) / 2.0;
    const flowInt = Math.ceil(rawFlow);
    tvPumpFlow.textContent = `${nfInt.format(flowInt)} Lpm`;

    // 6) 환탕펌프 양정
    const part1 = (width + length) * 0.5;
    const part2 = machineFloor * 4.0 + aboveFloors * 3.0;
    const part3 = (width + length) * 0.5;
    const headRaw = (part1 + part2 + part3) * 2 * 1.5 * 0.02 + 5.0;
    const head2d = Math.ceil(headRaw * 10.0) / 10.0;
    tvPumpHead.textContent = `${nfDec1.format(head2d)} m`;

    // 7) 배관경
    // 급탕 주배관
    const Qhot = (cascadeCount * 16.0) / 60.0 / 1000.0;
    const calcHot =
      1.6258 *
      Math.pow(130, -0.38) *
      Math.pow(Qhot, 0.38) *
      Math.pow(20.0 / 1000.0, -0.205) *
      1000.0;
    selectAndDisplayPipe(calcHot, tvMainCalc, tvMainNominal, tvMainInner);

    // 환탕 주배관
    const Qret = flowInt / 60.0 / 1000.0;
    const calcRet =
      1.6258 *
      Math.pow(130, -0.38) *
      Math.pow(Qret, 0.38) *
      Math.pow(20.0 / 1000.0, -0.205) *
      1000.0;
    selectAndDisplayPipe(calcRet, tvRetCalc, tvRetNominal, tvRetInner);

    // 8) 팽창탱크 계산
    const pi = Math.PI;

    const mpInner_mm = pipeInnerDiams[findPipeIndex(calcHot)];
    const rpInner_mm = pipeInnerDiams[findPipeIndex(calcRet)];

    // (1) 급탕관 주배관 관수량
    const A1 = (pi * Math.pow(mpInner_mm / 1000.0, 2)) / 4 * 1000.0;
    const vol1 =
      A1 * (width + length) * 0.7 +
      A1 * (machineFloor * 4 + (startFloor - 1) * 3);

    // (2) 급탕관 입상관 관수량
    const A2 =
      (pi * Math.pow((mpInner_mm / 1000.0) * 0.8, 2)) / 4 * 1000.0;
    const vol2 = A2 * (aboveFloors - startFloor + 1) * 3;

    // (3) 급탕관 지관 관수량
    const A3 =
      (pi * Math.pow((mpInner_mm / 1000.0) * 0.7, 2)) / 4 * 1000.0;
    const vol3 =
      A3 * (width + length) * 0.8 * (aboveFloors - startFloor + 1);

    // (4) 환탕관 주배관 관수량
    const B1 = (pi * Math.pow(rpInner_mm / 1000.0, 2)) / 4 * 1000.0;
    const vol4 =
      B1 * (width + length) * 0.7 +
      B1 * (machineFloor * 4 + (startFloor - 1) * 3);

    // (5) 환탕관 입상관 관수량
    const B2 =
      (pi * Math.pow((rpInner_mm / 1000.0) * 0.8, 2)) / 4 * 1000.0;
    const vol5 = B2 * (aboveFloors - startFloor + 1) * 3;

    // (6) 환탕관 지관 관수량
    const B3 =
      (pi * Math.pow((rpInner_mm / 1000.0) * 0.7, 2)) / 4 * 1000.0;
    const vol6 =
      B3 * (width + length) * 0.8 * (aboveFloors - startFloor + 1);

    const totalVol = 1.2 * (vol1 + vol2 + vol3 + vol4 + vol5 + vol6);

    // (7) 팽창수량
    const expVol = totalVol * 0.01678;

    // (8) 최저압력
    const minPress =
      (machineFloor * 4 + aboveFloors * 3 +
        (machineFloor * 4 + aboveFloors * 3) * 1.5 * 0.03 +
        20) /
      10.0;

    // (9) 유효용량계수
    const effCoeff = 1.5 / (minPress + 1.03);

    // (10) 팽창탱크 용량
    const tankCap = expVol / effCoeff;
    const tankRounded = Math.round(tankCap * 10.0) / 10.0;
    tvTankCapacity.textContent = `${nfDec1.format(tankRounded)} L`;
  }

  function selectAndDisplayPipe(calcDia, tvCalc, tvNominal, tvInner) {
    tvCalc.textContent = `${nfDec1.format(calcDia)} mm`;

    let selDia = pipeInnerDiams[pipeInnerDiams.length - 1];
    let selNom = pipeNominals[pipeNominals.length - 1];

    for (let i = 0; i < pipeInnerDiams.length; i++) {
      const d = pipeInnerDiams[i];
      if (d >= calcDia) {
        selDia = d;
        selNom = pipeNominals[i];
        break;
      }
    }

    tvNominal.textContent = `${selNom} A`;
    tvInner.textContent = `${nfDec1.format(selDia)} mm`;
  }

  function findPipeIndex(flowData) {
    for (let i = 0; i < pipeInnerDiams.length; i++) {
      if (pipeInnerDiams[i] >= flowData) {
        return i;
      }
    }
    return pipeInnerDiams.length - 1;
  }
})();
