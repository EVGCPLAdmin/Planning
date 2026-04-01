import { useState } from "react";
import {
  LayoutDashboard, ClipboardList, FileText, Users, HardHat,
  ChevronLeft, ChevronRight, ChevronDown, Building2,
  Plus, Search, Bell, Check, X, AlertTriangle,
  TrendingUp, Eye, ArrowRight, Layers, Settings,
  CheckCircle2, Printer, LogOut, ShieldCheck,
  IndianRupee, Package, Boxes
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PROJECTS, BOQ_ITEMS, MONTHLY_DATA, PROJECT_SITE_MAP } from "./data/mockData";
import LoginPage, { useAuth } from "./pages/Login.jsx";
import BOQManager from "./pages/BOQManager.jsx";
import DPREntry from "./pages/DPREntry.jsx";
import Subcontractors from "./pages/Subcontractors.jsx";
import AccountsDashboard from "./pages/AccountsDashboard.jsx";
import PurchaseModule from "./pages/PurchaseModule.jsx";
import InventoryView from "./pages/InventoryView.jsx";
import { exportRABillPDF, exportDPRReportPDF, exportSCBillPDF } from "./utils/pdfExport.js";

const G="#2E6B2E",GD="#1A3F1A",GL="#EBF5EB";
const today=new Date().toISOString().split("T")[0];
const fmt=n=>"₹"+Math.round(n||0).toLocaleString("en-IN");
const fmtL=n=>"₹"+((n||0)/100000).toFixed(2)+"L";
const fmtCr=n=>"₹"+((n||0)/10000000).toFixed(3)+" Cr";

const NAV_ITEMS={
  admin:    ["home","dpr","bills","boq","subcon","accounts","purchase","inventory","settings"],
  engineer: ["home","dpr"],
  accounts: ["home","bills","boq","subcon","accounts","purchase","inventory"],
};
const PAGES_NO_SOON=["home","dpr","bills","boq","subcon","accounts","purchase","inventory"];
const ALL_PAGES=[
  {id:"home",    label:"Dashboard",      Icon:LayoutDashboard, roles:["admin","engineer","accounts"]},
  {id:"dpr",     label:"DPR Entry",      Icon:ClipboardList,   roles:["admin","engineer"]},
  {id:"bills",   label:"RA Bills",       Icon:FileText,        roles:["admin","accounts"]},
  {id:"boq",     label:"BOQ Manager",    Icon:Layers,          roles:["admin","accounts"]},
  {id:"subcon",  label:"Sub-contractors",Icon:Users,           roles:["admin","accounts"]},
  {id:"accounts",label:"Accounts",       Icon:IndianRupee,     roles:["admin","accounts"]},
  {id:"purchase",label:"Purchase",       Icon:Package,         roles:["admin","accounts"]},
  {id:"inventory",label:"Inventory",     Icon:Boxes,           roles:["admin","accounts"]},
  {id:"settings",label:"Settings",       Icon:Settings,        roles:["admin"],soon:true},
];

const StatusBadge=({status})=>{const m={Paid:{bg:"#EBF5EB",color:G,dot:G},Certified:{bg:"#E3F2FD",color:"#1565C0",dot:"#1565C0"},Submitted:{bg:"#FFF8E1",color:"#F57F17",dot:"#F57F17"}};const s=m[status]||{bg:"#F5F5F5",color:"#666",dot:"#666"};return <span style={{background:s.bg,color:s.color,padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:500,display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot}}/>{status}</span>};

