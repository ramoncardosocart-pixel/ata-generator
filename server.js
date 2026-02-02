const express = require('express')
const archiver = require('archiver')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(express.json())
app.use(express.static('public'))

const PORT = process.env.PORT || 3000

// Optional Basic Auth (set ATA_USER and ATA_PASS on the host)
function basicAuth(req, res, next) {
  const user = process.env.ATA_USER
  const pass = process.env.ATA_PASS
  if (!user || !pass) return next()

  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="ATA Generator"')
    return res.status(401).send('Auth required')
  }

  const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8')
  const i = decoded.indexOf(':')
  const u = decoded.slice(0, i)
  const p = decoded.slice(i + 1)

  if (u === user && p === pass) return next()

  res.setHeader('WWW-Authenticate', 'Basic realm="ATA Generator"')
  return res.status(401).send('Invalid credentials')
}
app.use(basicAuth)

const TEMPLATE_DIR = path.join(__dirname, 'template')
const TEMPLATE_DIR_ENTRIES_PATH = path.join(__dirname, 'template_dir_entries.json')

function replaceInText(content, replacements) {
  let result = content
  for (const [from, to] of Object.entries(replacements)) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'g'), to)
  }
  return result
}

function processTree(srcDir, destDir, replacements) {
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
  const entries = fs.readdirSync(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    let destName = entry.name

    for (const [from, to] of Object.entries(replacements)) {
      destName = destName.split(from).join(to)
    }

    const destPath = path.join(destDir, destName)

    if (entry.isDirectory()) {
      processTree(srcPath, destPath, replacements)
    } else {
      const content = fs.readFileSync(srcPath, 'utf8')
      const replaced = replaceInText(content, replacements)
      fs.writeFileSync(destPath, replaced, 'utf8')
    }
  }
}

function findManifests(root) {
  const result = { bp: null, rp: null }
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(fullPath)
      else if (entry.name === 'manifest.json') {
        const norm = fullPath.replace(/\\/g, '/').toLowerCase()
        if (norm.includes('_bp/')) result.bp = fullPath
        if (norm.includes('_rp/')) result.rp = fullPath
      }
    }
  }
  walk(root)
  return result
}

// Ensure empty dirs also exist in output, based on template_dir_entries.json
function ensureDirEntries(outputRoot, replacements) {
  if (!fs.existsSync(TEMPLATE_DIR_ENTRIES_PATH)) return []
  let entries = []
  try {
    entries = JSON.parse(fs.readFileSync(TEMPLATE_DIR_ENTRIES_PATH, 'utf8'))
  } catch {
    return []
  }
  const replacedEntries = entries.map(p => {
    let out = p
    for (const [from, to] of Object.entries(replacements)) {
      out = out.split(from).join(to)
    }
    return out
  })

  for (const rel of replacedEntries) {
    const relNoSlash = rel.endsWith('/') ? rel.slice(0, -1) : rel
    const full = path.join(outputRoot, relNoSlash)
    if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true })
  }

  return replacedEntries
}

function logGeneration(info) {
  try {
    const logsDir = path.join(__dirname, 'logs')
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
    fs.appendFileSync(
      path.join(logsDir, 'generations.log'),
      JSON.stringify({ time: new Date().toISOString(), ...info }) + '\n',
      'utf8'
    )
  } catch {}
}

app.post('/generate', (req, res) => {
  try {
    const { addonName, addonAcronym, creator, creatorAcronym } = req.body

    if (!addonName || !addonAcronym || !creator || !creatorAcronym) {
      return res.status(400).json({ errors: ['Preencha todos os campos.'] })
    }

    const addonAcronymLower = String(addonAcronym).toLowerCase()
    const creatorLower = String(creator).toLowerCase()

    const outputRoot = path.join(__dirname, 'output')
    if (fs.existsSync(outputRoot)) fs.rmSync(outputRoot, { recursive: true })
    fs.mkdirSync(outputRoot)

    const bpHeaderUUID = uuidv4()
    const bpModuleUUID = uuidv4()
    const rpHeaderUUID = uuidv4()
    const rpModuleUUID = uuidv4()

    // Keep your working replacement set unchanged
    const replacements = {
      'Addon Name': addonName,
      'ADDONACRONYM': addonAcronymLower,
      'rc_ADDONACRONYM': `rc_${addonAcronymLower}`,
      'CREATOR_triggers': `${creatorLower}_triggers`
    }

    processTree(TEMPLATE_DIR, outputRoot, replacements)
    const emptyDirs = ensureDirEntries(outputRoot, replacements)

    const { bp, rp } = findManifests(outputRoot)

    if (bp && rp) {
      const bpManifest = JSON.parse(fs.readFileSync(bp, 'utf8'))
      const rpManifest = JSON.parse(fs.readFileSync(rp, 'utf8'))

      bpManifest.header.uuid = bpHeaderUUID
      bpManifest.modules[0].uuid = bpModuleUUID

      rpManifest.header.uuid = rpHeaderUUID
      rpManifest.modules[0].uuid = rpModuleUUID

      bpManifest.dependencies = [{
        uuid: rpHeaderUUID,
        version: rpManifest.header.version || [1, 0, 0]
      }]

      fs.writeFileSync(bp, JSON.stringify(bpManifest, null, 2))
      fs.writeFileSync(rp, JSON.stringify(rpManifest, null, 2))
    }

    logGeneration({
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      addonName,
      addonAcronym: addonAcronymLower,
      creator: creatorLower,
      creatorAcronym: String(creatorAcronym).toLowerCase(),
      'CREATOR_ACRONYM': String(creatorAcronym).toLowerCase(),
    })

    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename=rc_${addonAcronymLower}_template.zip`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.on('error', err => {
      console.error(err)
      res.status(500).end()
    })

    archive.pipe(res)

    // Force empty directory entries inside the zip (if any)
    for (const dir of emptyDirs) {
      const name = dir.endsWith('/') ? dir : dir + '/'
      archive.append('', { name })
    }

    archive.directory(outputRoot, false)
    archive.finalize()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ errors: [String(e?.message || e)] })
  }
})

app.listen(PORT, () => {
  console.log(`ATA Addon Template Generator running on http://localhost:${PORT}`)
})
