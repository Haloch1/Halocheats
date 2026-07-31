@echo off
rem Sends F13 globally three times, five seconds apart.
rem Use this file as the Stream Deck button's only action.
for /L %%I in (1,1,3) do (
    powershell.exe -NoProfile -WindowStyle Hidden -Command "Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public static class KeyPress { [DllImport(\"user32.dll\")] public static extern void keybd_event(byte key, byte scan, uint flags, UIntPtr extra); }'; [KeyPress]::keybd_event(0x7C,0,0,[UIntPtr]::Zero); [KeyPress]::keybd_event(0x7C,0,2,[UIntPtr]::Zero)"
    if %%I LSS 3 powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5"
)
