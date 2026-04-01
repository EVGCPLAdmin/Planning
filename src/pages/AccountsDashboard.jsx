import { useState, useEffect, useMemo } from "react";
import {
  IndianRupee, Filter, Search, CheckCircle2, XCircle,
  AlertCircle, Clock, RefreshCw, Download, TrendingUp,
  ChevronDown, Eye, CreditCard, X, Check
} from "lucide-react";

const G="#2E6B2E", GD="#1A3F1A", GL="#EBF5EB";
const fmt=n=>"₹"+Math.round(n||0).toLocaleString("en-IN");
const fmtL=n=>"₹"+((n||0)/100000).toFixed(2)+"L";
const fmtDate=s=>s?String(s).replace(/^(\d{2})\/(\d{2})\/(\d{4}).*/,"$1-$2-$3"):"-";

// Status logic
const getStatus = r => {
  const s = r["Accounts Status"] || "";
  if (s==="Payment Completed")          return "paid";
  if (s.startsWith("Reject"))           return "rejected";
  if (!s)                               return "pending";
  return "processing";
};
const STATUS_CFG = {
  paid:       { label:"Paid",       bg:"#EBF5EB", color:G,        dot:G        },
  rejected:   { label:"Rejected",   bg:"#FEECEC", color:"#C62828", dot:"#C62828"},
  pending:    { label:"Pending",    bg:"#FFF8E1", color:"#E65100", dot:"#E65100"},
  processing: { label:"Processing", bg:"#E3F2FD", color:"#1565C0", dot:"#1565C0"},
};
const StatusBadge = ({s})=>{
  const c=STATUS_CFG[s]||STATUS_CFG.pending;
  return <span style={{background:c.bg,color:c.color,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:500,display:"inline-flex",alignItems:"center",gap:4}}>
    <span style={{width:5,height:5,borderRadius:"50%",background:c.dot}}/>
    {c.label}
  </span>;
};

// Process type from UUID prefix or From Which Process
const getProcess = r => {
  const uuid = r["UUID"] || "";
  const proc = r["From Which Process"] || "";
  if (uuid.startsWith("HR-SAL")) return "Salary/Advance";
  if (uuid.startsWith("HR-IM"))  return "Indiv. Mess";
  if (uuid.startsWith("HR-G4"))  return "Group-4";
  if (uuid.startsWith("CE"))     return "Common Exp";
  if (uuid.startsWith("ACC"))    return "Vendor PO";
  return proc || "Other";
};

