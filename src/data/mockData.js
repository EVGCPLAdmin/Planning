export const PROJECTS = [
  {
    id: "EG-2337",
    name: "Teesta III – Permeation Grouting",
    fullName: "Permeation Grouting Works – 120MW Teesta III HEP",
    client: "M/s Larsen & Toubro Limited Construction",
    location: "Dam Site Adit 2, Theng Busty, Chungthang, Sikkim – 737120",
    wo: "LE/LE24M724/WOD/25/000014",
    woDate: "01-Feb-2025",
    gstin: "33AADFE5468R2ZU",
    clientGstin: "11AAACL0140P1ZW",
    start: "2025-01-26",
    end: "2026-12-31",
    status: "Active",
    contractValue: 45402700,
    igstPct: 18,
    retentionPct: 5,
    advRecoveryPct: 10,
    tdsPct: 2,
  },
  {
    id: "EG-XXXX",
    name: "New Project – Add Details",
    fullName: "Configure in CONFIG sheet",
    client: "Client TBD",
    location: "Location TBD",
    wo: "WO-TBD",
    woDate: "",
    gstin: "33AADFE5468R2ZU",
    clientGstin: "",
    start: "",
    end: "",
    status: "Pipeline",
    contractValue: 0,
    igstPct: 18,
    retentionPct: 5,
    advRecoveryPct: 10,
    tdsPct: 2,
  },
];

export const BOQ_ITEMS = [
  { code: "1000.1", wbs: "CI-2337-1-01-01-0001", desc: "Field Permeability Test (RBM)",                          unit: "Nos",  woQty: 35,      rate: 2000, billedQty: 0       },
  { code: "1000.2", wbs: "CI-2337-1-01-01-0002", desc: "Drilling 100mm dia, Odex Method, upto 15m",             unit: "RMT",  woQty: 6485,    rate: 2700, billedQty: 6900    },
  { code: "1000.3", wbs: "CI-2337-1-01-01-0003", desc: "Drilling 76mm, Hard Rock Rotary, upto 15m",             unit: "RMT",  woQty: 59,      rate: 3300, billedQty: 0       },
  { code: "1000.4", wbs: "CI-2337-1-01-01-0004", desc: "Grouting – Silica Grout Material (incl. Mat.)",         unit: "Kg",   woQty: 1023000, rate: 7,    billedQty: 0       },
  { code: "1000.5", wbs: "CI-2337-1-01-01-0005", desc: "Grouting – Cement Grout Material (TAM)",                unit: "Kg",   woQty: 3410000, rate: 6,    billedQty: 1616412 },
  { code: "1000.6", wbs: "CI-2337-1-01-01-0006", desc: "Water Permeability Test – Rock Bed",                    unit: "Nos",  woQty: 5,       rate: 1500, billedQty: 0       },
  // billedQty sourced from RA Bills 01–05 (Client Bills), extracted Apr-2026
  // 1000.2: 345+1380+600+1785+2790 = 6,900 RMT (drilling metres per hole measurement sheets)
  // 1000.5: TAM + Sheath cement = 101,331+344,606+105,000+313,500+751,975 = 1,616,412 kg
];

export const SUBCONTRACTORS = [
  { id: "audi",   name: "M/s Audi Geotech",      scope: "Drilling (PRW)",             type: "PRW", rate: 1500, unit: "RMT" },
  { id: "sakshi", name: "M/s Sakshi Borewell",   scope: "Drilling 125mm (PRW)",       type: "PRW", rate: 1650, unit: "RMT" },
  { id: "jagram", name: "M/s Jagram",            scope: "TAM Grouting – Cement",      type: "PRW", rate: 0,    unit: "Bag" },
  { id: "subodh", name: "M/s Subodh Sahani",     scope: "TAM Grouting – Cement",      type: "PRW", rate: 0,    unit: "Bag" },
  { id: "ajay",   name: "M/s Ajay Sahani",       scope: "TAM Grouting",               type: "PRW", rate: 0,    unit: "Bag" },
];



export const ROLES = [
  { id: "admin",    label: "Admin / Project Manager", color: "#2E6B2E" },
  { id: "engineer", label: "Site Engineer",           color: "#1565C0" },
  { id: "accounts", label: "Accounts / QS",           color: "#6A1B9A" },
];

export const MONTHLY_DATA = [
  { month: "Jan-25", turnover: 1207609 },
  { month: "Feb-25", turnover: 1417598 },
  { month: "Mar-25", turnover: 1900889 },
  { month: "Apr-25", turnover: 867309  },
  { month: "May-25", turnover: 1471586 },
  { month: "Jun-25", turnover: 1427597 },
  { month: "Jul-25", turnover: 1494155 },
  { month: "Aug-25", turnover: 1799795 },
  { month: "Sep-25", turnover: 1652780 },
  { month: "Oct-25", turnover: 1806129 },
  { month: "Nov-25", turnover: 1747339 },
  { month: "Dec-25", turnover: 1246317 },
  { month: "Jan-26", turnover: 1144815 },
  { month: "Feb-26", turnover: 929946  },
  { month: "Mar-26", turnover: 600000  },
];

