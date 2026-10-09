const { invoke } = window.__TAURI__.core;

/* ================= 数据层 ================= */
/* ---- 单色线性图标（stroke 细线，随 currentColor） ---- */
const IC = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;

/* ---- 分类图标库：key → SVG path（24 个预置，线性风格） ---- */
const CAT_ICON = {
  utensils:     '<path d="M7 3v8.5"/><path d="M4.6 3v3.4A2.4 2.4 0 0 0 7 8.8a2.4 2.4 0 0 0 2.4-2.4V3"/><path d="M7 12v9"/><path d="M17.4 3c-1.3 1-2.1 2.9-2.1 5.1 0 2.3.8 3.9 2.1 4.6L17.4 21"/>',
  'shopping-bag':'<path d="M5.6 8h12.8l-.9 11.3a1.6 1.6 0 0 1-1.6 1.5H8.1a1.6 1.6 0 0 1-1.6-1.5L5.6 8Z"/><path d="M9.2 8V6.6a2.8 2.8 0 0 1 5.6 0V8"/>',
  coffee:       '<path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 5.2c0 1-1 1-1 2M11 5c0 1-1 1-1 2"/>',
  cookie:       '<circle cx="12" cy="12" r="8.2"/><path d="M12 4.5a2 2 0 0 1 3.5 1.4A2 2 0 0 0 18.5 9a2 2 0 0 1 .8 2.7"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1.1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="15" r="0.9" fill="currentColor" stroke="none"/>',
  bus:          '<rect x="4.2" y="5.4" width="15.6" height="11.2" rx="2.6"/><path d="M4.2 10.4h15.6"/><path d="M7.6 16.6v2M16.4 16.6v2"/><circle cx="8.4" cy="13.4" r=".85" fill="currentColor" stroke="none"/><circle cx="15.6" cy="13.4" r=".85" fill="currentColor" stroke="none"/>',
  car:          '<path d="M5 11l1.6-4.3A2 2 0 0 1 8.5 5.4h7a2 2 0 0 1 1.9 1.3L19 11"/><rect x="4" y="11" width="16" height="6" rx="2"/><path d="M4 13h16"/><path d="M7.5 17v1.6M16.5 17v1.6"/>',
  train:        '<rect x="6" y="4" width="12" height="13" rx="3"/><path d="M6 8h12M6 12.5h12"/><path d="M9.5 17v2M14.5 17v2M8.5 13h.02M15.5 13h.02"/>',
  fuel:         '<path d="M4 20V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14"/><path d="M4 20h11"/><path d="M13 9h2.5a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-2-2"/>',
  'shopping-cart':'<path d="M4 5h2l1.6 9.4a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 8H6"/><circle cx="9" cy="19.5" r="1.3"/><circle cx="16.5" cy="19.5" r="1.3"/>',
  shirt:        '<path d="M9 4l-5 2 1.5 5 1.8-.8V20h9.4v-9.8l1.8.8L20 6l-5-2a3 3 0 0 1-6 0Z"/>',
  smartphone:   '<rect x="7" y="3" width="10" height="18" rx="2.4"/><path d="M10.5 17.5h3"/>',
  sparkles:     '<path d="M12 4l1.7 4.1a2 2 0 0 0 1.2 1.2L19 11l-4.1 1.7a2 2 0 0 0-1.2 1.2L12 18l-1.7-4.1a2 2 0 0 0-1.2-1.2L5 11l4.1-1.7a2 2 0 0 0 1.2-1.2L12 4Z"/><path d="M18.5 2.5v3M17 4h3"/>',
  'gamepad-2':  '<rect x="3.5" y="7" width="17" height="10" rx="3"/><path d="M8 10v4M6 12h4"/><path d="M15 11.5h.01M17.5 13.5h.01"/>',
  film:         '<rect x="4" y="5" width="16" height="14" rx="2.4"/><path d="M4 9h16M4 15h16"/><path d="M9 5v4M9 15v4M15 5v4M15 15v4"/>',
  music:        '<circle cx="7" cy="17" r="3"/><circle cx="17" cy="15.5" r="3"/><path d="M10 17V6l10-1.5V14"/>',
  dumbbell:     '<path d="M4.5 12V9.2M4.5 14.8V12h3V9.2h-3"/><path d="M6.5 9.2v5.6M19.5 12v2.8M19.5 9.2V12h-3V9.2h3"/><path d="M17.5 9.2v5.6"/><path d="M9.5 8.5v7M14.5 8.5v7"/>',
  home:         '<path d="M4.5 10.2 12 4l7.5 6.2"/><path d="M6.2 9.2V19h11.6V9.2"/><path d="M10 19v-4.4h4V19"/>',
  zap:          '<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>',
  pill:         '<rect x="4.6" y="7.4" width="4.4" height="12.2" rx="2.2"/><rect x="15" y="4.4" width="4.4" height="12.2" rx="2.2"/><path d="M9 19v-7.8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2V19"/>',
  'book-open':  '<path d="M4.6 5.2A2 2 0 0 1 6.6 3.4h10.8"/><path d="M6.6 3.4A2 2 0 0 0 4.6 5.4v13.2a2 2 0 0 1 2-2h10.8V3.4"/>',
  plane:        '<path d="M21 15.5l-9-1.8-4.5 3-.3 1.2 2 .6-.4 1.5-2-.4-.9 1.4 1.1.9L8 22l2-.7 1.1 1-1-2.2 1.8-1.2.6 2.1 1-.5-2.4-5.4L15 8.5a1.9 1.9 0 0 0-2.7-2.7L8 9.2 2 7l-1 2 5 2-1.5 2.5a1.9 1.9 0 0 0 1.7 2.9l3.8-.5"/>',
  'paw-print':  '<circle cx="6" cy="9" r="1.9"/><circle cx="10" cy="6" r="1.9"/><circle cx="14" cy="6" r="1.9"/><circle cx="18" cy="9" r="1.9"/><path d="M12 11c-2.7 0-4.8 2-4.8 4.5 0 2.8 2.2 4.5 4.8 4.5s4.8-1.7 4.8-4.5C16.8 13 14.7 11 12 11Z"/>',
  gift:         '<rect x="4.2" y="5.2" width="15.6" height="14" rx="2.4"/><path d="M4.2 11h15.6"/><path d="M8.6 5.2 6.8 8.6M15.4 5.2l1.8 3.4"/><path d="M12 5.2V19.2"/>',
  wallet:       '<rect x="4" y="6.4" width="16" height="11.2" rx="2"/><path d="M4.6 9.4h14.8"/><path d="M4.6 15.8h14.8"/><circle cx="12" cy="12.4" r="1.3" fill="currentColor" stroke="none"/>',
  grid:         '<rect x="4" y="4" width="7" height="7" rx="1.8"/><rect x="13" y="4" width="7" height="7" rx="1.8"/><rect x="4" y="13" width="7" height="7" rx="1.8"/><rect x="13" y="13" width="7" height="7" rx="1.8"/>'
};

/* ---- 分类（从数据库加载，启动时填充） ---- */
let CATEGORIES = { expense: [], income: [] };
let CAT_MAP = {};
let DEFAULT_CAT = null; // 未匹配分类时的兜底图标

/* 必要时把后端返回的分类灌入内存缓存 */
function applyCategories(list) {
  const map = {};
  const groups = { expense: [], income: [] };
  (list || []).forEach(c => {
    const node = {
      id: c.id,
      type: c.type,
      name: c.name,
      color: c.color,
      sort: c.sort,
      builtin: c.builtin,
      iconKey: c.icon,
      icon: IC(CAT_ICON[c.icon] || CAT_ICON.grid || '')
    };
    if (groups[c.type]) groups[c.type].push(node);
    map[c.id] = node;
  });
  const bySort = (a, b) => (a.sort ?? 9) - (b.sort ?? 9);
  groups.expense.sort(bySort);
  groups.income.sort(bySort);
  CATEGORIES = groups;
  CAT_MAP = map;
  DEFAULT_CAT = map.other || map.other_in || CATEGORIES.expense[0] || null;
}

let txs = [];
let categoriesLoaded = false;

async function loadCategories() {
  try {
    const list = await invoke('list_categories');
    applyCategories(list);
    categoriesLoaded = true;
  } catch (e) {
    console.warn('加载分类失败', e);
  }
}

async function refreshTxs() {
  const raw = await invoke('list_all');
  txs = raw.map(t => ({ ...t, amount: Number(t.amount) }));
}

/** 今日累计支出（元），用于记账后的「已花」小结 */
function todayExpense() {
  const today = todayStr();
  return txs
    .filter(t => t.type === 'expense' && t.date === today)
    .reduce((s, t) => s + t.amount, 0);
}

/* ================= 工具 ================= */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function pad2(n) { return String(n).padStart(2, '0'); }
function fmtDate(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function todayStr() { return fmtDate(new Date()); }
function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(base, n) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + n);
  return d;
}
function startOfWeek(d) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function fmtMoney(n) {
  const neg = n < 0;
  const s = Math.abs(n).toFixed(2);
  const [int, dec] = s.split('.');
  return (neg ? '-' : '') + '¥' + int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + dec;
}
function fmtMoneyShort(n) {
  if (n >= 10000) return '¥' + (n / 10000).toFixed(n >= 100000 ? 0 : 1) + '万';
  return '¥' + Math.round(n);
}
function fmtMoneySigned(n) {
  const s = fmtMoney(n);
  return n > 0 ? '+' + s : s;
}

function dayLabel(ds) {
  const t = todayStr();
  if (ds === t) return '今日';
  const y = fmtDate(addDays(new Date(), -1));
  if (ds === y) return '昨日';
  const d = parseDate(ds);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  return (sameYear ? '' : d.getFullYear() + '年') + (d.getMonth() + 1) + '月' + d.getDate() + '日';
}

function animateNumber(el, from, to, duration, formatter) {
  if (el._raf) cancelAnimationFrame(el._raf);
  if (Math.abs(to - from) < 0.005) { el.textContent = formatter(to); return; }
  const start = performance.now();
  const tick = now => {
    const p = Math.min(1, (now - start) / duration);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = formatter(from + (to - from) * e);
    if (p < 1) el._raf = requestAnimationFrame(tick);
    else el._raf = null;
  };
  el._raf = requestAnimationFrame(tick);
}
function setNumber(el, to) {
  const from = Number(el.dataset.val || 0);
  el.dataset.val = to;
  animateNumber(el, from, to, 620, fmtMoney);
}

function toast(msg) {
  let t = $('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    $('#app').appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 1500);
}

/** 记账成功：居中的「确认感」反馈卡（绿色对勾 + 文字，回弹淡入） */
function showSavedFeedback(msg) {
  let el = $('.save-done');
  if (el) { clearTimeout(el._tid); el.remove(); }
  el = document.createElement('div');
  el.className = 'save-done';
  el.innerHTML = `<span class="sd-icon">${IC('<path d="M4.5 12.5l4.3 4.3L19.5 7.2"/>')}</span><span class="sd-text"></span>`;
  el.querySelector('.sd-text').textContent = msg;
  $('#app').appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  el._tid = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 500);
  }, 1600);
}

/** 导入账单进度层：显示百分比 + 文案，返回 { update, close } */
function showImportProgress(total) {
  const wrap = document.createElement('div');
  wrap.className = 'import-progress';
  wrap.innerHTML = `
    <div class="import-card">
      <div class="ip-title">正在导入</div>
      <div class="ip-text" id="_ipText">已导入 0 / ${total} 条</div>
      <div class="ip-track"><div class="ip-fill" id="_ipFill"></div></div>
    </div>`;
  document.body.appendChild(wrap);
  const txt = wrap.querySelector('#_ipText');
  const fill = wrap.querySelector('#_ipFill');
  return {
    update(done) {
      txt.textContent = `已导入 ${done} / ${total} 条`;
      fill.style.width = `${total ? Math.round(done / total * 100) : 0}%`;
    },
    close() { wrap.remove(); }
  };
}

/* ================= 搜索状态 ================= */
let searchQuery = '';

function normalizeForSearch(s) {
  return String(s || '').toLowerCase();
}

function matchSearch(t, q) {
  if (!q) return true;
  const cat = CAT_MAP[t.category];
  const haystack = [
    t.note || '',
    cat ? cat.name : '',
    t.amount ? String(t.amount) : ''
  ].map(normalizeForSearch).join(' ');
  return haystack.includes(q);
}

/* ================= 明细页：月份状态 ================= */
let viewMonth = todayStr().slice(0, 7);

/** 月份入口现在在概览卡片上：卡片标签本身就是切换月份的按钮 */
function updateMonthLabel() {
  const el = $('#summaryLabel');
  if (!el) return;
  const [y, m] = viewMonth.split('-').map(Number);
  const isCurrent = viewMonth === todayStr().slice(0, 7);
  // 跨年的月份补上年份，避免「9月支出」看不出是哪一年
  const isThisYear = y === new Date().getFullYear();
  const label = isCurrent ? '本月' : (isThisYear ? (m + '月') : (y + '年' + m + '月'));
  el.innerHTML = label + '支出 <span class="arrow">▼</span>';
}

/* ================= 首页渲染 ================= */
function renderHome() {
  updateMonthLabel();

  const [y, m] = viewMonth.split('-').map(Number);
  const isCurrentMonth = viewMonth === todayStr().slice(0, 7);

  const q = normalizeForSearch(searchQuery.trim());

  const base = q
    ? txs.filter(t => matchSearch(t, q))
    : txs.filter(t => t.date.startsWith(viewMonth));

  const monthTx = base;
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  setNumber($('#monthExpense'), expense);
  setNumber($('#monthIncome'), income);
  setNumber($('#monthBalance'), income - expense);

  renderBudget();
  renderQuickRow();
  syncGestureHint(monthTx.length > 0);

  const listEl = $('#txList');

  if (!monthTx.length) {
    listEl.innerHTML = q
      ? emptyState({
          icon: IC('<path d="M20.2 20.2 15.9 15.9"/><circle cx="11" cy="11" r="6.6"/>'),
          title: '没有找到匹配的记录',
          text: '换个关键词试试',
        })
      : emptyState({
          icon: IC('<path d="M7 3h10v18l-2.5-1.7L12 20l-2.5-1.7L7 21V3Z"/><path d="M9.5 8h5M9.5 12h5"/>'),
          title: isCurrentMonth ? '本月还没有记账' : (m + '月还没有记录'),
          text: isCurrentMonth ? '记下第一笔，从这里开始' : '这个月还没有任何记录',
          actionLabel: isCurrentMonth ? '记一笔' : '',
          actionId: 'emptyCta',
        });
    const cta = listEl.querySelector('#emptyCta');
    if (cta) cta.addEventListener('click', () => openSheet());
    return;
  }

  const sorted = [...monthTx].sort((a, b) =>
    b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0)
  );

  const groups = {};
  sorted.forEach(t => (groups[t.date] = groups[t.date] || []).push(t));
  const dates = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  let html = '';
  let idx = 0;
  dates.forEach(ds => {
    const items = groups[ds];
    const dayExpense = items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const dayIncome = items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    let sumTxt = '';
    if (dayExpense) sumTxt += '支出 ' + fmtMoney(dayExpense);
    if (dayIncome) sumTxt += (sumTxt ? '  ' : '') + '收入 ' + fmtMoney(dayIncome);

    html += `<div class="day-group" style="animation-delay:${Math.min(idx * 45, 260)}ms">
      <div class="day-header"><span>${dayLabel(ds)}</span><span class="sum">${sumTxt}</span></div>
      <div class="card">`;

    items.forEach(t => {
      const cat = CAT_MAP[t.category] || DEFAULT_CAT;
      const sign = t.type === 'income' ? '+' : '-';
      const sel = selectMode && selectedIds.has(String(t.id));
      html += `<div class="tx-row${sel ? ' is-selected' : ''}" data-id="${t.id}">
        <div class="tx-delete">删除</div>
        <div class="tx-content">
          ${selectMode ? `<div class="tx-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7"/></svg></div>` : ''}
          <div class="tx-icon" style="color:${cat.color}">${cat.icon}</div>
          <div class="tx-main">
            <div class="tx-name">${escapeHtml(cat.name)}</div>
            ${t.note ? `<div class="tx-note">${escapeHtml(t.note)}</div>` : ''}
          </div>
          <div class="tx-amount ${t.type === 'income' ? 'income' : ''}">${sign}${fmtMoney(t.amount)}</div>
        </div>
      </div>`;
    });

    html += `</div></div>`;
    idx++;
  });

  listEl.innerHTML = html;
  listEl.querySelectorAll('.tx-row').forEach(row => bindSwipe(row));
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/** 全站统一空态。opts: { icon, title, text, actionLabel, actionId, variant: 'compact'|'card' } */
function emptyState(opts) {
  const o = opts || {};
  const cls = 'empty-state' + (o.variant ? ' ' + o.variant : '');
  const art = o.icon ? '<div class="es-art"><span class="es-glow"></span>' + o.icon + '</div>' : '';
  const title = o.title ? '<div class="es-title">' + escapeHtml(o.title) + '</div>' : '';
  const text = o.text ? '<div class="es-text">' + escapeHtml(o.text) + '</div>' : '';
  const btn = o.actionLabel
    ? '<button class="es-btn"' + (o.actionId ? ' id="' + o.actionId + '"' : '') + '>' + escapeHtml(o.actionLabel) + '</button>'
    : '';
  return '<div class="' + cls + '">' + art + title + text + btn + '</div>';
}

/* ================= 一次性手势提示 ================= */
let gestureHintSeen = false;

async function initGestureHint() {
  try {
    const v = await invoke('get_setting', { key: 'gesture_hint_seen' });
    gestureHintSeen = v === '1';
  } catch (e) {
    gestureHintSeen = false;
  }
}

/** 有记录且没看过提示时才显示；关掉后写进 settings，不再出现 */
function syncGestureHint(hasRows) {
  const el = $('#gestureHint');
  if (!el) return;
  const show = hasRows && !gestureHintSeen;
  if (show === !el.hidden && (show ? el.classList.contains('show') : true)) return;
  el.hidden = !show;
  if (show) requestAnimationFrame(() => el.classList.add('show'));
  else el.classList.remove('show');
}

