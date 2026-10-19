# 发布到 GitHub Pages

已上线：https://qianfanqqq.github.io/wuzhuoyuan-vs-daimuhao/

仓库：https://github.com/qianfanQQQ/wuzhuoyuan-vs-daimuhao

项目目录：

```text
C:\Users\KAI\Documents\deepseek-harness\default-workspace
```

本目录已经初始化为 Git 仓库，并完成首个提交。

## 1. 在 VS Code 中打开目录

VS Code → **文件 / File** → **打开文件夹 / Open Folder**，粘贴：

```text
C:\Users\KAI\Documents\deepseek-harness\default-workspace
```

## 2. 发布到 GitHub

1. 左侧点击 **源代码管理 / Source Control**（`Ctrl + Shift + G`）。
2. 点击顶部的 **Publish Branch / 发布分支**（云朵图标）。
3. 如果出现仓库名称，改成：

```text
wuzhuoyuan-vs-daimuhao
```

4. 选择 **Public / 公开仓库**。
5. 等待 VS Code 完成推送。

如果顶部没有 “Publish Branch”，点击源代码管理面板右上角的 `...`，选择 **Publish to GitHub**。

## 3. 开启 GitHub Pages

打开刚创建的 GitHub 仓库页面：

```text
Settings → Pages
```

设置：

- Source：`Deploy from a branch`
- Branch：`main`
- Folder：`/ (root)`

点击 **Save**，等待 1–3 分钟。

最终网址通常为：

```text
https://你的GitHub用户名.github.io/wuzhuoyuan-vs-daimuhao/
```

## 4. 提交给搜索引擎

拿到最终网址后，还需要：

1. 在 Google Search Console 添加“网址前缀”资源并验证。
2. 在 Bing Webmaster Tools 添加站点。
3. 提交 `sitemap.xml`。
4. 等待搜索引擎抓取，通常需要几天到几周。

建议把最终 GitHub Pages 网址发给 AI 助手，以补齐：

- `sitemap.xml`
- 静态 canonical 地址
- 搜索引擎验证文件
- IndexNow 提交文件
