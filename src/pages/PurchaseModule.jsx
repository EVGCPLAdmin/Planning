import { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, AlertCircle, ChevronRight, Package, FileText, CheckCircle2, Truck, BarChart3, X, ArrowRight, Plus } from "lucide-react";

const G="#2E6B2E", GD="#1A3F1A", GL="#EBF5EB";
const fmt=n=>"₹"+Math.round(n||0).toLocaleString("en-IN");
const CURRENT_FY="25-26";

// Flow step config
const FLOW_STEPS = [
  { id:"mrs",  label:"MRS", sublabel:"Material Requisition",  Icon:FileText,  color:G         },
  { id:"po",   label:"PO",  sublabel:"Purchase Order",         Icon:Package,   color:"#1565C0" },
  { id:"grn",  label:"GRN", sublabel:"Goods Receipt",          Icon:Truck,     color:"#E65100" },
  { id:"stock",label:"Stock",sublabel:"StockIN",               Icon:BarChart3, color:"#6A1B9A" },
];

const cardStyle={background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem"};
const inp={padding:"7px 10px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",fontSize:12,fontFamily:"inherit",color:"var(--color-text-primary)"};



const PO_STATUS = {
  "PO Open":   { bg:"#FFF8E1", color:"#E65100" },
  "Invoiced":  { bg:"#E3F2FD", color:"#1565C0" },
  "GRN Done":  { bg:"#EBF5EB", color:G         },
  "Paid":      { bg:"#E8F5E9", color:"#2E7D32"  },
};

export default function PurchaseModule({ project, user }) {
  const siteName = project?.siteName || project?.site || "";
  const [activeStep, setActiveStep] = useState("mrs");
  const [mrs, setMrs]   = useState([]);
  const [pos, setPOs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [selectedMRS, setSelectedMRS] = useState(null);
  const [toast, setToast]     = useState(null);


  const showToast=(msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  async function load() {
    setLoading(true); setError("");
    try {
      const sc = await import("../utils/sheetsClient");
      const [mrsRows, poRows] = await Promise.all([
        sc.fetchMRS({ site: siteName, fy: CURRENT_FY, limit: 500 }),
        sc.fetchPurchaseOrders({ site: siteName, fy: CURRENT_FY, limit: 200 }),
      ]);
      setMrs(mrsRows); setPOs(poRows);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[project?.id]);

  const allSites = useMemo(()=>[...new Set([...mrs,...pos].map(r=>r["Site Name"]||r["Requested For"]).filter(Boolean))].sort(),[mrs,pos]);

  const filteredMRS = useMemo(()=>{
    let rows = [...mrs];
    if (search) { const q=search.toLowerCase(); rows=rows.filter(r=>r["MRS No"]?.toLowerCase().includes(q)||r["Requested By"]?.toLowerCase().includes(q)||r["Requested For"]?.toLowerCase().includes(q)); }
    if (filterSite) rows=rows.filter(r=>r["Requested For"]?.toLowerCase().includes(filterSite.toLowerCase()));
    return rows;
  },[mrs,search,filterSite]);

  const filteredPOs = useMemo(()=>{
    let rows = [...pos];
    if (search) { const q=search.toLowerCase(); rows=rows.filter(r=>r["PO No"]?.toLowerCase().includes(q)||r["Vendor Name"]?.toLowerCase().includes(q)||r["Site Name"]?.toLowerCase().includes(q)); }
    if (filterSite) rows=rows.filter(r=>r["Site Name"]?.toLowerCase().includes(filterSite.toLowerCase()));
    return rows;
  },[pos,search,filterSite]);

  // KPIs
  const kpis = useMemo(()=>({
    mrsTotalFY: mrs.length,
    poTotal: pos.length,
    poOpenValue: filteredPOs.filter(p=>p["Status"]==="PO Open").reduce((s,p)=>s+parseFloat(p["PO Value"]||0),0),
    poPaidValue: filteredPOs.filter(p=>p["Status"]==="Paid").reduce((s,p)=>s+parseFloat(p["PO Value"]||0),0),
  }),[mrs,pos,filteredPOs]);

  const getUUIDPrefix = uuid => {
    if (uuid.startsWith("EGHO")) return {label:"Head Office",color:"#1565C0"};
    if (uuid.startsWith("EG-S2")) return {label:"Site Tier 2",color:G};
    if (uuid.startsWith("EG-S3")) return {label:"Site Tier 3",color:"#E65100"};
    if (uuid.startsWith("EG-S4")) return {label:"Site Tier 4",color:"#6A1B9A"};
    if (uuid.startsWith("EG-S5")) return {label:"Site Tier 5",color:"#795548"};
    return {label:"Other",color:"#888"};
  };

  return (
    <div style={{padding:24}}>
      {toast && (
        <div style={{position:"fixed",top:64,right:24,background:toast.type==="error"?"#C62828":G,color:"white",padding:"10px 18px",borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:8,zIndex:200}}>
          {toast.type==="error"?<AlertCircle size={15}/>:<CheckCircle2 size={15}/>}{toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:600,color:"var(--color-text-primary)"}}>Purchase Module</h2>
          <p style={{margin:"2px 0 0",fontSize:12,color:"var(--color-text-tertiary)"}}>
            MRS → PO → GRN → StockIN · FY {CURRENT_FY} · {siteName || "All Sites"}
          </p>
        </div>
        <button onClick={load} disabled={loading} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:GL,border:`0.5px solid ${G}`,borderRadius:7,fontSize:12,fontWeight:500,color:G,cursor:loading?"not-allowed":"pointer"}}>
          <RefreshCw size={13} style={{animation:loading?"spin 1s linear infinite":"none"}}/>{loading?"Loading…":"Refresh"}
        </button>
      </div>

      {error && <div style={{background:"#FEECEC",border:"0.5px solid #FFCDD2",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#C62828",marginBottom:16,display:"flex",gap:8}}><AlertCircle size={14}/>{error}</div>}

      {/* Flow pipeline */}
      <div style={{...cardStyle,marginBottom:20}}>
        <p style={{margin:"0 0 14px",fontSize:12,fontWeight:500,color:"var(--color-text-secondary)"}}>Purchase workflow — click a stage to view its data</p>
        <div style={{display:"flex",alignItems:"center",gap:0}}>
          {FLOW_STEPS.map((step,i)=>(
            <div key={step.id} style={{display:"flex",alignItems:"center",flex:1}}>
              <button onClick={()=>setActiveStep(step.id)}
                style={{flex:1,padding:"14px 10px",background:activeStep===step.id?step.color+"15":"var(--color-background-secondary)",border:`1.5px solid ${activeStep===step.id?step.color:"var(--color-border-tertiary)"}`,borderRadius:8,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                <step.Icon size={18} color={activeStep===step.id?step.color:"var(--color-text-secondary)"} style={{margin:"0 auto 5px"}}/>
                <p style={{margin:0,fontSize:13,fontWeight:500,color:activeStep===step.id?step.color:"var(--color-text-primary)"}}>{step.label}</p>
                <p style={{margin:"2px 0 0",fontSize:10,color:"var(--color-text-tertiary)"}}>{step.sublabel}</p>
                <p style={{margin:"4px 0 0",fontSize:12,fontFamily:"monospace",fontWeight:500,color:activeStep===step.id?step.color:"var(--color-text-secondary)"}}>
                  {step.id==="mrs"?mrs.length:step.id==="po"?pos.length:step.id==="grn"?filteredPOs.filter(p=>p["Status"]==="GRN Done"||p["Status"]==="Paid").length:filteredPOs.filter(p=>p["Status"]==="Paid").length}
                </p>
              </button>
              {i<FLOW_STEPS.length-1 && <ArrowRight size={16} color="var(--color-text-tertiary)" style={{margin:"0 6px",flexShrink:0}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[
          ["MRS This FY", mrs.length+" requests", `FY ${CURRENT_FY}`, G],
          ["POs Raised", pos.length+" orders", "All sites", "#1565C0"],
          ["Open PO Value", fmt(kpis.poOpenValue), "Not yet received", "#E65100"],
          ["Total PO Paid", fmt(kpis.poPaidValue), "Payment complete", G],
        ].map(([l,v,s,c])=>(
          <div key={l} style={{...cardStyle,borderLeft:`3px solid ${c}`}}>
            <p style={{margin:"0 0 5px",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".05em"}}>{l}</p>
            <p style={{margin:"0 0 3px",fontSize:16,fontWeight:500,fontFamily:"monospace",color:"var(--color-text-primary)"}}>{v}</p>
            <p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{s}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6,border:"0.5px solid var(--color-border-secondary)",borderRadius:6,padding:"6px 10px",flex:1,background:"var(--color-background-primary)"}}>
          <Search size={13} color="var(--color-text-tertiary)"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={activeStep==="mrs"?"Search MRS#, requester, site…":"Search PO#, vendor, site…"}
            style={{border:"none",outline:"none",fontSize:12,background:"transparent",width:"100%",color:"var(--color-text-primary)"}}/>
          {search && <button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",display:"flex"}}><X size={12}/></button>}
        </div>
        <select value={filterSite} onChange={e=>setFilterSite(e.target.value)} style={{...inp,minWidth:180}}>
          <option value="">All Sites</option>
          {allSites.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Content by active step */}
      {activeStep==="mrs" && (
        <div style={{...cardStyle,padding:0,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"var(--color-background-secondary)"}}>
                {["MRS No","Requested On","Requested By","For (Site)","FY","Source","Actions"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:500,fontSize:11,color:"var(--color-text-tertiary)",borderBottom:"0.5px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{textAlign:"center",padding:40,color:"var(--color-text-tertiary)"}}><RefreshCw size={18} style={{animation:"spin 1s linear infinite"}}/></td></tr>
                : filteredMRS.length===0 ? <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--color-text-tertiary)"}}>No MRS records found</td></tr>
                : filteredMRS.map((r,i)=>{
                const prefix = getUUIDPrefix(r.UUID||"");
                return (
                  <tr key={r.UUID||i} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:i%2===0?"transparent":"var(--color-background-secondary)"}}>
                    <td style={{padding:"8px 10px",fontWeight:500,color:G,fontFamily:"monospace",fontSize:11}}>{r["MRS No"]}</td>
                    <td style={{padding:"8px 10px",fontSize:11,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}}>{r["Requested On"]}</td>
                    <td style={{padding:"8px 10px",fontSize:11}}>{r["Requested By"]}</td>
                    <td style={{padding:"8px 10px",fontSize:11,color:"var(--color-text-secondary)"}}>{r["Requested For"]}</td>
                    <td style={{padding:"8px 10px",fontSize:11,textAlign:"center"}}>{r["Financial Year"]}</td>
                    <td style={{padding:"8px 10px"}}>
                      <span style={{background:prefix.color+"15",color:prefix.color,padding:"2px 7px",borderRadius:12,fontSize:10,fontWeight:500}}>{prefix.label}</span>
                    </td>
                    <td style={{padding:"8px 6px"}}>
                      <button onClick={()=>{setSelectedMRS(r);setActiveStep("po");}}
                        style={{padding:"4px 8px",background:GL,border:"none",borderRadius:5,cursor:"pointer",color:G,fontSize:11,display:"flex",alignItems:"center",gap:3,fontWeight:500}}>
                        View PO <ArrowRight size={10}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{padding:"7px 14px",borderTop:"0.5px solid var(--color-border-tertiary)",fontSize:11,color:"var(--color-text-tertiary)"}}>{filteredMRS.length} of {mrs.length} MRS records · FY {CURRENT_FY}</div>
        </div>
      )}

      {activeStep==="po" && (
        <div style={{...cardStyle,padding:0,overflow:"hidden"}}>
          {selectedMRS && (
            <div style={{padding:"8px 14px",background:GL,borderBottom:"0.5px solid #C6E3C6",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:12,color:GD,fontWeight:500}}>Filtered: MRS {selectedMRS["MRS No"]} → {selectedMRS["Requested For"]}</span>
              <button onClick={()=>setSelectedMRS(null)} style={{background:"none",border:"none",cursor:"pointer",color:G,display:"flex",alignItems:"center",gap:3,fontSize:11}}>
                <X size={12}/>Show all POs
              </button>
            </div>
          )}
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{background:"var(--color-background-secondary)"}}>
                {["PO Number","PO Date","Vendor","Site","Value (₹)","Status","MRS Ref"].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:h==="Value (₹)"?"right":"left",fontWeight:500,fontSize:11,color:"var(--color-text-tertiary)",borderBottom:"0.5px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{textAlign:"center",padding:40}}><RefreshCw size={18} style={{animation:"spin 1s linear infinite"}}/></td></tr>
                : (selectedMRS ? filteredPOs.filter(p=>p["MRS Ref"]===selectedMRS["MRS No"]) : filteredPOs).length===0
                  ? <tr><td colSpan={7} style={{textAlign:"center",padding:32,color:"var(--color-text-tertiary)"}}>No POs found{selectedMRS?` for MRS ${selectedMRS["MRS No"]}`:""}</td></tr>
                : (selectedMRS ? filteredPOs.filter(p=>p["MRS Ref"]===selectedMRS["MRS No"]) : filteredPOs).map((r,i)=>{
                const cfg = PO_STATUS[r["Status"]]||{bg:"#F5F5F5",color:"#666"};
                return (
                  <tr key={r.UUID||i} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:i%2===0?"transparent":"var(--color-background-secondary)"}}>
                    <td style={{padding:"8px 10px",fontWeight:500,color:"#1565C0",fontFamily:"monospace",fontSize:11}}>{r["PO No"]}</td>
                    <td style={{padding:"8px 10px",fontSize:11,color:"var(--color-text-secondary)",whiteSpace:"nowrap"}}>{r["PO Date"]}</td>
                    <td style={{padding:"8px 10px",fontSize:11}}>{r["Vendor Name"]}<br/><span style={{fontSize:10,color:"var(--color-text-tertiary)"}}>{r["Vendor Code"]}</span></td>
                    <td style={{padding:"8px 10px",fontSize:11,color:"var(--color-text-secondary)"}}>{r["Site Name"]}</td>
                    <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontWeight:500}}>{fmt(r["PO Value"])}</td>
                    <td style={{padding:"8px 10px"}}>
                      <span style={{background:cfg.bg,color:cfg.color,padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:500}}>{r["Status"]}</span>
                    </td>
                    <td style={{padding:"8px 10px",fontSize:11,fontFamily:"monospace",color:"var(--color-text-tertiary)"}}>{r["MRS Ref"]||"-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{padding:"7px 14px",borderTop:"0.5px solid var(--color-border-tertiary)",fontSize:11,color:"var(--color-text-tertiary)"}}>{filteredPOs.length} POs · Total value: {fmt(filteredPOs.reduce((s,p)=>s+parseFloat(p["PO Value"]||0),0))}</div>
        </div>
      )}

      {(activeStep==="grn" || activeStep==="stock") && (
        <div style={{...cardStyle,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:48,gap:12}}>
          <div style={{width:52,height:52,borderRadius:12,background:"var(--color-background-secondary)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {activeStep==="grn" ? <Truck size={24} color="var(--color-text-secondary)"/> : <BarChart3 size={24} color="var(--color-text-secondary)"/>}
          </div>
          <p style={{fontSize:14,fontWeight:500,margin:0,color:"var(--color-text-primary)"}}>
            {activeStep==="grn" ? "GRN Module" : "StockIN View"}
          </p>
          <p style={{fontSize:13,color:"var(--color-text-tertiary)",margin:0,textAlign:"center",maxWidth:340}}>
            {activeStep==="grn"
              ? "Goods receipt data is in v2_Stores → GRN tab. Switch to the Inventory view for full stock tracking."
              : "StockIN entries live in v2_Stores → StockIN tab. The Inventory view shows live stock levels by site + part."}
          </p>
          <button onClick={()=>{ if(activeStep==="stock") { /* handled in App.jsx nav */ } }}
            style={{padding:"8px 18px",background:GL,border:`0.5px solid ${G}`,borderRadius:7,color:G,fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            Go to Inventory <ArrowRight size={12}/>
          </button>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