async function dismissGestureHint() {
  const el = $('#gestureHint');
  gestureHintSeen = true;
  if (el) {
    el.classList.remove('show');
    setTimeout(() => { el.hidden = true; }, 220);
  }
  try {
    await invoke('set_setting', { key: 'gesture_hint_seen', value: '1' });
  } catch (e) {
    console.warn('记录手势提示状态失败', e);
  }
}

const _gestureHintClose = $('#gestureHintClose');
if (_gestureHintClose) _gestureHintClose.addEventListener('click', dismissGestureHint);

/* ================= 侧滑删除 ================= */
let openedRow = null;

function closeRow(row) {
  const c = row.querySelector('.tx-content');
  c.style.transform = 'translateX(0)';
  row.dataset.open = '';
  if (openedRow === row) openedRow = null;
}

function bindSwipe(row) {
  const content = row.querySelector('.tx-content');
  const delBtn = row.querySelector('.tx-delete');
  const W = 76;
  let startX = 0, startY = 0, startTX = 0, dragging = false, axis = null;
  let closedOther = false;
  let pressTimer = null;
  let longPressFired = false;
  let moved = false;        // 本次手势是否移动过（滚动/侧滑），移动过就不算点按
  let tapHandled = false;   // 本次手势的点按是否已被某条事件通道处理，防止重复弹出

  const clearPress = () => {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
  };

  /** 统一的点按入口。桌面是 pointerup，移动端可能只给 touchend / click，
   *  也可能因为系统长按菜单、文字选择变成 pointercancel —— 所有通道都汇到这里，只处理一次。 */
  const handleTap = () => {
    if (selectMode) { toggleSelect(row.dataset.id); return; }
    if (closedOther) return;                    // 这一下只用于收起别的行的侧滑
    if (row.dataset.open) { closeRow(row); return; }
    showActionSheet(row.dataset.id);
  };

  const fireTap = () => {
    if (tapHandled) return;
    tapHandled = true;
    handleTap();
  };

  const onDown = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!selectMode && openedRow && openedRow !== row) {
      closeRow(openedRow);
      closedOther = true;
    } else {
      closedOther = false;
    }
    dragging = true; axis = null;
    longPressFired = false;
    moved = false;
    tapHandled = false;
    startX = e.clientX; startY = e.clientY;
    startTX = row.dataset.open ? -W : 0;
    content.style.transition = 'none';

    if (!selectMode && !row.dataset.open) {
      clearPress();
      row.classList.add('pressing');
      pressTimer = setTimeout(() => {
        pressTimer = null;
        row.classList.remove('pressing');
        if (axis || !dragging) return;
        longPressFired = true;
        dragging = false;
        tapHandled = true;   // 长按已消费这次手势，别再被 click/touchend 当成点按
        if (navigator.vibrate) navigator.vibrate(12);
        enterSelect(row.dataset.id);
      }, 500);
    }
  };

  const onMove = e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!axis) {
      if (Math.abs(dx) > 7 || Math.abs(dy) > 7) {
        moved = true;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        clearPress();
        row.classList.remove('pressing');
        if (axis === 'x' && !selectMode) {
          try { content.setPointerCapture(e.pointerId); } catch (_) {}
        }
      } else return;
    }
    if (selectMode || axis !== 'x') return;   // 多选模式下不拖动
    let t = startTX + dx;
    t = Math.max(-W, Math.min(0, t));
    content.style.transform = `translateX(${t}px)`;
  };

  const onUp = e => {
    clearPress();
    row.classList.remove('pressing');
    if (longPressFired) { longPressFired = false; dragging = false; axis = null; return; }
    if (!dragging) return;
    dragging = false;
    content.style.transition = '';
    if (axis === 'x' && !selectMode) {
      const dx = e.clientX - startX;
      const t = startTX + dx;
      const open = t < -W * 0.45;
      content.style.transform = open ? `translateX(-${W}px)` : 'translateX(0)';
      row.dataset.open = open ? '1' : '';
      openedRow = open ? row : (openedRow === row ? null : openedRow);
    } else if (!axis && !moved) {
      // 多选：抬手即切换选中；普通模式：弹出操作菜单。
      // 这里不再要求事件类型是 pointerup —— 移动端被系统抢走手势时只会有 pointercancel。
      fireTap();
    }
    axis = null;
  };

  content.addEventListener('pointerdown', onDown);
  content.addEventListener('pointermove', onMove);
  content.addEventListener('pointerup', onUp);
  content.addEventListener('pointercancel', onUp);

  // 移动端兜底：pointerup 被系统文字选择 / 长按菜单吞掉时，只剩 touchend
  content.addEventListener('touchstart', e => {
    tapHandled = false;
    if (!dragging) {
      const t = e.touches && e.touches[0];
      if (t) { startX = t.clientX; startY = t.clientY; moved = false; }
    }
  }, { passive: true });
  content.addEventListener('touchmove', e => {
    if (dragging) return;               // pointer 流已经在跟踪，不重复判断
    const t = e.touches && e.touches[0];
    if (!t) return;
    if (Math.abs(t.clientX - startX) > 7 || Math.abs(t.clientY - startY) > 7) moved = true;
  }, { passive: true });
  // 非 passive：处理点按时要 preventDefault，掐掉系统随后补发的幽灵 click
  content.addEventListener('touchend', e => {
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    if (!t || axis || moved) return;
    if (dragging) {
      onUp({ type: 'touchend', clientX: t.clientX, clientY: t.clientY });
    } else {
      const willTap = !tapHandled;
      fireTap();
      if (willTap && e.cancelable) e.preventDefault();
    }
  }, { passive: false });

  // 有些设备被系统抢走手势时只发 touchcancel
  content.addEventListener('touchcancel', e => {
    const t = (e.changedTouches && e.changedTouches[0]) || null;
    if (!t || axis || moved) return;
    if (dragging) {
      onUp({ type: 'touchcancel', clientX: t.clientX, clientY: t.clientY });
    } else {
      fireTap();
    }
  }, { passive: true });

  // 桌面与触屏共用的最后一道兜底（侧滑或长按之后不再触发）
  content.addEventListener('click', () => {
    if (axis || moved || longPressFired) return;
    fireTap();
  });

  // 安卓长按会弹系统菜单并打断手势，这里屏蔽掉
  row.addEventListener('contextmenu', e => e.preventDefault());

  delBtn.addEventListener('click', async () => {
    const id = row.dataset.id;
    row.style.transition = 'opacity .25s, transform .3s, height .3s';
    row.style.height = row.offsetHeight + 'px';
    requestAnimationFrame(() => {
      row.style.opacity = '0';
      row.style.transform = 'translateX(-40px)';
      row.style.height = '0px';
    });
    try {
      await invoke('delete_tx', { id: String(id) });
    } catch (e) {
      toast('删除失败：' + e);
    }
    setTimeout(async () => {
      await refreshTxs();
      renderHome();
      renderStats();
      updateRecordCount();
      toast('已删除');
    }, 280);
  });
}

/* ================= 批量选择分类 ================= */
let selectMode = false;
const selectedIds = new Set();

function enterSelect(initialId) {
  if (selectMode) return;
  selectMode = true;
  selectedIds.clear();
  if (initialId !== undefined && initialId !== null) selectedIds.add(String(initialId));
  if (openedRow) closeRow(openedRow);
  $('#app').classList.add('select-mode');
  $('#selectBar').classList.add('show');
  renderHome();
  updateSelectBar();
}

function exitSelect() {
  if (!selectMode) return;
  selectMode = false;
  selectedIds.clear();
  $('#app').classList.remove('select-mode');
  $('#selectBar').classList.remove('show');
  renderHome();
}

function toggleSelect(id) {
  id = String(id);
  if (selectedIds.has(id)) selectedIds.delete(id);
  else selectedIds.add(id);
  const row = $$('#txList .tx-row').find(r => r.dataset.id === id);
  if (row) row.classList.toggle('is-selected', selectedIds.has(id));
  updateSelectBar();
}

function toggleSelectAll() {
  const rows = $$('#txList .tx-row');
  if (!rows.length) return;
  const allSelected = rows.every(r => selectedIds.has(String(r.dataset.id)));
  selectedIds.clear();
  if (!allSelected) rows.forEach(r => selectedIds.add(String(r.dataset.id)));
  rows.forEach(r => r.classList.toggle('is-selected', !allSelected));
  updateSelectBar();
}

function updateSelectBar() {
  const rows = $$('#txList .tx-row');
  const n = selectedIds.size;
  $('#selectCount').textContent = n ? `已选 ${n} 条` : '请选择记录';
  const allSelected = rows.length > 0 && rows.every(r => selectedIds.has(String(r.dataset.id)));
  $('#selectAllBtn').textContent = allSelected ? '取消全选' : '全选';
  $('#selectCatBtn').disabled = n === 0;
}

function openBatchCat() {
  if (!selectedIds.size) return;
  const selected = txs.filter(t => selectedIds.has(String(t.id)));
  if (!selected.length) return;

  // 混选时按支出 / 收入分区，点哪个就统一改成哪个
  const kinds = ['expense', 'income'].filter(k => selected.some(t => t.type === k));
  const mixed = kinds.length > 1;

  $('#batchCatHead').textContent = `改分类 · 已选 ${selectedIds.size} 条`;

  let html = '';
  kinds.forEach(kind => {
    if (mixed) {
      html += `<div class="batch-cat-title">${kind === 'expense' ? '支出分类' : '收入分类'}</div>`;
    }
    html += `<div class="cat-grid">${CATEGORIES[kind].map(c => `
      <button class="cat-item" data-id="${c.id}" style="--c:${c.color}">
        <span class="ic">${c.icon}</span><span>${escapeHtml(c.name)}</span>
      </button>`).join('')}</div>`;
  });
  $('#batchCatBody').innerHTML = html;
  openModal(batchCatSheet);
}

async function applyBatchCat(catId) {
  const ids = [...selectedIds];
  if (!ids.length) return;
  closeModal();
  try {
    const changed = await invoke('update_category_batch', { ids, category: catId });
    await refreshTxs();
    if (selectMode) exitSelect(); else renderHome();
    renderStats();
    updateRecordCount();
    toast(`已更新 ${changed} 条`);
  } catch (e) {
    toast('修改失败：' + e);
  }
}

$('#selectAllBtn').addEventListener('click', toggleSelectAll);
$('#selectCancelBtn').addEventListener('click', exitSelect);
$('#selectCatBtn').addEventListener('click', openBatchCat);

$('#batchCatSheet').addEventListener('click', e => {
  const item = e.target.closest('.cat-item');
  if (item) { applyBatchCat(item.dataset.id); return; }
  const btn = e.target.closest('button');
  if (btn && btn.dataset.act === 'cancel') closeModal();
});

/* ================= 分类管理 ================= */
const CAT_COLORS = ['#FF9500', '#FF3B30', '#FF2D55', '#AF52DE', '#5856D6', '#007AFF', '#34C759', '#00C7BE', '#8E8E93'];
const CAT_ICON_KEYS = Object.keys(CAT_ICON);

let editingCatId = null;    // 非空 = 编辑已有分类；null = 新增
let editingCatType = 'expense';

function openCatManage() {
  renderCatManage();
  openModal(catManageSheet);
}

function renderCatManage() {
  ['expense', 'income'].forEach(kind => {
    const listEl = $(kind === 'expense' ? '#catMgrExpense' : '#catMgrIncome');
    const cats = CATEGORIES[kind] || [];
    if (!cats.length) { listEl.innerHTML = '<div class="cat-mgr-empty">暂无分类</div>'; return; }
    listEl.innerHTML = cats.map((c, i) => `
      <button class="cat-mgr-row" data-id="${c.id}">
        <span class="cm-icon" style="color:${c.color}">${c.icon}</span>
        <span class="cm-name">${escapeHtml(c.name)}</span>
        <span class="cm-arrows">
          <span class="cm-move" data-move="up" data-id="${c.id}" ${i===0?'disabled':''}>↑</span>
          <span class="cm-move" data-move="down" data-id="${c.id}" ${i===cats.length-1?'disabled':''}>↓</span>
        </span>
        <span class="cm-arrow">›</span>
      </button>`).join('');
  });
}

function setCatTypeSeg(kind) {
  $('#catEditType').dataset.type = kind;
  $$('#catEditType .seg').forEach(s => s.classList.toggle('active', s.dataset.kind === kind));
}
function setCatTypeLock(locked) {
  $$('#catEditType .seg').forEach(s => (s.disabled = locked));
  $('#catEditType').classList.toggle('locked', locked);
}

function openCatEdit(id) {
  let cat = null;
  if (id) {
    cat = CAT_MAP[id];
    if (!cat) return;
    editingCatId = id;
    editingCatType = cat.type;
    $('#catEditHead').textContent = '编辑分类';
    $('#catEditName').value = cat.name;
    $('#catEditDelete').hidden = cat.builtin ? true : false;  // 预置分类不可删
    $('#catEditSave').textContent = '保存';
    setCatTypeLock(true);   // 编辑时类型固定，避免跨类型导致误判
  } else {
    editingCatId = null;
    editingCatType = curType || 'expense';
    $('#catEditHead').textContent = '新增分类';
    $('#catEditName').value = '';
    $('#catEditDelete').hidden = true;
    $('#catEditSave').textContent = '保存';
    setCatTypeLock(false);
  }
  // 预填选中图标/颜色
  pickedCatIcon = cat ? (CAT_ICON[cat.iconKey] ? cat.iconKey : CAT_ICON_KEYS[0]) : CAT_ICON_KEYS[0];
  pickedCatColor = cat ? cat.color : CAT_COLORS[0];
  renderCatEdit();
  setCatTypeSeg(editingCatType);
  openModal(catEditSheet);
}

let pickedCatIcon = CAT_ICON_KEYS[0];
let pickedCatColor = CAT_COLORS[0];

function renderCatEdit() {
  // 预览
  $('#catEditPreview').innerHTML = IC(CAT_ICON[pickedCatIcon] || CAT_ICON.grid);
  $('#catEditPreview').style.color = pickedCatColor;
  $('#catEditNamePlain').textContent = $('#catEditName').value.trim() || '分类名';
  $('#catEditNamePlain').style.color = pickedCatColor;
  // 图标 4×6
  $('#catEditIcons').innerHTML = CAT_ICON_KEYS.map(k => `
    <button class="cat-pick-icon ${k===pickedCatIcon?'sel':''}" data-icon="${k}">${IC(CAT_ICON[k])}</button>`).join('');
  // 颜色 3×3
  $('#catEditColors').innerHTML = CAT_COLORS.map(c => `
    <button class="cat-pick-color ${c===pickedCatColor?'sel':''}" data-color="${c}" style="background:${c}"></button>`).join('');
}

/* 打开分类管理入口 */
if ($('#categoryManageBtn')) {
  $('#categoryManageBtn').addEventListener('click', openCatManage);
}
if ($('#catAddBtn')) {
  $('#catAddBtn').addEventListener('click', () => {
    closeModal();
    setTimeout(() => openCatEdit(null), 0);
  });
}

/* 记账面板「管理分类」入口：关闭记账勾，打开分类管理 */
if ($('#manageCatBtn')) {
  $('#manageCatBtn').addEventListener('click', () => {
    closeSheet();
    setTimeout(() => { renderCatManage(); openModal(catManageSheet); }, 60);
  });
}

/* 分类管理列表：点行进入编辑；点 ↑↓ 调整顺序（不改跳转） */
$('#catManageSheet').addEventListener('click', async e => {
  const move = e.target.closest('.cm-move');
  if (move) {
    e.stopPropagation();
    if (move.hasAttribute('disabled')) return;
    const id = move.dataset.id;
    const type = CAT_MAP[id] ? CAT_MAP[id].type : 'expense';
    const arr = CATEGORIES[type];
    const i = arr.findIndex(x => x.id === id);
    if (i < 0) return;
    const j = move.dataset.move === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= arr.length) return;
    // 交换
    [arr[i], arr[j]] = [arr[j], arr[i]];
    await invoke('reorder_categories', { ids: arr.map(x => x.id) }).catch(() => {});
    renderCatManage();
    return;
  }
  const row = e.target.closest('.cat-mgr-row');
  if (row) openCatEdit(row.dataset.id);
  else {
    const btn = e.target.closest('button');
    if (btn && btn.dataset.act === 'cancel') closeModal();
  }
});

/* 分类编辑面板交互 */
/* ===== 自动分类规则 ===== */
function renderCatRuleCat() {
  // 下拉框列全部支出分类（含兜底 other），并保留当前选项
  const sel = $('#catRuleCat');
  const cur = sel.value;
  const cats = [...(CATEGORIES.expense || [])];
  if (!cats.some(c => c.id === 'other')) {
    // 确保兜底分类可被选择
    cats.unshift({ id: 'other', name: '其他' });
  }
  sel.innerHTML = cats.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  if (cur && cats.some(c => c.id === cur)) sel.value = cur;
}

function catRuleCatName(id) {
  const c = CAT_MAP[id];
  return c ? c.name : '其他';
}

function renderCatRules() {
  const list = $('#catRuleList');
  $('#catRuleSub').textContent = CAT_RULES.length
    ? `共 ${CAT_RULES.length} 条自定义规则`
    : '自定义关键词匹配规则';
  if (!CAT_RULES.length) {
    list.innerHTML = '<div class="cat-rule-empty">暂无规则，添加后导入账单将自动归类。</div>';
    return;
  }
  list.innerHTML = CAT_RULES.map((r, i) => {
    const cn = r.cat === 'other' ? '其他' : catRuleCatName(r.cat);
    return `<div class="cat-rule-item">
      <span class="cat-rule-kw">「${escapeHtml(r.kw)}」命中 → ${escapeHtml(cn)}</span>
      <button class="cat-rule-del" data-idx="${i}" aria-label="删除规则">✕</button>
    </div>`;
  }).join('');
}

