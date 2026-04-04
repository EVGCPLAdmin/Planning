/**
 * DPREntry.jsx — EG Construction ERP
 * Daily Progress Report with fully cascading, site-dependent dropdowns.
 *
 * Dependency chain:
 *   Project → Site → BOQ Item → Location builder (Hole ID / Stage)
 *                             → Sub-contractor  → Equipment for that scope
 *                             → Personnel       → Entered By
 *                             → Shift / Weather / Hindrances
 *
 * Live mode: all lists come from sheetsClient.js (EmployeeRegister, StockLevels, SC_MASTER)
 * Demo mode: data comes from mockData.js (PROJECT_SITE_MAP, SITE_PERSONNEL, SITE_EQUIPMENT, SC_MASTER)
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardList, CheckCircle2, Search, AlertCircle,
  Printer, ChevronDown, X, Plus, Info, MapPin,
  User, Wrench, Cloud, AlertTriangle, Loader, Tag
} from "lucide-react";

import {
  BOQ_ITEMS, SC_MASTER, SITE_PERSONNEL, SITE_EQUIPMENT,
  HINDRANCE_OPTIONS, BOQ_WORK_TYPE, LOCATION_BLOCKS, PROJECT_SITE_MAP
} from "../data/mockData";

const G="#2E6B2E", GD="#1A3F1A", GL="#EBF5EB";
const today=new Date().toISOString().split("T")[0];
const fmt=n=>"₹"+Math.round(n||0).toLocaleString("en-IN");

// ── Field wrapper ─────────────────────────────────────────────────────────────
function F({ label, required, error, hint, children, col }) {
  return (
    <div style={{ marginBottom:14, gridColumn: col }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <label style={{ fontSize:12, fontWeight:500, color:"var(--color-text-secondary)" }}>
          {label}{required && <span style={{ color:"#E53935", marginLeft:2 }}>*</span>}
        </label>
        {hint && <span style={{ fontSize:10, color:"var(--color-text-tertiary)", fontStyle:"italic" }}>{hint}</span>}
      </div>
      {children}
      {error && <p style={{ margin:"3px 0 0", fontSize:11, color:"#E53935", display:"flex", alignItems:"center", gap:3 }}>
        <AlertCircle size={10}/>{error}
      </p>}
    </div>
  );
}

// ── Base input styles ─────────────────────────────────────────────────────────
const inp = (err=false, extra={}) => ({
  width:"100%", padding:"8px 10px",
  borderRadius:6,
  border:`0.5px solid ${err ? "#E53935" : "var(--color-border-secondary)"}`,
  background:"var(--color-background-primary)",
  fontSize:13, fontFamily:"inherit",
  color:"var(--color-text-primary)", boxSizing:"border-box",
  outline:"none", ...extra
});

// ── Chip multi-select component ───────────────────────────────────────────────
function ChipSelect({ options, value=[], onChange, maxChips=8, placeholder="Add…" }) {
  const [open, setOpen] = useState(false);
  const [customText, setCustomText] = useState("");

  function toggle(opt) {
    if (opt === "Custom…") { setOpen(true); return; }
    onChange(value.includes(opt) ? value.filter(v=>v!==opt) : [...value, opt]);
  }

  function addCustom() {
    const t = customText.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setCustomText("");
  }

  return (
    <div>
      {/* Selected chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:value.length ? 6 : 0 }}>
        {value.map(v => (
          <span key={v} style={{ display:"inline-flex", alignItems:"center", gap:4, background:GL, color:GD, padding:"3px 8px", borderRadius:20, fontSize:12, fontWeight:500, border:`0.5px solid rgba(46,107,46,.25)` }}>
            {v}
            <button type="button" onClick={()=>onChange(value.filter(x=>x!==v))}
              style={{ background:"none", border:"none", cursor:"pointer", color:G, display:"flex", padding:0, marginLeft:2 }}>
              <X size={11}/>
            </button>
          </span>
        ))}
      </div>
      {/* Option list */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
        {options.filter(o=>!value.includes(o)).slice(0, maxChips).map(opt => (
          <button key={opt} type="button" onClick={()=>toggle(opt)}
            style={{ padding:"3px 9px", background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:20, cursor:"pointer", fontSize:11, color:"var(--color-text-secondary)", fontFamily:"inherit" }}>
            {opt==="Custom…" ? <span style={{display:"flex",alignItems:"center",gap:3}}><Plus size={10}/>Custom</span> : opt}
          </button>
        ))}
        {value.length === 0 && options.filter(o=>!value.includes(o)).length === 0 && (
          <span style={{ fontSize:12, color:"var(--color-text-tertiary)" }}>All options selected</span>
        )}
      </div>
      {/* Custom input */}
      {(open || value.includes("Custom…")) && (
        <div style={{ display:"flex", gap:6, marginTop:6 }}>
          <input value={customText} onChange={e=>setCustomText(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&addCustom()}
            placeholder="Type custom hindrance…"
            style={{ ...inp(false), flex:1, padding:"5px 8px", fontSize:12 }} autoFocus/>
          <button type="button" onClick={addCustom} style={{ padding:"5px 10px", background:G, color:"white", border:"none", borderRadius:5, cursor:"pointer", fontSize:12 }}>Add</button>
          <button type="button" onClick={()=>setOpen(false)} style={{ padding:"5px 8px", background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:5, cursor:"pointer", fontSize:12 }}><X size={12}/></button>
        </div>
      )}
    </div>
  );
}

