use chrono::{Local, NaiveDate};
use rusqlite::{params, Connection, OptionalExtension};

use crate::models::{Category, Template, Transaction};

const EDIT_DATE_MAX_DAYS: i64 = 365;

/* ========== 金额 ========== */
fn parse_amount_to_cents(s: &str) -> Result<i64, String> {
    let s = s.trim();
    if s.is_empty() { return Err("金额不能为空".into()); }
    if s.starts_with('.') { return Err("金额不能以小数点开头".into()); }
    if s.matches('.').count() > 1 { return Err("只能有一个小数点".into()); }

    let s = s.strip_suffix('.').unwrap_or(s);
    let (int_part, dec_part) = match s.split_once('.') {
        Some((i, d)) => (i, d),
        None => (s, ""),
    };

    if int_part.is_empty() || !int_part.chars().all(|c| c.is_ascii_digit()) {
        return Err("整数部分必须是数字".into());
    }
    if !dec_part.chars().all(|c| c.is_ascii_digit()) {
        return Err("小数部分必须是数字".into());
    }
    if int_part.len() > 9 { return Err("整数位不能超过 9 位".into()); }
    if dec_part.len() > 2 { return Err("小数位不能超过 2 位".into()); }

    let int_val: i64 = int_part.parse().map_err(|_| "整数部分解析失败")?;
    let dec_val: i64 = match dec_part.len() {
        0 => 0,
        1 => dec_part.parse::<i64>().unwrap() * 10,
        _ => dec_part.parse::<i64>().unwrap(),
    };
    let cents = int_val * 100 + dec_val;
    if cents <= 0 { return Err("金额必须大于 0".into()); }
    Ok(cents)
}

fn cents_to_string(cents: i64) -> String {
    let sign = if cents < 0 { "-" } else { "" };
    let abs = cents.abs();
    format!("{}{}.{:02}", sign, abs / 100, abs % 100)
}

/* ========== 日期 & id ========== */
fn parse_date(s: &str) -> Result<NaiveDate, String> {
    NaiveDate::parse_from_str(s, "%Y-%m-%d").map_err(|_| "日期格式应为 YYYY-MM-DD".into())
}

fn today() -> NaiveDate {
    Local::now().date_naive()
}

fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}

fn gen_id() -> String {
    let ms = now_ms() as u64;
    let r = ms.wrapping_mul(6364136223846793005) ^ 0x9e3779b97f4a7c15;
    format!("{:x}{:08x}", ms, (r as u32))
}

/* ========== 分类校验 ========== */
/// 默认兜底分类 id（跨类型删除时转移记录用）
pub const FALLBACK_EXPENSE: &str = "other";
pub const FALLBACK_INCOME: &str = "other_in";

fn check_category(conn: &Connection, kind: &str, cat: &str) -> Result<(), String> {
    if kind != "expense" && kind != "income" {
        return Err("类型必须是 expense 或 income".into());
    }
    let exists: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM categories WHERE id = ?1 AND type = ?2",
            params![cat, kind],
            |r| r.get::<_, i64>(0),
        )
        .map(|n| n > 0)
        .unwrap_or(false);
    if !exists {
        return Err(format!("分类 {} 不属于 {}", cat, kind));
    }
    Ok(())
}

fn normalize_note(note: &str) -> Result<&str, String> {
    let note = note.trim();
    if note.chars().count() > 30 {
        return Err("备注不能超过 30 个字符".into());
    }
    Ok(note)
}

/* ========== CRUD ========== */
pub fn list_all(conn: &Connection) -> rusqlite::Result<Vec<Transaction>> {
    let mut stmt = conn.prepare(
        "SELECT id, type, amount_cents, category, note, date, created_at
         FROM transactions
         ORDER BY date DESC, created_at DESC",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(Transaction {
            id: row.get(0)?,
            tx_type: row.get(1)?,
            amount: cents_to_string(row.get(2)?),
            category: row.get(3)?,
            note: row.get(4)?,
            date: row.get(5)?,
            created_at: row.get(6)?,
        })
    })?;
    rows.collect()
}

