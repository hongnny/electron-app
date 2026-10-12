import { copyFileSync, mkdirSync, readdirSync, readFileSync, renameSync } from 'node:fs'
import path from 'node:path'

const version = process.argv[2]
if (!['1.0.0', '1.0.1'].includes(version)) throw new Error('用法：npm run publish:demo -- 1.0.0')
const source = path.resolve('release', version)
const target = path.resolve('update-server')
const manifest = process.platform === 'darwin' ? 'latest-mac.yml' : process.platform === 'win32' ? 'latest.yml' : 'latest-linux.yml'
// 先确认清单存在，避免发布半成品；不要自己手写版本清单或哈希。
readFileSync(path.join(source, manifest))
mkdirSync(target, { recursive: true })
for (const file of readdirSync(source)) {
  if (/\.(zip|dmg|exe|AppImage|blockmap)$/.test(file)) copyFileSync(path.join(source, file), path.join(target, file))
}
// 文件全部就绪后再原子替换清单，客户端不会看到指向尚未发布文件的新版本。
copyFileSync(path.join(source, manifest), path.join(target, `${manifest}.tmp`))
renameSync(path.join(target, `${manifest}.tmp`), path.join(target, manifest))
console.log(`已发布 ${version}：http://127.0.0.1:8088/${manifest}`)
