import { useState, useEffect } from "react";
import {
  LayoutDashboard, ClipboardList, FileText, Users, HardHat,
  ChevronLeft, ChevronRight, ChevronDown, Building2,
  Plus, Search, Bell, Check, X, AlertTriangle,
  TrendingUp, Eye, ArrowRight, Layers, Settings,
  CheckCircle2, Printer, LogOut, ShieldCheck,
  IndianRupee, Package, Boxes
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PROJECTS, BOQ_ITEMS, MONTHLY_DATA, PROJECT_SITE_MAP, SUBCONTRACTORS, MOCK_BILLS } from "./data/mockData";
import LoginPage, { useAuth } from "./pages/Login.jsx";
import BOQManager from "./pages/BOQManager.jsx";
import DPREntry from "./pages/DPREntry.jsx";
import RABills from "./pages/RABills.jsx";
import Subcontractors from "./pages/Subcontractors.jsx";
import AccountsDashboard from "./pages/AccountsDashboard.jsx";
import PurchaseModule from "./pages/PurchaseModule.jsx";
import InventoryView from "./pages/InventoryView.jsx";
import ProjectSetup from "./pages/ProjectSetup.jsx";
import { exportRABillPDF, exportDPRReportPDF } from "./utils/pdfExport.js";

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
const PAGES_NO_SOON=["home","dpr","bills","boq","subcon","accounts","purchase","inventory","settings"];
const ALL_PAGES=[
  {id:"home",    label:"Dashboard",      Icon:LayoutDashboard, roles:["admin","engineer","accounts"]},
  {id:"dpr",     label:"DPR Entry",      Icon:ClipboardList,   roles:["admin","engineer"]},
  {id:"bills",   label:"RA Bills",       Icon:FileText,        roles:["admin","accounts"]},
  {id:"boq",     label:"BOQ Manager",    Icon:Layers,          roles:["admin","accounts"]},
  {id:"subcon",  label:"Sub-contractors",Icon:Users,           roles:["admin","accounts"]},
  {id:"accounts",label:"Accounts",       Icon:IndianRupee,     roles:["admin","accounts"]},
  {id:"purchase",label:"Purchase",       Icon:Package,         roles:["admin","accounts"]},
  {id:"inventory",label:"Inventory",     Icon:Boxes,           roles:["admin","accounts"]},
  {id:"settings",label:"Project Setup",  Icon:Settings,        roles:["admin"]},
];

const StatusBadge=({status})=>{const m={Paid:{bg:"#EBF5EB",color:G,dot:G},Certified:{bg:"#E3F2FD",color:"#1565C0",dot:"#1565C0"},Submitted:{bg:"#FFF8E1",color:"#F57F17",dot:"#F57F17"}};const s=m[status]||{bg:"#F5F5F5",color:"#666",dot:"#666"};return <span style={{background:s.bg,color:s.color,padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:500,display:"inline-flex",alignItems:"center",gap:5}}><span style={{width:6,height:6,borderRadius:"50%",background:s.dot}}/>{status}</span>};

