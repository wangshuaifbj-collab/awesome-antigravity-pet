# -*- coding: utf-8 -*-
"""
Smart Notify Sender with Auto-Healing Daemon Launcher.
If the desktop pet window is not running when an Antigravity event arrives,
it will automatically spawn it silently in the background!
"""

import sys
import socket
import json
import subprocess
from pathlib import Path

PORT = 18999
REPO_ROOT = Path(__file__).resolve().parent.parent

ACTION_MAP = {
    "done": {
        "status": "CELEBRATE",
        "message": "✨ 任务已完成！请查收~ 🚀",
        "duration_ms": 3000,
    },
    "celebrate": {
        "status": "CELEBRATE",
        "message": "太棒了！交付完成！🎉",
        "duration_ms": 3000,
    },
    "think": {
        "status": "THINKING",
        "message": "构思最优方案中... 💡",
        "duration_ms": 2500,
    },
    "code": {
        "status": "CODING",
        "message": "代码编写中... 💻",
        "duration_ms": 2500,
    },
    "failed": {
        "status": "FAILED",
        "message": "遇到一点小挫折... ⚠️",
        "duration_ms": 2500,
    },
    "idle": {
        "status": "IDLE",
        "message": "",
        "duration_ms": 1000,
    }
}


def is_pet_running() -> bool:
    """Checks if active pet instance is running via system-wide Named Mutex."""
    from antigravity_pet.utils.single_instance import is_pet_instance_running
    return is_pet_instance_running()


def spawn_pet_daemon():
    """Silently spawns the desktop pet process in the background."""
    try:
        # Use pythonw to prevent command prompt window from popping up
        subprocess.Popen(
            [sys.executable.replace("python.exe", "pythonw.exe"), "-m", "antigravity_pet", "start"],
            cwd=str(REPO_ROOT),
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0,
            close_fds=True
        )
    except Exception:
        pass


def main():
    target = sys.argv[1].lower() if len(sys.argv) > 1 else "done"
    payload_info = ACTION_MAP.get(target, ACTION_MAP["done"])
    
    if len(sys.argv) > 2:
        payload_info["message"] = " ".join(sys.argv[2:])

    from antigravity_pet.config import ConfigManager
    config = ConfigManager()
    
    # 若用户主动点击了退出/停用，严格遵守用户意愿，不进行自拉起
    if not config.get("enabled", True):
        return

    # 智能自愈保活：如果当前启用且未运行，自动在后台静默拉起
    if not is_pet_running():
        spawn_pet_daemon()
        import time
        time.sleep(0.3)

    try:
        data = json.dumps(payload_info, ensure_ascii=False).encode("utf-8")
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(data, ("127.0.0.1", PORT))
        sock.close()
    except Exception:
        pass


if __name__ == "__main__":
    main()
