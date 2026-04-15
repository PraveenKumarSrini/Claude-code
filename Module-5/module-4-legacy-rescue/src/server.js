// server.js — HTTP API for word frequency analysis

const http = require('http')
const analyzer = require('./analyzer')
const utils = require('./utils')
const path = require('path')

const PORT = 3457

// Only files inside this directory may be read. Set FILES_BASE_DIR in env to override.
const ALLOWED_BASE = path.resolve(process.env.FILES_BASE_DIR || './files')

// Reject request bodies larger than 1 MB (DoS protection).
const MAX_BODY_BYTES = 1 * 1024 * 1024

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 10

function sendError(res, status, message) {
  res.writeHead(status, {'Content-Type': 'application/json'})
  res.end(JSON.stringify({error: message}))
}

// Resolve user-supplied path and assert it stays inside ALLOWED_BASE (path traversal protection).
function resolveSafePath(userInput) {
  if (!userInput || typeof userInput !== 'string') return null
  const resolved = path.resolve(ALLOWED_BASE, userInput)
  if (!resolved.startsWith(ALLOWED_BASE + path.sep) && resolved !== ALLOWED_BASE) {
    return null
  }
  return resolved
}

// Collect the request body as a string, enforcing the byte limit.
// Rejects with a special TOO_LARGE error when the limit is exceeded.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    let bodyBytes = 0

    req.on('data', chunk => {
      bodyBytes += chunk.length
      if (bodyBytes > MAX_BODY_BYTES) {
        req.destroy()
        const err = new Error('TOO_LARGE')
        err.code = 'TOO_LARGE'
        return reject(err)
      }
      body += chunk
    })

    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

async function handleRequest(req, res) {
  let parsed
  try {
    parsed = new URL(req.url, 'http://localhost')
  } catch (_) {
    return sendError(res, 400, 'invalid request URL')
  }

  if (parsed.pathname === '/health') {
    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify({status: 'ok'}))
    return
  }

  if (parsed.pathname === '/analyze' && req.method === 'GET') {
    const fileParam = parsed.searchParams.get('file')
    if (!fileParam) return sendError(res, 400, 'missing file parameter')

    const fullPath = resolveSafePath(fileParam)
    if (!fullPath) return sendError(res, 400, 'invalid file path')

    const stats = await analyzer.analyzeFile(fullPath)
    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify(stats))
    return
  }

  if (parsed.pathname === '/analyze/text' && req.method === 'POST') {
    const body = await readBody(req)
    const words = utils.countWords(body)
    const sorted = utils.sortByCount(words)
    let totalWords = 0
    for (const w in words) totalWords += words[w]

    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify({
      totalWords,
      uniqueWords: Object.keys(words).length,
      topWords: sorted.slice(0, 10)
    }))
    return
  }

  if (parsed.pathname === '/format' && req.method === 'GET') {
    const formatFileParam = parsed.searchParams.get('file')
    if (!formatFileParam) return sendError(res, 400, 'missing file parameter')

    const safeFormatPath = resolveSafePath(formatFileParam)
    if (!safeFormatPath) return sendError(res, 400, 'invalid file path')

    const rawLimit = parseInt(parsed.searchParams.get('limit'))
    const limit = isNaN(rawLimit) ? DEFAULT_LIMIT : Math.min(Math.max(rawLimit, 1), MAX_LIMIT)

    const stats = await analyzer.analyzeFile(safeFormatPath)
    const formatted = utils.formatResults(stats.topWords, limit)
    res.writeHead(200, {'Content-Type': 'text/plain'})
    res.end('Word Frequency Analysis: ' + path.basename(stats.filepath) + '\n'
      + 'Total words: ' + stats.totalWords + '\n'
      + 'Unique words: ' + stats.uniqueWords + '\n\n'
      + formatted)
    return
  }

  sendError(res, 404, 'not found')
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    if (err.code === 'TOO_LARGE') {
      sendError(res, 413, 'request body too large (max 1 MB)')
    } else {
      console.error('[server] unhandled error:', err.message)
      if (!res.headersSent) sendError(res, 500, 'failed to read file')
    }
  })
})

server.listen(PORT, () => {
  console.log('Word Analyzer running on http://localhost:' + PORT)
  console.log('Serving files from: ' + ALLOWED_BASE)
  console.log('')
  console.log('Endpoints:')
  console.log('  GET  /health              - Health check')
  console.log('  GET  /analyze?file=<path> - Analyze a file')
  console.log('  POST /analyze/text        - Analyze posted text')
  console.log('  GET  /format?file=<path>  - Formatted report')
})
