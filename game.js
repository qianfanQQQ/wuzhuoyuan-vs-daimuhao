/* =========================================================
   《吴卓远大战代牧豪》
   2D 俯视角生存射击 · 纯原生 HTML5 Canvas
   ========================================================= */
(function () {
  'use strict';

  /* =======================================================
     常量与工具
     ======================================================= */
  const TAU = Math.PI * 2;
  const MAP = { w: 3200, h: 3200 };
  const SAVE_KEY = 'brother_stop_chasing_me_save_v1';
  const MAX_ENEMIES = 105;
  const MAX_BULLETS = 380;
  const MAX_ENEMY_BULLETS = 260;
  const MAX_ORBS = 280;
  const MAX_PARTICLES = 720;
  const MAX_NUMBERS = 110;
  const MAX_RINGS = 54;

  const S = Object.freeze({
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    UPGRADE: 'upgrade',
    DYING: 'dying',
    GAMEOVER: 'gameover'
  });

  const MODE_LABEL = {
    survival: '无限生存',
    stage: '关卡挑战'
  };

  const WEAPON_ORDER = ['pistol', 'smg', 'shotgun', 'sniper', 'rocket'];

  const WEAPONS = {
    pistol: {
      key: 1,
      name: '手枪',
      short: '手枪',
      damage: 26,
      fireInterval: 0.32,
      mag: 12,
      reloadTime: 1.15,
      bulletSpeed: 980,
      spread: 0.012,
      pellets: 1,
      pierce: 1,
      range: 980,
      bulletRadius: 3.2,
      color: '#ffe28b',
      glow: '#ffca5c',
      shake: 2.1,
      unlockLevel: 1,
      sound: 'shoot_pistol',
      desc: '稳定、精准，永远不会背叛你的老伙计。'
    },
    smg: {
      key: 2,
      name: '冲锋枪',
      short: '冲锋枪',
      damage: 12,
      fireInterval: 0.074,
      mag: 34,
      reloadTime: 1.45,
      bulletSpeed: 1080,
      spread: 0.065,
      pellets: 1,
      pierce: 1,
      range: 820,
      bulletRadius: 2.6,
      color: '#7ce9ff',
      glow: '#28c9ee',
      shake: 1.15,
      unlockLevel: 2,
      sound: 'shoot_smg',
      desc: '倾泻弹雨。射速极快，单发伤害较低。'
    },
    shotgun: {
      key: 3,
      name: '霰弹枪',
      short: '霰弹枪',
      damage: 15,
      fireInterval: 0.84,
      mag: 6,
      reloadTime: 2.05,
      bulletSpeed: 900,
      spread: 0.215,
      pellets: 8,
      pierce: 1,
      range: 520,
      bulletRadius: 3.1,
      color: '#ffc06d',
      glow: '#ff8a44',
      shake: 4.8,
      unlockLevel: 3,
      sound: 'shoot_shotgun',
      desc: '一次喷出 8 枚弹丸，近距离的绝对说服力。'
    },
    sniper: {
      key: 4,
      name: '狙击枪',
      short: '狙击枪',
      damage: 158,
      fireInterval: 1.18,
      mag: 5,
      reloadTime: 2.35,
      bulletSpeed: 1950,
      spread: 0.0025,
      pellets: 1,
      pierce: 6,
      range: 1700,
      bulletRadius: 4.2,
      color: '#c7a7ff',
      glow: '#9369ff',
      shake: 5.2,
      unlockLevel: 5,
      sound: 'shoot_sniper',
      desc: '高伤害、高穿透，一枪能串起一队好兄弟。'
    },
    rocket: {
      key: 5,
      name: '火箭筒',
      short: '火箭筒',
      damage: 58,
      fireInterval: 1.32,
      mag: 1,
      reloadTime: 2.55,
      bulletSpeed: 690,
      spread: 0.015,
      pellets: 1,
      pierce: 0,
      range: 1250,
      bulletRadius: 7,
      color: '#ff9867',
      glow: '#ff542e',
      shake: 7.5,
      unlockLevel: 7,
      sound: 'shoot_rocket',
      splashDamage: 105,
      splashRadius: 152,
      desc: '命中后爆炸，对范围内敌人造成伤害。'
    }
  };

  const ENEMY_BASE = {
    normal: {
      radius: 24,
      hp: 48,
      speed: 92,
      damage: 9,
      xp: 9,
      score: 100,
      ring: '#ff6b7d'
    },
    elite: {
      radius: 35,
      hp: 175,
      speed: 112,
      damage: 16,
      xp: 27,
      score: 360,
      ring: '#ffb35e'
    },
    boss: {
      radius: 76,
      hp: 1500,
      speed: 78,
      damage: 24,
      xp: 260,
      score: 2800,
      ring: '#ff4f6d'
    }
  };

  const hasCoarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  const hasFinePointer = !!(window.matchMedia && window.matchMedia('(pointer: fine)').matches);
  const hasTouch = hasCoarsePointer || (('ontouchstart' in window) && !hasFinePointer);

  function clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function randInt(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function shuffle(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function distSq(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    return dx * dx + dy * dy;
  }

  function formatNumber(value) {
    const number = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return number.toLocaleString('zh-CN');
  }

  function formatTime(seconds) {
    const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
    const minutes = Math.floor(total / 60);
    const secs = total % 60;
    return String(minutes).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  function angleDiff(a, b) {
    let diff = (b - a) % TAU;
    if (diff > Math.PI) diff -= TAU;
    if (diff < -Math.PI) diff += TAU;
    return diff;
  }

  function segmentCircleHit(x1, y1, x2, y2, cx, cy, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    let t = 0;
    if (lengthSq > 0.000001) {
      t = ((cx - x1) * dx + (cy - y1) * dy) / lengthSq;
      t = clamp(t, 0, 1);
    }
    const px = x1 + dx * t - cx;
    const py = y1 + dy * t - cy;
    return px * px + py * py <= radius * radius;
  }

  function roundRectPath(context, x, y, w, h, r) {
    const radius = Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5);
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + w - radius, y);
    context.quadraticCurveTo(x + w, y, x + w, y + radius);
    context.lineTo(x + w, y + h - radius);
    context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    context.lineTo(x + radius, y + h);
    context.quadraticCurveTo(x, y + h, x, y + h - radius);
    context.lineTo(x, y + radius);
    context.quadraticCurveTo(x, y, x + radius, y);
    context.closePath();
  }

  function clampToMap(entity) {
    entity.x = clamp(entity.x, entity.r + 4, MAP.w - entity.r - 4);
    entity.y = clamp(entity.y, entity.r + 4, MAP.h - entity.r - 4);
  }

  /* =======================================================
     本地存档
     ======================================================= */
  const DEFAULT_SAVE = {
    highScore: 0,
    maxTime: 0,
    maxLevel: 1,
    totalKills: 0,
    highestStage: 0,
    sfx: true
  };

  function normalizeSave(raw) {
    const result = Object.assign({}, DEFAULT_SAVE);
    if (!raw || typeof raw !== 'object') return result;
    if (Number.isFinite(Number(raw.highScore))) result.highScore = Math.max(0, Math.floor(Number(raw.highScore)));
    if (Number.isFinite(Number(raw.maxTime))) result.maxTime = Math.max(0, Math.floor(Number(raw.maxTime)));
    if (Number.isFinite(Number(raw.maxLevel))) result.maxLevel = Math.max(1, Math.floor(Number(raw.maxLevel)));
    if (Number.isFinite(Number(raw.totalKills))) result.totalKills = Math.max(0, Math.floor(Number(raw.totalKills)));
    if (Number.isFinite(Number(raw.highestStage))) result.highestStage = Math.max(0, Math.floor(Number(raw.highestStage)));
    result.sfx = raw.sfx !== false;
    return result;
  }

  function loadSave() {
    try {
      const text = window.localStorage.getItem(SAVE_KEY);
      if (!text) return Object.assign({}, DEFAULT_SAVE);
      return normalizeSave(JSON.parse(text));
    } catch (error) {
      return Object.assign({}, DEFAULT_SAVE);
    }
  }

  function persistSave() {
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
    } catch (error) {
      /* 隐私模式或本地文件限制下静默失败，游戏继续运行 */
    }
  }

  let save = loadSave();

  /* =======================================================
     程序化音效（Web Audio API，无外部音频文件）
     ======================================================= */
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.noiseBuffer = null;
      this.enabled = save.sfx !== false;
      this.lastPlayed = Object.create(null);
      this.throttle = {
        hit: 42,
        kill: 58,
        pickup: 38,
        shoot_smg: 30,
        shoot_shotgun: 64,
        boss_shoot: 110,
        explosion: 70,
        ui: 40
      };
    }

    ensure() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        try {
          this.ctx = new AudioContextClass();
          this.master = this.ctx.createGain();
          this.master.gain.value = 0.22;

          const compressor = this.ctx.createDynamicsCompressor();
          compressor.threshold.value = -18;
          compressor.knee.value = 22;
          compressor.ratio.value = 5;
          compressor.attack.value = 0.004;
          compressor.release.value = 0.18;

          this.master.connect(compressor);
          compressor.connect(this.ctx.destination);

          const sampleRate = this.ctx.sampleRate;
          this.noiseBuffer = this.ctx.createBuffer(1, sampleRate, sampleRate);
          const data = this.noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i += 1) {
            data[i] = Math.random() * 2 - 1;
          }
        } catch (error) {
          this.ctx = null;
          return null;
        }
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(function () {});
      }
      return this.ctx;
    }

    setEnabled(value) {
      this.enabled = !!value;
    }

    tone(freqStart, freqEnd, duration, type, volume, delay) {
      if (!this.ctx) return;
      const startFreq = Math.max(24, freqStart);
      const endFreq = Math.max(24, freqEnd || freqStart);
      const dur = Math.max(0.02, duration);
      const when = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(startFreq, when);
      if (endFreq !== startFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, when + dur);
      }
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), when + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(when);
      osc.stop(when + dur + 0.03);
    }

    noise(duration, volume, filterFreq, filterType, delay) {
      if (!this.ctx || !this.noiseBuffer) return;
      const dur = Math.max(0.02, duration);
      const when = this.ctx.currentTime + (delay || 0);
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = filterType || 'lowpass';
      filter.frequency.setValueAtTime(Math.max(80, filterFreq || 1200), when);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), when + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(when);
      source.stop(when + dur + 0.02);
    }

    play(name) {
      if (!this.enabled) return;
      if (!this.ensure()) return;

      const now = performance.now();
      const limit = this.throttle[name] || 0;
      if (limit && now - (this.lastPlayed[name] || 0) < limit) return;
      this.lastPlayed[name] = now;

      switch (name) {
        case 'shoot_pistol':
          this.tone(620, 158, 0.082, 'square', 0.1);
          this.noise(0.048, 0.045, 2100, 'highpass');
          break;
        case 'shoot_smg':
          this.tone(760, 260, 0.044, 'square', 0.055);
          this.noise(0.028, 0.022, 2800, 'highpass');
          break;
        case 'shoot_shotgun':
          this.noise(0.18, 0.16, 1350, 'lowpass');
          this.tone(170, 58, 0.18, 'sawtooth', 0.12);
          break;
        case 'shoot_sniper':
          this.noise(0.14, 0.12, 2600, 'highpass');
          this.tone(290, 62, 0.24, 'sawtooth', 0.14);
          this.tone(1100, 430, 0.09, 'triangle', 0.06);
          break;
        case 'shoot_rocket':
          this.noise(0.34, 0.1, 840, 'bandpass');
          this.tone(200, 70, 0.3, 'sawtooth', 0.11);
          break;
        case 'hit':
          this.tone(210, 92, 0.032, 'square', 0.028);
          break;
        case 'kill':
          this.tone(150, 62, 0.08, 'sawtooth', 0.045);
          this.noise(0.07, 0.03, 760, 'lowpass');
          break;
        case 'hurt':
          this.tone(190, 66, 0.21, 'sawtooth', 0.13);
          this.noise(0.16, 0.08, 400, 'lowpass');
          break;
        case 'explosion':
          this.noise(0.5, 0.18, 320, 'lowpass');
          this.tone(115, 34, 0.42, 'sawtooth', 0.12);
          break;
        case 'reload_start':
          this.tone(360, 250, 0.06, 'square', 0.04);
          this.noise(0.05, 0.032, 1500, 'bandpass');
          break;
        case 'reload_end':
          this.tone(440, 760, 0.08, 'triangle', 0.06);
          this.tone(760, 980, 0.06, 'square', 0.025, 0.06);
          break;
        case 'dash':
          this.noise(0.18, 0.055, 1600, 'bandpass');
          this.tone(320, 820, 0.13, 'sine', 0.035);
          break;
        case 'pickup':
          this.tone(880, 1220, 0.045, 'sine', 0.026);
          break;
        case 'levelup':
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
            this.tone(freq, freq, 0.16, 'triangle', 0.062, index * 0.075);
          });
          break;
        case 'upgrade':
          this.tone(660, 990, 0.13, 'triangle', 0.06);
          this.tone(990, 1320, 0.1, 'sine', 0.032, 0.07);
          break;
        case 'boss_warn':
          this.tone(150, 44, 1.1, 'sawtooth', 0.15);
          this.tone(80, 60, 1.25, 'sine', 0.12);
          this.noise(0.7, 0.055, 240, 'lowpass');
          break;
        case 'boss_shoot':
          this.tone(240, 72, 0.18, 'square', 0.08);
          this.noise(0.12, 0.045, 700, 'bandpass');
          break;
        case 'boss_die':
          this.noise(0.9, 0.2, 420, 'lowpass');
          this.tone(210, 34, 1.2, 'sawtooth', 0.18);
          this.tone(520, 110, 0.55, 'triangle', 0.07);
          break;
        case 'gameover':
          this.tone(300, 160, 0.3, 'sawtooth', 0.1);
          this.tone(160, 55, 0.85, 'sawtooth', 0.13, 0.18);
          this.noise(0.6, 0.07, 280, 'lowpass', 0.2);
          break;
        case 'stage':
          this.tone(440, 660, 0.16, 'triangle', 0.06);
          this.tone(660, 880, 0.2, 'triangle', 0.055, 0.13);
          break;
        case 'switch':
          this.tone(320, 220, 0.05, 'square', 0.03);
          break;
        case 'denied':
          this.tone(150, 115, 0.12, 'square', 0.055);
          break;
        case 'ui':
          this.tone(480, 650, 0.035, 'triangle', 0.025);
          break;
        case 'start':
          this.tone(140, 330, 0.2, 'sawtooth', 0.075);
          this.tone(440, 880, 0.28, 'triangle', 0.045, 0.12);
          break;
        default:
          break;
      }
    }
  }

  const audio = new AudioEngine();

  /* =======================================================
     头像素材加载
     严格使用 assets/player.png 与 assets/enemy.png。
     路径以 game.js 的真实位置为基准解析，避免页面被部署到
     子目录或从不同入口打开时把 assets 解析到错误位置。
     ======================================================= */
  const AVATAR_VERSION = '20261019-3';
  const AVATAR_SCRIPT = document.currentScript || Array.prototype.find.call(document.scripts, function (script) {
    return /game\.js(?:[?#]|$)/.test(script.src);
  });
  const AVATAR_BASE_URL = (function () {
    try {
      return new URL('.', AVATAR_SCRIPT ? AVATAR_SCRIPT.src : document.baseURI);
    } catch (error) {
      return new URL('.', document.baseURI);
    }
  })();

  const avatarDebug = {
    player: {
      label: '玩家',
      file: 'assets/player.png',
      status: 'loading',
      url: '',
      attempts: 0,
      width: 0,
      height: 0,
      error: null
    },
    enemy: {
      label: '敌人',
      file: 'assets/enemy.png',
      status: 'loading',
      url: '',
      attempts: 0,
      width: 0,
      height: 0,
      error: null
    }
  };
  window.__avatarDebug = avatarDebug;
  console.info('[Avatar] 头像资源基准路径:', AVATAR_BASE_URL.href);

  let avatarSummaryLogged = false;

  function buildAvatarUrl(fileName, extraParams) {
    const url = new URL('assets/' + fileName, AVATAR_BASE_URL);
    url.searchParams.set('v', AVATAR_VERSION);
    if (extraParams) {
      Object.keys(extraParams).forEach(function (key) {
        url.searchParams.set(key, String(extraParams[key]));
      });
    }
    return url.href;
  }

  function updateAvatarDebug(entry, status, error) {
    entry.status = status;
    entry.debug.status = status;
    entry.debug.url = entry.currentUrl || entry.debug.url;
    entry.debug.attempts = entry.attempts;
    entry.debug.width = entry.image.naturalWidth || 0;
    entry.debug.height = entry.image.naturalHeight || 0;
    entry.debug.error = error || null;
    document.documentElement.dataset[entry.type + 'Avatar'] = status;
  }

  function logAvatarSummary() {
    if (avatarSummaryLogged) return;
    if (!avatars.player || !avatars.enemy) return;
    const playerReady = avatars.player.status === 'loaded' || avatars.player.status === 'fallback';
    const enemyReady = avatars.enemy.status === 'loaded' || avatars.enemy.status === 'fallback';
    if (!playerReady || !enemyReady) return;
    avatarSummaryLogged = true;
    console.table([avatarDebug.player, avatarDebug.enemy]);
    console.info(
      '[Avatar] 最终状态：玩家 = ' + avatars.player.status +
      '，敌人 = ' + avatars.enemy.status +
      '。可在控制台执行 window.__avatarDebug 查看详情。'
    );
  }

  function markAvatarLoaded(entry) {
    const image = entry.image;
    if (!image.naturalWidth || !image.naturalHeight) {
      handleAvatarError(entry, new Error('图片已触发 onload，但 naturalWidth/naturalHeight 为 0'));
      return;
    }
    entry.loaded = true;
    entry.failed = false;
    entry.phase = 'loaded';
    updateAvatarDebug(entry, 'loaded', null);
    console.info(
      '[Avatar] ' + entry.debug.file + ' 加载成功',
      {
        url: entry.currentUrl,
        size: image.naturalWidth + '×' + image.naturalHeight,
        attempts: entry.attempts
      }
    );
    logAvatarSummary();
  }

  function finalAvatarFailure(entry, error) {
    entry.loaded = false;
    entry.failed = true;
    entry.phase = 'fallback';
    updateAvatarDebug(entry, 'fallback', error ? String(error.message || error) : 'unknown');
    console.error(
      '[Avatar] ' + entry.debug.file + ' 加载失败，已使用备用圆形头像。',
      {
        url: entry.currentUrl,
        attempts: entry.attempts,
        error: error ? String(error.message || error) : 'unknown',
        check: '确认 assets 文件夹与 index.html 一同部署，且文件名大小写完全一致。',
        debug: 'window.__avatarDebug'
      }
    );
    logAvatarSummary();
  }

  function fetchAvatarFallback(entry) {
    entry.phase = 'fetching';
    entry.attempts += 1;
    updateAvatarDebug(entry, 'fetching', entry.debug.error);
    const recoveryUrl = buildAvatarUrl(entry.fileName, { recover: Date.now() });
    console.warn('[Avatar] ' + entry.debug.file + ' 重试失败，正在用 fetch(no-store) 检查真实 HTTP 状态…', recoveryUrl);
    fetch(recoveryUrl, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('HTTP ' + response.status + ' ' + response.statusText);
        }
        return response.blob();
      })
      .then(function (blob) {
        const objectUrl = URL.createObjectURL(blob);
        entry.objectUrl = objectUrl;
        setAvatarSource(entry, objectUrl, 'blob');
      })
      .catch(function (error) {
        finalAvatarFailure(entry, error);
      });
  }

  function handleAvatarError(entry, error) {
    if (entry.loaded) return;

    if (entry.phase === 'initial') {
      entry.failed = false;
      entry.phase = 'retry-pending';
      updateAvatarDebug(entry, 'retrying', error || new Error('Image onerror'));
      console.warn(
        '[Avatar] ' + entry.debug.file + ' 首次加载失败，准备用缓存穿透 URL 重试…',
        { url: entry.currentUrl, onerror: entry.debug.error }
      );
      window.setTimeout(function () {
        if (entry.loaded || entry.phase !== 'retry-pending') return;
        setAvatarSource(
          entry,
          buildAvatarUrl(entry.fileName, { retry: Date.now() }),
          'retry'
        );
      }, 180);
      return;
    }

    // 已排队重试或 fetch 正在执行时，忽略重复的 onerror。
    if (entry.phase === 'retry-pending' || entry.phase === 'fetching') {
      return;
    }

    if (entry.phase === 'retry') {
      fetchAvatarFallback(entry);
      return;
    }

    if (entry.phase === 'blob') {
      finalAvatarFailure(entry, error || new Error('Blob image decode failed'));
      return;
    }

    finalAvatarFailure(entry, error || new Error('Unknown avatar load error'));
  }

  function setAvatarSource(entry, url, phase) {
    entry.phase = phase;
    entry.currentUrl = url;
    entry.attempts += 1;
    updateAvatarDebug(
      entry,
      phase === 'retry' || phase === 'blob' ? 'retrying' : 'loading',
      entry.debug.error
    );
    entry.image.src = url;
  }

  function createAvatarEntry(type, fileName, fallbackLabel, fallbackColorA, fallbackColorB) {
    const image = new Image();
    const entry = {
      type: type,
      fileName: fileName,
      debug: avatarDebug[type],
      image: image,
      loaded: false,
      failed: false,
      status: 'loading',
      phase: 'initial',
      attempts: 0,
      currentUrl: '',
      objectUrl: null,
      fallbackLabel: fallbackLabel,
      fallbackColorA: fallbackColorA,
      fallbackColorB: fallbackColorB
    };
    entry.debug.file = 'assets/' + fileName;
    entry.debug.status = 'loading';
    document.documentElement.dataset[type + 'Avatar'] = 'loading';

    image.decoding = 'async';
    image.loading = 'eager';
    image.onload = function () {
      markAvatarLoaded(entry);
    };
    image.onerror = function () {
      handleAvatarError(entry, new Error('Image request failed: ' + entry.currentUrl));
    };
    setAvatarSource(entry, buildAvatarUrl(fileName), 'initial');
    return entry;
  }

  const avatars = {
    player: createAvatarEntry('player', 'player.png', '我', '#1c7092', '#5de1ff'),
    enemy: createAvatarEntry('enemy', 'enemy.png', '友', '#7d2438', '#ff6b7d')
  };

  // 一次性生成头像底部压暗层，避免每个敌人每帧创建渐变，保证长时间运行稳定。
  const avatarShadeCanvas = document.createElement('canvas');
  avatarShadeCanvas.width = 128;
  avatarShadeCanvas.height = 128;
  (function buildAvatarShade() {
    const shadeContext = avatarShadeCanvas.getContext('2d');
    const gradient = shadeContext.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, 'rgba(255,255,255,0.04)');
    gradient.addColorStop(0.55, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.36)');
    shadeContext.fillStyle = gradient;
    shadeContext.fillRect(0, 0, 128, 128);
  })();

  /* =======================================================
     DOM 与画布
     ======================================================= */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  function $(id) {
    return document.getElementById(id);
  }

  const el = {
    soundToggle: $('soundToggle'),
    soundIcon: $('soundIcon'),
    pauseButton: $('pauseButton'),
    startSurvivalBtn: $('startSurvivalBtn'),
    startStageBtn: $('startStageBtn'),
    instructionsBtn: $('instructionsBtn'),
    instructionsModal: $('instructionsModal'),
    closeInstructionsBtn: $('closeInstructionsBtn'),
    instructionsDoneBtn: $('instructionsDoneBtn'),
    upgradeCards: $('upgradeCards'),
    upgradeSub: $('upgradeSub'),
    pauseMode: $('pauseMode'),
    pauseTime: $('pauseTime'),
    pauseKills: $('pauseKills'),
    pauseLevel: $('pauseLevel'),
    resumeBtn: $('resumeBtn'),
    pauseRestartBtn: $('pauseRestartBtn'),
    pauseMenuBtn: $('pauseMenuBtn'),
    resultTitle: $('resultTitle'),
    gameOverMode: $('gameOverMode'),
    newRecordBadge: $('newRecordBadge'),
    resultScore: $('resultScore'),
    resultTime: $('resultTime'),
    resultKills: $('resultKills'),
    resultLevel: $('resultLevel'),
    resultStageWrap: $('resultStageWrap'),
    resultStage: $('resultStage'),
    gameOverBest: $('gameOverBest'),
    restartBtn: $('restartBtn'),
    gameOverMenuBtn: $('gameOverMenuBtn'),
    bestScore: $('bestScore'),
    bestTime: $('bestTime'),
    bestLevel: $('bestLevel'),
    totalKills: $('totalKills'),
    fireBtn: $('fireBtn'),
    reloadBtn: $('reloadBtn'),
    dashBtn: $('dashBtn'),
    switchBtn: $('switchBtn'),
    moveStick: $('moveStick'),
    moveKnob: $('moveKnob'),
    aimStick: $('aimStick'),
    aimKnob: $('aimKnob')
  };

  const screens = {
    menu: $('menuScreen'),
    upgrade: $('upgradeScreen'),
    pause: $('pauseScreen'),
    gameover: $('gameOverScreen')
  };

  const view = {
    w: Math.max(320, window.innerWidth),
    h: Math.max(320, window.innerHeight),
    dpr: 1
  };

  let state = S.MENU;
  let game = null;
  let lastFrameTime = performance.now();

  const input = {
    keys: new Set(),
    mouse: {
      x: view.w * 0.5,
      y: view.h * 0.45,
      down: false,
      seen: false
    },
    move: {
      x: 0,
      y: 0,
      active: false
    },
    aim: {
      x: 0,
      y: -1,
      active: false
    },
    fireHeld: false,
    usingMouse: !hasTouch
  };

  const joystickInfo = {
    move: {
      base: el.moveStick,
      knob: el.moveKnob,
      pointerId: null
    },
    aim: {
      base: el.aimStick,
      knob: el.aimKnob,
      pointerId: null
    }
  };

  function resizeCanvas() {
    const width = Math.max(320, Math.floor(window.innerWidth));
    const height = Math.max(320, Math.floor(window.innerHeight));
    const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
    view.w = width;
    view.h = height;
    view.dpr = dpr;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    input.mouse.x = clamp(input.mouse.x, 0, width);
    input.mouse.y = clamp(input.mouse.y, 0, height);
    if (game) {
      updateCamera(0, true);
    }
    resetAllJoysticks();
  }

  function setState(nextState) {
    state = nextState;
    document.body.dataset.state = nextState;
    document.body.classList.toggle(
      'in-game',
      nextState === S.PLAYING ||
      nextState === S.PAUSED ||
      nextState === S.UPGRADE ||
      nextState === S.DYING
    );
  }

  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('active', key === name);
    });
  }

  function hideScreens() {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.remove('active');
    });
  }

  function updateSoundButton() {
    el.soundIcon.textContent = save.sfx ? '🔊' : '🔇';
    el.soundToggle.title = save.sfx ? '音效已开启（点击关闭）' : '音效已关闭（点击开启）';
    el.soundToggle.setAttribute('aria-label', save.sfx ? '关闭音效' : '开启音效');
    el.soundToggle.setAttribute('aria-pressed', String(save.sfx));
  }

  function updateMenuStats() {
    el.bestScore.textContent = formatNumber(save.highScore);
    el.bestTime.textContent = formatTime(save.maxTime);
    el.bestLevel.textContent = String(Math.max(1, save.maxLevel));
    el.totalKills.textContent = formatNumber(save.totalKills);
  }

  function toggleSound() {
    save.sfx = !save.sfx;
    audio.setEnabled(save.sfx);
    persistSave();
    updateSoundButton();
    if (save.sfx) {
      audio.ensure();
      audio.play('ui');
    }
  }

  function showInstructions() {
    el.instructionsModal.hidden = false;
    audio.ensure();
    audio.play('ui');
    el.closeInstructionsBtn.focus({ preventScroll: true });
  }

  function hideInstructions() {
    if (!el.instructionsModal.hidden) {
      el.instructionsModal.hidden = true;
      el.instructionsBtn.focus({ preventScroll: true });
    }
  }

  /* =======================================================
     输入与触屏摇杆
     ======================================================= */
  function resetAllJoysticks() {
    ['move', 'aim'].forEach(function (kind) {
      const info = joystickInfo[kind];
      if (!info) return;
      if (info.pointerId !== null) {
        try {
          if (info.base.hasPointerCapture && info.base.hasPointerCapture(info.pointerId)) {
            info.base.releasePointerCapture(info.pointerId);
          }
        } catch (error) {
          /* 忽略已释放的指针 */
        }
      }
      info.pointerId = null;
      if (info.knob) {
        info.knob.style.transform = 'translate(-50%, -50%)';
      }
    });
    input.move.x = 0;
    input.move.y = 0;
    input.move.active = false;
    input.aim.active = false;
    input.aim.x = 0;
    input.aim.y = -1;
  }

  function clearInput() {
    input.keys.clear();
    input.mouse.down = false;
    input.fireHeld = false;
    resetAllJoysticks();
    if (el.fireBtn) el.fireBtn.classList.remove('is-pressed');
  }

  function setupJoystick(kind) {
    const info = joystickInfo[kind];
    if (!info || !info.base || !info.knob) return;

    function setKnob(offsetX, offsetY) {
      info.knob.style.transform =
        'translate(calc(-50% + ' + offsetX.toFixed(1) + 'px), calc(-50% + ' + offsetY.toFixed(1) + 'px))';
    }

    function updateFromPointer(event) {
      const rect = info.base.getBoundingClientRect();
      const centerX = rect.left + rect.width * 0.5;
      const centerY = rect.top + rect.height * 0.5;
      const maxDistance = Math.max(18, rect.width * 0.31);
      let dx = event.clientX - centerX;
      let dy = event.clientY - centerY;
      const length = Math.hypot(dx, dy);
      if (length > maxDistance) {
        dx = (dx / length) * maxDistance;
        dy = (dy / length) * maxDistance;
      }
      setKnob(dx, dy);

      const nx = dx / maxDistance;
      const ny = dy / maxDistance;
      if (kind === 'move') {
        input.move.x = Math.abs(nx) < 0.09 ? 0 : nx;
        input.move.y = Math.abs(ny) < 0.09 ? 0 : ny;
        input.move.active = true;
      } else {
        input.aim.x = nx;
        input.aim.y = ny;
        input.aim.active = Math.hypot(nx, ny) > 0.16;
      }
    }

    function onPointerDown(event) {
      if (state !== S.PLAYING) return;
      if (info.pointerId !== null) return;
      event.preventDefault();
      event.stopPropagation();
      info.pointerId = event.pointerId;
      try {
        info.base.setPointerCapture(event.pointerId);
      } catch (error) {
        /* 某些浏览器不支持捕获，不影响拖动 */
      }
      audio.ensure();
      updateFromPointer(event);
    }

    function onPointerMove(event) {
      if (info.pointerId !== event.pointerId) return;
      event.preventDefault();
      updateFromPointer(event);
    }

    function onPointerUp(event) {
      if (info.pointerId !== event.pointerId) return;
      event.preventDefault();
      info.pointerId = null;
      setKnob(0, 0);
      if (kind === 'move') {
        input.move.x = 0;
        input.move.y = 0;
        input.move.active = false;
      } else {
        input.aim.active = false;
        input.aim.x = 0;
        input.aim.y = -1;
      }
    }

    info.base.addEventListener('pointerdown', onPointerDown, { passive: false });
    info.base.addEventListener('pointermove', onPointerMove, { passive: false });
    info.base.addEventListener('pointerup', onPointerUp, { passive: false });
    info.base.addEventListener('pointercancel', onPointerUp, { passive: false });
    info.base.addEventListener('lostpointercapture', function (event) {
      if (info.pointerId === event.pointerId) {
        onPointerUp(event);
      }
    });
  }

  function setupFireButton() {
    if (!el.fireBtn) return;
    function stopFire(event) {
      input.fireHeld = false;
      el.fireBtn.classList.remove('is-pressed');
      if (event) event.preventDefault();
    }
    el.fireBtn.addEventListener('pointerdown', function (event) {
      if (state !== S.PLAYING) return;
      event.preventDefault();
      event.stopPropagation();
      audio.ensure();
      input.fireHeld = true;
      el.fireBtn.classList.add('is-pressed');
      try {
        el.fireBtn.setPointerCapture(event.pointerId);
      } catch (error) {
        /* 忽略 */
      }
    }, { passive: false });
    el.fireBtn.addEventListener('pointerup', stopFire, { passive: false });
    el.fireBtn.addEventListener('pointercancel', stopFire, { passive: false });
    el.fireBtn.addEventListener('lostpointercapture', stopFire);
  }

  function onKeyDown(event) {
    const code = event.code;
    const gameKeys = ['Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR', 'KeyP', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];
    if (gameKeys.indexOf(code) !== -1 && state !== S.MENU) {
      event.preventDefault();
    }

    if (!el.instructionsModal.hidden) {
      if (code === 'Escape') {
        event.preventDefault();
        hideInstructions();
      }
      return;
    }

    if (event.repeat) return;

    if (code === 'Escape') {
      if (state === S.PLAYING || state === S.PAUSED) {
        event.preventDefault();
        togglePause();
      }
      return;
    }

    if (code === 'KeyP') {
      if (state === S.PLAYING || state === S.PAUSED) {
        event.preventDefault();
        togglePause();
      }
      return;
    }

    if (state === S.UPGRADE) {
      if (code === 'Digit1' || code === 'Numpad1') chooseUpgrade(0);
      if (code === 'Digit2' || code === 'Numpad2') chooseUpgrade(1);
      if (code === 'Digit3' || code === 'Numpad3') chooseUpgrade(2);
      return;
    }

    if (state !== S.PLAYING || !game) return;

    audio.ensure();

    if (code === 'Space') {
      tryDash();
      return;
    }
    if (code === 'KeyR') {
      tryReload(false);
      return;
    }
    if (code.indexOf('Digit') === 0 || code.indexOf('Numpad') === 0) {
      const index = Number(code.replace('Digit', '').replace('Numpad', '')) - 1;
      if (index >= 0 && index < WEAPON_ORDER.length) {
        switchWeapon(index);
      }
      return;
    }

    input.keys.add(code);
  }

  function onKeyUp(event) {
    input.keys.delete(event.code);
  }

  function setupInput() {
    setupJoystick('move');
    setupJoystick('aim');
    setupFireButton();

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);

    window.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'mouse') {
        input.mouse.x = event.clientX;
        input.mouse.y = event.clientY;
        input.mouse.seen = true;
        input.usingMouse = true;
      }
    }, { passive: true });

    window.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse') {
        input.usingMouse = false;
      }
    }, { passive: true });

    canvas.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      if (state !== S.PLAYING) return;
      event.preventDefault();
      audio.ensure();
      input.mouse.x = event.clientX;
      input.mouse.y = event.clientY;
      input.mouse.seen = true;
      input.mouse.down = true;
    }, { passive: false });

    window.addEventListener('pointerup', function (event) {
      if (event.pointerType === 'mouse') {
        input.mouse.down = false;
      }
    });

    window.addEventListener('pointercancel', function (event) {
      if (event.pointerType === 'mouse') {
        input.mouse.down = false;
      }
    });

    canvas.addEventListener('contextmenu', function (event) {
      event.preventDefault();
    });

    window.addEventListener('blur', function () {
      clearInput();
      if (state === S.PLAYING) pauseGame();
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        clearInput();
        if (state === S.PLAYING) pauseGame();
      }
    });

    window.addEventListener('resize', resizeCanvas);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', resizeCanvas);
    }
    window.addEventListener('orientationchange', function () {
      window.setTimeout(resizeCanvas, 180);
    });

    el.reloadBtn.addEventListener('click', function () {
      if (state === S.PLAYING) {
        audio.ensure();
        tryReload(false);
      }
    });
    el.dashBtn.addEventListener('click', function () {
      if (state === S.PLAYING) {
        audio.ensure();
        tryDash();
      }
    });
    el.switchBtn.addEventListener('click', function () {
      if (state === S.PLAYING) {
        audio.ensure();
        cycleWeapon();
      }
    });
  }

  /* =======================================================
     游戏对象创建 / 重置
     ======================================================= */
  function weaponMaxMag(key) {
    if (!game) return WEAPONS[key].mag;
    return WEAPONS[key].mag + game.player.magBonus;
  }

  function createPlayer() {
    const player = {
      x: MAP.w * 0.5,
      y: MAP.h * 0.5,
      r: 24,
      hp: 100,
      maxHp: 100,
      baseSpeed: 228,
      moveSpeedMult: 1,
      damageMult: 1,
      fireRateMult: 1,
      magBonus: 0,
      reloadMult: 1,
      pierceBonus: 0,
      critChance: 0.06,
      critMultiplier: 2,
      dashCooldownMult: 1,
      weapon: 'pistol',
      unlocked: {
        pistol: true,
        smg: false,
        shotgun: false,
        sniper: false,
        rocket: false
      },
      ammo: {
        pistol: WEAPONS.pistol.mag,
        smg: WEAPONS.smg.mag,
        shotgun: WEAPONS.shotgun.mag,
        sniper: WEAPONS.sniper.mag,
        rocket: WEAPONS.rocket.mag
      },
      reloading: false,
      reloadWeapon: null,
      reloadRemaining: 0,
      reloadTotal: 0,
      shootCd: 0,
      aimAngle: -Math.PI * 0.5,
      invuln: 0,
      hurtFlash: 0,
      dashTime: 0,
      dashDuration: 0.16,
      dashDirX: 0,
      dashDirY: 0,
      dashCd: 0,
      dashTrailTimer: 0,
      muzzle: 0,
      recoil: 0,
      walkPhase: rand(0, TAU),
      moving: false,
      dead: false
    };
    return player;
  }

  function xpForLevel(level) {
    return Math.floor(38 + (level - 1) * 26 + Math.pow(level, 1.25) * 4);
  }

  function stageTargetFor(stage) {
    return 10 + stage * 3;
  }

  function createGame(mode) {
    const g = {
      mode: mode === 'stage' ? 'stage' : 'survival',
      time: 0,
      lastSecond: 0,
      score: 0,
      kills: 0,
      level: 1,
      xp: 0,
      xpToNext: xpForLevel(1),
      pendingLevelUps: 0,
      player: createPlayer(),
      camera: {
        x: 0,
        y: 0,
        shake: 0,
        shakeX: 0,
        shakeY: 0
      },
      enemies: [],
      bullets: [],
      enemyBullets: [],
      orbs: [],
      particles: [],
      numbers: [],
      rings: [],
      toasts: [],
      banner: null,
      boss: null,
      bossActive: false,
      nextBossAt: 42,
      spawnTimer: 1.2,
      tutorial: 7.2,
      enemyUid: 0,
      stage: 1,
      stageKills: 0,
      stageTarget: stageTargetFor(1),
      stageState: 'fighting',
      stageTransition: 0,
      upgradeOptions: [],
      upgradeChoosing: false,
      deathTimer: 0,
      gameOverShown: false,
      statsCommitted: false,
      finalScore: 0,
      newRecord: false
    };
    return g;
  }

  function centerCamera(instant) {
    if (!game) return;
    const p = game.player;
    const maxX = Math.max(0, MAP.w - view.w);
    const maxY = Math.max(0, MAP.h - view.h);
    const targetX = maxX > 0 ? clamp(p.x - view.w * 0.5, 0, maxX) : (MAP.w - view.w) * 0.5;
    const targetY = maxY > 0 ? clamp(p.y - view.h * 0.5, 0, maxY) : (MAP.h - view.h) * 0.5;
    if (instant) {
      game.camera.x = targetX;
      game.camera.y = targetY;
    }
  }

  function startGame(mode) {
    hideScreens();
    hideInstructions();
    audio.ensure();
    clearInput();
    game = createGame(mode);
    setState(S.PLAYING);
    showScreen(null);
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
    input.mouse.down = false;
    input.mouse.seen = false;
    input.mouse.x = view.w * 0.5;
    input.mouse.y = view.h * 0.4;

    centerCamera(true);
    updateCamera(0, true);

    const spawnDistance = Math.min(view.w, view.h) * 0.6 + 150;
    for (let i = 0; i < 3; i += 1) {
      spawnEnemy('normal', { distance: spawnDistance + i * 60, silent: true });
    }

    if (game.mode === 'stage') {
      setBanner('第 1 关', '目标：击败 ' + game.stageTarget + ' 名追兵', 'stage', 2.6);
    } else {
      setBanner('无限生存', '活下来。别被追上。', 'info', 2.4);
    }
    audio.play('start');
    lastFrameTime = performance.now();
  }

  function pauseGame() {
    if (!game || state !== S.PLAYING) return;
    setState(S.PAUSED);
    showScreen('pause');
    clearInput();
    const p = game.player;
    el.pauseMode.textContent = game.mode === 'stage'
      ? '关卡挑战 · 第 ' + game.stage + ' 关 · 游戏已暂停'
      : '无限生存 · 游戏已暂停';
    el.pauseTime.textContent = formatTime(game.time);
    el.pauseKills.textContent = formatNumber(game.kills);
    el.pauseLevel.textContent = String(game.level);
    el.resumeBtn.focus({ preventScroll: true });
  }

  function resumeGame() {
    if (!game || state !== S.PAUSED) return;
    hideScreens();
    setState(S.PLAYING);
    clearInput();
    audio.play('ui');
    lastFrameTime = performance.now();
  }

  function togglePause() {
    if (state === S.PLAYING) {
      pauseGame();
    } else if (state === S.PAUSED) {
      resumeGame();
    }
  }

  function returnToMenu() {
    hideScreens();
    hideInstructions();
    clearInput();
    game = null;
    setState(S.MENU);
    showScreen('menu');
    updateMenuStats();
    audio.play('ui');
  }

  function restartGame() {
    const mode = game ? game.mode : 'survival';
    startGame(mode);
  }

  /* =======================================================
     摄像机、瞄准与玩家
     ======================================================= */
  function updateCamera(dt, instant) {
    if (!game) return;
    const p = game.player;
    const cam = game.camera;
    const maxX = Math.max(0, MAP.w - view.w);
    const maxY = Math.max(0, MAP.h - view.h);
    const targetX = maxX > 0 ? clamp(p.x - view.w * 0.5, 0, maxX) : (MAP.w - view.w) * 0.5;
    const targetY = maxY > 0 ? clamp(p.y - view.h * 0.5, 0, maxY) : (MAP.h - view.h) * 0.5;

    if (instant) {
      cam.x = targetX;
      cam.y = targetY;
    } else {
      const follow = 1 - Math.exp(-dt * 8.5);
      cam.x += (targetX - cam.x) * follow;
      cam.y += (targetY - cam.y) * follow;
    }

    if (dt > 0) {
      cam.shake *= Math.exp(-dt * 7.2);
      if (cam.shake < 0.05) cam.shake = 0;
    }
    cam.shakeX = rand(-1, 1) * cam.shake;
    cam.shakeY = rand(-1, 1) * cam.shake;
  }

  function addShake(amount) {
    if (!game) return;
    game.camera.shake = Math.min(26, Math.max(game.camera.shake, amount));
  }

  function screenToWorld(screenX, screenY) {
    if (!game) return { x: screenX, y: screenY };
    return {
      x: screenX + game.camera.x,
      y: screenY + game.camera.y
    };
  }

  function findNearestEnemy(x, y, maxDistance) {
    if (!game) return null;
    let best = null;
    let bestDistSq = maxDistance * maxDistance;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead) continue;
      const d2 = distSq(x, y, enemy.x, enemy.y);
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        best = enemy;
      }
    }
    return best;
  }

  function updateAim() {
    if (!game) return;
    const p = game.player;

    if (input.aim.active && (Math.abs(input.aim.x) > 0.05 || Math.abs(input.aim.y) > 0.05)) {
      p.aimAngle = Math.atan2(input.aim.y, input.aim.x);
      return;
    }

    if (!hasTouch || input.usingMouse) {
      const world = screenToWorld(input.mouse.x, input.mouse.y);
      const dx = world.x - p.x;
      const dy = world.y - p.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.001) {
        p.aimAngle = Math.atan2(dy, dx);
      }
      return;
    }

    if (input.fireHeld) {
      const target = findNearestEnemy(p.x, p.y, Math.max(view.w, view.h) * 0.9);
      if (target) {
        p.aimAngle = Math.atan2(target.y - p.y, target.x - p.x);
      }
    }
  }

  function getMoveVector() {
    let x = 0;
    let y = 0;
    if (input.keys.has('KeyA')) x -= 1;
    if (input.keys.has('KeyD')) x += 1;
    if (input.keys.has('KeyW')) y -= 1;
    if (input.keys.has('KeyS')) y += 1;
    if (input.move.active) {
      x += input.move.x;
      y += input.move.y;
    }
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    return { x: x, y: y, length: Math.min(1, length) };
  }

  function updatePlayerMovement(dt) {
    const p = game.player;
    if (p.dead) return;

    p.dashCd = Math.max(0, p.dashCd - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt);
    p.muzzle = Math.max(0, p.muzzle - dt);
    p.recoil *= Math.exp(-dt * 16);
    p.shootCd = Math.max(0, p.shootCd - dt);

    if (p.dashTime > 0) {
      p.dashTime = Math.max(0, p.dashTime - dt);
      p.x += p.dashDirX * 720 * dt;
      p.y += p.dashDirY * 720 * dt;
      p.walkPhase += dt * 22;
      p.dashTrailTimer -= dt;
      if (p.dashTrailTimer <= 0) {
        p.dashTrailTimer = 0.028;
        spawnParticle(p.x, p.y, rand(-20, 20), rand(-20, 20), rand(0.16, 0.32), rand(5, 11), 'rgba(93,225,255,0.45)', true);
      }
      if (p.dashTime <= 0) {
        addRing(p.x, p.y, p.r + 5, '#5de1ff', 0.34, 2);
      }
    } else {
      const move = getMoveVector();
      p.moving = move.length > 0.05;
      if (p.moving) {
        const speed = p.baseSpeed * p.moveSpeedMult;
        p.x += move.x * speed * dt;
        p.y += move.y * speed * dt;
        p.walkPhase += dt * (7.5 + speed * 0.012);
      }
      clampToMap(p);
    }

    clampToMap(p);
  }

  function updatePlayerCombat(dt) {
    const p = game.player;
    if (p.dead) return;

    updateAim();

    if (p.reloading) {
      p.reloadRemaining -= dt;
      if (p.reloadRemaining <= 0) {
        finishReload();
      }
    }

    const firing = input.mouse.down || input.fireHeld;
    if (firing && !p.reloading && p.shootCd <= 0) {
      if (p.ammo[p.weapon] <= 0) {
        tryReload(true);
      } else {
        fireWeapon();
      }
    }

    if (firing && !p.reloading && p.ammo[p.weapon] <= 0 && p.shootCd <= 0) {
      tryReload(true);
    }
  }

  function tryDash() {
    if (!game || state !== S.PLAYING) return;
    const p = game.player;
    if (p.dead || p.dashTime > 0 || p.dashCd > 0) return;

    const move = getMoveVector();
    let dx;
    let dy;
    if (move.length > 0.08) {
      dx = move.x / Math.max(0.001, move.length);
      dy = move.y / Math.max(0.001, move.length);
    } else {
      dx = Math.cos(p.aimAngle);
      dy = Math.sin(p.aimAngle);
    }

    p.dashTime = p.dashDuration;
    p.dashDirX = dx;
    p.dashDirY = dy;
    p.dashCd = 2.4 * p.dashCooldownMult;
    p.dashTrailTimer = 0;
    p.invuln = Math.max(p.invuln, 0.24);
    addShake(3.5);
    addRing(p.x, p.y, p.r + 2, '#5de1ff', 0.3, 2);
    for (let i = 0; i < 5; i += 1) {
      spawnParticle(
        p.x - dx * 10 + rand(-5, 5),
        p.y - dy * 10 + rand(-5, 5),
        -dx * rand(40, 140) + rand(-25, 25),
        -dy * rand(40, 140) + rand(-25, 25),
        rand(0.2, 0.4),
        rand(3, 8),
        'rgba(93,225,255,0.55)',
        true
      );
    }
    audio.play('dash');
  }

  function tryReload(automatic) {
    if (!game || state !== S.PLAYING) return;
    const p = game.player;
    if (p.dead || p.reloading) return;
    const key = p.weapon;
    const maxMag = weaponMaxMag(key);
    if (p.ammo[key] >= maxMag) {
      if (!automatic) {
        addToast('弹匣已满', 'info');
        audio.play('denied');
      }
      return;
    }
    p.reloading = true;
    p.reloadWeapon = key;
    p.reloadTotal = Math.max(0.24, WEAPONS[key].reloadTime * p.reloadMult);
    p.reloadRemaining = p.reloadTotal;
    audio.play('reload_start');
  }

  function finishReload() {
    if (!game) return;
    const p = game.player;
    if (!p.reloading) return;
    const key = p.reloadWeapon;
    p.reloading = false;
    p.reloadWeapon = null;
    p.reloadRemaining = 0;
    p.reloadTotal = 0;
    if (!key) return;
    p.ammo[key] = weaponMaxMag(key);
    if (p.weapon === key) {
      addRing(p.x, p.y, p.r + 8, '#ffe28b', 0.26, 2);
      audio.play('reload_end');
    }
  }

  function cancelReload() {
    if (!game) return;
    const p = game.player;
    p.reloading = false;
    p.reloadWeapon = null;
    p.reloadRemaining = 0;
    p.reloadTotal = 0;
  }

  function switchWeapon(index) {
    if (!game || state !== S.PLAYING) return;
    const p = game.player;
    if (p.dead) return;
    const key = WEAPON_ORDER[index];
    if (!key) return;
    if (!p.unlocked[key]) {
      addToast(WEAPONS[key].name + '尚未解锁 · 升级时可选择解锁', 'warn');
      audio.play('denied');
      return;
    }
    if (p.weapon === key) return;
    cancelReload();
    p.weapon = key;
    p.shootCd = Math.max(p.shootCd, 0.12);
    p.muzzle = 0;
    audio.play('switch');
    addToast('切换：' + WEAPONS[key].name, 'info', 1.05);
  }

  function cycleWeapon() {
    if (!game) return;
    const p = game.player;
    const unlocked = WEAPON_ORDER.filter(function (key) { return p.unlocked[key]; });
    if (unlocked.length <= 1) {
      addToast('暂无其他已解锁枪械', 'info');
      return;
    }
    let index = unlocked.indexOf(p.weapon);
    index = (index + 1) % unlocked.length;
    switchWeapon(WEAPON_ORDER.indexOf(unlocked[index]));
  }

  function getWeaponStats(key) {
    const p = game.player;
    const def = WEAPONS[key];
    return {
      damage: def.damage * p.damageMult,
      fireInterval: Math.max(0.04, def.fireInterval / p.fireRateMult),
      maxMag: weaponMaxMag(key),
      reloadTime: Math.max(0.22, def.reloadTime * p.reloadMult),
      pierce: def.pierce + p.pierceBonus,
      critChance: p.critChance,
      critMultiplier: p.critMultiplier
    };
  }

  function fireWeapon() {
    if (!game || state !== S.PLAYING) return;
    const p = game.player;
    if (p.dead || p.reloading) return;
    const key = p.weapon;
    const def = WEAPONS[key];
    const stats = getWeaponStats(key);
    if (p.ammo[key] <= 0) {
      tryReload(true);
      return;
    }

    p.ammo[key] -= 1;
    p.shootCd = stats.fireInterval;
    p.muzzle = 0.075;
    p.recoil = 1;

    const baseAngle = p.aimAngle;
    const barrelDistance = p.r + 17;
    const muzzleX = p.x + Math.cos(baseAngle) * barrelDistance;
    const muzzleY = p.y + Math.sin(baseAngle) * barrelDistance;
    const pellets = def.pellets || 1;

    for (let i = 0; i < pellets; i += 1) {
      let spread = Math.random() * 2 - 1;
      if (pellets > 1) {
        spread = (i / Math.max(1, pellets - 1) - 0.5) * 1.7 + (Math.random() * 2 - 1) * 0.45;
      }
      const angle = baseAngle + spread * def.spread;
      const critical = Math.random() < stats.critChance;
      const damage = stats.damage * (critical ? stats.critMultiplier : 1);
      spawnPlayerBullet(key, def, stats, angle, damage, critical, muzzleX, muzzleY);
    }

    spawnMuzzleFlash(muzzleX, muzzleY, baseAngle, def);
    addShake(def.shake);

    for (let i = 0; i < 2; i += 1) {
      spawnParticle(
        p.x + Math.cos(baseAngle) * (p.r + 10) + rand(-4, 4),
        p.y + Math.sin(baseAngle) * (p.r + 10) + rand(-4, 4),
        Math.cos(baseAngle) * rand(30, 120) + rand(-50, 50),
        Math.sin(baseAngle) * rand(30, 120) + rand(-50, 50),
        rand(0.25, 0.5),
        rand(1.5, 3),
        'rgba(255,206,110,0.75)',
        true
      );
    }
    spawnParticle(
      p.x + Math.cos(baseAngle) * (p.r + 8),
      p.y + Math.sin(baseAngle) * (p.r + 8),
      Math.cos(baseAngle + Math.PI * 0.65) * rand(80, 170),
      Math.sin(baseAngle + Math.PI * 0.65) * rand(80, 170),
      0.42,
      2.2,
      '#c79d5b',
      false
    );

    audio.play(def.sound);

    if (p.ammo[key] <= 0) {
      tryReload(true);
    }
  }

  function spawnPlayerBullet(key, def, stats, angle, damage, critical, startX, startY) {
    if (game.bullets.length >= MAX_BULLETS) {
      game.bullets.shift();
    }
    const speed = def.bulletSpeed;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = startX + cos * 4;
    const y = startY + sin * 4;
    const bullet = {
      x: x,
      y: y,
      vx: cos * speed,
      vy: sin * speed,
      damage: damage,
      critical: critical,
      pierce: stats.pierce,
      hits: new Set(),
      radius: def.bulletRadius,
      life: def.range / speed,
      maxLife: def.range / speed,
      color: def.color,
      glow: def.glow,
      kind: key,
      splashDamage: (def.splashDamage || 0) * game.player.damageMult,
      splashRadius: def.splashRadius || 0,
      dead: false,
      smokeTimer: 0,
      trail: [{ x: x, y: y }]
    };
    game.bullets.push(bullet);
  }

  function spawnMuzzleFlash(x, y, angle, def) {
    addRing(x, y, 8, def.color, 0.16, 2);
    for (let i = 0; i < 7; i += 1) {
      const a = angle + rand(-0.55, 0.55);
      const speed = rand(80, 280);
      spawnParticle(
        x,
        y,
        Math.cos(a) * speed,
        Math.sin(a) * speed,
        rand(0.08, 0.18),
        rand(2, 6),
        Math.random() < 0.55 ? '#fff0b6' : def.color,
        true
      );
    }
  }

  /* =======================================================
     敌人
     ======================================================= */
  function countLivingEnemies() {
    if (!game) return 0;
    let count = 0;
    for (let i = 0; i < game.enemies.length; i += 1) {
      if (!game.enemies[i].dead && game.enemies[i].type !== 'boss') count += 1;
    }
    return count;
  }

  function findSpawnPosition(distance) {
    const p = game ? game.player : { x: MAP.w * 0.5, y: MAP.h * 0.5 };
    const baseDistance = Math.max(
      distance || 0,
      Math.min(view.w, view.h) * 0.48 + 100
    );

    for (let attempt = 0; attempt < 32; attempt += 1) {
      const angle = rand(0, TAU);
      const radius = baseDistance + rand(0, Math.max(140, baseDistance * 0.45));
      const x = p.x + Math.cos(angle) * radius;
      const y = p.y + Math.sin(angle) * radius;
      if (x < 34 || x > MAP.w - 34 || y < 34 || y > MAP.h - 34) continue;
      if (screenXForWorld(x) < -60 || screenXForWorld(x) > view.w + 60 ||
          screenYForWorld(y) < -60 || screenYForWorld(y) > view.h + 60) {
        return { x: x, y: y };
      }
    }

    const edge = randInt(0, 3);
    if (edge === 0) return { x: rand(40, MAP.w - 40), y: 44 };
    if (edge === 1) return { x: rand(40, MAP.w - 40), y: MAP.h - 44 };
    if (edge === 2) return { x: 44, y: rand(40, MAP.h - 40) };
    return { x: MAP.w - 44, y: rand(40, MAP.h - 40) };
  }

  function screenXForWorld(x) {
    return x - (game ? game.camera.x : 0);
  }

  function screenYForWorld(y) {
    return y - (game ? game.camera.y : 0);
  }

  function spawnEnemy(type, options) {
    if (!game) return null;
    const opts = options || {};
    if (game.enemies.length >= MAX_ENEMIES) return null;
    const def = ENEMY_BASE[type] || ENEMY_BASE.normal;
    const isElite = type === 'elite';
    const position = findSpawnPosition(opts.distance);

    const survivalScale = game.mode === 'survival'
      ? 1 + game.time / 90 + Math.pow(game.time / 210, 1.45)
      : 1 + (game.stage - 1) * 0.235;
    const speedScale = 1 + Math.min(0.55, game.time / 260 + (game.mode === 'stage' ? (game.stage - 1) * 0.022 : 0));
    const damageScale = 1 + game.time / 300 + (game.mode === 'stage' ? (game.stage - 1) * 0.045 : 0);

    const hp = def.hp * survivalScale * (isElite ? rand(0.96, 1.08) : rand(0.94, 1.06));
    const enemy = {
      uid: ++game.enemyUid,
      type: type,
      x: position.x,
      y: position.y,
      r: def.radius * (isElite ? rand(0.98, 1.06) : rand(0.94, 1.04)),
      hp: hp,
      maxHp: hp,
      speed: def.speed * speedScale * (isElite ? 1.09 : 1),
      damage: def.damage * damageScale,
      xpValue: def.xp,
      scoreValue: def.score,
      ring: def.ring,
      hitFlash: 0,
      attackCd: rand(0.3, 0.8),
      spawnT: 0.34,
      lungeCd: rand(1.6, 4),
      lungeTime: 0,
      wobble: rand(0, TAU),
      pushX: 0,
      pushY: 0,
      dead: false,
      bossHandled: false,
      phase: 1,
      enraged: false,
      specialCd: 2.1,
      volleyCd: 3.2,
      summonCd: 0,
      summoned: false,
      castFlash: 0,
      strafeDir: Math.random() < 0.5 ? -1 : 1,
      strafeTimer: rand(1.8, 3.5)
    };

    game.enemies.push(enemy);
    addRing(position.x, position.y, 22, def.ring, 0.55, 2);
    if (!opts.silent) {
      for (let i = 0; i < 7; i += 1) {
        spawnParticle(
          position.x + rand(-12, 12),
          position.y + rand(-12, 12),
          rand(-45, 45),
          rand(-45, 45),
          rand(0.2, 0.45),
          rand(2, 5),
          def.ring,
          true
        );
      }
    }
    return enemy;
  }

  function spawnBoss(source) {
    if (!game || game.player.dead || game.bossActive) return null;
    const def = ENEMY_BASE.boss;
    const position = findSpawnPosition(Math.min(view.w, view.h) * 0.78 + 160);
    const survivalHp = 1200 + game.time * 12;
    const stageHp = 1400 + (game.stage - 1) * 560 + game.time * 4;
    const hp = game.mode === 'stage' ? stageHp : survivalHp;

    const boss = {
      uid: ++game.enemyUid,
      type: 'boss',
      name: '暴走的好兄弟',
      x: position.x,
      y: position.y,
      r: def.radius,
      hp: hp,
      maxHp: hp,
      speed: def.speed + Math.min(28, game.time / 24),
      damage: def.damage * (1 + game.time / 420),
      xpValue: def.xp,
      scoreValue: def.score,
      ring: def.ring,
      hitFlash: 0,
      attackCd: 1,
      spawnT: 0.6,
      lungeCd: 2,
      lungeTime: 0,
      wobble: rand(0, TAU),
      pushX: 0,
      pushY: 0,
      dead: false,
      bossHandled: false,
      phase: 1,
      enraged: false,
      specialCd: 2.1,
      volleyCd: 3.5,
      summoned: false,
      castFlash: 0,
      strafeDir: Math.random() < 0.5 ? -1 : 1,
      strafeTimer: rand(1.6, 3)
    };

    game.enemies.push(boss);
    game.boss = boss;
    game.bossActive = true;
    game.stageState = game.mode === 'stage' ? 'boss' : game.stageState;

    setBanner(
      '⚠ BOSS 来袭',
      '你的好兄弟彻底急了！' + (source === 'stage' ? ' 击败他，才能进入下一关。' : ''),
      'boss',
      3.1
    );
    addToast('BOSS 已出现 · 注意弹幕', 'warn', 3);
    addShake(18);
    audio.play('boss_warn');

    addRing(position.x, position.y, 40, '#ff4f6d', 0.9, 3);
    for (let i = 0; i < 30; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(70, 260);
      spawnParticle(
        position.x,
        position.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(0.3, 0.8),
        rand(2, 7),
        Math.random() < 0.5 ? '#ff4f6d' : '#ffad54',
        true
      );
    }
    return boss;
  }

  function updateSpawning(dt) {
    if (!game || game.player.dead) return;
    const g = game;

    if (g.mode === 'survival') {
      if (!g.bossActive && g.time >= g.nextBossAt) {
        spawnBoss('survival');
      }

      g.spawnTimer -= dt;
      if (g.spawnTimer <= 0) {
        const alive = countLivingEnemies();
        const maxAlive = Math.min(MAX_ENEMIES - 6, 10 + Math.floor(g.time / 10) * 2);
        if (alive < maxAlive) {
          const extra = g.time > 150 && Math.random() < 0.28 ? 1 : 0;
          for (let i = 0; i <= extra; i += 1) {
            const eliteChance = Math.min(0.33, 0.015 + g.time * 0.0016);
            spawnEnemy(Math.random() < eliteChance ? 'elite' : 'normal');
          }
        }
        const baseInterval = Math.max(0.3, 1.18 - g.time * 0.0035);
        g.spawnTimer = baseInterval * rand(0.76, 1.22);
      }
      return;
    }

    if (g.stageState !== 'fighting') return;
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      const alive = countLivingEnemies();
      const maxAlive = Math.min(44, 9 + g.stage * 2);
      if (alive < maxAlive) {
        const eliteChance = Math.min(0.42, 0.02 + g.stage * 0.035);
        spawnEnemy(Math.random() < eliteChance ? 'elite' : 'normal');
      }
      g.spawnTimer = Math.max(0.42, 1.08 - g.stage * 0.035) * rand(0.82, 1.18);
    }
  }

  function updateEnemies(dt) {
    if (!game || game.player.dead) return;
    const p = game.player;

    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead) continue;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
      enemy.spawnT = Math.max(0, enemy.spawnT - dt);
      enemy.attackCd = Math.max(0, enemy.attackCd - dt);
      enemy.castFlash = Math.max(0, enemy.castFlash - dt);

      if (enemy.spawnT > 0.12) {
        continue;
      }

      if (enemy.type === 'boss') {
        updateBoss(enemy, dt);
      } else {
        updateRegularEnemy(enemy, dt);
      }

      if (p.dead) break;

      const dx = p.x - enemy.x;
      const dy = p.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      const contactDistance = enemy.r + p.r - 3;
      if (dist < contactDistance && enemy.attackCd <= 0) {
        enemy.attackCd = enemy.type === 'boss' ? 1.05 : 0.86;
        damagePlayer(enemy.damage, enemy.x, enemy.y);
        if (p.dead) break;
      }
    }

    separateEnemies();
  }

  function updateRegularEnemy(enemy, dt) {
    const p = game.player;
    const dx = p.x - enemy.x;
    const dy = p.y - enemy.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const directionX = dx / dist;
    const directionY = dy / dist;

    let speed = enemy.speed;
    enemy.wobble += dt * 2.6;
    if (enemy.type === 'elite') {
      enemy.lungeCd -= dt;
      if (enemy.lungeCd <= 0 && dist < 360 && enemy.lungeTime <= 0) {
        enemy.lungeTime = 0.28;
        enemy.lungeCd = rand(3.2, 4.8);
      }
      if (enemy.lungeTime > 0) {
        enemy.lungeTime -= dt;
        speed *= 2.25;
      }
    }

    const wobble = Math.sin(enemy.wobble + enemy.uid * 0.7) * (enemy.type === 'elite' ? 0.15 : 0.22);
    let moveX = directionX;
    let moveY = directionY;
    if (dist < 70) {
      moveX = -directionX * 0.4;
      moveY = -directionY * 0.4;
    } else {
      const cs = Math.cos(wobble);
      const sn = Math.sin(wobble);
      moveX = directionX * cs - directionY * sn;
      moveY = directionX * sn + directionY * cs;
    }

    enemy.x += (moveX * speed + enemy.pushX) * dt;
    enemy.y += (moveY * speed + enemy.pushY) * dt;
    enemy.pushX *= Math.exp(-dt * 8);
    enemy.pushY *= Math.exp(-dt * 8);
    clampToMap(enemy);
  }

  function updateBoss(boss, dt) {
    const p = game.player;
    const dx = p.x - boss.x;
    const dy = p.y - boss.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const directionX = dx / dist;
    const directionY = dy / dist;

    if (!boss.enraged && boss.hp <= boss.maxHp * 0.5) {
      boss.enraged = true;
      boss.phase = 2;
      boss.speed *= 1.22;
      setBanner('BOSS 狂暴', '弹幕密度提升，他不想再讲道理了。', 'boss', 2.4);
      addToast('BOSS 进入狂暴状态', 'warn', 2.5);
      addShake(12);
      audio.play('boss_warn');
    }

    boss.strafeTimer -= dt;
    if (boss.strafeTimer <= 0) {
      boss.strafeTimer = rand(1.7, 3.2);
      boss.strafeDir *= -1;
    }

    const speed = boss.speed;
    if (dist > 230) {
      boss.x += directionX * speed * dt;
      boss.y += directionY * speed * dt;
    } else if (dist < 145) {
      boss.x -= directionX * speed * 0.72 * dt;
      boss.y -= directionY * speed * 0.72 * dt;
    } else {
      boss.x += (-directionY * boss.strafeDir * speed * 0.65 + directionX * 12) * dt;
      boss.y += (directionX * boss.strafeDir * speed * 0.65 + directionY * 12) * dt;
    }
    boss.x += boss.pushX * dt;
    boss.y += boss.pushY * dt;
    boss.pushX *= Math.exp(-dt * 7);
    boss.pushY *= Math.exp(-dt * 7);
    clampToMap(boss);

    boss.specialCd -= dt;
    if (boss.specialCd <= 0 && boss.spawnT <= 0) {
      fireBossRadial(boss);
      boss.specialCd = boss.enraged ? 1.75 : 2.65;
      boss.castFlash = 0.32;
    }

    boss.volleyCd -= dt;
    if (boss.volleyCd <= 0 && boss.spawnT <= 0 && dist < 1100) {
      fireBossVolley(boss);
      boss.volleyCd = boss.enraged ? 2.05 : 3.55;
      boss.castFlash = 0.24;
    }

    if (!boss.summoned && boss.hp <= boss.maxHp * 0.58) {
      boss.summoned = true;
      const count = boss.enraged ? 4 : 3;
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * TAU + rand(-0.2, 0.2);
        const summon = spawnEnemy('normal', { distance: 0, silent: true });
        if (summon) {
          summon.x = clamp(boss.x + Math.cos(angle) * 120, 40, MAP.w - 40);
          summon.y = clamp(boss.y + Math.sin(angle) * 120, 40, MAP.h - 40);
          addRing(summon.x, summon.y, 20, '#ff6b7d', 0.45, 2);
        }
      }
      addToast('BOSS 召唤了追兵！', 'warn', 2.2);
      audio.play('boss_shoot');
    }
  }

  function fireBossRadial(boss) {
    if (!game) return;
    const count = boss.enraged ? 18 : 11;
    const offset = rand(0, TAU);
    const speed = boss.enraged ? 250 : 215;
    for (let i = 0; i < count; i += 1) {
      const angle = offset + (i / count) * TAU;
      spawnEnemyBullet(
        boss.x + Math.cos(angle) * (boss.r * 0.7),
        boss.y + Math.sin(angle) * (boss.r * 0.7),
        angle,
        speed,
        boss.enraged ? 12 : 10,
        6.5,
        boss.enraged ? '#ff764f' : '#ff5a78'
      );
    }
    addRing(boss.x, boss.y, boss.r * 0.7, '#ff5a78', 0.34, 4);
    addShake(6);
    audio.play('boss_shoot');
  }

  function fireBossVolley(boss) {
    if (!game) return;
    const p = game.player;
    const baseAngle = Math.atan2(p.y - boss.y, p.x - boss.x);
    const count = boss.enraged ? 5 : 3;
    const speed = boss.enraged ? 390 : 325;
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) * 0.5) * 0.115;
      spawnEnemyBullet(
        boss.x + Math.cos(angle) * (boss.r * 0.74),
        boss.y + Math.sin(angle) * (boss.r * 0.74),
        angle,
        speed,
        boss.enraged ? 14 : 12,
        5.5,
        '#ffad54'
      );
    }
    addRing(boss.x, boss.y, boss.r * 0.55, '#ffad54', 0.28, 3);
    audio.play('boss_shoot');
  }

  function spawnEnemyBullet(x, y, angle, speed, damage, radius, color) {
    if (!game) return;
    if (game.enemyBullets.length >= MAX_ENEMY_BULLETS) game.enemyBullets.shift();
    game.enemyBullets.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: damage,
      radius: radius,
      life: 5.2,
      color: color,
      dead: false,
      trail: [{ x: x, y: y }]
    });
  }

  function separateEnemies() {
    if (!game) return;
    const list = game.enemies;
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      if (a.dead) continue;
      for (let j = i + 1; j < list.length; j += 1) {
        const b = list[j];
        if (b.dead) continue;
        const minDist = (a.r + b.r) * 0.86;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 0.01 && d2 < minDist * minDist) {
          const distance = Math.sqrt(d2);
          const push = (minDist - distance) * 0.5;
          const nx = dx / distance;
          const ny = dy / distance;
          if (a.type === 'boss' && b.type !== 'boss') {
            b.x += nx * push * 1.8;
            b.y += ny * push * 1.8;
          } else if (b.type === 'boss' && a.type !== 'boss') {
            a.x -= nx * push * 1.8;
            a.y -= ny * push * 1.8;
          } else {
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
          }
        }
      }
    }
    for (let i = 0; i < list.length; i += 1) {
      if (!list[i].dead) clampToMap(list[i]);
    }
  }

  function damageEnemy(enemy, amount, options) {
    if (!game || !enemy || enemy.dead) return;
    const opts = options || {};
    const damage = Math.max(0.1, amount);
    enemy.hp -= damage;
    enemy.hitFlash = 0.13;

    if (opts.pushX || opts.pushY) {
      enemy.pushX += opts.pushX || 0;
      enemy.pushY += opts.pushY || 0;
    }

    addDamageNumber(
      enemy.x + rand(-8, 8),
      enemy.y - enemy.r * 0.65 + rand(-6, 6),
      damage,
      opts.critical ? '#ffd166' : '#f1f8ff',
      !!opts.critical
    );

    if (!opts.silent) {
      for (let i = 0; i < 3; i += 1) {
        spawnParticle(
          enemy.x + rand(-enemy.r * 0.35, enemy.r * 0.35),
          enemy.y + rand(-enemy.r * 0.35, enemy.r * 0.35),
          rand(-90, 90),
          rand(-90, 90),
          rand(0.12, 0.26),
          rand(1.5, 4),
          opts.critical ? '#ffd166' : enemy.ring,
          true
        );
      }
      audio.play('hit');
    }

    if (enemy.hp <= 0) {
      killEnemy(enemy);
    }
  }

  function killEnemy(enemy) {
    if (!game || !enemy || enemy.dead) return;
    enemy.dead = true;
    enemy.hp = 0;
    game.kills += 1;
    game.score += enemy.scoreValue || 0;

    const particleCount = enemy.type === 'boss' ? 42 : enemy.type === 'elite' ? 18 : 11;
    for (let i = 0; i < particleCount; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(30, enemy.type === 'boss' ? 340 : 190);
      spawnParticle(
        enemy.x,
        enemy.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(0.24, 0.82),
        rand(2, enemy.type === 'boss' ? 8 : 5),
        Math.random() < 0.65 ? enemy.ring : '#fff0d4',
        true
      );
    }
    addRing(enemy.x, enemy.y, enemy.r, enemy.ring, enemy.type === 'boss' ? 1 : 0.42, enemy.type === 'boss' ? 4 : 2);
    spawnXpOrbs(enemy);
    audio.play('kill');

    if (enemy.type === 'boss') {
      handleBossDeath(enemy);
      return;
    }

    if (game.mode === 'stage' && game.stageState === 'fighting') {
      game.stageKills += 1;
      if (game.stageKills >= game.stageTarget) {
        completeStageObjective();
      }
    }
  }

  function spawnXpOrbs(enemy) {
    if (!game) return;
    const total = enemy.xpValue || 9;
    let count = enemy.type === 'boss' ? 12 : enemy.type === 'elite' ? 3 : 1;
    if (game.orbs.length + count > MAX_ORBS) {
      count = 1;
      gainXp(total);
      return;
    }
    const perOrb = total / count;
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, TAU);
      const speed = enemy.type === 'boss' ? rand(40, 160) : rand(20, 90);
      game.orbs.push({
        x: enemy.x + rand(-enemy.r * 0.35, enemy.r * 0.35),
        y: enemy.y + rand(-enemy.r * 0.35, enemy.r * 0.35),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        value: perOrb,
        r: enemy.type === 'boss' ? 6.5 : 4.5,
        color: enemy.type === 'boss' ? '#ffcf66' : enemy.type === 'elite' ? '#ffd166' : '#69e8ff',
        phase: rand(0, TAU),
        life: 0
      });
    }
  }

  function handleBossDeath(boss) {
    if (!game || boss.bossHandled) return;
    boss.bossHandled = true;
    game.boss = null;
    game.bossActive = false;
    game.score += 2000 + game.stage * 500;
    healPlayer(30, true);

    addShake(20);
    audio.play('boss_die');
    setBanner('BOSS 已击败', '+ ' + formatNumber(2000 + game.stage * 500) + ' 分 · 恢复 30 生命', 'reward', 3.2);
    addToast('BOSS 额外奖励已结算', 'good', 3);
    addRing(boss.x, boss.y, boss.r, '#ffcf66', 1.1, 5);

    if (game.mode === 'survival') {
      game.nextBossAt = game.time + 58;
    } else if (game.mode === 'stage') {
      game.stageState = 'transition';
      game.stageTransition = 2.3;
      game.score += 300 * game.stage;
    }
  }

  function completeStageObjective() {
    if (!game || game.mode !== 'stage' || game.stageState !== 'fighting') return;
    if (game.stage % 3 === 0) {
      game.stageState = 'boss';
      audio.play('stage');
      spawnBoss('stage');
    } else {
      game.stageState = 'transition';
      game.stageTransition = 1.8;
      game.score += 160 + game.stage * 45;
      setBanner('目标完成', '即将进入第 ' + (game.stage + 1) + ' 关', 'stage', 1.8);
      audio.play('stage');
    }
  }

  function advanceStage() {
    if (!game || game.mode !== 'stage') return;
    game.stage += 1;
    game.stageKills = 0;
    game.stageTarget = stageTargetFor(game.stage);
    game.stageState = 'fighting';
    game.stageTransition = 0;
    game.spawnTimer = 0.9;
    game.score += 250 + game.stage * 60;
    healPlayer(15, true);
    setBanner(
      '第 ' + game.stage + ' 关',
      '目标：击败 ' + game.stageTarget + ' 名追兵' + (game.stage % 3 === 0 ? ' · 本关有 BOSS' : ''),
      'stage',
      2.4
    );
    audio.play('stage');
  }

  /* =======================================================
     玩家伤害 / 死亡 / 结算
     ======================================================= */
  function damagePlayer(amount, sourceX, sourceY) {
    if (!game || state !== S.PLAYING) return;
    const p = game.player;
    if (p.dead || p.invuln > 0 || p.dashTime > 0) return;

    const damage = Math.max(1, amount);
    p.hp = Math.max(0, p.hp - damage);
    p.invuln = 0.56;
    p.hurtFlash = 0.4;
    addShake(10);
    addDamageNumber(p.x + rand(-6, 6), p.y - p.r - 12, damage, '#ff7188', false, '-');
    addRing(p.x, p.y, p.r, '#ff4f6d', 0.38, 3);
    for (let i = 0; i < 10; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(40, 170);
      spawnParticle(
        p.x,
        p.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(0.2, 0.5),
        rand(2, 5),
        '#ff637e',
        true
      );
    }
    audio.play('hurt');

    if (sourceX !== undefined && sourceY !== undefined) {
      const dx = p.x - sourceX;
      const dy = p.y - sourceY;
      const length = Math.max(0.001, Math.hypot(dx, dy));
      p.x += (dx / length) * 8;
      p.y += (dy / length) * 8;
      clampToMap(p);
    }

    if (p.hp <= 0) {
      killPlayer();
    }
  }

  function healPlayer(amount, silent) {
    if (!game) return;
    const p = game.player;
    if (p.dead) return;
    const actual = Math.min(amount, p.maxHp - p.hp);
    if (actual <= 0) return;
    p.hp += actual;
    if (!silent) {
      addDamageNumber(p.x, p.y - p.r - 16, actual, '#66e6a8', false, '+');
      addRing(p.x, p.y, p.r + 4, '#66e6a8', 0.45, 2);
      audio.play('pickup');
    }
  }

  function killPlayer() {
    if (!game || game.player.dead) return;
    const p = game.player;
    p.dead = true;
    p.hp = 0;
    p.dashTime = 0;
    setState(S.DYING);
    clearInput();
    hideScreens();
    game.deathTimer = 1.3;
    game.banner = null;
    game.camera.shake = 22;
    audio.play('gameover');

    addRing(p.x, p.y, p.r, '#ff4f6d', 1.2, 5);
    for (let i = 0; i < 36; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(40, 310);
      spawnParticle(
        p.x,
        p.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(0.35, 1.1),
        rand(2, 8),
        Math.random() < 0.5 ? '#ff4f6d' : '#ffad54',
        true
      );
    }
  }

  function showGameOver() {
    if (!game || game.gameOverShown || state !== S.DYING) return;
    game.gameOverShown = true;
    setState(S.GAMEOVER);
    hideScreens();
    clearInput();
    showScreen('gameover');

    const score = Math.max(0, Math.floor(game.score));
    game.finalScore = score;

    const previousHigh = save.highScore;
    const oldMaxTime = save.maxTime;
    const oldMaxLevel = save.maxLevel;
    const newHigh = score > previousHigh;
    const newTime = Math.floor(game.time) > oldMaxTime;
    const newLevel = game.level > oldMaxLevel;

    if (!game.statsCommitted) {
      game.statsCommitted = true;
      save.highScore = Math.max(save.highScore, score);
      save.maxTime = Math.max(save.maxTime, Math.floor(game.time));
      save.maxLevel = Math.max(save.maxLevel, game.level);
      save.totalKills += game.kills;
      save.highestStage = Math.max(save.highestStage || 0, game.mode === 'stage' ? game.stage : 0);
      persistSave();
    }

    el.resultTitle.textContent = game.mode === 'stage'
      ? '倒在第 ' + game.stage + ' 关'
      : '你被追上了……';
    el.gameOverMode.textContent = game.mode === 'stage'
      ? '关卡挑战 · 本局结束'
      : '无限生存 · 本局结束';
    el.resultScore.textContent = formatNumber(score);
    el.resultTime.textContent = formatTime(game.time);
    el.resultKills.textContent = formatNumber(game.kills);
    el.resultLevel.textContent = String(game.level);

    if (game.mode === 'stage') {
      el.resultStageWrap.style.display = '';
      el.resultStage.textContent = String(game.stage);
      document.querySelector('.result-stats').classList.remove('three-cols');
    } else {
      el.resultStageWrap.style.display = 'none';
      document.querySelector('.result-stats').classList.add('three-cols');
    }

    el.gameOverBest.textContent = '历史最高分：' + formatNumber(save.highScore);
    el.newRecordBadge.hidden = !(newHigh || newTime || newLevel);
    if (newHigh) {
      el.newRecordBadge.textContent = '★ 新纪录 · 最高分';
    } else if (newTime) {
      el.newRecordBadge.textContent = '★ 新纪录 · 最长存活';
    } else if (newLevel) {
      el.newRecordBadge.textContent = '★ 新纪录 · 最高等级';
    }

    updateMenuStats();
    lastFrameTime = performance.now();
    if (el.restartBtn) {
      window.setTimeout(function () {
        if (state === S.GAMEOVER) el.restartBtn.focus({ preventScroll: true });
      }, 80);
    }
  }

  /* =======================================================
     升级系统
     ======================================================= */
  function makeDamageUpgrade() {
    return {
      id: 'damage',
      kind: 'stat',
      icon: '✦',
      color: '#ff8b60',
      tag: 'FIREPOWER',
      name: '高爆弹药',
      desc: '所有枪械的基础伤害提高 15%。',
      effect: '全武器伤害 +15%',
      apply: function () {
        game.player.damageMult *= 1.15;
      }
    };
  }

  function makeFireRateUpgrade() {
    return {
      id: 'firerate',
      kind: 'stat',
      icon: '»',
      color: '#5de1ff',
      tag: 'RAPID FIRE',
      name: '扳机弹簧',
      desc: '射击间隔缩短 12%，按住开火时输出更密集。',
      effect: '全武器射速 +12%',
      apply: function () {
        game.player.fireRateMult *= 1.12;
      }
    };
  }

  function makeMagUpgrade() {
    return {
      id: 'magazine',
      kind: 'stat',
      icon: '▥',
      color: '#7ce9ff',
      tag: 'CAPACITY',
      name: '扩容弹匣',
      desc: '所有枪械弹匣容量 +3，并立即补充 3 发弹药。',
      effect: '弹匣容量 +3',
      apply: function () {
        const p = game.player;
        p.magBonus += 3;
        WEAPON_ORDER.forEach(function (key) {
          p.ammo[key] = Math.min(weaponMaxMag(key), p.ammo[key] + 3);
        });
      }
    };
  }

  function makeReloadUpgrade() {
    return {
      id: 'reload',
      kind: 'stat',
      icon: '↻',
      color: '#66e6a8',
      tag: 'HANDLING',
      name: '快速装填',
      desc: '所有枪械换弹时间缩短 12%。',
      effect: '换弹时间 -12%',
      apply: function () {
        game.player.reloadMult *= 0.88;
      }
    };
  }

  function makeMaxHpUpgrade() {
    return {
      id: 'maxhp',
      kind: 'stat',
      icon: '✚',
      color: '#ff6b7d',
      tag: 'VITALITY',
      name: '强健体魄',
      desc: '最大生命值 +20，并立即恢复 20 点生命。',
      effect: '最大生命 +20',
      apply: function () {
        const p = game.player;
        p.maxHp += 20;
        p.hp = Math.min(p.maxHp, p.hp + 20);
        addRing(p.x, p.y, p.r + 10, '#ff6b7d', 0.55, 2);
      }
    };
  }

  function makeHealUpgrade() {
    const amount = Math.round(game.player.maxHp * 0.35);
    return {
      id: 'heal',
      kind: 'heal',
      icon: '♥',
      color: '#66e6a8',
      tag: 'RECOVERY',
      name: '紧急包扎',
      desc: '立即恢复 35% 最大生命值（约 ' + amount + ' 点）。',
      effect: '恢复 ' + amount + ' 生命',
      apply: function () {
        healPlayer(game.player.maxHp * 0.35, false);
      }
    };
  }

  function makeSpeedUpgrade() {
    return {
      id: 'speed',
      kind: 'stat',
      icon: '➤',
      color: '#78a5ff',
      tag: 'MOBILITY',
      name: '轻量跑鞋',
      desc: '移动速度提高 8%，走位更灵活。',
      effect: '移动速度 +8%',
      apply: function () {
        game.player.moveSpeedMult = Math.min(1.8, game.player.moveSpeedMult * 1.08);
      }
    };
  }

  function makeDashUpgrade() {
    return {
      id: 'dash',
      kind: 'stat',
      icon: '⇥',
      color: '#5de1ff',
      tag: 'EVASION',
      name: '战术翻滚',
      desc: '冲刺冷却时间缩短 14%。',
      effect: '冲刺冷却 -14%',
      apply: function () {
        game.player.dashCooldownMult = Math.max(0.36, game.player.dashCooldownMult * 0.86);
      }
    };
  }

  function makePierceUpgrade() {
    return {
      id: 'pierce',
      kind: 'stat',
      icon: '➹',
      color: '#a78bfa',
      tag: 'PENETRATION',
      name: '穿甲弹头',
      desc: '所有子弹穿透能力 +1，狙击枪可以贯穿更多敌人。',
      effect: '子弹穿透 +1',
      apply: function () {
        game.player.pierceBonus = Math.min(12, game.player.pierceBonus + 1);
      }
    };
  }

  function makeCritUpgrade() {
    return {
      id: 'crit',
      kind: 'stat',
      icon: '◈',
      color: '#ffcf66',
      tag: 'CRITICAL',
      name: '致命准星',
      desc: '暴击概率提高 5%，暴击造成双倍伤害。',
      effect: '暴击率 +5%',
      apply: function () {
        game.player.critChance = Math.min(0.75, game.player.critChance + 0.05);
      }
    };
  }

  function makeUnlockOption() {
    if (!game) return null;
    const p = game.player;
    const nextKey = WEAPON_ORDER.find(function (key) {
      return !p.unlocked[key];
    });
    if (!nextKey) return null;
    const def = WEAPONS[nextKey];
    if (game.level < def.unlockLevel) return null;

    return {
      id: 'unlock_' + nextKey,
      kind: 'unlock',
      icon: '🔓',
      color: '#ffcf66',
      tag: 'NEW WEAPON · LV.' + def.unlockLevel,
      name: '解锁 · ' + def.name,
      desc: def.desc + ' 解锁后自动切换并装满弹药。',
      effect: '伤害 ' + def.damage + ' · 弹匣 ' + def.mag + (def.pellets > 1 ? ' · ' + def.pellets + ' 弹丸' : ''),
      apply: function () {
        p.unlocked[nextKey] = true;
        p.ammo[nextKey] = weaponMaxMag(nextKey);
        cancelReload();
        p.weapon = nextKey;
        p.shootCd = 0.2;
        addToast('已解锁并切换至 ' + def.name, 'good', 2.8);
        addRing(p.x, p.y, p.r + 20, '#ffcf66', 0.8, 3);
        audio.play('upgrade');
      }
    };
  }

  function buildUpgradePool() {
    const p = game.player;
    const pool = [];
    pool.push(makeDamageUpgrade());
    pool.push(makeFireRateUpgrade());
    if (p.magBonus < 45) pool.push(makeMagUpgrade());
    pool.push(makeReloadUpgrade());
    pool.push(makeMaxHpUpgrade());
    if (p.hp < p.maxHp - 1) pool.push(makeHealUpgrade());
    if (p.moveSpeedMult < 1.79) pool.push(makeSpeedUpgrade());
    if (p.dashCooldownMult > 0.38) pool.push(makeDashUpgrade());
    if (p.pierceBonus < 12) pool.push(makePierceUpgrade());
    if (p.critChance < 0.74) pool.push(makeCritUpgrade());
    return pool;
  }

  function generateUpgradeOptions() {
    const options = [];
    const unlock = makeUnlockOption();
    if (unlock) options.push(unlock);

    const pool = shuffle(buildUpgradePool());
    for (let i = 0; i < pool.length && options.length < 3; i += 1) {
      if (!options.some(function (option) { return option.id === pool[i].id; })) {
        options.push(pool[i]);
      }
    }
    while (options.length < 3) {
      options.push(makeDamageUpgrade());
    }
    shuffle(options);
    return options.slice(0, 3);
  }

  function renderUpgradeCards(options) {
    el.upgradeCards.innerHTML = '';
    options.forEach(function (option, index) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'upgrade-card';
      card.dataset.kind = option.kind || 'stat';
      card.style.setProperty('--card-accent', option.color);
      card.style.setProperty('--delay', String(index * 65) + 'ms');
      card.setAttribute('aria-label', option.name + '：' + option.desc);
      card.innerHTML =
        '<span class="upgrade-key">' + (index + 1) + '</span>' +
        '<span class="upgrade-icon" aria-hidden="true">' + option.icon + '</span>' +
        '<span class="upgrade-tag">' + option.tag + '</span>' +
        '<span class="upgrade-name">' + option.name + '</span>' +
        '<span class="upgrade-desc">' + option.desc + '</span>' +
        '<span class="upgrade-effect">' + option.effect + '</span>';
      card.addEventListener('click', function () {
        chooseUpgrade(index);
      });
      el.upgradeCards.appendChild(card);
    });
  }

  function openUpgrade(continuous) {
    if (!game || game.player.dead) return;
    if (state !== S.PLAYING && state !== S.UPGRADE) return;
    if (game.pendingLevelUps <= 0) return;

    setState(S.UPGRADE);
    hideScreens();
    clearInput();
    showScreen('upgrade');
    game.upgradeChoosing = false;
    game.upgradeOptions = generateUpgradeOptions();

    const p = game.player;
    addRing(p.x, p.y, p.r + 12, '#ffcf66', 0.9, 3);
    if (!continuous) {
      audio.play('levelup');
      addShake(3);
    }
    el.upgradeSub.textContent = game.pendingLevelUps > 1
      ? '游戏已暂停。当前有 ' + game.pendingLevelUps + ' 次升级待选择。每次强化都会真实改变属性。'
      : '游戏已暂停。每一次选择都会真实改变你的属性。';
    renderUpgradeCards(game.upgradeOptions);
    window.setTimeout(function () {
      if (state !== S.UPGRADE || !game || game.upgradeChoosing) return;
      const first = el.upgradeCards.querySelector('.upgrade-card');
      if (first) first.focus({ preventScroll: true });
    }, 100);
  }

  function chooseUpgrade(index) {
    if (!game || state !== S.UPGRADE || game.upgradeChoosing) return;
    const option = game.upgradeOptions[index];
    if (!option) return;

    game.upgradeChoosing = true;
    const cards = el.upgradeCards.querySelectorAll('.upgrade-card');
    if (cards[index]) cards[index].classList.add('is-chosen');
    option.apply();
    audio.play('upgrade');
    game.pendingLevelUps = Math.max(0, game.pendingLevelUps - 1);

    window.setTimeout(function () {
      if (!game || state !== S.UPGRADE) return;
      if (game.pendingLevelUps > 0) {
        openUpgrade(true);
        return;
      }
      game.upgradeOptions = [];
      hideScreens();
      setState(S.PLAYING);
      clearInput();
      input.mouse.down = false;
      lastFrameTime = performance.now();
    }, 320);
  }

  /* =======================================================
     经验 / 拾取 / 子弹 / 粒子更新
     ======================================================= */
  function gainXp(amount) {
    if (!game || game.player.dead) return;
    game.xp += Math.max(0, amount);
    let leveled = false;
    let guard = 0;
    while (game.xp >= game.xpToNext && guard < 30) {
      game.xp -= game.xpToNext;
      game.level += 1;
      game.xpToNext = xpForLevel(game.level);
      game.pendingLevelUps += 1;
      leveled = true;
      guard += 1;
    }
    if (leveled) {
      addRing(game.player.x, game.player.y, game.player.r + 16, '#ffcf66', 0.8, 4);
    }
  }

  function updateOrbs(dt) {
    if (!game) return;
    const p = game.player;
    for (let i = 0; i < game.orbs.length; i += 1) {
      const orb = game.orbs[i];
      if (orb.dead) continue;
      orb.life += dt;
      orb.phase += dt * 5;

      const dx = p.x - orb.x;
      const dy = p.y - orb.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 205) {
        const pull = (1 - distance / 205) * 1500 + 150;
        orb.vx += (dx / Math.max(0.001, distance)) * pull * dt;
        orb.vy += (dy / Math.max(0.001, distance)) * pull * dt;
      }
      const damping = Math.exp(-dt * 2.6);
      orb.vx *= damping;
      orb.vy *= damping;
      orb.x += orb.vx * dt;
      orb.y += orb.vy * dt;
      orb.vx += rand(-8, 8) * dt;
      orb.vy += rand(-8, 8) * dt;

      if (distance < p.r + 13) {
        orb.dead = true;
        gainXp(orb.value);
        audio.play('pickup');
        for (let j = 0; j < 3; j += 1) {
          spawnParticle(orb.x, orb.y, rand(-50, 50), rand(-70, 20), rand(0.2, 0.4), rand(1.5, 3.5), orb.color, true);
        }
      }
    }
    game.orbs = game.orbs.filter(function (orb) {
      return !orb.dead && orb.life < 90;
    });
  }

  function updatePlayerBullets(dt) {
    if (!game) return;
    const enemies = game.enemies;

    for (let i = 0; i < game.bullets.length; i += 1) {
      const bullet = game.bullets[i];
      if (bullet.dead) continue;

      bullet.life -= dt;
      const oldX = bullet.x;
      const oldY = bullet.y;
      const nextX = bullet.x + bullet.vx * dt;
      const nextY = bullet.y + bullet.vy * dt;

      bullet.trail.push({ x: nextX, y: nextY });
      if (bullet.trail.length > 7) bullet.trail.shift();

      if (bullet.kind === 'rocket') {
        bullet.smokeTimer -= dt;
        if (bullet.smokeTimer <= 0) {
          bullet.smokeTimer = 0.035;
          spawnParticle(
            oldX,
            oldY,
            rand(-25, 25),
            rand(-25, 25),
            rand(0.25, 0.5),
            rand(3, 7),
            'rgba(255,145,90,0.28)',
            false
          );
        }
      }

      if (bullet.life <= 0 || nextX < 0 || nextX > MAP.w || nextY < 0 || nextY > MAP.h) {
        if (bullet.kind === 'rocket') {
          explode(bullet.x, bullet.y, bullet.splashRadius, bullet.splashDamage, bullet);
        }
        bullet.dead = true;
        continue;
      }

      let hitSomething = false;
      for (let j = 0; j < enemies.length; j += 1) {
        const enemy = enemies[j];
        if (enemy.dead || bullet.hits.has(enemy.uid)) continue;
        if (!segmentCircleHit(oldX, oldY, nextX, nextY, enemy.x, enemy.y, enemy.r + bullet.radius)) {
          continue;
        }

        bullet.hits.add(enemy.uid);
        const dx = enemy.x - oldX;
        const dy = enemy.y - oldY;
        const length = Math.max(0.001, Math.hypot(dx, dy));
        const push = bullet.kind === 'shotgun' ? 34 : bullet.kind === 'sniper' ? 110 : 22;

        if (bullet.kind === 'rocket') {
          damageEnemy(enemy, bullet.damage, {
            critical: bullet.critical,
            pushX: (dx / length) * 80,
            pushY: (dy / length) * 80
          });
          explode(nextX, nextY, bullet.splashRadius, bullet.splashDamage, bullet);
          bullet.dead = true;
          hitSomething = true;
          break;
        }

        damageEnemy(enemy, bullet.damage, {
          critical: bullet.critical,
          pushX: (dx / length) * push,
          pushY: (dy / length) * push
        });

        const canPierce = bullet.pierce > 1;
        if (canPierce) {
          bullet.pierce -= 1;
        } else {
          bullet.dead = true;
          hitSomething = true;
          break;
        }
      }

      if (!bullet.dead && !hitSomething) {
        bullet.x = nextX;
        bullet.y = nextY;
      }
      if (!bullet.dead && (nextX < 0 || nextX > MAP.w || nextY < 0 || nextY > MAP.h)) {
        bullet.dead = true;
      }
    }

    game.bullets = game.bullets.filter(function (bullet) {
      return !bullet.dead;
    });
  }

  function explode(x, y, radius, damage, sourceBullet) {
    if (!game) return;
    addRing(x, y, 12, '#ff9867', 0.55, 4);
    addRing(x, y, radius * 0.55, '#ffcf66', 0.38, 2);
    addShake(11);
    audio.play('explosion');

    for (let i = 0; i < 34; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(40, 360);
      spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(0.24, 0.8),
        rand(2, 9),
        Math.random() < 0.45 ? '#ffcf66' : Math.random() < 0.6 ? '#ff7048' : '#8b4a35',
        Math.random() < 0.72
      );
    }

    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead) continue;
      const distance = Math.hypot(enemy.x - x, enemy.y - y);
      const reach = radius + enemy.r;
      if (distance <= reach) {
        const falloff = clamp(1 - Math.max(0, distance - enemy.r * 0.35) / radius, 0.32, 1);
        damageEnemy(enemy, damage * falloff, {
          critical: false,
          pushX: ((enemy.x - x) / Math.max(1, distance)) * 140 * falloff,
          pushY: ((enemy.y - y) / Math.max(1, distance)) * 140 * falloff,
          silent: true
        });
      }
    }

    if (sourceBullet) {
      sourceBullet.dead = true;
    }
  }

  function updateEnemyBullets(dt) {
    if (!game) return;
    const p = game.player;

    for (let i = 0; i < game.enemyBullets.length; i += 1) {
      const bullet = game.enemyBullets[i];
      if (bullet.dead) continue;
      bullet.life -= dt;
      const oldX = bullet.x;
      const oldY = bullet.y;
      const nextX = bullet.x + bullet.vx * dt;
      const nextY = bullet.y + bullet.vy * dt;

      bullet.trail.push({ x: nextX, y: nextY });
      if (bullet.trail.length > 7) bullet.trail.shift();

      if (bullet.life <= 0 || nextX < 0 || nextX > MAP.w || nextY < 0 || nextY > MAP.h) {
        bullet.dead = true;
        continue;
      }

      if (!p.dead && segmentCircleHit(oldX, oldY, nextX, nextY, p.x, p.y, p.r + bullet.radius)) {
        bullet.dead = true;
        damagePlayer(bullet.damage, oldX, oldY);
        if (p.dead) break;
        continue;
      }

      bullet.x = nextX;
      bullet.y = nextY;
    }

    game.enemyBullets = game.enemyBullets.filter(function (bullet) {
      return !bullet.dead;
    });
  }

  function updateEffects(dt) {
    if (!game) return;

    for (let i = 0; i < game.particles.length; i += 1) {
      const particle = game.particles[i];
      particle.life -= dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= Math.exp(-dt * particle.drag);
      particle.vy *= Math.exp(-dt * particle.drag);
      particle.vy += particle.gravity * dt;
      particle.rotation += particle.spin * dt;
    }
    game.particles = game.particles.filter(function (particle) {
      return particle.life > 0;
    });

    for (let i = 0; i < game.rings.length; i += 1) {
      const ring = game.rings[i];
      ring.life -= dt;
      ring.radius += ring.growth * dt;
    }
    game.rings = game.rings.filter(function (ring) {
      return ring.life > 0;
    });

    for (let i = 0; i < game.numbers.length; i += 1) {
      const number = game.numbers[i];
      number.life -= dt;
      number.x += number.vx * dt;
      number.y += number.vy * dt;
      number.vy *= Math.exp(-dt * 2.1);
    }
    game.numbers = game.numbers.filter(function (number) {
      return number.life > 0;
    });
  }

  function spawnParticle(x, y, vx, vy, life, size, color, additive) {
    if (!game) return;
    if (game.particles.length >= MAX_PARTICLES) game.particles.shift();
    game.particles.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      life: life,
      maxLife: life,
      size: size,
      color: color,
      additive: additive !== false,
      gravity: rand(-4, 16),
      drag: rand(1.2, 4.2),
      rotation: rand(0, TAU),
      spin: rand(-10, 10)
    });
  }

  function addRing(x, y, radius, color, life, width) {
    if (!game) return;
    if (game.rings.length >= MAX_RINGS) game.rings.shift();
    game.rings.push({
      x: x,
      y: y,
      radius: radius,
      growth: rand(90, 220),
      color: color,
      life: life,
      maxLife: life,
      width: width || 2
    });
  }

  function addDamageNumber(x, y, value, color, critical, prefix) {
    if (!game) return;
    if (game.numbers.length >= MAX_NUMBERS) game.numbers.shift();
    const text = (prefix || '') + Math.max(1, Math.round(value)).toLocaleString('zh-CN');
    game.numbers.push({
      x: x,
      y: y,
      vx: rand(-18, 18),
      vy: critical ? -88 : -62,
      life: critical ? 0.95 : 0.72,
      maxLife: critical ? 0.95 : 0.72,
      text: text,
      color: color,
      critical: !!critical,
      size: critical ? 19 : 13
    });
  }

  function setBanner(title, subtitle, kind, duration) {
    if (!game) return;
    game.banner = {
      title: title,
      subtitle: subtitle || '',
      kind: kind || 'info',
      time: duration || 2.4,
      total: duration || 2.4
    };
  }

  function addToast(text, kind, duration) {
    if (!game) return;
    game.toasts.push({
      text: text,
      kind: kind || 'info',
      time: duration || 1.8,
      maxTime: duration || 1.8
    });
    if (game.toasts.length > 4) game.toasts.shift();
  }

  function updateTimers(dt) {
    if (!game) return;
    game.time += dt;
    game.tutorial = Math.max(0, game.tutorial - dt);

    const second = Math.floor(game.time);
    if (second > game.lastSecond) {
      const gained = second - game.lastSecond;
      game.score += gained * (5 + Math.floor(game.time / 60) * 2);
      game.lastSecond = second;
    }

    if (game.banner) {
      game.banner.time -= dt;
      if (game.banner.time <= 0) game.banner = null;
    }

    for (let i = 0; i < game.toasts.length; i += 1) {
      game.toasts[i].time -= dt;
    }
    game.toasts = game.toasts.filter(function (toast) {
      return toast.time > 0;
    });

    if (game.mode === 'stage' && game.stageState === 'transition') {
      game.stageTransition -= dt;
      if (game.stageTransition <= 0) {
        advanceStage();
      }
    }
  }

  function updateGame(dt) {
    if (!game || state !== S.PLAYING) return;
    const p = game.player;

    updatePlayerMovement(dt);
    updateCamera(dt);
    updatePlayerCombat(dt);
    if (state !== S.PLAYING) return;

    updateSpawning(dt);
    updateEnemies(dt);
    if (state === S.PLAYING) updatePlayerBullets(dt);
    if (state === S.PLAYING) updateEnemyBullets(dt);
    if (state === S.PLAYING) updateOrbs(dt);
    updateEffects(dt);
    updateTimers(dt);

    game.enemies = game.enemies.filter(function (enemy) { return !enemy.dead; });
    if (game.boss && game.boss.dead) {
      game.boss = null;
      game.bossActive = false;
    }

    if (state === S.PLAYING && !p.dead && game.pendingLevelUps > 0) {
      openUpgrade(false);
    }
  }

  function updateDying(dt) {
    if (!game) return;
    if (game.deathTimer > 0) {
      game.deathTimer -= dt;
      updateEffects(dt);
      updateCamera(dt);
      if (game.deathTimer <= 0) {
        showGameOver();
      }
    }
  }

  /* =======================================================
     主循环
     ======================================================= */
  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    if (state === S.PLAYING) {
      updateGame(dt);
    } else if (state === S.DYING) {
      updateDying(dt);
    }

    render(now);
    window.requestAnimationFrame(loop);
  }

  /* =======================================================
     渲染工具
     ======================================================= */
  function setFont(size, weight) {
    ctx.font = (weight || 600) + ' ' + size + 'px ' +
      '"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';
  }

  function setMonoFont(size, weight) {
    ctx.font = (weight || 600) + ' ' + size + 'px "Cascadia Mono","SFMono-Regular",Consolas,monospace';
  }

  function drawPanel(x, y, w, h, radius, fill, stroke) {
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.fillStyle = fill || 'rgba(9,16,26,0.82)';
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function drawBar(x, y, w, h, ratio, colorA, colorB, background) {
    const value = clamp(ratio, 0, 1);
    roundRectPath(ctx, x, y, w, h, h * 0.5);
    ctx.fillStyle = background || 'rgba(255,255,255,0.08)';
    ctx.fill();

    if (value > 0.002) {
      ctx.save();
      roundRectPath(ctx, x, y, w, h, h * 0.5);
      ctx.clip();
      const gradient = ctx.createLinearGradient(x, y, x + w, y);
      gradient.addColorStop(0, colorA);
      gradient.addColorStop(1, colorB);
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, w * value, h);
      ctx.restore();
    }
  }

  function drawCircularAvatar(entry, x, y, radius, ringColor, options) {
    const opts = options || {};
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.clip();

    if (entry && entry.loaded && entry.image && entry.image.complete &&
        entry.image.naturalWidth > 0 && entry.image.naturalHeight > 0) {
      const image = entry.image;
      // cover 裁切：保持原始比例，用照片完整覆盖圆形碰撞区域。
      const scale = Math.max((radius * 2) / image.naturalWidth, (radius * 2) / image.naturalHeight);
      const drawW = image.naturalWidth * scale;
      const drawH = image.naturalHeight * scale;
      ctx.drawImage(image, x - drawW * 0.5, y - drawH * 0.5, drawW, drawH);
    } else {
      // 加载中或失败时先显示备用头像，加载成功后下一帧自动换成真实照片。
      drawFallbackAvatar(x, y, radius, entry);
    }

    ctx.drawImage(avatarShadeCanvas, x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, TAU);
    ctx.strokeStyle = ringColor || '#5de1ff';
    ctx.lineWidth = opts.ringWidth || 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius + 5.5, 0, TAU);
    ctx.strokeStyle = 'rgba(0,0,0,0.34)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (opts.dashed) {
      ctx.beginPath();
      ctx.setLineDash([6, 7]);
      ctx.arc(x, y, radius + 9, 0, TAU);
      ctx.strokeStyle = ringColor || '#5de1ff';
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawFallbackAvatar(x, y, radius, entry) {
    const colorA = (entry && entry.fallbackColorA) || '#1c7092';
    const colorB = (entry && entry.fallbackColorB) || '#5de1ff';
    const label = (entry && entry.fallbackLabel) || '?';
    const gradient = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    gradient.addColorStop(0, colorA);
    gradient.addColorStop(1, colorB);
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

    ctx.fillStyle = 'rgba(3,10,17,0.34)';
    ctx.beginPath();
    ctx.arc(x, y + radius * 0.82, radius * 0.9, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(244,252,255,0.82)';
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.06, radius * 0.31, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x, y + radius * 0.43, radius * 0.49, radius * 0.36, 0, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(4,12,20,0.65)';
    setFont(Math.max(12, radius * 0.46), 900);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y + radius * 0.62);
  }

  function drawWeaponIcon(key, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    const scale = size / 30;
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (key === 'pistol') {
      ctx.fillRect(-12, -6, 18, 7);
      ctx.fillRect(1, 0, 6, 10);
      ctx.fillRect(-11, 1, 6, 5);
      ctx.strokeRect(-12, -6, 18, 7);
    } else if (key === 'smg') {
      ctx.fillRect(-14, -5, 25, 7);
      ctx.fillRect(-5, 2, 6, 10);
      ctx.fillRect(4, 2, 4, 7);
      ctx.strokeRect(-14, -5, 25, 7);
      ctx.strokeRect(-1, -9, 7, 4);
    } else if (key === 'shotgun') {
      ctx.fillRect(-16, -4, 31, 5);
      ctx.fillRect(6, -5, 12, 3);
      ctx.fillRect(-12, 1, 12, 6);
      ctx.strokeRect(-16, -4, 31, 5);
    } else if (key === 'sniper') {
      ctx.fillRect(-17, -3, 34, 4);
      ctx.fillRect(-5, -8, 12, 4);
      ctx.fillRect(-10, 0, 11, 6);
      ctx.strokeRect(-17, -3, 34, 4);
      ctx.strokeRect(-3, -9, 8, 3);
    } else if (key === 'rocket') {
      ctx.fillRect(-16, -6, 28, 10);
      ctx.beginPath();
      ctx.moveTo(12, -6);
      ctx.lineTo(18, -1);
      ctx.lineTo(12, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-8, 4, 5, 8);
      ctx.strokeRect(-16, -6, 28, 10);
    }
    ctx.restore();
  }

  function isWorldVisible(x, y, padding) {
    if (!game) return false;
    const pad = padding || 80;
    return x >= game.camera.x - pad &&
      x <= game.camera.x + view.w + pad &&
      y >= game.camera.y - pad &&
      y <= game.camera.y + view.h + pad;
  }

  /* =======================================================
     世界渲染
     ======================================================= */
  function render(now) {
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, view.w, view.h);

    if (!game) {
      renderMenuBackground(now);
      return;
    }

    renderWorld(now);
    renderScreenEffects();
    renderHUD(now);

    if (state === S.PLAYING && !hasTouch) {
      renderCrosshair();
    }
  }

  function renderMenuBackground(now) {
    const t = now * 0.001;
    ctx.fillStyle = '#05080e';
    ctx.fillRect(0, 0, view.w, view.h);

    const glowA = ctx.createRadialGradient(
      view.w * 0.24, view.h * 0.34, 0,
      view.w * 0.24, view.h * 0.34, Math.max(view.w, view.h) * 0.48
    );
    glowA.addColorStop(0, 'rgba(30,139,174,0.18)');
    glowA.addColorStop(1, 'rgba(30,139,174,0)');
    ctx.fillStyle = glowA;
    ctx.fillRect(0, 0, view.w, view.h);

    const glowB = ctx.createRadialGradient(
      view.w * 0.82, view.h * 0.76, 0,
      view.w * 0.82, view.h * 0.76, Math.max(view.w, view.h) * 0.46
    );
    glowB.addColorStop(0, 'rgba(170,39,68,0.14)');
    glowB.addColorStop(1, 'rgba(170,39,68,0)');
    ctx.fillStyle = glowB;
    ctx.fillRect(0, 0, view.w, view.h);

    ctx.save();
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = 'rgba(94,171,204,0.14)';
    ctx.lineWidth = 1;
    const spacing = 72;
    const offset = (t * 9) % spacing;
    for (let x = -view.w; x < view.w * 2; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset - view.h * 0.32, view.h);
      ctx.stroke();
    }
    for (let y = -spacing + offset; y < view.h + spacing; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(view.w, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 22; i += 1) {
      const x = (i * 197.3 + t * (8 + (i % 4) * 3)) % (view.w + 80) - 40;
      const y = (i * 131.7 + Math.sin(t * 0.4 + i) * 26) % (view.h + 60) - 30;
      const r = 1 + (i % 3);
      ctx.fillStyle = 'rgba(93,225,255,' + (0.05 + (i % 4) * 0.015) + ')';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    const horizon = ctx.createLinearGradient(0, view.h * 0.6, 0, view.h);
    horizon.addColorStop(0, 'rgba(5,8,14,0)');
    horizon.addColorStop(1, 'rgba(5,8,14,0.9)');
    ctx.fillStyle = horizon;
    ctx.fillRect(0, view.h * 0.55, view.w, view.h * 0.45);
  }

  function renderWorld(now) {
    const cam = game.camera;
    const camX = cam.x + cam.shakeX;
    const camY = cam.y + cam.shakeY;

    ctx.save();
    ctx.translate(-camX, -camY);

    drawArena(camX, camY);

    drawOrbs();
    drawRings();
    drawCharacters(now);
    drawBullets();
    drawParticles();
    drawDamageNumbers();

    ctx.restore();
  }

  function drawArena(camX, camY) {
    ctx.fillStyle = '#04070c';
    ctx.fillRect(camX - 80, camY - 80, view.w + 160, view.h + 160);

    ctx.fillStyle = '#080d15';
    ctx.fillRect(0, 0, MAP.w, MAP.h);

    const cell = 80;
    const left = Math.max(0, Math.floor(camX / cell) * cell);
    const right = Math.min(MAP.w, camX + view.w + cell);
    const top = Math.max(0, Math.floor(camY / cell) * cell);
    const bottom = Math.min(MAP.h, camY + view.h + cell);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(80,139,165,0.07)';
    ctx.beginPath();
    for (let x = left; x <= right; x += cell) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = top; y <= bottom; y += cell) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    const bigCell = 400;
    const bigLeft = Math.max(0, Math.floor(camX / bigCell) * bigCell);
    const bigTop = Math.max(0, Math.floor(camY / bigCell) * bigCell);
    ctx.strokeStyle = 'rgba(93,225,255,0.075)';
    ctx.beginPath();
    for (let x = bigLeft; x <= right; x += bigCell) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = bigTop; y <= bottom; y += bigCell) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = 'rgba(93,225,255,0.26)';
    ctx.lineWidth = 1;
    const centerX = MAP.w * 0.5;
    const centerY = MAP.h * 0.5;
    for (let r = 280; r < 1500; r += 280) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, TAU);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(centerX - 80, centerY);
    ctx.lineTo(centerX + 80, centerY);
    ctx.moveTo(centerX, centerY - 80);
    ctx.lineTo(centerX, centerY + 80);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(93,225,255,0.16)';
    ctx.lineWidth = 2;
    ctx.setLineDash([24, 16]);
    ctx.strokeRect(14, 14, MAP.w - 28, MAP.h - 28);
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(93,225,255,0.52)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, MAP.w, MAP.h);
    ctx.restore();

    const corner = 90;
    ctx.save();
    ctx.strokeStyle = 'rgba(93,225,255,0.58)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'square';
    const corners = [
      [0, 0, 1, 1],
      [MAP.w, 0, -1, 1],
      [0, MAP.h, 1, -1],
      [MAP.w, MAP.h, -1, -1]
    ];
    corners.forEach(function (c) {
      ctx.beginPath();
      ctx.moveTo(c[0] + c[2] * corner, c[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(c[0], c[1] + c[3] * corner);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawOrbs() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < game.orbs.length; i += 1) {
      const orb = game.orbs[i];
      if (!isWorldVisible(orb.x, orb.y, 30)) continue;
      const pulse = 1 + Math.sin(orb.phase) * 0.16;
      const radius = orb.r * pulse;
      ctx.fillStyle = orb.color;
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, radius * 3.2, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, radius * 1.9, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#eaffff';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, radius * 0.52, 0, TAU);
      ctx.fill();
      ctx.fillStyle = orb.color;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, radius, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRings() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < game.rings.length; i += 1) {
      const ring = game.rings[i];
      if (!isWorldVisible(ring.x, ring.y, ring.radius + 30)) continue;
      const alpha = clamp(ring.life / ring.maxLife, 0, 1);
      ctx.globalAlpha = alpha * 0.7;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.width * alpha;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCharacters(now) {
    if (!game) return;
    const drawList = [];
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead) continue;
      if (!isWorldVisible(enemy.x, enemy.y, enemy.r + 90)) continue;
      drawList.push({ type: 'enemy', y: enemy.y, ref: enemy });
    }
    if (!game.player.dead || state === S.DYING) {
      drawList.push({ type: 'player', y: game.player.y, ref: game.player });
    }
    drawList.sort(function (a, b) { return a.y - b.y; });

    for (let i = 0; i < drawList.length; i += 1) {
      if (drawList[i].type === 'enemy') {
        drawEnemy(drawList[i].ref, now);
      } else {
        drawPlayer(now);
      }
    }
  }

  function drawEnemy(enemy, now) {
    const spawnScale = enemy.spawnT > 0 ? 0.5 + (1 - enemy.spawnT / 0.6) * 0.5 : 1;
    const scale = clamp(spawnScale, 0.45, 1);
    const radius = enemy.r * scale;
    const time = now * 0.001;

    ctx.save();

    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + enemy.r * 0.72, enemy.r * 0.92, enemy.r * 0.38, 0, 0, TAU);
    ctx.fill();

    if (enemy.type === 'boss') {
      const aura = ctx.createRadialGradient(enemy.x, enemy.y, enemy.r * 0.42, enemy.x, enemy.y, enemy.r * 2.15);
      aura.addColorStop(0, enemy.enraged ? 'rgba(255,53,91,0.23)' : 'rgba(255,79,109,0.14)');
      aura.addColorStop(1, 'rgba(255,79,109,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r * 2.15, 0, TAU);
      ctx.fill();

      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(time * 0.32);
      ctx.strokeStyle = enemy.enraged ? 'rgba(255,93,70,0.58)' : 'rgba(255,79,109,0.38)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i += 1) {
        const angle = (i / 12) * TAU;
        const inner = enemy.r * 1.18;
        const outer = enemy.r * (1.32 + (i % 2) * 0.12);
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
        ctx.stroke();
      }
      ctx.restore();
    } else if (enemy.type === 'elite') {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(-time * 0.7);
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = 'rgba(255,179,94,0.55)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r + 9, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // 普通敌人、精英敌人和 BOSS 均使用 assets/enemy.png。
    drawCircularAvatar(
      avatars.enemy,
      enemy.x,
      enemy.y,
      radius,
      enemy.type === 'boss'
        ? (enemy.enraged ? '#ff5a3c' : '#ff4f6d')
        : enemy.type === 'elite' ? '#ffb35e' : '#ff6b7d',
      {
        ringWidth: enemy.type === 'boss' ? 3.5 : enemy.type === 'elite' ? 2.4 : 1.8,
        dashed: enemy.type === 'elite'
      }
    );

    if (enemy.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(enemy.hitFlash * 4, 0, 0.55);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius + 1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (enemy.castFlash > 0) {
      ctx.globalAlpha = clamp(enemy.castFlash * 2.2, 0, 0.7);
      ctx.strokeStyle = '#ffad54';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius + 15 + (1 - enemy.castFlash / 0.32) * 26, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (enemy.type !== 'boss') {
      const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      if (hpRatio < 0.999 || enemy.type === 'elite') {
        const barWidth = enemy.type === 'elite' ? 58 : 44;
        drawBar(
          enemy.x - barWidth * 0.5,
          enemy.y - radius - 14,
          barWidth,
          4.5,
          hpRatio,
          '#ff4f6d',
          '#ffad54',
          'rgba(0,0,0,0.5)'
        );
      }
      if (enemy.type === 'elite') {
        ctx.globalAlpha = 0.8;
        setMonoFont(8, 700);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffcf66';
        ctx.fillText('ELITE', enemy.x, enemy.y - radius - 19);
        ctx.globalAlpha = 1;
      }
    }

    ctx.restore();
  }

  function drawPlayer(now) {
    const p = game.player;
    const time = now * 0.001;
    const deathAlpha = p.dead ? clamp(game.deathTimer / 1.3, 0, 1) : 1;
    // 头像中心与玩家碰撞圆心严格保持一致，不做纵向浮动。
    const renderY = p.y;
    const invulnBlink = p.invuln > 0 && p.dashTime <= 0 ? (Math.sin(time * 34) > 0 ? 0.7 : 1) : 1;

    ctx.save();
    ctx.globalAlpha = deathAlpha;

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.r * 0.78, p.r * 0.9, p.r * 0.36, 0, 0, TAU);
    ctx.fill();

    const lowHp = p.hp / p.maxHp < 0.3;
    const ringColor = lowHp ? '#ff4f6d' : '#5de1ff';
    const dashRatio = p.dashCd > 0 ? 1 - p.dashCd / (2.4 * p.dashCooldownMult) : 1;
    if (!p.dead) {
      ctx.save();
      ctx.strokeStyle = 'rgba(93,225,255,0.13)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(p.x + Math.cos(p.aimAngle) * (p.r + 20), renderY + Math.sin(p.aimAngle) * (p.r + 22));
      ctx.lineTo(p.x + Math.cos(p.aimAngle) * (p.r + 82), renderY + Math.sin(p.aimAngle) * (p.r + 82));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = lowHp ? 'rgba(255,79,109,0.9)' : 'rgba(255,207,102,0.8)';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(p.x, renderY, p.r + 12, -Math.PI * 0.5, -Math.PI * 0.5 + TAU * clamp(dashRatio, 0, 1));
      ctx.stroke();
      ctx.restore();
    }

    if (p.dashTime > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(p.dashTime / p.dashDuration, 0, 1) * 0.35;
      ctx.strokeStyle = '#5de1ff';
      ctx.lineWidth = 3;
      for (let i = 1; i <= 3; i += 1) {
        ctx.beginPath();
        ctx.arc(
          p.x - p.dashDirX * i * 15,
          renderY - p.dashDirY * i * 15,
          p.r - i * 1.5,
          0,
          TAU
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPlayerWeapon(p, renderY);

    ctx.globalAlpha = deathAlpha * invulnBlink;
    // 玩家使用 assets/player.png，中心点与碰撞圆心 (p.x, p.y) 一致。
    drawCircularAvatar(avatars.player, p.x, renderY, p.r, ringColor, {
      ringWidth: 2.5,
      dashed: lowHp
    });

    if (p.muzzle > 0) {
      const mx = p.x + Math.cos(p.aimAngle) * (p.r + 29);
      const my = renderY + Math.sin(p.aimAngle) * (p.r + 29);
      const weapon = WEAPONS[p.weapon];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(mx, my);
      ctx.rotate(p.aimAngle);
      ctx.globalAlpha = clamp(p.muzzle / 0.075, 0, 1) * 0.9;
      ctx.fillStyle = '#fff4c8';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rand(12, 28), rand(-6, 6));
      ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = weapon.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * TAU;
        ctx.moveTo(Math.cos(angle) * 4, Math.sin(angle) * 4);
        ctx.lineTo(Math.cos(angle) * rand(11, 22), Math.sin(angle) * rand(11, 22));
      }
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawPlayerWeapon(p, renderY) {
    if (p.dead) return;
    const reloadAngle = p.reloading ? Math.sin((1 - p.reloadRemaining / Math.max(0.01, p.reloadTotal)) * Math.PI) * 0.35 : 0;
    const angle = p.aimAngle + reloadAngle;
    const weapon = WEAPONS[p.weapon];
    ctx.save();
    ctx.translate(p.x, renderY);
    ctx.rotate(angle);

    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(p.r * 0.45, 5);
    ctx.lineTo(p.r + 9, 4);
    ctx.stroke();

    if (p.weapon === 'pistol') {
      ctx.fillStyle = '#1d2a35';
      ctx.fillRect(p.r * 0.72, -5, 20, 7);
      ctx.fillStyle = '#526b7c';
      ctx.fillRect(p.r * 0.72, -5, 20, 2);
      ctx.fillStyle = '#111a22';
      ctx.fillRect(p.r * 0.75, 2, 7, 11);
    } else if (p.weapon === 'smg') {
      ctx.fillStyle = '#1a2733';
      ctx.fillRect(p.r * 0.6, -6, 28, 8);
      ctx.fillRect(p.r * 0.82, 2, 6, 12);
      ctx.fillStyle = weapon.color;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(p.r * 0.7, -5, 12, 1.5);
      ctx.globalAlpha = 1;
    } else if (p.weapon === 'shotgun') {
      ctx.fillStyle = '#2a2118';
      ctx.fillRect(p.r * 0.5, -4, 34, 6);
      ctx.fillStyle = '#8f6b40';
      ctx.fillRect(p.r * 0.5, -1, 15, 8);
      ctx.fillStyle = '#c3a26b';
      ctx.fillRect(p.r * 0.5 + 34, -3, 8, 4);
    } else if (p.weapon === 'sniper') {
      ctx.fillStyle = '#1a2230';
      ctx.fillRect(p.r * 0.45, -3, 42, 5);
      ctx.fillStyle = '#3c314e';
      ctx.fillRect(p.r * 0.66, -10, 15, 5);
      ctx.fillStyle = weapon.color;
      ctx.fillRect(p.r * 0.58, -2, 22, 1.2);
    } else if (p.weapon === 'rocket') {
      ctx.fillStyle = '#25302d';
      ctx.fillRect(p.r * 0.42, -8, 37, 13);
      ctx.fillStyle = '#475b55';
      ctx.fillRect(p.r * 0.42, -8, 37, 3);
      ctx.fillStyle = '#a24e34';
      ctx.beginPath();
      ctx.moveTo(p.r * 0.42 + 37, -8);
      ctx.lineTo(p.r * 0.42 + 47, 0);
      ctx.lineTo(p.r * 0.42 + 37, 5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBullets() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < game.bullets.length; i += 1) {
      const bullet = game.bullets[i];
      if (!isWorldVisible(bullet.x, bullet.y, 80)) continue;
      drawBulletTrail(bullet, bullet.color, bullet.radius);
      ctx.fillStyle = '#fffbe9';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, Math.max(1.5, bullet.radius * 0.8), 0, TAU);
      ctx.fill();
      ctx.fillStyle = bullet.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius * 1.8, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < game.enemyBullets.length; i += 1) {
      const bullet = game.enemyBullets[i];
      if (!isWorldVisible(bullet.x, bullet.y, 80)) continue;
      drawBulletTrail(bullet, bullet.color, bullet.radius);
      const pulse = 1 + Math.sin(performance.now() * 0.02 + i) * 0.14;
      ctx.fillStyle = bullet.color;
      ctx.globalAlpha = 0.34;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius * 2.7 * pulse, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffe9dc';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius * 0.8, 0, TAU);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawBulletTrail(bullet, color, radius) {
    if (!bullet.trail || bullet.trail.length < 1) return;
    ctx.lineCap = 'round';
    ctx.lineWidth = Math.max(1, radius * 0.9);
    ctx.strokeStyle = color;
    for (let i = 1; i < bullet.trail.length; i += 1) {
      const a = bullet.trail[i - 1];
      const b = bullet.trail[i];
      ctx.globalAlpha = (i / bullet.trail.length) * 0.36;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function drawParticles() {
    ctx.save();
    for (let i = 0; i < game.particles.length; i += 1) {
      const particle = game.particles[i];
      if (!isWorldVisible(particle.x, particle.y, 30)) continue;
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      if (particle.additive) {
        ctx.globalCompositeOperation = 'lighter';
      } else {
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = alpha * (particle.additive ? 0.8 : 0.45);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, Math.max(0.6, particle.size * alpha), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawDamageNumbers() {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < game.numbers.length; i += 1) {
      const number = game.numbers[i];
      if (!isWorldVisible(number.x, number.y, 40)) continue;
      const alpha = clamp(number.life / number.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      setMonoFont(number.size, 800);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(2,5,9,0.8)';
      ctx.strokeText(number.text, number.x, number.y);
      ctx.fillStyle = number.color;
      ctx.fillText(number.text, number.x, number.y);
      if (number.critical) {
        setMonoFont(8, 800);
        ctx.fillStyle = '#ffcf66';
        ctx.fillText('CRITICAL', number.x, number.y - 15);
      }
    }
    ctx.restore();
  }

  function renderScreenEffects() {
    if (!game) return;
    const p = game.player;

    const vignette = ctx.createRadialGradient(
      view.w * 0.5, view.h * 0.5, Math.min(view.w, view.h) * 0.24,
      view.w * 0.5, view.h * 0.5, Math.max(view.w, view.h) * 0.76
    );
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, view.w, view.h);

    const hurt = Math.max(p.hurtFlash / 0.4, p.dead ? 0.8 : 0);
    const lowHp = p.hp > 0 && p.hp / p.maxHp < 0.3 ? (0.12 + Math.sin(performance.now() * 0.008) * 0.045) : 0;
    const intensity = Math.max(hurt * 0.55, lowHp);
    if (intensity > 0.01) {
      const damageGlow = ctx.createRadialGradient(
        view.w * 0.5, view.h * 0.5, Math.min(view.w, view.h) * 0.28,
        view.w * 0.5, view.h * 0.5, Math.max(view.w, view.h) * 0.72
      );
      damageGlow.addColorStop(0, 'rgba(255,20,50,0)');
      damageGlow.addColorStop(0.7, 'rgba(255,20,50,' + (intensity * 0.15).toFixed(3) + ')');
      damageGlow.addColorStop(1, 'rgba(255,24,53,' + (intensity * 0.72).toFixed(3) + ')');
      ctx.fillStyle = damageGlow;
      ctx.fillRect(0, 0, view.w, view.h);
    }

    if (game.banner && state !== S.GAMEOVER) {
      drawBanner();
    }
  }

  function drawBanner() {
    if (!game || !game.banner) return;
    const banner = game.banner;
    const elapsed = banner.total - banner.time;
    const fadeIn = clamp(elapsed / 0.22, 0, 1);
    const fadeOut = clamp(banner.time / 0.45, 0, 1);
    const alpha = Math.min(fadeIn, fadeOut);
    const scale = 0.92 + 0.08 * Math.min(1, elapsed / 0.3);
    const centerY = view.w < 760
      ? Math.max(270, view.h * 0.3)
      : view.h * 0.3;
    const accent = banner.kind === 'boss'
      ? '#ff4f6d'
      : banner.kind === 'reward'
        ? '#ffcf66'
        : banner.kind === 'stage'
          ? '#5de1ff'
          : '#dff6ff';

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(view.w * 0.5, centerY);
    ctx.scale(scale, scale);

    ctx.fillStyle = 'rgba(4,8,14,0.62)';
    roundRectPath(ctx, -Math.min(view.w * 0.43, 370), -46, Math.min(view.w * 0.86, 740), 92, 14);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = alpha * 0.3;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = alpha;

    ctx.textAlign = 'center';
    setMonoFont(10, 800);
    ctx.fillStyle = accent;
    ctx.fillText(
      banner.kind === 'boss' ? 'WARNING · BOSS INCOMING' :
      banner.kind === 'reward' ? 'TARGET ELIMINATED' :
      banner.kind === 'stage' ? 'STAGE UPDATE' : 'SURVIVAL',
      0,
      -18
    );
    setFont(view.w < 760 ? 30 : 38, 900);
    ctx.fillStyle = '#f4fbff';
    ctx.fillText(banner.title, 0, 14);
    if (banner.subtitle) {
      setFont(view.w < 760 ? 11 : 13, 500);
      ctx.fillStyle = 'rgba(190,214,230,0.72)';
      ctx.fillText(banner.subtitle, 0, 36);
    }
    ctx.restore();
  }

  function renderCrosshair() {
    const x = input.mouse.x;
    const y = input.mouse.y;
    if (x < 0 || y < 0 || x > view.w || y > view.h) return;
    const active = input.mouse.down;
    const radius = active ? 14 : 11;

    ctx.save();
    ctx.strokeStyle = active ? '#ffcf66' : 'rgba(93,225,255,0.86)';
    ctx.fillStyle = active ? '#ffcf66' : 'rgba(93,225,255,0.9)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(93,225,255,0.7)';
    ctx.beginPath();
    ctx.moveTo(x - radius - 7, y);
    ctx.lineTo(x - radius + 2, y);
    ctx.moveTo(x + radius - 2, y);
    ctx.lineTo(x + radius + 7, y);
    ctx.moveTo(x, y - radius - 7);
    ctx.lineTo(x, y - radius + 2);
    ctx.moveTo(x, y + radius - 2);
    ctx.lineTo(x, y + radius + 7);
    ctx.stroke();
    ctx.restore();
  }

  /* =======================================================
     HUD
     ======================================================= */
  function weaponObjectiveText() {
    if (!game) return '';
    if (game.mode === 'stage') {
      if (game.stageState === 'boss') return 'BOSS 战 · 击败暴走的好兄弟';
      if (game.stageState === 'transition') return '关卡完成 · 正在进入下一关';
      return '第 ' + game.stage + ' 关 · 击杀 ' + game.stageKills + '/' + game.stageTarget;
    }
    if (game.bossActive) return 'BOSS 战 · 击败暴走的好兄弟';
    const remain = Math.max(0, game.nextBossAt - game.time);
    return '下一个 BOSS ' + formatTime(remain);
  }

  function renderHUD(now) {
    if (!game) return;
    const compact = view.w < 1180;

    if (compact) {
      drawCompactHUD(now);
    } else {
      drawDesktopHUD(now);
    }

    drawBossHUD();
    drawToasts();
    drawTutorial();
    drawOffscreenBossArrow();
  }

  function drawDesktopHUD(now) {
    const p = game.player;
    const x = 24;
    const y = 20;
    const w = 344;
    const h = 98;

    drawPanel(x, y, w, h, 17, 'rgba(8,15,24,0.82)', 'rgba(103,181,214,0.18)');

    const avatarX = x + 46;
    const avatarY = y + 49;
    drawCircularAvatar(avatars.player, avatarX, avatarY, 30, '#5de1ff', { ringWidth: 2.2 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + 21, avatarY + 21, 11, 0, TAU);
    ctx.fillStyle = '#0a1520';
    ctx.fill();
    ctx.strokeStyle = '#5de1ff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    setMonoFont(8, 800);
    ctx.fillStyle = '#c9f5ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Lv.' + game.level, avatarX + 21, avatarY + 21.5);
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    setFont(11, 700);
    ctx.fillStyle = '#8fa8bb';
    ctx.fillText('你 · ' + MODE_LABEL[game.mode], x + 88, y + 20);

    drawBar(x + 88, y + 29, 228, 15, p.hp / p.maxHp, '#ff536f', '#ffad54', 'rgba(255,255,255,0.08)');
    setMonoFont(10, 800);
    ctx.fillStyle = '#fff0f2';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(p.hp) + ' / ' + Math.ceil(p.maxHp), x + 88 + 114, y + 40.5);

    drawBar(x + 88, y + 53, 228, 7, game.xp / game.xpToNext, '#5de1ff', '#a78bfa', 'rgba(255,255,255,0.07)');
    ctx.textAlign = 'left';
    setFont(9.5, 600);
    ctx.fillStyle = '#6e8ea2';
    ctx.fillText('经验 ' + Math.floor(game.xp) + ' / ' + game.xpToNext, x + 88, y + 71);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#718da1';
    ctx.fillText(weaponObjectiveText(), x + 316, y + 71);

    ctx.textAlign = 'left';
    setFont(9.5, 600);
    ctx.fillStyle = '#5c7487';
    ctx.fillText('冲刺', x + 88, y + 86);
    const dashWidth = 110;
    const dashMax = Math.max(0.01, 2.4 * p.dashCooldownMult);
    const dashRatio = p.dashCd <= 0 ? 1 : 1 - p.dashCd / dashMax;
    drawBar(x + 112, y + 80, dashWidth, 4, dashRatio, '#5de1ff', '#66e6a8', 'rgba(255,255,255,0.08)');
    ctx.fillStyle = p.dashCd <= 0 ? '#66e6a8' : '#72899a';
    ctx.fillText(p.dashCd <= 0 ? '就绪' : p.dashCd.toFixed(1) + 's', x + 229, y + 86);

    drawTopStats();
    drawDesktopWeaponPanel();
    drawDashWide();
  }

  function drawTopStats() {
    const w = 300;
    const h = 74;
    const x = view.w * 0.5 - w * 0.5;
    const y = 20;
    drawPanel(x, y, w, h, 16, 'rgba(8,15,24,0.78)', 'rgba(103,181,214,0.15)');

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    setMonoFont(9, 700);
    ctx.fillStyle = '#6f8ca2';
    ctx.fillText('SURVIVAL TIME', x + w * 0.28, y + 18);

    setMonoFont(25, 800);
    ctx.fillStyle = '#ecf9ff';
    ctx.fillText(formatTime(game.time), x + w * 0.28, y + 47);

    ctx.strokeStyle = 'rgba(123,176,203,0.14)';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.52, y + 16);
    ctx.lineTo(x + w * 0.52, y + h - 14);
    ctx.stroke();

    setMonoFont(9, 700);
    ctx.fillStyle = '#6f8ca2';
    ctx.fillText('KILLS', x + w * 0.76, y + 18);
    setMonoFont(25, 800);
    ctx.fillStyle = '#ffcf66';
    ctx.fillText(formatNumber(game.kills), x + w * 0.76, y + 47);

    if (game.mode === 'stage') {
      setFont(9, 600);
      ctx.fillStyle = '#6f8ca2';
      ctx.fillText('第 ' + game.stage + ' 关', x + w * 0.5, y + 67);
    }
  }

  function drawDesktopWeaponPanel() {
    const p = game.player;
    const w = 272;
    const h = 96;
    const x = view.w - 24 - w;
    const y = 76;
    drawPanel(x, y, w, h, 17, 'rgba(8,15,24,0.84)', 'rgba(103,181,214,0.18)');

    const weapon = WEAPONS[p.weapon];
    const maxMag = weaponMaxMag(p.weapon);
    drawWeaponIcon(p.weapon, x + 34, y + 34, 28, weapon.color);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    setFont(14, 800);
    ctx.fillStyle = '#eaf8ff';
    ctx.fillText(weapon.name, x + 62, y + 28);
    setMonoFont(8, 700);
    ctx.fillStyle = '#68869a';
    ctx.fillText('0' + weapon.key + ' · ACTIVE', x + 62, y + 42);

    const ammo = p.ammo[p.weapon];
    setMonoFont(25, 800);
    ctx.fillStyle = ammo === 0 ? '#ff5f77' : '#fff3d5';
    ctx.fillText(String(ammo), x + 62, y + 70);
    setMonoFont(11, 700);
    ctx.fillStyle = '#738b9e';
    ctx.fillText('/ ' + maxMag, x + 62 + ctx.measureText(String(ammo)).width + 5, y + 70);

    if (p.reloading) {
      const ratio = 1 - p.reloadRemaining / Math.max(0.01, p.reloadTotal);
      drawBar(x + 150, y + 62, 98, 5, ratio, '#ffcf66', '#ffad54', 'rgba(255,255,255,0.07)');
      setFont(9, 700);
      ctx.fillStyle = '#ffcf66';
      ctx.textAlign = 'right';
      ctx.fillText('装填中 ' + p.reloadRemaining.toFixed(1) + 's', x + 248, y + 82);
    } else {
      setFont(9, 600);
      ctx.fillStyle = '#607b8e';
      ctx.textAlign = 'right';
      ctx.fillText('R 换弹', x + 248, y + 82);
    }

    const slotsY = y + h + 10;
    const gap = 6;
    const slotW = (w - gap * 4) / 5;
    for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
      const key = WEAPON_ORDER[i];
      const weaponDef = WEAPONS[key];
      const unlocked = p.unlocked[key];
      const active = p.weapon === key;
      const sx = x + i * (slotW + gap);
      drawPanel(
        sx,
        slotsY,
        slotW,
        30,
        7,
        active ? 'rgba(93,225,255,0.14)' : 'rgba(7,13,21,0.78)',
        active ? 'rgba(93,225,255,0.55)' : 'rgba(120,167,192,0.13)'
      );
      ctx.textAlign = 'left';
      setMonoFont(8, 800);
      ctx.fillStyle = active ? '#7deaff' : '#5c7487';
      ctx.fillText(String(i + 1), sx + 6, slotsY + 12);
      drawWeaponIcon(key, sx + slotW * 0.5 + 3, slotsY + 17, 15, unlocked ? weaponDef.color : '#445360');
      if (!unlocked) {
        ctx.fillStyle = 'rgba(7,13,21,0.64)';
        roundRectPath(ctx, sx, slotsY, slotW, 30, 7);
        ctx.fill();
        setFont(8, 700);
        ctx.fillStyle = '#5e7080';
        ctx.textAlign = 'center';
        ctx.fillText('未解锁', sx + slotW * 0.5, slotsY + 19);
      }
    }
  }

  function drawDashWide() {
    const p = game.player;
    const w = 218;
    const h = 32;
    const x = view.w * 0.5 - w * 0.5;
    const y = view.h - 47;
    drawPanel(x, y, w, h, 16, 'rgba(7,13,21,0.72)', 'rgba(111,167,192,0.13)');
    const max = Math.max(0.01, 2.4 * p.dashCooldownMult);
    const ratio = p.dashCd <= 0 ? 1 : 1 - p.dashCd / max;
    drawBar(x + 47, y + 14, 102, 5, ratio, '#5de1ff', '#66e6a8', 'rgba(255,255,255,0.08)');
    ctx.textAlign = 'left';
    setFont(10, 700);
    ctx.fillStyle = '#b9d5e4';
    ctx.fillText('冲刺', x + 14, y + 21);
    ctx.textAlign = 'right';
    setMonoFont(9, 800);
    ctx.fillStyle = p.dashCd <= 0 ? '#66e6a8' : '#7d96a8';
    ctx.fillText(p.dashCd <= 0 ? '就绪' : p.dashCd.toFixed(1) + 's', x + w - 13, y + 21);
  }

  function drawCompactHUD(now) {
    const p = game.player;
    const x = 10;
    const y = 10;
    const w = Math.max(210, view.w - 118);
    const h = 72;

    drawPanel(x, y, w, h, 14, 'rgba(8,15,24,0.84)', 'rgba(103,181,214,0.17)');

    drawCircularAvatar(avatars.player, x + 31, y + 36, 23, '#5de1ff', { ringWidth: 2 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 51, y + 55, 8, 0, TAU);
    ctx.fillStyle = '#08131e';
    ctx.fill();
    ctx.strokeStyle = '#5de1ff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    setMonoFont(6.5, 800);
    ctx.fillStyle = '#c9f5ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Lv.' + game.level, x + 51, y + 55.5);
    ctx.restore();

    const barX = x + 66;
    const barW = w - 76;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    setFont(9.5, 700);
    ctx.fillStyle = '#8aa4b6';
    ctx.fillText('Lv.' + game.level + ' · ' + MODE_LABEL[game.mode], barX, y + 16);

    drawBar(barX, y + 23, barW, 12, p.hp / p.maxHp, '#ff536f', '#ffad54', 'rgba(255,255,255,0.08)');
    setMonoFont(8, 800);
    ctx.fillStyle = '#fff0f2';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(p.hp) + '/' + Math.ceil(p.maxHp), barX + barW * 0.5, y + 32);

    drawBar(barX, y + 41, barW, 5.5, game.xp / game.xpToNext, '#5de1ff', '#a78bfa', 'rgba(255,255,255,0.07)');
    ctx.textAlign = 'left';
    setFont(8, 600);
    ctx.fillStyle = '#6a879b';
    ctx.fillText('EXP ' + Math.floor(game.xp) + '/' + game.xpToNext, barX, y + 58);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#806f50';
    ctx.fillText(weaponObjectiveText(), x + w - 8, y + 67);

    const narrow = view.w < 390;
    const statsY = y + h + 12;
    const statsX = x;
    ctx.textAlign = 'left';
    setMonoFont(10, 700);
    ctx.fillStyle = '#a4bfd0';
    ctx.fillText('⏱ ' + formatTime(game.time), statsX, statsY + 11);
    ctx.fillStyle = '#ffcf66';
    ctx.fillText('☠ ' + formatNumber(game.kills), statsX + 78, statsY + 11);

    const dashReady = p.dashCd <= 0;
    ctx.fillStyle = dashReady ? '#66e6a8' : '#6f8798';
    ctx.fillText('⚡ ' + (dashReady ? '就绪' : p.dashCd.toFixed(1) + 's'), statsX + 148, statsY + 11);

    const wpW = 168;
    const wpH = 54;
    const wpX = view.w - 10 - wpW;
    const wpY = narrow ? statsY + 20 : statsY - 7;
    drawPanel(wpX, wpY, wpW, wpH, 12, 'rgba(8,15,24,0.78)', 'rgba(103,181,214,0.15)');
    drawWeaponIcon(p.weapon, wpX + 22, wpY + 19, 21, WEAPONS[p.weapon].color);
    ctx.textAlign = 'left';
    setFont(11.5, 800);
    ctx.fillStyle = '#eaf8ff';
    ctx.fillText(WEAPONS[p.weapon].name, wpX + 40, wpY + 17);
    setMonoFont(17, 800);
    ctx.fillStyle = p.ammo[p.weapon] === 0 ? '#ff5f77' : '#fff3d5';
    ctx.fillText(String(p.ammo[p.weapon]), wpX + 40, wpY + 38);
    setMonoFont(8.5, 700);
    ctx.fillStyle = '#70889a';
    ctx.fillText('/ ' + weaponMaxMag(p.weapon), wpX + 40 + (String(p.ammo[p.weapon]).length * 10) + 4, wpY + 38);

    if (p.reloading) {
      const ratio = 1 - p.reloadRemaining / Math.max(0.01, p.reloadTotal);
      drawBar(wpX + 102, wpY + 33, 56, 4, ratio, '#ffcf66', '#ffad54', 'rgba(255,255,255,0.07)');
      setFont(7.5, 700);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffcf66';
      ctx.fillText('装填 ' + p.reloadRemaining.toFixed(1) + 's', wpX + wpW - 9, wpY + 48);
    } else {
      ctx.textAlign = 'right';
      setFont(7.5, 600);
      ctx.fillStyle = '#607b8e';
      ctx.fillText('R 换弹', wpX + wpW - 9, wpY + 48);
    }
  }

  function drawBossHUD() {
    if (!game || !game.boss || game.boss.dead) return;
    const boss = game.boss;
    const compact = view.w < 1180;
    const w = compact ? view.w - 24 : Math.min(680, view.w - 480);
    const x = view.w * 0.5 - w * 0.5;
    const barY = compact ? (view.w < 390 ? 198 : 168) : view.h - 104;
    const labelY = barY - 7;

    drawPanel(x - 10, barY - 24, w + 20, 54, 12, 'rgba(8,13,21,0.84)', 'rgba(255,79,109,0.28)');
    ctx.textAlign = 'left';
    setFont(11, 800);
    ctx.fillStyle = '#ffdcdf';
    ctx.fillText('☠ ' + boss.name, x, labelY);
    ctx.textAlign = 'right';
    setMonoFont(9, 700);
    ctx.fillStyle = boss.enraged ? '#ff734f' : '#ff96a5';
    ctx.fillText(boss.enraged ? 'ENRAGED' : 'PHASE ' + boss.phase, x + w, labelY);

    const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
    drawBar(x, barY + 3, w, 11, ratio, boss.enraged ? '#ff5a3c' : '#ff4f6d', '#ffcf66', 'rgba(255,255,255,0.08)');
    setMonoFont(8, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffeef0';
    ctx.fillText(
      formatNumber(Math.max(0, boss.hp)) + ' / ' + formatNumber(boss.maxHp),
      x + w * 0.5,
      barY + 12
    );

    ctx.textAlign = 'left';
    setFont(8.5, 600);
    ctx.fillStyle = '#6f8899';
    ctx.fillText(compact ? '击败 BOSS 获取额外奖励' : 'Boss incoming · 保持移动，躲开弹幕', x, barY + 24);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8da2b1';
    ctx.fillText('阶段 ' + (boss.enraged ? 'Ⅱ' : 'Ⅰ'), x + w, barY + 24);
  }

  function drawToasts() {
    if (!game || game.toasts.length === 0) return;
    const compact = view.w < 1180;
    const narrow = view.w < 390;
    const baseY = compact
      ? (game.boss ? (narrow ? 250 : 225) : (narrow ? 218 : 186))
      : (game.boss ? 126 : 112);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < game.toasts.length; i += 1) {
      const toast = game.toasts[i];
      const alpha = clamp(toast.time / Math.min(0.5, toast.maxTime), 0, 1);
      const color = toast.kind === 'warn' ? '#ff8b7a' : toast.kind === 'good' ? '#66e6a8' : '#9fc6da';
      setFont(10, 700);
      const width = Math.min(view.w - 30, Math.max(180, ctx.measureText(toast.text).width + 50));
      const y = baseY + i * 31;
      ctx.globalAlpha = alpha;
      drawPanel(view.w * 0.5 - width * 0.5, y - 13, width, 26, 13, 'rgba(6,12,20,0.78)', 'rgba(120,175,201,0.16)');
      ctx.fillStyle = color;
      ctx.fillText(toast.text, view.w * 0.5, y + 0.5);
    }
    ctx.restore();
  }

  function drawTutorial() {
    if (!game || state !== S.PLAYING || game.tutorial <= 0) return;
    if (game.banner && game.banner.time > 0.45) return;
    const alpha = clamp(game.tutorial / 1.6, 0, 1) * 0.82;
    const compact = view.w < 760;
    const text = hasTouch
      ? '左摇杆移动 · 右摇杆瞄准 · 开火按钮射击'
      : 'WASD 移动 · 鼠标瞄准/射击 · R 换弹 · 空格冲刺 · 1-5 切枪';
    const narrow = view.w < 390;
    const y = compact
      ? (game.boss ? (narrow ? 268 : 280) : (narrow ? 226 : 230))
      : view.h - (game.boss ? 166 : 110);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    setFont(compact ? 9.5 : 11, 600);
    const width = Math.min(view.w - 28, ctx.measureText(text).width + 42);
    drawPanel(view.w * 0.5 - width * 0.5, y - 16, width, 32, 16, 'rgba(6,12,20,0.64)', 'rgba(120,175,201,0.13)');
    ctx.fillStyle = '#9ab2c3';
    ctx.fillText(text, view.w * 0.5, y + 1);
    ctx.restore();
  }

  function drawOffscreenBossArrow() {
    if (!game || !game.boss || game.boss.dead) return;
    const boss = game.boss;
    if (isWorldVisible(boss.x, boss.y, 30)) return;
    const sx = boss.x - game.camera.x;
    const sy = boss.y - game.camera.y;
    const margin = 64;
    const cx = clamp(sx, margin, view.w - margin);
    const cy = clamp(sy, margin, view.h - margin);
    const angle = Math.atan2(sy - view.h * 0.5, sx - view.w * 0.5);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = 'rgba(255,79,109,0.8)';
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-8, -9);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.rotate(-angle);
    ctx.textAlign = 'center';
    setMonoFont(7.5, 800);
    ctx.fillStyle = '#ff9aa8';
    ctx.fillText('BOSS', 0, 24);
    ctx.restore();
  }

  /* =======================================================
     事件绑定与启动
     ======================================================= */
  function bindUI() {
    el.startSurvivalBtn.addEventListener('click', function () {
      audio.ensure();
      startGame('survival');
    });
    el.startStageBtn.addEventListener('click', function () {
      audio.ensure();
      startGame('stage');
    });
    el.instructionsBtn.addEventListener('click', showInstructions);
    el.closeInstructionsBtn.addEventListener('click', hideInstructions);
    el.instructionsDoneBtn.addEventListener('click', hideInstructions);
    el.instructionsModal.addEventListener('click', function (event) {
      if (event.target === el.instructionsModal) hideInstructions();
    });

    el.soundToggle.addEventListener('click', toggleSound);
    el.pauseButton.addEventListener('click', function () {
      if (state === S.PLAYING) pauseGame();
    });

    el.resumeBtn.addEventListener('click', resumeGame);
    el.pauseRestartBtn.addEventListener('click', restartGame);
    el.pauseMenuBtn.addEventListener('click', returnToMenu);
    el.restartBtn.addEventListener('click', restartGame);
    el.gameOverMenuBtn.addEventListener('click', returnToMenu);
  }

  function init() {
    document.body.classList.toggle('touch', hasTouch);
    document.body.dataset.state = S.MENU;
    setState(S.MENU);
    showScreen('menu');
    updateSoundButton();
    updateMenuStats();
    resizeCanvas();
    bindUI();
    setupInput();

    if (hasTouch) {
      // 手机端默认使用自动瞄准辅助，但仍以右摇杆为优先。
      input.mouse.x = view.w * 0.5;
      input.mouse.y = view.h * 0.4;
    }

    window.requestAnimationFrame(loop);
  }

  init();
})();
