# Awesome Antigravity Pet Agent Guide

本文件面向在本仓库内工作的 AI coding agents。

默认要求：

- 默认使用中文与用户沟通，除非用户明确要求英文。
- 优先做出可提交的仓库改动，而不是只停留在分析。
- 保证 Python 桌面客户端代码质量，兼顾跨平台透明渲染与事件驱动性能。

## 1. 项目定位

`awesome-antigravity-pet` 是 **Google Antigravity IDE 的原生桌面宠物伴侣客户端**。
核心运行架构基于 **Python 3.10+ (PyQt6) + 本地 UDP/Socket IPC 监听 + Antigravity Agent 生命周期 Hook 联动**。

## 2. 核心架构与目录规范

```text
awesome-antigravity-pet/
├── antigravity_pet/             # 桌面端核心源码
│   ├── engine/                  # 精灵图解码 (spritesheet.py)、有限状态机 (fsm.py)、宠物目录索引 (catalog.py)
│   ├── ipc/                     # 本地 Socket/UDP 监听服务 (server.py)
│   ├── ui/                      # PyQt6 透明窗口 (window.py)、动态气泡 (bubble.py)
│   ├── utils/                   # Hook 自动安装器、单实例互斥锁、系统通知
│   └── cli.py                   # 命令行入口 (start, list, switch, install-hooks)
├── pets/                        # 宠物素材包 (190+ 款角色)
│   └── <pet-slug>--<author-slug>/
│       ├── submission.json
│       ├── pet.json
│       └── spritesheet.webp
├── tests/                       # Python 单元测试 (test_engine.py)
├── examples/                    # 示例与物理引擎仿真
├── pyproject.toml               # Python 项目标准打包配置
└── requirements.txt             # 依赖声明 (PyQt6, Pillow)
```

## 3. 宠物资产规范

每个 pet 目录保留标准三文件：

```text
pets/<pet-slug>--<author-slug>/
├── submission.json
├── pet.json
└── spritesheet.webp
```

- v1 图集：`8x9`，`1536x1872`
- v2 图集：`8x11`，`1536x2288`（支持 16 个环视方向，`spriteVersionNumber: 2`）

## 4. 自动化测试与质量标准

在提交任何客户端或引擎改动前，必须运行测试：

```bash
python -m unittest tests/test_engine.py
```

确保：
1. `PetCatalog` 正常扫描所有宠物元数据；
2. `SpriteSheet` 精灵图切帧与帧率计算正常；
3. `MainWindow` 窗口在透明背景下无异常崩溃；
4. IPC 端口通信与单实例锁正常工作。

