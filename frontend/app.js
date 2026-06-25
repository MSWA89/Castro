/* ═══════════════════════════════════════════════════════════════
   CASTRO — Chief of Staff · Frontend Application
   ═══════════════════════════════════════════════════════════════ */

/* ── CONFIG ─────────────────────────────────────────────────── */
const API_BASE = window.location.origin; // same-origin when served by FastAPI

const AGENT_COLORS = {
  charlotte:     '#c9a84c',
  vigie:         '#c9a84c',
  atlas:         '#4fa3e3',
  rempart:       '#9b7fe3',
  socle:         '#4fa3e3',
  fixer:         '#62aad4',
  sniper:        '#4cc9a0',
  mathman:       '#4cc9a0',
  rainmaker:     '#e3874f',
  'gold-member': '#e3a84f',
  entrepreneur:  '#e3874f',
  finance:       '#c9a84c',
  tresor:        '#c9a84c',
  pretoire:      '#e35454',
  sage:          '#9b7fe3',
  muse:          '#e37ab0',
  jackal:        '#7bcf7b',
};

const ROLE_LABELS = {
  charlotte:     'Chief of Staff',
  vigie:         'Silent Auditor',
  atlas:         'Software Engineer',
  rempart:       'Cyber Security',
  socle:         'Systems Engineer',
  fixer:         'Internal IT',
  sniper:        'Intelligence',
  mathman:       'Applied Math',
  rainmaker:     'Revenue & Ads',
  'gold-member': 'Growth Strategy',
  entrepreneur:  'Venture Strategy',
  finance:       'Capital & Treasury',
  tresor:        'Accounting',
  pretoire:      'Swiss Law',
  sage:          'Strategic Analyst',
  muse:          'Creative Partner',
  jackal:        'Lifestyle Concierge',
};

/* ── STATE ──────────────────────────────────────────────────── */
const state = {
  personas: [],
  activeId: null,
  streaming: false,
  attachments: [],
  rightTab: 'memory',
  rightOpen: true,
};

/* ══════════════════════════════════════════════════════════════
   STARFIELD
   ══════════════════════════════════════════════════════════════ */
class Starfield {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.meteors = [];
    this._resize();
    window.addEventListener('resize', () => this._resize());
    this._loop();
  }

  _resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this._spawn();
  }

  _spawn() {
    this.stars = [];
    const count = Math.floor((this.canvas.width * this.canvas.height) / 3800);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        r: Math.random() * 1.4 + 0.2,
        base: Math.random() * 0.65 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.018 + 0.004,
      });
    }
  }

  _addMeteor() {
    const x = Math.random() * this.canvas.width * 0.7;
    const y = Math.random() * this.canvas.height * 0.4;
    this.meteors.push({
      x, y, vx: 5 + Math.random() * 5, vy: 3 + Math.random() * 3,
      len: 70 + Math.random() * 90,
      life: 0, max: 55 + Math.random() * 20,
    });
  }

  _draw() {
    const { ctx, canvas } = this;
    // Deep space gradient
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0,   '#010810');
    g.addColorStop(0.5, '#020c1b');
    g.addColorStop(1,   '#010a15');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle nebula glow bottom-left
    const n = ctx.createRadialGradient(
      canvas.width * 0.15, canvas.height * 0.85, 0,
      canvas.width * 0.15, canvas.height * 0.85, canvas.width * 0.4
    );
    n.addColorStop(0, 'rgba(45,80,160,.04)');
    n.addColorStop(1, 'transparent');
    ctx.fillStyle = n;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    for (const s of this.stars) {
      s.phase += s.speed;
      const a = s.base * (0.55 + 0.45 * Math.sin(s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(210,228,255,${a})`;
      ctx.fill();
    }

    // Meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.life++;
      const p = m.life / m.max;
      const a = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
      const tailX = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.len;
      const tailY = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.len;
      const mg = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      mg.addColorStop(0, 'rgba(255,240,170,0)');
      mg.addColorStop(1, `rgba(255,240,170,${a * 0.85})`);
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.strokeStyle = mg;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      m.x += m.vx; m.y += m.vy;
      if (m.life >= m.max) this.meteors.splice(i, 1);
    }

    if (Math.random() < 0.0025) this._addMeteor();
  }

  _loop() {
    this._draw();
    requestAnimationFrame(() => this._loop());
  }
}

/* ══════════════════════════════════════════════════════════════
   API CLIENT
   ══════════════════════════════════════════════════════════════ */
const api = {
  async personas() {
    const r = await fetch(`${API_BASE}/personas`);
    if (!r.ok) throw new Error('Failed to load personas');
    return r.json();
  },

  async memories(agentId) {
    const r = await fetch(`${API_BASE}/agents/${agentId}/memories`);
    if (!r.ok) return [];
    return r.json();
  },

  async clearHistory(agentId) {
    const r = await fetch(`${API_BASE}/agents/${agentId}/history`, { method: 'DELETE' });
    if (!r.ok) throw new Error('Failed to clear history');
  },

  async health() {
    const r = await fetch(`${API_BASE}/health`);
    if (!r.ok) throw new Error();
    return r.json();
  },

  async collaborate(agentIds, prompt, maxTurns) {
    const r = await fetch(`${API_BASE}/agents/collaborate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_ids: agentIds, prompt, max_turns: maxTurns }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Collaboration failed');
    }
    return r.json();
  },

  async uploadPersona(file) {
    const fd = new FormData();
    fd.append('file', file);
    const r = await fetch(`${API_BASE}/personas`, { method: 'POST', body: fd });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }
    return r.json();
  },

  /**
   * Returns a ReadableStream — caller handles SSE parsing.
   */
  async chatStream(agentId, prompt, attachments) {
    const body = { prompt };
    if (attachments && attachments.length) body.attachments = attachments;
    const r = await fetch(`${API_BASE}/agents/${agentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${r.status}`);
    }
    return r.body;
  },
};

