use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};
use std::time::Duration;

/* ========== 默认值（预设清单由前端维护，Rust 只当参数收） ========== */

pub const DEFAULT_PROVIDER: &str = "deepseek";
pub const DEFAULT_BASE_URL: &str = "https://api.deepseek.com";
pub const DEFAULT_MODEL: &str = "deepseek-flash";

const CLOUD_TIMEOUT_SECS: u64 = 45;
const LOCAL_TIMEOUT_SECS: u64 = 120;
const MAX_TOKENS: u32 = 2000;

/// 系统提示词：必须出现 "json" 字样并给出示例（OpenAI 兼容的 JSON Output 要求）
const SYSTEM_PROMPT: &str = r#"你是一名中文个人记账分析助手。用户会提供其月度账单的统计数据 JSON（金额单位：元）。
请基于这些数据输出一段专业、克制、可执行的消费分析。

要求：
1. 只输出 json，不要输出任何解释文字，不要使用 markdown 代码块。
2. 字段结构必须为：
{"summary":"本月花费结构总结，120 字以内","categories":[{"name":"分类名","amount":2860.0,"share":33.9,"verdict":"正常","comment":"一句话点评"}],"advice":["具体省钱建议"]}
3. summary 用中文一句话概括花费结构（主要花在哪、与上月相比的趋势）。
4. categories 覆盖输入中主要支出分类（最多 8 个），amount 与 share 直接引用输入数字，verdict 只能是「正常」「偏高」「异常」之一，comment 用一句话解释原因。
5. advice 给 3 到 5 条具体建议，必须结合输入中的具体分类、备注或异常项，给出可执行的下一步；不要泛泛而谈。
6. 数字一律引用输入数据，不要自己重新计算；不要编造输入中不存在的分类或消费。
7. 全文使用简体中文。

示例输出：
{"summary":"本月支出 8432 元，较上月增长 20%，其中吃喝占比 33.9% 为最大项，购物在 14 日出现单笔 1200 元异常支出。","categories":[{"name":"吃喝","amount":2860,"share":33.9,"verdict":"偏高","comment":"较上月增长 59%，外卖频次明显上升"}],"advice":["外卖频次较高，建议每周自炊 3 天，预计每月可省约 400 元","14 日的 1200 元购物为单日异常，建议下月设置购物类预算上限"]}"#;

