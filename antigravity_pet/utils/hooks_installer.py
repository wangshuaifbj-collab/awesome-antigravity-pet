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
    """Injects or merges hooks configuration into target hooks.json."""
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

        if "hooks" not in existing_data:
            existing_data["hooks"] = {}

        # 仅在 Stop（输出完成）时触发欢庆提示
        existing_data["hooks"]["Stop"] = [
            {
                "command": DEFAULT_HOOK_COMMAND,
                "description": "Notify Antigravity desktop pet when agent completes a turn"
            }
        ]

        with open(hooks_file, "w", encoding="utf-8") as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)

        return True, f"Successfully configured hooks in {hooks_file}"
    except Exception as e:
        return False, f"Failed to install hooks: {e}"
