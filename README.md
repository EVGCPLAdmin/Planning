# EG Construction ERP

**Evergreen Enterprises / EVGCPL — Internal Construction Management System**

React + Vite web app connected to Google Sheets via Apps Script proxy.
No API key required. Login uses PIN from UserSecrets sheet.

---

## Modules

| Page | Role access |
|---|---|
| Dashboard | Admin, Engineer, Accounts |
| DPR Entry | Admin, Engineer |
| RA Bills | Admin, Accounts |
| BOQ Manager | Admin, Accounts |
| Sub-contractors | Admin, Accounts |
| Accounts | Admin, Accounts |
| Purchase | Admin, Accounts |
| Inventory | Admin, Accounts |

## Tech stack

React 18 · Vite 5 · Tailwind 3 · Lucide React · Recharts

---

## Local development

```bash
npm install
npm run dev
# → http://localhost:3000
```

Requires `.env.local` (see below — **not committed to git**).

---

## Environment variables

Copy `.env.local.example` → `.env.local` and fill in:

```
VITE_SHEETS_PROXY_URL=https://script.google.com/macros/s/.../exec
VITE_SHEETS_PROXY_SECRET=your-secret-here
VITE_SHEET_ERP=1CPCuzkSPGc3reoX2iTVLZX-hzB0NvmSudXtjoFhP34Q
VITE_SHEET_SECRETS=1hN4VEDNpVLD3lKuBPYCTOaViv7UpveRfud2d2gy15D0
VITE_SHEET_EMPLOYEES=1HWKZPhKRhcuvxBgyyN8zRt8p-SzYmKjJWiOdCgykBHs
VITE_SHEET_ACCOUNTS=1mLddxLRf719EaXE9XSET9gT8l0a8Cxns362yIbHo63g
VITE_SHEET_MASTER=1B2wb38KhNwlLoZnsAGWQkO0FdEGFFfsh3ycRRurigq4
VITE_SHEET_PURCHASE=1zcqF2tjjBETPuW25c9MBMo0zakBIBD6tksg5OstFA7c
VITE_SHEET_STORES=1iMQxgqGilUh2_3NCZl5D-EMt-NC8FwugX83q2fWb8fE
```

**Never commit `.env.local`.** Set these as environment variables in Vercel dashboard for production.

---

## Deployment (Vercel)

See `DEPLOY.md` for full step-by-step instructions.