/* ========== 数据结构 ========== */

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(default)]
pub struct AiCategory {
    pub name: String,
    pub amount: f64,
    pub share: f64,
    pub verdict: String,
    pub comment: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
#[serde(default)]
pub struct AiResult {
    pub summary: String,
    pub categories: Vec<AiCategory>,
    pub advice: Vec<String>,
}

#[derive(Serialize, Clone, Debug)]
pub struct AiResponse {
    pub result: AiResult,
    pub model: String,
    #[serde(rename = "generatedAt")]
    pub generated_at: i64,
    #[serde(rename = "promptTokens")]
    pub prompt_tokens: i64,
    #[serde(rename = "completionTokens")]
    pub completion_tokens: i64,
}

/* ========== 服务商能力判断 ========== */

/// 本地 / 内网地址：不需要 Key，也不受「必须联网」限制
pub fn is_local_base(base: &str) -> bool {
    let b = base.trim().to_ascii_lowercase();
    let host = b
        .split("://")
        .nth(1)
        .unwrap_or(&b)
        .split('/')
        .next()
        .unwrap_or("")
        .split('@')
        .last()
        .unwrap_or("")
        .split(':')
        .next()
        .unwrap_or("")
        .to_string();
    if host == "localhost" || host == "127.0.0.1" || host == "::1" || host == "0.0.0.0" {
        return true;
    }
    if host.ends_with(".local") || host == "host.docker.internal" {
        return true;
    }
    if host.starts_with("192.168.") || host.starts_with("10.") || host.starts_with("169.254.") {
        return true;
    }
    if let Some(rest) = host.strip_prefix("172.") {
        if let Some(second) = rest.split('.').next() {
            if let Ok(n) = second.parse::<u32>() {
                if (16..=31).contains(&n) {
                    return true;
                }
            }
        }
    }
    false
}

pub fn endpoint(base: &str) -> String {
    let b = base.trim().trim_end_matches('/');
    if b.ends_with("/chat/completions") {
        b.to_string()
    } else {
        format!("{}/chat/completions", b)
    }
}

fn timeout_for(base: &str) -> u64 {
    if is_local_base(base) { LOCAL_TIMEOUT_SECS } else { CLOUD_TIMEOUT_SECS }
}

/// 只有 DeepSeek 认识 thinking 参数，其它厂商会 400
fn provider_uses_thinking(provider: &str, base: &str) -> bool {
    provider.eq_ignore_ascii_case("deepseek") || base.to_ascii_lowercase().contains("deepseek")
}

/// 推理类模型（o1/o3/reasoner/r1）通常不接受 temperature
fn ignores_temperature(model: &str) -> bool {
    let m = model.to_ascii_lowercase();
    ["reasoner", "reasoning", "-r1", "o1", "o3", "o4", "thinking", "think"]
        .iter()
        .any(|k| m.contains(k))
}

/// 把前端算好的月度统计数据包成 user 消息
pub fn build_user_prompt(month: &str, stats_json: &str) -> String {
    format!(
        "以下是记账 App 中 {} 的月度账单统计数据，请按要求的 json 结构输出分析：\n{}",
        month, stats_json
    )
}

#[cfg(test)]
pub fn build_messages(month: &str, stats_json: &str) -> (String, String) {
    (SYSTEM_PROMPT.to_string(), build_user_prompt(month, stats_json))
}

/// 一次请求的「能力档位」：不同厂商支持的可选参数不同，失败后逐档降级重试
#[derive(Clone, Copy, Debug, PartialEq)]
struct Profile {
    json_mode: bool,
    thinking: bool,
}

fn profiles(provider: &str, base: &str, model: &str) -> Vec<Profile> {
    let thinking = provider_uses_thinking(provider, base);
    let mut v = vec![Profile { json_mode: true, thinking }];
    if thinking {
        v.push(Profile { json_mode: true, thinking: false });
    }
    v.push(Profile { json_mode: false, thinking: false });
    let _ = model;
    v
}

/* ========== 错误 ========== */

/// capability=true 表示「这个参数该服务商不支持」，可以降级重试
struct CallError {
    msg: String,
    capability: bool,
}

fn status_error(status: u16, body: &str, provider: &str) -> CallError {
    let snippet: String = body.chars().take(200).collect();
    let lower = body.to_ascii_lowercase();
    let capability = matches!(status, 400 | 404 | 422)
        && ["response_format", "json_object", "thinking", "unsupported", "not support", "invalid_request"]
            .iter()
            .any(|k| lower.contains(k));
    let msg = match status {
        401 | 403 => format!("{} 的 API Key 无效或已过期，请到「设置 → AI 消费分析」检查", provider),
        402 => format!("{} 账户余额不足，请先充值后重试", provider),
        404 => "接口地址不存在（404）：请检查 Base URL 是否正确".to_string(),
        429 => "请求过于频繁，请稍后再试".to_string(),
        500..=599 => format!("服务暂时不可用（{}），请稍后再试", status),
        _ => format!("返回错误（{}）：{}", status, snippet),
    };
    CallError { msg, capability }
}

fn network_error(e: &reqwest::Error, timeout_secs: u64) -> CallError {
    let msg = if e.is_timeout() {
        format!("请求超时（{} 秒），请检查网络后重试", timeout_secs)
    } else if e.is_connect() {
        "网络不可用或接口地址无法连接，请检查网络与 Base URL".to_string()
    } else if e.is_decode() {
        "无法解析服务返回内容，请重试".to_string()
    } else {
        format!("网络请求失败：{}", e)
    };
    CallError { msg, capability: false }
}

fn new_client(base: &str) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(timeout_for(base)))
        .connect_timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("初始化网络客户端失败：{}", e))
}

/* ========== 返回内容解析（容错，兼容小模型的不规范输出） ========== */

const FENCE: &str = "```";

/// 剥离 markdown 代码块包裹，取出第一个 { 到最后一个 } 之间的内容
pub fn extract_json_block(raw: &str) -> String {
    let mut s = raw.trim();
    if let Some(rest) = s.strip_prefix(FENCE) {
        let rest = rest
            .strip_prefix("json")
            .or_else(|| rest.strip_prefix("JSON"))
            .unwrap_or(rest);
        s = rest.trim_start();
        if let Some(i) = s.rfind(FENCE) {
            s = &s[..i];
        }
        s = s.trim();
    }
    match (s.find('{'), s.rfind('}')) {
        (Some(a), Some(b)) if b > a => s[a..=b].to_string(),
        _ => s.to_string(),
    }
}

