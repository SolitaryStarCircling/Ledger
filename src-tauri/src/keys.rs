use rusqlite::Connection;
use serde::Serialize;
use std::sync::Mutex;

use crate::ai;
use crate::service;

/* ========== 存储方式 ========== */

pub const STORAGE_KEYRING: &str = "keyring";
pub const STORAGE_DB: &str = "db";
pub const STORAGE_NONE: &str = "none";

/// 系统钥匙串里的条目名（仅 Windows / macOS 使用）
#[cfg(any(target_os = "windows", target_os = "macos"))]
const SERVICE: &str = "com.tauri-app.ledger.ai";
#[cfg(any(target_os = "windows", target_os = "macos"))]
const ACCOUNT: &str = "api-key";

const DB_KEY: &str = "ai_api_key";
const LEGACY_DB_KEY: &str = "deepseek_api_key";
const HINT_KEY: &str = "ai_key_hint";

/// 「不保存」模式下，Key 只存在于本次运行的进程内存里，退出即消失
#[derive(Default)]
pub struct AiKeyState {
    pub session: Mutex<Option<String>>,
}

/* ========== 系统钥匙串（Windows 凭据管理器 / macOS 钥匙串） ========== */

#[cfg(any(target_os = "windows", target_os = "macos"))]
mod os_store {
    use super::{ACCOUNT, SERVICE};

    fn entry() -> Result<keyring::Entry, String> {
        keyring::Entry::new(SERVICE, ACCOUNT).map_err(|e| format!("无法访问系统钥匙串：{}", e))
    }

    pub fn set(key: &str) -> Result<(), String> {
        entry()?
            .set_password(key)
            .map_err(|e| format!("写入系统钥匙串失败：{}", e))
    }

    pub fn get() -> Result<Option<String>, String> {
        match entry()?.get_password() {
            Ok(v) => Ok(Some(v)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(format!("读取系统钥匙串失败：{}", e)),
        }
    }

    pub fn clear() -> Result<(), String> {
        match entry()?.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(format!("删除系统钥匙串条目失败：{}", e)),
        }
    }
}

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
mod os_store {
    pub fn set(_key: &str) -> Result<(), String> {
        Err("当前平台不支持系统钥匙串，请改用「保存在本机数据库」".to_string())
    }
    pub fn get() -> Result<Option<String>, String> {
        Ok(None)
    }
    pub fn clear() -> Result<(), String> {
        Ok(())
    }
}

pub fn keyring_available() -> bool {
    cfg!(any(target_os = "windows", target_os = "macos"))
}

/* ========== 掩码 ========== */

/// 只保留前 3 后 4 位，用于界面回显
pub fn mask(key: &str) -> String {
    let k = key.trim();
    let n = k.chars().count();
    if n == 0 {
        return String::new();
    }
    if n <= 8 {
        return "••••".to_string();
    }
    let head: String = k.chars().take(3).collect();
    let tail: String = k.chars().skip(n - 4).collect();
    format!("{}••••{}", head, tail)
}

/* ========== 配置读写 ========== */

#[derive(Clone, Debug)]
pub struct AiConfig {
    pub provider: String,
    pub base_url: String,
    pub model: String,
    pub storage: String,
}

impl AiConfig {
    /// 本地/内网地址不需要 Key
    pub fn needs_key(&self) -> bool {
        !ai::is_local_base(&self.base_url)
    }
}

#[derive(Serialize, Clone, Debug)]
pub struct AiConfigView {
    pub provider: String,
    #[serde(rename = "baseUrl")]
    pub base_url: String,
    pub model: String,
    pub storage: String,
    #[serde(rename = "keyHint")]
    pub key_hint: String,
    #[serde(rename = "hasKey")]
    pub has_key: bool,
    #[serde(rename = "keyringAvailable")]
    pub keyring_available: bool,
    #[serde(rename = "isLocal")]
    pub is_local: bool,
    #[serde(rename = "needsKey")]
    pub needs_key: bool,
}

