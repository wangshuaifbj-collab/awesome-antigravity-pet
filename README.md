<div align="center">

# 🚀 Awesome Antigravity Pet (桌面智能伴侣)

English | [简体中文](#简体中文)

<p><strong>✨ The native animated desktop pet companion for Google Antigravity with 193+ high-res characters and real-time reasoning lifecycle sync.</strong></p>

<p>
  <img src="https://img.shields.io/badge/Antigravity-2.x%20Ready-00bcd4?style=flat-square&logo=google" alt="Antigravity Ready">
  <img src="https://img.shields.io/badge/Pets-193%20Characters-2ea44f?style=flat-square" alt="Pets 193">
  <img src="https://img.shields.io/badge/Language-English%20%7C%20%E4%B8%AD%E6%96%87-8250df?style=flat-square" alt="i18n">
  <img src="https://img.shields.io/badge/Code-MIT-111111?style=flat-square" alt="Code MIT">
  <img src="https://img.shields.io/badge/Assets-CC%20BY--NC%204.0-f97316?style=flat-square" alt="Assets CC BY-NC 4.0">
</p>

</div>

---

## 🌟 Highlights

- 🎮 **193+ Out-of-the-Box Characters**: Firefly, Acheron, Arlecchino, Black Swan, Furina, Frieren, Klee, Wukong, and many more!
- 🧠 **Real-Time Reasoning Lifecycle Sync**:
  - **Thinking / Planning**: Character enters thoughtful posing (`waiting`) with thinking speech bubble.
  - **Coding / Tool Execution**: Character focuses on typing & reviewing (`review`).
  - **Task Delivered**: Character celebrates with happy jumps (`jumping`)!
  - **Idle**: Elegant static standing to keep your workspace distraction-free.
- 🪟 **Pixel-Perfect Windows Transparency**: Zero black borders, zero ghost rectangle artifacts, high-DPI scaling, and head-anchored speech bubbles.
- ⚡ **Zero-Touch Auto-Launch & Smart Memory**: Launches silently when you chat with Antigravity; exits cleanly when IDE closes. Remembers user disable intent.
- 🌐 **Full Bilingual i18n**: Automatic system language detection (Chinese & English) with seamless instant toggling.

---

## 🚀 Quick Start

### 1. Installation & Hook Setup

```bash
git clone https://github.com/wangshuaifbj-collab/awesome-antigravity-pet.git
cd awesome-antigravity-pet
pip install -e .
pet install-hooks    # Auto-register Antigravity lifecycle hooks
```

### 2. How It Works (Zero-Touch Experience)

- **Default (Automatic)**: You **don't need to run any startup command**! Whenever you send a message in Antigravity, the desktop pet automatically wakes up, enters thinking posing, codes alongside you, and celebrates on task completion.
- **Quick Controls & Character Switching (Optional)**:
  ```bash
  pet acheron       # Instantly hot-switch running pet to Acheron (黄泉)
  pet furina        # Hot-switch to Furina (芙宁娜)
  pet list          # Browse all 193 characters
  pet autostart enable   # Auto-start with Windows login
  pet disable       # Exit & pause auto-wake (Do Not Disturb)
  ```

---

## 🎮 Interactions

- **Hover**: Wave greeting 👋
- **Drag**: Flying locomotion 🐾 and safe landing 🚀
- **Double Click**: Quick switch to next featured character 💖
- **Right Click**: Open full context menu (A-Z character catalog, language switcher, action demos, exit)

---

<div id="简体中文"></div>

## 简体中文说明

### 🌟 核心亮点

- 🎮 **海量 193 款高精度二次元/游戏角色**：流萤、黄泉、仆人、黑天鹅、芙宁娜、芙莉莲、可莉、大圣等全覆盖，开箱即用。
- 🧠 **Antigravity 全生命周期动作深度联动**：
  - **思考构思时**：角色闭眼托腮沉思（`waiting`），弹出构思气泡；
  - **编写代码/调用工具时**：角色进入专注审查打字状态（`review`）；
  - **输出完成交付时**：瞬间切换为欢快跳跃庆祝（`jumping`）；
  - **平时待机时**：保持绝对优雅静止，不分散开发注意力。
- 🪟 **原生 Windows 透明悬浮窗**：0 黑色背景、0 脏矩形残留、自适应贴头发顶气泡。
- ⚡ **随 IDE 智能启闭与意图记忆**：打开 Antigravity 自动唤醒，关闭 Antigravity 挥手告别；用户右键退出后自动进入免打扰模式，绝不强行打扰。

### 常用命令

```bash
pet               # 启动默认宠物（流萤）
pet acheron       # 启动黄泉
pet list          # 查看全部 193 款角色列表
pet autostart enable   # 开启 Windows 开机自启
pet disable       # 退出并停用自动唤醒
```

---

## 💖 Acknowledgments & Credits (鸣谢)

- 本项目的精灵切片素材（SpriteSheets）及动作帧协议规范衍生自社区开源项目 [Awesome Codex Pet](https://github.com/legeling/awesome-codex-pet) (by **Lingxiaotian** 及广大社区画师贡献者)。
- 感谢所有为二次元角色素材创作与分享的创作者们！

---

## 📄 License

- **Code Engine**: Released under the [MIT License](./LICENSE).
- **Pet Assets**: Licensed under [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](./ASSETS-LICENSE.md). Non-commercial use only.
