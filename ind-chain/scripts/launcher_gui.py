#!/usr/bin/env python3
"""Standard-Cube integrated launcher — seed/serve/restart/quit without a terminal console."""
from __future__ import annotations

import os
import signal
import subprocess
import sys
import time
import webbrowser
from pathlib import Path

def _alert(message: str) -> None:
    try:
        subprocess.run(
            [
                "/usr/bin/osascript",
                "-e",
                f'display alert "Standard-Cube" message "{message}" as critical',
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except OSError:
        pass


try:
    import tkinter as tk
    from tkinter import font as tkfont
except ImportError:
    _alert("tkinter is required. Install Python 3 with Tcl/Tk, then retry.")
    print("tkinter is required for Standard-Cube launcher", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PORT = 8787
URL = f"http://127.0.0.1:{PORT}/"
CUBE_URL = f"http://127.0.0.1:{PORT}/cube"

BG = "#0b0d10"
PANEL = "#14181e"
STROKE = "#2a313c"
TEXT = "#e8edf4"
MUTED = "#9aa6b5"
ACCENT = "#8be0c0"


class Launcher:
    def __init__(self) -> None:
        self.proc: subprocess.Popen | None = None
        self.root = tk.Tk()
        self.root.title("Standard-Cube")
        self.root.configure(bg=BG)
        self.root.resizable(False, False)
        self.root.protocol("WM_DELETE_WINDOW", self.quit_app)
        self._bring_front()

        title_font = tkfont.Font(family="Palatino", size=18, weight="bold")
        muted_font = tkfont.Font(family="Helvetica", size=11)
        btn_font = tkfont.Font(family="Helvetica", size=12)

        frame = tk.Frame(self.root, bg=BG, padx=20, pady=18)
        frame.pack(fill="both", expand=True)

        tk.Label(frame, text="Standard-Cube", fg=TEXT, bg=BG, font=title_font).pack(anchor="w")
        tk.Label(frame, text="ind-chain", fg=MUTED, bg=BG, font=muted_font).pack(anchor="w", pady=(0, 4))
        tk.Frame(frame, bg=ACCENT, height=1).pack(fill="x", pady=(2, 10))

        self.status = tk.StringVar(value="Stopped")
        tk.Label(frame, textvariable=self.status, fg=MUTED, bg=BG, font=muted_font, justify="left").pack(
            anchor="w", pady=(0, 14)
        )

        self._btn(frame, "Open homepage", btn_font, accent=True, command=self.open_home).pack(fill="x", pady=3)
        self._btn(frame, "Restart", btn_font, command=self.restart).pack(fill="x", pady=3)
        self._btn(frame, "Quit", btn_font, command=self.quit_app).pack(fill="x", pady=3)

        self.root.after(200, self.start_server)

    def _bring_front(self) -> None:
        self.root.deiconify()
        self.root.lift()
        try:
            self.root.attributes("-topmost", True)
            self.root.after(400, lambda: self.root.attributes("-topmost", False))
        except tk.TclError:
            pass
        self.root.focus_force()

    def _btn(self, parent, label, font, command, accent=False):
        return tk.Button(
            parent,
            text=label,
            font=font,
            command=command,
            fg=ACCENT if accent else TEXT,
            bg=PANEL,
            activeforeground=TEXT,
            activebackground=STROKE,
            relief="flat",
            bd=1,
            highlightbackground=STROKE,
            highlightthickness=1,
            padx=10,
            pady=8,
            cursor="hand2",
        )

    def _set_status(self, text: str) -> None:
        self.status.set(text)
        self.root.update_idletasks()

    def _free_port(self) -> None:
        try:
            out = subprocess.check_output(["lsof", "-ti", f":{PORT}"], text=True).strip()
        except subprocess.CalledProcessError:
            return
        for pid in out.split():
            try:
                os.kill(int(pid), signal.SIGTERM)
            except OSError:
                pass
        time.sleep(0.4)

    def _cleanup(self) -> None:
        if self.proc is None:
            return
        if self.proc.poll() is None:
            self.proc.terminate()
            try:
                self.proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                self.proc.kill()
                self.proc.wait(timeout=1)
        self.proc = None

    def start_server(self) -> None:
        self._set_status("Starting…")
        self._cleanup()
        self._free_port()
        try:
            subprocess.check_call([sys.executable, str(ROOT / "scripts" / "seed.py")], cwd=str(ROOT))
            self.proc = subprocess.Popen(
                [sys.executable, str(ROOT / "server" / "app.py")],
                cwd=str(ROOT),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.STDOUT,
            )
            time.sleep(0.6)
            if self.proc.poll() is not None:
                self._set_status("Failed to start server")
                return
            self._set_status(f"Running · pid {self.proc.pid} · {URL}")
        except Exception as exc:  # noqa: BLE001 — show in status line
            self._set_status(f"Error: {exc}")

    def open_home(self) -> None:
        if self.proc is None or self.proc.poll() is not None:
            self.start_server()
        webbrowser.open(URL)

    def restart(self) -> None:
        self._set_status("Restarting…")
        self.start_server()
        if self.proc and self.proc.poll() is None:
            self._set_status(f"Restarted · pid {self.proc.pid} · refresh browser · {CUBE_URL}")

    def quit_app(self) -> None:
        self._set_status("Stopping…")
        self._cleanup()
        self._free_port()
        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    os.chdir(ROOT)
    Launcher().run()


if __name__ == "__main__":
    main()
