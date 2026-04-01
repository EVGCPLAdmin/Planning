/**
 * pdfExport.js — Phase 2e
 * Generates printable RA Bill and DPR Report PDFs using a browser print window.
 * No external dependencies — uses window.print() with a styled hidden iframe.
 * Phase 3: swap to Puppeteer server-side or jsPDF for pixel-perfect output.
 */

const G   = "#2E6B2E";
const GD  = "#1A3F1A";
const GL  = "#EBF5EB";

const fmt     = n => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const fmtL    = n => "₹" + ((n || 0) / 100000).toFixed(2) + " L";
const fmtDate = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const baseStyles = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #1A1A1A; }
  h1 { font-size: 15pt; font-weight: 700; }
  h2 { font-size: 12pt; font-weight: 700; }
  h3 { font-size: 11pt; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  th { background: ${GD}; color: white; padding: 6px 8px; text-align: left; font-weight: 600; font-size: 9pt; }
  td { padding: 5px 8px; border-bottom: 0.5pt solid #DDDDDD; vertical-align: top; }
  tr:nth-child(even) td { background: #F8FAF8; }
  .mono { font-family: 'Courier New', monospace; }
  .right { text-align: right; }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .green { color: ${G}; }
  .section { margin-top: 16px; }
  .divider { border-top: 1.5pt solid ${G}; margin: 10px 0; }
  .thin-divider { border-top: 0.5pt solid #CCCCCC; margin: 8px 0; }
  .label { font-size: 8.5pt; color: #666666; }
  .pill { display: inline-block; padding: 2px 9px; border-radius: 12px; font-size: 8.5pt; font-weight: 600; }
  .pill-green { background: ${GL}; color: ${G}; }
  .pill-amber { background: #FFF8E1; color: #E65100; }
  .pill-blue { background: #E3F2FD; color: #1565C0; }
  .footer { position: fixed; bottom: 12mm; left: 16mm; right: 16mm; font-size: 8pt; color: #888; border-top: 0.5pt solid #CCC; padding-top: 5px; display: flex; justify-content: space-between; }
  .tfoot-row td { background: ${GD} !important; color: white; font-weight: 700; }
  .summary-box { background: ${GL}; border: 1pt solid ${G}; border-radius: 5px; padding: 10px 14px; margin-top: 14px; }
  @media print { .no-print { display: none !important; } }
`;

function openPrintWindow(html) {
  const win = window.open("", "_blank", "width=900,height=1200");
  if (!win) { alert("Pop-up blocked. Please allow pop-ups for this site to export PDFs."); return; }
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>EG Construction ERP</title><style>${baseStyles}</style></head><body>${html}</body></html>`);
  win.document.close();
  setTimeout(() => { win.focus(); win.print(); }, 500);
}

// ── RA BILL PDF ─────────────────────────────────────────────────────────────
export function exportRABillPDF(bill, project, boqItems) {
  // Build line items from bill snapshot or estimate from BOQ
  const lineItems = bill.lineItems || [];

  const statusPill = s => {
    const cls = s === "Paid" ? "pill-green" : s === "Certified" ? "pill-blue" : "pill-amber";
    return `<span class="pill ${cls}">${s}</span>`;
  };

  const deductRows = [
    ["Gross Certified Amount",                                   bill.grossAmt,                    false],
    [`Add: IGST @ ${project.igstPct || 18}%`,                  bill.igst,                        false],
    ["Gross Invoice Value (A)",                                  bill.grossAmt + bill.igst,         true ],
    [`Less: Retention @ ${project.retentionPct || 5}%`,        -(bill.grossAmt * (project.retentionPct || 5) / 100), false],
    ["Less: Advance Recovery",                                   0,                                false],
    [`Less: TDS @ ${project.tdsPct || 2}%`,                    -(bill.grossAmt * (project.tdsPct || 2) / 100),    false],
    ["Net Payable (B)",                                          bill.netPayable,                   true ],
  ];

  const html = `
<div style="border-bottom: 3pt solid ${G}; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
  <div>
    <div style="font-size:8pt;color:#888;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Evergreen Enterprises</div>
    <h1 style="color:${GD}">RUNNING ACCOUNT BILL</h1>
    <div style="font-size:9pt;color:#666;margin-top:2px">Proforma Invoice / Interim Payment Certificate</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:16pt;font-weight:700;color:${G};font-family:Courier New">${bill.billRef}</div>
    <div style="font-size:9pt;color:#666;margin-top:4px">Date: <strong>${bill.date}</strong></div>
    <div style="margin-top:4px">${statusPill(bill.status)}</div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:14px;font-size:9.5pt">
  <div style="border: 0.5pt solid #DDD; border-radius:4px; padding:10px 12px;">
    <div class="label" style="margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Service Provider</div>
    <div class="bold" style="font-size:10.5pt">M/s Evergreen Enterprises</div>
    <div style="color:#555;margin-top:3px">No.10 Sankari Bye Pass Rd, Pallipalayam – 638006</div>
    <div style="color:#888;margin-top:2px;font-size:9pt">GSTIN: ${project.gstin}</div>
    <div style="color:#888;font-size:9pt">PAN: AADFE5468R</div>
  </div>
  <div style="border: 0.5pt solid #DDD; border-radius:4px; padding:10px 12px;">
    <div class="label" style="margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em">Client / Payee</div>
    <div class="bold" style="font-size:10.5pt">${project.client}</div>
    <div style="color:#555;margin-top:3px">${project.location}</div>
    <div style="color:#888;margin-top:2px;font-size:9pt">GSTIN: ${project.clientGstin}</div>
  </div>
</div>

<div style="background:#F8FAF8;border:0.5pt solid #DDD;border-radius:4px;padding:8px 12px;margin-bottom:14px;font-size:9pt;display:flex;gap:24px;flex-wrap:wrap">
  <span>WO No.: <strong>${project.wo}</strong></span>
  <span>Period: <strong>${bill.period}</strong></span>
  <span>Project: <strong>${project.id}</strong></span>
  <span>WO Date: <strong>${project.woDate}</strong></span>
</div>

<div class="section">
  <h2 style="margin-bottom:8px;color:${GD}">Measurement Abstract</h2>
  <table>
    <thead><tr>
      <th style="width:10%">Cost Code</th>
      <th style="width:38%">Description of Work</th>
      <th style="width:7%">Unit</th>
      <th style="width:15%;text-align:right">This Bill Qty</th>
      <th style="width:15%;text-align:right">Rate (₹)</th>
      <th style="width:15%;text-align:right">Amount (₹)</th>
    </tr></thead>
    <tbody>
      ${lineItems.length > 0
        ? lineItems.map((li, i) => `
          <tr>
            <td class="mono green bold">${li.code}</td>
            <td>${li.desc}</td>
            <td>${li.unit}</td>
            <td class="right mono">${(li.qty || 0).toLocaleString("en-IN")}</td>
            <td class="right mono">${fmt(li.rate)}</td>
            <td class="right mono bold">${fmt((li.qty || 0) * (li.rate || 0))}</td>
          </tr>`).join("")
        : boqItems.map((b, i) => `
          <tr style="opacity:0.7">
            <td class="mono green">${b.code}</td>
            <td>${b.desc}</td>
            <td>${b.unit}</td>
            <td class="right mono" style="color:#bbb">—</td>
            <td class="right mono">${fmt(b.rate)}</td>
            <td class="right mono" style="color:#bbb">—</td>
          </tr>`).join("")
      }
    </tbody>
    <tfoot>
      <tr class="tfoot-row">
        <td colspan="5" class="right bold" style="color:white">Gross Certified Amount:</td>
        <td class="right mono bold" style="color:white">${fmt(bill.grossAmt)}</td>
      </tr>
    </tfoot>
  </table>
</div>

<div class="section" style="display:flex;justify-content:flex-end">
  <div style="width:320px">
    <h3 style="margin-bottom:8px;color:${GD}">Bill Summary</h3>
    <table>
      <tbody>
        ${deductRows.map(([l, v, strong]) => `
          <tr style="${strong ? `border-top:1.5pt solid ${G};` : ""}">
            <td style="${strong ? `font-weight:700;color:${G}` : "color:#555"}">${l}</td>
            <td class="right mono ${strong ? `bold green` : ""}" style="${v < 0 ? "color:#C62828" : ""}">${v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div>
</div>

<div class="summary-box" style="margin-top:16px">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:11pt;font-weight:700;color:${G}">Net Amount Payable This Bill</span>
    <span style="font-size:16pt;font-weight:700;font-family:Courier New;color:${G}">${fmt(bill.netPayable)}</span>
  </div>
  <div style="font-size:8.5pt;color:#666;margin-top:5px">Amount in words: [Please fill in] only</div>
</div>

<div style="margin-top:28px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;font-size:9pt">
  <div style="text-align:center;border-top:0.5pt solid #CCC;padding-top:6px">
    <div style="color:#666">Prepared By</div>
    <div class="bold" style="margin-top:2px">Accounts / QS</div>
  </div>
  <div style="text-align:center;border-top:0.5pt solid #CCC;padding-top:6px">
    <div style="color:#666">Authorised By</div>
    <div class="bold" style="margin-top:2px">Project Manager</div>
  </div>
  <div style="text-align:center;border-top:0.5pt solid #CCC;padding-top:6px">
    <div style="color:#666">Certified By (L&T PMC)</div>
    <div class="bold" style="margin-top:2px">___________________</div>
  </div>
</div>

<div class="footer">
  <span>EG Construction ERP · ${bill.billRef} · Generated: ${fmtDate()}</span>
  <span>Evergreen Enterprises · GSTIN: ${project.gstin} · Confidential</span>
</div>
`;
  openPrintWindow(html);
}

// ── DPR REPORT PDF ──────────────────────────────────────────────────────────
export function exportDPRReportPDF(dprs, project, dateFrom, dateTo) {
  const filtered = dateFrom && dateTo
    ? dprs.filter(d => d.date >= dateFrom && d.date <= dateTo)
    : dprs;

  // Group by BOQ code for summary
  const summary = {};
  filtered.forEach(d => {
    if (!summary[d.boqCode]) summary[d.boqCode] = { desc: d.boqDesc, unit: d.unit, qty: 0, entries: 0 };
    summary[d.boqCode].qty += Number(d.qty) || 0;
    summary[d.boqCode].entries++;
  });

  const html = `
<div style="border-bottom: 3pt solid ${G}; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
  <div>
    <div style="font-size:8pt;color:#888;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Evergreen Enterprises</div>
    <h1 style="color:${GD}">DAILY PROGRESS REPORT</h1>
    <div style="font-size:9pt;color:#666;margin-top:2px">Site Progress Log — ${project.fullName}</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:9pt;color:#666">Project: <strong>${project.id}</strong></div>
    <div style="font-size:9pt;color:#666;margin-top:3px">Period: <strong>${dateFrom || "All dates"} to ${dateTo || "present"}</strong></div>
    <div style="font-size:9pt;color:#666;margin-top:3px">Generated: <strong>${fmtDate()}</strong></div>
    <div style="font-size:9pt;color:#666;margin-top:3px">Total Entries: <strong>${filtered.length}</strong></div>
  </div>
</div>

<div style="background:#F8FAF8;border:0.5pt solid #DDD;border-radius:4px;padding:8px 12px;margin-bottom:14px;font-size:9pt;display:flex;gap:24px">
  <span>Client: <strong>${project.client.replace("M/s ", "")}</strong></span>
  <span>WO: <strong>${project.wo}</strong></span>
  <span>Site: <strong>${project.location.split(",")[0]}</strong></span>
</div>

<div class="section" style="margin-bottom:14px">
  <h2 style="margin-bottom:8px;color:${GD}">Work Summary by BOQ Item</h2>
  <table>
    <thead><tr>
      <th style="width:12%">BOQ Code</th>
      <th style="width:42%">Description</th>
      <th style="width:8%">Unit</th>
      <th style="width:15%;text-align:right">Total Qty</th>
      <th style="width:12%;text-align:right">Entries</th>
    </tr></thead>
    <tbody>
      ${Object.entries(summary).map(([code, s], i) => `
        <tr>
          <td class="mono green bold">${code}</td>
          <td>${s.desc}</td>
          <td>${s.unit}</td>
          <td class="right mono bold">${s.qty.toLocaleString("en-IN")}</td>
          <td class="right">${s.entries}</td>
        </tr>`).join("")}
    </tbody>
    <tfoot>
      <tr class="tfoot-row">
        <td colspan="4" class="bold" style="color:white">Total DPR Entries in Period</td>
        <td class="right bold" style="color:white">${filtered.length}</td>
      </tr>
    </tfoot>
  </table>
</div>

<div class="section">
  <h2 style="margin-bottom:8px;color:${GD}">Detailed Progress Log</h2>
  <table>
    <thead><tr>
      <th style="width:9%">Date</th>
      <th style="width:9%">BOQ Code</th>
      <th style="width:18%">Location / Hole ID</th>
      <th style="width:8%;text-align:right">Qty</th>
      <th style="width:6%">Unit</th>
      <th style="width:18%">Sub-contractor</th>
      <th style="width:6%;text-align:right">Labour</th>
      <th style="width:15%">Entered By</th>
      <th style="width:11%">Hindrances</th>
    </tr></thead>
    <tbody>
      ${filtered.map((d, i) => `
        <tr>
          <td class="mono" style="font-size:8.5pt">${d.date}</td>
          <td class="mono green bold">${d.boqCode}</td>
          <td class="mono" style="font-size:8.5pt">${d.location}</td>
          <td class="right mono">${Number(d.qty).toLocaleString("en-IN")}</td>
          <td style="color:#666">${d.unit}</td>
          <td style="font-size:8.5pt">${d.subcon || "—"}</td>
          <td class="right" style="font-size:8.5pt">${d.labour || "—"}</td>
          <td style="font-size:8.5pt">${d.enteredBy || "—"}</td>
          <td style="font-size:8pt;color:${d.hindrances && d.hindrances !== "None" ? "#C62828" : "#888"}">${d.hindrances || "—"}</td>
        </tr>`).join("")}
      ${filtered.length === 0 ? `<tr><td colspan="9" class="center" style="padding:20px;color:#bbb">No DPR entries in selected period</td></tr>` : ""}
    </tbody>
  </table>
</div>

<div style="margin-top:28px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;font-size:9pt">
  <div style="text-align:center;border-top:0.5pt solid #CCC;padding-top:6px">
    <div style="color:#666">Prepared By</div>
    <div class="bold">Site Engineer</div>
  </div>
  <div style="text-align:center;border-top:0.5pt solid #CCC;padding-top:6px">
    <div style="color:#666">Reviewed By</div>
    <div class="bold">Project Manager</div>
  </div>
  <div style="text-align:center;border-top:0.5pt solid #CCC;padding-top:6px">
    <div style="color:#666">Certified By (L&T)</div>
    <div class="bold">___________________</div>
  </div>
</div>

<div class="footer">
  <span>EG Construction ERP · DPR Report · ${project.id} · Generated: ${fmtDate()}</span>
  <span>Evergreen Enterprises · Confidential · ${filtered.length} entries</span>
</div>
`;
  openPrintWindow(html);
}

// ── SC BILL PDF ─────────────────────────────────────────────────────────────
export function exportSCBillPDF(scBill, sc, project) {
  const html = `
<div style="border-bottom: 3pt solid ${G}; padding-bottom: 10px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start;">
  <div>
    <div style="font-size:8pt;color:#888;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px">Evergreen Enterprises</div>
    <h1 style="color:${GD}">SUB-CONTRACTOR PAYMENT CERTIFICATE</h1>
    <div style="font-size:9pt;color:#666">Bill Reference: <strong>${scBill.billRef}</strong></div>
  </div>
  <div style="text-align:right">
    <div style="font-size:9pt;color:#666">Date: <strong>${scBill.date}</strong></div>
    <div style="font-size:9pt;color:#666;margin-top:2px">Project: <strong>${project.id}</strong></div>
    <div style="margin-top:4px"><span class="pill ${scBill.status === "Paid" ? "pill-green" : "pill-amber"}">${scBill.status}</span></div>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px;font-size:9.5pt">
  <div style="border:0.5pt solid #DDD;border-radius:4px;padding:10px 12px">
    <div class="label" style="margin-bottom:4px;text-transform:uppercase">Payee (Sub-contractor)</div>
    <div class="bold" style="font-size:10.5pt">${sc.name}</div>
    <div style="color:#555;margin-top:3px">${sc.scope}</div>
    <div style="color:#888;margin-top:2px;font-size:9pt">Contact: ${sc.contact} · ${sc.phone}</div>
    ${sc.gstNo ? `<div style="color:#888;font-size:9pt">GSTIN: ${sc.gstNo}</div>` : ""}
  </div>
  <div style="border:0.5pt solid #DDD;border-radius:4px;padding:10px 12px">
    <div class="label" style="margin-bottom:4px;text-transform:uppercase">Main Contractor</div>
    <div class="bold" style="font-size:10.5pt">M/s Evergreen Enterprises</div>
    <div style="color:#555;margin-top:3px">No.10 Sankari Bye Pass Rd, Pallipalayam – 638006</div>
    <div style="color:#888;margin-top:2px;font-size:9pt">GSTIN: ${project.gstin}</div>
    <div style="color:#888;font-size:9pt">Project: ${project.fullName}</div>
  </div>
</div>

<div class="section">
  <table>
    <thead><tr>
      <th>Description</th>
      <th style="text-align:right;width:12%">Qty</th>
      <th style="width:8%">Unit</th>
      <th style="text-align:right;width:14%">Rate (₹)</th>
      <th style="text-align:right;width:14%">Amount (₹)</th>
    </tr></thead>
    <tbody>
      <tr>
        <td>${sc.scope}<br><span class="label">Period: ${scBill.period}</span></td>
        <td class="right mono bold">${scBill.qty.toLocaleString("en-IN")}</td>
        <td>${scBill.unit}</td>
        <td class="right mono">${fmt(scBill.rate)}</td>
        <td class="right mono bold">${fmt(scBill.grossAmt)}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="tfoot-row">
        <td colspan="4" class="right bold" style="color:white">Gross Amount</td>
        <td class="right mono bold" style="color:white">${fmt(scBill.grossAmt)}</td>
      </tr>
    </tfoot>
  </table>
</div>

<div class="section" style="display:flex;justify-content:flex-end">
  <div style="width:280px">
    <table>
      <tbody>
        ${[
          ["Gross Amount", scBill.grossAmt, false],
          ["Add: GST @ 18%", scBill.gstAmt, false],
          ["Gross Invoice (A)", scBill.netPayable, true],
          ["Less: Retention @ 5%", -scBill.retention, false],
          ["Net Payable After Retention", scBill.netAfterRet, true],
        ].map(([l, v, s]) => `
          <tr style="${s ? `border-top:1.5pt solid ${G}` : ""}">
            <td style="${s ? `font-weight:700;color:${G}` : "color:#555"}">${l}</td>
            <td class="right mono ${s ? "bold green" : ""}" style="${v < 0 ? "color:#C62828" : ""}">${v < 0 ? `(${fmt(Math.abs(v))})` : fmt(v)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  </div>
</div>

${scBill.status === "Paid" ? `
<div class="summary-box" style="margin-top:14px">
  <div style="display:flex;justify-content:space-between">
    <span class="bold green">Payment Confirmed</span>
    <span class="bold mono green">${fmt(scBill.paidAmt)}</span>
  </div>
  <div class="label" style="margin-top:4px">Paid on: ${scBill.paidDate}</div>
</div>` : `
<div style="margin-top:14px;border:1pt solid #FFE082;background:#FFF8E1;border-radius:4px;padding:9px 12px;font-size:9pt;color:#795548">
  <strong>Payment Pending:</strong> This certificate is awaiting payment. Kindly process within agreed credit terms.
</div>`}

<div style="margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:9pt">
  <div style="text-align:center;border-top:0.5pt solid #CCC;padding-top:6px">
    <div style="color:#666">Accounts / QS</div>
    <div class="bold">Evergreen Enterprises</div>
  </div>
  <div style="text-align:center;border-top:0.5pt solid #CCC;padding-top:6px">
    <div style="color:#666">Authorised Signatory</div>
    <div class="bold">Project Manager</div>
  </div>
</div>

<div class="footer">
  <span>EG Construction ERP · SC Bill ${scBill.billRef} · Generated: ${fmtDate()}</span>
  <span>Evergreen Enterprises · Confidential</span>
</div>
`;
  openPrintWindow(html);
}
