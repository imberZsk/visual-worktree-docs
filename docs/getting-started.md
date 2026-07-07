---
title: 快速开始
description: 安装、启动和配置 Visual Worktree 的基础步骤。
---

# 快速开始

Visual Worktree 当前面向 macOS Apple Silicon 开发和打包。使用前需要系统已安装 Git，并准备好 Node.js 和 pnpm 用于本地开发或自行打包。

源码仓库：[imberZsk/visual-worktree](https://github.com/imberZsk/visual-worktree)

## 本地运行

```bash
git clone https://github.com/imberZsk/visual-worktree.git
cd visual-worktree
pnpm install
pnpm dev
```

开发模式会同时启动 Vite dev server 和 Electron 主进程。生产模式可以先构建 UI，再由 Electron 加载本地文件：

```bash
pnpm start
```

## 首次配置

首次启动后打开右上角设置，至少配置两个目录：

- **源项目根目录**：存放多个 Git 仓库的目录，例如 `~/work/projects`
- **Worktree 根目录**：按任务生成 worktree 的目录，例如 `~/work/worktrees`

推荐把源项目和 worktree 分开。源项目保留主工作区，需求开发在 worktree 根目录下按任务组织。

## 推荐目录结构

```text
~/work/projects/
  frontend-shell/
  api-gateway/
  miniapp-client/

~/work/worktrees/
  FEAT-231 多端结算页联调/
    frontend-shell/
    api-gateway/
    miniapp-client/
```

## 常用命令

```bash
pnpm test               # 运行单元和集成测试
pnpm run test:coverage  # 生成覆盖率报告
pnpm run build:ui       # 构建前端产物
pnpm run verify:boot    # Electron 启动冒烟验证
pnpm run dist           # 打包 macOS arm64 DMG
```

## 创建第一个任务

1. 在设置中确认源项目根目录和 Worktree 根目录。
2. 回到 Worktree 视图，点击「创建 Worktree」。
3. 输入任务名，例如 `FEAT-231 多端结算页联调`。
4. 选择这个任务涉及的多个项目。
5. 输入或确认分支名，提交创建。

创建完成后，任务会显示在 Worktree 视图里。你可以展开任务查看每个项目的 worktree、分支、未提交变更和快捷操作。

## 后续工作流

推荐把每个任务当作一个小工作台：

- 用任务状态标记当前阶段
- 挂上 Jira、需求文档、测试用例或上线单链接
- 用流程步骤记录需求确认、开发、自测、提测和发布检查
- 用环境健康检查确认任务目录能否运行
- 完成后归档工作文档并清理 worktree
