//! 应用锁：本地 PIN 加密保护。
//!
//! PIN 用 Argon2id 哈希（PHC 字符串）存入 settings 表，只在本地校验，不联网。
//! 作用是「防止他人在你这台设备上误看账目」，并不加密磁盘上的数据库文件本身
//! （若要磁盘加密，属于另一层能力，本功能不越界实现）。
//!
//! 状态以两个 settings 键表达：
//!   - `lock_enabled` = "1"/"0"
//!   - `lock_pin_hash` = Argon2id PHC 哈希（未设置时为 None）

use argon2::password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use rusqlite::Connection;

use crate::service;

const KEY_ENABLED: &str = "lock_enabled";
const KEY_HASH: &str = "lock_pin_hash";

#[derive(serde::Serialize)]
pub struct LockStatus {
    pub enabled: bool,
}

/// 校验 PIN 格式：仅数字，4-8 位
fn validate_pin(pin: &str) -> Result<(), String> {
    let len = pin.chars().count();
    if !(4..=8).contains(&len) {
        return Err("密码需为 4-8 位数字".into());
    }
    if !pin.chars().all(|c| c.is_ascii_digit()) {
        return Err("密码只能包含数字".into());
    }
    Ok(())
}

fn hash_pin(pin: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(pin.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| format!("生成 PIN 哈希失败: {}", e))
}

fn verify_pin(pin: &str, hash: &str) -> bool {
    let Ok(parsed) = PasswordHash::new(hash) else {
        return false;
    };
    Argon2::default()
        .verify_password(pin.as_bytes(), &parsed)
        .is_ok()
}

/// 当前是否启用锁定（须同时满足 enabled 与已存哈希）
pub fn status(conn: &Connection) -> Result<LockStatus, String> {
    let enabled = service::get_setting(conn, KEY_ENABLED)?.as_deref() == Some("1")
        && service::get_setting(conn, KEY_HASH)?.is_some();
    Ok(LockStatus { enabled })
}

/// 设置 / 修改 PIN，并自动启用锁定
pub fn set_pin(conn: &Connection, pin: &str) -> Result<(), String> {
    validate_pin(pin)?;
    let hash = hash_pin(pin)?;
    service::set_setting(conn, KEY_HASH, &hash)?;
    service::set_setting(conn, KEY_ENABLED, "1")?;
    Ok(())
}

/// 校验 PIN。未启用锁定（未设置哈希）时一律放行，避免「无锁反而进不去」
pub fn verify(conn: &Connection, pin: &str) -> Result<bool, String> {
    let Some(hash) = service::get_setting(conn, KEY_HASH)? else {
        return Ok(true);
    };
    Ok(verify_pin(pin, &hash))
}

/// 关闭锁定并清除 PIN 哈希
pub fn disable(conn: &Connection) -> Result<(), String> {
    service::set_setting(conn, KEY_ENABLED, "0")?;
    let _ = service::delete_setting(conn, KEY_HASH);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mem_settings() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);")
            .unwrap();
        conn
    }

    #[test]
    fn pin_hash_roundtrip() {
        let conn = mem_settings();
        set_pin(&conn, "1234").unwrap();

        assert!(status(&conn).unwrap().enabled, "设置 PIN 后应启用锁定");
        assert!(verify(&conn, "1234").unwrap(), "正确 PIN 应通过");
        assert!(!verify(&conn, "0000").unwrap(), "错误 PIN 应拒绝");

        disable(&conn).unwrap();
        assert!(!status(&conn).unwrap().enabled, "关闭后应不再锁定");
        assert!(verify(&conn, "任意").unwrap(), "关闭后一律放行");
    }

    #[test]
    fn pin_format_rules() {
        let conn = mem_settings();
        assert!(set_pin(&conn, "123").is_err(), "少于 4 位应拒绝");
        assert!(set_pin(&conn, "123456789").is_err(), "多于 8 位应拒绝");
        assert!(set_pin(&conn, "1a34").is_err(), "含非数字应拒绝");
        assert!(set_pin(&conn, "1234").is_ok(), "合法 PIN 应接受");
    }
}