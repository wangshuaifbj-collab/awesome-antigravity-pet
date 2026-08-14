# -*- coding: utf-8 -*-
"""
Configuration management for Antigravity Pet Runtime.
"""

import json
from pathlib import Path
from typing import Any, Dict

CONFIG_DIR = Path.home() / ".gemini"
CONFIG_FILE = CONFIG_DIR / "antigravity_pet.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "enabled": True,      # 用户全局启用开关
    "pet_id": "firefly--lingxiaotian",
    "window_size": 160,
    "always_on_top": True,
    "port": 18999,
    "static_idle": True,  # 平时待机保持优雅静止，鼠标悬停时激活生动动作
    "sound_enabled": False,
}


class ConfigManager:
    """Thread-safe persistent configuration helper."""

    def __init__(self, filepath: Path = CONFIG_FILE):
        self.filepath = filepath
        self._data: Dict[str, Any] = dict(DEFAULT_CONFIG)
        self.load()

    def load(self) -> None:
        if self.filepath.exists():
            try:
                with open(self.filepath, "r", encoding="utf-8") as f:
                    saved = json.load(f)
                    self._data.update(saved)
            except Exception:
                pass

    def save(self) -> None:
        try:
            self.filepath.parent.mkdir(parents=True, exist_ok=True)
            with open(self.filepath, "w", encoding="utf-8") as f:
                json.dump(self._data, f, indent=2, ensure_ascii=False)
        except Exception:
            pass

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        self._data[key] = value
        self.save()

    @property
    def pet_id(self) -> str:
        return str(self.get("pet_id", "firefly--lingxiaotian"))

    @property
    def window_size(self) -> int:
        return int(self.get("window_size", 160))

    @property
    def always_on_top(self) -> bool:
        return bool(self.get("always_on_top", True))

    @property
    def port(self) -> int:
        return int(self.get("port", 18999))

    @property
    def static_idle(self) -> bool:
        return bool(self.get("static_idle", True))