fn setting(conn: &Connection, key: &str, fallback: &str) -> String {
    service::get_setting(conn, key)
        .ok()
        .flatten()
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| fallback.to_string())
}

pub fn storage_mode(conn: &Connection) -> String {
    let fallback = if keyring_available() { STORAGE_KEYRING } else { STORAGE_DB };
    let mode = setting(conn, "ai_key_storage", fallback);
    match mode.as_str() {
        STORAGE_DB => STORAGE_DB.to_string(),
        STORAGE_NONE => STORAGE_NONE.to_string(),
        STORAGE_KEYRING if keyring_available() => STORAGE_KEYRING.to_string(),
        _ => fallback.to_string(),
    }
}

pub fn read_config(conn: &Connection) -> AiConfig {
    AiConfig {
        provider: setting(conn, "ai_provider", ai::DEFAULT_PROVIDER),
        base_url: setting(conn, "ai_base_url", ai::DEFAULT_BASE_URL),
        model: setting(conn, "ai_model", ai::DEFAULT_MODEL),
        storage: storage_mode(conn),
    }
}

pub fn save_config(
    conn: &Connection,
    provider: &str,
    base_url: &str,
    model: &str,
    storage: &str,
) -> Result<(), String> {
    let base = base_url.trim();
    if !(base.starts_with("http://") || base.starts_with("https://")) {
        return Err("接口地址需要以 http:// 或 https:// 开头".to_string());
    }
    let m = model.trim();
    if m.is_empty() {
        return Err("模型名不能为空".to_string());
    }
    if storage == STORAGE_KEYRING && !keyring_available() {
        return Err("当前平台不支持系统钥匙串".to_string());
    }
    service::set_setting(conn, "ai_provider", provider.trim())?;
    service::set_setting(conn, "ai_base_url", base)?;
    service::set_setting(conn, "ai_model", m)?;
    service::set_setting(conn, "ai_key_storage", storage)?;
    Ok(())
}

/* ========== Key 读写 ========== */

pub fn resolve_key(conn: &Connection, state: &AiKeyState) -> Result<Option<String>, String> {
    let mode = storage_mode(conn);
    let key = match mode.as_str() {
        STORAGE_NONE => state.session.lock().map_err(|e| e.to_string())?.clone(),
        STORAGE_DB => service::get_setting(conn, DB_KEY)?,
        _ => match os_store::get() {
            Ok(v) => v,
            // 钥匙串读失败（被清理/权限问题）时不死循环：回退数据库
            Err(_) => service::get_setting(conn, DB_KEY)?,
        },
    };
    let key = key.map(|k| k.trim().to_string()).filter(|k| !k.is_empty());
    if key.is_some() {
        return Ok(key);
    }
    // 兼容早期版本：deepseek_api_key
    Ok(service::get_setting(conn, LEGACY_DB_KEY)?
        .map(|k| k.trim().to_string())
        .filter(|k| !k.is_empty()))
}

pub fn save(conn: &Connection, state: &AiKeyState, key: &str, storage: &str) -> Result<(), String> {
    let key = key.trim();
    if key.is_empty() {
        return Err("API Key 不能为空".to_string());
    }
    if storage == STORAGE_KEYRING && !keyring_available() {
        return Err("当前平台不支持系统钥匙串".to_string());
    }
    // 先清干净所有位置，避免换存储方式后残留旧副本
    clear(conn, state)?;
    service::set_setting(conn, "ai_key_storage", storage)?;
    match storage {
        STORAGE_NONE => {
            *state.session.lock().map_err(|e| e.to_string())? = Some(key.to_string());
        }
        STORAGE_DB => {
            service::set_setting(conn, DB_KEY, key)?;
        }
        _ => {
            os_store::set(key)?;
        }
    }
    service::set_setting(conn, HINT_KEY, &mask(key))?;
    Ok(())
}

