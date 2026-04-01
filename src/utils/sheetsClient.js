/**
 * sheetsClient.js — EG Construction ERP
 * All reads and writes go through sheetsProxy.gs (Apps Script Web App).
 * No Google Cloud API key required.
 */

const PROXY_URL    = import.meta.env.VITE_SHEETS_PROXY_URL;
const PROXY_SECRET = import.meta.env.VITE_SHEETS_PROXY_SECRET;

const IDS = {
  ERP:       import.meta.env.VITE_SHEET_ERP       || "1CPCuzkSPGc3reoX2iTVLZX-hzB0NvmSudXtjoFhP34Q",
  SECRETS:   import.meta.env.VITE_SHEET_SECRETS   || "1hN4VEDNpVLD3lKuBPYCTOaViv7UpveRfud2d2gy15D0",
  EMPLOYEES: import.meta.env.VITE_SHEET_EMPLOYEES || "1HWKZPhKRhcuvxBgyyN8zRt8p-SzYmKjJWiOdCgykBHs",
  ACCOUNTS:  import.meta.env.VITE_SHEET_ACCOUNTS  || "1mLddxLRf719EaXE9XSET9gT8l0a8Cxns362yIbHo63g",
  MASTER:    import.meta.env.VITE_SHEET_MASTER    || "1B2wb38KhNwlLoZnsAGWQkO0FdEGFFfsh3ycRRurigq4",
  PURCHASE:  import.meta.env.VITE_SHEET_PURCHASE  || "1zcqF2tjjBETPuW25c9MBMo0zakBIBD6tksg5OstFA7c",
  STORES:    import.meta.env.VITE_SHEET_STORES    || "1iMQxgqGilUh2_3NCZl5D-EMt-NC8FwugX83q2fWb8fE",
};

// Simple in-memory cache — avoids re-fetching same tab within a session
const CACHE = new Map();

async function proxyPost(body) {
  if (!PROXY_URL) throw new Error("VITE_SHEETS_PROXY_URL is not set in .env.local");
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, // text/plain avoids CORS preflight
    body: JSON.stringify({ secret: PROXY_SECRET, ids: IDS, ...body }),
  });
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
  const json = await res.json();
  if (!json.ok && json.error) throw new Error(json.error);
  return json;
}

async function readSheet(spreadsheetId, tabName, { filterCol, filterVal, limit, bustCache } = {}) {
  const key = `${spreadsheetId}::${tabName}::${filterCol}::${filterVal}`;
  if (!bustCache && CACHE.has(key)) return CACHE.get(key);
  const res = await proxyPost({ action:"read", data:{ spreadsheetId, tabName, filterCol, filterVal, limit }});
  CACHE.set(key, res.rows || []);
  return res.rows || [];
}

export function clearCache() { CACHE.clear(); }

