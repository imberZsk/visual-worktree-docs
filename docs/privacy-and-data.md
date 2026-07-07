---
title: 数据与隐私
description: Visual Worktree 的本地数据目录、读取范围和隐私说明。
---

# 数据与隐私

Visual Worktree 是本地优先的桌面工具。它读取你配置的本机仓库目录和 Git 状态，用本地文件保存任务辅助信息，不会主动上传仓库内容、任务状态或本地路径。

## 本地数据目录

默认持久化目录是：

```text
~/.visualWorktree
```

常见文件包括：

- `config.json`：应用配置
- `task-status.json`：任务状态
- `task-links.json`：任务外部链接
- `task-workflow.json`：流程步骤勾选状态
- `task-workflow-output.json`：最近一次流程执行输出
- `task-blockers.json`：任务卡点备注
- `task-env-health.json`：环境检查缓存
- `task-history.json`：已删除任务历史
- `task-docs/`：删除任务前归档的工作文档

## 应用会读取什么

应用会读取你在设置里配置的源项目根目录和 worktree 根目录。读取内容主要包括 Git 状态、worktree 列表、远程地址、文件变更数量、目录结构和环境检查所需的项目配置文件。

如果启用 AI 用量概览，应用会读取本机 Claude Code 会话数据，用于按任务汇总 token 和费用。这个统计仍然只在本地完成。

## 应用不会做什么

Visual Worktree 不会上传仓库内容，不会把任务状态同步到云端，也不会把你的本地路径发送到远端服务。外部链接只在你点击时交给系统浏览器打开。

## 截图脚本的数据

官网截图脚本会临时创建演示 Git 仓库和 worktree，用来生成真实 UI 截图。演示数据会放在系统临时目录，截图完成后自动清理，因此不会在官网项目目录里留下嵌套 Git 仓库。
