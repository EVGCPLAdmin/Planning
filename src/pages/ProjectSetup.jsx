/**
 * ProjectSetup.jsx — EG Construction ERP
 *
 * Allows Admin to:
 *   - View all projects
 *   - Create a new project (contract details, site, client, GST etc.)
 *   - Edit an existing project
 *   - Add / edit BOQ items per project
 *   - Add / edit Sub-contractor rate masters per project
 *   - Save to Google Sheets via proxy (PROJECTS + BOQ_MASTER + SC_MASTER tabs)
 */

import { useState, useMemo } from "react";
import {
  Plus, Edit2, Save, X, ChevronDown, ChevronUp,
  Building2, FileText, Users, AlertCircle, CheckCircle2,
  Trash2, Copy, IndianRupee, MapPin, Phone, Mail,
  Calendar, Hash, Briefcase, Layers
} from "lucide-react";

const G = "#2E6B2E", GD = "#1A3F1A", GL = "#EBF5EB";
const today = new Date().toISOString().split("T")[0];

const fmt  = n => "₹" + Math.round(n||0).toLocaleString("en-IN");
const fmtCr = n => { const v=Math.abs(n||0); return "₹"+(v>=10000000?(v/10000000).toFixed(3)+" Cr":v>=100000?(v/100000).toFixed(2)+"L":Math.round(v).toLocaleString("en-IN")); };

