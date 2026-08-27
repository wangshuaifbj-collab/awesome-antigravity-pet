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
REPO_ROOT = Path(__file__).resolve().parent.parent.parent

ACTION_MAP = {
    "done": {
        "status": "CELEBRATE",
        "message": "",
        "duration_ms": 3000,
    },
    "celebrate": {
        "status": "CELEBRATE",
        "message": "",
        "duration_ms": 3000,
    },
    "think": {
        "status": "THINKING",
        "message": "",
        "duration_ms": 2500,
    },
    "code": {
        "status": "CODING",
        "message": "",
        "duration_ms": 2500,
    },
    "failed": {
        "status": "FAILED",
        "message": "",
        "duration_ms": 3000,
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


def parse_stdin_context(target: str) -> dict:
    """Reads and parses JSON payload sent by Antigravity on stdin without blocking."""
    # 显式调用的命令（如 failed, think, code, done 等）绝不阻塞读取 stdin
    if target not in ("post-tool", "auto-stop"):
        return {}
    try:
        if not sys.stdin.isatty():
            raw = sys.stdin.read().strip()
            if raw:
                return json.loads(raw)
    except Exception:
        pass
    return {}


def main():
    target = sys.argv[1].lower() if len(sys.argv) > 1 else "done"
    context = parse_stdin_context(target)

    # 智能识别错误与中断状态
    has_error = False
    error_msg = ""
    if context:
        if context.get("error"):
            has_error = True
            error_msg = str(context.get("error"))
        elif context.get("terminationReason") in ("error", "failed", "interrupted"):
            has_error = True

    if target == "post-tool":
        if has_error:
            target = "failed"
            payload_info = {
                "status": "FAILED",
                "message": "执行遇到异常报错了... ❌",
                "duration_ms": 3000,
            }
        else:
            # 正常工具执行完成，保持当前状态，输出空 JSON 满足钩子协议
            print("{}")
            return
    elif target in ("done", "celebrate") and has_error:
        target = "failed"
        payload_info = {
            "status": "FAILED",
            "message": "任务遇到异常中断 ⚠️",
            "duration_ms": 3000,
        }
    else:
        payload_info = ACTION_MAP.get(target, ACTION_MAP["done"]).copy()

    # 解析传入的自定义消息与时长
    if len(sys.argv) > 2:
        args = sys.argv[2:]
        duration = None
        if len(args) > 1 and args[-1].isdigit():
            duration = int(args[-1])
            args = args[:-1]
        elif len(args) == 1 and args[0].isdigit():
            duration = int(args[0])
            args = []
        if args:
            payload_info["message"] = " ".join(args)
        if duration is not None:
            payload_info["duration_ms"] = duration

    from antigravity_pet.config import ConfigManager
    config = ConfigManager()
    
    # 若用户主动点击了退出/停用，严格遵守用户意愿，不进行自拉起
    if not config.get("enabled", True):
        print("{}")
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

    # 输出合法 JSON 响应
    print("{}")


if __name__ == "__main__":
    main()