const KPICard=({label,value,sub,accent=G})=>(<div style={{background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",borderRadius:12,padding:"1rem 1.25rem",borderLeft:`3px solid ${accent}`}}><p style={{margin:"0 0 8px",fontSize:11,fontWeight:500,color:"var(--color-text-secondary)",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</p><p style={{margin:"0 0 4px",fontSize:22,fontWeight:500,color:"var(--color-text-primary)",fontFamily:"monospace"}}>{value}</p>{sub&&<p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{sub}</p>}</div>);

const EGLogo=({c})=>(<div style={{display:"flex",alignItems:"center",gap:c?0:10}}><svg width="38" height="34" viewBox="0 0 38 34" fill="none"><rect width="18" height="34" rx="3" fill="#1A1A1A"/><rect x="18" width="20" height="34" rx="3" fill={G}/><text x="3" y="26" fill="white" fontSize="20" fontWeight="700" fontFamily="sans-serif">E</text><text x="20" y="26" fill="white" fontSize="20" fontWeight="700" fontFamily="sans-serif">G</text><ellipse cx="29" cy="8" rx="8" ry="4" fill="#1A1A1A" opacity=".7"/><rect x="23" y="10" width="12" height="2" rx="1" fill="#1A1A1A" opacity=".5"/></svg>{!c&&<div><p style={{margin:0,color:"white",fontWeight:600,fontSize:13}}>Evergreen</p><p style={{margin:0,color:"rgba(255,255,255,.5)",fontSize:11}}>Enterprises</p></div>}</div>);

function Sidebar({page,setPage,user,project,setProject,projects,collapsed,setCollapsed,onLogout}){
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
        {projects.filter(p=>user.projects.includes(p.id)).map(p=><button key={p.id} onClick={()=>{setProject(p);setPick(false)}} style={{width:"100%",background:project.id===p.id?GL:"transparent",border:"none",padding:"10px 12px",cursor:"pointer",textAlign:"left",borderBottom:"0.5px solid rgba(0,0,0,.06)"}}><p style={{margin:0,fontSize:12,fontWeight:500,color:project.id===p.id?G:"#1A1A1A"}}>{p.id}</p><p style={{margin:0,fontSize:11,color:"#888"}}>{p.siteName||p.name}</p></button>)}
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
  const t={home:"Dashboard",dpr:"DPR Entry",bills:"RA Bills",boq:"BOQ Manager",subcon:"Sub-contractors",accounts:"Accounts",purchase:"Purchase",inventory:"Inventory",settings:"Project Setup"};
  return <div style={{height:54,background:"var(--color-background-primary)",borderBottom:"0.5px solid var(--color-border-tertiary)",display:"flex",alignItems:"center",padding:"0 20px",gap:12,flexShrink:0}}>
    <div style={{flex:1}}><p style={{margin:0,fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{t[page]||page}</p><p style={{margin:0,fontSize:11,color:"var(--color-text-tertiary)"}}>{project.name}{project.siteName ? ` · ${project.siteName}` : ""}</p></div>
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:6,border:"0.5px solid var(--color-border-secondary)",background:"var(--color-background-secondary)"}}><ShieldCheck size={13} color={user.color}/><span style={{fontSize:12,fontWeight:500,color:user.color}}>{user.roleLabel}</span></div>
    <div style={{width:1,height:20,background:"var(--color-border-tertiary)"}}/>
    <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:30,height:30,borderRadius:"50%",background:`${user.color}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:user.color}}>{user.initials}</div><div><p style={{margin:0,fontSize:12,fontWeight:500,color:"var(--color-text-primary)"}}>{user.name}</p><p style={{margin:0,fontSize:10,color:"var(--color-text-tertiary)"}}>{user.email}</p></div></div>
  </div>;
}

function HomePage({project,bills,dprs}){
  const tb=bills.reduce((s,b)=>s+b.grossAmt,0);
  const tc=bills.filter(b=>b.status!=="Submitted").reduce((s,b)=>s+b.certifiedAmt,0);
  const bal=project.contractAmt-tb;
  const pct=Math.round((tb/project.contractAmt)*100);
  return <div style={{padding:24}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
      <KPICard label="Contract Value" value={fmtCr(project.contractAmt)} sub={`WO: ${project.workOrder?.slice(-10)||""}`} accent={G}/>
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

export default function App(){
  const {user,login,logout,isAuthenticated}=useAuth();
  const [page,setPage]=useState("home");
  const [project,setProject]=useState(PROJECTS[0]);
  const [projects,setProjects]=useState(PROJECTS);
  const [collapsed,setCollapsed]=useState(false);
  // dprs: new entries added by the site team via DPR Entry page
  // bills: seeded with real historical RA Bills; new bills appended on submit
  const [dprs,setDprs]=useState([]);
  const [bills,setBills]=useState(MOCK_BILLS);
  const [boqItems,setBoqItems]=useState(BOQ_ITEMS.map(b=>({...b,revisedQty:b.woQty,isRevised:false})));
  const [scBills,setScBills]=useState([]);

  // When project switches — reset all project-specific state
  useEffect(()=>{
    setDprs([]);
    setBills(MOCK_BILLS.filter(b=>b.billRef?.includes(project.id)||true)); // in future filter by project
    setBoqItems(BOQ_ITEMS.map(b=>({...b,revisedQty:b.woQty,isRevised:false})));
    setScBills([]);
  },[project.id]);

  if(!isAuthenticated) return <LoginPage onLogin={login}/>;

  const allowed=NAV_ITEMS[user.role]||[];
  const safe=allowed.includes(page)?page:allowed[0];
  if(safe!==page) setPage(safe);

  return <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"var(--color-background-tertiary)",fontFamily:"var(--font-sans)"}}>
    <Sidebar page={page} setPage={setPage} user={user} project={project} setProject={setProject} projects={projects} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={logout}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <Header page={page} user={user} project={project}/>
      <div style={{flex:1,overflowY:"auto"}}>
        {page==="home"&&<HomePage project={project} bills={bills} dprs={dprs}/>}
        {page==="dpr"&&<DPREntry project={project} dprs={dprs} setDprs={setDprs} exportDPR={(f,t)=>exportDPRReportPDF(dprs,project,f,t)} user={user}/>}
        {page==="bills"&&<RABills project={project} bills={bills} setBills={setBills} dprs={dprs} exportBill={b=>exportRABillPDF(b,project,BOQ_ITEMS)}/>}
        {page==="boq"&&<BOQManager project={project} boqItems={boqItems} setBoqItems={setBoqItems} raBills={bills}/>}
        {page==="subcon"&&<Subcontractors project={project} scBills={scBills} setScBills={setScBills}/>}
        {page==="accounts"&&<AccountsDashboard project={project} user={user}/>}
        {page==="purchase"&&<PurchaseModule project={project} user={user}/>}
        {page==="inventory"&&<InventoryView project={project} user={user}/>}
        {page==="settings"&&<ProjectSetup projects={projects} setProjects={p=>{setProjects(p);}} onProjectSelect={p=>{setProject(p);setPage("home");}}/>}
        {!PAGES_NO_SOON.includes(page)&&<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:300,color:"var(--color-text-tertiary)"}}><Layers size={32} style={{marginBottom:8,opacity:.3}}/><p style={{fontSize:14,margin:0}}>Coming soon</p></div>}
      </div>
    </div>
  </div>;
}