const KPICard=({label,value,sub,accent=G})=>(<div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem",borderLeft:`3px solid ${accent}`}}><p style={{margin:"0 0 8px",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</p><p style={{margin:"0 0 4px",fontSize:22,fontWeight:500,color:"var(--color-text-primary)",fontFamily:"monospace"}}>{value}</p>{sub&&<p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{sub}</p>}</div>);

const EGLogo=({c})=>(<div style={{display:"flex",alignItems:"center",gap:c?0:10}}><svg width="38" height="34" viewBox="0 0 38 34" fill="none"><rect width="18" height="34" rx="3" fill="#1A1A1A"/><rect x="18" width="20" height="34" rx="3" fill={G}/><text x="3" y="26" fill="white" fontSize="20" fontWeight="700" fontFamily="sans-serif">E</text><text x="20" y="26" fill="white" fontSize="20" fontWeight="700" fontFamily="sans-serif">G</text><ellipse cx="29" cy="8" rx="8" ry="4" fill="#1A1A1A" opacity=".7"/><rect x="23" y="10" width="12" height="2" rx="1" fill="#1A1A1A" opacity=".5"/></svg>{!c&&<div><p style={{margin:0,color:"white",fontWeight:600,fontSize:13}}>Evergreen</p><p style={{margin:0,color:"rgba(255,255,255,.5)",fontSize:11}}>Enterprises</p></div>}</div>);

function Sidebar({page,setPage,user,project,setProject,collapsed,setCollapsed,onLogout}){
  const [pick,setPick]=useState(false);
  const vis=ALL_PAGES.filter(p=>(NAV_ITEMS[user.role]||[]).includes(p.id));
  return <div style={{width:collapsed?60:220,background:GD,display:"flex",flexDirection:"column",flexShrink:0,transition:"width .2s",overflow:"hidden"}}>
    <div style={{padding:"14px 12px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid rgba(255,255,255,.08)"}}>
      <EGLogo c={collapsed}/><button onClick={()=>setCollapsed(!collapsed)} style={{background:"rgba(255,255,255,.08)",border:"none",borderRadius:6,padding:5,cursor:"pointer",color:"rgba(255,255,255,.7)",display:"flex",flexShrink:0}}>{collapsed?<ChevronRight size={14}/>:<ChevronLeft size={14}/>}</button>
    </div>
    <div style={{padding:"10px 8px",borderBottom:"1px solid rgba(255,255,255,.08)",position:"relative"}}>
      <button onClick={()=>setPick(!pick)} style={{width:"100%",background:"rgba(255,255,255,.07)",border:"0.5px solid rgba(255,255,255,.12)",borderRadius:8,padding:collapsed?"8px 0":"8px 10px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,color:"white"}}>
        <Building2 size={14} color="rgba(255,255,255,.7)" style={{flexShrink:0}}/>{!collapsed&&<><div style={{flex:1,textAlign:"left",overflow:"hidden"}}><p style={{margin:0,fontSize:11,fontWeight:600,color:"white",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{project.id}</p><p style={{margin:0,fontSize:10,color:"rgba(255,255,255,.45)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{project.name.split("–")[0].trim()}</p></div><ChevronDown size={12} color="rgba(255,255,255,.4)" style={{flexShrink:0}}/></>}
      </button>
      {pick&&<div style={{position:"absolute",top:"calc(100% - 4px)",left:8,right:8,background:"white",borderRadius:8,border:"0.5px solid rgba(0,0,0,.1)",zIndex:50,overflow:"hidden",boxShadow:"0 8px 24px rgba(0,0,0,.15)"}}>
        <p style={{margin:0,padding:"8px 12px",fontSize:10,fontWeight:600,color:"#888",textTransform:"uppercase",letterSpacing:".06em",borderBottom:"0.5px solid rgba(0,0,0,.08)"}}>Switch project</p>
        {PROJECTS.filter(p=>user.projects.includes(p.id)).map(p=><button key={p.id} onClick={()=>{setProject(p);setPick(false)}} style={{width:"100%",background:project.id===p.id?GL:"transparent",border:"none",padding:"10px 12px",cursor:"pointer",textAlign:"left",borderBottom:"0.5px solid rgba(0,0,0,.06)"}}><p style={{margin:0,fontSize:12,fontWeight:500,color:project.id===p.id?G:"#1A1A1A"}}>{p.id}</p><p style={{margin:0,fontSize:11,color:"#888"}}>{p.name}</p></button>)}
      </div>}
    </div>
    <nav style={{flex:1,padding:"8px",display:"flex",flexDirection:"column",gap:2}}>
      {vis.map(({id,label,Icon,soon})=>{const a=page===id;return <button key={id} onClick={()=>!soon&&setPage(id)} style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"10px 0":"9px 12px",justifyContent:collapsed?"center":"flex-start",borderRadius:7,background:a?"rgba(255,255,255,.15)":"transparent",border:a?"0.5px solid rgba(255,255,255,.2)":"none",cursor:soon?"not-allowed":"pointer",color:a?"white":"rgba(255,255,255,.5)",opacity:soon?.55:1,textAlign:"left",transition:"all .1s"}}><Icon size={16} style={{flexShrink:0}}/>{!collapsed&&<span style={{fontSize:13,fontWeight:a?500:400,flex:1}}>{label}</span>}{!collapsed&&soon&&<span style={{fontSize:9,background:"rgba(255,255,255,.1)",color:"rgba(255,255,255,.45)",padding:"1px 6px",borderRadius:10}}>soon</span>}</button>})}
    </nav>
    <div style={{padding:"10px 8px",borderTop:"1px solid rgba(255,255,255,.08)"}}>
      <div style={{display:"flex",alignItems:"center",gap:collapsed?0:8,padding:collapsed?"8px 0":"8px 10px"}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:`${user.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:user.color,flexShrink:0,border:`1.5px solid ${user.color}60`}}>{user.initials}</div>
        {!collapsed&&<><div style={{flex:1,minWidth:0}}><p style={{margin:0,fontSize:11,fontWeight:500,color:"white",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</p><p style={{margin:0,fontSize:10,color:"rgba(255,255,255,.4)"}}>{user.roleLabel}</p></div><button onClick={onLogout} style={{background:"transparent",border:"none",cursor:"pointer",color:"rgba(255,255,255,.4)",display:"flex",flexShrink:0,padding:4,borderRadius:4}} onMouseEnter={e=>e.currentTarget.style.color="white"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,.4)"}><LogOut size={14}/></button></>}
      </div>
    </div>
  </div>;
}

function Header({page,user,project}){
  const t={home:"Dashboard",dpr:"DPR Entry",bills:"RA Bills",boq:"BOQ Manager",subcon:"Sub-contractors",settings:"Settings"};
  return <div style={{height:54,background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
    <div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{t[page]||page}</p><p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{project.fullName}</p></div>
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)"}}><ShieldCheck size={13} color={user.color}/><span style={{fontSize:12,fontWeight:500,color:user.color}}>{user.roleLabel}</span></div>
    <div style={{width:1,height:20,background:"var(--color-border-tertiary)"}}/>
    <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:`${user.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:user.color}}>{user.initials}</div><div><p style={{margin:0,fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{user.name}</p><p style={{margin:0,fontSize:10,color:"var(--color-text-tertiary)"}}>{user.email}</p></div></div>
  </div>;
}

function HomePage({project,bills,dprs}){
  const tb=bills.reduce((s,b)=>s+b.grossAmt,0);
  const tc=bills.filter(b=>b.status!=="Submitted").reduce((s,b)=>s+b.certifiedAmt,0);
  const bal=project.contractValue-tb;
  const pct=Math.round((tb/project.contractValue)*100);
  return <div style={{padding:24}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
      <KPICard label="Contract Value" value={fmtCr(project.contractValue)} sub={`WO: ${project.wo.slice(-10)}`} accent={G}/>
      <KPICard label="Total Billed" value={fmtL(tb)} sub={`${pct}% of contract`} accent="#1565C0"/>
      <KPICard label="Certified" value={fmtL(tc)} sub={`${bills.filter(b=>b.status!=="Submitted").length} bills certified`} accent="#F57F17"/>
      <KPICard label="Balance to Bill" value={fmtL(bal)} sub="Remaining contract value" accent="#E53935"/>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><p style={{margin:0,fontWeight:500,fontSize:14}}>Monthly turnover (planned)</p><span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>INR Lakhs · 2025</span></div>
        <ResponsiveContainer width="100%" height={160}><BarChart data={MONTHLY_DATA.slice(0,12)} margin={{top:0,right:0,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)"/><XAxis dataKey="month" tick={{fontSize:10,fill:"var(--color-text-tertiary)"}} tickLine={false} axisLine={false}/><YAxis tick={{fontSize:9}} tickFormatter={v=>(v/100000).toFixed(0)+"L"} tickLine={false} axisLine={false}/><Tooltip formatter={v=>[fmt(v),"Turnover"]} contentStyle={{fontSize:12,borderRadius:8}}/><Bar dataKey="turnover" fill={G} radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
      </div>
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem"}}>
        <p style={{margin:"0 0 12px",fontWeight:500,fontSize:14}}>BOQ completion status</p>
        {BOQ_ITEMS.map(item=>{const p2=Math.min(100,Math.round((item.billedQty/item.woQty)*100));return <div key={item.code} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:"var(--color-text-secondary)",maxWidth:"70%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.code} – {item.desc}</span><span style={{fontSize:11,fontWeight:500,color:p2>=100?"#E53935":G,fontFamily:"monospace"}}>{p2}%</span></div><div style={{height:4,background:"var(--color-border-tertiary)",borderRadius:2}}><div style={{height:4,borderRadius:2,background:p2>=100?"#E53935":p2>80?"#F57F17":G,width:`${p2}%`,transition:"width .5s"}}/></div></div>})}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem"}}>
        <p style={{margin:"0 0 12px",fontWeight:500,fontSize:14}}>Recent DPR entries</p>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Date","Item","Location","Qty","Sub-contractor"].map(h=><th key={h} style={{textAlign:"left",padding:"4px 6px",color:"var(--color-text-tertiary)",fontWeight:500,fontSize:11,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{h}</th>)}</tr></thead><tbody>{dprs.slice(0,5).map((d,i)=><tr key={d.id} style={{background:i%2===0?"transparent":"var(--color-background-secondary)"}}><td style={{padding:"5px 6px",fontFamily:"monospace",fontSize:11}}>{d.date.slice(5)}</td><td style={{padding:"5px 6px",fontWeight:500,color:G}}>{d.boqCode}</td><td style={{padding:"5px 6px",fontFamily:"monospace",fontSize:11}}>{d.location}</td><td style={{padding:"5px 6px",textAlign:"right",fontFamily:"monospace"}}>{d.qty.toLocaleString("en-IN")}</td><td style={{padding:"5px 6px",color:"var(--color-text-secondary)",maxWidth:90,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.subcon}</td></tr>)}</tbody></table>
      </div>
      <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem"}}>
        <p style={{margin:"0 0 12px",fontWeight:500,fontSize:14}}>RA bill register</p>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr>{["Bill No.","Date","Gross Amt","Status"].map(h=><th key={h} style={{textAlign:"left",padding:"4px 6px",color:"var(--color-text-tertiary)",fontWeight:500,fontSize:11,borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{h}</th>)}</tr></thead><tbody>{bills.map((b,i)=><tr key={b.no} style={{background:i%2===0?"transparent":"var(--color-background-secondary)"}}><td style={{padding:"5px 6px",fontWeight:500,color:G}}>RA-{String(b.no).padStart(3,"0")}</td><td style={{padding:"5px 6px",fontSize:11,color:"var(--color-text-secondary)"}}>{b.date}</td><td style={{padding:"5px 6px",fontFamily:"monospace",fontSize:11}}>{fmtL(b.grossAmt)}</td><td style={{padding:"5px 6px"}}><StatusBadge status={b.status}/></td></tr>)}</tbody></table>
      </div>
    </div>
  </div>;
}

function DPRPage({project,dprs,setDprs,exportDPR}){
  const empty={date:today,boqCode:"",location:"",qty:"",subcon:"",labour:"",equipment:"",hindrances:"",enteredBy:""};
  const [form,setForm]=useState(empty);
  const [toast,setToast]=useState(null);
  const [filter,setFilter]=useState("");
  const [errors,setErrors]=useState({});
  const sel=BOQ_ITEMS.find(b=>b.code===form.boqCode);
  const validate=()=>{const e={};if(!form.date)e.date="Required";if(!form.boqCode)e.boqCode="Required";if(!form.location)e.location="Required";if(!form.qty||isNaN(form.qty)||Number(form.qty)<=0)e.qty="Enter valid quantity";if(!form.subcon)e.subcon="Required";if(!form.enteredBy)e.enteredBy="Required";setErrors(e);return Object.keys(e).length===0;};
  const submit=()=>{if(!validate())return;setDprs([{...form,id:Date.now(),qty:Number(form.qty),unit:sel?.unit||"",boqDesc:sel?.desc||"",status:"Submitted"},...dprs]);setForm(empty);setErrors({});setToast("DPR entry saved");setTimeout(()=>setToast(null),3000);};
  const filt=filter?dprs.filter(d=>d.boqCode.includes(filter)||d.location.toLowerCase().includes(filter.toLowerCase())||d.subcon.toLowerCase().includes(filter.toLowerCase())):dprs;
  const inp=err=>({width:"100%",padding:"7px 10px",borderRadius:6,border:`0.5px solid ${err?"#E53935":"var(--color-border-secondary)"}`,background:"var(--color-background-primary)",fontSize:13,boxSizing:"border-box"});
  const F=({label,required,error,children})=><div style={{marginBottom:14}}><label style={{display:"block",fontSize:12,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:5}}>{label}{required&&<span style={{color:"#E53935",marginLeft:2}}>*</span>}</label>{children}{error&&<p style={{margin:"3px 0 0",fontSize:11,color:"#E53935"}}>{error}</p>}</div>;
  return <div style={{padding:24,display:"flex",gap:20,alignItems:"flex-start"}}>
    {toast&&<div style={{position:"absolute",top:70,right:24,background:G,color:"white",padding:"10px 18px",borderRadius:8,fontSize:13,display:"flex",alignItems:"center",gap:8,zIndex:100}}><CheckCircle2 size={16}/>{toast}</div>}
    <div style={{width:370,flexShrink:0,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1.25rem"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><div style={{width:28,height:28,borderRadius:6,background:GL,display:"flex",alignItems:"center",justifyContent:"center"}}><ClipboardList size={15} color={G}/></div><div><p style={{margin:0,fontWeight:500,fontSize:14}}>New DPR Entry</p><p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{project.id} · {today}</p></div></div>
      <F label="Date" required error={errors.date}><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={inp(errors.date)}/></F>
      <F label="BOQ item" required error={errors.boqCode}><select value={form.boqCode} onChange={e=>setForm({...form,boqCode:e.target.value})} style={inp(errors.boqCode)}><option value="">— Select BOQ item —</option>{BOQ_ITEMS.map(b=><option key={b.code} value={b.code}>{b.code} — {b.desc.slice(0,40)}</option>)}</select></F>
      {sel&&<div style={{background:GL,border:"0.5px solid rgba(46,107,46,.2)",borderRadius:6,padding:"8px 10px",marginBottom:14,display:"flex",gap:16}}>{[["Unit",sel.unit],["Rate",fmt(sel.rate)],["WO Qty",sel.woQty.toLocaleString("en-IN")]].map(([k,v])=><div key={k}><p style={{margin:0,fontSize:10,color:G,fontWeight:500}}>{k}</p><p style={{margin:0,fontSize:13,fontWeight:500,color:G,fontFamily:"monospace"}}>{v}</p></div>)}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <F label="Location / Hole ID" required error={errors.location}><input type="text" value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="TB2/R9/1/P" style={inp(errors.location)}/></F>
        <F label="Quantity" required error={errors.qty}><input type="number" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})} placeholder="0.00" style={inp(errors.qty)}/></F>
      </div>
      <F label="Sub-contractor" required error={errors.subcon}><select value={form.subcon} onChange={e=>setForm({...form,subcon:e.target.value})} style={inp(errors.subcon)}><option value="">— Select —</option>{SUBCONTRACTORS.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</select></F>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <F label="Labour count"><input type="number" value={form.labour} onChange={e=>setForm({...form,labour:e.target.value})} placeholder="0" style={inp(false)}/></F>
        <F label="Equipment"><input type="text" value={form.equipment} onChange={e=>setForm({...form,equipment:e.target.value})} placeholder="Rig, Pump..." style={inp(false)}/></F>
      </div>
      <F label="Hindrances"><textarea value={form.hindrances} onChange={e=>setForm({...form,hindrances:e.target.value})} rows={2} placeholder="Delays, queries..." style={{...inp(false),resize:"vertical"}}/></F>
      <F label="Entered by" required error={errors.enteredBy}><input type="text" value={form.enteredBy} onChange={e=>setForm({...form,enteredBy:e.target.value})} placeholder="Site Engineer name" style={inp(errors.enteredBy)}/></F>
      <div style={{display:"flex",gap:8}}><button onClick={submit} style={{flex:1,padding:"9px",background:G,color:"white",border:"none",borderRadius:7,fontSize:13,fontWeight:500,cursor:"pointer"}}>Save DPR Entry</button><button onClick={()=>setForm(empty)} style={{padding:"9px 14px",background:"transparent",border:"0.5px solid var(--color-border-secondary)",borderRadius:7,fontSize:13,cursor:"pointer"}}>Clear</button></div>
    </div>
    <div style={{flex:1,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><p style={{margin:0,fontWeight:500,fontSize:14}}>DPR log</p><p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{dprs.length} entries</p></div><div style={{display:"flex",gap:8,alignItems:"center"}}><div style={{display:"flex",alignItems:"center",gap:6,border:"0.5px solid var(--color-border-secondary)",borderRadius:6,padding:"6px 10px"}}><Search size={13} color="var(--color-text-tertiary)"/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search..." style={{border:"none",outline:"none",fontSize:12,background:"transparent",width:140,color:"var(--color-text-primary)"}}/></div><button onClick={()=>exportDPR&&exportDPR("","")} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",background:"var(--color-background-secondary)",border:"0.5px solid var(--color-border-secondary)",borderRadius:6,fontSize:12,cursor:"pointer",color:"var(--color-text-secondary)"}}><Printer size={13}/>Export DPR</button></div></div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"var(--color-background-secondary)"}}>{["Date","BOQ","Location","Qty","Unit","Sub-contractor","Labour","Entered By","Status"].map(h=><th key={h} style={{textAlign:"left",padding:"7px 8px",color:"var(--color-text-tertiary)",fontWeight:500,fontSize:11,borderBottom:"0.5px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{filt.map((d,i)=><tr key={d.id} style={{background:i%2===0?"transparent":"var(--color-background-secondary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><td style={{padding:"7px 8px",fontFamily:"monospace",fontSize:11,whiteSpace:"nowrap"}}>{d.date}</td><td style={{padding:"7px 8px",fontWeight:500,color:G}}>{d.boqCode}</td><td style={{padding:"7px 8px",fontFamily:"monospace",fontSize:11}}>{d.location}</td><td style={{padding:"7px 8px",textAlign:"right",fontFamily:"monospace"}}>{Number(d.qty).toLocaleString("en-IN")}</td><td style={{padding:"7px 8px",color:"var(--color-text-tertiary)"}}>{d.unit}</td><td style={{padding:"7px 8px",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.subcon}</td><td style={{padding:"7px 8px",textAlign:"right"}}>{d.labour||"—"}</td><td style={{padding:"7px 8px",color:"var(--color-text-secondary)"}}>{d.enteredBy}</td><td style={{padding:"7px 8px"}}><StatusBadge status={d.status}/></td></tr>)}{filt.length===0&&<tr><td colSpan={9} style={{textAlign:"center",padding:32,color:"var(--color-text-tertiary)",fontSize:13}}>No DPR entries found</td></tr>}</tbody></table></div>
    </div>
  </div>;
}

function RABillPage({project,bills,setBills,exportBill}){
  const [show,setShow]=useState(false);const [step,setStep]=useState(0);
  const [per,setPer]=useState({from:"",to:"",no:String(bills.length+1)});
  const [qtys,setQtys]=useState({});const [ded,setDed]=useState({ret:5,adv:0,tds:2,ld:0});
  const gross=BOQ_ITEMS.reduce((s,b)=>s+(Number(qtys[b.code])||0)*b.rate,0);
  const igst=gross*.18,ret=gross*ded.ret/100,tds=gross*ded.tds/100,net=gross+igst-ret-(gross*ded.adv/100)-tds-(Number(ded.ld)||0);
  const inp={padding:"6px 8px",borderRadius:6,border:"0.5px solid rgba(0,0,0,.2)",background:"white",fontSize:12,color:"#1A1A1A",width:"100%"};
  const steps=["Period","Quantities","Deductions","Preview"];
  const submit=()=>{setBills([...bills,{no:bills.length+1,billRef:`EG-2337/RA/${String(bills.length+1).padStart(3,"0")}`,period:`${per.from} to ${per.to}`,date:today,grossAmt:gross,igst,netPayable:net,status:"Submitted",certifiedAmt:0}]);setQtys({});setPer({from:"",to:"",no:String(bills.length+2)});setStep(0);setShow(false);};
  return <div style={{padding:24}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div><p style={{margin:"0 0 2px",fontWeight:500,fontSize:15}}>Running Account Bills — {project.id}</p><p style={{margin:0,fontSize:12,color:"var(--color-text-tertiary)"}}>{bills.length} bills raised</p></div>
      <button onClick={()=>setShow(!show)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",background:G,color:"white",border:"none",borderRadius:7,fontSize:13,fontWeight:500,cursor:"pointer"}}><Plus size={15}/>{show?"Close":"Generate New RA Bill"}</button>
    </div>
    {show&&<div style={{background:"var(--color-background-primary)",border:`1.5px solid ${G}`,borderRadius:12,padding:"1.25rem",marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><p style={{margin:0,fontWeight:500,fontSize:14}}>RA Bill — RA-{String(bills.length+1).padStart(3,"0")}</p><button onClick={()=>setShow(false)} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--color-text-tertiary)",display:"flex"}}><X size={16}/></button></div>
      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>{steps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div onClick={()=>step>i&&setStep(i)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",borderRadius:20,background:step===i?G:step>i?GL:"var(--color-background-secondary)",border:`0.5px solid ${step===i?G:step>i?G:"var(--color-border-tertiary)"}`,cursor:step>i?"pointer":"default",color:step===i?"white":step>i?G:"var(--color-text-tertiary)",fontSize:12,fontWeight:500}}>{step>i?<Check size={12}/>:<span style={{width:16,height:16,borderRadius:"50%",background:step===i?"white":"var(--color-border-tertiary)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:10,color:step===i?G:"var(--color-text-tertiary)",fontWeight:600}}>{i+1}</span>}{s}</div>{i<3&&<ArrowRight size={14} color="var(--color-border-secondary)"/>}</div>)}</div>
      {step===0&&<div style={{maxWidth:480}}><p style={{fontSize:12,color:"var(--color-text-secondary)",marginBottom:14}}>Enter the billing period.</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><div><label style={{display:"block",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:4}}>From *</label><input type="date" value={per.from} onChange={e=>setPer({...per,from:e.target.value})} style={inp}/></div><div><label style={{display:"block",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",marginBottom:4}}>To *</label><input type="date" value={per.to} onChange={e=>setPer({...per,to:e.target.value})} style={inp}/></div></div><button onClick={()=>per.from&&per.to&&setStep(1)} disabled={!per.from||!per.to} style={{padding:"8px 20px",background:per.from&&per.to?G:"var(--color-background-secondary)",color:per.from&&per.to?"white":"var(--color-text-tertiary)",border:"none",borderRadius:6,fontSize:13,fontWeight:500,cursor:per.from&&per.to?"pointer":"not-allowed"}}>Next →</button></div>}
      {step===1&&<div><table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:14}}><thead><tr style={{background:"var(--color-background-secondary)"}}>{["Code","Description","Unit","WO Qty","This Bill Qty","Rate","Amount"].map(h=><th key={h} style={{padding:"7px 8px",textAlign:"left",fontSize:11,fontWeight:500,color:"var(--color-text-tertiary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>{h}</th>)}</tr></thead><tbody>{BOQ_ITEMS.map((b,i)=>{const q=Number(qtys[b.code])||0;return <tr key={b.code} style={{background:i%2===0?"transparent":"var(--color-background-secondary)",borderBottom:"0.5px solid var(--color-border-tertiary)"}}><td style={{padding:"6px 8px",fontWeight:500,color:G}}>{b.code}</td><td style={{padding:"6px 8px",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.desc}</td><td style={{padding:"6px 8px",color:"var(--color-text-tertiary)"}}>{b.unit}</td><td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace"}}>{b.woQty.toLocaleString("en-IN")}</td><td style={{padding:"6px 8px"}}><input type="number" value={qtys[b.code]||""} onChange={e=>setQtys({...qtys,[b.code]:e.target.value})} placeholder="0" style={{...inp,width:90,textAlign:"right",fontFamily:"monospace"}}/></td><td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace"}}>{fmt(b.rate)}</td><td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace",fontWeight:500,color:q>0?G:"var(--color-text-tertiary)"}}>{q>0?fmtL(q*b.rate):"—"}</td></tr>})}<tr style={{background:GL,borderTop:`1px solid rgba(46,107,46,.2)`}}><td colSpan={6} style={{padding:"8px",fontWeight:500,color:G,textAlign:"right"}}>Gross:</td><td style={{padding:"8px",fontWeight:500,color:G,fontFamily:"monospace",textAlign:"right"}}>{fmtL(gross)}</td></tr></tbody></table><div style={{display:"flex",gap:8}}><button onClick={()=>setStep(0)} style={{padding:"8px 16px",background:"transparent",border:"0.5px solid var(--color-border-secondary)",borderRadius:6,fontSize:13,cursor:"pointer"}}>← Back</button><button onClick={()=>setStep(2)} style={{padding:"8px 20px",background:G,color:"white",border:"none",borderRadius:6,fontSize:13,fontWeight:500,cursor:"pointer"}}>Next →</button></div></div>}
      {step===2&&<div style={{maxWidth:520}}>
        <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"1rem",marginBottom:14}}>{[["Gross Certified",fmt(gross),G,true],["Add IGST 18%",fmt(igst),"#1A1A1A",false],["Gross Invoice",fmt(gross+igst),G,true]].map(([l,v,c,b])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",fontWeight:b?500:400}}><span style={{color:"var(--color-text-secondary)"}}>{l}</span><span style={{fontFamily:"monospace",color:c}}>{v}</span></div>)}</div>
        <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"1rem",marginBottom:14}}><p style={{margin:"0 0 10px",fontSize:11,fontWeight:600,color:"var(--color-text-tertiary)",textTransform:"uppercase",letterSpacing:".05em"}}>Deductions</p>{[["Retention %","ret",ded.ret,true],["Advance Recovery %","adv",ded.adv,true],["TDS %","tds",ded.tds,true],["LD (₹)","ld",ded.ld,false]].map(([l,k,v,isP])=><div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><label style={{fontSize:12,color:"var(--color-text-secondary)"}}>{l}</label><div style={{display:"flex",alignItems:"center",gap:6}}><input type="number" value={v} onChange={e=>setDed({...ded,[k]:Number(e.target.value)})} style={{...inp,width:70,textAlign:"right"}}/>{isP&&<span style={{fontSize:11,color:"var(--color-text-tertiary)"}}>→ {fmt(gross*v/100)}</span>}</div></div>)}</div>
        <div style={{background:GL,border:`1px solid ${G}`,borderRadius:8,padding:".75rem 1rem",marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:500,color:G}}>Net Payable</span><span style={{fontWeight:500,fontSize:16,color:G,fontFamily:"monospace"}}>{fmt(net)}</span></div></div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setStep(1)} style={{padding:"8px 16px",background:"transparent",border:"0.5px solid var(--color-border-secondary)",borderRadius:6,fontSize:13,cursor:"pointer"}}>← Back</button><button onClick={()=>setStep(3)} style={{padding:"8px 20px",background:G,color:"white",border:"none",borderRadius:6,fontSize:13,fontWeight:500,cursor:"pointer"}}>Preview →</button></div>
      </div>}
      {step===3&&<div style={{maxWidth:640}}>
        <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:8,padding:"1.25rem",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",borderBottom:`2px solid ${G}`,paddingBottom:10,marginBottom:14}}><div><p style={{margin:0,fontWeight:500,fontSize:14}}>PROFORMA INVOICE / RA BILL</p><p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>Running Account Bill</p></div><div style={{textAlign:"right"}}><p style={{margin:0,fontSize:12,fontWeight:500,color:G}}>RA-{String(bills.length+1).padStart(3,"0")}</p><p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{today}</p></div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12,fontSize:12}}><div><p style={{margin:"0 0 2px",fontWeight:500}}>From</p><p style={{margin:0,color:"var(--color-text-secondary)"}}>M/s Evergreen Enterprises</p><p style={{margin:0,color:"var(--color-text-tertiary)",fontSize:11}}>GSTIN: {project.gstin}</p></div><div><p style={{margin:"0 0 2px",fontWeight:500}}>To</p><p style={{margin:0,color:"var(--color-text-secondary)"}}>{project.client}</p><p style={{margin:0,color:"var(--color-text-tertiary)",fontSize:11}}>GSTIN: {project.clientGstin}</p></div></div>
          <div style={{background:"var(--color-background-secondary)",borderRadius:6,padding:"6px 10px",marginBottom:12,fontSize:11,display:"flex",gap:20}}><span>WO: <strong>{project.wo}</strong></span><span>Period: <strong>{per.from} to {per.to}</strong></span></div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:10}}><thead><tr style={{background:GD}}>{["Code","Description","Unit","Qty","Rate","Amount"].map(h=><th key={h} style={{padding:"6px 8px",color:"white",textAlign:"left",fontSize:11}}>{h}</th>)}</tr></thead><tbody>{BOQ_ITEMS.filter(b=>(Number(qtys[b.code])||0)>0).map((b,i)=><tr key={b.code} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:i%2===0?"transparent":"var(--color-background-secondary)"}}><td style={{padding:"6px 8px",fontWeight:500,color:G}}>{b.code}</td><td style={{padding:"6px 8px"}}>{b.desc}</td><td style={{padding:"6px 8px",color:"var(--color-text-tertiary)"}}>{b.unit}</td><td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace"}}>{Number(qtys[b.code]).toLocaleString("en-IN")}</td><td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace"}}>{fmt(b.rate)}</td><td style={{padding:"6px 8px",textAlign:"right",fontFamily:"monospace",fontWeight:500}}>{fmt(Number(qtys[b.code])*b.rate)}</td></tr>)}</tbody></table>
          <div style={{display:"flex",justifyContent:"flex-end"}}><table style={{fontSize:12,width:280}}>{[["Gross Bill:",fmt(gross),false],["Add IGST 18%:",fmt(igst),false],["Less Retention:",`(${fmt(ret)})`,false],["Less TDS:",`(${fmt(tds)})`,false],["NET PAYABLE:",fmt(net),true]].map(([l,v,b])=><tr key={l} style={{borderTop:b?`1px solid ${G}`:"none"}}><td style={{padding:"3px 8px",fontWeight:b?500:400,color:b?G:"var(--color-text-secondary)"}}>{l}</td><td style={{padding:"3px 8px",textAlign:"right",fontFamily:"monospace",fontWeight:b?500:400,color:b?G:"var(--color-text-primary)",fontSize:b?14:12}}>{v}</td></tr>)}</table></div>
        </div>
        <div style={{display:"flex",gap:8}}><button onClick={()=>setStep(2)} style={{padding:"8px 16px",background:"transparent",border:"0.5px solid var(--color-border-secondary)",borderRadius:6,fontSize:13,cursor:"pointer"}}>← Back</button><button onClick={submit} style={{flex:1,padding:"9px",background:G,color:"white",border:"none",borderRadius:6,fontSize:13,fontWeight:500,cursor:"pointer"}}>Submit RA Bill RA-{String(bills.length+1).padStart(3,"0")}</button></div>
      </div>}
    </div>}
    <div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:"var(--color-background-secondary)"}}>{["Bill Ref","Period","Date","Gross (₹)","IGST (₹)","Net Payable (₹)","Status","Actions"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:500,fontSize:11,color:"var(--color-text-tertiary)",borderBottom:"0.5px solid var(--color-border-tertiary)",whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead><tbody>{bills.map((b,i)=><tr key={b.no} style={{borderBottom:"0.5px solid var(--color-border-tertiary)",background:i%2===0?"transparent":"var(--color-background-secondary)"}}><td style={{padding:"10px 12px",fontWeight:500,color:G,fontFamily:"monospace"}}>{b.billRef}</td><td style={{padding:"10px 12px",color:"var(--color-text-secondary)",fontSize:12}}>{b.period}</td><td style={{padding:"10px 12px",color:"var(--color-text-secondary)",fontFamily:"monospace",fontSize:12}}>{b.date}</td><td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace"}}>{fmtL(b.grossAmt)}</td><td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",color:"var(--color-text-secondary)"}}>{fmtL(b.igst)}</td><td style={{padding:"10px 12px",textAlign:"right",fontFamily:"monospace",fontWeight:500}}>{fmtL(b.netPayable)}</td><td style={{padding:"10px 12px"}}><StatusBadge status={b.status}/></td><td style={{padding:"10px 12px"}}><div style={{display:"flex",gap:4}}><button style={{padding:"4px 8px",background:GL,border:"none",borderRadius:5,cursor:"pointer",color:G,fontSize:11,display:"flex",alignItems:"center",gap:4}}><Eye size={12}/>View</button><button onClick={()=>exportBill&&exportBill(b)} style={{padding:"4px 8px",background:"var(--color-background-secondary)",border:"none",borderRadius:5,cursor:"pointer",color:"var(--color-text-secondary)",fontSize:11,display:"flex",alignItems:"center",gap:4}}><Printer size={12}/>Export PDF</button></div></td></tr>)}</tbody></table>
    </div>
  </div>;
}

export default function App(){
  const {user,login,logout,isAuthenticated}=useAuth();
  const [page,setPage]=useState("home");
  const [project,setProject]=useState(PROJECTS[0]);
  const [collapsed,setCollapsed]=useState(false);
  const [dprs,setDprs]=useState([]);
  const [bills,setBills]=useState([]);
  const [boqItems,setBoqItems]=useState(BOQ_ITEMS.map(b=>({...b,revisedQty:b.woQty,isRevised:false})));
  const [scBills,setScBills]=useState([]);

  if(!isAuthenticated) return <LoginPage onLogin={login}/>;

  const allowed=NAV_ITEMS[user.role]||[];
  const safe=allowed.includes(page)?page:allowed[0];
  if(safe!==page) setPage(safe);

  return <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"var(--color-background-tertiary)",fontFamily:"var(--font-sans)"}}>
    <Sidebar page={page} setPage={setPage} user={user} project={project} setProject={setProject} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={logout}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <Header page={page} user={user} project={project}/>
      <div style={{flex:1,overflowY:"auto"}}>
        {page==="home"&&<HomePage project={project} bills={bills} dprs={dprs}/>}
        {page==="dpr"&&<DPREntry project={project} dprs={dprs} setDprs={setDprs} exportDPR={(f,t)=>exportDPRReportPDF(dprs,project,f,t)} user={user}/>}
        {page==="bills"&&<RABillPage project={project} bills={bills} setBills={setBills} exportBill={b=>exportRABillPDF(b,project,BOQ_ITEMS)}/>}
        {page==="boq"&&<BOQManager project={project} boqItems={boqItems} setBoqItems={setBoqItems} raBills={bills}/>}
        {page==="subcon"&&<Subcontractors project={project} scBills={scBills} setScBills={setScBills}/>}
        {page==="accounts"&&<AccountsDashboard user={user}/>}
        {page==="purchase"&&<PurchaseModule user={user}/>}
        {page==="inventory"&&<InventoryView user={user}/>}
        {!PAGES_NO_SOON.includes(page)&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,color:"var(--color-text-tertiary)"}}><Layers size={32} style={{marginBottom:8,opacity:.3}}/><p style={{fontSize:14,margin:0}}>Coming soon</p></div>}
      </div>
    </div>
  </div>;
}
