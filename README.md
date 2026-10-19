# 吴卓远大战代牧豪

在线游玩：https://qianfanqqq.github.io/wuzhuoyuan-vs-daimuhao/

一款使用原生 HTML / CSS / JavaScript 与 HTML5 Canvas 制作的 2D 俯视角生存射击网页游戏。

- 无第三方框架
- 无外部网络资源
- 头像素材来自本地 `assets/`
- 音效由 Web Audio API 实时合成
- 最高分、最长存活、最高等级、累计击败和音效设置保存在 `localStorage`

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
│   ├── player.png
│   └── enemy.png
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
- 击杀反馈、枪口闪光、弹道、爆炸、伤害数字、受伤闪烁、Boss 出场提示和结算界面

## 素材说明

游戏严格从以下路径加载头像：

- 玩家：`assets/player.png`
- 敌人：`assets/enemy.png`

图片 URL 会以 `game.js` 的实际所在目录为基准解析，并自动附加版本参数，避免部署到子目录或浏览器缓存旧 404 导致头像不显示。替换素材时保持文件名不变即可。

若图片缺失或加载失败，游戏会自动绘制带有“我 / 友”标记的备用头像，不会崩溃。

### 验证头像是否加载成功

1. 用浏览器打开游戏，按 `F12` → Console。
2. 正常加载时会看到：
   - `[Avatar] 头像资源基准路径: ...`
   - `[Avatar] assets/player.png 加载成功`
   - `[Avatar] assets/enemy.png 加载成功`
3. 在 Console 执行：
   ```js
   window.__avatarDebug
   document.documentElement.dataset.playerAvatar
   document.documentElement.dataset.enemyAvatar
   ```
   两个状态都应为 `"loaded"`，尺寸应为 `640×640`。
4. 或者打开 DevTools → Network，筛选 `player.png` / `enemy.png`，应看到 `200`。
5. 如果状态为 `"fallback"`，控制台会给出失败 URL、重试次数以及 HTTP/网络错误；请确认 `assets` 目录与 `index.html` 一起部署，文件名大小写完全一致。

> 如果之后替换了头像文件但页面仍显示旧图，请把 `index.html` 中的 `?v=20261019-3` 和 `game.js` 里的 `AVATAR_VERSION` 改成新的版本号，然后强制刷新页面。
