"""
main_gui.py — Investly Summarizer
واجهة محسّنة مع دعم كامل للغة العربية (RTL) + تبويب التقييم

Design language: "market terminal" — ticker-tape header, monospace
numerics, signal green/red borrowed from price tickers, a single
animated pulse-gauge as the signature moment for evaluation results.
"""

import os
import sys
import math
import threading
import subprocess
import importlib
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR  = os.path.join(ROOT_DIR, "src")
if SRC_DIR not in sys.path:
    sys.path.insert(0, SRC_DIR)

_DEV_MODE = os.environ.get("INVESTLY_DEV", "").lower() in ("1", "true", "yes")

UI_FONT  = "Segoe UI"
MONO_FONT = "Cascadia Mono"   # falls back gracefully on systems without it


# ══════════════════════════════════════════════════════════════
# RTL Widgets
# ══════════════════════════════════════════════════════════════
class RTLText(tk.Text):
    def __init__(self, master, **kw):
        super().__init__(master, **kw)
        self.tag_configure("rtl", justify="right")
        self.bind("<<Modified>>",    self._sync)
        self.bind("<KeyRelease>",    self._sync)
        self.bind("<ButtonRelease>", self._sync)
        self._bind_clipboard()

    def _sync(self, _=None):
        self.tag_add("rtl", "1.0", "end")
        try: self.edit_modified(False)
        except Exception: pass

    # ── Copy / Paste / Cut / Select-All ─────────────────────
    def _bind_clipboard(self):
        for seq in ("<Control-c>", "<Control-C>"):
            self.bind(seq, self._on_copy)
        for seq in ("<Control-v>", "<Control-V>"):
            self.bind(seq, self._on_paste)
        for seq in ("<Control-x>", "<Control-X>"):
            self.bind(seq, self._on_cut)
        for seq in ("<Control-a>", "<Control-A>"):
            self.bind(seq, self._on_select_all)
        self.bind("<Button-3>", self._show_context_menu)

    def _is_readonly(self) -> bool:
        return str(self.cget("state")) == "disabled"

    def _on_copy(self, _=None):
        try:
            if self.tag_ranges("sel"):
                text = self.get("sel.first", "sel.last")
                self.clipboard_clear()
                self.clipboard_append(text)
        except tk.TclError:
            pass
        return "break"

    def _on_paste(self, _=None):
        if self._is_readonly():
            return "break"
        try:
            clip = self.clipboard_get()
        except tk.TclError:
            return "break"
        try:
            if self.tag_ranges("sel"):
                self.delete("sel.first", "sel.last")
        except tk.TclError:
            pass
        self.insert("insert", clip)
        self._sync()
        return "break"

    def _on_cut(self, _=None):
        if self._is_readonly():
            return self._on_copy()
        try:
            if self.tag_ranges("sel"):
                text = self.get("sel.first", "sel.last")
                self.clipboard_clear()
                self.clipboard_append(text)
                self.delete("sel.first", "sel.last")
                self._sync()
        except tk.TclError:
            pass
        return "break"

    def _on_select_all(self, _=None):
        self.tag_add("sel", "1.0", "end")
        return "break"

    def _show_context_menu(self, event):
        menu = tk.Menu(self, tearoff=0)
        readonly = self._is_readonly()
        menu.add_command(label="Copy",  command=self._on_copy, state="normal")
        menu.add_command(label="Paste", command=self._on_paste,
                          state="disabled" if readonly else "normal")
        menu.add_command(label="Cut",   command=self._on_cut,
                          state="disabled" if readonly else "normal")
        menu.add_separator()
        menu.add_command(label="Select All", command=self._on_select_all)
        menu.tk_popup(event.x_root, event.y_root)
        return "break"

    def insert(self, index, chars, *args):
        super().insert(index, chars, *args)
        self.tag_add("rtl", "1.0", "end")


class RTLBox(tk.Frame):
    """ScrolledText RTL — شريط التمرير على اليسار، مع حدود متوهجة عند التركيز."""
    def __init__(self, master, height=10, bg="#0c1326", fg="#dde6f5",
                 font=(UI_FONT, 12), readonly=False, border_idle="#1a2540",
                 border_focus="#00d9a3", **kw):
        super().__init__(master, bg=border_idle, padx=1, pady=1)
        self._border_idle = border_idle
        self._border_focus = border_focus
        inner = tk.Frame(self, bg=bg)
        inner.pack(fill="both", expand=True)

        sb = tk.Scrollbar(inner, relief="flat", bd=0)
        sb.pack(side="left", fill="y")
        state = "disabled" if readonly else "normal"
        self.text = RTLText(
            inner, height=height, bg=bg, fg=fg, font=font,
            relief="flat", bd=0, wrap="word",
            yscrollcommand=sb.set,
            insertbackground=fg,
            selectbackground="#16406b", selectforeground="white",
            padx=14, pady=10, undo=True,
            spacing1=3, spacing3=3,
            state=state,
        )
        self.text.pack(side="left", fill="both", expand=True)
        sb.config(command=self.text.yview)
        self._readonly = readonly

        if not readonly:
            self.text.bind("<FocusIn>",  lambda _e: self.configure(bg=self._border_focus))
            self.text.bind("<FocusOut>", lambda _e: self.configure(bg=self._border_idle))

    def _unlock(self):
        if self._readonly: self.text.configure(state="normal")
    def _lock(self):
        if self._readonly: self.text.configure(state="disabled")

    def get(self, *a, **kw):
        return self.text.get(*a, **kw)
    def insert(self, idx, chars, *a, **kw):
        self._unlock()
        self.text.insert(idx, chars, *a, **kw)
        self._lock()
    def delete(self, *a, **kw):
        self._unlock()
        self.text.delete(*a, **kw)
        self._lock()
    def see(self, *a): self.text.see(*a)


