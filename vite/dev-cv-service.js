import fs from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const DB_PATH = resolve(__dirname, '../dev_cv_db.json')

async function analyzeCvWithOpenAI(cvData) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

  console.log(`[dev-cv-service] Initiating CV analysis. Model: ${model}`);

  // Dynamic fallback generator
  const getMockAnalysisFallback = (data) => {
    const fullName = data?.personalInfo?.fullName || "Candidate";
    const skillsCount = data?.skills?.length || 0;
    const experienceCount = data?.experience?.length || 0;
    const projectsCount = data?.projects?.length || 0;

    const strengths = [];
    const suggestions = [];
    let score = 70;

    if (data?.personalInfo?.summary) {
      strengths.push("Professional summary provides a concise overview of your background.");
    } else {
      strengths.push("Contact information is clearly structured.");
    }

    if (skillsCount > 0) {
      strengths.push(`Lists relevant core technologies (including ${data.skills.slice(0, 2).join(', ')}).`);
    }

    if (projectsCount > 0) {
      strengths.push("Showcases personal projects demonstrating hands-on experience.");
    }

    if (experienceCount === 0) {
      score -= 10;
      suggestions.push({
        category: "experience",
        issue: "No work experience section listed.",
        fix: "Add any past internships, freelance work, or junior roles to demonstrate practical background."
      });
    } else {
      score += 5;
      suggestions.push({
        category: "experience",
        issue: "Experience descriptions could be more impact-oriented.",
        fix: "Quantify your achievements with action verbs (e.g. 'Reduced loading time by 20%' or 'Managed 3 client releases')."
      });
    }

    if (skillsCount < 3) {
      score -= 5;
      suggestions.push({
        category: "skills",
        issue: "Skills list is quite sparse.",
        fix: "Expand your skills list to cover full-stack libraries, cloud platforms, and developer tools you have used."
      });
    } else {
      score += 5;
    }

    if (projectsCount === 0) {
      score -= 10;
      suggestions.push({
        category: "projects",
        issue: "No project examples listed to validate your skills.",
        fix: "Add 1-2 major academic or personal projects. List the technologies used in each project."
      });
    } else {
      score += 5;
      suggestions.push({
        category: "projects",
        issue: "Technologies are not specified per project.",
        fix: "Ensure you clearly tag or describe the technologies (e.g. React, Node.js) used in each project description."
      });
    }

    if (!data?.personalInfo?.linkedin && !data?.personalInfo?.github) {
      score -= 5;
      suggestions.push({
        category: "personal",
        issue: "Missing professional links (LinkedIn or GitHub).",
        fix: "Add your LinkedIn URL and GitHub profile to make it easier for recruiters to review your work."
      });
    }

    score = Math.max(50, Math.min(95, score));

    return {
      score,
      strengths,
      suggestions,
      analyzedAt: new Date().toISOString(),
      isMockFallback: true
    };
  };

  if (!apiKey) {
    console.warn('[dev-cv-service] OPENAI_API_KEY is not set. Using local mock analysis fallback.');
    return getMockAnalysisFallback(cvData);
  }

  const systemPrompt = `You are an expert technical recruiter and CV reviewer. Your job is to analyze the candidate's structured CV JSON and provide constructive feedback in a strict JSON format.

Evaluate the CV on the following criteria:
1. Impact-oriented wording: Use of strong action verbs and quantifiable metrics/results.
2. Formatting & structural gaps: Missing fields, vague descriptions, poor organization.
3. Strength of skills vs. projects: Are their projects demonstrating the skills they claimed to have?

You must output a JSON object with exactly the following keys:
1. "score": An integer between 0 and 100 representing the overall strength of the CV.
2. "strengths": A list of strings (maximum 4) detailing what the candidate did well.
3. "suggestions": A list of objects. Each object must represent an actionable improvement suggestion and contain:
   - "category": Must be exactly one of: "personal", "education", "experience", "skills", "projects".
   - "issue": A concise description of the problem in that section.
   - "fix": A specific, actionable recommendation to fix the issue.

Do not output any markdown formatting, backticks, prefix, or suffix. Output only the raw JSON.`;

  const userPrompt = `Here is the structured CV JSON to analyze:\n${JSON.stringify(cvData, null, 2)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI Fallback Triggered. Original Error Status:", response.status, "Body:", errorText);
      console.warn(`[dev-cv-service] OpenAI returned error ${response.status}: ${errorText}. Falling back to local mock analysis.`);
      return getMockAnalysisFallback(cvData);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned an empty response');
    }

    const parsed = JSON.parse(content);
    const score = typeof parsed.score === 'number' ? parsed.score : 70;
    const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    const rawSuggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

    const validCategories = ['personal', 'education', 'experience', 'skills', 'projects'];
    const suggestions = rawSuggestions.map(s => {
      let category = (s.category || '').toLowerCase().trim();
      if (!validCategories.includes(category)) {
        category = 'experience';
      }
      return {
        category,
        issue: s.issue || 'Improvement needed',
        fix: s.fix || 'Update details'
      };
    });

    return {
      score,
      strengths,
      suggestions,
      analyzedAt: new Date().toISOString(),
      isMockFallback: false
    };
  } catch (err) {
    console.error("OpenAI Fallback Triggered. Original Error:", err);
    console.warn(`[dev-cv-service] Exception occurred during OpenAI analysis: ${err.message}. Falling back to local mock analysis.`);
    return getMockAnalysisFallback(cvData);
  }
}

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
              analysisResult = await analyzeCvWithOpenAI(body)
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
