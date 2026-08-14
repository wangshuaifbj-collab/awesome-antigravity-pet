# -*- coding: utf-8 -*-
"""
Command Line Interface (CLI) for Antigravity Desktop Pet.
Entry point for CLI commands: start, list, switch, install-hooks, send-signal.
"""

import os
import sys
import argparse
from pathlib import Path

# Safe stdout/stderr for pythonw (headless/detached background execution)
if sys.stdout is None:
    sys.stdout = open(os.devnull, "w", encoding="utf-8")
if sys.stderr is None:
    sys.stderr = open(os.devnull, "w", encoding="utf-8")

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from PyQt6.QtWidgets import QApplication

from antigravity_pet import __version__
from antigravity_pet.config import ConfigManager
from antigravity_pet.engine.catalog import PetCatalog
from antigravity_pet.ipc.server import send_ipc_message
from antigravity_pet.utils.hooks_installer import (
    install_hooks,
    get_global_hooks_dir,
    get_workspace_hooks_dir,
)


def cmd_start(args: argparse.Namespace) -> None:
    """Launches the desktop pet window."""
    from antigravity_pet.utils.single_instance import SingleInstanceGuard
    
    # 系统级全局互斥单例锁：若已有宠物运行，直接退出，严格保证桌面仅有 1 只宠物
    guard = SingleInstanceGuard()
    if guard.is_already_running():
        return

    from antigravity_pet.ui.window import MainWindow

    config = ConfigManager()
    if getattr(args, "pet", None):
        config.set("pet_id", args.pet)
    if getattr(args, "port", None):
        config.set("port", args.port)
    if getattr(args, "size", None):
        config.set("window_size", args.size)

    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)

    window = MainWindow(config)
    window.show()

    catalog = PetCatalog()
    pname = catalog.get_display_name(config.pet_id)
    try:
        print(f"🚀 Antigravity Desktop Pet v{__version__} running!")
        print(f"🐾 当前出战宠物: {pname} ({config.pet_id})")
        print(f"📡 监听端口: 127.0.0.1:{config.port}")
    except Exception:
        pass

    sys.exit(app.exec())


def cmd_list(args: argparse.Namespace) -> None:
    """Lists all available pets in the repository."""
    catalog = PetCatalog()
    pets = catalog.list_all()
    print(f"\n🐾 Antigravity 宠物图鉴 (共发现 {len(pets)} 款专属宠物):\n")
    print(f"{'序号':<6} {'宠物 ID':<35} {'展示名称':<15} {'说明'}")
    print("-" * 80)
    for idx, p in enumerate(sorted(pets, key=lambda x: x.id), 1):
        desc = p.description[:30] + "..." if len(p.description) > 30 else p.description
        print(f"{idx:<6} {p.id:<35} {p.display_name:<15} {desc}")
    print("\n💡 启动任意宠物命令: python -m antigravity_pet start --pet <pet-id>\n")


def cmd_switch(args: argparse.Namespace) -> None:
    """Hot-switches the active pet on the running desktop window."""
    config = ConfigManager()
    pet_id = args.pet_id
    catalog = PetCatalog()
    p = catalog.get(pet_id)
    if not p:
        print(f"❌ 未找到宠物: {pet_id}")
        return

    config.set("pet_id", pet_id)
    # Send IPC message to trigger switch toast
    send_ipc_message("IDLE", f"已换装为: {p.display_name} 💖", duration_ms=2000, port=config.port)
    print(f"✅ 已将默认宠物切换为: {p.display_name} ({pet_id})")


def cmd_install_hooks(args: argparse.Namespace) -> None:
    """Installs Antigravity hooks."""
    global_dir = get_global_hooks_dir()
    ok1, msg1 = install_hooks(global_dir)
    print(f"Global hooks: {msg1}")

    ws_dir = get_workspace_hooks_dir(Path.cwd())
    ok2, msg2 = install_hooks(ws_dir)
    print(f"Workspace hooks: {msg2}")


