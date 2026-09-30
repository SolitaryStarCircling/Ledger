use rusqlite::{params, Connection, Result};
use std::path::Path;

pub fn open(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;

    // 判断 templates 表是否为本机首次创建：只在这一次写入默认常用项，之后删掉不再生成
    let templates_fresh: bool = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='templates'",
        [],
        |r| r.get::<_, i64>(0),
    )? == 0;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS transactions (
            id           TEXT PRIMARY KEY,
            type         TEXT NOT NULL CHECK (type IN ('expense','income')),
            amount_cents INTEGER NOT NULL,
            category     TEXT NOT NULL,
            note         TEXT NOT NULL,
            date         TEXT NOT NULL,
            created_at   INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date);
        CREATE TABLE IF NOT EXISTS budgets (
            month        TEXT PRIMARY KEY,
            amount_cents INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS templates (
            id           TEXT PRIMARY KEY,
            type         TEXT NOT NULL CHECK (type IN ('expense','income')),
            amount_cents INTEGER NOT NULL,
            category     TEXT NOT NULL,
            note         TEXT NOT NULL,
            created_at   INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS categories (
            id      TEXT PRIMARY KEY,
            type    TEXT NOT NULL CHECK (type IN ('expense','income')),
            name    TEXT NOT NULL,
            icon    TEXT NOT NULL,
            color   TEXT NOT NULL,
            sort    INTEGER NOT NULL,
            builtin INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );"
    )?;

    // 分类表首次为空时，写入预置分类（id 沿用历史值，保证旧记录兼容）
    let cats_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM categories",
        [],
        |r| r.get::<_, i64>(0),
    )?;
    if cats_count == 0 {
        seed_categories(&conn)?;
    }

    if templates_fresh {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0);
        conn.execute(
            "INSERT INTO templates (id, type, amount_cents, category, note, created_at)
             VALUES ('tpl-meal', 'expense', 2000, 'food', '吃饭', ?1),
                    ('tpl-metro', 'expense', 500, 'transport', '地铁', ?1)",
            [now],
        )?;
    }

    Ok(conn)
}

/// 预置分类种子。id 沿用历史硬编码值，保证旧交易记录 100% 兼容。
/// 图标为前端图标 key，颜色为预设色板 key。
fn seed_categories(conn: &Connection) -> Result<()> {
    let seed: [(&str, &str, &str, &str, &str, i64); 13] = [
        // id, type, name, icon, color, sort
        ("food",      "expense", "吃喝", "utensils",      "#FF9500", 1),
        ("transport", "expense", "交通", "bus",           "#007AFF", 2),
        ("shopping",  "expense", "购物", "shopping-cart", "#FF3B30", 3),
        ("entertain", "expense", "娱乐", "gamepad-2",     "#AF52DE", 4),
        ("home",      "expense", "居住", "home",          "#5856D6", 5),
        ("medical",   "expense", "医疗", "pill",          "#FF2D55", 6),
        ("study",     "expense", "学习", "book-open",     "#34C759", 7),
        ("other",     "expense", "其他", "grid",          "#8E8E93", 8),
        ("salary",    "income",  "工资", "wallet",        "#00C7BE", 1),
        ("bonus",     "income",  "奖金", "gift",          "#FF9500", 2),
        ("invest",    "income",  "理财", "sparkles",      "#5856D6", 3),
        ("redpack",   "income",  "红包", "shopping-bag",  "#FF3B30", 4),
        ("other_in",  "income",  "其他", "grid",          "#8E8E93", 5),
    ];
    for (id, ty, name, icon, color, sort) in seed {
        conn.execute(
            "INSERT OR IGNORE INTO categories (id, type, name, icon, color, sort, builtin)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)",
            params![id, ty, name, icon, color, sort],
        )?;
    }
    Ok(())
}