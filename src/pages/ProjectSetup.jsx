/**
 * ProjectSetup.jsx — EG Construction ERP
 *
 * Linked to: ProjectSetup_v1 spreadsheet
 * Sheet ID:  1dQow9nD4e0qVOSfpwEWQmPTuhF3FW_8r1oK5dMjJlRE
 * Tab:       Project
 *
 * 45-column schema (exact order):
 * UUID | Company | Awarded Date | Private/Govt | Series | Project Code |
 * Project Name | Client Name | Work Order Number | WO Date | Contract Amount |
 * PAN | TAN | GST | Site Name | Site Address Line 1 | Site Address Line 2 |
 * Site Address Line 3 | Address | City | State | Country | Pin Code |
 * Purchase Billing Under | Payroll Under | Email ID | Contact 1 | Contact 2 |
 * Contact 3 | WebSite | Location | Delivery Address | Start Date | End Date |
 * Site In Charge Name | Reporting Manager Name | Planning In-Charge |
 * Mess In-Charge | Accounts In-Charge | Attendance In-Charge |
 * SC Attendance In-Charge | UserEmail | SystemEmail | Timestamp | Active/Inactive?
 */

import { useState, useEffect } from "react";
import {
  Plus, Edit2, Save, X, ChevronDown, ChevronUp,
  Building2, FileText, Users, AlertCircle, CheckCircle2,
  Trash2, IndianRupee, MapPin, Phone, Mail,
  Calendar, Hash, Briefcase, Layers, RefreshCw,
  Globe, Navigation, UserCheck
} from "lucide-react";

const G = "#2E6B2E", GD = "#1A3F1A", GL = "#EBF5EB";

const fmt  = n => "₹" + Math.round(n||0).toLocaleString("en-IN");
const fmtCr = n => {
  const v = Math.abs(n||0);
  return "₹" + (v>=10000000?(v/10000000).toFixed(3)+" Cr":v>=100000?(v/100000).toFixed(2)+"L":Math.round(v).toLocaleString("en-IN"));
};

