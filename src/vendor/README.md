# src/vendor

随包分发的第三方前端库。放在仓库里而不是运行时从 CDN 拉取，是为了保证应用**完全离线可用**，
并且不在运行时执行来路不明的远程代码。

---

## xlsx.full.min.js

| 项 | 值 |
|---|---|
| 名称 | SheetJS Community Edition（`xlsx`） |
| 版本 | **0.20.3** |
| 来源 | <https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js> |
| 大小 | 929.6 KB |
| SHA-256 | `CC015130AA8521E7F088F88898EBA949CCDCBFB38DF0BD129B44B7273C3A6F41` |
| 许可 | Apache-2.0（文件头保留了原始版权声明） |
| 用途 | 解析导入的 `.xlsx` / `.xls` 账单 |

### 为什么不用 npm 上的 xlsx

npm 上的 `xlsx` 包停留在 **0.18.5** 且已停止更新，该版本带有两个未修复漏洞：

- **CVE-2023-30533** 原型污染（0.19.3 修复）
- **CVE-2024-22363** ReDoS（0.20.2 修复）

本项目要解析的是**用户从支付宝 / 微信导出的外部文件**，正是这类漏洞的触发场景，
因此不能使用 npm 上的 0.18.5。SheetJS 已改为通过自家 CDN 发行修复版，必须从
`cdn.sheetjs.com` 获取。

### 加载方式

`src/main.js` 中的 `loadXLSX()` 在**首次导入 Excel 时**动态注入 `<script>` 标签加载本文件并缓存；
CSV 导入路径完全不碰它，因此不会影响冷启动。

> 若将来为 `tauri.conf.json` 配置 CSP，需要放行 `script-src 'self'`，否则本文件会被拦截。

### 升级步骤

```powershell
# 1. 下载新版本（Windows 自带 curl.exe）
curl.exe -sL -o src/vendor/xlsx.full.min.js `
  https://cdn.sheetjs.com/xlsx-<新版本>/package/dist/xlsx.full.min.js

# 2. 校验并更新上表中的哈希
Get-FileHash src/vendor/xlsx.full.min.js -Algorithm SHA256

# 3. 同步更新本文件的版本号、大小与 SHA-256
```

升级后建议跑一次实际的 Excel 账单导入做回归（`npm run tauri dev`）。
