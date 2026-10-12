// ========================================================
// ALNASSR QUICK POS - REPORTS & UTILITIES ENGINE (pos-reports.js)
// ========================================================

var currentReportMode = 'daily';
var currentReportDataForWA = {};
var currentStatementDataForWA = null;

// Customer-il ninnu Agent-inte peru ethoru field aayalum (agent_name, agent, agent_id) krithyamayi edukkunnu
function getCustomerAgentName(cust) {
  if (!cust) return '';
  if (cust.agent_name && String(cust.agent_name).trim()) return String(cust.agent_name).trim();
  if (cust.agent && String(cust.agent).trim()) return String(cust.agent).trim();
  if (cust.route_agent && String(cust.route_agent).trim()) return String(cust.route_agent).trim();
  if (cust.agent_id && Array.isArray(agentsList)) {
    const matched = agentsList.find(a => String(a.id) === String(cust.agent_id) || cleanPartyName(a.name) === cleanPartyName(cust.agent_id));
    if (matched && matched.name) return String(matched.name).trim();
  }
  return '';
}

// ========================================================
// 1. REPORTS MODAL CONTROLLER
// ========================================================
function openReportModal() {
  const modal = document.getElementById("reportModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }

  const dashDate = document.getElementById("mobileFilterDate")?.value || getSaudiBusinessDate();
  if (document.getElementById("repFilterDate")) document.getElementById("repFilterDate").value = dashDate;
  if (document.getElementById("repFilterMonth")) document.getElementById("repFilterMonth").value = dashDate.substring(0, 7);
  if (document.getElementById("statMonth")) document.getElementById("statMonth").value = dashDate.substring(0, 7);

  switchReportMode(currentReportMode || 'daily');
  if (window.lucide) lucide.createIcons();
}

function closeReportModal() {
  const modal = document.getElementById("reportModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
}

function switchReportMode(mode) {
  currentReportMode = mode;
  const repDailyBtn = document.getElementById("repDailyBtn");
  const repMonthlyBtn = document.getElementById("repMonthlyBtn");
  const repStatBtn = document.getElementById("repStatBtn");
  const statementControlBar = document.getElementById("statementControlBar");
  const statementPrintContainer = document.getElementById("statementPrintContainer");
  const reportPrintContainer = document.getElementById("reportPrintContainer");
  const reportDateSelectorBar = document.getElementById("reportDateSelectorBar");
  const repFilterDate = document.getElementById("repFilterDate");
  const repFilterMonth = document.getElementById("repFilterMonth");
  const repFilterLabel = document.getElementById("repFilterLabel");

  if (repDailyBtn) repDailyBtn.className = "px-2 py-1 rounded-lg text-slate-600 transition cursor-pointer font-bold";
  if (repMonthlyBtn) repMonthlyBtn.className = "px-2 py-1 rounded-lg text-slate-600 transition cursor-pointer font-bold";
  if (repStatBtn) repStatBtn.className = "px-2 py-1 rounded-lg text-slate-600 transition cursor-pointer font-bold";

  if (mode === 'daily') {
    if (repDailyBtn) repDailyBtn.className = "px-2 py-1 rounded-lg bg-emerald-600 text-white shadow transition cursor-pointer font-black";
    if (reportDateSelectorBar) reportDateSelectorBar.classList.remove("hidden");
    if (repFilterDate) repFilterDate.classList.remove("hidden");
    if (repFilterMonth) repFilterMonth.classList.add("hidden");
    if (repFilterLabel) repFilterLabel.innerText = "📅 തീയതി മാറ്റുക:";
    if (statementControlBar) statementControlBar.classList.add("hidden");
    if (statementPrintContainer) statementPrintContainer.classList.add("hidden");
    if (reportPrintContainer) reportPrintContainer.classList.remove("hidden");
    renderReportData('daily');
  } else if (mode === 'monthly') {
    if (repMonthlyBtn) repMonthlyBtn.className = "px-2 py-1 rounded-lg bg-blue-600 text-white shadow transition cursor-pointer font-black";
    if (reportDateSelectorBar) reportDateSelectorBar.classList.remove("hidden");
    if (repFilterDate) repFilterDate.classList.add("hidden");
    if (repFilterMonth) repFilterMonth.classList.remove("hidden");
    if (repFilterLabel) repFilterLabel.innerText = "📅 മാസം മാറ്റുക:";
    if (statementControlBar) statementControlBar.classList.add("hidden");
    if (statementPrintContainer) statementPrintContainer.classList.add("hidden");
    if (reportPrintContainer) reportPrintContainer.classList.remove("hidden");
    renderReportData('monthly');
  } else if (mode === 'statement') {
    if (repStatBtn) repStatBtn.className = "px-2 py-1 rounded-lg bg-indigo-600 text-white shadow transition cursor-pointer font-black";
    if (reportDateSelectorBar) reportDateSelectorBar.classList.add("hidden");
    if (statementControlBar) statementControlBar.classList.remove("hidden");
    if (statementPrintContainer) statementPrintContainer.classList.remove("hidden");
    if (reportPrintContainer) reportPrintContainer.classList.add("hidden");
    populateStatementPartyDatalist();
    generateStatement();
  }
}

function onReportDateChanged() { renderReportData('daily'); }
function onReportMonthChanged() { renderReportData('monthly'); }

function formatShortName(name) {
  if (!name) return '';
  let s = String(name).trim();
  return s.length > 25 ? s.substring(0, 24) + '..' : s;
}

// ========================================================
// 2. REPORT DATA RENDERER (WITH 15% VAT SUMMARY)
// ========================================================
function renderReportData(mode) {
  let targetDate = document.getElementById("repFilterDate")?.value || getSaudiBusinessDate();
  let targetMonth = document.getElementById("repFilterMonth")?.value || targetDate.substring(0, 7);

  let titleText = "";
  let dateBadgeText = "";
  let dateCondition;
  let isBeforeTargetCondition;
  let isTargetOrBeforeCondition;

  if (mode === 'daily') {
    dateCondition = (dStr) => cleanDate(dStr) === targetDate;
    isBeforeTargetCondition = (dStr) => cleanDate(dStr) < targetDate;
    isTargetOrBeforeCondition = (dStr) => cleanDate(dStr) <= targetDate;
    titleText = "ഡെയ്‌ലി റിപ്പോർട്ട് (Daily Report)";
    dateBadgeText = `തീയതി: ${targetDate}`;
  } else {
    dateCondition = (dStr) => cleanDate(dStr).startsWith(targetMonth);
    isBeforeTargetCondition = (dStr) => cleanDate(dStr) < `${targetMonth}-01`;
    isTargetOrBeforeCondition = (dStr) => cleanDate(dStr).substring(0, 7) <= targetMonth;
    titleText = `മന്ത്ലി റിപ്പോർട്ട് (${targetMonth})`;
    dateBadgeText = `മാസം: ${targetMonth}`;
  }

  const repModeTitle = document.getElementById("reportModeTitle");
  const repDateBadge = document.getElementById("reportDateBadgeLabel");
  if (repModeTitle) repModeTitle.innerText = titleText;
  if (repDateBadge) repDateBadge.innerText = dateBadgeText;

  let allTx = Array.isArray(transactionsList) ? [...transactionsList] : [];
  const offlineQueue = getOfflineQueue();
  offlineQueue.forEach(item => { 
    const record = item.payload ? item.payload : item;
    allTx.unshift(record); 
  });

  let totSale = 0, totPur = 0, totExp = 0, totSal = 0;
  let cashSalesMap = {};
  let creditSalesMap = {};
  let cashPurMap = {};
  let creditPurMap = {};
  let salariesMap = {};
  let expensesMap = {};

  let custCashReceipt = 0, custBankReceipt = 0;
  let vendCashPay = 0, vendBankPay = 0;

  let dayOpeningCash = openingSettings.openingCash;
  let dayOpeningBank = openingSettings.openingBank;
  let targetClosingCash = openingSettings.openingCash;
  let targetClosingBank = openingSettings.openingBank;

  allTx.forEach(t => {
    if (!t) return;
    const tDate = cleanDate(t.date);

    if (isBeforeTargetCondition(tDate)) {
      dayOpeningCash += (parseFloat(t.cash_amount) || 0);
      dayOpeningBank += (parseFloat(t.bank_amount) || 0);
    }

    if (isTargetOrBeforeCondition(tDate)) {
      targetClosingCash += (parseFloat(t.cash_amount) || 0);
      targetClosingBank += (parseFloat(t.bank_amount) || 0);
    }

    if (dateCondition(t.date)) {
      if (t.type === 'sale') {
        let cCash = Math.abs(parseFloat(t.cash_amount) || 0);
        let cBank = Math.abs(parseFloat(t.bank_amount) || 0);
        let cCr = parseFloat(t.credit_amount) || 0;
        let rawName = t.party_name || "Unknown";
        let cleanN = cleanPartyName(rawName);

        let cust = (customersList || []).find(c => c && cleanPartyName(c.name) === cleanN);
        let isCreditCust = cust && (cust.type || '').toLowerCase() === 'credit';

        if (isCreditCust) {
          totSale += cCr;
          custCashReceipt += cCash;
          custBankReceipt += cBank;
          if (!creditSalesMap[rawName]) creditSalesMap[rawName] = { name: rawName, cash: 0, bank: 0, cr: 0 };
          creditSalesMap[rawName].cash += cCash;
          creditSalesMap[rawName].bank += cBank;
          creditSalesMap[rawName].cr += cCr;
        } else {
          let lineTotal = cCash + cBank + cCr;
          totSale += lineTotal;
          if (!cashSalesMap[rawName]) cashSalesMap[rawName] = { name: rawName, cash: 0, bank: 0, total: 0 };
          cashSalesMap[rawName].cash += cCash;
          cashSalesMap[rawName].bank += cBank;
          cashSalesMap[rawName].total += lineTotal;
        }
      } else if (t.type === 'purchase') {
        let pCash = Math.abs(parseFloat(t.cash_amount) || 0);
        let pBank = Math.abs(parseFloat(t.bank_amount) || 0);
        let pCr = parseFloat(t.credit_amount) || 0;
        let rawName = t.party_name || "Unknown";
        let cleanN = cleanPartyName(rawName);

        let vend = (vendorsList || []).find(v => v && cleanPartyName(v.name) === cleanN);
        let isCreditVend = vend && (vend.type || '').toLowerCase() === 'credit';

        if (isCreditVend) {
          totPur += pCr;
          vendCashPay += pCash;
          vendBankPay += pBank;
          if (!creditPurMap[rawName]) creditPurMap[rawName] = { name: rawName, cash: 0, bank: 0, cr: 0 };
          creditPurMap[rawName].cash += pCash;
          creditPurMap[rawName].bank += pBank;
          creditPurMap[rawName].cr += pCr;
        } else {
          let lineTotal = pCash + pBank + pCr;
          totPur += lineTotal;
          if (!cashPurMap[rawName]) cashPurMap[rawName] = { name: rawName, cash: 0, bank: 0, total: 0 };
          cashPurMap[rawName].cash += pCash;
          cashPurMap[rawName].bank += pBank;
          cashPurMap[rawName].total += lineTotal;
        }
      } else if (t.type === 'expense') {
        let eC = Math.abs(parseFloat(t.cash_amount) || 0);
        let eB = Math.abs(parseFloat(t.bank_amount) || 0);
        let lineTotal = eC + eB;
        totExp += lineTotal;

        let rawExp = t.party_name || "Expense";
        let cleanExp = rawExp.split(' (')[0].trim();
        if (!expensesMap[cleanExp]) expensesMap[cleanExp] = { name: cleanExp, cash: 0, bank: 0, total: 0 };
        expensesMap[cleanExp].cash += eC;
        expensesMap[cleanExp].bank += eB;
        expensesMap[cleanExp].total += lineTotal;
      } else if (t.type === 'salary') {
        let rawC = parseFloat(t.cash_amount) || 0;
        let rawB = parseFloat(t.bank_amount) || 0;

        if (rawC <= 0 && rawB <= 0) {
          let posC = Math.abs(rawC);
          let posB = Math.abs(rawB);
          let lineTotal = posC + posB;
          totSal += lineTotal;

          let rawSal = t.party_name || "Staff";
          let cleanStaff = rawSal.replace(/^Staff:\s*/i, "").split(' -')[0].trim();
          if (!salariesMap[cleanStaff]) salariesMap[cleanStaff] = { name: cleanStaff, cash: 0, bank: 0, total: 0 };
          salariesMap[cleanStaff].cash += posC;
          salariesMap[cleanStaff].bank += posB;
          salariesMap[cleanStaff].total += lineTotal;
        }
      }
    }
  });

  let totalCustOutstanding = 0;
  (customersList || []).forEach(cust => {
    if (cust && (cust.type || '').toLowerCase() === 'credit') {
      let bal = parseFloat(cust.opening_balance) || 0;
      let cName = cleanPartyName(cust.name);
      allTx.forEach(t => {
        if (t && t.type === 'sale' && cleanPartyName(t.party_name) === cName) {
          bal += (parseFloat(t.credit_amount) || 0) - (parseFloat(t.cash_amount) || 0) - (parseFloat(t.bank_amount) || 0);
        }
      });
      totalCustOutstanding += bal;
    }
  });

  let totalVendOutstanding = 0;
  (vendorsList || []).forEach(vend => {
    if (vend && (vend.type || '').toLowerCase() === 'credit') {
      let bal = parseFloat(vend.opening_balance) || 0;
      let vName = cleanPartyName(vend.name);
      allTx.forEach(t => {
        if (t && t.type === 'purchase' && cleanPartyName(t.party_name) === vName) {
          bal += (parseFloat(t.credit_amount) || 0) - Math.abs(parseFloat(t.cash_amount) || 0) - Math.abs(parseFloat(t.bank_amount) || 0);
        }
      });
      totalVendOutstanding += bal;
    }
  });

  let totalEmpPending = 0;
  (employeesList || []).forEach(emp => {
    totalEmpPending += calculateEmployeePendingBalance(emp, targetDate);
  });

  let totalDayOpening = dayOpeningCash + dayOpeningBank;
  let totalTargetClosing = targetClosingCash + targetClosingBank;

  // 15% VAT CALCULATIONS
  const vatOutput = totSale > 0 ? (totSale - (totSale / 1.15)) : 0;
  const vatInput = totPur > 0 ? (totPur - (totPur / 1.15)) : 0;
  const vatNet = vatOutput - vatInput;

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
  setVal("repOpeningLiquidBal", totalDayOpening.toLocaleString('en-IN'));
  setVal("repTotalSale", totSale.toLocaleString('en-IN'));
  setVal("repTotalPurchase", totPur.toLocaleString('en-IN'));
  setVal("repTotalExpense", (totExp + totSal).toLocaleString('en-IN'));
  setVal("repCustBal", totalCustOutstanding.toLocaleString('en-IN'));
  setVal("repVendorBal", totalVendOutstanding.toLocaleString('en-IN'));
  setVal("repSalaryBal", totalEmpPending.toLocaleString('en-IN'));
  setVal("repLiquidBal", totalTargetClosing.toLocaleString('en-IN'));

  setVal("vatOutputText", `${vatOutput.toFixed(2)} SR`);
  setVal("vatInputText", `${vatInput.toFixed(2)} SR`);
  setVal("vatNetPayableText", `${vatNet.toFixed(2)} SR`);

  setVal("salesGrandBadge", `ആകെ: ${totSale.toLocaleString('en-IN')}`);
  setVal("purchaseGrandBadge", `ആകെ: ${totPur.toLocaleString('en-IN')}`);

  // REPORT TABLES
  const cashSalesArr = Object.values(cashSalesMap);
  let rCSCash = 0, rCSBank = 0, rCSTotal = 0;
  let cashSalesHtml = `<table class="w-full text-center border-collapse"><thead><tr class="bg-emerald-100 text-slate-900 font-black border-b"><th class="p-1 text-left">പേര്</th><th class="p-1">ക്യാഷ്</th><th class="p-1">ബാങ്ക്</th><th class="p-1 text-right">ആകെ</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
  if (cashSalesArr.length === 0) cashSalesHtml += `<tr><td colspan="4" class="p-1 text-center text-slate-400">ഇടപാടുകൾ ഇല്ല</td></tr>`;
  else {
    cashSalesArr.forEach(s => {
      rCSCash += s.cash; rCSBank += s.bank; rCSTotal += s.total;
      cashSalesHtml += `<tr><td class="p-1 text-left font-black text-slate-900 truncate" title="${s.name}">${formatShortName(s.name)}</td><td class="p-1 text-emerald-800">${s.cash}</td><td class="p-1 text-blue-800">${s.bank}</td><td class="p-1 text-right font-black text-slate-950">${s.total}</td></tr>`;
    });
  }
  cashSalesHtml += `</tbody><tfoot><tr class="bg-emerald-50 text-emerald-950 font-black border-t"><td class="p-1 text-left uppercase">ആകെ:</td><td class="p-1">${rCSCash}</td><td class="p-1">${rCSBank}</td><td class="p-1 text-right text-slate-950">${rCSTotal}</td></tr></tfoot></table>`;
  const repCS = document.getElementById("repCashSalesList");
  if (repCS) repCS.innerHTML = cashSalesHtml;

  const creditSalesArr = Object.values(creditSalesMap);
  let rCrSCash = 0, rCrSBank = 0, rCrSCr = 0;
  let creditSalesHtml = `<table class="w-full text-center border-collapse"><thead><tr class="bg-amber-100 text-slate-900 font-black border-b"><th class="p-1 text-left">പേര്</th><th class="p-1">ക്യാഷ്</th><th class="p-1">ബാങ്ക്</th><th class="p-1 text-right">ക്രെഡിറ്റ്</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
  if (creditSalesArr.length === 0) creditSalesHtml += `<tr><td colspan="4" class="p-1 text-center text-slate-400">ഇടപാടുകൾ ഇല്ല</td></tr>`;
  else {
    creditSalesArr.forEach(s => {
      rCrSCash += s.cash; rCrSBank += s.bank; rCrSCr += s.cr;
      creditSalesHtml += `<tr><td class="p-1 text-left font-black text-slate-900 truncate" title="${s.name}">${formatShortName(s.name)}</td><td class="p-1 text-emerald-800">${s.cash}</td><td class="p-1 text-blue-800">${s.bank}</td><td class="p-1 text-right font-black text-amber-900">${s.cr}</td></tr>`;
    });
  }
  creditSalesHtml += `</tbody><tfoot><tr class="bg-amber-50 text-amber-950 font-black border-t"><td class="p-1 text-left uppercase">ആകെ:</td><td class="p-1">${rCrSCash}</td><td class="p-1">${rCrSBank}</td><td class="p-1 text-right text-amber-950">${rCrSCr}</td></tr></tfoot></table>`;
  const repCrS = document.getElementById("repCreditSalesList");
  if (repCrS) repCrS.innerHTML = creditSalesHtml;

  const cashPurArr = Object.values(cashPurMap);
  let rCPCash = 0, rCPBank = 0, rCPTotal = 0;
  let cashPurHtml = `<table class="w-full text-center border-collapse"><thead><tr class="bg-blue-100 text-slate-900 font-black border-b"><th class="p-1 text-left">വെണ്ടർ</th><th class="p-1">ക്യാഷ്</th><th class="p-1">ബാങ്ക്</th><th class="p-1 text-right">ആകെ</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
  if (cashPurArr.length === 0) cashPurHtml += `<tr><td colspan="4" class="p-1 text-center text-slate-400">ഇടപാടുകൾ ഇല്ല</td></tr>`;
  else {
    cashPurArr.forEach(p => {
      rCPCash += p.cash; rCPBank += p.bank; rCPTotal += p.total;
      cashPurHtml += `<tr><td class="p-1 text-left font-black text-slate-900 truncate" title="${p.name}">${formatShortName(p.name)}</td><td class="p-1 text-blue-800">${p.cash}</td><td class="p-1 text-indigo-800">${p.bank}</td><td class="p-1 text-right font-black text-slate-950">${p.total}</td></tr>`;
    });
  }
  cashPurHtml += `</tbody><tfoot><tr class="bg-blue-50 text-blue-950 font-black border-t"><td class="p-1 text-left uppercase">ആകെ:</td><td class="p-1">${rCPCash}</td><td class="p-1">${rCPBank}</td><td class="p-1 text-right text-slate-950">${rCPTotal}</td></tr></tfoot></table>`;
  const repCP = document.getElementById("repCashPurchasesList");
  if (repCP) repCP.innerHTML = cashPurHtml;

  const creditPurArr = Object.values(creditPurMap);
  let rCrPCash = 0, rCrPBank = 0, rCrPCr = 0;
  let creditPurHtml = `<table class="w-full text-center border-collapse"><thead><tr class="bg-indigo-100 text-slate-900 font-black border-b"><th class="p-1 text-left">വെണ്ടർ</th><th class="p-1">ക്യാഷ്</th><th class="p-1">ബാങ്ക്</th><th class="p-1 text-right">ക്രെഡിറ്റ്</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
  if (creditPurArr.length === 0) creditPurHtml += `<tr><td colspan="4" class="p-1 text-center text-slate-400">ഇടപാടുകൾ ഇല്ല</td></tr>`;
  else {
    creditPurArr.forEach(p => {
      rCrPCash += p.cash; rCrPBank += p.bank; rCrPCr += p.cr;
      creditPurHtml += `<tr><td class="p-1 text-left font-black text-slate-900 truncate" title="${p.name}">${formatShortName(p.name)}</td><td class="p-1 text-blue-800">${p.cash}</td><td class="p-1 text-indigo-800">${p.bank}</td><td class="p-1 text-right font-black text-indigo-950">${p.cr}</td></tr>`;
    });
  }
  creditPurHtml += `</tbody><tfoot><tr class="bg-indigo-50 text-indigo-950 font-black border-t"><td class="p-1 text-left uppercase">ആകെ:</td><td class="p-1">${rCrPCash}</td><td class="p-1">${rCrPBank}</td><td class="p-1 text-right text-indigo-950">${rCrPCr}</td></tr></tfoot></table>`;
  const repCrP = document.getElementById("repCreditPurchasesList");
  if (repCrP) repCrP.innerHTML = creditPurHtml;

  const salArr = Object.values(salariesMap);
  let rSalCash = 0, rSalBank = 0, rSalTotal = 0;
  let salHtml = `<table class="w-full text-center border-collapse"><thead><tr class="bg-purple-100 text-slate-900 font-black border-b"><th class="p-1 text-left">സ്റ്റാഫ്</th><th class="p-1">ക്യാഷ്</th><th class="p-1">ബാങ്ക്</th><th class="p-1 text-right">ആകെ</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
  if (salArr.length === 0) salHtml += `<tr><td colspan="4" class="p-1 text-center text-slate-400">സാലറി ഇടപാടുകൾ ഇല്ല</td></tr>`;
  else {
    salArr.forEach(s => {
      rSalCash += s.cash; rSalBank += s.bank; rSalTotal += s.total;
      salHtml += `<tr><td class="p-1 text-left font-black text-slate-900 truncate" title="${s.name}">${formatShortName(s.name)}</td><td class="p-1 text-purple-800">${s.cash}</td><td class="p-1 text-blue-800">${s.bank}</td><td class="p-1 text-right font-black text-purple-950">${s.total}</td></tr>`;
    });
  }
  salHtml += `</tbody><tfoot><tr class="bg-purple-50 text-purple-950 font-black border-t"><td class="p-1 text-left uppercase">ആകെ:</td><td class="p-1">${rSalCash}</td><td class="p-1">${rSalBank}</td><td class="p-1 text-right text-purple-950">${rSalTotal}</td></tr></tfoot></table>`;
  const repSal = document.getElementById("repSalariesList");
  if (repSal) repSal.innerHTML = salHtml;

  const expArr = Object.values(expensesMap);
  let rExpCash = 0, rExpBank = 0, rExpTotal = 0;
  let expHtml = `<table class="w-full text-center border-collapse"><thead><tr class="bg-amber-100 text-slate-900 font-black border-b"><th class="p-1 text-left">ഇനം</th><th class="p-1">ക്യാഷ്</th><th class="p-1">ബാങ്ക്</th><th class="p-1 text-right">ആകെ</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
  if (expArr.length === 0) expHtml += `<tr><td colspan="4" class="p-1 text-center text-slate-400">ചിലവുകൾ ഇല്ല</td></tr>`;
  else {
    expArr.forEach(e => {
      rExpCash += e.cash; rExpBank += e.bank; rExpTotal += e.total;
      expHtml += `<tr><td class="p-1 text-left font-black text-slate-900 truncate" title="${e.name}">${formatShortName(e.name)}</td><td class="p-1 text-amber-800">${e.cash}</td><td class="p-1 text-blue-800">${e.bank}</td><td class="p-1 text-right font-black text-slate-950">${e.total}</td></tr>`;
    });
  }
  expHtml += `</tbody><tfoot><tr class="bg-amber-50 text-amber-950 font-black border-t"><td class="p-1 text-left uppercase">ആകെ:</td><td class="p-1">${rExpCash}</td><td class="p-1">${rExpBank}</td><td class="p-1 text-right text-slate-950">${rExpTotal}</td></tr></tfoot></table>`;
  const repExp = document.getElementById("repExpensesList");
  if (repExp) repExp.innerHTML = expHtml;

  currentReportDataForWA = {
    shopName: (currentShop && currentShop.name) ? currentShop.name : "ALNASSR",
    title: titleText,
    dateLabel: dateBadgeText,
    sale: totSale.toLocaleString('en-IN'),
    purchase: totPur.toLocaleString('en-IN'),
    expense: (totExp + totSal).toLocaleString('en-IN'),
    vatOutput: vatOutput.toFixed(2),
    vatInput: vatInput.toFixed(2),
    vatNet: vatNet.toFixed(2),
    cash: targetClosingCash.toLocaleString('en-IN'),
    bank: targetClosingBank.toLocaleString('en-IN'),
    custPaid: (custCashReceipt + custBankReceipt).toLocaleString('en-IN'),
    custBal: totalCustOutstanding.toLocaleString('en-IN'),
    vendorPaid: (vendCashPay + vendBankPay).toLocaleString('en-IN'),
    vendorBal: totalVendOutstanding.toLocaleString('en-IN'),
    empBal: totalEmpPending.toLocaleString('en-IN')
  };
}

// ========================================================
// 3. STATEMENTS ENGINE (SELECT DROPDOWN + DATE-WISE MERGE)
// ========================================================
var rawStatementPartyList = [];

function populateStatementPartyDatalist() {
  const type = document.getElementById("statPartyType").value;
  const searchInp = document.getElementById("statPartySearch");
  if (searchInp) searchInp.value = "";
  rawStatementPartyList = [];

  if (type === 'customer') {
    rawStatementPartyList.push({ val: "ALL CUSTOMERS", label: "📋 ALL CUSTOMERS (ആകെ ക്രെഡിറ്റ് കസ്റ്റമർമാർ)" });
    const creditCustomers = (customersList || []).filter(c => c && (c.type || '').toLowerCase() === 'credit');
    creditCustomers.forEach(c => {
      if (c && c.name) rawStatementPartyList.push({ val: c.name.toUpperCase(), label: c.name.toUpperCase() });
    });
  } else if (type === 'vendor') {
    rawStatementPartyList.push({ val: "ALL VENDORS", label: "📋 ALL VENDORS (ആകെ വെണ്ടർമാർ)" });
    (vendorsList || []).forEach(v => {
      if (v && v.name) rawStatementPartyList.push({ val: v.name.toUpperCase(), label: v.name.toUpperCase() });
    });
  } else if (type === 'employee') {
    rawStatementPartyList.push({ val: "ALL EMPLOYEES", label: "📋 ALL EMPLOYEES (ആകെ സ്റ്റാഫ്)" });
    (employeesList || []).forEach(em => {
      if (em && em.name) {
        let label = em.status === 'stopped' ? `${em.name.toUpperCase()} (Stopped)` : em.name.toUpperCase();
        rawStatementPartyList.push({ val: label, label: `👥 ${label}` });
      }
    });
  } else if (type === 'agent') {
    rawStatementPartyList.push({ val: "ALL AGENTS", label: "📋 ALL AGENTS (ആകെ റൂട്ട് ഏജന്റുമാർ)" });
    let allAgentNames = new Set();
    (agentsList || []).forEach(a => { if (a && a.name) allAgentNames.add(a.name.trim().toUpperCase()); });
    (customersList || []).forEach(c => { 
      const ag = getCustomerAgentName(c);
      if (ag) allAgentNames.add(ag.toUpperCase()); 
    });
    allAgentNames.forEach(ag => {
      rawStatementPartyList.push({ val: ag, label: `👤 ${ag}` });
    });
  } else if (type === 'expense') {
    rawStatementPartyList.push({ val: "ALL UTILITY BILLS", label: "📋 ALL UTILITY BILLS (ആകെ ബില്ലുകൾ)" });
    (expensesMasterList || []).forEach(ex => {
      if (ex && ex.name) rawStatementPartyList.push({ val: ex.name.toUpperCase(), label: `⚡ ${ex.name.toUpperCase()}` });
    });
  }

  renderStatementSelectOptions(rawStatementPartyList);
  generateStatement();
}

function renderStatementSelectOptions(list) {
  const sel = document.getElementById("statPartySelect");
  if (!sel) return;
  sel.innerHTML = "";
  list.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.val;
    opt.textContent = item.label;
    sel.appendChild(opt);
  });
}

