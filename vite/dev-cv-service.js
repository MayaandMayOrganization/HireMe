import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const DB_PATH = resolve(__dirname, '../dev_cv_db.json')

// Helper to extract the Cognito username (local-part of email) from Cognito ID or Access token payload
function extractUsername(req) {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.replace(/^Bearer\s+/, '').trim()
  if (!token) return 'local-user'
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8')
      const payload = JSON.parse(payloadJson)
      
      // ID Token check
      const email = payload.email || ''
      if (email && email.includes('@')) {
        return email.split('@')[0]
      }
      // Access Token check
      return payload.username || payload['cognito:username'] || payload.sub || 'local-user'
    }
  } catch (err) {
    console.error('Failed to parse dev auth token:', err)
  }
  return 'local-user'
}

function loadDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}), 'utf8')
  }
  try {
    const content = fs.readFileSync(DB_PATH, 'utf8')
    return JSON.parse(content || '{}')
  } catch (err) {
    console.error('Failed to read local dev CV DB:', err)
    return {}
  }
}

function saveDatabase(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8')
  } catch (err) {
    console.error('Failed to save local dev CV DB:', err)
  }
}

function readJsonBody(req) {
  return new Promise((resolveBody, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      try {
        resolveBody(data ? JSON.parse(data) : {})
      } catch {
        reject(new Error('Invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

export function devCvServicePlugin() {
  return {
    name: 'dev-cv-service',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle requests targeting /api/cv
        if (!req.url?.startsWith('/api/cv')) {
          next()
          return
        }

        const username = extractUsername(req)
        const isAnalyze = req.url.startsWith('/api/cv/analyze')

        try {
          if (req.method === 'GET') {
            const db = loadDatabase()
            const userData = db[username] || { cv: null, analysis: null }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(userData))
            return
          }

          if (req.method === 'POST') {
            const body = await readJsonBody(req)
            const db = loadDatabase()

            if (!db[username]) {
              db[username] = { cv: null, analysis: null }
            }

            // Save CV Data
            db[username].cv = body

            let analysisResult = db[username].analysis

            if (isAnalyze) {
              // Stubbed AI review analysis response for Step 1
              // Will be replaced with real OpenAI call in Step 2
              analysisResult = {
                score: 75,
                strengths: [
                  "Good formatting in education section",
                  "Clear listings of core languages and frameworks"
                ],
                suggestions: [
                  {
                    category: "experience",
                    issue: "Lack of metrics and action verbs in experience details.",
                    fix: "Quantify your achievements (e.g. 'Improved speed by 25%')."
                  },
                  {
                    category: "projects",
                    issue: "Only one technology listed per project.",
                    fix: "Specify the full stack used in the description."
                  }
                ],
                analyzedAt: new Date().toISOString()
              }
              db[username].analysis = analysisResult
            }

            saveDatabase(db)

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ 
              success: true, 
              cv: db[username].cv,
              analysis: analysisResult 
            }))
            return
          }

          // Unhandled method
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method Not Allowed' }))

        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || String(err) }))
        }
      })
    }
  }
}
