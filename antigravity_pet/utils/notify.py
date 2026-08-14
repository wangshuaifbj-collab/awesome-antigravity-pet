# -*- coding: utf-8 -*-
"""
Lightweight, zero-quote CLI notify sender for Antigravity Hooks.
Compatible with Windows cmd.exe / PowerShell execution without JSON escaping issues.
Usage:
    python -m antigravity_pet.utils.notify done
    python -m antigravity_pet.utils.notify think
    python -m antigravity_pet.utils.notify code
"""

import sys
import socket
import json

PORT = 18999

ACTION_MAP = {
    "done": {
        "status": "CELEBRATE",
        "message": "✨ 任务已完成！请查收~ 🚀",
        "duration_ms": 2500,
    },
    "celebrate": {
        "status": "CELEBRATE",
        "message": "太棒了！交付完成！🎉",
        "duration_ms": 2500,
    },
    "think": {
        "status": "THINKING",
        "message": "构思中... 💡",
        "duration_ms": 2000,
    },
    "code": {
        "status": "CODING",
        "message": "代码编写中... 💻",
        "duration_ms": 2000,
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


def main():
    target = sys.argv[1].lower() if len(sys.argv) > 1 else "done"
    payload_info = ACTION_MAP.get(target, ACTION_MAP["done"])
    
    # Custom message if provided as second argument
    if len(sys.argv) > 2:
        payload_info["message"] = " ".join(sys.argv[2:])

    try:
        data = json.dumps(payload_info, ensure_ascii=False).encode("utf-8")
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(data, ("127.0.0.1", PORT))
        sock.close()
    except Exception:
        pass


if __name__ == "__main__":
    main()