function openCatRules() {
  renderCatRuleCat();
  renderCatRules();
  openModal($('#catRuleSheet'));
}

async function addCatRule() {
  const kw = ($('#catRuleKw').value || '').trim();
  const cat = $('#catRuleCat').value;
  if (!kw) { toast('请输入关键词'); return; }
  if (CAT_RULES.some(r => r.kw === kw)) { toast('该关键词已存在'); return; }
  CAT_RULES.push({ kw, cat });
  await saveCatRules(CAT_RULES);
  $('#catRuleKw').value = '';
  renderCatRules();
  toast('规则已添加');
}

async function removeCatRule(idx) {
  if (idx < 0 || idx >= CAT_RULES.length) return;
  CAT_RULES.splice(idx, 1);
  await saveCatRules(CAT_RULES);
  renderCatRules();
  toast('规则已删除');
}

if ($('#catRuleBtn')) {
  $('#catRuleBtn').addEventListener('click', openCatRules);
}
$('#catRuleAdd').addEventListener('click', addCatRule);
$('#catRuleList').addEventListener('click', e => {
  const del = e.target.closest('.cat-rule-del');
  if (del) removeCatRule(Number(del.dataset.idx));
});
$('#catRuleKw').addEventListener('keydown', e => {
  if (e.key === 'Enter') addCatRule();
});

/* 分类编辑面板交互 */
$('#catEditName').addEventListener('input', () => {
  $('#catEditNamePlain').textContent = $('#catEditName').value.trim() || '分类名';
});
$('#catEditIcons').addEventListener('click', e => {
  const b = e.target.closest('.cat-pick-icon');
  if (!b) return;
  pickedCatIcon = b.dataset.icon;
  renderCatEdit();
});
$('#catEditColors').addEventListener('click', e => {
  const b = e.target.closest('.cat-pick-color');
  if (!b) return;
  pickedCatColor = b.dataset.color;
  renderCatEdit();
});

/* 分类编辑面板：取消/遮罩关闭 */
$('#catEditSheet').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (btn && btn.dataset.act === 'cancel') closeModal();
});

/* 新增分类时切换支出/收入类型 */
$('#catEditType').addEventListener('click', e => {
  const btn = e.target.closest('.seg');
  if (!btn || btn.disabled || btn.dataset.kind === editingCatType) return;
  editingCatType = btn.dataset.kind;
  setCatTypeSeg(editingCatType);
});

$('#catEditSave').addEventListener('click', async () => {
  const name = $('#catEditName').value.trim();
  closeModal();
  try {
    if (editingCatId) {
      await invoke('update_category', { id: editingCatId, name, icon: pickedCatIcon, color: pickedCatColor });
      toast('已保存');
    } else {
      await invoke('add_category', { catType: editingCatType, name, icon: pickedCatIcon, color: pickedCatColor });
      toast('已添加分类');
    }
    await loadCategories();
    renderCatManage();
    openModal(catManageSheet);
    if ($('.page.active') && $('.page.active').id === 'page-home') { renderHome(); }
    renderStats();
  } catch (err) {
    toast('保存失败：' + err);
  }
});

$('#catEditDelete').addEventListener('click', async () => {
  if (!editingCatId) return;
  const id = editingCatId;
  const fallback = editingCatType === 'income' ? 'other_in' : 'other';
  let used = 0;
  try { used = await invoke('category_usage', { id }); } catch (e) {}
  if (used > 0) {
    const ok = confirm(`有 ${used} 条记录在使用该分类。\n删除后这些记录将转入「${fallback==='other'?'其他(支出)':'其他(收入)'}」，是否继续？`);
    if (!ok) return;
    try {
      await invoke('delete_category', { id, fallback });
      toast(`已删除，${used} 条记录转入「其他」`);
    } catch (err) {
      toast('删除失败：' + err); return;
    }
  } else {
    try {
      await invoke('delete_category', { id, fallback: null });
      toast('已删除分类');
    } catch (err) {
      toast('删除失败：' + err); return;
    }
  }
  closeModal();
  await loadCategories();
  renderCatManage();
  openModal(catManageSheet);
  if ($('.page.active') && $('.page.active').id === 'page-home') { renderHome(); }
  renderStats();
});

/* ================= 快捷记账模板 ================= */
let templates = [];             // 常用项，按创建时间升序
let targetTemplateId = null;    // 长按选中的常用项
let editingTemplateId = null;   // 非空 = 面板正处于「修改常用项」
let quickBusy = false;          // 防止连点重复记账
const QUICK_PRESS_MS = 420;

async function loadTemplates() {
  try {
    templates = await invoke('list_templates');
  } catch (e) {
    console.error('加载常用项失败', e);
    templates = [];
  }
}

function tplAmount(t) { return Number(t.amount); }

/** 面板里当前的「类型 + 金额 + 分类 + 备注」是否已收藏 */
function findFavTemplate() {
  const cents = Math.round(parseFloat(amountStr || '0') * 100);
  const note = $('#noteInput').value.trim();
  return templates.find(t =>
    t.type === curType &&
    t.category === curCat &&
    Math.round(tplAmount(t) * 100) === cents &&
    (t.note || '') === note
  ) || null;
}

function updateFavState() {
  const btn = $('#favBtn');
  const hint = $('#favHint');
  if (editingTemplateId) {
    btn.hidden = true;
    hint.hidden = false;
    return;
  }
  hint.hidden = true;
  btn.hidden = false;
  const hit = findFavTemplate();
  btn.classList.toggle('on', !!hit);
  $('#favStar').textContent = hit ? '★' : '☆';
  $('#favText').textContent = hit ? '已收藏' : '收藏为常用';
  btn.dataset.tplId = hit ? hit.id : '';
}

function renderQuickRow() {
  const row = $('#quickRow');
  if (!row) return;
  // 搜索 / 多选时先让位，避免和列表语义打架
  if (selectMode || normalizeForSearch(searchQuery.trim())) {
    row.style.display = 'none';
    return;
  }
  row.style.display = '';
  row.innerHTML = templates.map(t => {
    const cat = CAT_MAP[t.category] || DEFAULT_CAT;
    return `<button class="quick-chip" data-id="${t.id}">
      <span class="qc-ic">${cat.icon}</span>
      <span class="qc-name">${escapeHtml(t.note || cat.name)}</span>
      <span class="qc-amt">${fmtMoney(tplAmount(t))}</span>
    </button>`;
  }).join('');
  $$('#quickRow .quick-chip').forEach(bindQuickChip);
}

function bindQuickChip(chip) {
  let pressTimer = null, longFired = false, moved = false, startX = 0, startY = 0;
  const clearPress = () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } };

  chip.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    longFired = false;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    clearPress();
    pressTimer = setTimeout(() => {
      pressTimer = null;
      if (moved) return;
      longFired = true;
      if (navigator.vibrate) navigator.vibrate(12);
      showTemplateSheet(chip.dataset.id);
    }, QUICK_PRESS_MS);
  });

  // 横滑翻看或手指抖动时取消长按
  chip.addEventListener('pointermove', e => {
    if (Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8) {
      moved = true;
      clearPress();
    }
  });

  chip.addEventListener('pointerup', e => {
    clearPress();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (longFired) { longFired = false; return; }
    quickRecord(chip.dataset.id);
  });

  chip.addEventListener('pointercancel', () => { clearPress(); longFired = false; });
}

/** 一键记账：不打开面板，直接按模板记一笔今天的账 */
async function quickRecord(id) {
  const t = templates.find(x => x.id === id);
  if (!t) return;
  // 防连点窗口内不再静默丢弃，给个轻提示让用户知道这一下没记上
  if (quickBusy) {
    toast('点太快了，请再点一次');
    return;
  }
  quickBusy = true;
  try {
    await invoke('add_tx', {
      txType: t.type,
      amount: t.amount,
      category: t.category,
      note: t.note,
      date: todayStr(),
    });
    await refreshTxs();
    await loadBudget();
    const ym = todayStr().slice(0, 7);
    if (ym !== viewMonth && !searchQuery) viewMonth = ym;
    renderHome();
    renderStats();
    updateRecordCount();
    const fresh = $(`#quickRow .quick-chip[data-id="${t.id}"]`);
    if (fresh) {
      fresh.classList.add('done');
      fresh.innerHTML = `<span class="qc-ic">✓</span><span class="qc-name">已记录</span>`;
    }
    const name = t.note || (CAT_MAP[t.category] || {}).name || '一笔';
    const todaySpent = todayExpense();
    if (navigator.vibrate) navigator.vibrate(10);
    toast(todaySpent > 0 ? `已记录 ${name} · 今日已花 ${fmtMoneyShort(todaySpent)}` : `已记录 ${name}`);
    setTimeout(() => { if (!selectMode) renderQuickRow(); }, 800);
  } catch (e) {
    toast('记录失败：' + e);
  } finally {
    setTimeout(() => { quickBusy = false; }, 350);
  }
}

function showTemplateSheet(id) {
  const t = templates.find(x => x.id === id);
  if (!t) return;
  targetTemplateId = id;
  const cat = CAT_MAP[t.category] || DEFAULT_CAT;
  $('#tplHead').innerHTML = `${cat.icon}<span>${escapeHtml(t.note || cat.name)}　${fmtMoney(tplAmount(t))}</span>`;
  openModal(tplSheet);
}

async function deleteTemplate(id) {
  const t = templates.find(x => x.id === id);
  closeModal();
  try {
    await invoke('delete_template', { id });
    await loadTemplates();
    renderQuickRow();
    updateFavState();
    toast(t && t.note ? `已删除「${t.note}」` : '已删除常用项');
  } catch (e) {
    toast('删除失败：' + e);
  }
}

$('#tplSheet').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const act = btn.dataset.act;
  if (act === 'tplEdit') {
    const t = templates.find(x => x.id === targetTemplateId);
    closeModal();
    if (t) openSheet(t);
  } else if (act === 'tplDelete') {
    deleteTemplate(targetTemplateId);
  } else if (act === 'cancel') {
    closeModal();
  }
});

$('#favBtn').addEventListener('click', async () => {
  if (editingTemplateId) return;
  const amt = parseFloat(amountStr);
  if (!amt || amt <= 0) {
    amountDisplay.classList.remove('shake');
    void amountDisplay.offsetWidth;
    amountDisplay.classList.add('shake');
    if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
    return;
  }
  const existingId = $('#favBtn').dataset.tplId;
  const note = $('#noteInput').value.trim();
  try {
    if (existingId) {
      await invoke('delete_template', { id: existingId });
      toast('已取消收藏');
    } else {
      await invoke('add_template', { txType: curType, amount: amountStr, category: curCat, note });
      toast('已加入常用');
    }
    await loadTemplates();
    renderQuickRow();
    updateFavState();
  } catch (e) {
    toast(String(e));
  }
});

$('#noteInput').addEventListener('input', updateFavState);

/* ================= 月度预算 ================= */
const BUDGET_WARN_RATIO = 0.8;
let monthlyBudget = null;   // 当前查看月份的预算（元）；null = 未设置
let budgetDraft = '0';      // 弹层里正在输入的金额字符串

async function loadBudget() {
  const month = viewMonth;
  try {
    const b = await invoke('get_budget', { month });
    if (month === viewMonth) monthlyBudget = (b === null || b === undefined) ? null : Number(b);
  } catch (e) {
    if (month === viewMonth) monthlyBudget = null;
  }
}

function renderBudget() {
  const strip = $('#budgetStrip');
  if (!strip) return;

  // 搜索态下汇总卡的金额是过滤结果，隐藏预算行避免语义打架
  strip.style.display = normalizeForSearch(searchQuery.trim()) ? 'none' : '';

  const textEl = $('#budgetText');
  const subEl = $('#budgetSub');
  const fillEl = $('#budgetFill');
  strip.classList.remove('warn', 'over');

  if (!monthlyBudget || monthlyBudget <= 0) {
    strip.classList.add('is-empty');
    textEl.textContent = '设置本月预算';
    subEl.textContent = '';
    fillEl.style.width = '0%';
    return;
  }
  strip.classList.remove('is-empty');

  // 本月支出：只看 viewMonth，不受搜索影响
  const spent = txs
    .filter(t => t.type === 'expense' && t.date.startsWith(viewMonth))
    .reduce((s, t) => s + t.amount, 0);
  const ratio = spent / monthlyBudget;
  const left = monthlyBudget - spent;

  if (left >= 0) {
    textEl.textContent = `预算还剩 ${fmtMoney(left)}`;
    if (ratio >= BUDGET_WARN_RATIO) {
      strip.classList.add('warn');
      subEl.textContent = `已花 ${fmtMoney(spent)} / ${fmtMoney(monthlyBudget)} · 快用完了`;
    } else {
      subEl.textContent = `已花 ${fmtMoney(spent)} / ${fmtMoney(monthlyBudget)}`;
    }
  } else {
    strip.classList.add('over');
    textEl.textContent = `本月已超支 ${fmtMoney(-left)}`;
    subEl.textContent = `已花 ${fmtMoney(spent)} / ${fmtMoney(monthlyBudget)}`;
  }
  fillEl.style.width = Math.min(100, ratio * 100).toFixed(1) + '%';
}

function renderBudgetSettingRow() {
  const el = $('#budgetSettingSub');
  if (!el) return;
  const [yy, mm] = viewMonth.split('-').map(Number);
  el.textContent = (monthlyBudget && monthlyBudget > 0)
    ? `${yy}年${mm}月 · ${fmtMoney(monthlyBudget)}`
    : `${yy}年${mm}月 · 未设置`;
}

function updateBudgetDisplay() {
  $('#budgetAmountDisplay').textContent = '¥' + budgetDraft;
}

function openBudgetSheet() {
  const has = monthlyBudget && monthlyBudget > 0;
  budgetDraft = has ? String(monthlyBudget) : '0';
  if (budgetDraft.endsWith('.0')) budgetDraft = budgetDraft.slice(0, -2);
  const [yy, mm] = viewMonth.split('-').map(Number);
  $('#budgetSheetHead').textContent = `${yy}年${mm}月预算`;
  $('#budgetClear').hidden = !has;
  updateBudgetDisplay();
  openModal(budgetSheet);
}

$('#budgetStrip').addEventListener('click', openBudgetSheet);

const _budgetSettingBtn = $('#budgetSettingBtn');
if (_budgetSettingBtn) _budgetSettingBtn.addEventListener('click', openBudgetSheet);

$('#budgetKeypad').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const k = btn.dataset.k;
  if (k === 'del') {
    budgetDraft = budgetDraft.length > 1 ? budgetDraft.slice(0, -1) : '0';
    if (budgetDraft === '') budgetDraft = '0';
  } else if (k === '.') {
    if (!budgetDraft.includes('.')) budgetDraft += '.';
  } else {
    if (budgetDraft === '0') {
      budgetDraft = k;
    } else {
      const parts = budgetDraft.split('.');
      if (parts[1] !== undefined && parts[1].length >= 2) return;
      if (parts[0].length >= 9 && parts[1] === undefined) return;
      budgetDraft += k;
    }
  }
  updateBudgetDisplay();
});

$('#budgetSave').addEventListener('click', async () => {
  const amt = parseFloat(budgetDraft);
  if (!amt || amt <= 0) {
    $('#budgetAmountDisplay').style.color = 'var(--red)';
    setTimeout(() => { $('#budgetAmountDisplay').style.color = ''; }, 400);
    return;
  }
  try {
    await invoke('set_budget', { month: viewMonth, amount: amt });
    await loadBudget();
    renderBudget();
    renderBudgetSettingRow();
    toast('预算已保存');
  } catch (e) {
    toast('保存失败：' + e);
  }
  closeModal();
});

$('#budgetClear').addEventListener('click', async () => {
  try {
    await invoke('set_budget', { month: viewMonth, amount: null });
    await loadBudget();
    renderBudget();
    renderBudgetSettingRow();
    toast('已清除本月预算');
  } catch (e) {
    toast('清除失败：' + e);
  }
  closeModal();
});

/* ================= 弹层系统 ================= */
const modalMask      = $('#modalMask');
const actionSheet    = $('#actionSheet');
const editTypeSheet  = $('#editTypeSheet');
const editAmountSheet = $('#editAmountSheet');
const editDateSheet  = $('#editDateSheet');
const confirmBox     = $('#confirmBox');
const monthPickerSheet = $('#monthPickerSheet');
const weekPickerSheet  = $('#weekPickerSheet');
const dayPickerSheet   = $('#dayPickerSheet');
const calSheet         = $('#calSheet');
const batchCatSheet    = $('#batchCatSheet');
const budgetSheet      = $('#budgetSheet');
const tplSheet         = $('#tplSheet');
const catManageSheet   = $('#catManageSheet');
const catEditSheet     = $('#catEditSheet');
const aiKeySheet       = $('#aiKeySheet');
const aiProviderSheet  = $('#aiProviderSheet');
const periodSheet      = $('#periodSheet');
const lockManageSheet  = $('#lockManageSheet');
const lockConfirmSheet = $('#lockConfirmSheet');
const lockEnableSheet  = $('#lockEnableSheet');
const catRuleSheet     = $('#catRuleSheet');
const exportFormatSheet= $('#exportFormatSheet');
const importFormatSheet= $('#importFormatSheet');
const allPanels = [actionSheet, editTypeSheet, editAmountSheet, editDateSheet,
                   monthPickerSheet, weekPickerSheet, dayPickerSheet, batchCatSheet, budgetSheet,
                   tplSheet, calSheet, catManageSheet, catEditSheet, aiKeySheet, aiProviderSheet,
                   periodSheet, lockManageSheet, lockConfirmSheet, lockEnableSheet, catRuleSheet, exportFormatSheet, importFormatSheet];

let activePanel = null;
let modalOpenedAt = 0;   // 弹层打开时刻，用于忽略紧随其后的「幽灵 click」
let sheetOpenedAt = 0;
let targetTxId = null;
let editAmountStr = '0';
let editDateStr = todayStr();

