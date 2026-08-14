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
from antigravity_pet.i18n import I18n


class MainWindow(QWidget):
    """Transparent frameless desktop pet window with full i18n localization."""

    def __init__(self, config: Optional[ConfigManager] = None):
        super().__init__()
        self.config = config or ConfigManager()
        self.i18n = I18n(self.config.get("language", "auto"))
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

        # 7. Host IDE Lifecycle Watcher (每 2.5 秒检查一次宿主是否存活，宿主退出时宠物自动同步退出)
        self.host_watcher_timer = QTimer(self)
        self.host_watcher_timer.timeout.connect(self._check_host_process)
        self.host_watcher_timer.start(2500)

        # Welcome greeting
        pname = self.catalog.get_display_name(self.current_pet_id, self.i18n.lang)
        self.bubble.show(self.i18n.t("ready", name=pname), duration_ms=2500)

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
            pname = self.catalog.get_display_name(pet_id, self.i18n.lang)
            self.bubble.show(self.i18n.t("switched", name=pname), duration_ms=2200)
            self.update()

    def set_language(self, lang_code: str) -> None:
        self.i18n.set_language(lang_code)
        self.config.set("language", lang_code)
        pname = self.catalog.get_display_name(self.current_pet_id, self.i18n.lang)
        self.bubble.show(self.i18n.t("ready", name=pname), duration_ms=2000)
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

    def _check_host_process(self) -> None:
        """Checks if Antigravity host process is active. If not, cleanly exits."""
        from antigravity_pet.utils.host_watcher import is_antigravity_active
        if not is_antigravity_active():
            self.host_watcher_timer.stop()
            self.bubble.show(self.i18n.t("farewell"), duration_ms=1200)
            # 800ms 后平滑退出 GUI
            QTimer.singleShot(800, QApplication.instance().quit)

    def _handle_ipc_message(self, status: str, msg: str, duration_ms: int) -> None:
        """Receives Agent events from Antigravity."""
        st = status.upper()
        if st == "CELEBRATE" or st == "DONE":
            # 任务交付：欢跃跳跃 3 秒后自动回到待机
            self.set_action(
                PetAction.JUMPING,
                msg=msg or self.i18n.t("task_completed"),
                duration_ms=max(2500, duration_ms),
                auto_decay=True
            )
        elif st == "THINKING":
            # 思考中：持续保持思考动作，直到收到下一步指令或完成
            self.set_action(
                PetAction.WAITING,
                msg=msg or self.i18n.t("thinking"),
                duration_ms=2500,
                auto_decay=False
            )
        elif st == "CODING":
            # 编写代码中：持续保持专注打字审查动作
            self.set_action(
                PetAction.REVIEW,
                msg=msg or self.i18n.t("coding"),
                duration_ms=2500,
                auto_decay=False
            )
        elif st == "FAILED":
            self.set_action(
                PetAction.FAILED,
                msg=msg or self.i18n.t("failed"),
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
            actual_x = cx - scaled_pm.width() / 2.0
            actual_y = self.height() - scaled_pm.height() - 10.0
            painter.drawPixmap(int(actual_x), int(actual_y), scaled_pm)

            # 3. 对话气泡 (向上抬高适度间距，不遮挡发箍与头饰)
            self.bubble.draw(painter=painter, target_x=cx, target_y=actual_y - 2.0)

    # ---------------- Mouse Events ----------------
    def enterEvent(self, event) -> None:
        self.is_hovered = True
        self.set_action(PetAction.WAVING, msg=self.i18n.t("wave_greeting"), duration_ms=1800, auto_decay=True)
        self.update()

    def leaveEvent(self, event) -> None:
        self.is_hovered = False
        self.set_action(PetAction.IDLE, auto_decay=False)
        self.update()

    def mousePressEvent(self, event: QMouseEvent) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self.is_dragging = True
            self.drag_start_pos = event.globalPosition().toPoint() - self.frameGeometry().topLeft()
            self.set_action(PetAction.RUNNING, msg=self.i18n.t("drag_start"), duration_ms=2000, auto_decay=False)
            event.accept()

    def mouseMoveEvent(self, event: QMouseEvent) -> None:
        if self.is_dragging and (event.buttons() & Qt.MouseButton.LeftButton):
            new_pos = event.globalPosition().toPoint() - self.drag_start_pos
            self.move(new_pos)
            event.accept()

    def mouseReleaseEvent(self, event: QMouseEvent) -> None:
        if event.button() == Qt.MouseButton.LeftButton:
            self.is_dragging = False
            self.set_action(PetAction.IDLE, msg=self.i18n.t("drag_end"), duration_ms=1800, auto_decay=True)
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
            feat_menu = menu.addMenu(self.i18n.t("menu_featured"))
            for p in self.catalog.get_featured():
                pname = p.get_name(self.i18n.lang)
                act = QAction(f"{pname} ({p.id.split('--')[0]})", feat_menu)
                act.triggered.connect(lambda checked=False, pid=p.id: self.switch_pet(pid))
                feat_menu.addAction(act)

            # 2. 全量 193 款宠物库 (按首字母分组)
            all_menu = menu.addMenu(self.i18n.t("menu_all"))
            all_pets = sorted(self.catalog.list_all(), key=lambda x: x.id)
            
            groups = {
                "A - E": [p for p in all_pets if p.id[0].upper() in "ABCDE"],
                "F - J": [p for p in all_pets if p.id[0].upper() in "FGHIJ"],
                "K - O": [p for p in all_pets if p.id[0].upper() in "KLMNO"],
                "P - T": [p for p in all_pets if p.id[0].upper() in "PQRST"],
                "U - Z": [p for p in all_pets if p.id[0].upper() in "UVWXYZ"],
            }
            for gname, plist in groups.items():
                if plist:
                    gmenu = all_menu.addMenu(f"{gname} ({len(plist)})")
                    for p in plist:
                        pname = p.get_name(self.i18n.lang)
                        act = QAction(f"{pname} ({p.id.split('--')[0]})", gmenu)
                        act.triggered.connect(lambda checked=False, pid=p.id: self.switch_pet(pid))
                        gmenu.addAction(act)

            menu.addSeparator()

            # 3. 动作演示
            demo_menu = menu.addMenu(self.i18n.t("menu_demos"))
            demos = [
                (self.i18n.t("demo_waving"), PetAction.WAVING, self.i18n.t("demo_msg_waving")),
                (self.i18n.t("demo_jumping"), PetAction.JUMPING, self.i18n.t("demo_msg_jumping")),
                (self.i18n.t("demo_waiting"), PetAction.WAITING, self.i18n.t("demo_msg_waiting")),
                (self.i18n.t("demo_review"), PetAction.REVIEW, self.i18n.t("demo_msg_review")),
                (self.i18n.t("demo_running"), PetAction.RUNNING, self.i18n.t("demo_msg_running")),
                (self.i18n.t("demo_failed"), PetAction.FAILED, self.i18n.t("demo_msg_failed")),
            ]
            for dname, act_type, demo_msg in demos:
                act = QAction(dname, demo_menu)
                act.triggered.connect(lambda checked=False, at=act_type, dm=demo_msg: self.set_action(at, msg=dm, duration_ms=2500, auto_decay=True))
                demo_menu.addAction(act)

            # 4. 语言切换
            lang_menu = menu.addMenu(self.i18n.t("menu_lang"))
            act_zh = QAction("🇨🇳 简体中文", lang_menu)
            act_zh.triggered.connect(lambda: self.set_language("zh"))
            lang_menu.addAction(act_zh)

            act_en = QAction("🇺🇸 English", lang_menu)
            act_en.triggered.connect(lambda: self.set_language("en"))
            lang_menu.addAction(act_en)

            act_auto = QAction("⚙️ 自动检测 (Auto)", lang_menu)
            act_auto.triggered.connect(lambda: self.set_language("auto"))
            lang_menu.addAction(act_auto)

            menu.addSeparator()

            # 5. 专注静止开关
            toggle_text = self.i18n.t("menu_static_toggle_off") if self.config.static_idle else self.i18n.t("menu_static_toggle_on")
            static_act = QAction(toggle_text, menu)
            static_act.triggered.connect(self._toggle_static_mode)
            menu.addAction(static_act)

            menu.addSeparator()

            # 6. 退出
            exit_act = QAction(self.i18n.t("menu_exit"), menu)
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
        msg = self.i18n.t("static_on") if new_val else self.i18n.t("static_off")
        self.bubble.show(msg, duration_ms=2000)
