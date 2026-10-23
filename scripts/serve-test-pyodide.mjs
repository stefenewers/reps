// Serve the installed, real Pyodide runtime for browser tests without a CDN.
import { createServer } from 'node:http'
import { createReadStream, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
const root = resolve('node_modules/pyodide')
const types = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json', '.zip': 'application/zip' }
createServer((req, res) => {
  const file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1)
  if (!file || basename(file) !== file || !existsSync(resolve(root, file))) {
    res.writeHead(404).end()
    return
  }
  const ext = file.slice(file.lastIndexOf('.'))
  res.writeHead(200, { 'Content-Type': types[ext] ?? 'application/octet-stream', 'Access-Control-Allow-Origin': '*' })
  createReadStream(resolve(root, file)).pipe(res)
}).listen(Number(process.argv[2] ?? 3212), '127.0.0.1')
