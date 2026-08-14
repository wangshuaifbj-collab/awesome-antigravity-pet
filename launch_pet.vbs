Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "H:\software\awesome-codex-pet-main"
WshShell.Run "pythonw -m antigravity_pet start", 0, False
