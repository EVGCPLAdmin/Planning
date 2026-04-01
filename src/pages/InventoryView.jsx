import { useState, useEffect, useMemo } from "react";
import { Search, RefreshCw, AlertCircle, AlertTriangle, Package, ArrowRightLeft, BarChart3, X, TrendingDown, TrendingUp, CheckCircle2 } from "lucide-react";

const G="#2E6B2E", GD="#1A3F1A", GL="#EBF5EB";
const cardStyle={background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem"};
const inp={padding:"7px 10px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-primary)",fontSize:12,fontFamily:"inherit",color:"var(--color-text-primary)"};

// Part type tag colours
const PART_TYPE_COLORS = {
  "Asset":        {bg:"#E3F2FD",color:"#1565C0"},
  "HO Item":      {bg:"#EDE7F6",color:"#6A1B9A"},
  "Legacy":       {bg:"#F3E5F5",color:"#880E4F"},
  "Store Ledger": {bg:GL,       color:G         },
  "Other":        {bg:"#F5F5F5",color:"#666"    },
};

function getPartType(code) {
  if (!code) return "Other";
  if (code.startsWith("EGA-"))    return "Asset";
  if (code.startsWith("HOv1-"))   return "HO Item";
  if (code.startsWith("SL_Rec-")) return "Store Ledger";
  if (code.startsWith("Existing-")) return "Legacy";
  return "Other";
}

// ── Mock stock data (subset) ──────────────────────────────────────────────────

export default function InventoryView({ project, user }) {
  const siteName = project?.siteName || project?.site || "";
  const [stock, setStock]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [view, setView]       = useState("table"); // "table" | "site"
  const [search, setSearch]   = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAlert, setFilterAlert] = useState(""); // "" | "zero" | "low"
  const [lastRefresh, setLastRefresh] = useState(null);


  async function load() {
    setLoading(true); setError("");
    try {
      const { fetchStockLevels } = await import("../utils/sheetsClient");
      const rows = await fetchStockLevels({ site: siteName });
      setStock(rows);
      setLastRefresh(new Date());
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ load(); },[project?.id]);

  const allSites = useMemo(()=>[...new Set(stock.map(r=>r["Site Name"]).filter(Boolean))].sort(),[stock]);
  const allTypes = useMemo(()=>[...new Set(stock.map(r=>r.partType).filter(Boolean))].sort(),[stock]);

  const filtered = useMemo(()=>{
    let rows = [...stock];
    if (search) { const q=search.toLowerCase(); rows=rows.filter(r=>r["Part Details"]?.toLowerCase().includes(q)||r["Site Name"]?.toLowerCase().includes(q)); }
    if (filterSite) rows=rows.filter(r=>r["Site Name"]?.toLowerCase().includes(filterSite.toLowerCase()));
    if (filterType) rows=rows.filter(r=>r.partType===filterType);
    if (filterAlert==="zero") rows=rows.filter(r=>r.siteStock===0);
    if (filterAlert==="low")  rows=rows.filter(r=>r.siteStock>0 && r.siteStock<=5);
    return rows;
  },[stock,search,filterSite,filterType,filterAlert]);

  // KPIs
  const kpis = useMemo(()=>({
    totalParts:   stock.length,
    inStockParts: stock.filter(r=>r.siteStock>0).length,
    zeroStock:    stock.filter(r=>r.siteStock===0).length,
    totalStockIn: stock.reduce((s,r)=>s+r.stockIn,0),
    totalStockOut:stock.reduce((s,r)=>s+r.stockOut,0),
  }),[stock]);

  // Site summary
  const siteSummary = useMemo(()=>{
    const m={};
    stock.forEach(r=>{
      const s=r["Site Name"]||"Unknown";
      if(!m[s]) m[s]={site:s,total:0,inStock:0,zero:0,totalStockIn:0};
      m[s].total++;
      if(r.siteStock>0) m[s].inStock++;
      else m[s].zero++;
      m[s].totalStockIn+=r.stockIn;
    });
    return Object.values(m).sort((a,b)=>b.total-a.total);
  },[stock]);

  return (
    <div style={{padding:24}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:18,fontWeight:600,color:"var(--color-text-primary)"}}>Inventory</h2>
          <p style={{margin:"2px 0 0",fontSize:12,color:"var(--color-text-tertiary)"}}>
            v2_Stores → StockLevels · {siteName || "All Sites"} · {lastRefresh?"Updated "+lastRefresh.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}):""}
          </p>
        </div>
        <div style={{display:"flex",gap:8}}>
          {/* View toggle */}
          <div style={{display:"flex",border:"0.5px solid var(--color-border-secondary)",borderRadius:7,overflow:"hidden",background:"var(--color-background-secondary)"}}>
            {[["table","Parts"],["site","By Site"]].map(([id,label])=>(
              <button key={id} onClick={()=>setView(id)}
                style={{padding:"6px 12px",fontSize:12,background:view===id?"var(--color-background-primary)":"transparent",border:"none",cursor:"pointer",color:view===id?"var(--color-text-primary)":"var(--color-text-secondary)",fontWeight:view===id?500:400,borderBottom:view===id?`2px solid ${G}`:"2px solid transparent"}}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",background:GL,border:`0.5px solid ${G}`,borderRadius:7,fontSize:12,fontWeight:500,color:G,cursor:loading?"not-allowed":"pointer"}}>
            <RefreshCw size={13} style={{animation:loading?"spin 1s linear infinite":"none"}}/>{loading?"Loading…":"Refresh"}
          </button>
        </div>
      </div>

      {error && <div style={{background:"#FEECEC",border:"0.5px solid #FFCDD2",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#C62828",marginBottom:16,display:"flex",gap:8}}><AlertCircle size={14}/>{error}</div>}

      {/* Zero stock alert banner */}
      {kpis.zeroStock > 0 && (
        <div style={{background:"#FFF8E1",border:"0.5px solid #FFE082",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#E65100",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <AlertTriangle size={14}/>
            <span><strong>{kpis.zeroStock} parts</strong> at zero stock across {[...new Set(stock.filter(r=>r.siteStock===0).map(r=>r["Site Name"]))].length} sites</span>
          </div>
          <button onClick={()=>setFilterAlert(filterAlert==="zero"?"":"zero")}
            style={{padding:"3px 10px",background:filterAlert==="zero"?"#E65100":"transparent",color:filterAlert==="zero"?"white":"#E65100",border:"0.5px solid #E65100",borderRadius:5,cursor:"pointer",fontSize:11,fontWeight:500}}>
            {filterAlert==="zero"?"Clear filter":"Show zero-stock"}
          </button>
        </div>
      )}

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:20}}>
        {[
          ["Total SKUs",kpis.totalParts,"tracked",GD],
          ["In Stock",kpis.inStockParts,"SKUs > 0",G],
          ["Zero Stock",kpis.zeroStock,"need restocking","#E65100"],
          ["Total Stock-IN",kpis.totalStockIn.toLocaleString("en-IN"),"units received","#1565C0"],
          ["Total Stock-OUT",kpis.totalStockOut.toLocaleString("en-IN"),"units issued","#6A1B9A"],
        ].map(([l,v,s,c])=>(
          <div key={l} style={{...cardStyle,borderLeft:`3px solid ${c}`,padding:"0.75rem 1rem"}}>
            <p style={{margin:"0 0 4px",fontSize:10,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".05em"}}>{l}</p>
            <p style={{margin:"0 0 2px",fontSize:18,fontWeight:500,fontFamily:"monospace",color:"var(--color-text-primary)"}}>{v}</p>
            <p style={{margin:0,fontSize:10,color:"var(--color-text-tertiary)"}}>{s}</p>
          </div>
        ))}
      </div>

      {/* Filters (table view only) */}
      {view==="table" && (
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,border:"0.5px solid var(--color-border-secondary)",borderRadius:6,padding:"6px 10px",flex:1,minWidth:180,background:"var(--color-background-primary)"}}>
            <Search size={13} color="var(--color-text-tertiary)"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search part code or site…"
              style={{border:"none",outline:"none",fontSize:12,background:"transparent",width:"100%",color:"var(--color-text-primary)"}}/>
            {search && <button onClick={()=>setSearch("")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",display:"flex"}}><X size={12}/></button>}
          </div>
          <select value={filterSite} onChange={e=>setFilterSite(e.target.value)} style={{...inp,minWidth:160}}>
            <option value="">All Sites</option>
            {allSites.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filterType} onChange={e=>setFilterType(e.target.value)} style={inp}>
            <option value="">All Part Types</option>
            {allTypes.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterAlert} onChange={e=>setFilterAlert(e.target.value)} style={inp}>
            <option value="">All stock levels</option>
            <option value="zero">Zero stock only</option>
            <option value="low">Low stock (≤5)</option>
          </select>
          {(search||filterSite||filterType||filterAlert) && (
            <button onClick={()=>{setSearch("");setFilterSite("");setFilterType("");setFilterAlert("");}}
              style={{padding:"6px 12px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:6,fontSize:12,cursor:"pointer",color:"var(--color-text-secondary)",display:"flex",alignItems:"center",gap:4}}>
              <X size={11}/>Clear
            </button>
          )}
        </div>
      )}

      {/* Table view */}
      {view==="table" && (
        <div style={{...cardStyle,padding:0,overflow:"hidden"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"var(--color-background-secondary)"}}>
                  {["#","Part Code","Type","Site","Opening","Stock IN","Transfers","Stock Out","Site Stock","Status"].map(h=>(
                    <th key={h} style={{padding:"8px 10px",textAlign:["Opening","Stock IN","Stock Out","Site Stock","Transfers"].includes(h)?"right":"left",fontWeight:500,fontSize:11,color:"var(--color-text-tertiary)",borderBottom:"0.5px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={10} style={{textAlign:"center",padding:48}}><RefreshCw size={18} style={{animation:"spin 1s linear infinite"}}/></td></tr>
                  : filtered.length===0 ? <tr><td colSpan={10} style={{textAlign:"center",padding:32,color:"var(--color-text-tertiary)"}}>No items match filters</td></tr>
                  : filtered.map((r,i)=>{
                  const siteStock = r.siteStock ?? parseFloat(r["Site Stock"]||0);
                  const stockAlert = siteStock===0 ? "zero" : siteStock<=5 ? "low" : "ok";
                  const ptCfg = PART_TYPE_COLORS[r.partType]||PART_TYPE_COLORS.Other;
                  const stIn = r.stockIn ?? parseFloat(r["StockIN"]||0);
                  const stOut = r.stockOut ?? parseFloat(r["Stock Out"]||0);
                  const old_sl = parseFloat(r["Old_SL"]||0);
                  const stTo = parseFloat(r["Stock Transfer (To)"]||0);
                  const stFrom = parseFloat(r["Stock Transfer (From)"]||0);
                  return (
                    <tr key={r.SNo||i} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:stockAlert==="zero"?"#FFF8E1":i%2===0?"transparent":"var(--color-background-secondary)"}}>
                      <td style={{padding:"8px 10px",fontSize:11,color:"var(--color-text-tertiary)"}}>{r.SNo}</td>
                      <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:11,color:GD,fontWeight:500}}>{r["Part Details"]}</td>
                      <td style={{padding:"8px 10px"}}>
                        <span style={{...ptCfg,padding:"2px 7px",borderRadius:12,fontSize:10,fontWeight:500}}>{r.partType}</span>
                      </td>
                      <td style={{padding:"8px 10px",fontSize:11,color:"var(--color-text-secondary)"}}>{r["Site Name"]}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontSize:11,color:"var(--color-text-tertiary)"}}>{old_sl.toLocaleString("en-IN")}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontSize:11,color:stIn>0?"#1565C0":"var(--color-text-tertiary)"}}>
                        {stIn>0?<span style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3}}><TrendingUp size={10}/>{stIn.toLocaleString("en-IN")}</span>:"-"}
                      </td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontSize:11,color:"var(--color-text-tertiary)"}}>
                        {(stTo+stFrom)>0?`±${(stTo+stFrom).toLocaleString("en-IN")}`:"-"}
                      </td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontSize:11,color:stOut>0?"#C62828":"var(--color-text-tertiary)"}}>
                        {stOut>0?<span style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:3}}><TrendingDown size={10}/>{stOut.toLocaleString("en-IN")}</span>:"-"}
                      </td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontWeight:500,color:siteStock===0?"#E65100":siteStock<=5?"#F57F17":G,fontSize:13}}>
                        {siteStock.toLocaleString("en-IN")}
                      </td>
                      <td style={{padding:"8px 10px"}}>
                        {stockAlert==="zero" && <span style={{background:"#FFF8E1",color:"#E65100",padding:"2px 7px",borderRadius:12,fontSize:10,fontWeight:500,display:"flex",alignItems:"center",gap:3,width:"fit-content"}}><AlertTriangle size={9}/>Zero</span>}
                        {stockAlert==="low"  && <span style={{background:"#FFF3E0",color:"#F57F17",padding:"2px 7px",borderRadius:12,fontSize:10,fontWeight:500,display:"flex",alignItems:"center",gap:3,width:"fit-content"}}><AlertCircle size={9}/>Low</span>}
                        {stockAlert==="ok"   && <span style={{background:GL,color:G,padding:"2px 7px",borderRadius:12,fontSize:10,fontWeight:500,display:"flex",alignItems:"center",gap:3,width:"fit-content"}}><CheckCircle2 size={9}/>OK</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:"7px 14px",borderTop:"0.5px solid var(--color-border-tertiary)",fontSize:11,color:"var(--color-text-tertiary)",display:"flex",justifyContent:"space-between"}}>
            <span>Showing {filtered.length} of {stock.length} SKUs</span>
            <span>{stock.filter(r=>r.siteStock===0).length} zero-stock · {stock.filter(r=>r.siteStock>0&&r.siteStock<=5).length} low-stock</span>
          </div>
        </div>
      )}

      {/* Site summary view */}
      {view==="site" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {siteSummary.map(s=>(
            <div key={s.site} style={{...cardStyle,cursor:"pointer"}} onClick={()=>{ setView("table"); setFilterSite(s.site); }}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <p style={{margin:0,fontWeight:500,fontSize:13,color:"var(--color-text-primary)"}}>{s.site}</p>
                  <p style={{margin:"2px 0 0",fontSize:11,color:"var(--color-text-tertiary)"}}>{s.total} SKUs tracked</p>
                </div>
                <span style={{background:GL,color:G,padding:"3px 9px",borderRadius:12,fontSize:12,fontWeight:500}}>{s.inStock}</span>
              </div>
              {/* Progress bar */}
              <div style={{height:5,background:"var(--color-background-secondary)",borderRadius:3,marginBottom:8,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${s.total>0?(s.inStock/s.total*100):0}%`,background:G,borderRadius:3}}/>
              </div>
              <div style={{display:"flex",gap:12,fontSize:11}}>
                <span style={{color:G}}>{s.inStock} in stock</span>
                {s.zero>0 && <span style={{color:"#E65100"}}>{s.zero} zero-stock</span>}
                <span style={{color:"var(--color-text-tertiary)",marginLeft:"auto"}}>{s.totalStockIn.toLocaleString("en-IN")} received</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