let monthPickerCallback = null;
let weekPickerCallback = null;
let dayPickerCallback = null;

function openModal(panel) {
  allPanels.forEach(p => p.classList.toggle('show', p === panel));
  confirmBox.classList.toggle('show', panel === 'alert');
  modalMask.classList.add('show');
  document.body.classList.add('modal-open');
  activePanel = panel;
  modalOpenedAt = Date.now();
}

/* 新增的三个面板（API Key / 服务商 / 结余范围）的「取消」按钮：
   它们不像老面板那样各自绑过 data-act="cancel"，这里统一补上，否则点了没反应 */
[aiKeySheet, aiProviderSheet, periodSheet, catRuleSheet, exportFormatSheet, importFormatSheet].forEach(p => {
  if (!p) return;
  p.addEventListener('click', e => {
    if (e.target.closest('[data-act="cancel"]')) closeModal();
  });
});

function closeModal() {
  allPanels.forEach(p => p.classList.remove('show'));
  confirmBox.classList.remove('show');
  modalMask.classList.remove('show');
  document.body.classList.remove('modal-open');
  activePanel = null;
  monthPickerCallback = null;
  weekPickerCallback = null;
  dayPickerCallback = null;
}

/* ================= 记录操作菜单 ================= */
function showActionSheet(id) {
  const tx = txs.find(t => String(t.id) === String(id));
  if (!tx) {
    // 以前这里静默返回，出问题时完全看不出发生了什么
    toast('这条记录已不存在，请重新打开页面');
    return;
  }
  targetTxId = id;
  const cat = CAT_MAP[tx.category] || DEFAULT_CAT;
  const sign = tx.type === 'income' ? '+' : '-';
  $('#actionHead').innerHTML = `${cat.icon}<span>${escapeHtml(cat.name)}　${sign}${fmtMoney(tx.amount)}</span>`;
  openModal(actionSheet);
}

function showEditType() { openModal(editTypeSheet); }

function showEditAmount() {
  const tx = txs.find(t => String(t.id) === String(targetTxId));
  if (!tx) return;
  editAmountStr = String(tx.amount);
  if (editAmountStr.endsWith('.0')) editAmountStr = editAmountStr.slice(0, -2);
  updateEditAmountDisplay();
  openModal(editAmountSheet);
}

function updateEditAmountDisplay() {
  $('#editAmountDisplay').textContent = '¥' + editAmountStr;
}

$('#editKeypad').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const k = btn.dataset.k;
  if (k === 'del') {
    editAmountStr = editAmountStr.length > 1 ? editAmountStr.slice(0, -1) : '0';
    if (editAmountStr === '') editAmountStr = '0';
  } else if (k === '.') {
    if (!editAmountStr.includes('.')) editAmountStr += '.';
  } else {
    if (editAmountStr === '0') {
      editAmountStr = k;
    } else {
      const parts = editAmountStr.split('.');
      if (parts[1] !== undefined && parts[1].length >= 2) return;
      if (parts[0].length >= 9 && parts[1] === undefined) return;
      editAmountStr += k;
    }
  }
  updateEditAmountDisplay();
});

$('#editAmountSave').addEventListener('click', async () => {
  const amt = parseFloat(editAmountStr);
  if (!amt || amt <= 0) {
    $('#editAmountDisplay').style.color = 'var(--red)';
    setTimeout(() => $('#editAmountDisplay').style.color = '', 400);
    return;
  }
  try {
    await invoke('update_amount', { id: String(targetTxId), amount: editAmountStr });
    await refreshTxs();
    renderHome();
    renderStats();
    toast('金额已修改');
  } catch (e) {
    toast('修改失败：' + e);
  }
  closeModal();
});

function showEditDate() {
  const tx = txs.find(t => String(t.id) === String(targetTxId));
  if (!tx) return;
  editDateStr = tx.date;
  renderEditDateList();
  openModal(editDateSheet);
  setTimeout(() => {
    const list = $('#editDateList');
    const activeItem = list.querySelector('.edit-date-item.active');
    if (activeItem) {
      list.scrollTop = activeItem.offsetTop - list.clientHeight / 2 + activeItem.clientHeight / 2;
    }
  }, 60);
}

function renderEditDateList() {
  const today = new Date();
  const days = [];
  for (let i = 365; i >= -365; i--) {
    days.push(fmtDate(addDays(today, -i)));
  }
  if (!days.includes(editDateStr)) {
    days.push(editDateStr);
    days.sort();
  }

  let html = '';
  let lastYM = '';
  days.forEach(ds => {
    const ym = ds.slice(0, 7);
    if (ym !== lastYM) {
      lastYM = ym;
      const [y, m] = ym.split('-').map(Number);
      html += `<div class="date-month-header">${y}年${m}月</div>`;
    }
    let label;
    if (ds === todayStr()) label = '今日';
    else if (ds === fmtDate(addDays(new Date(), -1))) label = '昨日';
    else {
      const d = parseDate(ds);
      label = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }
    html += `<div class="edit-date-item ${ds === editDateStr ? 'active' : ''}" data-date="${ds}">
      <span>${label}</span>
      <span class="check">✓</span>
    </div>`;
  });
  $('#editDateList').innerHTML = html;
}

$('#editDateList').addEventListener('click', e => {
  const item = e.target.closest('.edit-date-item');
  if (!item) return;
  editDateStr = item.dataset.date;
  $$('#editDateList .edit-date-item').forEach(i => i.classList.toggle('active', i === item));
});

$('#editDateSave').addEventListener('click', async () => {
  try {
    await invoke('update_date', { id: String(targetTxId), date: editDateStr });
    await refreshTxs();
    const newYM = editDateStr.slice(0, 7);
    if (newYM !== viewMonth) viewMonth = newYM;
    renderHome();
    renderStats();
    toast('时间已修改');
  } catch (e) {
    toast('修改失败：' + e);
  }
  closeModal();
});

function showConfirmDelete() { openModal('alert'); }

$('#confirmDeleteBtn').addEventListener('click', async () => {
  try {
    await invoke('delete_tx', { id: String(targetTxId) });
    await refreshTxs();
    closeModal();
    renderHome();
    renderStats();
    updateRecordCount();
    toast('已删除');
  } catch (e) {
    toast('删除失败：' + e);
    closeModal();
  }
});

[actionSheet, editTypeSheet].forEach(sheet => {
  sheet.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'edit') showEditType();
    else if (act === 'delete') showConfirmDelete();
    else if (act === 'multi') { closeModal(); enterSelect(targetTxId); }
    else if (act === 'editAmount') showEditAmount();
    else if (act === 'editDate') showEditDate();
    else if (act === 'cancel') closeModal();
  });
});

[editAmountSheet, editDateSheet, confirmBox, budgetSheet].forEach(panel => {
  panel.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.act === 'cancel') closeModal();
  });
});

// 移动端「幽灵 click」：行的点按是在 touchend / pointerup 上处理的，
// 弹层遮罩在那之后、浏览器补发 click 之前就已经显示出来，
// 这个补发的 click 会正好落在全屏遮罩上并立刻 closeModal（表现为点了没反应）。
// 桌面端鼠标 click 的目标是按下/抬起时的元素，所以一直没暴露。
modalMask.addEventListener('click', () => {
  if (Date.now() - modalOpenedAt < 450) return;
  closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (activePanel) closeModal();
  else if (selectMode) exitSelect();
});

/* ================= 月份选择器 ================= */
function openMonthPicker(currentYM, onPick) {
  const today = new Date();
  const months = [];
  for (let i = 12; i >= -3; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(d.getFullYear() + '-' + pad2(d.getMonth() + 1));
  }
  const curYM = todayStr().slice(0, 7);

  $('#monthPickerGrid').innerHTML = months.map(ym => {
    const [y, m] = ym.split('-').map(Number);
    const label = y + '年' + m + '月';
    const cls = [
      'month-cell',
      ym === currentYM ? 'active' : '',
      ym === curYM ? 'is-today' : ''
    ].filter(Boolean).join(' ');
    return `<button class="${cls}" data-ym="${ym}">${label}</button>`;
  }).join('');

  monthPickerCallback = onPick;
  openModal(monthPickerSheet);
}

$('#monthPickerGrid').addEventListener('click', e => {
  const btn = e.target.closest('.month-cell');
  if (!btn) return;
  const ym = btn.dataset.ym;
  const cb = monthPickerCallback;
  closeModal();
  if (cb) cb(ym);
});

/* ================= 周选择器 ================= */
function openWeekPicker(currentDate, onPick) {
  const today = new Date();
  const thisWeekStart = startOfWeek(today);
  const curWeekStart = startOfWeek(currentDate);

  const weeks = [];
  for (let i = 12; i >= -3; i--) {
    weeks.push(addDays(thisWeekStart, i * 7));
  }

  $('#weekPickerList').innerHTML = weeks.map(start => {
    const end = addDays(start, 6);
    const isThisWeek = fmtDate(start) === fmtDate(thisWeekStart);
    const isActive = fmtDate(start) === fmtDate(curWeekStart);
    const rangeTxt = (start.getMonth() + 1) + '月' + start.getDate() + '日 - ' +
                     (end.getMonth() + 1) + '月' + end.getDate() + '日';
    const label = isThisWeek ? '本周 (' + rangeTxt + ')' : rangeTxt;
    return `<div class="picker-item ${isActive ? 'active' : ''}" data-start="${fmtDate(start)}">
      <span>${label}</span>
      <span class="check">✓</span>
    </div>`;
  }).join('');

  weekPickerCallback = onPick;
  openModal(weekPickerSheet);
}

$('#weekPickerList').addEventListener('click', e => {
  const item = e.target.closest('.picker-item');
  if (!item) return;
  const ds = item.dataset.start;
  const cb = weekPickerCallback;
  closeModal();
  if (cb) cb(ds);
});

/* ================= 天选择器 ================= */
function openDayPicker(currentDate, onPick) {
  const today = new Date();
  const curDs = fmtDate(currentDate);
  const todayDs = fmtDate(today);
  const yesterdayDs = fmtDate(addDays(today, -1));

  const days = [];
  for (let i = 12; i >= -3; i--) {
    days.push(addDays(today, -i));
  }

  const WEEK = ['日','一','二','三','四','五','六'];
  $('#dayPickerList').innerHTML = days.map(d => {
    const ds = fmtDate(d);
    let label;
    if (ds === todayDs) label = '今日';
    else if (ds === yesterdayDs) label = '昨日';
    else {
      const wd = WEEK[d.getDay()];
      label = (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + wd;
    }
    return `<div class="picker-item ${ds === curDs ? 'active' : ''}" data-date="${ds}">
      <span>${label}</span>
      <span class="check">✓</span>
    </div>`;
  }).join('');

  dayPickerCallback = onPick;
  openModal(dayPickerSheet);
}

$('#dayPickerList').addEventListener('click', e => {
  const item = e.target.closest('.picker-item');
  if (!item) return;
  const ds = item.dataset.date;
  const cb = dayPickerCallback;
  closeModal();
  if (cb) cb(ds);
});

/* ================= 明细页月份标签点击 ================= */
$('#summaryLabel').addEventListener('click', () => {
  openMonthPicker(viewMonth, async (ym) => {
    viewMonth = ym;
    await loadBudget();
    if (selectMode) exitSelect(); else renderHome();
    renderBudgetSettingRow();
  });
});

/* ================= 搜索交互 ================= */
$('#searchToggle').addEventListener('click', () => {
  const bar = $('#searchBar');
  const toggle = $('#searchToggle');
  const isOpen = bar.classList.contains('show');
  if (isOpen) {
    bar.classList.remove('show');
    toggle.classList.remove('active');
    searchQuery = '';
    $('#searchInput').value = '';
    if (selectMode) exitSelect(); else renderHome();
  } else {
    bar.classList.add('show');
    toggle.classList.add('active');
    setTimeout(() => $('#searchInput').focus(), 100);
  }
});

$('#searchInput').addEventListener('input', e => {
  searchQuery = e.target.value;
  if (selectMode) exitSelect(); else renderHome();
});

$('#searchClear').addEventListener('click', () => {
  $('#searchInput').value = '';
  searchQuery = '';
  if (selectMode) exitSelect(); else renderHome();
  $('#searchInput').focus();
});

/* ================= 统计页 ================= */
let curPeriod = 'month';
let statsDate = new Date();

function periodLabel(period, ref) {
  const today = new Date();
  if (period === 'year') return ref.getFullYear() + '年';
  if (period === 'month') {
    const isThis = ref.getFullYear() === today.getFullYear() && ref.getMonth() === today.getMonth();
    if (isThis) return '本月';
    const isThisYear = ref.getFullYear() === today.getFullYear();
    return isThisYear
      ? (ref.getMonth() + 1) + '月'
      : (ref.getFullYear() + '年' + (ref.getMonth() + 1) + '月');
  }
  if (period === 'week') {
    const isThis = fmtDate(startOfWeek(ref)) === fmtDate(startOfWeek(today));
    if (isThis) return '本周';
    const start = startOfWeek(ref);
    const end = addDays(start, 6);
    return (start.getMonth() + 1) + '月' + start.getDate() + '日 - ' +
           (end.getMonth() + 1) + '月' + end.getDate() + '日';
  }
  if (period === 'day') {
    if (fmtDate(ref) === fmtDate(today)) return '今日';
    if (fmtDate(ref) === fmtDate(addDays(today, -1))) return '昨日';
    return (ref.getMonth() + 1) + '月' + ref.getDate() + '日';
  }
}

function getPeriodRange(period) {
  const ref = statsDate;
  if (period === 'year') {
    const start = new Date(ref.getFullYear(), 0, 1);
    const end   = new Date(ref.getFullYear(), 11, 31);
    return { start: fmtDate(start), end: fmtDate(end), label: periodLabel(period, ref) };
  }
  if (period === 'week') {
    const start = startOfWeek(ref);
    const end   = addDays(start, 6);
    return { start: fmtDate(start), end: fmtDate(end), label: periodLabel(period, ref) };
  }
  if (period === 'day') {
    const ds = fmtDate(ref);
    return { start: ds, end: ds, label: periodLabel(period, ref) };
  }
  const start = new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end   = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  return { start: fmtDate(start), end: fmtDate(end), label: periodLabel(period, ref) };
}

function renderStats() {
  const range = getPeriodRange(curPeriod);
  const periodTx = txs.filter(t => t.date >= range.start && t.date <= range.end);

  const expense = periodTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const income  = periodTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const totalEl = $('#statsTotal');
  totalEl.classList.remove('pos', 'neg');
  if (balance > 0) totalEl.classList.add('pos');
  else if (balance < 0) totalEl.classList.add('neg');

  animateNumber(totalEl, Number(totalEl.dataset.val || 0), balance, 620, fmtMoneySigned);
  totalEl.dataset.val = balance;

  $('#statsTitle').innerHTML = range.label + '结余 <span class="arrow">▼</span>';
  $('#statsIncome').textContent  = fmtMoney(income);
  $('#statsExpense').textContent = fmtMoney(expense);

  animateNumber($('#donutValue'), Number($('#donutValue').dataset.val || 0), expense, 620, fmtMoney);
  $('#donutValue').dataset.val = expense;

  const byCat = {};
  periodTx.filter(t => t.type === 'expense').forEach(t => {
    byCat[t.category] = (byCat[t.category] || 0) + t.amount;
  });
  const entries = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const total = expense;

  const R = 52, C = 2 * Math.PI * R;
  const donut = $('#donut');

  if (!entries.length) {
    donut.innerHTML = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--fill)" stroke-width="16"/>`;
    $('#catList').innerHTML = emptyState({
      variant: 'compact',
      icon: IC('<circle cx="12" cy="12" r="8.2"/><path d="M12 12l3-3"/>'),
      title: '该周期还没有支出',
    });
    return;
  }

  let offset = 0;
  let svg = `<circle cx="70" cy="70" r="${R}" fill="none" stroke="var(--fill)" stroke-width="16"/>`;
  entries.forEach(([id, amt]) => {
    const cat = CAT_MAP[id] || { color: '#8E8E93' };
    const len = (amt / total) * C;
    const gap = entries.length > 1 ? 2 : 0;
    svg += `<circle class="ring-seg" cx="70" cy="70" r="${R}" fill="none"
      stroke="${cat.color}" stroke-width="16"
      stroke-dasharray="0 ${C}" stroke-dashoffset="${-offset}"
      transform="rotate(-90 70 70)"
      data-dash="${Math.max(len - gap, 0.5)} ${C - Math.max(len - gap, 0.5)}"></circle>`;
    offset += len;
  });
  donut.innerHTML = svg;

  let html = '';
  entries.forEach(([id, amt], i) => {
    const cat = CAT_MAP[id] || { name: '其他', color: '#8E8E93' };
    const pct = (amt / total) * 100;
    html += `<div class="cat-row" style="animation-delay:${i * 45}ms">
      <div class="cat-dot" style="background:${cat.color}"></div>
      <div class="cat-mid">
        <div class="cat-line"><span>${escapeHtml(cat.name)}</span><span class="pct">${pct.toFixed(1)}%</span></div>
        <div class="cat-bar"><i data-w="${pct}" style="background:${cat.color}"></i></div>
      </div>
      <div class="cat-amt">${fmtMoney(amt)}</div>
    </div>`;
  });
  $('#catList').innerHTML = html;

  requestAnimationFrame(() => {
    donut.querySelectorAll('.ring-seg').forEach(el => {
      el.setAttribute('stroke-dasharray', el.dataset.dash);
    });
    $('#catList').querySelectorAll('.cat-bar i').forEach(el => {
      el.style.width = Math.max(parseFloat(el.dataset.w), 1.5) + '%';
    });
  });
}

/* 「结余范围」面板：取代原来顶部那排 年/月/周/天 分段控件。
   原来「切换具体月份/周/日期」藏在「点击已选中的分段按钮」上，几乎没人能发现；
   现在统一收进这个面板：点当前项 = 换具体范围，点其它项 = 换周期。 */