# ══════════════════════════════════════════════════════════════
# Custom "scanning" progress bar — replaces ttk's default marquee.
# A short bright segment sweeps across a dim track; sells the
# "model is working" moment once, deliberately, instead of stacking
# multiple competing animations across the app.
# ══════════════════════════════════════════════════════════════
class ScanBar(tk.Canvas):
    def __init__(self, master, width=170, height=4, track="#15203a",
                 glow="#00d9a3", **kw):
        super().__init__(master, width=width, height=height,
                          bg=track, highlightthickness=0, **kw)
        # NOTE: do not name these self._w / self._h — tkinter.Misc
        # reserves self._w internally for the widget's Tcl path name,
        # and overwriting it breaks every subsequent Tk call.
        self._bar_w, self._bar_h = width, height
        self._glow = glow
        self._track = track
        self._pos = 0.0
        self._running = False
        self._seg = max(28, width // 4)
        self.create_rectangle(0, 0, width, height, fill=track, outline="")
        self._bar = self.create_rectangle(-self._seg, 0, 0, height,
                                          fill=glow, outline="")

    def start(self):
        if self._running:
            return
        self._running = True
        self._tick()

    def stop(self):
        self._running = False
        self.coords(self._bar, -self._seg, 0, 0, self._bar_h)

    def _tick(self):
        if not self._running:
            return
        self._pos = (self._pos + 0.022) % 1.0
        x = -self._seg + self._pos * (self._bar_w + self._seg)
        self.coords(self._bar, x, 0, x + self._seg, self._bar_h)
        self.after(16, self._tick)


# ══════════════════════════════════════════════════════════════
# Pulse gauge — the signature element. A radial dial that eases
# into its final value rather than snapping, used for the overall
# evaluation score.
# ══════════════════════════════════════════════════════════════
class PulseGauge(tk.Canvas):
    def __init__(self, master, size=128, bg="#0f1729", track="#1a2540", **kw):
        super().__init__(master, width=size, height=size, bg=bg,
                          highlightthickness=0, **kw)
        self.size = size
        self.track = track
        pad = 10
        self._bbox = (pad, pad, size - pad, size - pad)
        self._value_text = None
        self._label_text = None
        self._caption_text = None
        self.create_oval(*self._bbox, outline=track, width=9)
        self._arc = None
        self._anim_job = None

    def animate_to(self, value, color, label, caption="Overall Score"):
        value = max(0, min(100, value))
        if self._anim_job:
            self.after_cancel(self._anim_job)
        self._target = value
        self._color = color
        self._label = label
        self._caption = caption
        self._current = 0.0
        self._step()

    def _step(self):
        self._current += (self._target - self._current) * 0.18
        if abs(self._target - self._current) < 0.4:
            self._current = self._target
        self._draw(self._current, self._color, self._label, self._caption)
        if self._current != self._target:
            self._anim_job = self.after(16, self._step)
        else:
            self._anim_job = None

    def _draw(self, value, color, label, caption):
        if self._arc:
            self.delete(self._arc)
        if self._value_text:
            self.delete(self._value_text)
        if self._label_text:
            self.delete(self._label_text)
        if self._caption_text:
            self.delete(self._caption_text)
        extent = -int(3.6 * value)
        self._arc = self.create_arc(*self._bbox, start=90, extent=extent,
                                    outline=color, width=9, style="arc")
        cx = self.size / 2
        self._value_text = self.create_text(
            cx, self.size * 0.42, text=f"{int(round(value))}%",
            fill=color, font=(MONO_FONT, 19, "bold"), anchor="center")
        self._label_text = self.create_text(
            cx, self.size * 0.60, text=label,
            fill=color, font=(UI_FONT, 10, "bold"), anchor="center")
        self._caption_text = self.create_text(
            cx, self.size * 0.78, text=caption,
            fill="#5b7299", font=(UI_FONT, 8), anchor="center")


# ══════════════════════════════════════════════════════════════
# Ticker tape — a thin strip of scrolling stat chips across the
# header, echoing a market ticker. Purely atmospheric, restrained
# to one row, one direction, modest speed.
# ══════════════════════════════════════════════════════════════
class TickerTape(tk.Canvas):
    def __init__(self, master, items, bg="#080c16", fg="#5b7299",
                 accent="#00d9a3", border="#1a2540", height=28, speed=0.6, **kw):
        super().__init__(master, height=height, bg=bg,
                          highlightthickness=0, **kw)
        self._items = items
        self._fg = fg
        self._accent = accent
        self._border = border
        self._speed = speed
        self._h = height
        self._runs = []
        self._running = True
        self._built = False
        self.create_line(0, 0, 4000, 0, fill=border, width=1)
        self.bind("<Configure>", self._on_resize)
        self.after(80, self._build)

    def _on_resize(self, _e):
        pass  # keep scrolling continuous; no rebuild needed on resize

    def _segment_specs(self):
        """One (label, value) pair per item; label dim, value drawn in signal color."""
        specs = []
        for item in self._items:
            if "·" in item:
                label, _, value = item.partition("·")
                specs.append((label.strip() + "  ", value.strip()))
            else:
                specs.append(("", item))
        return specs

    def _build(self):
        if self._built:
            return
        w = self.winfo_width()
        if w <= 1:
            self.after(80, self._build)
            return
        self._built = True
        self.delete("seg")
        sep = "     ·     "
        specs = self._segment_specs() * 2  # duplicate for seamless wrap
        x = float(w)
        y = self._h / 2 + 1
        self._runs = []
        for label, value in specs:
            if label:
                lid = self.create_text(x, y, text=label, fill=self._fg,
                                       font=(MONO_FONT, 9), anchor="w", tags="seg")
                x += self.bbox(lid)[2] - self.bbox(lid)[0]
                self._runs.append(lid)
            vid = self.create_text(x, y, text=value, fill=self._accent,
                                   font=(MONO_FONT, 9, "bold"), anchor="w", tags="seg")
            x += self.bbox(vid)[2] - self.bbox(vid)[0]
            self._runs.append(vid)
            sid = self.create_text(x, y, text=sep, fill=self._border,
                                   font=(MONO_FONT, 9), anchor="w", tags="seg")
            x += self.bbox(sid)[2] - self.bbox(sid)[0]
            self._runs.append(sid)
        self._reset_width = x - w
        self._x = float(w)
        self._scroll()

    def _scroll(self):
        if not self._running or not self._runs:
            return
        self._x -= self._speed
        if self._x < -self._reset_width:
            self._x = self.winfo_width()
        dx = self._x - self.coords(self._runs[0])[0]
        for item_id in self._runs:
            self.move(item_id, dx, 0)
        self.after(30, self._scroll)

    def stop(self):
        self._running = False


# ══════════════════════════════════════════════════════════════
# App
# ══════════════════════════════════════════════════════════════
class InvestmentSummarizerApp:

    # ── Token system ─────────────────────────────────────────
    # "Market terminal" palette: void background, signal green/red
    # borrowed from price tickers (true to an investment product),
    # violet reserved exclusively for AI/training actions so it
    # reads as a distinct category rather than decoration.
    C = {
        "bg":        "#0a0e1a",
        "header":    "#080c16",
        "panel":     "#0f1729",
        "card":      "#0d1424",
        "sidebar":   "#080c16",
        "input_bg":  "#0c1326",
        "out_bg":    "#081814",
        "log_bg":    "#070d12",

        "border":    "#1a2540",
        "border_lt": "#243352",

        "text":      "#dde6f5",
        "subtext":   "#7186ab",
        "muted":     "#3d5278",

        "signal":    "#00d9a3",   # gains / primary action / success
        "signal_h":  "#00b386",
        "danger":    "#ff4d6d",   # warnings / negative deltas
        "danger_h":  "#e23f5c",
        "amber":     "#ffb454",   # CPU / caution badge
        "amber_h":   "#e89a3c",
        "violet":    "#7c5cff",   # AI / training actions exclusively
        "violet_h":  "#6a47e8",
        "blue":      "#3d8bff",   # informational / load actions

        "out_fg":    "#00d9a3",
        "log_fg":    "#5fe3a8",
    }

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Investly — Smart Project Summarizer")
        self.root.geometry("1180x840")
        self.root.minsize(980, 820)
        self.root.configure(bg=self.C["bg"])
        self._gpu  = self._detect_gpu()
        self._model_name = self._detect_model()
        self._last_summary = ""
        self._busy = False
        self._buttons = []
        self._build_ui()

    def _center_window(self):
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = max((self.root.winfo_screenwidth() - width) // 2, 0)
        y = max((self.root.winfo_screenheight() - height) // 2 - 1, 0)
        self.root.geometry(f"{width}x{height}+{x}+{y}")

    @staticmethod
    def _detect_gpu() -> str:
        try:
            import torch

            print("=" * 60)
            print("Python:", sys.executable)
            print("Torch :", torch.__version__)
            print("CUDA Available:", torch.cuda.is_available())

            if torch.cuda.is_available():
                gpu_name = torch.cuda.get_device_name(0)
                vram = round(
                    torch.cuda.get_device_properties(0).total_memory
                    / 1024 ** 3, 2)
                print("GPU:", gpu_name)
                print("VRAM:", vram, "GB")
                print("=" * 60)
                return f"{gpu_name} ({vram}GB)"

            print("=" * 60)
            return "CPU"

        except Exception as e:
            print("GPU Detection Error:", e)
            return "CPU"

    def _detect_model(self):
        trained_model = os.path.join(
            ROOT_DIR, "models", "summarizer_model", "config.json")
        if os.path.exists(trained_model):
            return "Trained Model"
        return "AraT5v2-1024"

    # ── Build ───────────────────────────────────────────────
    def _build_ui(self):
        self._styles()
        self._header()
        self._ticker()

        main = tk.Frame(self.root, bg=self.C["bg"], padx=10, pady=10)
        main.pack(fill="both", expand=True)

        self.sidebar = self._create_sidebar(main)
        self.sidebar.pack(side="right", fill="y", padx=(8, 12), pady=8)

        content = tk.Frame(main, bg=self.C["bg"])
        content.pack(fill="both", expand=True, side="left")

        self.body = content
        self._tabs(self.body)
        self._statusbar()
        self._center_window()

    def _ticker(self):
        items = [
            "INVESTLY",
            f"MODEL · {self._model_name.upper()}",
            f"DEVICE · {self._gpu.upper()}",
            "DATASET · 5,000 PROJECTS",
            "EVAL · ROUGE-L + FIELD SCORE",
            "LANG · ARABIC RTL",
        ]
        tape = TickerTape(self.root, items, bg=self.C["header"],
                          fg="#5b7299", accent=self.C["signal"],
                          border=self.C["border"])
        tape.pack(fill="x")
        self._tape = tape

    def _create_sidebar(self, parent):
        s = tk.Frame(parent, bg=self.C["sidebar"], width=224)
        s.pack_propagate(False)

        tk.Label(s, text="QUICK ACTIONS", font=(MONO_FONT, 9, "bold"),
                 bg=self.C["sidebar"], fg=self.C["muted"]).pack(
            pady=(16, 10), anchor="e", padx=16)

        def make_item(text, cmd, accent):
            row = tk.Frame(s, bg=self.C["sidebar"])
            rule = tk.Frame(row, bg=accent, width=3)
            rule.pack(side="right", fill="y")
            b = tk.Button(row, text=text, anchor="e",
                          font=(UI_FONT, 10), bg=self.C["panel"],
                          fg=self.C["text"], relief="flat", bd=0,
                          padx=14, pady=10, command=cmd, cursor="hand2",
                          activebackground=self.C["border"],
                          activeforeground=self.C["text"])
            b.pack(side="right", fill="x", expand=True)
            b.bind("<Enter>", lambda _e: b.configure(bg=self.C["border"]))
            b.bind("<Leave>", lambda _e: b.configure(bg=self.C["panel"]))
            return row

        make_item("Summarize Now", self._summarize, self.C["signal"]).pack(
            fill="x", padx=12, pady=5)
        make_item("Copy to Evaluate", self._transfer_summary, self.C["blue"]).pack(
            fill="x", padx=12, pady=5)
        make_item("Load File", self._load_file, self.C["blue"]).pack(
            fill="x", padx=12, pady=5)
        make_item("Train Model", self._train, self.C["violet"]).pack(
            fill="x", padx=12, pady=5)

        tk.Frame(s, bg=self.C["sidebar"]).pack(expand=True, fill="both")

        sep = tk.Frame(s, bg=self.C["border"], height=1)
        sep.pack(fill="x", padx=16, pady=(0, 10))
        tk.Label(s, text="INVESTLY · UI v3", font=(MONO_FONT, 8),
                 bg=self.C["sidebar"], fg=self.C["muted"]).pack(
            pady=(0, 14), anchor="e", padx=16)
        return s

    def _styles(self):
        s = ttk.Style(); s.theme_use("clam")
        s.configure("TNotebook", background=self.C["bg"], borderwidth=0,
                    tabmargins=[8, 10, 8, 0])
        s.configure("TNotebook.Tab",
                    font=(UI_FONT, 11, "bold"), padding=[22, 11],
                    background=self.C["panel"], foreground=self.C["subtext"],
                    borderwidth=0)
        s.map("TNotebook.Tab",
              background=[("selected", self.C["card"])],
              foreground=[("selected", self.C["signal"])])

    def _chip(self, parent, text, bg, fg="#0a0e1a"):
        chip = tk.Frame(parent, bg=bg, padx=11, pady=5)
        tk.Label(chip, text=text, font=(MONO_FONT, 9, "bold"),
                 fg=fg, bg=bg).pack()
        return chip

    def _header(self):
        h = tk.Frame(self.root, bg=self.C["header"], height=92)
        h.pack(fill="x"); h.pack_propagate(False)

        tf = tk.Frame(h, bg=self.C["header"])
        tf.pack(side="right", padx=22, pady=14)

        tk.Label(tf, text="INVESTLY", font=(MONO_FONT, 10, "bold"),
                 fg=self.C["signal"], bg=self.C["header"]).pack(anchor="e")
        tk.Label(tf, text="Smart Investment Project Summarizer",
                 font=(UI_FONT, 17, "bold"),
                 fg=self.C["text"], bg=self.C["header"]).pack(anchor="e")
        tk.Label(tf, text="Summarization · Evaluation · Training — one focused workspace",
                 font=(UI_FONT, 9),
                 fg=self.C["subtext"], bg=self.C["header"]).pack(
            anchor="e", pady=(2, 0))

        chips = tk.Frame(tf, bg=self.C["header"])
        chips.pack(anchor="e", pady=(9, 0))
        self._chip(chips, self._model_name.upper(), self.C["panel"],
                   self.C["text"]).pack(side="right", padx=(0, 8))
        self._chip(chips, "RTL", self.C["signal"]).pack(side="right", padx=(0, 8))

        is_gpu = self._gpu != "CPU"
        badge_bg = self.C["signal"] if is_gpu else self.C["amber"]
        b = tk.Frame(h, bg=badge_bg, padx=15, pady=9)
        b.pack(side="left", padx=20, pady=18)
        tk.Label(b, text=f"{'⚡ GPU' if is_gpu else '🖥 CPU'}",
                 font=(MONO_FONT, 9, "bold"), fg="#0a0e1a",
                 bg=badge_bg).pack()
        tk.Label(b, text=self._gpu, font=(MONO_FONT, 8),
                 fg="#0a0e1a", bg=badge_bg).pack()

    def _tabs(self, parent):
        nb = ttk.Notebook(parent)
        nb.pack(fill="both", expand=True)
        t1 = tk.Frame(nb, bg=self.C["card"])
        t2 = tk.Frame(nb, bg=self.C["card"])
        t3 = tk.Frame(nb, bg=self.C["card"])
        nb.add(t1, text="  📄  Summarize  ")
        nb.add(t2, text="  📊  Evaluate  ")
        nb.add(t3, text="  🤖  Train  ")
        self._tab_summarize(t1)
        self._tab_evaluate(t2)
        self._tab_training(t3)

    def _statusbar(self):
        b = tk.Frame(self.root, bg=self.C["header"], height=36)
        b.pack(fill="x", side="bottom"); b.pack_propagate(False)
        self.progress = ScanBar(b, width=170, height=4,
                                track=self.C["border"], glow=self.C["signal"])
        self.progress.pack(side="left", padx=16, pady=16)
        self.status = tk.StringVar(value="● READY")
        tk.Label(b, textvariable=self.status, font=(MONO_FONT, 9, "bold"),
                 bg=self.C["header"], fg=self.C["subtext"],
                 anchor="e").pack(side="right", padx=16, fill="x", expand=True)

    # ══════════════════════════════════════════════════════
    # Tab 1 — Summarise
    # ══════════════════════════════════════════════════════
    def _tab_summarize(self, p):
        self._lbl(p, "📝  Full Project Text")

        hint = tk.Frame(p, bg=self.C["panel"], padx=14, pady=10)
        hint.pack(fill="x", padx=18, pady=(0, 10))
        tk.Label(hint,
                 text="Paste the project description here or load a TXT file, then click Summarize Now to get a concise review-ready summary.",
                 font=(UI_FONT, 10), bg=self.C["panel"], fg=self.C["subtext"],
                 justify="right", anchor="e").pack(fill="x")

        self.input_box = RTLBox(p, height=11,
                                bg=self.C["input_bg"], fg=self.C["text"],
                                font=(UI_FONT, 13),
                                border_idle=self.C["border"],
                                border_focus=self.C["signal"])
        self.input_box.pack(fill="both", expand=True, padx=18, pady=(0, 10))

        br = tk.Frame(p, bg=self.C["card"]); br.pack(pady=8)
        self._btn(br, "⚡  Summarize Now", self.C["signal"], self.C["signal_h"],
                  self._summarize, fg="#0a0e1a").pack(side="right", padx=6)
        self._btn(br, "📂  Load File", self.C["blue"], "#2f73d6",
                  self._load_file).pack(side="right", padx=6)
        self._btn(br, "🗑  Clear", self.C["border"], "#334d6e",
                  self._clear, self.C["subtext"]).pack(side="right", padx=6)

        self._lbl(p, "💡  Generated Summary")
        self.output_box = RTLBox(p, height=7, readonly=True,
                                 bg=self.C["out_bg"], fg=self.C["out_fg"],
                                 font=(UI_FONT, 13, "bold"),
                                 border_idle=self.C["signal"],
                                 border_focus=self.C["signal"])
        self.output_box.pack(fill="both", expand=True, padx=18, pady=(0, 4))

        self.info_var = tk.StringVar(value="")
        tk.Label(p, textvariable=self.info_var, font=(MONO_FONT, 9),
                 bg=self.C["card"], fg=self.C["subtext"],
                 anchor="e").pack(fill="x", padx=20, pady=(3, 10))

    # ══════════════════════════════════════════════════════
    # Tab 2 — Evaluate
    # ══════════════════════════════════════════════════════
    def _tab_evaluate(self, p):
        desc = tk.Frame(p, bg=self.C["panel"], pady=10)
        desc.pack(fill="x", padx=18, pady=(14, 6))
        tk.Label(desc,
                 text="Evaluation combines two metrics:\n"
                      "  •  ROUGE-L — measures textual similarity to an optional reference\n"
                      "  •  Field Score — checks for key investment fields present in the summary",
                 font=(UI_FONT, 10), bg=self.C["panel"],
                 fg=self.C["subtext"], justify="right", anchor="e"
                 ).pack(fill="x", padx=14)

        self._lbl(p, "📋  Summary to Evaluate")
        self.eval_summary_box = RTLBox(p, height=5,
                                       bg=self.C["input_bg"], fg=self.C["text"],
                                       font=(UI_FONT, 12),
                                       border_idle=self.C["border"],
                                       border_focus=self.C["violet"])
        self.eval_summary_box.pack(fill="x", padx=18, pady=(0, 8))

        self._lbl(p, "📎  Reference Summary (optional — for ROUGE)")
        self.eval_ref_box = RTLBox(p, height=3,
                                   bg=self.C["input_bg"], fg=self.C["subtext"],
                                   font=(UI_FONT, 12),
                                   border_idle=self.C["border"],
                                   border_focus=self.C["violet"])
        self.eval_ref_box.pack(fill="x", padx=18, pady=(0, 8))

        br = tk.Frame(p, bg=self.C["card"]); br.pack(pady=6)
        self._btn(br, "📊  Evaluate Summary", self.C["violet"], self.C["violet_h"],
                  self._evaluate).pack(side="right", padx=6)
        self._btn(br, "📋  Copy from Summarize", self.C["blue"], "#2f73d6",
                  self._transfer_summary).pack(side="right", padx=6)
        self._btn(br, "🗑  Clear", self.C["border"], "#334d6e",
                  self._clear_eval, self.C["subtext"]).pack(side="right", padx=6)

        self._lbl(p, "📈  Evaluation Results")
        results_wrap = tk.Frame(p, bg=self.C["border"], padx=1, pady=1)
        results_wrap.pack(fill="both", expand=True, padx=18, pady=(0, 14))

        results_canvas = tk.Canvas(results_wrap, bg=self.C["card"],
                                   highlightthickness=0)
        results_sb = tk.Scrollbar(results_wrap, orient="vertical",
                                  command=results_canvas.yview)
        results_canvas.configure(yscrollcommand=results_sb.set)
        results_sb.pack(side="left", fill="y")
        results_canvas.pack(side="left", fill="both", expand=True)

        self.result_frame = tk.Frame(results_canvas, bg=self.C["card"])
        self._result_frame_id = results_canvas.create_window(
            (0, 0), window=self.result_frame, anchor="nw")

        def _sync_scroll_region(_e=None):
            results_canvas.configure(scrollregion=results_canvas.bbox("all"))

        def _sync_inner_width(e):
            results_canvas.itemconfigure(self._result_frame_id, width=e.width)

        self.result_frame.bind("<Configure>", _sync_scroll_region)
        results_canvas.bind("<Configure>", _sync_inner_width)

        def _on_mousewheel(e):
            results_canvas.yview_scroll(int(-1 * (e.delta / 120)), "units")

        results_canvas.bind("<Enter>", lambda _e: results_canvas.bind_all("<MouseWheel>", _on_mousewheel))
        results_canvas.bind("<Leave>", lambda _e: results_canvas.unbind_all("<MouseWheel>"))

        self._render_eval_empty_state()

    # ══════════════════════════════════════════════════════
    # Tab 3 — Training
    # ══════════════════════════════════════════════════════
    def _tab_training(self, p):
        bar = tk.Frame(p, bg=self.C["panel"])
        bar.pack(fill="x", padx=18, pady=(18, 10))
        for ico, lbl, val in [
            ("🧠", "Model", self._model_name),
            ("📊", "Data", "5,000 projects"),
            ("📐", "Evaluation", "ROUGE-L"),
            ("⚡", "Device", "GPU" if self._gpu != "CPU" else "CPU"),
        ]:
            c = tk.Frame(bar, bg=self.C["border"], padx=14, pady=9)
            c.pack(side="right", padx=6)
            tk.Label(c, text=f"{ico}  {val}", font=(MONO_FONT, 10, "bold"),
                     bg=self.C["border"], fg=self.C["text"]).pack()
            tk.Label(c, text=lbl, font=(UI_FONT, 8),
                     bg=self.C["border"], fg=self.C["subtext"]).pack()

        sf = tk.Frame(p, bg=self.C["card"]); sf.pack(fill="x", padx=70, pady=4)
        for label, cmd, bg, hov in [
            ("1.   Generate data (5,000 projects)", self._gen_data,
             self.C["blue"], "#2f73d6"),
            ("2.   Preprocess & clean data", self._preprocess,
             self.C["violet"], self.C["violet_h"]),
            ("3.   Start model training", self._train,
             self.C["amber"], self.C["amber_h"]),
            ("4.   Reload model after training", self._reload_model,
             self.C["signal"], self.C["signal_h"]),
        ]:
            fg = "#0a0e1a" if bg in (self.C["amber"], self.C["signal"]) else "white"
            btn = self._btn(sf, label, bg, hov, cmd, fg=fg)
            btn.configure(padx=20, pady=12, anchor="e", justify="right")
            btn.pack(fill="x", pady=5)

        self._lbl(p, "📋  سجل العمليات")
        lw = tk.Frame(p, bg=self.C["border"], padx=1, pady=1)
        lw.pack(fill="both", expand=True, padx=18, pady=(0, 14))
        self.log_box = tk.Text(lw, font=("Consolas", 10),
                               bg=self.C["log_bg"], fg=self.C["log_fg"],
                               relief="flat", bd=0, padx=12, pady=10,
                               state="disabled", wrap="word")
        lsb = tk.Scrollbar(lw, command=self.log_box.yview)
        self.log_box.configure(yscrollcommand=lsb.set)
        lsb.pack(side="right", fill="y")
        self.log_box.pack(side="left", fill="both", expand=True)

    # ══════════════════════════════════════════════════════
    # Helpers
    # ══════════════════════════════════════════════════════
    def _lbl(self, p, text):
        tk.Label(p, text=text, font=(UI_FONT, 10, "bold"),
                 bg=self.C["card"], fg=self.C["subtext"],
                 anchor="e").pack(fill="x", padx=20, pady=(10, 3))

    def _btn(self, parent, text, bg, hover, cmd, fg="white"):
        btn = tk.Button(parent, text=text, font=(UI_FONT, 11, "bold"),
                        bg=bg, fg=fg, activebackground=hover,
                        activeforeground=fg, relief="flat", bd=0,
                        padx=18, pady=9, cursor="hand2", command=cmd,
                        disabledforeground=self.C["subtext"])
        btn._base_bg = bg
        btn._hover_bg = hover
        btn.bind("<Enter>", lambda _e, b=btn: self._hover_button(b, True))
        btn.bind("<Leave>", lambda _e, b=btn: self._hover_button(b, False))
        self._buttons.append(btn)
        return btn

    def _hover_button(self, button, hovered):
        if str(button.cget("state")) == "disabled":
            return
        button.configure(bg=button._hover_bg if hovered else button._base_bg)

    def _set_busy(self, busy: bool, status: str | None = None):
        self._busy = busy
        state = "disabled" if busy else "normal"
        for btn in self._buttons:
            btn.configure(state=state)
            if not busy:
                btn.configure(bg=btn._base_bg)
        if busy:
            self.progress.start()
        else:
            self.progress.stop()
        if status:
            self.status.set(status)

    def _run_on_ui(self, callback, *args, **kwargs):
        self.root.after(0, lambda: callback(*args, **kwargs))

    def _finish_busy(self, status: str):
        self._set_busy(False, status)

    def _log(self, text):
        self.log_box.configure(state="normal")
        self.log_box.insert("end", text)
        self.log_box.see("end")
        self.log_box.configure(state="disabled")

    # ══════════════════════════════════════════════════════
    # Summarise
    # ══════════════════════════════════════════════════════
    def _summarize(self):
        if self._busy:
            return
        text = self.input_box.get("1.0", "end").strip()
        if len(text) < 30:
            messagebox.showwarning("Warning", "Please enter sufficient text (at least 30 characters).")
            return
        self._set_busy(True, "● SUMMARIZING")

        def _run():
            try:
                from src import summarizer as sm
                if _DEV_MODE: importlib.reload(sm)
                r = sm.summarize(text)
                self._run_on_ui(self._show_summary, r)
            except FileNotFoundError as e:
                self._run_on_ui(self._show_error, "Model Missing", str(e), "● MODEL NOT FOUND")
            except Exception as e:
                self._run_on_ui(self._show_error, "Error", str(e), "● ERROR")

        threading.Thread(target=_run, daemon=True).start()

    def _show_summary(self, result):
        summary = result.get("summary", "").strip()
        if not summary:
            self._run_on_ui(self._show_error, "Error", "Model returned no valid summary.", "● ERROR")
            return
        self._last_summary = summary
        self.output_box.delete("1.0", "end")
        self.output_box.insert("1.0", summary)
        ratio = max(0, round((1 - result.get("output_len", 0) / max(result.get("input_len", 1), 1)) * 100))
        self.info_var.set(
            f"INPUT {result.get('input_len', 0)} CH  →  SUMMARY {result.get('output_len', 0)} CH  |  COMPRESSION {ratio}%")
        self._finish_busy("● SUMMARIZED")

    def _show_error(self, title, message, status):
        messagebox.showerror(title, message)
        self._finish_busy(status)

    def _load_file(self):
        if self._busy:
            return
        p = filedialog.askopenfilename(
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")])
        if p:
            try:
                with open(p, encoding="utf-8") as f:
                    self.input_box.delete("1.0", "end")
                    self.input_box.insert("1.0", f.read())
                self.status.set("● تم تحميل الملف")
            except UnicodeDecodeError:
                messagebox.showerror("Unable to read file", "File is not UTF-8 encoded.")
            except OSError as e:
                messagebox.showerror("Unable to open file", str(e))

    def _clear(self):
        if self._busy:
            return
        self.input_box.delete("1.0", "end")
        self.output_box.delete("1.0", "end")
        self._last_summary = ""
        self.info_var.set(""); self.status.set("● READY")

    # ══════════════════════════════════════════════════════
    # Evaluate
    # ══════════════════════════════════════════════════════
    def _transfer_summary(self):
        if not self._last_summary:
            messagebox.showinfo("Notice", "Summarize text first from the Summarize tab.")
            return
        self.eval_summary_box.delete("1.0", "end")
        self.eval_summary_box.insert("1.0", self._last_summary)

    def _clear_eval(self):
        self.eval_summary_box.delete("1.0", "end")
        self.eval_ref_box.delete("1.0", "end")
        self._render_eval_empty_state()

    def _render_eval_empty_state(self):
        for w in self.result_frame.winfo_children():
            w.destroy()
        shell = tk.Frame(self.result_frame, bg=self.C["panel"], padx=18, pady=18)
        shell.pack(fill="both", expand=True, padx=18, pady=18)
        tk.Label(shell, text="No results yet",
                 font=(UI_FONT, 13, "bold"), bg=self.C["panel"],
                 fg=self.C["text"]).pack(anchor="e")
        tk.Label(shell,
                 text="Enter a summary and click Evaluate Summary to view Field Score and ROUGE-L in one clear panel.",
                 font=(UI_FONT, 10), bg=self.C["panel"],
                 fg=self.C["subtext"], justify="right", anchor="e").pack(fill="x", pady=(8, 0))

    def _evaluate(self):
        if self._busy: return
        summary = self.eval_summary_box.get("1.0", "end").strip()
        if len(summary) < 10:
            messagebox.showwarning("Warning", "Please enter the summary to evaluate.")
            return
        reference = self.eval_ref_box.get("1.0", "end").strip()
        self._set_busy(True, "● EVALUATING")

        def _run():
            try:
                from src import evaluator as ev
                if _DEV_MODE: importlib.reload(ev)
                result = ev.evaluate(summary, reference)
                self._run_on_ui(self._show_eval_done, result)
            except Exception as e:
                self._run_on_ui(self._show_error, "Error", str(e), "● EVALUATION ERROR")

        threading.Thread(target=_run, daemon=True).start()

    def _show_eval_done(self, result):
        self._show_results(result)
        self._finish_busy("● EVALUATION COMPLETE")

    def _show_results(self, result: dict):
        for w in self.result_frame.winfo_children(): w.destroy()

        field = result["field"]
        rouge = result["rouge"]
        overall = result["overall"]

        from src import evaluator as ev
        olabel, ocolor = ev.field_label(overall)

        top = tk.Frame(self.result_frame, bg=self.C["card"])
        top.pack(fill="x", pady=(10, 6))

        gauge = PulseGauge(top, size=128, bg=self.C["card"], track=self.C["border"])
        gauge.pack(side="left", padx=20)
        gauge.animate_to(overall, ocolor, olabel)

        cards_f = tk.Frame(top, bg=self.C["card"])
        cards_f.pack(side="right", padx=10, fill="x", expand=True)

        fl, fc = ev.field_label(field["score"])
        self._score_card(cards_f,
                         f"Field Score: {field['score']}%",
                         f"{field['found']}/{field['total']} حقول مستخرجة",
                         fl, fc)

        if rouge and rouge.get("available"):
            rl, rc = ev.rouge_label(rouge["rougeL"])
            self._score_card(cards_f,
                             f"ROUGE-L: {rouge['rougeL']:.3f}",
                             f"R1: {rouge['rouge1']:.3f}  |  R2: {rouge['rouge2']:.3f}",
                             rl, rc)
        elif rouge and not rouge.get("available"):
            self._score_card(cards_f,
                             "ROUGE: غير متاح",
                             "pip install rouge-score",
                             "—", self.C["subtext"])

        sep = tk.Frame(self.result_frame, bg=self.C["border"], height=1)
        sep.pack(fill="x", padx=16, pady=6)

        tk.Label(self.result_frame, text="تفاصيل الحقول الاستثمارية",
                 font=(UI_FONT, 10, "bold"),
                 bg=self.C["card"], fg=self.C["subtext"],
                 anchor="e").pack(fill="x", padx=18, pady=(2, 4))

        grid = tk.Frame(self.result_frame, bg=self.C["card"])
        grid.pack(fill="x", padx=18, pady=(0, 10))

        for i, (name, v) in enumerate(field["fields"].items()):
            row = i // 2
            col = i % 2
            cell = tk.Frame(grid, bg=self.C["panel"], padx=10, pady=6)
            cell.grid(row=row, column=col, padx=5, pady=4, sticky="ew")
            grid.columnconfigure(col, weight=1)

            icon = "✅" if v["found"] else "❌"
            color = self.C["signal"] if v["found"] else self.C["danger"]
            match_txt = f'  ←  "{v["match"]}"' if v["match"] else ""

            tk.Label(cell, text=f"{icon}  {name}",
                     font=(UI_FONT, 10, "bold"),
                     bg=self.C["panel"], fg=color, anchor="e").pack(fill="x")
            if match_txt:
                tk.Label(cell, text=match_txt,
                         font=(UI_FONT, 9),
                         bg=self.C["panel"], fg=self.C["subtext"],
                         anchor="e").pack(fill="x")

    def _score_card(self, parent, title, subtitle, label, color):
        c = tk.Frame(parent, bg=self.C["border"], padx=14, pady=8)
        c.pack(side="right", padx=6)
        tk.Label(c, text=title, font=(MONO_FONT, 11, "bold"),
                 bg=self.C["border"], fg=color).pack(anchor="e")
        tk.Label(c, text=subtitle, font=(UI_FONT, 9),
                 bg=self.C["border"], fg=self.C["subtext"]).pack(anchor="e")
        tk.Label(c, text=label, font=(UI_FONT, 9, "bold"),
                 bg=self.C["border"], fg=color).pack(anchor="e")

    # ══════════════════════════════════════════════════════
    # Training
    # ══════════════════════════════════════════════════════
    def _run_script(self, script):
        if self._busy: return
        self._set_busy(True, f"● {script.upper()}")

        def _w():
            self._run_on_ui(self._log, f"\n▶  {script}\n{'─'*52}\n")
            try:
                proc = subprocess.Popen(
                    [sys.executable, os.path.join(SRC_DIR, script)],
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    text=True, encoding="utf-8", errors="replace", cwd=ROOT_DIR)
                for line in proc.stdout:
                    self._run_on_ui(self._log, line)
                proc.wait()
                rc = proc.returncode

                if rc == 0 and script == "model_trainer.py":
                    try:
                        from src import summarizer as sm
                        sm.unload_model()
                        sm.load_model(force_reload=True)
                        self._model_name = "Trained Model"
                        self._run_on_ui(
                            self._log,
                            "\n✅ Trained model automatically loaded after training completed\n"
                        )
                    except Exception as e:
                        self._run_on_ui(
                            self._log,
                            f"\n⚠️ Auto-reload failed: {e}\n"
                        )

                icon = '✅' if rc == 0 else '⚠️'
                self._run_on_ui(self._log, f"\n{icon}  Exit code: {rc}\n{'─'*52}\n")
                self._run_on_ui(self._finish_busy, f"● {('DONE' if rc == 0 else 'FAILED')}")
            except Exception as e:
                self._run_on_ui(self._log, f"\n❌  {e}\n")
                self._run_on_ui(self._finish_busy, "● ERROR")
        threading.Thread(target=_w, daemon=True).start()

    def _gen_data(self):   self._run_script("data_generator.py")
    def _preprocess(self): self._run_script("preprocessor.py")

    def _train(self):
        is_gpu = self._gpu != "CPU"
        if messagebox.askyesno("Confirm",
                               f"Train AraT5v2 — 5,000 projects — 5 epochs\n\n"
                               f"Device: {self._gpu}\n"
                               f"Time: {'8–15 min' if is_gpu else '45–90 min'}\n\nContinue?"):
            try:
                from src import summarizer as sm
                sm.unload_model()
                self._log("ℹ  Freed GPU memory to avoid OOM during training\n")
            except Exception as e:
                self._log(f"⚠️  Failed to free memory: {e}\n")
            self._run_script("model_trainer.py")

    def _reload_model(self):
        if self._busy: return
        self._set_busy(True, "● LOADING")

        def _w():
            try:
                from src import summarizer as sm
                sm.unload_model(); sm.load_model(force_reload=True)
                self._model_name = "Trained Model"
                self._run_on_ui(self._log, "✅  Trained model loaded\n")
                self._run_on_ui(self._finish_busy, "● MODEL READY")
            except Exception as e:
                self._run_on_ui(self._log, f"❌  {e}\n")
                self._run_on_ui(self._finish_busy, "● FAILED")
        threading.Thread(target=_w, daemon=True).start()


# ══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    os.chdir(ROOT_DIR)
    root = tk.Tk()
    InvestmentSummarizerApp(root)
    root.mainloop()