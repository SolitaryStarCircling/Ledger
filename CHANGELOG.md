# 更新日志

本文件为**事后回填**，条目逐条对应仓库的 git 提交与 GitHub Release 正文，未新增任何未被记录的内容。日期取提交日期（UTC+8）。

记录方式说明：

| 载体 | 作用 |
|---|---|
| git 提交 | `type(scope): 中文摘要`（Conventional Commits），正文说明「为什么」与影响面 |
| `chore(release)` 提交 | 唯一发版动作，同步 `package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 四处版本号（见 [ARCHITECTURE.md §11.3](./ARCHITECTURE.md#113-版本升级)） |
| git tag + GitHub Release | 版本级摘要、产物 `Ledger-<版本号>-arm64.apk` |

> **版本号 `1.0.0` 之后直接跳到 `1.2.0`，本项目历史上不存在 `1.1.0`。** 这一点在 `package.json`、`tauri.conf.json`、`Cargo.toml` 三个文件的历史中一致，v1.2.0 的 Release 正文也自述为「版本号 `1.0.0` → `1.2.0`」。
> 另：`1.0.0` 存续了 9 天（2026-09-30 ~ 2026-10-09）且未发过 GitHub Release，仓库中没有留下它的确切发布提交；此处按「版本号存续期」归组。该版本的 tag `v1.0.0` 于 2026-10-20 **事后补打**，指向版本号首次声明为 `1.0.0` 的提交。

---

## [1.7.1] — 2026-10-26

提交链接 [696c6d3](https://github.com/SolitaryStarCircling/Ledger/commit/696c6d3) · tag [v1.7.1](https://github.com/SolitaryStarCircling/Ledger/releases/tag/v1.7.1)。以下改动由 `git diff` 逐条核对得出。

**修复**

- **安卓真机「进详情页又弹出字段面板」**：单击流水是在 `pointerup` / `touchend` 上消费的，页面切到详情页后浏览器补发的合成 `click` 会落在新页面同坐标的字段行或底部按钮上。现在 `touchend` 在点按被消费后一律 `preventDefault` 掐掉合成 click，并在详情页打开后的 450ms 内再兜底吞掉所有点击。桌面端 click 的目标是按下时的流水行，不受影响
- **安卓输入法遮挡详情页备注输入框**：`#txdNoteSheet` 固定在 `bottom: 0`。根因是 `enableEdgeToEdge()` 之后系统不再为输入法缩小窗口，且 `visualViewport` 在该 WebView 里不随键盘变化，纯前端探测拿不到键盘高度。现在由原生层兜底：`AndroidManifest.xml` 为 Activity 设置 `adjustResize`，`MainActivity.kt` 监听 IME inset 并把键盘高度转成根容器 `padding-bottom`，WebView 变矮后固定在底部的面板自然落在键盘上方；JS 同时保留 `visualViewport` / `window resize` 监听作为 WebView 自行收缩时的第二道保险。键盘收起即归零，关闭面板移除监听并还原样式

**调整**

- **记录详情页不再显示底部悬浮导航**：详情页是二级页面，进入时给 `#app` 加 `detail-open`，CSS 隐藏 `.tabbar` / `.tab-settings` / `.fab`，只保留顶栏返回键；关闭详情、切 tab、打开分类明细页时移除该类，明细 / 财报 / 设置等一级页面的导航不受影响

**测试**

- 前端：`node --check` 通过；无后端改动，`cargo test` 仍 27 个用例（26 通过 + 1 ignored）
- 安卓：`:app:compileArmDebugKotlin` 与 `:app:processArmDebugMainManifest` 编译通过，Kotlin / Manifest 改动可用

**版本号**：`1.7.0` → `1.7.1`（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 四处同步）

**对应代码改动**：`src/main.js` +59/−2、`src/styles.css` +6、`src-tauri/gen/android/app/src/main/java/com/tauri_app/ledger/MainActivity.kt` +14、`src-tauri/gen/android/app/src/main/AndroidManifest.xml` +1

---

## [1.7.0] — 2026-10-26

