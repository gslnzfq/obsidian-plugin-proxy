import { copyFileSync, readdirSync, renameSync, unlinkSync } from 'fs'
import { resolve } from 'path'
import { defineBuildConfig } from 'unbuild'

const pluginDir = 'Documents/Obsidian/插件分享/.obsidian/plugins/obsidian-plugin-proxy'

export default defineBuildConfig({
  entries: [
    {
      input: './src/main',
      format: 'cjs',
    },
    {
      builder: 'mkdist',
      input: './public',
    },
  ],
  declaration: true,
  clean: true,
  externals: [
    'electron',
    'obsidian',
  ],
  rollup: {
    emitCJS: true,
  },
  hooks: {
    'build:done': (ctx) => {
      const { outDir } = ctx.options
      const files = readdirSync(outDir)
      // 只保留必要的文件
      const includeFiles = ['main.cjs', 'manifest.json', 'data.json']
      // 删除多余的文件，将结果文件复制到Obsidian 插件目录
      files.forEach((f) => {
        const from = resolve(outDir, f)
        if (!includeFiles.includes(f)) {
          return unlinkSync(from)
        }
        const jsFileName = f.replace(/.cjs$/, '.js')
        const jsFile = resolve(outDir, jsFileName)
        renameSync(from, jsFile)

        // 开发环境下，需要把文件复制到 Obsidian 插件目录
        if (process.env.NODE_ENV === 'development') {
          const obsidianFile = resolve(process.env.HOME!, pluginDir, jsFileName)
          copyFileSync(jsFile, obsidianFile)
        }
      })
    },
  },
})
