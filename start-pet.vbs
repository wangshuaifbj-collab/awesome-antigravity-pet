' ==========================================================
' Antigravity 桌面宠物一键无黑框静默启动器
' 双击此文件即可直接启动桌面小伴侣并恢复自动唤醒
' ==========================================================
Set WshShell = CreateObject("WScript.Shell")
strCurrentDir = WshShell.CurrentDirectory

' 静默启动 pythonw (隐藏一切黑框窗口)
WshShell.Run "pythonw -m antigravity_pet enable", 0, False
