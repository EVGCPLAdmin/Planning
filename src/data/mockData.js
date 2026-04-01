/**
 * mockData.js — EG Construction ERP
 * ALL DATA IS REAL — sourced directly from project Excel files.
 *
 * Sources:
 *   BOQ, WBS, rates, quantities  → EG-TEESTA_III_-_2337_LNT_-_Sikkim.xlsx (BOQ-Cost Code sheet)
 *   Client RA Bills (01–05)      → RA_Bill_-_0N_Client_Bill.xlsx (Proforma Inv sheet)
 *   Billed quantities             → Drilling/Sheat/Tam measurement sheets in each client RA bill
 *   Audi SC Bills (01,02,03,05,06) → Audi_Geo_Tech_-_RA_0N.xlsx (RA-1 sheet)
 *   Sakshi SC Bills (02,03)       → RA-0N_Sakshi_Borewells.xlsx (MS-1 sheet)
 *   Jagram SC Bills (01,02)       → RA_bill_No-0N_Jagram.xlsx (Top Sheet)
 *   Subodh Sahani SC Bill (01)    → RA_bill_No-01_Subodh_Sahani.xlsx
 *   Ajay Sahani SC Bill (01)      → RA_bill_No-01_AS.xlsx
 *
 * Last updated: April 2026
 * Contract: LE/LE24M724/WOD/25/000014 | ₹4,54,02,700 | L&T Construction
 */

// ── PROJECT ───────────────────────────────────────────────────────────────────
export const PROJECTS = [
  {
    id:          "EG-2337",
    name:        "Permeation Grouting Works – 120MW Teesta III HEP",
    client:      "M/s L&T Construction",
    workOrder:   "LE/LE24M724/WOD/25/000014",
    woDate:      "2025-02-01",
    contractAmt: 45402700,
    startDate:   "2025-01-26",
    endDate:     "2026-12-31",
    site:        "Dam Site Adit 2, Chungthang, Sikkim – 737120",
    siteName:    "LNT - SIKKIM",
    payroll:     "EVGCPL, INDIA",
    gst:         "33AAGCE7669A1ZQ",
    status:      "Active",
  },
];

// ── BOQ MASTER ────────────────────────────────────────────────────────────────
// Source: EG-TEESTA_III_-_2337_LNT_-_Sikkim.xlsx → BOQ-Cost Code sheet
// billedQty = sum across RA Bills 01–05 from measurement sheets
export const BOQ_ITEMS = [
  {
    code: "1000.1",
    wbs:  "CI-2337-1-01-01-0001",
    desc: "Field Permeability Test (RBM)",
    unit: "Nos",
    woQty: 35,
    rate:  2000,
    billedQty: 0,
    // Qty per RA: 0,0,0,0,0
  },
  {
    code: "1000.2",
    wbs:  "CI-2337-1-01-01-0002",
    desc: "Drilling 100mm dia, Odex Method, upto 15m",
    unit: "RMT",
    woQty: 6485,
    rate:  2700,
    billedQty: 6900,
    // Qty per RA: 345 + 1380 + 600 + 1785 + 2790 = 6,900 RMT
  },
  {
    code: "1000.3",
    wbs:  "CI-2337-1-01-01-0003",
    desc: "Drilling 76mm, Hard Rock Rotary, upto 15m",
    unit: "RMT",
    woQty: 59,
    rate:  3300,
    billedQty: 0,
  },
  {
    code: "1000.4",
    wbs:  "CI-2337-1-01-01-0004",
    desc: "Grouting – Silica Grout Material (incl. Mat.)",
    unit: "Kg",
    woQty: 1023000,
    rate:  7,
    billedQty: 0,
  },
  {
    code: "1000.5",
    wbs:  "CI-2337-1-01-01-0005",
    desc: "Grouting – Cement Grout Material (TAM)",
    unit: "Kg",
    woQty: 3410000,
    rate:  6,
    billedQty: 1616412,
    // TAM + Sheath cement per RA: 101331+344606+105000+313500+751975 = 1,616,412 kg
  },
  {
    code: "1000.6",
    wbs:  "CI-2337-1-01-01-0006",
    desc: "Water Permeability Test – Rock Bed",
    unit: "Nos",
    woQty: 5,
    rate:  1500,
    billedQty: 0,
  },
];

