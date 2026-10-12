/* ============================================================================
   165START.exe — launcher portable untuk 165 START
   ----------------------------------------------------------------------------
   Logik (sama seperti versi asal yang terbukti):
   1. Kalau ada index.html + three.min.js SEBELAH exe → gunakan fail itu
      (hasil ubah-suai pengguna ikut serta).
   2. Kalau tidak, ekstrak salinan game TERTANAM ke %LocalAppData%\165START\
      dan gunakan itu.
   3. Luncurkan Edge/Chrome dalam mod --app (tetingkap sendiri, 1366x860).
   4. Kalau tiada Edge/Chrome, buka dengan pelayar lalai (ShellExecute).
   ============================================================================ */
#include <windows.h>
#include <shellapi.h>
#include <wchar.h>

extern const unsigned char  PAYLOAD_HTML[];
extern const unsigned int   PAYLOAD_HTML_LEN;
extern const unsigned char  PAYLOAD_JS[];
extern const unsigned int   PAYLOAD_JS_LEN;

static int tulisFail(const wchar_t* laluan, const unsigned char* data, unsigned int panjang){
  HANDLE h = CreateFileW(laluan, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
  if(h == INVALID_HANDLE_VALUE) return 0;
  DWORD ditulis = 0;
  BOOL ok = WriteFile(h, data, panjang, &ditulis, NULL);
  CloseHandle(h);
  return ok && ditulis == panjang;
}

int main(void){
  wchar_t exeDir[MAX_PATH], temp[MAX_PATH];
  wchar_t laluanHtml[MAX_PATH], laluanJs[MAX_PATH];
  wchar_t url[1200], arahan[2400];

  /* 1. folder exe semasa */
  GetModuleFileNameW(NULL, exeDir, MAX_PATH);
  wchar_t* slash = wcsrchr(exeDir, L'\\');
  if(slash) *slash = L'\0';

  /* 2. keutamaan: fail luaran sebelah exe */
  swprintf(laluanHtml, MAX_PATH, L"%s\\index.html", exeDir);
  swprintf(laluanJs,  MAX_PATH, L"%s\\three.min.js", exeDir);
  int luaran = (GetFileAttributesW(laluanHtml) != INVALID_FILE_ATTRIBUTES) &&
               (GetFileAttributesW(laluanJs)  != INVALID_FILE_ATTRIBUTES);

  if(!luaran){
    /* 3. ekstrak salinan tertanam ke %LocalAppData%\165START */
    if(!GetEnvironmentVariableW(L"LocalAppData", temp, MAX_PATH)){
      MessageBoxW(NULL, L"Gagal menyiapkan file game.", L"165 START", MB_ICONERROR);
      return 1;
    }
    wchar_t folder[MAX_PATH];
    swprintf(folder, MAX_PATH, L"%s\\165START", temp);
    CreateDirectoryW(folder, NULL);
    swprintf(laluanHtml, MAX_PATH, L"%s\\index.html", folder);
    swprintf(laluanJs,  MAX_PATH, L"%s\\three.min.js", folder);
    if(!tulisFail(laluanHtml, PAYLOAD_HTML, PAYLOAD_HTML_LEN) ||
       !tulisFail(laluanJs,  PAYLOAD_JS,   PAYLOAD_JS_LEN)){
      MessageBoxW(NULL,
        L"Gagal menyiapkan file game.\nCoba jalankan 165START.exe dari folder sendiri.",
        L"165 START", MB_ICONERROR);
      return 1;
    }
  }

  /* 4. URL file:/// dengan tanda condong betul */
  swprintf(url, 1200, L"file:///%s", laluanHtml);
  for(wchar_t* p = url; *p; p++){ if(*p == L'\\') *p = L'/'; }

  /* 5. cari Edge atau Chrome */
  const wchar_t* kunci[2]  = { L"ProgramFiles", L"ProgramFiles(x86)" };
  const wchar_t* relatif[4] = {
    L"\\Microsoft\\Edge\\Application\\msedge.exe",
    L"\\Google\\Chrome\\Application\\chrome.exe",
    L"\\Microsoft\\Edge\\Application\\msedge.exe",
    L"\\Google\\Chrome\\Application\\chrome.exe"
  };
  wchar_t pelayar[MAX_PATH]; pelayar[0] = L'\0';
  for(int k = 0; k < 2 && !pelayar[0]; k++){
    if(!GetEnvironmentVariableW(kunci[k], temp, MAX_PATH)) continue;
    for(int r = 0; r < 2 && !pelayar[0]; r++){
      wchar_t calon[MAX_PATH];
      swprintf(calon, MAX_PATH, L"%s%s", temp, relatif[k*2 + r]);
      if(GetFileAttributesW(calon) != INVALID_FILE_ATTRIBUTES){
        wcscpy(pelayar, calon);
      }
    }
  }

  if(pelayar[0]){
    swprintf(arahan, 2400, L"\"%s\" --app=\"%s\" --window-size=1366,860", pelayar, url);
    STARTUPINFOW si; ZeroMemory(&si, sizeof(si)); si.cb = sizeof(si);
    PROCESS_INFORMATION pi; ZeroMemory(&pi, sizeof(pi));
    if(CreateProcessW(NULL, arahan, NULL, NULL, FALSE, 0, NULL, NULL, &si, &pi)){
      CloseHandle(pi.hThread); CloseHandle(pi.hProcess);
      return 0;
    }
  }

  /* 6. fallback: pelayar lalai */
  ShellExecuteW(NULL, L"open", url, NULL, NULL, SW_SHOWNORMAL);
  return 0;
}
