---
slug: /
title: Visual Worktree
description: Visual Worktree 是一个 macOS 桌面应用，用于可视化管理本地多个 Git 仓库，并按任务组织跨仓库 worktree。
---

# Visual Worktree

Visual Worktree 是一个面向研发同学的 macOS 桌面应用。它把「一个需求要跨多个仓库修改」这件事，从一堆终端命令和路径记忆，收拢成按任务组织的可视化工作台。

![Visual Worktree 任务视图](/img/visual-worktree-overview.png)

源码仓库：[imberZsk/visual-worktree](https://github.com/imberZsk/visual-worktree)

## 它解决什么问题

多仓库开发最麻烦的地方往往不是 Git 本身，而是状态散落在不同目录：哪个仓库切了需求分支、哪个 worktree 有未提交变更、哪个任务卡在环境问题、哪些步骤已经做完。Visual Worktree 用 `worktreesRoot/{任务名}/{项目名}` 的结构把这些信息聚到一起，让一个需求下的多个仓库可以被一起查看、一起推进、一起收尾。

## 核心能力

- **项目扫描**：扫描本地源项目目录，展示当前分支、未提交变更、ahead/behind、远程状态和关联 worktree。
- **任务化 worktree**：按任务创建和聚合 worktree，天然适合「一个需求跨前端、后端、小程序多个仓库」的工作方式。
- **批量操作**：批量切回主分支、拉取更新、暂存变更，逐项上报进度，单个失败不影响后续项目。
- **任务工作流**：为每个任务记录流程步骤、执行命令、完成进度、卡点备注、需求链接和输出结果。
- **环境健康检查**：检查依赖、端口、服务连通性和 Git 状态，帮助判断任务目录是否具备可开发条件。
- **本地优先**：配置、任务状态、工作流和链接默认保存在 `~/.visualWorktree`，不上传仓库内容或任务数据。

## 推荐阅读

想快速了解完整产品形态，可以从这些内容开始：

- [图文上手指南](/blog/visual-worktree-product-tour)
- [功能总览](/features)
- [快速开始](/getting-started)
- [数据与隐私](/privacy-and-data)
- [源码仓库](https://github.com/imberZsk/visual-worktree)

## 适合谁

Visual Worktree 适合经常需要在多个 Git 仓库之间切换的开发者，尤其是微服务、前后端分仓、多端协作和组件库联调场景。它不是替代 Git，而是把 Git worktree、任务流程和本地环境状态放到一个更容易扫描的位置。
