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
  const STAGE_MAP_THEMES = ['desert', 'snow', 'grass'];
  const STAGE_MAP_ACCENTS = {
    desert: '#e2b15f',
    snow: '#bfe9ff',
    grass: '#b8e986'
  };
  const STAGE_MAP_BORDERS = {
    desert: { soft: 'rgba(226,177,95,0.2)', strong: 'rgba(226,177,95,0.62)' },
    snow: { soft: 'rgba(191,233,255,0.22)', strong: 'rgba(191,233,255,0.7)' },
    grass: { soft: 'rgba(184,233,134,0.2)', strong: 'rgba(184,233,134,0.62)' }
  };
  const BRIDE_FORM_DEF = window.CharacterForms ? window.CharacterForms.getById('bride') : null;
  const BRIDE_SKILL_DEFS = BRIDE_FORM_DEF && BRIDE_FORM_DEF.skills ? BRIDE_FORM_DEF.skills : {};
  const BRIDE_CONFIG = {
    q: Object.assign({
      projectileSpeed: 540,
      projectileLife: 1.6,
      projectileRadius: 12,
      cooldown: 8,
      charmDuration: 10
    }, BRIDE_SKILL_DEFS.q || {}),
    e: Object.assign({
      cooldown: 12,
      duration: 5,
      speedMultiplier: 2,
      impactWeaponScale: 1.5,
      impactStageDamage: 8,
      hitInterval: 0.35
    }, BRIDE_SKILL_DEFS.e || {}),
    r: Object.assign({
      cooldown: 50,
      duration: 20,
      healInterval: 5,
      healAmount: 5,
      burnInterval: 1,
      burnRadius: 380,
      burnWeaponScale: 0.5,
      burnStageDamage: 10
    }, BRIDE_SKILL_DEFS.r || {})
  };

  const NUN_FORM_DEF = window.CharacterForms ? window.CharacterForms.getById('nun') : null;
  const NUN_DEMON_DEFS = NUN_FORM_DEF && NUN_FORM_DEF.skills ? NUN_FORM_DEF.skills : {};
  const NUN_FIRE_DEFS = NUN_FORM_DEF && NUN_FORM_DEF.fireSkills ? NUN_FORM_DEF.fireSkills : {};
  const NUN_CONFIG = {
    q: Object.assign({
      cooldown: 10, duration: 6, swordCount: 3, swordOrbit: 76,
      swordRange: 380, attackInterval: 0.7, weaponScale: 1, stageDamage: 5,
      flightSpeed: 620, returnSpeed: 780
    }, NUN_DEMON_DEFS.q || {}),
    e: Object.assign({
      cooldown: 14, duration: 8, attackRange: 230, attackInterval: 1.25,
      tauntRadius: 260, tentacleHp: 240, weaponScale: 1.2, stageDamage: 8
    }, NUN_DEMON_DEFS.e || {}),
    r: Object.assign({
      cooldown: 50, waves: 10, waveInterval: 0.22, bulletsPerWave: 18,
      bulletSpeed: 270, bulletLife: 2.2
    }, NUN_DEMON_DEFS.r || {}),
    fireQ: Object.assign({
      cooldown: 15, duration: 5, attackSpeedMultiplier: 2,
      bonusDamage: 10, bonusPerStage: 2
    }, NUN_FIRE_DEFS.q || {}),
    fireE: Object.assign({
      cooldown: 25, duration: 10, healPerOrb: 2, orbSpeed: 240
    }, NUN_FIRE_DEFS.e || {}),
    fireR: Object.assign({
      cooldown: 50, duration: 10, swordCount: 3, swordOrbit: 112,
      stageDamage: 60, hitInterval: 0.45, swordReach: 160, swordBack: 30
    }, NUN_FIRE_DEFS.r || {}),
    fireMelee: Object.assign({
      fireRange: 132, fireArc: 1.65, fireDamageMult: 1
    }, NUN_FORM_DEF && NUN_FORM_DEF.baseAttack ? NUN_FORM_DEF.baseAttack : {})
  };

  const STAGE_BOSS_STAGES = [5, 10, 15, 20];
  const STAGE_BOSS_CONFIG = {
    5: { tier: 1, hp: 4200, damageMult: 1, cooldownMult: 1, countBonus: 0, speedMult: 1 },
    10: { tier: 2, hp: 7000, damageMult: 1.15, cooldownMult: 0.88, countBonus: 2, speedMult: 1.05 },
    15: { tier: 3, hp: 10000, damageMult: 1.3, cooldownMult: 0.78, countBonus: 4, speedMult: 1.1 },
    20: { tier: 4, hp: 14000, damageMult: 1.5, cooldownMult: 0.68, countBonus: 6, speedMult: 1.15 }
  };
  const BOSS_THEMES = {
    desert: {
      name: '沙暴代牧豪',
      title: '沙暴之怒',
      accent: '#f3a640',
      ring: '#e38b2e',
      bullet: '#ffbd5c',
      aura: 'rgba(255, 166, 72, 0.2)',
      rage: '#ff7138',
      tagline: '黄沙掩埋了最后一点耐心。'
    },
    snow: {
      name: '冰霜代牧豪',
      title: '冰封审判',
      accent: '#7bdcff',
      ring: '#4cc8f2',
      bullet: '#9be9ff',
      aura: 'rgba(92, 205, 255, 0.2)',
      rage: '#ff6c8f',
      tagline: '雪原之上，连呼吸都被冻结。'
    },
    grass: {
      name: '荒野代牧豪',
      title: '荒野战首',
      accent: '#9be36b',
      ring: '#65b84a',
      bullet: '#b6ff76',
      aura: 'rgba(122, 220, 92, 0.18)',
      rage: '#ff7854',
      tagline: '草叶在震动，他准备结束这场追逐。'
    },
    default: {
      name: '暴走的好兄弟',
      title: '暴走',
      accent: '#ff5a78',
      ring: '#ff4f6d',
      bullet: '#ff5a78',
      aura: 'rgba(255, 79, 109, 0.14)',
      rage: '#ff5a3c',
      tagline: '你的好兄弟彻底急了！'
    }
  };

  const BOSS_PATTERN_SETS = {
    desert: ['spiral', 'cross', 'zones'],
    snow: ['spiral', 'multiRing', 'fan'],
    grass: ['spiral', 'fan', 'multiRing'],
    default: ['spiral', 'multiRing', 'fan']
  };

  function isStageBossStage(stage) {
    return STAGE_BOSS_STAGES.indexOf(stage) !== -1;
  }
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
    EVENT: 'event',
    CUTSCENE: 'cutscene',
    DYING: 'dying',
    GAMEOVER: 'gameover',
    VICTORY: 'victory'
  });

  const MODE_LABEL = {
    survival: '无限生存',
    stage: '关卡挑战'
  };

  const WEAPON_ORDER = ['pistol', 'smg', 'shotgun', 'sniper', 'rocket', 'laser'];
  // 火箭筒强化只在这里乘一次：直击基础伤害和爆炸基础伤害同时变为原来的 3 倍。
  const ROCKET_DAMAGE_MULTIPLIER = 3;

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
      damage: 58 * ROCKET_DAMAGE_MULTIPLIER,
      fireInterval: 2.64,
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
      splashDamage: 105 * ROCKET_DAMAGE_MULTIPLIER,
      splashRadius: 152,
      desc: '命中后爆炸，对范围内敌人造成伤害。'
    },
    laser: {
      key: 6,
      name: '神罚激光',
      short: '神罚',
      damage: 60,
      fireInterval: 0.25,
      mag: 0,
      reloadTime: 0,
      bulletSpeed: 2600,
      spread: 0,
      pellets: 1,
      pierce: 1,
      range: 1600,
      bulletRadius: 3.6,
      color: '#e8fbff',
      glow: '#77e8ff',
      shake: 2.3,
      unlockLevel: 8,
      sound: 'shoot_sniper',
      noReload: true,
      laser: true,
      desc: '神临资格武器。单发 60 伤害，每秒 4 次，无需换弹。'
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

  // 关卡模式最终关与难度曲线集中配置。无限模式不读取这里的成长参数。
  const STAGE_DIFFICULTY = Object.freeze({
    maxStage: 20,
    hpPerStage: 0.13,
    hpCap: 3.8,
    speedPerStage: 0.0075,
    speedCap: 0.16,
    damagePerStage: 0.018,
    damageCap: 0.4,
    maxAliveBase: 9,
    maxAlivePerStage: 1.32,
    maxAliveCap: 34,
    spawnIntervalBase: 1.08,
    spawnIntervalPerStage: 0.027,
    spawnIntervalMin: 0.55,
    eliteChanceBase: 0.03,
    eliteChancePerStage: 0.012,
    eliteChanceCap: 0.26,
    farEnemyChance: 0.2,
    farEnemy: Object.freeze({
      preferredMin: 220,
      preferredMax: 360,
      retreatDistance: 150,
      advanceDistance: 430,
      speedBase: 225,
      speedPerStage: 2.2,
      speedCap: 270,
      damageBase: 6,
      damagePerStage: 0.25,
      damageCap: 12,
      intervalBase: 2.9,
      intervalPerStage: 0.05,
      intervalMin: 1.85,
      windup: 0.42,
      bulletRadius: 5.4,
      bulletLife: 4.8,
      bulletLimit: 190
    }),
    bossHpCap: 9000
  });

  function normalizedStage(stage) {
    const value = Math.floor(Number(stage) || 1);
    return clamp(value, 1, STAGE_DIFFICULTY.maxStage);
  }

  function stageDifficulty(stage) {
    const level = normalizedStage(stage);
    const steps = level - 1;
    const far = STAGE_DIFFICULTY.farEnemy;
    return {
      stage: level,
      hpScale: Math.min(STAGE_DIFFICULTY.hpCap, 1 + STAGE_DIFFICULTY.hpPerStage * steps),
      speedScale: 1 + Math.min(STAGE_DIFFICULTY.speedCap, STAGE_DIFFICULTY.speedPerStage * steps),
      damageScale: 1 + Math.min(STAGE_DIFFICULTY.damageCap, STAGE_DIFFICULTY.damagePerStage * steps),
      maxAlive: Math.min(
        STAGE_DIFFICULTY.maxAliveCap,
        Math.floor(STAGE_DIFFICULTY.maxAliveBase + STAGE_DIFFICULTY.maxAlivePerStage * steps)
      ),
      spawnInterval: Math.max(
        STAGE_DIFFICULTY.spawnIntervalMin,
        STAGE_DIFFICULTY.spawnIntervalBase - STAGE_DIFFICULTY.spawnIntervalPerStage * steps
      ),
      eliteChance: Math.min(
        STAGE_DIFFICULTY.eliteChanceCap,
        STAGE_DIFFICULTY.eliteChanceBase + STAGE_DIFFICULTY.eliteChancePerStage * steps
      ),
      farEnemyChance: STAGE_DIFFICULTY.farEnemyChance,
      farEnemy: {
        speed: Math.min(far.speedCap, far.speedBase + far.speedPerStage * steps),
        damage: Math.min(far.damageCap, far.damageBase + far.damagePerStage * steps),
        interval: Math.max(far.intervalMin, far.intervalBase - far.intervalPerStage * steps)
      }
    };
  }

  /* =======================================================
     皮肤配置（价格、图片、显示信息集中管理）
     ======================================================= */
  const DEFAULT_SKIN_ID = 'edg';
  const SKINS = [
    {
      id: 'edg',
      name: 'EDG',
      price: 0,
      file: 'edg.png',
      accent: '#f2c56a',
      ring: '#ffd166',
      fallbackColorA: '#4b3a16',
      fallbackColorB: '#f2c56a',
      badge: '默认',
      desc: '黑色 EDG 队服，默认拥有的经典外观。'
    },
    {
      id: 'edg2026',
      name: 'EDG2026冠军赛限定',
      price: 500,
      file: 'edg-2026-champion.png',
      accent: '#ff6578',
      ring: '#ff7b87',
      fallbackColorA: '#5f1422',
      fallbackColorB: '#ff7b87',
      badge: '限定',
      desc: 'EDG2026 冠军赛限定造型，纪念冠军之夜。'
    },
    {
      id: 'korean',
      name: '韩国欧巴',
      price: 1000,
      file: 'korean-oppa.png',
      accent: '#5de1ff',
      ring: '#7deaff',
      fallbackColorA: '#174454',
      fallbackColorB: '#5de1ff',
      badge: '潮流',
      desc: '清爽蓝底证件照风格，干净利落的韩系外观。'
    },
    {
      id: 'bride',
      name: '纯白花嫁',
      price: 2000,
      file: 'pure-white-bride.png',
      accent: '#ffc7dd',
      ring: '#ffd7e8',
      fallbackColorA: '#623548',
      fallbackColorB: '#ffc7dd',
      badge: '珍藏',
      desc: '纯白婚纱与花海背景，属于特殊日子的珍藏造型。'
    },
    {
      id: 'nun',
      name: '双生魔女',
      price: 3500,
      file: 'theresa-nun.png',
      accent: '#b8a2ff',
      ring: '#d8c7ff',
      fallbackColorA: '#2c2344',
      fallbackColorB: '#b8a2ff',
      badge: '传说',
      desc: '恶魔魔剑与烈焰巨剑共生的双形态魔女。'
    }
  ];
  const SKIN_BY_ID = SKINS.reduce(function (map, skin) {
    map[skin.id] = skin;
    return map;
  }, Object.create(null));

  // 每个非默认皮肤的玩家子弹贴图。EDG 不在表内，继续使用原绘制。
  const BULLET_FX = {
    edg2026: { file: 'edg2026-pomegranate.png', trail: '#ff6a7e' },
    korean: { file: 'korean-kimchi.png', trail: '#ff9a4a' },
    bride: { file: 'bride-flower.png', trail: '#ffd7e8' },
    nun: { file: 'nun-black-sword.png', trail: '#b8a2ff' }
  };

  // 关卡金币公式集中在这里，后续只改这两个数字即可。
  const STAGE_COIN_BASE = 100;
  const STAGE_COIN_STEP = 50;

  function stageClearCoinReward(stage) {
    const level = Math.max(1, Math.floor(Number(stage) || 1));
    return STAGE_COIN_BASE + STAGE_COIN_STEP * (level - 1);
  }

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
    sfx: true,
    coins: 0,
    ownedSkins: [DEFAULT_SKIN_ID],
    equippedSkin: DEFAULT_SKIN_ID,
    wuchaoyangAffinity: 0,
    wuchaoyangCompanionUnlocked: false,
    wuchaoyangBossRewardClaimed: false,
    wuchaoyangLastReward: null,
    wuchaoyangBossKills: 0
  };

  function normalizeSave(raw) {
    const result = Object.assign({}, DEFAULT_SAVE, {
      ownedSkins: [DEFAULT_SKIN_ID],
      equippedSkin: DEFAULT_SKIN_ID
    });
    if (!raw || typeof raw !== 'object') return result;
    if (Number.isFinite(Number(raw.highScore))) result.highScore = Math.max(0, Math.floor(Number(raw.highScore)));
    if (Number.isFinite(Number(raw.maxTime))) result.maxTime = Math.max(0, Math.floor(Number(raw.maxTime)));
    if (Number.isFinite(Number(raw.maxLevel))) result.maxLevel = Math.max(1, Math.floor(Number(raw.maxLevel)));
    if (Number.isFinite(Number(raw.totalKills))) result.totalKills = Math.max(0, Math.floor(Number(raw.totalKills)));
    if (Number.isFinite(Number(raw.highestStage))) result.highestStage = Math.max(0, Math.floor(Number(raw.highestStage)));
    if (Number.isFinite(Number(raw.coins))) result.coins = Math.max(0, Math.floor(Number(raw.coins)));
    if (Number.isFinite(Number(raw.wuchaoyangAffinity))) {
      result.wuchaoyangAffinity = clamp(Math.floor(Number(raw.wuchaoyangAffinity)), 0, 100);
    }
    if (Number.isFinite(Number(raw.wuchaoyangBossKills))) {
      result.wuchaoyangBossKills = Math.max(0, Math.floor(Number(raw.wuchaoyangBossKills)));
    }
    result.wuchaoyangCompanionUnlocked = raw.wuchaoyangCompanionUnlocked === true;
    result.wuchaoyangBossRewardClaimed = raw.wuchaoyangBossRewardClaimed === true;
    result.wuchaoyangLastReward = typeof raw.wuchaoyangLastReward === 'string'
      ? raw.wuchaoyangLastReward
      : null;
    // 旧存档中的 shenlinLaserUnlocked 不再恢复：神罚激光只属于获得它的那一局。
    result.sfx = raw.sfx !== false;

    const owned = [];
    if (Array.isArray(raw.ownedSkins)) {
      raw.ownedSkins.forEach(function (id) {
        if (typeof id === 'string' && SKIN_BY_ID[id] && owned.indexOf(id) === -1) {
          owned.push(id);
        }
      });
    }
    if (owned.indexOf(DEFAULT_SKIN_ID) === -1) owned.unshift(DEFAULT_SKIN_ID);
    result.ownedSkins = owned;
    result.equippedSkin = (
      typeof raw.equippedSkin === 'string' &&
      SKIN_BY_ID[raw.equippedSkin] &&
      owned.indexOf(raw.equippedSkin) !== -1
    ) ? raw.equippedSkin : DEFAULT_SKIN_ID;
    return result;
  }

  function loadSave() {
    try {
      const text = window.localStorage.getItem(SAVE_KEY);
      if (!text) return normalizeSave(null);
      return normalizeSave(JSON.parse(text));
    } catch (error) {
      return normalizeSave(null);
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
     随机事件管理器（事件内容位于 events.js）
     ======================================================= */
  const eventSystem = window.RandomEventSystem || null;
  const randomEventManager = eventSystem ? new eventSystem.RandomEventManager() : null;
  const WUCHAOYANG_EVENT = eventSystem && eventSystem.events
    ? eventSystem.events.WUCHAOYANG
    : null;
  const SHENLIN_EVENT = eventSystem && eventSystem.events
    ? eventSystem.events.SHENLIN
    : null;
  if (randomEventManager && WUCHAOYANG_EVENT) {
    randomEventManager.register(WUCHAOYANG_EVENT);
  }
  if (randomEventManager && SHENLIN_EVENT) {
    randomEventManager.register(SHENLIN_EVENT);
  }

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
        enemy_shot: 90,
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
        case 'coin':
          this.tone(880, 1180, 0.09, 'triangle', 0.055);
          this.tone(1180, 1560, 0.12, 'triangle', 0.045, 0.08);
          this.tone(1560, 1760, 0.09, 'sine', 0.025, 0.16);
          break;
        case 'event':
          this.tone(220, 330, 0.32, 'sine', 0.06);
          this.tone(330, 440, 0.42, 'triangle', 0.035, 0.16);
          this.tone(660, 880, 0.35, 'sine', 0.02, 0.3);
          break;
        case 'event_charge':
          this.tone(270, 520, 0.18, 'sawtooth', 0.035);
          break;
        case 'heart':
          [523.25, 659.25, 880, 1174.66].forEach((freq, index) => {
            this.tone(freq, freq * 1.08, 0.12, 'sine', 0.05, index * 0.07);
          });
          break;
        case 'hostile':
          this.tone(180, 84, 0.38, 'sawtooth', 0.11);
          this.noise(0.24, 0.06, 360, 'lowpass');
          break;
        case 'event_victory':
          [392, 523.25, 659.25, 783.99, 1046.5].forEach((freq, index) => {
            this.tone(freq, freq, 0.24, 'triangle', 0.055, index * 0.09);
          });
          break;
        case 'victory':
          [392, 523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, index) => {
            this.tone(freq, freq * 1.01, 0.3, 'triangle', 0.055, index * 0.1);
          });
          this.tone(1568, 2093, 0.6, 'sine', 0.035, 0.6);
          break;
        case 'enemy_shot':
          this.tone(230, 120, 0.08, 'square', 0.026);
          break;
        case 'skill':
          [440, 660, 880].forEach((freq, index) => {
            this.tone(freq, freq * 1.06, 0.16, 'triangle', 0.045, index * 0.055);
          });
          this.tone(1320, 1760, 0.24, 'sine', 0.03, 0.14);
          break;
        case 'scythe':
          this.tone(155, 70, 0.28, 'sawtooth', 0.035);
          this.tone(620, 280, 0.18, 'triangle', 0.04, 0.02);
          break;
        case 'purchase':
          this.tone(523.25, 523.25, 0.11, 'triangle', 0.05);
          this.tone(659.25, 659.25, 0.11, 'triangle', 0.05, 0.08);
          this.tone(1046.5, 1400, 0.2, 'sine', 0.04, 0.16);
          break;
        case 'equip':
          this.tone(420, 760, 0.08, 'triangle', 0.05);
          this.tone(760, 980, 0.1, 'sine', 0.03, 0.06);
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
     单个循环 Boss 战音轨（所有 Boss 共用，避免重复实例）
     ======================================================= */
  class BossMusic {
    constructor() {
      this.el = null;
      this.owner = null;
      this.wanted = false;
      this.failed = false;
    }

    ensure() {
      if (this.el) return this.el;
      if (typeof Audio === 'undefined') {
        this.failed = true;
        return null;
      }
      const el = new Audio();
      el.src = 'assets/audio/boss-battle.mp3?v=20261023-2';
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0.34;
      el.addEventListener('error', () => { this.failed = true; });
      this.el = el;
      return el;
    }

    start(owner) {
      if (!game || !owner) return;
      if (this.owner && this.owner !== owner) this.stop();
      this.owner = owner;
      this.wanted = true;
      if (save.sfx === false) {
        this.pause();
        return;
      }
      const el = this.ensure();
      if (!el || this.failed) return;
      if (!el.paused) return;
      const playPromise = el.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // 自动播放被拒时保持 wanted，下一次用户手势会重试。
        });
      }
    }

    stop(owner) {
      if (owner && this.owner && this.owner !== owner) return;
      this.wanted = false;
      this.owner = null;
      if (!this.el) return;
      try {
        this.el.pause();
        this.el.currentTime = 0;
      } catch (error) { /* ignore */ }
    }

    pause() {
      if (this.el && !this.el.paused) {
        try { this.el.pause(); } catch (error) { /* ignore */ }
      }
    }

    resume() {
      if (!this.wanted || save.sfx === false) return;
      const el = this.ensure();
      if (!el || this.failed || !el.paused) return;
      const playPromise = el.play();
      if (playPromise && typeof playPromise.catch === 'function') playPromise.catch(() => {});
    }

    setEnabled(enabled) {
      if (!enabled) {
        this.pause();
      } else if (this.wanted) {
        this.resume();
      }
    }
  }

  const bossMusic = new BossMusic();

  function unlockBossMusic() {
    if (state === S.PLAYING) bossMusic.resume();
  }

  /* =======================================================
     头像素材加载
     敌人固定使用 assets/enemy.png；玩家按当前装备皮肤读取
     assets/skins/*.png，非默认皮肤子弹读取 assets/bullets/*.png。
     旧版 player.png 仅保留兼容。路径以 game.js 的真实位置为
     基准解析，避免页面被部署到子目录或从不同入口打开时把
     assets 解析到错误位置。
     ======================================================= */
  const AVATAR_VERSION = '20261020-37';
  const BULLET_VERSION = '20261020-37';
  const koreanHorseTexture = new Image();
  koreanHorseTexture.decoding = 'async';
  koreanHorseTexture.src = 'assets/effects/korean-horse.jpg?v=' + AVATAR_VERSION;
  const brideWingsTexture = new Image();
  brideWingsTexture.decoding = 'async';
  brideWingsTexture.src = 'assets/effects/bride-wings.png?v=' + AVATAR_VERSION;

  const nunTextures = {};
  [
    ['demonSword', 'nun-demon-sword.png'],
    ['tentacle', 'nun-tentacle.png'],
    ['tentacleImpact', 'nun-tentacle-impact.png'],
    ['demonBullet', 'nun-demon-bullet.png'],
    ['fireSword', 'nun-fire-sword.png'],
    ['fireSlash', 'nun-fire-slash.png'],
    ['fireEnchanted', 'nun-fire-enchanted.png'],
    ['fireGreatsword', 'nun-fire-greatsword.png']
  ].forEach(function (entry) {
    const image = new Image();
    image.decoding = 'async';
    image.src = 'assets/effects/' + entry[1] + '?v=' + AVATAR_VERSION;
    nunTextures[entry[0]] = image;
  });

  const blackAdiaoTexture = new Image();
  blackAdiaoTexture.decoding = 'async';
  blackAdiaoTexture.src = 'assets/events/black-adiao.png?v=' + AVATAR_VERSION;

  const blackAdiaoWeaponTexture = new Image();
  blackAdiaoWeaponTexture.decoding = 'async';
  blackAdiaoWeaponTexture.src = 'assets/events/black-adiao-weapon.png?v=' + AVATAR_VERSION;

  function nunTextureReady(key) {
    const image = nunTextures[key];
    return !!(image && image.complete && image.naturalWidth > 0);
  }
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

  function buildBulletUrl(fileName, retry) {
    const url = new URL('assets/bullets/' + fileName, AVATAR_BASE_URL);
    url.searchParams.set('v', BULLET_VERSION);
    if (retry) url.searchParams.set('retry', String(retry));
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

  // 五款皮肤各自加载自己的图片；游戏内玩家始终从这里读取当前装备皮肤。
  const skinAvatars = {};
  SKINS.forEach(function (skin) {
    const type = 'skin_' + skin.id;
    avatarDebug[type] = {
      label: skin.name,
      file: 'assets/skins/' + skin.file,
      status: 'loading',
      url: '',
      attempts: 0,
      width: 0,
      height: 0,
      error: null
    };
    skinAvatars[skin.id] = createAvatarEntry(
      type,
      'skins/' + skin.file,
      skin.name.charAt(0),
      skin.fallbackColorA,
      skin.fallbackColorB
    );
  });

  avatarDebug.event_wuchaoyang = {
    label: '吴朝阳',
    file: 'assets/events/wuchaoyang-avatar.jpg',
    status: 'loading',
    url: '',
    attempts: 0,
    width: 0,
    height: 0,
    error: null
  };
  const eventAvatar = createAvatarEntry(
    'event_wuchaoyang',
    'events/wuchaoyang-avatar.jpg',
    '吴',
    '#4e3618',
    '#ffcf66'
  );

  function getSkinById(id) {
    return SKIN_BY_ID[id] || null;
  }

  function getEquippedSkin() {
    return getSkinById(save.equippedSkin) || SKINS[0];
  }

  function getEquippedAvatar() {
    const skin = getEquippedSkin();
    return skinAvatars[skin.id] || avatars.player;
  }

  const SKILL_SLOTS = ['q', 'e', 'r'];

  function getCurrentForm() {
    if (window.CharacterForms) {
      return CharacterForms.getBySkinId(save.equippedSkin) ||
        CharacterForms.getById(DEFAULT_SKIN_ID);
    }
    return { id: DEFAULT_SKIN_ID, skinId: DEFAULT_SKIN_ID, name: 'EDG', title: '', implemented: false, skills: null };
  }

  function getCurrentFormId() {
    return getCurrentForm().id;
  }

  function getFormSkill(slot, formId) {
    if (!window.CharacterForms) return null;
    const id = formId || getCurrentFormId();
    const form = CharacterForms.getById(id);
    if (form && form.id === 'nun') {
      const set = getNunSubform() === 'fire' ? form.fireSkills : form.skills;
      return set ? (set[slot] || null) : null;
    }
    return CharacterForms.getSkill(id, slot);
  }

  function createSkillState(formId, kills) {
    return {
      formId: formId || DEFAULT_SKIN_ID,
      nunForm: 'demon',
      nunSwing: 0,
      nunAttack: { phase: 'idle', time: 0, angle: 0, damage: 0, qActive: false, hit: false },
      nunCooldowns: {
        demon: { q: 0, e: 0 },
        fire: { q: 0, e: 0 }
      },
      q: {
        cooldown: 0,
        active: 0,
        phase: 'idle',
        elapsed: 0,
        armCount: 0,
        attackTimer: 0,
        swing: 0,
        nextArm: 0,
        removedSide: 0,
        aguhTimer: 0,
        invulnBase: 0,
        arms: [
          { side: -1, punch: 0, aimAngle: 0, broken: false },
          { side: 1, punch: 0, aimAngle: 0, broken: false }
        ]
      },
      e: {
        cooldown: 0,
        active: 0,
        dashing: false,
        invulnBase: 0,
        hitTimers: Object.create(null),
        trailTimer: 0
      },
      r: {
        baseKills: Math.max(0, Math.floor(Number(kills) || 0)),
        pendingShots: 0,
        shotIndex: 0,
        castFlash: 0,
        cooldown: 0,
        phase: 'idle',
        recordRemaining: 0,
        windowRemaining: 0,
        snapshot: null,
        charges: 0,
        killProgress: 0,
        ult: null,
        castLock: 0,
        active: 0,
        healTimer: 0,
        healTicks: 0,
        burnTimer: 0
      }
    };
  }

  function isEdgForm() {
    return !!game && game.player && game.player.formId === 'edg' &&
      !!window.CharacterForms && CharacterForms.hasSkills('edg');
  }

  function isKoreanForm() {
    return !!game && game.player && game.player.formId === 'korean' &&
      !!window.CharacterForms && CharacterForms.hasSkills('korean');
  }

  function isBrideForm() {
    return !!game && game.player && game.player.formId === 'bride' &&
      !!window.CharacterForms && CharacterForms.hasSkills('bride');
  }

  function isNunForm() {
    return !!game && game.player && game.player.formId === 'nun' &&
      !!window.CharacterForms && CharacterForms.hasSkills('nun');
  }

  function getNunSubform() {
    return game && game.player && game.player.skills
      ? (game.player.skills.nunForm || 'demon') : 'demon';
  }

  function isNunFireForm() {
    return isNunForm() && getNunSubform() === 'fire';
  }

  function getFormSkillSet(form) {
    if (!form) return null;
    if (form.id === 'nun') {
      return getNunSubform() === 'fire' && form.fireSkills
        ? form.fireSkills : form.skills;
    }
    return form.skills;
  }

  function isChampionForm() {
    return !!game && game.player && game.player.formId === 'edg2026' &&
      !!window.CharacterForms && CharacterForms.hasSkills('edg2026');
  }

  function isSkillActive(slot) {
    return !!game && game.player && game.player.skills &&
      game.player.skills[slot] && game.player.skills[slot].active > 0 &&
      !!window.CharacterForms &&
      CharacterForms.hasSkills(game.player.formId);
  }

  function isFreezeActive() {
    return isChampionForm() && isSkillActive('q');
  }

  function currentUltimateUsesSpace() {
    const form = getCurrentForm();
    const set = getFormSkillSet(form);
    return !!(form && form.implemented && set && set.r && set.r.code === 'Space');
  }

  function hasInfiniteAmmo() {
    return isEdgForm() && isSkillActive('q');
  }

  function getRCharge() {
    if (!isEdgForm() || !game.player.skills) return 0;
    const skill = getFormSkill('r', 'edg');
    if (!skill) return 0;
    return Math.min(skill.requiredKills, Math.max(0, game.kills - game.player.skills.r.baseKills));
  }

  function skinImageSrc(skin) {
    return buildAvatarUrl('skins/' + skin.file);
  }

  function eventPortraitSrc() {
    if (!WUCHAOYANG_EVENT) return '';
    return buildAvatarUrl('events/' + WUCHAOYANG_EVENT.portrait);
  }

  function getEquippedBulletFx() {
    const skin = getEquippedSkin();
    if (!skin || skin.id === DEFAULT_SKIN_ID) return null;
    const config = BULLET_FX[skin.id];
    const entry = bulletFxEntries[skin.id];
    if (!config || !entry || !entry.loaded) return null;
    return { id: skin.id, entry: entry, trail: config.trail };
  }

  // 四张子弹贴图只在启动时加载一次；绘制时直接复用 image，避免每帧创建图片。
  const bulletDebug = {};
  const bulletFxEntries = {};
  window.__bulletDebug = bulletDebug;

  function createBulletFxEntry(skinId, config) {
    const debug = {
      skinId: skinId,
      file: 'assets/bullets/' + config.file,
      status: 'loading',
      url: '',
      attempts: 0,
      width: 0,
      height: 0,
      error: null
    };
    bulletDebug[skinId] = debug;
    const entry = {
      image: new Image(),
      loaded: false,
      failed: false,
      attempts: 0,
      currentUrl: '',
      file: config.file
    };

    function applySource(retry) {
      entry.attempts += 1;
      debug.attempts = entry.attempts;
      entry.currentUrl = buildBulletUrl(config.file, retry);
      debug.url = entry.currentUrl;
      entry.image.src = entry.currentUrl;
    }

    entry.image.decoding = 'async';
    entry.image.loading = 'eager';
    entry.image.onload = function () {
      if (!entry.image.naturalWidth || !entry.image.naturalHeight) {
        entry.failed = true;
        debug.status = 'fallback';
        debug.error = '图片加载完成但尺寸为 0';
        return;
      }
      entry.loaded = true;
      entry.failed = false;
      debug.status = 'loaded';
      debug.width = entry.image.naturalWidth;
      debug.height = entry.image.naturalHeight;
      debug.error = null;
      console.info(
        '[BulletFX] ' + skinId + ' 子弹贴图加载成功',
        { url: entry.currentUrl, size: debug.width + '×' + debug.height, attempts: entry.attempts }
      );
    };
    entry.image.onerror = function () {
      if (entry.attempts < 2) {
        applySource(entry.attempts);
        return;
      }
      entry.loaded = false;
      entry.failed = true;
      debug.status = 'fallback';
      debug.error = new Error('图片请求失败: ' + entry.currentUrl);
      console.warn(
        '[BulletFX] ' + skinId + ' 子弹贴图加载失败，将回退到原子弹绘制',
        { url: entry.currentUrl, attempts: entry.attempts }
      );
    };

    applySource(0);
    return entry;
  }

  Object.keys(BULLET_FX).forEach(function (skinId) {
    bulletFxEntries[skinId] = createBulletFxEntry(skinId, BULLET_FX[skinId]);
  });

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
    rotateHint: $('rotateHint'),
    rotateLockBtn: $('rotateLockBtn'),
    rotateHintMsg: $('rotateHintMsg'),
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
    pauseSkillsBtn: $('pauseSkillsBtn'),
    skillIntroClose: $('skillIntroClose'),
    skillIntroBack: $('skillIntroBack'),
    skillIntroForm: $('skillIntroForm'),
    skillIntroGrid: $('skillIntroGrid'),
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
    victoryStage: $('victoryStage'),
    victoryKills: $('victoryKills'),
    victoryCoins: $('victoryCoins'),
    victoryTime: $('victoryTime'),
    victoryScore: $('victoryScore'),
    victoryBest: $('victoryBest'),
    victoryRecordBadge: $('victoryRecordBadge'),
    victoryRestartBtn: $('victoryRestartBtn'),
    victoryMenuBtn: $('victoryMenuBtn'),
    restartBtn: $('restartBtn'),
    gameOverMenuBtn: $('gameOverMenuBtn'),
    bestScore: $('bestScore'),
    bestTime: $('bestTime'),
    bestLevel: $('bestLevel'),
    totalKills: $('totalKills'),
    menuCoins: $('menuCoins'),
    menuSkinImage: $('menuSkinImage'),
    menuSkinName: $('menuSkinName'),
    menuShopBtn: $('menuShopBtn'),
    menuInventoryBtn: $('menuInventoryBtn'),
    shopCards: $('shopCards'),
    shopCoins: $('shopCoins'),
    shopBackBtn: $('shopBackBtn'),
    shopMessage: $('shopMessage'),
    inventoryCards: $('inventoryCards'),
    inventoryCoins: $('inventoryCoins'),
    inventoryCount: $('inventoryCount'),
    inventoryEquipped: $('inventoryEquipped'),
    inventoryBackBtn: $('inventoryBackBtn'),
    inventoryMessage: $('inventoryMessage'),
    pauseShopBtn: $('pauseShopBtn'),
    pauseStatsBtn: $('pauseStatsBtn'),
    statsPanel: $('statsPanel'),
    statsFormName: $('statsFormName'),
    statsFormTitle: $('statsFormTitle'),
    statsCloseBtn: $('statsCloseBtn'),
    skillBar: $('skillBar'),
    pauseInventoryBtn: $('pauseInventoryBtn'),
    eventScreen: $('eventScreen'),
    eventPanel: $('eventPanel'),
    eventPortraitFrame: $('eventPortraitFrame'),
    eventPortrait: $('eventPortrait'),
    eventHearts: $('eventHearts'),
    eventAffinityValue: $('eventAffinityValue'),
    eventAffinityFill: $('eventAffinityFill'),
    eventAffinityNote: $('eventAffinityNote'),
    eventName: $('eventName'),
    eventRole: $('eventRole'),
    eventText: $('eventText'),
    eventChoices: $('eventChoices'),
    eventFooter: $('eventFooter'),
    eventRewardTitle: $('eventRewardTitle'),
    eventRewardText: $('eventRewardText'),
    eventCoinReward: $('eventCoinReward'),
    eventCoinNote: $('eventCoinNote'),
    eventRewardCards: $('eventRewardCards'),
    eventRewardFooter: $('eventRewardFooter'),
    blackAdiaoVideoScreen: $('blackAdiaoVideoScreen'),
    blackAdiaoVideo: $('blackAdiaoVideo'),
    blackAdiaoSkipBtn: $('blackAdiaoSkipBtn'),
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
    skillIntro: $('skillIntroScreen'),
    gameover: $('gameOverScreen'),
    shop: $('shopScreen'),
    inventory: $('inventoryScreen'),
    event: $('eventScreen'),
    eventReward: $('eventRewardScreen'),
    blackAdiaoVideo: $('blackAdiaoVideoScreen'),
    victory: $('victoryScreen')
  };

  const view = {
    w: Math.max(320, window.innerWidth),
    h: Math.max(320, window.innerHeight),
    dpr: 1
  };

  let state = S.MENU;
  let game = null;
  let orientationPause = false;
  let lastFrameTime = performance.now();
  let activeStore = null;
  let storeReturn = null;
  let statsPanelOpen = false;
  let skillIntroOpen = false;
  let lastSkillBarRefresh = -1;
  let lastStatsPanelRefresh = -1;
  let skillSlots = [];
  let statsRows = {};
  let statsLabels = {};
  let skinActionLock = false;

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
    firePointerId: null,
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
      nextState === S.EVENT ||
      nextState === S.CUTSCENE ||
      nextState === S.DYING ||
      nextState === S.VICTORY
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

  function refreshWalletDisplays() {
    const text = formatNumber(save.coins);
    if (el.menuCoins) el.menuCoins.textContent = text;
    if (el.shopCoins) el.shopCoins.textContent = text;
    if (el.inventoryCoins) el.inventoryCoins.textContent = text;
  }

  function refreshMenuSkin() {
    const skin = getEquippedSkin();
    if (el.menuSkinImage) {
      el.menuSkinImage.src = skinImageSrc(skin);
      el.menuSkinImage.alt = '当前装备皮肤：' + skin.name;
    }
    if (el.menuSkinName) el.menuSkinName.textContent = skin.name;
    if (el.inventoryEquipped) el.inventoryEquipped.textContent = skin.name;
  }

  function updateMenuStats() {
    el.bestScore.textContent = formatNumber(save.highScore);
    el.bestTime.textContent = formatTime(save.maxTime);
    el.bestLevel.textContent = String(Math.max(1, save.maxLevel));
    el.totalKills.textContent = formatNumber(save.totalKills);
    refreshWalletDisplays();
    refreshMenuSkin();
  }

  function showStoreMessage(target, text, kind) {
    const element = target === 'inventory' ? el.inventoryMessage : el.shopMessage;
    if (!element) return;
    window.clearTimeout(element._hideTimer);
    element.textContent = text;
    element.className = 'store-message ' + (kind || 'info') + ' is-visible';
    element._hideTimer = window.setTimeout(function () {
      element.classList.remove('is-visible');
    }, 2800);
  }

  function bindSkinImageFallbacks(container) {
    if (!container) return;
    container.querySelectorAll('.skin-card-image').forEach(function (image) {
      function markFailed() {
        image.style.display = 'none';
        const portrait = image.closest('.skin-portrait');
        if (portrait) portrait.classList.add('image-failed');
      }
      if (image.complete && image.naturalWidth === 0) markFailed();
      image.addEventListener('error', markFailed, { once: true });
    });
  }

  function skinCardMarkup(skin, mode) {
    const owned = save.ownedSkins.indexOf(skin.id) !== -1;
    const equipped = save.equippedSkin === skin.id;
    const affordable = save.coins >= skin.price;
    const isShop = mode === 'shop';
    const priceText = skin.price === 0 ? '免费' : formatNumber(skin.price) + ' 金币';
    let statusText = '未拥有';
    let actionLabel = '购买';
    let action = 'buy';
    let buttonClass = 'skin-action-btn buy';
    let disabled = false;

    if (equipped) {
      statusText = '当前装备';
      actionLabel = '已装备';
      action = '';
      buttonClass = 'skin-action-btn is-equipped';
      disabled = true;
    } else if (owned) {
      statusText = '已拥有';
      actionLabel = '装备';
      action = 'equip';
      buttonClass = 'skin-action-btn equip';
    } else if (!affordable) {
      statusText = '未拥有';
      actionLabel = '金币不足';
      action = 'buy';
      buttonClass = 'skin-action-btn buy is-poor';
    }

    let badgeText = skin.badge || '';
    if (!isShop) badgeText = owned ? '已拥有' : '';
    const priceMarkup = isShop ? '<span class="skin-price">' + priceText + '</span>' : '';
    const cardClass = [
      'skin-card',
      equipped ? 'is-equipped' : '',
      owned ? 'is-owned' : '',
      !owned && !affordable ? 'is-poor' : ''
    ].filter(Boolean).join(' ');
    const equippedMark = equipped ? '<span class="skin-equipped-mark">当前装备</span>' : '';

    return (
      '<article class="' + cardClass + '" style="--skin-accent:' + skin.accent + '">' +
        '<div class="skin-portrait">' +
          '<span class="skin-fallback" aria-hidden="true">' + skin.name.charAt(0) + '</span>' +
          '<img class="skin-card-image" src="' + skinImageSrc(skin) + '" alt="' + skin.name + '皮肤图片" loading="lazy">' +
          (badgeText ? '<span class="skin-badge">' + badgeText + '</span>' : '') +
          equippedMark +
        '</div>' +
        '<div class="skin-info">' +
          '<h3 class="skin-name">' + skin.name + '</h3>' +
          '<p class="skin-desc">' + skin.desc + '</p>' +
          '<div class="skin-meta">' +
            '<span class="skin-state">' + statusText + '</span>' +
            priceMarkup +
          '</div>' +
          '<button class="' + buttonClass + '" type="button" data-skin-action="' + action + '" data-skin-id="' + skin.id + '"' +
            (disabled ? ' disabled' : '') + '>' + actionLabel + '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function renderShop() {
    if (!el.shopCards) return;
    refreshWalletDisplays();
    el.shopCards.innerHTML = SKINS.map(function (skin) {
      return skinCardMarkup(skin, 'shop');
    }).join('');
    bindSkinImageFallbacks(el.shopCards);
  }

  function renderInventory() {
    if (!el.inventoryCards) return;
    refreshWalletDisplays();
    const ownedSkins = SKINS.filter(function (skin) {
      return save.ownedSkins.indexOf(skin.id) !== -1;
    });
    const equipped = getEquippedSkin();
    if (el.inventoryCount) {
      el.inventoryCount.textContent = ownedSkins.length + ' / ' + SKINS.length;
    }
    if (el.inventoryEquipped) {
      el.inventoryEquipped.textContent = equipped.name;
    }
    el.inventoryCards.innerHTML = ownedSkins.map(function (skin) {
      return skinCardMarkup(skin, 'inventory');
    }).join('');
    bindSkinImageFallbacks(el.inventoryCards);
  }

  function purchaseSkin(skinId) {
    if (skinActionLock) return;
    const skin = getSkinById(skinId);
    if (!skin) return;
    if (save.ownedSkins.indexOf(skin.id) !== -1) {
      showStoreMessage('shop', '你已经拥有「' + skin.name + '」，可以直接装备。', 'info');
      renderShop();
      return;
    }
    if (save.coins < skin.price) {
      const missing = skin.price - save.coins;
      showStoreMessage('shop', '金币不足，还差 ' + formatNumber(missing) + ' 金币。完成关卡可以获得金币。', 'error');
      audio.play('denied');
      return;
    }

    skinActionLock = true;
    save.coins -= skin.price;
    save.ownedSkins.push(skin.id);
    persistSave();
    refreshWalletDisplays();
    refreshMenuSkin();
    renderShop();
    renderInventory();
    showStoreMessage('shop', '购买成功：' + skin.name + ' 已放入仓库。当前装备不会被自动替换。', 'success');
    audio.play('purchase');
    window.setTimeout(function () {
      skinActionLock = false;
    }, 300);
  }

  function equipSkin(skinId) {
    const skin = getSkinById(skinId);
    if (!skin) return;
    if (save.ownedSkins.indexOf(skin.id) === -1) {
      showStoreMessage(activeStore === 'inventory' ? 'inventory' : 'shop', '尚未拥有「' + skin.name + '」，无法装备。', 'error');
      audio.play('denied');
      return;
    }
    if (save.equippedSkin === skin.id) {
      showStoreMessage(activeStore === 'inventory' ? 'inventory' : 'shop', '「' + skin.name + '」已经是当前装备。', 'info');
      return;
    }
    save.equippedSkin = skin.id;
    persistSave();
    if (game) {
      syncPlayerForm();
      refreshSkillBar(true);
      refreshStatsPanel();
    }
    refreshMenuSkin();
    refreshWalletDisplays();
    renderShop();
    renderInventory();
    showStoreMessage(activeStore === 'inventory' ? 'inventory' : 'shop', '已装备：' + skin.name + '。进入游戏后会使用这款皮肤。', 'success');
    audio.play('equip');
  }

  function handleSkinAction(event) {
    const button = event.target.closest('[data-skin-action]');
    if (!button) return;
    const action = button.getAttribute('data-skin-action');
    const skinId = button.getAttribute('data-skin-id');
    if (action === 'buy') purchaseSkin(skinId);
    if (action === 'equip') equipSkin(skinId);
  }

  function openStore(kind, returnTo) {
    if (!screens[kind]) return;
    if (state === S.PLAYING) {
      pauseGame();
      returnTo = 'pause';
    }
    if (state !== S.MENU && state !== S.PAUSED) return;

    activeStore = kind;
    storeReturn = returnTo || (state === S.PAUSED ? 'pause' : 'menu');
    hideScreens();
    showScreen(kind);
    refreshWalletDisplays();
    refreshMenuSkin();
    if (kind === 'shop') {
      renderShop();
      if (el.shopMessage) {
        el.shopMessage.textContent = '';
        el.shopMessage.className = 'store-message';
      }
      if (el.shopBackBtn) el.shopBackBtn.focus({ preventScroll: true });
    } else {
      renderInventory();
      if (el.inventoryMessage) {
        el.inventoryMessage.textContent = '';
        el.inventoryMessage.className = 'store-message';
      }
      if (el.inventoryBackBtn) el.inventoryBackBtn.focus({ preventScroll: true });
    }
    audio.play('ui');
  }

  function closeStore() {
    if (!activeStore) return;
    const back = storeReturn;
    activeStore = null;
    storeReturn = null;
    hideScreens();
    if (back === 'pause' && state === S.PAUSED && game) {
      showScreen('pause');
      el.resumeBtn.focus({ preventScroll: true });
    } else {
      if (state !== S.MENU) {
        state = S.MENU;
        setState(S.MENU);
      }
      showScreen('menu');
      updateMenuStats();
      if (el.menuShopBtn) el.menuShopBtn.focus({ preventScroll: true });
    }
    audio.play('ui');
  }

  /* =======================================================
     随机事件 UI / 流程
     ======================================================= */
  let eventPhaseTimer = 0;
  let eventHeartTimer = 0;

  function clearEventTimers() {
    window.clearTimeout(eventPhaseTimer);
    window.clearTimeout(eventHeartTimer);
    eventPhaseTimer = 0;
    eventHeartTimer = 0;
  }

  function updateEventAffinityDisplay() {
    const max = WUCHAOYANG_EVENT ? WUCHAOYANG_EVENT.affinity.max : 100;
    const value = clamp(Number(save.wuchaoyangAffinity) || 0, 0, max);
    if (el.eventAffinityValue) el.eventAffinityValue.textContent = value + ' / ' + max;
    if (el.eventAffinityFill) el.eventAffinityFill.style.width = (value / max * 100) + '%';
    if (el.eventAffinityNote) {
      const unlocked = !!save.wuchaoyangCompanionUnlocked;
      el.eventAffinityNote.textContent = unlocked ? '随行伙伴：已解锁' : '随行伙伴：未解锁';
      el.eventAffinityNote.classList.toggle('is-unlocked', unlocked);
    }
  }

  function setEventSpeaker(name, role) {
    if (el.eventName) el.eventName.textContent = name;
    if (el.eventRole) el.eventRole.textContent = role || '';
  }

  function setEventText(text, highlight) {
    if (!el.eventText) return;
    el.eventText.textContent = text || '';
    el.eventText.classList.toggle('is-highlight', !!highlight);
  }

  function setEventPortrait(event) {
    if (!el.eventPortrait || !event) return;
    const frame = el.eventPortraitFrame;
    if (frame) frame.classList.remove('is-fallback');
    el.eventPortrait.onload = function () {
      if (el.eventPortraitFrame) el.eventPortraitFrame.classList.remove('is-fallback');
    };
    el.eventPortrait.onerror = function () {
      if (el.eventPortraitFrame) el.eventPortraitFrame.classList.add('is-fallback');
    };
    el.eventPortrait.alt = event.personName + '立绘';
    el.eventPortrait.src = buildAvatarUrl('events/' + event.portrait);
  }

  function createEventChoice(options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'event-choice ' + (options.className || '');
    const icon = document.createElement('span');
    icon.className = 'event-choice-icon';
    icon.textContent = options.icon || '›';
    const copy = document.createElement('span');
    copy.className = 'event-choice-copy';
    const label = document.createElement('strong');
    label.textContent = options.label;
    const hint = document.createElement('small');
    hint.textContent = options.hint || '';
    copy.appendChild(label);
    if (options.hint) copy.appendChild(hint);
    button.appendChild(icon);
    button.appendChild(copy);
    button.addEventListener('click', options.onClick);
    return button;
  }

  function showEventContinue(label, handler, hintText) {
    if (!el.eventFooter) return;
    el.eventFooter.innerHTML = '';
    if (hintText) {
      const hint = document.createElement('span');
      hint.className = 'event-hint';
      hint.textContent = hintText;
      el.eventFooter.appendChild(hint);
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary event-continue';
    button.textContent = label;
    button.addEventListener('click', handler);
    el.eventFooter.appendChild(button);
  }

  function spawnEventHearts() {
    if (!el.eventHearts) return;
    el.eventHearts.innerHTML = '';
    for (let i = 0; i < 18; i += 1) {
      const heart = document.createElement('span');
      heart.className = 'event-heart';
      heart.textContent = '♥';
      const x = rand(-90, 90);
      heart.style.setProperty('--heart-x', x.toFixed(0) + 'px');
      heart.style.setProperty('--heart-x-end', (x * 0.45 + rand(-20, 20)).toFixed(0) + 'px');
      heart.style.setProperty('--heart-delay', rand(0, 0.75).toFixed(2) + 's');
      heart.style.setProperty('--heart-duration', rand(1.9, 2.8).toFixed(2) + 's');
      heart.style.setProperty('--heart-size', rand(12, 26).toFixed(0) + 'px');
      heart.style.setProperty('--heart-color', Math.random() < 0.5 ? '#ff8fb0' : '#ffcf66');
      el.eventHearts.appendChild(heart);
    }
    window.clearTimeout(eventHeartTimer);
    eventHeartTimer = window.setTimeout(function () {
      if (el.eventHearts) el.eventHearts.innerHTML = '';
    }, 3600);
  }

  function renderEventIntro(event) {
    if (!game || !event) return;
    game.randomEvent.phase = 'intro';
    setEventSpeaker(event.personName, event.intro.role);
    setEventText(event.intro.text, false);
    updateEventAffinityDisplay();
    el.eventChoices.innerHTML = '';
    el.eventFooter.innerHTML = '';
    el.eventChoices.appendChild(createEventChoice({
      icon: '⚔',
      label: event.choices.fight.label,
      hint: event.choices.fight.hint,
      className: 'danger',
      onClick: function () { startEventBoss(event); }
    }));
    el.eventChoices.appendChild(createEventChoice({
      icon: '…',
      label: event.choices.talk.label,
      hint: event.choices.talk.hint,
      className: 'calm',
      onClick: function () { renderEventQuestion(event); }
    }));
  }

  function renderEventQuestion(event) {
    if (!game || !event) return;
    game.randomEvent.phase = 'question';
    setEventSpeaker(event.personName, '他抛出了一个问题');
    setEventText(event.question.text, true);
    updateEventAffinityDisplay();
    el.eventChoices.innerHTML = '';
    el.eventFooter.innerHTML = '';
    const classes = ['option-a', 'option-b', 'option-c'];
    event.question.options.forEach(function (option, index) {
      el.eventChoices.appendChild(createEventChoice({
        icon: option.label.charAt(0),
        label: option.label.slice(2).trim(),
        hint: '',
        className: classes[index] || '',
        onClick: function () { chooseTalkAnswer(option.id); }
      }));
    });
    audio.play('ui');
  }

  function chooseTalkAnswer(answer) {
    if (!game || game.randomEvent.phase !== 'question') return;
    if (answer === 'shoot') handleAffectionResponse();
    else handleHostileResponse();
  }

  function handleAffectionResponse() {
    if (!game || !WUCHAOYANG_EVENT || game.randomEvent.phase !== 'question') return;
    game.randomEvent.phase = 'affection';
    save.wuchaoyangAffinity = clamp(
      (Number(save.wuchaoyangAffinity) || 0) + WUCHAOYANG_EVENT.affinity.gain,
      0,
      WUCHAOYANG_EVENT.affinity.max
    );
    save.wuchaoyangCompanionUnlocked = true;
    game.companionRecruitedThisRun = true;
    persistSave();
    updateEventAffinityDisplay();
    el.eventScreen.classList.remove('is-hostile');
    el.eventScreen.classList.add('is-affection');
    setEventText(WUCHAOYANG_EVENT.responses.shoot, true);
    el.eventChoices.innerHTML = '';
    el.eventFooter.innerHTML = '';
    spawnEventHearts();
    audio.play('heart');
    window.clearTimeout(eventPhaseTimer);
    eventPhaseTimer = window.setTimeout(function () {
      if (!game || game.randomEvent.phase !== 'affection') return;
      game.randomEvent.phase = 'companion-confirm';
      setEventText(
        WUCHAOYANG_EVENT.responses.shoot + '\n\n' + WUCHAOYANG_EVENT.responses.companion,
        true
      );
      showEventContinue('继续', function () {
        ensureCompanion();
        finishRandomEvent('companion');
      }, '好感度 +100 / 100 · 已解锁随行伙伴');
      audio.play('ui');
    }, 1600);
  }

  function handleHostileResponse() {
    if (!game || !WUCHAOYANG_EVENT || game.randomEvent.phase !== 'question') return;
    game.randomEvent.phase = 'hostile';
    el.eventScreen.classList.remove('is-affection');
    el.eventScreen.classList.add('is-hostile');
    setEventText(WUCHAOYANG_EVENT.responses.hostile, false);
    el.eventChoices.innerHTML = '';
    el.eventFooter.innerHTML = '<span class="event-hint">敌对状态 · 战斗即将开始</span>';
    audio.play('hostile');
    window.clearTimeout(eventPhaseTimer);
    eventPhaseTimer = window.setTimeout(function () {
      if (!game || game.randomEvent.phase !== 'hostile') return;
      startEventBoss(WUCHAOYANG_EVENT);
    }, 1550);
  }

  function openRandomEvent(event) {
    if (!game || !event || state !== S.PLAYING) return;
    game.randomEvent.id = event.id;
    game.randomEvent.triggered = true;
    game.randomEvent.active = true;
    game.randomEvent.phase = 'intro';
    game.randomEvent.bossRewardGranted = false;
    game.randomEvent.rewardChoice = null;
    game.coinReward = null;
    game.banner = null;
    clearEventTimers();
    setState(S.EVENT);
    clearInput();
    hideScreens();
    showScreen('event');
    el.eventScreen.classList.remove('is-hostile', 'is-affection');
    el.eventHearts.innerHTML = '';
    if (el.eventPanel) el.eventPanel.classList.toggle('is-shenlin', event.id === 'shen-lin');
    const eyebrow = el.eventScreen.querySelector('.event-topline .eyebrow');
    const stamp = el.eventScreen.querySelector('.event-portrait-stamp');
    if (eyebrow) {
      eyebrow.textContent = event.id === 'shen-lin'
        ? 'RANDOM EVENT · 第八关'
        : 'RANDOM EVENT · 第三关之后';
    }
    if (stamp) stamp.textContent = event.id === 'shen-lin' ? 'EVENT 02' : 'EVENT 01';
    const fallback = el.eventScreen.querySelector('.event-portrait-fallback');
    if (fallback) fallback.textContent = event.id === 'shen-lin' ? '霍' : '吴';
    setEventPortrait(event);
    if (event.id === 'shen-lin') renderShenlinIntro(event);
    else renderEventIntro(event);
    audio.play('event');
    lastFrameTime = performance.now();
  }

  function ensureCompanion() {
    if (!game || game.mode !== 'stage' || game.player.dead) return;
    // 永久解锁只代表历史剧情进度，不能直接召唤；本局必须在事件中重新招募。
    if (!game.companionRecruitedThisRun) return;
    if (!game.companion) game.companion = createCompanion(game.player);
  }

  function startEventBoss(event) {
    if (!game || !event || game.eventBossActive) return;
    clearEventTimers();
    if (el.eventScreen) el.eventScreen.classList.remove('is-hostile', 'is-affection');
    game.randomEvent.phase = 'boss';
    game.enemies = [];
    game.boss = null;
    game.bossActive = false;
    game.enemyBullets = [];
    game.bullets = [];
    game.companionBullets = [];
    game.eventBoss = createEventBoss(event);
    game.eventBossActive = true;
    bossMusic.start('event:' + event.id);
    game.eventBossDefeated = false;
    game.eventBossDelayed = [];
    game.eventBossSpiral = null;
    game.stageState = 'fighting';
    game.spawnTimer = 1.2;
    game.player.invuln = Math.max(game.player.invuln, 1.8);
    game.banner = null;
    game.coinReward = null;
    hideScreens();
    setState(S.PLAYING);
    clearInput();
    addShake(16);
    audio.play('boss_warn');
    lastFrameTime = performance.now();
  }

  function finishRandomEvent(reason) {
    if (!game || !game.randomEvent.active) return;
    const wasBoss = !!game.eventBossActive;
    if (game.shenlin) stopShenlinChallenge();
    clearEventTimers();
    if (randomEventManager) randomEventManager.finish();
    game.randomEvent.active = false;
    game.randomEvent.phase = 'done';
    game.eventBossActive = false;
    bossMusic.stop();
    game.eventBoss = null;
    game.eventBossDelayed = [];
    game.eventBossSpiral = null;
    game.enemyBullets = [];
    game.companionBullets = [];
    game.eventReward = null;
    if (el.eventScreen) el.eventScreen.classList.remove('is-hostile', 'is-affection');
    hideScreens();
    clearInput();
    setState(S.PLAYING);
    game.player.invuln = Math.max(game.player.invuln, 1.3);
    // 神临挑战会把 spawnTimer 设为 9999 来暂停普通刷怪；事件结束时必须恢复，
    // 不能继续用 max() 保留这个暂停值。
    game.spawnTimer = 1.0;
    if (game.mode === 'stage') {
      game.stageState = 'fighting';
      setBanner(
        '第 ' + game.stage + ' 关继续',
        '目标：击败 ' + game.stageTarget + ' 名追兵' + (isStageBossStage(game.stage) ? ' · 本关有 BOSS' : ''),
        'stage',
        2.4
      );
    }
    if (wasBoss) {
      addToast('事件战斗结束 · 关卡继续', 'good', 2.4);
    }
    audio.play('stage');
    lastFrameTime = performance.now();
  }

  const SHENLIN_CONFIG = {
    duration: 12,
    maxLasers: 28,
    maxBullets: 260,
    laserDamage: 14,
    bulletDamage: 8,
    warn: 0.8
  };

  // 攻击窗口刻意重叠，形成多层压力；每个窗口仍保留可移动的安全间隙。
  const SHENLIN_SCHEDULE = [
    { at: 0.10, type: 'cross', count: 4, warn: 0.82, active: 0.28, width: 16, damage: 14 },
    { at: 1.15, type: 'grid', warn: 0.65, active: 0.28, width: 14, damage: 14 },
    { at: 2.05, type: 'burst', count: 26, warn: 0.58, speed: 120, damage: 8, radius: 250 },
    { at: 2.85, type: 'fanVolley', count: 20, warn: 0.54, speed: 150, damage: 8, spread: 1.15 },
    { at: 3.65, type: 'grid', warn: 0.55, active: 0.26, width: 16, damage: 15 },
    { at: 4.35, type: 'doubleRing', count: 22, warn: 0.5, speed: 135, damage: 8 },
    { at: 5.05, type: 'track', count: 4, warn: 0.7, active: 0.25, width: 16, damage: 15 },
    { at: 5.95, type: 'fanVolley', count: 24, warn: 0.45, speed: 165, damage: 9, spread: 1.35 },
    { at: 6.65, type: 'sweepGrid', warn: 0.5, active: 0.26, width: 18, damage: 16 },
    { at: 7.35, type: 'burst', count: 30, warn: 0.42, speed: 155, damage: 9, radius: 280 },
    { at: 8.05, type: 'cross', count: 5, warn: 0.58, active: 0.24, width: 18, damage: 16 },
    { at: 8.75, type: 'doubleRing', count: 26, warn: 0.4, speed: 160, damage: 9 },
    { at: 9.45, type: 'grid', warn: 0.44, active: 0.24, width: 18, damage: 17 },
    { at: 10.15, type: 'fanVolley', count: 28, warn: 0.38, speed: 180, damage: 9, spread: 1.55 },
    { at: 10.85, type: 'cross', count: 5, warn: 0.36, active: 0.2, width: 20, damage: 17 }
  ];

  function shenlinLaserThrough(x, y, angle, width, warn, active, damage) {
    if (!game || !game.shenlin) return;
    const s = game.shenlin;
    if (s.lasers.length >= SHENLIN_CONFIG.maxLasers) s.lasers.shift();
    const length = 1500;
    s.lasers.push({
      x1: x - Math.cos(angle) * length * 0.5,
      y1: y - Math.sin(angle) * length * 0.5,
      x2: x + Math.cos(angle) * length * 0.5,
      y2: y + Math.sin(angle) * length * 0.5,
      width: width,
      phase: 'warn',
      time: warn,
      maxTime: warn,
      activeTime: active,
      activeTotal: active,
      damage: damage,
      hit: false
    });
  }

  function shenlinBurst(x, y, count, speed, damage, warn, kind, spread, fixedAngle) {
    if (!game || !game.shenlin) return;
    game.shenlin.warnings.push({
      type: kind || 'ring',
      x: x,
      y: y,
      count: count,
      speed: speed,
      damage: damage,
      spread: spread || 0,
      time: warn,
      maxTime: warn,
      baseAngle: fixedAngle !== undefined
        ? fixedAngle
        : (kind === 'fan'
          ? Math.atan2(game.player.y - y, game.player.x - x)
          : rand(0, TAU))
    });
  }

  function spawnShenlinPattern(pattern) {
    if (!game || !game.shenlin) return;
    const p = game.player;
    const s = game.shenlin;
    if (pattern.type === 'cross') {
      const base = rand(0, TAU);
      for (let i = 0; i < pattern.count; i += 1) {
        shenlinLaserThrough(p.x, p.y, base + (i / pattern.count) * Math.PI, pattern.width, pattern.warn, pattern.active, pattern.damage);
      }
    } else if (pattern.type === 'sweep') {
      shenlinLaserThrough(p.x - 80, p.y - 95, 0, pattern.width, pattern.warn, pattern.active, pattern.damage);
      shenlinLaserThrough(p.x + 70, p.y + 95, 0, pattern.width, pattern.warn, pattern.active, pattern.damage);
      shenlinLaserThrough(p.x - 170, p.y, Math.PI * 0.5, pattern.width * 0.8, pattern.warn + 0.1, pattern.active, pattern.damage - 2);
    } else if (pattern.type === 'grid') {
      const ys = [-150, -55, 60, 155];
      const xs = [-170, 0, 175];
      for (let i = 0; i < ys.length; i += 1) {
        shenlinLaserThrough(p.x, p.y + ys[i], 0, pattern.width, pattern.warn, pattern.active, pattern.damage);
      }
      for (let i = 0; i < xs.length; i += 1) {
        shenlinLaserThrough(p.x + xs[i], p.y, Math.PI * 0.5, pattern.width, pattern.warn + 0.08, pattern.active, pattern.damage);
      }
    } else if (pattern.type === 'sweepGrid') {
      shenlinLaserThrough(p.x, p.y - 125, 0, pattern.width, pattern.warn, pattern.active, pattern.damage);
      shenlinLaserThrough(p.x, p.y + 125, 0, pattern.width, pattern.warn + 0.08, pattern.active, pattern.damage);
      shenlinLaserThrough(p.x - 135, p.y, Math.PI * 0.5, pattern.width, pattern.warn + 0.16, pattern.active, pattern.damage);
      shenlinLaserThrough(p.x + 135, p.y, Math.PI * 0.5, pattern.width, pattern.warn + 0.24, pattern.active, pattern.damage);
    } else if (pattern.type === 'doubleRing') {
      const angle = rand(0, TAU);
      const cx = p.x + Math.cos(angle) * 230;
      const cy = p.y + Math.sin(angle) * 230;
      const base = rand(0, TAU);
      shenlinBurst(cx, cy, pattern.count, pattern.speed, pattern.damage, pattern.warn, 'ring', 0, base);
      shenlinBurst(cx, cy, Math.max(12, pattern.count - 4), pattern.speed * 1.28, pattern.damage, pattern.warn + 0.12, 'ring', 0, base + Math.PI / Math.max(12, pattern.count));
    } else if (pattern.type === 'fanVolley') {
      shenlinBurst(p.x + rand(-70, 70), p.y - 250, pattern.count, pattern.speed, pattern.damage, pattern.warn, 'fan', pattern.spread);
      shenlinBurst(p.x + rand(-70, 70), p.y + 250, Math.max(12, pattern.count - 4), pattern.speed * 1.12, pattern.damage, pattern.warn + 0.12, 'fan', pattern.spread * 0.9);
    } else if (pattern.type === 'track') {
      const points = [
        { x: p.x + rand(-120, 120), y: p.y + rand(-120, 120) },
        { x: p.x + rand(-120, 120), y: p.y + rand(-120, 120) },
        { x: p.x + rand(-120, 120), y: p.y + rand(-120, 120) }
      ];
      for (let i = 0; i < points.length; i += 1) {
        shenlinLaserThrough(points[i].x, points[i].y, rand(0, Math.PI), pattern.width, pattern.warn, pattern.active, pattern.damage);
      }
    } else if (pattern.type === 'burst') {
      const angle = rand(0, TAU);
      const dist = pattern.radius || 260;
      shenlinBurst(p.x + Math.cos(angle) * dist, p.y + Math.sin(angle) * dist, pattern.count, pattern.speed, pattern.damage, pattern.warn, 'ring');
    } else if (pattern.type === 'fan') {
      shenlinBurst(p.x + rand(-100, 100), p.y - 250, pattern.count, pattern.speed, pattern.damage, pattern.warn, 'fan', pattern.spread);
    } else if (pattern.type === 'combo') {
      const base = rand(0, TAU);
      for (let i = 0; i < pattern.count; i += 1) {
        shenlinLaserThrough(p.x, p.y, base + (i / pattern.count) * Math.PI, pattern.width, pattern.warn, pattern.active, pattern.damage);
      }
      shenlinBurst(p.x, p.y, 14, 110, 8, pattern.warn + 0.05, 'ring');
    }
  }

  function spawnShenlinBullet(x, y, angle, speed, damage) {
    if (!game || !game.shenlin) return;
    const s = game.shenlin;
    if (s.bullets.length >= SHENLIN_CONFIG.maxBullets) s.bullets.shift();
    s.bullets.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 8,
      damage: damage,
      life: 6,
      dead: false
    });
  }

  function startShenlinChallenge() {
    if (!game || game.player.dead) return;
    const event = SHENLIN_EVENT;
    if (!event) return;
    clearEventTimers();
    hideScreens();
    setState(S.PLAYING);
    clearInput();
    game.randomEvent.phase = 'shenlin-fight';
    game.enemies = [];
    game.boss = null;
    game.bossActive = false;
    game.enemyBullets = [];
    game.bullets = [];
    game.spawnTimer = 9999;
    game.stageState = 'event';
    game.tutorial = 0;
    game.player.invuln = Math.max(game.player.invuln, 0.8);
    game.shenlin = {
      active: true,
      elapsed: 0,
      time: SHENLIN_CONFIG.duration,
      scheduleIndex: 0,
      lasers: [],
      warnings: [],
      bullets: [],
      hitCount: 0
    };
    bossMusic.start('shenlin');
    game.banner = null;
    addToast('神临 · 撑过 12 秒', 'warn', 2.0);
    audio.play('boss_warn');
    lastFrameTime = performance.now();
  }

  function stopShenlinChallenge() {
    if (!game || !game.shenlin) return;
    game.shenlin.active = false;
    game.shenlin.lasers = [];
    game.shenlin.warnings = [];
    game.shenlin.bullets = [];
    game.shenlin = null;
    bossMusic.stop('shenlin');
  }

  function updateShenlinChallenge(dt) {
    if (!game || !game.shenlin || !game.shenlin.active) return;
    const s = game.shenlin;
    const p = game.player;
    if (p.dead) return;
    s.elapsed += dt;
    s.time = Math.max(0, SHENLIN_CONFIG.duration - s.elapsed);
    while (s.scheduleIndex < SHENLIN_SCHEDULE.length &&
           s.elapsed >= SHENLIN_SCHEDULE[s.scheduleIndex].at) {
      spawnShenlinPattern(SHENLIN_SCHEDULE[s.scheduleIndex]);
      s.scheduleIndex += 1;
    }

    for (let i = s.warnings.length - 1; i >= 0; i -= 1) {
      const warning = s.warnings[i];
      warning.time -= dt;
      if (warning.time > 0) continue;
      if (warning.type === 'ring') {
        for (let k = 0; k < warning.count; k += 1) {
          spawnShenlinBullet(warning.x, warning.y, warning.baseAngle + (k / warning.count) * TAU, warning.speed, warning.damage);
        }
      } else {
        for (let k = 0; k < warning.count; k += 1) {
          const angle = warning.baseAngle - warning.spread * 0.5 + (k / Math.max(1, warning.count - 1)) * warning.spread;
          spawnShenlinBullet(warning.x, warning.y, angle, warning.speed, warning.damage);
        }
      }
      s.warnings.splice(i, 1);
    }

    for (let i = s.lasers.length - 1; i >= 0; i -= 1) {
      const laser = s.lasers[i];
      laser.time -= dt;
      if (laser.phase === 'warn') {
        if (laser.time <= 0) {
          laser.phase = 'active';
          laser.time = laser.activeTime;
        }
        continue;
      }
      if (!laser.hit && !p.dead &&
          segmentCircleHit(laser.x1, laser.y1, laser.x2, laser.y2, p.x, p.y, laser.width * 0.5 + p.r)) {
        laser.hit = true;
        s.hitCount += 1;
        damagePlayer(laser.damage, p.x, p.y);
        if (p.dead) return;
      }
      if (laser.time <= 0) s.lasers.splice(i, 1);
    }

    for (let i = s.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = s.bullets[i];
      bullet.life -= dt;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.life <= 0 || bullet.x < 0 || bullet.x > MAP.w || bullet.y < 0 || bullet.y > MAP.h) {
        s.bullets.splice(i, 1);
        continue;
      }
      if (!p.dead && Math.hypot(bullet.x - p.x, bullet.y - p.y) <= p.r + bullet.radius) {
        s.bullets.splice(i, 1);
        s.hitCount += 1;
        damagePlayer(bullet.damage, bullet.x, bullet.y);
        if (p.dead) return;
      }
    }

    if (s.elapsed >= SHENLIN_CONFIG.duration && !p.dead) {
      stopShenlinChallenge();
      showShenlinSuccess();
    }
  }

  function renderShenlinIntro(event) {
    if (!game || !event) return;
    game.randomEvent.phase = 'shenlin-intro';
    setEventSpeaker(event.personName, event.intro.role);
    setEventText(event.intro.text, true);
    el.eventChoices.innerHTML = '';
    el.eventFooter.innerHTML = '';
    el.eventChoices.appendChild(createEventChoice({
      icon: 'A',
      label: event.choices.accept.label,
      hint: event.choices.accept.hint,
      className: 'danger',
      onClick: function () { renderShenlinRules(event); }
    }));
    el.eventChoices.appendChild(createEventChoice({
      icon: 'B',
      label: event.choices.leave.label,
      hint: event.choices.leave.hint,
      className: 'calm',
      onClick: function () {
        if (!game || game.randomEvent.phase !== 'shenlin-intro') return;
        finishRandomEvent('shenlin-decline');
      }
    }));
  }

  function renderShenlinRules(event) {
    if (!game || !event) return;
    game.randomEvent.phase = 'shenlin-rules';
    setEventSpeaker(event.personName, '挑战规则');
    setEventText('“在我的激光雨下撑过12秒，你就能获得资格。”', true);
    el.eventChoices.innerHTML = '';
    el.eventFooter.innerHTML = '';
    showEventContinue('开始挑战', function () {
      if (!game || game.randomEvent.phase !== 'shenlin-rules') return;
      startShenlinChallenge();
    }, '12 秒 · 白色丝线预警后才会发射');
    audio.play('ui');
  }

  function showShenlinSuccess() {
    if (!game || !SHENLIN_EVENT) return;
    game.randomEvent.phase = 'shenlin-success';
    setState(S.EVENT);
    clearInput();
    hideScreens();
    showScreen('event');
    if (el.eventPanel) el.eventPanel.classList.add('is-shenlin');
    setEventSpeaker(SHENLIN_EVENT.personName, '考验通过');
    setEventText('“孩子，你已经通过了考验，获得了资格。这把武器现在属于你。”', true);
    el.eventChoices.innerHTML = '';
    el.eventFooter.innerHTML = '';
    showEventContinue('领取神罚激光', function () {
      if (!game || game.randomEvent.phase !== 'shenlin-success') return;
      grantShenlinLaser();
      finishRandomEvent('shenlin-success');
    }, '神罚激光 · 单发 60 / 每秒 4 次 / 无需换弹');
    audio.play('event_victory');
    lastFrameTime = performance.now();
  }

  function grantShenlinLaser() {
    if (!game || !game.player) return;
    const p = game.player;
    // 仅写入当前对局的玩家武器状态，不写入持久存档。
    p.unlocked.laser = true;
    p.ammo.laser = 0;
    p.weapon = 'laser';
    p.shootCd = 0;
    p.reloading = false;
    addToast('神罚激光已解锁 · 已装备', 'good', 2.4);
    refreshSkillBar(true);
    refreshStatsPanel(true);
  }

  function drawShenlinHazards() {
    if (!game || !game.shenlin || !game.shenlin.active) return;
    const s = game.shenlin;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < s.lasers.length; i += 1) {
      const laser = s.lasers[i];
      if (laser.phase === 'warn') {
        ctx.globalAlpha = 0.55 + Math.sin(performance.now() * 0.018) * 0.25;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = Math.max(1.5, laser.width * 0.18);
        ctx.setLineDash([9, 7]);
        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.16;
        ctx.lineWidth = laser.width;
        ctx.stroke();
      } else {
        const pulse = 0.75 + Math.sin(performance.now() * 0.03) * 0.15;
        ctx.globalAlpha = 0.28 * pulse;
        ctx.strokeStyle = '#8feaff';
        ctx.lineWidth = laser.width + 16;
        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.stroke();
        ctx.globalAlpha = 0.95;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = laser.width;
        ctx.stroke();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#d8f7ff';
        ctx.lineWidth = Math.max(2, laser.width * 0.22);
        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.stroke();
      }
    }

    for (let i = 0; i < s.warnings.length; i += 1) {
      const warning = s.warnings[i];
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.02) * 0.25;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      if (warning.type === 'fan') {
        const spread = warning.spread || 1;
        ctx.arc(warning.x, warning.y, 300, warning.baseAngle - spread * 0.5, warning.baseAngle + spread * 0.5);
        for (let k = 0; k <= 4; k += 1) {
          const a = warning.baseAngle - spread * 0.5 + (k / 4) * spread;
          ctx.moveTo(warning.x, warning.y);
          ctx.lineTo(warning.x + Math.cos(a) * 560, warning.y + Math.sin(a) * 560);
        }
      } else {
        ctx.arc(warning.x, warning.y, 76, 0, TAU);
        for (let k = 0; k < 8; k += 1) {
          const a = warning.baseAngle + (k / 8) * TAU;
          ctx.moveTo(warning.x + Math.cos(a) * 22, warning.y + Math.sin(a) * 22);
          ctx.lineTo(warning.x + Math.cos(a) * 74, warning.y + Math.sin(a) * 74);
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    for (let i = 0; i < s.bullets.length; i += 1) {
      const bullet = s.bullets[i];
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#dff8ff';
      ctx.beginPath();
      ctx.arc(bullet.x - bullet.vx * 0.018, bullet.y - bullet.vy * 0.018, bullet.radius * 1.5, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ff6b7d';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius * 0.45, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShenlinHUD() {
    if (!game || !game.shenlin || !game.shenlin.active) return;
    const s = game.shenlin;
    const w = Math.min(300, view.w - 32);
    const h = 46;
    const x = view.w * 0.5 - w * 0.5;
    const y = view.w > view.h && view.h < 560 ? 106 : 82;
    drawPanel(x, y, w, h, 12, 'rgba(8,12,22,0.88)', 'rgba(186,235,255,0.28)');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    setFont(11, 800);
    ctx.fillStyle = '#f2fbff';
    ctx.fillText('神临 · 撑过 12 秒', x + w * 0.5, y + 16);
    setMonoFont(15, 900);
    ctx.fillStyle = s.time <= 3 ? '#ff6b7d' : '#fff1a8';
    ctx.fillText(s.time.toFixed(1) + 's', x + w * 0.5, y + 33);
    drawBar(x + 16, y + 38, w - 32, 4, clamp(s.time / SHENLIN_CONFIG.duration, 0, 1), '#ffcf66', '#ff6b7d', 'rgba(255,255,255,0.08)');
  }

  function cleanupEventOnGameOver() {
    if (game && game.shenlin) stopShenlinChallenge();
    clearEventTimers();
    if (randomEventManager) randomEventManager.finish();
    if (game) {
      game.randomEvent.active = false;
      game.randomEvent.phase = 'dead';
      game.eventBossActive = false;
      game.eventBoss = null;
      game.eventBossDelayed = [];
      game.eventBossSpiral = null;
      game.enemyBullets = [];
      game.companion = null;
      game.companionBullets = [];
      game.companionRecruitedThisRun = false;
    }
    if (el.eventScreen) el.eventScreen.classList.remove('is-hostile', 'is-affection');
  }

  function applySpecialReward(id) {
    if (!game || !game.player) return null;
    const p = game.player;
    if (id === 'bulletDestroyer') {
      p.damageMult *= 1.5;
    } else if (id === 'rapidArsenal') {
      p.fireRateMult *= 1.3;
    } else if (id === 'undying') {
      p.maxHp = Math.round(p.maxHp * 1.5);
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.5);
    } else {
      return null;
    }
    game.specialRewards[id] = true;
    return id;
  }

  function renderEventRewardChoices(event) {
    if (!el.eventRewardCards || !event) return;
    el.eventRewardCards.innerHTML = '';
    event.reward.choices.forEach(function (choice, index) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'event-reward-card';
      button.style.setProperty('--reward-color', choice.color);
      button.setAttribute('data-reward-id', choice.id);
      const icon = document.createElement('span');
      icon.className = 'event-reward-icon';
      icon.textContent = String.fromCharCode(65 + index);
      const name = document.createElement('h3');
      name.textContent = choice.name;
      const desc = document.createElement('p');
      desc.textContent = choice.desc;
      const detail = document.createElement('span');
      detail.className = 'event-reward-detail';
      detail.textContent = choice.detail;
      button.appendChild(icon);
      button.appendChild(name);
      button.appendChild(desc);
      button.appendChild(detail);
      button.addEventListener('click', function () {
        chooseEventReward(choice.id);
      });
      el.eventRewardCards.appendChild(button);
    });
  }

  function showEventReward(event, firstClear, coins) {
    if (!game) return;
    game.randomEvent.phase = 'reward';
    game.eventReward = {
      firstClear: firstClear,
      coins: coins,
      claimed: false,
      choice: null
    };
    setState(S.EVENT);
    clearInput();
    hideScreens();
    showScreen('eventReward');
    el.eventRewardTitle.textContent = '战斗胜利';
    el.eventRewardText.textContent = firstClear
      ? '你击败了抉择之影，首次通关金币已发放。选择一项临时强化词条。'
      : '你再次击败了抉择之影。首次金币奖励已领取，仍可选择一项临时强化词条。';
    el.eventCoinReward.textContent = '+' + formatNumber(coins);
    el.eventCoinNote.textContent = firstClear ? '首次击败奖励已发放' : '首次金币奖励已领取';
    el.eventRewardFooter.innerHTML = '';
    renderEventRewardChoices(event);
    audio.play('event_victory');
    lastFrameTime = performance.now();
  }

  function chooseEventReward(id) {
    if (!game || !game.eventReward || game.eventReward.claimed) return;
    const event = WUCHAOYANG_EVENT;
    if (!event) return;
    const choice = event.reward.choices.find(function (item) { return item.id === id; });
    if (!choice) return;
    const applied = applySpecialReward(id);
    if (!applied) return;
    game.eventReward.claimed = true;
    game.eventReward.choice = id;
    game.randomEvent.rewardChoice = id;
    save.wuchaoyangLastReward = id;
    persistSave();
    const cards = el.eventRewardCards.querySelectorAll('.event-reward-card');
    cards.forEach(function (card) {
      card.disabled = true;
      card.classList.toggle('is-chosen', card.getAttribute('data-reward-id') === id);
    });
    el.eventRewardFooter.innerHTML = '';
    const message = document.createElement('span');
    message.className = 'event-reward-message';
    message.textContent = '已获得：' + choice.name + ' · 本局临时生效';
    el.eventRewardFooter.appendChild(message);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary event-continue';
    button.textContent = '继续';
    button.addEventListener('click', function () {
      finishRandomEvent('reward');
    });
    el.eventRewardFooter.appendChild(button);
    audio.play('upgrade');
  }

  function toggleSound() {
    save.sfx = !save.sfx;
    audio.setEnabled(save.sfx);
    bossMusic.setEnabled(save.sfx);
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
    if (input.firePointerId !== null && el.fireBtn) {
      try {
        if (el.fireBtn.hasPointerCapture && el.fireBtn.hasPointerCapture(input.firePointerId)) {
          el.fireBtn.releasePointerCapture(input.firePointerId);
        }
      } catch (error) {
        /* 忽略已释放的指针 */
      }
    }
    input.firePointerId = null;
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
      if (event && input.firePointerId !== null && event.pointerId !== input.firePointerId) return;
      input.fireHeld = false;
      input.firePointerId = null;
      el.fireBtn.classList.remove('is-pressed');
      if (event) event.preventDefault();
    }
    el.fireBtn.addEventListener('pointerdown', function (event) {
      if (state !== S.PLAYING) return;
      if (input.firePointerId !== null) return;
      event.preventDefault();
      event.stopPropagation();
      audio.ensure();
      input.firePointerId = event.pointerId;
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
    const gameKeys = ['Space', 'ShiftLeft', 'ShiftRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyQ', 'KeyE', 'KeyR', 'KeyP', 'Tab', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'];
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

    if (skillIntroOpen) {
      if (code === 'Escape') {
        event.preventDefault();
        closeSkillIntro();
      }
      return;
    }

    if (event.repeat) return;

    if (activeStore) {
      if (code === 'Escape') {
        event.preventDefault();
        closeStore();
      }
      return;
    }

    if (code === 'Tab') {
      if (state === S.PLAYING || state === S.PAUSED) {
        event.preventDefault();
        toggleStatsPanel();
      }
      return;
    }

    if (code === 'Escape' && statsPanelOpen) {
      event.preventDefault();
      closeStatsPanel();
      return;
    }

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

    if (code === 'KeyQ') {
      castSkill('q');
      return;
    }
    if (code === 'KeyE') {
      castSkill('e');
      return;
    }
    if (code === 'KeyR') {
      tryReload(false);
      return;
    }
    if (code === 'KeyF') {
      tryDash();
      return;
    }
    if (code === 'Space') {
      if (currentUltimateUsesSpace()) {
        castSkill('r');
      }
      return;
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight') {
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
    window.addEventListener('resize', syncOrientationGate);
    window.addEventListener('orientationchange', function () {
      window.setTimeout(function () {
        resizeCanvas();
        syncOrientationGate();
      }, 180);
    });
    document.addEventListener('fullscreenchange', syncOrientationGate);

    function bindTouchAction(button, action) {
      if (!button) return;
      button.addEventListener('pointerdown', function (event) {
        if (state !== S.PLAYING) return;
        event.preventDefault();
        event.stopPropagation();
        audio.ensure();
        action();
      }, { passive: false });
    }

    bindTouchAction(el.reloadBtn, function () { tryReload(false); });
    bindTouchAction(el.dashBtn, tryDash);
    bindTouchAction(el.switchBtn, cycleWeapon);
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
        rocket: false,
        laser: false
      },
      ammo: {
        pistol: WEAPONS.pistol.mag,
        smg: WEAPONS.smg.mag,
        shotgun: WEAPONS.shotgun.mag,
        sniper: WEAPONS.sniper.mag,
        rocket: WEAPONS.rocket.mag,
        laser: 0
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
      dead: false,
      formId: save.equippedSkin,
      skills: createSkillState(save.equippedSkin, 0)
    };
    return player;
  }

  function xpForLevel(level) {
    return Math.floor(38 + (level - 1) * 26 + Math.pow(level, 1.25) * 4);
  }

  function stageTargetFor(stage) {
    return 10 + stage * 3;
  }

  function createCompanion(player) {
    return {
      x: clamp(player.x - 46, player.r + 8, MAP.w - player.r - 8),
      y: clamp(player.y + 24, player.r + 8, MAP.h - player.r - 8),
      r: 18,
      fireTimer: 0.65,
      bob: rand(0, TAU),
      aim: -Math.PI * 0.5,
      active: true
    };
  }

  function createGame(mode) {
    const g = {
      mode: mode === 'stage' ? 'stage' : 'survival',
      mapTheme: null,
      mapSeed: 1,
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
      laserBeams: [],
      enemyBullets: [],
      companionBullets: [],
      companion: null,
      companionRecruitedThisRun: false,
      skillProjectiles: [],
      koreanZombie: null,
      brideProjectiles: [],
      brideLink: null,
      brideCharmedUid: null,
      nunSwords: [],
      nunTentacle: null,
      nunBullets: [],
      nunGreatSwords: [],
      nunOrbs: [],
      nunUltimate: null,
      eventBoss: null,
      eventBossActive: false,
      eventBossDefeated: false,
      eventBossDelayed: [],
      eventBossSpiral: null,
      eventReward: null,
      specialRewards: Object.create(null),
      randomEvent: {
        id: null,
        triggered: false,
        active: false,
        phase: 'idle',
        bossRewardGranted: false,
        rewardChoice: null
      },
      shenlin: null,
      orbs: [],
      particles: [],
      numbers: [],
      rings: [],
      toasts: [],
      banner: null,
      boss: null,
      bossActive: false,
      blackAdiaoTriggered: false,
      blackAdiaoDefeated: false,
      blackAdiaoRewardGranted: false,
      blackAdiaoVideoActive: false,
      nextBossAt: 42,
      spawnTimer: 1.2,
      tutorial: 7.2,
      enemyUid: 0,
      stage: 1,
      stageKills: 0,
      stageTarget: stageTargetFor(1),
      stageState: 'fighting',
      stageTransition: 0,
      lastRewardedStage: 0,
      coinReward: null,
      upgradeOptions: [],
      upgradeChoosing: false,
      deathTimer: 0,
      gameOverShown: false,
      statsCommitted: false,
      finalScore: 0,
      newRecord: false,
      coinsEarnedRun: 0,
      victoryShown: false
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

  async function requestLandscapeMode() {
    if (!hasTouch) return;
    let failed = false;
    try {
      const root = document.documentElement;
      if (root.requestFullscreen && !document.fullscreenElement) {
        await root.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch (error) {
      failed = true;
    }
    try {
      if (screen.orientation && typeof screen.orientation.lock === 'function') {
        await screen.orientation.lock('landscape');
      } else {
        failed = true;
      }
    } catch (error) {
      failed = true;
    }
    if (failed && el.rotateHintMsg && window.innerHeight > window.innerWidth) {
      el.rotateHintMsg.textContent = '浏览器未允许自动旋转，请手动将手机横置。';
    }
  }

  function syncOrientationGate() {
    const portrait = window.innerHeight > window.innerWidth;
    document.body.classList.toggle('is-portrait', hasTouch && portrait);
    if (!hasTouch) return;
    if (portrait) {
      if (state === S.PLAYING) {
        orientationPause = true;
        pauseGame();
      }
    } else if (orientationPause) {
      orientationPause = false;
      if (state === S.PAUSED) resumeGame();
    }
  }

  function startGame(mode) {
    closeStatsPanel();
    if (hasTouch) requestLandscapeMode();
    hideScreens();
    hideInstructions();
    activeStore = null;
    storeReturn = null;
    if (randomEventManager) randomEventManager.resetRun();
    bossMusic.stop();
    audio.ensure();
    clearInput();
    game = createGame(mode);
    if (game.mode === 'stage') {
      game.mapTheme = STAGE_MAP_THEMES[Math.floor(Math.random() * STAGE_MAP_THEMES.length)];
      game.mapSeed = Math.floor(Math.random() * 0x7fffffff);
    }
    setState(S.PLAYING);
    showScreen(null);
    syncOrientationGate();
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

  function skillIntroDetails(form, slot, def) {
    const lines = [];
    if (!form || !def) return lines;
    if (form.id === 'nun') {
      const fire = getNunSubform() === 'fire';
      if (!fire) {
        if (slot === 'q') {
          lines.push('召唤 3 把独立紫色魔剑环绕自身，自动分别索敌；6 秒持续，冷却 10 秒。');
          lines.push('单次伤害 = 当前武器最终攻击力 × 1 + 关卡 × 5。');
        } else if (slot === 'e') {
          lines.push('在当前位置召唤固定触手，持续 8 秒，冷却 14 秒；触手会吸引附近攻击并砸击范围敌人。');
          lines.push('触手伤害 = 当前武器最终攻击力 × 1.2 + 关卡 × 8。');
        } else if (slot === 'r') {
          lines.push('连续发射 10 波环形紫色剑气，每发伤害等于发射时当前武器最终单发伤害。');
          lines.push('大招冷却 50 秒；结束后自动切换火焰形态。');
        }
      } else {
        if (slot === 'q') {
          lines.push('5 秒内近战攻速翻倍，冷却 15 秒；每次攻击额外造成 10 + 2×关卡 固定伤害。');
        } else if (slot === 'e') {
          lines.push('持续 10 秒，冷却 25 秒；击杀生成红色生命球，每个吸收恢复 2 HP。');
        } else if (slot === 'r') {
          lines.push('召唤 3 把巨型火焰魔剑环绕旋转 10 秒；每次命中造成 60×关卡 伤害。');
          lines.push('与恶魔形态大招共用 50 秒冷却；结束后自动返回恶魔形态。');
        }
      }
    } else if (form.id === 'bride') {
      if (slot === 'q') {
        lines.push('粉白爱心命中普通敌人后魅惑 10 秒；Boss 免疫魅惑。');
        lines.push('同一时间最多控制 1 名敌人；魅惑敌人会攻击其他敌人，10 秒后自动死亡。');
      } else if (slot === 'e') {
        lines.push('持续 5 秒，移速提升至当前速度的 2 倍，并获得完整无敌。');
        lines.push('疾袭期间接触敌人造成伤害；碰撞范围严格按玩家和敌人半径计算，同一敌人每 0.35 秒最多命中一次。');
        lines.push('伤害基于当前武器最终攻击力和关卡数；结束、死亡或切换形态会解除无敌并恢复正常移速。');
      } else if (slot === 'r') {
        lines.push('持续 20 秒，冷却 50 秒；每 5 秒恢复 5 HP，最多恢复 20 HP。');
        lines.push('以玩家为中心、半径 380 的圣焰每秒灼烧敌人；伤害与当前武器和关卡有关。');
        lines.push('回血不超过最大生命值；死亡或切换形态会清理羽翼和灼烧状态。');
      }
    } else if (form.id === 'korean') {
      if (slot === 'q') {
        lines.push('AOE 半径 ' + (def.aoeRadius || 132) + '，每次挥拳命中范围内全部敌人。');
        lines.push('伤害 = 当前装备武器最终实际攻击力 × ' + (def.damageMultiplier || 2) + '（含升级、被动加成）。');
        lines.push('近战击杀恢复 ' + (def.healPerKill || 1) + ' HP；每名敌人每次死亡只结算一次。');
        lines.push('Q 完整 6 秒期间无敌；3 秒时断掉一臂并显示“阿一古”，剩余手臂攻击间隔 ' + (def.attackInterval || 0.55) + ' → ' + (def.oneArmInterval || 0.275) + ' 秒。');
      } else if (slot === 'e') {
        lines.push('爆炸伤害 = 当前关卡 × ' + (def.damagePerStage || 20) + '。');
        lines.push('自动索敌并接近，目标消失会重新寻找；进入爆炸范围后一次性自爆。');
        lines.push('冷却 ' + def.cooldown + ' 秒，僵尸生命周期 ' + def.duration + ' 秒。');
      } else if (slot === 'r') {
        lines.push('每累计击杀 ' + def.requiredKills + ' 名敌人获得 1 次释放机会，可累计多次。');
        lines.push('关卡伤害：1–5 关 600，6–10 关 1200，11–15 关 1500，16–20 关 2000。');
        lines.push('马头落地范围伤害不受武器伤害倍率影响；未充能时无法释放。');
      }
    } else if (form.id === 'edg') {
      if (slot === 'q') {
        lines.push('持续 5 秒，射速翻倍并获得无限弹药；不改变单发伤害。');
      } else if (slot === 'e') {
        lines.push('持续 5 秒，每次有效击杀恢复 1 HP；不超过最大生命值。');
      } else if (slot === 'r') {
        if (def.damageSequence) lines.push('消耗 30 杀，5 次射击伤害：' + def.damageSequence.join(' / ') + '。');
        lines.push('镰刀弹伤害按当前关卡增加，不吃武器伤害倍率或暴击。');
      }
    } else if (form.id === 'edg2026') {
      if (slot === 'q') {
        lines.push('冻结敌人、Boss 与敌方弹幕 1.5 秒；玩家仍可移动、瞄准和射击。');
      } else if (slot === 'e') {
        lines.push('合同爆炸伤害 ' + (def.explosionDamage || 160) + '，半径 ' + (def.explosionRadius || 170) + '。');
        lines.push('只传送普通敌人；Boss 和精英只受到范围伤害。');
      } else if (slot === 'r') {
        lines.push('记录 4 秒，随后有 2 秒确认窗口；再次释放回到记录位置并恢复记录生命。');
      }
    }
    return lines;
  }

  function renderSkillIntro() {
    if (!el.skillIntroGrid || !el.skillIntroForm) return;
    const form = getCurrentForm();
    const skillSet = getFormSkillSet(form);
    if (!form || !skillSet) {
      el.skillIntroForm.textContent = '当前形态 · 技能未开放';
      el.skillIntroGrid.innerHTML = '<p class="skill-intro-desc">该形态暂未配置 Q / E / 大招。</p>';
      return;
    }
    const subLabel = form.id === 'nun'
      ? (getNunSubform() === 'fire' ? '火焰形态' : '恶魔形态') : '当前形态';
    el.skillIntroForm.textContent = form.name + ' · ' + (form.title || '') + ' · ' + subLabel;
    const slots = ['q', 'e', 'r'];
    el.skillIntroGrid.innerHTML = slots.map(function (slot) {
      const def = skillSet[slot];
      if (!def) return '';
      const meta = [];
      if (def.cooldown) meta.push('冷却 ' + def.cooldown + 's');
      if (def.duration) meta.push('持续 ' + def.duration + 's');
      if (def.requiredKills) meta.push('充能 ' + def.requiredKills + ' 杀');
      const details = skillIntroDetails(form, slot, def);
      return '<article class="skill-intro-card">' +
        '<div class="skill-intro-card-head">' +
          '<img class="skill-intro-card-icon" src="' + def.icon + '?v=' + AVATAR_VERSION + '" alt="">' +
          '<div><h3>' + def.slot + ' · ' + def.name + '</h3>' +
          '<p class="skill-intro-meta">' + meta.join(' · ') + '</p></div>' +
        '</div>' +
        '<p class="skill-intro-desc">' + def.desc + '</p>' +
        (details.length ? '<ul class="skill-intro-extra">' + details.map(function (line) {
          return '<li>' + line + '</li>';
        }).join('') + '</ul>' : '') +
      '</article>';
    }).join('');
  }

  function openSkillIntro() {
    if (state !== S.PAUSED || !game) return;
    renderSkillIntro();
    skillIntroOpen = true;
    showScreen('skillIntro');
  }

  function closeSkillIntro() {
    if (!skillIntroOpen) return;
    skillIntroOpen = false;
    showScreen('pause');
  }

  function pauseGame() {
    if (!game || state !== S.PLAYING) return;
    setState(S.PAUSED);
    bossMusic.pause();
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
    bossMusic.resume();
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
    closeStatsPanel();
    hideScreens();
    hideInstructions();
    activeStore = null;
    storeReturn = null;
    if (randomEventManager) randomEventManager.resetRun();
    bossMusic.stop();
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
      if (enemy.dead || enemy.charmed) continue;
      const d2 = distSq(x, y, enemy.x, enemy.y);
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        best = enemy;
      }
    }
    if (game.eventBossActive && game.eventBoss &&
        !game.eventBoss.dead && !game.eventBoss.defeated) {
      const d2 = distSq(x, y, game.eventBoss.x, game.eventBoss.y);
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        best = game.eventBoss;
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

  /* =======================================================
     形态技能运行时
     ======================================================= */
  function releaseDelayedPlayerBullets() {
    if (!game) return;
    for (let i = 0; i < game.bullets.length; i += 1) {
      game.bullets[i].delayedByFreeze = false;
    }
  }

  function clearChampionWorldState() {
    if (!game) return;
    game.skillProjectiles = [];
    if (game.enemies) {
      game.enemies.forEach(function (enemy) {
        enemy.transferMark = null;
      });
    }
    releaseDelayedPlayerBullets();
  }

  function clearKoreanWorldState() {
    if (!game) return;
    game.koreanZombie = null;
    if (game.player && game.player.skills) {
      const skills = game.player.skills;
      skills.q.phase = 'idle';
      skills.q.elapsed = 0;
      skills.q.armCount = 0;
      skills.q.attackTimer = 0;
      skills.q.swing = 0;
      skills.q.aguhTimer = 0;
      skills.q.removedSide = 0;
      skills.q.invulnBase = 0;
      if (game.player) game.player.invuln = 0;
      if (skills.q.arms) {
        skills.q.arms.forEach(function (arm) {
          arm.punch = 0;
          arm.broken = false;
        });
      }
      skills.r.ult = null;
      skills.r.castLock = 0;
    }
  }

  function clearBrideWorldState() {
    if (!game) return;
    game.brideProjectiles = [];
    game.brideLink = null;
    game.brideCharmedUid = null;
    if (game.enemies) {
      game.enemies.forEach(function (enemy) {
        enemy.charmed = false;
        enemy.charmTimer = 0;
        enemy.charmTarget = null;
        enemy.brideKiss = false;
      });
    }
    if (game.player && game.player.skills) {
      const brideSkills = game.player.skills;
      const wasDashing = brideSkills.e.active > 0;
      brideSkills.e.active = 0;
      brideSkills.e.dashing = false;
      brideSkills.e.invulnBase = 0;
      brideSkills.e.hitTimers = Object.create(null);
      brideSkills.e.trailTimer = 0;
      if (wasDashing) game.player.invuln = 0;
      brideSkills.r.active = 0;
      game.player.skills.r.healTimer = 0;
      game.player.skills.r.healTicks = 0;
      game.player.skills.r.burnTimer = 0;
    }
  }

  function clearNunWorldState() {
    if (!game) return;
    game.nunSwords = [];
    game.nunTentacle = null;
    game.nunBullets = [];
    game.nunGreatSwords = [];
    game.nunOrbs = [];
    game.nunUltimate = null;
    if (game.player && game.player.skills) {
      const nunSkills = game.player.skills;
      nunSkills.q.active = 0;
      nunSkills.e.active = 0;
      nunSkills.r.active = 0;
      nunSkills.nunSwing = 0;
      nunSkills.nunAttack = { phase: 'idle', time: 0, angle: 0, damage: 0, qActive: false, hit: false };
    }
  }

  function syncPlayerForm() {
    if (!game || !game.player) return;
    const nextFormId = getCurrentFormId();
    const p = game.player;
    if (p.formId === nextFormId) return;
    clearChampionWorldState();
    clearKoreanWorldState();
    clearBrideWorldState();
    clearNunWorldState();
    p.formId = nextFormId;
    p.skills = createSkillState(nextFormId, game.kills);
    // 切换形态时旧的技能效果必须立即失效，射速回到新形态的当前实际值。
    p.shootCd = Math.min(p.shootCd, getWeaponStats(p.weapon).fireInterval);
  }

  function resetPlayerSkillRuntime() {
    if (!game || !game.player || !game.player.skills) return;
    clearChampionWorldState();
    clearKoreanWorldState();
    clearBrideWorldState();
    clearNunWorldState();
    const skills = game.player.skills;
    skills.q.active = 0;
    skills.e.active = 0;
    skills.r.pendingShots = 0;
    skills.r.shotIndex = 0;
    skills.r.castFlash = 0;
    skills.r.phase = 'idle';
    skills.r.recordRemaining = 0;
    skills.r.windowRemaining = 0;
    skills.r.snapshot = null;
  }

  function updatePlayerSkills(dt) {
    if (!game || state !== S.PLAYING) return;
    syncPlayerForm();
    const p = game.player;
    const skills = p.skills;
    if (!skills) return;
    const champion = isChampionForm();

    const q = skills.q;
    const qWasActive = q.active > 0;
    q.active = Math.max(0, q.active - dt);
    if (!isNunForm()) q.cooldown = Math.max(0, q.cooldown - dt);
    if (qWasActive && q.active <= 0) {
      if (champion) {
        releaseDelayedPlayerBullets();
        addToast('裁判拒绝申请，比赛继续！', 'warn', 1.7);
        addRing(p.x, p.y, p.r + 10, '#ffcf66', 0.42, 2);
      } else if (isEdgForm()) {
        p.shootCd = Math.max(p.shootCd, getWeaponStats(p.weapon).fireInterval);
      } else if (isKoreanForm()) {
        q.phase = 'idle';
        p.invuln = Math.max(0, (q.invulnBase || 0) - q.elapsed);
        q.elapsed = 0;
        q.armCount = 0;
        q.attackTimer = 0;
        q.swing = 0;
        q.aguhTimer = 0;
        if (q.arms) q.arms.forEach(function (arm) { arm.punch = 0; arm.broken = false; });
        p.shootCd = Math.min(p.shootCd, getWeaponStats(p.weapon).fireInterval);
        addToast('Q · 双臂收回', 'info', 1.2);
        refreshSkillBar(true);
      }
    }

    const e = skills.e;
    e.active = Math.max(0, e.active - dt);
    if (!isNunForm()) e.cooldown = Math.max(0, e.cooldown - dt);
    skills.r.castFlash = Math.max(0, skills.r.castFlash - dt);

    if (champion) {
      const r = skills.r;
      r.cooldown = Math.max(0, r.cooldown - dt);
      if (r.phase === 'recording') {
        r.recordRemaining = Math.max(0, r.recordRemaining - dt);
        if (r.recordRemaining <= 0) {
          r.phase = 'confirm';
          r.windowRemaining = 2;
          addToast('记录完成 · 2 秒内再次按空格回溯', 'good', 2.1);
          refreshSkillBar(true);
          refreshStatsPanel(true);
        }
      } else if (r.phase === 'confirm') {
        r.windowRemaining = Math.max(0, r.windowRemaining - dt);
        if (r.windowRemaining <= 0) {
          r.phase = 'idle';
          r.snapshot = null;
          addToast('回溯窗口结束', 'info', 1.2);
          refreshSkillBar(true);
          refreshStatsPanel(true);
        }
      }
    }

    if (isKoreanForm()) updateKoreanSkills(dt);
    if (isBrideForm()) updateBrideSkills(dt);
    if (isNunForm()) updateNunSkills(dt);
  }

  function castSkill(slot) {
    if (!game || state !== S.PLAYING || !game.player || game.player.dead) return false;
    syncPlayerForm();
    const form = getCurrentForm();
    const skillSet = getFormSkillSet(form);
    if (!form || !form.implemented || !skillSet) return false;
    const def = skillSet[slot];
    if (!def) return false;
    const p = game.player;
    const skills = p.skills;
    if (!skills) return false;

    if (form.id === 'nun') {
      return castNunSkill(slot, form, def);
    }

    if (form.id === 'edg2026') {
      return castChampionSkill(slot, form, def);
    }

    if (form.id === 'korean') {
      return castKoreanSkill(slot, form, def);
    }

    if (form.id === 'bride') {
      return castBrideSkill(slot, form, def);
    }

    if (slot === 'q') {
      if (skills.q.active > 0 || skills.q.cooldown > 0) return false;
      skills.q.active = def.duration;
      skills.q.cooldown = def.cooldown;
      cancelReload();
      p.shootCd = Math.min(p.shootCd, getWeaponStats(p.weapon).fireInterval);
      addRing(p.x, p.y, p.r + 8, '#ff6b5f', 0.46, 3);
      for (let i = 0; i < 16; i += 1) {
        const angle = rand(0, TAU);
        spawnParticle(
          p.x + Math.cos(angle) * 18,
          p.y + Math.sin(angle) * 18,
          Math.cos(angle) * rand(70, 240),
          Math.sin(angle) * rand(70, 240),
          rand(0.18, 0.45),
          rand(2, 5),
          Math.random() < 0.5 ? '#ff6b5f' : '#ffcf66',
          true
        );
      }
      addToast('Q · 极速射击 · 双倍射速 / 无限弹药', 'good', 1.7);
      audio.play('skill');
      pulseSkillSlot('q');
      refreshSkillBar(true);
      refreshStatsPanel(true);
      return true;
    }

    if (slot === 'e') {
      if (skills.e.active > 0 || skills.e.cooldown > 0) return false;
      skills.e.active = def.duration;
      skills.e.cooldown = def.cooldown;
      addRing(p.x, p.y, p.r + 6, '#66e6a8', 0.5, 3);
      for (let i = 0; i < 12; i += 1) {
        spawnParticle(
          p.x + rand(-16, 16),
          p.y + rand(-16, 16),
          rand(-80, 80),
          rand(-120, -30),
          rand(0.2, 0.5),
          rand(2, 4),
          Math.random() < 0.6 ? '#66e6a8' : '#ff6b7d',
          true
        );
      }
      addToast('E · 嗜血杀戮 · 击杀恢复 5 HP', 'good', 1.7);
      audio.play('skill');
      pulseSkillSlot('e');
      refreshSkillBar(true);
      refreshStatsPanel(true);
      return true;
    }

    if (slot === 'r') {
      if (skills.r.pendingShots > 0) return false;
      const required = def.requiredKills || 30;
      if (getRCharge() < required) {
        addToast('R · 终极裁决尚未充能完成', 'warn', 1.2);
        audio.play('denied');
        return false;
      }
      skills.r.baseKills = game.kills;
      skills.r.pendingShots = def.damageSequence.length;
      skills.r.shotIndex = 0;
      skills.r.castFlash = 0.65;
      addRing(p.x, p.y, p.r + 10, '#ff334f', 0.75, 4);
      addShake(8);
      for (let i = 0; i < 24; i += 1) {
        const angle = rand(0, TAU);
        spawnParticle(
          p.x + Math.cos(angle) * 22,
          p.y + Math.sin(angle) * 22,
          Math.cos(angle) * rand(60, 260),
          Math.sin(angle) * rand(60, 260),
          rand(0.28, 0.72),
          rand(2, 6),
          Math.random() < 0.6 ? '#ff334f' : '#ffd0b4',
          true
        );
      }
      addToast('R · 终极裁决 · 接下来的 5 次射击变为镰刀弹', 'good', 2.2);
      audio.play('skill');
      pulseSkillSlot('r');
      refreshSkillBar(true);
      refreshStatsPanel(true);
      return true;
    }

    return false;
  }

  function koreanHorseDamage(stage) {
    const s = Math.max(1, Math.floor(Number(stage) || 1));
    if (s <= 5) return 600;
    if (s <= 10) return 1200;
    if (s <= 15) return 1500;
    return 2000;
  }

  function isKoreanMeleeActive() {
    return isKoreanForm() && game.player.skills &&
      game.player.skills.q.active > 0;
  }

  function damageKoreanTarget(target, damage, x, y) {
    if (!target) return;
    if (target === game.eventBoss) {
      damageEventBoss(damage, { critical: false });
    } else {
      damageEnemy(target, damage, {
        critical: false,
        silent: true,
        pushX: (target.x - x) * 0.12,
        pushY: (target.y - y) * 0.12
      });
    }
    addRing(x, y, 18, '#5de1ff', 0.24, 2);
  }

  const KOREAN_MELEE_RADIUS = 132;

  function koreanMeleeAttack() {
    if (!game || !game.player || game.player.dead) return;
    const p = game.player;
    const q = p.skills.q;
    const target = findNearestEnemy(p.x, p.y, KOREAN_MELEE_RADIUS);
    let arm = null;
    if (q.arms && q.arms.length) {
      if (target) {
        const side = target.x < p.x ? -1 : 1;
        arm = q.arms.find(function (item) {
          return !item.broken && item.side === side;
        }) || q.arms.find(function (item) { return !item.broken; }) || null;
      } else {
        arm = q.arms[q.nextArm] || q.arms[0];
        if (arm.broken) arm = q.arms.find(function (item) { return !item.broken; }) || null;
      }
      if (arm) {
        q.nextArm = arm.side < 0 ? 1 : 0;
        arm.punch = 1;
        arm.aimAngle = target ? Math.atan2(target.y - p.y, target.x - p.x) : p.aimAngle;
      }
    }
    q.swing = 1;
    if (target) p.aimAngle = Math.atan2(target.y - p.y, target.x - p.x);
    const damage = getWeaponStats(p.weapon).damage * 2;
    let hitCount = 0;

    // 双臂横扫：攻击范围内所有敌人都结算一次，左右两侧没有视觉命中却不掉血的死角。
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead) continue;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) > KOREAN_MELEE_RADIUS) continue;
      const wasDead = enemy.dead;
      damageEnemy(enemy, damage, {
        critical: false,
        silent: false,
        pushX: (enemy.x - p.x) * 0.08,
        pushY: (enemy.y - p.y) * 0.08
      });
      if (!wasDead && enemy.dead) healPlayer(1, false);
      hitCount += 1;
      for (let k = 0; k < 6; k += 1) {
        const angle = Math.atan2(enemy.y - p.y, enemy.x - p.x) + rand(-0.5, 0.5);
        spawnParticle(
          enemy.x,
          enemy.y,
          Math.cos(angle) * rand(40, 170),
          Math.sin(angle) * rand(40, 170),
          rand(0.14, 0.32),
          rand(2, 4),
          Math.random() < 0.5 ? '#5de1ff' : '#ffcf66',
          true
        );
      }
    }
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.dead &&
        !game.eventBoss.defeated &&
        Math.hypot(game.eventBoss.x - p.x, game.eventBoss.y - p.y) <= KOREAN_MELEE_RADIUS) {
      damageEventBoss(damage, { critical: false });
      hitCount += 1;
    }

    if (hitCount > 0) {
      addRing(p.x, p.y, KOREAN_MELEE_RADIUS * 0.72, '#5de1ff', 0.2, 2);
      addShake(2.5);
    }
    audio.play('shoot_pistol');
  }

  function castKoreanSkill(slot, form, def) {
    if (!game || !game.player || game.player.dead) return false;
    const p = game.player;
    const skills = p.skills;
    if (!skills) return false;

    if (slot === 'q') {
      if (skills.q.active > 0 || skills.q.cooldown > 0) return false;
      skills.q.active = def.duration;
      skills.q.cooldown = def.cooldown;
      skills.q.phase = 'two';
      skills.q.elapsed = 0;
      skills.q.armCount = 2;
      skills.q.attackTimer = 0;
      skills.q.swing = 0;
      skills.q.nextArm = 0;
      skills.q.removedSide = 0;
      skills.q.aguhTimer = 0;
      skills.q.invulnBase = p.invuln;
      p.invuln = Math.max(p.invuln, def.duration);
      if (skills.q.arms) {
        skills.q.arms.forEach(function (arm, index) {
          arm.punch = 0;
          arm.broken = false;
          arm.aimAngle = p.aimAngle + (index === 0 ? -0.2 : 0.2);
        });
      }
      cancelReload();
      p.shootCd = Math.min(p.shootCd, getWeaponStats(p.weapon).fireInterval);
      addRing(p.x, p.y, p.r + 12, '#5de1ff', 0.5, 3);
      addToast('Q · 双臂近战 · 3 秒后断臂', 'good', 1.8);
      audio.play('skill');
      pulseSkillSlot('q');
      refreshSkillBar(true);
      refreshStatsPanel(true);
      return true;
    }

    if (slot === 'e') {
      if (skills.e.active > 0 || skills.e.cooldown > 0 || game.koreanZombie) return false;
      skills.e.active = def.duration;
      skills.e.cooldown = def.cooldown;
      game.koreanZombie = {
        x: p.x + Math.cos(p.aimAngle) * 24,
        y: p.y + Math.sin(p.aimAngle) * 24,
        target: null,
        life: def.duration,
        radius: def.explosionRadius,
        speed: def.zombieSpeed,
        dead: false
      };
      addRing(p.x, p.y, p.r + 9, '#9be36b', 0.42, 3);
      addToast('E · 自爆僵尸已召唤', 'good', 1.5);
      audio.play('skill');
      pulseSkillSlot('e');
      refreshSkillBar(true);
      refreshStatsPanel(true);
      return true;
    }

    if (slot === 'r') {
      if (skills.r.charges < 1) {
        addToast('R · 还需累计击杀 ' + (48 - skills.r.killProgress) + ' 名敌人', 'warn', 1.4);
        audio.play('denied');
        return false;
      }
      if (skills.r.castLock > 0 || skills.r.ult) return false;
      skills.r.charges -= 1;
      skills.r.castLock = 1.6;
      const target = findNearestEnemy(p.x, p.y, 560);
      const tx = target ? target.x : p.x + Math.cos(p.aimAngle) * 260;
      const ty = target ? target.y : p.y + Math.sin(p.aimAngle) * 260;
      skills.r.ult = {
        x: clamp(tx, 80, MAP.w - 80),
        y: clamp(ty, 80, MAP.h - 80),
        time: 1.15,
        maxTime: 1.15,
        impacted: false,
        hold: 0
      };
      addToast('R · 天降巨大马头！', 'good', 1.8);
      audio.play('boss_warn');
      pulseSkillSlot('r');
      refreshSkillBar(true);
      refreshStatsPanel(true);
      return true;
    }

    return false;
  }

  function updateKoreanZombie(dt) {
    const z = game.koreanZombie;
    if (!z || z.dead) return;
    z.life -= dt;
    if (!z.target || z.target.dead || z.target.defeated) {
      z.target = findNearestEnemy(z.x, z.y, 620);
    }
    if (z.target) {
      const dx = z.target.x - z.x;
      const dy = z.target.y - z.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist <= z.radius + z.target.r) {
        explodeKoreanZombie(z);
        return;
      }
      z.x += (dx / dist) * z.speed * dt;
      z.y += (dy / dist) * z.speed * dt;
      z.x = clamp(z.x, 30, MAP.w - 30);
      z.y = clamp(z.y, 30, MAP.h - 30);
    }
    if (z.life <= 0) {
      game.koreanZombie = null;
      if (game.player.skills) game.player.skills.e.active = 0;
    }
  }

  function explodeKoreanZombie(z) {
    if (!game || !z || z.dead) return;
    z.dead = true;
    const damage = Math.max(1, Math.floor(Number(game.stage) || 1)) * 20;
    addRing(z.x, z.y, z.radius, '#9be36b', 0.55, 4);
    addRing(z.x, z.y, z.radius * 0.55, '#ffcf66', 0.35, 2);
    addShake(9);
    audio.play('explosion');
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead) continue;
      if (Math.hypot(enemy.x - z.x, enemy.y - z.y) <= z.radius + enemy.r) {
        damageEnemy(enemy, damage, {
          critical: false,
          silent: true,
          pushX: (enemy.x - z.x) * 1.4,
          pushY: (enemy.y - z.y) * 1.4
        });
      }
    }
    if (game.boss && !game.boss.dead &&
        Math.hypot(game.boss.x - z.x, game.boss.y - z.y) <= z.radius + game.boss.r) {
      damageEnemy(game.boss, damage, { critical: false, silent: true });
    }
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated &&
        Math.hypot(game.eventBoss.x - z.x, game.eventBoss.y - z.y) <= z.radius + game.eventBoss.r) {
      damageEventBoss(damage, { critical: false });
    }
    for (let i = 0; i < 28; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(40, 260);
      spawnParticle(
        z.x, z.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        rand(0.2, 0.65), rand(2, 7),
        Math.random() < 0.5 ? '#9be36b' : Math.random() < 0.5 ? '#ffcf66' : '#ff7048',
        true
      );
    }
    game.koreanZombie = null;
    if (game.player.skills) game.player.skills.e.active = 0;
  }

  function impactKoreanHorse(ult) {
    if (!game || !ult || ult.impacted) return;
    ult.impacted = true;
    const damage = koreanHorseDamage(game.stage);
    addRing(ult.x, ult.y, 190, '#ffcf66', 0.75, 5);
    addRing(ult.x, ult.y, 100, '#ff5f6d', 0.45, 3);
    addShake(18);
    audio.play('explosion');
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead) continue;
      if (Math.hypot(enemy.x - ult.x, enemy.y - ult.y) <= 180 + enemy.r) {
        damageEnemy(enemy, damage, {
          critical: false,
          silent: true,
          pushX: (enemy.x - ult.x) * 1.8,
          pushY: (enemy.y - ult.y) * 1.8
        });
      }
    }
    if (game.boss && !game.boss.dead &&
        Math.hypot(game.boss.x - ult.x, game.boss.y - ult.y) <= 180 + game.boss.r) {
      damageEnemy(game.boss, damage, { critical: false, silent: true });
    }
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated &&
        Math.hypot(game.eventBoss.x - ult.x, game.eventBoss.y - ult.y) <= 180 + game.eventBoss.r) {
      damageEventBoss(damage, { critical: false });
    }
    for (let i = 0; i < 40; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(60, 380);
      spawnParticle(
        ult.x, ult.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        rand(0.25, 0.8), rand(3, 10),
        Math.random() < 0.5 ? '#c98a52' : Math.random() < 0.5 ? '#ffcf66' : '#5de1ff',
        true
      );
    }
  }

  function updateKoreanSkills(dt) {
    const p = game.player;
    const skills = p.skills;
    const q = skills.q;
    const e = skills.e;
    const r = skills.r;

    if (q.active > 0) {
      q.elapsed += dt;
      // 复用玩家 invuln：Q 的 6 秒完整覆盖现有所有 damagePlayer 入口。
      p.invuln = Math.max(p.invuln, q.active);
      if (q.phase === 'two' && q.elapsed >= 3) {
        q.phase = 'one';
        q.armCount = 1;
        q.removedSide = 1;
        q.aguhTimer = 2.2;
        q.attackTimer = 0;
        if (q.arms && q.arms[1]) q.arms[1].broken = true;
        addToast('阿一古！断了一条手臂，攻速翻倍', 'warn', 2.2);
        addRing(p.x, p.y, p.r + 16, '#ff5f6d', 0.5, 3);
        for (let i = 0; i < 18; i += 1) {
          spawnParticle(
            p.x + p.r * 0.8,
            p.y,
            rand(-30, 220),
            rand(-170, 120),
            rand(0.3, 0.7),
            rand(2, 6),
            Math.random() < 0.5 ? '#ff7a5c' : '#5de1ff',
            true
          );
        }
        audio.play('boss_warn');
      }
      q.attackTimer -= dt;
      if (q.attackTimer <= 0) {
        q.attackTimer = q.phase === 'two' ? 0.55 : 0.275;
        koreanMeleeAttack();
      }
      q.swing = Math.max(0, q.swing - dt * 4.5);
      if (q.arms) {
        q.arms.forEach(function (arm) {
          arm.punch = Math.max(0, arm.punch - dt * 3.0);
        });
      }
      q.aguhTimer = Math.max(0, q.aguhTimer - dt);
      if (q.active <= 0) {
        q.phase = 'idle';
        p.invuln = Math.max(0, (q.invulnBase || 0) - q.elapsed);
        q.elapsed = 0;
        q.armCount = 0;
        q.attackTimer = 0;
        q.swing = 0;
        q.aguhTimer = 0;
        if (q.arms) q.arms.forEach(function (arm) { arm.punch = 0; arm.broken = false; });
        p.shootCd = Math.min(p.shootCd, getWeaponStats(p.weapon).fireInterval);
        addToast('Q · 双臂收回', 'info', 1.2);
        refreshSkillBar(true);
      }
    } else if (q.phase !== 'idle') {
      q.phase = 'idle';
      p.invuln = Math.max(0, (q.invulnBase || 0) - q.elapsed);
      q.armCount = 0;
      q.elapsed = 0;
      q.attackTimer = 0;
      q.swing = 0;
      q.aguhTimer = 0;
      if (q.arms) q.arms.forEach(function (arm) { arm.punch = 0; arm.broken = false; });
    }

    if (game.koreanZombie) updateKoreanZombie(dt);
    if (e.active <= 0 && game.koreanZombie) game.koreanZombie = null;

    r.castLock = Math.max(0, r.castLock - dt);
    if (r.ult) {
      if (!r.ult.impacted) {
        r.ult.time -= dt;
        if (r.ult.time <= 0) impactKoreanHorse(r.ult);
      } else {
        r.ult.hold += dt;
        if (r.ult.hold >= 0.4) r.ult = null;
      }
    }
  }

  function findBrideCharmTarget(source) {
    if (!game) return null;
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy === source || enemy.dead || enemy.charmed) continue;
      const d = Math.hypot(enemy.x - source.x, enemy.y - source.y);
      if (d < bestDist) {
        bestDist = d;
        best = enemy;
      }
    }
    return best;
  }

  function charmBrideEnemy(enemy) {
    if (!game || !enemy || enemy.dead || enemy.type === 'boss' || enemy.charmed) return false;
    const current = game.enemies.find(function (item) {
      return item.uid === game.brideCharmedUid && !item.dead && item.charmed;
    });
    if (current && current !== enemy) {
      addToast('心动契约只能控制一名敌人', 'warn', 1.1);
      return false;
    }
    if (current === enemy) {
      enemy.charmTimer = BRIDE_CONFIG.q.charmDuration;
      return true;
    }
    game.brideCharmedUid = enemy.uid;
    enemy.charmed = true;
    enemy.charmTimer = BRIDE_CONFIG.q.charmDuration;
    enemy.charmTarget = null;
    enemy.attackCd = 0.2;
    enemy.ring = '#ff9fc7';
    enemy.spawnT = 0;
    addRing(enemy.x, enemy.y, enemy.r + 16, '#ffc7dd', 0.5, 3);
    addRing(enemy.x, enemy.y, enemy.r + 28, '#ff6f9e', 0.35, 2);
    addToast('心动契约 · 敌人被魅惑 10 秒', 'good', 1.6);
    audio.play('skill');
    for (let i = 0; i < 16; i += 1) {
      const a = rand(0, TAU);
      spawnParticle(enemy.x, enemy.y, Math.cos(a) * rand(30, 130), Math.sin(a) * rand(30, 130), rand(0.3, 0.7), rand(2, 5), Math.random() < 0.5 ? '#ffc7dd' : '#ff6f9e', true);
    }
    return true;
  }

  function spawnBrideBolt(enemy, target) {
    if (!game || !enemy || !target) return;
    const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
    game.brideProjectiles.push({
      kind: 'charmBolt',
      x: enemy.x, y: enemy.y,
      vx: Math.cos(angle) * 480, vy: Math.sin(angle) * 480,
      life: 1.2, radius: 6, damage: Math.max(1, enemy.damage),
      trail: [{ x: enemy.x, y: enemy.y }],
      dead: false
    });
  }

  function updateCharmedEnemy(enemy, dt) {
    enemy.charmTimer -= dt;
    if (enemy.charmTimer <= 0) {
      game.brideCharmedUid = null;
      enemy.charmed = false;
      enemy.brideKiss = false;
      addRing(enemy.x, enemy.y, enemy.r + 18, '#ffc7dd', 0.55, 3);
      addToast('心动契约结束 · 魅惑敌人消散', 'info', 1.4);
      killEnemy(enemy);
      return;
    }
    let target = findBrideCharmTarget(enemy);
    if (!target) return;
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    enemy.charmTarget = target;
    if (enemy.ranged) {
      if (dist > 260) {
        enemy.x += (dx / dist) * enemy.speed * 0.8 * dt;
        enemy.y += (dy / dist) * enemy.speed * 0.8 * dt;
      }
      if (enemy.attackCd <= 0 && dist <= 470) {
        enemy.attackCd = 1.3;
        spawnBrideBolt(enemy, target);
        enemy.attackFlash = 0.2;
      }
    } else {
      if (dist > enemy.r + target.r + 5) {
        enemy.x += (dx / dist) * enemy.speed * dt;
        enemy.y += (dy / dist) * enemy.speed * dt;
      } else if (enemy.attackCd <= 0) {
        enemy.attackCd = 0.95;
        damageEnemy(target, Math.max(1, enemy.damage * 1.1), {
          critical: false,
          silent: false,
          pushX: (dx / dist) * 24,
          pushY: (dy / dist) * 24
        });
        enemy.attackFlash = 0.2;
        addRing(enemy.x, enemy.y, enemy.r + 9, '#ff9fc7', 0.25, 2);
      }
    }
    clampToMap(enemy);
  }

  function spawnBrideProjectile(kind) {
    if (!game) return;
    const p = game.player;
    const config = kind === 'brideMark' ? BRIDE_CONFIG.e : BRIDE_CONFIG.q;
    const angle = p.aimAngle;
    game.brideProjectiles.push({
      kind: kind,
      x: p.x + Math.cos(angle) * (p.r + 18),
      y: p.y + Math.sin(angle) * (p.r + 18),
      vx: Math.cos(angle) * config.projectileSpeed,
      vy: Math.sin(angle) * config.projectileSpeed,
      life: config.projectileLife,
      radius: config.projectileRadius,
      trail: [{ x: p.x, y: p.y }],
      dead: false
    });
  }

  function createBrideLink(source) {
    if (!game || !source || source.dead) return;
    if (game.brideLink) endBrideLink(false);
    const targets = [source];
    source.brideKiss = true;
    const candidates = game.enemies.filter(function (enemy) {
      return enemy !== source && !enemy.dead && !enemy.charmed;
    }).sort(function (a, b) {
      return Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y);
    });
    for (let i = 0; i < candidates.length && targets.length < BRIDE_CONFIG.e.maxLinks; i += 1) {
      const enemy = candidates[i];
      if (Math.hypot(enemy.x - source.x, enemy.y - source.y) <= BRIDE_CONFIG.e.linkRadius) {
        enemy.brideKiss = true;
        targets.push(enemy);
      }
    }
    game.brideLink = {
      targets: targets,
      time: BRIDE_CONFIG.e.duration,
      duration: BRIDE_CONFIG.e.duration
    };
    game.player.skills.e.active = BRIDE_CONFIG.e.duration;
    addRing(source.x, source.y, BRIDE_CONFIG.e.linkRadius * 0.45, '#ff6f9e', 0.5, 3);
    addToast('命定红线 · 连接 ' + targets.length + ' 名敌人', 'good', 1.5);
    audio.play('skill');
    refreshSkillBar(true);
  }

  function endBrideLink(playEffect) {
    if (!game || !game.brideLink) return;
    const targets = game.brideLink.targets.slice();
    targets.forEach(function (enemy) {
      if (!enemy) return;
      enemy.brideKiss = false;
      if (playEffect) {
        for (let i = 0; i < 6; i += 1) {
          const a = rand(0, TAU);
          spawnParticle(enemy.x, enemy.y, Math.cos(a) * rand(30, 130), Math.sin(a) * rand(30, 130), rand(0.3, 0.7), rand(2, 5), Math.random() < 0.5 ? '#fff5fa' : '#ffc7dd', true);
        }
      }
    });
    game.brideLink = null;
    if (game.player && game.player.skills) game.player.skills.e.active = 0;
    if (playEffect) {
      addRing(targets.length ? targets[0].x : game.player.x, targets.length ? targets[0].y : game.player.y, 60, '#ffffff', 0.35, 2);
      addToast('红线绷断 · 花瓣散落', 'info', 1.2);
    }
    refreshSkillBar(true);
  }

  function updateBrideLink(dt) {
    if (!game || !game.brideLink) return;
    const link = game.brideLink;
    link.time -= dt;
    link.targets = link.targets.filter(function (enemy) {
      return enemy && !enemy.dead && !enemy.charmed;
    });
    link.targets.forEach(function (enemy) { enemy.brideKiss = true; });

    if (link.time > 0 && link.targets.length < BRIDE_CONFIG.e.maxLinks) {
      const candidates = game.enemies.filter(function (enemy) {
        return !enemy.dead && !enemy.charmed && link.targets.indexOf(enemy) === -1;
      });
      let best = null;
      let bestDist = BRIDE_CONFIG.e.linkRadius;
      for (let i = 0; i < link.targets.length; i += 1) {
        const anchor = link.targets[i];
        for (let j = 0; j < candidates.length; j += 1) {
          const d = Math.hypot(candidates[j].x - anchor.x, candidates[j].y - anchor.y);
          if (d < bestDist) {
            bestDist = d;
            best = candidates[j];
          }
        }
      }
      if (best) {
        best.brideKiss = true;
        link.targets.push(best);
        addRing(best.x, best.y, best.r + 10, '#ffc7dd', 0.35, 2);
      }
    }

    if (link.time <= 0 || link.targets.length < 2) {
      endBrideLink(true);
      return;
    }
    if (game.player.skills) game.player.skills.e.active = link.time;
    refreshSkillBar(false);
  }

  function updateBrideProjectiles(dt) {
    if (!game || game.brideProjectiles.length === 0) return;
    for (let i = 0; i < game.brideProjectiles.length; i += 1) {
      const projectile = game.brideProjectiles[i];
      if (projectile.dead) continue;
      projectile.life -= dt;
      const oldX = projectile.x;
      const oldY = projectile.y;
      const nextX = projectile.x + projectile.vx * dt;
      const nextY = projectile.y + projectile.vy * dt;
      projectile.trail.push({ x: nextX, y: nextY });
      if (projectile.trail.length > 8) projectile.trail.shift();
      projectile.x = nextX;
      projectile.y = nextY;
      if (projectile.life <= 0 || nextX < 0 || nextX > MAP.w || nextY < 0 || nextY > MAP.h) {
        projectile.dead = true;
        continue;
      }

      let hit = null;
      if (projectile.kind === 'charmBolt') {
        for (let j = 0; j < game.enemies.length; j += 1) {
          const enemy = game.enemies[j];
          if (enemy.dead || enemy.charmed) continue;
          if (segmentCircleHit(oldX, oldY, nextX, nextY, enemy.x, enemy.y, enemy.r + projectile.radius)) {
            hit = enemy;
            break;
          }
        }
        if (hit) {
          projectile.dead = true;
          damageEnemy(hit, projectile.damage, { critical: false, silent: false });
        }
        continue;
      }

      for (let j = 0; j < game.enemies.length; j += 1) {
        const enemy = game.enemies[j];
        if (enemy.dead || enemy.charmed) continue;
        if (projectile.kind === 'brideMark' && enemy.type === 'boss') continue;
        if (segmentCircleHit(oldX, oldY, nextX, nextY, enemy.x, enemy.y, enemy.r + projectile.radius)) {
          hit = enemy;
          break;
        }
      }

      if (hit) {
        projectile.dead = true;
        if (projectile.kind === 'brideHeart') {
          if (hit.type === 'boss') {
            addToast('Boss 免疫心动契约', 'warn', 1.2);
            audio.play('denied');
          } else {
            charmBrideEnemy(hit);
          }
        } else if (projectile.kind === 'brideMark') {
          createBrideLink(hit);
        }
      }
    }
    game.brideProjectiles = game.brideProjectiles.filter(function (projectile) {
      return !projectile.dead;
    });
  }

  function brideBurnDamage() {
    if (!game || !game.player) return;
    const p = game.player;
    const stats = getWeaponStats(p.weapon);
    const damage = Math.max(1, Math.round(stats.damage * BRIDE_CONFIG.r.burnWeaponScale + (game.stage || 1) * BRIDE_CONFIG.r.burnStageDamage));
    const radius = BRIDE_CONFIG.r.burnRadius;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead || enemy.charmed) continue;
      if (Math.hypot(enemy.x - p.x, enemy.y - p.y) <= radius) {
        damageEnemy(enemy, damage, { critical: false, silent: true });
      }
    }
    if (game.boss && !game.boss.dead &&
        Math.hypot(game.boss.x - p.x, game.boss.y - p.y) <= radius + game.boss.r) {
      damageEnemy(game.boss, damage, { critical: false, silent: true });
    }
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated &&
        Math.hypot(game.eventBoss.x - p.x, game.eventBoss.y - p.y) <= radius + game.eventBoss.r) {
      damageEventBoss(damage, { critical: false });
    }
  }

  function brideDashCollide(startX, startY) {
    if (!game || !game.player || !isBrideForm()) return;
    const p = game.player;
    const e = p.skills.e;
    if (!e.dashing || e.active <= 0) return;
    const stats = getWeaponStats(p.weapon);
    const damage = Math.max(1, Math.round(stats.damage * BRIDE_CONFIG.e.impactWeaponScale + (game.stage || 1) * BRIDE_CONFIG.e.impactStageDamage));
    const interval = BRIDE_CONFIG.e.hitInterval;
    const tryHit = function (enemy, key, isEventBoss) {
      if (!enemy || enemy.dead || enemy.charmed) return;
      if ((e.hitTimers[key] || 0) > 0) return;
      const hit = (startX === p.x && startY === p.y)
        ? Math.hypot(enemy.x - p.x, enemy.y - p.y) <= p.r + enemy.r
        : segmentCircleHit(startX, startY, p.x, p.y, enemy.x, enemy.y, p.r + enemy.r);
      if (!hit) return;
      e.hitTimers[key] = interval;
      damageEnemy(enemy, damage, {
        critical: false,
        silent: true,
        pushX: (enemy.x - p.x) * 0.45,
        pushY: (enemy.y - p.y) * 0.45
      });
      addRing(enemy.x, enemy.y, enemy.r + 10, '#fffaf0', 0.25, 2);
      for (let i = 0; i < 5; i += 1) {
        const a = rand(0, TAU);
        spawnParticle(enemy.x, enemy.y, Math.cos(a) * rand(25, 90), Math.sin(a) * rand(25, 90), rand(0.2, 0.45), rand(2, 4), Math.random() < 0.7 ? '#fffdf7' : '#ffcf66', true);
      }
    };
    for (let i = 0; i < game.enemies.length; i += 1) {
      tryHit(game.enemies[i], game.enemies[i].uid, false);
    }
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated) {
      const boss = game.eventBoss;
      const hit = (startX === p.x && startY === p.y)
        ? Math.hypot(boss.x - p.x, boss.y - p.y) <= p.r + boss.r
        : segmentCircleHit(startX, startY, p.x, p.y, boss.x, boss.y, p.r + boss.r);
      if (hit && (e.hitTimers.eventBoss || 0) <= 0) {
        e.hitTimers.eventBoss = interval;
        damageEventBoss(damage, { critical: false });
        addRing(boss.x, boss.y, boss.r + 10, '#fffaf0', 0.25, 2);
      }
    }
  }

  function castBrideSkill(slot, form, def) {
    if (!game || !game.player || game.player.dead) return false;
    const p = game.player;
    const skills = p.skills;
    if (!skills) return false;

    if (slot === 'q') {
      if (skills.q.cooldown > 0) return false;
      skills.q.cooldown = BRIDE_CONFIG.q.cooldown;
      spawnBrideProjectile('brideHeart');
      addToast('Q · 心动契约', 'good', 1.2);
      pulseSkillSlot('q');
      refreshSkillBar(true);
      return true;
    }

    if (slot === 'e') {
      if (skills.e.active > 0 || skills.e.cooldown > 0 || skills.e.dashing) return false;
      if (game.brideLink) endBrideLink(false);
      skills.e.active = BRIDE_CONFIG.e.duration;
      skills.e.cooldown = BRIDE_CONFIG.e.cooldown;
      skills.e.dashing = true;
      skills.e.invulnBase = p.invuln;
      skills.e.hitTimers = Object.create(null);
      skills.e.trailTimer = 0;
      p.invuln = Math.max(p.invuln, BRIDE_CONFIG.e.duration);
      addRing(p.x, p.y, p.r + 14, '#fffaf0', 0.5, 3);
      addToast('E · 圣羽疾袭 · 移速翻倍 / 无敌 5 秒', 'good', 1.6);
      pulseSkillSlot('e');
      refreshSkillBar(true);
      return true;
    }

    if (slot === 'r') {
      if (skills.r.active > 0 || skills.r.cooldown > 0) return false;
      skills.r.active = BRIDE_CONFIG.r.duration;
      skills.r.cooldown = BRIDE_CONFIG.r.cooldown;
      skills.r.healTimer = BRIDE_CONFIG.r.healInterval;
      skills.r.healTicks = 0;
      skills.r.burnTimer = 0;
      addRing(p.x, p.y, BRIDE_CONFIG.r.burnRadius, '#fff5fa', 0.8, 4);
      addToast('R · 白翼圣临', 'good', 1.5);
      audio.play('skill');
      pulseSkillSlot('r');
      refreshSkillBar(true);
      return true;
    }
    return false;
  }

  function updateBrideSkills(dt) {
    if (!game || !game.player) return;
    const p = game.player;
    const skills = p.skills;
    if (!skills) return;
    const r = skills.r;
    r.cooldown = Math.max(0, r.cooldown - dt);

    const e = skills.e;
    Object.keys(e.hitTimers).forEach(function (key) {
      e.hitTimers[key] = Math.max(0, e.hitTimers[key] - dt);
    });
    if (e.dashing) {
      if (e.active > 0) {
        p.invuln = Math.max(p.invuln, e.active);
        e.trailTimer -= dt;
        if (e.trailTimer <= 0) {
          e.trailTimer = 0.055;
          for (let i = 0; i < 2; i += 1) {
            spawnParticle(
              p.x + rand(-p.r, p.r),
              p.y + rand(-p.r, p.r),
              rand(-35, 35),
              rand(-35, 35),
              rand(0.25, 0.55),
              rand(2, 4),
              Math.random() < 0.7 ? '#fffdf7' : '#ffcf66',
              true
            );
          }
        }
      } else {
        e.dashing = false;
        e.active = 0;
        e.hitTimers = Object.create(null);
        e.trailTimer = 0;
        p.invuln = Math.max(0, e.invulnBase - (BRIDE_CONFIG.e.duration - e.active));
        addRing(p.x, p.y, p.r + 18, '#fffaf0', 0.5, 3);
        addToast('圣羽收拢 · 恢复常态', 'info', 1.3);
        for (let i = 0; i < 12; i += 1) {
          const a = rand(0, TAU);
          spawnParticle(p.x, p.y, Math.cos(a) * rand(30, 150), Math.sin(a) * rand(30, 150), rand(0.3, 0.7), rand(2, 4), Math.random() < 0.7 ? '#fffdf7' : '#ffcf66', true);
        }
        refreshSkillBar(true);
      }
    }

    if (r.active > 0) {
      r.burnTimer -= dt;
      if (r.burnTimer <= 0) {
        r.burnTimer += BRIDE_CONFIG.r.burnInterval;
        brideBurnDamage();
        addRing(p.x, p.y, BRIDE_CONFIG.r.burnRadius, 'rgba(255,245,250,0.32)', 0.35, 2);
        for (let i = 0; i < 5; i += 1) {
          const a = rand(0, TAU);
          spawnParticle(p.x + Math.cos(a) * rand(50, BRIDE_CONFIG.r.burnRadius), p.y + Math.sin(a) * rand(50, BRIDE_CONFIG.r.burnRadius), rand(-20, 20), rand(-60, -10), rand(0.3, 0.8), rand(2, 5), Math.random() < 0.5 ? '#fff5fa' : '#ffcf66', true);
        }
      }
      r.healTimer -= dt;
      if (r.healTimer <= 0 && r.healTicks < 4) {
        healPlayer(BRIDE_CONFIG.r.healAmount, false);
        r.healTicks += 1;
        r.healTimer += BRIDE_CONFIG.r.healInterval;
      }
      r.active -= dt;
      if (r.active <= 0) {
        r.active = 0;
        r.healTimer = 0;
        r.burnTimer = 0;
        addRing(p.x, p.y, BRIDE_CONFIG.r.burnRadius * 0.8, '#fffaf0', 0.6, 3);
        addToast('白翼收拢 · 圣焰消散', 'info', 1.4);
        for (let i = 0; i < 14; i += 1) {
          const a = rand(0, TAU);
          spawnParticle(p.x, p.y, Math.cos(a) * rand(60, 230), Math.sin(a) * rand(60, 230), rand(0.4, 1.0), rand(2, 5), Math.random() < 0.72 ? '#fffaf0' : '#ffcf66', true);
        }
        refreshSkillBar(true);
      }
    }
  }

  function getNunCooldowns(subform) {
    if (!game || !game.player || !game.player.skills) return { q: 0, e: 0 };
    return game.player.skills.nunCooldowns[subform || getNunSubform()];
  }

  function switchNunForm(nextForm, silent) {
    if (!game || !game.player || !game.player.skills) return;
    const p = game.player;
    const skills = p.skills;
    const target = nextForm === 'fire' ? 'fire' : 'demon';
    skills.nunForm = target;
    skills.q.active = 0;
    skills.e.active = 0;
    skills.r.active = 0;
    skills.nunSwing = 0;
    skills.nunAttack = { phase: 'idle', time: 0, angle: 0, damage: 0, qActive: false, hit: false };
    skills.q.cooldown = skills.nunCooldowns[target].q;
    skills.e.cooldown = skills.nunCooldowns[target].e;
    game.nunSwords = [];
    game.nunTentacle = null;
    game.nunBullets = [];
    game.nunGreatSwords = [];
    game.nunOrbs = [];
    game.nunUltimate = null;
    p.reloading = false;
    p.shootCd = Math.min(p.shootCd, getWeaponStats(p.weapon).fireInterval);
    if (!silent) {
      addToast(target === 'fire' ? '双生魔女 · 火焰形态' : '双生魔女 · 恶魔形态', 'info', 1.5);
    }
    refreshSkillBar(true);
    refreshStatsPanel(true);
  }

  function nunMeleeAttack() {
    if (!game || !game.player || game.player.dead || !isNunFireForm()) return;
    const p = game.player;
    if (p.shootCd > 0) return;
    const stats = getWeaponStats(p.weapon);
    const q = p.skills.q;
    const qActive = q.active > 0;
    const speedMult = qActive ? NUN_CONFIG.fireQ.attackSpeedMultiplier : 1;
    const interval = Math.max(0.05, stats.fireInterval / speedMult);
    p.shootCd = interval;
    const extra = qActive
      ? NUN_CONFIG.fireQ.bonusDamage + NUN_CONFIG.fireQ.bonusPerStage * (game.stage || 1)
      : 0;
    const damage = stats.damage * NUN_CONFIG.fireMelee.fireDamageMult + extra;
    const duration = Math.min(0.24, Math.max(0.07, interval * 0.72));
    p.skills.nunAttack = {
      phase: 'windup',
      time: duration * 0.26,
      total: duration,
      angle: p.aimAngle,
      damage: damage,
      qActive: qActive,
      hit: false
    };
    p.skills.nunSwing = 1;
  }

  function blockNunEnemyBullet(bullet) {
    if (!game || !bullet || bullet.dead) return false;
    bullet.dead = true;
    addRing(bullet.x, bullet.y, 12, '#ff7a3d', 0.18, 2);
    for (let i = 0; i < 6; i += 1) {
      const a = rand(0, TAU);
      spawnParticle(bullet.x, bullet.y, Math.cos(a) * rand(30, 120), Math.sin(a) * rand(30, 120), rand(0.14, 0.3), rand(2, 4), Math.random() < 0.55 ? '#ffb15c' : '#ff4b2b', true);
    }
    return true;
  }

  function resolveNunMeleeHit(angle, damage, qActive) {
    if (!game || !game.player || game.player.dead) return;
    const p = game.player;
    const range = NUN_CONFIG.fireMelee.fireRange;
    const halfArc = NUN_CONFIG.fireMelee.fireArc * 0.5;
    // The block is tied to the exact slash hit frame, using the same arc as the sword.
    for (let i = 0; i < game.enemyBullets.length; i += 1) {
      const bullet = game.enemyBullets[i];
      if (!bullet || bullet.dead) continue;
      const d = Math.hypot(bullet.x - p.x, bullet.y - p.y);
      if (d > range + bullet.radius) continue;
      let diff = Math.atan2(bullet.y - p.y, bullet.x - p.x) - angle;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      if (Math.abs(diff) <= halfArc + bullet.radius / Math.max(20, d)) {
        blockNunEnemyBullet(bullet);
      }
    }
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead || enemy.charmed) continue;
      const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (d > range + enemy.r) continue;
      let diff = Math.atan2(enemy.y - p.y, enemy.x - p.x) - angle;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      if (Math.abs(diff) > halfArc) continue;
      damageEnemy(enemy, damage, {
        critical: false,
        silent: false,
        pushX: (enemy.x - p.x) * 0.18,
        pushY: (enemy.y - p.y) * 0.18
      });
      addRing(enemy.x, enemy.y, enemy.r + 8, qActive ? '#ff7048' : '#e04a57', 0.22, 2);
    }
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated) {
      const boss = game.eventBoss;
      const d = Math.hypot(boss.x - p.x, boss.y - p.y);
      let diff = Math.atan2(boss.y - p.y, boss.x - p.x) - angle;
      while (diff > Math.PI) diff -= TAU;
      while (diff < -Math.PI) diff += TAU;
      if (d <= range + boss.r && Math.abs(diff) <= halfArc) damageEventBoss(damage, { critical: false });
    }
    for (let i = 0; i < 8; i += 1) {
      const a = angle + rand(-halfArc, halfArc);
      spawnParticle(p.x + Math.cos(a) * rand(20, 110), p.y + Math.sin(a) * rand(20, 110), Math.cos(a) * rand(60, 200), Math.sin(a) * rand(60, 200), rand(0.16, 0.38), rand(2, 5), qActive ? '#ffb15c' : '#ff5a32', true);
    }
    audio.play('shoot_pistol');
  }

  function spawnNunSwords() {
    if (!game) return;
    const count = NUN_CONFIG.q.swordCount;
    game.nunSwords = [];
    for (let i = 0; i < count; i += 1) {
      const orbitAngle = (i / count) * TAU;
      game.nunSwords.push({
        angle: orbitAngle,
        orbitAngle: orbitAngle,
        orbit: NUN_CONFIG.q.swordOrbit,
        attackTimer: rand(0, 0.3),
        target: null,
        swing: 0,
        state: 'orbit',
        hit: false,
        x: game.player.x + Math.cos(orbitAngle) * NUN_CONFIG.q.swordOrbit,
        y: game.player.y + Math.sin(orbitAngle) * NUN_CONFIG.q.swordOrbit,
        angleToTarget: 0,
        trailTimer: 0
      });
    }
  }

  function findNunTarget(source, range) {
    if (!game) return null;
    let best = null;
    let bestDist = range;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead || enemy.charmed) continue;
      const d = Math.hypot(enemy.x - source.x, enemy.y - source.y);
      if (d < bestDist) {
        bestDist = d;
        best = enemy;
      }
    }
    return best;
  }

  function updateNunSwords(dt) {
    if (!game || !game.nunSwords.length) return;
    const p = game.player;
    const stats = getWeaponStats(p.weapon);
    const damage = stats.damage * NUN_CONFIG.q.weaponScale + (game.stage || 1) * NUN_CONFIG.q.stageDamage;
    for (let i = 0; i < game.nunSwords.length; i += 1) {
      const sword = game.nunSwords[i];
      sword.swing = Math.max(0, sword.swing - dt * 3.5);
      sword.trailTimer -= dt;
      if (sword.state === 'orbit') {
        sword.orbitAngle += dt * 0.9;
        sword.x = p.x + Math.cos(sword.orbitAngle) * sword.orbit;
        sword.y = p.y + Math.sin(sword.orbitAngle) * sword.orbit;
        sword.attackTimer -= dt;
        if (sword.target && (sword.target.dead || sword.target.charmed ||
            Math.hypot(sword.target.x - p.x, sword.target.y - p.y) > NUN_CONFIG.q.swordRange)) {
          sword.target = null;
        }
        if (!sword.target) sword.target = findNunTarget(p, NUN_CONFIG.q.swordRange);
        if (sword.target && sword.attackTimer <= 0) {
          sword.state = 'outbound';
          sword.hit = false;
          sword.swing = 1;
          sword.angleToTarget = Math.atan2(sword.target.y - sword.y, sword.target.x - sword.x);
        }
      } else if (sword.state === 'outbound') {
        const target = sword.target;
        if (!target || target.dead || target.charmed ||
            Math.hypot(target.x - p.x, target.y - p.y) > NUN_CONFIG.q.swordRange * 1.45) {
          sword.state = 'return';
          sword.target = null;
          continue;
        }
        const dx = target.x - sword.x;
        const dy = target.y - sword.y;
        const dist = Math.hypot(dx, dy);
        sword.angleToTarget = Math.atan2(dy, dx);
        if (dist <= target.r + 18) {
          if (!sword.hit) {
            sword.hit = true;
            damageEnemy(target, damage, {
              critical: false,
              silent: false,
              pushX: Math.cos(sword.angleToTarget) * 30,
              pushY: Math.sin(sword.angleToTarget) * 30
            });
            addRing(target.x, target.y, target.r + 14, '#a56bff', 0.28, 3);
            for (let k = 0; k < 8; k += 1) {
              const a = sword.angleToTarget + rand(-0.8, 0.8);
              spawnParticle(target.x, target.y, Math.cos(a) * rand(30, 130), Math.sin(a) * rand(30, 130), rand(0.18, 0.4), rand(2, 5), '#b983ff', true);
            }
            addShake(2);
          }
          sword.state = 'return';
          sword.target = null;
        } else {
          const step = Math.min(dist, NUN_CONFIG.q.flightSpeed * dt);
          sword.x += (dx / dist) * step;
          sword.y += (dy / dist) * step;
        }
      } else {
        const dx = p.x - sword.x;
        const dy = p.y - sword.y;
        const dist = Math.hypot(dx, dy);
        sword.angleToTarget = Math.atan2(dy, dx);
        if (dist <= p.r + 20) {
          sword.state = 'orbit';
          sword.hit = false;
          sword.attackTimer = NUN_CONFIG.q.attackInterval;
          sword.orbitAngle = Math.atan2(sword.y - p.y, sword.x - p.x);
          sword.x = p.x + Math.cos(sword.orbitAngle) * sword.orbit;
          sword.y = p.y + Math.sin(sword.orbitAngle) * sword.orbit;
        } else {
          const step = Math.min(dist, NUN_CONFIG.q.returnSpeed * dt);
          sword.x += (dx / dist) * step;
          sword.y += (dy / dist) * step;
        }
      }
      if (sword.state !== 'orbit' && sword.trailTimer <= 0) {
        sword.trailTimer = 0.035;
        spawnParticle(sword.x, sword.y, rand(-20, 20), rand(-20, 20), rand(0.16, 0.3), rand(2, 4), '#a56bff', true);
      }
    }
  }

  function spawnNunTentacle() {
    if (!game) return;
    game.nunTentacle = {
      x: game.player.x,
      y: game.player.y,
      r: 38,
      time: NUN_CONFIG.e.duration,
      attackTimer: 0.5,
      phase: 'idle',
      phaseTime: 0,
      target: null,
      hit: false,
      slamX: game.player.x,
      slamY: game.player.y,
      hp: NUN_CONFIG.e.tentacleHp,
      hitFlash: 0
    };
  }

  function damageNunTentacle(amount) {
    if (!game || !game.nunTentacle) return;
    const t = game.nunTentacle;
    t.hp -= Math.max(1, amount);
    t.hitFlash = 0.18;
    if (t.hp <= 0) {
      addRing(t.x, t.y, 40, '#8f4fff', 0.5, 3);
      game.nunTentacle = null;
    }
  }

  function updateNunTentacle(dt) {
    if (!game || !game.nunTentacle) return;
    const t = game.nunTentacle;
    const p = game.player;
    t.time -= dt;
    t.hitFlash = Math.max(0, t.hitFlash - dt);
    t.attackTimer -= dt;
    if (t.target && (t.target.dead || t.target.charmed)) t.target = null;
    if (!t.target) t.target = findNunTarget(t, NUN_CONFIG.e.attackRange);
    if (t.phase === 'idle' && t.target && t.attackTimer <= 0) {
      t.phase = 'raise';
      t.phaseTime = 0.36;
      t.hit = false;
    } else if (t.phase === 'raise') {
      t.phaseTime -= dt;
      if (t.phaseTime <= 0) {
        t.phase = 'slam';
        t.phaseTime = 0.16;
        if (t.target && !t.target.dead && !t.target.charmed) {
          t.slamX = t.target.x;
          t.slamY = t.target.y;
          const d = Math.hypot(t.target.x - t.x, t.target.y - t.y);
          const stats = getWeaponStats(p.weapon);
          const damage = stats.damage * NUN_CONFIG.e.weaponScale + (game.stage || 1) * NUN_CONFIG.e.stageDamage;
          if (d <= NUN_CONFIG.e.attackRange) {
            const slamX = t.target.x;
            const slamY = t.target.y;
            for (let i = 0; i < game.enemies.length; i += 1) {
              const enemy = game.enemies[i];
              if (enemy.dead || enemy.charmed) continue;
              if (Math.hypot(enemy.x - slamX, enemy.y - slamY) <= 90 + enemy.r) {
                damageEnemy(enemy, damage, { critical: false, silent: false });
              }
            }
            if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated &&
                Math.hypot(game.eventBoss.x - slamX, game.eventBoss.y - slamY) <= 90 + game.eventBoss.r) {
              damageEventBoss(damage, { critical: false });
            }
            addRing(slamX, slamY, 90, '#8f4fff', 0.35, 3);
          }
        }
        audio.play('explosion');
      }
    } else if (t.phase === 'slam') {
      t.phaseTime -= dt;
      if (t.phaseTime <= 0) {
        t.phase = 'recover';
        t.phaseTime = 0.45;
      }
    } else if (t.phase === 'recover') {
      t.phaseTime -= dt;
      if (t.phaseTime <= 0) {
        t.phase = 'idle';
        t.attackTimer = NUN_CONFIG.e.attackInterval;
      }
    }
    if (t.time <= 0) game.nunTentacle = null;
  }

  function spawnNunOrb(x, y) {
    if (!game) return;
    game.nunOrbs.push({ x: x, y: y, time: 12, phase: rand(0, TAU), dead: false });
  }

  function updateNunOrbs(dt) {
    if (!game) return;
    const p = game.player;
    for (let i = 0; i < game.nunOrbs.length; i += 1) {
      const orb = game.nunOrbs[i];
      if (orb.dead) continue;
      orb.time -= dt;
      const dx = p.x - orb.x;
      const dy = p.y - orb.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d <= p.r + 13) {
        healPlayer(NUN_CONFIG.fireE.healPerOrb, false);
        addRing(orb.x, orb.y, 8, '#ff4f6d', 0.25, 2);
        orb.dead = true;
      } else {
        const speed = NUN_CONFIG.fireE.orbSpeed;
        orb.x += (dx / d) * speed * dt;
        orb.y += (dy / d) * speed * dt;
      }
      if (orb.time <= 0) orb.dead = true;
    }
    game.nunOrbs = game.nunOrbs.filter(function (orb) { return !orb.dead; });
  }

  function fireNunDemonWave() {
    if (!game || !game.nunUltimate) return;
    const p = game.player;
    const stats = getWeaponStats(p.weapon);
    const count = NUN_CONFIG.r.bulletsPerWave;
    const offset = rand(0, TAU);
    for (let i = 0; i < count; i += 1) {
      const angle = offset + (i / count) * TAU;
      game.nunBullets.push({
        x: p.x + Math.cos(angle) * (p.r + 10),
        y: p.y + Math.sin(angle) * (p.r + 10),
        vx: Math.cos(angle) * NUN_CONFIG.r.bulletSpeed,
        vy: Math.sin(angle) * NUN_CONFIG.r.bulletSpeed,
        life: NUN_CONFIG.r.bulletLife,
        radius: 5,
        damage: stats.damage,
        dead: false
      });
    }
    addRing(p.x, p.y, p.r + 18, '#9b5cff', 0.2, 2);
  }

  function updateNunBullets(dt) {
    if (!game || !game.nunBullets.length) return;
    for (let i = 0; i < game.nunBullets.length; i += 1) {
      const bullet = game.nunBullets[i];
      if (bullet.dead) continue;
      bullet.life -= dt;
      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;
      if (bullet.life <= 0 || bullet.x < 0 || bullet.x > MAP.w || bullet.y < 0 || bullet.y > MAP.h) {
        bullet.dead = true;
        continue;
      }
      for (let j = 0; j < game.enemies.length; j += 1) {
        const enemy = game.enemies[j];
        if (enemy.dead || enemy.charmed) continue;
        if (Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y) <= enemy.r + bullet.radius) {
          damageEnemy(enemy, bullet.damage, { critical: false, silent: true });
          addRing(bullet.x, bullet.y, 8, '#b983ff', 0.2, 2);
          bullet.dead = true;
          break;
        }
      }
      if (!bullet.dead && game.eventBossActive && game.eventBoss && !game.eventBoss.defeated) {
        const boss = game.eventBoss;
        if (Math.hypot(boss.x - bullet.x, boss.y - bullet.y) <= boss.r + bullet.radius) {
          damageEventBoss(bullet.damage, { critical: false });
          bullet.dead = true;
        }
      }
    }
    game.nunBullets = game.nunBullets.filter(function (bullet) { return !bullet.dead; });
  }

  function spawnNunGreatSwords() {
    if (!game) return;
    game.nunGreatSwords = [];
    for (let i = 0; i < NUN_CONFIG.fireR.swordCount; i += 1) {
      game.nunGreatSwords.push({
        angle: (i / NUN_CONFIG.fireR.swordCount) * TAU,
        hitTimers: Object.create(null),
        flash: 0
      });
    }
  }

  function updateNunGreatSwords(dt) {
    if (!game || !game.nunGreatSwords.length) return;
    const p = game.player;
    const stage = game.stage || 1;
    const damage = NUN_CONFIG.fireR.stageDamage * stage;
    for (let i = 0; i < game.nunGreatSwords.length; i += 1) {
      const sword = game.nunGreatSwords[i];
      sword.angle += dt * 2.0;
      sword.flash = Math.max(0, sword.flash - dt);
      Object.keys(sword.hitTimers).forEach(function (key) {
        sword.hitTimers[key] = Math.max(0, sword.hitTimers[key] - dt);
      });
      const baseX = p.x + Math.cos(sword.angle) * NUN_CONFIG.fireR.swordOrbit;
      const baseY = p.y + Math.sin(sword.angle) * NUN_CONFIG.fireR.swordOrbit;
      const dirX = Math.cos(sword.angle);
      const dirY = Math.sin(sword.angle);
      const backX = baseX - dirX * NUN_CONFIG.fireR.swordBack;
      const backY = baseY - dirY * NUN_CONFIG.fireR.swordBack;
      const tipX = baseX + dirX * NUN_CONFIG.fireR.swordReach;
      const tipY = baseY + dirY * NUN_CONFIG.fireR.swordReach;
      for (let j = 0; j < game.enemies.length; j += 1) {
        const enemy = game.enemies[j];
        if (enemy.dead || enemy.charmed) continue;
        if ((sword.hitTimers[enemy.uid] || 0) > 0) continue;
        if (segmentCircleHit(backX, backY, tipX, tipY, enemy.x, enemy.y, enemy.r + 14)) {
          sword.hitTimers[enemy.uid] = NUN_CONFIG.fireR.hitInterval;
          sword.flash = 0.15;
          damageEnemy(enemy, damage, { critical: false, silent: false });
          addRing(enemy.x, enemy.y, enemy.r + 14, '#ff4b37', 0.25, 3);
        }
      }
      if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated) {
        const boss = game.eventBoss;
        const key = 'eventBoss';
        if ((sword.hitTimers[key] || 0) <= 0 &&
            segmentCircleHit(backX, backY, tipX, tipY, boss.x, boss.y, boss.r + 14)) {
          sword.hitTimers[key] = NUN_CONFIG.fireR.hitInterval;
          damageEventBoss(damage, { critical: false });
        }
      }
      // Block enemy bullets against the sword's actual rotating blade segment.
      for (let j = 0; j < game.enemyBullets.length; j += 1) {
        const bullet = game.enemyBullets[j];
        if (!bullet || bullet.dead) continue;
        if (segmentCircleHit(backX, backY, tipX, tipY, bullet.x, bullet.y, bullet.radius + 12)) {
          blockNunEnemyBullet(bullet);
        }
      }
    }
  }

  function castNunSkill(slot, form, def) {
    if (!game || !game.player || game.player.dead) return false;
    const p = game.player;
    const skills = p.skills;
    if (!skills) return false;
    const sub = getNunSubform();
    const cd = skills.nunCooldowns[sub];
    if (slot === 'q') {
      if (skills.q.active > 0 || cd.q > 0) return false;
      skills.q.active = def.duration;
      cd.q = def.cooldown;
      skills.q.cooldown = def.cooldown;
      if (sub === 'demon') spawnNunSwords();
      addToast(sub === 'demon' ? 'Q · 三魔剑' : 'Q · 烈焰狂舞', 'good', 1.3);
      pulseSkillSlot('q');
      refreshSkillBar(true);
      return true;
    }
    if (slot === 'e') {
      if (skills.e.active > 0 || cd.e > 0) return false;
      skills.e.active = def.duration;
      cd.e = def.cooldown;
      skills.e.cooldown = def.cooldown;
      if (sub === 'demon') spawnNunTentacle();
      addToast(sub === 'demon' ? 'E · 深渊触手' : 'E · 血焰收割', 'good', 1.3);
      pulseSkillSlot('e');
      refreshSkillBar(true);
      return true;
    }
    if (slot === 'r') {
      if (skills.r.active > 0 || skills.r.cooldown > 0) return false;
      skills.r.cooldown = def.cooldown;
      if (sub === 'demon') {
        skills.q.active = 0;
        skills.e.active = 0;
        game.nunSwords = [];
        game.nunTentacle = null;
        game.nunBullets = [];
        game.nunUltimate = {
          form: 'demon',
          time: NUN_CONFIG.r.waves * NUN_CONFIG.r.waveInterval + 0.55,
          waveTimer: 0,
          wavesFired: 0
        };
        skills.r.active = game.nunUltimate.time;
        addToast('R · 魔剑轮舞', 'good', 1.4);
      } else {
        skills.q.active = 0;
        skills.e.active = 0;
        game.nunOrbs = [];
        game.nunUltimate = { form: 'fire', time: NUN_CONFIG.fireR.duration };
        skills.r.active = NUN_CONFIG.fireR.duration;
        spawnNunGreatSwords();
        addToast('R · 三界巨剑', 'good', 1.4);
      }
      audio.play('boss_warn');
      pulseSkillSlot('r');
      refreshSkillBar(true);
      return true;
    }
    return false;
  }

  function updateNunSkills(dt) {
    if (!game || !game.player || !isNunForm()) return;
    const p = game.player;
    const skills = p.skills;
    const sub = skills.nunForm;
    const cd = skills.nunCooldowns[sub];
    Object.keys(skills.nunCooldowns).forEach(function (key) {
      skills.nunCooldowns[key].q = Math.max(0, skills.nunCooldowns[key].q - dt);
      skills.nunCooldowns[key].e = Math.max(0, skills.nunCooldowns[key].e - dt);
    });
    skills.q.cooldown = cd.q;
    skills.e.cooldown = cd.e;
    skills.r.cooldown = Math.max(0, skills.r.cooldown - dt);
    skills.nunSwing = Math.max(0, skills.nunSwing - dt * 5);

    const attack = skills.nunAttack;
    if (attack && attack.phase !== 'idle') {
      attack.time -= dt;
      if (attack.phase === 'windup' && attack.time <= 0) {
        attack.phase = 'slash';
        attack.time = attack.total * 0.2;
        if (!attack.hit) {
          attack.hit = true;
          resolveNunMeleeHit(attack.angle, attack.damage, attack.qActive);
        }
        skills.nunSwing = 1;
      } else if (attack.phase === 'slash' && attack.time <= 0) {
        attack.phase = 'recover';
        attack.time = attack.total * 0.54;
      } else if (attack.phase === 'recover' && attack.time <= 0) {
        attack.phase = 'idle';
        attack.time = 0;
      }
    }

    updateNunOrbs(dt);
    updateNunBullets(dt);

    if (sub === 'demon') {
      if (skills.q.active > 0) updateNunSwords(dt);
      else game.nunSwords = [];
      if (game.nunTentacle) updateNunTentacle(dt);
      if (skills.e.active <= 0) game.nunTentacle = null;
      if (skills.r.active > 0 && game.nunUltimate && game.nunUltimate.form === 'demon') {
        const ult = game.nunUltimate;
        ult.time -= dt;
        ult.waveTimer -= dt;
        if (ult.wavesFired < NUN_CONFIG.r.waves && ult.waveTimer <= 0) {
          fireNunDemonWave();
          ult.wavesFired += 1;
          ult.waveTimer = NUN_CONFIG.r.waveInterval;
        }
        skills.r.active = Math.max(0, ult.time);
        if (ult.time <= 0) {
          switchNunForm('fire');
        }
      }
    } else {
      game.nunSwords = [];
      game.nunTentacle = null;
      if (skills.r.active > 0 && game.nunUltimate && game.nunUltimate.form === 'fire') {
        const ult = game.nunUltimate;
        ult.time -= dt;
        skills.r.active = Math.max(0, ult.time);
        updateNunGreatSwords(dt);
        if (ult.time <= 0) {
          switchNunForm('demon');
        }
      }
    }
  }

  function findSafeSkillPosition(originX, originY, radius, ignoreEnemy, avoidPlayer) {
    if (!game) return null;
    const p = game.player;
    const margin = radius + 14;
    const baseX = clamp(originX, margin, MAP.w - margin);
    const baseY = clamp(originY, margin, MAP.h - margin);
    const rings = [0, 28, 56, 90, 130, 180, 240];
    const steps = 16;

    function isFree(x, y) {
      if (x < margin || x > MAP.w - margin || y < margin || y > MAP.h - margin) return false;
      if (avoidPlayer && p && !p.dead && Math.hypot(x - p.x, y - p.y) < p.r + radius + 18) return false;
      for (let i = 0; i < game.enemies.length; i += 1) {
        const enemy = game.enemies[i];
        if (enemy.dead || enemy === ignoreEnemy) continue;
        if (Math.hypot(x - enemy.x, y - enemy.y) < enemy.r + radius + 10) return false;
      }
      if (game.boss && !game.boss.dead &&
          Math.hypot(x - game.boss.x, y - game.boss.y) < game.boss.r + radius + 16) {
        return false;
      }
      if (game.eventBossActive && game.eventBoss && !game.eventBoss.dead &&
          Math.hypot(x - game.eventBoss.x, y - game.eventBoss.y) < game.eventBoss.r + radius + 16) {
        return false;
      }
      return true;
    }

    for (let ringIndex = 0; ringIndex < rings.length; ringIndex += 1) {
      const ring = rings[ringIndex];
      for (let step = 0; step < steps; step += 1) {
        const angle = (step / steps) * TAU;
        const x = clamp(baseX + Math.cos(angle) * ring, margin, MAP.w - margin);
        const y = clamp(baseY + Math.sin(angle) * ring, margin, MAP.h - margin);
        if (isFree(x, y)) return { x: x, y: y };
      }
    }
    return null;
  }

  function spawnContractProjectile(def) {
    if (!game) return null;
    const p = game.player;
    const angle = p.aimAngle;
    const x = p.x + Math.cos(angle) * (p.r + 18);
    const y = p.y + Math.sin(angle) * (p.r + 18);
    const projectile = {
      kind: 'contract',
      x: x,
      y: y,
      vx: Math.cos(angle) * def.contractSpeed,
      vy: Math.sin(angle) * def.contractSpeed,
      radius: def.contractRadius,
      life: def.contractLife,
      maxLife: def.contractLife,
      angle: angle,
      spin: rand(0, TAU),
      dead: false,
      trail: [{ x: x, y: y }]
    };
    game.skillProjectiles.push(projectile);
    return projectile;
  }

  function updateSkillProjectiles(dt) {
    if (!game || !game.skillProjectiles || game.skillProjectiles.length === 0) return;
    const p = game.player;
    const def = getFormSkill('e', 'edg2026');
    if (!def) return;

    for (let i = 0; i < game.skillProjectiles.length; i += 1) {
      const projectile = game.skillProjectiles[i];
      if (projectile.dead) continue;
      projectile.life -= dt;
      const oldX = projectile.x;
      const oldY = projectile.y;
      const nextX = projectile.x + projectile.vx * dt;
      const nextY = projectile.y + projectile.vy * dt;
      projectile.trail.push({ x: nextX, y: nextY });
      if (projectile.trail.length > 10) projectile.trail.shift();

      if (projectile.life <= 0 || nextX < 0 || nextX > MAP.w || nextY < 0 || nextY > MAP.h) {
        projectile.dead = true;
        continue;
      }

      let hit = null;
      for (let j = 0; j < game.enemies.length; j += 1) {
        const enemy = game.enemies[j];
        if (enemy.dead || enemy.type !== 'normal' || enemy.transferMark) continue;
        if (segmentCircleHit(oldX, oldY, nextX, nextY, enemy.x, enemy.y, enemy.r + projectile.radius)) {
          hit = enemy;
          break;
        }
      }

      if (hit) {
        const aimX = p.x + Math.cos(p.aimAngle) * def.teleportAimDistance;
        const aimY = p.y + Math.sin(p.aimAngle) * def.teleportAimDistance;
        const safe = findSafeSkillPosition(aimX, aimY, hit.r, hit, true);
        projectile.dead = true;
        if (!safe) {
          addToast('转会窗口被占满，合同失效', 'warn', 1.5);
          continue;
        }

        hit.x = safe.x;
        hit.y = safe.y;
        hit.pushX = 0;
        hit.pushY = 0;
        hit.attackCd = Math.max(hit.attackCd, 0.9);
        if (hit.shootCd) hit.shootCd = Math.max(hit.shootCd, 0.9);
        hit.transferMark = {
          time: def.markDuration,
          explodeIn: def.explosionDelay,
          exploded: false,
          damage: def.explosionDamage,
          radius: def.explosionRadius
        };
        game.player.skills.e.active = Math.max(game.player.skills.e.active, def.markDuration);
        addRing(hit.x, hit.y, hit.r + 14, '#ffcf66', 0.5, 3);
        addToast('恭喜你，已成功签约 EDG！', 'good', 1.8);
        audio.play('skill');
        refreshSkillBar(true);
        refreshStatsPanel(true);
      } else {
        projectile.x = nextX;
        projectile.y = nextY;
      }
    }

    game.skillProjectiles = game.skillProjectiles.filter(function (projectile) {
      return !projectile.dead;
    });
  }

  function explodeTransfer(sourceEnemy, mark) {
    if (!game || !sourceEnemy || sourceEnemy.dead || !mark || mark.exploded) return;
    mark.exploded = true;
    const x = sourceEnemy.x;
    const y = sourceEnemy.y;
    const beforeKills = game.kills;

    addRing(x, y, mark.radius, '#ff5a48', 0.55, 4);
    addRing(x, y, mark.radius * 0.55, '#ffcf66', 0.4, 2);
    addShake(7);
    audio.play('explosion');
    for (let i = 0; i < 28; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(40, 260);
      spawnParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(0.2, 0.65),
        rand(2, 7),
        Math.random() < 0.5 ? '#ff5a48' : '#ffcf66',
        true
      );
    }

    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead || enemy === sourceEnemy) continue;
      const distance = Math.hypot(enemy.x - x, enemy.y - y);
      if (distance > mark.radius + enemy.r) continue;
      damageEnemy(enemy, mark.damage, {
        critical: false,
        pushX: ((enemy.x - x) / Math.max(1, distance)) * 90,
        pushY: ((enemy.y - y) / Math.max(1, distance)) * 90
      });
    }
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.dead) {
      const bossDistance = Math.hypot(game.eventBoss.x - x, game.eventBoss.y - y);
      if (bossDistance <= mark.radius + game.eventBoss.r) {
        damageEventBoss(mark.damage, { critical: false });
      }
    }

    addToast('合同到期，双方友好解约。', 'good', 1.8);
    if (game.kills - beforeKills >= 10) {
      addToast('这波转会，血赚！', 'good', 2.4);
    }
    refreshStatsPanel(true);
  }

  function updateTransferMarks(dt) {
    if (!game) return;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      const mark = enemy.transferMark;
      if (!mark) continue;
      if (enemy.dead) {
        enemy.transferMark = null;
        continue;
      }
      mark.time = Math.max(0, mark.time - dt);
      if (!mark.exploded) {
        mark.explodeIn -= dt;
        if (mark.explodeIn <= 0) explodeTransfer(enemy, mark);
      }
      if (mark.time <= 0) enemy.transferMark = null;
    }
  }

  function startChampionRecord(def) {
    const p = game.player;
    const r = p.skills.r;
    if (r.cooldown > 0 || r.phase !== 'idle') return false;
    r.cooldown = def.cooldown;
    r.phase = 'recording';
    r.recordRemaining = def.recordDuration;
    r.windowRemaining = 0;
    r.snapshot = {
      x: p.x,
      y: p.y,
      hp: p.hp,
      maxHp: p.maxHp,
      kills: game.kills,
      time: game.time
    };
    addToast('我们认为，刚才那场比赛存在重新开始的必要。', 'warn', 2.2);
    addRing(p.x, p.y, p.r + 12, '#ffcf66', 0.6, 3);
    audio.play('skill');
    pulseSkillSlot('r');
    refreshSkillBar(true);
    refreshStatsPanel(true);
    return true;
  }

  function executeChampionRewind() {
    if (!game || state !== S.PLAYING || !game.player || game.player.dead) return false;
    const p = game.player;
    const r = p.skills.r;
    if (r.phase !== 'confirm' || !r.snapshot) return false;
    const snapshot = r.snapshot;
    const safe = findSafeSkillPosition(snapshot.x, snapshot.y, p.r, null, false);
    if (!safe) {
      addToast('回溯位置被占据，复核失败', 'warn', 1.6);
      r.phase = 'idle';
      r.snapshot = null;
      refreshSkillBar(true);
      return false;
    }

    p.x = safe.x;
    p.y = safe.y;
    p.hp = Math.min(snapshot.hp, p.maxHp);
    p.dashTime = 0;
    p.invuln = Math.max(p.invuln, 0.35);
    const killsDuringRecord = game.kills - snapshot.kills;
    r.phase = 'idle';
    r.windowRemaining = 0;
    r.snapshot = null;

    addRing(p.x, p.y, p.r + 16, '#ffcf66', 0.7, 4);
    for (let i = 0; i < 24; i += 1) {
      const angle = rand(0, TAU);
      spawnParticle(
        p.x + Math.cos(angle) * rand(10, 40),
        p.y + Math.sin(angle) * rand(10, 40),
        Math.cos(angle) * rand(40, 180),
        Math.sin(angle) * rand(40, 180),
        rand(0.2, 0.55),
        rand(2, 6),
        Math.random() < 0.5 ? '#ffcf66' : '#ff5a6d',
        true
      );
    }
    addToast('比赛结果已提交复核。', 'good', 2.2);
    if (killsDuringRecord >= 10) {
      addToast('虽然止步十六强，但这波操作可以进集锦。', 'good', 2.8);
    }
    audio.play('skill');
    pulseSkillSlot('r');
    refreshSkillBar(true);
    refreshStatsPanel(true);
    return true;
  }

  function castChampionSkill(slot, form, def) {
    if (!game || state !== S.PLAYING || !game.player || game.player.dead) return false;
    const p = game.player;
    const skills = p.skills;

    if (slot === 'q') {
      if (skills.q.active > 0 || skills.q.cooldown > 0) return false;
      skills.q.active = def.freezeDuration || def.duration;
      skills.q.cooldown = def.cooldown;
      addToast('暂停！我们要求重新检查比赛录像！', 'warn', 2.0);
      addRing(p.x, p.y, p.r + 14, '#ffcf66', 0.55, 3);
      for (let i = 0; i < 18; i += 1) {
        const angle = rand(0, TAU);
        spawnParticle(
          p.x + Math.cos(angle) * 18,
          p.y + Math.sin(angle) * 18,
          Math.cos(angle) * rand(50, 190),
          Math.sin(angle) * rand(50, 190),
          rand(0.18, 0.45),
          rand(2, 5),
          Math.random() < 0.5 ? '#ffcf66' : '#ff6b5f',
          true
        );
      }
      audio.play('skill');
      pulseSkillSlot('q');
      refreshSkillBar(true);
      refreshStatsPanel(true);
      return true;
    }

    if (slot === 'e') {
      if (skills.e.cooldown > 0) return false;
      skills.e.cooldown = def.cooldown;
      skills.e.active = 0;
      spawnContractProjectile(def);
      addToast('紧急转会 · 合同已发出', 'info', 1.4);
      addRing(p.x, p.y, p.r + 8, '#ffcf66', 0.35, 2);
      audio.play('skill');
      pulseSkillSlot('e');
      refreshSkillBar(true);
      refreshStatsPanel(true);
      return true;
    }

    if (slot === 'r') {
      if (skills.r.phase === 'confirm') return executeChampionRewind();
      if (skills.r.phase === 'recording') return false;
      if (skills.r.cooldown > 0) return false;
      return startChampionRecord(def);
    }

    return false;
  }

  function consumeScytheShot() {
    if (!isEdgForm() || !game.player.skills) return null;
    const def = getFormSkill('r', 'edg');
    const r = game.player.skills.r;
    if (!def || r.pendingShots <= 0) return null;
    const index = r.shotIndex;
    const baseDamage = def.damageSequence[index];
    const stage = game.mode === 'stage' ? game.stage : 1;
    const stageMultiplier = game.mode === 'stage' ? 1 + stage * 0.1 : 1;
    const damage = baseDamage === undefined ? undefined : baseDamage * stageMultiplier;
    r.shotIndex += 1;
    r.pendingShots = Math.max(0, r.pendingShots - 1);
    return damage === undefined ? null : { damage: damage, index: index };
  }

  function onEnemyKilled(enemy) {
    if (!game || !game.player || game.player.dead) return;
    if (isNunForm() && getNunSubform() === 'fire' &&
        game.player.skills.e.active > 0 && enemy) {
      spawnNunOrb(enemy.x, enemy.y);
    }
    if (isKoreanForm() && game.player.skills) {
      const r = game.player.skills.r;
      r.killProgress += 1;
      if (r.killProgress >= 48) {
        const gained = Math.floor(r.killProgress / 48);
        r.charges += gained;
        r.killProgress %= 48;
        addToast('R · 巨大马头充能 +' + gained, 'good', 1.7);
        audio.play('skill');
      }
      refreshSkillBar(false);
    }
    if (!isEdgForm() || !isSkillActive('e')) return;
    const def = getFormSkill('e', 'edg');
    healPlayer(def ? def.healPerKill : 1, false);
  }

  function updatePlayerMovement(dt) {
    const p = game.player;
    if (p.dead) return;
    const startX = p.x;
    const startY = p.y;
    const dashActive = isBrideForm() && p.skills && p.skills.e.dashing && p.skills.e.active > 0;

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
        p.lastMoveAngle = Math.atan2(move.y, move.x);
        const speed = p.baseSpeed * p.moveSpeedMult * (dashActive ? BRIDE_CONFIG.e.speedMultiplier : 1);
        p.x += move.x * speed * dt;
        p.y += move.y * speed * dt;
        p.walkPhase += dt * (7.5 + speed * 0.012);
      }
      clampToMap(p);
    }

    clampToMap(p);
    if (dashActive) brideDashCollide(startX, startY);
  }

  function updatePlayerCombat(dt) {
    const p = game.player;
    if (p.dead) return;

    updateAim();

    if (isNunFireForm()) {
      const firing = input.mouse.down || input.fireHeld;
      if (firing && p.shootCd <= 0) nunMeleeAttack();
      return;
    }

    if (p.reloading) {
      p.reloadRemaining -= dt;
      if (p.reloadRemaining <= 0) {
        finishReload();
      }
    }

    const firing = input.mouse.down || input.fireHeld;
    const noReload = hasInfiniteAmmo() || !!(WEAPONS[p.weapon] && WEAPONS[p.weapon].noReload);
    if (firing && !p.reloading && p.shootCd <= 0) {
      if (!noReload && p.ammo[p.weapon] <= 0) {
        tryReload(true);
      } else {
        fireWeapon();
      }
    }

    if (firing && !p.reloading && !noReload && p.ammo[p.weapon] <= 0 && p.shootCd <= 0) {
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
    if (hasInfiniteAmmo()) return;
    const key = p.weapon;
    if (WEAPONS[key] && WEAPONS[key].noReload) return;
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
    const rapidFire = isEdgForm() && isSkillActive('q') ? 2 : 1;
    return {
      damage: def.damage * p.damageMult,
      fireInterval: Math.max(0.04, def.fireInterval / (p.fireRateMult * rapidFire)),
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
    if (isKoreanMeleeActive()) return;
    const key = p.weapon;
    const def = WEAPONS[key];
    const stats = getWeaponStats(key);
    const noReload = hasInfiniteAmmo() || !!def.noReload;
    if (p.ammo[key] <= 0 && !noReload) {
      tryReload(true);
      return;
    }

    if (!noReload) p.ammo[key] -= 1;
    p.shootCd = stats.fireInterval;
    p.muzzle = 0.075;
    p.recoil = 1;

    const baseAngle = p.aimAngle;
    const barrelDistance = p.r + 17;
    const muzzleX = p.x + Math.cos(baseAngle) * barrelDistance;
    const muzzleY = p.y + Math.sin(baseAngle) * barrelDistance;
    const pellets = def.pellets || 1;

    // R 的“五发”按一次实际射击动作计数，散射武器不会一次消耗多个镰刀计数。
    const scytheShot = consumeScytheShot();
    if (scytheShot) {
      spawnScytheBullet(baseAngle, scytheShot.damage, scytheShot.index);
      addRing(muzzleX, muzzleY, 18, '#ff4058', 0.28, 3);
      for (let i = 0; i < 10; i += 1) {
        const a = baseAngle + rand(-0.45, 0.45);
        spawnParticle(
          muzzleX,
          muzzleY,
          Math.cos(a) * rand(60, 260),
          Math.sin(a) * rand(60, 260),
          rand(0.14, 0.34),
          rand(2, 6),
          Math.random() < 0.55 ? '#ff4058' : '#ffcf66',
          true
        );
      }
      addShake(7);
      audio.play('scythe');
      if (!noReload && p.ammo[key] <= 0) tryReload(true);
      return;
    }

    if (def.laser) {
      if (game.laserBeams.length >= 8) game.laserBeams.shift();
      game.laserBeams.push({
        x1: muzzleX,
        y1: muzzleY,
        x2: muzzleX + Math.cos(baseAngle) * def.range,
        y2: muzzleY + Math.sin(baseAngle) * def.range,
        life: 0.085,
        maxLife: 0.085
      });
    }

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

    if (!noReload && p.ammo[key] <= 0) {
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
      laser: !!def.laser,
      originX: x,
      originY: y,
      splashDamage: (def.splashDamage || 0) * game.player.damageMult,
      splashRadius: def.splashRadius || 0,
      dead: false,
      delayedByFreeze: isFreezeActive(),
      smokeTimer: 0,
      trail: [{ x: x, y: y }]
    };
    game.bullets.push(bullet);
  }

  function spawnScytheBullet(angle, damage, index) {
    if (!game) return;
    if (game.bullets.length >= MAX_BULLETS) game.bullets.shift();
    const p = game.player;
    const speed = 560;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = p.x + cos * (p.r + 24);
    const y = p.y + sin * (p.r + 24);
    game.bullets.push({
      x: x,
      y: y,
      vx: cos * speed,
      vy: sin * speed,
      damage: damage,
      critical: false,
      pierce: 0,
      hits: new Set(),
      radius: 20,
      life: 1.45,
      maxLife: 1.45,
      color: '#ff334f',
      glow: '#ff806a',
      kind: 'scythe',
      scytheIndex: index,
      spin: rand(0, TAU),
      splashDamage: 0,
      splashRadius: 0,
      dead: false,
      smokeTimer: 0,
      trail: [{ x: x, y: y }]
    });
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
    const stageDiff = game.mode === 'stage' ? stageDifficulty(game.stage) : null;
    const survivalScale = game.mode === 'survival'
      ? 1 + game.time / 90 + Math.pow(game.time / 210, 1.45)
      : null;
    const hpScale = stageDiff ? stageDiff.hpScale : survivalScale;
    const speedScale = stageDiff
      ? stageDiff.speedScale
      : 1 + Math.min(0.55, game.time / 260);
    const damageScale = stageDiff
      ? stageDiff.damageScale
      : 1 + game.time / 300;
    // 普通敌人一次判定：20% 冲撞精英、20% 远程射手，其余普通。
    // 两者概率相同，且不增加总体生成数量。
    const specialRoll = type === 'normal' && game.mode === 'stage'
      ? Math.random()
      : 1;
    const isCharger = type === 'normal' && game.mode === 'stage' &&
      specialRoll < stageDiff.farEnemyChance;
    const isFarEnemy = type === 'normal' && game.mode === 'stage' &&
      !isCharger && specialRoll < stageDiff.farEnemyChance * 2;
    const far = stageDiff ? stageDiff.farEnemy : STAGE_DIFFICULTY.farEnemy;
    const chargerHpMult = isCharger ? 1.4 : 1;
    const chargerDamageMult = isCharger ? 1.15 : 1;

    const hp = def.hp * hpScale * chargerHpMult *
      (isElite ? rand(0.96, 1.08) : rand(0.94, 1.06));
    const enemy = {
      uid: ++game.enemyUid,
      type: isCharger ? 'elite' : type,
      x: position.x,
      y: position.y,
      r: def.radius * (isCharger ? 1.04 : (isElite ? rand(0.98, 1.06) : rand(0.94, 1.04))),
      hp: hp,
      maxHp: hp,
      speed: def.speed * speedScale * (isElite ? 1.09 : 1) * (isCharger ? 1.04 : 1),
      damage: def.damage * damageScale * chargerDamageMult,
      xpValue: isCharger ? ENEMY_BASE.elite.xp : def.xp,
      scoreValue: isCharger ? ENEMY_BASE.elite.score : def.score,
      ring: isCharger ? '#ff4b4b' : isFarEnemy ? '#ffb35e' : def.ring,
      hitFlash: 0,
      attackCd: rand(0.3, 0.8),
      attackFlash: 0,
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
      strafeTimer: rand(1.8, 3.5),
      ranged: isFarEnemy,
      variant: isCharger ? 'charger' : isFarEnemy ? 'ranged' : null,
      chargeState: 'idle',
      chargeCd: rand(1.8, 3.2),
      chargeTime: 0,
      chargeRecover: 0,
      chargeDirX: 0,
      chargeDirY: 1,
      chargeDistance: 0,
      chargeTravelled: 0,
      chargeSpeed: 0,
      shootCd: isFarEnemy ? rand(0.9, 1.8) : 0,
      shootWindup: 0,
      shotsFired: 0,
      aimAngle: 0,
      preferredRange: isFarEnemy
        ? rand(STAGE_DIFFICULTY.farEnemy.preferredMin, STAGE_DIFFICULTY.farEnemy.preferredMax)
        : 0,
      fireInterval: isFarEnemy
        ? far.interval + rand(0.15, 0.55)
        : 0,
      rangedSpeed: isFarEnemy ? far.speed : 0,
      rangedDamage: isFarEnemy ? far.damage : 0
    };

    game.enemies.push(enemy);
    addRing(position.x, position.y, 22, enemy.ring, 0.55, 2);
    if (!opts.silent) {
      for (let i = 0; i < 7; i += 1) {
        spawnParticle(
          position.x + rand(-12, 12),
          position.y + rand(-12, 12),
          rand(-45, 45),
          rand(-45, 45),
          rand(0.2, 0.45),
          rand(2, 5),
          enemy.ring,
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
    const stageBoss = game.mode === 'stage' && isStageBossStage(game.stage);
    const stageCfg = stageBoss ? STAGE_BOSS_CONFIG[game.stage] : null;
    const themeKey = stageBoss ? (game.mapTheme || 'default') : 'default';
    const theme = BOSS_THEMES[themeKey] || BOSS_THEMES.default;
    const hp = stageCfg ? stageCfg.hp : survivalHp;

    const boss = {
      uid: ++game.enemyUid,
      type: 'boss',
      name: stageBoss ? theme.name : '暴走的好兄弟',
      title: stageBoss ? theme.title : '暴走',
      x: position.x,
      y: position.y,
      r: def.radius,
      hp: hp,
      maxHp: hp,
      speed: (def.speed + Math.min(28, game.time / 24)) * (stageCfg ? stageCfg.speedMult : 1),
      damage: def.damage * (1 + game.time / 420) * (stageCfg ? stageCfg.damageMult : 1),
      xpValue: def.xp,
      scoreValue: def.score,
      ring: theme.ring,
      theme: themeKey,
      themeAccent: theme.accent,
      themeBullet: theme.bullet,
      themeRage: theme.rage,
      stageBoss: stageBoss,
      tier: stageCfg ? stageCfg.tier : 0,
      damageMult: stageCfg ? stageCfg.damageMult : 1,
      cooldownMult: stageCfg ? stageCfg.cooldownMult : 1,
      countBonus: stageCfg ? stageCfg.countBonus : 0,
      patternIndex: 0,
      patternCd: 2.2,
      spiral: null,
      zones: [],
      patternFlash: 0,
      hitFlash: 0,
      attackCd: 1,
      attackFlash: 0,
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
    if (stageBoss) bossMusic.start('stage:' + game.stage);
    game.stageState = game.mode === 'stage' ? 'boss' : game.stageState;

    setBanner(
      '⚠ ' + theme.name + ' 来袭',
      theme.tagline + (source === 'stage' ? ' 击败他，才能进入下一关。' : ''),
      'boss',
      3.1
    );
    addToast('BOSS 已出现 · ' + theme.title, 'warn', 3);
    addShake(18);
    audio.play('boss_warn');

    addRing(position.x, position.y, 40, theme.ring, 0.9, 3);
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
        Math.random() < 0.5 ? theme.ring : theme.accent,
        true
      );
    }
    return boss;
  }

  function updateSpawning(dt) {
    if (!game || game.player.dead) return;
    const g = game;
    if (g.eventBossActive) return;

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
    const difficulty = stageDifficulty(g.stage);
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      const alive = countLivingEnemies();
      const maxAlive = Math.min(
        STAGE_DIFFICULTY.maxAliveCap,
        Math.max(1, difficulty.maxAlive)
      );
      if (alive < maxAlive) {
        spawnEnemy(Math.random() < difficulty.eliteChance ? 'elite' : 'normal');
      }
      g.spawnTimer = difficulty.spawnInterval * rand(0.86, 1.14);
    }
  }

  function getEnemyCombatTarget(enemy) {
    if (!game || !game.player) return null;
    const tentacle = isNunForm() ? game.nunTentacle : null;
    if (tentacle && tentacle.hp > 0 && enemy.type !== 'boss' && !enemy.charmed) {
      const d = Math.hypot(enemy.x - tentacle.x, enemy.y - tentacle.y);
      if (d <= NUN_CONFIG.e.tauntRadius) return tentacle;
    }
    return game.player;
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
      enemy.attackFlash = Math.max(0, enemy.attackFlash - dt);
      enemy.castFlash = Math.max(0, enemy.castFlash - dt);

      if (enemy.spawnT > 0.12) {
        continue;
      }

      if (enemy.charmed) {
        updateCharmedEnemy(enemy, dt);
        continue;
      }

      if (enemy.type === 'boss') {
        if (enemy.blackAdiao) updateBlackAdiaoBoss(enemy, dt);
        else updateBoss(enemy, dt);
      } else {
        updateRegularEnemy(enemy, dt);
      }

      if (p.dead) break;

      const target = getEnemyCombatTarget(enemy);
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      const targetIsTentacle = target === game.nunTentacle;
      const contactDistance = enemy.r + (target.r || p.r) - 3;
      const chargerBusy = enemy.variant === 'charger' && enemy.chargeState !== 'idle';
      if (dist < contactDistance && enemy.attackCd <= 0 && !chargerBusy) {
        enemy.attackCd = enemy.type === 'boss' ? 1.05 : 0.86;
        enemy.attackFlash = 0.24;
        if (targetIsTentacle) {
          damageNunTentacle(enemy.damage);
          addRing(target.x, target.y, 30, '#8f4fff', 0.25, 2);
        } else {
          addRing(
            enemy.x,
            enemy.y,
            enemy.r + 8,
            enemy.ranged ? '#ffb35e' : '#ff6b7d',
            0.24,
            2
          );
          damagePlayer(enemy.damage, enemy.x, enemy.y);
          if (p.dead) break;
        }
      }
    }

    separateEnemies();
  }

  function updateChargerEnemy(enemy, dt, dist, directionX, directionY, target) {
    const p = game.player;
    enemy.chargeCd -= dt;

    if (enemy.chargeState === 'idle') {
      const speed = enemy.speed * 0.58;
      if (dist > enemy.r + (target.r || p.r) + 12) {
        enemy.x += (directionX * speed + enemy.pushX) * dt;
        enemy.y += (directionY * speed + enemy.pushY) * dt;
        clampToMap(enemy);
      }
      if (enemy.chargeCd <= 0 && dist < 560) {
        enemy.chargeState = 'warning';
        enemy.chargeTime = 0.92;
        enemy.chargeDirX = directionX;
        enemy.chargeDirY = directionY;
        enemy.chargeDistance = Math.min(540, Math.max(270, dist + 120));
        enemy.chargeSpeed = 620 + Math.min(160, (game.stage || 1) * 8);
        enemy.chargeTravelled = 0;
        enemy.chargeTime = 0.92;
        enemy.castFlash = 0.32;
        addRing(enemy.x, enemy.y, enemy.r + 10, '#ff4b4b', 0.28, 2);
        audio.play('enemy_shot');
      }
      return;
    }

    if (enemy.chargeState === 'warning') {
      enemy.chargeTime -= dt;
      if (enemy.chargeTime <= 0) {
        enemy.chargeState = 'dash';
        enemy.chargeTime = enemy.chargeDistance / Math.max(1, enemy.chargeSpeed) + 0.04;
        enemy.chargeTravelled = 0;
        enemy.attackFlash = 0.2;
        audio.play('enemy_shot');
      }
      return;
    }

    if (enemy.chargeState === 'dash') {
      const oldX = enemy.x;
      const oldY = enemy.y;
      const dashSpeed = enemy.chargeSpeed || 620;
      enemy.x += enemy.chargeDirX * dashSpeed * dt;
      enemy.y += enemy.chargeDirY * dashSpeed * dt;
      enemy.chargeTravelled += dashSpeed * dt;
      enemy.chargeTime -= dt;
      clampToMap(enemy);
      if (segmentCircleHit(oldX, oldY, enemy.x, enemy.y, target.x, target.y, (target.r || p.r) + enemy.r - 2)) {
        enemy.attackCd = 0.9;
        enemy.chargeState = 'recover';
        enemy.chargeRecover = 0.85;
        enemy.attackFlash = 0.24;
        addRing(enemy.x, enemy.y, enemy.r + 12, '#ff4b4b', 0.3, 3);
        if (target === game.nunTentacle) damageNunTentacle(enemy.damage * 1.15);
        else damagePlayer(enemy.damage * 1.15, enemy.x, enemy.y);
      } else if (enemy.chargeTime <= 0 || enemy.chargeTravelled >= enemy.chargeDistance) {
        enemy.chargeState = 'recover';
        enemy.chargeRecover = 0.85;
      }
      return;
    }

    enemy.chargeRecover -= dt;
    if (enemy.chargeRecover <= 0) {
      enemy.chargeState = 'idle';
      enemy.chargeCd = rand(2.4, 3.9);
    }
  }

  function updateRangedEnemy(enemy, dt, dist, directionX, directionY, target) {
    const far = STAGE_DIFFICULTY.farEnemy;
    let speed = enemy.speed * 0.82;
    let moveX = 0;
    let moveY = 0;

    if (dist < far.retreatDistance) {
      // 被贴脸时优先后撤，给远程个体重新拉开距离的机会。
      moveX = -directionX;
      moveY = -directionY;
    } else if (dist > far.advanceDistance) {
      moveX = directionX;
      moveY = directionY;
    } else if (dist < enemy.preferredRange - 55) {
      moveX = -directionX;
      moveY = -directionY;
    } else if (dist > enemy.preferredRange + 55) {
      moveX = directionX;
      moveY = directionY;
    } else {
      enemy.strafeTimer -= dt;
      if (enemy.strafeTimer <= 0) {
        enemy.strafeTimer = rand(1.3, 2.8);
        enemy.strafeDir *= -1;
      }
      moveX = -directionY * enemy.strafeDir * 0.82 + directionX * 0.12;
      moveY = directionX * enemy.strafeDir * 0.82 + directionY * 0.12;
    }

    enemy.x += (moveX * speed + enemy.pushX) * dt;
    enemy.y += (moveY * speed + enemy.pushY) * dt;
    enemy.pushX *= Math.exp(-dt * 8);
    enemy.pushY *= Math.exp(-dt * 8);
    clampToMap(enemy);

    if (enemy.shootWindup > 0) {
      enemy.shootWindup -= dt;
      if (enemy.shootWindup <= 0) {
        const muzzleX = enemy.x + Math.cos(enemy.aimAngle) * (enemy.r + 8);
        const muzzleY = enemy.y + Math.sin(enemy.aimAngle) * (enemy.r + 8);
        spawnEnemyBullet(
          muzzleX,
          muzzleY,
          enemy.aimAngle,
          enemy.rangedSpeed,
          enemy.rangedDamage,
          far.bulletRadius,
          '#ffb35e',
          { life: far.bulletLife, ranged: true }
        );
        enemy.shootCd = enemy.fireInterval + rand(0.18, 0.55);
        enemy.shotsFired += 1;
        enemy.castFlash = 0.18;
        addRing(muzzleX, muzzleY, enemy.r + 5, '#ffb35e', 0.22, 2);
        audio.play('enemy_shot');
      }
      return;
    }

    enemy.shootCd -= dt;
    if (enemy.shootCd <= 0 &&
        dist < 620 &&
        game.enemyBullets.length < far.bulletLimit) {
      enemy.shootWindup = far.windup;
      enemy.aimAngle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      enemy.castFlash = 0.34;
    }
  }

  function updateRegularEnemy(enemy, dt) {
    const p = game.player;
    const target = getEnemyCombatTarget(enemy);
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const directionX = dx / dist;
    const directionY = dy / dist;

    if (enemy.variant === 'charger') {
      updateChargerEnemy(enemy, dt, dist, directionX, directionY, target);
      return;
    }

    if (enemy.ranged) {
      updateRangedEnemy(enemy, dt, dist, directionX, directionY, target);
      return;
    }

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

    // 进入接触攻击距离后停止往玩家身体里挤，真正的伤害由 updateEnemies
    // 的统一近战判定执行。旧代码在 70px 处主动后退，导致 45px 左右的
    // 近战距离永远到不了，这是近战不攻击的根因。
    const attackDistance = enemy.r + (target.r || p.r) - 3;
    let moveX = 0;
    let moveY = 0;
    if (dist > attackDistance - 2) {
      const wobbleAmp = dist < attackDistance + 45
        ? 0.08
        : (enemy.type === 'elite' ? 0.15 : 0.22);
      const wobble = Math.sin(enemy.wobble + enemy.uid * 0.7) * wobbleAmp;
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
      boss.specialCd = (boss.enraged ? 1.75 : 2.65) * (boss.cooldownMult || 1);
      boss.castFlash = 0.32;
    }

    boss.volleyCd -= dt;
    if (boss.volleyCd <= 0 && boss.spawnT <= 0 && dist < 1100) {
      fireBossVolley(boss);
      boss.volleyCd = (boss.enraged ? 2.05 : 3.55) * (boss.cooldownMult || 1);
      boss.castFlash = 0.24;
    }

    boss.patternCd -= dt;
    boss.patternFlash = Math.max(0, (boss.patternFlash || 0) - dt);
    if (boss.stageBoss && boss.patternCd <= 0 && boss.spawnT <= 0) {
      startBossPattern(boss);
      boss.patternCd = (boss.tier >= 4 ? 2.4 : 3.1) * (boss.cooldownMult || 1);
    }
    if (boss.spiral) updateBossSpiral(boss, dt);
    if (boss.zones && boss.zones.length) updateBossZones(boss, dt);

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

  function updateBlackAdiaoBoss(boss, dt) {
    const p = game.player;
    const dx = p.x - boss.x;
    const dy = p.y - boss.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const dirX = dx / dist;
    const dirY = dy / dist;
    boss.spawnT = Math.max(0, boss.spawnT - dt);
    boss.hitFlash = Math.max(0, boss.hitFlash - dt);
    boss.castFlash = Math.max(0, boss.castFlash - dt);
    boss.attackFlash = Math.max(0, boss.attackFlash - dt);
    boss.meleeCd = Math.max(0, boss.meleeCd - dt);

    if (!boss.enraged && boss.hp <= boss.maxHp * 0.5) {
      boss.enraged = true;
      boss.damageMult = 1.35;
      boss.speed *= 1.12;
      setBanner('黑色阿吊 · 暴走', '弹幕密度与重击速度提升', 'boss', 2.4);
      addShake(14);
      audio.play('boss_warn');
    }

    // 近战阶段：前摇 -> 砸下 -> 收回；前摇期间不发射远程弹幕。
    if (boss.meleeState !== 'idle') {
      boss.meleeTime -= dt;
      if (boss.meleeState === 'windup' && boss.meleeTime <= 0) {
        boss.meleeState = 'slam';
        boss.meleeTime = 0.24;
        boss.attackFlash = 0.3;
        addShake(12);
        audio.play('explosion');
        if (!p.dead && Math.hypot(p.x - boss.meleeX, p.y - boss.meleeY) <= boss.meleeRadius + p.r) {
          damagePlayer(boss.meleeDamage * boss.damageMult, boss.meleeX, boss.meleeY);
        }
        addRing(boss.meleeX, boss.meleeY, boss.meleeRadius, '#ff4f6d', 0.45, 5);
        for (let i = 0; i < 16; i += 1) {
          const a = rand(0, TAU);
          spawnParticle(boss.meleeX, boss.meleeY, Math.cos(a) * rand(60, 220), Math.sin(a) * rand(60, 220), rand(0.2, 0.5), rand(2, 6), '#d9c7ff', true);
        }
      } else if (boss.meleeState === 'slam' && boss.meleeTime <= 0) {
        boss.meleeState = 'recover';
        boss.meleeTime = 0.42;
      } else if (boss.meleeState === 'recover' && boss.meleeTime <= 0) {
        boss.meleeState = 'idle';
        boss.meleeCd = boss.enraged ? 1.15 : 1.65;
      }
      return;
    }

    // 中距离切换：过远追击，贴身时准备重击，中距离保持火力平台。
    if (dist > 300) {
      boss.x += dirX * boss.speed * dt;
      boss.y += dirY * boss.speed * dt;
    } else if (dist < 155) {
      boss.x -= dirX * boss.speed * 0.55 * dt;
      boss.y -= dirY * boss.speed * 0.55 * dt;
    } else {
      boss.strafeTimer -= dt;
      if (boss.strafeTimer <= 0) {
        boss.strafeTimer = rand(0.8, 1.6);
        boss.strafeDir *= -1;
      }
      boss.x += (-dirY * boss.strafeDir * 42 + dirX * 18) * dt;
      boss.y += (dirX * boss.strafeDir * 42 + dirY * 18) * dt;
    }
    boss.x += boss.pushX * dt;
    boss.y += boss.pushY * dt;
    boss.pushX *= Math.exp(-dt * 7);
    boss.pushY *= Math.exp(-dt * 7);
    clampToMap(boss);

    if (boss.spawnT > 0 || boss.dead) return;

    if (dist < 215 && boss.meleeCd <= 0) {
      boss.meleeState = 'windup';
      boss.meleeTime = boss.enraged ? 0.55 : 0.7;
      boss.meleeX = p.x;
      boss.meleeY = p.y;
      boss.meleeRadius = 104;
      boss.castFlash = 0.35;
      addToast('黑色阿吊 · 重击预警', 'warn', 0.8);
      return;
    }

    const canShoot = game.enemyBullets.length < MAX_ENEMY_BULLETS - 20;
    boss.ringCd -= dt;
    boss.fanCd -= dt;
    boss.spiralCd -= dt;
    boss.comboCD -= dt;
    if (!canShoot) return;

    if (boss.spiralCd <= 0) {
      boss.spiralCd = boss.enraged ? 0.11 : 0.16;
      boss.spiralAngle += boss.enraged ? 0.24 : 0.18;
      for (let i = 0; i < 2; i += 1) {
        const a = boss.spiralAngle + i * Math.PI;
        spawnEnemyBullet(boss.x, boss.y, a, boss.enraged ? 285 : 245, 11 * boss.damageMult, 6, '#d7c2ff');
      }
    }
    if (boss.ringCd <= 0) {
      boss.ringCd = boss.enraged ? 0.72 : 0.95;
      const count = boss.enraged ? 26 : 20;
      const offset = rand(0, TAU);
      for (let i = 0; i < count; i += 1) {
        const a = offset + (i / count) * TAU;
        spawnEnemyBullet(boss.x, boss.y, a, boss.enraged ? 250 : 220, 12 * boss.damageMult, 6.5, '#d7c2ff');
      }
      if (boss.enraged) {
        for (let i = 0; i < 14; i += 1) {
          const a = offset + Math.PI / 14 + (i / 14) * TAU;
          spawnEnemyBullet(boss.x, boss.y, a, 170, 9 * boss.damageMult, 5, '#8d5bff');
        }
      }
      addRing(boss.x, boss.y, boss.r, '#8d5bff', 0.3, 3);
    }
    if (boss.fanCd <= 0) {
      boss.fanCd = boss.enraged ? 0.9 : 1.25;
      const base = Math.atan2(dy, dx);
      const count = boss.enraged ? 20 : 15;
      const spread = boss.enraged ? 1.5 : 1.2;
      for (let i = 0; i < count; i += 1) {
        const a = base - spread * 0.5 + (i / Math.max(1, count - 1)) * spread;
        spawnEnemyBullet(boss.x, boss.y, a, boss.enraged ? 300 : 255, 13 * boss.damageMult, 6, '#f0b7ff');
      }
    }
    if (boss.comboCD <= 0) {
      boss.comboCD = boss.enraged ? 2.0 : 3.0;
      const base = Math.atan2(dy, dx);
      for (let i = 0; i < 4; i += 1) {
        const a = base + i * Math.PI * 0.5;
        spawnEnemyBullet(boss.x, boss.y, a, 210, 10 * boss.damageMult, 5, '#d7c2ff');
      }
      for (let i = 0; i < 16; i += 1) {
        const a = rand(0, TAU);
        spawnEnemyBullet(boss.x, boss.y, a, rand(150, 240), 8 * boss.damageMult, 4.5, '#8d5bff');
      }
    }
    if (boss.rangedCd <= 0) {
      boss.rangedCd = boss.enraged ? 0.35 : 0.5;
      boss.attackFlash = 0.18;
    }
  }

  function fireBossRadial(boss) {
    if (!game) return;
    const count = (boss.enraged ? 18 : 11) + (boss.countBonus || 0);
    const offset = rand(0, TAU);
    const speed = (boss.enraged ? 250 : 215) * (boss.stageBoss ? 1 + boss.tier * 0.03 : 1);
    for (let i = 0; i < count; i += 1) {
      const angle = offset + (i / count) * TAU;
      spawnEnemyBullet(
        boss.x + Math.cos(angle) * (boss.r * 0.7),
        boss.y + Math.sin(angle) * (boss.r * 0.7),
        angle,
        speed,
        (boss.enraged ? 12 : 10) * (boss.damageMult || 1),
        6.5,
        boss.enraged ? (boss.themeRage || '#ff764f') : (boss.themeBullet || '#ff5a78')
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
    const count = (boss.enraged ? 5 : 3) + Math.floor((boss.countBonus || 0) * 0.5);
    const speed = (boss.enraged ? 390 : 325) * (boss.stageBoss ? 1 + boss.tier * 0.025 : 1);
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle + (i - (count - 1) * 0.5) * 0.115;
      spawnEnemyBullet(
        boss.x + Math.cos(angle) * (boss.r * 0.74),
        boss.y + Math.sin(angle) * (boss.r * 0.74),
        angle,
        speed,
        (boss.enraged ? 14 : 12) * (boss.damageMult || 1),
        5.5,
        boss.themeBullet || '#ffad54'
      );
    }
    addRing(boss.x, boss.y, boss.r * 0.55, boss.themeAccent || '#ffad54', 0.28, 3);
    audio.play('boss_shoot');
  }

  function startBossPattern(boss) {
    const set = boss.tier >= 4
      ? ['spiral', 'multiRing', 'cross', 'fan', 'zones']
      : (BOSS_PATTERN_SETS[boss.theme] || BOSS_PATTERN_SETS.default);
    const type = set[boss.patternIndex % set.length];
    boss.patternIndex += 1;
    boss.patternFlash = 0.35;
    boss.castFlash = 0.3;
    boss.patternType = type;
    if (type === 'spiral') {
      boss.spiral = {
        time: boss.tier >= 4 ? 2.5 : 2.0,
        tick: 0,
        angle: rand(0, TAU),
        dir: Math.random() < 0.5 ? -1 : 1,
        arms: Math.min(5, 2 + boss.tier)
      };
    } else if (type === 'multiRing') {
      const rings = boss.tier >= 3 ? 3 : 2;
      for (let ring = 0; ring < rings; ring += 1) {
        const count = 12 + boss.tier * 2 + (boss.countBonus || 0);
        const offset = ring * 0.11 + rand(0, TAU * 0.02);
        for (let i = 0; i < count; i += 1) {
          const angle = offset + (i / count) * TAU;
          spawnEnemyBullet(
            boss.x + Math.cos(angle) * (boss.r * 0.72),
            boss.y + Math.sin(angle) * (boss.r * 0.72),
            angle,
            (155 + ring * 38) * (boss.stageBoss ? 1 + boss.tier * 0.02 : 1),
            7 * (boss.damageMult || 1),
            5.2,
            boss.themeBullet || '#ffad54'
          );
        }
      }
    } else if (type === 'cross') {
      const base = rand(0, TAU);
      for (let axis = 0; axis < 4; axis += 1) {
        for (let step = -1; step <= 1; step += 1) {
          const angle = base + axis * Math.PI * 0.5 + step * 0.08;
          spawnEnemyBullet(
            boss.x + Math.cos(angle) * (boss.r * 0.7),
            boss.y + Math.sin(angle) * (boss.r * 0.7),
            angle,
            (260 + boss.tier * 18) * (boss.stageBoss ? 1 + boss.tier * 0.02 : 1),
            9 * (boss.damageMult || 1),
            5.5,
            boss.themeBullet || '#ffad54'
          );
        }
      }
    } else if (type === 'fan') {
      const p = game.player;
      const aim = Math.atan2(p.y - boss.y, p.x - boss.x);
      const count = 5 + boss.tier * 2 + (boss.countBonus || 0);
      const spread = 0.9;
      for (let i = 0; i < count; i += 1) {
        const angle = aim - spread * 0.5 + (i / Math.max(1, count - 1)) * spread;
        spawnEnemyBullet(
          boss.x + Math.cos(angle) * (boss.r * 0.72),
          boss.y + Math.sin(angle) * (boss.r * 0.72),
          angle,
          320 + boss.tier * 14,
          9 * (boss.damageMult || 1),
          5.5,
          boss.themeBullet || '#ffad54'
        );
      }
    } else if (type === 'zones') {
      const p = game.player;
      const count = Math.min(4, 2 + Math.floor(boss.tier / 2));
      for (let i = 0; i < count; i += 1) {
        const angle = (i / count) * TAU + rand(-0.25, 0.25);
        const distance = i === 0 ? 0 : rand(45, 145);
        boss.zones.push({
          x: clamp(p.x + Math.cos(angle) * distance, 60, MAP.w - 60),
          y: clamp(p.y + Math.sin(angle) * distance, 60, MAP.h - 60),
          radius: 70 + boss.tier * 6,
          time: 1.15,
          total: 1.15
        });
      }
    }
    addRing(boss.x, boss.y, boss.r + 12, boss.themeAccent || '#ffad54', 0.4, 2);
    audio.play('boss_shoot');
  }

  function updateBossSpiral(boss, dt) {
    const spiral = boss.spiral;
    if (!spiral) return;
    spiral.time -= dt;
    spiral.tick -= dt;
    if (spiral.tick <= 0) {
      spiral.tick = boss.enraged ? 0.085 : 0.11;
      spiral.angle += (boss.enraged ? 0.2 : 0.16) * spiral.dir;
      const arms = spiral.arms || 3;
      for (let arm = 0; arm < arms; arm += 1) {
        const angle = spiral.angle + (arm / arms) * TAU;
        spawnEnemyBullet(
          boss.x + Math.cos(angle) * (boss.r * 0.65),
          boss.y + Math.sin(angle) * (boss.r * 0.65),
          angle,
          190 + boss.tier * 12,
          6 * (boss.damageMult || 1),
          5,
          arm % 2 ? (boss.themeAccent || '#ffad54') : (boss.themeBullet || '#ffad54')
        );
      }
    }
    if (spiral.time <= 0) {
      boss.spiral = null;
      addRing(boss.x, boss.y, boss.r + 8, boss.themeAccent || '#ffad54', 0.25, 2);
    }
  }

  function updateBossZones(boss, dt) {
    for (let i = boss.zones.length - 1; i >= 0; i -= 1) {
      const zone = boss.zones[i];
      zone.time -= dt;
      if (zone.time > 0) continue;
      const p = game.player;
      if (Math.hypot(p.x - zone.x, p.y - zone.y) <= zone.radius + p.r) {
        damagePlayer(boss.damage * 0.9, zone.x, zone.y);
      }
      addRing(zone.x, zone.y, zone.radius, boss.themeAccent || '#ffad54', 0.45, 3);
      boss.zones.splice(i, 1);
    }
  }

  /* =======================================================
     吴朝阳事件 Boss / 随行伙伴
     ======================================================= */
  function eventBossVerticalOffset() {
    const compact = view.w < 1180;
    const desiredScreenY = compact ? Math.max(250, Math.min(300, view.h * 0.34)) : 300;
    return Math.max(70, view.h * 0.5 - desiredScreenY);
  }

  function createEventBoss(event) {
    const p = game.player;
    const cfg = event.boss;
    return {
      name: cfg.name,
      title: cfg.title,
      x: clamp(p.x, 130, MAP.w - 130),
      y: clamp(p.y - eventBossVerticalOffset(), 130, MAP.h - 130),
      r: cfg.radius,
      hp: cfg.hp,
      maxHp: cfg.hp,
      phase: 1,
      enraged: false,
      spawnT: 1.25,
      attackTimer: 1.65,
      patternIndex: 0,
      telegraph: null,
      spiral: null,
      hitFlash: 0,
      castFlash: 0,
      rageFlash: 0,
      drift: rand(0, TAU),
      dead: false,
      defeated: false
    };
  }

  function startEventBossTelegraph(boss) {
    const phase2 = boss.enraged;
    const patterns = phase2
      ? ['rotating', 'multiRing', 'trackingFan', 'combo', 'spiral']
      : ['fan', 'multiRing', 'trackingFan', 'rotating', 'delayed'];
    const type = patterns[boss.patternIndex % patterns.length];
    boss.patternIndex += 1;
    const p = game.player;
    const baseAngle = Math.atan2(p.y - boss.y, p.x - boss.x);
    const durations = {
      fan: phase2 ? 0.68 : 0.82,
      ring: phase2 ? 0.72 : 0.9,
      delayed: phase2 ? 1.0 : 1.15,
      spiral: 0.78,
      combo: 0.9,
      rotating: phase2 ? 0.58 : 0.7,
      multiRing: phase2 ? 0.68 : 0.82,
      trackingFan: phase2 ? 0.62 : 0.76
    };
    const telegraph = {
      type: type,
      time: durations[type] || 0.85,
      total: durations[type] || 0.85,
      baseAngle: baseAngle,
      markers: []
    };

    if (type === 'delayed') {
      for (let i = 0; i < 3; i += 1) {
        const distance = i === 0 ? 0 : rand(60, 115);
        const angle = baseAngle + Math.PI + rand(-0.8, 0.8) + (i === 2 ? 0.3 : 0);
        telegraph.markers.push({
          x: clamp(p.x + Math.cos(angle) * distance, 35, MAP.w - 35),
          y: clamp(p.y + Math.sin(angle) * distance, 35, MAP.h - 35)
        });
      }
    }

    boss.telegraph = telegraph;
    boss.castFlash = 0.28;
    audio.play('event_charge');
  }

  function fireEventFan(boss, baseAngle, count, spread, speed, damage) {
    const step = count > 1 ? spread / (count - 1) : 0;
    for (let i = 0; i < count; i += 1) {
      const angle = baseAngle - spread * 0.5 + step * i;
      spawnEventBossBullet(
        boss.x + Math.cos(angle) * (boss.r + 7),
        boss.y + Math.sin(angle) * (boss.r + 7),
        angle,
        speed,
        damage,
        6.2,
        '#ff7b8d',
        5.4
      );
    }
  }

  function fireEventRing(boss, count, speed, damage) {
    const offset = rand(0, TAU);
    for (let i = 0; i < count; i += 1) {
      const angle = offset + (i / count) * TAU;
      spawnEventBossBullet(
        boss.x + Math.cos(angle) * (boss.r + 6),
        boss.y + Math.sin(angle) * (boss.r + 6),
        angle,
        speed,
        damage,
        5.7,
        '#ffcf66',
        5.6
      );
    }
  }

  function executeEventBossTelegraph(boss, telegraph) {
    const p = game.player;
    const phase2 = boss.enraged;
    const type = telegraph.type;
    if (type === 'fan') {
      fireEventFan(boss, telegraph.baseAngle, phase2 ? 11 : 7, phase2 ? 1.05 : 0.8, phase2 ? 310 : 265, 8);
      boss.attackTimer = phase2 ? 0.78 : 1.35;
    } else if (type === 'ring') {
      fireEventRing(boss, phase2 ? 20 : 14, phase2 ? 235 : 195, 7);
      boss.attackTimer = phase2 ? 0.82 : 1.45;
    } else if (type === 'delayed') {
      for (let i = 0; i < telegraph.markers.length; i += 1) {
        const marker = telegraph.markers[i];
        const base = Math.atan2(marker.y - boss.y, marker.x - boss.x);
        for (let k = -1; k <= 1; k += 2) {
          spawnEventBossBullet(
            boss.x + Math.cos(base) * (boss.r + 8),
            boss.y + Math.sin(base) * (boss.r + 8),
            base + k * 0.055,
            320,
            9,
            7,
            '#ffad54',
            5.2
          );
        }
        addRing(marker.x, marker.y, 18, '#ffb15c', 0.32, 3);
      }
      boss.attackTimer = phase2 ? 0.85 : 1.5;
    } else if (type === 'spiral') {
      boss.spiral = {
        time: phase2 ? 1.9 : 1.5,
        tick: 0,
        angle: telegraph.baseAngle,
        dir: Math.random() < 0.5 ? -1 : 1
      };
    } else if (type === 'combo') {
      fireEventFan(boss, telegraph.baseAngle, phase2 ? 11 : 9, 0.95, phase2 ? 290 : 280, 8);
      fireEventRing(boss, phase2 ? 20 : 16, phase2 ? 230 : 210, 7);
      boss.attackTimer = phase2 ? 0.78 : 1.45;
    } else if (type === 'rotating') {
      boss.spiral = {
        time: phase2 ? 2.25 : 1.85,
        tick: 0,
        angle: telegraph.baseAngle,
        dir: Math.random() < 0.5 ? -1 : 1,
        arms: phase2 ? 4 : 3
      };
      boss.attackTimer = phase2 ? 0.7 : 1.1;
    } else if (type === 'multiRing') {
      fireEventRing(boss, phase2 ? 20 : 16, phase2 ? 185 : 165, 8);
      fireEventRing(boss, phase2 ? 26 : 20, phase2 ? 250 : 225, 7);
      boss.attackTimer = phase2 ? 0.8 : 1.15;
    } else if (type === 'trackingFan') {
      const aim = Math.atan2(p.y - boss.y, p.x - boss.x);
      fireEventFan(boss, aim, phase2 ? 13 : 9, phase2 ? 1.12 : 0.92, phase2 ? 300 : 270, 9);
      boss.attackTimer = phase2 ? 0.72 : 1.1;
    }
    boss.castFlash = 0.22;
    audio.play('boss_shoot');
  }

  function updateEventBossSpiral(boss, dt) {
    const spiral = boss.spiral;
    if (!spiral) return;
    spiral.time -= dt;
    spiral.tick -= dt;
    if (spiral.tick <= 0) {
      spiral.tick = boss.enraged ? 0.08 : 0.115;
      spiral.angle += (boss.enraged ? 0.22 : 0.16) * spiral.dir;
      const arms = spiral.arms || 2;
      for (let arm = 0; arm < arms; arm += 1) {
        const angle = spiral.angle + (arm / arms) * TAU;
        spawnEventBossBullet(
          boss.x + Math.cos(angle) * (boss.r + 5),
          boss.y + Math.sin(angle) * (boss.r + 5),
          angle,
          boss.enraged ? 215 : 195,
          6,
          5.3,
          arm % 2 === 0 ? '#c9a7ff' : '#ffad54',
          5.4
        );
      }
    }
    if (spiral.time <= 0) {
      boss.spiral = null;
      boss.attackTimer = boss.enraged ? 0.78 : 1.25;
    }
  }

  function updateEventBoss(dt) {
    if (!game || state !== S.PLAYING || !game.eventBossActive || !game.eventBoss) return;
    const boss = game.eventBoss;
    const p = game.player;
    if (boss.dead || boss.defeated) return;

    boss.hitFlash = Math.max(0, boss.hitFlash - dt);
    boss.castFlash = Math.max(0, boss.castFlash - dt);
    boss.rageFlash = Math.max(0, (boss.rageFlash || 0) - dt);

    if (boss.spawnT > 0) {
      boss.spawnT -= dt;
      return;
    }

    if (!boss.enraged && boss.hp <= boss.maxHp * WUCHAOYANG_EVENT.boss.phase2At) {
      boss.enraged = true;
      boss.phase = 2;
      boss.patternIndex = 0;
      boss.telegraph = null;
      boss.attackTimer = 0.7;
      boss.rageFlash = 1.2;
      setBanner('抉择之影 · 狂暴', '吴朝阳进入第二阶段，弹幕密度大幅提升。', 'boss', 2.6);
      addToast('吴朝阳进入狂暴阶段 · 小心高密度弹幕', 'warn', 2.8);
      addRing(boss.x, boss.y, boss.r + 26, '#ff5a78', 0.75, 4);
      addRing(boss.x, boss.y, boss.r + 60, '#ffcf66', 0.55, 2);
      addShake(16);
      audio.play('boss_warn');
    }

    const t = game.time;
    const desiredX = p.x + Math.sin(t * 0.72 + boss.drift) * (boss.enraged ? 155 : 130);
    const desiredY = p.y - eventBossVerticalOffset() + Math.cos(t * 0.9 + boss.drift) * 24;
    const follow = 1 - Math.exp(-dt * (boss.enraged ? 2.0 : 1.45));
    boss.x += (desiredX - boss.x) * follow;
    boss.y += (desiredY - boss.y) * follow;
    clampToMap(boss);

    if (boss.spiral) {
      updateEventBossSpiral(boss, dt);
      return;
    }

    if (boss.telegraph) {
      if (boss.telegraph.type === 'trackingFan') {
        boss.telegraph.baseAngle = Math.atan2(p.y - boss.y, p.x - boss.x);
      }
      boss.telegraph.time -= dt;
      if (boss.telegraph.time <= 0) {
        const telegraph = boss.telegraph;
        boss.telegraph = null;
        executeEventBossTelegraph(boss, telegraph);
      }
      return;
    }

    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) startEventBossTelegraph(boss);
  }

  function spawnEventBossBullet(x, y, angle, speed, damage, radius, color, life) {
    if (!game) return;
    if (game.enemyBullets.length >= MAX_ENEMY_BULLETS - 2) return;
    game.enemyBullets.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: damage,
      radius: radius,
      life: life || 5.2,
      color: color,
      dead: false,
      eventBoss: true,
      trail: [{ x: x, y: y }]
    });
  }

  function damageEventBoss(amount, options) {
    if (!game || !game.eventBossActive || !game.eventBoss || game.eventBoss.defeated) return;
    const boss = game.eventBoss;
    const damage = Math.max(1, amount);
    boss.hp = Math.max(0, boss.hp - damage);
    boss.hitFlash = 0.14;
    if (!options || !options.silent) {
      addDamageNumber(boss.x + rand(-8, 8), boss.y - boss.r * 0.7, Math.round(damage), '#ffcf66', false, '-');
      audio.play('hit');
    }
    if (boss.hp <= 0) defeatEventBoss();
  }

  function defeatEventBoss() {
    if (!game || !game.eventBoss || game.eventBoss.defeated) return;
    const boss = game.eventBoss;
    boss.defeated = true;
    boss.dead = true;
    const bx = boss.x;
    const by = boss.y;
    game.eventBossActive = false;
    game.eventBoss = null;
    bossMusic.stop();
    game.eventBossDelayed = [];
    game.eventBossSpiral = null;
    game.enemyBullets = [];
    game.companionBullets = [];
    game.kills += 1;
    onEnemyKilled({ x: bx, y: by });
    game.player.invuln = Math.max(game.player.invuln, 2);

    addShake(24);
    audio.play('boss_die');
    addRing(bx, by, boss.r, '#ffcf66', 1.2, 5);
    addRing(bx, by, boss.r * 0.7, '#ff7b8d', 0.9, 3);
    for (let i = 0; i < 48; i += 1) {
      const angle = rand(0, TAU);
      const speed = rand(50, 360);
      spawnParticle(
        bx,
        by,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        rand(0.35, 1.1),
        rand(2, 9),
        Math.random() < 0.45 ? '#ffcf66' : Math.random() < 0.6 ? '#ff7b8d' : '#c9a7ff',
        true
      );
    }

    save.wuchaoyangBossKills = Math.max(0, Number(save.wuchaoyangBossKills) || 0) + 1;
    const firstClear = !save.wuchaoyangBossRewardClaimed;
    let coins = 0;
    if (firstClear) {
      coins = WUCHAOYANG_EVENT.reward.coins;
      save.coins += coins;
      game.coinsEarnedRun += coins;
      save.wuchaoyangBossRewardClaimed = true;
      refreshWalletDisplays();
    }
    persistSave();
    game.eventBossDefeated = true;
    game.randomEvent.phase = 'reward';
    showEventReward(WUCHAOYANG_EVENT, firstClear, coins);
  }

  function findCompanionTarget() {
    if (!game) return null;
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated) {
      return {
        kind: 'eventBoss',
        x: game.eventBoss.x,
        y: game.eventBoss.y,
        r: game.eventBoss.r
      };
    }
    let best = null;
    let bestDistance = 600 * 600;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead) continue;
      const d2 = distSq(game.companion.x, game.companion.y, enemy.x, enemy.y);
      if (d2 < bestDistance) {
        bestDistance = d2;
        best = enemy;
      }
    }
    if (!best) return null;
    return { kind: 'enemy', x: best.x, y: best.y, r: best.r, ref: best };
  }

  function spawnCompanionBullet(companion, target) {
    if (!game) return;
    if (game.companionBullets.length >= 80) game.companionBullets.shift();
    const angle = Math.atan2(target.y - companion.y, target.x - companion.x);
    const speed = 820;
    const x = companion.x + Math.cos(angle) * 18;
    const y = companion.y + Math.sin(angle) * 18;
    game.companionBullets.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: Math.max(1, game.stage) * 10,
      radius: 3.2,
      life: 1.15,
      color: '#ffcf66',
      dead: false,
      trail: [{ x: x, y: y }]
    });
    companion.aim = angle;
  }

  function updateCompanion(dt) {
    if (!game || !game.companion || game.player.dead) return;
    const c = game.companion;
    const p = game.player;
    const side = p.x < 110 ? 1 : -1;
    const targetX = clamp(p.x + side * 46, 24, MAP.w - 24);
    const targetY = clamp(p.y + 24, 24, MAP.h - 24);
    const follow = 1 - Math.exp(-dt * 7.5);
    c.x += (targetX - c.x) * follow;
    c.y += (targetY - c.y) * follow;
    c.bob += dt * 3.1;
    c.fireTimer -= dt;

    if (c.fireTimer > 0 || p.dead) return;
    if (game.stageState === 'transition') {
      c.fireTimer = 0.2;
      return;
    }
    const target = findCompanionTarget();
    if (!target) {
      c.fireTimer = 0.18;
      return;
    }
    spawnCompanionBullet(c, target);
    c.fireTimer = 0.62;
  }

  function updateCompanionBullets(dt) {
    if (!game) return;
    for (let i = 0; i < game.companionBullets.length; i += 1) {
      const bullet = game.companionBullets[i];
      if (bullet.dead) continue;
      bullet.life -= dt;
      const oldX = bullet.x;
      const oldY = bullet.y;
      const nextX = bullet.x + bullet.vx * dt;
      const nextY = bullet.y + bullet.vy * dt;
      bullet.trail.push({ x: nextX, y: nextY });
      if (bullet.trail.length > 6) bullet.trail.shift();

      if (bullet.life <= 0 || nextX < 0 || nextX > MAP.w || nextY < 0 || nextY > MAP.h) {
        bullet.dead = true;
        continue;
      }

      if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated) {
        if (segmentCircleHit(oldX, oldY, nextX, nextY, game.eventBoss.x, game.eventBoss.y, game.eventBoss.r + bullet.radius)) {
          damageEventBoss(bullet.damage, { silent: true });
          bullet.dead = true;
          continue;
        }
      }

      for (let j = 0; j < game.enemies.length; j += 1) {
        const enemy = game.enemies[j];
        if (enemy.dead) continue;
        if (!segmentCircleHit(oldX, oldY, nextX, nextY, enemy.x, enemy.y, enemy.r + bullet.radius)) continue;
        const dx = enemy.x - oldX;
        const dy = enemy.y - oldY;
        const length = Math.max(0.001, Math.hypot(dx, dy));
        damageEnemy(enemy, bullet.damage, {
          critical: false,
          pushX: (dx / length) * 10,
          pushY: (dy / length) * 10
        });
        bullet.dead = true;
        break;
      }

      if (!bullet.dead) {
        bullet.x = nextX;
        bullet.y = nextY;
      }
    }
    game.companionBullets = game.companionBullets.filter(function (bullet) {
      return !bullet.dead;
    });
  }

  function spawnEnemyBullet(x, y, angle, speed, damage, radius, color, options) {
    if (!game) return;
    const opts = options || {};
    if (game.enemyBullets.length >= MAX_ENEMY_BULLETS) game.enemyBullets.shift();
    game.enemyBullets.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage: damage,
      radius: radius,
      life: opts.life || 5.2,
      color: color,
      dead: false,
      ranged: !!opts.ranged,
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

  function isBrideLinked(enemy) {
    if (!game || !game.brideLink || game.brideLink.time <= 0) return false;
    return game.brideLink.targets.indexOf(enemy) !== -1;
  }

  function applyBrideDamageShare(enemy, amount, opts) {
    if (!isBrideLinked(enemy)) return 0;
    const targets = game.brideLink.targets.filter(function (target) {
      return target && !target.dead && target !== enemy && !target.charmed;
    });
    if (targets.length === 0) return 0;
    const share = amount * BRIDE_CONFIG.e.shareRatio;
    const each = share / targets.length;
    if (each <= 0) return 0;
    for (let i = 0; i < targets.length; i += 1) {
      damageEnemy(targets[i], each, {
        critical: false,
        silent: true,
        shared: true,
        noShare: true,
        pushX: 0,
        pushY: 0,
        allowCharmed: false
      });
    }
    return share;
  }

  function damageEnemy(enemy, amount, options) {
    if (!game || !enemy || enemy.dead) return;
    const opts = options || {};
    if (enemy.charmed && !opts.allowCharmed) return;
    let damage = Math.max(0.1, amount);
    if (!opts.shared && !opts.noShare) {
      const shared = applyBrideDamageShare(enemy, damage, opts);
      damage = Math.max(0.1, damage - shared);
    }
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
    onEnemyKilled(enemy);
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

  function blackAdiaoVideoUrl() {
    return 'assets/video/black-adiao.mp4?v=' + AVATAR_VERSION;
  }

  function preloadBlackAdiaoVideo() {
    if (!el.blackAdiaoVideo) return;
    const video = el.blackAdiaoVideo;
    const url = blackAdiaoVideoUrl();
    if (video.dataset.blackAdiaoSrc === url) return;
    video.dataset.blackAdiaoSrc = url;
    video.preload = 'auto';
    video.src = url;
    video.load();
  }

  function beginBlackAdiaoVideo() {
    if (!game || !el.blackAdiaoVideo) return false;
    if (game.blackAdiaoVideoActive || game.blackAdiaoTriggered) return false;
    game.blackAdiaoVideoActive = true;
    game.blackAdiaoTriggered = true;
    bossMusic.stop();
    game.boss = null;
    game.bossActive = false;
    game.enemyBullets = [];
    game.spawnTimer = 9999;
    game.stageState = 'boss-video';
    game.player.invuln = Math.max(game.player.invuln, 1.2);
    setState(S.CUTSCENE);
    clearInput();
    hideScreens();
    showScreen('blackAdiaoVideo');
    preloadBlackAdiaoVideo();
    try { el.blackAdiaoVideo.currentTime = 0; } catch (error) { /* metadata may still be loading */ }
    const playPromise = el.blackAdiaoVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        // 移动端自动播放被拒时保留跳过按钮，不直接进入战斗。
        addToast('视频无法自动播放，可点击“跳过视频”继续', 'warn', 2.8);
      });
    }
    lastFrameTime = performance.now();
    return true;
  }

  function finishBlackAdiaoVideo() {
    if (!game || !game.blackAdiaoVideoActive) return;
    game.blackAdiaoVideoActive = false;
    if (el.blackAdiaoVideo) {
      try { el.blackAdiaoVideo.pause(); } catch (error) { /* ignore */ }
    }
    hideScreens();
    setState(S.PLAYING);
    clearInput();
    game.stageState = 'boss';
    spawnBlackAdiao();
    lastFrameTime = performance.now();
  }

  function spawnBlackAdiao() {
    if (!game || game.player.dead || game.blackAdiaoDefeated) return null;
    if (game.boss && game.boss.blackAdiao && !game.boss.dead) return game.boss;
    const hp = 12000;
    const x = clamp(game.player.x + (Math.random() < 0.5 ? -1 : 1) * 280, 80, MAP.w - 80);
    const y = clamp(game.player.y - 160, 80, MAP.h - 80);
    const boss = {
      uid: ++game.enemyUid,
      type: 'boss',
      blackAdiao: true,
      name: '黑色阿吊',
      title: '第10关隐藏后续 Boss',
      x: x,
      y: y,
      r: 58,
      hp: hp,
      maxHp: hp,
      speed: 118,
      damage: 24,
      xpValue: 120,
      scoreValue: 8000,
      ring: '#8d5bff',
      theme: 'default',
      themeAccent: '#d9c7ff',
      themeBullet: '#d7c2ff',
      themeRage: '#ff4f6d',
      tier: 4,
      damageMult: 1.2,
      cooldownMult: 0.72,
      countBonus: 6,
      patternIndex: 0,
      patternCd: 1.1,
      spiral: null,
      zones: [],
      patternFlash: 0,
      hitFlash: 0,
      attackCd: 0.7,
      attackFlash: 0,
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
      specialCd: 1.2,
      volleyCd: 1.6,
      summoned: false,
      castFlash: 0,
      strafeDir: Math.random() < 0.5 ? -1 : 1,
      strafeTimer: rand(1.2, 2.4),
      rangedMode: true,
      rangedCd: 0.85,
      ringCd: 0.6,
      fanCd: 1.0,
      spiralCd: 0.15,
      spiralAngle: rand(0, TAU),
      comboCD: 2.8,
      meleeState: 'idle',
      meleeTime: 0,
      meleeCd: 1.3,
      meleeX: 0,
      meleeY: 0,
      meleeRadius: 104,
      meleeDamage: 48
    };
    game.enemies.push(boss);
    game.boss = boss;
    game.bossActive = true;
    bossMusic.start('black-adiao');
    game.stageState = 'boss';
    game.spawnTimer = 9999;
    setBanner('隐藏后续 Boss · 黑色阿吊', '高密度弹幕与巨物重击 · 击败后获得生命翻倍', 'boss', 3.2);
    addToast('黑色阿吊已降临', 'warn', 3);
    addShake(20);
    audio.play('boss_warn');
    addRing(x, y, 55, '#8d5bff', 1.2, 5);
    return boss;
  }

  function handleBossDeath(boss) {
    if (!game || boss.bossHandled) return;
    boss.bossHandled = true;
    game.boss = null;
    game.bossActive = false;
    bossMusic.stop();
    game.score += 2000 + game.stage * 500;
    healPlayer(30, true);

    addShake(20);
    audio.play('boss_die');
    setBanner('BOSS 已击败', '+ ' + formatNumber(2000 + game.stage * 500) + ' 分 · 恢复 30 生命', 'reward', 3.2);
    addToast('BOSS 额外奖励已结算', 'good', 3);
    addRing(boss.x, boss.y, boss.r, '#ffcf66', 1.1, 5);

    if (boss.blackAdiao) {
      if (!game.blackAdiaoRewardGranted) {
        game.blackAdiaoRewardGranted = true;
        const p = game.player;
        p.maxHp = Math.round(p.maxHp * 2);
        p.hp = Math.min(p.maxHp, p.hp * 2);
        addToast('黑色阿吊已击败 · 最大生命翻倍', 'good', 3.2);
        addRing(p.x, p.y, p.r + 14, '#ffcf66', 0.9, 4);
      }
      game.blackAdiaoDefeated = true;
      setBanner('黑色阿吊 · 击破', '最大生命值翻倍 · 隐藏路线完成', 'reward', 3.2);
      if (game.mode === 'stage') {
        game.stageState = 'transition';
        game.stageTransition = 2.8;
        game.score += 1200 * game.stage;
      }
      return;
    }

    if (game.mode === 'survival') {
      game.nextBossAt = game.time + 58;
    } else if (game.mode === 'stage') {
      if (game.stage === 10 && !game.blackAdiaoTriggered) {
        if (beginBlackAdiaoVideo()) return;
      }
      game.stageState = 'transition';
      game.stageTransition = 2.3;
      game.score += 300 * game.stage;
    }
  }

  function completeStageObjective() {
    if (!game || game.mode !== 'stage' || game.stageState !== 'fighting' || game.eventBossActive) return;
    if (isStageBossStage(game.stage)) {
      game.stageState = 'boss';
      audio.play('stage');
      spawnBoss('stage');
    } else {
      const finalStage = game.stage >= STAGE_DIFFICULTY.maxStage;
      game.stageState = 'transition';
      game.stageTransition = 1.8;
      game.score += 160 + game.stage * 45;
      setBanner(
        finalStage ? '最终目标完成' : '目标完成',
        finalStage ? '恭喜，即将完成全部 ' + STAGE_DIFFICULTY.maxStage + ' 关' : '即将进入第 ' + (game.stage + 1) + ' 关',
        finalStage ? 'reward' : 'stage',
        1.8
      );
      audio.play('stage');
    }
  }

  function awardStageClearCoins(stage) {
    if (!game || game.mode !== 'stage') return 0;
    const completedStage = Math.max(1, Math.floor(Number(stage) || 1));
    if (completedStage <= (game.lastRewardedStage || 0)) return 0;

    const reward = stageClearCoinReward(completedStage);
    game.lastRewardedStage = completedStage;
    save.coins += reward;
    game.coinsEarnedRun += reward;
    persistSave();
    refreshWalletDisplays();
    game.coinReward = {
      stage: completedStage,
      amount: reward,
      time: 3.4,
      total: 3.4
    };
    audio.play('coin');
    return reward;
  }

  function advanceStage() {
    if (!game || game.mode !== 'stage' || game.victoryShown) return;
    const completedStage = game.stage;
    awardStageClearCoins(completedStage);

    if (completedStage >= STAGE_DIFFICULTY.maxStage) {
      showVictory();
      return;
    }

    game.stage += 1;
    game.stageKills = 0;
    game.stageTarget = stageTargetFor(game.stage);
    game.stageState = 'fighting';
    game.stageTransition = 0;
    game.spawnTimer = 0.9;
    if (game.stage === 10 && game.mode === 'stage') {
      // 第 10 关开始即预热缩小后的 CG，避免 Boss 死亡后才开始下载/解码。
      preloadBlackAdiaoVideo();
    }
    game.score += 250 + game.stage * 60;
    healPlayer(15, true);
    setBanner(
      '第 ' + game.stage + ' 关',
      '目标：击败 ' + game.stageTarget + ' 名追兵' + (isStageBossStage(game.stage) ? ' · 本关有 BOSS' : ''),
      'stage',
      2.4
    );
    audio.play('stage');

    // 只在第三关真正结束、且本局尚未触发过事件时判定一次。此时已进入第 4 关，
    // 事件结束后直接恢复第 4 关，不会重复推进关卡。
    if (completedStage === 3 && game.mode === 'stage' && randomEventManager) {
      const event = randomEventManager.tryTrigger('stage-clear', {
        stage: completedStage,
        mode: game.mode
      });
      if (event) openRandomEvent(event);
    }

    // 神临只会在进入第 8 关时尝试一次；事件管理器自身也限制了其他触发点的候选。
    if (game.stage === 8 && game.mode === 'stage' && randomEventManager) {
      const shenlinEvent = randomEventManager.tryTrigger('stage-enter', {
        stage: 8,
        mode: game.mode
      });
      if (shenlinEvent) openRandomEvent(shenlinEvent);
    }
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
    bossMusic.stop();
    if (game.blackAdiaoVideoActive) {
      game.blackAdiaoVideoActive = false;
      if (el.blackAdiaoVideo) {
        try { el.blackAdiaoVideo.pause(); } catch (error) { /* ignore */ }
      }
      hideScreens();
    }
    if (game.boss && game.boss.blackAdiao) {
      game.boss = null;
      game.bossActive = false;
      game.enemyBullets = [];
    }
    if (game.shenlin) {
      stopShenlinChallenge();
      if (randomEventManager) randomEventManager.finish();
      game.randomEvent.active = false;
      game.randomEvent.phase = 'dead';
    }
    if (game.eventBossActive) {
      game.eventBossActive = false;
      game.eventBoss = null;
      game.eventBossDelayed = [];
      game.eventBossSpiral = null;
      game.enemyBullets = [];
    }
    game.companion = null;
    game.companionBullets = [];
    game.companionRecruitedThisRun = false;
    resetPlayerSkillRuntime();
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

  function showVictory() {
    if (!game || game.mode !== 'stage' || game.victoryShown) return;
    bossMusic.stop();
    closeStatsPanel();
    game.victoryShown = true;
    game.stageState = 'cleared';
    game.banner = null;
    game.coinReward = null;
    game.finalScore = Math.max(0, Math.floor(game.score));

    const previousHigh = save.highScore;
    const oldMaxTime = save.maxTime;
    const oldMaxLevel = save.maxLevel;
    const newHigh = game.finalScore > previousHigh;
    const newTime = Math.floor(game.time) > oldMaxTime;
    const newLevel = game.level > oldMaxLevel;

    if (!game.statsCommitted) {
      game.statsCommitted = true;
      save.highScore = Math.max(save.highScore, game.finalScore);
      save.maxTime = Math.max(save.maxTime, Math.floor(game.time));
      save.maxLevel = Math.max(save.maxLevel, game.level);
      save.totalKills += game.kills;
      save.highestStage = Math.max(save.highestStage || 0, STAGE_DIFFICULTY.maxStage);
      persistSave();
    }

    setState(S.VICTORY);
    hideScreens();
    clearInput();
    showScreen('victory');
    el.victoryStage.textContent = String(STAGE_DIFFICULTY.maxStage);
    el.victoryKills.textContent = formatNumber(game.kills);
    el.victoryCoins.textContent = formatNumber(game.coinsEarnedRun);
    el.victoryTime.textContent = formatTime(game.time);
    el.victoryScore.textContent = formatNumber(game.finalScore);
    el.victoryBest.textContent = '历史最高分：' + formatNumber(save.highScore);
    el.victoryRecordBadge.hidden = !(newHigh || newTime || newLevel);
    if (newHigh) {
      el.victoryRecordBadge.textContent = '★ 新纪录 · 最高分';
    } else if (newTime) {
      el.victoryRecordBadge.textContent = '★ 新纪录 · 最长存活';
    } else if (newLevel) {
      el.victoryRecordBadge.textContent = '★ 新纪录 · 最高等级';
    }
    updateMenuStats();
    audio.play('victory');
    lastFrameTime = performance.now();
    window.setTimeout(function () {
      if (state === S.VICTORY && el.victoryRestartBtn) {
        el.victoryRestartBtn.focus({ preventScroll: true });
      }
    }, 100);
  }

  function showGameOver() {
    if (!game || game.gameOverShown || state !== S.DYING) return;
    bossMusic.stop();
    closeStatsPanel();
    game.gameOverShown = true;
    cleanupEventOnGameOver();
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
      return key !== 'laser' && !p.unlocked[key];
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
      if (bullet.delayedByFreeze && isFreezeActive()) continue;

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

      // 特殊事件 Boss 不在普通 enemies 数组中，单独参与玩家子弹碰撞。
      if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated && !bullet.hits.has('event-boss')) {
        const eventBoss = game.eventBoss;
        if (segmentCircleHit(oldX, oldY, nextX, nextY, eventBoss.x, eventBoss.y, eventBoss.r + bullet.radius)) {
          bullet.hits.add('event-boss');
          if (bullet.kind === 'rocket') {
            explode(nextX, nextY, bullet.splashRadius, bullet.splashDamage, bullet);
            bullet.dead = true;
            hitSomething = true;
          } else {
            damageEventBoss(bullet.damage, { critical: bullet.critical });
            if (bullet.pierce > 1) {
              bullet.pierce -= 1;
            } else {
              bullet.dead = true;
              hitSomething = true;
            }
          }
        }
      }

      for (let j = 0; j < enemies.length; j += 1) {
        if (bullet.dead) break;
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
        if (bullet.laser) {
          addRing(nextX, nextY, 16, '#e8fbff', 0.22, 3);
          for (let k = 0; k < 5; k += 1) {
            const a = rand(0, TAU);
            spawnParticle(nextX, nextY, Math.cos(a) * rand(20, 90), Math.sin(a) * rand(20, 90), rand(0.12, 0.28), rand(2, 4), '#dff9ff', true);
          }
        }

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

    if (game.eventBossActive && game.eventBoss && !game.eventBoss.defeated) {
      const boss = game.eventBoss;
      const bossDistance = Math.hypot(boss.x - x, boss.y - y);
      const bossReach = radius + boss.r;
      if (bossDistance <= bossReach) {
        const falloff = clamp(1 - Math.max(0, bossDistance - boss.r * 0.35) / radius, 0.32, 1);
        damageEventBoss(damage * falloff, { silent: true });
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

      const tentacle = isNunForm() ? game.nunTentacle : null;
      if (tentacle && segmentCircleHit(oldX, oldY, nextX, nextY, tentacle.x, tentacle.y, 38 + bullet.radius)) {
        bullet.dead = true;
        damageNunTentacle(bullet.damage);
        addRing(tentacle.x, tentacle.y, 32, '#8f4fff', 0.2, 2);
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
    if (game.laserBeams && game.laserBeams.length) {
      for (let i = 0; i < game.laserBeams.length; i += 1) game.laserBeams[i].life -= dt;
      game.laserBeams = game.laserBeams.filter(function (beam) { return beam.life > 0; });
    }

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

    if (game.coinReward) {
      game.coinReward.time -= dt;
      if (game.coinReward.time <= 0) game.coinReward = null;
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
    updatePlayerSkills(dt);
    updateCamera(dt);
    updatePlayerCombat(dt);
    if (state !== S.PLAYING) return;

    if (game.shenlin && game.shenlin.active) {
      updateShenlinChallenge(dt);
      if (state !== S.PLAYING) return;
    }

    const frozen = isFreezeActive();
    updateCompanion(dt);
    if (!frozen) {
      updateEventBoss(dt);
      if (state !== S.PLAYING) return;
      if (!game.shenlin) {
        updateSpawning(dt);
        updateEnemies(dt);
      }
    }
    if (state === S.PLAYING) updateSkillProjectiles(dt);
    if (state === S.PLAYING) updateBrideProjectiles(dt);
    if (state === S.PLAYING) updatePlayerBullets(dt);
    if (state === S.PLAYING && !frozen) updateEnemyBullets(dt);
    if (state === S.PLAYING) updateCompanionBullets(dt);
    if (!frozen) updateTransferMarks(dt);
    if (state !== S.PLAYING) return;
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

    // CG 是独立 HTML 视频层；播放期间跳过整张游戏画布的逐帧重绘，避免
    // Canvas + backdrop-filter 与视频解码争夺主线程/合成线程。
    if (state !== S.CUTSCENE) {
      render(now);
    }
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
    } else if (key === 'laser') {
      ctx.fillRect(-16, -4, 18, 8);
      ctx.beginPath();
      ctx.moveTo(2, -3);
      ctx.lineTo(18, -1);
      ctx.lineTo(2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.strokeRect(-16, -4, 18, 8);
      ctx.beginPath();
      ctx.moveTo(-4, -9);
      ctx.lineTo(-4, 7);
      ctx.stroke();
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
    drawEventBossTelegraphs();
    drawChargerTelegraphs();
    drawBossTelegraphs();
    drawRewindEcho();
    drawBrideAura();
    drawBrideLinks();
    drawNunAura();
    drawCharacters(now);
    drawNunEntities();
    drawKoreanZombie();
    drawBullets();
    drawLaserBeams();
    drawSkillProjectiles();
    drawBrideProjectiles();
    drawCompanionBullets();
    drawParticles();
    drawDamageNumbers();
    drawKoreanUltimate(now);
    drawShenlinHazards();

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

    const stageTheme = game && game.mode === 'stage' ? game.mapTheme : null;
    const mapBorder = stageTheme ? STAGE_MAP_BORDERS[stageTheme] : null;
    if (stageTheme) {
      drawStageMapBackground(camX, camY, stageTheme, game.mapSeed || 1);
    }

    ctx.save();
    ctx.strokeStyle = mapBorder ? mapBorder.soft : 'rgba(93,225,255,0.16)';
    ctx.lineWidth = 2;
    ctx.setLineDash([24, 16]);
    ctx.strokeRect(14, 14, MAP.w - 28, MAP.h - 28);
    ctx.setLineDash([]);
    ctx.strokeStyle = mapBorder ? mapBorder.strong : 'rgba(93,225,255,0.52)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0, 0, MAP.w, MAP.h);
    ctx.restore();

    const corner = 90;
    ctx.save();
    ctx.strokeStyle = mapBorder ? mapBorder.strong : 'rgba(93,225,255,0.58)';
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

  function stageHash(seed, x, y, salt) {
    let h = Math.imul(seed | 0, 374761393) ^
      Math.imul(x | 0, 668265263) ^
      Math.imul(y | 0, 1274126177) ^
      Math.imul((salt || 0) | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  function drawPixelPine(x, y, size, dark, light) {
    ctx.fillStyle = dark;
    for (let row = 0; row < 5; row += 1) {
      const t = row / 4;
      const width = size * (1 - t * 0.72);
      const layerY = y - row * size * 0.18;
      ctx.fillRect(Math.round(x - width * 0.5), Math.round(layerY), Math.round(width), Math.max(2, Math.round(size * 0.18)));
    }
    ctx.fillStyle = light;
    for (let row = 0; row < 5; row += 1) {
      const t = row / 4;
      const width = size * (1 - t * 0.72);
      const layerY = y - row * size * 0.18;
      ctx.fillRect(Math.round(x - width * 0.3), Math.round(layerY), Math.round(width * 0.6), 2);
    }
    ctx.fillStyle = '#4b3b2b';
    ctx.fillRect(Math.round(x - 2), Math.round(y + 2), 4, Math.round(size * 0.22));
  }

  function drawPixelCactus(x, y, size) {
    const green = '#477b43';
    const light = '#6c9f50';
    ctx.fillStyle = green;
    ctx.fillRect(Math.round(x - 3), Math.round(y - size), 6, size);
    ctx.fillRect(Math.round(x - 12), Math.round(y - size * 0.55), 9, 5);
    ctx.fillRect(Math.round(x - 12), Math.round(y - size * 0.55), 5, 14);
    ctx.fillRect(Math.round(x + 3), Math.round(y - size * 0.72), 9, 5);
    ctx.fillRect(Math.round(x + 8), Math.round(y - size * 0.72), 5, 12);
    ctx.fillStyle = light;
    ctx.fillRect(Math.round(x - 2), Math.round(y - size + 2), 2, Math.max(3, size - 4));
    ctx.fillRect(Math.round(x - 10), Math.round(y - size * 0.55 + 1), 2, 4);
  }

  function drawPixelRock(x, y, size, color, shade) {
    ctx.fillStyle = shade;
    ctx.fillRect(Math.round(x - size * 0.5), Math.round(y - size * 0.2), Math.round(size), Math.round(size * 0.5));
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - size * 0.38), Math.round(y - size * 0.36), Math.round(size * 0.74), Math.round(size * 0.34));
    ctx.fillRect(Math.round(x - size * 0.25), Math.round(y - size * 0.46), Math.round(size * 0.44), Math.round(size * 0.14));
  }

  function drawPixelFlower(x, y, color) {
    ctx.fillStyle = '#3f783f';
    ctx.fillRect(Math.round(x), Math.round(y), 1, 5);
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - 2), Math.round(y - 2), 2, 2);
    ctx.fillRect(Math.round(x + 1), Math.round(y - 2), 2, 2);
    ctx.fillRect(Math.round(x - 1), Math.round(y - 4), 2, 2);
  }

  function drawPixelBush(x, y, size, color, highlight) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x - size * 0.5), Math.round(y - size * 0.4), Math.round(size), Math.round(size * 0.55));
    ctx.fillRect(Math.round(x - size * 0.32), Math.round(y - size * 0.58), Math.round(size * 0.62), Math.round(size * 0.4));
    ctx.fillStyle = highlight;
    ctx.fillRect(Math.round(x - size * 0.28), Math.round(y - size * 0.55), Math.round(size * 0.25), 2);
    ctx.fillRect(Math.round(x + size * 0.05), Math.round(y - size * 0.34), Math.round(size * 0.2), 2);
  }

  function drawStageMapBackground(camX, camY, theme, seed) {
    const time = performance.now() * 0.001;
    const left = Math.max(0, Math.floor(camX) - 80);
    const top = Math.max(0, Math.floor(camY) - 80);
    const right = Math.min(MAP.w, Math.ceil(camX + view.w) + 80);
    const bottom = Math.min(MAP.h, Math.ceil(camY + view.h) + 80);
    const width = Math.max(1, right - left);
    const height = Math.max(1, bottom - top);
    const horizonY = camY + 78;
    const groundTop = Math.max(top, Math.floor(horizonY));

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (theme === 'desert') {
      ctx.fillStyle = '#c8954e';
      ctx.fillRect(0, 0, MAP.w, MAP.h);
      for (let y = Math.floor(top / 78) * 78; y < bottom; y += 78) {
        for (let x = Math.floor(left / 78) * 78; x < right; x += 78) {
          const h = stageHash(seed, x, y, 11);
          if (h > 0.7) {
            ctx.fillStyle = h > 0.88 ? '#e2b96d' : '#b77e3f';
            ctx.globalAlpha = 0.4;
            ctx.fillRect(x + Math.floor(h * 30), y + Math.floor(h * 12), h > 0.88 ? 5 : 3, 2);
            ctx.globalAlpha = 1;
          }
        }
      }
      for (let y = Math.floor(groundTop / 220) * 220; y < bottom; y += 220) {
        for (let x = Math.floor(left / 260) * 260; x < right; x += 260) {
          const h = stageHash(seed, x, y, 21);
          if (h < 0.13) drawPixelCactus(x + 40, y + 25, 34 + h * 30);
          else if (h < 0.34) drawPixelRock(x + 70, y + 35, 16 + h * 28, '#d8a45a', '#aa7138');
          else if (h > 0.9) {
            ctx.fillStyle = 'rgba(111, 72, 38, 0.35)';
            ctx.fillRect(x + 50, y + 18, 40, 7);
            ctx.fillRect(x + 58, y + 11, 24, 7);
          }
        }
      }
      for (let y = Math.floor(groundTop / 760) * 760; y < bottom; y += 760) {
        for (let x = Math.floor(left / 940) * 940; x < right; x += 940) {
          const h = stageHash(seed, x, y, 31);
          if (h > 0.5) {
            const bx = x + 180;
            const by = y + 110;
            ctx.fillStyle = 'rgba(120, 78, 37, 0.42)';
            ctx.fillRect(bx + 4, by + 10, 96, 10);
            ctx.fillStyle = '#d1a05b';
            ctx.fillRect(bx, by - 34, 24, 44);
            ctx.fillRect(bx + 34, by - 52, 18, 62);
            ctx.fillRect(bx + 60, by - 26, 34, 36);
            ctx.fillStyle = '#9b6837';
            ctx.fillRect(bx + 4, by - 28, 6, 28);
            ctx.fillRect(bx + 38, by - 44, 5, 44);
            ctx.fillRect(bx + 66, by - 20, 8, 20);
            ctx.fillStyle = 'rgba(255, 225, 160, 0.16)';
            ctx.fillRect(bx + 2, by - 34, 3, 24);
            ctx.fillRect(bx + 36, by - 52, 3, 30);
          }
        }
      }
      const dustCount = Math.min(34, Math.floor(width * height / 26000));
      for (let i = 0; i < dustCount; i += 1) {
        const h = stageHash(seed, i, 4, 61);
        const x = left + ((h * width + time * (5 + (i % 3) * 3)) % width);
        const y = top + ((stageHash(seed, i, 5, 62) * height + time * (2 + (i % 2))) % height);
        ctx.fillStyle = i % 3 ? 'rgba(255, 226, 156, 0.38)' : 'rgba(255, 245, 207, 0.5)';
        ctx.fillRect(Math.round(x), Math.round(y), i % 4 === 0 ? 3 : 2, 1);
      }

    } else if (theme === 'snow') {
      ctx.fillStyle = '#b9d7e7';
      ctx.fillRect(0, 0, MAP.w, MAP.h);
      for (let y = Math.floor(top / 96) * 96; y < bottom; y += 96) {
        for (let x = Math.floor(left / 96) * 96; x < right; x += 96) {
          const h = stageHash(seed, x, y, 12);
          if (h > 0.58) {
            ctx.fillStyle = h > 0.84 ? '#eefaff' : 'rgba(221, 243, 250, 0.7)';
            ctx.fillRect(x + 15, y + 14, 20 + Math.floor(h * 18), 3);
          }
        }
      }
      for (let y = Math.floor(groundTop / 210) * 210; y < bottom; y += 210) {
        for (let x = Math.floor(left / 250) * 250; x < right; x += 250) {
          const h = stageHash(seed, x, y, 22);
          if (h < 0.33) drawPixelPine(x + 55, y + 52, 30 + h * 34, '#2d5c68', '#dff5ff');
          else if (h < 0.42) drawPixelRock(x + 78, y + 45, 18 + h * 24, '#dff3fa', '#7ea9bb');
          else if (h > 0.74) {
            ctx.fillStyle = 'rgba(232, 250, 255, 0.38)';
            ctx.fillRect(x + 25, y + 36, 82, 8);
            ctx.fillRect(x + 42, y + 28, 46, 8);
          }
        }
      }
      for (let y = Math.floor(groundTop / 720) * 720; y < bottom; y += 720) {
        for (let x = Math.floor(left / 860) * 860; x < right; x += 860) {
          const h = stageHash(seed, x, y, 32);
          if (h > 0.45) {
            const gx = x + 230;
            const gy = y + 100;
            ctx.fillStyle = 'rgba(132, 198, 220, 0.32)';
            ctx.fillRect(gx + 12, gy + 8, 112, 8);
            ctx.fillStyle = '#c4e8f3';
            ctx.fillRect(gx, gy - 42, 34, 50);
            ctx.fillRect(gx + 36, gy - 62, 24, 70);
            ctx.fillRect(gx + 62, gy - 34, 46, 42);
            ctx.fillStyle = '#8bbdcd';
            ctx.fillRect(gx + 6, gy - 34, 7, 34);
            ctx.fillRect(gx + 42, gy - 56, 7, 56);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
            ctx.fillRect(gx + 2, gy - 42, 4, 34);
            ctx.fillRect(gx + 38, gy - 62, 4, 44);
          }
        }
      }
      const sky = ctx.createLinearGradient(0, camY - 20, 0, camY + 110);
      sky.addColorStop(0, 'rgba(17, 43, 70, 0.78)');
      sky.addColorStop(1, 'rgba(99, 151, 177, 0)');
      ctx.fillStyle = sky;
      ctx.fillRect(camX - 80, camY - 80, view.w + 160, 200);
      for (let band = 0; band < 3; band += 1) {
        ctx.strokeStyle = band === 1 ? 'rgba(134, 255, 213, 0.16)' : 'rgba(111, 203, 255, 0.12)';
        ctx.lineWidth = 16;
        ctx.beginPath();
        for (let x = camX - 80; x <= camX + view.w + 80; x += 30) {
          const y = camY + 18 + band * 18 + Math.sin(x * 0.006 + time * 0.25 + band) * 12;
          if (x === camX - 80) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      const windCount = Math.min(42, Math.floor(width * height / 21000));
      for (let i = 0; i < windCount; i += 1) {
        const layer = i % 3;
        const h = stageHash(seed, i, 7, 71);
        const speed = 9 + layer * 12;
        const x = left + ((h * width + time * speed) % width);
        const y = top + ((stageHash(seed, i, 8, 72) * height + time * (5 + layer * 4)) % height);
        ctx.fillStyle = layer === 0 ? 'rgba(255,255,255,0.35)' : layer === 1 ? 'rgba(235,250,255,0.55)' : 'rgba(210,242,255,0.7)';
        const s = layer === 2 ? 3 : 2;
        ctx.fillRect(Math.round(x), Math.round(y), s, s);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) {
        const wy = camY + 130 + i * 44;
        ctx.beginPath();
        ctx.moveTo(camX + 20 + i * 31, wy);
        ctx.lineTo(camX + 170 + i * 49, wy + 5);
        ctx.stroke();
      }

    } else if (theme === 'grass') {
      ctx.fillStyle = '#5f9e50';
      ctx.fillRect(0, 0, MAP.w, MAP.h);
      for (let y = Math.floor(top / 84) * 84; y < bottom; y += 84) {
        for (let x = Math.floor(left / 84) * 84; x < right; x += 84) {
          const h = stageHash(seed, x, y, 13);
          if (h > 0.7) {
            ctx.fillStyle = h > 0.88 ? '#8dbc5f' : '#4c8747';
            ctx.fillRect(x + 11, y + 16, 5, 2);
          }
        }
      }
      const sky = ctx.createLinearGradient(0, camY - 30, 0, camY + 92);
      sky.addColorStop(0, '#75bee4');
      sky.addColorStop(1, 'rgba(117, 190, 228, 0)');
      ctx.fillStyle = sky;
      ctx.fillRect(camX - 80, camY - 80, view.w + 160, 190);
      const mountainBase = camY + 96;
      const mountainLeft = camX - 80;
      const mountainRight = camX + view.w + 80;
      const mountainStep = 96;
      ctx.fillStyle = '#587b69';
      ctx.beginPath();
      ctx.moveTo(mountainLeft, mountainBase + 8);
      for (let i = 0; i * mountainStep <= view.w + 240; i += 1) {
        const x = mountainLeft + i * mountainStep;
        const peak = 28 + stageHash(seed, i, 0, 33) * 40;
        ctx.lineTo(x + 18, mountainBase + 8);
        ctx.lineTo(x + 48, mountainBase - peak);
        ctx.lineTo(x + 78, mountainBase + 8);
        if (x + 78 > mountainRight) break;
      }
      ctx.lineTo(mountainRight, mountainBase + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(235, 250, 255, 0.55)';
      for (let i = 0; i < 4; i += 1) {
        const cloudX = camX + ((time * (4 + i) + i * 230) % (view.w + 300)) - 120;
        const cloudY = camY + 18 + i * 11;
        ctx.fillRect(Math.round(cloudX), Math.round(cloudY), 54, 7);
        ctx.fillRect(Math.round(cloudX + 12), Math.round(cloudY - 6), 28, 6);
      }
      for (let y = Math.floor(groundTop / 150) * 150; y < bottom; y += 150) {
        for (let x = Math.floor(left / 160) * 160; x < right; x += 160) {
          const h = stageHash(seed, x, y, 23);
          if (h > 0.82) drawPixelBush(x + 44, y + 40, 22 + h * 22, '#356f3b', '#76a94f');
          else if (h > 0.62) drawPixelFlower(x + 25, y + 30, h > 0.76 ? '#fff2a8' : h > 0.69 ? '#f5a2c5' : '#e8f4ff');
        }
      }
      ctx.strokeStyle = 'rgba(39, 96, 52, 0.42)';
      ctx.lineWidth = 1;
      const grassCount = Math.min(90, Math.floor(width * height / 12000));
      for (let i = 0; i < grassCount; i += 1) {
        const gx = left + stageHash(seed, i, 2, 41) * width;
        const gy = top + stageHash(seed, i, 3, 42) * height;
        const sway = Math.sin(time * 1.3 + i * 1.7) * 2;
        ctx.beginPath();
        ctx.moveTo(Math.round(gx), Math.round(gy));
        ctx.lineTo(Math.round(gx + sway), Math.round(gy - 5));
        ctx.stroke();
      }
      for (let i = 0; i < 16; i += 1) {
        const h = stageHash(seed, i, 9, 51);
        const x = left + ((h * width + time * (5 + (i % 4) * 2)) % width);
        const y = top + ((stageHash(seed, i, 10, 52) * height - time * (2 + (i % 3))) % height + height) % height;
        ctx.fillStyle = 'rgba(248, 247, 198, 0.55)';
        ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      }
    }

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
    if (game.eventBossActive && game.eventBoss && !game.eventBoss.dead) {
      if (isWorldVisible(game.eventBoss.x, game.eventBoss.y, game.eventBoss.r + 120)) {
        drawList.push({ type: 'eventBoss', y: game.eventBoss.y, ref: game.eventBoss });
      }
    }
    if (game.companion && game.companion.active) {
      if (isWorldVisible(game.companion.x, game.companion.y, game.companion.r + 30)) {
        drawList.push({ type: 'companion', y: game.companion.y, ref: game.companion });
      }
    }
    if (!game.player.dead || state === S.DYING) {
      drawList.push({ type: 'player', y: game.player.y, ref: game.player });
    }
    drawList.sort(function (a, b) { return a.y - b.y; });

    for (let i = 0; i < drawList.length; i += 1) {
      if (drawList[i].type === 'enemy') {
        drawEnemy(drawList[i].ref, now);
      } else if (drawList[i].type === 'eventBoss') {
        drawEventBoss(now);
      } else if (drawList[i].type === 'companion') {
        drawCompanion(now);
      } else {
        drawPlayer(now);
      }
    }
  }

  function stageGroundShadow(alpha) {
    if (!game || game.mode !== 'stage' || !game.mapTheme) {
      return 'rgba(0,0,0,' + alpha + ')';
    }
    if (game.mapTheme === 'desert') {
      return 'rgba(77,49,23,' + (alpha * 0.72).toFixed(3) + ')';
    }
    if (game.mapTheme === 'snow') {
      return 'rgba(44,68,89,' + (alpha * 0.55).toFixed(3) + ')';
    }
    return 'rgba(26,57,31,' + (alpha * 0.7).toFixed(3) + ')';
  }

  function drawEnemy(enemy, now) {
    const spawnScale = enemy.spawnT > 0 ? 0.5 + (1 - enemy.spawnT / 0.6) * 0.5 : 1;
    const scale = clamp(spawnScale, 0.45, 1);
    const radius = enemy.r * scale;
    const time = now * 0.001;

    ctx.save();

    ctx.fillStyle = stageGroundShadow(0.42);
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + enemy.r * 0.72, enemy.r * 0.92, enemy.r * 0.38, 0, 0, TAU);
    ctx.fill();

    const isRanged = enemy.variant === 'ranged';
    const isCharger = enemy.variant === 'charger';
    const bossTheme = enemy.type === 'boss' ? (BOSS_THEMES[enemy.theme] || BOSS_THEMES.default) : null;
    if (isRanged) {
      const farAura = ctx.createRadialGradient(
        enemy.x,
        enemy.y,
        enemy.r * 0.35,
        enemy.x,
        enemy.y,
        enemy.r * 1.9
      );
      farAura.addColorStop(0, 'rgba(255, 179, 94, 0.2)');
      farAura.addColorStop(1, 'rgba(255, 179, 94, 0)');
      ctx.fillStyle = farAura;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r * 1.9, 0, TAU);
      ctx.fill();

      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(time * 0.9);
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255, 179, 94, 0.66)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r + 9, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    if (enemy.type === 'boss') {
      const aura = ctx.createRadialGradient(enemy.x, enemy.y, enemy.r * 0.42, enemy.x, enemy.y, enemy.r * 2.15);
      aura.addColorStop(0, bossTheme ? bossTheme.aura : 'rgba(255,79,109,0.14)');
      aura.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.r * 2.15, 0, TAU);
      ctx.fill();

      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(time * 0.32);
      ctx.strokeStyle = enemy.enraged ? (enemy.themeRage || '#ff5a3c') : (enemy.themeAccent || '#ff4f6d');
      ctx.globalAlpha = enemy.enraged ? 0.7 : 0.48;
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
      ctx.globalAlpha = 1;
      ctx.restore();

      if (bossTheme) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 4; i += 1) {
          const angle = time * (enemy.theme === 'snow' ? 0.9 : 0.55) + i * TAU / 4;
          const rr = enemy.r * (1.55 + i * 0.14);
          ctx.globalAlpha = 0.18 + (i % 2) * 0.08;
          ctx.strokeStyle = bossTheme.accent;
          ctx.lineWidth = enemy.theme === 'snow' ? 2 : 3;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, rr, angle, angle + 0.42);
          ctx.stroke();
        }
        ctx.restore();
      }
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

    if (enemy.blackAdiao && blackAdiaoTexture.complete && blackAdiaoTexture.naturalWidth > 0) {
      const h = 158;
      const w = h * (blackAdiaoTexture.naturalWidth / blackAdiaoTexture.naturalHeight);
      ctx.save();
      ctx.globalAlpha = 0.98;
      ctx.drawImage(blackAdiaoTexture, enemy.x - w * 0.5, enemy.y - h * 0.5, w, h);
      ctx.restore();
    } else {
      // 普通敌人、精英敌人和 BOSS 均使用 assets/enemy.png。
      drawCircularAvatar(
        avatars.enemy,
        enemy.x,
        enemy.y,
        radius,
        enemy.type === 'boss'
          ? (enemy.enraged ? (enemy.themeRage || '#ff5a3c') : (enemy.ring || '#ff4f6d'))
          : isCharger ? '#ff4b4b' : isRanged ? '#ffb35e' : enemy.type === 'elite' ? '#ffb35e' : '#ff6b7d',
        {
          ringWidth: enemy.type === 'boss' ? 3.5 : (isRanged || enemy.type === 'elite') ? 2.4 : 1.8,
          dashed: enemy.type === 'elite'
        }
      );
    }

    if (enemy.blackAdiao && enemy.meleeState !== 'idle') {
      const warnX = enemy.meleeX;
      const warnY = enemy.meleeY;
      const warnPulse = 0.5 + Math.sin(performance.now() * 0.014) * 0.2;
      const warnRadius = enemy.meleeRadius + game.player.r;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 3;
      ctx.setLineDash([10, 7]);
      ctx.globalAlpha = warnPulse;
      ctx.beginPath();
      ctx.arc(warnX, warnY, warnRadius, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#ff4f6d';
      ctx.beginPath();
      ctx.arc(warnX, warnY, warnRadius, 0, TAU);
      ctx.fill();
      ctx.restore();
      if (enemy.meleeState === 'windup' && blackAdiaoWeaponTexture.complete && blackAdiaoWeaponTexture.naturalWidth > 0) {
        const wh = 86;
        const ww = wh * (blackAdiaoWeaponTexture.naturalWidth / blackAdiaoWeaponTexture.naturalHeight);
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.drawImage(blackAdiaoWeaponTexture, warnX - ww * 0.5, warnY - wh - 18 + Math.sin(performance.now() * 0.02) * 4, ww, wh);
        ctx.restore();
      } else if (enemy.meleeState === 'slam' && blackAdiaoWeaponTexture.complete && blackAdiaoWeaponTexture.naturalWidth > 0) {
        const wh = 132;
        const ww = wh * (blackAdiaoWeaponTexture.naturalWidth / blackAdiaoWeaponTexture.naturalHeight);
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(blackAdiaoWeaponTexture, warnX - ww * 0.5, warnY - wh * 0.55, ww, wh);
        ctx.restore();
      }
    }

    if (isFreezeActive()) {
      ctx.save();
      ctx.globalAlpha = 0.44;
      ctx.fillStyle = 'rgba(120, 225, 255, 0.16)';
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius + 6, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#a8edff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius + 7, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (enemy.transferMark) {
      const mark = enemy.transferMark;
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      ctx.rotate(time * 1.6);
      ctx.strokeStyle = mark.exploded ? '#ffcf66' : '#ff6b5f';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, radius + 10, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.textAlign = 'center';
      setMonoFont(7, 800);
      ctx.fillStyle = mark.exploded ? '#ffcf66' : '#ff9b83';
      ctx.fillText(mark.exploded ? '已解约' : '转会 ' + mark.time.toFixed(1) + 's', enemy.x, enemy.y - radius - 23);
    }

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

    if (enemy.attackFlash > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(enemy.attackFlash * 4.2, 0, 0.85);
      ctx.strokeStyle = isCharger ? '#ff4b4b' : isRanged ? '#ffb35e' : '#ff6b7d';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, radius + 11, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (isRanged && enemy.shootWindup > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(time * 18) * 0.12;
      ctx.strokeStyle = '#ffb35e';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.moveTo(
        enemy.x + Math.cos(enemy.aimAngle) * (enemy.r + 4),
        enemy.y + Math.sin(enemy.aimAngle) * (enemy.r + 4)
      );
      ctx.lineTo(
        enemy.x + Math.cos(enemy.aimAngle) * (enemy.r + 240),
        enemy.y + Math.sin(enemy.aimAngle) * (enemy.r + 240)
      );
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
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
          enemy.charmed ? '#ff9fc7' : '#ff4f6d',
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
      if (isRanged) {
        ctx.globalAlpha = 0.95;
        setMonoFont(7.5, 800);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffb35e';
        ctx.fillText('◈ 远程', enemy.x, enemy.y - radius - 19);
        ctx.globalAlpha = 1;
      }
      if (isCharger) {
        ctx.globalAlpha = 0.95;
        setMonoFont(7.5, 800);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(enemy.chargeState === 'warning' ? '⚠ 冲撞' : '冲撞精英', enemy.x, enemy.y - radius - 19);
        ctx.globalAlpha = 1;
      }
      if (enemy.charmed) {
        const t = performance.now() * 0.001;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,159,199,0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, radius + 9 + Math.sin(t * 5) * 2, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = '#ffc7dd';
        for (let i = 0; i < 3; i += 1) {
          const a = t * 1.6 + i * TAU / 3;
          traceBrideHeart(enemy.x + Math.cos(a) * (radius + 18), enemy.y + Math.sin(a) * (radius + 18) - 5, 4);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 0.95;
        setMonoFont(7.5, 800);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffc7dd';
        ctx.fillText('♥ 魅惑 ' + Math.max(0, enemy.charmTimer).toFixed(1) + 's', enemy.x, enemy.y - radius - 34);
        ctx.globalAlpha = 1;
      }
    }

    drawBrideKissMark(enemy);
    ctx.restore();
  }

  function drawBossTelegraphs() {
    if (!game || !game.boss || game.boss.dead || !game.boss.zones) return;
    const boss = game.boss;
    const time = performance.now() * 0.001;
    ctx.save();
    for (let i = 0; i < boss.zones.length; i += 1) {
      const zone = boss.zones[i];
      const progress = 1 - clamp(zone.time / zone.total, 0, 1);
      const pulse = 0.5 + Math.sin(time * 12) * 0.18;
      ctx.globalAlpha = 0.12 + progress * 0.14;
      ctx.fillStyle = boss.themeRage || '#ff4b4b';
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.5 + progress * 0.4;
      ctx.strokeStyle = boss.themeAccent || '#ffcf66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius * pulse, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawChargerTelegraphs() {
    if (!game || !game.enemies) return;
    const time = performance.now() * 0.001;
    for (let i = 0; i < game.enemies.length; i += 1) {
      const enemy = game.enemies[i];
      if (enemy.dead || enemy.variant !== 'charger') continue;
      if (enemy.chargeState !== 'warning' && enemy.chargeState !== 'dash') continue;
      const dirX = enemy.chargeDirX;
      const dirY = enemy.chargeDirY;
      const startX = enemy.x + dirX * enemy.r;
      const startY = enemy.y + dirY * enemy.r;
      const endX = enemy.x + dirX * (enemy.chargeDistance || 320);
      const endY = enemy.y + dirY * (enemy.chargeDistance || 320);
      const pulse = 0.5 + Math.sin(time * 16) * 0.2;
      ctx.save();
      ctx.globalAlpha = enemy.chargeState === 'warning' ? pulse : 0.18;
      ctx.strokeStyle = '#ff3030';
      ctx.lineWidth = enemy.r * 1.65;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.globalAlpha = enemy.chargeState === 'warning' ? 0.9 : 0.3;
      ctx.strokeStyle = '#ffd0c0';
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 8]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = '#ff3030';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(endX, endY, enemy.r * 0.55, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEventBossTelegraphs() {
    if (!game || !game.eventBossActive || !game.eventBoss) return;
    const boss = game.eventBoss;
    const time = performance.now() * 0.001;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (boss.telegraph) {
      const telegraph = boss.telegraph;
      const progress = 1 - clamp(telegraph.time / telegraph.total, 0, 1);
      const pulse = 0.55 + Math.sin(time * 14) * 0.2;
      const base = telegraph.baseAngle;

      if (telegraph.type === 'fan' || telegraph.type === 'combo' || telegraph.type === 'trackingFan') {
        const half = boss.enraged ? 0.48 : 0.4;
        ctx.fillStyle = 'rgba(255, 91, 116, ' + (0.035 + progress * 0.05) + ')';
        ctx.beginPath();
        ctx.moveTo(boss.x, boss.y);
        ctx.arc(boss.x, boss.y, 430, base - half, base + half);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 132, 148, ' + (0.2 + progress * 0.28) + ')';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, 55 + progress * 330, base - half, base + half);
        ctx.stroke();
        for (let i = -1; i <= 1; i += 1) {
          ctx.globalAlpha = pulse * 0.55;
          ctx.beginPath();
          ctx.moveTo(boss.x, boss.y);
          ctx.lineTo(boss.x + Math.cos(base + half * i) * 430, boss.y + Math.sin(base + half * i) * 430);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      if (telegraph.type === 'ring' || telegraph.type === 'combo' || telegraph.type === 'multiRing') {
        const ringCount = telegraph.type === 'multiRing' ? 2 : 1;
        for (let ring = 0; ring < ringCount; ring += 1) {
          const radius = boss.r + 18 + ring * 24 + progress * 92;
          ctx.strokeStyle = ring === 0
            ? 'rgba(255, 207, 102, ' + (0.24 + progress * 0.34) + ')'
            : 'rgba(120, 222, 255, ' + (0.2 + progress * 0.28) + ')';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.arc(boss.x, boss.y, radius, 0, TAU);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.r + 8, 0, TAU);
        ctx.strokeStyle = 'rgba(255, 132, 148, 0.3)';
        ctx.stroke();
      }

      if (telegraph.type === 'rotating') {
        ctx.globalAlpha = 0.28 + progress * 0.25;
        ctx.strokeStyle = '#ffcf66';
        ctx.lineWidth = 2;
        for (let arm = 0; arm < 4; arm += 1) {
          const angle = base + arm * Math.PI * 0.5 + progress * 3.2;
          ctx.beginPath();
          ctx.moveTo(boss.x, boss.y);
          ctx.lineTo(boss.x + Math.cos(angle) * 230, boss.y + Math.sin(angle) * 230);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      if (telegraph.type === 'delayed') {
        for (let i = 0; i < telegraph.markers.length; i += 1) {
          const marker = telegraph.markers[i];
          ctx.strokeStyle = 'rgba(255, 173, 84, ' + (0.45 + progress * 0.35) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(marker.x, marker.y, 38, 0, TAU);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(marker.x, marker.y, 10 + progress * 22, 0, TAU);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(marker.x - 52, marker.y);
          ctx.lineTo(marker.x + 52, marker.y);
          ctx.moveTo(marker.x, marker.y - 52);
          ctx.lineTo(marker.x, marker.y + 52);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 173, 84, ' + (0.035 + progress * 0.06) + ')';
          ctx.beginPath();
          ctx.arc(marker.x, marker.y, 36, 0, TAU);
          ctx.fill();
        }
      }

      if (telegraph.type === 'spiral') {
        for (let i = 0; i < 3; i += 1) {
          ctx.strokeStyle = 'rgba(201, 167, 255, ' + (0.24 + progress * 0.25) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            boss.x,
            boss.y,
            boss.r + 22 + i * 16,
            time * 2 + i * 2.1,
            time * 2 + i * 2.1 + Math.PI * 1.15
          );
          ctx.stroke();
        }
      }
    }

    if (boss.spiral) {
      ctx.strokeStyle = 'rgba(201, 167, 255, 0.28)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i += 1) {
        ctx.beginPath();
        ctx.arc(
          boss.x,
          boss.y,
          boss.r + 18 + i * 12,
          boss.spiral.angle + i * Math.PI,
          boss.spiral.angle + i * Math.PI + Math.PI * 0.7
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function drawEventBoss(now) {
    if (!game || !game.eventBoss) return;
    const boss = game.eventBoss;
    if (boss.defeated) return;
    const time = now * 0.001;
    const spawnScale = boss.spawnT > 0 ? 0.55 + (1 - clamp(boss.spawnT / 1.25, 0, 1)) * 0.45 : 1;
    const radius = boss.r * spawnScale;
    const color = boss.enraged ? '#ff5a78' : '#ff8b72';

    ctx.save();
    ctx.fillStyle = stageGroundShadow(0.46);
    ctx.beginPath();
    ctx.ellipse(boss.x, boss.y + boss.r * 0.76, boss.r * 0.95, boss.r * 0.35, 0, 0, TAU);
    ctx.fill();

    const aura = ctx.createRadialGradient(boss.x, boss.y, boss.r * 0.4, boss.x, boss.y, boss.r * 2.4);
    aura.addColorStop(0, boss.enraged ? 'rgba(255, 65, 105, 0.26)' : 'rgba(255, 126, 111, 0.18)');
    aura.addColorStop(0.55, 'rgba(180, 107, 255, 0.1)');
    aura.addColorStop(1, 'rgba(255, 79, 109, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.r * 2.4, 0, TAU);
    ctx.fill();

    if (boss.enraged) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2 + Math.sin(time * 8) * 0.08;
      ctx.strokeStyle = '#ff5a78';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.r * (1.55 + (boss.rageFlash > 0 ? boss.rageFlash * 0.6 : 0)), 0, TAU);
      ctx.stroke();
      if (boss.rageFlash > 0) {
        ctx.globalAlpha = clamp(boss.rageFlash, 0, 1) * 0.7;
        ctx.strokeStyle = '#ffcf66';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.r + (1.2 - boss.rageFlash) * 90, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.rotate(time * 0.55);
    ctx.strokeStyle = boss.enraged ? 'rgba(255, 95, 123, 0.6)' : 'rgba(255, 207, 102, 0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i += 1) {
      const angle = (i / 14) * TAU;
      const inner = boss.r * 1.22;
      const outer = boss.r * (1.36 + (i % 2) * 0.14);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }
    ctx.restore();

    drawCircularAvatar(eventAvatar, boss.x, boss.y, radius, color, {
      ringWidth: 4,
      dashed: boss.enraged
    });

    if (isFreezeActive()) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'rgba(120, 225, 255, 0.13)';
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, radius + 8, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#a8edff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, radius + 9, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (boss.hitFlash > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(boss.hitFlash * 5, 0, 0.65);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, radius + 2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (boss.castFlash > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(boss.castFlash * 2.2, 0, 0.7);
      ctx.strokeStyle = '#ffcf66';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, radius + 16 + (1 - boss.castFlash / 0.28) * 34, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }

    if (view.w >= 1180) {
      ctx.textAlign = 'center';
      setFont(11, 900);
      ctx.fillStyle = '#fff1e9';
      ctx.fillText(boss.name, boss.x, boss.y - radius - 19);
      setMonoFont(7.5, 700);
      ctx.fillStyle = boss.enraged ? '#ff8ea1' : '#ffcf66';
      ctx.fillText(boss.enraged ? 'PHASE II · CHOICE SHADOW' : 'CHOICE SHADOW', boss.x, boss.y - radius - 7);
    }
    ctx.restore();
  }

  function drawCompanion(now) {
    if (!game || !game.companion || !game.companion.active) return;
    const companion = game.companion;
    const bob = Math.sin(now * 0.004 + companion.bob) * 2.8;
    const y = companion.y + bob;

    ctx.save();
    ctx.fillStyle = stageGroundShadow(0.38);
    ctx.beginPath();
    ctx.ellipse(companion.x, companion.y + 21, 23, 8, 0, 0, TAU);
    ctx.fill();

    const aura = ctx.createRadialGradient(companion.x, y, 4, companion.x, y, 40);
    aura.addColorStop(0, 'rgba(255, 207, 102, 0.22)');
    aura.addColorStop(1, 'rgba(255, 207, 102, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(companion.x, y, 40, 0, TAU);
    ctx.fill();

    drawCircularAvatar(eventAvatar, companion.x, y, 18, '#ffcf66', { ringWidth: 2.4 });
    ctx.textAlign = 'center';
    setFont(7, 700);
    ctx.fillStyle = 'rgba(255, 225, 166, 0.82)';
    ctx.fillText('吴朝阳', companion.x, y + 35);
    ctx.fillStyle = 'rgba(255, 139, 176, 0.9)';
    setFont(9, 900);
    ctx.fillText('♥', companion.x, y - 26 - Math.sin(now * 0.004 + 1.2) * 2);
    ctx.restore();
  }

  function drawCompanionBullets() {
    if (!game || game.companionBullets.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < game.companionBullets.length; i += 1) {
      const bullet = game.companionBullets[i];
      if (!isWorldVisible(bullet.x, bullet.y, 50)) continue;
      drawBulletTrail(bullet, '#ffcf66', 2.2);
      ctx.fillStyle = '#fff4c8';
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 2.6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffcf66';
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, 8, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
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

    ctx.fillStyle = stageGroundShadow(0.45);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + p.r * 0.78, p.r * 0.9, p.r * 0.36, 0, 0, TAU);
    ctx.fill();

    const lowHp = p.hp / p.maxHp < 0.3;
    const equippedSkin = getEquippedSkin();
    const ringColor = lowHp ? '#ff4f6d' : equippedSkin.ring;
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

    drawBrideWings(now);
    drawBrideDashAura(now);
    const koreanMelee = isKoreanForm() && isKoreanMeleeActive();
    const nunFire = isNunFireForm();
    if (!koreanMelee) {
      if (nunFire) drawNunSword(p, renderY, now);
      else drawPlayerWeapon(p, renderY);
    }
    if (koreanMelee) drawKoreanArms(now);

    ctx.globalAlpha = deathAlpha * invulnBlink;
    // 根据当前装备皮肤读取对应图片；中心点与碰撞圆心 (p.x, p.y) 一致。
    drawCircularAvatar(getEquippedAvatar(), p.x, renderY, p.r, ringColor, {
      ringWidth: 2.5,
      dashed: lowHp
    });

    if (koreanMelee) drawKoreanAguh(now);

    if (!koreanMelee && !nunFire && p.muzzle > 0) {
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

  function drawKoreanArm(side, shoulderX, shoulderY, elbowX, elbowY, handX, handY, punch, time) {
    const skin = side < 0 ? '#e7a078' : '#f2b58b';
    const skinDark = side < 0 ? '#b96f52' : '#c57e5d';
    const outline = '#171820';
    const angle = Math.atan2(handY - shoulderY, handX - shoulderX);

    if (punch > 0.02) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = punch * 0.55;
      ctx.strokeStyle = '#54cfff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(shoulderX, shoulderY, 92, angle - 0.8, angle + 0.8);
      ctx.stroke();
      ctx.globalAlpha = punch * 0.28;
      ctx.strokeStyle = '#d9fbff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(shoulderX, shoulderY, 106, angle - 0.55, angle + 0.55);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 38;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();
    ctx.lineWidth = 30;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();

    ctx.strokeStyle = skin;
    ctx.lineWidth = 32;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY);
    ctx.lineTo(elbowX, elbowY);
    ctx.stroke();
    ctx.lineWidth = 24;
    ctx.beginPath();
    ctx.moveTo(elbowX, elbowY);
    ctx.lineTo(handX, handY);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,235,214,0.45)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(shoulderX, shoulderY - 4);
    ctx.lineTo(elbowX, elbowY - 3);
    ctx.lineTo(handX, handY - 2);
    ctx.stroke();

    // 夸张的肱二头肌/前臂肌肉块，而不是一条普通线条。
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(shoulderX, shoulderY, 16, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = skinDark;
    ctx.lineWidth = 2;
    ctx.stroke();
    const bicepX = shoulderX + (elbowX - shoulderX) * 0.56;
    const bicepY = shoulderY + (elbowY - shoulderY) * 0.56 - side * 2;
    ctx.beginPath();
    ctx.ellipse(bicepX, bicepY, 18, 26, angle, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = skinDark;
    ctx.stroke();
    const forearmX = elbowX + (handX - elbowX) * 0.45;
    const forearmY = elbowY + (handY - elbowY) * 0.45;
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.ellipse(forearmX, forearmY, 13, 20, angle, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = skinDark;
    ctx.stroke();

    // 黑色护腕
    const wristX = handX - Math.cos(angle) * 16;
    const wristY = handY - Math.sin(angle) * 16;
    ctx.strokeStyle = '#20232b';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(wristX - Math.cos(angle) * 5, wristY - Math.sin(angle) * 5);
    ctx.lineTo(wristX + Math.cos(angle) * 5, wristY + Math.sin(angle) * 5);
    ctx.stroke();
    ctx.strokeStyle = '#4c9fc4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wristX - Math.cos(angle) * 5, wristY - Math.sin(angle) * 5);
    ctx.lineTo(wristX + Math.cos(angle) * 5, wristY + Math.sin(angle) * 5);
    ctx.stroke();

    // 拳头和拳峰
    ctx.fillStyle = '#ffe0bd';
    ctx.strokeStyle = outline;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(handX, handY, 21, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = skinDark;
    for (let k = -1.5; k <= 1.5; k += 1) {
      const kx = handX + Math.cos(angle + Math.PI * 0.5) * k * 6 + Math.cos(angle) * 8;
      const ky = handY + Math.sin(angle + Math.PI * 0.5) * k * 6 + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.arc(kx, ky, 2.4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawKoreanArms(now) {
    if (!game || !game.player || !game.player.skills) return;
    const p = game.player;
    const q = p.skills.q;
    if (!q || q.active <= 0 || q.armCount <= 0 || p.dead) return;
    const time = now * 0.001;

    // 中央蓝色能量球；角色头像随后绘制在球心，形成独立的圆形头部。
    ctx.save();
    const orb = ctx.createRadialGradient(p.x, p.y, p.r * 0.55, p.x, p.y, p.r * 2.05);
    orb.addColorStop(0, 'rgba(93,225,255,0.36)');
    orb.addColorStop(0.55, 'rgba(38,150,255,0.2)');
    orb.addColorStop(1, 'rgba(18,80,190,0)');
    ctx.fillStyle = orb;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.05, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(114,231,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 8 + Math.sin(time * 8) * 2, 0, TAU);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(80,160,255,0.3)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 18 + Math.sin(time * 6 + 1) * 3, 0, TAU);
    ctx.stroke();
    ctx.restore();

    const target = findNearestEnemy(p.x, p.y, 130);
    for (let i = 0; i < q.arms.length; i += 1) {
      const arm = q.arms[i];
      if (arm.broken) continue;
      const side = arm.side;
      const idleBob = Math.sin(time * 7 + side) * 4;
      const shoulderX = p.x + side * (p.r + 5);
      const shoulderY = p.y + 1;
      let elbowX = p.x + side * (p.r + 48);
      let elbowY = p.y - 38 + idleBob;
      let handX = p.x + side * (p.r + 98);
      let handY = p.y + 6 + idleBob;
      if (target) {
        const dir = Math.atan2(target.y - p.y, target.x - p.x);
        const perp = dir + Math.PI * 0.5;
        const punchHandX = target.x + Math.cos(perp) * side * 8;
        const punchHandY = target.y + Math.sin(perp) * side * 8;
        const punchElbowX = p.x + Math.cos(dir) * 48 + Math.cos(perp) * side * 40;
        const punchElbowY = p.y + Math.sin(dir) * 48 + Math.sin(perp) * side * 40;
        const blend = clamp(arm.punch * 2.5, 0, 1);
        handX += (punchHandX - handX) * blend;
        handY += (punchHandY - handY) * blend;
        elbowX += (punchElbowX - elbowX) * blend;
        elbowY += (punchElbowY - elbowY) * blend;
      }
      drawKoreanArm(side, shoulderX, shoulderY, elbowX, elbowY, handX, handY, arm.punch, time);
    }
  }

  function drawKoreanAguh() {
    if (!game || !game.player || !game.player.skills) return;
    const p = game.player;
    const q = p.skills.q;
    if (!q || q.aguhTimer <= 0 || p.dead) return;
    const alpha = clamp(q.aguhTimer / 0.22, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y - 82);
    ctx.fillStyle = '#f7fbff';
    ctx.strokeStyle = '#16202a';
    ctx.lineWidth = 4;
    roundRectPath(ctx, -58, -26, 116, 46, 12);
    ctx.moveTo(-8, 20);
    ctx.lineTo(0, 34);
    ctx.lineTo(9, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#14202b';
    ctx.font = '900 24px "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('阿一古', 0, 0);
    ctx.restore();
  }

  function drawKoreanZombie() {
    if (!game || !game.koreanZombie) return;
    const z = game.koreanZombie;
    const t = performance.now() * 0.001;
    const bob = Math.sin(t * 12) * 2;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(z.x, z.y + 22, 20, 8, 0, 0, TAU);
    ctx.fill();
    ctx.translate(z.x, z.y + bob);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#3d6f2d';
    ctx.fillRect(-11, 0, 22, 24);
    ctx.fillStyle = '#9be36b';
    ctx.fillRect(-8, -18, 16, 16);
    ctx.fillStyle = '#101010';
    ctx.fillRect(-5, -13, 4, 4);
    ctx.fillRect(2, -13, 4, 4);
    ctx.fillRect(-5, -5, 10, 2);
    ctx.fillStyle = '#9be36b';
    ctx.fillRect(-18, 1, 7, 6);
    ctx.fillRect(11, 1, 7, 6);
    ctx.fillStyle = '#385d2b';
    ctx.fillRect(-8, 24, 6, 7);
    ctx.fillRect(2, 24, 6, 7);
    ctx.fillStyle = '#eaffd3';
    ctx.font = '700 8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('僵尸', 0, -25);
    ctx.restore();
  }

  function drawKoreanUltimate(now) {
    if (!game || !game.player || !game.player.skills) return;
    const r = game.player.skills.r;
    const ult = r && r.ult;
    if (!ult) return;
    const progress = ult.impacted ? 1 : 1 - clamp(ult.time / ult.maxTime, 0, 1);
    const fallOffset = (1 - progress) * 420;
    const drawX = ult.x;
    const drawY = ult.y - fallOffset;
    // 贴图整体放大，但伤害半径仍由 impactKoreanHorse 的 180 判定控制。
    const scale = 1.24 + progress * 0.3;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + (0.16 + progress * 0.24) + ')';
    ctx.beginPath();
    ctx.ellipse(ult.x, ult.y + 18, 80 + progress * 78, 21 + progress * 22, 0, 0, TAU);
    ctx.fill();
    ctx.translate(drawX, drawY);
    ctx.scale(scale, scale);
    ctx.globalAlpha = ult.impacted ? Math.max(0, 1 - ult.hold / 0.4) : 0.95;
    const traceHorseHead = function () {
      ctx.beginPath();
      ctx.moveTo(-42, -8);
      ctx.quadraticCurveTo(-38, -76, 0, -92);
      ctx.quadraticCurveTo(38, -76, 42, -8);
      ctx.lineTo(28, 28);
      ctx.quadraticCurveTo(0, 42, -28, 28);
      ctx.closePath();
    };
    const horseReady = koreanHorseTexture.complete && koreanHorseTexture.naturalWidth > 0;
    if (horseReady) {
      // 新马头贴图在所有下落/落地阶段共用；按马头轮廓裁切，保持原始比例不变形。
      ctx.save();
      traceHorseHead();
      ctx.clip();
      const boxX = -42;
      const boxY = -92;
      const boxW = 84;
      const boxH = 134;
      const cover = Math.max(boxW / koreanHorseTexture.naturalWidth, boxH / koreanHorseTexture.naturalHeight);
      const sourceW = boxW / cover;
      const sourceH = boxH / cover;
      const sourceX = (koreanHorseTexture.naturalWidth - sourceW) * 0.5;
      const sourceY = (koreanHorseTexture.naturalHeight - sourceH) * 0.42;
      ctx.drawImage(
        koreanHorseTexture,
        sourceX, sourceY, sourceW, sourceH,
        boxX, boxY, boxW, boxH
      );
      ctx.restore();
      traceHorseHead();
      ctx.strokeStyle = '#2a1610';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = '#3a2015';
      ctx.beginPath();
      ctx.moveTo(-30, -82);
      ctx.lineTo(-15, -108);
      ctx.lineTo(-5, -88);
      ctx.closePath();
      ctx.moveTo(30, -82);
      ctx.lineTo(15, -108);
      ctx.lineTo(5, -88);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#7a4a2c';
      traceHorseHead();
      ctx.fill();
      ctx.fillStyle = '#a76b3e';
      ctx.beginPath();
      ctx.moveTo(-32, -26);
      ctx.quadraticCurveTo(0, -70, 32, -26);
      ctx.lineTo(22, 22);
      ctx.quadraticCurveTo(0, 32, -22, 22);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a0f0a';
      ctx.beginPath();
      ctx.arc(-17, -30, 7, 0, TAU);
      ctx.arc(17, -30, 7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffcf66';
      ctx.beginPath();
      ctx.arc(-17, -30, 3, 0, TAU);
      ctx.arc(17, -30, 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#4c2a1a';
      ctx.fillRect(-24, 6, 48, 8);
      ctx.fillStyle = '#e8d7c3';
      ctx.fillRect(-20, 14, 8, 7);
      ctx.fillRect(12, 14, 8, 7);
    }
    ctx.fillStyle = '#5de1ff';
    ctx.font = '900 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('马头', 0, -108);
    ctx.restore();
    if (ult.impacted && ult.hold < 0.16) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255,207,102,' + (0.24 * (1 - ult.hold / 0.16)) + ')';
      ctx.fillRect(game.camera.x, game.camera.y, view.w, view.h);
      ctx.restore();
    }
  }

  function traceBrideHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.75);
    ctx.bezierCurveTo(x - size * 1.2, y - size * 0.2, x - size * 0.55, y - size, x, y - size * 0.35);
    ctx.bezierCurveTo(x + size * 0.55, y - size, x + size * 1.2, y - size * 0.2, x, y + size * 0.75);
    ctx.closePath();
  }

  function drawBrideAura() {
    if (!game || !game.player || !isBrideForm()) return;
    const p = game.player;
    const r = p.skills.r;
    if (!r || r.active <= 0) return;
    const radius = BRIDE_CONFIG.r.burnRadius;
    const time = performance.now() * 0.001;
    ctx.save();
    const glow = ctx.createRadialGradient(p.x, p.y, p.r, p.x, p.y, radius);
    glow.addColorStop(0, 'rgba(255,252,244,0.07)');
    glow.addColorStop(0.55, 'rgba(255,239,210,0.08)');
    glow.addColorStop(1, 'rgba(255,207,102,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,245,250,' + (0.36 + Math.sin(time * 3) * 0.1) + ')';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 6; i += 1) {
      const a = time * 0.3 + (i / 6) * TAU;
      const rr = radius * (0.5 + (i % 2) * 0.22);
      ctx.fillStyle = i % 2 ? 'rgba(255,252,244,0.3)' : 'rgba(255,207,102,0.26)';
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr, 2.2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBrideLinks() {
    if (!game || !game.brideLink) return;
    const link = game.brideLink;
    const time = performance.now() * 0.001;
    const targets = link.targets;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < targets.length; i += 1) {
      for (let j = i + 1; j < targets.length; j += 1) {
        const a = targets[i];
        const b = targets[j];
        if (!a || !b || a.dead || b.dead) continue;
        ctx.strokeStyle = 'rgba(255,105,158,' + (0.4 + Math.sin(time * 5 + i + j) * 0.15) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const mx = (a.x + b.x) * 0.5 + Math.sin(time * 2 + j) * 12;
        const my = (a.y + b.y) * 0.5 + Math.cos(time * 2 + i) * 12;
        ctx.quadraticCurveTo(mx, my, b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBrideProjectiles() {
    if (!game || !game.brideProjectiles) return;
    const time = performance.now() * 0.001;
    for (let i = 0; i < game.brideProjectiles.length; i += 1) {
      const projectile = game.brideProjectiles[i];
      if (projectile.dead) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = projectile.kind === 'brideMark' ? 'rgba(255,111,158,0.35)' : 'rgba(255,199,221,0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (projectile.trail.length) {
        ctx.moveTo(projectile.trail[0].x, projectile.trail[0].y);
        for (let j = 1; j < projectile.trail.length; j += 1) ctx.lineTo(projectile.trail[j].x, projectile.trail[j].y);
      }
      ctx.stroke();
      ctx.restore();
      if (projectile.kind === 'brideMark') {
        ctx.save();
        ctx.translate(projectile.x, projectile.y);
        ctx.rotate(time * 4);
        ctx.fillStyle = '#ff6f9e';
        ctx.beginPath();
        ctx.ellipse(-4, 0, 7, 3, -0.35, 0, TAU);
        ctx.ellipse(4, 0, 7, 3, 0.35, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff5fa';
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = projectile.kind === 'charmBolt' ? '#ff9fc7' : '#ffc7dd';
        traceBrideHeart(projectile.x, projectile.y, projectile.kind === 'charmBolt' ? 5 : 8);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawNunBlade(x, y, angle, length, width, color, glow) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.moveTo(0, -width * 1.8);
    ctx.lineTo(length, 0);
    ctx.lineTo(0, width * 1.8);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#18111f';
    ctx.beginPath();
    ctx.moveTo(-8, -width);
    ctx.lineTo(length + 7, -width * 0.45);
    ctx.lineTo(length + 16, 0);
    ctx.lineTo(length + 7, width * 0.45);
    ctx.lineTo(-8, width);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-5, -width * 0.62);
    ctx.lineTo(length, -width * 0.26);
    ctx.lineTo(length + 9, 0);
    ctx.lineTo(length, width * 0.26);
    ctx.lineTo(-5, width * 0.62);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = glow;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.fillStyle = '#d8b8ff';
    ctx.fillRect(2, -1, 12, 2);
    ctx.restore();
  }

  function drawNunAura() {
    if (!game || !game.player || !isNunForm()) return;
    const p = game.player;
    const fire = getNunSubform() === 'fire';
    const t = performance.now() * 0.001;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(p.x, p.y, p.r * 0.5, p.x, p.y, p.r * 3.4);
    glow.addColorStop(0, fire ? 'rgba(255,70,40,0.16)' : 'rgba(151,91,255,0.16)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 3.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = fire ? 'rgba(255,91,57,0.5)' : 'rgba(170,111,255,0.48)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 8 + Math.sin(t * 4) * 2, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 5; i += 1) {
      const a = t * (fire ? 1.8 : 0.7) + (i / 5) * TAU;
      const rr = p.r * (1.8 + (i % 2) * 0.5);
      ctx.fillStyle = fire ? 'rgba(255,93,44,0.55)' : 'rgba(179,121,255,0.5)';
      ctx.beginPath();
      ctx.arc(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr, fire ? 3 : 2, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawNunTexture(key, x, y, angle, height, pivot, alpha) {
    const img = nunTextures[key];
    if (!img || !img.complete || img.naturalWidth <= 0) return false;
    const w = height * (img.width / img.height);
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(img, -w * 0.5, -height * pivot, w, height);
    ctx.restore();
    return true;
  }

  function drawNunSword(p, renderY, now) {
    if (!isNunFireForm()) return;
    const attack = p.skills.nunAttack || { phase: 'idle', angle: p.aimAngle, time: 0, total: 1 };
    const enchanted = p.skills.q.active > 0;
    const baseAngle = attack.phase === 'idle' ? p.aimAngle : attack.angle;
    let angle = baseAngle - 0.42;
    let offsetX = 0;
    let offsetY = 0;
    if (attack.phase === 'windup') {
      const progress = 1 - clamp(attack.time / Math.max(0.001, attack.total * 0.26), 0, 1);
      angle = attack.angle - 0.95 + progress * 0.3;
      offsetX = -Math.cos(attack.angle) * 9;
      offsetY = -Math.sin(attack.angle) * 9;
    } else if (attack.phase === 'slash') {
      const progress = 1 - clamp(attack.time / Math.max(0.001, attack.total * 0.2), 0, 1);
      angle = attack.angle - 0.68 + progress * 1.55;
    } else if (attack.phase === 'recover') {
      const progress = 1 - clamp(attack.time / Math.max(0.001, attack.total * 0.54), 0, 1);
      angle = attack.angle + 0.87 - progress * 1.2;
    }
    const handX = p.x + Math.cos(baseAngle) * 9 + offsetX;
    const handY = renderY + Math.sin(baseAngle) * 9 + offsetY;
    const planted = drawNunTexture(
      enchanted ? 'fireEnchanted' : 'fireSword',
      handX, handY, angle - Math.PI * 0.5,
      enchanted ? 150 : 132, 0.24, 1
    );
    if (!planted) {
      drawNunBlade(handX, handY, angle, 62, 8, enchanted ? '#ff9a4a' : '#ff5b39', '#ff2b1b');
    }
    if ((attack.phase === 'slash' || attack.phase === 'recover') && nunTextureReady('fireSlash')) {
      const slashAngle = angle + 0.2;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = attack.phase === 'slash' ? 0.95 : 0.35;
      ctx.translate(p.x, renderY);
      ctx.rotate(slashAngle + Math.PI * 0.5);
      const h = 172;
      const img = nunTextures.fireSlash;
      const w = h * (img.width / img.height);
      ctx.drawImage(img, -w * 0.5, -h * 0.5, w, h);
      ctx.restore();
    }
    if (attack.phase === 'slash' || attack.phase === 'recover') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = attack.phase === 'slash' ? 0.55 : 0.25;
      ctx.strokeStyle = '#ff8050';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(p.x, renderY, 78, angle - 0.8, angle + 0.35);
      ctx.stroke();
      ctx.restore();
    }
    if (enchanted && attack.phase === 'idle') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.35 + Math.sin(now * 0.01) * 0.08;
      ctx.strokeStyle = '#ffb15c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, renderY, p.r + 11, baseAngle - 1.1, baseAngle + 0.9);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawNunGreatSwords() {
    if (!game || !game.nunGreatSwords.length || !isNunForm()) return;
    const p = game.player;
    for (let i = 0; i < game.nunGreatSwords.length; i += 1) {
      const sword = game.nunGreatSwords[i];
      const bx = p.x + Math.cos(sword.angle) * NUN_CONFIG.fireR.swordOrbit;
      const by = p.y + Math.sin(sword.angle) * NUN_CONFIG.fireR.swordOrbit;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#ff4b25';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.restore();
      const cx = bx + Math.cos(sword.angle) * 66;
      const cy = by + Math.sin(sword.angle) * 66;
      if (!drawNunTexture('fireGreatsword', cx, cy, sword.angle - Math.PI * 0.5, 190, 0.5, 1)) {
        drawNunBlade(bx, by, sword.angle, 122, 15, '#ff5a32', '#ff2614');
      }
    }
  }

  function drawNunEntities() {
    if (!game || !isNunForm()) return;
    const p = game.player;
    // Three independent demon swords: orbit, fly out, hit, return.
    for (let i = 0; i < game.nunSwords.length; i += 1) {
      const sword = game.nunSwords[i];
      const angle = sword.state === 'orbit' ? sword.angle + Math.PI * 0.5 : sword.angleToTarget;
      const h = sword.state === 'orbit' ? 58 : 68;
      if (!drawNunTexture('demonSword', sword.x, sword.y, angle - Math.PI * 0.5, h, 0.5, 1)) {
        drawNunBlade(sword.x, sword.y, angle, 43, 6, '#a56bff', '#6d36d8');
      }
      if (sword.state !== 'orbit') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = '#a56bff';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(sword.x - Math.cos(angle) * 22, sword.y - Math.sin(angle) * 22);
        ctx.lineTo(sword.x, sword.y);
        ctx.stroke();
        ctx.restore();
      }
    }
    // Fixed tentacle with raise/slam/recover animation and impact texture.
    const t = game.nunTentacle;
    if (t) {
      const phase = t.phase;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(143,79,255,0.18)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(t.x, t.y, NUN_CONFIG.e.tauntRadius, 0, TAU);
      ctx.stroke();
      ctx.restore();
      const sway = phase === 'raise'
        ? Math.sin(performance.now() * 0.008) * 0.08
        : phase === 'slam' ? 0.32 : Math.sin(performance.now() * 0.002) * 0.025;
      const height = phase === 'raise' ? 188 : phase === 'slam' ? 150 : 170;
      if (!drawNunTexture('tentacle', t.x, t.y + 22, sway, height, 1, 1)) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = t.hitFlash > 0 ? '#e0c7ff' : '#7d3de0';
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(t.x, t.y + 25);
        ctx.quadraticCurveTo(t.x + 20, t.y - 40, t.x + sway * 100, t.y - 92);
        ctx.stroke();
        ctx.restore();
      }
      if (t.hitFlash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(0.65, t.hitFlash * 3.5);
        ctx.fillStyle = '#e0c7ff';
        ctx.beginPath();
        ctx.ellipse(t.x, t.y - 70, 52, 82, sway, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      if ((phase === 'slam' || phase === 'recover') && nunTextureReady('tentacleImpact')) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = phase === 'slam' ? 1 : Math.max(0, t.phaseTime / 0.45);
        const img = nunTextures.tentacleImpact;
        const h = 120;
        const w = h * (img.width / img.height);
        ctx.drawImage(img, t.slamX - w * 0.5, t.slamY - h * 0.5, w, h);
        ctx.restore();
      }
    }
    // Purple dagger wave bullets from the supplied R sheet.
    for (let i = 0; i < game.nunBullets.length; i += 1) {
      const b = game.nunBullets[i];
      if (!drawNunTexture('demonBullet', b.x, b.y, Math.atan2(b.vy, b.vx) - Math.PI * 0.5, 22, 0.5, 1)) {
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#7c3ce0';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius + 1, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    drawNunGreatSwords();
    // Red life orbs.
    for (let i = 0; i < game.nunOrbs.length; i += 1) {
      const orb = game.nunOrbs[i];
      const bob = Math.sin(performance.now() * 0.006 + orb.phase) * 3;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ff354f';
      ctx.beginPath();
      ctx.arc(orb.x, orb.y + bob, 7, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffd0d6';
      ctx.beginPath();
      ctx.arc(orb.x - 2, orb.y + bob - 2, 2, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBrideDashAura(now) {
    if (!game || !game.player || !isBrideForm()) return;
    const p = game.player;
    const e = p.skills.e;
    if (!e || !e.dashing || e.active <= 0 || p.dead) return;
    const time = now * 0.001;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(p.x, p.y, p.r * 0.4, p.x, p.y, p.r * 2.4);
    glow.addColorStop(0, 'rgba(255,253,247,0.2)');
    glow.addColorStop(1, 'rgba(255,207,102,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 2.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,250,240,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r + 6 + Math.sin(time * 9) * 2, 0, TAU);
    ctx.stroke();
    const angle = p.lastMoveAngle || p.aimAngle;
    for (let i = 0; i < 4; i += 1) {
      const bx = p.x - Math.cos(angle) * (p.r + 10 + i * 11);
      const by = p.y - Math.sin(angle) * (p.r + 10 + i * 11) + Math.sin(time * 10 + i) * 4;
      ctx.fillStyle = i % 2 ? 'rgba(255,253,247,0.55)' : 'rgba(255,207,102,0.32)';
      ctx.beginPath();
      ctx.ellipse(bx, by, 3.5, 10, angle + Math.PI * 0.5, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBrideWings(now) {
    if (!game || !game.player || !isBrideForm()) return;
    const p = game.player;
    const r = p.skills.r;
    if (!r || r.active <= 0 || p.dead) return;
    const time = now * 0.001;
    const open = clamp((BRIDE_CONFIG.r.duration - r.active) / 0.8, 0, 1);
    const close = clamp(r.active / 0.6, 0, 1);
    const grow = Math.min(open, close);
    if (grow <= 0.02) return;

    const wingW = Math.min(660, Math.max(340, view.w * 0.64));
    const wingH = wingW * (730 / 1280);
    const drawY = p.y - wingH * 0.48;

    ctx.save();
    ctx.globalAlpha = 0.16 * grow;
    const glow = ctx.createRadialGradient(p.x, p.y, p.r, p.x, p.y, wingW * 0.55);
    glow.addColorStop(0, 'rgba(255,252,244,0.55)');
    glow.addColorStop(0.65, 'rgba(255,235,205,0.18)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, wingW * 0.55, wingH * 0.48, 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (brideWingsTexture.complete && brideWingsTexture.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.96 * grow;
      ctx.translate(p.x, p.y);
      ctx.scale(grow, grow);
      // 透明独立翅膀素材：不包含人物、文字或背景；固定绘制在角色背后。
      ctx.drawImage(brideWingsTexture, -wingW / 2, drawY - p.y, wingW, wingH);
      ctx.restore();
      return;
    }

    // 图片加载失败时的轻量矢量回退，保持技能不消失。
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = grow;
    const flap = Math.sin(time * 2.2) * 8;
    for (let side = -1; side <= 1; side += 2) {
      for (let f = 0; f < 3; f += 1) {
        const baseX = p.x + side * (p.r + 2);
        const baseY = p.y - 2 + f * 5;
        ctx.fillStyle = f === 0 ? 'rgba(255,255,255,0.82)' : f === 1 ? 'rgba(255,245,250,0.66)' : 'rgba(255,214,231,0.5)';
        ctx.strokeStyle = 'rgba(255,207,102,0.28)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.bezierCurveTo(
          baseX + side * (45 + f * 10), baseY - 60 - flap,
          baseX + side * (95 + f * 8), baseY - 30 - flap,
          baseX + side * (72 + f * 6), baseY + 18 + f * 9
        );
        ctx.bezierCurveTo(
          baseX + side * (42 + f * 4), baseY + 8 + f * 6,
          baseX + side * 16, baseY + 2,
          baseX, baseY
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBrideKissMark(enemy) {
    if (!enemy || !enemy.brideKiss) return;
    const t = performance.now() * 0.001;
    ctx.save();
    ctx.translate(enemy.x + enemy.r * 0.48, enemy.y - enemy.r * 0.42);
    ctx.rotate(-0.3 + Math.sin(t * 2) * 0.08);
    ctx.fillStyle = '#d92f61';
    ctx.beginPath();
    ctx.ellipse(-4, 0, 6, 3, -0.35, 0, TAU);
    ctx.ellipse(4, 0, 6, 3, 0.35, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ff9fc7';
    ctx.beginPath();
    ctx.arc(0, -2, 2, 0, TAU);
    ctx.fill();
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

  function playerBulletSpriteSize(bullet) {
    if (bullet.kind === 'rocket') return 78;
    if (bullet.kind === 'sniper') return 64;
    if (bullet.kind === 'shotgun') return 42;
    if (bullet.kind === 'smg') return 46;
    return 58;
  }

  function drawLaserBeams() {
    if (!game || !game.laserBeams || !game.laserBeams.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < game.laserBeams.length; i += 1) {
      const beam = game.laserBeams[i];
      const alpha = clamp(beam.life / beam.maxLife, 0, 1);
      ctx.globalAlpha = alpha * 0.26;
      ctx.strokeStyle = '#77e8ff';
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
      ctx.strokeStyle = '#bff8ff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(beam.x1, beam.y1);
      ctx.lineTo(beam.x2, beam.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBullets() {
    // 每帧只取一次当前皮肤，避免逐颗子弹查表；EDG 返回 null，继续原绘制。
    const equippedFx = getEquippedBulletFx();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < game.bullets.length; i += 1) {
      const bullet = game.bullets[i];
      if (!isWorldVisible(bullet.x, bullet.y, 80)) continue;

      if (bullet.delayedByFreeze && isFreezeActive()) {
        drawBulletTrail(bullet, '#ffcf66', bullet.radius);
        ctx.save();
        ctx.globalAlpha = 0.75 + Math.sin(performance.now() * 0.014) * 0.18;
        ctx.strokeStyle = '#ffe3a3';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius + 8, 0, TAU);
        ctx.stroke();
        ctx.fillStyle = '#fff0c4';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, Math.max(1.5, bullet.radius * 0.7), 0, TAU);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (bullet.laser) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(119,232,255,0.28)';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(bullet.originX, bullet.originY);
        ctx.lineTo(bullet.x, bullet.y);
        ctx.stroke();
        ctx.strokeStyle = '#e8fbff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bullet.originX, bullet.originY);
        ctx.lineTo(bullet.x, bullet.y);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 4, 0, TAU);
        ctx.fill();
        ctx.restore();
        continue;
      }

      if (bullet.kind === 'scythe') {
        drawScytheBullet(bullet);
        continue;
      }

      if (equippedFx) {
        drawBulletTrail(bullet, equippedFx.trail, bullet.radius);
        const size = playerBulletSpriteSize(bullet);
        // 贴图内含黑色轮廓，使用 source-over 保留暗部；光晕已经画在贴图里。
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
        ctx.drawImage(equippedFx.entry.image, -size * 0.5, -size * 0.5, size, size);
        ctx.restore();
        ctx.globalCompositeOperation = 'lighter';
        continue;
      }

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
      if (isFreezeActive()) {
        ctx.save();
        ctx.globalAlpha = 0.46;
        ctx.strokeStyle = '#a8edff';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius + 7, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      const pulse = 1 + Math.sin(performance.now() * 0.02 + i) * 0.14;
      if (bullet.eventBoss) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius * 3.5 * pulse, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = bullet.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius * 1.9, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
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

  function drawScytheBullet(bullet) {
    const time = performance.now() * 0.001;
    const angle = Math.atan2(bullet.vy, bullet.vx);
    const spin = angle + bullet.spin + time * 13;
    const pulse = 0.9 + Math.sin(time * 20 + bullet.scytheIndex) * 0.1;

    // 暗红色能量拖尾：比普通子弹更长、更明显。
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (bullet.trail && bullet.trail.length > 1) {
      ctx.lineCap = 'round';
      for (let i = 1; i < bullet.trail.length; i += 1) {
        const a = bullet.trail[i - 1];
        const b = bullet.trail[i];
        ctx.globalAlpha = (i / bullet.trail.length) * 0.42;
        ctx.strokeStyle = i % 2 ? '#ff2f4d' : '#7d1026';
        ctx.lineWidth = Math.max(2, 8 * (i / bullet.trail.length));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    const glow = ctx.createRadialGradient(bullet.x, bullet.y, 2, bullet.x, bullet.y, 35);
    glow.addColorStop(0, 'rgba(255, 230, 200, 0.8)');
    glow.addColorStop(0.22, 'rgba(255, 52, 76, 0.45)');
    glow.addColorStop(1, 'rgba(120, 8, 28, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 35, 0, TAU);
    ctx.fill();

    ctx.translate(bullet.x, bullet.y);
    ctx.rotate(spin);
    ctx.scale(pulse, pulse);

    // 旋转镰刀：暗色刀身 + 高亮红色刃口 + 短柄。
    ctx.fillStyle = 'rgba(255, 62, 86, 0.24)';
    ctx.beginPath();
    ctx.arc(0, 0, 29, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = '#ff665f';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(-2, 0, 21, -1.12, 1.02);
    ctx.stroke();

    ctx.fillStyle = '#ff314d';
    ctx.beginPath();
    ctx.moveTo(-1, -22);
    ctx.quadraticCurveTo(25, -16, 18, 13);
    ctx.quadraticCurveTo(13, -2, -1, -9);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffd0b0';
    ctx.beginPath();
    ctx.moveTo(-1, -22);
    ctx.quadraticCurveTo(21, -17, 17, 2);
    ctx.quadraticCurveTo(9, -10, -3, -14);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#5b1023';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, 4);
    ctx.lineTo(8, 20);
    ctx.stroke();
    ctx.strokeStyle = '#d39b6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(5, 17);
    ctx.lineTo(11, 24);
    ctx.stroke();
    ctx.restore();
  }

  function drawSkillProjectiles() {
    if (!game || !game.skillProjectiles) return;
    const time = performance.now() * 0.001;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < game.skillProjectiles.length; i += 1) {
      const projectile = game.skillProjectiles[i];
      if (!isWorldVisible(projectile.x, projectile.y, 80)) continue;
      if (projectile.trail && projectile.trail.length > 1) {
        ctx.lineCap = 'round';
        for (let j = 1; j < projectile.trail.length; j += 1) {
          const a = projectile.trail[j - 1];
          const b = projectile.trail[j];
          ctx.globalAlpha = (j / projectile.trail.length) * 0.3;
          ctx.strokeStyle = '#ffcf66';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      const glow = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, 28);
      glow.addColorStop(0, 'rgba(255, 245, 180, 0.9)');
      glow.addColorStop(0.35, 'rgba(255, 191, 80, 0.42)');
      glow.addColorStop(1, 'rgba(255, 91, 91, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 28, 0, TAU);
      ctx.fill();

      ctx.save();
      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(projectile.angle + Math.sin(time * 8 + projectile.spin) * 0.1);
      ctx.fillStyle = '#f7e6bf';
      ctx.strokeStyle = '#ffcf66';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-8, -6);
      ctx.lineTo(8, -6);
      ctx.lineTo(11, 6);
      ctx.lineTo(-11, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = '#8d3d25';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-5, -2);
      ctx.lineTo(5, -2);
      ctx.moveTo(-5, 2);
      ctx.lineTo(6, 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawRewindEcho() {
    if (!game || !isChampionForm()) return;
    const r = game.player.skills ? game.player.skills.r : null;
    if (!r || !r.snapshot || (r.phase !== 'recording' && r.phase !== 'confirm')) return;
    const p = game.player;
    const pulse = 0.22 + Math.sin(performance.now() * 0.008) * 0.08;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = r.phase === 'confirm' ? '#ffcf66' : '#ff5a6d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.snapshot.x, r.snapshot.y, p.r + 18, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = pulse * 0.6;
    ctx.beginPath();
    ctx.arc(
      r.snapshot.x + (p.x - r.snapshot.x) * 0.5,
      r.snapshot.y + (p.y - r.snapshot.y) * 0.5,
      p.r + 8,
      0,
      TAU
    );
    ctx.stroke();
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

    if (isFreezeActive()) {
      const freeze = ctx.createRadialGradient(
        view.w * 0.5, view.h * 0.5, Math.min(view.w, view.h) * 0.3,
        view.w * 0.5, view.h * 0.5, Math.max(view.w, view.h) * 0.72
      );
      freeze.addColorStop(0, 'rgba(130,220,255,0)');
      freeze.addColorStop(0.78, 'rgba(120,215,255,0.055)');
      freeze.addColorStop(1, 'rgba(255,207,102,0.16)');
      ctx.fillStyle = freeze;
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#a8edff';
      ctx.lineWidth = 1;
      for (let y = 0; y < view.h; y += 46) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(view.w, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (isChampionForm() && game.player.skills &&
        (game.player.skills.r.phase === 'recording' || game.player.skills.r.phase === 'confirm')) {
      const r = game.player.skills.r;
      const pulse = 0.08 + Math.sin(performance.now() * 0.011) * 0.03;
      const rewind = ctx.createRadialGradient(
        view.w * 0.5, view.h * 0.5, Math.min(view.w, view.h) * 0.3,
        view.w * 0.5, view.h * 0.5, Math.max(view.w, view.h) * 0.76
      );
      rewind.addColorStop(0, 'rgba(255,207,102,0)');
      rewind.addColorStop(1, r.phase === 'confirm' ? 'rgba(255,207,102,' + (pulse * 2.4) + ')' : 'rgba(255,71,91,' + (pulse * 1.5) + ')');
      ctx.fillStyle = rewind;
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
    const snowMap = !!(game && game.mode === 'stage' && game.mapTheme === 'snow');
    const crosshairColor = snowMap
      ? (active ? '#ff2626' : '#ff3f3f')
      : (active ? '#ffcf66' : 'rgba(93,225,255,0.86)');
    const crosshairTick = snowMap ? 'rgba(255,48,48,0.82)' : 'rgba(93,225,255,0.7)';

    ctx.save();
    ctx.strokeStyle = crosshairColor;
    ctx.fillStyle = snowMap ? (active ? '#ff2626' : 'rgba(255,63,63,0.95)') : (active ? '#ffcf66' : 'rgba(93,225,255,0.9)');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = crosshairTick;
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
    if (game.eventBossActive) return '吴朝阳 · 抉择之影';
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

    if (hasTouch && view.w > view.h) {
      drawMobileLandscapeHUD(now);
    } else if (compact) {
      drawCompactHUD(now);
    } else {
      drawDesktopHUD(now);
    }

    drawBossHUD();
    drawEventBossHUD();
    drawShenlinHUD();
    drawCoinReward();
    drawToasts();
    drawTutorial();
    drawOffscreenBossArrow();
    refreshSkillBar(false);
    refreshStatsPanel(false);
  }

  function drawDesktopHUD(now) {
    const p = game.player;
    const form = getCurrentForm();
    const equippedSkin = getEquippedSkin();
    const w = 360;
    const h = 96;
    const x = 24;
    const y = view.h - 18 - h;

    drawPanel(x, y, w, h, 17, 'rgba(8,15,24,0.88)', 'rgba(255, 123, 111, 0.26)');

    const avatarX = x + 43;
    const avatarY = y + 48;
    drawCircularAvatar(getEquippedAvatar(), avatarX, avatarY, 29, equippedSkin.ring, { ringWidth: 2.2 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX + 20, avatarY + 21, 10, 0, TAU);
    ctx.fillStyle = '#0a1520';
    ctx.fill();
    ctx.strokeStyle = '#5de1ff';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    setMonoFont(7.5, 800);
    ctx.fillStyle = '#c9f5ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Lv.' + game.level, avatarX + 20, avatarY + 21.5);
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    setFont(12, 850);
    ctx.fillStyle = '#ffe9df';
    ctx.fillText(form ? (form.shortName || form.name) : 'EDG', x + 84, y + 19);
    setMonoFont(8, 700);
    ctx.fillStyle = '#b7837c';
    ctx.fillText((form && form.title ? form.title : '角色形态') + ' · ' + MODE_LABEL[game.mode], x + 84, y + 32);

    drawBar(x + 84, y + 40, 252, 14, p.hp / p.maxHp, '#ff536f', '#ffad54', 'rgba(255,255,255,0.08)');
    setMonoFont(9, 800);
    ctx.fillStyle = '#fff0f2';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(p.hp) + ' / ' + Math.ceil(p.maxHp), x + 84 + 126, y + 50.5);

    drawBar(x + 84, y + 60, 252, 5.5, game.xp / game.xpToNext, '#5de1ff', '#a78bfa', 'rgba(255,255,255,0.07)');
    ctx.textAlign = 'left';
    setFont(8, 600);
    ctx.fillStyle = '#708a9d';
    ctx.fillText('EXP ' + Math.floor(game.xp) + ' / ' + game.xpToNext, x + 84, y + 76);

    ctx.fillStyle = '#5c7487';
    ctx.fillText('冲刺', x + 84, y + 88);
    const dashMax = Math.max(0.01, 2.4 * p.dashCooldownMult);
    const dashRatio = p.dashCd <= 0 ? 1 : 1 - p.dashCd / dashMax;
    drawBar(x + 108, y + 83, 48, 4, dashRatio, '#5de1ff', '#66e6a8', 'rgba(255,255,255,0.08)');
    ctx.fillStyle = p.dashCd <= 0 ? '#66e6a8' : '#72899a';
    ctx.fillText(p.dashCd <= 0 ? '就绪' : p.dashCd.toFixed(1) + 's', x + 162, y + 88);

    // 简洁的当前技能状态标识，完整状态在底部技能栏与属性面板。
    const status = [];
    if (p.skills && p.skills.q.active > 0) status.push({ text: 'Q ' + p.skills.q.active.toFixed(1) + 's', color: '#ff7868' });
    if (p.skills && p.skills.e.active > 0) status.push({ text: 'E ' + p.skills.e.active.toFixed(1) + 's', color: '#66e6a8' });
    if (p.skills && p.skills.r.pendingShots > 0) status.push({ text: 'R ' + p.skills.r.pendingShots + '/5', color: '#ffcf66' });
    status.forEach(function (item, index) {
      const cx = x + w - 18 - index * 58;
      drawPanel(cx - 25, y + 7, 52, 17, 8, 'rgba(8, 12, 18, 0.82)', 'rgba(255,255,255,0.08)');
      ctx.textAlign = 'center';
      setMonoFont(7.5, 800);
      ctx.fillStyle = item.color;
      ctx.fillText(item.text, cx + 1, y + 18.5);
    });

    drawTopStats();
    drawDesktopWeaponPanel();
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
      setFont(8.5, 600);
      ctx.fillStyle = '#6f8ca2';
      ctx.fillText('第 ' + game.stage + ' 关 · 击杀 ' + game.stageKills + '/' + game.stageTarget, x + w * 0.5, y + 67);
    }
  }

  function drawDesktopWeaponPanel() {
    const p = game.player;
    const w = 300;
    const h = 118;
    const x = view.w - 24 - w;
    const y = view.h - 18 - h;
    drawPanel(x, y, w, h, 17, 'rgba(8,15,24,0.9)', 'rgba(255, 123, 111, 0.22)');

    const weapon = WEAPONS[p.weapon];
    const maxMag = weaponMaxMag(p.weapon);
    const noReload = !!weapon.noReload;
    const infinite = hasInfiniteAmmo() || noReload;
    const melee = isNunFireForm();
    if (melee) {
      ctx.save();
      ctx.translate(x + 32, y + 30);
      ctx.rotate(-0.7);
      ctx.fillStyle = '#ff5b39';
      ctx.beginPath();
      ctx.moveTo(-2, -5); ctx.lineTo(24, -2); ctx.lineTo(27, 0); ctx.lineTo(24, 2); ctx.lineTo(-2, 5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffcf66';
      ctx.fillRect(-8, -2, 9, 4);
      ctx.restore();
    } else {
      drawWeaponIcon(p.weapon, x + 34, y + 30, 28, weapon.color);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    setFont(14, 800);
    ctx.fillStyle = '#eaf8ff';
    ctx.fillText(melee ? '火焰魔剑' : weapon.name, x + 62, y + 24);
    setMonoFont(8, 700);
    ctx.fillStyle = '#68869a';
    ctx.fillText(melee ? '近战 · 属性来自 ' + weapon.short : '0' + weapon.key + ' · 武器', x + 62, y + 38);

    if (melee) {
      setMonoFont(18, 800);
      ctx.fillStyle = '#ff8050';
      ctx.fillText('近战', x + 62, y + 64);
      setMonoFont(10, 700);
      ctx.fillStyle = '#738b9e';
      ctx.fillText('无需换弹', x + 108, y + 64);
      ctx.textAlign = 'right';
      setFont(8, 700);
      ctx.fillStyle = '#ffcf66';
      ctx.fillText('Q 火焰附魔中', x + w - 12, y + 64);
    } else {
      const ammo = p.ammo[p.weapon];
      setMonoFont(infinite ? 22 : 25, 800);
      ctx.fillStyle = infinite ? '#ffcf66' : (ammo === 0 ? '#ff5f77' : '#fff3d5');
      ctx.fillText(infinite ? '∞' : String(ammo), x + 62, y + 64);
      setMonoFont(10, 700);
      ctx.fillStyle = infinite ? '#ffcf66' : '#738b9e';
      ctx.fillText(infinite ? (noReload ? '无需换弹' : '无限弹药') : '/ ' + maxMag, x + 62 + ctx.measureText(infinite ? '∞' : String(ammo)).width + 6, y + 64);

      if (infinite) {
        ctx.textAlign = 'right';
        setFont(8, 700);
        ctx.fillStyle = '#ffcf66';
        ctx.fillText(noReload ? '持续激光 · 无需换弹' : 'Q · 极速射击生效中', x + w - 12, y + 64);
      } else if (p.reloading) {
        const ratio = 1 - p.reloadRemaining / Math.max(0.01, p.reloadTotal);
        drawBar(x + 160, y + 56, 104, 5, ratio, '#ffcf66', '#ffad54', 'rgba(255,255,255,0.07)');
        setFont(8.5, 700);
        ctx.fillStyle = '#ffcf66';
        ctx.textAlign = 'right';
        ctx.fillText('装填中 ' + p.reloadRemaining.toFixed(1) + 's', x + w - 12, y + 72);
      } else {
        setFont(8.5, 600);
        ctx.fillStyle = '#607b8e';
        ctx.textAlign = 'right';
        ctx.fillText('R 换弹', x + w - 12, y + 72);
      }
    }

    const slotsY = y + 82;
    const gap = 6;
    const slotW = (w - 24 - gap * (WEAPON_ORDER.length - 1)) / WEAPON_ORDER.length;
    for (let i = 0; i < WEAPON_ORDER.length; i += 1) {
      const key = WEAPON_ORDER[i];
      const weaponDef = WEAPONS[key];
      const unlocked = p.unlocked[key];
      const active = p.weapon === key;
      const sx = x + 12 + i * (slotW + gap);
      drawPanel(
        sx,
        slotsY,
        slotW,
        27,
        6,
        active ? 'rgba(255, 118, 103, 0.15)' : 'rgba(7,13,21,0.78)',
        active ? 'rgba(255, 145, 124, 0.6)' : 'rgba(120,167,192,0.13)'
      );
      ctx.textAlign = 'left';
      setMonoFont(7, 800);
      ctx.fillStyle = active ? '#ffd0b6' : '#5c7487';
      ctx.fillText(String(i + 1), sx + 4, slotsY + 10);
      drawWeaponIcon(key, sx + slotW * 0.5 + 3, slotsY + 15, 13, unlocked ? weaponDef.color : '#445360');
      if (!unlocked) {
        ctx.fillStyle = 'rgba(7,13,21,0.64)';
        roundRectPath(ctx, sx, slotsY, slotW, 27, 6);
        ctx.fill();
        setFont(7, 700);
        ctx.fillStyle = '#5e7080';
        ctx.textAlign = 'center';
        ctx.fillText('未解锁', sx + slotW * 0.5, slotsY + 17);
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

  function drawMobileLandscapeHUD(now) {
    const p = game.player;
    const form = getCurrentForm();
    const equippedSkin = getEquippedSkin();

    if (!game.bossActive && !game.eventBossActive) {
      const topW = Math.min(220, Math.max(190, view.w * 0.3));
      const topX = view.w * 0.5 - topW * 0.5;
      drawPanel(topX, 8, topW, 42, 11, 'rgba(8,15,24,0.82)', 'rgba(103,181,214,0.16)');
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      setMonoFont(9, 800);
      ctx.fillStyle = '#9ec4d6';
      ctx.fillText('⏱ ' + formatTime(game.time), topX + 10, 23);
      ctx.fillStyle = '#ffcf66';
      ctx.fillText('☠ ' + formatNumber(game.kills), topX + 84, 23);
      ctx.textAlign = 'left';
      setFont(7.5, 600);
      ctx.fillStyle = '#627f91';
      ctx.fillText(weaponObjectiveText(), topX + 10, 38);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#a5bcca';
      ctx.fillText(form ? (form.shortName || form.name) : 'EDG', topX + topW - 10, 38);
    }

    const panelW = Math.min(210, Math.max(168, view.w * 0.26));
    const panelH = 66;
    const panelX = 12;
    const panelY = 10;
    drawPanel(panelX, panelY, panelW, panelH, 12, 'rgba(8,15,24,0.88)', 'rgba(255,123,111,0.24)');
    drawCircularAvatar(getEquippedAvatar(), panelX + 22, panelY + 33, 19, equippedSkin.ring, { ringWidth: 1.8 });
    ctx.save();
    ctx.beginPath();
    ctx.arc(panelX + 37, panelY + 49, 7, 0, TAU);
    ctx.fillStyle = '#08131e';
    ctx.fill();
    ctx.strokeStyle = '#5de1ff';
    ctx.lineWidth = 1;
    ctx.stroke();
    setMonoFont(6, 800);
    ctx.fillStyle = '#c9f5ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Lv.' + game.level, panelX + 37, panelY + 49.5);
    ctx.restore();

    const barX = panelX + 48;
    const barW = panelW - 58;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    setFont(8.5, 800);
    ctx.fillStyle = '#dceaf2';
    ctx.fillText('Lv.' + game.level + ' · ' + (form ? (form.shortName || form.name) : 'EDG'), barX, panelY + 15);
    drawBar(barX, panelY + 21, barW, 10, p.hp / p.maxHp, '#ff536f', '#ffad54', 'rgba(255,255,255,0.08)');
    setMonoFont(7, 800);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff0f2';
    ctx.fillText(Math.ceil(p.hp) + '/' + Math.ceil(p.maxHp), barX + barW * 0.5, panelY + 29);
    drawBar(barX, panelY + 36, barW, 3.5, game.xp / game.xpToNext, '#5de1ff', '#a78bfa', 'rgba(255,255,255,0.07)');
    ctx.textAlign = 'left';
    setFont(7, 600);
    ctx.fillStyle = p.dashCd <= 0 ? '#66e6a8' : '#71899a';
    ctx.fillText('冲刺 ' + (p.dashCd <= 0 ? '就绪' : p.dashCd.toFixed(1) + 's'), barX, panelY + 53);

    const wpW = 156;
    const wpH = 48;
    const wpX = view.w - wpW - 12;
    const wpY = view.h < 340 ? 50 : 68;
    drawPanel(wpX, wpY, wpW, wpH, 11, 'rgba(8,15,24,0.82)', 'rgba(103,181,214,0.16)');
    const melee = isNunFireForm();
    if (melee) {
      ctx.save();
      ctx.translate(wpX + 15, wpY + 15);
      ctx.rotate(-0.7);
      ctx.fillStyle = '#ff5b39';
      ctx.beginPath();
      ctx.moveTo(-1, -3); ctx.lineTo(15, -1); ctx.lineTo(17, 0); ctx.lineTo(15, 1); ctx.lineTo(-1, 3);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      drawWeaponIcon(p.weapon, wpX + 16, wpY + 16, 14, WEAPONS[p.weapon].color);
    }
    ctx.textAlign = 'left';
    setFont(10, 800);
    ctx.fillStyle = '#eaf8ff';
    ctx.fillText(melee ? '火焰魔剑' : WEAPONS[p.weapon].name, wpX + 34, wpY + 14);
    if (melee) {
      setMonoFont(11, 800);
      ctx.fillStyle = '#ff8050';
      ctx.fillText('近战', wpX + 34, wpY + 33);
      setFont(7, 600);
      ctx.fillStyle = '#70889a';
      ctx.fillText('无需换弹', wpX + 58, wpY + 33);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffcf66';
      ctx.fillText('Q 附魔', wpX + wpW - 9, wpY + 41);
    } else {
      const noReload = !!WEAPONS[p.weapon].noReload;
      const infinite = hasInfiniteAmmo() || noReload;
      setMonoFont(infinite ? 13 : 15, 800);
      ctx.fillStyle = infinite ? '#ffcf66' : (p.ammo[p.weapon] === 0 ? '#ff5f77' : '#fff3d5');
      ctx.fillText(infinite ? '∞' : String(p.ammo[p.weapon]), wpX + 34, wpY + 33);
      setMonoFont(8, 700);
      ctx.fillStyle = '#70889a';
      ctx.fillText(infinite ? (noReload ? '无需换弹' : '无限') : '/ ' + weaponMaxMag(p.weapon), wpX + 58, wpY + 33);
      ctx.textAlign = 'right';
      setFont(7, 600);
      ctx.fillStyle = p.reloading ? '#ffcf66' : '#607b8e';
      ctx.fillText(p.reloading ? '装填 ' + p.reloadRemaining.toFixed(1) + 's' : (noReload ? '持续射击' : 'R 换弹'), wpX + wpW - 9, wpY + 41);
    }
  }

  function drawCompactHUD(now) {
    const p = game.player;
    const x = 10;
    const y = 10;
    const w = Math.max(210, view.w - 118);
    const h = 72;

    drawPanel(x, y, w, h, 14, 'rgba(8,15,24,0.84)', 'rgba(103,181,214,0.17)');

    const equippedSkin = getEquippedSkin();
    const compactForm = getCurrentForm();
    drawCircularAvatar(getEquippedAvatar(), x + 31, y + 36, 23, equippedSkin.ring, { ringWidth: 2 });
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
    ctx.fillText('Lv.' + game.level + ' · ' + (compactForm ? (compactForm.shortName || compactForm.name) : 'EDG'), barX, y + 16);

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
    const compactNoReload = !!WEAPONS[p.weapon].noReload;
    const compactInfinite = hasInfiniteAmmo() || compactNoReload;
    setMonoFont(compactInfinite ? 15 : 17, 800);
    ctx.fillStyle = compactInfinite ? '#ffcf66' : (p.ammo[p.weapon] === 0 ? '#ff5f77' : '#fff3d5');
    ctx.fillText(compactInfinite ? '∞' : String(p.ammo[p.weapon]), wpX + 40, wpY + 38);
    setMonoFont(8.5, 700);
    ctx.fillStyle = compactInfinite ? '#ffcf66' : '#70889a';
    ctx.fillText(
      compactInfinite ? (compactNoReload ? '无需换弹' : '无限') : '/ ' + weaponMaxMag(p.weapon),
      wpX + 40 + ((compactInfinite ? '∞' : String(p.ammo[p.weapon])).length * 10) + 4,
      wpY + 38
    );

    if (compactInfinite) {
      ctx.textAlign = 'right';
      setFont(7.5, 700);
      ctx.fillStyle = '#ffcf66';
      ctx.fillText(compactNoReload ? '持续激光' : 'Q 生效', wpX + wpW - 9, wpY + 48);
    } else if (p.reloading) {
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
    if (hasTouch && view.w > view.h) {
      const w = Math.min(420, Math.max(220, view.w - 360));
      const x = view.w * 0.5 - w * 0.5;
      const y = 4;
      const accent = boss.enraged ? (boss.themeRage || '#ff5a3c') : (boss.themeAccent || '#ff4f6d');
      drawPanel(x - 8, y, w + 16, 48, 10, 'rgba(8,13,21,0.88)', accent);
      ctx.textAlign = 'left';
      setFont(9.5, 800);
      ctx.fillStyle = '#ffe9e2';
      ctx.fillText('☠ ' + boss.name + (boss.title ? ' · ' + boss.title : ''), x + 2, y + 14);
      ctx.textAlign = 'right';
      setMonoFont(7.5, 700);
      ctx.fillStyle = boss.enraged ? accent : '#ff96a5';
      ctx.fillText(boss.enraged ? 'ENRAGED' : 'PHASE ' + boss.phase, x + w - 2, y + 14);
      const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
      drawBar(x + 2, y + 20, w - 4, 7, ratio, accent, boss.themeBullet || '#ffcf66', 'rgba(255,255,255,0.08)');
      ctx.textAlign = 'left';
      setMonoFont(7, 700);
      ctx.fillStyle = '#f4e7df';
      ctx.fillText(formatNumber(Math.max(0, boss.hp)) + ' / ' + formatNumber(boss.maxHp), x + 2, y + 40);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#8499a6';
      ctx.fillText('T' + (boss.tier || 1) + ' · ' + (boss.enraged ? '阶段 II' : '阶段 I'), x + w - 2, y + 40);
      return;
    }
    const compact = view.w < 1180;
    const w = compact ? view.w - 24 : Math.min(680, view.w - 480);
    const x = view.w * 0.5 - w * 0.5;
    const barY = compact ? (view.w < 390 ? 198 : 168) : view.h - 104;
    const labelY = barY - 7;

    const accent = boss.enraged ? (boss.themeRage || '#ff5a3c') : (boss.themeAccent || '#ff4f6d');
    drawPanel(x - 10, barY - 24, w + 20, 54, 12, 'rgba(8,13,21,0.84)', accent);
    ctx.textAlign = 'left';
    setFont(11, 800);
    ctx.fillStyle = '#ffdcdf';
    ctx.fillText('☠ ' + boss.name + (boss.title ? ' · ' + boss.title : ''), x, labelY);
    ctx.textAlign = 'right';
    setMonoFont(9, 700);
    ctx.fillStyle = boss.enraged ? (boss.themeRage || '#ff734f') : '#ff96a5';
    ctx.fillText(boss.enraged ? 'ENRAGED' : 'PHASE ' + boss.phase, x + w, labelY);

    const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
    drawBar(x, barY + 3, w, 11, ratio, accent, boss.enraged ? '#ffcf66' : (boss.themeBullet || '#ffcf66'), 'rgba(255,255,255,0.08)');
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

  function drawEventBossHUD() {
    if (!game || !game.eventBoss || !game.eventBossActive || game.eventBoss.dead) return;
    const boss = game.eventBoss;
    if (hasTouch && view.w > view.h) {
      const w = Math.min(420, Math.max(220, view.w - 360));
      const x = view.w * 0.5 - w * 0.5;
      const y = 4;
      const accent = boss.enraged ? '#ff5a78' : '#ff8b72';
      drawPanel(x - 8, y, w + 16, 48, 10, 'rgba(9,11,18,0.9)', accent);
      ctx.textAlign = 'left';
      setFont(9.5, 800);
      ctx.fillStyle = '#ffe7e5';
      ctx.fillText('☠ ' + boss.name + ' · ' + boss.title, x + 2, y + 14);
      ctx.textAlign = 'right';
      setMonoFont(7.5, 700);
      ctx.fillStyle = boss.enraged ? '#ff5a78' : '#ff96a5';
      ctx.fillText(boss.enraged ? '狂暴' : '阶段 I', x + w - 2, y + 14);
      const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
      drawBar(x + 2, y + 20, w - 4, 7, ratio, boss.enraged ? '#ff5a3c' : '#ff5a78', '#ffcf66', 'rgba(255,255,255,0.08)');
      ctx.textAlign = 'left';
      setMonoFont(7, 700);
      ctx.fillStyle = '#f4e7df';
      ctx.fillText(formatNumber(Math.max(0, boss.hp)) + ' / ' + formatNumber(boss.maxHp), x + 2, y + 40);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#8499a6';
      ctx.fillText(boss.enraged ? 'PHASE II' : 'PHASE I', x + w - 2, y + 40);
      return;
    }
    const compact = view.w < 1180;
    const w = compact ? view.w - 24 : Math.min(680, view.w - 480);
    const x = view.w * 0.5 - w * 0.5;
    const barY = compact ? (view.w < 390 ? 208 : 182) : view.h - 104;
    const labelY = barY - 7;
    const accent = boss.enraged ? '#ff5a78' : '#ff8b72';

    drawPanel(x - 10, barY - 24, w + 20, 54, 12, 'rgba(9,11,18,0.88)', 'rgba(255,107,125,0.32)');
    ctx.textAlign = 'left';
    setFont(11, 850);
    ctx.fillStyle = '#ffe7e5';
    ctx.fillText('☠ ' + boss.name + ' · ' + boss.title, x, labelY);
    ctx.textAlign = 'right';
    setMonoFont(9, 700);
    ctx.fillStyle = boss.enraged ? '#ff734f' : '#ff9eaa';
    ctx.fillText(boss.enraged ? 'PHASE II' : 'PHASE I', x + w, labelY);

    const ratio = clamp(boss.hp / boss.maxHp, 0, 1);
    drawBar(x, barY + 3, w, 11, ratio, accent, '#ffcf66', 'rgba(255,255,255,0.08)');
    setMonoFont(8, 700);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff0f2';
    ctx.fillText(
      formatNumber(Math.max(0, boss.hp)) + ' / ' + formatNumber(boss.maxHp),
      x + w * 0.5,
      barY + 12
    );

    ctx.textAlign = 'left';
    setFont(8.5, 600);
    ctx.fillStyle = '#7f8fa2';
    const warning = boss.telegraph
      ? ({
        fan: '扇形弹幕预警',
        ring: '环形扩散预警',
        delayed: '延迟追踪预警',
        spiral: '螺旋弹幕预警',
        combo: '组合弹幕预警'
      }[boss.telegraph.type] || '弹幕预警')
      : boss.spiral ? '螺旋弹幕持续中' : '观察预警，寻找躲避窗口';
    ctx.fillText(warning, x, barY + 24);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8da2b1';
    ctx.fillText('事件 Boss', x + w, barY + 24);
  }

  function drawCoinReward() {
    if (!game || !game.coinReward) return;
    const reward = game.coinReward;
    const elapsed = reward.total - reward.time;
    const alpha = Math.min(clamp(elapsed / 0.2, 0, 1), clamp(reward.time / 0.45, 0, 1));
    const rise = (1 - clamp(elapsed / 0.28, 0, 1)) * 12;
    const width = Math.min(370, view.w - 28);
    const height = 88;
    const x = view.w * 0.5 - width * 0.5;
    const y = view.h * 0.56 - rise;
    const centerX = x + 44;
    const centerY = y + height * 0.5;

    ctx.save();
    ctx.globalAlpha = alpha;

    const glow = ctx.createRadialGradient(centerX, centerY, 6, centerX, centerY, 90);
    glow.addColorStop(0, 'rgba(255,207,102,0.22)');
    glow.addColorStop(1, 'rgba(255,207,102,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(centerX - 100, centerY - 90, 200, 180);

    drawPanel(x, y, width, height, 18, 'rgba(12,14,18,0.94)', 'rgba(255,207,102,0.48)');
    ctx.strokeStyle = 'rgba(255,225,150,0.22)';
    ctx.lineWidth = 1;
    roundRectPath(ctx, x + 4, y + 4, width - 8, height - 8, 14);
    ctx.stroke();

    const coinGradient = ctx.createLinearGradient(centerX - 20, centerY - 20, centerX + 20, centerY + 20);
    coinGradient.addColorStop(0, '#fff1b8');
    coinGradient.addColorStop(0.55, '#ffcf66');
    coinGradient.addColorStop(1, '#c78a2c');
    ctx.fillStyle = coinGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,54,11,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, TAU);
    ctx.stroke();
    setFont(16, 900);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4b2b08';
    ctx.fillText('◆', centerX, centerY + 1);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    setFont(15, 800);
    ctx.fillStyle = '#f4ecdc';
    ctx.fillText('第 ' + reward.stage + ' 关完成', x + 80, y + 33);
    setMonoFont(22, 900);
    ctx.fillStyle = '#ffcf66';
    ctx.fillText('+' + formatNumber(reward.amount) + ' 金币', x + 80, y + 62);
    ctx.textAlign = 'right';
    setFont(9, 600);
    ctx.fillStyle = 'rgba(255,231,176,0.6)';
    ctx.fillText('已存入金币余额', x + width - 18, y + 62);
    ctx.restore();
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
      : 'WASD 移动 · 鼠标瞄准/射击 · R 换弹 · Q/E/空格 技能 · F 闪避 · 1-5 切枪';
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
  function setupSkillBar() {
    if (!el.skillBar) return;
    skillSlots = Array.prototype.slice.call(el.skillBar.querySelectorAll('[data-skill]'));
    skillSlots.forEach(function (button) {
      button.addEventListener('pointerdown', function (event) {
        if (state !== S.PLAYING) return;
        event.preventDefault();
        event.stopPropagation();
        audio.ensure();
        castSkill(button.getAttribute('data-skill'));
      }, { passive: false });
    });
  }

  function pulseSkillSlot(slot) {
    if (!el.skillBar) return;
    const button = el.skillBar.querySelector('[data-skill="' + slot + '"]');
    if (!button) return;
    button.classList.remove('is-triggered');
    void button.offsetWidth;
    button.classList.add('is-triggered');
    window.setTimeout(function () {
      button.classList.remove('is-triggered');
    }, 340);
  }

  function refreshSkillBar(force) {
    if (!game || !el.skillBar) return;
    const now = performance.now();
    if (!force && now - lastSkillBarRefresh < 80) return;
    lastSkillBarRefresh = now;

    const form = getCurrentForm();
    const skillSet = getFormSkillSet(form);
    const implemented = !!(form && form.implemented && skillSet);
    el.skillBar.classList.toggle('is-locked', !implemented);
    if (!implemented) {
      skillSlots.forEach(function (button) {
        const timer = button.querySelector('.skill-timer');
        if (timer) timer.textContent = '';
      });
      return;
    }

    const champion = form.id === 'edg2026';

    skillSlots.forEach(function (button) {
      const slot = button.getAttribute('data-skill');
      const def = skillSet[slot];
      const stateForSlot = game.player.skills ? game.player.skills[slot] : null;
      if (!def || !stateForSlot) return;
      const mask = button.querySelector('.skill-cd-mask');
      const timer = button.querySelector('.skill-timer');
      const nameNode = button.querySelector('.skill-name');
      const keyNode = button.querySelector('.skill-key');
      const icon = button.querySelector('.skill-icon');
      if (nameNode) nameNode.textContent = def.name;
      if (keyNode) keyNode.textContent = hasTouch ? def.slot : (def.keyLabel || def.slot);
      if (icon) {
        const expected = def.icon + '?v=' + AVATAR_VERSION;
        if (icon.getAttribute('src') !== expected) icon.setAttribute('src', expected);
      }
      button.setAttribute('aria-label', def.slot + ' ' + def.name);
      button.classList.remove('is-active', 'is-r-ready', 'is-r-charging');

      if (slot === 'q' || slot === 'e') {
        const active = stateForSlot.active;
        const cooldown = stateForSlot.cooldown;
        if (active > 0) {
          button.classList.add('is-active');
          mask.style.height = '0%';
          timer.textContent = active.toFixed(1) + 's';
        } else if (cooldown > 0) {
          const ratio = clamp(cooldown / def.cooldown, 0, 1);
          mask.style.height = (ratio * 100).toFixed(1) + '%';
          timer.textContent = String(Math.ceil(cooldown));
        } else {
          mask.style.height = '0%';
          timer.textContent = '';
        }
        button.title = def.name + (active > 0 ? ' · 持续 ' + active.toFixed(1) + 's' : cooldown > 0 ? ' · 冷却 ' + Math.ceil(cooldown) + 's' : ' · 就绪');
        return;
      }

      if (champion) {
        const r = stateForSlot;
        if (r.phase === 'recording') {
          button.classList.add('is-active');
          mask.style.height = '0%';
          timer.textContent = r.recordRemaining.toFixed(1) + 's';
          button.title = '十六强重开 · 记录中 ' + r.recordRemaining.toFixed(1) + 's';
        } else if (r.phase === 'confirm') {
          button.classList.add('is-r-ready');
          mask.style.height = '0%';
          timer.textContent = r.windowRemaining.toFixed(1) + 's';
          button.title = '十六强重开 · 再按空格回溯，确认窗口 ' + r.windowRemaining.toFixed(1) + 's';
        } else if (r.cooldown > 0) {
          button.classList.add('is-r-charging');
          mask.style.height = (clamp(r.cooldown / def.cooldown, 0, 1) * 100).toFixed(1) + '%';
          timer.textContent = String(Math.ceil(r.cooldown));
          button.title = '十六强重开 · 冷却 ' + Math.ceil(r.cooldown) + 's';
        } else {
          button.classList.add('is-r-ready');
          mask.style.height = '0%';
          timer.textContent = '';
          button.title = '十六强重开 · 就绪';
        }
        return;
      }

      if (form.id === 'nun') {
        const nr = stateForSlot;
        if (nr.active > 0) {
          button.classList.add('is-active');
          mask.style.height = '0%';
          timer.textContent = nr.active.toFixed(1) + 's';
          button.title = def.name + ' · 剩余 ' + nr.active.toFixed(1) + 's';
        } else if (nr.cooldown > 0) {
          button.classList.add('is-r-charging');
          mask.style.height = ((clamp(nr.cooldown / def.cooldown, 0, 1)) * 100).toFixed(1) + '%';
          timer.textContent = String(Math.ceil(nr.cooldown));
          button.title = def.name + ' · 冷却 ' + Math.ceil(nr.cooldown) + 's';
        } else {
          button.classList.add('is-r-ready');
          mask.style.height = '0%';
          timer.textContent = '';
          button.title = def.name + ' · 就绪';
        }
        return;
      }

      if (form.id === 'bride') {
        const br = stateForSlot;
        if (br.active > 0) {
          button.classList.add('is-active');
          mask.style.height = '0%';
          timer.textContent = br.active.toFixed(1) + 's';
          button.title = '白翼圣临 · 剩余 ' + br.active.toFixed(1) + 's';
        } else if (br.cooldown > 0) {
          button.classList.add('is-r-charging');
          mask.style.height = ((clamp(br.cooldown / def.cooldown, 0, 1)) * 100).toFixed(1) + '%';
          timer.textContent = String(Math.ceil(br.cooldown));
          button.title = '白翼圣临 · 冷却 ' + Math.ceil(br.cooldown) + 's';
        } else {
          button.classList.add('is-r-ready');
          mask.style.height = '0%';
          timer.textContent = '';
          button.title = '白翼圣临 · 就绪';
        }
        return;
      }

      if (form.id === 'korean') {
        const kr = stateForSlot;
        if (kr.charges > 0) {
          button.classList.add('is-r-ready');
          mask.style.height = '0%';
          timer.textContent = '×' + kr.charges;
          button.title = '天降巨大马头 · 可释放 ' + kr.charges + ' 次';
        } else {
          button.classList.add('is-r-charging');
          mask.style.height = ((1 - kr.killProgress / 48) * 100).toFixed(1) + '%';
          timer.textContent = kr.killProgress + '/48';
          button.title = '天降巨大马头 · 击杀充能 ' + kr.killProgress + '/48';
        }
        return;
      }

      const pending = stateForSlot.pendingShots;
      const required = def.requiredKills || 30;
      const charge = getRCharge();
      if (pending > 0) {
        button.classList.add('is-active');
        mask.style.height = '0%';
        timer.textContent = pending + '/5';
        button.title = '终极裁决 · 剩余镰刀弹 ' + pending + ' 发';
      } else if (charge >= required) {
        button.classList.add('is-r-ready');
        mask.style.height = '0%';
        timer.textContent = required + '/30';
        button.title = '终极裁决 · 已充能，可释放';
      } else {
        button.classList.add('is-r-charging');
        mask.style.height = ((1 - charge / required) * 100).toFixed(1) + '%';
        timer.textContent = charge + '/30';
        button.title = '终极裁决 · 击杀充能 ' + charge + '/' + required;
      }
    });
  }

  function setupStatsPanel() {
    if (!el.statsPanel) return;
    statsRows = {};
    statsLabels = {};
    el.statsPanel.querySelectorAll('[data-stat]').forEach(function (node) {
      statsRows[node.getAttribute('data-stat')] = node;
    });
    el.statsPanel.querySelectorAll('[data-stat-label]').forEach(function (node) {
      statsLabels[node.getAttribute('data-stat-label')] = node;
    });
    if (el.statsCloseBtn) el.statsCloseBtn.addEventListener('click', closeStatsPanel);
  }

  function getLiveStatsData() {
    if (!game) return {};
    const p = game.player;
    const form = getCurrentForm();
    const weapon = WEAPONS[p.weapon];
    const stats = getWeaponStats(p.weapon);
    const baseFireRate = 1 / weapon.fireInterval;
    const finalFireRate = 1 / stats.fireInterval;
    const q = p.skills ? p.skills.q : { active: 0, cooldown: 0 };
    const e = p.skills ? p.skills.e : { active: 0, cooldown: 0 };
    const r = p.skills ? p.skills.r : { pendingShots: 0 };
    const hasFormSkills = !!(form && form.implemented && form.skills);
    const champion = !!(form && form.id === 'edg2026');
    const qState = !hasFormSkills ? '未开放' : q.active > 0 ? '激活 ' + q.active.toFixed(1) + 's' : q.cooldown > 0 ? '冷却 ' + Math.ceil(q.cooldown) + 's' : '就绪';
    const eState = !hasFormSkills ? '未开放' : e.active > 0 ? (champion ? '标记 ' + e.active.toFixed(1) + 's' : '激活 ' + e.active.toFixed(1) + 's') : e.cooldown > 0 ? '冷却 ' + Math.ceil(e.cooldown) + 's' : '就绪';
    const charge = getRCharge();
    const required = (getFormSkill('r', 'edg') || {}).requiredKills || 30;
    let rCharge = '—';
    let rShots = '—';
    if (hasFormSkills && champion) {
      if (r.phase === 'recording') {
        rCharge = '记录 ' + r.recordRemaining.toFixed(1) + 's';
        rShots = '—';
      } else if (r.phase === 'confirm') {
        rCharge = '确认 ' + r.windowRemaining.toFixed(1) + 's';
        rShots = '可按空格回溯';
      } else if (r.cooldown > 0) {
        rCharge = '冷却 ' + Math.ceil(r.cooldown) + 's';
        rShots = '—';
      } else {
        rCharge = '就绪';
        rShots = '—';
      }
    } else if (hasFormSkills) {
      rCharge = charge + ' / ' + required;
      rShots = (r.pendingShots || 0) + ' / 5';
    }
    const activeDuration = hasFormSkills
      ? Math.max(q.active || 0, e.active || 0, champion && r.phase === 'recording' ? r.recordRemaining : 0)
      : 0;
    return {
      hp: Math.ceil(p.hp) + ' / ' + Math.ceil(p.maxHp),
      level: String(game.level),
      xp: Math.floor(game.xp) + ' / ' + game.xpToNext,
      move: Math.round(p.baseSpeed * p.moveSpeedMult) + ' （基础 ' + Math.round(p.baseSpeed) + '）',
      dash: (2.4 * p.dashCooldownMult).toFixed(1) + 's',
      form: form ? form.name : '—',
      weapon: weapon.name,
      baseDamage: String(weapon.damage),
      finalDamage: stats.damage.toFixed(1),
      critChance: (stats.critChance * 100).toFixed(1) + '%',
      critDamage: stats.critMultiplier.toFixed(2) + '×',
      baseFireRate: baseFireRate.toFixed(2) + ' /s',
      finalFireRate: finalFireRate.toFixed(2) + ' /s',
      mag: stats.maxMag + ' （基础 ' + weapon.mag + '）',
      reserve: '—（弹匣制）',
      reload: stats.reloadTime.toFixed(2) + 's',
      pierce: stats.pierce + ' （基础 ' + weapon.pierce + '）',
      ammo: hasInfiniteAmmo() ? '∞' : String(p.ammo[p.weapon]) + ' / ' + stats.maxMag,
      damageBonus: '+' + Math.round((p.damageMult - 1) * 100) + '%',
      fireRateBonus: '+' + Math.round((finalFireRate / baseFireRate - 1) * 100) + '%',
      magBonus: '+' + p.magBonus,
      reloadBonus: '+' + Math.round((1 / p.reloadMult - 1) * 100) + '%',
      critBonus: '+' + Math.round((p.critChance - 0.06) * 100) + '%',
      critDamageBonus: '+' + Math.round((p.critMultiplier - 2) * 100) + '%',
      qState: qState,
      eState: eState,
      rCharge: rCharge,
      rShots: rShots,
      skillDuration: hasFormSkills ? activeDuration.toFixed(1) + 's' : '—'
    };
  }

  function refreshStatsPanel(force) {
    if (!statsPanelOpen || !game || !el.statsPanel) return;
    const now = performance.now();
    if (!force && now - lastStatsPanelRefresh < 120) return;
    lastStatsPanelRefresh = now;
    const data = getLiveStatsData();
    Object.keys(data).forEach(function (key) {
      if (statsRows[key]) statsRows[key].textContent = data[key];
    });
    const form = getCurrentForm();
    const champion = !!(form && form.id === 'edg2026');
    const hasSkills = !!(form && form.implemented && form.skills);
    if (statsLabels.qState) statsLabels.qState.textContent = champion ? 'Q · 暂停一下，裁判！' : hasSkills ? 'Q · 极速射击' : 'Q · 形态技能';
    if (statsLabels.eState) statsLabels.eState.textContent = champion ? 'E · 紧急转会！' : hasSkills ? 'E · 嗜血杀戮' : 'E · 形态技能';
    if (statsLabels.rCharge) statsLabels.rCharge.textContent = champion ? 'R · 当前阶段' : hasSkills ? 'R · 击杀充能' : 'R · 形态技能';
    if (statsLabels.rShots) statsLabels.rShots.textContent = champion ? 'R · 回溯窗口' : hasSkills ? 'R · 镰刀弹' : 'R · 状态';
    if (el.statsFormName) el.statsFormName.textContent = form ? form.name : '—';
    if (el.statsFormTitle) el.statsFormTitle.textContent = form ? form.title : '';
  }

  function openStatsPanel(fromPause) {
    if (!game || !el.statsPanel) return;
    if (fromPause) {
      if (state === S.PLAYING) pauseGame();
      if (state !== S.PAUSED) return;
    } else if (state !== S.PLAYING && state !== S.PAUSED) {
      return;
    }
    statsPanelOpen = true;
    el.statsPanel.hidden = false;
    document.body.classList.add('stats-open');
    refreshStatsPanel(true);
  }

  function closeStatsPanel() {
    statsPanelOpen = false;
    if (el.statsPanel) el.statsPanel.hidden = true;
    document.body.classList.remove('stats-open');
  }

  function toggleStatsPanel() {
    if (statsPanelOpen) closeStatsPanel();
    else openStatsPanel(false);
  }

  function bindUI() {
    el.startSurvivalBtn.addEventListener('click', function () {
      audio.ensure();
      startGame('survival');
    });
    el.startStageBtn.addEventListener('click', function () {
      audio.ensure();
      startGame('stage');
    });
    if (el.rotateLockBtn) {
      el.rotateLockBtn.addEventListener('click', function () {
        requestLandscapeMode();
      });
    }
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

    setupSkillBar();
    setupStatsPanel();
    el.resumeBtn.addEventListener('click', resumeGame);
    el.pauseRestartBtn.addEventListener('click', restartGame);
    el.pauseMenuBtn.addEventListener('click', returnToMenu);
    el.restartBtn.addEventListener('click', restartGame);
    el.gameOverMenuBtn.addEventListener('click', returnToMenu);
    if (el.blackAdiaoVideo) {
      el.blackAdiaoVideo.addEventListener('ended', finishBlackAdiaoVideo);
      el.blackAdiaoVideo.addEventListener('error', finishBlackAdiaoVideo);
    }
    if (el.blackAdiaoSkipBtn) el.blackAdiaoSkipBtn.addEventListener('click', finishBlackAdiaoVideo);
    window.addEventListener('pointerdown', unlockBossMusic, { passive: true });
    window.addEventListener('keydown', unlockBossMusic);
    if (el.victoryRestartBtn) el.victoryRestartBtn.addEventListener('click', restartGame);
    if (el.victoryMenuBtn) el.victoryMenuBtn.addEventListener('click', returnToMenu);

    if (el.menuShopBtn) el.menuShopBtn.addEventListener('click', function () { openStore('shop', 'menu'); });
    if (el.menuInventoryBtn) el.menuInventoryBtn.addEventListener('click', function () { openStore('inventory', 'menu'); });
    if (el.pauseShopBtn) el.pauseShopBtn.addEventListener('click', function () { openStore('shop', 'pause'); });
    if (el.pauseInventoryBtn) el.pauseInventoryBtn.addEventListener('click', function () { openStore('inventory', 'pause'); });
    if (el.pauseStatsBtn) el.pauseStatsBtn.addEventListener('click', function () { openStatsPanel(true); });
    if (el.pauseSkillsBtn) el.pauseSkillsBtn.addEventListener('click', openSkillIntro);
    if (el.skillIntroClose) el.skillIntroClose.addEventListener('click', closeSkillIntro);
    if (el.skillIntroBack) el.skillIntroBack.addEventListener('click', closeSkillIntro);
    if (el.shopBackBtn) el.shopBackBtn.addEventListener('click', closeStore);
    if (el.inventoryBackBtn) el.inventoryBackBtn.addEventListener('click', closeStore);
    if (el.shopCards) el.shopCards.addEventListener('click', handleSkinAction);
    if (el.inventoryCards) el.inventoryCards.addEventListener('click', handleSkinAction);
  }

  function init() {
    document.body.classList.toggle('touch', hasTouch);
    document.body.dataset.state = S.MENU;
    setState(S.MENU);
    showScreen('menu');
    updateSoundButton();
    updateMenuStats();
    // 将旧版存档补齐金币/皮肤字段，同时保留原有最佳成绩与设置。
    persistSave();
    resizeCanvas();
    syncOrientationGate();
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
