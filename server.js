'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const { chat, MODELS, DEFAULT_MODEL } = require('./lib/ai');
const { executeTool, checkCommand, setScheduler, HOME } = require('./lib/tools');
const { createScheduler } = require('./lib/scheduler');

const app = express();
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '127.0.0.1';

const scheduler = createScheduler({
  dataDir: path.join(__dirname, 'data'),
  executeTool,
  checkCommand,
});
setScheduler(scheduler);

app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

// Hanya izinkan permintaan API dari halaman lokal ini (mencegah CSRF dari website lain).
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  const origin = req.headers.origin;
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      if (host !== '127.0.0.1' && host !== 'localhost') {
        return res.status(403).json({ ok: false, error: 'Origin tidak diizinkan.' });
      }
    } catch {
      return res.status(403).json({ ok: false, error: 'Origin tidak valid.' });
    }
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

/* ------------------------------ API ------------------------------ */

app.get('/api/config', (req, res) => {
  res.json({
    ok: true,
    app: 'AI Komputer',
    version: '1.0.0',
    hasKey: Boolean(process.env.OPENROUTER_API_KEY),
    defaultModel: DEFAULT_MODEL,
    models: MODELS,
    home: HOME,
    platform: `${process.platform} ${process.arch}`,
    allowDangerousDefault: false,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  const { messages, model, allowDangerous } = req.body || {};
  const lastMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
  console.log(`[CHAT] ${String(lastMessage?.content || '').slice(0, 160)}`);
  try {
    const result = await chat({
      messages,
      model,
      allowDangerous: !!allowDangerous,
      maxRounds: Number(process.env.MAX_TOOL_ROUNDS) || 8,
    });
    console.log(
      `[CHAT] tool: ${result.steps.map((s) => s.name).join(', ') || 'TIDAK ADA'} ` +
        `| biaya $${(result.usage?.cost || 0).toFixed(6)}`
    );
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('[CHAT ERROR]', err.message);
    res.status(err.status && err.status >= 400 && err.status < 600 ? err.status : 500).json({
      ok: false,
      error: friendlyError(err),
    });
  }
});

app.post('/api/exec', async (req, res) => {
  const { command, shell, allowDangerous, cwd } = req.body || {};
  if (!command || typeof command !== 'string' || !command.trim()) {
    return res.status(400).json({ ok: false, error: 'Perintah kosong.' });
  }
  console.log(`[EXEC] ${command.trim().slice(0, 180)}`);
  try {
    const result = await executeTool(
      'jalankan_perintah',
      { command: command.trim(), shell: shell === 'powershell' ? 'powershell' : 'cmd', cwd },
      { allowDangerous: !!allowDangerous }
    );
    console.log(`[EXEC] -> ${result.ok ? 'OK' : 'GAGAL'}${result.blocked ? ' (diblokir)' : ''}`);
    res.json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/check', (req, res) => {
  const { command, allowDangerous } = req.body || {};
  res.json(checkCommand(String(command || ''), !!allowDangerous));
});

/* ---------------------------- Jadwal ----------------------------- */

app.get('/api/jadwal', (req, res) => {
  res.json({ ok: true, jadwal: scheduler.list(), file: scheduler.file });
});

app.post('/api/jadwal', (req, res) => {
  const body = req.body || {};
  console.log(`[JADWAL] tambah: ${String(body.label || body.command || body.tool || '').slice(0, 120)}`);
  const result = scheduler.add({ ...body, allowDangerous: !!body.allowDangerous });
  res.status(result.ok ? 200 : 400).json(result);
});

app.delete('/api/jadwal/:id', (req, res) => {
  const result = scheduler.remove(req.params.id);
  res.status(result.ok ? 200 : 404).json(result);
});

app.post('/api/jadwal/:id/run', async (req, res) => {
  try {
    const result = await scheduler.runNow(req.params.id);
    res.status(result.ok ? 200 : 404).json(result);
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/* --------------------------- Fallback ---------------------------- */

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ ok: false, error: 'Endpoint tidak ditemukan.' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ----------------------------- Error ----------------------------- */

function friendlyError(err) {
  const msg = err?.message || 'Terjadi kesalahan.';
  const status = err?.status;
  if (status === 401 || /invalid.*key|no auth/i.test(msg)) {
    return 'API key OpenRouter tidak valid. Periksa kembali isi OPENROUTER_API_KEY di file .env.';
  }
  if (status === 402 || /insufficient|credit/i.test(msg)) {
    return 'Saldo OpenRouter tidak cukup untuk model ini. Ganti model atau isi saldo.';
  }
  if (status === 429 || /rate.?limit/i.test(msg)) {
    return 'Terlalu banyak permintaan (rate limit). Tunggu sebentar lalu coba lagi.';
  }
  if (status === 404) {
    return `Model tidak tersedia di OpenRouter. Pilih model lain. (${msg})`;
  }
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|timeout/i.test(msg)) {
    return 'Tidak dapat menghubungi OpenRouter. Periksa koneksi internet lalu coba lagi.';
  }
  return msg;
}

/* ----------------------------- Start ----------------------------- */

app.listen(PORT, HOST, () => {
  const totalJadwal = scheduler.start();
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║            AI KOMPUTER  v1.0             ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log(`  Buka di browser : http://${HOST}:${PORT}`);
  console.log(`  Model default   : ${DEFAULT_MODEL}`);
  console.log(`  Folder pengguna : ${HOME}`);
  console.log(`  Jadwal tersimpan: ${totalJadwal} tugas (penjadwal aktif)`);
  console.log('');
  if (!process.env.OPENROUTER_API_KEY) {
    console.log('  [!] OPENROUTER_API_KEY belum diisi di .env');
  }
  console.log('  Tekan Ctrl+C untuk menghentikan server.');
  console.log('');
});
