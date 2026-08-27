# -*- coding: utf-8 -*-
from enum import Enum


class PetAction(Enum):
    """Standard Antigravity pet action rows mapped to row indexes."""
    IDLE = "idle"                # Row 0: 待机呼吸
    RUNNING_RIGHT = "running-right"  # Row 1: 向右奔跑
    RUNNING_LEFT = "running-left"    # Row 2: 向左奔跑
    WAVING = "waving"            # Row 3: 挥手打招呼
    JUMPING = "jumping"          # Row 4: 欢庆跳跃
    FAILED = "failed"            # Row 5: 报错/懊恼
    WAITING = "waiting"          # Row 6: 思考构思
    RUNNING = "running"          # Row 7: 原地奔跑
    REVIEW = "review"            # Row 8: 专注编码审查


class PetState(Enum):
    """High-level Antigravity Agent lifecycle states."""
    IDLE = "IDLE"                # 常态待机
    WAVING = "WAVING"            # 鼠标移入/打招呼
    THINKING = "THINKING"        # 思考中 (映射到 WAITING / REVIEW)
    CODING = "CODING"            # 编码中 (映射到 REVIEW)
    CELEBRATE = "CELEBRATE"      # 任务完成 (映射到 JUMPING)
    FAILED = "FAILED"            # 遇到错误 (映射到 FAILED)
    DRAGGING = "DRAGGING"        # 鼠标拖拽 (映射到 RUNNING)


# Map Antigravity high-level states to standard sprite actions
STATE_TO_ACTION = {
    PetState.IDLE: PetAction.IDLE,
    PetState.WAVING: PetAction.WAVING,
    PetState.THINKING: PetAction.WAITING,
    PetState.CODING: PetAction.REVIEW,
    PetState.CELEBRATE: PetAction.JUMPING,
    PetState.FAILED: PetAction.FAILED,
    PetState.DRAGGING: PetAction.RUNNING,
}
