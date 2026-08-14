# -*- coding: utf-8 -*-
"""
Windows Named Mutex Single-Instance Guard.
Guarantees strictly ONE instance of Antigravity Desktop Pet running across the entire system.
Zero race conditions, microsecond response time.
"""

import sys
import socket
import ctypes

MUTEX_NAME = "Global\\AntigravityPet_SingleInstance_Mutex_v2"
SINGLETON_PORT = 18998
ERROR_ALREADY_EXISTS = 183


class SingleInstanceGuard:
    """System-wide single instance guard (Windows Named Mutex, Unix Local Socket)."""

    def __init__(self, name: str = MUTEX_NAME):
        self.mutex_name = name
        self.handle = None
        self.sock = None
        self.already_exists = False

        if sys.platform == "win32":
            kernel32 = ctypes.windll.kernel32
            # Create or open named mutex
            self.handle = kernel32.CreateMutexW(None, True, self.mutex_name)
            last_error = kernel32.GetLastError()
            if last_error == ERROR_ALREADY_EXISTS:
                self.already_exists = True
        else:
            # macOS / Linux singleton lock via exclusive loopback socket
            try:
                self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self.sock.bind(("127.0.0.1", SINGLETON_PORT))
                self.sock.listen(1)
            except (socket.error, OSError):
                self.already_exists = True

    def is_already_running(self) -> bool:
        return self.already_exists

    def release(self) -> None:
        if sys.platform == "win32" and self.handle:
            ctypes.windll.kernel32.CloseHandle(self.handle)
            self.handle = None
        elif self.sock:
            try:
                self.sock.close()
            except Exception:
                pass
            self.sock = None


def is_pet_instance_running(name: str = MUTEX_NAME) -> bool:
    """Fast check if an active pet instance is already running."""
    if sys.platform == "win32":
        kernel32 = ctypes.windll.kernel32
        SYNCHRONIZE = 0x00100000
        h = kernel32.OpenMutexW(SYNCHRONIZE, False, name)
        if h:
            kernel32.CloseHandle(h)
            return True
        return False
    else:
        # macOS / Linux: Try connecting to the singleton port
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.1)
            s.connect(("127.0.0.1", SINGLETON_PORT))
            s.close()
            return True
        except (socket.error, OSError):
            return False