function F({ label, required, children, hint, span2 }) {
  return (
    <div style={{ gridColumn: span2 ? "span 2" : "span 1" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <label style={{ fontSize:12, fontWeight:500, color:"var(--color-text-secondary)" }}>
          {label}{required && <span style={{ color:"#E53935" }}> *</span>}
        </label>
        {hint && <span style={{ fontSize:10, color:"var(--color-text-tertiary)", maxWidth:200, textAlign:"right" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inp = (err) => ({
  width:"100%", padding:"8px 10px", borderRadius:7,
  border:`0.5px solid ${err?"#E53935":"var(--color-border-secondary)"}`,
  background:"var(--color-background-primary)", fontSize:13,
  fontFamily:"inherit", color:"var(--color-text-primary)", boxSizing:"border-box", outline:"none",
});

function Section({ title, icon:Icon, children, defaultOpen=true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, overflow:"hidden", marginBottom:16 }}>
      <button onClick={()=>setOpen(!open)}
        style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 16px", background:"var(--color-background-secondary)", border:"none",
          cursor:"pointer", color:"var(--color-text-primary)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:600, fontSize:14 }}>
          {Icon && <Icon size={15} color={G}/>}{title}
        </div>
        {open ? <ChevronUp size={16} color="var(--color-text-tertiary)"/> : <ChevronDown size={16} color="var(--color-text-tertiary)"/>}
      </button>
      {open && <div style={{ padding:16 }}>{children}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  const active = (status||"").toUpperCase() === "ACTIVE";
  return (
    <span style={{ background:active?GL:"#FEECEC", color:active?G:"#C62828",
      padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:500 }}>
      {active ? "Active" : "Inactive"}
    </span>
  );
}

const EMPTY = {
  uuid:"", company:"EG-PALLIPALAYAM", awardedDate:"", projectType:"Private", series:"",
  id:"", name:"", client:"", workOrder:"", woDate:"", contractAmt:"",
  pan:"", tan:"", gst:"", siteName:"",
  siteAddr1:"", siteAddr2:"", siteAddr3:"",
  city:"", state:"", country:"India", pinCode:"",
  purchaseBilling:"EVERGREEN ENTERPRISES", payroll:"EVERGREEN ENTERPRISES",
  email:"", contact1:"", contact2:"", contact3:"",
  website:"", location:"", deliveryAddress:"",
  startDate:"", endDate:"",
  siteInCharge:"", reportingManager:"", planningInCharge:"",
  messInCharge:"", accountsInCharge:"", attendanceInCharge:"", scAttendance:"",
  userEmail:"", systemEmail:"", status:"ACTIVE",
};

const PROJECT_TYPES = ["Private", "Government"];
const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jammu & Kashmir","Jharkhand","Karnataka","Kerala",
  "Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
  "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttarakhand",
  "Uttar Pradesh","West Bengal","Delhi","Ladakh","Chandigarh","Puducherry","UTTRAKHAND",
];
const COMPANIES = ["EG-PALLIPALAYAM","EG-HONAD INDUSTRIAL AREA","EVERGREEN ENTERPRISES"];
const BILLING_ENTITIES = ["EVERGREEN ENTERPRISES","EG-PALLIPALAYAM","EG-HONAD INDUSTRIAL AREA"];

// ═══════════════════════════════════════════════════════════════════════════
export default function ProjectSetup({ projects, setProjects, onProjectSelect, user }) {
  const [view, setView]     = useState("list");
  const [editId, setEditId] = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState(null);
  const [activeTab, setActiveTab] = useState("identity");

  const showToast = (msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3500);
  };

  // ── Load projects from sheet on mount ────────────────────────────────────
  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    setLoading(true);
    try {
      const { fetchProjectsFromSheet, mapSheetRowToProject } = await import("../utils/sheetsClient");
      const rows = await fetchProjectsFromSheet();
      if (rows && rows.length > 0) {
        const mapped = rows.map(mapSheetRowToProject);
        setProjects(mapped);
      }
    } catch(e) {
      showToast("Could not load projects from sheet: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // ── Open create ───────────────────────────────────────────────────────────
  function openCreate() {
    setForm({ ...EMPTY });
    setErrors({});
    setActiveTab("identity");
    setView("create");
  }

  // ── Open edit ─────────────────────────────────────────────────────────────
  function openEdit(proj) {
    setForm({ ...EMPTY, ...proj });
    setErrors({});
    setEditId(proj.uuid || proj.id);
    setActiveTab("identity");
    setView("edit");
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.id.trim())       e.id       = "Required";
    if (!form.name.trim())     e.name     = "Required";
    if (!form.siteName.trim()) e.siteName = "Required — this is the data filter key";
    if (!form.company.trim())  e.company  = "Required";
    setErrors(e);
    if (Object.keys(e).length > 0) { setActiveTab("identity"); return false; }
    return true;
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) { showToast("Fix required fields", "error"); return; }
    setSaving(true);

    const uuid = form.uuid || "EGA-" + Math.random().toString(16).slice(2,10);
    const proj = { ...form, uuid, contractAmt: Number(form.contractAmt)||0 };

    try {
      const sc = await import("../utils/sheetsClient");
      if (view === "edit" && form.uuid) {
        await sc.updateProjectInSheet(proj, user?.email || "");
        setProjects(prev => prev.map(p => p.uuid === form.uuid ? proj : p));
        showToast(`${proj.id} — ${proj.name} updated`);
      } else {
        await sc.saveProjectToSheet(proj, user?.email || "");
        setProjects(prev => [...prev, proj]);
        showToast(`${proj.id} — ${proj.name} created`);
      }
    } catch(e) {
      showToast("Save failed: " + e.message, "error");
    }

    setSaving(false);
    setView("list");
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (view === "list") {
    const active   = projects.filter(p => (p.status||"ACTIVE").toUpperCase() === "ACTIVE");
    const inactive = projects.filter(p => (p.status||"ACTIVE").toUpperCase() !== "ACTIVE");

    return (
      <div style={{ padding:24 }}>
        {toast && (
          <div style={{ position:"fixed", top:64, right:24, background:toast.type==="error"?"#C62828":G, color:"white", padding:"10px 18px", borderRadius:8, fontSize:13, display:"flex", alignItems:"center", gap:8, zIndex:200, boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
            {toast.type==="error"?<AlertCircle size={14}/>:<CheckCircle2 size={14}/>}{toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <h2 style={{ margin:"0 0 2px", fontSize:20, fontWeight:700 }}>Project Setup</h2>
            <p style={{ margin:0, fontSize:12, color:"var(--color-text-tertiary)" }}>
              {active.length} active · {inactive.length} inactive ·
              Linked to ProjectSetup_v1 → Project tab
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={loadProjects} disabled={loading}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 14px", background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:7, fontSize:13, cursor:"pointer", color:"var(--color-text-secondary)" }}>
              <RefreshCw size={13} style={{ animation:loading?"spin 1s linear infinite":"none" }}/>
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button onClick={openCreate}
              style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 20px", background:G, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" }}>
              <Plus size={15}/>New Project
            </button>
          </div>
        </div>

        {/* Project cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(400px,1fr))", gap:16 }}>
          {active.map(proj => (
            <div key={proj.uuid||proj.id} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"1.25rem", display:"flex", flexDirection:"column", gap:12 }}>

              {/* Header row */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:13, color:G, fontFamily:"monospace" }}>{proj.id}</span>
                    <span style={{ fontSize:10, background:"var(--color-background-secondary)", padding:"1px 7px", borderRadius:20, color:"var(--color-text-tertiary)" }}>{proj.projectType||"Private"}</span>
                    <StatusPill status={proj.status}/>
                  </div>
                  <p style={{ margin:0, fontSize:14, fontWeight:600 }}>{proj.name}</p>
                  {proj.client && <p style={{ margin:"2px 0 0", fontSize:12, color:"var(--color-text-secondary)" }}>{proj.client}</p>}
                </div>
                <button onClick={()=>openEdit(proj)}
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:GL, border:`0.5px solid ${G}`, borderRadius:6, cursor:"pointer", color:G, fontSize:12, fontWeight:500, flexShrink:0 }}>
                  <Edit2 size={12}/>Edit
                </button>
              </div>

              {/* Site Name — highlighted */}
              {proj.siteName && (
                <div style={{ background:GL, borderRadius:7, padding:"6px 12px", display:"flex", alignItems:"center", gap:7 }}>
                  <MapPin size={12} color={G}/>
                  <span style={{ fontSize:12, fontWeight:600, color:GD }}>{proj.siteName}</span>
                  {proj.city && <span style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>· {proj.city}, {proj.state}</span>}
                </div>
              )}

              {/* Key details grid */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:12 }}>
                {[
                  proj.workOrder  && ["WO No.", proj.workOrder],
                  proj.contractAmt && ["Contract", fmtCr(proj.contractAmt)],
                  proj.startDate  && ["Start", proj.startDate],
                  proj.endDate    && ["End", proj.endDate],
                  proj.siteInCharge && ["Site In-Charge", proj.siteInCharge.split("|")[1]||proj.siteInCharge],
                  proj.contact1   && ["Contact", proj.contact1],
                ].filter(Boolean).map(([label,value]) => (
                  <div key={label}>
                    <p style={{ margin:"0 0 1px", fontSize:10, color:"var(--color-text-tertiary)", fontWeight:500, textTransform:"uppercase" }}>{label}</p>
                    <p style={{ margin:0, fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Switch button */}
              <button onClick={()=>onProjectSelect&&onProjectSelect(proj)}
                style={{ width:"100%", padding:"7px 0", background:"transparent", border:"0.5px solid var(--color-border-secondary)", borderRadius:7, cursor:"pointer", color:"var(--color-text-secondary)", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Layers size={12}/>Switch to this project
              </button>
            </div>
          ))}

          {projects.length === 0 && !loading && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:60, color:"var(--color-text-tertiary)" }}>
              <Briefcase size={36} style={{ opacity:.3, marginBottom:12 }}/>
              <p style={{ fontSize:15, margin:"0 0 6px" }}>No projects loaded</p>
              <p style={{ fontSize:13, margin:"0 0 20px" }}>Click Refresh to load from ProjectSetup_v1, or create a new project.</p>
              <button onClick={loadProjects}
                style={{ padding:"9px 24px", background:G, color:"white", border:"none", borderRadius:8, fontSize:13, cursor:"pointer" }}>
                <RefreshCw size={14} style={{ marginRight:6, verticalAlign:"middle" }}/>Load Projects
              </button>
            </div>
          )}
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE / EDIT FORM
  // ─────────────────────────────────────────────────────────────────────────
  const isEdit = view === "edit";

  const TABS = [
    { id:"identity",  label:"Identity & Contract", Icon:Hash    },
    { id:"site",      label:"Site Details",         Icon:MapPin  },
    { id:"contacts",  label:"Team & Contacts",      Icon:Users   },
  ];

  const set = field => e => setForm(f => ({...f, [field]: e.target.value}));

  return (
    <div style={{ padding:24, maxWidth:860 }}>
      {toast && (
        <div style={{ position:"fixed", top:64, right:24, background:toast.type==="error"?"#C62828":G, color:"white", padding:"10px 18px", borderRadius:8, fontSize:13, display:"flex", alignItems:"center", gap:8, zIndex:200, boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
          {toast.type==="error"?<AlertCircle size={14}/>:<CheckCircle2 size={14}/>}{toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <button onClick={()=>setView("list")}
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", fontSize:12, padding:"0 0 6px", display:"block" }}>
            ← Back to projects
          </button>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>
            {isEdit ? `Edit — ${form.id}` : "New Project"}
          </h2>
          {isEdit && form.uuid && (
            <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--color-text-tertiary)", fontFamily:"monospace" }}>UUID: {form.uuid}</p>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>setView("list")}
            style={{ padding:"8px 16px", background:"transparent", border:"0.5px solid var(--color-border-secondary)", borderRadius:7, cursor:"pointer", fontSize:13 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 20px", background:saving?"#AAA":G, color:"white", border:"none", borderRadius:7, cursor:saving?"not-allowed":"pointer", fontSize:13, fontWeight:500 }}>
            {saving
              ? <><span style={{ width:13, height:13, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"white", borderRadius:"50%", animation:"spin .7s linear infinite" }}/> Saving…</>
              : <><Save size={13}/> {isEdit ? "Save Changes" : "Create Project"}</>
            }
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:0, marginBottom:20, borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 18px",
              background:"transparent", border:"none", cursor:"pointer",
              color:activeTab===tab.id?G:"var(--color-text-tertiary)",
              fontWeight:activeTab===tab.id?600:400, fontSize:13,
              borderBottom:activeTab===tab.id?`2px solid ${G}`:"2px solid transparent",
              marginBottom:-1 }}>
            <tab.Icon size={14}/>{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: IDENTITY & CONTRACT ────────────────────────────────────── */}
      {activeTab === "identity" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          <Section title="Project Identity" icon={Hash}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              <F label="Project Code" required hint="e.g. EG25P0015">
                <input value={form.id} disabled={isEdit}
                  onChange={set("id")}
                  placeholder="EG25P0015"
                  style={{...inp(errors.id), background:isEdit?"var(--color-background-secondary)":undefined, fontFamily:"monospace", fontWeight:600}}/>
                {errors.id && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.id}</p>}
              </F>
              <F label="Project Name" required span2>
                <input value={form.name} onChange={set("name")} placeholder="THDC - UTTRAKHAND" style={inp(errors.name)}/>
                {errors.name && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.name}</p>}
              </F>
              <F label="Company" required>
                <select value={form.company} onChange={set("company")} style={inp(errors.company)}>
                  {COMPANIES.map(c=><option key={c}>{c}</option>)}
                </select>
                {errors.company && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.company}</p>}
              </F>
              <F label="Private / Govt">
                <select value={form.projectType} onChange={set("projectType")} style={inp()}>
                  {PROJECT_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </F>
              <F label="Series" hint="Sequential number">
                <input type="number" value={form.series} onChange={set("series")} placeholder="15" style={inp()}/>
              </F>
              <F label="Awarded Date">
                <input type="date" value={form.awardedDate} onChange={set("awardedDate")} style={inp()}/>
              </F>
              <F label="Start Date">
                <input type="date" value={form.startDate} onChange={set("startDate")} style={inp()}/>
              </F>
              <F label="End Date">
                <input type="date" value={form.endDate} min={form.startDate} onChange={set("endDate")} style={inp()}/>
              </F>
              <F label="Status">
                <select value={form.status} onChange={set("status")} style={inp()}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </F>
            </div>
          </Section>

          <Section title="Client & Contract" icon={Building2}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <F label="Client Name">
                <input value={form.client} onChange={set("client")} placeholder="M/s L&T Construction" style={inp()}/>
              </F>
              <F label="Work Order Number">
                <input value={form.workOrder} onChange={set("workOrder")} placeholder="LE/LE24M724/WOD/25/000014" style={inp()}/>
              </F>
              <F label="WO Date">
                <input type="date" value={form.woDate} onChange={set("woDate")} style={inp()}/>
              </F>
              <F label="Contract Amount (₹)" hint={form.contractAmt?fmtCr(Number(form.contractAmt)):""}>
                <input type="number" value={form.contractAmt} onChange={set("contractAmt")} placeholder="45402700" style={inp()}/>
              </F>
              <F label="PAN">
                <input value={form.pan} onChange={set("pan")} placeholder="AAAGM0289C" style={{...inp(), fontFamily:"monospace"}}/>
              </F>
              <F label="TAN">
                <input value={form.tan} onChange={set("tan")} placeholder="CNDE12345A" style={{...inp(), fontFamily:"monospace"}}/>
              </F>
              <F label="GST Number">
                <input value={form.gst} onChange={set("gst")} placeholder="21AAAGM0289C1ZV" style={{...inp(), fontFamily:"monospace"}}/>
              </F>
              <F label="Purchase Billing Under">
                <select value={form.purchaseBilling} onChange={set("purchaseBilling")} style={inp()}>
                  {BILLING_ENTITIES.map(e=><option key={e}>{e}</option>)}
                </select>
              </F>
              <F label="Payroll Under">
                <select value={form.payroll} onChange={set("payroll")} style={inp()}>
                  {BILLING_ENTITIES.map(e=><option key={e}>{e}</option>)}
                </select>
              </F>
              <F label="Project Email ID">
                <input type="email" value={form.email} onChange={set("email")} placeholder="site@evgcpl.com" style={inp()}/>
              </F>
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB 2: SITE DETAILS ───────────────────────────────────────────── */}
      {activeTab === "site" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* SITE NAME — key field, always prominent */}
          <div style={{ background:"#E8F5E9", border:"1.5px solid #2E6B2E", borderRadius:10, padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <MapPin size={15} color="#2E6B2E"/>
              <span style={{ fontWeight:700, fontSize:14, color:"#1A3F1A" }}>Site Name</span>
              <span style={{ background:"#C62828", color:"white", fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:20 }}>KEY FIELD</span>
            </div>
            <p style={{ margin:"0 0 10px", fontSize:12, color:"#2E6B2E", lineHeight:1.5 }}>
              This value is the <strong>data filter key</strong> used across all modules.
              It must exactly match the "Site Name" column in:
              EmployeeRegister · StockLevels · PaymentRequest · MRS/PO
            </p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {["DPR Entry","Accounts","Purchase","Inventory","RA Bills","Employees","Equipment"].map(m=>(
                <span key={m} style={{ background:"white", border:"0.5px solid #2E6B2E", color:"#1A3F1A", fontSize:11, fontWeight:500, padding:"2px 10px", borderRadius:20 }}>{m}</span>
              ))}
            </div>
            <input value={form.siteName}
              onChange={e=>setForm(f=>({...f,siteName:e.target.value.toUpperCase()}))}
              placeholder="LNT - SIKKIM"
              style={{...inp(errors.siteName), fontSize:15, fontWeight:700, fontFamily:"monospace",
                border:`1.5px solid ${errors.siteName?"#E53935":"#2E6B2E"}`, background:"white"}}/>
            {errors.siteName
              ? <p style={{margin:"4px 0 0",fontSize:11,color:"#E53935"}}>{errors.siteName}</p>
              : form.siteName && <p style={{margin:"4px 0 0",fontSize:11,color:"#2E6B2E"}}>✓ Will filter all modules for "{form.siteName}"</p>
            }
          </div>

          <Section title="Site Address" icon={MapPin}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <F label="Site Address Line 1" span2>
                <input value={form.siteAddr1} onChange={set("siteAddr1")} placeholder="Dam Site Adit 2" style={inp()}/>
              </F>
              <F label="Site Address Line 2" span2>
                <input value={form.siteAddr2} onChange={set("siteAddr2")} placeholder="Theng Busty" style={inp()}/>
              </F>
              <F label="Site Address Line 3" span2>
                <input value={form.siteAddr3} onChange={set("siteAddr3")} placeholder="Chungthang GPU-737120" style={inp()}/>
              </F>
              <F label="City">
                <input value={form.city} onChange={set("city")} placeholder="Chungthang" style={inp()}/>
              </F>
              <F label="State">
                <select value={form.state} onChange={set("state")} style={inp()}>
                  <option value="">— Select State —</option>
                  {STATES.map(s=><option key={s}>{s}</option>)}
                </select>
              </F>
              <F label="Country">
                <input value={form.country} onChange={set("country")} placeholder="India" style={inp()}/>
              </F>
              <F label="Pin Code">
                <input value={form.pinCode} onChange={set("pinCode")} placeholder="737120" maxLength={6} style={inp()}/>
              </F>
            </div>
          </Section>

          <Section title="Location & Delivery" icon={Navigation} defaultOpen={false}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:12 }}>
              <F label="Google Maps Link" hint="Paste maps.google.com URL">
                <div style={{ display:"flex", gap:8 }}>
                  <Globe size={14} color="var(--color-text-tertiary)" style={{ marginTop:10, flexShrink:0 }}/>
                  <input value={form.location} onChange={set("location")} placeholder="https://maps.app.goo.gl/..." style={inp()}/>
                </div>
              </F>
              <F label="Delivery Address" hint="For purchase orders">
                <textarea value={form.deliveryAddress} onChange={set("deliveryAddress")} rows={3}
                  placeholder="Full delivery address for materials"
                  style={{...inp(), resize:"vertical"}}/>
              </F>
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB 3: TEAM & CONTACTS ───────────────────────────────────────── */}
      {activeTab === "contacts" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          <Section title="Site Team" icon={UserCheck}>
            <p style={{ margin:"0 0 12px", fontSize:12, color:"var(--color-text-secondary)" }}>
              Use EmpRef format: <code style={{background:"var(--color-background-secondary)",padding:"1px 5px",borderRadius:4}}>EG1234|EMPLOYEE NAME</code>
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <F label="Site In-Charge">
                <input value={form.siteInCharge} onChange={set("siteInCharge")} placeholder="EG1654|HIMANSHU KUMAR" style={inp()}/>
              </F>
              <F label="Reporting Manager">
                <input value={form.reportingManager} onChange={set("reportingManager")} placeholder="EG0006|RADHA PRASATH" style={inp()}/>
              </F>
              <F label="Planning In-Charge">
                <input value={form.planningInCharge} onChange={set("planningInCharge")} placeholder="karthikj@evgcpl.com" style={inp()}/>
              </F>
              <F label="Accounts In-Charge">
                <input value={form.accountsInCharge} onChange={set("accountsInCharge")} placeholder="accounts@evgcpl.com" style={inp()}/>
              </F>
              <F label="Attendance In-Charge">
                <input value={form.attendanceInCharge} onChange={set("attendanceInCharge")} placeholder="karthikj@evgcpl.com" style={inp()}/>
              </F>
              <F label="SC Attendance In-Charge">
                <input value={form.scAttendance} onChange={set("scAttendance")} placeholder="karthikj@evgcpl.com" style={inp()}/>
              </F>
              <F label="Mess In-Charge">
                <input value={form.messInCharge} onChange={set("messInCharge")} placeholder="Name" style={inp()}/>
              </F>
            </div>
          </Section>

          <Section title="Contacts" icon={Phone} defaultOpen={false}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <F label="Contact 1" hint="Name — Phone or email">
                <input value={form.contact1} onChange={set("contact1")} placeholder="Mr. Sunil — 98765 43210" style={inp()}/>
              </F>
              <F label="Contact 2">
                <input value={form.contact2} onChange={set("contact2")} placeholder="Mr. Raju — 98765 43211" style={inp()}/>
              </F>
              <F label="Contact 3">
                <input value={form.contact3} onChange={set("contact3")} placeholder="Optional third contact" style={inp()}/>
              </F>
              <F label="Website">
                <input value={form.website} onChange={set("website")} placeholder="https://evgcpl.com" style={inp()}/>
              </F>
              <F label="User Email" span2>
                <input type="email" value={form.userEmail} onChange={set("userEmail")} placeholder="site@evgcpl.com" style={inp()}/>
              </F>
              <F label="System Email" span2>
                <input type="email" value={form.systemEmail} onChange={set("systemEmail")} placeholder="admin@evgcpl.com" style={inp()}/>
              </F>
            </div>
          </Section>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