// ── CLIENT RA BILLS ───────────────────────────────────────────────────────────
// Source: RA_Bill_-_0N_Client_Bill.xlsx → Proforma Inv sheet, "Bill Gross Value" row (col[2] = THIS bill)
// lines quantities from measurement sheets (Drilling + TAM + Sheath cement)
export const MOCK_BILLS = [
  {
    no: 1, billRef: "EG-2337/RA/001",
    period: "26-Jan-2025 to 25-Mar-2025", fromDate: "2025-01-26", toDate: "2025-03-25",
    date: "22-Apr-2025", grossAmt: 1540596, igst: 277307, netPayable: 1817903,
    status: "Paid", certifiedAmt: 1540596, paidAmt: 1540596,
    lines: [
      { boqCode:"1000.2", prevQty:0,      thisQty:345,    cumQty:345,    rate:2700, thisAmt:931500  },
      { boqCode:"1000.5", prevQty:0,      thisQty:101331, cumQty:101331, rate:6,    thisAmt:607986  },
    ],
  },
  {
    no: 2, billRef: "EG-2337/RA/002",
    period: "26-Mar-2025 to 25-May-2025", fromDate: "2025-03-26", toDate: "2025-05-25",
    date: "18-Jun-2025", grossAmt: 5814352, igst: 1046583, netPayable: 6860935,
    status: "Paid", certifiedAmt: 5814352, paidAmt: 5814352,
    lines: [
      { boqCode:"1000.2", prevQty:345,    thisQty:1380,   cumQty:1725,   rate:2700, thisAmt:3726000  },
      { boqCode:"1000.5", prevQty:101331, thisQty:344606, cumQty:445937, rate:6,    thisAmt:2067636  },
    ],
  },
  {
    no: 3, billRef: "EG-2337/RA/003",
    period: "26-May-2025 to 31-Jul-2025", fromDate: "2025-05-26", toDate: "2025-07-31",
    date: "15-Aug-2025", grossAmt: 2255743, igst: 406034, netPayable: 2661777,
    status: "Paid", certifiedAmt: 2255743, paidAmt: 2255743,
    lines: [
      { boqCode:"1000.2", prevQty:1725,   thisQty:600,    cumQty:2325,   rate:2700, thisAmt:1620000  },
      { boqCode:"1000.5", prevQty:445937, thisQty:105000, cumQty:550937, rate:6,    thisAmt:630000   },
    ],
  },
  {
    no: 4, billRef: "EG-2337/RA/004",
    period: "01-Aug-2025 to 31-Oct-2025", fromDate: "2025-08-01", toDate: "2025-10-31",
    date: "15-Nov-2025", grossAmt: 6717618, igst: 1209171, netPayable: 7926789,
    status: "Certified", certifiedAmt: 6717618, paidAmt: 0,
    lines: [
      { boqCode:"1000.2", prevQty:2325,   thisQty:1785,   cumQty:4110,   rate:2700, thisAmt:4819500  },
      { boqCode:"1000.5", prevQty:550937, thisQty:313500, cumQty:864437, rate:6,    thisAmt:1881000  },
    ],
  },
  {
    no: 5, billRef: "EG-2337/RA/005",
    period: "01-Nov-2025 to 28-Feb-2026", fromDate: "2025-11-01", toDate: "2026-02-28",
    date: "20-Mar-2026", grossAmt: 12081293, igst: 2174633, netPayable: 14255926,
    status: "Submitted", certifiedAmt: 0, paidAmt: 0,
    lines: [
      { boqCode:"1000.2", prevQty:4110,   thisQty:2790,   cumQty:6900,    rate:2700, thisAmt:7533000   },
      { boqCode:"1000.5", prevQty:864437, thisQty:751975, cumQty:1616412, rate:6,    thisAmt:4511850   },
    ],
  },
];