fn as_number(v: Option<&Value>) -> f64 {
    match v {
        Some(Value::Number(n)) => n.as_f64().unwrap_or(0.0),
        Some(Value::String(s)) => s.trim().parse::<f64>().unwrap_or(0.0),
        _ => 0.0,
    }
}

fn pick_text(v: &Value, keys: &[&str]) -> String {
    for k in keys {
        match v.get(*k) {
            Some(Value::String(s)) => {
                if !s.trim().is_empty() {
                    return s.trim().to_string();
                }
            }
            Some(Value::Array(a)) => {
                let joined: Vec<String> = a
                    .iter()
                    .map(|i| match i {
                        Value::String(s) => s.clone(),
                        other => other.to_string(),
                    })
                    .collect();
                let joined = joined.join(" ").trim().to_string();
                if !joined.is_empty() {
                    return joined;
                }
            }
            Some(Value::Null) | None => {}
            Some(other) => return other.to_string(),
        }
    }
    String::new()
}

fn pick_str_array(v: &Value, keys: &[&str]) -> Vec<String> {
    let mut out = Vec::new();
    for k in keys {
        match v.get(*k) {
            Some(Value::Array(a)) => {
                for it in a {
                    let t = match it {
                        Value::String(s) => s.trim().to_string(),
                        other => other.to_string(),
                    };
                    if !t.is_empty() {
                        out.push(t);
                    }
                }
            }
            Some(Value::String(s)) => {
                if !s.trim().is_empty() {
                    out.push(s.trim().to_string());
                }
            }
            _ => {}
        }
        if !out.is_empty() {
            break;
        }
    }
    out
}

/// 解析模型返回内容；严格解析失败时走宽松解析，尽量把可用内容救回来
pub fn parse_result(raw: &str) -> Result<AiResult, String> {
    let block = extract_json_block(raw);
    if block.trim().is_empty() {
        return Err("AI 返回内容为空，请重试".to_string());
    }

    let value: Value = serde_json::from_str(&block)
        .map_err(|_| "AI 返回的内容不是合法 json，请重试".to_string())?;

    if let Ok(r) = serde_json::from_value::<AiResult>(value.clone()) {
        if !r.summary.trim().is_empty() || !r.categories.is_empty() || !r.advice.is_empty() {
            return Ok(r);
        }
    }

    let summary = pick_text(&value, &["summary", "结论", "总结", "概述"]);
    let advice = pick_str_array(&value, &["advice", "建议", "suggestions"]);

    let mut categories = Vec::new();
    if let Some(Value::Array(arr)) = value.get("categories").or_else(|| value.get("分类")) {
        for it in arr.iter().take(12) {
            if !it.is_object() {
                continue;
            }
            categories.push(AiCategory {
                name: pick_text(it, &["name", "分类", "category"]),
                amount: as_number(it.get("amount").or_else(|| it.get("金额"))),
                share: as_number(it.get("share").or_else(|| it.get("占比"))),
                verdict: pick_text(it, &["verdict", "评价", "status"]),
                comment: pick_text(it, &["comment", "点评", "说明", "reason"]),
            });
        }
    }

    if summary.is_empty() && advice.is_empty() && categories.is_empty() {
        return Err("AI 返回内容为空，请重试".to_string());
    }
    Ok(AiResult { summary, categories, advice })
}

/* ========== 网络调用 ========== */

#[derive(Deserialize, Default)]
struct ApiUsage {
    #[serde(default)]
    prompt_tokens: i64,
    #[serde(default)]
    completion_tokens: i64,
}

#[derive(Deserialize, Default)]
struct ApiMessage {
    #[serde(default)]
    content: String,
}

#[derive(Deserialize, Default)]
struct ApiChoice {
    #[serde(default)]
    message: ApiMessage,
}

#[derive(Deserialize, Default)]
struct ApiResponse {
    #[serde(default)]
    choices: Vec<ApiChoice>,
    #[serde(default)]
    usage: Option<ApiUsage>,
}

/// 从 Base URL 里取一个可读的服务商名，用于错误提示
fn display_provider(base: &str) -> String {
    let b = base.trim().to_ascii_lowercase();
    let host = b
        .split("://")
        .nth(1)
        .unwrap_or(&b)
        .split('/')
        .next()
        .unwrap_or("")
        .split(':')
        .next()
        .unwrap_or("")
        .to_string();
    if host.is_empty() {
        return "服务商".to_string();
    }
    match host.strip_prefix("api.") {
        Some(rest) => rest.to_string(),
        None => host,
    }
}