/* ══════════════════════════════════════════════════════════════
   DOM UTILITIES
   ══════════════════════════════════════════════════════════════ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function fmt_time(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function now_str() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ── Toasts ─────────────────────────────────────────────────── */
function toast(msg, type = 'info', duration = 3500) {
  const wrap = $('#toasts');
  const t = el('div', `toast toast--${type}`);
  t.innerHTML = `<span class="toast-dot"></span><span>${msg}</span>`;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add('toast-out');
    setTimeout(() => t.remove(), 280);
  }, duration);
}

/* ══════════════════════════════════════════════════════════════
   CLOCK & HEALTH
   ══════════════════════════════════════════════════════════════ */
function startClock() {
  const el_clk = $('#clock');
  const tick = () => {
    const now = new Date();
    el_clk.textContent = now.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };
  tick();
  setInterval(tick, 1000);
}

async function checkHealth() {
  const pill = $('#healthIndicator');
  const label = $('.h-label', pill);
  try {
    const h = await api.health();
    pill.className = 'health-indicator live';
    label.textContent = `LIVE · ${h.personas_loaded} agents`;
  } catch {
    pill.className = 'health-indicator error';
    label.textContent = 'OFFLINE';
  }
}

/* ══════════════════════════════════════════════════════════════
   AGENT ROSTER
   ══════════════════════════════════════════════════════════════ */
async function loadPersonas() {
  try {
    state.personas = await api.personas();
  } catch {
    toast('Could not load personas from API', 'error');
    state.personas = [];
  }
  renderAgentList();
  $('#agentCount').textContent = state.personas.length;
}

function renderAgentList() {
  const list = $('#agentList');
  list.innerHTML = '';

  if (!state.personas.length) {
    list.innerHTML = '<div class="list-placeholder">No agents found</div>';
    return;
  }

  for (const p of state.personas) {
    const color = AGENT_COLORS[p.id] || '#4fa3e3';
    const role  = ROLE_LABELS[p.id] || (p.capabilities?.[0] ?? '');
    const caps  = p.capabilities || [];

    const card = el('div', `agent-card${state.activeId === p.id ? ' active' : ''}`);
    card.dataset.id = p.id;
    card.style.setProperty('--card-color', color);

    const dots = Math.min(caps.length, 4);
    const dotHtml = Array.from({ length: dots }).map(() => '<span class="cap-dot"></span>').join('');

    card.innerHTML = `
      <div class="agent-orb">${p.avatar || '◈'}</div>
      <div class="agent-info">
        <div class="agent-card-name">${p.name}</div>
        <div class="agent-role-tag">${role}</div>
        <div class="cap-dots">${dotHtml}</div>
      </div>`;

    card.addEventListener('click', () => selectAgent(p.id));
    list.appendChild(card);
  }
}

