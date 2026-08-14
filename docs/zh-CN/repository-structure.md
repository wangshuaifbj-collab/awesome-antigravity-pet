# 仓库结构

简体中文 | [English](../en/repository-structure.md)

这个仓库会把可安装的 pet 资源和仓库侧元数据分开。

## 为什么这样做

Codex 运行时需要的包很小：

- `pet.json`
- `spritesheet.webp`

但一个社区精选仓库还需要更多上下文：

- 作者和许可证信息
- 分类和来源信息
- 自动生成的预览材料

## 标准 pet 目录

```text
pets/
└── pet-slug--author-slug/
    ├── submission.json
    ├── pet.json
    ├── spritesheet.webp
```

快速安装只需要这些文件：

```text
pets/
└── pet-slug--author-slug/
    ├── pet.json
    └── spritesheet.webp
```

## 文件角色

- `submission.json`：仓库收录和展示用元数据
- `pet.json`：Codex 运行时使用的元数据
- `spritesheet.webp`：可安装的 spritesheet
- `install-manifest.json`：远程安装器使用的自动生成大小与 SHA-256 清单
- `assets/previews/<pet-id>/`：自动生成的联系表和动作 GIF 预览

pet 目录里不应该包含自动生成的预览图、QA 输出、参考图或 README 文件。

## 运行时版本

- v1 使用 `1536x1872` 的 8 × 9 图集，`spriteVersionNumber` 可以省略或设为 `1`。
- v2 使用 `1536x2288` 的 8 × 11 图集，`pet.json` 必须包含 `"spriteVersionNumber": 2`。
- 安装器会原样复制两种格式；预览和校验脚本会根据 `spriteVersionNumber` 判断应有的行数。

## 目录命名

使用这个格式：

```text
pet-slug--author-slug
```

示例：

- `mikoto--lingxiaotian`
- `desire-engine--alice`
- `desire-engine--bob`

目录名、`submission.json` 里的 `slug`、`pet.json` 里的 `id` 应保持一致。这样同一个角色的不同作者版本可以并存，也方便审核和安装。

## 快速安装器

仓库提供了一个小的 Node.js 安装器：

```bash
npm run install:pet -- pet-slug--author-slug
```

它会把 `pet.json` 和 `spritesheet.webp` 复制到：

```text
~/.codex/pets/<pet-id>/
```

默认安装位置：

- macOS/Linux：`~/.codex/pets/<pet-id>/`
- Windows：`%USERPROFILE%\.codex\pets\<pet-id>\`

如果要安装到其他 Codex 目录，可以使用 `CODEX_HOME` 或 `--codex-home`。

远程 Bash 和 PowerShell 安装器只下载选中的宠物，会校验生成的
`install-manifest.json` 与 SHA-256，拒绝符号链接目标，并在校验完成后原子切换。
替换已有宠物时需要显式添加 `--force`（PowerShell 使用 `-Force`）。Node.js 包已按
轻量下载器准备好，发布到 npm 后使用 `npx` 时应固定版本，不要无条件解析最新版本。