pub fn clear(conn: &Connection, state: &AiKeyState) -> Result<(), String> {
    *state.session.lock().map_err(|e| e.to_string())? = None;
    let _ = os_store::clear();
    let _ = service::delete_setting(conn, DB_KEY);
    let _ = service::delete_setting(conn, LEGACY_DB_KEY);
    let _ = service::delete_setting(conn, HINT_KEY);
    Ok(())
}

pub fn hint_text(conn: &Connection) -> String {
    service::get_setting(conn, HINT_KEY).ok().flatten().unwrap_or_default()
}

pub fn view(conn: &Connection, state: &AiKeyState) -> Result<AiConfigView, String> {
    let cfg = read_config(conn);
    let has_key = resolve_key(conn, state)?.is_some();
    let hint = {
        let stored = service::get_setting(conn, HINT_KEY).ok().flatten().unwrap_or_default();
        if stored.trim().is_empty() && has_key {
            // 历史遗留下来的 Key 没有掩码，补一个
            let k = resolve_key(conn, state)?.unwrap_or_default();
            let m = mask(&k);
            let _ = service::set_setting(conn, HINT_KEY, &m);
            m
        } else {
            stored
        }
    };
    Ok(AiConfigView {
        provider: cfg.provider.clone(),
        base_url: cfg.base_url.clone(),
        model: cfg.model.clone(),
        storage: cfg.storage.clone(),
        key_hint: hint,
        has_key,
        keyring_available: keyring_available(),
        is_local: ai::is_local_base(&cfg.base_url),
        needs_key: cfg.needs_key(),
    })
}

/// 启动时把早期版本的 deepseek_api_key 迁到当前存储方式
pub fn migrate_legacy(conn: &Connection, state: &AiKeyState) -> Result<(), String> {
    if let Some(old) = service::get_setting(conn, LEGACY_DB_KEY)? {
        let old = old.trim().to_string();
        if !old.is_empty() {
            let mode = storage_mode(conn);
            let target = if mode == STORAGE_NONE { STORAGE_DB } else { mode.as_str() };
            let _ = save(conn, state, &old, target);
        }
        let _ = service::delete_setting(conn, LEGACY_DB_KEY);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn masks_key_without_leaking_middle() {
        assert_eq!(mask("sk-1234567890abcd"), "sk-••••abcd");
        assert_eq!(mask("short"), "••••");
        assert_eq!(mask(""), "");
    }

    fn mem() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);")
            .unwrap();
        conn
    }

    #[test]
    fn defaults_db_storage_roundtrip() {
        let conn = mem();
        let state = AiKeyState::default();
        let cfg = read_config(&conn);
        assert_eq!(cfg.provider, ai::DEFAULT_PROVIDER);
        assert_eq!(cfg.base_url, ai::DEFAULT_BASE_URL);
        assert_eq!(cfg.model, ai::DEFAULT_MODEL);
        assert!(cfg.needs_key());

        save(&conn, &state, "sk-1234567890abcd", STORAGE_DB).unwrap();
        assert_eq!(resolve_key(&conn, &state).unwrap().unwrap(), "sk-1234567890abcd");
        let v = view(&conn, &state).unwrap();
        assert!(v.has_key && v.key_hint == "sk-••••abcd");
        assert_eq!(v.storage, STORAGE_DB);

        clear(&conn, &state).unwrap();
        assert!(resolve_key(&conn, &state).unwrap().is_none());
        assert!(!view(&conn, &state).unwrap().has_key);
    }

    #[test]
    fn local_base_needs_no_key_and_bad_base_rejected() {
        let conn = mem();
        save_config(&conn, "ollama", "http://localhost:11434/v1", "qwen2.5:7b", STORAGE_DB).unwrap();
        let cfg = read_config(&conn);
        assert!(ai::is_local_base(&cfg.base_url));
        assert!(!cfg.needs_key());
        assert!(save_config(&conn, "x", "localhost:1234", "m", STORAGE_DB).is_err());
        assert!(save_config(&conn, "x", "https://a.com", "  ", STORAGE_DB).is_err());
    }
}