const PERIOD_ORDER = ['year', 'month', 'week', 'day'];

function periodRangeHint(p) {
  if (p === 'month') return '再次点击可切换具体月份';
  if (p === 'week') return '再次点击可切换具体周';
  if (p === 'day') return '再次点击可切换具体日期';
  return '';
}

function openPeriodSheet() {
  const list = $('#periodList');
  if (!list) return;
  list.innerHTML = PERIOD_ORDER.map(p => {
    const on = p === curPeriod;
    return '<button class="period-row' + (on ? ' sel' : '') + '" data-period="' + p + '">' +
      '<span class="period-row-main">' +
        '<span class="period-row-label">' + escapeHtml(periodLabel(p, statsDate)) + '结余</span>' +
        (on ? '<span class="period-row-hint">' + periodRangeHint(p) + '</span>' : '') +
      '</span>' +
      '<span class="period-row-check">' + (on ? IC('<path d="M4.5 12.5l4.3 4.3L19.5 7.2"/>') : '') + '</span>' +
    '</button>';
  }).join('');
  openModal(periodSheet);
}

/** 切换「具体范围」：月份 / 周 / 日期（年没有下级） */
function openRangePicker(p) {
  if (p === 'month') {
    const curYM = statsDate.getFullYear() + '-' + pad2(statsDate.getMonth() + 1);
    openMonthPicker(curYM, (ym) => {
      const [y, m] = ym.split('-').map(Number);
      statsDate = new Date(y, m - 1, 1);
      renderStats();
    });
  } else if (p === 'week') {
    openWeekPicker(statsDate, (startDs) => {
      statsDate = parseDate(startDs);
      renderStats();
    });
  } else if (p === 'day') {
    openDayPicker(statsDate, (ds) => {
      statsDate = parseDate(ds);
      renderStats();
    });
  }
}

const _statsTitle = $('#statsTitle');
if (_statsTitle) _statsTitle.addEventListener('click', openPeriodSheet);

const _periodList = $('#periodList');
if (_periodList) _periodList.addEventListener('click', e => {
  const row = e.target.closest('[data-period]');
  if (!row) return;
  const p = row.dataset.period;
  closeModal();
  if (p === curPeriod) {
    openRangePicker(p);
    return;
  }
  curPeriod = p;
  renderStats();
});

/* ================= 财报页：图表 / AI 分析 视图切换 ================= */
let statsView = 'chart';

function setStatsView(view) {
  statsView = (view === 'ai') ? 'ai' : 'chart';
  const seg = $('#statsViewSeg');
  if (seg) {
    seg.dataset.view = statsView;
    $$('#statsViewSeg .seg').forEach(b => b.classList.toggle('active', b.dataset.view === statsView));
  }
  const chart = $('#chartPanel');
  const ai = $('#aiPanel');
  if (chart) chart.hidden = statsView !== 'chart';
  if (ai) ai.hidden = statsView !== 'ai';
  if (statsView === 'ai') enterAiPage();
  else renderStats();
}

const _statsViewSeg = $('#statsViewSeg');
if (_statsViewSeg) _statsViewSeg.addEventListener('click', e => {
  const b = e.target.closest('.seg');
  if (!b) return;
  setStatsView(b.dataset.view);
});

/* ================= Tab 切换 ================= */
function switchTab(name) {
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + name));
  // 财报页内含「图表 / AI 分析」两个视图，进入时按当前视图渲染
  if (name === 'stats') setTimeout(() => setStatsView(statsView), 60);
  if (name === 'settings') { updateRecordCount(); renderBudgetSettingRow(); renderAiSettingsRows(); renderLockSettingRow(); }
}

$$('.tab').forEach(t => {
  t.addEventListener('click', () => {
    if (t.classList.contains('active')) return;
    switchTab(t.dataset.tab);
  });
});

/* ================= 记账面板 ================= */
let amountStr = '0';
let curType = 'expense';
let curCat = 'food';
let curDate = todayStr();

const sheet = $('#sheet');
const sheetMask = $('#sheetMask');
const amountDisplay = $('#amountDisplay');
const amountText = $('#amountText');

/** preset 传入常用项时为「修改常用项」模式，保存只更新模板 */
function openSheet(preset) {
  editingTemplateId = preset ? preset.id : null;
  amountStr = preset ? String(preset.amount).replace(/\.00$/, '') : '0';
  curType = preset ? preset.type : 'expense';
  curCat = preset ? preset.category : (CATEGORIES.expense[0] ? CATEGORIES.expense[0].id : '');
  curDate = todayStr();
  $('#noteInput').value = preset ? (preset.note || '') : '';
  $('#segmented').dataset.type = curType;
  $$('#segmented .seg').forEach(s => s.classList.toggle('active', s.dataset.type === curType));
  amountDisplay.classList.toggle('income', curType === 'income');
  updateAmountText();
  renderCatGrid();
  if (preset) {
    // 常用项与日期无关，不渲染日期行
    $('#dateBtn').style.display = 'none';
  } else {
    renderDateBtn();
    $('#dateBtn').style.display = '';
  }
  updateFavState();
  sheetMask.classList.add('show');
  sheet.classList.add('show');
  document.body.classList.add('sheet-open');
  sheetOpenedAt = Date.now();
  setTimeout(() => { sheet.scrollTop = 0; }, 50);
}

function closeSheet() {
  sheetMask.classList.remove('show');
  sheet.classList.remove('show');
  document.body.classList.remove('sheet-open');
  $('#noteInput').blur();
  editingTemplateId = null;
}

function updateAmountText() {
  amountText.textContent = amountStr;
  const len = amountStr.length;
  amountText.style.fontSize = len > 10 ? '28px' : len > 8 ? '34px' : len > 6 ? '38px' : '44px';
}

function renderCatGrid() {
  const list = CATEGORIES[curType];
  if (!list.some(c => c.id === curCat)) curCat = list[0].id;
  $('#catGrid').innerHTML = list.map(c => `
    <button class="cat-item ${c.id === curCat ? 'active' : ''}" data-id="${c.id}" style="--c:${c.color}">
      <span class="ic">${c.icon}</span>
      <span>${escapeHtml(c.name)}</span>
    </button>`).join('');
}

/* ============ 记账日期：按钮 + 日历（前后两个月） ============ */
let calYear, calMonth;   // 当前展示的月份

function renderDateBtn() {
  const d = parseDate(curDate);
  const t = todayStr();
  let label;
  if (curDate === t) label = '今日';
  else if (curDate === fmtDate(addDays(new Date(), -1))) label = '昨日';
  else if (d.getFullYear() === new Date().getFullYear()) label = `${d.getMonth() + 1}月${d.getDate()}日`;
  else label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  $('#dateBtn').innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.2" width="16" height="15" rx="2.6"/><path d="M4 9.4h16M8.2 3.2v4M15.8 3.2v4"/></svg><span>${label}</span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
}

// 可选的月范围：前后两个月（含当前月）
function calRange() {
  const now = new Date();
  const y0 = now.getFullYear(), m0 = now.getMonth();
  const min = new Date(y0, m0 - 2, 1);
  const max = new Date(y0, m0 + 2, 1);
  return { min, max };
}

function openCal() {
  const d = parseDate(curDate);
  calYear = d.getFullYear();
  calMonth = d.getMonth();
  renderCal();
  openModal(calSheet);
}

function renderCal() {
  $('#calTitle').textContent = `${calYear}年${calMonth + 1}月`;
  // 防呆：只允许在当前月前后两个月内翻页，边界处禁用箭头
  const { min, max } = calRange();
  const cur = new Date(calYear, calMonth, 1);
  $('#calPrev').disabled = cur <= min;
  $('#calNext').disabled = cur >= max;
  // 首页(1号)是周几：周一起（getDay 0=周日 → 转 6=周日）
  const first = new Date(calYear, calMonth, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = todayStr();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<span class="cal-void"></span>');
  for (let day = 1; day <= daysInMonth; day++) {
    const ds = fmtDate(new Date(calYear, calMonth, day));
    const ts = new Date(calYear, calMonth, day);
    const inRange = ts >= min && ts <= max;
    const sel = ds === curDate ? ' sel' : '';
    const isToday = ds === today ? ' today' : '';
    cells.push(inRange
      ? `<button class="cal-day${sel}${isToday}" data-date="${ds}">${day}</button>`
      : `<span class="cal-day off">${day}</span>`);
  }
  $('#calGrid').innerHTML = cells.join('');
}

$('#dateBtn').addEventListener('click', openCal);
$('#calPrev').addEventListener('click', e => {
  if (e.target.disabled) return;
  e.stopPropagation();
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCal();
});
$('#calNext').addEventListener('click', e => {
  if (e.target.disabled) return;
  e.stopPropagation();
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCal();
});
$('#calGrid').addEventListener('click', e => {
  const btn = e.target.closest('.cal-day');
  if (!btn || btn.classList.contains('off')) return;
  curDate = btn.dataset.date;
  renderDateBtn();
  closeModal();
});

$('#keypad').addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  pressKey(btn.dataset.k);
});

function pressKey(k) {
  if (k === 'del') {
    amountStr = amountStr.length > 1 ? amountStr.slice(0, -1) : '0';
    if (amountStr === '') amountStr = '0';
  } else if (k === '.') {
    if (!amountStr.includes('.')) amountStr += '.';
  } else {
    if (amountStr === '0') {
      amountStr = k;
    } else {
      const parts = amountStr.split('.');
      if (parts[1] !== undefined && parts[1].length >= 2) return;
      if (parts[0].length >= 9 && parts[1] === undefined) return;
      amountStr += k;
    }
  }
  updateAmountText();
  updateFavState();
}

$('#catGrid').addEventListener('click', e => {
  const btn = e.target.closest('.cat-item');
  if (!btn) return;
  curCat = btn.dataset.id;
  $$('#catGrid .cat-item').forEach(b => b.classList.toggle('active', b === btn));
  if (navigator.vibrate) navigator.vibrate(8);
  updateFavState();
});

$('#segmented').addEventListener('click', e => {
  const btn = e.target.closest('.seg');
  if (!btn) return;
  if (btn.dataset.type === curType) return;
  curType = btn.dataset.type;
  $('#segmented').dataset.type = curType;
  $$('#segmented .seg').forEach(s => s.classList.toggle('active', s.dataset.type === curType));
  amountDisplay.classList.toggle('income', curType === 'income');
  renderCatGrid();
  updateFavState();
});

let savingTx = false;   // 保存中：避免双击「保存」/ 连按回车重复记一笔

async function saveTx() {
  if (savingTx) return;
  const amt = parseFloat(amountStr);
  if (!amt || amt <= 0) {
    amountDisplay.classList.remove('shake');
    void amountDisplay.offsetWidth;
    amountDisplay.classList.add('shake');
    if (navigator.vibrate) navigator.vibrate([10, 40, 10]);
    return;
  }

  savingTx = true;
  try {
    // 修改常用项：只更新模板，不记账
    if (editingTemplateId) {
      try {
        await invoke('update_template', {
          id: editingTemplateId,
          txType: curType,
          amount: amountStr,
          category: curCat,
          note: $('#noteInput').value.trim(),
        });
        await loadTemplates();
        closeSheet();
        renderQuickRow();
        toast('常用项已更新');
      } catch (e) {
        toast('修改失败：' + e);
      }
      return;
    }

    try {
      await invoke('add_tx', {
        txType: curType,
        amount: amountStr,
        category: curCat,
        note: $('#noteInput').value.trim(),
        date: curDate,
      });
      await refreshTxs();
      closeSheet();
      const savedYM = curDate.slice(0, 7);
      if (savedYM !== viewMonth && !searchQuery) viewMonth = savedYM;
      renderHome();
      if ($('#page-stats').classList.contains('active')) renderStats();
      updateRecordCount();
      const spent = todayExpense();
      const msg = curType === 'income'
        ? '收入已记录'
        : (spent > 0 ? `支出已记录 · 今日已花 ${fmtMoneyShort(spent)}` : '支出已记录');
      setTimeout(() => showSavedFeedback(msg), 220);
    } catch (e) {
      toast('保存失败：' + e);
    }
  } finally {
    savingTx = false;
  }
}

$('#fab').addEventListener('click', () => openSheet());
$('#sheetCancel').addEventListener('click', closeSheet);
$('#sheetSave').addEventListener('click', saveTx);
sheetMask.addEventListener('click', () => {
  if (Date.now() - sheetOpenedAt < 450) return;
  closeSheet();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sheet.classList.contains('show')) closeSheet();
});

document.addEventListener('keydown', e => {
  if (!sheet.classList.contains('show')) return;
  if (document.activeElement === $('#noteInput')) return;
  if (/^[0-9.]$/.test(e.key)) { pressKey(e.key); e.preventDefault(); }
  else if (e.key === 'Backspace') { pressKey('del'); e.preventDefault(); }
  else if (e.key === 'Enter') { saveTx(); e.preventDefault(); }
});

/* ================= 数据导出 / 导入 ================= */
async function exportBackup() {
  try {
    const bytes = await invoke('read_db_bytes');
    const arr = new Uint8Array(bytes);

    const path = await window.__TAURI__.dialog.save({
      defaultPath: `ledger-backup-${todayStr()}.sqlite`,
      filters: [{ name: 'SQLite 数据库', extensions: ['sqlite', 'db'] }],
    });
    if (!path) return;

    await window.__TAURI__.fs.writeFile(path, arr);
    toast('备份已保存');
  } catch (e) {
    console.error('导出失败', e);
    toast('导出失败：' + e);
  }
}

/* ================= 导出流水到 Excel / CSV ================= */
function txCatName(t) {
  const c = CAT_MAP[t.category];
  return c ? c.name : '其他';
}

function txTypeLabel(t) {
  return t.type === 'expense' ? '支出' : '收入';
}

function buildExportRows(scope) {
  // scope: 'all' 导出全部；'month' 只导当前查看月份
  const list = scope === 'month'
    ? txs.filter(t => t.date.startsWith(viewMonth))
    : txs;
  return list
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map(t => {
      const amount = Number(t.amount) || 0;
      return {
        日期: t.date,
        类型: txTypeLabel(t),
        分类: txCatName(t),
        金额: t.type === 'expense' ? -amount : amount,
        备注: t.note || '',
      };
    });
}

