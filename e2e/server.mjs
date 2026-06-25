import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'

const root = process.cwd()
const port = Number(process.env.E2E_PORT || '8080')

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${port}`)
  let filePath = decodeURIComponent(url.pathname)
  if (filePath.endsWith('/')) filePath += 'index.html'
  const fullPath = resolve(root, filePath.slice(1))

  if (!fullPath.startsWith(root)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }

  try {
    const data = await readFile(fullPath)
    const contentType = mimeTypes[extname(fullPath)] || 'application/octet-stream'
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store',
    })
    res.end(data)
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(port, () => {
  console.log(`E2E static server running at http://localhost:${port}`)
})
