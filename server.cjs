const express = require('express')
const archiver = require('archiver')
const fs = require('fs')
const path = require('path')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(express.json())
app.use(express.static('public'))

// Folder that contains your original template (with placeholders)
const TEMPLATE_DIR = path.join(__dirname, 'template')

/**
 * Replace placeholders in a text file.
 * NOTE: We intentionally do NOT replace "Purplebyte" anywhere.
 */
function replaceInText(content, replacements) {
    let result = content
    for (const [from, to] of Object.entries(replacements)) {
        // Escape regex special chars in "from"
        const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        result = result.replace(new RegExp(escaped, 'g'), to)
    }
    return result
}

/**
 * Copy template -> output, replacing placeholders BOTH in:
 * - folder/file names
 * - file contents
 */
function processTree(srcDir, destDir, replacements) {
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

    const entries = fs.readdirSync(srcDir, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = path.join(srcDir, entry.name)

        // Replace placeholders in names too
        let destName = entry.name
        for (const [from, to] of Object.entries(replacements)) {
            destName = destName.split(from).join(to)
        }

        const destPath = path.join(destDir, destName)

        if (entry.isDirectory()) {
            processTree(srcPath, destPath, replacements)
            continue
        }

        const ext = path.extname(entry.name).toLowerCase()
        const isText = ext === '.js' || ext === '.json' || ext === '.lang'

        if (isText) {
            const content = fs.readFileSync(srcPath, 'utf8')
            const replaced = replaceInText(content, replacements)
            fs.writeFileSync(destPath, replaced, 'utf8')
        } else {
            // (Not used in your current template, but safe)
            fs.copyFileSync(srcPath, destPath)
        }
    }
}

/**
 * Find the BP/RP manifest paths in the output.
 * Your template uses folders: rc_XXX_bp/manifest.json and rc_XXX_rp/manifest.json
 */
function findManifests(outputRoot) {
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

    walk(outputRoot)
    return result
}

app.post('/generate', (req, res) => {
    try {
        const { addonName, addonAcronym, creator, creatorAcronym } = req.body

        const addonAcronymLower = String(addonAcronym || '').trim().toLowerCase()
        const creatorLower = String(creator || '').trim().toLowerCase()
        const creatorAcronymLower = String(creatorAcronym || '').trim().toLowerCase()

        if (!addonName || !addonAcronymLower || !creator || !creatorAcronymLower) {
            return res.status(400).json({ error: 'Missing fields' })
        }

        const outputRoot = path.join(__dirname, 'output')
        if (fs.existsSync(outputRoot)) fs.rmSync(outputRoot, { recursive: true })
        fs.mkdirSync(outputRoot)

        // New UUIDs
        const bpHeaderUUID = uuidv4()
        const bpModuleUUID = uuidv4()
        const rpHeaderUUID = uuidv4()
        const rpModuleUUID = uuidv4()

        // Placeholder replacements (IMPORTANT: match your real placeholders)
        const replacements = {
            // Names / acronyms
            'Addon Name': addonName,
            'ADDONACRONYM': addonAcronymLower,

            // Namespace folder/id prefix
            'rc_ADDONACRONYM': `rc_${addonAcronymLower}`,

            // Script module alias in main.js
            'CREATOR_ACRONYM': creatorAcronymLower,

            // Triggers file name (import path in main.js uses this token)
            'CREATOR_triggers': `${creatorLower}_triggers`,
            
            'CREATOR_ACRONYM': String(creatorAcronym).toLowerCase(),
        }

        processTree(TEMPLATE_DIR, outputRoot, replacements)

        // Update manifests and connect dependencies
        const { bp: bpManifestPath, rp: rpManifestPath } = findManifests(outputRoot)

        if (bpManifestPath && rpManifestPath) {
            const bpManifest = JSON.parse(fs.readFileSync(bpManifestPath, 'utf8'))
            const rpManifest = JSON.parse(fs.readFileSync(rpManifestPath, 'utf8'))

            // Keep authors (Purplebyte) as-is.

            // Update UUIDs
            bpManifest.header.uuid = bpHeaderUUID
            if (bpManifest.modules && bpManifest.modules[0]) bpManifest.modules[0].uuid = bpModuleUUID

            rpManifest.header.uuid = rpHeaderUUID
            if (rpManifest.modules && rpManifest.modules[0]) rpManifest.modules[0].uuid = rpModuleUUID

            // Ensure BP depends on RP header uuid
            bpManifest.dependencies = [{
                uuid: rpHeaderUUID,
                version: rpManifest.header.version || [1, 0, 0]
            }]

            fs.writeFileSync(bpManifestPath, JSON.stringify(bpManifest, null, 2), 'utf8')
            fs.writeFileSync(rpManifestPath, JSON.stringify(rpManifest, null, 2), 'utf8')
        }

        res.setHeader('Content-Type', 'application/zip')
        res.setHeader('Content-Disposition', `attachment; filename=rc_${addonAcronymLower}_template.zip`)

        const archive = archiver('zip', { zlib: { level: 9 } })
        archive.on('error', err => {
            console.error(err)
            res.status(500).end()
        })

        archive.pipe(res)
        archive.directory(outputRoot, false)
        archive.finalize()
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: String(err?.message || err) })
    }
})

app.listen(3000, () => {
    console.log('ATA Addon Template Generator running on http://localhost:3000')
})
