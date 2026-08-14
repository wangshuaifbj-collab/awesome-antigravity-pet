# -*- coding: utf-8 -*-
"""
Speech bubble renderer for Antigravity Desktop Pet.
Renders above the pet's head without obstructing facial features.
"""

from PyQt6.QtCore import Qt, QRectF, QPointF
from PyQt6.QtGui import QPainter, QBrush, QPen, QPainterPath, QColor, QFont, QFontMetrics


class SpeechBubble:
    """Renders a floating cartoon speech bubble with smooth fade-out."""

    def __init__(self):
        self.text: str = ""
        self.alpha: float = 0.0
        self.target_alpha: float = 0.0
        self.display_frames_left: int = 0
        self.fade_speed: float = 0.12

    @property
    def is_visible(self) -> bool:
        return self.alpha > 0.05

    def show(self, text: str, duration_ms: int = 2500, fps: int = 30) -> None:
        self.text = text
        self.display_frames_left = max(10, int((duration_ms / 1000.0) * fps))
        self.target_alpha = 1.0

    def hide(self) -> None:
        self.target_alpha = 0.0
        self.display_frames_left = 0
        self.alpha = 0.0
        self.text = ""

    def update(self) -> None:
        if self.display_frames_left > 0:
            self.display_frames_left -= 1
            if self.display_frames_left <= 0:
                self.target_alpha = 0.0

        # Smooth alpha lerp
        self.alpha += (self.target_alpha - self.alpha) * self.fade_speed
        if self.alpha <= 0.05:
            self.alpha = 0.0
            self.text = ""

    def draw(self, painter: QPainter, target_x: float, target_y: float) -> None:
        if not self.is_visible or not self.text or self.alpha <= 0.05:
            return

        painter.save()
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        # 全局图层级透明度，确保 Windows DirectWrite 颜色 Emoji 与文本完全同步淡出
        painter.setOpacity(max(0.0, min(1.0, self.alpha)))

        font = QFont("Microsoft YaHei", 9, QFont.Weight.Bold)
        painter.setFont(font)
        fm = QFontMetrics(font)

        text_w = fm.horizontalAdvance(self.text)
        text_h = fm.height()

        padding_x = 12.0
        padding_y = 6.0
        box_w = max(60.0, text_w + padding_x * 2.0)
        box_h = text_h + padding_y * 2.0

        bx = target_x - box_w / 2.0
        by = target_y - box_h - 6.0

        # Bubble shape with downward pointing tail
        path = QPainterPath()
        path.addRoundedRect(QRectF(bx, by, box_w, box_h), 10.0, 10.0)

        tail_cx = target_x
        tail = QPainterPath()
        tail.moveTo(tail_cx - 5.0, by + box_h)
        tail.lineTo(tail_cx, by + box_h + 6.0)
        tail.lineTo(tail_cx + 5.0, by + box_h)
        tail.closeSubpath()
        path = path.united(tail)

        # Shadow
        painter.setBrush(QBrush(QColor(0, 0, 0, 30)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawPath(path.translated(0, 2))

        # Bubble Background & Border
        painter.setBrush(QBrush(QColor(255, 255, 255, 245)))
        painter.setPen(QPen(QColor(79, 70, 229, 255), 1.5))
        painter.drawPath(path)

        # Text (with color emoji)
        painter.setPen(QPen(QColor(30, 41, 59, 255)))
        painter.drawText(
            QRectF(bx, by, box_w, box_h),
            Qt.AlignmentFlag.AlignCenter,
            self.text,
        )

        painter.restore()
