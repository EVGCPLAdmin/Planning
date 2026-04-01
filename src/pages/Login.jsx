import { useState } from "react";
import { Eye, EyeOff, AlertCircle, HardHat, Lock, Mail, Wifi } from "lucide-react";

const G = "#2E6B2E", GD = "#1A3F1A", GL = "#EBF5EB";

const PROXY_URL = import.meta.env.VITE_SHEETS_PROXY_URL;

async function loginViaProxy(email, pin) {
  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({
      action: "authenticate",
      ids: {
        SECRETS:   import.meta.env.VITE_SHEET_SECRETS   || "",
        EMPLOYEES: import.meta.env.VITE_SHEET_EMPLOYEES || "",
      },
      data: { email: email.trim().toLowerCase(), pin: pin.trim() },
    }),
  });
  if (!res.ok) throw new Error(`Cannot reach proxy (HTTP ${res.status})`);
  return res.json();
}

export function useAuth() {
  const [user, setUser] = useState(null);

  async function login(email, pin) {
    const result = await loginViaProxy(email, pin);
    if (result.ok) { setUser(result.user); return { ok: true }; }
    return { ok: false, error: result.error };
  }

  function logout() { setUser(null); }
  return { user, login, logout, isAuthenticated: !!user };
}

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [pin, setPin]           = useState("");
  const [showPin, setShowPin]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  if (!PROXY_URL) {
    return (
      <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${GD} 0%,${G} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ background:"white", borderRadius:16, padding:32, maxWidth:420, width:"100%", textAlign:"center" }}>
          <AlertCircle size={36} color="#C62828" style={{ margin:"0 auto 16px" }}/>
          <h2 style={{ margin:"0 0 8px", fontSize:18, color:"#C62828" }}>Proxy not configured</h2>
          <p style={{ margin:"0 0 16px", fontSize:14, color:"#555" }}>
            Create <code style={{ background:"#F5F5F5", padding:"2px 6px", borderRadius:4 }}>.env.local</code> in the project root with:
          </p>
          <pre style={{ background:"#F5F5F5", borderRadius:8, padding:16, fontSize:12, textAlign:"left", margin:0 }}>
{`VITE_SHEETS_PROXY_URL=https://script.google.com/...
VITE_SHEETS_PROXY_SECRET=your-secret-here`}
          </pre>
          <p style={{ margin:"12px 0 0", fontSize:12, color:"#888" }}>Then restart: npm run dev</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Enter your work email"); return; }
    if (!pin.trim())   { setError("Enter your PIN"); return; }
    setLoading(true); setError("");
    try {
      const result = await onLogin(email.trim(), pin.trim());
      if (!result.ok) setError(result.error || "Login failed");
    } catch(err) {
      setError(err.message || "Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const inp = {
    width:"100%", padding:"11px 14px", border:"0.5px solid #CCC",
    borderRadius:8, fontSize:14, fontFamily:"inherit",
    background:"white", boxSizing:"border-box", outline:"none",
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${GD} 0%,${G} 60%,#4A8F4A 100%)`, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:420 }}>

        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:64, height:64, borderRadius:16, background:"rgba(255,255,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
            <HardHat size={32} color="white"/>
          </div>
          <h1 style={{ color:"white", fontSize:24, fontWeight:600, margin:"0 0 4px" }}>EG Construction ERP</h1>
          <p style={{ color:"rgba(255,255,255,.65)", fontSize:13, margin:0 }}>Evergreen Enterprises · Evergreen Construction Pvt Ltd</p>
        </div>

        {/* Card */}
        <div style={{ background:"white", borderRadius:16, padding:32, boxShadow:"0 20px 60px rgba(0,0,0,.25)" }}>

          {/* Live badge */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:20, padding:"6px 10px", background:GL, borderRadius:6, border:"0.5px solid #C6E3C6" }}>
            <Wifi size={13} color={G}/>
            <span style={{ fontSize:12, color:GD, fontWeight:500 }}>Live — UserSecrets PIN auth</span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#555", marginBottom:6 }}>Work Email</label>
              <div style={{ position:"relative" }}>
                <Mail size={15} color="#AAA" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
                <input type="email" value={email}
                  onChange={e=>{ setEmail(e.target.value); setError(""); }}
                  placeholder="you@evgcpl.com"
                  style={{ ...inp, paddingLeft:38 }} autoFocus/>
              </div>
            </div>

            {/* PIN */}
            <div style={{ marginBottom:20 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#555", marginBottom:6 }}>PIN</label>
              <div style={{ position:"relative" }}>
                <Lock size={15} color="#AAA" style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}/>
                <input type={showPin?"text":"password"} value={pin}
                  onChange={e=>{ setPin(e.target.value); setError(""); }}
                  placeholder="Your PIN"
                  inputMode="numeric"
                  style={{ ...inp, paddingLeft:38, paddingRight:42 }}/>
                <button type="button" onClick={()=>setShowPin(s=>!s)}
                  style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#AAA", display:"flex" }}>
                  {showPin ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <p style={{ margin:"5px 0 0", fontSize:11, color:"#999" }}>
                Your PIN from the UserSecrets sheet. Contact admin if you forgot it.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:"flex", alignItems:"flex-start", gap:8, background:"#FEECEC", border:"0.5px solid #FFCDD2", borderRadius:7, padding:"9px 12px", marginBottom:16 }}>
                <AlertCircle size={15} color="#C62828" style={{ flexShrink:0, marginTop:1 }}/>
                <span style={{ fontSize:13, color:"#C62828" }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"12px 0", background:loading?"#AAA":GD, color:"white", border:"none", borderRadius:8, fontSize:14, fontWeight:600, cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, transition:"background .15s" }}>
              {loading
                ? <><span style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"white", borderRadius:"50%", animation:"spin .7s linear infinite" }}/> Verifying…</>
                : "Sign In"}
            </button>
          </form>
        </div>

        <p style={{ textAlign:"center", color:"rgba(255,255,255,.4)", fontSize:11, marginTop:20 }}>
          EG Construction ERP v2.0 · Evergreen Enterprises · Confidential
        </p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
