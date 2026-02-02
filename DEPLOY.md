# Deploy tutorial (ATA Addon Template Generator)

## Local test
```bash
npm install
npm start
# open http://localhost:3000
```

## Protect with password (recommended for your team)
Set environment variables:

- ATA_USER
- ATA_PASS

### Windows PowerShell
```powershell
$env:ATA_USER="purplebyte"
$env:ATA_PASS="your-strong-password"
npm start
```

---

## Deploy on Render (recommended)

### 1) Put the project on GitHub
Inside the project folder:
```bash
git init
git add .
git commit -m "ATA Generator"
```
Create a repo on GitHub and push:
```bash
git remote add origin https://github.com/YOURUSER/ata-generator.git
git push -u origin main
```

### 2) Deploy
On Render:
- New -> **Blueprint**
- Select your repo (Render will detect `render.yaml`)
- Deploy

### 3) Add password (optional but recommended)
Render -> Service -> Environment:
- ATA_USER = purplebyte
- ATA_PASS = (strong password)

Save (Render redeploys).

---

## Deploy on Railway
- New Project -> Deploy from GitHub
- Add env vars ATA_USER / ATA_PASS (optional)

---

## Notes
- This build uses `process.env.PORT` so hosts like Render/Railway work.
- `template_dir_entries.json` is used to preserve empty folders inside the generated zip.