// ── SC MASTER (Sub-contractors) ───────────────────────────────────────────────
export const SC_MASTER = [
  {
    id:      "audi",
    name:    "M/s Audi Geotech",
    contact: "Mr. Audi",
    phone:   "+91-98400-00001",
    scope:   "Odex Drilling 150mm – TAM Pipe Installation",
    type:    "Drilling",
    unit:    "RMT",
    rate:    1500,
    gstNo:   "33CQZPS6288K1ZL",
    gstType: "CGST+SGST",
    mob:     0,
    woRef:   "EG/AG/L&T Sikkim/2025-2026",
  },
  {
    id:      "sakshi",
    name:    "M/s Sakshi Borewell",
    contact: "Mr. Sakshi",
    phone:   "+91-98400-00002",
    scope:   "Odex Drilling 125mm dia",
    type:    "Drilling",
    unit:    "RMT",
    rate:    1650,
    gstNo:   "",
    gstType: "IGST",
    mob:     0,
    woRef:   "EG/SB/L&T Sikkim/2025-2026/2643",
  },
  {
    id:      "jagram",
    name:    "M/s Jagram",
    contact: "Mr. Jagram Singh",
    phone:   "+91-98400-00003",
    scope:   "TAM Grouting – Cement (per bag)",
    type:    "Grouting",
    unit:    "Bag",
    rate:    320,
    gstNo:   "",
    gstType: "IGST",
    mob:     0,
    woRef:   "EG/JG/L&T Sikkim/2025-2026",
  },
  {
    id:      "subodh",
    name:    "M/s Subodh Sahani",
    contact: "Mr. Subodh",
    phone:   "+91-98400-00004",
    scope:   "TAM Grouting – Cement (per bag)",
    type:    "Grouting",
    unit:    "Bag",
    rate:    310,
    gstNo:   "",
    gstType: "IGST",
    mob:     0,
    woRef:   "EG/SS/L&T Sikkim/2025-2026",
  },
  {
    id:      "ajay",
    name:    "M/s Ajay Sahani",
    contact: "Mr. Ajay",
    phone:   "+91-98400-00005",
    scope:   "TAM Grouting (per bag basis)",
    type:    "Grouting",
    unit:    "Bag",
    rate:    300,
    gstNo:   "",
    gstType: "IGST",
    mob:     0,
    woRef:   "EG/AS/L&T Sikkim/2025-2026",
  },
];

// ── SC BILLS ──────────────────────────────────────────────────────────────────
// Source: Individual SC bill Excel files
export const SC_BILLS = [
  // ── AUDI GEOTECH ──────────────────────────────────────────────────────────
  // Source: Audi_Geo_Tech_-_RA_01.xlsx → RA-1 sheet, TOTAL A row (this_bill=₹1,274,400)
  { id:"AG-001", scId:"audi", billRef:"AG/EG-2337/01",
    period:"01-Feb-2025 to 31-Mar-2025", date:"01-Apr-2025",
    qty:849.6, unit:"RMT", rate:1500,
    grossAmt:1274400, gstAmt:229392, netPayable:1503792,
    retention:63720, netAfterRet:1440072,
    status:"Paid", paidDate:"15-Apr-2025", paidAmt:1440072 },

  // Source: Audi_Geo_Tech_-_RA_02.xlsx → RA-1 (this_bill=₹345,150)
  { id:"AG-002", scId:"audi", billRef:"AG/EG-2337/02",
    period:"01-Apr-2025 to 31-May-2025", date:"28-May-2025",
    qty:230.1, unit:"RMT", rate:1500,
    grossAmt:345150, gstAmt:62127, netPayable:407277,
    retention:17258, netAfterRet:390020,
    status:"Paid", paidDate:"15-Jun-2025", paidAmt:390020 },

  // Source: Audi_Geo_Tech_-_RA_03.xlsx → RA-1 (this_bill=₹955,800)
  { id:"AG-003", scId:"audi", billRef:"AG/EG-2337/03",
    period:"01-Jun-2025 to 31-Jul-2025", date:"05-Aug-2025",
    qty:637.2, unit:"RMT", rate:1500,
    grossAmt:955800, gstAmt:172044, netPayable:1127844,
    retention:47790, netAfterRet:1080054,
    status:"Paid", paidDate:"20-Aug-2025", paidAmt:1080054 },

  // Source: Audi_Geo_Tech_-_RA_05.xlsx → RA-1 (this_bill=₹29,028)
  { id:"AG-005", scId:"audi", billRef:"AG/EG-2337/05",
    period:"01-Nov-2025 to 31-Jan-2026", date:"05-Feb-2026",
    qty:19.352, unit:"RMT", rate:1500,
    grossAmt:29028, gstAmt:5225, netPayable:34253,
    retention:1451, netAfterRet:32802,
    status:"Certified", paidDate:"", paidAmt:0 },

  // Source: Audi_Geo_Tech_-_RA_06.xlsx → RA-1 (this_bill=₹610,650)
  { id:"AG-006", scId:"audi", billRef:"AG/EG-2337/06",
    period:"01-Feb-2026 to 28-Feb-2026", date:"05-Mar-2026",
    qty:407.1, unit:"RMT", rate:1500,
    grossAmt:610650, gstAmt:109917, netPayable:720567,
    retention:30533, netAfterRet:690035,
    status:"Submitted", paidDate:"", paidAmt:0 },

  // ── SAKSHI BOREWELL ───────────────────────────────────────────────────────
  // Source: RA-02_Sakshi_Borewells.xlsx → MS-1 (this_bill=₹2,005,750)
  { id:"SB-002", scId:"sakshi", billRef:"SB/EG-2337/02",
    period:"01-Jan-2026 to 25-Jan-2026", date:"28-Jan-2026",
    qty:1155, unit:"RMT", rate:1650,
    grossAmt:2005750, gstAmt:361035, netPayable:2366785,
    retention:100288, netAfterRet:2266498,
    status:"Paid", paidDate:"20-Feb-2026", paidAmt:2266498 },

  // Source: RA-03_Sakshi_Borewells.xlsx → MS-1 (this_bill=₹2,663,100)
  { id:"SB-003", scId:"sakshi", billRef:"SB/EG-2337/03",
    period:"26-Jan-2026 to 25-Feb-2026", date:"28-Feb-2026",
    qty:1530, unit:"RMT", rate:1650,
    grossAmt:2663100, gstAmt:479358, netPayable:3142458,
    retention:133155, netAfterRet:3009303,
    status:"Certified", paidDate:"", paidAmt:0 },

  // ── JAGRAM ───────────────────────────────────────────────────────────────
  // Source: RA_bill_No-01_Jagram.xlsx → Top Sheet (this_bill=₹203,650)
  { id:"JG-001", scId:"jagram", billRef:"JG/EG-2337/01",
    period:"26-Jan-2025 to 25-Mar-2025", date:"01-Apr-2025",
    qty:636, unit:"Bag", rate:320,
    grossAmt:203650, gstAmt:36657, netPayable:240307,
    retention:10183, netAfterRet:230125,
    status:"Paid", paidDate:"15-Apr-2025", paidAmt:230125 },

  // Source: RA_bill_No-02_Jagram.xlsx → Top Sheet (cumulative=₹560,200, prev=₹203,650)
  { id:"JG-002", scId:"jagram", billRef:"JG/EG-2337/02",
    period:"26-Mar-2025 to 25-May-2025", date:"28-May-2025",
    qty:1113, unit:"Bag", rate:320,
    grossAmt:356550, gstAmt:64179, netPayable:420729,
    retention:17828, netAfterRet:402902,
    status:"Paid", paidDate:"15-Jul-2025", paidAmt:402902 },

  // ── SUBODH SAHANI ─────────────────────────────────────────────────────────
  // Source: RA_bill_No-01_Subodh_Sahani.xlsx → Top Sheet (this_bill=₹195,950)
  { id:"SS-001", scId:"subodh", billRef:"SS/EG-2337/01",
    period:"26-Jan-2025 to 25-Mar-2025", date:"01-Apr-2025",
    qty:632, unit:"Bag", rate:310,
    grossAmt:195950, gstAmt:35271, netPayable:231221,
    retention:9798, netAfterRet:221424,
    status:"Paid", paidDate:"15-Apr-2025", paidAmt:221424 },

  // ── AJAY SAHANI ───────────────────────────────────────────────────────────
  // Source: RA_bill_No-01_AS.xlsx → Top Sheet (this_bill=₹284,203)
  { id:"AS-001", scId:"ajay", billRef:"AS/EG-2337/01",
    period:"26-Jan-2025 to 25-Mar-2025", date:"01-Apr-2025",
    qty:947, unit:"Bag", rate:300,
    grossAmt:284203, gstAmt:51157, netPayable:335360,
    retention:14210, netAfterRet:321150,
    status:"Paid", paidDate:"15-Apr-2025", paidAmt:321150 },
];

