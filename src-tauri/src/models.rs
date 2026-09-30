use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Template {
    pub id: String,
    #[serde(rename = "type")]
    pub tx_type: String,       // "expense" | "income"
    pub amount: String,        // "12.34"
    pub category: String,
    pub note: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,       // 毫秒时间戳
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Transaction {
    pub id: String,
    #[serde(rename = "type")]
    pub tx_type: String,       // "expense" | "income"
    pub amount: String,        // "12.34"（字符串，避免浮点）
    pub category: String,
    pub note: String,
    pub date: String,          // "YYYY-MM-DD"
    #[serde(rename = "createdAt")]
    pub created_at: i64,       // 毫秒时间戳
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Category {
    pub id: String,
    #[serde(rename = "type")]
    pub cat_type: String,      // "expense" | "income"
    pub name: String,
    pub icon: String,          // 图标 key（前端映射到 SVG）
    pub color: String,         // 色板 key（如 "#FF9500"）
    pub sort: i64,
    pub builtin: bool,
}