/* =========================================================
   随机事件模块
   事件管理器只负责注册、概率判定与本次游戏流程状态；
   具体事件内容放在独立定义中，游戏逻辑通过事件对象读取。
   ========================================================= */
(function () {
  'use strict';

  class RandomEventManager {
    constructor() {
      this.events = [];
      this.byId = Object.create(null);
      this.activeId = null;
      this.triggeredIds = new Set();
      this.checkedIds = new Set();
      this.lastRoll = null;
    }

    register(event) {
      if (!event || !event.id || this.byId[event.id]) return this;
      this.events.push(event);
      this.byId[event.id] = event;
      return this;
    }

    get(id) {
      return this.byId[id] || null;
    }

    getActive() {
      return this.activeId ? this.get(this.activeId) : null;
    }

    isActive() {
      return !!this.activeId;
    }

    resetRun() {
      this.activeId = null;
      this.triggeredIds.clear();
      this.checkedIds.clear();
      this.lastRoll = null;
    }

    /**
     * 在指定触发点尝试随机事件。
     * 同一事件在一次游戏流程中只会判定一次，且活动事件期间不会再次判定。
     */
    tryTrigger(trigger, context) {
      if (this.activeId) return null;
      const ctx = context || {};
      const candidates = this.events.filter((event) => {
        if (event.trigger !== trigger) return false;
        if (event.stage && event.stage !== ctx.stage) return false;
        if (this.triggeredIds.has(event.id)) return false;
        if (this.checkedIds.has(event.id)) return false;
        return true;
      });

      for (let i = 0; i < candidates.length; i += 1) {
        const event = candidates[i];
        this.checkedIds.add(event.id);
        this.lastRoll = Math.random();
        if (this.lastRoll < event.chance) {
          this.triggeredIds.add(event.id);
          this.activeId = event.id;
          return event;
        }
      }
      return null;
    }

    finish() {
      const id = this.activeId;
      this.activeId = null;
      return id;
    }
  }

  const WUCHAOYANG_EVENT = {
    id: 'wu-chaoyang',
    title: '吴朝阳的抉择',
    trigger: 'stage-clear',
    stage: 3,
    chance: 0.8,
    portrait: 'wuchaoyang-portrait.jpg',
    avatar: 'wuchaoyang-avatar.jpg',
    personName: '吴朝阳',
    intro: {
      speaker: '吴朝阳',
      role: '第三关尽头的不速之客',
      text: '“又见面了，吴卓远。第三关的尽头，我一直在等你。今天，你得做个选择。”'
    },
    choices: {
      fight: {
        label: '战斗',
        hint: '进入高难度弹幕 Boss 战'
      },
      talk: {
        label: '交流',
        hint: '先听听他想说什么'
      }
    },
    question: {
      text: '“残局遇到队友保安绊线该怎么办？”',
      options: [
        { id: 'shoot', label: 'A. 射击' },
        { id: 'pig', label: 'B. 猪鼻吧，队友绊线管他干什么' },
        { id: 'ignore', label: 'C. 无视' }
      ]
    },
    responses: {
      shoot: '“太好了，你是我的真命天子！”',
      hostile: '“你是我吴朝阳的敌人！”',
      companion: '“吴朝阳已成为你的随行伙伴。”'
    },
    affinity: {
      gain: 100,
      max: 100
    },
    boss: {
      name: '吴朝阳',
      title: '抉择之影',
      hp: 3400,
      radius: 58,
      phase2At: 0.5
    },
    reward: {
      coins: 500,
      choices: [
        {
          id: 'bulletDestroyer',
          name: '弹幕毁灭者',
          desc: '所有枪械伤害提高 50%',
          detail: 'DAMAGE +50%',
          color: '#ff6b7d'
        },
        {
          id: 'rapidArsenal',
          name: '极速军火库',
          desc: '所有枪械射速提高 30%',
          detail: 'FIRE RATE +30%',
          color: '#5de1ff'
        },
        {
          id: 'undying',
          name: '不死狂徒',
          desc: '最大生命值提高 50%，并恢复 50% 最大生命',
          detail: 'MAX HP +50% · HEAL 50%',
          color: '#66e6a8'
        }
      ]
    }
  };

  const SHENLIN_EVENT = {
    id: 'shen-lin',
    title: '神临',
    trigger: 'stage-enter',
    stage: 8,
    chance: 0.8,
    portrait: 'huoda-portrait.jpg',
    avatar: 'huoda-portrait.jpg',
    personName: '霍达',
    role: '第八关的考验者',
    intro: {
      speaker: '霍达',
      role: '第八关的考验者',
      text: '孩子，你是否接受挑战'
    },
    choices: {
      accept: {
        label: '会赢的',
        hint: '进入 12 秒极限激光雨'
      },
      leave: {
        label: '离开',
        hint: '放弃本次挑战'
      }
    }
  };

  window.RandomEventSystem = {
    RandomEventManager: RandomEventManager,
    events: {
      WUCHAOYANG: WUCHAOYANG_EVENT,
      SHENLIN: SHENLIN_EVENT
    }
  };
})();
