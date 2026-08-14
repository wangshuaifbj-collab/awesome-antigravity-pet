# -*- coding: utf-8 -*-
"""
Command Line Interface (CLI) for Antigravity Desktop Pet.
Entry point for CLI commands: start, list, switch, install-hooks, send-signal.
"""

import os
import sys
import argparse
from typing import Optional
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
    
    # 系统级全局互斥单例锁：若已有宠物在运行，直接退出，绝不多开
    guard = SingleInstanceGuard()
    if guard.is_already_running():
        return

    from antigravity_pet.ui.window import MainWindow

    config = ConfigManager()
    config.set("enabled", True)  # 主动启动时自动重置为启用状态
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


def cmd_enable(args: argparse.Namespace) -> None:
    """Enables desktop pet companion and launches it."""
    config = ConfigManager()
    config.set("enabled", True)
    print("✅ 桌面宠物已启用！正在唤醒伴侣...")
    cmd_start(args)


def cmd_disable(args: argparse.Namespace) -> None:
    """Disables desktop pet companion and cleanly terminates running instance."""
    config = ConfigManager()
    config.set("enabled", False)
    if sys.platform == "win32":
        import subprocess
        subprocess.run(["powershell", "-Command", "Stop-Process -Name pythonw -Force -ErrorAction SilentlyContinue"], capture_output=True)
    print("❌ 桌面宠物已停用并退出。后续在 Antigravity 交互时将不会自动拉起，直到再次运行 'pet enable' 或双击启动。")


def cmd_autostart(args: argparse.Namespace) -> None:
    """Configures Windows autostart at user login."""
    if sys.platform != "win32":
        print("Autostart is currently only supported on Windows.")
        return
    import winreg
    key_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
    app_name = "AntigravityPet"
    vbs_path = Path(__file__).resolve().parent.parent / "start-pet.vbs"
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

    # enable
    p_enable = subparsers.add_parser("enable", help="Enable pet auto-launch and start companion")
    p_enable.add_argument("--pet", "-p", help="Pet ID to launch")
    p_enable.set_defaults(func=cmd_enable)

    # disable
    p_disable = subparsers.add_parser("disable", help="Disable pet auto-launch and exit companion")
    p_disable.set_defaults(func=cmd_disable)

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


def find_matching_pet(query: str) -> Optional[str]:
    """Finds the best matching pet ID for a given query (ID, slug, English or Chinese name)."""
    catalog = PetCatalog()
    q = query.strip().lower()
    
    # 1. Exact ID
    if catalog.get(query):
        return query
    
    # 2. Slug match (e.g. 'acheron' -> 'acheron--lingxiaotian')
    for pid in catalog.pets:
        slug = pid.split("--")[0].lower()
        if slug == q or pid.lower() == q:
            return pid

    # 3. Exact name match (e.g. '黄泉', '流萤', 'Furina')
    for pid, p in catalog.pets.items():
        if (p.name_zh and p.name_zh.lower() == q) or (p.name_en and p.name_en.lower() == q) or p.display_name.lower() == q:
            return pid

    # 4. Substring match
    for pid, p in catalog.pets.items():
        if q in pid.lower() or (p.name_zh and q in p.name_zh.lower()) or (p.name_en and q in p.name_en.lower()):
            return pid

    return None


def main() -> None:
    # 智能快捷角色直启/热切换支持 (例如: pet acheron, pet furina, pet 黄泉)
    if len(sys.argv) == 2 and not sys.argv[1].startswith("-"):
        candidate = sys.argv[1].lower()
        known_subcommands = {"start", "list", "switch", "enable", "disable", "autostart", "install-hooks", "send-signal"}
        if candidate not in known_subcommands:
            matched_id = find_matching_pet(candidate)
            if matched_id:
                from antigravity_pet.utils.single_instance import is_pet_instance_running
                config = ConfigManager()
                config.set("pet_id", matched_id)
                config.set("enabled", True)
                
                if is_pet_instance_running():
                    # 宠物已在运行 -> 实时热换装
                    catalog = PetCatalog()
                    pname = catalog.get_display_name(matched_id)
                    send_ipc_message("IDLE", f"已换装为: {pname} 💖", duration_ms=2200, port=config.port)
                    print(f"✨ 已为运行中的桌面宠物实时换装: {pname} ({matched_id})")
                    return
                else:
                    # 宠物未运行 -> 直接以该角色启动
                    cmd_start(argparse.Namespace(pet=matched_id, port=None, size=None))
                    return

    parser = build_parser()
    args = parser.parse_args()

    if hasattr(args, "func"):
        args.func(args)
    else:
        # Default action: start pet
        cmd_start(argparse.Namespace(pet=None, port=None, size=None))


if __name__ == "__main__":
    main()