function getPersona(id) {
  return state.personas.find(p => p.id === id);
}

/* ══════════════════════════════════════════════════════════════
   SELECT AGENT
   ══════════════════════════════════════════════════════════════ */
function selectAgent(id) {
  if (state.streaming) return; // don't switch mid-stream

  state.activeId = id;
  state.attachments = [];

  // Update roster active state
  $$('.agent-card').forEach(c => c.classList.toggle('active', c.dataset.id === id));

  const p = getPersona(id);
  if (!p) return;

  // Topbar pill
  $('#activeAvatar').textContent = p.avatar || '◈';
  $('#activeName').textContent   = p.name;

  // Chat header
  const color = AGENT_COLORS[id] || '#4fa3e3';
  const ch_av = $('#chAvatar');
  ch_av.textContent = p.avatar || '◈';
  ch_av.style.borderColor = color;
  ch_av.style.boxShadow = `0 0 14px color-mix(in srgb, ${color} 30%, transparent)`;
  $('#chName').textContent = p.name;

  // Capability chips
  const caps = $('#chCaps');
  caps.innerHTML = '';
  (p.capabilities || []).slice(0, 6).forEach(c => {
    const chip = el('span', 'cap-chip', c.replace(/_/g, ' '));
    chip.style.borderColor = `${color}35`;
    chip.style.color = color;
    chip.style.background = `${color}10`;
    caps.appendChild(chip);
  });

  // Clear and show chat session
  $('#messagesInner').innerHTML = '';
  $('#welcomeState').classList.add('hidden');
  $('#chatSession').classList.remove('hidden');

  // Clear attachments bar
  renderAttachBar();

  // Load right panel
  loadRightPanel();
}

/* ══════════════════════════════════════════════════════════════
   CHAT — STREAMING
   ══════════════════════════════════════════════════════════════ */
function buildMessageEl(role, avatarText, agentColor) {
  const wrap = el('div', `msg msg--${role}`);

  if (role === 'agent') {
    const orb = el('div', 'msg-orb');
    orb.textContent = avatarText;
    orb.style.borderColor = agentColor;
    wrap.appendChild(orb);
  }

  const body = el('div', 'msg-body');
  const meta = el('div', 'msg-meta');
  const sender = el('span', 'msg-sender', role === 'user' ? 'You' : avatarText);
  const time = el('span', 'msg-time', now_str());
  meta.appendChild(sender);
  meta.appendChild(time);

  const bubble = el('div', 'msg-bubble');
  body.appendChild(meta);
  body.appendChild(bubble);
  wrap.appendChild(body);

  return { wrap, bubble };
}

function scrollToBottom() {
  const w = $('#messagesWrap');
  w.scrollTop = w.scrollHeight;
}

