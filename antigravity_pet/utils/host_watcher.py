# -*- coding: utf-8 -*-
"""
Lightweight Host Process Watcher.
Monitors whether Antigravity is running using native Windows Win32 API (zero external deps, 0% CPU).
If Antigravity exits, automatically triggers pet graceful shutdown.
"""

import sys
import ctypes
import subprocess
from ctypes import wintypes


def is_antigravity_active() -> bool:
    """Returns True if at least one Antigravity process is running."""
    if sys.platform != "win32":
        try:
            res = subprocess.run(["pgrep", "-i", "antigravity"], capture_output=True)
            return res.returncode == 0
        except Exception:
            return True

    TH32CS_SNAPPROCESS = 0x00000002

    class PROCESSENTRY32(ctypes.Structure):
        _fields_ = [
            ("dwSize", wintypes.DWORD),
            ("cntUsage", wintypes.DWORD),
            ("th32ProcessID", wintypes.DWORD),
            ("th32DefaultHeapID", ctypes.c_size_t),
            ("th32ModuleID", wintypes.DWORD),
            ("cntThreads", wintypes.DWORD),
            ("th32ParentProcessID", wintypes.DWORD),
            ("pcPriClassBase", ctypes.c_long),
            ("dwFlags", wintypes.DWORD),
            ("szExeFile", ctypes.c_char * 260),
        ]

    kernel32 = ctypes.windll.kernel32
    h_snapshot = kernel32.CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0)
    if h_snapshot == -1 or h_snapshot == 0xFFFFFFFF:
        return True

    entry = PROCESSENTRY32()
    entry.dwSize = ctypes.sizeof(PROCESSENTRY32)

    found = False
    try:
        if kernel32.Process32First(h_snapshot, ctypes.byref(entry)):
            while True:
                exe_name = entry.szExeFile.decode("utf-8", errors="ignore").lower()
                if "antigravity" in exe_name:
                    found = True
                    break
                if not kernel32.Process32Next(h_snapshot, ctypes.byref(entry)):
                    break
    finally:
        kernel32.CloseHandle(h_snapshot)

    return found
