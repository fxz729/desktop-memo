# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # 启动开发服务器（Electron + Vite HMR）
npm run build        # 编译 TypeScript + Vite 构建
npm run build:win    # 构建 Windows 安装包（NSIS）
npm run build:unpack # 构建未打包的 Windows 目录（调试用）
```

## Architecture

这是一个 **Electron + React + TypeScript** 桌面备忘录应用，使用 electron-vite 构建。

### 进程结构

```
src/
├── main/          # Electron 主进程
│   ├── index.ts         # 入口：单实例锁、全局快捷键、生命周期
│   ├── windowManager.ts # 窗口创建与边缘吸附（edgeHide）
│   ├── trayManager.ts   # 系统托盘图标与菜单
│   ├── ipcHandlers.ts   # IPC 路由：memo/category/settings/window
│   ├── storeManager.ts  # electron-store 封装（数据持久化）
│   └── reminderService.ts # node-schedule 定时提醒
├── preload/
│   └── index.ts   # contextBridge 暴露 window.electronAPI
├── renderer/      # React 渲染进程
│   ├── App.tsx    # 根组件：主题/透明度/模式切换
│   ├── store/useMemoStore.ts  # Zustand 全局状态（唯一状态源）
│   ├── components/
│   │   ├── MemoList.tsx        # 标准模式列表
│   │   ├── CompactMemoList.tsx # 纯净模式列表
│   │   ├── MemoItem.tsx        # 单条备忘录
│   │   ├── MemoWidget.tsx      # 悬浮小窗
│   │   ├── AddMemoModal.tsx    # 新建/编辑弹窗
│   │   ├── CategoryTabs.tsx    # 分类标签
│   │   └── SettingsPanel.tsx   # 设置面板
│   └── types/index.ts
└── shared/
    └── types.ts   # 跨进程共享类型（Memo/Category/AppSettings）
```

### 数据流

- **持久化**：`storeManager.ts` 用 `electron-store` 将数据写入用户 AppData
- **IPC 通道命名约定**：`memo:*` / `category:*` / `settings:*` / `window:*`
- **渲染进程通过 `window.electronAPI` 调用 IPC**（由 preload 注入）
- **Zustand store** 在每次操作后同步更新本地状态（不重新从磁盘加载）

### 关键特性实现位置

| 特性 | 文件 |
|------|------|
| 边缘吸附隐藏 | `windowManager.ts` |
| 全局快捷键 | `main/index.ts` → `registerGlobalShortcuts()` |
| 定时提醒弹窗 | `reminderService.ts` + IPC 事件 `reminder:trigger` |
| 主题 / 透明度 | `App.tsx` CSS 变量 |
| 纯净模式 | `App.tsx` → `CompactMemoList` |
| 系统托盘 | `trayManager.ts` |

### 注意事项

- `electron-store` 和 `node-schedule` 在 `electron.vite.config.ts` 中被标记为 external，不会被 Vite 打包
- 渲染进程中的 `window.electronAPI` 类型定义在 `src/types/tauri.ts`（历史遗留文件名）
- 数据存储路径由 `electron-store` 自动选择（Windows: `%APPDATA%\desktop-memo`）
