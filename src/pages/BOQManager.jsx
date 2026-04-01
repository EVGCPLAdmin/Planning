import { useState, useMemo } from "react";
import {
  Search, Plus, Edit3, Check, X, AlertTriangle,
  ChevronUp, ChevronDown, Download, Filter,
  TrendingUp, Package, AlertCircle, CheckCircle2
} from "lucide-react";

const G = "#2E6B2E", GD = "#1A3F1A", GL = "#EBF5EB";
const fmt = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const fmtL = (n) => "₹" + ((n || 0) / 100000).toFixed(2) + "L";

const statusConfig = {
  complete:   { label: "Complete",     bg: "#EBF5EB", color: G,         dot: G },
  overdue:    { label: "Over-billed",  bg: "#FEECEC", color: "#C62828", dot: "#C62828" },
  watch:      { label: "Watch",        bg: "#FFF8E1", color: "#F57F17", dot: "#F57F17" },
  inprogress: { label: "In Progress",  bg: "#E3F2FD", color: "#1565C0", dot: "#1565C0" },
  notstarted: { label: "Not Started",  bg: "#F5F5F5", color: "#9E9E9E", dot: "#9E9E9E" },
};

const getStatus = (pct) => {
  if (pct >= 100) return "complete";
  if (pct > 100)  return "overdue";
  if (pct >= 80)  return "watch";
  if (pct > 0)    return "inprogress";
  return "notstarted";
};

