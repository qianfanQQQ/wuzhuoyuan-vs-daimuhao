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
          name: '极速射击',
          icon: 'assets/skills/edg-q.svg',
          cooldown: 8,
          duration: 5,
          cooldownStartsOnCast: true,
          desc: '5 秒内射速翻倍并获得无限弹药；结束后恢复正常弹药与射速。'
        },
        e: {
          slot: 'E',
          key: 'e',
          code: 'KeyE',
          name: '嗜血杀戮',
          icon: 'assets/skills/edg-e.svg',
          cooldown: 20,
          duration: 5,
          healPerKill: 5,
          cooldownStartsOnCast: true,
          desc: '5 秒内每次有效击杀恢复 5 点生命值，不超过最大生命值。'
        },
        r: {
          slot: 'R',
          key: 'r',
          code: 'KeyR',
          name: '终极裁决',
          icon: 'assets/skills/edg-r.svg',
          requiredKills: 30,
          damageSequence: [60, 180, 260, 400, 680],
          desc: '消耗 30 点击杀充能，接下来 5 次有效射击依次变为镰刀弹。'
        }
      }
    },
    {
      id: 'edg2026',
      skinId: 'edg2026',
      name: 'EDG2026冠军赛限定',
      title: '冠军形态',
      implemented: false,
      accent: '#ff7b87',
      skills: null
    },
    {
      id: 'korean',
      skinId: 'korean',
      name: '韩国欧巴',
      title: '潮流形态',
      implemented: false,
      accent: '#5de1ff',
      skills: null
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
