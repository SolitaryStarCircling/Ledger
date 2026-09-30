# Ledger · 个人记账本

> 3 秒记一笔、界面像 iOS 原生、数据完全留在本地的个人记账应用。

基于 **Tauri v2** 构建，同一套代码产出 **Windows 桌面端** 与 **Android** 端。所有账目存放在本机 SQLite 文件中，默认不进行任何网络请求。

---

## 功能

**记账**

- 新增支出 / 收入，数字键盘输入，金额以「分」为单位存储，杜绝浮点误差
- 月流水按天分组，展示当日收支合计，顶部卡片汇总本月支出 / 收入 / 结余
- 任意历史月份切换（前 12 个月 ~ 后 3 个月）
- 修改金额、修改日期、删除记录、清空全部记录
- 快捷模板：把常用账目存成模板，一键记账

**统计**

- 年 / 月 / 周 / 天四种周期切换（周起点为周一）
- 圆环图展示分类支出占比，下方按金额降序排列分类明细
- 结余 = 收入 − 支出，正负分色显示

**分类与预算**

- 分类增删改、拖拽排序、使用频率统计
- 月度预算设置

**AI 消费分析（可选）**

- 接入大模型对消费记录做归纳分析
- 默认指向 DeepSeek，但 **服务商 / Base URL / 模型名均可自行配置**，兼容任意 OpenAI 风格接口
- 仅在你主动点击分析时才发起请求，且需要你自己填入 API Key
- **API Key 存放在系统凭据管理器**（Windows 凭据管理器 / macOS 钥匙串），不写入源码、不写入仓库；其他平台回退到本地数据库，也可选择「不保存」模式（Key 只存在于当次运行的内存中，退出即失效）

**其他**

- 浅色 / 深色主题切换，默认跟随系统
- 数据库备份与恢复（导出 / 导入）

---

## 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 跨端框架 | Tauri | 2.11 |
| 后端 | Rust (edition 2021) | — |
| 数据库 | SQLite via rusqlite（bundled） | 0.32 |
| 前端 | 原生 HTML / CSS / JavaScript，无框架 | — |
| HTTP | reqwest + rustls(ring)，纯 Rust TLS | 0.13 |
| 日期 | chrono | 0.4 |
| 凭据存储 | keyring（windows-native / apple-native） | 3.6 |
| 打包 | Tauri Bundler（NSIS / APK） | — |

TLS 特意选用 **rustls + ring**（纯 Rust 实现），因此 Windows 与 Android 编译都**不需要** cmake、nasm 或 OpenSSL。

---

## 环境准备

1. **Rust** —— <https://rustup.rs>
2. **Node.js** 18+ —— 用于运行 Tauri CLI
3. **Tauri 系统依赖** —— 见官方文档 <https://tauri.app/start/prerequisites/>
   - Windows：Microsoft C++ 生成工具 + WebView2
   - Android：Android Studio、NDK、JDK 17，并配置 `ANDROID_HOME` / `NDK_HOME`

## 快速开始

```bash
npm install          # 安装 Tauri CLI 及前端依赖

npm run tauri dev    # 开发模式，热重载
npm run tauri build  # 打包当前平台的安装包
```

### Android

```bash
npm run tauri android init     # 生成 gen/android 工程（首次，之后已入库无需再跑）
npm run tauri android dev      # 真机 / 模拟器调试
npm run tauri android build    # 产出 APK / AAB
```

> `src-tauri/gen/android/` 下的 Gradle 工程已纳入版本管理（Tauri 生成的 `.gitignore` 只排除 `build`、`.gradle` 等编译产物），因此克隆后可直接构建，无需重新 `init`。

---

## 项目结构

```
ledger/
├── src/                        前端（原生 HTML/CSS/JS）
│   ├── index.html
│   ├── styles.css
│   └── main.js
├── src-tauri/                  Rust 后端
│   ├── src/
│   │   ├── main.rs             入口
│   │   ├── lib.rs              Tauri 命令注册（30 个 invoke 命令）
│   │   ├── models.rs           数据结构
│   │   ├── db.rs               SQLite 连接与建表
│   │   ├── service.rs          业务逻辑：金额 / 日期 / 分类校验、增删改查
│   │   ├── keys.rs             API Key 存储（系统凭据管理器 / 数据库 / 内存）
│   │   └── ai.rs               DeepSeek 等 OpenAI 风格接口客户端
│   ├── capabilities/           权限声明
│   ├── icons/                  应用图标
│   ├── gen/android/            Android 工程
│   ├── Cargo.toml
│   └── tauri.conf.json
├── package.json
└── .gitattributes
```

## 数据存放位置

数据库文件 `ledger.sqlite` 由系统分配的应用数据目录承载，**不在本仓库内**：

- Windows：`%APPDATA%\<identifier>\ledger.sqlite`
- Android：应用私有目录

因此克隆仓库不会带上任何真实账目数据；请使用应用内的「备份」功能迁移数据。

---

## 许可证

[MIT](LICENSE)
