# -*- coding: utf-8 -*-
"""
High-performance Sprite Sheet Slicer and Animation Player.
Native support for 192x208 pixel grid with per-frame microsecond timing.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple
from PIL import Image
from PyQt6.QtGui import QImage, QPixmap
from antigravity_pet.engine.fsm import PetAction

COLUMNS = 8
CELL_WIDTH = 192
CELL_HEIGHT = 208

# Standard row mapping, frame counts, and duration in milliseconds
ACTION_SPECS: Dict[PetAction, Tuple[int, List[int]]] = {
    PetAction.IDLE: (0, [280, 110, 110, 140, 140, 320]),
    PetAction.RUNNING_RIGHT: (1, [120, 120, 120, 120, 120, 120, 120, 220]),
    PetAction.RUNNING_LEFT: (2, [120, 120, 120, 120, 120, 120, 120, 220]),
    PetAction.WAVING: (3, [140, 140, 140, 280]),
    PetAction.JUMPING: (4, [140, 140, 140, 140, 280]),
    PetAction.FAILED: (5, [140, 140, 140, 140, 140, 140, 140, 240]),
    PetAction.WAITING: (6, [150, 150, 150, 150, 150, 260]),
    PetAction.RUNNING: (7, [120, 120, 120, 120, 120, 220]),
    PetAction.REVIEW: (8, [150, 150, 150, 150, 150, 280]),
}


def pil_image_to_qpixmap(pil_img: Image.Image) -> QPixmap:
    """Converts a PIL RGBA Image to a Qt QPixmap."""
    if pil_img.mode != "RGBA":
        pil_img = pil_img.convert("RGBA")
    data = pil_img.tobytes("raw", "RGBA")
    qimg = QImage(data, pil_img.width, pil_img.height, QImage.Format.Format_RGBA8888)
    return QPixmap.fromImage(qimg)


class SpriteSheet:
    """Loads and caches all sliced frame pixmaps for a given pet spritesheet."""

    def __init__(self, spritesheet_path: Path):
        self.path = Path(spritesheet_path)
        self.frames: Dict[PetAction, List[QPixmap]] = {}
        self.durations: Dict[PetAction, List[int]] = {}
        self._load_and_slice()

    def _load_and_slice(self) -> None:
        if not self.path.exists():
            raise FileNotFoundError(f"SpriteSheet not found: {self.path}")

        atlas = Image.open(self.path).convert("RGBA")
        
        for action, (row, durations) in ACTION_SPECS.items():
            action_frames: List[QPixmap] = []
            for col in range(len(durations)):
                # Crop 192x208 frame cell
                box = (
                    col * CELL_WIDTH,
                    row * CELL_HEIGHT,
                    (col + 1) * CELL_WIDTH,
                    (row + 1) * CELL_HEIGHT,
                )
                cell_img = atlas.crop(box)
                action_frames.append(pil_image_to_qpixmap(cell_img))
            
            self.frames[action] = action_frames
            self.durations[action] = durations

    def get_frame(self, action: PetAction, index: int) -> Optional[QPixmap]:
        flist = self.frames.get(action)
        if flist and 0 <= index < len(flist):
            return flist[index]
        return flist[0] if flist else None

    def get_frame_count(self, action: PetAction) -> int:
        return len(self.frames.get(action, []))

    def get_duration(self, action: PetAction, index: int) -> int:
        dlist = self.durations.get(action, [])
        if dlist and 0 <= index < len(dlist):
            return dlist[index]
        return 150


class SpritePlayer:
    """Frame-by-frame animation timer and state controller."""

    def __init__(self, spritesheet: SpriteSheet):
        self.spritesheet = spritesheet
        self.current_action: PetAction = PetAction.IDLE
        self.current_frame_index: int = 0
        self.elapsed_ms: int = 0
        self.is_static_mode: bool = True  # 平时待机静止时锁定第0帧

    def set_action(self, action: PetAction, reset_index: bool = True) -> None:
        if action != self.current_action:
            self.current_action = action
            if reset_index:
                self.current_frame_index = 0
                self.elapsed_ms = 0

    def update(self, delta_ms: int, is_hovered: bool = False) -> bool:
        """
        Advances the animation based on elapsed milliseconds.
        Returns True if the frame changed (triggering repainting).
        """
        # 如果是平时待机且开启了专注静止模式且鼠标没有悬停在上面，保持在第0帧待机
        if self.current_action == PetAction.IDLE and self.is_static_mode and not is_hovered:
            if self.current_frame_index != 0:
                self.current_frame_index = 0
                return True
            return False

        self.elapsed_ms += delta_ms
        target_dur = self.spritesheet.get_duration(self.current_action, self.current_frame_index)

        if self.elapsed_ms >= target_dur:
            self.elapsed_ms -= target_dur
            frame_count = self.spritesheet.get_frame_count(self.current_action)
            if frame_count > 0:
                self.current_frame_index = (self.current_frame_index + 1) % frame_count
                return True

        return False

    def get_current_pixmap(self) -> Optional[QPixmap]:
        return self.spritesheet.get_frame(self.current_action, self.current_frame_index)