const cardStyle={background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem"};
const inp={padding:"7px 10px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",fontSize:12,fontFamily:"inherit",color:"var(--color-text-primary)"};


export default function AccountsDashboard({ user }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);

  // Filters
  const [searchQ, setSearchQ]       = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Detail + action modals
  const [detailRow, setDetailRow] = useState(null);
  const [markPaidRow, setMarkPaidRow] = useState(null);
  const [utrInput, setUtrInput] = useState("");
  const [rejectRow, setRejectRow] = useState(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const [toast, setToast] = useState(null);


  const showToast = (msg, type="success") => {
    setToast({msg,type}); setTimeout(()=>setToast(null), 3500);
  };

  async function loadPayments() {
    setLoading(true); setError("");
    try {
      const { fetchPaymentRequests } = await import("../utils/sheetsClient");
      const rows = await fetchPaymentRequests({ limit: 1000 });
      setPayments(rows);
      setLastRefresh(new Date());
    } catch(e) {
      setError(e.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ loadPayments(); }, []);

  // Filter & search
  const filtered = useMemo(()=>{
    let rows = [...payments];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      rows = rows.filter(r =>
        r["Request ID"]?.toLowerCase().includes(q) ||
        r["Name of the Intiator"]?.toLowerCase().includes(q) ||
        r["Emp/Vendor Code"]?.toLowerCase().includes(q) ||
        r["Site Name"]?.toLowerCase().includes(q) ||
        r["UTR Details"]?.toLowerCase().includes(q) ||
        r["Narrative/Comments"]?.toLowerCase().includes(q)
      );
    }
    if (filterSite)   rows = rows.filter(r=>r["Site Name"]?.toLowerCase().includes(filterSite.toLowerCase()));
    if (filterStatus==="paid")     rows = rows.filter(r=>getStatus(r)==="paid");
    if (filterStatus==="rejected") rows = rows.filter(r=>getStatus(r)==="rejected");
    if (filterStatus==="pending")  rows = rows.filter(r=>getStatus(r)==="pending");
    if (filterType)   rows = rows.filter(r=>(r["Payment To"]||"").toLowerCase()===filterType.toLowerCase());
    if (filterMonth)  rows = rows.filter(r=>r["Month-Year"]===filterMonth);
    return rows;
  }, [payments, searchQ, filterSite, filterStatus, filterType, filterMonth]);

  // KPI summaries
  const kpis = useMemo(()=>{
    const total   = filtered.reduce((s,r)=>s+parseFloat(r["Amount"]||0),0);
    const paid    = filtered.filter(r=>getStatus(r)==="paid").reduce((s,r)=>s+parseFloat(r["Amount"]||0),0);
    const pending = filtered.filter(r=>getStatus(r)==="pending").reduce((s,r)=>s+parseFloat(r["Amount"]||0),0);
    const rejected= filtered.filter(r=>getStatus(r)==="rejected").reduce((s,r)=>s+parseFloat(r["Amount"]||0),0);
    return { total, paid, pending, rejected,
      paidCount: filtered.filter(r=>getStatus(r)==="paid").length,
      pendingCount: filtered.filter(r=>getStatus(r)==="pending").length };
  },[filtered]);

  // Unique sites for dropdown
  const allSites = useMemo(()=>[...new Set(payments.map(r=>r["Site Name"]).filter(Boolean))].sort(),[payments]);
  const allMonths = useMemo(()=>[...new Set(payments.map(r=>r["Month-Year"]).filter(Boolean))].sort().reverse(),[payments]);

  // Actions
  async function handleMarkPaid(row) {
    if (!utrInput.trim()) { showToast("Enter UTR number","error"); return; }
    try {
        const { writeViaProxy } = await import("../utils/sheetsClient");
        // writeViaProxy is internal — use the proxy directly
        const proxyUrl = import.meta.env.VITE_SHEETS_PROXY_URL;
        if (!proxyUrl) throw new Error("Proxy URL not set");
        await fetch(proxyUrl, {
          method:"POST", headers:{"Content-Type":"text/plain"},
          body: JSON.stringify({
            secret: import.meta.env.VITE_SHEETS_PROXY_SECRET,
            action: "markPaid",
            spreadsheetId: "1mLddxLRf719EaXE9XSET9gT8l0a8Cxns362yIbHo63g",
            tabName: "PaymentRequest",
            data: { uuid: row.UUID, utrDetails: utrInput, changedBy: user?.empRef||"" }
          })
        });
    } catch(e) { showToast("Write failed: "+e.message,"error"); return; }
    setPayments(prev=>prev.map(r=>r.UUID===row.UUID
      ? {...r,"Accounts Status":"Payment Completed","UTR Details":utrInput,"Status":"Paid , UTR Details Available"}
      : r));
    setMarkPaidRow(null); setUtrInput("");
    showToast(`${row["Request ID"]} marked as paid`);
  }

  async function handleReject(row) {
    try {
      const proxyUrl = import.meta.env.VITE_SHEETS_PROXY_URL;
      if (proxyUrl) await fetch(proxyUrl, {
        method:"POST", headers:{"Content-Type":"text/plain"},
        body:JSON.stringify({ secret:import.meta.env.VITE_SHEETS_PROXY_SECRET,
          action:"rejectPayment", spreadsheetId:"1mLddxLRf719EaXE9XSET9gT8l0a8Cxns362yIbHo63g",
          tabName:"PaymentRequest", data:{uuid:row.UUID,remarks:rejectRemark,changedBy:user?.empRef||""}})
      });
    } catch(e) { showToast("Write failed: "+e.message,"error"); }
    setPayments(prev=>prev.map(r=>r.UUID===row.UUID
      ? {...r,"Accounts Status":"Reject Payment (Accounts)","Remarks":rejectRemark,"Status":"Request Rejected by Accounts"}
      : r));
    setRejectRow(null); setRejectRemark("");
    showToast(`${row["Request ID"]} rejected`);
  }

  return (
    <div style={{padding:24,position:"relative"}}>
      {toast && (
        <div style={{position:"fixed",top:64,right:24,background:toast.type==="error"?"#C62828":G,color:"white",padding:"10px 18px",borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:8,zIndex:200,boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
          {toast.type==="error"?<AlertCircle size={15}/>:<CheckCircle2 size={15}/>} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:600,color:"var(--color-text-primary)"}}>Accounts — Payment Requests</h2>
          <p style={{margin:"2px 0 0",fontSize:12,color:"var(--color-text-tertiary)"}}>
            "Live — PaymentRequest tab" · {lastRefresh ? "Refreshed "+lastRefresh.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "Loading…"}
          </p>
        </div>
        <button onClick={loadPayments} disabled={loading}
          style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:loading?"var(--color-background-secondary)":GL,border:`0.5px solid ${G}`,borderRadius:7,fontSize:12,fontWeight:500,color:G,cursor:loading?"not-allowed":"pointer"}}>
          <RefreshCw size={13} style={{animation:loading?"spin 1s linear infinite":"none"}}/> {loading?"Loading…":"Refresh"}
        </button>
      </div>

      {error && <div style={{background:"#FEECEC",border:"0.5px solid #FFCDD2",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#C62828",marginBottom:16,display:"flex",gap:8}}><AlertCircle size={14}/>{error}</div>}

      {/* KPI Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          ["Total Amount",fmtL(kpis.total),`${filtered.length} requests`,GD],
          ["Paid",fmtL(kpis.paid),`${kpis.paidCount} settled`,G],
          ["Pending",fmtL(kpis.pending),`${kpis.pendingCount} awaiting`,  "#E65100"],
          ["Rejected",fmtL(kpis.rejected),`${filtered.filter(r=>getStatus(r)==="rejected").length} rejected`,"#C62828"],
        ].map(([label,val,sub,color])=>(
          <div key={label} style={{...cardStyle,borderLeft:`3px solid ${color}`}}>
            <p style={{margin:"0 0 5px",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".05em"}}>{label}</p>
            <p style={{margin:"0 0 3px",fontSize:20,fontWeight:500,fontFamily:"monospace",color:"var(--color-text-primary)"}}>{val}</p>
            <p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,border:"0.5px solid var(--color-border-secondary)",borderRadius:6,padding:"6px 10px",flex:1,minWidth:200,background:"var(--color-background-primary)"}}>
          <Search size={13} color="var(--color-text-tertiary)"/>
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search PR#, name, site, UTR…"
            style={{border:"none",outline:"none",fontSize:12,background:"transparent",width:"100%",color:"var(--color-text-primary)"}}/>
          {searchQ && <button onClick={()=>setSearchQ("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",display:"flex"}}><X size={12}/></button>}
        </div>
        {[
          ["Status","filterStatus",setFilterStatus,[["","All Status"],["paid","Paid"],["pending","Pending"],["rejected","Rejected"]]],
          ["Type","filterType",setFilterType,[["","All Types"],["Employee","Employee"],["Vendor","Vendor"]]],
        ].map(([ph,key,setter,opts])=>(
          <select key={key} value={key==="filterStatus"?filterStatus:filterType} onChange={e=>setter(e.target.value)}
            style={{...inp,paddingRight:28}}>
            {opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
          </select>
        ))}
        <select value={filterSite} onChange={e=>setFilterSite(e.target.value)} style={{...inp,maxWidth:180}}>
          <option value="">All Sites</option>
          {allSites.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={inp}>
          <option value="">All Months</option>
          {allMonths.map(m=><option key={m} value={m}>{m}</option>)}
        </select>
        {(searchQ||filterSite||filterStatus||filterType||filterMonth) && (
          <button onClick={()=>{setSearchQ("");setFilterSite("");setFilterStatus("");setFilterType("");setFilterMonth("");}}
            style={{padding:"6px 12px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:6,fontSize:12,cursor:"pointer",color:"var(--color-text-secondary)",display:"flex",alignItems:"center",gap:4}}>
            <X size={11}/>Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{...cardStyle,padding:0,overflow:"hidden"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"var(--color-background-secondary)"}}>
                {["PR #","Date","Initiator","Payment To","Site","Amount (₹)","Status","UTR","Actions"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:h==="Amount (₹)"?"right":"left",fontWeight:500,fontSize:11,color:"var(--color-text-tertiary)",borderBottom:"0.5px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{textAlign:"center",padding:48,color:"var(--color-text-tertiary)"}}>
                  <RefreshCw size={20} style={{animation:"spin 1s linear infinite",opacity:.4}}/><br/>Loading payment requests…
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} style={{textAlign:"center",padding:48,color:"var(--color-text-tertiary)",fontSize:13}}>No payments match the current filters</td></tr>
              ) : filtered.map((r,i)=>{
                const status = getStatus(r);
                const amt = parseFloat(r["Amount"]||0);
                const payeeParts = (r["Emp/Vendor Code"]||"").split("|");
                const payeeName = payeeParts[1]||payeeParts[0]||r["A/C HOLDER NAME"]||"-";
                return (
                  <tr key={r.UUID||i} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:i%2===0?"transparent":"var(--color-background-secondary)"}}>
                    <td style={{padding:"8px 10px",fontWeight:500,color:G,fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{r["Request ID"]}</td>
                    <td style={{padding:"8px 10px",fontSize:11,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}}>{r["Date Of Request"]?.slice(0,12)||"-"}</td>
                    <td style={{padding:"8px 10px",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      <span style={{fontSize:11}}>{(r["Name of the Intiator"]||"").split("|")[1]||(r["Name of the Intiator"]||"-")}</span>
                      <br/><span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{getProcess(r)}</span>
                    </td>
                    <td style={{padding:"8px 10px",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      <span style={{fontSize:11}}>{payeeName}</span>
                      <br/><span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{r["Payment To"]}</span>
                    </td>
                    <td style={{padding:"8px 10px",fontSize:11,color:"var(--color-text-secondary)",maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r["Site Name"]||"-"}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontWeight:500}}>{fmt(amt)}</td>
                    <td style={{padding:"8px 10px"}}><StatusBadge s={status}/></td>
                    <td style={{padding:"8px 10px",fontSize:11,fontFamily:"monospace",color:"var(--color-text-secondary)",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {r["UTR Details"]||<span style={{color:"var(--color-text-tertiary)"}}>—</span>}
                    </td>
                    <td style={{padding:"8px 6px",whiteSpace:"nowrap"}}>
                      <div style={{display:"flex",gap:4}}>
                        <button onClick={()=>setDetailRow(r)} style={{padding:"4px 8px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:5,cursor:"pointer",color:"var(--color-text-secondary)",fontSize:11,display:"flex",alignItems:"center",gap:3}}>
                          <Eye size={11}/>View
                        </button>
                        {status==="pending" && (
                          <>
                            <button onClick={()=>{setMarkPaidRow(r);setUtrInput("");}} style={{padding:"4px 7px",background:GL,border:"none",borderRadius:5,cursor:"pointer",color:G,fontSize:11,display:"flex",alignItems:"center",gap:3,fontWeight:500}}>
                              <Check size={11}/>Pay
                            </button>
                            <button onClick={()=>{setRejectRow(r);setRejectRemark("");}} style={{padding:"4px 7px",background:"#FEECEC",border:"none",borderRadius:5,cursor:"pointer",color:"#C62828",fontSize:11,display:"flex",alignItems:"center",gap:3}}>
                              <X size={11}/>Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{padding:"8px 14px",borderTop:"0.5px solid var(--color-border-tertiary)",fontSize:11,color:"var(--color-text-tertiary)",display:"flex",justifyContent:"space-between"}}>
          <span>Showing {filtered.length} of {payments.length} records</span>
          <span>{fmt(kpis.total)} total in view</span>
        </div>
      </div>

      {/* Detail Modal */}
      {detailRow && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"var(--color-background-primary)",borderRadius:14,padding:24,maxWidth:520,width:"100%",maxHeight:"85vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <h3 style={{margin:0,fontSize:15,fontWeight:600}}>{detailRow["Request ID"]} — Payment Detail</h3>
                <p style={{margin:0,fontSize:12,color:"var(--color-text-tertiary)"}}>{detailRow["Date Of Request"]}</p>
              </div>
              <button onClick={()=>setDetailRow(null)} style={{background:"var(--color-background-secondary)",border:"none",borderRadius:6,cursor:"pointer",padding:"5px 8px",display:"flex"}}><X size={14}/></button>
            </div>
            {[
              ["Initiator",  (detailRow["Name of the Intiator"]||"").split("|")[1]||(detailRow["Name of the Intiator"]||"-")],
              ["Process",    detailRow["From Which Process"]||"-"],
              ["Payment To", detailRow["Payment To"]||"-"],
              ["Payee",      detailRow["Emp/Vendor Code"]||"-"],
              ["Site",       detailRow["Site Name"]||"-"],
              ["Entity",     detailRow["For EG / EVGCPL"]||"-"],
              ["PO / Ref",   detailRow["Order No"]||"-"],
              ["Amount",     fmt(detailRow["Amount"])],
              ["Currency",   detailRow["Currency"]||"INR"],
              ["Narrative",  detailRow["Narrative/Comments"]||"-"],
              ["A/C Holder", detailRow["A/C HOLDER NAME"]||"-"],
              ["A/C Number", detailRow["A/C NUMBER"]||"-"],
              ["IFSC",       detailRow["IFSC CODE"]||"-"],
              ["Bank",       detailRow["BANK NAME"]||"-"],
              ["Status",     detailRow["Accounts Status"]||"Pending"],
              ["Accounts Date", detailRow["Accounts Date"]||"-"],
              ["UTR",        detailRow["UTR Details"]||"-"],
              ["Remarks",    detailRow["Remarks"]||"-"],
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",borderBottom:"0.5px solid var(--color-border-tertiary)",padding:"6px 0"}}>
                <span style={{width:120,flexShrink:0,fontSize:12,color:"var(--color-text-tertiary)",fontWeight:500}}>{k}</span>
                <span style={{fontSize:12,wordBreak:"break-all"}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",gap:8,marginTop:16}}>
              {getStatus(detailRow)==="pending" && (
                <button onClick={()=>{setDetailRow(null);setMarkPaidRow(detailRow);}} style={{padding:"8px 16px",background:G,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontSize:12,fontWeight:500,display:"flex",alignItems:"center",gap:5}}>
                  <CreditCard size={13}/>Mark Paid
                </button>
              )}
              <button onClick={()=>setDetailRow(null)} style={{padding:"8px 14px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:7,cursor:"pointer",fontSize:12}}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {markPaidRow && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"var(--color-background-primary)",borderRadius:14,padding:24,maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
            <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:600}}>Mark as Paid</h3>
            <p style={{margin:"0 0 16px",fontSize:12,color:"var(--color-text-tertiary)"}}>{markPaidRow["Request ID"]} · {fmt(markPaidRow["Amount"])} · {markPaidRow["A/C HOLDER NAME"]}</p>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:5}}>UTR / Transaction Reference *</label>
            <input value={utrInput} onChange={e=>setUtrInput(e.target.value)} placeholder="e.g. KVBLH00247855273"
              style={{...inp,width:"100%",boxSizing:"border-box",marginBottom:16,fontSize:13}} autoFocus/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>handleMarkPaid(markPaidRow)} style={{flex:1,padding:"9px 0",background:G,color:"white",border:"none",borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:500}}>Confirm Payment</button>
              <button onClick={()=>setMarkPaidRow(null)} style={{padding:"9px 14px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:7,cursor:"pointer",fontSize:13}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectRow && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"var(--color-background-primary)",borderRadius:14,padding:24,maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
            <h3 style={{margin:"0 0 4px",fontSize:15,fontWeight:600,color:"#C62828"}}>Reject Payment</h3>
            <p style={{margin:"0 0 16px",fontSize:12,color:"var(--color-text-tertiary)"}}>{rejectRow["Request ID"]} · {fmt(rejectRow["Amount"])} · {rejectRow["A/C HOLDER NAME"]}</p>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:5}}>Rejection Reason</label>
            <textarea value={rejectRemark} onChange={e=>setRejectRemark(e.target.value)} placeholder="e.g. Wrong bank details, Duplicate request…"
              style={{...inp,width:"100%",boxSizing:"border-box",marginBottom:16,height:72,resize:"none",fontSize:13}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>handleReject(rejectRow)} style={{flex:1,padding:"9px 0",background:"#C62828",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontSize:13,fontWeight:500}}>Reject Request</button>
              <button onClick={()=>setRejectRow(null)} style={{padding:"9px 14px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:7,cursor:"pointer",fontSize:13}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