def cmd_send_signal(args: argparse.Namespace) -> None:
    """Sends a test signal to the pet window."""
    config = ConfigManager()
    ok = send_ipc_message(
        status=args.status,
        message=args.message or "",
        duration_ms=args.duration,
        port=config.port
    )
    if ok:
        print(f"✅ Signal [{args.status}] sent successfully to port {config.port}")
    else:
        print(f"❌ Failed to send signal")


def cmd_autostart(args: argparse.Namespace) -> None:
    """Configures Windows autostart at user login."""
    if sys.platform != "win32":
        print("Autostart is currently only supported on Windows.")
        return
    import winreg
    key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    app_name = "AntigravityPet"
    vbs_path = Path(__file__).resolve().parent.parent / "双击启动宠物.vbs"
    cmd_str = f'wscript.exe "{vbs_path}"'

    try:
        key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_ALL_ACCESS)
        if args.action == "enable":
            winreg.SetValueEx(key, app_name, 0, winreg.REG_SZ, cmd_str)
            print("✅ 成功开启开机自启！每次开机后小宠物将自动常驻桌面。")
        elif args.action == "disable":
            try:
                winreg.DeleteValue(key, app_name)
                print("❌ 已关闭开机自启。")
            except FileNotFoundError:
                print("ℹ️ 当前未开启开机自启。")
        elif args.action == "status":
            try:
                val, _ = winreg.QueryValueEx(key, app_name)
                print(f"✅ 当前已开启开机自启: {val}")
            except FileNotFoundError:
                print("ℹ️ 当前未开启开机自启。")
        winreg.CloseKey(key)
    except Exception as e:
        print(f"[Error configuring autostart]: {e}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="antigravity-pet",
        description="Antigravity Desktop Pet Companion - 193+ Animated Characters",
    )
    parser.add_argument("-v", "--version", action="version", version=f"%(prog)s {__version__}")

    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # start
    p_start = subparsers.add_parser("start", help="Start the desktop pet window")
    p_start.add_argument("--pet", "-p", help="Pet ID to launch (e.g. firefly--lingxiaotian)")
    p_start.add_argument("--port", type=int, help="UDP IPC Port (default: 18999)")
    p_start.add_argument("--size", type=int, help="Window size in pixels")
    p_start.set_defaults(func=cmd_start)

    # list
    p_list = subparsers.add_parser("list", help="List all 193+ available pets in catalog")
    p_list.set_defaults(func=cmd_list)

    # switch
    p_switch = subparsers.add_parser("switch", help="Switch pet character")
    p_switch.add_argument("pet_id", help="Target pet ID")
    p_switch.set_defaults(func=cmd_switch)

    # autostart
    p_auto = subparsers.add_parser("autostart", help="Configure Windows startup launch")
    p_auto.add_argument("action", choices=["enable", "disable", "status"], default="status", nargs="?", help="Action: enable, disable, status")
    p_auto.set_defaults(func=cmd_autostart)

    # install-hooks
    p_hooks = subparsers.add_parser("install-hooks", help="Install Antigravity lifecycle hooks")
    p_hooks.set_defaults(func=cmd_install_hooks)

    # send-signal
    p_signal = subparsers.add_parser("send-signal", help="Send test UDP event to running pet")
    p_signal.add_argument("status", help="Status: IDLE, WAVING, THINKING, CODING, CELEBRATE, FAILED")
    p_signal.add_argument("--message", "-m", help="Bubble speech text")
    p_signal.add_argument("--duration", "-d", type=int, default=2500, help="Duration in ms")
    p_signal.set_defaults(func=cmd_send_signal)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if hasattr(args, "func"):
        args.func(args)
    else:
        # Default action: start pet
        cmd_start(argparse.Namespace(pet=None, port=None, size=None))


if __name__ == "__main__":
    main()
