# XSS挑战靶场 - 静态HTML版本

## 项目简介

这是一个专门用于学习和练习XSS（跨站脚本攻击）的在线靶场，包含8个不同难度和类型的XSS挑战关卡。本版本为纯静态HTML实现，无需服务器环境即可运行。

## 功能特性

- **8个XSS挑战关卡**：从基础到高级，涵盖各种XSS攻击类型
- **进度管理系统**：必须按顺序完成关卡，确保学习效果
- **本地存储**：进度自动保存在浏览器本地存储中
- **响应式设计**：支持各种设备和屏幕尺寸
- **纯静态部署**：无需数据库和服务器环境

## 关卡介绍

### Level 1: 基础反射型XSS
- **目标**：学习最基本的XSS攻击原理
- **技能**：反射型XSS、基础payload构造

### Level 2: DOM型XSS
- **目标**：通过JavaScript操作DOM来执行XSS攻击
- **技能**：DOM操作、客户端XSS

### Level 3: 存储型XSS
- **目标**：通过留言板实现持久化XSS攻击
- **技能**：存储型XSS、持久化攻击

### Level 4: 过滤绕过XSS
- **目标**：绕过基础过滤机制实现XSS攻击
- **技能**：过滤绕过、编码技巧

### Level 5: 属性注入XSS
- **目标**：通过HTML属性注入实现XSS攻击
- **技能**：属性注入、上下文分析

### Level 6: JavaScript协议XSS
- **目标**：利用JavaScript协议实现XSS攻击
- **技能**：协议利用、URL构造

### Level 7: CSP绕过XSS
- **目标**：绕过内容安全策略实现XSS攻击
- **技能**：CSP分析、策略绕过

### Level 8: 增强版缓存中毒XSS
- **目标**：绕过多重过滤机制，利用缓存机制进行高级XSS攻击
- **技能**：高级绕过、缓存利用

## 部署方法

### 方法1：直接打开文件
1. 下载所有文件到本地
2. 直接双击 `index.html` 文件在浏览器中打开

### 方法2：本地HTTP服务器
```bash
# 使用Python启动简单HTTP服务器
cd static-html
python -m http.server 8000

# 或使用Node.js的http-server
npx http-server -p 8000
```

### 方法3：Web服务器部署
将整个 `static-html` 目录上传到任何Web服务器（如Apache、Nginx、GitHub Pages等）

## 文件结构

```
static-html/
├── index.html          # 主页
├── locked.html         # 关卡锁定页面
├── README.md          # 说明文档
├── css/
│   └── style.css      # 样式文件
├── js/
│   └── main.js        # 主要JavaScript逻辑
└── levels/
    ├── level1.html    # 关卡1：基础反射型XSS
    ├── level2.html    # 关卡2：DOM型XSS
    ├── level3.html    # 关卡3：存储型XSS
    ├── level4.html    # 关卡4：过滤绕过XSS
    ├── level5.html    # 关卡5：属性注入XSS
    ├── level6.html    # 关卡6：JavaScript协议XSS
    ├── level7.html    # 关卡7：CSP绕过XSS
    └── level8.html    # 关卡8：增强版缓存中毒XSS
```

## 使用说明

1. **开始挑战**：打开 `index.html` 开始第一个关卡
2. **完成关卡**：在每个关卡中成功执行 `alert('XSS')` 即可完成
3. **查看进度**：主页显示当前进度和已解锁的关卡
4. **重置进度**：可以随时重置进度重新开始

## 技术实现

- **HTML5**：页面结构和语义化标记
- **CSS3**：响应式设计和动画效果
- **JavaScript ES6+**：交互逻辑和进度管理
- **LocalStorage**：本地数据存储

## 安全说明

⚠️ **重要提醒**：
- 本靶场仅供学习和研究使用
- 请勿在生产环境或他人网站上使用相关技术
- 学习XSS防护同样重要，请关注安全编码实践

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 许可证

本项目仅供教育和学习使用，请勿用于非法用途。

## 更新日志

### v1.0.0 (2024)
- 初始版本发布
- 包含8个XSS挑战关卡
- 实现进度管理系统
- 支持纯静态部署