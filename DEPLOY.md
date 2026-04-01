=================================================================
EG CONSTRUCTION ERP — COMPLETE HOSTING GUIDE
GitHub username : EVGCPLAdmin
Repository name : Planning
Your live URL   : https://EVGCPLAdmin.github.io/Planning/
=================================================================

Read everything once before starting.
Each step builds on the previous one. Do not skip any step.


=================================================================
PART 1 — ONE-TIME SETUP
=================================================================

STEP 1 — Tell Git who you are
-------------------------------
This is why your last attempt failed.
Git needs your name and email before it will commit anything.

Open PowerShell (press Windows key, type powershell, press Enter).
Run these two commands:

    git config --global user.email "admin@evgcpl.com"
    git config --global user.name "EVGCPL Admin"

Press Enter after each line.
No output means it worked.

Verify:
    git config --global user.email

Should print: admin@evgcpl.com


STEP 2 — Get a GitHub Personal Access Token
---------------------------------------------
GitHub no longer accepts your password in Terminal.
You need a token. Create it once, save it somewhere safe.

1.  Go to https://github.com and sign in as EVGCPLAdmin
2.  Click your profile picture (top-right corner)
3.  Click Settings
4.  Scroll to the very bottom of the left sidebar
5.  Click Developer settings
6.  Click Personal access tokens
7.  Click Tokens (classic)
8.  Click Generate new token
9.  Click Generate new token (classic)
10. In the Note field type:  EG ERP
11. Expiration: select No expiration
12. Under Select scopes — tick the checkbox next to repo
    (4 sub-items get ticked automatically — that is correct)
13. Scroll down and click Generate token (green button)
14. A code appears starting with ghp_
    COPY IT NOW — open Notepad and paste it there
    You will NEVER see this code again after leaving the page

Your token looks like this:
    ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456


STEP 3 — Set the 9 secrets in your GitHub repo
------------------------------------------------
These are your private values (proxy URL, sheet IDs).
GitHub stores them securely and uses them when building the app.

1. Go to https://github.com/EVGCPLAdmin/Planning
2. Click the Settings tab (top of the page)
3. In the left sidebar click Secrets and variables
4. Click Actions
5. Click New repository secret (green button)

You will add 9 secrets total.
For each one:
   - Click "New repository secret"
   - Type the Name exactly as shown
   - Paste the Value exactly as shown
   - Click Add secret

Here are all 9:

SECRET 1
  Name:  VITE_SHEETS_PROXY_URL
  Value: https://script.google.com/macros/s/AKfycbzP1QgiGBBnjnVQQqYZRLhil06cR9jJ2DEfSHa06xtGRPp8pC_VXevUvSDZyjsXIrW-/exec

SECRET 2
  Name:  VITE_SHEETS_PROXY_SECRET
  Value: (read the note below before filling this one)

SECRET 3
  Name:  VITE_SHEET_ERP
  Value: 1CPCuzkSPGc3reoX2iTVLZX-hzB0NvmSudXtjoFhP34Q

SECRET 4
  Name:  VITE_SHEET_SECRETS
  Value: 1hN4VEDNpVLD3lKuBPYCTOaViv7UpveRfud2d2gy15D0

SECRET 5
  Name:  VITE_SHEET_EMPLOYEES
  Value: 1HWKZPhKRhcuvxBgyyN8zRt8p-SzYmKjJWiOdCgykBHs

SECRET 6
  Name:  VITE_SHEET_ACCOUNTS
  Value: 1mLddxLRf719EaXE9XSET9gT8l0a8Cxns362yIbHo63g

SECRET 7
  Name:  VITE_SHEET_MASTER
  Value: 1B2wb38KhNwlLoZnsAGWQkO0FdEGFFfsh3ycRRurigq4

SECRET 8
  Name:  VITE_SHEET_PURCHASE
  Value: 1zcqF2tjjBETPuW25c9MBMo0zakBIBD6tksg5OstFA7c

SECRET 9
  Name:  VITE_SHEET_STORES
  Value: 1iMQxgqGilUh2_3NCZl5D-EMt-NC8FwugX83q2fWb8fE


NOTE FOR SECRET 2 (VITE_SHEETS_PROXY_SECRET):
  1. Go to https://script.google.com
  2. Open your sheetsProxy.gs project
  3. Find line 32. It says:
       var PROXY_SECRET = "CHANGE_ME_TO_RANDOM_32_CHAR_STRING";
  4. If it still says CHANGE_ME... change it to something like:
       var PROXY_SECRET = "EG-ERP-EVGCPL-2025";
  5. Click the floppy disk icon (Save)
  6. Click Deploy → Manage Deployments
  7. Click the pencil (Edit) icon
  8. Change version to: New version
  9. Click Deploy
  10. Use that same value (e.g. EG-ERP-EVGCPL-2025) as SECRET 2

After adding all 9 you will see them listed as locked padlocks.
That is correct — they are now safely stored.


=================================================================
PART 2 — PUSH YOUR CODE TO GITHUB
=================================================================

STEP 4 — Clean up the failed attempt
--------------------------------------
Your last push broke partway through.
We delete the broken git tracking and start fresh.
Your code files are NOT deleted — only the git history.

1. Open File Explorer
2. Go to: C:\Users\1234\Downloads\EG_ERP_GitHubPages\GIT_PAGES
3. In File Explorer click View (top menu) → tick Hidden items
4. You will now see a folder named .git (it starts with a dot)
5. Right-click the .git folder → Delete
6. Confirm deletion
7. Untick Hidden items again if you want (optional)

Your code files (src, package.json etc.) are all still there.
Only the failed git tracking was removed.