async fn call_once(
    client: &reqwest::Client,
    api_key: &str,
    base: &str,
    model: &str,
    month: &str,
    stats_json: &str,
    p: Profile,
) -> Result<(String, i64, i64), CallError> {
    let body = build_body(model, month, stats_json, p);
    let mut req = client.post(endpoint(base));
    if !api_key.trim().is_empty() {
        req = req.bearer_auth(api_key);
    }
    let resp = req
        .json(&body)
        .send()
        .await
        .map_err(|e| network_error(&e, timeout_for(base)))?;

    let status = resp.status();
    let text = resp
        .text()
        .await
        .map_err(|e| network_error(&e, timeout_for(base)))?;

    if !status.is_success() {
        return Err(status_error(status.as_u16(), &text, &display_provider(base)));
    }

    let parsed: ApiResponse = serde_json::from_str(&text).map_err(|e| CallError {
        msg: format!("无法解析服务返回内容：{}", e),
        capability: false,
    })?;
    let content = parsed
        .choices
        .first()
        .map(|c| c.message.content.clone())
        .unwrap_or_default();
    let usage = parsed.usage.unwrap_or_default();
    Ok((content, usage.prompt_tokens, usage.completion_tokens))
}

/// 生成月度分析。按能力档位降级重试：json 模式 → 去掉 json 模式；
/// DeepSeek 的 thinking 参数不支持时也会自动去掉。
pub async fn analyze(
    api_key: &str,
    provider: &str,
    base_url: &str,
    model: &str,
    month: &str,
    stats_json: &str,
) -> Result<AiResponse, String> {
    serde_json::from_str::<Value>(stats_json)
        .map_err(|_| "月度数据格式错误，无法生成分析".to_string())?;

    let client = new_client(base_url)?;
    let list = profiles(provider, base_url, model);
    let mut last_err = "AI 返回内容为空，请重试".to_string();

    for (i, p) in list.iter().enumerate() {
        match call_once(&client, api_key, base_url, model, month, stats_json, *p).await {
            Ok((content, pt, ct)) => {
                if let Ok(result) = parse_result(&content) {
                    return Ok(AiResponse {
                        result,
                        model: model.to_string(),
                        generated_at: chrono::Local::now().timestamp_millis(),
                        prompt_tokens: pt,
                        completion_tokens: ct,
                    });
                }
                // 空内容 / 非法 json：换下一档再试（JSON 模式偶发空返回是已知问题）
                last_err = "AI 返回内容为空或不是合法 json，请重试".to_string();
            }
            Err(e) => {
                let has_next = i + 1 < list.len();
                if e.capability && has_next {
                    last_err = e.msg;
                    continue;
                }
                return Err(e.msg);
            }
        }
    }
    Err(last_err)
}