function exportRowsToCsv(rows, path) {
  // 手动转 CSV（处理逗号/引号/换行）
  const esc = v => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const header = ['日期', '类型', '分类', '金额', '备注'];
  const lines = [header.join(',')];
  rows.forEach(r => lines.push(header.map(h => esc(r[h])).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  // 带 BOM，Excel 中文不乱码
  const buf = new Uint8Array([0xEF, 0xBB, 0xBF, ...blob]);
  return window.__TAURI__.fs.writeBinaryFile(path, buf);
}

async function exportRowsToXlsx(rows, path) {
  // 复用 SheetJS（与导入同一份本地静态库，不联网）
  await loadXLSX();
  if (!window.XLSX) throw new Error('Excel 解析库不可用');
  const header = ['日期', '类型', '分类', '金额', '备注'];
  const sheet = window.XLSX.utils.aoa_to_sheet([
    header, ...rows.map(r => header.map(h => r[h])),
  ]);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, sheet, '流水');
  const out = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  await window.__TAURI__.fs.writeBinaryFile(path, out);
}

async function exportTable(fmt) {
  try {
    const rows = buildExportRows('all');
    if (!rows.length) { toast('暂无记录可导出'); return; }
    const path = await window.__TAURI__.dialog.save({
      defaultPath: `ledger-${todayStr()}.${fmt === 'xlsx' ? 'xlsx' : 'csv'}`,
      filters: [{ name: fmt === 'xlsx' ? 'Excel 表格' : 'CSV 文本', extensions: [fmt] }],
    });
    if (!path) return;   // 用户取消
    if (fmt === 'xlsx') await exportRowsToXlsx(rows, path);
    else await exportRowsToCsv(rows, path);
    toast('已导出 ' + rows.length + ' 条记录');
  } catch (e) {
    console.error('导出表格失败', e);
    toast('导出失败：' + e);
  }
}

async function importBackup() {
  try {
    const selected = await window.__TAURI__.dialog.open({
      multiple: false,
      filters: [{ name: 'SQLite 数据库', extensions: ['sqlite', 'db'] }],
    });
    if (!selected) return;

    const ok = await confirmDialog(
      '导入会覆盖当前所有数据，且无法撤销。\n建议先导出备份。\n\n确认继续吗？'
    );
    if (!ok) return;

    const bytes = await window.__TAURI__.fs.readFile(selected);
    const arr = Array.from(bytes);
    const count = await invoke('import_db_data', { data: arr });

    await refreshTxs();
    await loadBudget();
    await loadTemplates();
    await loadCategories();   // 备份里带了分类，必须重新灌一次内存缓存，否则记录全显示成「其他」
    renderHome();
    renderStats();
    updateRecordCount();
    renderBudgetSettingRow();
    toast(`导入成功，共 ${count} 条记录`);
  } catch (e) {
    console.error('导入失败', e);
    toast('导入失败：' + e);
  }
}

function confirmDialog(msg) {
  return new Promise(resolve => {
    const box = document.createElement('div');
    box.style.cssText =
      'position:fixed;inset:0;z-index:999;' +
      'display:flex;align-items:center;justify-content:center;' +
      'background:rgba(0,0,0,0.36);';

    const card = document.createElement('div');
    card.style.cssText =
      'width:280px;background:var(--alert-bg);border-radius:var(--r-md);overflow:hidden;' +
      'backdrop-filter:blur(var(--blur-lg)) saturate(var(--sat));' +
      '-webkit-backdrop-filter:blur(var(--blur-lg)) saturate(var(--sat));' +
      'box-shadow:var(--sh-3);' +
      'font-family:inherit;color:var(--text);';

    // 正文用 textContent 写入：容器是 pre-wrap，若用模板字符串拼接，
    // 源码里的缩进空格会被当成正文，导致只有首行被顶进去（看着像首行居中）
    const text = document.createElement('div');
    text.style.cssText = 'padding:20px 18px;font-size:14px;line-height:1.5;white-space:pre-wrap;';
    text.textContent = msg;
    card.appendChild(text);

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;border-top:0.5px solid var(--sep);';
    const btnBase = 'flex:1;height:44px;font-size:16px;background:none;border:none;';
    const btnCancel = document.createElement('button');
    btnCancel.textContent = '取消';
    btnCancel.style.cssText = btnBase + 'color:var(--text2);';
    const btnOk = document.createElement('button');
    btnOk.textContent = '确定';
    btnOk.style.cssText = btnBase + 'color:var(--blue);font-weight:600;border-left:0.5px solid var(--sep);';
    actions.appendChild(btnCancel);
    actions.appendChild(btnOk);
    card.appendChild(actions);

    box.appendChild(card);
    document.body.appendChild(box);
    btnCancel.onclick = () => { box.remove(); resolve(false); };
    btnOk.onclick = () => { box.remove(); resolve(true); };
  });
}

async function clearAll() {
  const ok = await confirmDialog('确认清空所有记录？此操作无法撤销。');
  if (!ok) return;
  try {
    await invoke('clear_all_tx');
    await refreshTxs();
    renderHome();
    renderStats();
    updateRecordCount();
    toast('已清空所有记录');
  } catch (e) {
    toast('清空失败：' + e);
  }
}

const _clearAllBtn = $('#clearAllBtn');
if (_clearAllBtn) _clearAllBtn.addEventListener('click', clearAll);

/* ================= 导入 / 导出数据 ================= */
/* 「导出数据」：选择 Excel / CSV / SQLite */
const _exportDataBtn = $('#exportDataBtn');
if (_exportDataBtn) {
  _exportDataBtn.addEventListener('click', () => openModal(exportFormatSheet));
}
exportFormatSheet.addEventListener('click', e => {
  const btn = e.target.closest('[data-exportfmt]');
  if (!btn) return;
  closeModal();            // 先收起格式弹层
  const fmt = btn.dataset.exportfmt;
  if (fmt === 'sqlite') exportBackup();
  else exportTable(fmt);
});

/* 「导入数据」：选择 Excel / CSV（账单）/ SQLite（恢复） */
const _importDataBtn = $('#importDataBtn');
if (_importDataBtn) {
  _importDataBtn.addEventListener('click', () => openModal(importFormatSheet));
}
importFormatSheet.addEventListener('click', e => {
  const btn = e.target.closest('[data-importfmt]');
  if (!btn) return;
  closeModal();            // 先收起格式弹层
  const fmt = btn.dataset.importfmt;
  if (fmt === 'sqlite') importBackup();
  else importBill();
});

/* ================= 导入微信/支付宝账单（内部） ================= */

const CATEGORY_KEYWORDS = {
  food: [
    '美团','饿了么','肯德基','麦当劳','星巴克','瑞幸','luckin','咖啡','奶茶',
    '餐','饭','食','烧烤','火锅','串','煮','蒸','饺','面','粉','早点','午餐',
    '晚餐','夜宵','零食','卤','煲','鸡','鸭','鱼','虾','蟹','肠粉','沙县',
    '喜茶','奈雪','蜜雪','华莱士','汉堡','比萨','萨莉亚','食堂','便利',
    '沪上阿姨','柠檬茶','古茗','甜','蛋糕','面包','螺蛳粉','小吃','水饺'
  ],
  transport: [
    '深圳通','地铁','公交','车费','打车','滴滴','曹操','高德打车','12306',
    '高铁','火车','火车票','航空','机票','加油','中石化','中石油','停车',
    '过路','共享单车','哈啰','青桔','摩拜','乘车','过闸'
  ],
  shopping: [
    '淘宝','天猫','京东','拼多多','唯品会','苏宁','国美','商城','购物',
    '超市','便利店','百货','小米','华为','苹果','服装','衣','鞋','包',
    '罗森','全家','7-eleven','美宜佳','惠多','十分嘉','名创','屈臣氏',
    '山姆','盒马','永辉','零食很忙','零食有鸣','朴朴','小象'
  ],
  entertain: [
    '游戏','充值','月卡','点卡','电竞','网吧','网咖','电影','影院','ktv',
    '腾讯','网易','米哈游','库洛','异环','原神','王者','吃鸡','steam',
    'bilibili','哔哩','爱奇艺','腾讯视频','优酷','会员','网费','上网费',
    '腾讯天游','腾讯游戏','天游','酷狗','qq音乐','网易云'
  ],
  home: [
    '房租','租金','物业','水费','电费','燃气','暖气','宽带','电信','移动',
    '联通','话费','智小窝','公寓','水电','窝酷'
  ],
  medical: [
    '医院','药','诊所','药店','体检','口腔','牙','眼科','门诊','社康'
  ],
  study: [
    '学费','学校','学院','大学','培训','课程','书店','文具','图书','教育',
    '考试','驾校','职业','职院'
  ]
};

/* ---- 用户自定义分类规则 ---- */
/* 规则存于 settings 表 key='cat_rules'，value 为 JSON 数组：
   [{ kw: "沙县", cat: "food" }, { kw: "房东", cat: "home" }]
   默认按关键包含匹配；规则顺序即优先级，用户规则优先于内置关键词。 */
const CAT_RULES_KEY = 'cat_rules';
let CAT_RULES = [];

async function loadCatRules() {
  try {
    const raw = await invoke('get_setting', { key: CAT_RULES_KEY });
    let arr = [];
    if (raw) { try { arr = JSON.parse(raw); } catch (e) { arr = []; } }
    CAT_RULES = Array.isArray(arr) ? arr.filter(r => r && r.kw && r.cat) : [];
  } catch (e) { CAT_RULES = []; }
}

async function saveCatRules(list) {
  CAT_RULES = (list || []).filter(r => r && r.kw && r.cat);
  await invoke('set_setting', {
    key: CAT_RULES_KEY,
    value: JSON.stringify(CAT_RULES)
  });
}

function applyUserRules(text, t) {
  if (!t) return null;
  for (const r of CAT_RULES) {
    const kw = (r.kw || '').toLowerCase();
    if (kw && t.includes(kw)) return r.cat;
  }
  return null;
}

/* 调用点：账单导入（备注+商户+商品名） */
function autoCategorize(text) {
  const src = (text || '');
  const t = src.toLowerCase();
  if (!t) return 'other';
  const userCat = applyUserRules(src, t);
  if (userCat) return userCat;
  for (const [catId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (t.includes(kw.toLowerCase())) return catId;
    }
  }
  return 'other';
}

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

/* 把各种日期格式统一成 "YYYY-MM-DD" */
function normalizeDate(raw) {
  if (raw === null || raw === undefined) return null;

  // 情况 1：Date 对象
  if (raw instanceof Date && !isNaN(raw)) {
    const y = raw.getFullYear();
    const m = raw.getMonth() + 1;
    const d = raw.getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // 情况 2：Excel 序列号（20000 ~ 100000 之间的数字，覆盖 1954~2173 年）
  const num = Number(raw);
  if (!isNaN(num) && num > 20000 && num < 100000) {
    const epochUtc = Date.UTC(1899, 11, 30);   // Excel epoch
    const ms = epochUtc + num * 24 * 60 * 60 * 1000;
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const mo = d.getUTCMonth() + 1;
    const da = d.getUTCDate();
    return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
  }

  // 情况 3：字符串格式 "2026-09-24 ..." 或 "2026/09/24 ..."
  const m = String(raw).match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
  if (m) {
    return `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`;
  }

  return null;
}

function parseBillRows(rows) {
  if (!rows || rows.length === 0) throw new Error('空文件');

  let headerRowIdx = -1;
  let headerRow = null;
  for (let i = 0; i < Math.min(rows.length, 60); i++) {
    const row = rows[i] || [];
    const joined = row.map(c => String(c || '')).join('|');
    if (joined.includes('交易时间') || joined.includes('交易创建时间')) {
      headerRowIdx = i;
      headerRow = row.map(c => String(c || '').trim());
      break;
    }
  }
  if (headerRowIdx < 0) throw new Error('未找到表头');

  const findCol = (keywords) => {
    for (let i = 0; i < headerRow.length; i++) {
      for (const kw of keywords) {
        if (headerRow[i].includes(kw)) return i;
      }
    }
    return -1;
  };

  const colTime     = findCol(['交易时间', '交易创建时间']);
  const colMerchant = findCol(['交易对方', '对方']);
  const colProduct  = findCol(['商品']);
  const colDir      = findCol(['收/支', '收/付款', '收支']);
  const colAmount   = findCol(['金额']);
  const colStatus   = findCol(['当前状态', '交易状态']);

  if (colTime < 0 || colAmount < 0) throw new Error('缺少必要列');

  const items = [];
  let skipped = 0;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const rawTime = String(row[colTime] || '').trim();

    if (!rawTime) continue;

        const dateStr = normalizeDate(rawTime);
    if (!dateStr) { skipped++; continue; }

    const dirStr = colDir >= 0 ? String(row[colDir] || '').trim() : '';
    let txType = '';
    if (dirStr === '支出') txType = 'expense';
    else if (dirStr === '收入') txType = 'income';
    else { skipped++; continue; }

    const rawAmt = String(row[colAmount] || '').replace(/[^\d.]/g, '');
    if (!rawAmt) { skipped++; continue; }
    const amtNum = parseFloat(rawAmt);
    if (!amtNum || amtNum <= 0) { skipped++; continue; }

    const status = colStatus >= 0 ? String(row[colStatus] || '').trim() : '';
    if (txType === 'expense' && status.includes('已全额退款')) { skipped++; continue; }

    const merchant = colMerchant >= 0 ? String(row[colMerchant] || '').trim() : '';
    const product  = colProduct  >= 0 ? String(row[colProduct]  || '').trim() : '';
    let note = '';
    if (merchant && product && product !== '/') note = merchant + ' ' + product;
    else if (merchant) note = merchant;
    else if (product) note = product;
    note = note.replace(/\s+/g, ' ').trim().slice(0, 30);

    let category;
    if (txType === 'income') {
      const t = (note + ' ' + merchant + ' ' + product).toLowerCase();
      if (t.includes('红包')) category = 'redpack';
      else if (t.includes('工资')) category = 'salary';
      else if (t.includes('奖金')) category = 'bonus';
      else if (t.includes('理财') || t.includes('基金') || t.includes('股票') || t.includes('收益')) category = 'invest';
      else category = 'other_in';
    } else {
      category = autoCategorize(note + ' ' + merchant + ' ' + product);
    }

    items.push({
      type: txType,
      amount: amtNum.toFixed(2),
      category,
      note,
      date: dateStr,
    });
  }

  return { items, skipped };
}

// Excel 解析库（SheetJS）以静态文件随包分发：不联网、不依赖任何 CDN。
// 首次导入 Excel 时才加载，避免拖慢冷启动（CSV 路径完全不碰它）。
let xlsxLoading = null;

function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (!xlsxLoading) {
    xlsxLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/xlsx.full.min.js', document.baseURI).href;
      s.onload = () => (window.XLSX
        ? resolve(window.XLSX)
        : reject(new Error('Excel 解析库加载后未就绪')));
      s.onerror = () => {
        xlsxLoading = null;   // 允许下次重试
        reject(new Error('无法加载本地 Excel 解析库'));
      };
      document.head.appendChild(s);
    });
  }
  return xlsxLoading;
}

async function importBill() {
  try {
    const selected = await window.__TAURI__.dialog.open({
      multiple: false,
      filters: [{ name: '账单文件', extensions: ['xlsx', 'xls', 'csv'] }],
    });
    if (!selected) return;

    const bytes = await window.__TAURI__.fs.readFile(selected);
    const isCsv = selected.toLowerCase().endsWith('.csv');

    let rows;

    if (isCsv) {
      const bytesU8 = new Uint8Array(bytes);
      let text = new TextDecoder('utf-8', { fatal: false }).decode(bytesU8);

      if (text.includes('\uFFFD')) {
        console.log('UTF-8 解码有乱码，尝试 GBK');
        try {
          text = new TextDecoder('gbk').decode(bytesU8);
        } catch (_) {
          console.warn('GBK 解码失败，继续用 UTF-8');
        }
      }

      text = text.replace(/^\uFEFF/, '');
      const lines = text.split(/\r\n|\n|\r/);
      rows = lines.map(l => parseCsvLine(l));
    } else {
      let XLSX;
      try {
        XLSX = await loadXLSX();
      } catch (err) {
        console.error('加载 Excel 解析库失败', err);
        throw new Error('Excel 解析库加载失败，可把账单另存为 CSV 再导入');
      }
      const wb = XLSX.read(bytes, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      if (!sheet) throw new Error('Excel 里没有可读取的工作表');
      rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    }

    const { items, skipped } = parseBillRows(rows);
    if (items.length === 0) {
      toast('没有可导入的记录，可能全是退款或不计收支的交易');
      return;
    }

    const expCount = items.filter(i => i.type === 'expense').length;
    const incCount = items.filter(i => i.type === 'income').length;

    const catStats = {};
    items.filter(i => i.type === 'expense').forEach(i => {
      catStats[i.category] = (catStats[i.category] || 0) + 1;
    });
    const catLines = Object.entries(catStats)
      .sort((a, b) => b[1] - a[1])
      .map(([cid, n]) => {
        const name = CAT_MAP[cid] ? CAT_MAP[cid].name : cid;
        return `    ${name}：${n} 条`;
      })
      .join('\n');

    const ok = await confirmDialog(
      `识别到 ${items.length} 条记录\n` +
      `  支出 ${expCount} 条，收入 ${incCount} 条\n` +
      `  跳过 ${skipped} 条（中性交易/退款/无效）\n\n` +
      `将自动归类为：\n${catLines}\n\n` +
      `确认导入吗？`
    );
    if (!ok) return;

    const progress = showImportProgress(items.length);
    let done = 0;
    let failed = 0;
    try {
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        try {
          await invoke('add_tx', {
            txType: it.type,
            amount: it.amount,
            category: it.category,
            note: it.note,
            date: it.date,
          });
          done++;
        } catch (e) {
          // 不再静默吞掉：失败条数要报给用户，否则「导入成功」其实是丢账
          failed++;
          // 只记录错误本身：不把记录对象（含金额、备注）写进日志
          console.warn('单条导入失败', e);
        }
        // 按「处理进度」刷新，而不是按成功数：有失败时进度条也不会卡住
        if ((i + 1) % 10 === 0 || i + 1 === items.length) progress.update(i + 1);
      }
    } finally {
      progress.close();
    }

    await refreshTxs();
    renderHome();
    renderStats();
    updateRecordCount();
    toast(failed
      ? `导入完成：成功 ${done} 条，失败 ${failed} 条`
      : `导入完成：${done} 条`);
  } catch (e) {
    console.error('导入账单失败', e);
    toast('导入失败：' + (e && e.message ? e.message : e));
  }
}

/* ================= 设置页信息 ================= */
function updateRecordCount() {
  const el = $('#recordCount');
  if (el) el.textContent = `共 ${txs.length} 条记录`;
}

/* ================= AI 设置（服务商 / API Key / 隐私授权） ================= */

