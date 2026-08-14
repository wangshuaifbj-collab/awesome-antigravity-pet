# -*- coding: utf-8 -*-
"""
Main Transparent Floating Pet Window.
High-DPI Sprite rendering, fluid physics, and rich context menus.
"""

from pathlib import Path
from typing import Optional, Dict
from PyQt6.QtCore import Qt, QPoint, QTimer, QRectF
from PyQt6.QtGui import (
    QPainter,
    QMouseEvent,
    QContextMenuEvent,
    QAction,
    QBrush,
    QColor,
    QPixmap,
)
from PyQt6.QtWidgets import QWidget, QApplication, QMenu, QSystemTrayIcon

from antigravity_pet.config import ConfigManager
from antigravity_pet.engine.catalog import PetCatalog, PetInfo
from antigravity_pet.engine.fsm import PetAction, PetState, STATE_TO_ACTION
from antigravity_pet.engine.spritesheet import SpriteSheet, SpritePlayer
from antigravity_pet.ipc.server import IPCServer
from antigravity_pet.ui.bubble import SpeechBubble


class MainWindow(QWidget):
    """Transparent frameless desktop pet window."""

    def __init__(self, config: Optional[ConfigManager] = None):
        super().__init__()
        self.config = config or ConfigManager()
        self.catalog = PetCatalog()

        # 1. Window setup
        self._init_window_flags()

        # 2. Sprite Engine
        self.current_pet_id = self.config.pet_id
        self._spritesheet_cache: Dict[str, SpriteSheet] = {}
        self.player: Optional[SpritePlayer] = None
        self._load_pet(self.current_pet_id)

        # 3. Bubble
        self.bubble = SpeechBubble()

        # 4. IPC Server
        self.ipc = IPCServer(port=self.config.port, parent=self)
        self.ipc.message_received.connect(self._handle_ipc_message)
        self.ipc.start()

        # 5. Mouse tracking & Interaction State
        self.is_dragging = False
        self.is_hovered = False
        self.drag_start_pos = QPoint()
        self.setMouseTracking(True)

        # 6. Timers
        self.frame_timer = QTimer(self)
        self.frame_timer.timeout.connect(self._on_frame_tick)
        self.frame_timer.start(33)  # ~30 FPS

        # Auto decay timer to return to IDLE
        self.decay_timer = QTimer(self)
        self.decay_timer.setSingleShot(True)
        self.decay_timer.timeout.connect(self._on_decay_timeout)

        # Welcome greeting
        pname = self.catalog.get_display_name(self.current_pet_id)
        self.bubble.show(f"{pname} 已就绪！✨", duration_ms=2500)

    def _init_window_flags(self) -> None:
        flags = (
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.Tool
        )
        if self.config.always_on_top:
            flags |= Qt.WindowType.WindowStaysOnTopHint

        self.setWindowFlags(flags)
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, True)
        self.setAttribute(Qt.WidgetAttribute.WA_NoSystemBackground, True)

        width = 170
        height = 210
        self.resize(width, height)

        screen = QApplication.primaryScreen().geometry()
        self.move(screen.width() - width - 60, screen.height() - height - 80)

    def _load_pet(self, pet_id: str) -> bool:
        """Loads and switches to a specific pet package."""
        pinfo = self.catalog.get(pet_id)
        if not pinfo:
            # Fallback to first available pet if not found
            all_pets = self.catalog.list_all()
            if not all_pets:
                return False
            pinfo = all_pets[0]
            pet_id = pinfo.id

        try:
            if pet_id not in self._spritesheet_cache:
                self._spritesheet_cache[pet_id] = SpriteSheet(pinfo.spritesheet_path)
            
            sheet = self._spritesheet_cache[pet_id]
            self.player = SpritePlayer(sheet)
            self.player.is_static_mode = self.config.static_idle
            self.current_pet_id = pet_id
            self.config.set("pet_id", pet_id)
            return True
        except Exception as e:
            print(f"[Error Loading Pet {pet_id}]: {e}")
            return False

    def switch_pet(self, pet_id: str) -> None:
        """User action to switch pet."""
        if self._load_pet(pet_id):
            pname = self.catalog.get_display_name(pet_id)
            self.bubble.show(f"已切换: {pname} 💖", duration_ms=2200)
            self.update()

    def set_action(self, action: PetAction, msg: Optional[str] = None, duration_ms: int = 2500, auto_decay: bool = True) -> None:
        if self.player:
            self.player.set_action(action)
        if msg:
            self.bubble.show(msg, duration_ms=duration_ms)

        if auto_decay and action != PetAction.IDLE:
            self.decay_timer.start(duration_ms)
        elif action == PetAction.IDLE:
            self.decay_timer.stop()

    def _on_decay_timeout(self) -> None:
        if not self.is_dragging:
            if self.is_hovered:
                self.set_action(PetAction.WAVING, auto_decay=False)
            else:
                self.set_action(PetAction.IDLE, auto_decay=False)
            self.update()

    def _handle_ipc_message(self, status: str, msg: str, duration_ms: int) -> None:
        """Receives Agent events from Antigravity."""
        st = status.upper()
        if st == "CELEBRATE" or st == "DONE":
            self.set_action(
                PetAction.JUMPING,
                msg=msg or "✨ 任务已完成！请查收~ 🚀",
                duration_ms=duration_ms,
                auto_decay=True
            )
        elif st == "THINKING":
            self.set_action(
                PetAction.WAITING,
                msg=msg or "构思最优方案中... 💡",
                duration_ms=duration_ms,
                auto_decay=True
            )
        elif st == "CODING":
            self.set_action(
                PetAction.REVIEW,
                msg=msg or "代码编写中... 💻",
                duration_ms=duration_ms,
                auto_decay=True
            )
        elif st == "FAILED":
            self.set_action(
                PetAction.FAILED,
                msg=msg or "遇到异常... ⚠️",
                duration_ms=duration_ms,
                auto_decay=True
            )
        else:
            if msg:
                self.bubble.show(msg, duration_ms=duration_ms)

    def _on_frame_tick(self) -> None:
        if self.player:
            changed = self.player.update(33, is_hovered=self.is_hovered)
            was_visible = self.bubble.is_visible
            self.bubble.update()
            # 关键：当帧改变、气泡处于可见动画中，或气泡刚刚变为不可见时，强制触发最终擦除刷新
            if changed or self.bubble.is_visible or was_visible:
                self.update()

    # ---------------- Paint Event ----------------
    def paintEvent(self, event) -> None:
        if not self.player:
            return

        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        painter.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)

        cx = self.width() / 2.0
        # Pet size on screen
        draw_w = 120
        draw_h = 130
        draw_x = cx - draw_w / 2.0
        draw_y = self.height() - draw_h - 10.0

        # 1. 地面柔和阴影
        shadow_w = draw_w * 0.55
        painter.setBrush(QBrush(QColor(0, 0, 0, 35)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.drawEllipse(QRectF(cx - shadow_w / 2.0, self.height() - 16.0, shadow_w, 9.0))

        # 2. 绘制当前动画帧 Pixmap
        pixmap = self.player.get_current_pixmap()
        if pixmap:
            scaled_pm = pixmap.scaled(
                draw_w,
                draw_h,
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            # Center horizontally inside draw rect
            actual_x = cx - scaled_pm.width() / 2.0
            actual_y = self.height() - scaled_pm.height() - 10.0
            painter.drawPixmap(int(actual_x), int(actual_y), scaled_pm)

        # 3. 对话气泡 (定位于角色头顶上方 30px，绝不遮挡角色面孔)
        self.bubble.draw(painter=painter, target_x=cx, target_y=35.0)

    # ---------------- Mouse Events ----------------
    def enterEvent(self, event) -> None:
        self.is_hovered = True
        self.set_action(PetAction.WAVING, msg="嗨~ ✨", duration_ms=1800, auto_decay=True)
        self.update()

    def leaveEvent(self, event) -> None:
        self.is_hovered = False
        self.set_action(PetAction.IDLE, auto_decay=False)
        self.update()

    def mousePressEvent(self, event: QMouseEvent) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self.is_dragging = True
            self.drag_start_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            self.set_action(PetAction.RUNNING, msg="起飞咯~ 🐾", duration_ms=2000, auto_decay=False)
            event.accept()

    def mouseMoveEvent(self, event: QMouseEvent) -> None:
        if self.is_dragging and (event.buttons() & Qt.MouseButton.LeftButton):
            new_pos = event.globalPosition().toPoint() - self.drag_start_pos
            self.move(new_pos)
            event.accept()

    def mouseReleaseEvent(self, event: QMouseEvent) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self.is_dragging = False
            self.set_action(PetAction.IDLE, msg="安全着陆！🚀", duration_ms=1800, auto_decay=True)
            event.accept()

    def mouseDoubleClickEvent(self, event: QMouseEvent) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            # 双击切换到下一个精选宠物
            featured = self.catalog.get_featured()
            fids = [p.id for p in featured]
            curr_idx = fids.index(self.current_pet_id) if self.current_pet_id in fids else 0
            next_id = fids[(curr_idx + 1) % len(fids)]
            self.switch_pet(next_id)

    def contextMenuEvent(self, event: QContextMenuEvent) -> None:
        try:
            menu = QMenu(self)

            # 1. 热门精选角色
            feat_menu = menu.addMenu("🌟 精选热门角色")
            for p in self.catalog.get_featured():
                act = QAction(f"{p.display_name} ({p.id.split('--')[0]})", feat_menu)
                act.triggered.connect(lambda checked=False, pid=p.id: self.switch_pet(pid))
                feat_menu.addAction(act)

            # 2. 全量 193 款宠物库 (按首字母分组)
            all_menu = menu.addMenu("📚 全量宠物图鉴 (193款)")
            all_pets = sorted(self.catalog.list_all(), key=lambda x: x.id)
            
            # 分组 A-E, F-J, K-O, P-T, U-Z
            groups = {
                "A - E 角色": [p for p in all_pets if p.id[0].upper() in "ABCDE"],
                "F - J 角色": [p for p in all_pets if p.id[0].upper() in "FGHIJ"],
                "K - O 角色": [p for p in all_pets if p.id[0].upper() in "KLMNO"],
                "P - T 角色": [p for p in all_pets if p.id[0].upper() in "PQRST"],
                "U - Z 角色": [p for p in all_pets if p.id[0].upper() in "UVWXYZ"],
            }
            for gname, plist in groups.items():
                if plist:
                    gmenu = all_menu.addMenu(f"{gname} ({len(plist)})")
                    for p in plist:
                        act = QAction(f"{p.display_name} ({p.id.split('--')[0]})", gmenu)
                        act.triggered.connect(lambda checked=False, pid=p.id: self.switch_pet(pid))
                        gmenu.addAction(act)

            menu.addSeparator()

            # 3. 动作演示
            demo_menu = menu.addMenu("🎬 动作演示")
            demos = [
                ("👋 招手打招呼 (Waving)", PetAction.WAVING, "嗨嗨！我是你的桌面伴侣~ ✨"),
                ("🎉 跳跃欢庆 (Jumping)", PetAction.JUMPING, "太棒了！任务圆满交付！🎊"),
                ("🧠 思考构思 (Waiting)", PetAction.WAITING, "正在探索最优架构... 💡"),
                ("💻 专注审查 (Review)", PetAction.REVIEW, "键盘敲烂，代码飞速成型！💻"),
                ("🏃 奔跑移动 (Running)", PetAction.RUNNING, "快马加鞭赶工中~ 💨"),
                ("⚠️ 异常报错 (Failed)", PetAction.FAILED, "咦？遇到了一点小 Bug 🔧"),
            ]
            for dname, act_type, demo_msg in demos:
                act = QAction(dname, demo_menu)
                act.triggered.connect(lambda checked=False, at=act_type, dm=demo_msg: self.set_action(at, msg=dm, duration_ms=2500, auto_decay=True))
                demo_menu.addAction(act)

            menu.addSeparator()

            # 4. 专注静止开关
            toggle_text = "✨ 切换为动态呼吸待机" if self.config.static_idle else "🤫 切换为专注绝对静止"
            static_act = QAction(toggle_text, menu)
            static_act.triggered.connect(self._toggle_static_mode)
            menu.addAction(static_act)

            menu.addSeparator()

            # 5. 退出
            exit_act = QAction("❌ 退出伴侣", menu)
            exit_act.triggered.connect(QApplication.instance().quit)
            menu.addAction(exit_act)

            menu.exec(event.globalPos())
        except Exception as e:
            print(f"[Error in ContextMenu]: {e}")

    def _toggle_static_mode(self) -> None:
        new_val = not self.config.static_idle
        self.config.set("static_idle", new_val)
        if self.player:
            self.player.is_static_mode = new_val
        msg = "已开启专注静止模式 🤫" if new_val else "已恢复生动微呼吸 ✨"
        self.bubble.show(msg, duration_ms=2000)
