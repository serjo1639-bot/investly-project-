"""
main_gui.py — Investly Summarizer
واجهة محسّنة مع دعم كامل للغة العربية (RTL) + تبويب التقييم
"""

import os
import sys
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
    # Bound explicitly (not relying on Tk defaults) so it also
    # works with non-English keyboard layouts and read-only boxes.
    def _bind_clipboard(self):
        for seq in ("<Control-c>", "<Control-C>"):
            self.bind(seq, self._on_copy)
        for seq in ("<Control-v>", "<Control-V>"):
            self.bind(seq, self._on_paste)
        for seq in ("<Control-x>", "<Control-X>"):
            self.bind(seq, self._on_cut)
        for seq in ("<Control-a>", "<Control-A>"):
            self.bind(seq, self._on_select_all)
        # Right-click context menu
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
        menu.add_command(label="Copy",  command=self._on_copy,
                          state="normal")
        menu.add_command(label="Paste",  command=self._on_paste,
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
    """ScrolledText RTL — شريط التمرير على اليسار."""
    def __init__(self, master, height=10, bg="#0b1520", fg="#f1f5f9",
                 font=("Segoe UI", 12), readonly=False, **kw):
        super().__init__(master, bg=bg)
        sb = tk.Scrollbar(self, relief="flat", bd=0)
        sb.pack(side="left", fill="y")
        state = "disabled" if readonly else "normal"
        self.text = RTLText(
            self, height=height, bg=bg, fg=fg, font=font,
            relief="flat", bd=0, wrap="word",
            yscrollcommand=sb.set,
            insertbackground=fg,
            selectbackground="#2563eb", selectforeground="white",
            padx=14, pady=10, undo=True,
            spacing1=3, spacing3=3,
            state=state,
        )
        self.text.pack(side="left", fill="both", expand=True)
        sb.config(command=self.text.yview)
        self._readonly = readonly

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
# App
# ══════════════════════════════════════════════════════════════
class InvestmentSummarizerApp:

    C = {
        "bg":       "#0b1220",
        "panel":    "#0f1724",
        "card":     "#0f2233",
        "header":   "#071229",
        "accent":   "#06b6d4",
        "accent_h": "#0891b2",
        "green":    "#10b981",
        "green_h":  "#059669",
        "warn":     "#f97316",
        "warn_h":   "#ea580c",
        "purple":   "#7c3aed",
        "purple_h": "#6d28d9",
        "gold":     "#f59e0b",
        "text":     "#e6eef6",
        "subtext":  "#9fb3c8",
        "border":   "#153248",
        "input_bg": "#071426",
        "out_bg":   "#071824",
        "out_fg":   "#34d399",
        "log_bg":   "#06121a",
        "log_fg":   "#78e08f",
        "sidebar":  "#071725",
        "muted":    "#6b7f8f",
    }

    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Investly — Smart Project Summarizer")
        self.root.geometry("1080x720")
        self.root.minsize(920, 720)
        self.root.configure(bg=self.C["bg"])
        self._gpu  = self._detect_gpu()
        self._model_name = self._detect_model()
        self._last_summary = ""   # يُخزّن آخر ملخص لنقله للتقييم
        self._busy = False
        self._buttons = []
        self._build_ui()

    def _center_window(self):
        self.root.update_idletasks()
        width = self.root.winfo_width()
        height = self.root.winfo_height()
        x = max((self.root.winfo_screenwidth() - width) // 2, 0)
        y = max((self.root.winfo_screenheight() - height) // 2 -1, 0)
        self.root.geometry(f"{width}x{height}+{x}+{y}")

    @staticmethod
    def _detect_gpu() -> str:
        try:
            import torch
            import sys

            print("=" * 60)
            print("Python:", sys.executable)
            print("Torch :", torch.__version__)
            print("CUDA Available:", torch.cuda.is_available())

            if torch.cuda.is_available():
                gpu_name = torch.cuda.get_device_name(0)

                vram = round(
                    torch.cuda.get_device_properties(0).total_memory
                    / 1024 ** 3,
                    2
                )

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
            ROOT_DIR,
            "models",
            "summarizer_model",
            "config.json"
        )
        if os.path.exists(trained_model):
            return "Trained Model"
        return "AraT5v2-1024"


    # ── Build ───────────────────────────────────────────────
    def _build_ui(self):
        self._styles()
        self._header()

        # New layout: left navigation + content panels
        main = tk.Frame(self.root, bg=self.C["bg"], padx=8, pady=8)
        main.pack(fill="both", expand=True)

        nav = tk.Frame(main, bg=self.C["panel"], width=220)
        nav.pack(side="left", fill="y", padx=(8,6), pady=8)
        nav.pack_propagate(False)

        content = tk.Frame(main, bg=self.C["bg"])
        content.pack(side="right", fill="both", expand=True, padx=(6,12), pady=8)

        # App title in nav
        tk.Label(nav, text="Investly", font=("Segoe UI", 14, "bold"),
                 bg=self.C["panel"], fg=self.C["accent"]).pack(pady=(18,6))
        tk.Label(nav, text="Smart Summaries", font=("Segoe UI", 9),
                 bg=self.C["panel"], fg=self.C["subtext"]).pack(pady=(0,12))

        # Navigation buttons
        self._nav_buttons = {}
        def nav_btn(text, key, ico=""):
            b = tk.Button(nav, text=f"{ico}  {text}", font=("Segoe UI", 11),
                          bg=self.C["card"], fg=self.C["text"], relief="flat",
                          activebackground=self.C["accent"], bd=0, padx=12, pady=10,
                          anchor="w", cursor="hand2", command=lambda: self._show_panel(key))
            b.pack(fill="x", padx=12, pady=6)
            self._nav_buttons[key] = b
            return b

        nav_btn("Summarize", "summarize", ico="📄")
        nav_btn("Evaluate", "evaluate", ico="📊")
        nav_btn("Train", "train", ico="🤖")

        # Quick actions block
        qa = tk.Frame(nav, bg=self.C["panel"]) ; qa.pack(fill="x", padx=12, pady=(18,8))
        tk.Button(qa, text="Summarize Now", command=self._summarize,
                  bg=self.C["accent"], fg="white", relief="flat", bd=0, pady=8).pack(fill="x")
        tk.Button(qa, text="Load File", command=self._load_file,
                  bg=self.C["card"], fg=self.C["text"], relief="flat", bd=0, pady=8).pack(fill="x", pady=6)

        # Create panels and attach existing tab content into them
        self.panels = {}
        p_sum = tk.Frame(content, bg=self.C["card"]) ; p_sum.pack(fill="both", expand=True)
        p_eval = tk.Frame(content, bg=self.C["card"]) ; p_eval.pack_forget()
        p_train = tk.Frame(content, bg=self.C["card"]) ; p_train.pack_forget()

        self.panels["summarize"] = p_sum
        self.panels["evaluate"] = p_eval
        self.panels["train"] = p_train

        # Build panel contents using existing methods (they expect a parent frame)
        self._tab_summarize(p_sum)
        self._tab_evaluate(p_eval)
        self._tab_training(p_train)

        # Statusbar and center window
        self._statusbar()
        self._center_window()

        # Show default panel
        self._show_panel("summarize")

    def _show_panel(self, key: str):
        for k, f in self.panels.items():
            if k == key:
                f.pack(fill="both", expand=True)
                self._nav_buttons[k].configure(bg=self.C["accent"])
            else:
                f.pack_forget()
                if k in self._nav_buttons:
                    self._nav_buttons[k].configure(bg=self.C["card"])

    def _create_sidebar(self, parent):
        s = tk.Frame(parent, bg=self.C["sidebar"], width=220)
        s.pack_propagate(False)

        tk.Label(s, text="Quick Actions", font=("Segoe UI", 10, "bold"),
                bg=self.C["sidebar"], fg=self.C["subtext"]).pack(pady=(12,6))

        def make_item(text, cmd=None, ico="●"):
            f = tk.Frame(s, bg=self.C["sidebar"])
            b = tk.Button(f, text=f"{ico}  {text}", anchor="e",
                        font=("Segoe UI",10), bg=self.C["panel"], fg=self.C["text"],
                        relief="flat", bd=0, padx=10, pady=8, command=cmd, cursor="hand2")
            b.pack(fill="x")
            return f

        make_item("Summarize Now", cmd=self._summarize, ico="⚡").pack(fill="x", padx=10, pady=6)
        make_item("Copy to Evaluate", cmd=self._transfer_summary, ico="📋").pack(fill="x", padx=10, pady=6)
        make_item("Load File", cmd=self._load_file, ico="📂").pack(fill="x", padx=10, pady=6)
        make_item("Train Model", cmd=self._train, ico="🤖").pack(fill="x", padx=10, pady=6)

        # Spacer + footer
        tk.Frame(s, bg=self.C["sidebar"]).pack(expand=True, fill="both")
        tk.Label(s, text="Investly — UI v2", font=("Segoe UI",8),
                bg=self.C["sidebar"], fg=self.C["muted"]).pack(pady=12)
        return s

    def _styles(self):
        s = ttk.Style(); s.theme_use("clam")
        s.configure("TNotebook", background=self.C["bg"], borderwidth=0, tabmargins=[8, 8, 8, 0])
        s.configure("TNotebook.Tab",
                    font=("Segoe UI", 11, "bold"), padding=[20, 10],
                    background=self.C["panel"], foreground=self.C["subtext"])
        s.map("TNotebook.Tab",
              background=[("selected", self.C["card"])],
              foreground=[("selected", self.C["text"])])
        s.configure("P.Horizontal.TProgressbar",
                    background=self.C["accent"], troughcolor=self.C["border"],
                    borderwidth=0, thickness=3)

    def _chip(self, parent, text, bg, fg="white"):
        chip = tk.Frame(parent, bg=bg, padx=10, pady=5)
        tk.Label(chip, text=text, font=("Segoe UI", 9, "bold"),
                 fg=fg, bg=bg).pack()
        return chip

    def _header(self):
        h = tk.Frame(self.root, bg=self.C["header"], height=88)
        h.pack(fill="x"); h.pack_propagate(False)

        tf = tk.Frame(h, bg=self.C["header"])
        tf.pack(side="right", padx=22, pady=14)
        tk.Label(tf, text="✦  Investly", font=("Segoe UI", 9, "bold"),
                 fg=self.C["accent"], bg=self.C["header"]).pack(anchor="e")
        tk.Label(tf, text="Smart Investment Project Summarizer",
             font=("Segoe UI", 16, "bold"),
             fg=self.C["text"], bg=self.C["header"]).pack(anchor="e")
        tk.Label(tf, text="A focused interface for summarization, evaluation and training",
             font=("Segoe UI", 9),
             fg=self.C["subtext"], bg=self.C["header"]).pack(anchor="e", pady=(2, 0))

        chips = tk.Frame(tf, bg=self.C["header"])
        chips.pack(anchor="e", pady=(8, 0))
        self._chip(chips, self._model_name, self.C["panel"]).pack(side="right", padx=(0, 8))
        self._chip(chips, "RTL", self.C["accent"]).pack(side="right", padx=(0, 8))

        is_gpu  = self._gpu != "CPU"
        badge_bg = self.C["green"] if is_gpu else self.C["gold"]
        b = tk.Frame(h, bg=badge_bg, padx=14, pady=8)
        b.pack(side="left", padx=18, pady=18)
        tk.Label(b, text=f"{ '⚡' if is_gpu else '🖥' }  {self._gpu}",
             font=("Segoe UI", 9, "bold"), fg="white", bg=badge_bg).pack()

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
        b = tk.Frame(self.root, bg=self.C["header"], height=34)
        b.pack(fill="x", side="bottom"); b.pack_propagate(False)
        self.progress = ttk.Progressbar(b, mode="indeterminate", length=150,
                                        style="P.Horizontal.TProgressbar")
        self.progress.pack(side="left", padx=14, pady=10)
        self.status = tk.StringVar(value="Ready  ✔")
        tk.Label(b, textvariable=self.status, font=("Segoe UI", 10),
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
             font=("Segoe UI", 10), bg=self.C["panel"], fg=self.C["subtext"],
             justify="right", anchor="e").pack(fill="x")

        wrap = tk.Frame(p, bg=self.C["border"], padx=1, pady=1)
        wrap.pack(fill="both", expand=True, padx=18, pady=(0, 10))
        self.input_box = RTLBox(wrap, height=11,
                                bg=self.C["input_bg"], fg=self.C["text"],
                                font=("Segoe UI", 13))
        self.input_box.pack(fill="both", expand=True)

        br = tk.Frame(p, bg=self.C["card"]); br.pack(pady=8)
        self._btn(br, "⚡  Summarize Now",  self.C["green"],  self.C["green_h"],  self._summarize).pack(side="right", padx=6)
        self._btn(br, "📂  Load File",   self.C["accent"], self.C["accent_h"], self._load_file).pack(side="right", padx=6)
        self._btn(br, "🗑  Clear",         self.C["border"], "#334d6e",          self._clear, self.C["subtext"]).pack(side="right", padx=6)

        self._lbl(p, "💡  Generated Summary")
        ow = tk.Frame(p, bg=self.C["green"], padx=1, pady=1)
        ow.pack(fill="both", expand=True, padx=18, pady=(0, 4))
        self.output_box = RTLBox(ow, height=7, readonly=True,
                                 bg=self.C["out_bg"], fg=self.C["out_fg"],
                                 font=("Segoe UI", 13, "bold"))
        self.output_box.pack(fill="both", expand=True)

        self.info_var = tk.StringVar(value="")
        tk.Label(p, textvariable=self.info_var, font=("Segoe UI", 9),
             bg=self.C["card"], fg=self.C["subtext"],
             anchor="e").pack(fill="x", padx=20, pady=(3, 10))

    # ══════════════════════════════════════════════════════
    # Tab 2 — Evaluate
    # ══════════════════════════════════════════════════════
    def _tab_evaluate(self, p):

        # ── شرح مختصر ──
        desc = tk.Frame(p, bg=self.C["panel"], pady=10)
        desc.pack(fill="x", padx=18, pady=(14, 6))
        tk.Label(desc,
                  text="Evaluation combines two metrics:\n"
                      "  •  ROUGE-L — measures textual similarity to an optional reference\n"
                      "  •  Field Score — checks for key investment fields present in the summary",
                  font=("Segoe UI", 10), bg=self.C["panel"],
                  fg=self.C["subtext"], justify="right", anchor="e"
                  ).pack(fill="x", padx=14)

        # ── الملخص المُراد تقييمه ──
        self._lbl(p, "📋  Summary to Evaluate")
        sw = tk.Frame(p, bg=self.C["border"], padx=1, pady=1)
        sw.pack(fill="x", padx=18, pady=(0, 8))
        self.eval_summary_box = RTLBox(sw, height=5,
                                       bg=self.C["input_bg"], fg=self.C["text"],
                                       font=("Segoe UI", 12))
        self.eval_summary_box.pack(fill="x")

        # ── الملخص المرجعي (اختياري) ──
        self._lbl(p, "📎  Reference Summary (optional — for ROUGE)")
        rw = tk.Frame(p, bg=self.C["border"], padx=1, pady=1)
        rw.pack(fill="x", padx=18, pady=(0, 8))
        self.eval_ref_box = RTLBox(rw, height=4,
                                   bg=self.C["input_bg"], fg=self.C["subtext"],
                                   font=("Segoe UI", 12))
        self.eval_ref_box.pack(fill="x")

        # ── أزرار ──
        br = tk.Frame(p, bg=self.C["card"]); br.pack(pady=6)
        self._btn(br, "📊  Evaluate Summary",  self.C["purple"], self.C["purple_h"], self._evaluate).pack(side="right", padx=6)
        self._btn(br, "📋  Copy from Summarize", self.C["accent"], self.C["accent_h"], self._transfer_summary).pack(side="right", padx=6)
        self._btn(br, "🗑  Clear",            self.C["border"], "#334d6e",          self._clear_eval, self.C["subtext"]).pack(side="right", padx=6)

        # ── لوحة النتائج ──
        self._lbl(p, "📈  Evaluation Results")
        self.result_frame = tk.Frame(p, bg=self.C["card"])
        self.result_frame.pack(fill="both", expand=True, padx=18, pady=(0, 14))
        self._render_eval_empty_state()

    # ══════════════════════════════════════════════════════
    # Tab 3 — Training
    # ══════════════════════════════════════════════════════
    def _tab_training(self, p):
        bar = tk.Frame(p, bg=self.C["panel"])
        bar.pack(fill="x", padx=18, pady=(18, 10))
        for ico, lbl, val in [
            ("🧠","Model", self._model_name),
            ("📊","Data","5,000 projects"),
            ("📐","Evaluation","ROUGE-L"),
            ("⚡","Device","GPU" if self._gpu!="CPU" else "CPU"),
        ]:
            c = tk.Frame(bar, bg=self.C["border"], padx=14, pady=9)
            c.pack(side="right", padx=6)
            tk.Label(c, text=f"{ico}  {val}", font=("Segoe UI",10,"bold"),
                     bg=self.C["border"], fg=self.C["text"]).pack()
            tk.Label(c, text=lbl, font=("Segoe UI",8),
                     bg=self.C["border"], fg=self.C["subtext"]).pack()

        sf = tk.Frame(p, bg=self.C["card"]); sf.pack(fill="x", padx=70, pady=4)
        for label, cmd, bg, hov in [
            ("1.   Generate data (5,000 projects)",  self._gen_data,    self.C["accent"], self.C["accent_h"]),
            ("2.   Preprocess & clean data",               self._preprocess,  self.C["purple"], self.C["purple_h"]),
            ("3.   Start model training",                    self._train,       self.C["warn"],   self.C["warn_h"]),
            ("4.   Reload model after training",      self._reload_model,self.C["green"],  self.C["green_h"]),
        ]:
            btn = self._btn(sf, label, bg, hov, cmd)
            btn.configure(padx=20, pady=12, anchor="e", justify="right")
            btn.pack(fill="x", pady=5)

        self._lbl(p, "📋  سجل العمليات")
        lw = tk.Frame(p, bg=self.C["border"], padx=1, pady=1)
        lw.pack(fill="both", expand=True, padx=18, pady=(0,14))
        self.log_box = tk.Text(lw, font=("Consolas",10),
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
        tk.Label(p, text=text, font=("Segoe UI",10,"bold"),
                 bg=self.C["card"], fg=self.C["subtext"],
                 anchor="e").pack(fill="x", padx=20, pady=(10,3))

    def _btn(self, parent, text, bg, hover, cmd, fg="white"):
        btn = tk.Button(parent, text=text, font=("Segoe UI",11,"bold"),
                        bg=bg, fg=fg, activebackground=hover,
                        activeforeground="white", relief="flat", bd=0,
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
            self.progress.start(8)
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
        self._set_busy(True, "⏳  Summarizing...")

        def _run():
            try:
                from src import summarizer as sm
                if _DEV_MODE: importlib.reload(sm)
                r = sm.summarize(text)
                self._run_on_ui(self._show_summary, r)
            except FileNotFoundError as e:
                self._run_on_ui(self._show_error, "Model Missing", str(e), "❌  Model not found")
            except Exception as e:
                self._run_on_ui(self._show_error, "Error", str(e), "❌  Error")

        threading.Thread(target=_run, daemon=True).start()

    def _show_summary(self, result):
        summary = result.get("summary", "").strip()
        if not summary:
            self._run_on_ui(self._show_error, "Error", "Model returned no valid summary.", "❌  Error")
            return
        self._last_summary = summary
        self.output_box.delete("1.0","end")
        self.output_box.insert("1.0", summary)
        ratio = max(0, round((1 - result.get("output_len", 0)/max(result.get("input_len", 1),1))*100))
        self.info_var.set(
            f"Input: {result.get('input_len', 0)} chars  →  Summary: {result.get('output_len', 0)} chars  |  Compression: {ratio}%")
        self._finish_busy("✅  Summarized")

    def _show_error(self, title, message, status):
        messagebox.showerror(title, message)
        self._finish_busy(status)

    def _load_file(self):
        if self._busy:
            return
        p = filedialog.askopenfilename(
            filetypes=[("Text files","*.txt"),("All files","*.*")])
        if p:
            try:
                with open(p, encoding="utf-8") as f:
                    self.input_box.delete("1.0","end")
                    self.input_box.insert("1.0", f.read())
                self.status.set("✅  تم تحميل الملف")
            except UnicodeDecodeError:
                messagebox.showerror("Unable to read file", "File is not UTF-8 encoded.")
            except OSError as e:
                messagebox.showerror("Unable to open file", str(e))

    def _clear(self):
        if self._busy:
            return
        self.input_box.delete("1.0","end")
        self.output_box.delete("1.0","end")
        self._last_summary = ""
        self.info_var.set(""); self.status.set("Ready  ✔")

    # ══════════════════════════════════════════════════════
    # Evaluate
    # ══════════════════════════════════════════════════════
    def _transfer_summary(self):
        """ينقل الملخص من تبويب التلخيص مباشرةً."""
        if not self._last_summary:
            messagebox.showinfo("Notice", "Summarize text first from the Summarize tab.")
            return
        self.eval_summary_box.delete("1.0","end")
        self.eval_summary_box.insert("1.0", self._last_summary)

    def _clear_eval(self):
        self.eval_summary_box.delete("1.0","end")
        self.eval_ref_box.delete("1.0","end")
        self._render_eval_empty_state()

    def _render_eval_empty_state(self):
        for w in self.result_frame.winfo_children():
            w.destroy()
        shell = tk.Frame(self.result_frame, bg=self.C["panel"], padx=18, pady=18)
        shell.pack(fill="both", expand=True, padx=18, pady=18)
        tk.Label(shell,
             text="No results yet",
             font=("Segoe UI", 13, "bold"), bg=self.C["panel"],
             fg=self.C["text"]).pack(anchor="e")
        tk.Label(shell,
             text="Enter a summary and click Evaluate Summary to view Field Score and ROUGE-L in one clear panel.",
             font=("Segoe UI", 10), bg=self.C["panel"],
             fg=self.C["subtext"], justify="right", anchor="e").pack(fill="x", pady=(8, 0))

    def _evaluate(self):
        if self._busy: return
        summary = self.eval_summary_box.get("1.0","end").strip()
        if len(summary) < 10:
            messagebox.showwarning("Warning", "Please enter the summary to evaluate.")
            return
        reference = self.eval_ref_box.get("1.0","end").strip()
        self._set_busy(True, "⏳  Evaluating...")

        def _run():
            try:
                from src import evaluator as ev
                if _DEV_MODE: importlib.reload(ev)
                result = ev.evaluate(summary, reference)
                self._run_on_ui(self._show_eval_done, result)
            except Exception as e:
                self._run_on_ui(self._show_error, "Error", str(e), "❌  Evaluation error")

        threading.Thread(target=_run, daemon=True).start()

    def _show_eval_done(self, result):
        self._show_results(result)
        self._finish_busy("✅  Evaluation complete")

    def _show_results(self, result: dict):
        """يرسم لوحة النتائج داخل result_frame."""
        for w in self.result_frame.winfo_children(): w.destroy()

        field  = result["field"]
        rouge  = result["rouge"]
        overall= result["overall"]

        # ── Overall score ────────────────────────────────
        from src import evaluator as ev
        olabel, ocolor = ev.field_label(overall)

        top = tk.Frame(self.result_frame, bg=self.C["card"])
        top.pack(fill="x", pady=(10,6))

        # Gauge circle (canvas)
        cv = tk.Canvas(top, width=110, height=110,
                       bg=self.C["card"], highlightthickness=0)
        cv.pack(side="left", padx=20)
        cv.create_oval(8,8,102,102, outline=self.C["border"], width=8)
        cv.create_arc(8,8,102,102, start=90,
                      extent=-int(3.6*max(0, min(100, overall))),
                      outline=ocolor, width=8, style="arc")
        cv.create_text(55,50, text=f"{overall}%",
                       fill=ocolor, font=("Segoe UI",16,"bold"), anchor="center")
        cv.create_text(55,69, text=olabel,
                       fill=ocolor, font=("Segoe UI",10,"bold"), anchor="center")
        cv.create_text(55,88, text="Overall Score",
                   fill=self.C["subtext"], font=("Segoe UI",8), anchor="center")

        # Score cards
        cards_f = tk.Frame(top, bg=self.C["card"])
        cards_f.pack(side="right", padx=10, fill="x", expand=True)

        # Field Score card
        fl, fc = ev.field_label(field["score"])
        self._score_card(cards_f,
                         f"Field Score: {field['score']}%",
                         f"{field['found']}/{field['total']} حقول مستخرجة",
                         fl, fc)

        # ROUGE card
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

        # ── Fields breakdown ─────────────────────────────
        sep = tk.Frame(self.result_frame, bg=self.C["border"], height=1)
        sep.pack(fill="x", padx=16, pady=6)

        tk.Label(self.result_frame, text="تفاصيل الحقول الاستثمارية",
                 font=("Segoe UI",10,"bold"),
                 bg=self.C["card"], fg=self.C["subtext"],
                 anchor="e").pack(fill="x", padx=18, pady=(2,4))

        grid = tk.Frame(self.result_frame, bg=self.C["card"])
        grid.pack(fill="x", padx=18, pady=(0,10))

        for i, (name, v) in enumerate(field["fields"].items()):
            row = i // 2
            col = i %  2
            cell = tk.Frame(grid, bg=self.C["panel"], padx=10, pady=6)
            cell.grid(row=row, column=col, padx=5, pady=4, sticky="ew")
            grid.columnconfigure(col, weight=1)

            icon  = "✅" if v["found"] else "❌"
            color = self.C["green"] if v["found"] else self.C["warn"]
            match_txt = f'  ←  "{v["match"]}"' if v["match"] else ""

            tk.Label(cell, text=f"{icon}  {name}",
                     font=("Segoe UI",10,"bold"),
                     bg=self.C["panel"], fg=color, anchor="e").pack(fill="x")
            if match_txt:
                tk.Label(cell, text=match_txt,
                         font=("Segoe UI",9),
                         bg=self.C["panel"], fg=self.C["subtext"],
                         anchor="e").pack(fill="x")

    def _score_card(self, parent, title, subtitle, label, color):
        c = tk.Frame(parent, bg=self.C["border"], padx=14, pady=8)
        c.pack(side="right", padx=6)
        tk.Label(c, text=title, font=("Segoe UI",11,"bold"),
                 bg=self.C["border"], fg=color).pack(anchor="e")
        tk.Label(c, text=subtitle, font=("Segoe UI",9),
                 bg=self.C["border"], fg=self.C["subtext"]).pack(anchor="e")
        tk.Label(c, text=label, font=("Segoe UI",9,"bold"),
                 bg=self.C["border"], fg=color).pack(anchor="e")

    # ══════════════════════════════════════════════════════
    # Training
    # ══════════════════════════════════════════════════════
    def _run_script(self, script):
        if self._busy: return
        self._set_busy(True, f"⏳  {script}...")

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
                self._run_on_ui(self._finish_busy, f"{icon}  {script}")
            except Exception as e:
                self._run_on_ui(self._log, f"\n❌  {e}\n")
                self._run_on_ui(self._finish_busy, "❌  Error")
        threading.Thread(target=_w, daemon=True).start()

    def _gen_data(self):   self._run_script("data_generator.py")
    def _preprocess(self): self._run_script("preprocessor.py")

    def _train(self):
        is_gpu = self._gpu != "CPU"
        if messagebox.askyesno("Confirm",
                               f"Train AraT5v2 — 5,000 projects — 5 epochs\n\n"
                               f"Device: {self._gpu}\n"
                               f"Time: {'8–15 min' if is_gpu else '45–90 min'}\n\nContinue?"):
            # Unload model from VRAM to prevent CUDA OOM during training
            try:
                from src import summarizer as sm
                sm.unload_model()
                self._log("ℹ  Freed GPU memory to avoid OOM during training\n")
            except Exception as e:
                self._log(f"⚠️  Failed to free memory: {e}\n")
            self._run_script("model_trainer.py")

    def _reload_model(self):
        if self._busy: return
        self._set_busy(True, "⏳  تحميل...")

        def _w():
            try:
                from src import summarizer as sm
                sm.unload_model(); sm.load_model(force_reload=True)
                self._model_name = "Trained Model"
                self._run_on_ui(self._log, "✅  Trained model loaded\n")
                self._run_on_ui(self._finish_busy, "✅  Model ready")
            except Exception as e:
                self._run_on_ui(self._log, f"❌  {e}\n")
                self._run_on_ui(self._finish_busy, "❌  Failed")
        threading.Thread(target=_w, daemon=True).start()


# ══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    os.chdir(ROOT_DIR)
    root = tk.Tk()
    InvestmentSummarizerApp(root)
    root.mainloop()