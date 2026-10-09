mod ai;
mod db;
mod keys;
mod lock;
mod models;
mod service;

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::Manager;

type DbState<'a> = tauri::State<'a, Mutex<rusqlite::Connection>>;

fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法定位数据目录: {}", e))?;
    Ok(dir.join("ledger.sqlite"))
}

#[tauri::command]
fn list_all(state: DbState<'_>) -> Result<Vec<models::Transaction>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::list_all(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_tx(
    state: DbState<'_>,
    tx_type: String,
    amount: String,
    category: String,
    note: String,
    date: String,
) -> Result<models::Transaction, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::add(&conn, &tx_type, &amount, &category, &note, &date)
}

#[tauri::command]
fn update_amount(
    state: DbState<'_>,
    id: String,
    amount: String,
) -> Result<models::Transaction, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::update_amount(&conn, &id, &amount)
}

#[tauri::command]
fn update_date(
    state: DbState<'_>,
    id: String,
    date: String,
) -> Result<models::Transaction, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::update_date(&conn, &id, &date)
}

#[tauri::command]
fn delete_tx(state: DbState<'_>, id: String) -> Result<bool, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::delete(&conn, &id)
}

#[tauri::command]
fn clear_all_tx(state: DbState<'_>) -> Result<usize, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::clear_all(&conn)
}

#[tauri::command]
fn update_category_batch(
    state: DbState<'_>,
    ids: Vec<String>,
    category: String,
) -> Result<usize, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::update_category_batch(&conn, &ids, &category)
}

#[tauri::command]
fn get_budget(state: DbState<'_>, month: String) -> Result<Option<f64>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::get_budget(&conn, &month)
}

#[tauri::command]
fn set_budget(state: DbState<'_>, month: String, amount: Option<f64>) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::set_budget(&conn, &month, amount)
}

#[tauri::command]
fn list_templates(state: DbState<'_>) -> Result<Vec<models::Template>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::list_templates(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn add_template(
    state: DbState<'_>,
    tx_type: String,
    amount: String,
    category: String,
    note: String,
) -> Result<models::Template, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::add_template(&conn, &tx_type, &amount, &category, &note)
}

#[tauri::command]
fn update_template(
    state: DbState<'_>,
    id: String,
    tx_type: String,
    amount: String,
    category: String,
    note: String,
) -> Result<models::Template, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::update_template(&conn, &id, &tx_type, &amount, &category, &note)
}

#[tauri::command]
fn delete_template(state: DbState<'_>, id: String) -> Result<bool, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::delete_template(&conn, &id)
}

/* ========== 分类管理 ========== */
#[tauri::command]
fn list_categories(state: DbState<'_>) -> Result<Vec<models::Category>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::list_categories(&conn)
}

#[tauri::command]
fn add_category(
    state: DbState<'_>,
    cat_type: String,
    name: String,
    icon: String,
    color: String,
) -> Result<models::Category, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::add_category(&conn, &cat_type, &name, &icon, &color)
}

#[tauri::command]
fn update_category(
    state: DbState<'_>,
    id: String,
    name: String,
    icon: String,
    color: String,
) -> Result<models::Category, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::update_category(&conn, &id, &name, &icon, &color)
}

#[tauri::command]
fn category_usage(state: DbState<'_>, id: String) -> Result<usize, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::category_usage(&conn, &id)
}

#[tauri::command]
fn delete_category(state: DbState<'_>, id: String, fallback: Option<String>) -> Result<usize, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::delete_category(&conn, &id, fallback.as_deref())
}

#[tauri::command]
fn reorder_categories(state: DbState<'_>, ids: Vec<String>) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::reorder_categories(&conn, &ids)
}

/* ========== 应用锁 ========== */
#[tauri::command]
fn lock_status(state: DbState<'_>) -> Result<lock::LockStatus, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    lock::status(&conn)
}

#[tauri::command]
fn lock_set_pin(state: DbState<'_>, pin: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    lock::set_pin(&conn, &pin)
}

#[tauri::command]
fn lock_verify(state: DbState<'_>, pin: String) -> Result<bool, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    lock::verify(&conn, &pin)
}

#[tauri::command]
fn lock_disable(state: DbState<'_>) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    lock::disable(&conn)
}

/* ========== 设置（settings 键值表） ========== */
#[tauri::command]
fn get_setting(state: DbState<'_>, key: String) -> Result<Option<String>, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::get_setting(&conn, &key)
}

#[tauri::command]
fn set_setting(state: DbState<'_>, key: String, value: String) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::set_setting(&conn, &key, &value)
}

#[tauri::command]
fn delete_setting(state: DbState<'_>, key: String) -> Result<bool, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::delete_setting(&conn, &key)
}

/* ========== AI 消费分析 ========== */

/// 读取服务商配置 + Key 状态（Key 本体不回传前端）
#[tauri::command]
fn ai_config_get(
    state: DbState<'_>,
    key_state: tauri::State<'_, keys::AiKeyState>,
) -> Result<keys::AiConfigView, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    keys::view(&conn, &key_state)
}

