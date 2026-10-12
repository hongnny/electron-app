import http from 'node:http'
import { createReadStream, mkdirSync, statSync } from 'node:fs'
import path from 'node:path'

// 只监听回环地址，仅服务本地实验产物，不暴露项目源码。
const root = path.resolve('update-server')
mkdirSync(root, { recursive: true })
http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    const file = path.resolve(root, `.${pathname}`)
    if (!file.startsWith(root + path.sep) || !['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(403).end(); return
    }
    const stat = statSync(file)
    if (!stat.isFile()) { response.writeHead(404).end(); return }
    // 教学示例提供完整下载；不支持 Range 时，更新器可以回退到完整下载。
    response.writeHead(200, { 'Content-Length': stat.size, 'Cache-Control': 'no-store', 'Content-Type': 'application/octet-stream' })
    if (request.method === 'HEAD') response.end()
    else createReadStream(file).on('error', () => response.destroy()).pipe(response)
    console.log(`${request.method} ${pathname}`)
  } catch { response.writeHead(404).end() }
}).listen(8088, '127.0.0.1', () => console.log('更新服务器：http://127.0.0.1:8088；Ctrl+C 停止'))