STEP 5 — Open PowerShell inside the folder
--------------------------------------------
1. Open File Explorer
2. Navigate to: C:\Users\1234\Downloads\EG_ERP_GitHubPages\GIT_PAGES
3. Click on the address bar at the top of File Explorer
   (it shows the folder path like C:\Users\...)
4. Delete what is there, type the word:  powershell
5. Press Enter
6. PowerShell opens and is already inside your folder

Confirm you are in the right place by running:
    pwd

It should show: C:\Users\1234\Downloads\EG_ERP_GitHubPages\GIT_PAGES


STEP 6 — Run these commands one at a time
-------------------------------------------
Copy and paste each command. Press Enter. Wait for it to finish.
Then paste the next one.

────────────────────────────────────────
COMMAND 1 — Start git tracking
────────────────────────────────────────
    git init

Expected output:
    Initialized empty Git repository in .../.git/


────────────────────────────────────────
COMMAND 2 — Stage all your files
────────────────────────────────────────
    git add .

Expected output:
    warning: LF will be replaced by CRLF ...  (many lines like this)
    These warnings are NORMAL on Windows. Ignore them completely.


────────────────────────────────────────
COMMAND 3 — Save the snapshot
────────────────────────────────────────
    git commit -m "EG Construction ERP"

Expected output:
    [main (root-commit) abc1234] EG Construction ERP
    21 files changed, ...

If you see "Author identity unknown" — stop and redo Step 1.


────────────────────────────────────────
COMMAND 4 — Name the branch
────────────────────────────────────────
    git branch -M main

Expected output: nothing (blank line = success)


────────────────────────────────────────
COMMAND 5 — Connect to your GitHub repo
────────────────────────────────────────
    git remote add origin https://github.com/EVGCPLAdmin/Planning.git

Expected output: nothing (blank line = success)


────────────────────────────────────────
COMMAND 6 — Upload to GitHub
────────────────────────────────────────
    git push -u origin main

GitHub asks for your credentials:

    Username for 'https://github.com':
    → Type:  EVGCPLAdmin
    → Press Enter

    Password for 'https://EVGCPLAdmin@github.com':
    → Paste your token from Step 2 (starts with ghp_)
    → Right-click to paste in PowerShell
    → NOTHING WILL APPEAR as you paste — this is normal
    → Press Enter

Expected output when successful:
    Enumerating objects: 28, done.
    Counting objects: 100% ...
    Writing objects: 100% ...
    Branch 'main' set up to track remote branch 'main' from 'origin'.

Your code is now on GitHub.


=================================================================
PART 3 — ENABLE GITHUB PAGES
=================================================================

STEP 7 — Watch the automatic build
------------------------------------
GitHub immediately starts building your app.

1. Go to https://github.com/EVGCPLAdmin/Planning
2. Click the Actions tab
3. You see "Deploy to GitHub Pages" with a yellow spinning circle
4. Click it to watch the progress
5. Wait until it turns into a green tick (takes about 2 minutes)

If it turns RED — do not panic. Click the red X, find the error
message, and share it with me. Do not proceed until it is green.


STEP 8 — Turn on GitHub Pages
-------------------------------
This step tells GitHub which branch to serve your app from.

1. Go to https://github.com/EVGCPLAdmin/Planning
2. Click Settings tab (top of the repo page)
3. In the left sidebar click Pages
4. Under Build and deployment:
   - Source: Deploy from a branch
   - Branch: gh-pages
   - Folder: / (root)
5. Click Save

Wait 60 seconds.


STEP 9 — Open your live app
-----------------------------
Go to this URL in your browser:

    https://EVGCPLAdmin.github.io/Planning/

You will see the EG Construction ERP login screen.
Enter any email and PIN from your UserSecrets sheet.


=================================================================
PART 4 — HOW TO UPDATE THE APP IN FUTURE
=================================================================

Every time you receive updated files from me:

1. Replace the files in GIT_PAGES folder
2. Open PowerShell in that folder (same as Step 5)
3. Run these 3 commands:

    git add .
    git commit -m "updated files"
    git push

GitHub rebuilds and redeploys in about 2 minutes automatically.
You will never need to touch GitHub settings again.


=================================================================
TROUBLESHOOTING
=================================================================

PROBLEM: "Author identity unknown"
FIX: Run Step 1 again — the two git config commands

PROBLEM: "error: failed to push some refs"
FIX: You skipped Step 1. Run the git config commands first,
     then redo Commands 3 through 6 from Step 6.

PROBLEM: "error: remote origin already exists"
FIX: Run this then try Command 6 again:
       git remote remove origin
       git remote add origin https://github.com/EVGCPLAdmin/Planning.git
       git push -u origin main

PROBLEM: "403 forbidden" when pushing
FIX: Your token does not have repo permission.
     Go back to Step 2 and create a new token with "repo" ticked.

PROBLEM: Action shows red X in Actions tab
FIX: Click the red X → click the failed step → read the error.
     Most common cause: a secret name has a typo.
     Go to Settings → Secrets → check all 9 are exactly as listed.

PROBLEM: Blank white page at EVGCPLAdmin.github.io/Planning/
FIX 1: Wait 2 more minutes and refresh
FIX 2: Check Actions tab — the build must show a green tick first
FIX 3: Check Settings → Pages → confirm branch is gh-pages

PROBLEM: "Proxy not configured" on the live site
FIX: VITE_SHEETS_PROXY_URL secret is missing.
     Go to Settings → Secrets → add it again.

PROBLEM: "Failed to fetch" on login
FIX: VITE_SHEETS_PROXY_SECRET does not match PROXY_SECRET
     in sheetsProxy.gs. They must be identical strings.

=================================================================
