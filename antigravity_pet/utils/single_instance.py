# -*- coding: utf-8 -*-
"""
Windows Named Mutex Single-Instance Guard.
Guarantees strictly ONE instance of Antigravity Desktop Pet running across the entire system.
Zero race conditions, microsecond response time.
"""

import sys
import ctypes

MUTEX_NAME = "Global\\AntigravityPet_SingleInstance_Mutex_v2"
ERROR_ALREADY_EXISTS = 183


class SingleInstanceGuard:
    """System-wide single instance guard using Windows Named Mutex."""

    def __init__(self, name: str = MUTEX_NAME):
        self.mutex_name = name
        self.handle = None
        self.already_exists = False

        if sys.platform == "win32":
            kernel32 = ctypes.windll.kernel32
            # Create or open named mutex
            self.handle = kernel32.CreateMutexW(None, True, self.mutex_name)
            last_error = kernel32.GetLastError()
            if last_error == ERROR_ALREADY_EXISTS:
                self.already_exists = True

    def is_already_running(self) -> bool:
        return self.already_exists

    def release(self) -> None:
        if sys.platform == "win32" and self.handle:
            ctypes.windll.kernel32.CloseHandle(self.handle)
            self.handle = None


def is_pet_instance_running(name: str = MUTEX_NAME) -> bool:
    """Fast check if an active pet instance is already running."""
    if sys.platform != "win32":
        return False

    kernel32 = ctypes.windll.kernel32
    SYNCHRONIZE = 0x00100000
    h = kernel32.OpenMutexW(SYNCHRONIZE, False, name)
    if h:
        kernel32.CloseHandle(h)
        return True
    return False
