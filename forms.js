/* =========================================================
   角色形态 / 技能数据层
   ---------------------------------------------------------
   这里只放“形态是什么、技能有哪些、技能参数是多少”。
   实际冷却、持续时间、伤害和战斗状态由 game.js 的技能运行时控制。
   后续形态只需在这里增加数据，并在 game.js 注册对应效果。
   ========================================================= */
(function () {
  'use strict';

  var FORMS = [
    {
      id: 'edg',
      skinId: 'edg',
      name: 'EDG',
      title: '极速枪手',
      implemented: true,
      accent: '#ff5f6d',
      skills: {
        q: {
          slot: 'Q',
          key: 'q',
          code: 'KeyQ',
          keyLabel: 'Q',
          name: '极速射击',
          icon: 'assets/skills/edg-q.svg',
          effect: 'rapidFire',
          cooldown: 8,
          duration: 5,
          cooldownStartsOnCast: true,
          desc: '5 秒内射速翻倍并获得无限弹药；结束后恢复正常弹药与射速。'
        },
        e: {
          slot: 'E',
          key: 'e',
          code: 'KeyE',
          keyLabel: 'E',
          name: '嗜血杀戮',
          icon: 'assets/skills/edg-e.svg',
          effect: 'bloodlust',
          cooldown: 20,
          duration: 5,
          healPerKill: 1,
          cooldownStartsOnCast: true,
          desc: '5 秒内每次有效击杀恢复 1 点生命值，不超过最大生命值。'
        },
        r: {
          slot: 'R',
          key: 'r',
          code: 'Space',
          keyLabel: '空格',
          name: '终极裁决',
          icon: 'assets/skills/edg-r.svg',
          effect: 'judgement',
          requiredKills: 30,
          damageSequence: [60, 180, 260, 400, 680],
          desc: '消耗 30 点击杀充能，接下来 5 次有效射击依次变为镰刀弹。'
        }
      }
    },
    {
      id: 'edg2026',
      skinId: 'edg2026',
      name: 'EDG 2026 冠军赛限定版',
      shortName: 'EDG 2026',
      title: '十六强重开形态',
      implemented: true,
      accent: '#ff5f6d',
      skills: {
        q: {
          slot: 'Q',
          key: 'q',
          code: 'KeyQ',
          keyLabel: 'Q',
          name: '暂停一下，裁判！',
          icon: 'assets/skills/edg2026-q.svg',
          effect: 'pauseCourt',
          cooldown: 12,
          duration: 1.5,
          freezeDuration: 1.5,
          cooldownStartsOnCast: true,
          desc: '冻结敌人与敌方弹幕 1.5 秒；玩家可移动、瞄准、射击，期间发射的玩家子弹延迟到解冻后飞行。'
        },
        e: {
          slot: 'E',
          key: 'e',
          code: 'KeyE',
          keyLabel: 'E',
          name: '紧急转会！',
          icon: 'assets/skills/edg2026-e.svg',
          effect: 'transfer',
          cooldown: 15,
          markDuration: 4,
          explosionDelay: 1.2,
          explosionRadius: 170,
          explosionDamage: 160,
          contractSpeed: 560,
          contractLife: 1.8,
          contractRadius: 11,
          teleportAimDistance: 300,
          desc: '发射转会合同，命中普通敌人后将其传送到准星附近并标记；短暂延迟后爆炸，对周围敌人造成范围伤害。'
        },
        r: {
          slot: 'R',
          key: 'r',
          code: 'Space',
          keyLabel: '空格',
          name: '十六强重开！',
          icon: 'assets/skills/edg2026-r.svg',
          effect: 'rewind',
          cooldown: 16,
          recordDuration: 4,
          confirmWindow: 2,
          cooldownStartsOnCast: true,
          desc: '记录 4 秒战斗状态，随后开启 2 秒确认窗口；再次释放可回到记录起点并恢复记录时的生命值，但保留击杀、伤害、弹药与奖励。'
        }
      }
    },
    {
      id: 'korean',
      skinId: 'korean',
      name: '韩国欧巴',
      title: '潮流形态',
      implemented: true,
      accent: '#5de1ff',
      skills: {
        q: {
          slot: 'Q',
          key: 'q',
          code: 'KeyQ',
          keyLabel: 'Q',
          name: '双臂近战',
          icon: 'assets/skills/korean-q.svg',
          effect: 'koreanArms',
          cooldown: 12,
          duration: 6,
          cooldownStartsOnCast: true,
          desc: '召唤双臂近战 6 秒；3 秒后断一臂并提示“阿一古”，剩余手臂攻速翻倍。'
        },
        e: {
          slot: 'E',
          key: 'e',
          code: 'KeyE',
          keyLabel: 'E',
          name: '自爆僵尸',
          icon: 'assets/skills/korean-e.svg',
          effect: 'koreanZombie',
          cooldown: 5,
          duration: 5.2,
          explosionRadius: 105,
          zombieSpeed: 145,
          desc: '召唤自爆僵尸自动追踪敌人，进入范围后爆炸，造成关卡数 × 20 伤害。'
        },
        r: {
          slot: 'R',
          key: 'r',
          code: 'Space',
          keyLabel: '空格',
          name: '天降巨大马头',
          icon: 'assets/skills/korean-r.svg',
          effect: 'koreanHorse',
          requiredKills: 48,
          desc: '每击杀 48 名敌人获得一次释放机会；巨大马头砸下，按关卡造成 600/1200/1500/2000 伤害。'
        }
      }
    },
    {
      id: 'bride',
      skinId: 'bride',
      name: '纯白花嫁',
      title: '花嫁形态',
      implemented: false,
      accent: '#ffc7dd',
      skills: null
    },
    {
      id: 'nun',
      skinId: 'nun',
      name: '特蕾拉修女',
      title: '修女形态',
      implemented: false,
      accent: '#b8a2ff',
      skills: null
    }
  ];

  var BY_ID = Object.create(null);
  var BY_SKIN = Object.create(null);
  FORMS.forEach(function (form) {
    BY_ID[form.id] = form;
    BY_SKIN[form.skinId] = form;
  });

  window.CharacterForms = {
    all: FORMS,
    getById: function (id) {
      return BY_ID[id] || null;
    },
    getBySkinId: function (skinId) {
      return BY_SKIN[skinId] || null;
    },
    getSkill: function (formId, slot) {
      var form = BY_ID[formId];
      return form && form.skills ? (form.skills[slot] || null) : null;
    },
    hasSkills: function (formId) {
      var form = BY_ID[formId];
      return !!(form && form.implemented && form.skills);
    }
  };
})();