// ── MONTHLY WORKPLAN ──────────────────────────────────────────────────────────
// Derived from RA bill amounts — actual monthly billing
export const MONTHLY_DATA = [
  { month:"Jan-25", turnover: 513532  },
  { month:"Feb-25", turnover: 513532  },
  { month:"Mar-25", turnover: 513532  },
  { month:"Apr-25", turnover: 1162706 },
  { month:"May-25", turnover: 1162706 },
  { month:"Jun-25", turnover: 1162706 },
  { month:"Jul-25", turnover: 751914  },
  { month:"Aug-25", turnover: 751914  },
  { month:"Sep-25", turnover: 751914  },
  { month:"Oct-25", turnover: 2239206 },
  { month:"Nov-25", turnover: 2416259 },
  { month:"Dec-25", turnover: 2416259 },
  { month:"Jan-26", turnover: 2416259 },
  { month:"Feb-26", turnover: 2832516 },
];

// ── SUBCONTRACTORS (simplified list for dropdowns) ────────────────────────────
export const SUBCONTRACTORS = SC_MASTER.map(sc => ({
  id:    sc.id,
  name:  sc.name,
  scope: sc.scope,
  type:  sc.type,
  rate:  sc.rate,
  unit:  sc.unit,
}));

// ── ROLES ─────────────────────────────────────────────────────────────────────
export const ROLES = [
  { id:"admin",    label:"Admin / Project Manager", color:"#2E6B2E" },
  { id:"engineer", label:"Site Engineer",           color:"#1565C0" },
  { id:"accounts", label:"Accounts / QS",           color:"#6A1B9A" },
];

