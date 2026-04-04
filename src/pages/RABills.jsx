/**
 * RABills.jsx — EG Construction ERP
 *
 * Workflow:
 *   1. DPR entries are the source of truth for work done.
 *   2. User selects billing period (from date → to date).
 *   3. App queries DPR entries within that period, groups by BOQ code, sums qty.
 *   4. Previous cumulative is read from all prior submitted bills' lines.
 *   5. Table shows: WO Qty | Prev Cumulative | This Period (from DPR) | Cumulative | Rate | Amount
 *   6. User can adjust "This Period" qty before submitting (in case of measurement corrections).
 *   7. On Submit → writes bill to RA_BILLS + RA_BILL_LINES via proxy.
 */

import { useState, useMemo } from "react";
import {
  Plus, X, ArrowRight, Check, Printer, Eye, AlertTriangle,
  ChevronRight, ClipboardList, IndianRupee, CheckCircle2,
  AlertCircle, Info
} from "lucide-react";

import { BOQ_ITEMS, PROJECTS } from "../data/mockData";

const G="#2E6B2E", GD="#1A3F1A", GL="#EBF5EB";
const today = new Date().toISOString().split("T")[0];

const fmt  = n => "₹" + Math.round(n||0).toLocaleString("en-IN");
const fmtL = n => { const v=Math.abs(n||0); return (n<0?"-":""+"₹")+(v>=100000?(v/100000).toFixed(2)+"L":Math.round(v).toLocaleString("en-IN")); };

const STATUS_CFG = {
  Paid:      { bg:"#EBF5EB", color:G,         dot:G         },
  Certified: { bg:"#E3F2FD", color:"#1565C0",  dot:"#1565C0" },
  Submitted: { bg:"#FFF8E1", color:"#E65100",  dot:"#E65100" },
};
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.Submitted;
  return (
    <span style={{ background:c.bg, color:c.color, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:500, display:"inline-flex", alignItems:"center", gap:5 }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot }}/>{status}
    </span>
  );
}