export const SC_MASTER = [
  { id:"audi",   name:"M/s Audi Geotech",    contact:"Mr. Audi",        phone:"+91-98400-00001", scope:"Odex Drilling 150mm – TAM Pipe Installation", type:"PRW", rate:1500, unit:"RMT", gstNo:"33XXXXXX001", gstType:"CGST+SGST", mob:100000 },
  { id:"sakshi", name:"M/s Sakshi Borewell",  contact:"Mr. Sakshi",      phone:"+91-98400-00002", scope:"Odex Drilling 125mm dia",                      type:"PRW", rate:1650, unit:"RMT", gstNo:"33XXXXXX002", gstType:"IGST",       mob:100000 },
  { id:"jagram", name:"M/s Jagram",           contact:"Mr. Jagram Singh", phone:"+91-98400-00003", scope:"TAM Grouting – Cement (per bag)",               type:"PRW", rate:320,  unit:"Bag", gstNo:"",           gstType:"IGST",       mob:0 },
  { id:"subodh", name:"M/s Subodh Sahani",    contact:"Mr. Subodh",       phone:"+91-98400-00004", scope:"TAM Grouting – Cement (per bag)",               type:"PRW", rate:310,  unit:"Bag", gstNo:"",           gstType:"IGST",       mob:0 },
  { id:"ajay",   name:"M/s Ajay Sahani",      contact:"Mr. Ajay",         phone:"+91-98400-00005", scope:"TAM Grouting (per bag basis)",                  type:"PRW", rate:300,  unit:"Bag", gstNo:"",           gstType:"IGST",       mob:0 },
];


// ── Site-level reference data (cascades from Project → Site) ─────────────────

// Maps Project ID → canonical site name (matches EmployeeRegister "Site Name" column)
export const PROJECT_SITE_MAP = {
  "EG-2337": "LNT - SIKKIM",
  "EG-XXXX": "HEAD OFFICE",
};

// Personnel per site: subset of EmployeeRegister for demo
// In live mode, fetchEmployees({ site: siteName }) replaces this
export const SITE_PERSONNEL = {
  "LNT - SIKKIM": [
    { empRef:"EG1654|HIMANSHU KUMAR",    name:"HIMANSHU KUMAR",     designation:"Supervisor",      role:"Site-In-Charge" },
    { empRef:"EG1556|VEDRAJ",            name:"VEDRAJ",             designation:"Senior Engineer", role:"Site-In-Charge" },
    { empRef:"EG1655|VIKASH KUMAR",      name:"VIKASH KUMAR",       designation:"Supervisor",      role:"User"           },
    { empRef:"EG1993|SANDEEP PATHAK",    name:"SANDEEP KUMAR PATHAK",designation:"Engineer",       role:"User"           },
    { empRef:"EG1512|LAKHAN PARASTE",    name:"LAKHAN PARASTE",     designation:"Grout Operator",  role:"User"           },
  ],
  "HEAD OFFICE": [
    { empRef:"EG0002|KESAVAMOORTHY",  name:"KESAVAMOORTHY",  designation:"MD",      role:"Admin" },
    { empRef:"EG0028|J KARTHIK",      name:"J KARTHIK",      designation:"Manager", role:"RM"    },
    { empRef:"EG0008|BOOPATHY K",     name:"BOOPATHY K",     designation:"Sr. Engineer", role:"RM" },
  ],
};

// Equipment / Assets per site (EGA- assets + standard equipment)
// In live mode, fetchStockLevels({ site, nonZero: true }) filtered for EGA- prefix
export const SITE_EQUIPMENT = {
  "LNT - SIKKIM": [
    { id:"odex-150",  label:"Odex Rig 150mm",              type:"Drilling",  assetCode:"EGA-d17e1715-2327" },
    { id:"odex-125",  label:"Odex Rig 125mm",              type:"Drilling",  assetCode:"EGA-d17e1715-2328" },
    { id:"comp-375",  label:"Air Compressor 375 CFM",      type:"Support",   assetCode:"EGA-a3e21b45-1001" },
    { id:"comp-600",  label:"Air Compressor 600 CFM",      type:"Support",   assetCode:"EGA-a3e21b45-1002" },
    { id:"gp-high",   label:"Grouting Pump (High Pressure)",type:"Grouting", assetCode:"EGA-f7e1c234-0011" },
    { id:"gp-low",    label:"Grouting Pump (Low Pressure)", type:"Grouting", assetCode:"EGA-f7e1c234-0012" },
    { id:"mixer-400", label:"Colloidal Mixer 400L",         type:"Grouting", assetCode:"EGA-f7e1c234-0013" },
    { id:"gen-62",    label:"DG Set 62.5 KVA",             type:"Power",     assetCode:"EGA-b9c11d45-0001" },
    { id:"wt-5000",   label:"Water Tank 5000L",            type:"Support",   assetCode:"EGA-b9c11d45-0020" },
    { id:"batching",  label:"Batching Plant",              type:"Grouting",  assetCode:"EGA-f7e1c234-0099" },
  ],
};

// Location helpers: structured templates per BOQ work type
// Used to build the Hole ID / Location string
export const BOQ_WORK_TYPE = {
  "1000.1": "test",      // Permeability Test
  "1000.2": "drilling",  // Drilling
  "1000.3": "drilling",
  "1000.4": "grouting",  // Grouting – Silica
  "1000.5": "grouting",  // Grouting – Cement
  "1000.6": "test",      // Water Permeability Test
};

// Common hindrance options
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
  "Rod change / coupling issue",
  "Flush water unavailable",
  "Grout take exceeded – hold for review",
  "Safety stop – area restricted",
  "Measurement joint visit pending",
  "Custom…",
];

// Tunnel block / section identifiers for EG-2337 Teesta III
export const LOCATION_BLOCKS = {
  blocks: ["TB1","TB2","TB3","TB4","DA1","DA2"],  // Tunnel Block / Dam Adit
  rows:   Array.from({length:20},(_,i)=>`R${i+1}`),
  holes:  Array.from({length:50},(_,i)=>String(i+1)),
  types:  ["P","S","T"],  // Primary / Secondary / Tertiary
  stages: ["Stage-1","Stage-2","Stage-3","Stage-4","Stage-5"],
  packers:["1m","2m","3m","5m"],
};