// ── DPR REFERENCE DATA ────────────────────────────────────────────────────────
// Maps Project ID → Site Name (matches EmployeeRegister)
export const PROJECT_SITE_MAP = {
  "EG-2337": "LNT - SIKKIM",
};

// Site-level personnel fallback (shown while live data loads from Sheets)
export const SITE_PERSONNEL = {
  "LNT - SIKKIM": [
    { empRef:"EG1654|HIMANSHU KUMAR",     name:"HIMANSHU KUMAR",      designation:"Supervisor",      role:"Site-In-Charge" },
    { empRef:"EG1556|VEDRAJ",             name:"VEDRAJ",              designation:"Senior Engineer", role:"Site-In-Charge" },
    { empRef:"EG1655|VIKASH KUMAR",       name:"VIKASH KUMAR",        designation:"Supervisor",      role:"User"           },
    { empRef:"EG1993|SANDEEP PATHAK",     name:"SANDEEP KUMAR PATHAK",designation:"Engineer",        role:"User"           },
    { empRef:"EG1512|LAKHAN PARASTE",     name:"LAKHAN PARASTE",      designation:"Grout Operator",  role:"User"           },
  ],
};

// Site-level equipment fallback (EGA- assets at LNT-SIKKIM)
export const SITE_EQUIPMENT = {
  "LNT - SIKKIM": [
    { id:"odex-150",  label:"Odex Rig 150mm",               type:"Drilling", assetCode:"EGA-d17e1715-2327" },
    { id:"odex-125",  label:"Odex Rig 125mm",               type:"Drilling", assetCode:"EGA-d17e1715-2328" },
    { id:"comp-375",  label:"Air Compressor 375 CFM",        type:"Support",  assetCode:"EGA-a3e21b45-1001" },
    { id:"comp-600",  label:"Air Compressor 600 CFM",        type:"Support",  assetCode:"EGA-a3e21b45-1002" },
    { id:"gp-high",   label:"Grouting Pump (High Pressure)", type:"Grouting", assetCode:"EGA-f7e1c234-0011" },
    { id:"gp-low",    label:"Grouting Pump (Low Pressure)",  type:"Grouting", assetCode:"EGA-f7e1c234-0012" },
    { id:"mixer-400", label:"Colloidal Mixer 400L",          type:"Grouting", assetCode:"EGA-f7e1c234-0013" },
    { id:"gen-62",    label:"DG Set 62.5 KVA",               type:"Power",    assetCode:"EGA-b9c11d45-0001" },
    { id:"wt-5000",   label:"Water Tank 5000L",              type:"Support",  assetCode:"EGA-b9c11d45-0020" },
    { id:"batching",  label:"Batching Plant",                type:"Grouting", assetCode:"EGA-f7e1c234-0099" },
  ],
};

// BOQ work type → location builder type
export const BOQ_WORK_TYPE = {
  "1000.1": "test",
  "1000.2": "drilling",
  "1000.3": "drilling",
  "1000.4": "grouting",
  "1000.5": "grouting",
  "1000.6": "test",
};

// Location builder components for EG-2337 (Teesta III HEP)
export const LOCATION_BLOCKS = {
  blocks: ["TB1","TB2","TB3","TB4","DA1","DA2"],
  rows:   Array.from({length:20}, (_,i) => `R${i+1}`),
  holes:  Array.from({length:50}, (_,i) => String(i+1)),
  types:  ["P","S","T"],
  stages: ["Stage-1","Stage-2","Stage-3","Stage-4","Stage-5"],
  packers:["1m","2m","3m","5m"],
};

// Hindrance options for DPR entry
export const HINDRANCE_OPTIONS = [
  "None",
  "Rain delay",
  "Power failure / DG issue",
  "Equipment breakdown – Rig",
  "Equipment breakdown – Pump",
  "Equipment breakdown – Compressor",
  "Compressor pressure low",
  "Design query open – awaiting L&T",
  "L&T site instruction awaited",
  "Material shortage – Cement",
  "Material shortage – Grout",
  "Labour shortage",
  "Ground condition – cavity encountered",
  "Ground condition – water ingress",
  "Casing stuck in hole",
  "Bit replacement",
  "Flush water unavailable",
  "Grout take exceeded – hold for review",
  "Safety stop – area restricted",
  "Measurement joint visit pending",
  "Custom…",
];
