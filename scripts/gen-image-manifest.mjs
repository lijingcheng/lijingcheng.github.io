import { readdirSync, statSync, writeFileSync } from 'fs'
import { join, relative } from 'path'

const IMAGES_DIR = 'public/images'
const OUTPUT = '.vitepress/image-manifest.json'
const EXTENSIONS = new Set(['.jpeg', '.jpg', '.png', '.gif', '.webp'])

function scanDir(dir) {
  const result = {}
  const absDir = join(process.cwd(), dir)

  try {
    const entries = readdirSync(absDir)
    for (const entry of entries) {
      const full = join(absDir, entry)
      const stat = statSync(full)
      if (stat.isDirectory()) {
        // 递归扫描子目录
        const sub = scanDir(join(dir, entry))
        Object.assign(result, sub)
      } else {
        const ext = entry.substring(entry.lastIndexOf('.')).toLowerCase()
        if (EXTENSIONS.has(ext)) {
          // 用相对于 public 的路径作为 key
          const relPath = '/' + relative('public', join(dir, entry))
          const galleryKey = '/' + relative('public', dir)
          if (!result[galleryKey]) result[galleryKey] = []
          result[galleryKey].push(relPath)
        }
      }
    }
  } catch (e) {
    // 目录不存在则跳过
  }

  return result
}

// 扫描并生成 manifest
const manifest = scanDir(IMAGES_DIR)

// 每个 gallery 内的图片按文件名排序
for (const key of Object.keys(manifest)) {
  manifest[key].sort()
}

writeFileSync(join(process.cwd(), OUTPUT), JSON.stringify(manifest, null, 2))
console.log(`Generated ${OUTPUT}: ${Object.keys(manifest).length} galleries`)