// ── Reusable form field ───────────────────────────────────────────────────────
function F({ label, required, children, hint, col }) {
  return (
    <div style={{ gridColumn: col || "span 1" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <label style={{ fontSize:12, fontWeight:500, color:"var(--color-text-secondary)" }}>
          {label}{required && <span style={{ color:"#E53935" }}> *</span>}
        </label>
        {hint && <span style={{ fontSize:10, color:"var(--color-text-tertiary)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inp = (err) => ({
  width:"100%", padding:"8px 10px", borderRadius:7,
  border:`0.5px solid ${err?"#E53935":"var(--color-border-secondary)"}`,
  background:"var(--color-background-primary)", fontSize:13,
  fontFamily:"inherit", color:"var(--color-text-primary)", boxSizing:"border-box",
  outline:"none",
});

const EMPTY_PROJECT = {
  id:"", name:"", client:"", workOrder:"", woDate:"", contractAmt:"",
  startDate:"", endDate:"", site:"", siteName:"", payroll:"EVGCPL, INDIA",
  gst:"33AADFE5468R2ZU", clientGst:"", status:"Active",
  projectManager:"", contactPhone:"", remarks:"",
};

const EMPTY_BOQ = {
  code:"", wbs:"", desc:"", unit:"", woQty:"", rate:"",
};

const EMPTY_SC = {
  id:"", name:"", contact:"", phone:"", scope:"",
  type:"Drilling", unit:"RMT", rate:"", gstNo:"", gstType:"IGST", mob:"",
  woRef:"",
};

const PROJECT_STATUS = ["Active","Completed","On Hold","Tendering","Awarded"];
const SC_TYPES = ["Drilling","Grouting","Civil","Electrical","Mechanical","Labour","Other"];
const BOQ_UNITS = ["RMT","Nos","Kg","MT","Bags","LS","Cum","Sqm","Rmt","m","m²","m³"];

// ── Section toggle wrapper ────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, overflow:"hidden", marginBottom:16 }}>
      <button onClick={() => setOpen(!open)}
        style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"12px 16px", background:"var(--color-background-secondary)", border:"none",
          cursor:"pointer", color:"var(--color-text-primary)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:600, fontSize:14 }}>
          {Icon && <Icon size={15} color={G}/>}{title}
        </div>
        {open ? <ChevronUp size={16} color="var(--color-text-tertiary)"/> : <ChevronDown size={16} color="var(--color-text-tertiary)"/>}
      </button>
      {open && <div style={{ padding:"16px" }}>{children}</div>}
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    Active:     { bg:GL,       color:G         },
    Completed:  { bg:"#E3F2FD", color:"#1565C0" },
    "On Hold":  { bg:"#FFF8E1", color:"#E65100" },
    Tendering:  { bg:"#F3E5F5", color:"#6A1B9A" },
    Awarded:    { bg:"#E8F5E9", color:"#2E7D32" },
  };
  const c = cfg[status] || cfg.Active;
  return (
    <span style={{ background:c.bg, color:c.color, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:500 }}>
      {status}
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ProjectSetup({ projects, setProjects, onProjectSelect }) {
  const [view, setView]       = useState("list");   // "list" | "edit" | "create"
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(EMPTY_PROJECT);
  const [boqRows, setBoqRows] = useState([]);
  const [scRows, setScRows]   = useState([]);
  const [errors, setErrors]   = useState({});
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [activeTab, setActiveTab] = useState("details"); // details | boq | sc

  const showToast = (msg, type="success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  // ── Open create form ──────────────────────────────────────────────────────
  function openCreate() {
    setForm({ ...EMPTY_PROJECT });
    setBoqRows([{ ...EMPTY_BOQ, _id: Date.now() }]);
    setScRows([]);
    setErrors({});
    setActiveTab("details");
    setView("create");
  }

  // ── Open edit form ────────────────────────────────────────────────────────
  function openEdit(proj) {
    setForm({ ...EMPTY_PROJECT, ...proj });
    setBoqRows((proj.boqItems || []).map(b => ({ ...b, _id: b.code || Date.now() })));
    setScRows((proj.scMaster || []).map(s => ({ ...s, _id: s.id || Date.now() })));
    setErrors({});
    setEditId(proj.id);
    setActiveTab("details");
    setView("edit");
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.id.trim())          e.id          = "Required";
    if (!form.name.trim())        e.name        = "Required";
    if (!form.client.trim())      e.client      = "Required";
    if (!form.workOrder.trim())   e.workOrder   = "Required";
    if (!form.contractAmt)        e.contractAmt = "Required";
    if (!form.site.trim())        e.site        = "Required";
    if (!form.siteName.trim())    e.siteName    = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Save project ──────────────────────────────────────────────────────────
  async function handleSave() {
    if (!validate()) {
      setActiveTab("details");
      showToast("Fix the highlighted errors", "error");
      return;
    }
    setSaving(true);

    const newProject = {
      ...form,
      contractAmt: Number(form.contractAmt),
      boqItems: boqRows.filter(b => b.code && b.desc).map(b => ({
        code: b.code.trim(), wbs: b.wbs?.trim() || "",
        desc: b.desc.trim(), unit: b.unit.trim(),
        woQty: Number(b.woQty) || 0, rate: Number(b.rate) || 0,
        billedQty: b.billedQty || 0,
      })),
      scMaster: scRows.filter(s => s.name).map(s => ({
        id: s.id || s.name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,""),
        name: s.name.trim(), contact: s.contact?.trim() || "",
        phone: s.phone?.trim() || "", scope: s.scope?.trim() || "",
        type: s.type || "Drilling", unit: s.unit || "RMT",
        rate: Number(s.rate) || 0, gstNo: s.gstNo?.trim() || "",
        gstType: s.gstType || "IGST", mob: Number(s.mob) || 0,
        woRef: s.woRef?.trim() || "",
      })),
    };

    // Write to Sheets
    try {
      const proxyUrl = import.meta.env.VITE_SHEETS_PROXY_URL;
      if (proxyUrl) {
        await fetch(proxyUrl, {
          method:"POST", headers:{"Content-Type":"text/plain"},
          body: JSON.stringify({
            action: "append",
            secret: import.meta.env.VITE_SHEETS_PROXY_SECRET,
            spreadsheetId: import.meta.env.VITE_SHEET_ERP,
            tabName: "PROJECTS",
            data: { row: [
              newProject.id, newProject.name, newProject.client,
              newProject.workOrder, newProject.woDate, newProject.contractAmt,
              newProject.startDate, newProject.endDate, newProject.site,
              newProject.siteName, newProject.payroll, newProject.gst,
              newProject.status, new Date().toISOString(),
            ]},
          }),
        });
      }
    } catch(e) {
      console.warn("Project save to Sheets failed:", e.message);
    }

    if (view === "edit") {
      setProjects(prev => prev.map(p => p.id === editId ? newProject : p));
      showToast(`${newProject.id} updated`);
    } else {
      setProjects(prev => [...prev, newProject]);
      showToast(`${newProject.id} created — switch to it from the sidebar`);
    }

    setSaving(false);
    setView("list");
  }

  // ── BOQ row helpers ───────────────────────────────────────────────────────
  const addBoqRow    = () => setBoqRows(r => [...r, { ...EMPTY_BOQ, _id: Date.now() }]);
  const removeBoqRow = (id) => setBoqRows(r => r.filter(b => b._id !== id));
  const updateBoqRow = (id, field, val) =>
    setBoqRows(r => r.map(b => b._id === id ? { ...b, [field]: val } : b));

  // ── SC row helpers ────────────────────────────────────────────────────────
  const addScRow    = () => setScRows(r => [...r, { ...EMPTY_SC, _id: Date.now() }]);
  const removeScRow = (id) => setScRows(r => r.filter(s => s._id !== id));
  const updateScRow = (id, field, val) =>
    setScRows(r => r.map(s => s._id === id ? { ...s, [field]: val } : s));

  // ── BOQ total ─────────────────────────────────────────────────────────────
  const boqTotal = useMemo(() =>
    boqRows.reduce((s, b) => s + (Number(b.woQty)||0) * (Number(b.rate)||0), 0),
    [boqRows]);

  // ─────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (view === "list") {
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
              {projects.length} project{projects.length!==1?"s":""} · Manage contracts, BOQ and sub-contractor masters
            </p>
          </div>
          <button onClick={openCreate}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"10px 20px", background:G, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" }}>
            <Plus size={15}/>New Project
          </button>
        </div>

        {/* Project cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))", gap:16 }}>
          {projects.map(proj => (
            <div key={proj.id} style={{ background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"1.25rem", display:"flex", flexDirection:"column", gap:12 }}>

              {/* Card header */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:15, color:G }}>{proj.id}</span>
                    <StatusPill status={proj.status}/>
                  </div>
                  <p style={{ margin:0, fontSize:13, fontWeight:500, color:"var(--color-text-primary)" }}>{proj.name}</p>
                </div>
                <button onClick={() => openEdit(proj)}
                  style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 10px", background:GL, border:`0.5px solid ${G}`, borderRadius:6, cursor:"pointer", color:G, fontSize:12, fontWeight:500, flexShrink:0 }}>
                  <Edit2 size={12}/>Edit
                </button>
              </div>

              {/* Key details */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:12 }}>
                {[
                  [Building2, "Client",    proj.client],
                  [FileText,  "WO No.",    proj.workOrder],
                  [MapPin,    "Site Name", proj.siteName],
                  [MapPin,    "Address",   proj.site],
                  [IndianRupee,"Contract", fmtCr(proj.contractAmt)],
                  [Calendar,  "Start",     proj.startDate],
                  [Calendar,  "End",       proj.endDate],
                ].map(([Icon, label, value]) => (
                  <div key={label} style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
                    <Icon size={12} color="var(--color-text-tertiary)" style={{ marginTop:1, flexShrink:0 }}/>
                    <div>
                      <p style={{ margin:"0 0 1px", fontSize:10, color:"var(--color-text-tertiary)", textTransform:"uppercase", fontWeight:500 }}>{label}</p>
                      <p style={{ margin:0, fontWeight:500, color:"var(--color-text-primary)" }}>{value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* BOQ summary */}
              {(proj.boqItems||[]).length > 0 && (
                <div style={{ background:"var(--color-background-secondary)", borderRadius:7, padding:"8px 12px", fontSize:11 }}>
                  <span style={{ color:"var(--color-text-tertiary)", fontWeight:500 }}>BOQ: </span>
                  {(proj.boqItems||[]).map(b => (
                    <span key={b.code} style={{ marginRight:8 }}><strong style={{ color:G }}>{b.code}</strong> {b.unit}</span>
                  ))}
                  {(proj.scMaster||[]).length > 0 && (
                    <span style={{ color:"var(--color-text-tertiary)" }}> · {(proj.scMaster||[]).length} SC{(proj.scMaster||[]).length!==1?"s":""}</span>
                  )}
                </div>
              )}

              {/* Quick switch */}
              <button onClick={() => onProjectSelect && onProjectSelect(proj)}
                style={{ width:"100%", padding:"7px 0", background:"transparent", border:`0.5px solid var(--color-border-secondary)`, borderRadius:7, cursor:"pointer", color:"var(--color-text-secondary)", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Layers size={12}/>Switch to this project
              </button>
            </div>
          ))}

          {/* Empty state */}
          {projects.length === 0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center", padding:60, color:"var(--color-text-tertiary)" }}>
              <Briefcase size={36} style={{ opacity:.3, marginBottom:12 }}/>
              <p style={{ fontSize:15, margin:"0 0 6px" }}>No projects yet</p>
              <p style={{ fontSize:13, margin:"0 0 20px" }}>Create your first project to get started</p>
              <button onClick={openCreate}
                style={{ padding:"9px 24px", background:G, color:"white", border:"none", borderRadius:8, fontSize:13, cursor:"pointer" }}>
                <Plus size={14} style={{ marginRight:6, verticalAlign:"middle" }}/>Create Project
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE / EDIT FORM
  // ─────────────────────────────────────────────────────────────────────────
  const isEdit = view === "edit";
  const TABS = [
    { id:"details", label:"Contract Details", Icon:FileText },
    { id:"boq",     label:`BOQ (${boqRows.filter(b=>b.code).length})`, Icon:Layers },
    { id:"sc",      label:`Sub-contractors (${scRows.filter(s=>s.name).length})`, Icon:Users },
  ];

  return (
    <div style={{ padding:24, maxWidth:900 }}>
      {toast && (
        <div style={{ position:"fixed", top:64, right:24, background:toast.type==="error"?"#C62828":G, color:"white", padding:"10px 18px", borderRadius:8, fontSize:13, display:"flex", alignItems:"center", gap:8, zIndex:200, boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
          {toast.type==="error"?<AlertCircle size={14}/>:<CheckCircle2 size={14}/>}{toast.msg}
        </div>
      )}

      {/* Top bar */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <button onClick={() => setView("list")}
            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", fontSize:12, padding:"0 0 6px", display:"block" }}>
            ← Back to projects
          </button>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700 }}>
            {isEdit ? `Edit — ${editId}` : "New Project"}
          </h2>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setView("list")}
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
      <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:"0.5px solid var(--color-border-tertiary)", paddingBottom:0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 16px",
              background:"transparent", border:"none", cursor:"pointer",
              color: activeTab===tab.id ? G : "var(--color-text-tertiary)",
              fontWeight: activeTab===tab.id ? 600 : 400,
              fontSize:13,
              borderBottom: activeTab===tab.id ? `2px solid ${G}` : "2px solid transparent",
              marginBottom:-1,
            }}>
            <tab.Icon size={14}/>{tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CONTRACT DETAILS ────────────────────────────────────────── */}
      {activeTab === "details" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          <Section title="Project Identity" icon={Hash} defaultOpen>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              <F label="Project ID" required hint="e.g. EG-2337">
                <input value={form.id} disabled={isEdit}
                  onChange={e => setForm({...form, id:e.target.value.toUpperCase().trim()})}
                  placeholder="EG-2338" style={{...inp(errors.id), background:isEdit?"var(--color-background-secondary)":undefined}}/>
                {errors.id && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.id}</p>}
              </F>
              <F label="Project Name" required col="span 2">
                <input value={form.name}
                  onChange={e => setForm({...form, name:e.target.value})}
                  placeholder="Permeation Grouting Works – 120MW Teesta III HEP"
                  style={inp(errors.name)}/>
                {errors.name && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.name}</p>}
              </F>
              <F label="Status">
                <select value={form.status} onChange={e => setForm({...form, status:e.target.value})} style={inp()}>
                  {PROJECT_STATUS.map(s => <option key={s}>{s}</option>)}
                </select>
              </F>
              <F label="Start Date">
                <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate:e.target.value})} style={inp()}/>
              </F>
              <F label="End Date">
                <input type="date" value={form.endDate} min={form.startDate} onChange={e => setForm({...form, endDate:e.target.value})} style={inp()}/>
              </F>
            </div>
          </Section>

          <Section title="Client & Contract" icon={Building2} defaultOpen>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <F label="Client Name" required>
                <input value={form.client} onChange={e => setForm({...form, client:e.target.value})}
                  placeholder="M/s L&T Construction" style={inp(errors.client)}/>
                {errors.client && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.client}</p>}
              </F>
              <F label="Work Order Number" required>
                <input value={form.workOrder} onChange={e => setForm({...form, workOrder:e.target.value})}
                  placeholder="LE/LE24M724/WOD/25/000014" style={inp(errors.workOrder)}/>
                {errors.workOrder && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.workOrder}</p>}
              </F>
              <F label="WO Date">
                <input type="date" value={form.woDate} onChange={e => setForm({...form, woDate:e.target.value})} style={inp()}/>
              </F>
              <F label="Contract Amount (₹)" required hint="Total WO value in ₹">
                <input type="number" value={form.contractAmt} onChange={e => setForm({...form, contractAmt:e.target.value})}
                  placeholder="45402700" style={inp(errors.contractAmt)}/>
                {form.contractAmt && <p style={{margin:"3px 0 0",fontSize:11,color:"var(--color-text-tertiary)"}}>{fmtCr(Number(form.contractAmt))}</p>}
                {errors.contractAmt && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.contractAmt}</p>}
              </F>
              <F label="Client GSTIN">
                <input value={form.clientGst} onChange={e => setForm({...form, clientGst:e.target.value})}
                  placeholder="11AAACL0140P1ZW" style={inp()}/>
              </F>
              <F label="Project Manager">
                <input value={form.projectManager} onChange={e => setForm({...form, projectManager:e.target.value})}
                  placeholder="Name of PM" style={inp()}/>
              </F>
            </div>
          </Section>

          <Section title="Site Details" icon={MapPin} defaultOpen>
            {/* Site Name — KEY FIELD — shown first and highlighted */}
            <div style={{ background:"#E8F5E9", border:"1.5px solid #2E6B2E", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <MapPin size={15} color="#2E6B2E"/>
                <span style={{ fontWeight:700, fontSize:14, color:"#1A3F1A" }}>Site Name</span>
                <span style={{ background:"#C62828", color:"white", fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:20 }}>REQUIRED · KEY FIELD</span>
              </div>
              <p style={{ margin:"0 0 10px", fontSize:12, color:"#2E6B2E", lineHeight:1.5 }}>
                This name is the <strong>data filter key</strong> — it must exactly match the "Site Name" value in your Google Sheets.
                All these modules filter data using this value:
              </p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                {["DPR Entry","Accounts","Purchase","Inventory","RA Bills","Employees","Equipment"].map(m=>(
                  <span key={m} style={{ background:"white", border:"0.5px solid #2E6B2E", color:"#1A3F1A", fontSize:11, fontWeight:500, padding:"2px 10px", borderRadius:20 }}>{m}</span>
                ))}
              </div>
              <input value={form.siteName}
                onChange={e => setForm({...form, siteName:e.target.value.toUpperCase()})}
                placeholder="LNT - SIKKIM"
                style={{ ...inp(errors.siteName), fontSize:15, fontWeight:600, letterSpacing:".03em", border:`1.5px solid ${errors.siteName?"#E53935":"#2E6B2E"}`, background:"white" }}/>
              {errors.siteName
                ? <p style={{margin:"4px 0 0",fontSize:11,color:"#E53935"}}>{errors.siteName}</p>
                : <p style={{margin:"4px 0 0",fontSize:11,color:"#2E6B2E"}}>
                    Must match exactly: EmployeeRegister → Site Name column · StockLevels → Site Name column · PaymentRequest → Site Name column
                  </p>
              }
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <F label="Site Address" required col="span 2">
                <input value={form.site} onChange={e => setForm({...form, site:e.target.value})}
                  placeholder="Dam Site Adit 2, Chungthang, Sikkim – 737120"
                  style={inp(errors.site)}/>
                {errors.site && <p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{errors.site}</p>}
              </F>
              <F label="Payroll Entity">
                <input value={form.payroll} onChange={e => setForm({...form, payroll:e.target.value})}
                  placeholder="EVGCPL, INDIA" style={inp()}/>
              </F>
              <F label="Our GSTIN">
                <input value={form.gst} onChange={e => setForm({...form, gst:e.target.value})}
                  placeholder="33AADFE5468R2ZU" style={inp()}/>
              </F>
              <F label="Contact Phone">
                <input value={form.contactPhone} onChange={e => setForm({...form, contactPhone:e.target.value})}
                  placeholder="+91 9566261919" style={inp()}/>
              </F>
              <F label="Remarks" col="span 2">
                <textarea value={form.remarks} onChange={e => setForm({...form, remarks:e.target.value})}
                  rows={2} placeholder="Any additional notes..."
                  style={{...inp(), resize:"vertical"}}/>
              </F>
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB: BOQ ─────────────────────────────────────────────────────── */}
      {activeTab === "boq" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <p style={{ margin:0, fontSize:13, color:"var(--color-text-secondary)" }}>
              Enter all BOQ items from the Work Order. These drive the RA Bill generation.
            </p>
            <button onClick={addBoqRow}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", background:GL, border:`0.5px solid ${G}`, borderRadius:6, cursor:"pointer", color:G, fontSize:12, fontWeight:500 }}>
              <Plus size={13}/>Add Item
            </button>
          </div>

          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead>
                <tr style={{ background:"var(--color-background-secondary)" }}>
                  {["Code","WBS Code","Description","Unit","WO Qty","Rate (₹)","WO Amount",""].map(h => (
                    <th key={h} style={{ padding:"8px 10px", textAlign:["WO Qty","Rate (₹)","WO Amount"].includes(h)?"right":"left", fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", borderBottom:"0.5px solid var(--color-border-tertiary)", whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boqRows.map((b, i) => (
                  <tr key={b._id} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", background:i%2===0?"transparent":"var(--color-background-secondary)" }}>
                    <td style={{ padding:"6px 8px" }}>
                      <input value={b.code} onChange={e=>updateBoqRow(b._id,"code",e.target.value)}
                        placeholder="1000.1" style={{...inp(), width:80, fontSize:12, padding:"5px 7px"}}/>
                    </td>
                    <td style={{ padding:"6px 8px" }}>
                      <input value={b.wbs} onChange={e=>updateBoqRow(b._id,"wbs",e.target.value)}
                        placeholder="CI-2337-1-01" style={{...inp(), width:130, fontSize:12, padding:"5px 7px"}}/>
                    </td>
                    <td style={{ padding:"6px 8px" }}>
                      <input value={b.desc} onChange={e=>updateBoqRow(b._id,"desc",e.target.value)}
                        placeholder="Description of work" style={{...inp(), width:220, fontSize:12, padding:"5px 7px"}}/>
                    </td>
                    <td style={{ padding:"6px 8px" }}>
                      <select value={b.unit} onChange={e=>updateBoqRow(b._id,"unit",e.target.value)}
                        style={{...inp(), width:70, fontSize:12, padding:"5px 7px"}}>
                        <option value="">—</option>
                        {BOQ_UNITS.map(u=><option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:"6px 8px" }}>
                      <input type="number" value={b.woQty} onChange={e=>updateBoqRow(b._id,"woQty",e.target.value)}
                        placeholder="0" style={{...inp(), width:90, textAlign:"right", fontSize:12, padding:"5px 7px"}}/>
                    </td>
                    <td style={{ padding:"6px 8px" }}>
                      <input type="number" value={b.rate} onChange={e=>updateBoqRow(b._id,"rate",e.target.value)}
                        placeholder="0" style={{...inp(), width:90, textAlign:"right", fontSize:12, padding:"5px 7px"}}/>
                    </td>
                    <td style={{ padding:"6px 8px", textAlign:"right", fontFamily:"monospace", fontWeight:500, color:G, whiteSpace:"nowrap" }}>
                      {(Number(b.woQty)||0)*(Number(b.rate)||0) > 0
                        ? fmtCr((Number(b.woQty)||0)*(Number(b.rate)||0))
                        : "—"}
                    </td>
                    <td style={{ padding:"6px 8px" }}>
                      <button onClick={()=>removeBoqRow(b._id)}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"#E53935", display:"flex" }}>
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {boqRows.length > 0 && (
                <tfoot>
                  <tr style={{ background:GL, borderTop:`2px solid ${G}` }}>
                    <td colSpan={6} style={{ padding:"8px 10px", fontWeight:600, color:G, textAlign:"right" }}>Total Contract Value</td>
                    <td style={{ padding:"8px 10px", textAlign:"right", fontFamily:"monospace", fontWeight:700, color:G, fontSize:14 }}>{fmtCr(boqTotal)}</td>
                    <td/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {boqRows.length === 0 && (
            <div style={{ textAlign:"center", padding:40, color:"var(--color-text-tertiary)", border:"0.5px dashed var(--color-border-secondary)", borderRadius:8 }}>
              <Layers size={28} style={{ opacity:.3, marginBottom:8 }}/>
              <p style={{ fontSize:13, margin:0 }}>No BOQ items yet. Click "Add Item" to start.</p>
            </div>
          )}

          {boqTotal > 0 && (
            <div style={{ marginTop:12, padding:"8px 14px", background:GL, borderRadius:8, fontSize:12, color:GD, display:"flex", alignItems:"center", gap:8 }}>
              <CheckCircle2 size={13} color={G}/>
              BOQ total <strong>{fmtCr(boqTotal)}</strong>
              {form.contractAmt && Math.abs(boqTotal - Number(form.contractAmt)) > 1000 && (
                <span style={{ color:"#E65100" }}> · differs from contract value ({fmtCr(Number(form.contractAmt))})</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: SUB-CONTRACTORS ─────────────────────────────────────────── */}
      {activeTab === "sc" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <p style={{ margin:0, fontSize:13, color:"var(--color-text-secondary)" }}>
              Register all sub-contractors for this project. Rates and scope used in DPR and SC billing.
            </p>
            <button onClick={addScRow}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 14px", background:GL, border:`0.5px solid ${G}`, borderRadius:6, cursor:"pointer", color:G, fontSize:12, fontWeight:500 }}>
              <Plus size={13}/>Add Sub-contractor
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {scRows.map((s, i) => (
              <div key={s._id} style={{ border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, padding:"14px 16px", background:"var(--color-background-primary)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <span style={{ fontWeight:600, fontSize:13, color:G }}>Sub-contractor {i+1}</span>
                  <button onClick={()=>removeScRow(s._id)}
                    style={{ display:"flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", color:"#E53935", fontSize:12 }}>
                    <Trash2 size={13}/>Remove
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  <F label="Name" required>
                    <input value={s.name} onChange={e=>updateScRow(s._id,"name",e.target.value)}
                      placeholder="M/s Audi Geotech" style={{...inp(), fontSize:12, padding:"6px 8px"}}/>
                  </F>
                  <F label="Scope / Work">
                    <input value={s.scope} onChange={e=>updateScRow(s._id,"scope",e.target.value)}
                      placeholder="Odex Drilling 150mm" style={{...inp(), fontSize:12, padding:"6px 8px"}}/>
                  </F>
                  <F label="Type">
                    <select value={s.type} onChange={e=>updateScRow(s._id,"type",e.target.value)}
                      style={{...inp(), fontSize:12, padding:"6px 8px"}}>
                      {SC_TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                  </F>
                  <F label="Unit">
                    <select value={s.unit} onChange={e=>updateScRow(s._id,"unit",e.target.value)}
                      style={{...inp(), fontSize:12, padding:"6px 8px"}}>
                      {BOQ_UNITS.map(u=><option key={u}>{u}</option>)}
                    </select>
                  </F>
                  <F label="Rate (₹ per unit)">
                    <input type="number" value={s.rate} onChange={e=>updateScRow(s._id,"rate",e.target.value)}
                      placeholder="1500" style={{...inp(), fontSize:12, padding:"6px 8px"}}/>
                  </F>
                  <F label="Mobilization (₹)">
                    <input type="number" value={s.mob} onChange={e=>updateScRow(s._id,"mob",e.target.value)}
                      placeholder="0" style={{...inp(), fontSize:12, padding:"6px 8px"}}/>
                  </F>
                  <F label="Contact Person">
                    <input value={s.contact} onChange={e=>updateScRow(s._id,"contact",e.target.value)}
                      placeholder="Mr. Name" style={{...inp(), fontSize:12, padding:"6px 8px"}}/>
                  </F>
                  <F label="Phone">
                    <input value={s.phone} onChange={e=>updateScRow(s._id,"phone",e.target.value)}
                      placeholder="+91 98400 00001" style={{...inp(), fontSize:12, padding:"6px 8px"}}/>
                  </F>
                  <F label="GST No.">
                    <input value={s.gstNo} onChange={e=>updateScRow(s._id,"gstNo",e.target.value)}
                      placeholder="33XXXXXX001" style={{...inp(), fontSize:12, padding:"6px 8px"}}/>
                  </F>
                  <F label="GST Type">
                    <select value={s.gstType} onChange={e=>updateScRow(s._id,"gstType",e.target.value)}
                      style={{...inp(), fontSize:12, padding:"6px 8px"}}>
                      {["IGST","CGST+SGST","Exempt"].map(t=><option key={t}>{t}</option>)}
                    </select>
                  </F>
                  <F label="WO Reference" col="span 2">
                    <input value={s.woRef} onChange={e=>updateScRow(s._id,"woRef",e.target.value)}
                      placeholder="EG/AG/L&T Sikkim/2025-2026" style={{...inp(), fontSize:12, padding:"6px 8px"}}/>
                  </F>
                </div>
              </div>
            ))}
          </div>

          {scRows.length === 0 && (
            <div style={{ textAlign:"center", padding:40, color:"var(--color-text-tertiary)", border:"0.5px dashed var(--color-border-secondary)", borderRadius:8 }}>
              <Users size={28} style={{ opacity:.3, marginBottom:8 }}/>
              <p style={{ fontSize:13, margin:0 }}>No sub-contractors yet. Click "Add Sub-contractor" to start.</p>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