function F({ label, required, children, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <label style={{ fontSize:12, fontWeight:500, color:"var(--color-text-secondary)" }}>
          {label}{required && <span style={{ color:"#E53935", marginLeft:2 }}>*</span>}
        </label>
        {hint && <span style={{ fontSize:10, color:"var(--color-text-tertiary)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inp = { padding:"7px 10px", borderRadius:6, border:"0.5px solid var(--color-border-secondary)", background:"var(--color-background-primary)", fontSize:13, fontFamily:"inherit", color:"var(--color-text-primary)", width:"100%", boxSizing:"border-box" };
const cardStyle = { background:"var(--color-background-primary)", border:"0.5px solid var(--color-border-tertiary)", borderRadius:12, overflow:"hidden" };
const STEPS = ["Period", "Quantities", "Deductions", "Preview & Submit"];

export default function RABills({ project, bills, setBills, dprs, exportBill }) {
  const [showForm, setShowForm]   = useState(false);
  const [step, setStep]           = useState(0);
  const [viewBill, setViewBill]   = useState(null);
  const [toast, setToast]         = useState(null);
  const [saving, setSaving]       = useState(false);

  // Form state
  const [period, setPeriod] = useState({ from:"", to:"" });
  const [overrides, setOverrides] = useState({}); // boqCode → adjusted qty
  const [ded, setDed] = useState({ ret:5, adv:0, tds:2, ld:0 });

  const showToast = (msg, type="success") => {
    setToast({ msg, type }); setTimeout(()=>setToast(null), 3500);
  };

  // ── Compute "previous cumulative" from all prior submitted bills ─────────────
  const prevCumulative = useMemo(() => {
    const cum = {};
    BOQ_ITEMS.forEach(b => { cum[b.code] = 0; });
    bills.forEach(bill => {
      (bill.lines || []).forEach(line => {
        cum[line.boqCode] = (cum[line.boqCode] || 0) + line.thisQty;
      });
    });
    return cum;
  }, [bills]);

  // ── Compute "this period" from DPR entries in selected date range ────────────
  const dprThisPeriod = useMemo(() => {
    if (!period.from || !period.to) return {};
    const from = new Date(period.from);
    const to   = new Date(period.to);
    to.setHours(23,59,59);

    const sums = {};
    BOQ_ITEMS.forEach(b => { sums[b.code] = 0; });

    dprs.forEach(dpr => {
      const d = new Date(dpr.date);
      if (d >= from && d <= to && dpr.boqCode) {
        sums[dpr.boqCode] = (sums[dpr.boqCode] || 0) + Number(dpr.qty || 0);
      }
    });
    return sums;
  }, [dprs, period.from, period.to]);

  // ── Final "this bill" quantities — DPR sums unless user overrode ─────────────
  const thisBillQty = useMemo(() => {
    const q = {};
    BOQ_ITEMS.forEach(b => {
      q[b.code] = overrides[b.code] !== undefined
        ? Number(overrides[b.code])
        : (dprThisPeriod[b.code] || 0);
    });
    return q;
  }, [dprThisPeriod, overrides]);

  // ── Bill lines (only items with qty > 0) ────────────────────────────────────
  const billLines = useMemo(() => {
    return BOQ_ITEMS.map(b => {
      const prevQty = prevCumulative[b.code] || 0;
      const thisQty = thisBillQty[b.code] || 0;
      const cumQty  = prevQty + thisQty;
      return {
        boqCode: b.code,
        desc: b.desc,
        unit: b.unit,
        woQty: b.woQty,
        rate: b.rate,
        prevQty,
        thisQty,
        cumQty,
        thisAmt: thisQty * b.rate,
        cumAmt:  cumQty  * b.rate,
      };
    }).filter(l => l.thisQty > 0 || l.prevQty > 0);
  }, [thisBillQty, prevCumulative]);

  // ── Amounts ─────────────────────────────────────────────────────────────────
  const gross   = billLines.reduce((s, l) => s + l.thisAmt, 0);
  const igst    = gross * 0.18;
  const retAmt  = gross * (ded.ret / 100);
  const advAmt  = gross * (ded.adv / 100);
  const tdsAmt  = gross * (ded.tds / 100);
  const ldAmt   = Number(ded.ld) || 0;
  const net     = gross + igst - retAmt - advAmt - tdsAmt - ldAmt;

  const noDPR = Object.values(dprThisPeriod).every(v => v === 0);

  // ── Submit ───────────────────────────────────────────────────────────────────
  async function submit() {
    setSaving(true);
    const billNo = bills.length + 1;
    const billRef = `EG-2337/RA/${String(billNo).padStart(3,"0")}`;

    const newBill = {
      no: billNo,
      billRef,
      period: `${period.from} to ${period.to}`,
      fromDate: period.from,
      toDate: period.to,
      date: today,
      grossAmt: Math.round(gross),
      igst: Math.round(igst),
      netPayable: Math.round(net),
      status: "Submitted",
      certifiedAmt: 0,
      paidAmt: 0,
      lines: billLines.filter(l => l.thisQty > 0).map(l => ({
        boqCode: l.boqCode,
        prevQty: l.prevQty,
        thisQty: l.thisQty,
        cumQty:  l.cumQty,
        rate:    l.rate,
        thisAmt: l.thisAmt,
      })),
    };

    // Write to Sheets via proxy
    try {
      const proxyUrl = import.meta.env.VITE_SHEETS_PROXY_URL;
      if (proxyUrl) {
        const row = [
          newBill.billRef, project.id, newBill.date,
          newBill.fromDate, newBill.toDate, newBill.period,
          newBill.grossAmt, newBill.igst, newBill.netPayable,
          newBill.status, 0, 0,
          `RA Bill ${billRef} — ${newBill.period}`,
          new Date().toISOString(),
        ];
        const lines = newBill.lines.map(l => [
          newBill.billRef, project.id, l.boqCode,
          l.prevQty, l.thisQty, l.cumQty, l.rate, l.thisAmt
        ]);
        await fetch(proxyUrl, {
          method:"POST", headers:{"Content-Type":"text/plain"},
          body: JSON.stringify({
            action: "appendRABill",
            secret: import.meta.env.VITE_SHEETS_PROXY_SECRET,
            ids: { ERP: import.meta.env.VITE_SHEET_ERP },
            data: { row, lines, projectId: project.id },
          }),
        });
      }
    } catch(e) {
      console.warn("RA Bill write to Sheets failed:", e.message);
    }

    setBills(prev => [...prev, newBill]);
    setShowForm(false); setStep(0);
    setPeriod({ from:"", to:"" }); setOverrides({}); setDed({ ret:5, adv:0, tds:2, ld:0 });
    setSaving(false);
    showToast(`${billRef} submitted — ₹${Math.round(net).toLocaleString("en-IN")} net payable`);
  }

  // ── View bill detail ─────────────────────────────────────────────────────────
  if (viewBill) {
    const vl = viewBill.lines || [];
    const vGross = vl.reduce((s,l)=>s+l.thisAmt,0) || viewBill.grossAmt;
    return (
      <div style={{ padding:24 }}>
        <button onClick={()=>setViewBill(null)} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--color-text-secondary)", fontSize:13, marginBottom:16 }}>
          ← Back to RA Bills
        </button>
        <div style={{ ...cardStyle, padding:"1.5rem", maxWidth:800 }}>
          {/* Bill header */}
          <div style={{ display:"flex", justifyContent:"space-between", borderBottom:`2px solid ${G}`, paddingBottom:12, marginBottom:16 }}>
            <div>
              <p style={{ margin:"0 0 2px", fontWeight:600, fontSize:16 }}>RUNNING ACCOUNT BILL</p>
              <p style={{ margin:0, fontSize:12, color:"var(--color-text-tertiary)" }}>
                {project.name} · {project.client}
              </p>
            </div>
            <div style={{ textAlign:"right" }}>
              <p style={{ margin:0, fontWeight:600, color:G, fontSize:15 }}>{viewBill.billRef}</p>
              <p style={{ margin:"2px 0 0", fontSize:12, color:"var(--color-text-tertiary)" }}>{viewBill.date}</p>
              <div style={{ marginTop:4 }}><StatusBadge status={viewBill.status}/></div>
            </div>
          </div>

          {/* Meta */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16, marginBottom:16, fontSize:12 }}>
            {[
              ["Period", viewBill.period],
              ["Work Order", project.workOrder],
              ["Site", project.siteName || project.site],
            ].map(([k,v]) => (
              <div key={k}>
                <p style={{ margin:"0 0 2px", fontSize:11, color:"var(--color-text-tertiary)", fontWeight:500, textTransform:"uppercase" }}>{k}</p>
                <p style={{ margin:0, fontWeight:500 }}>{v}</p>
              </div>
            ))}
          </div>

          {/* Lines table */}
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, marginBottom:16 }}>
            <thead>
              <tr style={{ background:GD }}>
                {["Code","Description","Unit","WO Qty","Prev Cumul.","This Bill","Cumulative","Rate (₹)","This Bill Amt"].map(h => (
                  <th key={h} style={{ padding:"7px 8px", color:"white", textAlign:["Prev Cumul.","This Bill","Cumulative","Rate (₹)","This Bill Amt","WO Qty"].includes(h)?"right":"left", fontSize:11, fontWeight:500, whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vl.map((l,i) => {
                const boq = BOQ_ITEMS.find(b => b.code === l.boqCode);
                return (
                  <tr key={l.boqCode} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", background:i%2===0?"transparent":"var(--color-background-secondary)" }}>
                    <td style={{ padding:"7px 8px", fontWeight:600, color:G }}>{l.boqCode}</td>
                    <td style={{ padding:"7px 8px", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{boq?.desc || l.boqCode}</td>
                    <td style={{ padding:"7px 8px", color:"var(--color-text-tertiary)" }}>{boq?.unit || ""}</td>
                    <td style={{ padding:"7px 8px", textAlign:"right", fontFamily:"monospace" }}>{(boq?.woQty||0).toLocaleString("en-IN")}</td>
                    <td style={{ padding:"7px 8px", textAlign:"right", fontFamily:"monospace", color:"var(--color-text-tertiary)" }}>{l.prevQty.toLocaleString("en-IN")}</td>
                    <td style={{ padding:"7px 8px", textAlign:"right", fontFamily:"monospace", fontWeight:500, color:G }}>{l.thisQty.toLocaleString("en-IN")}</td>
                    <td style={{ padding:"7px 8px", textAlign:"right", fontFamily:"monospace" }}>{l.cumQty.toLocaleString("en-IN")}</td>
                    <td style={{ padding:"7px 8px", textAlign:"right", fontFamily:"monospace" }}>{fmt(l.rate)}</td>
                    <td style={{ padding:"7px 8px", textAlign:"right", fontFamily:"monospace", fontWeight:500 }}>{fmtL(l.thisAmt)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:GL, borderTop:`2px solid ${G}` }}>
                <td colSpan={8} style={{ padding:"8px 10px", fontWeight:600, color:G, textAlign:"right" }}>Bill Gross Value</td>
                <td style={{ padding:"8px 10px", textAlign:"right", fontFamily:"monospace", fontWeight:600, color:G, fontSize:14 }}>{fmtL(viewBill.grossAmt)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Amounts */}
          <div style={{ display:"flex", justifyContent:"flex-end" }}>
            <table style={{ width:280, fontSize:12 }}>
              {[
                ["Gross Bill Value", fmtL(viewBill.grossAmt), false],
                ["Add IGST @ 18%", fmtL(viewBill.igst), false],
                ["Gross Invoice Value", fmtL(viewBill.grossAmt + viewBill.igst), true],
                ["Net Payable", fmtL(viewBill.netPayable), true, G],
              ].map(([l,v,b,c]) => (
                <tr key={l} style={{ borderTop:b ? `1px solid ${G}` : "none" }}>
                  <td style={{ padding:"4px 8px", color:c||"var(--color-text-secondary)", fontWeight:b?600:400 }}>{l}</td>
                  <td style={{ padding:"4px 8px", textAlign:"right", fontFamily:"monospace", fontWeight:b?600:400, color:c||"var(--color-text-primary)", fontSize:b?13:12 }}>{v}</td>
                </tr>
              ))}
            </table>
          </div>

          <div style={{ display:"flex", gap:8, marginTop:16 }}>
            <button onClick={()=>exportBill&&exportBill(viewBill)}
              style={{ padding:"8px 16px", background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:7, cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
              <Printer size={13}/>Export PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:24 }}>
      {toast && (
        <div style={{ position:"fixed", top:64, right:24, background:toast.type==="error"?"#C62828":G, color:"white", padding:"10px 18px", borderRadius:8, fontSize:13, display:"flex", alignItems:"center", gap:8, zIndex:200, boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
          {toast.type==="error" ? <AlertCircle size={15}/> : <CheckCircle2 size={15}/>}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <p style={{ margin:"0 0 2px", fontWeight:600, fontSize:16 }}>Running Account Bills — {project.id}</p>
          <p style={{ margin:0, fontSize:12, color:"var(--color-text-tertiary)" }}>
            {bills.length} bills raised · Quantities pulled from DPR entries
          </p>
        </div>
        <button onClick={()=>{ setShowForm(!showForm); setStep(0); }}
          style={{ display:"flex", alignItems:"center", gap:6, padding:"9px 18px", background:G, color:"white", border:"none", borderRadius:8, fontSize:13, fontWeight:500, cursor:"pointer" }}>
          <Plus size={15}/>{showForm ? "Cancel" : "Generate New RA Bill"}
        </button>
      </div>

      {/* ── BILL GENERATION FORM ───────────────────────────────────────────── */}
      {showForm && (
        <div style={{ ...cardStyle, marginBottom:20, border:`1.5px solid ${G}`, padding:"1.5rem" }}>
          {/* Step indicators */}
          <div style={{ display:"flex", gap:6, marginBottom:24, flexWrap:"wrap" }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div onClick={()=>step>i&&setStep(i)}
                  style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", borderRadius:20,
                    background: step===i ? G : step>i ? GL : "var(--color-background-secondary)",
                    border:`0.5px solid ${step===i ? G : step>i ? G : "var(--color-border-tertiary)"}`,
                    cursor: step>i ? "pointer" : "default",
                    color: step===i ? "white" : step>i ? G : "var(--color-text-tertiary)",
                    fontSize:12, fontWeight:500 }}>
                  {step>i ? <Check size={12}/> : <span style={{ width:16, height:16, borderRadius:"50%", background:step===i?"rgba(255,255,255,.3)":"var(--color-border-tertiary)", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:600 }}>{i+1}</span>}
                  {s}
                </div>
                {i<STEPS.length-1 && <ChevronRight size={13} color="var(--color-border-secondary)"/>}
              </div>
            ))}
          </div>

          {/* ── STEP 0: Period ─────────────────────────────────────────────── */}
          {step === 0 && (
            <div style={{ maxWidth:440 }}>
              <p style={{ margin:"0 0 16px", fontSize:13, color:"var(--color-text-secondary)" }}>
                Select the billing period. The app will automatically pull quantities from DPR entries within this date range.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
                <F label="From Date" required>
                  <input type="date" value={period.from} max={today}
                    onChange={e=>{ setPeriod({...period,from:e.target.value}); setOverrides({}); }}
                    style={inp}/>
                </F>
                <F label="To Date" required>
                  <input type="date" value={period.to} min={period.from} max={today}
                    onChange={e=>{ setPeriod({...period,to:e.target.value}); setOverrides({}); }}
                    style={inp}/>
                </F>
              </div>

              {period.from && period.to && (
                <div style={{ background:GL, border:"0.5px solid #C6E3C6", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, display:"flex", alignItems:"center", gap:8 }}>
                  <Info size={14} color={G}/>
                  <span style={{ color:GD }}>
                    <strong>{Object.values(dprThisPeriod).reduce((s,v)=>s+(v>0?1:0),0)} BOQ items</strong> have DPR entries in this period.
                    Total entries: <strong>{dprs.filter(d=>{const dt=new Date(d.date);return dt>=new Date(period.from)&&dt<=new Date(period.to);}).length}</strong>
                  </span>
                </div>
              )}

              {period.from && period.to && noDPR && (
                <div style={{ background:"#FFF8E1", border:"0.5px solid #FFE082", borderRadius:8, padding:"10px 14px", marginBottom:16, fontSize:12, display:"flex", gap:8 }}>
                  <AlertTriangle size={14} color="#E65100"/>
                  <span style={{ color:"#E65100" }}>No DPR entries found in this period. Enter DPR data first, or proceed to manually enter quantities in the next step.</span>
                </div>
              )}

              <button onClick={()=>period.from&&period.to&&setStep(1)} disabled={!period.from||!period.to}
                style={{ padding:"9px 24px", background:period.from&&period.to?G:"var(--color-background-secondary)", color:period.from&&period.to?"white":"var(--color-text-tertiary)", border:"none", borderRadius:7, fontSize:13, fontWeight:500, cursor:period.from&&period.to?"pointer":"not-allowed" }}>
                Next → View Quantities
              </button>
            </div>
          )}

          {/* ── STEP 1: Quantities ────────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                <p style={{ margin:0, fontSize:13, color:"var(--color-text-secondary)" }}>
                  Quantities auto-filled from DPR entries for <strong>{period.from}</strong> to <strong>{period.to}</strong>.
                  You can adjust any value before submitting.
                </p>
              </div>

              <div style={{ overflowX:"auto", marginBottom:16 }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr style={{ background:"var(--color-background-secondary)" }}>
                      {["Code","Description","Unit","WO Qty","Prev Cumulative","This Period (DPR)","Adjusted Qty","Rate (₹)","This Bill Amount"].map(h => (
                        <th key={h} style={{ padding:"8px 10px", textAlign:["WO Qty","Prev Cumulative","This Period (DPR)","Adjusted Qty","Rate (₹)","This Bill Amount"].includes(h)?"right":"left", fontSize:11, fontWeight:500, color:"var(--color-text-tertiary)", borderBottom:"0.5px solid var(--color-border-tertiary)", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {BOQ_ITEMS.map((b, i) => {
                      const prev = prevCumulative[b.code] || 0;
                      const dprQty = dprThisPeriod[b.code] || 0;
                      const adjQty = thisBillQty[b.code];
                      const thisAmt = adjQty * b.rate;
                      const isOverridden = overrides[b.code] !== undefined;
                      const overWO = prev + adjQty > b.woQty;
                      return (
                        <tr key={b.code} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", background:overWO?"#FFF8E1":i%2===0?"transparent":"var(--color-background-secondary)" }}>
                          <td style={{ padding:"8px 10px", fontWeight:600, color:G }}>{b.code}</td>
                          <td style={{ padding:"8px 10px", maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{b.desc}</td>
                          <td style={{ padding:"8px 10px", color:"var(--color-text-tertiary)" }}>{b.unit}</td>
                          <td style={{ padding:"8px 10px", textAlign:"right", fontFamily:"monospace" }}>{b.woQty.toLocaleString("en-IN")}</td>
                          <td style={{ padding:"8px 10px", textAlign:"right", fontFamily:"monospace", color:"var(--color-text-tertiary)" }}>{prev.toLocaleString("en-IN")}</td>
                          <td style={{ padding:"8px 10px", textAlign:"right", fontFamily:"monospace", color:dprQty>0?"#1565C0":"var(--color-text-tertiary)" }}>
                            {dprQty > 0 ? dprQty.toLocaleString("en-IN") : "—"}
                          </td>
                          <td style={{ padding:"6px 8px" }}>
                            <div style={{ position:"relative" }}>
                              <input type="number" min="0"
                                value={overrides[b.code] !== undefined ? overrides[b.code] : (dprQty || "")}
                                onChange={e => setOverrides({...overrides, [b.code]: e.target.value})}
                                placeholder="0"
                                style={{ ...inp, width:110, textAlign:"right", fontFamily:"monospace", fontSize:12, padding:"5px 8px",
                                  border:`0.5px solid ${isOverridden?"#E65100":overWO?"#C62828":"var(--color-border-secondary)"}`,
                                  background: isOverridden ? "#FFF8E1" : "var(--color-background-primary)" }}/>
                              {isOverridden && (
                                <button onClick={()=>{ const o={...overrides}; delete o[b.code]; setOverrides(o); }}
                                  title="Reset to DPR value"
                                  style={{ position:"absolute", right:4, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#E65100", fontSize:10, display:"flex" }}>
                                  <X size={10}/>
                                </button>
                              )}
                            </div>
                            {overWO && <p style={{ margin:"2px 0 0", fontSize:10, color:"#C62828" }}>Exceeds WO qty</p>}
                          </td>
                          <td style={{ padding:"8px 10px", textAlign:"right", fontFamily:"monospace" }}>{fmt(b.rate)}</td>
                          <td style={{ padding:"8px 10px", textAlign:"right", fontFamily:"monospace", fontWeight:adjQty>0?500:400, color:adjQty>0?G:"var(--color-text-tertiary)" }}>
                            {adjQty > 0 ? fmtL(thisAmt) : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background:GL, borderTop:`2px solid ${G}` }}>
                      <td colSpan={8} style={{ padding:"9px 10px", fontWeight:600, color:G, textAlign:"right" }}>Gross Bill Value</td>
                      <td style={{ padding:"9px 10px", textAlign:"right", fontFamily:"monospace", fontWeight:600, color:G, fontSize:14 }}>{fmtL(gross)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {gross === 0 && (
                <div style={{ background:"#FFF8E1", border:"0.5px solid #FFE082", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:12, display:"flex", gap:8 }}>
                  <AlertTriangle size={14} color="#E65100"/>
                  <span style={{ color:"#E65100" }}>No quantities entered. Enter work quantities (from DPR or manually) before proceeding.</span>
                </div>
              )}

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setStep(0)} style={{ padding:"8px 16px", background:"transparent", border:"0.5px solid var(--color-border-secondary)", borderRadius:7, fontSize:13, cursor:"pointer" }}>← Back</button>
                <button onClick={()=>gross>0&&setStep(2)} disabled={gross===0}
                  style={{ padding:"8px 24px", background:gross>0?G:"var(--color-background-secondary)", color:gross>0?"white":"var(--color-text-tertiary)", border:"none", borderRadius:7, fontSize:13, fontWeight:500, cursor:gross>0?"pointer":"not-allowed" }}>
                  Next → Deductions
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Deductions ────────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ maxWidth:520 }}>
              <div style={{ background:"var(--color-background-secondary)", borderRadius:8, padding:"1rem", marginBottom:16 }}>
                {[
                  ["Gross Bill Value", fmtL(gross), G, true],
                  ["Add IGST @ 18%", fmtL(igst), "var(--color-text-primary)", false],
                  ["Gross Invoice Value", fmtL(gross+igst), G, true],
                ].map(([l,v,c,b])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0", fontWeight:b?500:400, borderBottom:b?"0.5px solid var(--color-border-tertiary)":"none" }}>
                    <span style={{ color:"var(--color-text-secondary)", fontSize:13 }}>{l}</span>
                    <span style={{ fontFamily:"monospace", color:c, fontSize:13 }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{ border:"0.5px solid var(--color-border-tertiary)", borderRadius:8, padding:"1rem", marginBottom:16 }}>
                <p style={{ margin:"0 0 12px", fontSize:11, fontWeight:600, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:".06em" }}>Deductions</p>
                {[
                  ["Retention (%)", "ret", true],
                  ["Advance Recovery (%)", "adv", true],
                  ["TDS (%)", "tds", true],
                  ["LD Amount (₹)", "ld", false],
                ].map(([label, key, isPct]) => (
                  <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <label style={{ fontSize:12, color:"var(--color-text-secondary)" }}>{label}</label>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="number" min="0" value={ded[key]}
                        onChange={e=>setDed({...ded,[key]:e.target.value})}
                        style={{ ...inp, width:80, textAlign:"right", padding:"5px 8px", fontSize:12 }}/>
                      {isPct && <span style={{ fontSize:12, color:"var(--color-text-tertiary)", minWidth:70, textAlign:"right" }}>= {fmt(gross*(Number(ded[key])||0)/100)}</span>}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background:GL, border:`1px solid ${G}`, borderRadius:8, padding:"12px 16px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontWeight:600, color:G, fontSize:14 }}>Net Payable</span>
                <span style={{ fontWeight:600, color:G, fontSize:18, fontFamily:"monospace" }}>{fmt(net)}</span>
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setStep(1)} style={{ padding:"8px 16px", background:"transparent", border:"0.5px solid var(--color-border-secondary)", borderRadius:7, fontSize:13, cursor:"pointer" }}>← Back</button>
                <button onClick={()=>setStep(3)} style={{ padding:"8px 24px", background:G, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:500, cursor:"pointer" }}>Preview Bill →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Preview + Submit ──────────────────────────────────── */}
          {step === 3 && (
            <div style={{ maxWidth:760 }}>
              {/* Bill preview */}
              <div style={{ border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, padding:"1.25rem", marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", borderBottom:`2px solid ${G}`, paddingBottom:10, marginBottom:14 }}>
                  <div>
                    <p style={{ margin:"0 0 2px", fontWeight:600, fontSize:14 }}>PROFORMA INVOICE / RA BILL</p>
                    <p style={{ margin:0, fontSize:11, color:"var(--color-text-tertiary)" }}>{project.name}</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ margin:0, fontWeight:600, color:G }}>RA-{String(bills.length+1).padStart(3,"0")}</p>
                    <p style={{ margin:"2px 0 0", fontSize:11, color:"var(--color-text-tertiary)" }}>{today}</p>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12, fontSize:12 }}>
                  <div>
                    <p style={{ margin:"0 0 2px", fontWeight:500 }}>From</p>
                    <p style={{ margin:0, color:"var(--color-text-secondary)" }}>M/s Evergreen Enterprises</p>
                    <p style={{ margin:0, fontSize:11, color:"var(--color-text-tertiary)" }}>GSTIN: 33AADFE5468R2ZU</p>
                  </div>
                  <div>
                    <p style={{ margin:"0 0 2px", fontWeight:500 }}>To</p>
                    <p style={{ margin:0, color:"var(--color-text-secondary)" }}>{project.client}</p>
                    <p style={{ margin:0, fontSize:11, color:"var(--color-text-tertiary)" }}>WO: {project.workOrder}</p>
                  </div>
                </div>

                <div style={{ background:"var(--color-background-secondary)", borderRadius:6, padding:"6px 12px", marginBottom:12, fontSize:11, display:"flex", gap:20, flexWrap:"wrap" }}>
                  <span>Period: <strong>{period.from} to {period.to}</strong></span>
                  <span>Bill No: <strong>RA-{String(bills.length+1).padStart(3,"0")}</strong></span>
                </div>

                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, marginBottom:12 }}>
                  <thead>
                    <tr style={{ background:GD }}>
                      {["Code","Description","Unit","Prev Cum.","This Bill","Cumulative","Rate (₹)","Amount"].map(h=>(
                        <th key={h} style={{ padding:"6px 8px", color:"white", fontSize:11, textAlign:["Prev Cum.","This Bill","Cumulative","Rate (₹)","Amount"].includes(h)?"right":"left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {billLines.filter(l=>l.thisQty>0).map((l,i)=>(
                      <tr key={l.boqCode} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", background:i%2===0?"transparent":"var(--color-background-secondary)" }}>
                        <td style={{ padding:"6px 8px", fontWeight:600, color:G }}>{l.boqCode}</td>
                        <td style={{ padding:"6px 8px", maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.desc}</td>
                        <td style={{ padding:"6px 8px", color:"var(--color-text-tertiary)" }}>{l.unit}</td>
                        <td style={{ padding:"6px 8px", textAlign:"right", fontFamily:"monospace", color:"var(--color-text-tertiary)" }}>{l.prevQty.toLocaleString("en-IN")}</td>
                        <td style={{ padding:"6px 8px", textAlign:"right", fontFamily:"monospace", fontWeight:500, color:G }}>{l.thisQty.toLocaleString("en-IN")}</td>
                        <td style={{ padding:"6px 8px", textAlign:"right", fontFamily:"monospace" }}>{l.cumQty.toLocaleString("en-IN")}</td>
                        <td style={{ padding:"6px 8px", textAlign:"right", fontFamily:"monospace" }}>{fmt(l.rate)}</td>
                        <td style={{ padding:"6px 8px", textAlign:"right", fontFamily:"monospace", fontWeight:500 }}>{fmtL(l.thisAmt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <table style={{ width:280, fontSize:12 }}>
                    {[
                      ["Gross Bill Value:", fmtL(gross), false, null],
                      ["Add IGST @ 18%:", fmtL(igst), false, null],
                      ded.ret>0 ? [`Less Retention (${ded.ret}%):`, `(${fmt(retAmt)})`, false, "#C62828"] : null,
                      ded.adv>0 ? [`Less Advance (${ded.adv}%):`, `(${fmt(advAmt)})`, false, "#C62828"] : null,
                      ded.tds>0 ? [`Less TDS (${ded.tds}%):`, `(${fmt(tdsAmt)})`, false, "#C62828"] : null,
                      ded.ld>0  ? [`Less LD:`, `(${fmt(ldAmt)})`, false, "#C62828"] : null,
                      ["NET PAYABLE:", fmt(net), true, G],
                    ].filter(Boolean).map(([l,v,b,c])=>(
                      <tr key={l} style={{ borderTop:b?`2px solid ${G}`:"none" }}>
                        <td style={{ padding:"4px 8px", color:c||"var(--color-text-secondary)", fontWeight:b?600:400 }}>{l}</td>
                        <td style={{ padding:"4px 8px", textAlign:"right", fontFamily:"monospace", fontWeight:b?600:400, color:c||"var(--color-text-primary)", fontSize:b?14:12 }}>{v}</td>
                      </tr>
                    ))}
                  </table>
                </div>
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={()=>setStep(2)} style={{ padding:"9px 16px", background:"transparent", border:"0.5px solid var(--color-border-secondary)", borderRadius:7, fontSize:13, cursor:"pointer" }}>← Back</button>
                <button onClick={submit} disabled={saving}
                  style={{ flex:1, padding:"10px 0", background:saving?"#AAA":G, color:"white", border:"none", borderRadius:7, fontSize:13, fontWeight:600, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {saving
                    ? <><span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"white", borderRadius:"50%", animation:"spin .7s linear infinite" }}/> Saving…</>
                    : <><IndianRupee size={14}/> Submit RA Bill RA-{String(bills.length+1).padStart(3,"0")}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BILLS TABLE ───────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead>
            <tr style={{ background:"var(--color-background-secondary)" }}>
              {["Bill Ref","Period","Date","Gross (₹)","IGST (₹)","Net Payable (₹)","Status","Actions"].map(h=>(
                <th key={h} style={{ padding:"10px 12px", textAlign:["Gross (₹)","IGST (₹)","Net Payable (₹)"].includes(h)?"right":"left", fontWeight:500, fontSize:11, color:"var(--color-text-tertiary)", borderBottom:"0.5px solid var(--color-border-tertiary)", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:"center", padding:48, color:"var(--color-text-tertiary)", fontSize:13 }}>
                No bills raised yet. Enter DPR data then click "Generate New RA Bill".
              </td></tr>
            ) : bills.map((b, i) => (
              <tr key={b.no} style={{ borderBottom:"0.5px solid var(--color-border-tertiary)", background:i%2===0?"transparent":"var(--color-background-secondary)" }}>
                <td style={{ padding:"10px 12px", fontWeight:500, color:G, fontFamily:"monospace" }}>{b.billRef}</td>
                <td style={{ padding:"10px 12px", color:"var(--color-text-secondary)", fontSize:12 }}>{b.period}</td>
                <td style={{ padding:"10px 12px", color:"var(--color-text-secondary)", fontFamily:"monospace", fontSize:12 }}>{b.date}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontFamily:"monospace" }}>{fmtL(b.grossAmt)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontFamily:"monospace", color:"var(--color-text-tertiary)" }}>{fmtL(b.igst)}</td>
                <td style={{ padding:"10px 12px", textAlign:"right", fontFamily:"monospace", fontWeight:500 }}>{fmtL(b.netPayable)}</td>
                <td style={{ padding:"10px 12px" }}><StatusBadge status={b.status}/></td>
                <td style={{ padding:"10px 12px" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    <button onClick={()=>setViewBill(b)}
                      style={{ padding:"4px 9px", background:GL, border:"none", borderRadius:5, cursor:"pointer", color:G, fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                      <Eye size={11}/>View
                    </button>
                    <button onClick={()=>exportBill&&exportBill(b)}
                      style={{ padding:"4px 9px", background:"var(--color-background-secondary)", border:"none", borderRadius:5, cursor:"pointer", color:"var(--color-text-secondary)", fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                      <Printer size={11}/>PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length > 0 && (
          <div style={{ padding:"8px 14px", borderTop:"0.5px solid var(--color-border-tertiary)", fontSize:11, color:"var(--color-text-tertiary)", display:"flex", justifyContent:"space-between" }}>
            <span>{bills.length} bills · {bills.filter(b=>b.status==="Paid").length} paid</span>
            <span>Total billed: {fmtL(bills.reduce((s,b)=>s+b.grossAmt,0))}</span>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
