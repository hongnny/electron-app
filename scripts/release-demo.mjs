import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// 使用构建版本覆盖，不改源码 package.json；产物内仍写入指定版本。
const version = process.argv[2]
const unsigned = process.argv.includes('--unsigned')
if (!['1.0.0', '1.0.1'].includes(version)) {
  throw new Error('用法：npm run release:demo -- 1.0.0 [--unsigned]')
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const run = (args, env = process.env) => {
  const result = spawnSync('npm', args, { stdio: 'inherit', env })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
run(['run', 'build'])
// 发布两个版本时记录一致的构建身份；未签名产物只能用于观察，不能宣称升级安装通过。
const args = ['exec', '--', 'electron-builder', '--publish', 'never', `--config.extraMetadata.version=${version}`]
if (process.platform === 'darwin') {
  args.push('--mac', `--${process.arch}`)
  if (unsigned) args.push('--config.mac.identity=null')
  else args.push('--config.forceCodeSigning=true')
}
run(args, unsigned ? { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' } : process.env)
writeFileSync(`release/${version}/demo-build.json`, JSON.stringify({ version, sourceVersion: pkg.version, platform: process.platform, arch: process.arch, unsigned }, null, 2))