// ── Equipment multi-select ────────────────────────────────────────────────────
function EquipmentSelect({ equipment, value=[], onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Selected tags */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom: value.length ? 6 : 0 }}>
        {value.map(id => {
          const eq = equipment.find(e=>e.id===id);
          return eq ? (
            <span key={id} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#E3F2FD", color:"#1565C0", padding:"3px 8px", borderRadius:20, fontSize:11, fontWeight:500 }}>
              <Wrench size={10}/> {eq.label}
              <button type="button" onClick={()=>onChange(value.filter(v=>v!==id))}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#1565C0", display:"flex", padding:0 }}>
                <X size={10}/>
              </button>
            </span>
          ) : null;
        })}
      </div>
      {/* Dropdown toggle */}
      <button type="button" onClick={()=>setOpen(o=>!o)}
        style={{ ...inp(false), display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", width:"100%", textAlign:"left" }}>
        <span style={{ color: value.length ? "var(--color-text-primary)" : "var(--color-text-tertiary)", fontSize:13 }}>
          {value.length ? `${value.length} equipment selected` : "— Select equipment —"}
        </span>
        <ChevronDown size={13} color="var(--color-text-tertiary)"/>
      </button>
      {open && (
        <div style={{ border:"0.5px solid var(--color-border-secondary)", borderRadius:6, marginTop:2, background:"var(--color-background-primary)", maxHeight:200, overflowY:"auto", boxShadow:"0 4px 16px rgba(0,0,0,.1)" }}>
          {/* Group by type */}
          {["Drilling","Grouting","Power","Support"].map(type => {
            const group = equipment.filter(e=>e.type===type);
            if (!group.length) return null;
            return (
              <div key={type}>
                <div style={{ padding:"5px 10px 2px", fontSize:10, fontWeight:600, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:".06em", background:"var(--color-background-secondary)" }}>{type}</div>
                {group.map(eq => (
                  <label key={eq.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 12px", cursor:"pointer", borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
                    <input type="checkbox" checked={value.includes(eq.id)}
                      onChange={()=>onChange(value.includes(eq.id) ? value.filter(v=>v!==eq.id) : [...value,eq.id])}
                      style={{ cursor:"pointer" }}/>
                    <span style={{ fontSize:12 }}>{eq.label}</span>
                    <span style={{ fontSize:10, color:"var(--color-text-tertiary)", marginLeft:"auto", fontFamily:"monospace" }}>{eq.assetCode}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Location Builder ──────────────────────────────────────────────────────────
function LocationBuilder({ workType, value, onChange, existingLocations }) {
  const [mode, setMode] = useState("builder"); // "builder" | "free" | "recent"
  const [parts, setParts] = useState({ block:"TB2", row:"R9", hole:"", holeType:"P", stage:"" });

  const { blocks, rows, holes, types, stages } = LOCATION_BLOCKS;

  // Build location string from parts
  useEffect(() => {
    if (mode !== "builder") return;
    let loc = "";
    if (workType === "drilling") {
      if (parts.block && parts.row && parts.hole)
        loc = `${parts.block}/${parts.row}/${parts.hole}/${parts.holeType}`;
    } else if (workType === "grouting") {
      if (parts.block && parts.row && parts.hole && parts.stage)
        loc = `${parts.block}/${parts.row}/${parts.hole}/${parts.stage}`;
    } else {
      if (parts.block && parts.row && parts.hole)
        loc = `${parts.block}/${parts.row}/${parts.hole}`;
    }
    onChange(loc);
  }, [parts, workType, mode]);

  const sel = inp => ({ ...inp(false), padding:"6px 8px" });
  const selStyle = { padding:"6px 8px", borderRadius:5, border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)", fontSize:12, fontFamily:"inherit", color:"var(--color-text-primary)" };

  return (
    <div>
      {/* Mode tabs */}
      <div style={{ display:"flex", gap:0, marginBottom:8, border:"0.5px solid var(--color-border-secondary)", borderRadius:6, overflow:"hidden", background:"var(--color-background-secondary)" }}>
        {[["builder","Builder"],["recent","Recent"],["free","Free text"]].map(([id,label])=>(
          <button key={id} type="button" onClick={()=>setMode(id)}
            style={{ flex:1, padding:"5px 0", fontSize:11, fontWeight:mode===id?500:400,
              background:mode===id?"var(--color-background-primary)":"transparent",
              color:mode===id?G:"var(--color-text-secondary)", border:"none", cursor:"pointer",
              borderBottom:mode===id?`2px solid ${G}`:"2px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      {mode === "builder" && (
        <div>
          <div style={{ display:"flex", gap:6, alignItems:"center", flexWrap:"wrap" }}>
            {/* Block */}
            <select value={parts.block} onChange={e=>setParts({...parts,block:e.target.value})} style={selStyle}>
              {blocks.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
            <span style={{ color:"var(--color-text-tertiary)", fontSize:13 }}>/</span>
            {/* Row */}
            <select value={parts.row} onChange={e=>setParts({...parts,row:e.target.value})} style={selStyle}>
              {rows.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            <span style={{ color:"var(--color-text-tertiary)", fontSize:13 }}>/</span>
            {/* Hole # */}
            <select value={parts.hole} onChange={e=>setParts({...parts,hole:e.target.value})} style={{ ...selStyle }}>
              <option value="">Hole #</option>
              {holes.map(h=><option key={h} value={h}>{h}</option>)}
            </select>
            <span style={{ color:"var(--color-text-tertiary)", fontSize:13 }}>/</span>
            {/* Type or Stage */}
            {workType === "grouting" ? (
              <select value={parts.stage} onChange={e=>setParts({...parts,stage:e.target.value})} style={selStyle}>
                <option value="">Stage</option>
                {stages.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <select value={parts.holeType} onChange={e=>setParts({...parts,holeType:e.target.value})} style={selStyle}>
                {types.map(t=><option key={t} value={t}>{t} — {t==="P"?"Primary":t==="S"?"Secondary":"Tertiary"}</option>)}
              </select>
            )}
          </div>
          {value && (
            <div style={{ marginTop:7, padding:"5px 10px", background:GL, borderRadius:5, fontSize:12, fontFamily:"monospace", color:GD, fontWeight:500 }}>
              <MapPin size={11} style={{ marginRight:5 }}/>{value}
            </div>
          )}
        </div>
      )}

      {mode === "recent" && (
        <div>
          {existingLocations.length > 0 ? (
            <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
              {existingLocations.slice(0,12).map(loc=>(
                <button key={loc} type="button" onClick={()=>{ onChange(loc); setMode("recent"); }}
                  style={{ padding:"4px 9px", background: value===loc ? GL : "var(--color-background-secondary)", color: value===loc ? G : "var(--color-text-secondary)", border:`0.5px solid ${value===loc ? G : "var(--color-border-secondary)"}`, borderRadius:20, cursor:"pointer", fontSize:11, fontFamily:"monospace" }}>
                  {loc}
                </button>
              ))}
            </div>
          ) : (
            <p style={{ fontSize:12, color:"var(--color-text-tertiary)", margin:0 }}>No previous locations recorded yet</p>
          )}
        </div>
      )}

      {mode === "free" && (
        <input value={value} onChange={e=>onChange(e.target.value)}
          placeholder="e.g. TB2/R9/1/P or custom location"
          style={{ ...inp(false) }} autoFocus/>
      )}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({status}) => {
  const cfg = status==="Submitted" ? {bg:"#FFF8E1",color:"#E65100"} : {bg:GL,color:G};
  return <span style={{...cfg,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:500}}>{status}</span>;
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function DPREntry({ project, dprs, setDprs, exportDPR, user }) {
  // Derive site from project — project.siteName is the canonical filter key
  // Falls back to PROJECT_SITE_MAP for legacy projects not created via Project Setup
  const siteName = project.siteName || PROJECT_SITE_MAP[project.id] || "";

  // Live data loading
  const [liveData, setLiveData] = useState({ personnel:[], equipment:[], scMaster:[] });
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    setLoading(true);
    import("../utils/sheetsClient").then(sc => Promise.all([
      sc.fetchEmployees({ site: siteName, currentOnly: true }),
      sc.fetchStockLevels({ site: siteName, nonZero: true }),
      sc.fetchSubContractors(),
    ])).then(([emp, stock, sc]) => {
      const equipment = stock
        .filter(s => s["Part Details"]?.startsWith("EGA-"))
        .map(s => ({ id: s["Part Details"], label: s["Part Details"], type:"Asset", assetCode: s["Part Details"] }));
      setLiveData({ personnel: emp, equipment, scMaster: sc });
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, [project.id, siteName]);

  // Reference lists — live data preferred, local config as fallback while loading
  const personnel  = liveData.personnel.length  ? liveData.personnel  : (SITE_PERSONNEL[siteName]  || []);
  const equipment  = liveData.equipment.length  ? liveData.equipment  : (SITE_EQUIPMENT[siteName]  || []);
  const scList     = liveData.scMaster.length   ? liveData.scMaster   : SC_MASTER;
  const boqItems   = BOQ_ITEMS; // always from project's BOQ master

  // Derived from existing DPRs: unique locations for "Recent" tab
  const existingLocations = useMemo(()=>[...new Set(dprs.map(d=>d.location).filter(Boolean))],[dprs]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const emptyForm = useMemo(() => ({
    date:       today,
    boqCode:    "",
    location:   "",
    qty:        "",
    scId:       "",
    equipmentIds: [],
    labourCount: "",
    enteredBy:  user ? (user.empRef || user.name) : "",
    shift:      "Day",
    weather:    "Clear",
    hindrances: ["None"],
    remarks:    "",
  }), [user]);

  const [form, setForm]     = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [toast, setToast]   = useState(null);
  const [filter, setFilter] = useState("");

  const showToast = (msg, type="success") => {
    setToast({ msg, type }); setTimeout(()=>setToast(null), 3500);
  };

  // Derived from selected BOQ item
  const selBOQ = boqItems.find(b => b.code === form.boqCode);
  const workType = selBOQ ? (BOQ_WORK_TYPE[selBOQ.code] || "other") : "other";

  // Remaining qty calculation
  const alreadyQty = useMemo(() =>
    dprs.filter(d=>d.boqCode===form.boqCode).reduce((s,d)=>s+Number(d.qty||0),0),
    [dprs, form.boqCode]
  );
  const balanceQty = selBOQ ? selBOQ.woQty - alreadyQty : 0;

  // Equipment filtered by work type
  const relevantEquipment = useMemo(() => {
    if (!workType || workType==="other") return equipment;
    const typeMap = { drilling:["Drilling","Support","Power"], grouting:["Grouting","Support","Power"], test:["Support","Power"] };
    const allowed = typeMap[workType] || [];
    return equipment.filter(e => allowed.includes(e.type));
  }, [equipment, workType]);

  // Suggested equipment based on SC selected
  const selectedSC = scList.find(s => s.id === form.scId);

  // Auto-suggest equipment when SC + BOQ selected
  useEffect(() => {
    if (!form.scId || !form.boqCode || form.equipmentIds.length > 0) return;
    const suggestions = [];
    if (workType==="drilling") {
      const rig = equipment.find(e=>e.id.includes("odex-150") || e.label.toLowerCase().includes("odex rig 150"));
      const comp = equipment.find(e=>e.type==="Support" && e.label.toLowerCase().includes("compressor"));
      if (rig)  suggestions.push(rig.id);
      if (comp) suggestions.push(comp.id);
    } else if (workType==="grouting") {
      const pump = equipment.find(e=>e.type==="Grouting" && e.label.toLowerCase().includes("pump"));
      const mixer = equipment.find(e=>e.label.toLowerCase().includes("mixer"));
      if (pump)  suggestions.push(pump.id);
      if (mixer) suggestions.push(mixer.id);
    }
    if (suggestions.length) setForm(f=>({...f,equipmentIds:suggestions}));
  }, [form.scId, form.boqCode]);

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.date)            e.date       = "Required";
    if (!form.boqCode)         e.boqCode    = "Select a BOQ item";
    if (!form.location)        e.location   = "Enter location / hole ID";
    if (!form.qty || isNaN(form.qty) || Number(form.qty) <= 0) e.qty = "Enter valid quantity";
    if (selBOQ && Number(form.qty) > balanceQty + 50) e.qty = `Exceeds balance qty (${balanceQty.toLocaleString("en-IN")} ${selBOQ.unit})`;
    if (!form.scId)            e.scId       = "Select sub-contractor";
    if (!form.enteredBy)       e.enteredBy  = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function submit() {
    if (!validate()) return;
    setSaving(true);

    const equipmentLabel = form.equipmentIds
      .map(id => equipment.find(e=>e.id===id)?.label || id)
      .join(" + ");

    const entry = {
      id:          `DPR-${project.id}-${Date.now()}`,
      date:        form.date,
      boqCode:     form.boqCode,
      boqDesc:     selBOQ?.desc || "",
      location:    form.location,
      qty:         Number(form.qty),
      unit:        selBOQ?.unit || "",
      subcon:      selectedSC?.name || form.scId,
      scId:        form.scId,
      equipmentIds:form.equipmentIds,
      equipment:   equipmentLabel,
      labour:      Number(form.labourCount) || 0,
      enteredBy:   form.enteredBy,
      shift:       form.shift,
      weather:     form.weather,
      hindrances:  form.hindrances.filter(h=>h!=="None").join("; ") || "None",
      remarks:     form.remarks,
      site:        siteName,
      status:      "Submitted",
    };

    // Write to sheets
    try {
        const proxyUrl = import.meta.env.VITE_SHEETS_PROXY_URL;
        if (proxyUrl) {
          await fetch(proxyUrl, {
            method:"POST", headers:{"Content-Type":"text/plain"},
            body: JSON.stringify({
              secret: import.meta.env.VITE_SHEETS_PROXY_SECRET,
              action: "appendDPR",
              spreadsheetId: import.meta.env.VITE_SHEET_MASTER || "EG_ERP_SHEETS",
              tabName: "DPR_LOG",
              data: {
                projectId: project.id,
                changedBy: user?.empRef || "",
                row: [
                  entry.id, project.id, entry.date, entry.boqCode, entry.boqDesc,
                  entry.location, entry.qty, entry.unit, entry.subcon,
                  entry.labour, entry.equipment, entry.hindrances,
                  entry.enteredBy, new Date().toLocaleTimeString("en-IN"), entry.status, ""
                ]
              }
            })
          });
        }
    } catch(err) {
      console.warn("DPR write failed:", err.message);
    }

    setDprs([entry, ...dprs]);
    setForm(emptyForm);
    setErrors({});
    setSaving(false);
    showToast(`DPR saved — ${entry.boqCode} · ${entry.location} · ${Number(form.qty).toLocaleString("en-IN")} ${selBOQ?.unit||""}`);
  }

  // ── Filter DPR log ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!filter) return dprs;
    const q = filter.toLowerCase();
    return dprs.filter(d =>
      d.boqCode?.includes(q) ||
      d.location?.toLowerCase().includes(q) ||
      d.subcon?.toLowerCase().includes(q) ||
      d.enteredBy?.toLowerCase().includes(q)
    );
  }, [dprs, filter]);

  // ── Section header ─────────────────────────────────────────────────────────
  const SectionHeader = ({ icon: Icon, label, color=GD }) => (
    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14, paddingBottom:8, borderBottom:`0.5px solid var(--color-border-tertiary)` }}>
      <div style={{ width:22, height:22, borderRadius:5, background:color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <Icon size={12} color={color}/>
      </div>
      <span style={{ fontSize:11, fontWeight:600, color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:".06em" }}>{label}</span>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:24, display:"flex", gap:18, alignItems:"flex-start" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:64, right:24, background:toast.type==="error"?"#C62828":G, color:"white", padding:"10px 18px", borderRadius:8, fontSize:13, display:"flex", alignItems:"center", gap:8, zIndex:200, maxWidth:420, boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
          {toast.type==="error" ? <AlertCircle size={15}/> : <CheckCircle2 size={15}/>}
          {toast.msg}
        </div>
      )}

      {/* ── FORM PANEL ────────────────────────────────────────────────── */}
      <div style={{ width:400, flexShrink:0, background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"1.25rem" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, paddingBottom:12, borderBottom:"0.5px solid var(--color-border-tertiary)" }}>
          <div style={{ width:32, height:32, borderRadius:7, background:GL, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <ClipboardList size={16} color={G}/>
          </div>
          <div>
            <p style={{ margin:0, fontWeight:600, fontSize:14, color:"var(--color-text-primary)" }}>Daily Progress Report</p>
            <p style={{ margin:0, fontSize:11, color:"var(--color-text-tertiary)" }}>
              {project.id} · <span style={{ fontWeight:500, color:G }}>{siteName || "No site"}</span> · {today}
            </p>
          </div>
          {loading && <Loader size={14} color="var(--color-text-tertiary)" style={{ animation:"spin 1s linear infinite", marginLeft:"auto" }}/>}
        </div>

        {/* ── SECTION 1: WHAT & WHEN ─────────────────────────────────── */}
        <SectionHeader icon={ClipboardList} label="Work Details" color={G}/>

        {/* Date + Shift */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <F label="Date" required error={errors.date}>
            <input type="date" value={form.date} max={today}
              onChange={e=>setForm({...form,date:e.target.value})}
              style={inp(errors.date)}/>
          </F>
          <F label="Shift">
            <select value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} style={inp(false)}>
              {["Day","Night","Full Day","Double Shift"].map(s=><option key={s}>{s}</option>)}
            </select>
          </F>
        </div>

        {/* BOQ Item */}
        <F label="BOQ Item" required error={errors.boqCode}>
          <select value={form.boqCode}
            onChange={e=>setForm({...form,boqCode:e.target.value,equipmentIds:[],location:""})}
            style={inp(errors.boqCode)}>
            <option value="">— Select BOQ item —</option>
            {boqItems.map(b=>(
              <option key={b.code} value={b.code}>
                {b.code} — {b.desc.slice(0,45)}{b.desc.length>45?"…":""}
              </option>
            ))}
          </select>
        </F>

        {/* BOQ info card */}
        {selBOQ && (
          <div style={{ background:GL, border:"0.5px solid rgba(46,107,46,.2)", borderRadius:7, padding:"8px 12px", marginTop:-8, marginBottom:14 }}>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              {[
                ["Unit",    selBOQ.unit],
                ["Rate",    fmt(selBOQ.rate)],
                ["WO Qty",  selBOQ.woQty.toLocaleString("en-IN")],
                ["Billed",  alreadyQty.toLocaleString("en-IN")],
                ["Balance", balanceQty < 0 ? `(${Math.abs(balanceQty).toLocaleString("en-IN")}) ⚠` : balanceQty.toLocaleString("en-IN")],
              ].map(([k,v])=>(
                <div key={k}>
                  <p style={{ margin:0, fontSize:9, color:G, fontWeight:600, textTransform:"uppercase" }}>{k}</p>
                  <p style={{ margin:0, fontSize:13, fontWeight:500, color: k==="Balance"&&balanceQty<0?"#C62828":GD, fontFamily:"monospace" }}>{v}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop:5 }}>
              <div style={{ height:4, background:"rgba(46,107,46,.15)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.min((alreadyQty/selBOQ.woQty)*100,100)}%`, background:G, borderRadius:2 }}/>
              </div>
              <p style={{ margin:"2px 0 0", fontSize:10, color:G }}>{Math.min(((alreadyQty/selBOQ.woQty)*100),100).toFixed(1)}% complete</p>
            </div>
          </div>
        )}

        {/* Quantity */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <F label="Quantity" required error={errors.qty} hint={selBOQ?.unit}>
            <input type="number" value={form.qty} min="0" step="0.01"
              onChange={e=>setForm({...form,qty:e.target.value})}
              placeholder="0.00"
              style={inp(errors.qty)}/>
          </F>
          <F label="Weather">
            <select value={form.weather} onChange={e=>setForm({...form,weather:e.target.value})} style={inp(false)}>
              {["Clear","Partly cloudy","Overcast","Rain – light","Rain – heavy","Fog","Snow","Extreme cold – halt"].map(w=><option key={w}>{w}</option>)}
            </select>
          </F>
        </div>

        {/* ── SECTION 2: WHERE ──────────────────────────────────────── */}
        <SectionHeader icon={MapPin} label="Location" color="#1565C0"/>
        <F label="Hole ID / Location" required error={errors.location}
          hint={workType==="drilling"?"Block / Row / Hole # / P-S-T":workType==="grouting"?"Block / Row / Hole # / Stage":""}>
          <LocationBuilder
            workType={workType}
            value={form.location}
            onChange={loc=>setForm({...form,location:loc})}
            existingLocations={existingLocations}
          />
        </F>

        {/* ── SECTION 3: WHO ────────────────────────────────────────── */}
        <SectionHeader icon={User} label="Personnel & Sub-contractor" color="#6A1B9A"/>

        {/* Sub-contractor */}
        <F label="Sub-contractor" required error={errors.scId}>
          <select value={form.scId}
            onChange={e=>setForm({...form,scId:e.target.value,equipmentIds:[]})}
            style={inp(errors.scId)}>
            <option value="">— Select sub-contractor —</option>
            {scList.map(s=>(
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </F>

        {/* SC info badge */}
        {selectedSC && (
          <div style={{ background:"#F3E5F5", border:"0.5px solid rgba(106,27,154,.2)", borderRadius:7, padding:"6px 10px", marginTop:-8, marginBottom:14, display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:11, color:"#6A1B9A", fontWeight:500 }}>{selectedSC.scope}</span>
            <span style={{ fontSize:11, color:"#6A1B9A", fontFamily:"monospace", marginLeft:"auto" }}>{fmt(selectedSC.rate)}/{selectedSC.unit}</span>
          </div>
        )}

        {/* Labour */}
        <F label="Labour count (nos.)" hint="Working on site today">
          <input type="number" min="0" value={form.labourCount}
            onChange={e=>setForm({...form,labourCount:e.target.value})}
            placeholder="0"
            style={inp(false)}/>
        </F>

        {/* Entered By */}
        <F label="Entered by" required error={errors.enteredBy}>
          {personnel.length > 0 ? (
            <select value={form.enteredBy}
              onChange={e=>setForm({...form,enteredBy:e.target.value})}
              style={inp(errors.enteredBy)}>
              <option value="">— Select —</option>
              {personnel.map(p=>(
                <option key={p.empRef} value={p.empRef}>
                  {p.name} — {p.designation}
                </option>
              ))}
            </select>
          ) : (
            <input value={form.enteredBy}
              onChange={e=>setForm({...form,enteredBy:e.target.value})}
              placeholder="Site Engineer name"
              style={inp(errors.enteredBy)}/>
          )}
        </F>

        {/* ── SECTION 4: EQUIPMENT ─────────────────────────────────── */}
        <SectionHeader icon={Wrench} label="Equipment Deployed" color="#E65100"/>
        <F label="Equipment" hint={form.equipmentIds.length ? `${form.equipmentIds.length} selected` : "Select from site assets"}>
          <EquipmentSelect
            equipment={relevantEquipment.length ? relevantEquipment : equipment}
            value={form.equipmentIds}
            onChange={ids=>setForm({...form,equipmentIds:ids})}
          />
        </F>

        {/* ── SECTION 5: HINDRANCES ────────────────────────────────── */}
        <SectionHeader icon={AlertTriangle} label="Hindrances & Remarks" color="#C62828"/>
        <F label="Hindrances" hint="Select all that apply">
          <ChipSelect
            options={HINDRANCE_OPTIONS}
            value={form.hindrances}
            onChange={h=>{
              // If "None" selected, clear others; if anything else selected, remove "None"
              let next = h;
              if (h.includes("None") && h.length > 1) next = h.filter(x=>x!=="None");
              else if (!h.includes("None") && h.length===0) next = ["None"];
              setForm({...form, hindrances: next});
            }}
          />
        </F>

        <F label="Additional remarks">
          <textarea value={form.remarks}
            onChange={e=>setForm({...form,remarks:e.target.value})}
            rows={2} placeholder="Any additional notes, instructions received, conditions observed…"
            style={{ ...inp(false), resize:"vertical" }}/>
        </F>

        {/* Submit */}
        <div style={{ display:"flex", gap:8, marginTop:4 }}>
          <button type="button" onClick={submit} disabled={saving}
            style={{ flex:1, padding:"10px 0", background:saving?"#AAA":GD, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            {saving ? <><Loader size={13} style={{animation:"spin .7s linear infinite"}}/> Saving…</> : <><CheckCircle2 size={14}/> Save DPR Entry</>}
          </button>
          <button type="button" onClick={()=>{setForm(emptyForm);setErrors({});}}
            style={{ padding:"10px 14px", background:"transparent", border:"0.5px solid var(--color-border-secondary)", borderRadius:7, fontSize:13, cursor:"pointer" }}>
            Clear
          </button>
        </div>
      </div>

      {/* ── LOG PANEL ─────────────────────────────────────────────────── */}
      <div style={{ flex:1, background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, padding:"1.25rem", minWidth:0 }}>

        {/* Log header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div>
            <p style={{ margin:0, fontWeight:600, fontSize:14 }}>DPR Log</p>
            <p style={{ margin:0, fontSize:11, color:"var(--color-text-tertiary)" }}>{dprs.length} entries · {siteName}</p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, border:"0.5px solid var(--color-border-secondary)", borderRadius:6, padding:"6px 10px", background:"var(--color-background-primary)" }}>
              <Search size={13} color="var(--color-text-tertiary)"/>
              <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search…"
                style={{ border:"none", outline:"none", fontSize:12, background:"transparent", width:130, color:"var(--color-text-primary)" }}/>
              {filter && <button onClick={()=>setFilter("")} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--color-text-tertiary)", display:"flex" }}><X size={11}/></button>}
            </div>
            <button onClick={()=>exportDPR&&exportDPR("","")}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 12px", background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:6, fontSize:12, cursor:"pointer", color:"var(--color-text-secondary)" }}>
              <Printer size={13}/>Export
            </button>
          </div>
        </div>

        {/* Log table */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ background:"var(--color-background-secondary)" }}>
                {["Date","Shift","BOQ","Location","Qty","Unit","Sub-contractor","Labour","Equipment","Weather","Hindrances","By","Status"].map(h=>(
                  <th key={h} style={{ padding:"7px 8px", textAlign:"left", fontWeight:500, fontSize:11, color:"var(--color-text-tertiary)", borderBottom:"0.5px solid var(--color-border-tertiary)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={13} style={{ textAlign:"center", padding:40, color:"var(--color-text-tertiary)", fontSize:13 }}>
                  {filter ? "No entries match the search" : "No DPR entries yet — use the form to record progress"}
                </td></tr>
              ) : filtered.map((d,i) => (
                <tr key={d.id||i} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", background:i%2===0?"transparent":"var(--color-background-secondary)" }}>
                  <td style={{ padding:"7px 8px", fontFamily:"monospace", fontSize:11, whiteSpace:"nowrap" }}>{d.date}</td>
                  <td style={{ padding:"7px 8px", fontSize:11, color:"var(--color-text-tertiary)" }}>{d.shift||"Day"}</td>
                  <td style={{ padding:"7px 8px", fontWeight:500, color:G, whiteSpace:"nowrap" }}>{d.boqCode}</td>
                  <td style={{ padding:"7px 8px", fontFamily:"monospace", fontSize:11, whiteSpace:"nowrap" }}>{d.location}</td>
                  <td style={{ padding:"7px 8px", textAlign:"right", fontFamily:"monospace", fontWeight:500 }}>{Number(d.qty).toLocaleString("en-IN")}</td>
                  <td style={{ padding:"7px 8px", color:"var(--color-text-tertiary)", fontSize:11 }}>{d.unit}</td>
                  <td style={{ padding:"7px 8px", maxWidth:110, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:11 }}>{d.subcon}</td>
                  <td style={{ padding:"7px 8px", textAlign:"right", fontSize:11 }}>{d.labour||"—"}</td>
                  <td style={{ padding:"7px 8px", maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:11, color:"var(--color-text-secondary)" }}>{d.equipment||"—"}</td>
                  <td style={{ padding:"7px 8px", fontSize:11, whiteSpace:"nowrap" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:"var(--color-text-secondary)" }}>
                      <Cloud size={10}/>{d.weather||"—"}
                    </span>
                  </td>
                  <td style={{ padding:"7px 8px", fontSize:11, maxWidth:150, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:d.hindrances&&d.hindrances!=="None"?"#C62828":"var(--color-text-tertiary)" }}>
                    {d.hindrances||"—"}
                  </td>
                  <td style={{ padding:"7px 8px", fontSize:11, color:"var(--color-text-secondary)", whiteSpace:"nowrap" }}>
                    {typeof d.enteredBy === "string" && d.enteredBy.includes("|")
                      ? d.enteredBy.split("|")[1]
                      : d.enteredBy || "—"}
                  </td>
                  <td style={{ padding:"7px 8px" }}><StatusBadge status={d.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