export default function BOQManager({ project, boqItems, setBoqItems, raBills }) {
  const [editingId, setEditingId]   = useState(null);
  const [editVal, setEditVal]       = useState("");
  const [showVO, setShowVO]         = useState(false);
  const [voForm, setVoForm]         = useState({ code: "", desc: "", unit: "", rate: "", qty: "", ref: "", reason: "" });
  const [voErrors, setVoErrors]     = useState({});
  const [search, setSearch]         = useState("");
  const [sortKey, setSortKey]       = useState("code");
  const [sortDir, setSortDir]       = useState("asc");
  const [filter, setFilter]         = useState("all");
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const totalContract = useMemo(() =>
    boqItems.reduce((s, b) => s + b.woQty * b.rate, 0), [boqItems]);
  const totalRevised = useMemo(() =>
    boqItems.reduce((s, b) => s + (b.revisedQty || b.woQty) * b.rate, 0), [boqItems]);
  const totalBilled = useMemo(() =>
    boqItems.reduce((s, b) => s + b.billedQty * b.rate, 0), [boqItems]);
  const overItems = useMemo(() =>
    boqItems.filter(b => b.billedQty > (b.revisedQty || b.woQty)).length, [boqItems]);

  const sorted = useMemo(() => {
    let list = [...boqItems];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.code.toLowerCase().includes(q) ||
        b.desc.toLowerCase().includes(q) ||
        (b.wbs || "").toLowerCase().includes(q)
      );
    }
    if (filter !== "all") {
      list = list.filter(b => {
        const pct = (b.billedQty / (b.revisedQty || b.woQty)) * 100;
        if (filter === "overdue")    return b.billedQty > (b.revisedQty || b.woQty);
        if (filter === "watch")      return pct >= 80 && pct < 100;
        if (filter === "inprogress") return pct > 0 && pct < 80;
        if (filter === "notstarted") return b.billedQty === 0;
        return true;
      });
    }
    list.sort((a, b) => {
      let av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [boqItems, search, filter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const startEdit = (item) => {
    setEditingId(item.code);
    setEditVal(String(item.revisedQty ?? item.woQty));
  };

  const saveEdit = (item) => {
    const val = parseFloat(editVal);
    if (isNaN(val) || val < 0) { showToast("Enter a valid quantity", "error"); return; }
    setBoqItems(prev => prev.map(b =>
      b.code === item.code ? { ...b, revisedQty: val, isRevised: val !== b.woQty } : b
    ));
    setEditingId(null);
    showToast(`Revised qty updated for ${item.code}`);
  };

  const validateVO = () => {
    const e = {};
    if (!voForm.code.trim())   e.code = "Required";
    if (!voForm.desc.trim())   e.desc = "Required";
    if (!voForm.unit.trim())   e.unit = "Required";
    if (!voForm.rate || isNaN(voForm.rate) || +voForm.rate <= 0) e.rate = "Enter valid rate";
    if (!voForm.qty  || isNaN(voForm.qty)  || +voForm.qty  <= 0) e.qty  = "Enter valid qty";
    if (!voForm.ref.trim())    e.ref  = "VO reference required";
    setVoErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitVO = () => {
    if (!validateVO()) return;
    const newItem = {
      code:       voForm.code.trim(),
      wbs:        `CI-${project.id}-VO-${voForm.ref.trim()}`,
      desc:       voForm.desc.trim() + ` [VO: ${voForm.ref.trim()}]`,
      unit:       voForm.unit.trim(),
      woQty:      +voForm.qty,
      revisedQty: +voForm.qty,
      rate:       +voForm.rate,
      billedQty:  0,
      isVO:       true,
      voRef:      voForm.ref.trim(),
      voReason:   voForm.reason.trim(),
    };
    setBoqItems(prev => [...prev, newItem]);
    setVoForm({ code: "", desc: "", unit: "", rate: "", qty: "", ref: "", reason: "" });
    setVoErrors({});
    setShowVO(false);
    showToast(`Variation Order ${voForm.ref} added to BOQ`);
  };

  const SortIcon = ({ k }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : <ChevronUp size={12} style={{ opacity: 0.2 }} />;

  const thStyle = (k) => ({
    padding: "8px 10px", textAlign: "left", fontSize: 11, fontWeight: 500,
    color: "#888", borderBottom: "0.5px solid rgba(0,0,0,.1)",
    whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
    background: "var(--color-background-secondary)"
  });

  const inputSm = (err) => ({
    width: "100%", padding: "6px 8px", borderRadius: 6, fontSize: 12,
    border: `0.5px solid ${err ? "#E53935" : "rgba(0,0,0,.2)"}`,
    background: "white", color: "#1A1A1A", boxSizing: "border-box"
  });

  const filters = [
    { id: "all",        label: "All",          count: boqItems.length },
    { id: "overdue",    label: "Over-billed",  count: boqItems.filter(b => b.billedQty > (b.revisedQty||b.woQty)).length },
    { id: "watch",      label: "Watch (≥80%)", count: boqItems.filter(b => { const p=(b.billedQty/(b.revisedQty||b.woQty))*100; return p>=80&&p<100; }).length },
    { id: "inprogress", label: "In Progress",  count: boqItems.filter(b => { const p=(b.billedQty/(b.revisedQty||b.woQty))*100; return p>0&&p<80; }).length },
    { id: "notstarted", label: "Not Started",  count: boqItems.filter(b => b.billedQty===0).length },
  ];

  return (
    <div style={{ padding: 24 }}>
      {toast && (
        <div style={{ position: "absolute", top: 64, right: 24, background: toast.type === "error" ? "#C62828" : G, color: "white", padding: "10px 18px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8, zIndex: 100 }}>
          {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {toast.msg}
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          ["Contract BOQ Value",  fmtL(totalContract), "Original WO total",         G       ],
          ["Revised BOQ Value",   fmtL(totalRevised),  "After VOs and revisions",   "#1565C0"],
          ["Total Billed Value",  fmtL(totalBilled),   `${boqItems.filter(b=>b.billedQty>0).length} items with billing`, "#F57F17"],
          ["Over-billed Items",   overItems,           overItems > 0 ? "⚠ Review required" : "All within limits", overItems > 0 ? "#C62828" : G],
        ].map(([l, v, s, c]) => (
          <div key={l} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "1rem 1.25rem", borderLeft: `3px solid ${c}` }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: ".05em" }}>{l}</p>
            <p style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 500, fontFamily: "monospace", color: "#1A1A1A" }}>{v}</p>
            <p style={{ margin: 0, fontSize: 11, color: c, fontWeight: overItems > 0 && l === "Over-billed Items" ? 600 : 400 }}>{s}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filters.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: "5px 12px", borderRadius: 20, border: "0.5px solid", borderColor: filter === f.id ? G : "rgba(0,0,0,.15)", background: filter === f.id ? GL : "transparent", color: filter === f.id ? G : "#666", fontSize: 12, fontWeight: filter === f.id ? 500 : 400, cursor: "pointer" }}>
              {f.label}
              <span style={{ marginLeft: 5, background: filter === f.id ? G : "#E0E0E0", color: filter === f.id ? "white" : "#666", padding: "1px 6px", borderRadius: 10, fontSize: 10 }}>{f.count}</span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, border: "0.5px solid rgba(0,0,0,.15)", borderRadius: 6, padding: "6px 10px" }}>
            <Search size={13} color="#aaa" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search BOQ items..." style={{ border: "none", outline: "none", fontSize: 12, background: "transparent", width: 160, color: "#1A1A1A" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#aaa", display: "flex" }}><X size={12} /></button>}
          </div>
          <button onClick={() => setShowVO(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#1565C0", color: "white", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            <Plus size={13} /> Add Variation Order
          </button>
        </div>
      </div>

      {/* Variation Order modal */}
      {showVO && (
        <div style={{ background: "var(--color-background-primary)", border: "1.5px solid #1565C0", borderRadius: 12, padding: "1.25rem", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: 14, color: "#1565C0" }}>Add Variation Order Item</p>
              <p style={{ margin: 0, fontSize: 11, color: "#888" }}>Extra scope approved by client — tracked separately from original BOQ</p>
            </div>
            <button onClick={() => { setShowVO(false); setVoErrors({}); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#888", display: "flex" }}><X size={16} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { key: "ref",   label: "VO Reference No. *",   placeholder: "e.g. VO-001" },
              { key: "code",  label: "Cost Code *",           placeholder: "e.g. 1000.7" },
              { key: "unit",  label: "Unit *",                placeholder: "RMT / Nos / Kg" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 4 }}>{f.label}</label>
                <input value={voForm[f.key]} onChange={e => setVoForm({ ...voForm, [f.key]: e.target.value })} placeholder={f.placeholder} style={inputSm(voErrors[f.key])} />
                {voErrors[f.key] && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#E53935" }}>{voErrors[f.key]}</p>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 4 }}>Description of VO Work *</label>
            <input value={voForm.desc} onChange={e => setVoForm({ ...voForm, desc: e.target.value })} placeholder="Describe the variation order scope..." style={{ ...inputSm(voErrors.desc), width: "100%" }} />
            {voErrors.desc && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#E53935" }}>{voErrors.desc}</p>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 10, marginTop: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 4 }}>Rate (₹/Unit) *</label>
              <input type="number" value={voForm.rate} onChange={e => setVoForm({ ...voForm, rate: e.target.value })} placeholder="0.00" style={inputSm(voErrors.rate)} />
              {voErrors.rate && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#E53935" }}>{voErrors.rate}</p>}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 4 }}>Approved Qty *</label>
              <input type="number" value={voForm.qty} onChange={e => setVoForm({ ...voForm, qty: e.target.value })} placeholder="0" style={inputSm(voErrors.qty)} />
              {voErrors.qty && <p style={{ margin: "2px 0 0", fontSize: 10, color: "#E53935" }}>{voErrors.qty}</p>}
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 4 }}>Reason / Client Instruction</label>
              <input value={voForm.reason} onChange={e => setVoForm({ ...voForm, reason: e.target.value })} placeholder="Brief reason for variation..." style={inputSm(false)} />
            </div>
          </div>
          {voForm.rate && voForm.qty && !isNaN(voForm.rate) && !isNaN(voForm.qty) && (
            <div style={{ marginTop: 10, background: "#E3F2FD", border: "0.5px solid #90CAF9", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#1565C0" }}>
              VO Amount: <strong>{fmt(+voForm.rate * +voForm.qty)}</strong> ({voForm.qty} {voForm.unit || "units"} × {fmt(+voForm.rate)})
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={submitVO} style={{ padding: "8px 20px", background: "#1565C0", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Add VO Item</button>
            <button onClick={() => { setShowVO(false); setVoErrors({}); }} style={{ padding: "8px 14px", background: "transparent", border: "0.5px solid rgba(0,0,0,.2)", borderRadius: 6, fontSize: 13, cursor: "pointer", color: "#555" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Main table */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {[
                  { key: "code",    label: "Cost Code"   },
                  { key: "wbs",     label: "WBS Code"    },
                  { key: "desc",    label: "Description" },
                  { key: "unit",    label: "Unit"        },
                  { key: "woQty",   label: "WO Qty"      },
                  { key: null,      label: "Revised Qty" },
                  { key: "rate",    label: "Rate (₹)"    },
                  { key: null,      label: "WO Amount"   },
                  { key: "billedQty",label: "Billed Qty" },
                  { key: null,      label: "Balance Qty" },
                  { key: null,      label: "% Complete"  },
                  { key: null,      label: "Status"      },
                  { key: null,      label: ""            },
                ].map(({ key, label }) => (
                  <th key={label} onClick={() => key && toggleSort(key)}
                    style={{ ...thStyle(key), cursor: key ? "pointer" : "default", textAlign: label === "WO Qty" || label === "Revised Qty" || label === "Rate (₹)" || label === "WO Amount" || label === "Billed Qty" || label === "Balance Qty" ? "right" : "left" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                      {label} {key && <SortIcon k={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, i) => {
                const revQty   = item.revisedQty ?? item.woQty;
                const pct      = revQty > 0 ? Math.round((item.billedQty / revQty) * 100) : 0;
                const balance  = revQty - item.billedQty;
                const woAmt    = item.woQty * item.rate;
                const statusKey = item.billedQty > revQty ? "overdue" : getStatus(pct);
                const st       = statusConfig[statusKey];
                const isEditing = editingId === item.code;
                const rowBg = i % 2 === 0 ? "transparent" : "var(--color-background-secondary)";

                return (
                  <tr key={item.code} style={{ borderBottom: "0.5px solid rgba(0,0,0,.05)", background: item.isVO ? "#F3E5F5" : rowBg }}>
                    <td style={{ padding: "8px 10px", fontWeight: 500, color: item.isVO ? "#6A1B9A" : G, whiteSpace: "nowrap" }}>
                      {item.code}
                      {item.isVO && <span style={{ marginLeft: 4, fontSize: 10, background: "#E1BEE7", color: "#6A1B9A", padding: "1px 5px", borderRadius: 8 }}>VO</span>}
                      {item.isRevised && !item.isVO && <span style={{ marginLeft: 4, fontSize: 10, background: "#E3F2FD", color: "#1565C0", padding: "1px 5px", borderRadius: 8 }}>Revised</span>}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#888", fontSize: 11, whiteSpace: "nowrap" }}>{item.wbs}</td>
                    <td style={{ padding: "8px 10px", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.desc}</td>
                    <td style={{ padding: "8px 10px", color: "#888", textAlign: "center" }}>{item.unit}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>{item.woQty.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", alignItems: "center" }}>
                          <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveEdit(item); if (e.key === "Escape") setEditingId(null); }}
                            style={{ width: 80, padding: "4px 6px", border: `1.5px solid ${G}`, borderRadius: 5, fontSize: 12, textAlign: "right", fontFamily: "monospace" }} autoFocus />
                          <button onClick={() => saveEdit(item)} style={{ background: GL, border: "none", borderRadius: 4, cursor: "pointer", padding: 4, color: G, display: "flex" }}><Check size={13} /></button>
                          <button onClick={() => setEditingId(null)} style={{ background: "#F5F5F5", border: "none", borderRadius: 4, cursor: "pointer", padding: 4, color: "#888", display: "flex" }}><X size={13} /></button>
                        </div>
                      ) : (
                        <span style={{ fontFamily: "monospace", color: item.isRevised ? "#1565C0" : "#1A1A1A", fontWeight: item.isRevised ? 500 : 400 }}>
                          {revQty.toLocaleString("en-IN")}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>{fmt(item.rate)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "#555" }}>{fmtL(woAmt)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: item.billedQty > 0 ? 500 : 400 }}>{item.billedQty.toLocaleString("en-IN")}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: balance < 0 ? "#C62828" : "#1A1A1A", fontWeight: balance < 0 ? 600 : 400 }}>
                      {balance < 0 ? "(" + Math.abs(balance).toLocaleString("en-IN") + ")" : balance.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "8px 10px", minWidth: 110 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 5, background: "#E5E7EB", borderRadius: 3 }}>
                          <div style={{ height: 5, borderRadius: 3, background: pct >= 100 ? "#C62828" : pct >= 80 ? "#F57F17" : G, width: `${Math.min(pct, 100)}%`, transition: "width .4s" }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "monospace", minWidth: 32, textAlign: "right", color: pct >= 100 ? "#C62828" : "#1A1A1A", fontWeight: pct >= 100 ? 600 : 400 }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{ background: st.bg, color: st.color, padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, display: "inline-block" }} />{st.label}
                      </span>
                    </td>
                    <td style={{ padding: "8px 6px" }}>
                      {!isEditing && (
                        <button onClick={() => startEdit(item)} style={{ background: "transparent", border: "0.5px solid rgba(0,0,0,.12)", borderRadius: 5, cursor: "pointer", padding: "4px 7px", color: "#666", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                          <Edit3 size={11} /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={13} style={{ textAlign: "center", padding: 32, color: "#bbb", fontSize: 13 }}>No BOQ items match the current filter</td></tr>
              )}
            </tbody>
            {/* Totals */}
            {sorted.length > 0 && (
              <tfoot>
                <tr style={{ background: GD, borderTop: `2px solid ${G}` }}>
                  <td colSpan={4} style={{ padding: "9px 10px", color: "white", fontWeight: 500, fontSize: 12 }}>TOTALS ({sorted.length} items)</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", color: "white", fontSize: 12 }}>{sorted.reduce((s, b) => s + b.woQty, 0).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", color: "white", fontSize: 12 }}>{sorted.reduce((s, b) => s + (b.revisedQty ?? b.woQty), 0).toLocaleString("en-IN")}</td>
                  <td style={{ padding: "9px 10px", color: "rgba(255,255,255,.4)", fontSize: 11 }}>—</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", color: "white", fontWeight: 500, fontSize: 12 }}>{fmtL(sorted.reduce((s, b) => s + b.woQty * b.rate, 0))}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "monospace", color: "white", fontWeight: 500, fontSize: 12 }}>{sorted.reduce((s, b) => s + b.billedQty, 0).toLocaleString("en-IN")}</td>
                  <td colSpan={4} style={{ padding: "9px 10px", color: "rgba(255,255,255,.6)", fontSize: 11 }}>
                    {fmtL(sorted.reduce((s, b) => s + b.billedQty * b.rate, 0))} billed of {fmtL(sorted.reduce((s, b) => s + b.woQty * b.rate, 0))} contract
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {overItems > 0 && (
        <div style={{ marginTop: 12, background: "#FEECEC", border: "0.5px solid #EF9A9A", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#C62828" }}>
          <AlertTriangle size={16} />
          <strong>{overItems} BOQ item{overItems > 1 ? "s" : ""}</strong> have billed quantity exceeding revised WO quantity. A Variation Order must be raised before next RA Bill submission.
        </div>
      )}
    </div>
  );
}
