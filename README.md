# desktop-memo

一款简约清新的桌面备忘录应用，支持多模式显示、边缘自动隐藏、全局快捷键，让你的备忘录随时可见、随用随取。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-v1.0.1-green.svg)

## 功能特性

### 多模式显示
- **标准模式**：完整显示所有备忘录内容和分类标签
- **纯净模式**：简洁列表展示，适合专注阅读
- **极简模式**：仅显示最近 2 条备忘，窗口自动适配缩小
- **迷你模式**：超小窗口，仅展示最新 1 条备忘

### 智能边缘隐藏
- 窗口自动贴附屏幕边缘
- 鼠标离开后自动隐藏为窄条
- 鼠标悬停窄条即可快速呼出
- 窄条宽度可调节，视觉融入软件本身

### 分类管理
- 支持创建多个分类（如：工作、生活、学习）
- 分类颜色自定义
- 快速切换筛选不同分类下的备忘

### 主题与个性化
- 深色/浅色主题切换
- 窗口透明度调节（0-100%）
- 主题色跟随系统或手动选择

### 其他功能
- **全局快捷键**：`Ctrl+Shift+M` 快速呼出/隐藏窗口
- **定时提醒**：为备忘设置提醒时间，到期弹出通知
- **系统托盘**：最小化到托盘，后台静默运行
- **数据持久化**：所有数据存储在本地，隐私安全

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Electron + React + TypeScript |
| 构建 | electron-vite + electron-builder |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 数据存储 | electron-store |
| 定时任务 | node-schedule |
| 图标 | Lucide React |
| 动画 | Framer Motion |

## 安装使用

### 下载安装包（推荐）

前往 [Releases](https://github.com/fxz729/desktop-memo/releases) 页面下载最新版本的安装包：

- `desktop-memo-Setup-x.x.x.exe` - Windows 安装包

下载后双击运行，按提示完成安装即可。

### 从源码构建

```bash
# 克隆仓库
git clone https://github.com/fxz729/desktop-memo.git

# 进入项目目录
cd desktop-memo

# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建 Windows 安装包
npm run build:win
```

构建完成后，安装包位于 `dist-nsis` 目录下。

## 使用说明

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+M` | 全局呼出/隐藏主窗口 |

### 基本操作

1. **添加备忘**：点击左上角 "+" 按钮或直接开始输入
2. **编辑备忘**：点击已有备忘进入编辑模式
3. **删除备忘**：在编辑模式下点击删除按钮
4. **切换分类**：点击顶部分类标签快速筛选
5. **添加分类**：在分类栏最右侧点击 "+" 添加新分类
6. **设置提醒**：编辑备忘时点击时钟图标设置提醒时间

### 窗口操作

- **移动位置**：拖动窗口标题栏
- **边缘吸附**：将窗口拖近屏幕四边会自动贴附
- **自动隐藏**：鼠标离开窗口区域后自动隐藏为窄条
- **呼出窗口**：鼠标移动到窄条位置即可快速呼出

## 项目结构

```
desktop-memo/
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── index.ts          # 入口、全局快捷键、生命周期
│   │   ├── windowManager.ts  # 窗口管理、边缘吸附
│   │   ├── trayManager.ts    # 系统托盘
│   │   ├── ipcHandlers.ts    # IPC 通信处理
│   │   ├── storeManager.ts   # 数据持久化
│   │   └── reminderService.ts # 定时提醒
│   ├── preload/              # 预加载脚本
│   │   └── index.ts          # contextBridge API 暴露
│   ├── renderer/             # React 渲染进程
│   │   ├── App.tsx           # 根组件
│   │   ├── components/       # UI 组件
│   │   ├── store/            # Zustand 状态管理
│   │   └── styles/           # 全局样式
│   └── shared/               # 共享类型定义
│       └── types.ts          # Memo、Category、Settings 类型
├── electron-builder.yml      # 构建配置
├── electron.vite.config.ts   # Vite 配置
└── package.json
```

## 数据存储

所有数据默认存储在用户 AppData 目录：
- Windows: `%APPDATA%\desktop-memo`

包含以下数据：
- `memos.json` - 备忘录内容
- `categories.json` - 分类数据
- `settings.json` - 应用设置

## 开源许可

本项目基于 [MIT License](LICENSE) 开源。

## 欢迎 Star

如果这个项目对你有帮助，欢迎在 GitHub 上点个 Star！

---

Made with ❤️ by [fxz729](https://github.com/fxz729)
