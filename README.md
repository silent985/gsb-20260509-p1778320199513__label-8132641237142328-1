# AI 对话应用

一个现代化的基于 React 的 AI 对话界面，支持 OpenAI 兼容的 API（如 SiliconFlow 等）。该应用使用 TypeScript、Material-UI 和 Docker 构建，便于部署和使用。

## 功能特点

- **自定义配置**：设置您自己的 API Key、基础 URL、模型、温度和最大 Token 数。所有设置都在浏览器本地持久化存储。
- **聊天界面**：类似 ChatGPT 的布局，带有历史记录侧边栏和主聊天区域。
- **流式响应**：使用 Server-Sent Events（通过 OpenAI SDK）实现实时打字效果。
- **丰富内容**：完整的 Markdown 支持，带有代码语法高亮和复制到剪贴板功能。
- **会话管理**：创建、切换和删除聊天会话，支持会话历史记录。
- **响应式设计**：在桌面和移动设备上均能无缝运行，适配不同屏幕尺寸。
- **性能统计**：显示响应时间和 Token 用量统计。
- **二次确认**：创建新聊天和删除聊天时提供二次确认弹窗，防止误操作。
- **多语言支持**：界面全中文显示，技术术语保持英文。

## 技术栈

- **前端**：React 18、TypeScript、Vite
- **UI 框架**：Material-UI (MUI) v5
- **状态管理**：React Context API
- **API 客户端**：OpenAI Node.js 库（客户端使用）
- **容器化**：Docker & Docker Compose

## 项目结构

```
ai-chat-web/
├── src/
│   ├── components/           # 组件目录
│   │   ├── ChatArea.tsx      # 聊天主界面
│   │   ├── ConfigPanel.tsx   # 配置面板
│   │   ├── MessageItem.tsx   # 消息项组件
│   │   └── Sidebar.tsx       # 侧边栏（会话列表）
│   ├── context/
│   │   └── ChatContext.tsx   # 全局状态管理
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   ├── App.tsx               # 应用根组件
│   └── main.tsx              # 应用入口
├── Dockerfile                # Docker 构建文件
├── docker-compose.yml        # Docker Compose 配置
├── .gitignore                # Git 忽略文件
├── index.html                # HTML 模板
├── package.json              # 项目依赖
├── tsconfig.json             # TypeScript 配置
├── tsconfig.node.json        # TypeScript Node 配置
└── vite.config.ts            # Vite 配置
```

## 快速开始

### 前提条件

- 您的机器上已安装 Docker 和 Docker Compose。
- 拥有 OpenAI 或兼容服务（如 SiliconFlow）的 API Key。

### 运行应用

1. 在项目根目录打开终端。
2. 运行以下命令启动应用：

   ```bash
   docker-compose up
   ```

3. 打开浏览器并导航到 `http://localhost:5173`。

### 配置指南

1. 点击侧边栏中的 **设置** 按钮。
2. 输入你的 **API Key**（临时测试用：sk-rpomezncwtpkvtukoiwdaibnrzprrvrgvrgyfntwqztnkfvt）
3. （可选）如果您使用的不是 OpenAI 服务，请更新 **基础 URL**（默认为 SiliconFlow 的 `https://api.siliconflow.cn/v1`）。
4. 根据需要调整 **温度** 和 **最大 Token 数**。
5. 选择您要使用的 **模型**（默认为免费模型 `deepseek-ai/DeepSeek-R1-0528-Qwen3-8B` 便于调试）。

## 使用方法

1. **创建新聊天**：点击侧边栏中的 **新聊天** 按钮，在确认弹窗中点击 **确定**。
2. **发送消息**：在输入框中输入您的问题，然后按 Enter 键或点击发送按钮。
3. **查看历史记录**：在侧边栏中点击会话列表中的项目，切换到相应的聊天记录。
4. **删除聊天**：在侧边栏中点击会话右侧的删除按钮，在确认弹窗中点击 **确定删除**。
5. **复制内容**：点击消息右上角的复制按钮，将消息内容复制到剪贴板。

## 开发说明

该项目设置为完全在 Docker 中运行，以避免本地环境问题。本地目录被挂载到容器中，因此对源代码的更改理论上会触发热模块替换（HMR），但文件监视事件在不同操作系统的文件系统桥接中有时可能会遇到问题。

## 许可证

MIT