// ── Helpers ───────────────────────────────────────────────────────────────────
export function parseEmpRef(empRef) {
  const parts = (empRef||"").split("|");
  return { code:(parts[0]||"").trim(), name:(parts[1]||"").trim() };
}
export function parseVendorRef(vendorRef) {
  const parts = (vendorRef||"").split("|");
  return { name:(parts[0]||"").trim(), code:(parts[1]||"").trim() };
}
export function fmtLakhs(n) {
  const v = parseFloat(n||0);
  if (v >= 10000000) return "₹"+(v/10000000).toFixed(2)+" Cr";
  if (v >= 100000)   return "₹"+(v/100000).toFixed(2)+" L";
  return "₹"+Math.round(v).toLocaleString("en-IN");
}
export function generateId(prefix="") {
  const hex = crypto.randomUUID().replace(/-/g,"").slice(0,8);
  return prefix ? `${prefix}-${hex}` : hex;
}
export function getCurrentFY() {
  const now=new Date(), year=now.getFullYear(), apr=now.getMonth()>=3;
  const start=apr?year:year-1;
  return `${String(start).slice(2)}-${String(start+1).slice(2)}`;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function authenticateWithPIN(email, pin) {
  return proxyPost({ action:"authenticate", data:{ email, pin }, ids:IDS });
}

// ── ERP Template reads ────────────────────────────────────────────────────────
export async function fetchBOQItems(projectId) {
  const rows = await readSheet(IDS.ERP, "BOQ_MASTER");
  return projectId ? rows.filter(r => r["Project_ID"] === projectId) : rows;
}

export async function fetchSCMaster(projectId) {
  const rows = await readSheet(IDS.ERP, "SC_MASTER");
  return projectId ? rows.filter(r => r["Project_ID"] === projectId) : rows;
}

export async function fetchProjects() {
  return readSheet(IDS.ERP, "PROJECTS");
}

export async function fetchDPRLog(projectId, limit=500) {
  const rows = await readSheet(IDS.ERP, "DPR_LOG", { bustCache:true });
  const filtered = projectId ? rows.filter(r => r["Project_ID"] === projectId) : rows;
  return filtered.slice(0, limit);
}

export async function fetchRABills(projectId) {
  const rows = await readSheet(IDS.ERP, "RA_BILLS", { bustCache:true });
  return projectId ? rows.filter(r => r["Project_ID"] === projectId) : rows;
}

export async function fetchSCBills(projectId) {
  const rows = await readSheet(IDS.ERP, "SC_BILLS", { bustCache:true });
  return projectId ? rows.filter(r => r["Project_ID"] === projectId) : rows;
}

export async function fetchWorkplanAmt(projectId) {
  const rows = await readSheet(IDS.ERP, "WORKPLAN_AMT");
  return projectId ? rows.filter(r => r["Project_ID"] === projectId) : rows;
}

// ── Employee / User reads ─────────────────────────────────────────────────────
export async function fetchEmployees({ site="", role="", currentOnly=true } = {}) {
  let rows = await readSheet(IDS.EMPLOYEES, "0_EmployeeRegister_Live");
  if (currentOnly) rows = rows.filter(r => r["Employee Status"] === "CURRENT");
  if (site)  rows = rows.filter(r => r["Site Name"]?.toLowerCase().includes(site.toLowerCase()));
  if (role)  rows = rows.filter(r => (r["Role (User Type)"]||"").includes(role));
  return rows;
}

export async function fetchEmployeeByEmail(email) {
  const rows = await readSheet(IDS.EMPLOYEES, "0_EmployeeRegister_Live");
  return rows.find(r =>
    [r["Mail ID"],r["E-Mail"],r["User Email"]].some(e => (e||"").toLowerCase() === email.toLowerCase())
  ) || null;
}

// ── Master reads ──────────────────────────────────────────────────────────────
export async function fetchSiteMaster() {
  return readSheet(IDS.MASTER, "5-SiteMaster");
}

export async function fetchVendors() {
  return readSheet(IDS.MASTER, "7-VendorMaster");
}

export async function fetchSubContractors() {
  return readSheet(IDS.MASTER, "10-SubContractorMaster");
}

export async function fetchBillingMaster() {
  const rows = await readSheet(IDS.MASTER, "1-BillingMaster");
  return rows.filter(r => (r["Active/Inactive?"]||"").toUpperCase() === "ACTIVE");
}

// ── Accounts reads ────────────────────────────────────────────────────────────
export async function fetchPaymentRequests({ site="", monthYear="", status="", paymentTo="", limit=1000 } = {}) {
  let rows = await readSheet(IDS.ACCOUNTS, "PaymentRequest", { bustCache:true });
  if (site)      rows = rows.filter(r => r["Site Name"]?.toLowerCase().includes(site.toLowerCase()));
  if (monthYear) rows = rows.filter(r => r["Month-Year"] === monthYear);
  if (paymentTo) rows = rows.filter(r => r["Payment To"]?.toLowerCase() === paymentTo.toLowerCase());
  if (status === "paid")     rows = rows.filter(r => r["Accounts Status"] === "Payment Completed");
  if (status === "rejected") rows = rows.filter(r => (r["Accounts Status"]||"").startsWith("Reject"));
  if (status === "pending")  rows = rows.filter(r => !r["Accounts Status"] || (!r["Accounts Status"].includes("Completed") && !r["Accounts Status"].startsWith("Reject")));
  return [...rows].reverse().slice(0, limit);
}

// ── Purchase reads ────────────────────────────────────────────────────────────
export async function fetchMRS({ site="", fy="", limit=500 } = {}) {
  let rows = await readSheet(IDS.PURCHASE, "MRS");
  if (site) rows = rows.filter(r => r["Requested For"]?.toLowerCase().includes(site.toLowerCase()));
  if (fy)   rows = rows.filter(r => r["Financial Year"] === fy);
  return rows.slice(0, limit);
}

export async function fetchPurchaseOrders({ site="", fy="", limit=200 } = {}) {
  let rows = await readSheet(IDS.PURCHASE, "PO");
  if (site) rows = rows.filter(r => r["Site Name"]?.toLowerCase().includes(site.toLowerCase()));
  if (fy)   rows = rows.filter(r => r["Financial Year"] === fy);
  return rows.slice(0, limit);
}

// ── Stores / Inventory reads ──────────────────────────────────────────────────
export async function fetchStockLevels({ site="", nonZero=false } = {}) {
  let rows = await readSheet(IDS.STORES, "StockLevels");
  if (site)    rows = rows.filter(r => r["Site Name"]?.toLowerCase().includes(site.toLowerCase()));
  if (nonZero) rows = rows.filter(r => parseFloat(r["Site Stock"]||0) > 0);
  return rows.map(r => ({
    ...r,
    siteStock: parseFloat(r["Site Stock"]||0),
    stockIn:   parseFloat(r["StockIN"]||0),
    stockOut:  parseFloat(r["Stock Out"]||0),
    partType:  getPartType(r["Part Details"]),
  }));
}

function getPartType(code) {
  if (!code) return "Other";
  if (code.startsWith("EGA-"))     return "Asset";
  if (code.startsWith("HOv1-"))    return "HO Item";
  if (code.startsWith("SL_Rec-"))  return "Store Ledger";
  if (code.startsWith("Existing-"))return "Legacy";
  return "Other";
}

// ── Writes ────────────────────────────────────────────────────────────────────
export async function writeDPREntry(row, projectId) {
  clearCache();
  return proxyPost({ action:"appendDPR", data:{ row, projectId } });
}

export async function writeRABill(row, lines) {
  clearCache();
  return proxyPost({ action:"appendRABill", data:{ row, lines } });
}

export async function writeSCBill(row) {
  clearCache();
  return proxyPost({ action:"appendSCBill", data:{ row } });
}

export async function markPaymentPaid(uuid, utrDetails, accountsDate) {
  clearCache();
  return proxyPost({ action:"markPaid", data:{ uuid, utrDetails, accountsDate } });
}

export async function rejectPayment(uuid, remarks) {
  clearCache();
  return proxyPost({ action:"rejectPayment", data:{ uuid, remarks } });
}

export async function updateRow(spreadsheetId, tabName, uuid, fields) {
  clearCache();
  return proxyPost({ action:"update", spreadsheetId, tabName, data:{ uuid, fields } });
}

export default {
  authenticateWithPIN,
  fetchBOQItems, fetchSCMaster, fetchProjects,
  fetchDPRLog, fetchRABills, fetchSCBills, fetchWorkplanAmt,
  fetchEmployees, fetchEmployeeByEmail,
  fetchSiteMaster, fetchVendors, fetchSubContractors, fetchBillingMaster,
  fetchPaymentRequests, fetchMRS, fetchPurchaseOrders, fetchStockLevels,
  writeDPREntry, writeRABill, writeSCBill,
  markPaymentPaid, rejectPayment, updateRow,
  parseEmpRef, parseVendorRef, fmtLakhs, generateId, getCurrentFY, clearCache,
};
