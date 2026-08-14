# -*- coding: utf-8 -*-
"""
Internationalization (i18n) engine for Antigravity Desktop Pet.
Automatically adapts to OS locale (Chinese vs English/Global) or custom user setting.
"""

import os
import locale
from typing import Dict, Any

# Translation dictionary
TRANSLATIONS: Dict[str, Dict[str, str]] = {
    "zh": {
        "app_title": "Antigravity 桌面智能伴侣",
        "ready": "{name} 已就绪！✨",
        "switched": "已切换: {name} 💖",
        "wave_greeting": "嗨~ ✨",
        "task_completed": "✨ 任务已完成！请查收~ 🚀",
        "thinking": "构思最优方案中... 💡",
        "coding": "代码编写中... 💻",
        "failed": "呜呜... 遇到Bug报错啦 ❌",
        "drag_start": "起飞咯~ 🐾",
        "drag_end": "安全着陆！🚀",
        "static_on": "已开启专注静止模式 🤫",
        "static_off": "已恢复生动微呼吸 ✨",
        "farewell": "下次见咯~ 👋",
        
        # Menus
        "menu_featured": "🌟 精选热门角色",
        "menu_all": "📚 全量宠物图鉴 (193款)",
        "menu_demos": "🎬 动作演示",
        "menu_lang": "🌐 界面语言 (Language)",
        "menu_static_toggle_on": "🤫 切换为专注绝对静止",
        "menu_static_toggle_off": "✨ 切换为动态呼吸待机",
        "menu_exit": "❌ 退出伴侣",
        
        # Demos
        "demo_waving": "👋 招手打招呼 (Waving)",
        "demo_jumping": "🎉 跳跃欢庆 (Jumping)",
        "demo_waiting": "🧠 思考构思 (Waiting)",
        "demo_review": "💻 专注审查 (Review)",
        "demo_running": "🏃 奔跑移动 (Running)",
        "demo_failed": "⚠️ 异常报错 (Failed)",
        
        "demo_msg_waving": "嗨嗨！我是你的桌面伴侣~ ✨",
        "demo_msg_jumping": "太棒了！任务圆满交付！🎊",
        "demo_msg_waiting": "正在探索最优架构... 💡",
        "demo_msg_review": "键盘敲烂，代码飞速成型！💻",
        "demo_msg_running": "快马加鞭赶工中~ 💨",
        "demo_msg_failed": "呜呜... 遇到Bug报错啦 ❌",
    },
    "en": {
        "app_title": "Antigravity Desktop Companion",
        "ready": "{name} is ready! ✨",
        "switched": "Switched to: {name} 💖",
        "wave_greeting": "Hi there! ✨",
        "task_completed": "Task complete! 🚀",
        "thinking": "Thinking... 💡",
        "coding": "Writing code... 💻",
        "failed": "Oops... Ran into an error ❌",
        "drag_start": "Taking off~ 🐾",
        "drag_end": "Landed safely! 🚀",
        "static_on": "Static mode ON 🤫",
        "static_off": "Breathing mode ON ✨",
        "farewell": "See you next time! 👋",
        
        # Menus
        "menu_featured": "🌟 Featured Characters",
        "menu_all": "📚 Full Pet Catalog (193 pets)",
        "menu_demos": "🎬 Action Demos",
        "menu_lang": "🌐 Language (语言)",
        "menu_static_toggle_on": "🤫 Switch to Static Idle",
        "menu_static_toggle_off": "✨ Switch to Lively Breathing",
        "menu_exit": "❌ Exit Companion",
        
        # Demos
        "demo_waving": "👋 Wave Greeting (Waving)",
        "demo_jumping": "🎉 Jump & Celebrate (Jumping)",
        "demo_waiting": "🧠 Thinking / Waiting",
        "demo_review": "💻 Coding / Review",
        "demo_running": "🏃 Running / Locomotion",
        "demo_failed": "⚠️ Failed / Error",
        
        "demo_msg_waving": "Hello! I'm your desktop pet companion~ ✨",
        "demo_msg_jumping": "Awesome! Task successfully delivered! 🎊",
        "demo_msg_waiting": "Exploring the best architecture... 💡",
        "demo_msg_review": "Typing away, crafting code! 💻",
        "demo_msg_running": "On the move, rushing work~ 💨",
        "demo_msg_failed": "Oops, ran into a little bug 🔧",
    }
}


def detect_system_language() -> str:
    """Detects system language, defaults to zh for Chinese environments and en for others."""
    try:
        sys_lang = locale.getlocale()[0] or ""
        if "zh" in sys_lang.lower() or "chinese" in sys_lang.lower():
            return "zh"
    except Exception:
        pass
    
    # Check env vars
    lang_env = os.getenv("LANG", "") + os.getenv("LC_ALL", "")
    if "zh" in lang_env.lower():
        return "zh"

    return "en"


class I18n:
    """Localization manager instance."""

    def __init__(self, current_lang: str = "auto"):
        self.setting = current_lang
        self.lang = detect_system_language() if current_lang == "auto" else current_lang

    def set_language(self, lang_code: str) -> None:
        self.setting = lang_code
        self.lang = detect_system_language() if lang_code == "auto" else lang_code

    def t(self, key: str, **kwargs) -> str:
        """Translates a key with optional formatting arguments."""
        lang_dict = TRANSLATIONS.get(self.lang, TRANSLATIONS["en"])
        val = lang_dict.get(key, TRANSLATIONS["en"].get(key, key))
        if kwargs:
            try:
                return val.format(**kwargs)
            except Exception:
                pass
        return val


# Global default instance
i18n = I18n()