async function sendMessage() {
  if (state.streaming || !state.activeId) return;
  const input = $('#chatInput');
  const prompt = input.value.trim();
  if (!prompt && !state.attachments.length) return;

  const p = getPersona(state.activeId);
  const color = AGENT_COLORS[state.activeId] || '#4fa3e3';

  // User bubble
  const { wrap: uw, bubble: ub } = buildMessageEl('user', 'You', color);
  ub.textContent = prompt || '[file attachment]';
  if (state.attachments.length) {
    const preview = el('div', 'attach-bar');
    state.attachments.forEach(a => {
      const chip = el('span', 'attach-chip', `📎 ${a.name}`);
      preview.appendChild(chip);
    });
    uw.querySelector('.msg-body').insertBefore(preview, ub);
  }
  $('#messagesInner').appendChild(uw);
  scrollToBottom();

  // Agent bubble (streaming)
  const { wrap: aw, bubble: ab } = buildMessageEl('agent', p.avatar || '◈', color);
  ab.classList.add('streaming');
  $('#messagesInner').appendChild(aw);
  scrollToBottom();

  // Reset input
  const sendPrompt = prompt;
  const sendAttachments = [...state.attachments];
  input.value = '';
  input.style.height = '';
  state.attachments = [];
  renderAttachBar();
  setSending(true);

  // Stream
  let full = '';
  try {
    const body = await api.chatStream(state.activeId, sendPrompt, sendAttachments);
    const reader = body.getReader();
    const dec = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6);
        if (raw === '[DONE]') { reader.cancel(); break; }
        try {
          const { token } = JSON.parse(raw);
          if (token) {
            full += token;
            ab.textContent = full;
            scrollToBottom();
          }
        } catch { /* ignore malformed chunk */ }
      }
    }
  } catch (err) {
    full = `⚠ Error: ${err.message}`;
    ab.textContent = full;
  }

  // Finalize: render markdown
  ab.classList.remove('streaming');
  if (full) {
    ab.innerHTML = DOMPurify.sanitize(marked.parse(full));
  }
  scrollToBottom();
  setSending(false);

  // Refresh memory panel after a short delay
  setTimeout(() => { if (state.rightTab === 'memory') loadRightPanel(); }, 2000);
}

function setSending(on) {
  state.streaming = on;
  $('#sendBtn').disabled = on;
  $('#chatInput').disabled = on;
  $('#attachBtn').disabled = on;
}

/* ══════════════════════════════════════════════════════════════
   FILE ATTACHMENTS
   ══════════════════════════════════════════════════════════════ */
async function handleFiles(files) {
  for (const file of files) {
    if (state.attachments.length >= 5) { toast('Maximum 5 attachments', 'info'); break; }

    const isImage = file.type.startsWith('image/');
    const isText  = file.type.startsWith('text/') ||
      /\.(md|yaml|yml|json|csv|txt|xml|html|css|js|ts|py|sh|sql)$/i.test(file.name);

    if (isImage) {
      const data = await readBase64(file);
      state.attachments.push({
        type: 'image', name: file.name,
        media_type: file.type, data, content: '',
      });
    } else if (isText) {
      const content = await readText(file);
      if (content.length > 60000) { toast(`${file.name} too large (max 60k chars)`, 'error'); continue; }
      state.attachments.push({
        type: 'text_file', name: file.name,
        media_type: '', data: '', content,
      });
    } else {
      toast(`${file.name}: unsupported type`, 'error');
      continue;
    }
  }
  renderAttachBar();
}

function readBase64(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload  = e => res(e.target.result.split(',')[1]);
    fr.onerror = rej;
    fr.readAsDataURL(file);
  });
}

function readText(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload  = e => res(e.target.result);
    fr.onerror = rej;
    fr.readAsText(file);
  });
}

function renderAttachBar() {
  const bar = $('#attachBar');
  bar.innerHTML = '';
  // Also update right panel files tab
  if (state.rightTab === 'files') renderFilesTab();

  state.attachments.forEach((a, i) => {
    const chip = el('div', 'attach-chip');
    if (a.type === 'image') {
      chip.innerHTML = `<span>🖼</span><span class="file-item-name">${a.name}</span>`;
    } else {
      chip.innerHTML = `<span>📄</span><span class="file-item-name">${a.name}</span>`;
    }
    const x = el('span', 'attach-chip-x', '✕');
    x.addEventListener('click', () => {
      state.attachments.splice(i, 1);
      renderAttachBar();
    });
    chip.appendChild(x);
    bar.appendChild(chip);
  });
}

/* ══════════════════════════════════════════════════════════════
   RIGHT PANEL
   ══════════════════════════════════════════════════════════════ */
async function loadRightPanel() {
  switch (state.rightTab) {
    case 'memory': await renderMemoryTab(); break;
    case 'files':  renderFilesTab(); break;
    case 'info':   renderInfoTab(); break;
  }
}