function filterStatementParties(query) {
  const q = (query || "").trim().toUpperCase();
  const filtered = rawStatementPartyList.filter(item => {
    return item.val.includes(q) || item.label.toUpperCase().includes(q);
  });
  renderStatementSelectOptions(filtered.length > 0 ? filtered : rawStatementPartyList);
  generateStatement();
}

function generateStatement() {
  const type = document.getElementById("statPartyType").value;
  const sel = document.getElementById("statPartySelect") || document.getElementById("statPartyInput");
  let partyVal = (sel ? sel.value : "").trim().toUpperCase();
  let monthVal = (document.getElementById("statMonth")?.value || "").trim();

  if (!monthVal) {
    monthVal = (document.getElementById("mobileFilterDate")?.value || getSaudiBusinessDate()).substring(0, 7);
    if (document.getElementById("statMonth")) document.getElementById("statMonth").value = monthVal;
  }

  if (!partyVal) {
    if (type === 'customer') partyVal = "ALL CUSTOMERS";
    else if (type === 'vendor') partyVal = "ALL VENDORS";
    else if (type === 'agent') partyVal = "ALL AGENTS";
    else if (type === 'employee') partyVal = "ALL EMPLOYEES";
    else if (type === 'expense') partyVal = "ALL UTILITY BILLS";
    if (sel) sel.value = partyVal;
  }

  const fromDate = `${monthVal}-01`;
  const toDate = `${monthVal}-31`;

  let allTx = Array.isArray(transactionsList) ? [...transactionsList] : [];
  const offlineQueue = getOfflineQueue();
  offlineQueue.forEach(item => { 
    const record = item.payload ? item.payload : item;
    allTx.unshift(record); 
  });
  allTx.sort((a, b) => (cleanDate(a.date) || '').localeCompare(cleanDate(b.date) || ''));

  let partyName = partyVal;
  let openingBal = 0;
  let runningBal = 0;
  let totalSalesOrBills = 0;
  let totalPaidOrCollected = 0;
  let statementRows = [];

  let isAllVendorsMode = (type === 'vendor' && (partyVal === 'ALL VENDORS' || partyVal === 'ALL'));
  let isAllCustomersMode = (type === 'customer' && (partyVal === 'ALL CUSTOMERS' || partyVal === 'ALL'));
  let isAllEmployeesMode = (type === 'employee' && (partyVal === 'ALL EMPLOYEES' || partyVal === 'ALL'));
  let isAllAgentsMode = (type === 'agent' && (partyVal === 'ALL AGENTS' || partyVal === 'ALL'));
  let isAllUtilityBillsMode = (type === 'expense' && (partyVal === 'ALL UTILITY BILLS' || partyVal === 'ALL'));

  let vendorsConsolidatedSummary = [];
  let customersConsolidatedSummary = [];
  let employeesConsolidatedSummary = [];
  let agentsConsolidatedSummary = [];
  let singleAgentCustomersSummary = [];
  let utilitiesConsolidatedSummary = [];

  // 1. CUSTOMERS STATEMENT (DATE-WISE MERGED INTO SINGLE ROW)
  if (type === 'customer' && !isAllCustomersMode) {
    const custClean = cleanPartyName(partyVal);
    const cust = customersList.find(c => c && cleanPartyName(c.name) === custClean);
    partyName = cust ? cust.name.toUpperCase() : partyVal;
    openingBal = parseFloat(cust?.opening_balance) || 0;

    let dailyMap = {};

    allTx.forEach(t => {
      let tDate = cleanDate(t.date);
      if (t && cleanPartyName(t.party_name) === custClean && t.type === 'sale') {
        const debit = parseFloat(t.credit_amount) || 0;
        const credit = (parseFloat(t.cash_amount) || 0) + (parseFloat(t.bank_amount) || 0);

        if (tDate < fromDate) {
          openingBal += (debit - credit);
        } else if (tDate >= fromDate && tDate <= toDate) {
          totalSalesOrBills += debit;
          totalPaidOrCollected += credit;

          if (!dailyMap[tDate]) {
            dailyMap[tDate] = { date: tDate, paid: 0, bill: 0, types: [] };
          }
          dailyMap[tDate].paid += credit;
          dailyMap[tDate].bill += debit;
          if (debit > 0 && !dailyMap[tDate].types.includes("Credit Sale Bill")) dailyMap[tDate].types.push("Credit Sale Bill");
          if (credit > 0 && !dailyMap[tDate].types.includes("Collection Receipt")) dailyMap[tDate].types.push("Collection Receipt");
        }
      }
    });

    runningBal = openingBal;
    Object.keys(dailyMap).sort().forEach(dt => {
      const item = dailyMap[dt];
      runningBal += (item.bill - item.paid);
      statementRows.push({
        date: dt,
        desc: item.types.join(" & ") || "Sale Transaction",
        cash: item.paid,
        bank: 0,
        bill: item.bill,
        bal: runningBal
      });
    });
  } else if (isAllCustomersMode) {
    partyName = `TOTAL CREDIT CUSTOMERS MONTHLY STATEMENT`;
    let totalCustOpening = 0, totalCustSales = 0, totalCustPaid = 0, totalCustClosing = 0;
    const creditCustomers = (customersList || []).filter(c => c && (c.type || '').toLowerCase() === 'credit');

    creditCustomers.forEach(cust => {
      let custOpeningBal = parseFloat(cust.opening_balance) || 0;
      let periodCredit = 0, periodCash = 0, periodBank = 0;
      let cName = cleanPartyName(cust.name);

      allTx.forEach(t => {
        if (t && cleanPartyName(t.party_name) === cName && t.type === 'sale') {
          const tDate = cleanDate(t.date);
          const cr = parseFloat(t.credit_amount) || 0;
          const ca = Math.abs(parseFloat(t.cash_amount) || 0);
          const ba = Math.abs(parseFloat(t.bank_amount) || 0);
          if (tDate < fromDate) custOpeningBal += (cr - ca - ba);
          else if (tDate.startsWith(monthVal)) { periodCredit += cr; periodCash += ca; periodBank += ba; }
        }
      });

      const periodPaid = periodCash + periodBank;
      const custClosingBal = custOpeningBal + periodCredit - periodPaid;
      
      // 10 riyal-il thaazheyullava ozhivakkunnu
      if (custClosingBal <= 10) return;

      totalCustOpening += custOpeningBal; totalCustSales += periodCredit; totalCustPaid += periodPaid; totalCustClosing += custClosingBal;
      customersConsolidatedSummary.push({ name: cust.name, opening: custOpeningBal, sales: periodCredit, paid: periodPaid, closing: custClosingBal });
    });

    customersConsolidatedSummary.sort((a, b) => b.closing - a.closing);
    openingBal = totalCustOpening; totalSalesOrBills = totalCustSales; totalPaidOrCollected = totalCustPaid; runningBal = totalCustClosing;
  }

  // 2. VENDORS STATEMENT (DATE-WISE MERGED INTO SINGLE ROW)
  else if (type === 'vendor' && !isAllVendorsMode) {
    const vendClean = cleanPartyName(partyVal);
    const vend = vendorsList.find(v => v && cleanPartyName(v.name) === vendClean);
    partyName = vend ? vend.name.toUpperCase() : partyVal;
    openingBal = parseFloat(vend?.opening_balance) || 0;

    let dailyMap = {};

    allTx.forEach(t => {
      let tDate = cleanDate(t.date);
      if (t && cleanPartyName(t.party_name) === vendClean && t.type === 'purchase') {
        const debit = parseFloat(t.credit_amount) || 0;
        const paid = Math.abs(parseFloat(t.cash_amount) || 0) + Math.abs(parseFloat(t.bank_amount) || 0);

        if (tDate < fromDate) {
          openingBal += (debit - paid);
        } else if (tDate >= fromDate && tDate <= toDate) {
          totalSalesOrBills += debit;
          totalPaidOrCollected += paid;

          if (!dailyMap[tDate]) {
            dailyMap[tDate] = { date: tDate, paid: 0, bill: 0, types: [] };
          }
          dailyMap[tDate].paid += paid;
          dailyMap[tDate].bill += debit;
          if (debit > 0 && !dailyMap[tDate].types.includes("Credit Purchase")) dailyMap[tDate].types.push("Credit Purchase");
          if (paid > 0 && !dailyMap[tDate].types.includes("Payment Disbursed")) dailyMap[tDate].types.push("Payment Disbursed");
        }
      }
    });

    runningBal = openingBal;
    Object.keys(dailyMap).sort().forEach(dt => {
      const item = dailyMap[dt];
      runningBal += (item.bill - item.paid);
      statementRows.push({
        date: dt,
        desc: item.types.join(" & ") || "Purchase Transaction",
        cash: item.paid,
        bank: 0,
        bill: item.bill,
        bal: runningBal
      });
    });
  } else if (isAllVendorsMode) {
    partyName = `TOTAL VENDORS MONTHLY STATEMENT`;
    let totalVendOpening = 0, totalVendPurchases = 0, totalVendPaid = 0, totalVendClosing = 0;
    const creditVendors = vendorsList.filter(v => v && (v.type === 'credit' || !v.type));

    creditVendors.forEach(vend => {
      let vendOpeningBal = parseFloat(vend.opening_balance) || 0;
      let periodCredit = 0, periodCash = 0, periodBank = 0;
      let vName = cleanPartyName(vend.name);

      allTx.forEach(t => {
        if (t && cleanPartyName(t.party_name) === vName && t.type === 'purchase') {
          const tDate = cleanDate(t.date);
          const cr = parseFloat(t.credit_amount) || 0;
          const ca = Math.abs(parseFloat(t.cash_amount) || 0);
          const ba = Math.abs(parseFloat(t.bank_amount) || 0);
          if (tDate < fromDate) vendOpeningBal += (cr - ca - ba);
          else if (tDate.startsWith(monthVal)) { periodCredit += cr; periodCash += ca; periodBank += ba; }
        }
      });

      const periodPaid = periodCash + periodBank;
      const vendClosingBal = vendOpeningBal + periodCredit - periodPaid;
      
      if (vendClosingBal <= 10) return;

      totalVendOpening += vendOpeningBal; totalVendPurchases += periodCredit; totalVendPaid += periodPaid; totalVendClosing += vendClosingBal;
      vendorsConsolidatedSummary.push({ name: vend.name, opening: vendOpeningBal, purchases: periodCredit, paid: periodPaid, closing: vendClosingBal });
    });

    vendorsConsolidatedSummary.sort((a, b) => b.closing - a.closing);
    openingBal = totalVendOpening; totalSalesOrBills = totalVendPurchases; totalPaidOrCollected = totalVendPaid; runningBal = totalVendClosing;
  }

  // 3. AGENT STATEMENT
  else if (type === 'agent') {
    if (isAllAgentsMode) {
      partyName = `TOTAL ROUTE AGENTS STATEMENT`;
      let totalAgOpening = 0, totalAgSales = 0, totalAgPaid = 0, totalAgClosing = 0;

      let allUniqueAgents = new Set();
      (agentsList || []).forEach(a => { if (a && a.name) allUniqueAgents.add(a.name.trim().toUpperCase()); });
      (customersList || []).forEach(c => { 
        const ag = getCustomerAgentName(c);
        if (ag) allUniqueAgents.add(ag.toUpperCase()); 
      });

      allUniqueAgents.forEach(agName => {
        let agOpening = 0, agSales = 0, agPaid = 0, agClosing = 0, custCount = 0;
        const agClean = cleanPartyName(agName);

        (customersList || []).forEach(cust => {
          if (!cust) return;
          const cAg = getCustomerAgentName(cust);
          if (cleanPartyName(cAg) === agClean) {
            let cOpening = parseFloat(cust.opening_balance) || 0;
            let cCredit = 0, cCash = 0, cBank = 0;
            const cName = cleanPartyName(cust.name);

            allTx.forEach(t => {
              if (t && cleanPartyName(t.party_name) === cName && t.type === 'sale') {
                const tDate = cleanDate(t.date);
                const cr = parseFloat(t.credit_amount) || 0;
                const ca = Math.abs(parseFloat(t.cash_amount) || 0);
                const ba = Math.abs(parseFloat(t.bank_amount) || 0);
                if (tDate < fromDate) cOpening += (cr - ca - ba);
                else if (tDate.startsWith(monthVal)) { cCredit += cr; cCash += ca; cBank += ba; }
              }
            });

            const cPaid = cCash + cBank;
            const cBal = cOpening + cCredit - cPaid;
            if (cBal > 10) custCount++;

            agOpening += cOpening;
            agSales += cCredit;
            agPaid += cPaid;
            agClosing += cBal;
          }
        });

        if (agClosing <= 10) return;

        totalAgOpening += agOpening;
        totalAgSales += agSales;
        totalAgPaid += agPaid;
        totalAgClosing += agClosing;

        agentsConsolidatedSummary.push({
          name: agName,
          custCount: custCount,
          opening: agOpening,
          sales: agSales,
          paid: agPaid,
          closing: agClosing
        });
      });

      agentsConsolidatedSummary.sort((a, b) => b.closing - a.closing);
      openingBal = totalAgOpening; totalSalesOrBills = totalAgSales; totalPaidOrCollected = totalAgPaid; runningBal = totalAgClosing;
    } else {
      const agClean = cleanPartyName(partyVal);
      partyName = `AGENT: ${partyVal} - ROUTE CUSTOMERS STATEMENT`;
      let totalAgOpening = 0, totalAgSales = 0, totalAgPaid = 0, totalAgClosing = 0;

      (customersList || []).forEach(cust => {
        if (!cust) return;
        const cAg = getCustomerAgentName(cust);
        if (cleanPartyName(cAg) === agClean) {
          let cOpening = parseFloat(cust.opening_balance) || 0;
          let cCredit = 0, cCash = 0, cBank = 0;
          const cName = cleanPartyName(cust.name);

          allTx.forEach(t => {
            if (t && cleanPartyName(t.party_name) === cName && t.type === 'sale') {
              const tDate = cleanDate(t.date);
              const cr = parseFloat(t.credit_amount) || 0;
              const ca = Math.abs(parseFloat(t.cash_amount) || 0);
              const ba = Math.abs(parseFloat(t.bank_amount) || 0);
              if (tDate < fromDate) cOpening += (cr - ca - ba);
              else if (tDate.startsWith(monthVal)) { cCredit += cr; cCash += ca; cBank += ba; }
            }
          });

          const cPaid = cCash + cBank;
          const cBal = cOpening + cCredit - cPaid;

          if (cBal <= 10) return;

          totalAgOpening += cOpening;
          totalAgSales += cCredit;
          totalAgPaid += cPaid;
          totalAgClosing += cBal;

          singleAgentCustomersSummary.push({
            name: cust.name,
            opening: cOpening,
            sales: cCredit,
            paid: cPaid,
            closing: cBal
          });
        }
      });

      singleAgentCustomersSummary.sort((a, b) => b.closing - a.closing);
      openingBal = totalAgOpening; totalSalesOrBills = totalAgSales; totalPaidOrCollected = totalAgPaid; runningBal = totalAgClosing;
    }
  }

  // 4. EMPLOYEES STATEMENT
  else if (type === 'employee') {
    if (isAllEmployeesMode) {
      partyName = `TOTAL EMPLOYEES PENDING SALARY STATEMENT`;
      let totalEmpSalary = 0, totalEmpPaid = 0, totalEmpClosing = 0;

      (employeesList || []).forEach(emp => {
        if (!emp) return;
        const pendingBal = calculateEmployeePendingBalance(emp, toDate);

        if (pendingBal <= 10) return;

        let staffPaid = 0;
        const empClean = cleanPartyName(emp.name);
        allTx.forEach(t => {
          if (t && t.type === 'salary' && cleanPartyName(t.party_name).includes(empClean)) {
            const tDate = cleanDate(t.date);
            if (tDate.startsWith(monthVal)) {
              staffPaid += (Math.abs(parseFloat(t.cash_amount) || 0) + Math.abs(parseFloat(t.bank_amount) || 0));
            }
          }
        });

        totalEmpSalary += (parseFloat(emp.monthly_salary) || 0);
        totalEmpPaid += staffPaid;
        totalEmpClosing += pendingBal;

        employeesConsolidatedSummary.push({
          name: emp.name,
          salary: parseFloat(emp.monthly_salary) || 0,
          paid: staffPaid,
          closing: pendingBal
        });
      });

      employeesConsolidatedSummary.sort((a, b) => b.closing - a.closing);
      openingBal = 0;
      totalSalesOrBills = totalEmpSalary;
      totalPaidOrCollected = totalEmpPaid;
      runningBal = totalEmpClosing;
    } else {
      const cleanEmpName = cleanPartyName(partyVal);
      const emp = employeesList.find(e => e && cleanPartyName(e.name) === cleanEmpName);
      partyName = emp ? emp.name.toUpperCase() : partyVal;

      if (emp) {
        const selYear = parseInt(monthVal.split('-')[0]);
        const selMonth = parseInt(monthVal.split('-')[1]) - 1;
        const priorMonthEnd = new Date(selYear, selMonth, 0);
        const priorDateStr = `${priorMonthEnd.getFullYear()}-${String(priorMonthEnd.getMonth() + 1).padStart(2, '0')}-${String(priorMonthEnd.getDate()).padStart(2, '0')}`;

        openingBal = calculateEmployeePendingBalance(emp, priorDateStr);
        runningBal = openingBal;
        const monthlySalary = parseFloat(emp.monthly_salary) || 0;
        const joinD = parseToDateObj(emp.joining_date);

        for (let k = 1; k <= 120; k++) {
          let cycleDateObj = getCycleStartDate(joinD, k);
          let cycleDateStr = `${cycleDateObj.getFullYear()}-${String(cycleDateObj.getMonth() + 1).padStart(2, '0')}-${String(cycleDateObj.getDate()).padStart(2, '0')}`;
          if (cycleDateStr.startsWith(monthVal)) {
            totalSalesOrBills += monthlySalary;
            statementRows.push({ date: cycleDateStr, desc: `മാസ ശമ്പളം (Cycle ${k})`, cash: 0, bank: 0, bill: monthlySalary, isAccrual: true });
          }
        }

        allTx.forEach(t => {
          if (t && t.type === 'salary' && cleanPartyName(t.party_name).includes(cleanEmpName)) {
            let tDate = cleanDate(t.date);
            if (tDate >= fromDate && tDate <= toDate) {
              let rawC = parseFloat(t.cash_amount) || 0;
              let rawB = parseFloat(t.bank_amount) || 0;
              if (rawC > 0 || rawB > 0) {
                let inAmt = rawC + rawB;
                totalSalesOrBills += inAmt;
                statementRows.push({ date: tDate, desc: t.party_name.replace(/^Staff:\s*/i, ""), cash: 0, bank: 0, bill: inAmt });
              } else {
                const paid = Math.abs(rawC) + Math.abs(rawB);
                totalPaidOrCollected += paid;
                statementRows.push({ date: tDate, desc: t.party_name.replace(/^Staff:\s*/i, ""), cash: Math.abs(rawC), bank: Math.abs(rawB), bill: 0 });
              }
            }
          }
        });

        statementRows.sort((a, b) => a.date.localeCompare(b.date));
        statementRows.forEach(r => {
          const debit = r.bill || 0;
          const credit = (r.cash || 0) + (r.bank || 0);
          runningBal += debit - credit;
          r.bal = runningBal;
        });
      }
    }
  }

  // 5. UTILITY BILLS STATEMENT
  else if (type === 'expense') {
    if (isAllUtilityBillsMode) {
      partyName = `TOTAL RECURRING UTILITY BILLS STATEMENT`;
      let totalExpOpening = 0, totalExpBills = 0, totalExpPaid = 0, totalExpClosing = 0;

      expensesMasterList.forEach(ex => {
        let exOpeningBal = parseFloat(ex.opening_balance) || 0;
        let periodBills = 0, periodPaid = 0;
        const cleanExp = cleanPartyName(ex.name);

        allTx.forEach(t => {
          if (!t) return;
          const tClean = cleanPartyName(t.party_name);
          if (tClean.startsWith(cleanExp) || tClean === cleanExp) {
            const tDate = cleanDate(t.date);
            const billAmt = (t.type === 'expense_bill') ? (parseFloat(t.credit_amount) || 0) : 0;
            const payAmt = (t.type === 'expense') ? (Math.abs(parseFloat(t.cash_amount) || 0) + Math.abs(parseFloat(t.bank_amount) || 0)) : 0;

            if (tDate < fromDate) {
              exOpeningBal += (billAmt - payAmt);
            } else if (tDate.startsWith(monthVal)) {
              periodBills += billAmt;
              periodPaid += payAmt;
            }
          }
        });

        const exClosingBal = exOpeningBal + periodBills - periodPaid;
        if (exClosingBal <= 10) return;

        totalExpOpening += exOpeningBal;
        totalExpBills += periodBills;
        totalExpPaid += periodPaid;
        totalExpClosing += exClosingBal;

        utilitiesConsolidatedSummary.push({
          name: ex.name,
          opening: exOpeningBal,
          bills: periodBills,
          paid: periodPaid,
          closing: exClosingBal
        });
      });

      utilitiesConsolidatedSummary.sort((a, b) => b.closing - a.closing);
      openingBal = totalExpOpening;
      totalSalesOrBills = totalExpBills;
      totalPaidOrCollected = totalExpPaid;
      runningBal = totalExpClosing;
    } else {
      const expClean = cleanPartyName(partyVal);
      const ex = expensesMasterList.find(e => cleanPartyName(e.name) === expClean);
      partyName = ex ? ex.name.toUpperCase() : partyVal;
      openingBal = parseFloat(ex?.opening_balance) || 0;

      allTx.forEach(t => {
        if (!t) return;
        const tClean = cleanPartyName(t.party_name);
        if (tClean.startsWith(expClean) || tClean === cleanExp) {
          const tDate = cleanDate(t.date);
          const billAmt = (t.type === 'expense_bill') ? (parseFloat(t.credit_amount) || 0) : 0;
          const payAmt = (t.type === 'expense') ? (Math.abs(parseFloat(t.cash_amount) || 0) + Math.abs(parseFloat(t.bank_amount) || 0)) : 0;
          if (tDate < fromDate) openingBal += (billAmt - payAmt);
        }
      });

      runningBal = openingBal;
      allTx.forEach(t => {
        if (!t) return;
        const tClean = cleanPartyName(t.party_name);
        if (tClean.startsWith(expClean) || tClean === cleanExp) {
          const tDate = cleanDate(t.date);
          if (tDate >= fromDate && tDate <= toDate) {
            const billAmt = (t.type === 'expense_bill') ? (parseFloat(t.credit_amount) || 0) : 0;
            const payAmt = (t.type === 'expense') ? (Math.abs(parseFloat(t.cash_amount) || 0) + Math.abs(parseFloat(t.bank_amount) || 0)) : 0;
            totalSalesOrBills += billAmt;
            totalPaidOrCollected += payAmt;
            runningBal += (billAmt - payAmt);

            statementRows.push({
              date: tDate,
              desc: t.party_name,
              cash: Math.abs(parseFloat(t.cash_amount) || 0),
              bank: Math.abs(parseFloat(t.bank_amount) || 0),
              bill: billAmt,
              bal: runningBal
            });
          }
        }
      });
    }
  }

  // UI ELEMENTS UPDATE
  const statHead = document.getElementById("statHeaderTitle");
  const statPeriod = document.getElementById("statPeriodLabel");
  const statOpen = document.getElementById("statOpeningBalText");
  const statSales = document.getElementById("statMonthSalesText");
  const statPaid = document.getElementById("statMonthPaidText");
  const statClose = document.getElementById("statClosingBalText");

  if (statHead) statHead.innerText = `${partyName}`;
  if (statPeriod) statPeriod.innerText = `Period: ${monthVal}`;
  if (statOpen) statOpen.innerText = `${openingBal.toLocaleString('en-IN')}`;
  if (statSales) statSales.innerText = `${totalSalesOrBills.toLocaleString('en-IN')}`;
  if (statPaid) statPaid.innerText = `${totalPaidOrCollected.toLocaleString('en-IN')}`;
  if (statClose) statClose.innerText = `${runningBal.toLocaleString('en-IN')}`;

  let tableHtml = "";

  // TABLES RENDERING WITH EMPTY FALLBACK ROW
  if (isAllCustomersMode) {
    tableHtml = `<table class="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm table-fixed"><thead><tr class="bg-emerald-900 text-white font-black text-center border-b"><th class="p-1 w-6">#</th><th class="p-1 w-2/6 text-left">Customer</th><th class="p-1 w-1/6">Opening</th><th class="p-1 w-1/6">Sales</th><th class="p-1 w-1/6">Paid</th><th class="p-1 w-1/6 bg-emerald-950">Due (>10)</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
    if (customersConsolidatedSummary.length === 0) {
      tableHtml += `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-bold">10 റിയാലിൽ കൂടുതൽ കുടിശ്ശികയുള്ള കസ്റ്റമർമാർ ഇല്ല</td></tr>`;
    } else {
      customersConsolidatedSummary.forEach((r, idx) => {
        tableHtml += `<tr class="text-center hover:bg-slate-50"><td class="p-1">${idx + 1}</td><td class="p-1 text-left truncate">${formatShortName(r.name)}</td><td class="p-1">${r.opening.toLocaleString('en-IN')}</td><td class="p-1 text-amber-700">${r.sales.toLocaleString('en-IN')}</td><td class="p-1 text-emerald-700">${r.paid.toLocaleString('en-IN')}</td><td class="p-1 font-black text-emerald-900">${r.closing.toLocaleString('en-IN')}</td></tr>`;
      });
    }
    tableHtml += `</tbody></table>`;
  } else if (isAllVendorsMode) {
    tableHtml = `<table class="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm table-fixed"><thead><tr class="bg-blue-900 text-white font-black text-center border-b"><th class="p-1 w-6">#</th><th class="p-1 w-2/6 text-left">Vendor</th><th class="p-1 w-1/6">Opening</th><th class="p-1 w-1/6">Purchase</th><th class="p-1 w-1/6">Paid</th><th class="p-1 w-1/6 bg-blue-950">Due (>10)</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
    if (vendorsConsolidatedSummary.length === 0) {
      tableHtml += `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-bold">10 റിയാലിൽ കൂടുതൽ കുടിശ്ശികയുള്ള വെണ്ടർമാർ ഇല്ല</td></tr>`;
    } else {
      vendorsConsolidatedSummary.forEach((r, idx) => {
        tableHtml += `<tr class="text-center hover:bg-slate-50"><td class="p-1">${idx + 1}</td><td class="p-1 text-left truncate">${formatShortName(r.name)}</td><td class="p-1">${r.opening.toLocaleString('en-IN')}</td><td class="p-1 text-blue-700">${r.purchases.toLocaleString('en-IN')}</td><td class="p-1 text-emerald-700">${r.paid.toLocaleString('en-IN')}</td><td class="p-1 font-black text-rose-700">${r.closing.toLocaleString('en-IN')}</td></tr>`;
      });
    }
    tableHtml += `</tbody></table>`;
  } else if (type === 'agent' && isAllAgentsMode) {
    tableHtml = `<table class="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm table-fixed"><thead><tr class="bg-indigo-900 text-white font-black text-center border-b"><th class="p-1 w-6">#</th><th class="p-1 w-2/6 text-left">Route Agent</th><th class="p-1 w-1/6">Parties</th><th class="p-1 w-1/6">Sales</th><th class="p-1 w-1/6">Collected</th><th class="p-1 w-1/6 bg-indigo-950">Due (>10)</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
    if (agentsConsolidatedSummary.length === 0) {
      tableHtml += `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-bold">10 റിയാലിൽ കൂടുതൽ കുടിശ്ശികയുള്ള ഏജന്റുമാർ ഇല്ല</td></tr>`;
    } else {
      agentsConsolidatedSummary.forEach((r, idx) => {
        tableHtml += `<tr class="text-center hover:bg-slate-50"><td class="p-1">${idx + 1}</td><td class="p-1 text-left truncate">${formatShortName(r.name)}</td><td class="p-1 text-slate-700">${r.custCount}</td><td class="p-1 text-amber-700">${r.sales.toLocaleString('en-IN')}</td><td class="p-1 text-emerald-700">${r.paid.toLocaleString('en-IN')}</td><td class="p-1 font-black text-indigo-950">${r.closing.toLocaleString('en-IN')}</td></tr>`;
      });
    }
    tableHtml += `</tbody></table>`;
  } else if (type === 'agent' && !isAllAgentsMode) {
    tableHtml = `<table class="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm table-fixed"><thead><tr class="bg-indigo-900 text-white font-black text-center border-b"><th class="p-1 w-6">#</th><th class="p-1 w-2/6 text-left">Customer</th><th class="p-1 w-1/6">Opening</th><th class="p-1 w-1/6">Sales</th><th class="p-1 w-1/6">Paid</th><th class="p-1 w-1/6 bg-indigo-950">Due (>10)</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
    if (singleAgentCustomersSummary.length === 0) {
      tableHtml += `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-bold">ഈ ഏജന്റിന് കീഴിൽ 10 റിയാലിൽ കൂടുതൽ കുടിശ്ശികയുള്ള കസ്റ്റമർമാർ ഇല്ല</td></tr>`;
    } else {
      singleAgentCustomersSummary.forEach((r, idx) => {
        tableHtml += `<tr class="text-center hover:bg-slate-50"><td class="p-1">${idx + 1}</td><td class="p-1 text-left truncate">${formatShortName(r.name)}</td><td class="p-1">${r.opening.toLocaleString('en-IN')}</td><td class="p-1 text-amber-700">${r.sales.toLocaleString('en-IN')}</td><td class="p-1 text-emerald-700">${r.paid.toLocaleString('en-IN')}</td><td class="p-1 font-black text-indigo-950">${r.closing.toLocaleString('en-IN')}</td></tr>`;
      });
    }
    tableHtml += `</tbody></table>`;
  } else if (type === 'employee' && isAllEmployeesMode) {
    tableHtml = `<table class="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm table-fixed"><thead><tr class="bg-purple-900 text-white font-black text-center border-b"><th class="p-1 w-6">#</th><th class="p-1 w-2/6 text-left">Staff Name</th><th class="p-1 w-1/6">Salary</th><th class="p-1 w-1/6">Paid</th><th class="p-1 w-1/6 bg-purple-950">Pending (>10)</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
    if (employeesConsolidatedSummary.length === 0) {
      tableHtml += `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-bold">10 റിയാലിൽ കൂടുതൽ ശമ്പളം ബാക്കിയുള്ളവർ ഇല്ല</td></tr>`;
    } else {
      employeesConsolidatedSummary.forEach((r, idx) => {
        tableHtml += `<tr class="text-center hover:bg-slate-50"><td class="p-1">${idx + 1}</td><td class="p-1 text-left truncate">${formatShortName(r.name)}</td><td class="p-1">${r.salary.toLocaleString('en-IN')}</td><td class="p-1 text-emerald-700">${r.paid.toLocaleString('en-IN')}</td><td class="p-1 font-black text-purple-950">${r.closing.toLocaleString('en-IN')}</td></tr>`;
      });
    }
    tableHtml += `</tbody></table>`;
  } else if (isAllUtilityBillsMode) {
    tableHtml = `<table class="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm table-fixed"><thead><tr class="bg-amber-900 text-white font-black text-center border-b"><th class="p-1 w-6">#</th><th class="p-1 w-2/6 text-left">Utility/Bill</th><th class="p-1 w-1/6">Opening</th><th class="p-1 w-1/6">New Bills</th><th class="p-1 w-1/6">Paid</th><th class="p-1 w-1/6 bg-amber-950">Due (>10)</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
    if (utilitiesConsolidatedSummary.length === 0) {
      tableHtml += `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-bold">10 റിയാലിൽ കൂടുതൽ കുടിശ്ശികയുള്ള ബില്ലുകൾ ഇല്ല</td></tr>`;
    } else {
      utilitiesConsolidatedSummary.forEach((r, idx) => {
        tableHtml += `<tr class="text-center hover:bg-slate-50"><td class="p-1">${idx + 1}</td><td class="p-1 text-left truncate">${formatShortName(r.name)}</td><td class="p-1">${r.opening.toLocaleString('en-IN')}</td><td class="p-1 text-indigo-700">${r.bills.toLocaleString('en-IN')}</td><td class="p-1 text-emerald-700">${r.paid.toLocaleString('en-IN')}</td><td class="p-1 font-black text-amber-900">${r.closing.toLocaleString('en-IN')}</td></tr>`;
      });
    }
    tableHtml += `</tbody></table>`;
  } else {
    tableHtml = `<table class="w-full border-collapse bg-white rounded-xl overflow-hidden shadow-sm table-fixed"><thead><tr class="bg-indigo-900 text-white font-black text-center border-b"><th class="p-1 w-1/5 text-left">Date</th><th class="p-1 w-2/5 text-left">Particulars</th><th class="p-1 w-1/5">Paid</th><th class="p-1 w-1/5">Bill</th><th class="p-1 w-1/5">Balance</th></tr></thead><tbody class="divide-y divide-slate-100 font-bold">`;
    if (statementRows.length === 0) {
      tableHtml += `<tr><td colspan="5" class="p-4 text-center text-slate-400 font-bold">ഈ മാസത്തിൽ ഇടപാടുകൾ ഒന്നും ഇല്ല</td></tr>`;
    } else {
      statementRows.forEach(r => {
        let payStr = (r.cash + r.bank > 0) ? `${(r.cash + r.bank).toLocaleString('en-IN')}` : '-';
        let billStr = (r.bill > 0) ? `${r.bill.toLocaleString('en-IN')}` : '-';
        tableHtml += `<tr class="text-center hover:bg-slate-50"><td class="p-1 text-left text-slate-600">${r.date}</td><td class="p-1 text-left truncate" title="${r.desc}">${formatShortName(r.desc)}</td><td class="p-1 text-emerald-700 font-black">${payStr}</td><td class="p-1 text-amber-700 font-black">${billStr}</td><td class="p-1 font-black text-slate-950">${r.bal.toLocaleString('en-IN')}</td></tr>`;
      });
    }
    tableHtml += `</tbody></table>`;
  }

  const statTable = document.getElementById("statTableContainer");
  if (statTable) statTable.innerHTML = tableHtml;

  currentStatementDataForWA = {
    partyName: partyName,
    type: type,
    month: monthVal,
    openingBal: openingBal,
    totalSales: totalSalesOrBills,
    totalPaid: totalPaidOrCollected,
    closingBal: runningBal
  };
}
