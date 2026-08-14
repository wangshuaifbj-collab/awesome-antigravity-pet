# -*- coding: utf-8 -*-
"""
Pet Catalog and Metadata Scanner.
Discovers, indexes and categorizes all 193+ Codex SpriteSheet pet packages.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional

PETS_DIR = Path(__file__).resolve().parent.parent.parent / "pets"

FEATURED_PETS = [
    "firefly--lingxiaotian",      # 流萤 (崩铁)
    "acheron--lingxiaotian",      # 黄泉 (崩铁)
    "arlecchino--lingxiaotian",   # 仆人 (原神)
    "black-swan--lingxiaotian",   # 黑天鹅 (崩铁)
    "furina--lingxiaotian",       # 芙宁娜 (原神)
    "frieren--lingxiaotian",      # 芙莉莲 (葬送的芙莉莲)
    "sparkle--lingxiaotian",      # 花火 (崩铁)
    "klee--chenxin-dlut",         # 可莉 (原神)
    "nahida--lingxiaotian",       # 纳西妲 (原神)
    "paimon--lingxiaotian",       # 派蒙 (原神)
    "raiden-shogun--lingxiaotian",# 雷电将军 (原神)
    "doro--lingxiaotian",         # Doro (桃乐丝)
    "bocchi--lingxiaotian",       # 后藤一里 (孤独摇滚)
    "anya--chenxin-dlut",         # 阿尼亚 (间谍过家家)
]


class PetInfo:
    """Represents a discovered pet package."""

    def __init__(self, pet_id: str, display_name: str, description: str, folder_path: Path):
        self.id = pet_id
        self.display_name = display_name
        self.description = description
        self.folder_path = folder_path
        self.spritesheet_path = folder_path / "spritesheet.webp"

    @property
    def is_valid(self) -> bool:
        return self.spritesheet_path.exists()

    def __repr__(self) -> str:
        return f"<PetInfo {self.id}: {self.display_name}>"


class PetCatalog:
    """Indexes and manages all installed pets in the repository."""

    def __init__(self, pets_dir: Path = PETS_DIR):
        self.pets_dir = Path(pets_dir)
        self.pets: Dict[str, PetInfo] = {}
        self.scan()

    def scan(self) -> None:
        """Scan pets directory and populate catalog."""
        self.pets.clear()
        if not self.pets_dir.exists():
            return

        for pet_folder in self.pets_dir.iterdir():
            if pet_folder.is_dir():
                json_path = pet_folder / "pet.json"
                if json_path.exists():
                    try:
                        with open(json_path, "r", encoding="utf-8") as f:
                            data = json.load(f)
                            pid = data.get("id", pet_folder.name)
                            name = data.get("displayName", pet_folder.name)
                            desc = data.get("description", "")
                            pinfo = PetInfo(pid, name, desc, pet_folder)
                            if pinfo.is_valid:
                                self.pets[pid] = pinfo
                    except Exception:
                        pass

    def get(self, pet_id: str) -> Optional[PetInfo]:
        return self.pets.get(pet_id)

    def list_all(self) -> List[PetInfo]:
        return list(self.pets.values())

    def get_featured(self) -> List[PetInfo]:
        result = []
        for pid in FEATURED_PETS:
            if pid in self.pets:
                result.append(self.pets[pid])
        # Add remaining up to 10 if not present
        for pid, p in self.pets.items():
            if len(result) >= 15:
                break
            if p not in result:
                result.append(p)
        return result

    def get_display_name(self, pet_id: str) -> str:
        p = self.get(pet_id)
        return p.display_name if p else pet_id
