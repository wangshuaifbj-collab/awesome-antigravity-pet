# Contributing to Awesome Antigravity Pet

欢迎为 **Awesome Antigravity Pet** 贡献代码与宠物素材！

## 🛠️ 代码与引擎贡献 (Engine & UI)

1. **环境准备**：
   ```bash
   git clone https://github.com/wangshuaifbj-collab/awesome-antigravity-pet.git
   cd awesome-antigravity-pet
   pip install -e .
   ```
2. **运行测试**：
   在提交任何客户端、状态机或物理引擎改动前，请务必运行测试套件：
   ```bash
   python -m unittest tests/test_engine.py
   ```
3. **编码规范**：
   - 遵循 PEP 8 代码风格；
   - 保证 PyQt6 渲染性能与跨平台透明无黑边特性；
   - 新增功能需注意对主 UI 线程的无阻塞性（网络、音效与大 IO 异步化）。

---

## 🎨 宠物素材贡献 (Pet Assets)

每个宠物素材包放置于 `pets/<pet-slug>--<author-slug>/` 目录下，仅包含标准三文件：

```text
pets/<pet-slug>--<author-slug>/
├── submission.json
├── pet.json
└── spritesheet.webp
```

### 规范要求：
- **目录命名**：固定为 `<pet-slug>--<author-slug>`，小写字母、数字与连字符；
- **pet.json**：`id` 必须与文件夹名称完全一致，`spritesheetPath` 固定为 `spritesheet.webp`；
- **图集尺寸**：
  - v1 图集：`8x9` 网格，分辨率 `1536x1872`；
  - v2 图集：`8x11` 网格，分辨率 `1536x2288`（包含 16 个环视方向，需声明 `"spriteVersionNumber": 2`）；
- **透明通道**：必须为高质量透明背景 WebP，无杂色溢出与毛边；
- **授权协议**：素材遵循 [CC BY-NC 4.0](./ASSETS-LICENSE.md) 协议，仅限非商业交流使用。