pub fn add(
    conn: &Connection,
    tx_type: &str,
    amount: &str,
    category: &str,
    note: &str,
    date: &str,
) -> Result<Transaction, String> {
    check_category(conn, tx_type, category)?;
    let cents = parse_amount_to_cents(amount)?;
    let d = parse_date(date)?;

    let note = normalize_note(note)?;

    let tx = Transaction {
        id: gen_id(),
        tx_type: tx_type.into(),
        amount: cents_to_string(cents),
        category: category.into(),
        note: note.into(),
        date: d.format("%Y-%m-%d").to_string(),
        created_at: now_ms(),
    };

    conn.execute(
        "INSERT INTO transactions (id, type, amount_cents, category, note, date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            tx.id, tx.tx_type, cents, tx.category, tx.note, tx.date, tx.created_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(tx)
}

pub fn update_amount(conn: &Connection, id: &str, amount: &str) -> Result<Transaction, String> {
    let cents = parse_amount_to_cents(amount)?;
    let changed = conn
        .execute(
            "UPDATE transactions SET amount_cents = ?1 WHERE id = ?2",
            params![cents, id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 { return Err(format!("记录不存在: {}", id)); }
    get(conn, id).map_err(|e| e.to_string())?.ok_or_else(|| "记录不存在".into())
}

pub fn update_date(conn: &Connection, id: &str, date: &str) -> Result<Transaction, String> {
    let d = parse_date(date)?;
    let diff = (d - today()).num_days().abs();
    if diff > EDIT_DATE_MAX_DAYS {
        return Err(format!("日期必须在今天前后 {} 天内", EDIT_DATE_MAX_DAYS));
    }
    let changed = conn
        .execute(
            "UPDATE transactions SET date = ?1 WHERE id = ?2",
            params![d.format("%Y-%m-%d").to_string(), id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 { return Err(format!("记录不存在: {}", id)); }
    get(conn, id).map_err(|e| e.to_string())?.ok_or_else(|| "记录不存在".into())
}

pub fn delete(conn: &Connection, id: &str) -> Result<bool, String> {
    let changed = conn
        .execute("DELETE FROM transactions WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(changed > 0)
}

pub fn clear_all(conn: &Connection) -> Result<usize, String> {
    conn.execute("DELETE FROM transactions", [])
        .map_err(|e| e.to_string())
}

/// 批量把选中记录的分类改成同一个（分类只是标签，不改收支方向）
pub fn update_category_batch(
    conn: &Connection,
    ids: &[String],
    category: &str,
) -> Result<usize, String> {
    if ids.is_empty() {
        return Err("没有选中的记录".into());
    }
    let valid: bool = conn
        .query_row(
            "SELECT COUNT(*) FROM categories WHERE id = ?1",
            params![category],
            |r| r.get::<_, i64>(0),
        )
        .map(|n| n > 0)
        .unwrap_or(false);
    if !valid {
        return Err(format!("未知分类: {}", category));
    }

    let placeholders = vec!["?"; ids.len()].join(",");
    let sql = format!(
        "UPDATE transactions SET category = ?1 WHERE id IN ({})",
        placeholders
    );

    let mut values: Vec<&dyn rusqlite::ToSql> = Vec::with_capacity(ids.len() + 1);
    values.push(&category);
    for id in ids {
        values.push(id);
    }

    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    let changed = tx
        .execute(&sql, rusqlite::params_from_iter(values.iter().copied()))
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;

    Ok(changed)
}

/* ========== 月度预算 ========== */

/// 读取某月预算（返回「元」；未设置返回 None）
pub fn get_budget(conn: &Connection, month: &str) -> Result<Option<f64>, String> {
    let cents: Option<i64> = conn
        .query_row(
            "SELECT amount_cents FROM budgets WHERE month = ?1",
            params![month],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(cents.map(|c| c as f64 / 100.0))
}

/// 设置某月预算；amount 为 None 或非正数表示清除该月预算
pub fn set_budget(conn: &Connection, month: &str, amount: Option<f64>) -> Result<(), String> {
    let cents = match amount {
        Some(a) if a.is_finite() && a > 0.0 => (a * 100.0).round() as i64,
        _ => 0,
    };
    if cents > 0 {
        conn.execute(
            "INSERT INTO budgets (month, amount_cents) VALUES (?1, ?2)
             ON CONFLICT(month) DO UPDATE SET amount_cents = excluded.amount_cents",
            params![month, cents],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute("DELETE FROM budgets WHERE month = ?1", params![month])
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/* ========== 快捷记账模板 ========== */

const MAX_TEMPLATES: i64 = 6;

/// 模板行映射
fn map_template(row: &rusqlite::Row<'_>) -> rusqlite::Result<Template> {
    Ok(Template {
        id: row.get(0)?,
        tx_type: row.get(1)?,
        amount: cents_to_string(row.get(2)?),
        category: row.get(3)?,
        note: row.get(4)?,
        created_at: row.get(5)?,
    })
}

fn get_template(conn: &Connection, id: &str) -> rusqlite::Result<Option<Template>> {
    conn.query_row(
        "SELECT id, type, amount_cents, category, note, created_at
         FROM templates WHERE id = ?1",
        params![id],
        map_template,
    )
    .optional()
}

pub fn list_templates(conn: &Connection) -> rusqlite::Result<Vec<Template>> {
    let mut stmt = conn.prepare(
        "SELECT id, type, amount_cents, category, note, created_at
         FROM templates ORDER BY created_at ASC, id ASC",
    )?;
    let rows = stmt.query_map([], map_template)?;
    rows.collect()
}

/// 收藏一笔为常用项；同一「类型 + 金额 + 分类 + 备注」已存在时直接返回原有那条
pub fn add_template(
    conn: &Connection,
    tx_type: &str,
    amount: &str,
    category: &str,
    note: &str,
) -> Result<Template, String> {
    check_category(conn, tx_type, category)?;
    let cents = parse_amount_to_cents(amount)?;
    let note = normalize_note(note)?;

    let existing = conn
        .query_row(
            "SELECT id, type, amount_cents, category, note, created_at
             FROM templates
             WHERE type = ?1 AND amount_cents = ?2 AND category = ?3 AND note = ?4",
            params![tx_type, cents, category, note],
            map_template,
        )
        .optional()
        .map_err(|e| e.to_string())?;
    if let Some(t) = existing {
        return Ok(t);
    }

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM templates", [], |r| r.get(0))
        .map_err(|e| e.to_string())?;
    if count >= MAX_TEMPLATES {
        return Err(format!("常用项最多 {} 个，先删掉一个吧", MAX_TEMPLATES));
    }

    let t = Template {
        id: gen_id(),
        tx_type: tx_type.into(),
        amount: cents_to_string(cents),
        category: category.into(),
        note: note.into(),
        created_at: now_ms(),
    };
    conn.execute(
        "INSERT INTO templates (id, type, amount_cents, category, note, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![t.id, t.tx_type, cents, t.category, t.note, t.created_at],
    )
    .map_err(|e| e.to_string())?;
    Ok(t)
}

pub fn update_template(
    conn: &Connection,
    id: &str,
    tx_type: &str,
    amount: &str,
    category: &str,
    note: &str,
) -> Result<Template, String> {
    check_category(conn, tx_type, category)?;
    let cents = parse_amount_to_cents(amount)?;
    let note = normalize_note(note)?;

    // 改完不能和另一条常用项完全重复
    let dup: Option<String> = conn
        .query_row(
            "SELECT id FROM templates
             WHERE type = ?1 AND amount_cents = ?2 AND category = ?3 AND note = ?4 AND id <> ?5",
            params![tx_type, cents, category, note, id],
            |row| row.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    if dup.is_some() {
        return Err("已存在同样的常用项".into());
    }

    let changed = conn
        .execute(
            "UPDATE templates SET type = ?1, amount_cents = ?2, category = ?3, note = ?4
             WHERE id = ?5",
            params![tx_type, cents, category, note, id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err("常用项不存在".into());
    }
    get_template(conn, id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "常用项不存在".into())
}

pub fn delete_template(conn: &Connection, id: &str) -> Result<bool, String> {
    let changed = conn
        .execute("DELETE FROM templates WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(changed > 0)
}

fn get(conn: &Connection, id: &str) -> rusqlite::Result<Option<Transaction>> {
    conn.query_row(
        "SELECT id, type, amount_cents, category, note, date, created_at
         FROM transactions WHERE id = ?1",
        params![id],
        |row| {
            Ok(Transaction {
                id: row.get(0)?,
                tx_type: row.get(1)?,
                amount: cents_to_string(row.get(2)?),
                category: row.get(3)?,
                note: row.get(4)?,
                date: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    )
    .optional()
}

/* ========== 分类管理 ========== */
fn map_category(row: &rusqlite::Row) -> rusqlite::Result<Category> {
    Ok(Category {
        id: row.get(0)?,
        cat_type: row.get(1)?,
        name: row.get(2)?,
        icon: row.get(3)?,
        color: row.get(4)?,
        sort: row.get(5)?,
        builtin: row.get::<_, i64>(6)? > 0,
    })
}

/// 全量返回分类，按 type 分组、sort 升序
pub fn list_categories(conn: &Connection) -> Result<Vec<Category>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, type, name, icon, color, sort, builtin
             FROM categories ORDER BY type, sort ASC, id ASC",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], map_category)
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

/// 校验分类参数（名字/图标/颜色），归一化名字
fn validate_cat_fields(kind: &str, name: &str, icon: &str, color: &str) -> Result<String, String> {
    if kind != "expense" && kind != "income" {
        return Err("类型必须是 expense 或 income".into());
    }
    let name = name.trim();
    if name.is_empty() {
        return Err("分类名不能为空".into());
    }
    if name.chars().count() > 8 {
        return Err("分类名不能超过 8 个字符".into());
    }
    if !icon.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err("图标无效".into());
    }
    if !color.starts_with('#') || color.len() != 7 {
        return Err("颜色必须为 #RRGGBB".into());
    }
    Ok(name.into())
}

pub fn add_category(
    conn: &Connection,
    kind: &str,
    name: &str,
    icon: &str,
    color: &str,
) -> Result<Category, String> {
    let name = validate_cat_fields(kind, name, icon, color)?;
    // 生成唯一 id，若撞车则重试
    let mut id = gen_id();
    let mut guard = 0;
    loop {
        let dup: bool = conn
            .query_row("SELECT COUNT(*) FROM categories WHERE id = ?1", params![id], |r| r.get::<_, i64>(0))
            .map(|n| n > 0)
            .unwrap_or(false);
        if !dup { break; }
        if guard > 3 { return Err("生成分类 id 失败".into()); }
        guard += 1;
        id = gen_id();
    }
    let sort: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(sort), 0) + 1 FROM categories WHERE type = ?1",
            params![kind],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO categories (id, type, name, icon, color, sort, builtin)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0)",
        params![id, kind, name, icon, color, sort],
    )
    .map_err(|e| e.to_string())?;
    Ok(Category { id, cat_type: kind.into(), name, icon: icon.into(), color: color.into(), sort, builtin: false })
}

pub fn update_category(
    conn: &Connection,
    id: &str,
    name: &str,
    icon: &str,
    color: &str,
) -> Result<Category, String> {
    let kind: String = conn
        .query_row("SELECT type FROM categories WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|_| "分类不存在".to_string())?;
    let name = validate_cat_fields(&kind, name, icon, color)?;
    let changed = conn
        .execute(
            "UPDATE categories SET name = ?1, icon = ?2, color = ?3 WHERE id = ?4",
            params![name, icon, color, id],
        )
        .map_err(|e| e.to_string())?;
    if changed == 0 {
        return Err("分类不存在".into());
    }
    // 读回最新 sort/type/builtin
    let cat = conn
        .query_row(
            "SELECT id, type, name, icon, color, sort, builtin FROM categories WHERE id = ?1",
            params![id],
            map_category,
        )
        .map_err(|e| e.to_string())?;
    Ok(cat)
}

/// 删除保护：返回该分类当前被几条记录引用
pub fn category_usage(conn: &Connection, id: &str) -> Result<usize, String> {
    let n: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM transactions WHERE category = ?1",
            params![id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;
    Ok(n as usize)
}

/// 删除分类（可先把引用记录转移到兜底分类，fallback 为 None 时直接删）
/// 返回被转移/影响的记录数。
pub fn delete_category(
    conn: &Connection,
    id: &str,
    fallback: Option<&str>,
) -> Result<usize, String> {
    // 兜底分类自身不能被删除
    let cat_type: Option<String> = conn
        .query_row("SELECT type FROM categories WHERE id = ?1", params![id], |r| r.get(0))
        .optional()
        .map_err(|e| e.to_string())?;
    let cat_type = match cat_type {
        Some(t) => t,
        None => return Err("分类不存在".into()),
    };
    let fb = if cat_type == "expense" { FALLBACK_EXPENSE } else { FALLBACK_INCOME };
    if id == fb {
        return Err("默认「其他」分类不能删除".into());
    }

    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    let affected = match fallback {
        Some(fb_id) if fb_id != id => tx
            .execute(
                "UPDATE transactions SET category = ?1 WHERE category = ?2",
                params![fb_id, id],
            )
            .map_err(|e| e.to_string())?,
        _ => 0,
    };
    tx.execute("DELETE FROM categories WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    tx.commit().map_err(|e| e.to_string())?;
    Ok(affected as usize)
}

/// 按传入顺序重排某类型内的分类（ids 按新顺序排列）
pub fn reorder_categories(conn: &Connection, ids: &[String]) -> Result<(), String> {
    let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
    for (i, id) in ids.iter().enumerate() {
        tx.execute(
            "UPDATE categories SET sort = ?1 WHERE id = ?2",
            params![i as i64, id],
        )
        .map_err(|e| e.to_string())?;
    }
    tx.commit().map_err(|e| e.to_string())?;
    Ok(())
}

/* ========== 设置（settings 键值表） ========== */

/// 读取一个设置项；不存在返回 None
pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>, String> {
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |r| r.get::<_, String>(0),
    )
    .optional()
    .map_err(|e| format!("读取设置失败: {}", e))
}

/// 写入 / 覆盖一个设置项
pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )
    .map_err(|e| format!("保存设置失败: {}", e))?;
    Ok(())
}

/// 删除一个设置项（如清除 API Key / 清除缓存分析）
pub fn delete_setting(conn: &Connection, key: &str) -> Result<bool, String> {
    let n = conn
        .execute("DELETE FROM settings WHERE key = ?1", params![key])
        .map_err(|e| format!("删除设置失败: {}", e))?;
    Ok(n > 0)
}