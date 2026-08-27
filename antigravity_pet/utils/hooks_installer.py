# -*- coding: utf-8 -*-
"""
Hooks Installer for Antigravity 2.x.
Injects lifecycle event hooks into ~/.gemini/config/hooks.json and workspace .agents/hooks.json.
"""

import json
from pathlib import Path
from typing import Tuple

DEFAULT_HOOK_COMMAND = "python -m antigravity_pet.utils.notify done"


def get_global_hooks_dir() -> Path:
    return Path.home() / ".gemini" / "config"


def get_workspace_hooks_dir(workspace_root: Path) -> Path:
    return Path(workspace_root) / ".agents"


def install_hooks(target_dir: Path) -> Tuple[bool, str]:
    """Injects or merges hooks configuration into target hooks.json following Antigravity specs."""
    try:
        target_dir.mkdir(parents=True, exist_ok=True)
        hooks_file = target_dir / "hooks.json"

        existing_data = {}
        if hooks_file.exists():
            try:
                with open(hooks_file, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
            except Exception:
                existing_data = {}

        # 采用 Antigravity 官方标准的 Named Hook 结构
        existing_data["antigravity-pet"] = {
            "PreInvocation": [
                {
                    "type": "command",
                    "command": "python -m antigravity_pet.utils.notify think",
                    "description": "Notify Antigravity desktop pet when thinking begins"
                }
            ],
            "PreToolUse": [
                {
                    "matcher": "*",
                    "hooks": [
                        {
                            "type": "command",
                            "command": "python -m antigravity_pet.utils.notify code",
                            "description": "Notify Antigravity desktop pet when executing tools"
                        }
                    ]
                }
            ],
            "PostToolUse": [
                {
                    "matcher": "*",
                    "hooks": [
                        {
                            "type": "command",
                            "command": "python -m antigravity_pet.utils.notify post-tool",
                            "description": "Notify Antigravity desktop pet if tool execution failed"
                        }
                    ]
                }
            ],
            "Stop": [
                {
                    "type": "command",
                    "command": "python -m antigravity_pet.utils.notify done",
                    "description": "Notify Antigravity desktop pet when agent completes a turn"
                }
            ]
        }

        # 清理旧版格式（如果存在顶层 hooks 键）
        if "hooks" in existing_data and "PreInvocation" in existing_data["hooks"]:
            del existing_data["hooks"]

        with open(hooks_file, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)

        return True, f"Successfully configured Antigravity hooks in {hooks_file}"
    except Exception as e:
        return False, f"Failed to install hooks: {e}"