/// 设置页「测试连接」：发一次最小请求，验证 Key 与接口地址
pub async fn test_key(
    api_key: &str,
    provider: &str,
    base_url: &str,
    model: &str,
) -> Result<String, String> {
    let client = new_client(base_url)?;
    let list = profiles(provider, base_url, model);
    let mut last: Option<String> = None;

    for p in list {
        let mut body = Map::new();
        body.insert("model".into(), json!(model));
        body.insert(
            "messages".into(),
            json!([
                { "role": "system", "content": "你是连通性测试助手，只输出 json。" },
                { "role": "user", "content": "请只输出 json：{\"ok\":true}" }
            ]),
        );
        body.insert("max_tokens".into(), json!(32));
        body.insert("stream".into(), json!(false));
        if p.json_mode {
            body.insert("response_format".into(), json!({ "type": "json_object" }));
        }
        if p.thinking {
            body.insert("thinking".into(), json!({ "type": "disabled" }));
        }

        let mut req = client.post(endpoint(base_url));
        if !api_key.trim().is_empty() {
            req = req.bearer_auth(api_key);
        }
        let resp = req
            .json(&Value::Object(body))
            .send()
            .await
            .map_err(|e| network_error(&e, timeout_for(base_url)).msg)?;
        let status = resp.status();
        let text = resp
            .text()
            .await
            .map_err(|e| network_error(&e, timeout_for(base_url)).msg)?;

        if status.is_success() {
            return Ok(format!("连接正常 · {} · {}", display_provider(base_url), model));
        }
        let err = status_error(status.as_u16(), &text, &display_provider(base_url));
        if err.capability {
            last = Some(err.msg);
            continue;
        }
        return Err(err.msg);
    }
    Err(last.unwrap_or_else(|| "连接失败，请重试".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_code_fence() {
        let raw = format!("{}json\n{}\n{}", FENCE, r#"{"summary":"ok"}"#, FENCE);
        assert_eq!(extract_json_block(&raw), r#"{"summary":"ok"}"#);
    }

    #[test]
    fn parses_plain_json() {
        let raw = r#"{"summary":"本月支出偏高","categories":[{"name":"吃喝","amount":"2860","share":33.9,"verdict":"偏高","comment":"外卖多"}],"advice":["少点外卖"]}"#;
        let r = parse_result(raw).unwrap();
        assert_eq!(r.summary, "本月支出偏高");
        assert_eq!(r.categories[0].amount, 2860.0);
        assert_eq!(r.advice, vec!["少点外卖".to_string()]);
    }

    #[test]
    fn salvages_chinese_keys_and_string_advice() {
        let raw = "前言 {\"总结\":\"花得多\",\"分类\":[{\"分类\":\"交通\",\"金额\":120.5,\"占比\":10,\"评价\":\"正常\",\"点评\":\"通勤\"}],\"建议\":\"多用公交\"}";
        let r = parse_result(raw).unwrap();
        assert_eq!(r.summary, "花得多");
        assert_eq!(r.categories[0].name, "交通");
        assert_eq!(r.advice, vec!["多用公交".to_string()]);
    }

    #[test]
    fn rejects_garbage() {
        assert!(parse_result("抱歉，我无法分析").is_err());
    }

    #[test]
    fn prompt_has_json_keyword_and_example() {
        let (sys, user) = build_messages("2026-02", "{}");
        assert!(sys.contains("json") && sys.contains("summary"));
        assert!(user.contains("2026-02"));
    }

    #[test]
    fn detects_local_bases() {
        assert!(is_local_base("http://localhost:11434/v1"));
        assert!(is_local_base("http://127.0.0.1:1234/v1"));
        assert!(is_local_base("http://192.168.1.7:8000/v1"));
        assert!(is_local_base("http://172.20.3.4:8000"));
        assert!(!is_local_base("https://api.deepseek.com"));
        assert!(!is_local_base("https://172.40.1.1/v1"));
        assert!(!is_local_base("https://api.siliconflow.cn/v1"));
    }

    #[test]
    fn builds_endpoint_without_duplicating_path() {
        assert_eq!(endpoint("https://api.deepseek.com/"), "https://api.deepseek.com/chat/completions");
        assert_eq!(endpoint("https://api.openai.com/v1"), "https://api.openai.com/v1/chat/completions");
        assert_eq!(endpoint("http://localhost:11434/v1/chat/completions"), "http://localhost:11434/v1/chat/completions");
    }

    #[test]
    fn only_deepseek_gets_thinking_and_json_degrades() {
        let ds = profiles("deepseek", "https://api.deepseek.com", "deepseek-flash");
        assert!(ds[0].thinking && ds[0].json_mode);
        assert!(ds.iter().any(|p| !p.json_mode), "必须有去掉 json 模式的降级档");

        let sf = profiles("siliconflow", "https://api.siliconflow.cn/v1", "Qwen3-8B");
        assert!(!sf.iter().any(|p| p.thinking), "非 DeepSeek 不能带 thinking 参数");
    }

    #[test]
    fn reasoning_models_drop_temperature() {
        assert!(ignores_temperature("deepseek-reasoner"));
        assert!(ignores_temperature("o3-mini"));
        assert!(!ignores_temperature("deepseek-flash"));
        let body = build_body("deepseek-reasoner", "2026-02", "{}", profiles("x", "https://a.com", "deepseek-reasoner")[0]);
        assert!(body.get("temperature").is_none());
        let body2 = build_body("GLM-4.7-Flash", "2026-02", "{}", profiles("zhipu", "https://open.bigmodel.cn/api/paas/v4", "GLM-4.7-Flash")[0]);
        assert!(body2.get("temperature").is_some());
        assert!(body2.get("thinking").is_none());
    }

    #[test]
    fn capability_errors_are_retryable_others_are_not() {
        let e = status_error(400, r#"{"error":{"message":"response_format is not supported"}}"#, "siliconflow");
        assert!(e.capability && e.msg.contains("siliconflow") == false);
        let auth = status_error(401, "unauthorized", "siliconflow");
        assert!(!auth.capability && auth.msg.contains("siliconflow"));
        let rate = status_error(429, "too many", "moonshot");
        assert!(!rate.capability && !rate.msg.contains("sk-"));
    }

/// 端到端：起一个本地 OpenAI 兼容 mock，验证「json 模式不支持 → 自动降级重试」的完整链路。
    /// 只用 127.0.0.1，不联网，不消耗 tokens。
    #[test]
    fn talks_to_openai_compatible_mock_and_degrades() {
        use std::io::{Read, Write};
        use std::net::TcpListener;
        use std::sync::atomic::{AtomicUsize, Ordering};
        use std::sync::Arc;
        use std::thread;

        // 应用在 setup() 里安装过；测试进程没有跑 setup，这里补一次
        let _ = rustls::crypto::ring::default_provider().install_default();

        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let hits = Arc::new(AtomicUsize::new(0));
        let hits2 = hits.clone();

        // 注意：这个线程不 join —— 它按 incoming 阻塞等待，join 会让测试永远卡住
        let _server = thread::spawn(move || {
            for stream in listener.incoming().take(4) {
                let mut s = match stream {
                    Ok(s) => s,
                    Err(_) => break,
                };
                let n = hits2.fetch_add(1, Ordering::SeqCst);
                let mut buf = [0u8; 8192];
                let _ = s.read(&mut buf);

                let (status, reason, body) = if n == 0 {
                    (
                        400,
                        "Bad Request",
                        r#"{"error":{"message":"response_format is not supported"}}"#.to_string(),
                    )
                } else {
                    (
                        200,
                        "OK",
                        r#"{"choices":[{"message":{"content":"{\"summary\":\"测试结论\",\"categories\":[{\"name\":\"吃喝\",\"amount\":75,\"share\":100,\"verdict\":\"正常\",\"comment\":\"ok\"}],\"advice\":[\"少点外卖\"]}"}}],"usage":{"prompt_tokens":10,"completion_tokens":5}}"#.to_string(),
                    )
                };
                let resp = format!(
                    "HTTP/1.1 {} {}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                    status,
                    reason,
                    body.len(),
                    body
                );
                let _ = s.write_all(resp.as_bytes());
                let _ = s.flush();
            }
        });

        let base = format!("http://127.0.0.1:{}/v1", port);
        assert!(is_local_base(&base), "本地地址应当被识别为免 Key");
        assert!(endpoint(&base).ends_with("/v1/chat/completions"));

        // 空 Key（本地模型）也应当可以调用
        let out = tauri::async_runtime::block_on(analyze("", "", &base, "local-model", "2026-02", "{}"));
        let r = out.expect("本地 mock 应当返回成功");
        assert_eq!(r.result.summary, "测试结论");
        assert_eq!(r.result.advice, vec!["少点外卖".to_string()]);
        assert_eq!(r.result.categories[0].name, "吃喝");
        assert_eq!(r.prompt_tokens, 10);
        assert_eq!(hits.load(Ordering::SeqCst), 2, "首次 400 应当降级重试一次");
    }

    /// 联网验证：走完整 HTTPS 链路（rustls + ring），用无效 Key 期望 401 文案。
    /// 默认忽略，手动执行：cargo test --lib -- --ignored --nocapture
    #[test]
    #[ignore = "需要联网；不消耗 tokens"]
    fn live_tls_and_error_mapping() {
        let _ = rustls::crypto::ring::default_provider().install_default();
        let err = tauri::async_runtime::block_on(analyze(
            "sk-invalid-key-for-test",
            "deepseek",
            DEFAULT_BASE_URL,
            DEFAULT_MODEL,
            "2026-02",
            "{}",
        ))
        .expect_err("无效 Key 应当返回错误");
        println!("线上真实返回：{}", err);
        assert!(err.contains("API Key") || err.contains("余额") || err.contains("网络"), "未预期：{}", err);
    }
}

fn build_body(model: &str, month: &str, stats_json: &str, p: Profile) -> Value {
    let mut body = Map::new();
    body.insert("model".into(), json!(model));
    body.insert(
        "messages".into(),
        json!([
            { "role": "system", "content": SYSTEM_PROMPT },
            { "role": "user", "content": build_user_prompt(month, stats_json) }
        ]),
    );
    body.insert("max_tokens".into(), json!(MAX_TOKENS));
    body.insert("stream".into(), json!(false));
    if !ignores_temperature(model) {
        body.insert("temperature".into(), json!(0.3));
    }
    if p.json_mode {
        body.insert("response_format".into(), json!({ "type": "json_object" }));
    }
    if p.thinking {
        body.insert("thinking".into(), json!({ "type": "disabled" }));
    }
    Value::Object(body)
}
