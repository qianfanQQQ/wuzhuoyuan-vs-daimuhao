# 皮肤专属子弹特效

四款皮肤的子弹精灵，统一为朝右、中心锚点的透明 PNG。EDG 原皮保持游戏现有的程序化子弹效果，不替换、不新增文件。

## 文件

| 皮肤 ID | 皮肤 | 特效 | 游戏用图（512） | 高清母版（1024） |
| --- | --- | --- | --- | --- |
| `edg2026` | EDG2026冠军赛限定 | 石榴子弹 | `edg2026-pomegranate.png` | `hires/edg2026-pomegranate-1024.png` |
| `korean` | 韩国欧巴 | 泡菜子弹 | `korean-kimchi.png` | `hires/korean-kimchi-1024.png` |
| `bride` | 纯白花嫁 | 鲜花子弹 | `bride-flower.png` | `hires/bride-flower-1024.png` |
| `nun` | 特蕾拉修女 | 黑色剑子弹 | `nun-black-sword.png` | `hires/nun-black-sword-1024.png` |

- `preview-bullets.png`：深色背景预览图。
- `manifest.json`：皮肤 ID 到图片的映射。
- `source/*.svg`：可编辑的矢量源文件，均为原创图形，不依赖外部素材。
- 512 图中子弹图案的视觉中心约为 `(256, 256)`，透明画布保留光晕与拖尾空间。

## 游戏内使用

图片朝向为 **向右（0 弧度）**，锚点建议使用画布中心：

```js
ctx.save();
ctx.translate(bullet.x, bullet.y);
ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
ctx.drawImage(image, -size / 2, -size / 2, size, size);
ctx.restore();
```

- 不要把图片用于敌方子弹；敌方子弹保持原效果。
- 不要把图片应用到 `edg`，EDG 原皮保持原样。
- 皮肤只影响子弹外观，不改伤害、速度、碰撞或弹道。
- 建议实际绘制尺寸 54–78 px，可按武器和屏幕密度微调。

## 当前状态

已接入 `game.js`：

- 当前装备非 EDG 皮肤时，玩家子弹使用对应贴图。
- EDG 继续使用原来的程序化子弹绘制。
- 敌方子弹完全保持原效果。
- 四张贴图在启动时各加载一次并复用；URL 使用 `BULLET_VERSION` 版本参数缓存。
- 子弹贴图只改变视觉，不影响伤害、速度、碰撞或弹道。
