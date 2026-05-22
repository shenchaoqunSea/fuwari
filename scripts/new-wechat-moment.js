/* 创建朋友圈文章 - 根据日期自动创建文件夹和文章 */

import fs from "fs"
import path from "path"

function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  const hours = String(today.getHours()).padStart(2, "0")
  const minutes = String(today.getMinutes()).padStart(2, "0")
  const seconds = String(today.getSeconds()).padStart(2, "0")

  return `${year}-${month}-${day}-${hours}${minutes}${seconds}`
}

const args = process.argv.slice(2)

// 允许自定义标题，如果没有则使用日期
let title = args[0] || getDate()

// 获取日期作为文件夹名
const folderName = getDate()

// 目标路径 - 放在 wechat_moments 目录下
const targetDir = `./src/content/posts/wechat_moments/${folderName}`
const mdPath = path.join(targetDir, `${title}.md`)
const imagesPath = path.join(targetDir, "images")

// 检查文章是否已存在
if (fs.existsSync(mdPath)) {
  console.error(`❌ 文章已存在: ${mdPath}`)
  process.exit(1)
}

// 创建文件夹
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
  console.log(`✅ 创建文件夹: ${targetDir}`)
}

// 创建 images 目录
if (!fs.existsSync(imagesPath)) {
  fs.mkdirSync(imagesPath, { recursive: true })
  console.log(`✅ 创建图片目录: ${imagesPath}`)
}

// 生成 front-matter
const content = `---
title: ${title}
published: ${getDate()}
description: ''
image: ''
tags: [朋友圈]
category: 生活
draft: false
lang: zh_CN
---

## ${title}

写点什么...
`

// 创建 markdown 文件
fs.writeFileSync(mdPath, content)
console.log(`✅ 创建文章: ${mdPath}`)
console.log(``)
console.log(`🎉 朋友圈文章创建成功！`)
console.log(`   📁 文件夹: ${targetDir}`)
console.log(`   📝 文章: ${mdPath}`)
console.log(`   🖼️  图片: ${imagesPath}`)
console.log(``)
console.log(`💡 提示：`)
console.log(`   - 在 images/ 目录下放入图片`)
console.log(`   - 在文章中使用 ./images/图片名.png 引用图片`)
console.log(`   - 访问 URL: /posts/wechat_moments/${folderName}/`)