#[tauri::command]
fn ai_config_set(
    state: DbState<'_>,
    provider: String,
    base_url: String,
    model: String,
    storage: String,
) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    keys::save_config(&conn, &provider, &base_url, &model, &storage)
}

/// 保存 Key（按存储方式落到钥匙串 / 数据库 / 仅内存），返回掩码
#[tauri::command]
fn ai_key_set(
    state: DbState<'_>,
    key_state: tauri::State<'_, keys::AiKeyState>,
    key: String,
    storage: String,
) -> Result<String, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    keys::save(&conn, &key_state, &key, &storage)?;
    Ok(keys::hint_text(&conn))
}

/// 清除所有已生成的分析结果（settings 里的 ai_analysis_* 缓存），返回清除条数。
/// 只删 AI 分析缓存，不碰账目数据、不碰 API Key。
#[tauri::command]
fn ai_clear_analyses(state: DbState<'_>) -> Result<usize, String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    service::delete_settings_by_prefix(&conn, "ai_analysis_")
}

#[tauri::command]
fn ai_key_clear(
    state: DbState<'_>,
    key_state: tauri::State<'_, keys::AiKeyState>,
) -> Result<(), String> {
    let conn = state.lock().map_err(|e| e.to_string())?;
    keys::clear(&conn, &key_state)
}

/// 生成月度消费分析。DB 锁必须在 await 之前释放，不能跨 await 持锁。
#[tauri::command]
async fn ai_analyze(
    state: DbState<'_>,
    key_state: tauri::State<'_, keys::AiKeyState>,
    month: String,
    stats: String,
) -> Result<ai::AiResponse, String> {
    let (api_key, cfg) = {
        let conn = state.lock().map_err(|e| e.to_string())?;
        (keys::resolve_key(&conn, &key_state)?, keys::read_config(&conn))
    };
    if cfg.needs_key() && api_key.is_none() {
        return Err("请先配置 API Key".into());
    }
    ai::analyze(
        api_key.as_deref().unwrap_or(""),
        &cfg.provider,
        &cfg.base_url,
        &cfg.model,
        &month,
        &stats,
    )
    .await
}

/// 设置页「测试连接」
#[tauri::command]
async fn ai_test_key(
    state: DbState<'_>,
    key_state: tauri::State<'_, keys::AiKeyState>,
) -> Result<String, String> {
    let (api_key, cfg) = {
        let conn = state.lock().map_err(|e| e.to_string())?;
        (keys::resolve_key(&conn, &key_state)?, keys::read_config(&conn))
    };
    if cfg.needs_key() && api_key.is_none() {
        return Err("请先填写 API Key".into());
    }
    ai::test_key(
        api_key.as_deref().unwrap_or(""),
        &cfg.provider,
        &cfg.base_url,
        &cfg.model,
    )
    .await
}

/// 读数据库文件字节，用于导出。
/// 导出的是副本：先把 AI 凭据剔除，避免备份文件把 API Key 带走。
/// 任何一步失败都退回原始字节，保证导出功能不受影响。
#[tauri::command]
fn read_db_bytes(app: tauri::AppHandle) -> Result<Vec<u8>, String> {
    let path = db_path(&app)?;
    let raw = std::fs::read(&path).map_err(|e| format!("读取数据库失败: {}", e))?;

    if let Ok(dir) = app.path().app_data_dir() {
        let tmp = dir.join("export-strip-tmp.sqlite");
        let _ = std::fs::remove_file(&tmp);
        if std::fs::write(&tmp, &raw).is_ok() {
            let stripped = (|| -> Result<Vec<u8>, String> {
                {
                    let conn = rusqlite::Connection::open(&tmp).map_err(|e| e.to_string())?;
                    conn.execute(
                        "DELETE FROM settings
                         WHERE key IN ('ai_api_key', 'deepseek_api_key', 'ai_key_hint')",
                        [],
                    )
                    .map_err(|e| e.to_string())?;
                }
                std::fs::read(&tmp).map_err(|e| e.to_string())
            })();
            let _ = std::fs::remove_file(&tmp);
            if let Ok(bytes) = stripped {
                return Ok(bytes);
            }
        }
    }
    Ok(raw)
}

