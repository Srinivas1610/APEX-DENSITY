@echo off
echo Compiling high-speed C# launcher using built-in system .NET compiler...
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:winexe /out:"%~dp0Launcher.exe" "%~dp0Launcher.cs"
if %errorlevel% equ 0 (
    echo SUCCESS! Launcher.exe generated successfully at "%~dp0Launcher.exe".
) else (
    echo FAILED to compile launcher.
)
pause
