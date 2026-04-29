# 飞书文档自动全屏宽度

[English](#english) | [中文](#中文)

## 中文

自动将飞书/Lark 文档页面宽度设置为全屏模式，无需手动切换。支持 wiki、docx、docs 三种文档类型。

### 功能

- 页面加载时自动注入 CSS，将文档内容区域撑满全屏宽度
- 自动调用飞书 API 持久化宽度设置，刷新后保持全屏
- 支持 `feishu.cn` 和 `larksuite.com` 两个域名
- 在页面渲染前生效，无闪烁

### 安装

1. 安装浏览器扩展 [Tampermonkey](https://www.tampermonkey.net/)（Chrome / Edge / Firefox）
2. 点击 [安装脚本](feishu-width-mode.user.js)，Tampermonkey 会自动识别并安装
3. 打开任意飞书文档页面，脚本自动生效

### 工作原理

1. **CSS 注入**（`document-start` 阶段）：在页面渲染前注入样式，将 `.page-main-item.editor` 等元素的宽度设为 `auto`，取消最大宽度限制
2. **API 持久化**（页面加载后 3 秒）：解析当前 URL 获取文档 token，调用飞书 `common_setting/update` 接口将宽度模式设为 `full`，确保刷新后设置不丢失

### 许可证

[MIT](https://opensource.org/licenses/MIT)

---

## English

Automatically set Feishu/Lark document pages to full width mode without manual toggling. Supports wiki, docx, and docs document types.

### Features

- Injects CSS on page load to stretch document content to full width
- Calls Feishu API to persist the width setting across refreshes
- Supports both `feishu.cn` and `larksuite.com` domains
- Takes effect before page rendering — no flicker

### Installation

1. Install the browser extension [Tampermonkey](https://www.tampermonkey.net/) (Chrome / Edge / Firefox)
2. Click [Install Script](feishu-width-mode.user.js) — Tampermonkey will detect and install it automatically
3. Open any Feishu document page — the script takes effect automatically

### How It Works

1. **CSS Injection** (`document-start` phase): Injects styles before rendering, setting `.page-main-item.editor` width to `auto` and removing max-width constraints
2. **API Persistence** (3 seconds after page load): Parses the current URL for the document token, calls the Feishu `common_setting/update` API to set width mode to `full`, ensuring the setting persists across refreshes

### License

[MIT](https://opensource.org/licenses/MIT)