/// 导入：把外部数据库文件的数据覆盖到当前库
#[tauri::command]
fn import_db_data(
    app: tauri::AppHandle,
    state: DbState<'_>,
    data: Vec<u8>,
) -> Result<usize, String> {
    // 1. 写到临时文件
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("无法定位数据目录: {}", e))?;
    let tmp = dir.join("import-tmp.sqlite");
    std::fs::write(&tmp, &data).map_err(|e| format!("写入临时文件失败: {}", e))?;

    let tmp_str = tmp.to_str().ok_or("临时文件路径无效")?.to_string();

    // 2. 打开当前连接
    let conn = state.lock().map_err(|e| e.to_string())?;

    // 3. ATTACH 导入文件
    if let Err(e) = conn.execute("ATTACH DATABASE ?1 AS import_db", [&tmp_str]) {
        let _ = std::fs::remove_file(&tmp);
        return Err(format!("无法打开导入文件（不是有效的 SQLite）: {}", e));
    }

    // 4. 检查 transactions 表是否存在
    let has_table: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM import_db.sqlite_master WHERE type='table' AND name='transactions'",
            [],
            |r| r.get(0),
        )
        .map_err(|e| {
            let _ = conn.execute("DETACH DATABASE import_db", []);
            let _ = std::fs::remove_file(&tmp);
            format!("查询表结构失败: {}", e)
        })?;

    if has_table == 0 {
        let _ = conn.execute("DETACH DATABASE import_db", []);
        let _ = std::fs::remove_file(&tmp);
        return Err("导入文件不是有效的记账本备份（找不到 transactions 表）".into());
    }

    // 5. 读取条数
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM import_db.transactions", [], |r| r.get(0))
        .map_err(|e| {
            let _ = conn.execute("DETACH DATABASE import_db", []);
            let _ = std::fs::remove_file(&tmp);
            format!("读取条数失败: {}", e)
        })?;

    // 备份里若带预算表，一并导入（兼容旧备份：没有该表就跳过）
    let has_budget: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM import_db.sqlite_master WHERE type='table' AND name='budgets'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    // 备份里若带常用项表，一并导入（兼容旧备份：没有该表就跳过）
    let has_tpl: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM import_db.sqlite_master WHERE type='table' AND name='templates'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    // 备份里若带分类表，一并导入。否则自定义分类的记录会全部退化成「其他」，
    // 统计页还会出现多行同名「其他」（见 list_categories 的兜底逻辑）。
    let has_cats: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM import_db.sqlite_master WHERE type='table' AND name='categories'",
            [],
            |r| r.get(0),
        )
        .unwrap_or(0);

    // 6. 覆盖数据（事务保证原子性）
    let tx = conn
        .unchecked_transaction()
        .map_err(|e| format!("开启事务失败: {}", e))?;

    tx.execute("DELETE FROM transactions", [])
        .map_err(|e| format!("清空旧数据失败: {}", e))?;
    tx.execute(
        "INSERT INTO transactions SELECT * FROM import_db.transactions",
        [],
    )
    .map_err(|e| format!("导入数据失败: {}", e))?;

    if has_budget > 0 {
        tx.execute("DELETE FROM budgets", [])
            .map_err(|e| format!("清空旧预算失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO budgets (month, amount_cents)
             SELECT month, amount_cents FROM import_db.budgets",
            [],
        )
        .map_err(|e| format!("导入预算失败: {}", e))?;
    }

    if has_tpl > 0 {
        tx.execute("DELETE FROM templates", [])
            .map_err(|e| format!("清空旧常用项失败: {}", e))?;
        tx.execute(
            "INSERT OR REPLACE INTO templates (id, type, amount_cents, category, note, created_at)
             SELECT id, type, amount_cents, category, note, created_at FROM import_db.templates",
            [],
        )
        .map_err(|e| format!("导入常用项失败: {}", e))?;
    }

    // 分类只做「合并」不做清空：备份里的分类覆盖同 id 的本地分类，
    // 本地多出来的分类留着不用即可，避免备份缺分类时把兜底分类「其他」也一起删掉。
    if has_cats > 0 {
        tx.execute(
            "INSERT OR REPLACE INTO categories (id, type, name, icon, color, sort, builtin)
             SELECT id, type, name, icon, color, sort, builtin FROM import_db.categories",
            [],
        )
        .map_err(|e| format!("导入分类失败: {}", e))?;
    }

    tx.commit().map_err(|e| format!("提交事务失败: {}", e))?;

    // 7. 清理
    let _ = conn.execute("DETACH DATABASE import_db", []);
    let _ = std::fs::remove_file(&tmp);

    Ok(count as usize)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // rustls 需要显式安装加密后端（用 ring，避免依赖 cmake / nasm / openssl）
            let _ = rustls::crypto::ring::default_provider().install_default();
            let dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("无法定位数据目录: {}", e))?;
            std::fs::create_dir_all(&dir)
                .map_err(|e| format!("无法创建数据目录: {}", e))?;
            let conn = db::open(&dir.join("ledger.sqlite"))
                .map_err(|e| format!("无法打开数据库: {}", e))?;
            // AI Key 内存态（「不保存」模式用它），并迁移早期版本的 deepseek_api_key
            let key_state = keys::AiKeyState::default();
            let _ = keys::migrate_legacy(&conn, &key_state);
            app.manage(key_state);
            app.manage(Mutex::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_all,
            add_tx,
            update_amount,
            update_date,
            delete_tx,
            clear_all_tx,
            update_category_batch,
            get_budget,
            set_budget,
            list_templates,
            add_template,
            update_template,
            delete_template,
            list_categories,
            add_category,
            update_category,
            category_usage,
            delete_category,
            reorder_categories,
            lock_status,
            lock_set_pin,
            lock_verify,
            lock_disable,
            get_setting,
            set_setting,
            delete_setting,
            ai_config_get,
            ai_config_set,
            ai_clear_analyses,
            ai_key_set,
            ai_key_clear,
            ai_analyze,
            ai_test_key,
            read_db_bytes,
            import_db_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}