async function renderMemoryTab() {
  const body = $('#rpBody');
  if (!state.activeId) { body.innerHTML = '<div class="rp-empty">Select an agent to view memories</div>'; return; }

  body.innerHTML = '<div class="rp-empty"><span class="spinner"></span></div>';
  try {
    const mems = await api.memories(state.activeId);
    body.innerHTML = '';

    if (!mems.length) {
      body.innerHTML = '<div class="rp-empty">No memories stored yet.<br>Memories are extracted automatically after each conversation.</div>';
      return;
    }

    const countEl = el('div', 'mem-count', `<span>${mems.length}</span> stored ${mems.length === 1 ? 'memory' : 'memories'}`);
    body.appendChild(countEl);

    for (const m of mems) {
      const card = el('div', 'mem-card');
      card.innerHTML = `
        <div class="mem-card-text">${DOMPurify.sanitize(m.content)}</div>
        <div class="mem-tags">${(m.tags || []).map(t => `<span class="mem-tag">${t}</span>`).join('')}</div>
        <div class="mem-date">${fmt_time(m.timestamp)}</div>`;
      card.addEventListener('click', () => card.classList.toggle('expanded'));
      body.appendChild(card);
    }
  } catch {
    body.innerHTML = '<div class="rp-empty">Failed to load memories</div>';
  }
}

function renderFilesTab() {
  const body = $('#rpBody');
  body.innerHTML = '';

  const drop = el('div', 'files-drop', '<span>Drop files here to attach<br><small>Images, text, code, YAML, JSON…</small></span>');
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    drop.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
  drop.addEventListener('click', () => $('#fileInput').click());
  body.appendChild(drop);

  if (!state.attachments.length) {
    body.appendChild(el('div', 'rp-empty', 'No files attached'));
    return;
  }

  state.attachments.forEach((a, i) => {
    const item = el('div', 'file-item');
    item.innerHTML = `
      <span>${a.type === 'image' ? '🖼' : '📄'}</span>
      <span class="file-item-name">${a.name}</span>`;
    const x = el('span', 'file-item-x', '✕');
    x.addEventListener('click', () => { state.attachments.splice(i, 1); renderFilesTab(); renderAttachBar(); });
    item.appendChild(x);
    body.appendChild(item);
  });
}

function renderInfoTab() {
  const body = $('#rpBody');
  if (!state.activeId) { body.innerHTML = '<div class="rp-empty">Select an agent to view info</div>'; return; }

  const p = getPersona(state.activeId);
  if (!p) { body.innerHTML = '<div class="rp-empty">Agent not found</div>'; return; }

  body.innerHTML = '';

  // Traits
  if (p.traits?.length) {
    const sec = el('div', 'info-section');
    sec.innerHTML = '<div class="info-label">TRAITS</div>';
    const chips = el('div', 'info-chips');
    p.traits.forEach(t => chips.appendChild(el('span', 'info-chip info-chip--trait', t.replace(/_/g, ' '))));
    sec.appendChild(chips);
    body.appendChild(sec);
  }

  // Capabilities
  if (p.capabilities?.length) {
    const sec = el('div', 'info-section');
    sec.innerHTML = '<div class="info-label">CAPABILITIES</div>';
    const chips = el('div', 'info-chips');
    p.capabilities.forEach(c => chips.appendChild(el('span', 'info-chip', c.replace(/_/g, ' '))));
    sec.appendChild(chips);
    body.appendChild(sec);
  }

  // Voice
  const vsec = el('div', 'info-section');
  vsec.innerHTML = `<div class="info-label">VOICE</div>
    <div class="info-chips"><span class="info-chip">${p.voice_id || 'not configured'}</span>
    <span class="info-chip" style="opacity:.4">coming soon</span></div>`;
  body.appendChild(vsec);

  // System prompt preview
  if (p.system_prompt) {
    const psec = el('div', 'info-section');
    psec.innerHTML = '<div class="info-label">SYSTEM PROMPT</div>';
    const pre = el('div', 'info-prompt');
    pre.textContent = p.system_prompt.slice(0, 600) + (p.system_prompt.length > 600 ? '\n…' : '');
    psec.appendChild(pre);
    body.appendChild(psec);
  }
}

