using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;

class Launcher
{
    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    static void Main()
    {
        string targetUrl = "http://localhost:8080";
        string bravePath = FindBravePath();
        
        if (string.IsNullOrEmpty(bravePath))
        {
            // Fallback to default system browser if Brave is not installed
            Process.Start(targetUrl);
            return;
        }

        bool isBraveRunningWithWindows = false;
        Process[] processes = Process.GetProcessesByName("brave");
        foreach (var proc in processes)
        {
            // Check if the process has a valid window handle and is visible
            if (proc.MainWindowHandle != IntPtr.Zero && IsWindowVisible(proc.MainWindowHandle))
            {
                isBraveRunningWithWindows = true;
                break;
            }
        }

        if (isBraveRunningWithWindows)
        {
            // Brave is running with open tabs: launch URL in a new tab
            Process.Start(bravePath, targetUrl);
        }
        else
        {
            // Brave has 0 active windows: launch URL in a brand new window
            Process.Start(bravePath, "--new-window " + targetUrl);
        }
    }

    static string FindBravePath()
    {
        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);

        string[] possiblePaths = new string[]
        {
            Path.Combine(localAppData, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
            Path.Combine(programFiles, @"BraveSoftware\Brave-Browser\Application\brave.exe"),
            Path.Combine(programFilesX86, @"BraveSoftware\Brave-Browser\Application\brave.exe")
        };

        foreach (var path in possiblePaths)
        {
            if (File.Exists(path))
                return path;
        }

        return null;
    }
}