提交链接 [3cd9df0](https://github.com/SolitaryStarCircling/Ledger/commit/3cd9df0) · tag [v1.7.0](https://github.com/SolitaryStarCircling/Ledger/releases/tag/v1.7.0)。以下改动由 `git diff` 逐条核对得出。

**新增**

- **单击流水行进入记录详情页**：原来单击弹出「修改 / 多选 / 删除 / 取消」操作菜单，现在直接进入整页详情，展示**记录时间**（账单日期 + 星期，副行显示录入时间）、**金额**（支出红 / 收入绿，带正负号）、**分类**（图标 + 名称）、**备注**（为空显示「无」）。底部一行放「删除」「编辑」两个按钮
- **详情页五个位置可直接单击修改**：
  - 点顶部金额 → 金额键盘面板（与记账键盘同一套 del / 小数点 / 两位小数 / 位数上限规则），保存即改金额
  - 点「支出 / 收入」徽标 → 类型面板；选到另一类型后自动弹出该类型的分类面板，**选完分类才落库**，避免出现类型与分类方向不一致的脏数据；在分类面板取消则类型也不变
  - 点分类行 → 分类面板（复用批量改分类面板，只列当前收支类型的分类），点选即保存
  - 点记录时间行 → 日历面板（范围与「编辑」一致：前后一年 + 原日期所在月），点选即保存，点同一天不写库
  - 点备注行 → 底部输入面板，保存或回车生效，清空后详情显示「无」
  - 三行行尾加了淡色 chevron、金额与类型徽标加了按压反馈，表明可点
- **记录编辑页（与「新建账单」同构）**：点详情页「编辑」直接打开记账面板并预填原值，可一次改掉**类型、金额、分类、日期、备注**；编辑态隐藏「收藏为常用」行，保存后详情页、明细列表、财报页同步刷新。分类随支出 / 收入分段切换，后端 `check_category` 兜底防串类
- 后端新增 `update_tx` 整条更新命令（`service::update_full`）：一次事务写回五个字段；日期**仅在真正改变时**才做 ±365 天校验，与 `update_date` 口径一致，导入的老账单可原样保存

**移除**

- 旧操作菜单及其二级面板全部删除：`#actionSheet`、`#editTypeSheet`、`#editAmountSheet`、`#editDateSheet`、`#editNoteSheet`，以及对应的 11 个前端函数 / 监听器与 `.edit-date-list` / `.edit-date-item` 样式。**多选能力保留**，入口统一为长按 500ms（原「多选」菜单项删除）

**体验**

- 详情页接入既有返回栈：首页 / 分类明细页 / 搜索结果进入详情，返回时各自回到来源页；编辑面板叠在详情页之上，返回先收起面板
- 编辑模式下日历可选范围由「前后 2 个月」放宽到「前后 1 年」，并把原账单所在月强制纳入范围，避免老账单改备注时日期不可选
- 详情页字段修改复用既有面板与样式：`#batchCatSheet`（分类）、`#calSheet`（日历）、`.edit-keypad` / `.edit-amount-display` / `.edit-actions`（金额键盘）、`.note-input`（备注输入），**未新增后端命令**；单字段走 `update_amount` / `update_date` / `update_note`，改分类与改类型走 `update_tx`（类型与分类必须同向）
- 抽出纯函数 `computeKeypad(str, k)`，记账面板与详情金额面板共用键盘逻辑；字段保存后详情页原地重绘，并同步首页 / 财报 / 记录数 / 来源分类明细页，日期跨月时同步切换首页月份

**测试**

- 新增 3 条单测：整条更新（含 expense → income 换分类、备注 trim、录入时间不变）、类型与分类不匹配被拒且不落库、超窗原日期未改动时放行 / 改到另一个超窗日期被拒。`cargo test` 全量 27 个用例（26 通过 + 1 条联网用例 ignored）
- 前端：`node --check` 通过；`index.html` 208 个 id 无重复，`$('#id')` 引用 330 处、0 缺失

**版本号**：`1.6.0` → `1.7.0`（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 四处同步）

**对应代码改动**：`src/main.js` +395/−195、`src/index.html` +71/−39、`src/styles.css` +122/−41、`src-tauri/src/service.rs` +91、`src-tauri/src/lib.rs` +16

---

## [1.6.0] — 2026-10-20

提交链接 [10d3fbf](https://github.com/SolitaryStarCircling/Ledger/commit/10d3fbf) · tag [`v1.6.0`](https://github.com/SolitaryStarCircling/Ledger/releases/tag/v1.6.0)。以下改动由 `git diff` 逐条核对得出。

**新增**

- **财报「结余范围 → 天」的日期选择改为「有数据就能选」**：原来「天」这一档打开的是写死的「近 12 天 / 未来 3 天」列表，账本里更早的日期根本选不到。现在一律扫描全部流水、聚合出**确实有记录**的日期（去重、倒序、最新在前），因此任何有数据的日期都能被选中，查看当天的结余与收支；每行右侧直接显示当天「支出 ¥X · 收入 ¥Y」，账本为空时给出空态提示。周 / 月两档维持原有窗口不变

**工程化**

- `openDayPicker` 不再依赖 `new Date()` 推算固定天数窗口（删掉 `todayDs` / `yesterdayDs` / `WEEK` 与取数循环），改为从 `txs` 聚合；日期文案复用既有 `dayLabel()`（跨年自动补年份），金额复用 `fmtMoneyShort()`
- 面板标题由「选择日期（往前 12 天 / 往后 3 天）」改为「选择日期（仅列出有记录的日期）」；`styles.css` 新增 `.picker-item .pick-right` / `.pick-sum` / `.picker-empty`（选中态金额随主色）

**版本号**：`1.5.5` → `1.6.0`（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 四处同步）

**对应代码改动**：`src/main.js` +29/−23、`src/index.html` +1/−1、`src/styles.css` +4

---

## [1.5.5] — 2026-10-20

提交链接 [b952672](https://github.com/SolitaryStarCircling/Ledger/commit/b952672) · tag [`v1.5.5`](https://github.com/SolitaryStarCircling/Ledger/releases/tag/v1.5.5)。以下改动截至 2026-10-20，由 `git diff` 逐条核对得出。

**修复**

- **明细页侧滑删除流水时整片列表闪一下**：两处叠加，分两步修掉 ——
  - ① **入场动画被重播**：`.day-group` / `.cat-row` / `.empty-state` 的入场动画是 `fadeUp … backwards`，`backwards` 填充让元素在动画开始前处于 `opacity: 0`；删除后 `renderHome()` 用 `innerHTML` 重建整表，动画随之重播 → 画面表现为「整片列表先消失、再整体淡入」。弹层内删除之所以看不出来，是被 `.modal-mask` 关闭后 350ms 的淡出遮住了。新增「静默重绘」：数据**原地变更**（删除 / 改金额 / 改日期 / 改备注 / 批量改分类 / 导入 / 清空）后的重建给容器加 `no-anim` 抑制入场动画；首次进入 / 切月 / 切 tab / 搜索过滤这些「内容确实变了」的新视图路径保留动画
  - ② **整表 DOM 重建换帧掉帧**：消掉动画后仍有残留闪动（只是时间变短），因为 `innerHTML` 整表重建会让 Android WebView 在换帧时掉一帧。侧滑删除改为「原地修补」`patchAfterDelete()`：只摘掉被删的那一行、重算所在天的「支出 / 收入」合计（该天没别的记录了就连整组摘掉），再原地改顶部汇总 / 环比 / 预算，**完全不重建列表 DOM**；只有多选态、搜索过滤、行已不在列表、删空需要出空态时才退回静默重绘。同时把重绘时机从 280ms 推迟到 320ms，等行收起动画（300ms）真正结束

**工程化**

- `renderHome` / `renderStats` / `renderCatDetail` 增加 `silent` 参数统一控制静默重绘，避免各处各自抑制动画、口径不一
- 侧滑删除改走 `patchAfterDelete()` 原地修补，不再整表重建；`.day-group` 增加 `data-date` 作为修补锚点（补日期、改合计都要靠它定位）。分类明细页开着时首页列表也一并摘行 —— 切 tab 不会重绘首页，否则返回明细页时会留下一条已删掉的陈旧记录
- 原地变更调用点共 15 处改为静默重绘：批量改分类、分类增删改、常用项记账、改金额 / 改日期 / 改备注 / 确认删除、记账保存、SQLite 导入、清空记录、账单导入，以及跨天与回到前台的定时重绘

**版本号**：`1.5.1` → `1.5.5`（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 四处同步）

**对应代码改动**（相对 1.5.1）：`src/main.js` +140/−44、`src/styles.css` +9

---

## [1.5.1] — 2026-10-20

提交链接 [2d7aa67](https://github.com/SolitaryStarCircling/Ledger/commit/2d7aa67)。以下改动截至 2026-10-20，由 `git diff` 逐条核对得出。

**修复**

- **Android 端侧滑返回 / 返回键直接退出应用，而不是回到上一个界面**：根因是两处叠加 —— ① 前端是无路由 SPA，页面与弹层全靠切 class，从未调用 `history.pushState`，WebView 历史恒为 1 条；② Tauri 模板把 `WryActivity` 的 `handleBackNavigation` 覆写为 `false`，Activity 不注册任何返回回调。返回手势因此无人拦截，直接走 Activity 默认后退 `finish()` 掉自己。修复须**两条腿同时成立**（缺任一条都无效）：
  - `MainActivity.kt` 覆写 `handleBackNavigation = true`，返回手势才会先交给 WebView（能回退就回退，历史耗尽才退出应用）
  - `main.js` 新增返回栈：把「当前 UI 层级」同步进 WebView 历史，返回手势按层级逐层剥离 —— 弹层 → 弹层内二级面板 → AI 视图 → 分类明细页 → 非首页 tab → 首页 → 再按才退出应用

**工程化**

- 层级由实时 DOM 派生（`uiLayers()`，自底向上：`stats`/`catdetail`/`settings` → `ai` → `search` → `select` → `sheet` → `modal` → `lock`）；层数变多 `pushState` 支哨兵、层数不变 `replaceState`、层数变少静默 `back()` 收哨兵
- 同一轮内的多次界面变化用 `queueMicrotask` 合并为一次历史操作，避免「关一个弹层又开一个」时先排入物理回退再 push 新层导致的层数漂移
- 程序性回退（UI 路径关闭）与手势回退用 `backSuppress` 计数区分，前者不触发剥层；因此 UI 路径关闭后不多占一次返回
- 一次手势只剥一层；物理哨兵数少于实时 UI 层数时回退后补齐
- 锁屏层保护：解锁界面（`verify`）下返回键**一律拒绝**，防止等于绕过密码；设置密码第二步按返回退回第一步（等同点「取消」）
- 搜索关闭逻辑抽成 `closeSearch()`，与返回栈同步口径统一

**版本号**：`1.5.0` → `1.5.1`（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 四处同步）

**对应代码改动**：`src/main.js` +149/−5、`src-tauri/gen/android/app/src/main/java/com/tauri_app/ledger/MainActivity.kt` +7

---

## [1.5.0] — 2026-10-20

功能提交 [c1aaaba](https://github.com/SolitaryStarCircling/Ledger/commit/c1aaaba) · 版本号提交 [1b74e84](https://github.com/SolitaryStarCircling/Ledger/commit/1b74e84)。以下改动截至 2026-10-20，由 `git diff` 逐条核对得出。

**新增**

- **单条记录修改备注**：新增 `update_note` 命令并注册进 `invoke_handler`（命令总数 35 → **36**）；明细页操作菜单增加「修改备注」，弹出输入面板（上限 30 字、回车即保存）。备注 trim 后落库、允许清空、记录不存在时报错，`service.rs` 补 1 条单测（默认执行用例 22 → **23**，含 `#[ignore]` 共 24 条）
- **首页「较上月 ±X%」环比**：本月支出大数字下方展示较上月涨跌百分比，上涨标红、下降标绿，差值小于 0.05% 显示「持平」；上月无支出记录或处于搜索态时整行隐藏（搜索时大数字是跨月过滤结果，与之环比无意义）
- **超支提醒**：打开应用时若当前查看月份已超支，居中提醒一次（不拦操作、自动消失）；记账且这一笔刚好把本月从「未超支」推成「超支」时，在记账成功提示后追加超支金额，避免每次记账重复刷同一句。提醒卡为红色警示样式，停留 3.2s（普通成功卡 1.6s）

**工程化**

- `package.json` 新增脚本 `android:release:arm64`（`tauri android build --apk --split-per-abi -t aarch64`）；README 构建章节改为推荐该脚本，并注明上传前需重命名为 `Ledger-<版本号>-arm64.apk`
- 环比渲染复用既有的 `prevMonthOf(month)`，未引入重复的同名函数定义

**文档**

- README：功能清单补「修改备注」「较上月环比」「超支提醒」三项；命令数 35 → 36；Rust 用例数与覆盖点更新（补「单条改备注」）；`npm install` 注释改为「仅安装 Tauri CLI」；项目结构补 `docs/`、`ARCHITECTURE.md`、`ARCHITECTURE.en.md`、`LICENSE`；技术栈 / 隐私与凭据 / AI 容错 / 工程质量四处补指向架构文档的交叉引用
- 新增 `ARCHITECTURE.md` / `ARCHITECTURE.en.md`（中英双语、章节编号一一对应）

**版本号**：`1.4.0` → `1.5.0`（`package.json` / `src-tauri/tauri.conf.json` / `src-tauri/Cargo.toml` / `src-tauri/Cargo.lock` 四处同步）

**对应代码改动**：`src/main.js` +101/−9、`src-tauri/src/service.rs` +30、`src/styles.css` +12、`src/index.html` +11、`src-tauri/src/lib.rs` +11

---

## [1.4.0] — 2026-10-19

`chore(release): 版本号升级至 1.4.0` [3199811](https://github.com/SolitaryStarCircling/Ledger/commit/3199811) · tag `v1.4.0` · [Release](https://github.com/SolitaryStarCircling/Ledger/releases/tag/v1.4.0)

**新增**

- 财报页支持「支出 / 收入」自由切换：环形图、分类排行与占比随之切换；收入分类同样可下钻到分类明细页，明细页按支出 / 收入两种口径自适应（标题、合计、金额符号）
- 图表页「近 6 个月趋势」：支出 / 收入双色柱状对比，当前月高亮
- 明细页左右滑动切换月份：位移小于 55px 视为误触，不影响行内左滑删除

**修复**

- 导出 Excel 与 CSV 均不可用：两者调用的是 `writeBinaryFile`，而它是 Tauri v1 的 API，Tauri v2 已移除；CSV 另有 `TypeError: blob is not iterable`（Blob 不可展开）。统一改用 v2 的 `writeFile`
- 本应用自己导出的 Excel / CSV 无法重新导入（提示「导入失败：未找到表头」）
- 记账面板打开日历弹层时，Esc / 数字键会穿透到记账面板
- 切换查看月份后，预算未同步重新读取

**改进**

- SQLite「恢复到当前（覆盖）」补充说明——不含设置项与密码，需在本机重新配置

**对应代码改动** [c5f85ef](https://github.com/SolitaryStarCircling/Ledger/commit/c5f85ef)：`src/main.js` +240 / `src/index.html` +25 / `src/styles.css` +41

---

## [1.3.0] — 2026-10-19

`chore(release): 版本号升级至 1.3.0` [9070888](https://github.com/SolitaryStarCircling/Ledger/commit/9070888) · tag `v1.3.0` · [Release](https://github.com/SolitaryStarCircling/Ledger/releases/tag/v1.3.0)

**新增**

- 财报「分类支出明细页」：财报支出表的分类行可直接点入，查看该分类当期全部流水；按日分组（日期倒序），沿用首页流水模板与滑动操作；顶部统计为总支出 / 单笔均值 / 笔数

**改进**

- 长按多选仅限首页流水，避免在明细页误触批量删除
- README 增加「最新版本」下载入口

**对应代码改动** [ff329cb](https://github.com/SolitaryStarCircling/Ledger/commit/ff329cb) `feat(report): 新增分类支出明细页`

---

## [1.2.0] — 2026-10-13

`chore(release): 版本号升级至 1.2.0` [88c4243](https://github.com/SolitaryStarCircling/Ledger/commit/88c4243) · tag `v1.2.0` · [Release](https://github.com/SolitaryStarCircling/Ledger/releases/tag/v1.2.0)

**修复**

- Android 端「AI 消费分析」点了没反应：根因是 reqwest 在 rustls 下强制走 `rustls-platform-verifier`，该库在 Android 上必须手动 JNI 初始化，未初始化时证书校验会 panic，请求在 TLS 握手阶段就中断（DeepSeek 后台显示 **0 次请求**）。改用 `webpki-roots` 内置 Mozilla 根证书 + `use_preconfigured_tls` 自建 `ClientConfig` [ed79d74](https://github.com/SolitaryStarCircling/Ledger/commit/ed79d74)

**工程化**

- Android release 构建改用 `ledger-release.keystore` 正式签名；`gradle.properties`（内含签名口令）从仓库移除并加入 `.gitignore` [e0fbfeb](https://github.com/SolitaryStarCircling/Ledger/commit/e0fbfeb)
- `.vscode` 目录取消版本控制并忽略 [f393e5c](https://github.com/SolitaryStarCircling/Ledger/commit/f393e5c)、[3ee2a96](https://github.com/SolitaryStarCircling/Ledger/commit/3ee2a96)

> 该版 Release 正文同时记录「版本号 `1.0.0` → `1.2.0`」，即此版本号跳跃发生在本次发布。

---

## [1.0.0] — 2026-09-30

首个版本 · [9ad83da](https://github.com/SolitaryStarCircling/Ledger/commit/9ad83da) `feat: bootstrap the Ledger personal bookkeeping app` · tag `v1.0.0`（2026-10-20 事后补打）

未发布 GitHub Release。以下为该版本号存续期（2026-09-30 ~ 2026-10-09）内的全部改动。

**初始能力**

- 记账：新增支出 / 收入，自绘数字键盘输入，金额以「分」为单位存储；月流水按天分组、展示当日收支合计，顶部卡片汇总本月支出 / 收入 / 结余
- 明细：任意历史月份切换、搜索、多选批量改分类 / 删除、侧滑删除
- 统计：年 / 月 / 周 / 天四种周期切换（周起点为周一）；圆环图展示分类支出占比并按金额降序排列
- 分类与预算：分类增删改、拖拽排序、使用频率统计；月度预算设置
- AI 消费分析（可选）：默认指向 DeepSeek，服务商 / Base URL / 模型名可自行配置，兼容任意 OpenAI 风格接口；仅在主动点击时发起请求
- 凭据模型：API Key 存系统凭据管理器（Windows），Android 回落到本机数据库或「仅内存」模式；Key 不回传前端，仅回显前 3 后 4 位掩码
- 其他：浅色 / 深色主题切换、数据库备份与恢复

**新增**

- 账单导入：解析支付宝 / 微信导出的 CSV 与 Excel，自动识别表头行、映射到已有分类，带进度条并如实报告失败条数；首启手势提示（左滑删除 / 长按多选 / 点击行看详情）；新增 `ai_clear_analyses` 命令与「清空数据」入口 [a5f93c3](https://github.com/SolitaryStarCircling/Ledger/commit/a5f93c3)
- 应用锁：PIN 以 Argon2id（PHC）哈希存本机 `settings` 表，仅本地校验，退到后台 / 页面隐藏时自动锁定 [e74299a](https://github.com/SolitaryStarCircling/Ledger/commit/e74299a)
- 自定义分类规则 `cat_rules`：账单导入时优先于内置关键字
- 数据导入导出：Excel / CSV / SQLite 三格式互导 [e74299a](https://github.com/SolitaryStarCircling/Ledger/commit/e74299a)
- 应用图标重做（Windows/macOS 资源 + Android 各密度，新增自适应图标层与 `mipmap-anydpi-v26`）；底部导航改为悬浮胶囊（明细 / 记账 / 财报居中，设置独立悬浮在右侧） [cc9cfee](https://github.com/SolitaryStarCircling/Ledger/commit/cc9cfee)

**修复**

- id 仅由毫秒时间戳派生，同毫秒两次写入撞 `UNIQUE` 约束，批量导入时记录被静默丢弃（现追加进程内自增计数）
- 删除分类时的兜底分类未校验，可能指向不存在的 id 或在收支之间串类
- 超过 365 天的历史账单即使原样保存也被拒绝（现日期未变动即放行）
- 导入备份不含 `categories` 表，导致自定义分类全部退化为「其他」、统计页出现多行「其他」（现按 id 合并，而非整表清空）
- 保存无重入守卫，双击或连续回车会记重复账
- 定时重绘无条件调用 `renderHome`，每分钟重放列表入场动画并把手动滑开的行合上
- 导入失败被静默吞掉（现统计并报告失败条数）
- 跨年月份不显示年份，「9 月支出」含义不清
- 设置按钮与导航胶囊在窄屏上重叠 [3594395](https://github.com/SolitaryStarCircling/Ledger/commit/3594395)
- 批量改分类时目标分类必须与每条被选记录同向，否则支出记录被贴上收入分类、统计串类；同一类型下分类名去重 [e74299a](https://github.com/SolitaryStarCircling/Ledger/commit/e74299a)

**工程化**

- CSP 从 `null` 改为按逐行静态审计推导的完整策略（`script-src` 不含 `unsafe-inline` / `unsafe-eval`，`style-src` 保留 `unsafe-inline`，`connect-src` 放行 `ipc:` 与 `http://ipc.localhost`）；导入失败时不再把记录对象（含金额与备注）写进日志 [b7422b2](https://github.com/SolitaryStarCircling/Ledger/commit/b7422b2)
- Excel 解析库改为随包 vendored（`src/vendor/xlsx.full.min.js`，SheetJS 0.20.3），替代运行时从 esm.sh 拉取 0.18.5：恢复完全离线、规避 CVE-2023-30533（原型污染）与 CVE-2024-22363（ReDoS）；移除导入路径的 console 调试输出；Rust 单测 15 → 18 [a5f93c3](https://github.com/SolitaryStarCircling/Ledger/commit/a5f93c3)
- README 多轮整改：平台范围收敛为 Android + Windows、清除 iOS / macOS 措辞、补截图预览区、修 Markdown 加粗在全角括号下泄漏的问题、新增 `.editorconfig` [de3d649](https://github.com/SolitaryStarCircling/Ledger/commit/de3d649) [9e8a255](https://github.com/SolitaryStarCircling/Ledger/commit/9e8a255) [20f231f](https://github.com/SolitaryStarCircling/Ledger/commit/20f231f) [6ca3b40](https://github.com/SolitaryStarCircling/Ledger/commit/6ca3b40) [e348bd0](https://github.com/SolitaryStarCircling/Ledger/commit/e348bd0) [51abe6c](https://github.com/SolitaryStarCircling/Ledger/commit/51abe6c)
- 文档补齐应用锁、分类规则、导入导出格式与数据模型（8 模块 / 35 命令、argon2、22 条单测分布） [7897935](https://github.com/SolitaryStarCircling/Ledger/commit/7897935)

---

## 版本号对照

| 版本 | 日期 | 版本号提交 | tag |
|---|---|---|---|
| 1.5.5 | 2026-10-20 | `b952672` | `v1.5.5` |
| 1.5.1 | 2026-10-20 | `2d7aa67` | 未单独发 Release（并入 1.5.5 发布） |
| 1.5.0 | 2026-10-20 | `1b74e84` | `v1.5.0` |
| 1.4.0 | 2026-10-19 | `3199811` | `v1.4.0` |
| 1.3.0 | 2026-10-19 | `9070888` | `v1.3.0` |
| 1.2.0 | 2026-10-13 | `88c4243` | `v1.2.0` |
| 1.0.0 | 2026-09-30 | `9ad83da` | `v1.0.0`（2026-10-20 事后补打） |
| 1.1.0 | — | **不存在** | 未创建（版本号从未被使用过） |