/* 预设服务商：接口地址与模型都能在弹层里手动改，任何 OpenAI 兼容服务都能接 */
const AI_PROVIDERS = [
  { id: 'deepseek',    name: 'DeepSeek',      note: '便宜快速，支持 JSON 输出', baseUrl: 'https://api.deepseek.com',                          model: 'deepseek-flash' },
  { id: 'zhipu',       name: '智谱 GLM',      note: '有免费模型',               baseUrl: 'https://open.bigmodel.cn/api/paas/v4',              model: 'glm-4-flash' },
  { id: 'siliconflow', name: '硅基流动',       note: '部分模型免费',             baseUrl: 'https://api.siliconflow.cn/v1',                     model: 'Qwen/Qwen3-8B' },
  { id: 'moonshot',    name: 'Kimi 月之暗面',  note: '中文长文友好',             baseUrl: 'https://api.moonshot.cn/v1',                        model: 'moonshot-v1-8k' },
  { id: 'qwen',        name: '通义千问',       note: '阿里云百炼',               baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { id: 'ark',         name: '火山方舟 豆包',  note: '字节跳动',                 baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',          model: 'doubao-1.5-lite-32k' },
  { id: 'openai',      name: 'OpenAI',        note: '官方接口',                 baseUrl: 'https://api.openai.com/v1',                         model: 'gpt-4o-mini' },
  { id: 'openrouter',  name: 'OpenRouter',    note: '一个 Key 用多家模型',       baseUrl: 'https://openrouter.ai/api/v1',                      model: 'openai/gpt-4o-mini' },
  { id: 'ollama',      name: 'Ollama 本地',    note: '不需要 Key，断网可用',      baseUrl: 'http://localhost:11434/v1',                         model: 'qwen2.5:7b' },
];

const AI_STORAGE = [
  { id: 'keyring', label: '钥匙串',     tip: '存进系统凭据管理器：不写进数据库，导出的备份里也不会有它' },
  { id: 'db',      label: '本机数据库', tip: '存在数据库文件里；导出备份时会自动剔除它，但数据库文件本身仍可被读取' },
  { id: 'none',    label: '不保存',     tip: '只保留在本次运行的内存中，关闭应用后需要重新输入' },
];

let aiCfg = {
  provider: 'deepseek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-flash',
  storage: 'keyring', keyHint: '', hasKey: false,
  keyringAvailable: true, isLocal: false, needsKey: true,
};
let aiPrivacyAccepted = false;
let aiIncludeNotes = true;
let aiStorageDraft = 'keyring';
let aiProviderDraft = 'deepseek';

function aiProviderMeta(id) {
  return AI_PROVIDERS.find(p => p.id === id) || AI_PROVIDERS[0];
}
function aiStorageLabel(id) {
  const s = AI_STORAGE.find(x => x.id === id);
  return s ? s.label : id;
}
function aiProviderLabel() {
  return aiProviderMeta(aiCfg.provider).name + ' · ' + aiCfg.model;
}

async function loadAiSettings() {
  try {
    const vals = await Promise.all([
      invoke('ai_config_get'),
      invoke('get_setting', { key: 'ai_privacy_accepted' }),
      invoke('get_setting', { key: 'ai_include_notes' }),
    ]);
    if (vals[0]) aiCfg = vals[0];
    aiPrivacyAccepted = vals[1] === '1';
    aiIncludeNotes = vals[2] !== '0';
  } catch (e) {
    console.warn('读取 AI 设置失败', e);
  }
}

function renderAiSettingsRows() {
  const p = $('#aiProviderSub');
  if (p) p.textContent = aiProviderLabel();
  const k = $('#aiKeySub');
  if (k) {
    if (!aiCfg.needsKey) k.textContent = '本地模型，无需 Key';
    else if (aiCfg.hasKey) k.textContent = '已配置 ' + (aiCfg.keyHint || '') + ' · ' + aiStorageLabel(aiCfg.storage);
    else k.textContent = '未配置';
  }
  const priv = $('#aiPrivacySub');
  if (priv) priv.textContent = aiPrivacyAccepted ? '已同意发送分析数据' : '未授权（首次生成时询问）';
  if (typeof renderAiPage === 'function') renderAiPage();
}

/* ---- 服务商弹层 ---- */
function renderAiProviderSheet() {
  const list = $('#aiProviderList');
  if (!list) return;
  list.innerHTML = AI_PROVIDERS.map(p => {
    const on = p.id === aiProviderDraft;
    return '<button class="ai-provider-row' + (on ? ' sel' : '') + '" data-provider="' + p.id + '">' +
      '<span class="ai-provider-main">' +
        '<span class="ai-provider-name">' + p.name + '</span>' +
        '<span class="ai-provider-note">' + p.note + '</span>' +
      '</span>' +
      '<span class="ai-provider-check">' + (on ? IC('<path d="M4.5 12.5l4.3 4.3L19.5 7.2"/>') : '') + '</span>' +
    '</button>';
  }).join('');

  const meta = aiProviderMeta(aiProviderDraft);
  const same = aiProviderDraft === aiCfg.provider;
  const baseInput = $('#aiBaseUrlInput');
  const modelInput = $('#aiModelInput');
  if (baseInput && document.activeElement !== baseInput) baseInput.value = same ? aiCfg.baseUrl : meta.baseUrl;
  if (modelInput && document.activeElement !== modelInput) modelInput.value = same ? aiCfg.model : meta.model;
  const note = $('#aiProviderNote');
  if (note) {
    note.textContent = aiProviderDraft === 'ollama'
      ? '本地模型不需要 API Key，断网也能用（需先在本机启动 Ollama）。'
      : '接口地址与模型可以直接修改，支持任何 OpenAI 兼容服务。';
  }
}

function openAiProviderSheet() {
  aiProviderDraft = aiCfg.provider;
  renderAiProviderSheet();
  openModal(aiProviderSheet);
}

const _aiProviderSettingBtn = $('#aiProviderSettingBtn');
if (_aiProviderSettingBtn) _aiProviderSettingBtn.addEventListener('click', openAiProviderSheet);

const _aiProviderList = $('#aiProviderList');
if (_aiProviderList) _aiProviderList.addEventListener('click', e => {
  const row = e.target.closest('[data-provider]');
  if (!row) return;
  aiProviderDraft = row.dataset.provider;
  renderAiProviderSheet();
});

const _aiProviderSave = $('#aiProviderSave');
if (_aiProviderSave) _aiProviderSave.addEventListener('click', async () => {
  const baseUrl = $('#aiBaseUrlInput').value.trim();
  const model = $('#aiModelInput').value.trim();
  try {
    await invoke('ai_config_set', {
      provider: aiProviderDraft, baseUrl: baseUrl, model: model, storage: aiCfg.storage,
    });
    await loadAiSettings();
    renderAiSettingsRows();
    toast('已保存：' + aiProviderLabel());
    closeModal();
  } catch (e) {
    toast(String(e));
  }
});

/* ---- Key 弹层 ---- */
function renderAiStorageSeg() {
  const seg = $('#aiStorageSeg');
  if (!seg) return;
  seg.dataset.storage = aiStorageDraft;
  $$('#aiStorageSeg .seg').forEach(b => {
    const id = b.dataset.storage;
    b.classList.toggle('active', id === aiStorageDraft);
    b.disabled = (id === 'keyring' && !aiCfg.keyringAvailable);
  });
  const tip = AI_STORAGE.find(s => s.id === aiStorageDraft);
  const hint = $('#aiStorageHint');
  if (hint) {
    hint.textContent = (aiStorageDraft === 'keyring' && !aiCfg.keyringAvailable)
      ? '当前平台不支持系统钥匙串，已回退到本机数据库。'
      : (tip ? tip.tip : '');
  }
  const clearBtn = $('#aiKeyClear');
  if (clearBtn) clearBtn.hidden = !aiCfg.hasKey;
}

function openAiKeySheet() {
  const input = $('#aiKeyInput');
  input.value = '';
  input.type = 'password';
  input.placeholder = aiCfg.hasKey
    ? '已保存 ' + (aiCfg.keyHint || '') + '，如需更换请输入新的 Key'
    : 'sk-...';
  $('#aiKeyField').classList.remove('reveal');
  aiStorageDraft = aiCfg.storage;
  if (aiStorageDraft === 'keyring' && !aiCfg.keyringAvailable) aiStorageDraft = 'db';
  renderAiStorageSeg();
  openModal(aiKeySheet);
}

const _aiKeySettingBtn = $('#aiKeySettingBtn');
if (_aiKeySettingBtn) _aiKeySettingBtn.addEventListener('click', openAiKeySheet);

async function persistAiKey(silent) {
  const val = $('#aiKeyInput').value.trim();
  if (!val) {
    toast('请输入 API Key');
    return false;
  }
  try {
    await invoke('ai_key_set', { key: val, storage: aiStorageDraft });
    await loadAiSettings();
    renderAiSettingsRows();
    if (!silent) toast('API Key 已保存');
    return true;
  } catch (e) {
    toast(String(e));
    return false;
  }
}

const _aiKeySave = $('#aiKeySave');
if (_aiKeySave) _aiKeySave.addEventListener('click', async () => {
  if (await persistAiKey(false)) closeModal();
});

const _aiKeyClear = $('#aiKeyClear');
if (_aiKeyClear) _aiKeyClear.addEventListener('click', async () => {
  const ok = await confirmDialog('确定清除已保存的 API Key 吗？');
  if (!ok) return;
  try {
    await invoke('ai_key_clear');
    await loadAiSettings();
    renderAiSettingsRows();
    toast('已清除');
    closeModal();
  } catch (e) {
    toast(String(e));
  }
});

const _aiStorageSeg = $('#aiStorageSeg');
if (_aiStorageSeg) _aiStorageSeg.addEventListener('click', e => {
  const b = e.target.closest('.seg');
  if (!b || b.disabled) return;
  aiStorageDraft = b.dataset.storage;
  renderAiStorageSeg();
});

const _aiKeyEye = $('#aiKeyEye');
if (_aiKeyEye) _aiKeyEye.addEventListener('click', () => {
  const field = $('#aiKeyField');
  const input = $('#aiKeyInput');
  const reveal = input.type === 'password';
  input.type = reveal ? 'text' : 'password';
  field.classList.toggle('reveal', reveal);
});

const _aiKeyTest = $('#aiKeyTest');
if (_aiKeyTest) _aiKeyTest.addEventListener('click', async () => {
  const btn = _aiKeyTest;
  const typed = $('#aiKeyInput').value.trim();
  if (typed) {
    if (!(await persistAiKey(true))) return;
  } else if (aiCfg.needsKey && !aiCfg.hasKey) {
    toast('请先填写 API Key');
    return;
  }
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = '测试中…';
  try {
    toast(await invoke('ai_test_key'));
  } catch (e) {
    console.error('测试连接失败', e);
    toast(String(e));
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
});

/* ---- 隐私授权 ---- */
const _aiPrivacySettingBtn = $('#aiPrivacySettingBtn');
if (_aiPrivacySettingBtn) _aiPrivacySettingBtn.addEventListener('click', async () => {
  try {
    if (!aiPrivacyAccepted) {
      const ok = await confirmDialog('分析内容（本月账单统计' + (aiIncludeNotes ? '与备注' : '') + '）会发送给你配置的 AI 服务商，是否同意？');
      if (!ok) return;
      await invoke('set_setting', { key: 'ai_privacy_accepted', value: '1' });
      await loadAiSettings();
      renderAiSettingsRows();
      toast('已同意，生成分析时不再询问');
    } else {
      const ok = await confirmDialog('撤销授权后，下次生成分析会重新询问。确定撤销吗？');
      if (!ok) return;
      await invoke('delete_setting', { key: 'ai_privacy_accepted' });
      await loadAiSettings();
      renderAiSettingsRows();
      toast('已撤销授权');
    }
  } catch (e) {
    toast('操作失败：' + e);
  }
});

/* ================= AI 消费分析页 ================= */
let aiMonth = todayStr().slice(0, 7);
let aiResult = null;          // 当前展示的分析结果（含 meta）
let aiLoading = false;
let aiCacheMonth = null;      // 已尝试读取缓存的月份
let aiMonthTouched = false;   // 用户是否在分析页手动选过月份

function aiMonthLabel(month) {
  const m0 = month || aiMonth;
  const [y, m] = m0.split('-').map(Number);
  return m0 === todayStr().slice(0, 7) ? '本月' : (y + '年' + m + '月');
}

function fmtDateTime(ts) {
  const d = new Date(ts || Date.now());
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) +
         ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}

function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

function prevMonthOf(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
}

function catDisplayName(id) {
  const c = CAT_MAP[id];
  return c ? c.name : id;
}

function catColorByName(name) {
  const hit = (CATEGORIES.expense || []).concat(CATEGORIES.income || []).find(c => c.name === name);
  return hit ? hit.color : '';
}

function verdictClass(v) {
  const s = String(v || '');
  if (s.indexOf('异常') >= 0) return 'bad';
  if (s.indexOf('偏高') >= 0) return 'warn';
  return 'ok';
}

/** 把本月记录整理成发给 AI 的结构化 JSON（数字全部本地算好，模型只做解释） */
function buildAiStats(month, budget) {
  const list = txs.filter(t => t.date.startsWith(month));
  const exp = list.filter(t => t.type === 'expense');
  const inc = list.filter(t => t.type === 'income');
  const totalExpense = round2(exp.reduce((s, t) => s + t.amount, 0));
  const totalIncome = round2(inc.reduce((s, t) => s + t.amount, 0));

  const pm = prevMonthOf(month);
  const prevExp = txs.filter(t => t.type === 'expense' && t.date.startsWith(pm));
  const prevTotal = round2(prevExp.reduce((s, t) => s + t.amount, 0));

  const agg = {};
  exp.forEach(t => {
    if (!agg[t.category]) agg[t.category] = { amount: 0, count: 0 };
    agg[t.category].amount += t.amount;
    agg[t.category].count += 1;
  });
  const prevAgg = {};
  prevExp.forEach(t => { prevAgg[t.category] = (prevAgg[t.category] || 0) + t.amount; });

  const categories = Object.keys(agg).map(id => {
    const cur = agg[id];
    const prev = prevAgg[id] || 0;
    return {
      name: catDisplayName(id),
      amount: round2(cur.amount),
      share: totalExpense > 0 ? round2(cur.amount / totalExpense * 100) : 0,
      count: cur.count,
      momChange: prev > 0 ? round2((cur.amount - prev) / prev * 100) : null,
    };
  }).sort((a, b) => b.amount - a.amount);

  const days = {};
  exp.forEach(t => {
    const d = Number(t.date.slice(8, 10));
    days[d] = (days[d] || 0) + t.amount;
  });
  const dailySeries = Object.keys(days).sort((a, b) => Number(a) - Number(b))
    .map(d => [Number(d), round2(days[d])]);
  const spendDays = dailySeries.length;
  const avgDaily = spendDays > 0 ? round2(totalExpense / spendDays) : 0;

  // 异常波动在本地先算好，避免模型算错数
  const dayValues = dailySeries.map(p => p[1]).sort((a, b) => a - b);
  const medianDaily = dayValues.length ? dayValues[Math.floor(dayValues.length / 2)] : 0;
  const normalDaily = medianDaily > 0 ? medianDaily : avgDaily;

  const anomalies = [];
  categories.forEach(c => {
    if (c.momChange !== null && Math.abs(c.momChange) >= 50 && c.amount >= 100) {
      anomalies.push(c.name + '支出 ' + c.amount + ' 元，较上月' +
        (c.momChange > 0 ? '增加 ' + c.momChange : '减少 ' + Math.abs(c.momChange)) + '%');
    }
  });
  if (normalDaily > 0) {
    dailySeries.forEach(p => {
      if (p[1] >= normalDaily * 3 && p[1] >= 100) {
        anomalies.push(month.slice(5) + '-' + pad2(p[0]) + ' 单日支出 ' + p[1] +
          ' 元，约为日常水平的 ' + round2(p[1] / normalDaily) + ' 倍');
      }
    });
  }

  const topExpenses = exp.slice().sort((a, b) => b.amount - a.amount).slice(0, 15).map(t => {
    const o = { date: t.date, category: catDisplayName(t.category), amount: round2(t.amount) };
    if (aiIncludeNotes && t.note) o.note = String(t.note).slice(0, 20);
    return o;
  });

  const noted = exp.filter(t => t.note && String(t.note).trim()).length;

  return {
    month: month,
    totalIncome: totalIncome,
    totalExpense: totalExpense,
    balance: round2(totalIncome - totalExpense),
    budget: budget && budget > 0 ? round2(budget) : null,
    budgetUsage: budget && budget > 0 ? round2(totalExpense / budget * 100) : null,
    prevMonth: { month: pm, totalExpense: prevTotal },
    spendDays: spendDays,
    avgDaily: avgDaily,
    dailyBaseline: normalDaily,
    topCategory: categories.length ? categories[0].name : null,
    categories: categories.slice(0, 12),
    topExpenses: topExpenses,
    dailySeries: list.length <= 400 ? dailySeries : [],
    anomalies: anomalies.slice(0, 8),
    dataQuality: {
      txCount: list.length,
      noteCoverage: exp.length ? round2(noted / exp.length) : 0,
      notesIncluded: !!aiIncludeNotes
    }
  };
}

/* ---- 渲染 ---- */
function renderAiResult() {
  if (!aiResult) return;
  const res = aiResult.result || {};
  $('#aiSummary').textContent = res.summary || '（模型未返回结论）';

  const cats = res.categories || [];
  $('#aiCatCard').hidden = cats.length === 0;
  $('#aiCats').innerHTML = cats.map(c => {
    const share = Math.max(0, Math.min(100, Number(c.share) || 0));
    const color = catColorByName(c.name);
    const dot = '<span class="ai-cat-dot" style="background:' + (color || 'var(--text3)') + '"></span>';
    const badge = c.verdict ? '<span class="ai-verdict ' + verdictClass(c.verdict) + '">' + escapeHtml(c.verdict) + '</span>' : '';
    const amount = Number(c.amount) ? fmtMoney(Number(c.amount)) : '';
    const comment = c.comment ? '<div class="ai-cat-comment">' + escapeHtml(c.comment) + '</div>' : '';
    return '<div class="ai-cat">' +
      '<div class="ai-cat-top">' + dot +
        '<span class="ai-cat-name">' + escapeHtml(c.name || '未分类') + '</span>' + badge +
        '<span class="ai-cat-amount">' + amount + '</span>' +
      '</div>' +
      '<div class="ai-cat-bar"><i style="width:' + share.toFixed(1) + '%;background:' + (color || 'var(--blue)') + '"></i></div>' +
      comment +
    '</div>';
  }).join('');

  const advice = res.advice || [];
  $('#aiAdviceCard').hidden = advice.length === 0;
  $('#aiAdvice').innerHTML = advice.map(a => '<li>' + escapeHtml(a) + '</li>').join('');

  let meta = '生成于 ' + fmtDateTime(aiResult.generatedAt);
  if (aiResult.model) meta += ' · ' + aiResult.model;
  if (aiResult.promptTokens) meta += ' · 输入 ' + aiResult.promptTokens + ' / 输出 ' + (aiResult.completionTokens || 0) + ' tokens';
  $('#aiMeta').textContent = meta;
}

function renderAiPage() {
  const label = $('#aiMonthLabel');
  if (!label) return;
  label.innerHTML = aiMonthLabel() + ' <span class="arrow">▼</span>';

  const online = navigator.onLine || aiCfg.isLocal;
  const needKey = aiCfg.needsKey && !aiCfg.hasKey;

  $('#aiStatusModel').textContent = aiProviderLabel();
  $('#aiStatusKey').textContent = aiCfg.needsKey ? (aiCfg.hasKey ? '已配置 Key' : '未配置 Key') : '本地模型无需 Key';
  const netEl = $('#aiStatusNet');
  netEl.textContent = aiCfg.isLocal ? '本地' : (navigator.onLine ? '在线' : '离线');
  netEl.classList.toggle('off', !navigator.onLine && !aiCfg.isLocal);

  $('#aiNotesSwitch').classList.toggle('on', aiIncludeNotes);

  const hasData = txs.some(t => t.date.startsWith(aiMonth));
  const btn = $('#aiGenerateBtn');
  btn.disabled = aiLoading || !online || needKey || !hasData;
  btn.classList.toggle('loading', aiLoading);
  $('#aiGenerateText').textContent = aiLoading ? '分析中…' : '生成分析';

  const empty = $('#aiEmpty');
  const result = $('#aiResult');
  if (aiResult) {
    empty.hidden = true;
    result.hidden = false;
    renderAiResult();
    return;
  }
  result.hidden = true;
  empty.hidden = false;
  const spark = IC('<path d="M12 4l1.7 4.1a2 2 0 0 0 1.2 1.2L19 11l-4.1 1.7a2 2 0 0 0-1.2 1.2L12 18l-1.7-4.1a2 2 0 0 0-1.2-1.2L5 11l4.1-1.7a2 2 0 0 0 1.2-1.2L12 4Z"/><path d="M18.5 2.5v3M17 4h3"/>');
  let title = '还没有分析结果';
  let text = '点击上方「生成分析」，AI 会总结本月花费结构、指出异常波动并给出省钱建议。';
  let actionLabel = '';
  if (needKey) {
    title = '请先配置 API Key';
    text = '到「设置 → AI 消费分析 → API Key」填写后即可生成分析；也可以切换到本地 Ollama 模型，无需 Key。';
    actionLabel = '去设置 API Key';
  } else if (!online) {
    title = '需要联网才能使用 AI 分析';
    text = '当前处于离线状态，网络恢复后按钮会自动可用。';
  } else if (!hasData) {
    title = aiMonthLabel() + '暂无记录';
    text = '换一个月份，或先记一笔账。';
  }
  empty.innerHTML = emptyState({
    variant: 'card', icon: spark, title: title, text: text,
    actionLabel: actionLabel, actionId: 'aiEmptyAction',
  });
}

async function loadAiCacheIfNeeded() {
  if (aiCacheMonth === aiMonth) return;
  aiCacheMonth = aiMonth;
  aiResult = null;
  try {
    const raw = await invoke('get_setting', { key: 'ai_analysis_' + aiMonth });
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.result) aiResult = parsed;
    }
  } catch (e) {
    console.warn('读取分析缓存失败', e);
  }
  renderAiPage();
}

