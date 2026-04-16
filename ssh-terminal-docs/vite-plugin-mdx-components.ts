import type { Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

/**
 * 从组件文件内容中提取复合组件的子组件
 * 例如：从 StepList 组件中提取 StepList.Step
 */
function extractSubComponents(fileContent: string, componentName: string): string[] {
  const subComponents: string[] = []
  
  // 匹配模式：ComponentName.SubComponent = SubComponent
  const pattern1 = new RegExp(`${componentName}\\.(\\w+)\\s*=\\s*(\\w+)`, 'g')
  let match
  while ((match = pattern1.exec(fileContent)) !== null) {
    const subComponentName = match[1]
    if (!subComponents.includes(subComponentName)) {
      subComponents.push(subComponentName)
    }
  }
  
  // 匹配模式：ComponentName.SubComponent = function SubComponent
  const pattern2 = new RegExp(`${componentName}\\.(\\w+)\\s*=\\s*(?:function|const)\\s+(\\w+)`, 'g')
  while ((match = pattern2.exec(fileContent)) !== null) {
    const subComponentName = match[1]
    if (!subComponents.includes(subComponentName)) {
      subComponents.push(subComponentName)
    }
  }
  
  return subComponents
}

/**
 * 创建一个 Vite 插件，用于自动扫描和注册 MDX 组件
 * 这个插件会在构建时扫描 src/components 目录，并生成组件索引文件
 */
export function mdxComponentsPlugin(options: {
  componentsPath?: string
  outputPath?: string
}): Plugin {
  const {
    componentsPath = './src/components',
    outputPath = './src/generated/mdx-components.ts'
  } = options

  return {
    name: 'mdx-components-scanner',
    enforce: 'post',
    buildStart() {
      // 构建开始时，扫描组件并生成索引文件
      try {
        const componentsDir = path.resolve(process.cwd(), componentsPath)
        
        if (!fs.existsSync(componentsDir)) {
          console.log(`[MDX] 组件目录不存在: ${componentsDir}`)
          return
        }
        
        // 递归扫描所有 .tsx 和 .ts 文件
        const scanDirectory = (dir: string, baseDir: string = dir): string[] => {
          const files: string[] = []
          const entries = fs.readdirSync(dir, { withFileTypes: true })
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name)
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
            
            if (entry.isDirectory()) {
              files.push(...scanDirectory(fullPath, baseDir))
            } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
              const componentName = entry.name.replace(/\.(tsx?|jsx?)$/, '')
              if (componentName !== 'index' && !componentName.startsWith('.')) {
                files.push(relativePath)
              }
            }
          }
          
          return files
        }
        
        const componentFiles = scanDirectory(componentsDir)
        
        if (componentFiles.length === 0) {
          console.log(`[MDX] 未找到任何组件文件`)
          return
        }
        
        console.log(`[MDX] 扫描到 ${componentFiles.length} 个组件:`)
        componentFiles.forEach(file => console.log(`  - ${file}`))
        
        // 分析每个组件文件，提取子组件信息
        const componentInfo: Array<{
          file: string
          componentName: string
          subComponents: string[]
        }> = []
        
        for (const file of componentFiles) {
          const fullPath = path.join(componentsDir, file)
          const componentName = path.basename(file).replace(/\.(tsx?|jsx?)$/, '')
          const fileContent = fs.readFileSync(fullPath, 'utf-8')
          const subComponents = extractSubComponents(fileContent, componentName)
          
          componentInfo.push({
            file,
            componentName,
            subComponents
          })
          
          if (subComponents.length > 0) {
            console.log(`[MDX] 发现 ${componentName} 的子组件: ${subComponents.join(', ')}`)
          }
        }
        
        // 生成组件索引文件
        const imports: string[] = []
        const exports: string[] = []
        const configEntries: string[] = []
        
        for (const info of componentInfo) {
          const { file, componentName, subComponents } = info
          const importPath = `../components/${file.replace(/\.(tsx?|jsx?)$/, '')}`
          
          // 导入主组件
          imports.push(`import { ${componentName} } from '${importPath}'`)
          exports.push(`  ${componentName},`)
          configEntries.push(`  ${componentName}: '${importPath}'`)
          
          // 如果有子组件，也需要注册它们
          for (const subComponent of subComponents) {
            const subComponentKey = `${componentName}.${subComponent}`
            exports.push(`  "${subComponentKey}": ${componentName}.${subComponent},`)
            // 注意：子组件的配置指向父组件
            configEntries.push(`  "${subComponentKey}": '${importPath}'`)
          }
        }
        
        const content = `// 自动生成的 MDX 组件索引文件
// 请勿手动编辑此文件

${imports.join('\n')}

export const MDX_COMPONENTS = {
${exports.join('\n')}
}

// 导出默认配置对象
export const mdxComponentsConfig = {
${configEntries.join(',\n')}
}
`
        
        // 确保输出目录存在
        const outputDir = path.dirname(outputPath)
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }
        
        // 写入文件
        fs.writeFileSync(outputPath, content, 'utf-8')
        console.log(`[MDX] 组件索引文件已生成: ${outputPath}`)
        
      } catch (error) {
        console.error('[MDX] 扫描组件失败:', error)
      }
    }
  }
}