# 吴卓远大战代牧豪

在线游玩：https://qianfanqqq.github.io/wuzhuoyuan-vs-daimuhao/

一款使用原生 HTML / CSS / JavaScript 与 HTML5 Canvas 制作的 2D 俯视角生存射击网页游戏。

- 无第三方框架
- 无外部网络资源
- 头像素材来自本地 `assets/`
- 音效由 Web Audio API 实时合成
- 最高分、最长存活、最高等级、累计击败、金币、皮肤与音效设置保存在 `localStorage`
- 关卡金币商城、皮肤购买、仓库装备与游戏内外观同步

## 运行方法

直接双击 `index.html` 即可在现代浏览器中运行。

如果想通过本地服务器运行（推荐，避免个别浏览器对 `file://` 的限制）：

```bash
# 在项目目录中任选一种
python -m http.server 8000
npx serve .
```

然后访问 `http://localhost:8000`。

## 目录结构

```text
.
├── index.html
├── style.css
├── game.js
├── assets/
│   ├── enemy.png
│   ├── player.png              # 旧版头像，保留兼容
│   └── skins/
│       ├── edg.png
│       ├── edg-2026-champion.png
│       ├── korean-oppa.png
│       ├── pure-white-bride.png
│       └── theresa-nun.png
├── sitemap.xml
├── robots.txt
└── screenshots/
    ├── desktop-gameplay.png
    └── mobile-gameplay.png
```

## 操作

### 电脑端

| 操作 | 按键 |
| --- | --- |
| 移动 | `W` `A` `S` `D` |
| 瞄准 | 鼠标 |
| 射击 | 鼠标左键（可按住连射） |
| 换弹 | `R` |
| 冲刺 | `空格` |
| 切换枪械 | `1` ~ `5` |
| 暂停 / 继续 | `ESC` 或 `P` |

### 手机端

- 左侧虚拟摇杆：移动
- 右侧虚拟摇杆：瞄准
- 开火、换弹、冲刺、切枪按钮
- 未操作右摇杆时，开火会自动辅助瞄准最近敌人

## 游戏内容

- 无限生存与关卡挑战两种模式
- 手枪、冲锋枪、霰弹枪、狙击枪、火箭筒，各自拥有独立伤害、射速、弹匣和换弹时间
- 普通敌人、精英敌人、拥有独立血条与弹幕攻击的 Boss
- 经验球升级、三选一强化、枪械解锁
- 关卡金币奖励、皮肤商城、仓库、皮肤购买和装备
- 五款角色皮肤，装备后会在游戏角色和 HUD 中实际切换图片
- 击杀反馈、枪口闪光、弹道、爆炸、伤害数字、受伤闪烁、Boss 出场提示和结算界面

## 金币与皮肤

### 金币

关卡模式按实际完成的关卡结算：

```text
金币 = 100 + 50 × (关卡等级 - 1)
```

- 第 1 关：100
- 第 2 关：150
- 第 3 关：200
- 关卡真正推进时发放
- 中途死亡或失败不发放
- 同一关每次完成只结算一次
- 无限生存模式暂不发金币

### 皮肤

| 顺序 | 皮肤 | 价格 | 图片 |
| --- | --- | --- | --- |
| 1 | EDG | 0（默认拥有） | `assets/skins/edg.png` |
| 2 | EDG2026冠军赛限定 | 500 | `assets/skins/edg-2026-champion.png` |
| 3 | 韩国欧巴 | 1000 | `assets/skins/korean-oppa.png` |
| 4 | 纯白花嫁 | 2000 | `assets/skins/pure-white-bride.png` |
| 5 | 特蕾拉修女 | 3500 | `assets/skins/theresa-nun.png` |

价格和皮肤信息集中保存在 `game.js` 的 `SKINS` 配置中。购买不会自动装备，装备后角色外观会立即同步到游戏内和 HUD。

## 素材说明

游戏从以下路径加载头像：

- 当前玩家皮肤：`assets/skins/` 中对应图片
- 敌人：`assets/enemy.png`
- 旧版玩家头像 `assets/player.png` 仍保留，用于兼容旧版本资源
- 皮肤专属子弹特效预留素材：`assets/bullets/`（说明见该目录的 `README.md`，当前尚未接入游戏）

图片 URL 会以 `game.js` 的实际所在目录为基准解析，并自动附加版本参数，避免部署到子目录或浏览器缓存旧 404 导致头像不显示。若图片缺失或加载失败，游戏会自动绘制备用圆形头像，不会崩溃。

### 验证头像与皮肤是否加载成功

1. 用浏览器打开游戏，按 `F12` → Console。
2. Console 会打印每个头像/皮肤图片的加载结果。
3. 在 Console 执行：
   ```js
   window.__avatarDebug
   document.documentElement.dataset.playerAvatar
   document.documentElement.dataset.enemyAvatar
   ```
   应看到玩家、敌人和五款皮肤均对应 `"loaded"`。
4. 在商城和仓库中应能看到五张不同的皮肤图片；装备不同皮肤后，游戏角色和左上角 HUD 会同步变化。
5. 如果状态为 `"fallback"`，控制台会给出失败 URL、重试次数以及 HTTP/网络错误；请确认 `assets` 目录与 `index.html` 一起部署，文件名大小写完全一致。

> 如果替换了图片但页面仍显示旧图，请把 `index.html` 中的 `?v=20261020-1` 和 `game.js` 里的 `AVATAR_VERSION` 改成新的版本号，然后强制刷新页面。