async function enterAiPage() {
  // 用户没在分析页手动选过月份时，跟随明细页当前选中的月份
  if (!aiMonthTouched && aiMonth !== viewMonth) {
    aiMonth = viewMonth;
    aiCacheMonth = null;
    aiResult = null;
  }
  await loadAiCacheIfNeeded();
  renderAiPage();
}

/* ---- 生成 ---- */
async function ensureAiPrivacy() {
  if (aiPrivacyAccepted) return true;
  const ok = await confirmDialog('分析内容（本月账单统计' + (aiIncludeNotes ? '与备注' : '') + '）会发送给你配置的 AI 服务商，是否继续？');
  if (!ok) return false;
  try {
    await invoke('set_setting', { key: 'ai_privacy_accepted', value: '1' });
    await loadAiSettings();
    renderAiSettingsRows();
  } catch (e) {
    console.warn('记录隐私授权失败', e);
  }
  return true;
}

async function generateAiAnalysis() {
  if (aiLoading) return;
  if (aiCfg.needsKey && !aiCfg.hasKey) { toast('请先配置 API Key'); switchTab('settings'); return; }
  if (!navigator.onLine && !aiCfg.isLocal) { toast('需要联网才能使用 AI 分析'); return; }
  if (!txs.some(t => t.date.startsWith(aiMonth))) { toast(aiMonthLabel() + '暂无记录'); return; }
  if (!(await ensureAiPrivacy())) return;

  aiLoading = true;
  renderAiPage();
  try {
    let budget = null;
    try { budget = await invoke('get_budget', { month: aiMonth }); } catch (e) { budget = null; }
    const stats = buildAiStats(aiMonth, budget);
    const resp = await invoke('ai_analyze', { month: aiMonth, stats: JSON.stringify(stats) });
    aiResult = resp;
    try {
      await invoke('set_setting', { key: 'ai_analysis_' + aiMonth, value: JSON.stringify(resp) });
    } catch (e) {
      console.warn('缓存分析结果失败', e);
    }
    toast('分析完成');
  } catch (e) {
    console.error('AI 分析失败', e);
    toast(String(e));
  } finally {
    aiLoading = false;
    renderAiPage();
  }
}

/* ---- 复制 ---- */
function aiResultToText(r) {
  const res = r.result || {};
  const out = [];
  out.push('AI 消费分析 · ' + aiMonthLabel());
  out.push('');
  out.push('【结论】');
  out.push(res.summary || '（无）');
  out.push('');
  out.push('【花费结构】');
  (res.categories || []).forEach(c => {
    let line = '- ' + (c.name || '未分类') + '：' + fmtMoney(Number(c.amount) || 0) +
               '（占比 ' + (Number(c.share) || 0) + '%）';
    if (c.verdict) line += ' ' + c.verdict;
    if (c.comment) line += '  原因：' + c.comment;
    out.push(line);
  });
  out.push('');
  out.push('【省钱建议】');
  (res.advice || []).forEach((a, i) => out.push((i + 1) + '. ' + a));
  out.push('');
  out.push('生成时间：' + fmtDateTime(r.generatedAt) + '　模型：' + (r.model || ''));
  return out.join('\r\n');
}

function aiResultToMarkdown(r) {
  const res = r.result || {};
  const out = [];
  out.push('# AI 消费分析 · ' + aiMonthLabel());
  out.push('');
  out.push('## 结论');
  out.push(res.summary || '（无）');
  out.push('');
  out.push('## 花费结构');
  (res.categories || []).forEach(c => {
    out.push('- **' + (c.name || '未分类') + '** ' + fmtMoney(Number(c.amount) || 0) +
             '（' + (Number(c.share) || 0) + '%）' + (c.verdict ? ' · ' + c.verdict : ''));
    if (c.comment) out.push('  - ' + c.comment);
  });
  out.push('');
  out.push('## 省钱建议');
  (res.advice || []).forEach((a, i) => out.push((i + 1) + '. ' + a));
  out.push('');
  out.push('> 生成时间：' + fmtDateTime(r.generatedAt) + ' · 模型：' + (r.model || ''));
  return out.join('\n');
}

async function copyAiResult() {
  if (!aiResult) return;
  const text = aiResultToText(aiResult);
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    toast('已复制');
  } catch (e) {
    toast('复制失败：' + e);
  }
}

async function saveAiResult() {
  if (!aiResult) return;
  try {
    const path = await window.__TAURI__.dialog.save({
      defaultPath: '消费分析-' + aiMonth + '.txt',
      filters: [
        { name: '文本文件（记事本可直接打开）', extensions: ['txt'] },
        { name: 'Markdown 文档', extensions: ['md'] },
      ],
    });
    if (!path) return;
    const isMd = path.toLowerCase().endsWith('.md');
    // txt 加 BOM，保证老版本记事本也能正确显示中文
    const content = isMd ? aiResultToMarkdown(aiResult) : '\uFEFF' + aiResultToText(aiResult);
    await window.__TAURI__.fs.writeFile(path, new TextEncoder().encode(content));
    toast('已保存');
  } catch (e) {
    console.error('保存分析失败', e);
    toast('保存失败：' + e);
  }
}

/* ---- 交互绑定 ---- */
const _aiMonthLabel = $('#aiMonthLabel');
if (_aiMonthLabel) _aiMonthLabel.addEventListener('click', () => {
  openMonthPicker(aiMonth, ym => {
    aiMonth = ym;
    aiMonthTouched = true;
    aiCacheMonth = null;
    enterAiPage();
  });
});

const _aiGenerateBtn = $('#aiGenerateBtn');
if (_aiGenerateBtn) _aiGenerateBtn.addEventListener('click', generateAiAnalysis);

const _aiRegenBtn = $('#aiRegenBtn');
if (_aiRegenBtn) _aiRegenBtn.addEventListener('click', generateAiAnalysis);

/* 清除已生成的分析结果（只清 AI 缓存，不动账目数据和 API Key） */
const _aiClearBtn = $('#aiClearBtn');
if (_aiClearBtn) _aiClearBtn.addEventListener('click', async () => {
  const ok = await confirmDialog('清除已生成的分析结果？\n不影响账目数据，下次需要重新生成。');
  if (!ok) return;
  try {
    const n = await invoke('ai_clear_analyses');
    aiResult = null;
    aiCacheMonth = aiMonth;   // 刚清过，避免立刻又去读一次缓存
    renderAiPage();
    toast(n > 0 ? '已清除 ' + n + ' 条分析结果' : '没有需要清除的分析结果');
  } catch (e) {
    console.error('清除分析结果失败', e);
    toast('清除失败：' + e);
  }
});

const _aiCopyBtn = $('#aiCopyBtn');
if (_aiCopyBtn) _aiCopyBtn.addEventListener('click', copyAiResult);

const _aiSaveBtn = $('#aiSaveBtn');
if (_aiSaveBtn) _aiSaveBtn.addEventListener('click', saveAiResult);

const _aiEmpty = $('#aiEmpty');
if (_aiEmpty) _aiEmpty.addEventListener('click', e => {
  if (e.target.closest('#aiEmptyAction')) switchTab('settings');
});

const _aiNotesRow = $('#aiNotesRow');
if (_aiNotesRow) _aiNotesRow.addEventListener('click', async () => {
  aiIncludeNotes = !aiIncludeNotes;
  try {
    await invoke('set_setting', { key: 'ai_include_notes', value: aiIncludeNotes ? '1' : '0' });
  } catch (e) {
    toast('保存失败：' + e);
  }
  renderAiPage();
  toast(aiIncludeNotes ? '分析会包含备注文本' : '分析只发送金额与分类');
});

window.addEventListener('online', () => renderAiPage());
window.addEventListener('offline', () => renderAiPage());

/* ================= 主题切换 ================= */
const THEME_KEY = 'ios_ledger_theme';

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function getEffectiveTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return getSystemTheme();
}
function applyTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') {
    document.documentElement.dataset.theme = saved;
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
}
function toggleTheme() {
  const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme();
}
const _themeToggle = $('#themeToggle');
if (_themeToggle) _themeToggle.addEventListener('click', toggleTheme);

/* ================= 应用锁 ================= */
const lockOverlay = $('#lockOverlay');
let lockEnabled = false;      // 后端是否启用锁定
let lockMode = 'verify';      // verify | setPin | setPinConfirm
let lockPinBuf = '';
let lockConfirmBuf = '';
let lockSetupTitle = '设置密码';

const LOCK_MAX = 8;
const LOCK_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'confirm'];
function renderLockKeys() {
  $('#lockKeys').innerHTML = LOCK_KEYS.map(k => {
    if (k === 'del') return `<button class="lock-key key-mute" data-lk="del" aria-label="退格">⌫</button>`;
    if (k === 'confirm') return `<button class="lock-key key-mute" data-lk="confirm" aria-label="确认">✓</button>`;
    return `<button class="lock-key" data-lk="${k}">${k}</button>`;
  }).join('');
}
renderLockKeys();

function renderLockDots() {
  // 一整条输入框：框内仅显示已输入的位数圆点，空态显示闪烁光标
  const len = Math.min(lockPinBuf.length, LOCK_MAX);
  $('#lockDots').innerHTML = Array.from({ length: len }, () =>
    '<span class="lock-dot"></span>').join('');
  $('#lockDots').classList.toggle('empty', len === 0);
}

function showLockOverlay(mode, setupTitle) {
  lockMode = mode;
  lockPinBuf = '';
  lockConfirmBuf = '';
  lockSetupTitle = setupTitle || '设置密码';
  $('#lockError').textContent = '';
  $('#lockCancel').hidden = (mode !== 'setPinConfirm');
  $('#lockTitle').textContent = (mode === 'verify') ? '记账本' : lockSetupTitle;
  $('#lockSub').textContent =
    mode === 'verify' ? '输入密码解锁'
    : mode === 'setPin' ? lockSetupTitle + '（4-8 位数字）'
    : '再次输入以确认';
  renderLockDots();
  lockOverlay.hidden = false;
  lockOverlay.classList.remove('lock-shake');
}

function hideLockOverlay() {
  lockOverlay.hidden = true;
  lockMode = 'verify';
}

function shakeLockError(msg) {
  $('#lockError').textContent = msg;
  lockOverlay.classList.remove('lock-shake');
  void lockOverlay.offsetWidth;
  lockOverlay.classList.add('lock-shake');
}

async function submitLockPin() {
  if (lockPinBuf.length < 4) { shakeLockError('密码至少 4 位数字'); return; }
  if (lockMode === 'verify') {
    const ok = await invoke('lock_verify', { pin: lockPinBuf }).catch(() => false);
    if (ok) {
      hideLockOverlay();
      renderLockSettingRow();
    } else {
      lockPinBuf = ''; renderLockDots();
      shakeLockError('密码错误，请重试');
    }
    return;
  }
  if (lockMode === 'setPin') {
    lockConfirmBuf = lockPinBuf; lockPinBuf = '';
    lockMode = 'setPinConfirm';
    $('#lockCancel').hidden = false;
    $('#lockSub').textContent = '再次输入以确认';
    renderLockDots();
    return;
  }
  // setPinConfirm：两次一致才写入
  if (lockPinBuf !== lockConfirmBuf) {
    lockPinBuf = ''; lockConfirmBuf = ''; lockMode = 'setPin';
    $('#lockCancel').hidden = true;
    $('#lockSub').textContent = lockSetupTitle + '（4-8 位数字）';
    renderLockDots();
    shakeLockError('两次输入不一致，请重试');
    return;
  }
  try {
    await invoke('lock_set_pin', { pin: lockPinBuf });
    hideLockOverlay();
    toast('应用锁已开启');
    renderLockSettingRow();
  } catch (e) {
    lockPinBuf = ''; lockConfirmBuf = ''; lockMode = 'setPin';
    $('#lockCancel').hidden = true;
    $('#lockSub').textContent = lockSetupTitle + '（4-8 位数字）';
    renderLockDots();
    shakeLockError('设置失败：' + e);
  }
}

$('#lockKeys').addEventListener('click', e => {
  const key = e.target.closest('[data-lk]'); if (!key) return;
  const act = key.dataset.lk;
  if (act === 'del') { lockPinBuf = lockPinBuf.slice(0, -1); renderLockDots(); return; }
  if (act === 'confirm') { submitLockPin(); return; }
  // 数字键满 8 位：给出明确提示，而非静默忽略（避免「按了没反应」）
  if (lockPinBuf.length >= LOCK_MAX) {
    shakeLockError('密码最多 8 位数字');
    return;
  }
  lockPinBuf += act;
  renderLockDots();
  // 统一由用户按 ✓ 提交，任何模式下都不自动跳转/解锁，
  // 让确认键始终可控，避免多输/漏输一位时误触进入。
});

$('#lockCancel').addEventListener('click', () => {
  lockPinBuf = ''; lockConfirmBuf = ''; lockMode = 'setPin';
  $('#lockCancel').hidden = true;
  $('#lockSub').textContent = lockSetupTitle + '（4-8 位数字）';
  renderLockDots();
});

async function renderLockSettingRow() {
  try {
    const st = await invoke('lock_status');
    lockEnabled = st.enabled;
    $('#lockSettingSub').textContent =
      st.enabled ? '密码已开启 · 切后台自动锁定' : '设置密码，防止他人误看';
  } catch (e) { /* 忽略 */ }
}

const _lockSettingBtn = $('#lockSettingBtn');
if (_lockSettingBtn) _lockSettingBtn.addEventListener('click', () => {
  if (lockEnabled) openModal(lockManageSheet);
  else openModal(lockEnableSheet);   // 先确认是否开启，再进入设置 PIN
});

lockEnableSheet.addEventListener('click', e => {
  const b = e.target.closest('[data-lkact]'); if (!b) return;
  const act = b.dataset.lkact;
  if (act === 'cancel') { closeModal(); return; }
  if (act === 'confirmEnable') { closeModal(); showLockOverlay('setPin', '设置密码'); }
});

lockManageSheet.addEventListener('click', e => {
  const b = e.target.closest('[data-lkact]'); if (!b) return;
  const act = b.dataset.lkact;
  closeModal();
  if (act === 'cancel') return;
  if (act === 'change') showLockOverlay('setPin', '修改密码');
  else if (act === 'disable') openModal(lockConfirmSheet);
});

lockConfirmSheet.addEventListener('click', async e => {
  const b = e.target.closest('[data-lkact]'); if (!b) return;
  const act = b.dataset.lkact;
  if (act === 'cancel') { closeModal(); return; }
  if (act === 'confirmDisable') {
    closeModal();
    try {
      await invoke('lock_disable');
      lockEnabled = false;
      toast('应用锁已关闭');
      renderLockSettingRow();
    } catch (err) { toast('关闭失败：' + err); }
  }
});

/* 切后台 / 切窗口 / 最小化时重新锁定 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden && lockEnabled) showLockOverlay('verify');
});

/* 启动时若已启用，直接进入解锁 */
async function initLock() {
  try {
    const st = await invoke('lock_status');
    lockEnabled = st.enabled;
    if (st.enabled) showLockOverlay('verify');
  } catch (e) { /* 忽略 */ }
}

/* ================= 启动 ================= */
async function boot() {
  applyTheme();
  await initLock();
  await loadCategories();
  await loadCatRules();   // 用户自定义分类规则（导入前就绪）
  try {
    await refreshTxs();
  } catch (e) {
    console.error('加载数据失败', e);
    toast('数据加载失败：' + e);
  }
  await loadBudget();
  await loadTemplates();
  await loadAiSettings();
  await initGestureHint();
  renderHome();
  renderStats();
  updateRecordCount();
  renderBudgetSettingRow();
  renderAiSettingsRows();
  renderLockSettingRow();
  switchTab('home');
}
boot();

// 定时重绘只为跨天时刷新「今日 / 昨日」文案。原来无条件 renderHome()，
// 而 .day-group 带入场动画，等于每分钟让整个列表重播一次动画，
// 还会顺手把已经侧滑打开的那一行收回去。
let lastRenderedDay = todayStr();
setInterval(() => {
  if (document.hidden) return;
  if (todayStr() === lastRenderedDay) return;
  lastRenderedDay = todayStr();
  renderHome();
  if ($('#page-stats').classList.contains('active')) renderStats();
}, 60000);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    renderHome();
    if ($('#page-stats').classList.contains('active')) renderStats();
  }
});