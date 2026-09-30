Ledger · 个人记账本
3 秒记一笔、完全离线的个人记账本。Rust + SQLite 单机内核，一套代码同时产出 Windows 桌面端与 Android 应用。

Ledger 是一款离线优先（offline-first）的个人记账工具。它把「数据主权」当作首要约束：账目写入本机 ledger.sqlite，没有账号体系、没有云同步、默认不发任何网络请求，断网状态与联网状态功能完全等价。

界面与交互向 iOS 原生看齐，但实现上刻意做减法——前端零框架、零打包器，index.html 通过一个 type="module" 标签直接加载 main.js，改完刷新即生效。UI 上不做引导流程、不做社交信息流、不做游戏化提醒，只有你的账目、你的数据和一张能看清钱去哪了的图表。

核心能力
极速记账 —— 悬浮按钮唤起底部抽屉，数字键盘输入，默认「支出 / 餐饮 / 今天」，键盘快捷键提交
精确金额 —— 金额以 INTEGER 的分存储（amount_cents），前后端用 "12.34" 字符串传输，全程不出现浮点误差
月流水 —— 按天分组、按日期降序（同日按创建时间降序），顶部卡片汇总本月支出 / 收入 / 结余，支持前后 12 / 3 个月的月份切换
周期统计 —— 年 / 月 / 周 / 天四种粒度（周起点为周一），手写 SVG 圆环图呈现分类支出占比，结余正负分色
分类体系 —— 增删改、拖拽排序、使用频次统计；删除分类时记录可转移至兜底分类，不产生孤儿数据
预算与常用项 —— 月度预算、快捷模板一键记账
AI 消费分析（可选） —— 兼容任意 OpenAI 风格接口，服务商 / Base URL / 模型名均可自配；仅主动点击时联网
备份与迁移 —— 数据库导出 / 导入，并在导出时自动剥离凭据
主题 —— 浅色 / 深色，默认跟随系统
技术架构
层	选型	说明
跨端壳	Tauri 2.11	一套代码产出 Windows（NSIS）与 Android（APK / AAB）
后端	Rust 2021	7 个模块，约 2330 行；注册 30 个 #[tauri::command]
存储	rusqlite 0.32（bundled）	单连接 Mutex<Connection> 由 Tauri 托管，SQLite 静态编入，无外部依赖
前端	原生 HTML / CSS / ES Module	0 依赖、0 构建步骤：main.js 3270 行、styles.css 2068 行、index.html 633 行
HTTP	reqwest 0.13 + rustls 0.23 (ring)	default-features = false，纯 Rust TLS
凭据	keyring 3（windows-native / apple-native）	按平台条件编译
日期	chrono 0.4	
数据模型（建表语句幂等，CREATE TABLE IF NOT EXISTS）：transactions（type 带 CHECK 约束、date 建索引）、categories（含 icon / color / sort / builtin）、budgets、templates、settings 键值表。首次启动写入 13 条预置分类，其 id 沿用历史硬编码值以保证旧记录 100% 兼容；预置写入只在建表那一次执行，用户删掉后不会复活。

工程取舍：TLS 特意选 rustls + ring，因此 Windows 与 Android 编译都不需要 cmake / nasm / OpenSSL（setup 里显式 install_default() 安装 crypto provider）；ai_analyze 这类 async 命令先把锁作用域收敛，不跨 await 持有数据库锁。

隐私与凭据模型
默认零网络：不点「分析」就不会有任何出站请求；本地/内网地址（localhost、127.0.0.1、::1、*.local、host.docker.internal、10.x、192.168.x、172.16–31.x、169.254.x）自动识别为免 Key 的自建服务
Key 三档存储：系统凭据管理器（Windows 凭据管理器 / macOS 钥匙串）→ 本机数据库 → 仅内存（进程内 Mutex<Option<String>>，退出即失效）；旧版本的 deepseek_api_key 自动迁移
Key 不回传前端：界面只回显前 3 后 4 位掩码
备份不带凭据：导出走临时副本库并 DELETE FROM settings 清除 ai_api_key / deepseek_api_key / ai_key_hint，任一环节失败自动回退原始字节，保证导出功能本身不被影响
导入是原子的：写临时文件 → ATTACH DATABASE → 校验 sqlite_master 中确有 transactions 表 → unchecked_transaction() 内整体覆盖并提交 → DETACH 清理；缺 budgets / templates 的旧备份自动跳过对应表
AI 子系统的容错设计
接大模型最容易踩的坑是「各厂商支持的可选参数不一致」，这里用能力档位降级解决：按 json_mode + thinking → 仅 json_mode → 纯文本 逐档重试；只有 400 / 404 / 422 且响应体明确提示 response_format、json_object、thinking、unsupported 等关键字时，才判定为「参数不支持」并降级，401 / 402 / 429 / 5xx 则映射为可读的中文提示，不盲目重试。此外：thinking 只发给 DeepSeek，推理类模型（reasoner / r1 / o1 / o3 / o4）自动去掉 temperature；超时按端区分（云端 45s / 本地 120s，连接超时 10s）；返回解析做了容错——剥离 ``` 围栏、取首 { 到末 }、字段别名兜底（verdict / 评价 / status）、数字兼容字符串，以适配小模型不规范输出。

工程质量
后端 src-tauri/src 共约 2330 行，其中 15 个 Rust 单元测试集中在 ai.rs（12 个）与 keys.rs（3 个）：覆盖围栏剥离、字段别名与非法输出兜底、Base URL 去重、本地地址识别、能力降级可重试性判定，并用 TcpListener 起了一个 mock OpenAI 服务端做端到端降级验证，另有一条真实 TLS 连通性测试。
