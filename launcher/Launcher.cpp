#include <windows.h>
#include <tlhelp32.h>
#include <string>
#include <shlobj.h>

// Checks if Brave Browser is currently running with any visible windows
bool IsBraveRunningWithWindows() {
    HWND hwnd = FindWindowA("Chrome_WidgetWin_1", NULL);
    while (hwnd) {
        char className[256];
        GetClassNameA(hwnd, className, sizeof(className));
        if (strcmp(className, "Chrome_WidgetWin_1") == 0) {
            DWORD pid;
            GetWindowThreadProcessId(hwnd, &pid);
            
            HANDLE hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pid);
            if (hProcess) {
                char path[MAX_PATH];
                DWORD size = sizeof(path);
                if (QueryFullProcessImageNameA(hProcess, 0, path, &size)) {
                    std::string processName(path);
                    if (processName.find("brave.exe") != std::string::npos) {
                        if (IsWindowVisible(hwnd)) {
                            CloseHandle(hProcess);
                            return true;
                        }
                    }
                }
                CloseHandle(hProcess);
            }
        }
        hwnd = FindWindowExA(NULL, hwnd, "Chrome_WidgetWin_1", NULL);
    }
    return false;
}

// Find local path of brave.exe
std::string FindBravePath() {
    char localAppData[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localAppData);
    
    char programFiles[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_PROGRAM_FILES, NULL, 0, programFiles);
    
    char programFilesX86[MAX_PATH];
    SHGetFolderPathA(NULL, CSIDL_PROGRAM_FILESX86, NULL, 0, programFilesX86);

    std::string path1 = std::string(localAppData) + "\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
    std::string path2 = std::string(programFiles) + "\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";
    std::string path3 = std::string(programFilesX86) + "\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";

    if (GetFileAttributesA(path1.c_str()) != INVALID_FILE_ATTRIBUTES) return path1;
    if (GetFileAttributesA(path2.c_str()) != INVALID_FILE_ATTRIBUTES) return path2;
    if (GetFileAttributesA(path3.c_str()) != INVALID_FILE_ATTRIBUTES) return path3;

    return "";
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    std::string bravePath = FindBravePath();
    std::string url = "http://localhost:8080";
    
    if (bravePath.empty()) {
        // Fallback to default browser
        ShellExecuteA(NULL, "open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
        return 0;
    }

    if (IsBraveRunningWithWindows()) {
        // Open url inside a new tab in the existing browser window
        ShellExecuteA(NULL, "open", bravePath.c_str(), url.c_str(), NULL, SW_SHOWNORMAL);
    } else {
        // Launch a brand new Brave browser window loaded with custom app
        std::string args = "--new-window " + url;
        ShellExecuteA(NULL, "open", bravePath.c_str(), args.c_str(), NULL, SW_SHOWNORMAL);
    }
    return 0;
}
