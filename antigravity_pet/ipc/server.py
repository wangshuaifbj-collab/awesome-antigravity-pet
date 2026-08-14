# -*- coding: utf-8 -*-
"""
Non-blocking UDP IPC Server for Antigravity Desktop Pet.
Listens for status events and broadcast signals from Antigravity Agent Lifecycle.
"""

import json
from PyQt6.QtCore import QObject, pyqtSignal
from PyQt6.QtNetwork import QUdpSocket, QHostAddress


class IPCServer(QObject):
    """Listens on local UDP port for agent lifecycle messages."""

    # Emits (status_str, message_str, duration_ms)
    message_received = pyqtSignal(str, str, int)

    def __init__(self, port: int = 18999, parent: QObject = None):
        super().__init__(parent)
        self.port = port
        self.socket = QUdpSocket(self)

    def start(self) -> bool:
        flags = QUdpSocket.BindFlag.ShareAddress | QUdpSocket.BindFlag.ReuseAddressHint
        if self.socket.bind(QHostAddress.SpecialAddress.LocalHost, self.port, flags):
            self.socket.readyRead.connect(self._on_ready_read)
            print(f"[IPC] Listening on 127.0.0.1:{self.port}")
            return True
        else:
            print(f"[IPC Error] Could not bind to 127.0.0.1:{self.port}")
            return False

    def stop(self) -> None:
        self.socket.close()

    def _on_ready_read(self) -> None:
        while self.socket.hasPendingDatagrams():
            datagram = self.socket.receiveDatagram()
            raw_data = bytes(datagram.data()).decode("utf-8", errors="replace")
            try:
                msg_obj = json.loads(raw_data)
                status = msg_obj.get("status", "IDLE")
                text = msg_obj.get("message", "")
                duration_ms = msg_obj.get("duration_ms", 2500)
                self.message_received.emit(status, text, duration_ms)
            except Exception:
                pass


def send_ipc_message(status: str, message: str = "", duration_ms: int = 2500, port: int = 18999) -> bool:
    """Sends a one-shot UDP message to the running desktop pet."""
    import socket
    payload = json.dumps({
        "status": status,
        "message": message,
        "duration_ms": duration_ms,
    }).encode("utf-8")

    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.sendto(payload, ("127.0.0.1", port))
        sock.close()
        return True
    except Exception:
        return False