function switchTab(tab) {
  state.rightTab = tab;
  $$('.rp-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  loadRightPanel();
}

function toggleRightPanel() {
  state.rightOpen = !state.rightOpen;
  $('#rightPanel').classList.toggle('collapsed', !state.rightOpen);
  $('#rpToggle').textContent = state.rightOpen ? '›' : '‹';
}

/* ══════════════════════════════════════════════════════════════
   COLLABORATION
   ══════════════════════════════════════════════════════════════ */
function openCollabModal() {
  if (!state.personas.length) { toast('No agents loaded', 'error'); return; }

  const grid = $('#collabGrid');
  grid.innerHTML = '';
  state.personas.forEach(p => {
    const row = el('div', 'collab-agent-row');
    const cb  = document.createElement('input');
    cb.type = 'checkbox'; cb.value = p.id; cb.id = `cb_${p.id}`;
    const label = el('label', '');
    label.htmlFor = `cb_${p.id}`;
    label.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;cursor:pointer';
    label.innerHTML = `<span class="collab-agent-avatar">${p.avatar || '◈'}</span>
      <span class="collab-agent-name">${p.name}</span>`;
    row.appendChild(cb);
    row.appendChild(label);
    row.addEventListener('click', e => {
      if (e.target !== cb) cb.checked = !cb.checked;
      row.classList.toggle('selected', cb.checked);
    });
    grid.appendChild(row);
  });

  // Pre-select active agent
  if (state.activeId) {
    const cb = $(`#cb_${state.activeId}`);
    if (cb) { cb.checked = true; cb.closest('.collab-agent-row').classList.add('selected'); }
  }

  showModal('collabModal');
}

async function launchCollab() {
  const checked = Array.from($$('#collabGrid input[type="checkbox"]:checked')).map(c => c.value);
  if (checked.length < 2) { toast('Select at least 2 agents', 'error'); return; }
  if (checked.length > 4) { toast('Maximum 4 agents', 'error'); return; }

  const prompt = $('#collabPrompt').value.trim();
  if (!prompt) { toast('Enter a task prompt', 'error'); return; }
  const turns = Math.max(2, Math.min(12, parseInt($('#collabTurns').value) || 4));

  hideModal('collabModal');
  $('#collabPrompt').value = '';

  // Ensure chat is visible
  if (state.activeId) {
    $('#welcomeState').classList.add('hidden');
    $('#chatSession').classList.remove('hidden');
  }

  // Loading bubble
  const loading = el('div', 'msg msg--agent');
  const lbody   = el('div', 'msg-body');
  const lbubble = el('div', 'collab-loading');
  lbubble.innerHTML = `<span class="spinner"></span><span>Collaboration in progress — ${checked.length} agents · ${turns} turns…</span>`;
  lbody.appendChild(lbubble);
  loading.appendChild(lbody);
  $('#messagesInner').appendChild(loading);
  scrollToBottom();

  setSending(true);
  try {
    const result = await api.collaborate(checked, prompt, turns);
    loading.remove();
    renderCollabResult(result);
  } catch (err) {
    loading.remove();
    toast(`Collaboration failed: ${err.message}`, 'error');
  }
  setSending(false);
}

function renderCollabResult(result) {
  const wrap = el('div', 'msg msg--agent');
  const body = el('div', 'msg-body');
  body.style.maxWidth = '90%';

  const box = el('div', 'collab-result');
  box.innerHTML = `<div class="collab-result-hd">⟳ COLLABORATION · ${result.turns.length} TURNS</div>`;

  result.turns.forEach(t => {
    const p = getPersona(t.agent_id);
    const turn = el('div', 'collab-turn');
    turn.innerHTML = `
      <div class="collab-turn-hd">${p?.avatar || '◈'} ${t.persona_name} — Turn ${t.turn}</div>
      <div class="collab-turn-body"></div>`;
    turn.querySelector('.collab-turn-body').innerHTML =
      DOMPurify.sanitize(marked.parse(t.content));
    box.appendChild(turn);
  });

  if (result.summary) {
    const sum = el('div', 'collab-summary');
    sum.innerHTML = `<div class="collab-summary-label">SUMMARY</div>${DOMPurify.sanitize(marked.parse(result.summary))}`;
    box.appendChild(sum);
  }

  body.appendChild(box);
  wrap.appendChild(body);
  $('#messagesInner').appendChild(wrap);
  scrollToBottom();
}

/* ══════════════════════════════════════════════════════════════
   PERSONA UPLOAD
   ══════════════════════════════════════════════════════════════ */
function openPersonaModal() {
  showModal('personaModal');
}

async function handlePersonaFile(file) {
  if (!file.name.endsWith('.yaml')) { toast('Only .yaml files accepted', 'error'); return; }
  try {
    const result = await api.uploadPersona(file);
    toast(`Persona "${result.name || result.id}" uploaded`, 'success');
    hideModal('personaModal');
    await loadPersonas();
    await checkHealth();
  } catch (err) {
    toast(`Upload failed: ${err.message}`, 'error');
  }
}

/* ══════════════════════════════════════════════════════════════
   MODAL HELPERS
   ══════════════════════════════════════════════════════════════ */
function showModal(id) { $(`#${id}`).classList.remove('hidden'); }
function hideModal(id) { $(`#${id}`).classList.add('hidden'); }

/* ══════════════════════════════════════════════════════════════
   AUTO-RESIZE TEXTAREA
   ══════════════════════════════════════════════════════════════ */
function autoResize(ta) {
  ta.style.height = 'auto';
  ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
}

/* ══════════════════════════════════════════════════════════════
   EVENT BINDING
   ══════════════════════════════════════════════════════════════ */
function bindEvents() {
  // Send on click
  $('#sendBtn').addEventListener('click', sendMessage);

  // Send on Enter (Shift+Enter = newline)
  $('#chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea
  $('#chatInput').addEventListener('input', () => autoResize($('#chatInput')));

  // File attach button
  $('#attachBtn').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', e => {
    handleFiles(e.target.files);
    e.target.value = '';
  });

  // Drag-and-drop on chat area
  const chatArea = $('#chatArea');
  chatArea.addEventListener('dragover', e => { e.preventDefault(); });
  chatArea.addEventListener('drop', e => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  });

  // Clear history
  $('#clearBtn').addEventListener('click', async () => {
    if (!state.activeId) return;
    if (!confirm('Clear all history for this agent?')) return;
    try {
      await api.clearHistory(state.activeId);
      $('#messagesInner').innerHTML = '';
      toast('History cleared', 'success');
      if (state.rightTab === 'memory') loadRightPanel();
    } catch { toast('Failed to clear history', 'error'); }
  });

  // Collaborate button
  $('#collabBtn').addEventListener('click', openCollabModal);
  $('#launchCollabBtn').addEventListener('click', launchCollab);

  // Upload persona
  $('#uploadPersonaBtn').addEventListener('click', openPersonaModal);
  const personaInput = $('#personaFileInput');
  personaInput.addEventListener('change', e => {
    if (e.target.files[0]) handlePersonaFile(e.target.files[0]);
    e.target.value = '';
  });
  const personaDrop = $('#personaDrop');
  personaDrop.addEventListener('dragover', e => { e.preventDefault(); personaDrop.classList.add('drag-over'); });
  personaDrop.addEventListener('dragleave', () => personaDrop.classList.remove('drag-over'));
  personaDrop.addEventListener('drop', e => {
    e.preventDefault();
    personaDrop.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) handlePersonaFile(e.dataTransfer.files[0]);
  });

  // Right panel tabs
  $$('.rp-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Right panel toggle
  $('#rpToggle').addEventListener('click', toggleRightPanel);

  // Modal close buttons
  $$('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => hideModal(btn.dataset.close));
  });

  // Close modal on overlay click
  $$('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) {
        const id = overlay.id;
        if (id) hideModal(id);
      }
    });
  });

  // Keyboard: Escape closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('.modal-overlay:not(.hidden)').forEach(o => hideModal(o.id));
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════ */
async function init() {
  // Starfield
  new Starfield($('#starfield'));

  // Configure marked
  marked.setOptions({ breaks: true, gfm: true });

  // Clock
  startClock();

  // Events
  bindEvents();

  // Health + personas in parallel
  await Promise.all([checkHealth(), loadPersonas()]);

  // Poll health every 30s
  setInterval(checkHealth, 30_000);
}

init();
