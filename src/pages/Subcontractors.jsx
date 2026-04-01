import { useState, useMemo } from "react";
import {
  Users, Plus, X, Check, Eye, ChevronDown, ChevronRight,
  CheckCircle2, AlertCircle, CreditCard, FileText,
  Building, Phone, IndianRupee, BarChart3, AlertTriangle
} from "lucide-react";
import { SC_MASTER, SC_BILLS } from "../data/mockData";

const G = "#2E6B2E", GD = "#1A3F1A", GL = "#EBF5EB";
const fmt  = n => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const fmtL = n => "₹" + ((n || 0) / 100000).toFixed(2) + "L";
const today = new Date().toISOString().split("T")[0];

const STATUS = {
  Paid:      { bg: "#EBF5EB", color: G,        dot: G        },
  Certified: { bg: "#E3F2FD", color: "#1565C0", dot: "#1565C0" },
  Submitted: { bg: "#FFF8E1", color: "#F57F17", dot: "#F57F17" },
};
const StatusBadge = ({ s }) => {
  const cfg = STATUS[s] || { bg: "#F5F5F5", color: "#666", dot: "#666" };
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot }} />{s}
    </span>
  );
};

const cardStyle = { background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "1rem 1.25rem" };

export default function Subcontractors({ project, scBills, setScBills }) {
  const [selectedSC, setSelectedSC]   = useState(null);
  const [tab, setTab]                 = useState("ledger");          // ledger | retention | payment
  const [showNewBill, setShowNewBill] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(null);           // bill id
  const [toast, setToast]             = useState(null);
  const [newBill, setNewBill]         = useState({
    period: "", date: today, qty: "", rate: "", remarks: "",
  });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Aggregate stats per SC
  const scStats = useMemo(() => {
    const map = {};
    SC_MASTER.forEach(sc => {
      const bills = scBills.filter(b => b.scId === sc.id);
      map[sc.id] = {
        totalGross:  bills.reduce((s, b) => s + b.grossAmt, 0),
        totalPaid:   bills.filter(b => b.status === "Paid").reduce((s, b) => s + b.paidAmt, 0),
        totalRetained: bills.reduce((s, b) => s + b.retention, 0),
        pendingAmt:  bills.filter(b => b.status !== "Paid").reduce((s, b) => s + b.netAfterRet, 0),
        billCount:   bills.length,
        lastBillDate: bills.length ? bills[bills.length - 1].date : "—",
      };
    });
    return map;
  }, [scBills]);

  const selectedBills = useMemo(() =>
    selectedSC ? scBills.filter(b => b.scId === selectedSC.id) : [],
    [selectedSC, scBills]
  );

  const handleAddBill = () => {
    if (!newBill.period || !newBill.qty || !newBill.rate) {
      showToast("Period, Qty and Rate are required", "error"); return;
    }
    const gross = Number(newBill.qty) * Number(newBill.rate);
    const gst   = gross * 0.18;
    const ret   = gross * 0.05;
    const net   = gross + gst - ret;
    const sc    = selectedSC;
    const billNo = scBills.filter(b => b.scId === sc.id).length + 1;
    const prefix = { audi:"AG", sakshi:"SB", jagram:"JG", subodh:"SS", ajay:"AJ" }[sc.id] || "XX";
    const entry = {
      id: `${prefix}-${String(billNo).padStart(3,"0")}-NEW`,
      scId: sc.id, billRef: `${prefix}/EG-2337/${String(billNo).padStart(2,"0")}`,
      period: newBill.period, date: newBill.date,
      qty: Number(newBill.qty), unit: sc.unit, rate: Number(newBill.rate),
      grossAmt: gross, gstAmt: gst, netPayable: net,
      retention: ret, netAfterRet: net - gst,
      status: "Submitted", paidDate: "", paidAmt: 0,
    };
    setScBills([...scBills, entry]);
    setNewBill({ period: "", date: today, qty: "", rate: "", remarks: "" });
    setShowNewBill(false);
    showToast(`SC Bill ${entry.billRef} recorded`);
  };

  const markPaid = (billId, paidDate) => {
    setScBills(prev => prev.map(b =>
      b.id === billId ? { ...b, status: "Paid", paidDate, paidAmt: b.netAfterRet } : b
    ));
    setShowMarkPaid(null);
    showToast("Bill marked as paid");
  };

  const inp = { padding: "7px 10px", borderRadius: 6, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", fontSize: 13, fontFamily: "inherit", width: "100%", boxSizing: "border-box" };

  // Project-level summary
  const totalGross   = Object.values(scStats).reduce((s, v) => s + v.totalGross, 0);
  const totalPaid    = Object.values(scStats).reduce((s, v) => s + v.totalPaid, 0);
  const totalPending = Object.values(scStats).reduce((s, v) => s + v.pendingAmt, 0);
  const totalRet     = Object.values(scStats).reduce((s, v) => s + v.totalRetained, 0);

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
          ["Total SC Billed",  fmtL(totalGross),   `${scBills.length} bills across ${SC_MASTER.length} sub-contractors`, G       ],
          ["Total Paid",       fmtL(totalPaid),    `${scBills.filter(b=>b.status==="Paid").length} bills settled`,        "#1565C0"],
          ["Pending Payment",  fmtL(totalPending), `${scBills.filter(b=>b.status!=="Paid").length} bills outstanding`,    "#F57F17"],
          ["Retention Held",   fmtL(totalRet),     "5% withheld — released at PC",                                       "#6A1B9A"],
        ].map(([l, v, s, c]) => (
          <div key={l} style={{ ...cardStyle, borderLeft: `3px solid ${c}` }}>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: ".05em" }}>{l}</p>
            <p style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 500, fontFamily: "monospace", color: "var(--color-text-primary)" }}>{v}</p>
            <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)" }}>{s}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>

        {/* SC List */}
        <div>
          <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
              <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>Sub-contractor Register</p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)" }}>{project.id} · {SC_MASTER.length} registered</p>
            </div>
            {SC_MASTER.map(sc => {
              const stats = scStats[sc.id] || {};
              const active = selectedSC?.id === sc.id;
              return (
                <button key={sc.id} onClick={() => { setSelectedSC(sc); setTab("ledger"); setShowNewBill(false); }}
                  style={{ width: "100%", padding: "12px 14px", background: active ? GL : "transparent", border: "none", borderBottom: "0.5px solid var(--color-border-tertiary)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "background .1s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: active ? G : "var(--color-background-secondary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Users size={15} color={active ? "white" : "var(--color-text-secondary)"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: active ? GD : "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sc.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sc.scope}</p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, fontFamily: "monospace", color: active ? G : "var(--color-text-primary)" }}>{fmtL(stats.totalGross)}</p>
                    <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-tertiary)" }}>{stats.billCount} bills</p>
                  </div>
                  <ChevronRight size={12} color={active ? G : "var(--color-text-tertiary)"} />
                </button>
              );
            })}
          </div>

          {/* Retention summary */}
          <div style={{ ...cardStyle, marginTop: 12 }}>
            <p style={{ margin: "0 0 10px", fontWeight: 500, fontSize: 13 }}>Retention Summary</p>
            {SC_MASTER.map(sc => {
              const stats = scStats[sc.id] || {};
              return (
                <div key={sc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{sc.name.replace("M/s ", "")}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 500, color: "#6A1B9A" }}>{fmt(stats.totalRetained)}</span>
                    <span style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginLeft: 4 }}>held</span>
                  </div>
                </div>
              );
            })}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#6A1B9A" }}>Total Retention Held</span>
              <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 500, color: "#6A1B9A" }}>{fmt(totalRet)}</span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {!selectedSC ? (
            <div style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, color: "var(--color-text-tertiary)" }}>
              <Users size={36} style={{ opacity: .25, marginBottom: 10 }} />
              <p style={{ fontSize: 14, margin: 0 }}>Select a sub-contractor to view details</p>
              <p style={{ fontSize: 12, margin: "4px 0 0", color: "var(--color-text-tertiary)" }}>Bill ledger, retention tracker, and payment history</p>
            </div>
          ) : (
            <>
              {/* SC header card */}
              <div style={{ ...cardStyle, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: GL, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Building size={20} color={G} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: GD }}>{selectedSC.name}</p>
                      <p style={{ margin: "2px 0", fontSize: 12, color: "var(--color-text-secondary)" }}>{selectedSC.scope}</p>
                      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", display: "flex", alignItems: "center", gap: 4 }}><Phone size={11} />{selectedSC.phone}</span>
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Rate: <strong style={{ fontFamily: "monospace" }}>{fmt(selectedSC.rate)}/{selectedSC.unit}</strong></span>
                        {selectedSC.gstNo && <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>GST: {selectedSC.gstNo}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setShowNewBill(!showNewBill)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 14px", background: G, color: "white", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      <Plus size={13} /> New SC Bill
                    </button>
                  </div>
                </div>

                {/* Quick stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  {[
                    ["Total Billed",  fmt(scStats[selectedSC.id]?.totalGross),   G       ],
                    ["Total Paid",    fmt(scStats[selectedSC.id]?.totalPaid),     "#1565C0"],
                    ["Outstanding",   fmt(scStats[selectedSC.id]?.pendingAmt),    "#F57F17"],
                    ["Retention Held",fmt(scStats[selectedSC.id]?.totalRetained), "#6A1B9A"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "8px 10px" }}>
                      <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 3 }}>{l}</p>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, fontFamily: "monospace", color: c }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* New bill form */}
              {showNewBill && (
                <div style={{ ...cardStyle, border: `1.5px solid ${G}`, marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: 13 }}>Record New SC Bill — {selectedSC.name}</p>
                    <button onClick={() => setShowNewBill(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex" }}><X size={15} /></button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>Period *</label>
                      <input value={newBill.period} onChange={e => setNewBill({ ...newBill, period: e.target.value })} placeholder="e.g. 01-Mar-2026 to 31-Mar-2026" style={inp} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>Date *</label>
                      <input type="date" value={newBill.date} onChange={e => setNewBill({ ...newBill, date: e.target.value })} style={inp} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>Qty ({selectedSC.unit}) *</label>
                      <input type="number" value={newBill.qty} onChange={e => setNewBill({ ...newBill, qty: e.target.value })} placeholder="0" style={inp} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 }}>Rate (₹/{selectedSC.unit}) *</label>
                      <input type="number" value={newBill.rate} onChange={e => setNewBill({ ...newBill, rate: e.target.value })} placeholder={selectedSC.rate} style={inp} />
                    </div>
                  </div>
                  {newBill.qty && newBill.rate && !isNaN(newBill.qty) && !isNaN(newBill.rate) && (
                    <div style={{ background: GL, border: "0.5px solid rgba(46,107,46,.2)", borderRadius: 7, padding: "8px 12px", marginBottom: 10, fontSize: 12, color: G, display: "flex", gap: 20 }}>
                      <span>Gross: <strong style={{ fontFamily: "monospace" }}>{fmt(+newBill.qty * +newBill.rate)}</strong></span>
                      <span>+ GST 18%: <strong style={{ fontFamily: "monospace" }}>{fmt(+newBill.qty * +newBill.rate * 0.18)}</strong></span>
                      <span>− Retention 5%: <strong style={{ fontFamily: "monospace" }}>({fmt(+newBill.qty * +newBill.rate * 0.05)})</strong></span>
                      <span>Net Payable: <strong style={{ fontFamily: "monospace" }}>{fmt(+newBill.qty * +newBill.rate * (1 + 0.18 - 0.05))}</strong></span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleAddBill} style={{ padding: "8px 20px", background: G, color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Save SC Bill</button>
                    <button onClick={() => setShowNewBill(false)} style={{ padding: "8px 14px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, marginBottom: 12, border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, overflow: "hidden", background: "var(--color-background-secondary)" }}>
                {[["ledger","Bill Ledger"],["retention","Retention Tracker"],["payment","Payment History"]].map(([id, label]) => (
                  <button key={id} onClick={() => setTab(id)}
                    style={{ flex: 1, padding: "8px 0", fontSize: 12, fontWeight: tab === id ? 500 : 400, background: tab === id ? "var(--color-background-primary)" : "transparent", color: tab === id ? G : "var(--color-text-secondary)", border: "none", cursor: "pointer", borderBottom: tab === id ? `2px solid ${G}` : "2px solid transparent", transition: "all .1s" }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === "ledger" && (
                <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--color-background-secondary)" }}>
                        {["Bill Ref","Period","Date","Qty","Rate","Gross (₹)","GST (₹)","Net Payable (₹)","Retention (₹)","Status","Action"].map(h => (
                          <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 500, fontSize: 11, color: "var(--color-text-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBills.map((b, i) => (
                        <tr key={b.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 500, color: G, fontFamily: "monospace", fontSize: 11 }}>{b.billRef}</td>
                          <td style={{ padding: "8px 10px", color: "var(--color-text-secondary)", fontSize: 11, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.period}</td>
                          <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>{b.date}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>{b.qty.toLocaleString("en-IN")}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>{fmt(b.rate)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace" }}>{fmtL(b.grossAmt)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "var(--color-text-secondary)" }}>{fmt(b.gstAmt)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 500 }}>{fmtL(b.netPayable)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "#6A1B9A" }}>{fmt(b.retention)}</td>
                          <td style={{ padding: "8px 10px" }}><StatusBadge s={b.status} /></td>
                          <td style={{ padding: "8px 6px" }}>
                            {b.status !== "Paid" ? (
                              showMarkPaid === b.id ? (
                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                  <input id={`pd-${b.id}`} type="date" defaultValue={today} style={{ padding: "3px 6px", borderRadius: 5, border: "0.5px solid var(--color-border-secondary)", fontSize: 11, width: 110 }} />
                                  <button onClick={() => markPaid(b.id, document.getElementById(`pd-${b.id}`).value)}
                                    style={{ background: GL, border: "none", borderRadius: 4, cursor: "pointer", padding: "4px 7px", color: G, fontSize: 11, display: "flex", alignItems: "center", gap: 3, fontWeight: 500 }}>
                                    <Check size={11} /> Pay
                                  </button>
                                  <button onClick={() => setShowMarkPaid(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", display: "flex" }}><X size={12} /></button>
                                </div>
                              ) : (
                                <button onClick={() => setShowMarkPaid(b.id)}
                                  style={{ padding: "4px 9px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 5, cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                                  <CreditCard size={11} /> Mark Paid
                                </button>
                              )
                            ) : (
                              <span style={{ fontSize: 11, color: G, display: "flex", alignItems: "center", gap: 3 }}><CheckCircle2 size={11} /> {b.paidDate}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {selectedBills.length === 0 && (
                        <tr><td colSpan={11} style={{ textAlign: "center", padding: 32, color: "var(--color-text-tertiary)", fontSize: 13 }}>No bills recorded for {selectedSC.name}</td></tr>
                      )}
                    </tbody>
                    {selectedBills.length > 0 && (
                      <tfoot>
                        <tr style={{ background: GD }}>
                          <td colSpan={5} style={{ padding: "8px 10px", color: "white", fontWeight: 500, fontSize: 12 }}>TOTALS — {selectedSC.name}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "white", fontWeight: 500 }}>{fmtL(selectedBills.reduce((s, b) => s + b.grossAmt, 0))}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "rgba(255,255,255,.6)" }}>{fmt(selectedBills.reduce((s, b) => s + b.gstAmt, 0))}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "white", fontWeight: 500 }}>{fmtL(selectedBills.reduce((s, b) => s + b.netPayable, 0))}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "#CE93D8", fontWeight: 500 }}>{fmt(selectedBills.reduce((s, b) => s + b.retention, 0))}</td>
                          <td colSpan={2} style={{ padding: "8px 10px", color: "rgba(255,255,255,.5)", fontSize: 11 }}>
                            {selectedBills.filter(b => b.status === "Paid").length} paid · {selectedBills.filter(b => b.status !== "Paid").length} pending
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}

              {tab === "retention" && (
                <div style={cardStyle}>
                  <p style={{ margin: "0 0 14px", fontWeight: 500, fontSize: 13 }}>Retention Tracker — {selectedSC.name}</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                    {[
                      ["Total Retention Held", fmt(scStats[selectedSC.id]?.totalRetained), "#6A1B9A", "5% of each gross bill"],
                      ["Eligible for Release", "₹0", "#F57F17",                            "On Practical Completion"],
                      ["Released to Date",     "₹0", G,                                    "No retention released yet"],
                    ].map(([l, v, c, s]) => (
                      <div key={l} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${c}` }}>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 5 }}>{l}</p>
                        <p style={{ margin: 0, fontSize: 18, fontWeight: 500, fontFamily: "monospace", color: c }}>{v}</p>
                        <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 3 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "var(--color-background-secondary)" }}>
                        {["Bill Ref","Bill Date","Gross Amount","Retention @ 5%","Status","Release Date"].map(h => (
                          <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBills.map((b, i) => (
                        <tr key={b.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                          <td style={{ padding: "7px 10px", fontWeight: 500, color: G, fontFamily: "monospace", fontSize: 11 }}>{b.billRef}</td>
                          <td style={{ padding: "7px 10px", fontFamily: "monospace", fontSize: 11 }}>{b.date}</td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace" }}>{fmt(b.grossAmt)}</td>
                          <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 500, color: "#6A1B9A" }}>{fmt(b.retention)}</td>
                          <td style={{ padding: "7px 10px" }}><span style={{ background: "#F3E5F5", color: "#6A1B9A", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 500 }}>Withheld</span></td>
                          <td style={{ padding: "7px 10px", fontSize: 11, color: "var(--color-text-tertiary)" }}>On Practical Completion</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ marginTop: 12, background: "#FFF8E1", border: "0.5px solid #FFE082", borderRadius: 7, padding: "9px 12px", fontSize: 12, color: "#795548", display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={14} />
                    Retention release requires written approval from Admin. Release will be processed after Practical Completion Certificate (PCC) is issued by L&T PMC.
                  </div>
                </div>
              )}

              {tab === "payment" && (
                <div style={cardStyle}>
                  <p style={{ margin: "0 0 14px", fontWeight: 500, fontSize: 13 }}>Payment History — {selectedSC.name}</p>
                  {selectedBills.filter(b => b.status === "Paid").length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "var(--color-text-tertiary)" }}>
                      <CreditCard size={28} style={{ opacity: .3, marginBottom: 8 }} />
                      <p style={{ fontSize: 13, margin: 0 }}>No payments recorded yet</p>
                    </div>
                  ) : (
                    <>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 14 }}>
                        <thead>
                          <tr style={{ background: "var(--color-background-secondary)" }}>
                            {["Bill Ref","Bill Date","Paid Date","Qty","Net Amount Paid","Retention Withheld"].map(h => (
                              <th key={h} style={{ padding: "7px 10px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {selectedBills.filter(b => b.status === "Paid").map((b, i) => (
                            <tr key={b.id} style={{ background: i % 2 === 0 ? "transparent" : "var(--color-background-secondary)", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
                              <td style={{ padding: "7px 10px", fontWeight: 500, color: G, fontFamily: "monospace", fontSize: 11 }}>{b.billRef}</td>
                              <td style={{ padding: "7px 10px", fontFamily: "monospace", fontSize: 11 }}>{b.date}</td>
                              <td style={{ padding: "7px 10px", fontFamily: "monospace", fontSize: 11, color: G, fontWeight: 500 }}>{b.paidDate}</td>
                              <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace" }}>{b.qty.toLocaleString("en-IN")} {b.unit}</td>
                              <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 500, color: G }}>{fmt(b.paidAmt)}</td>
                              <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace", color: "#6A1B9A" }}>{fmt(b.retention)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: GL, borderTop: `1px solid rgba(46,107,46,.3)` }}>
                            <td colSpan={4} style={{ padding: "8px 10px", fontWeight: 500, color: G }}>Total Payments Made</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 500, color: G }}>{fmt(selectedBills.filter(b => b.status === "Paid").reduce((s, b) => s + b.paidAmt, 0))}</td>
                            <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", color: "#6A1B9A", fontWeight: 500 }}>{fmt(selectedBills.filter(b => b.status === "Paid").reduce((s, b) => s + b.retention, 0))}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
