; =============================================================================
; Acing IU: Genesis — NSIS installer with MUI2 customization
; Requires: NSIS 3.08+ (MUI2 ships with NSIS)
;
; Build:
;   1. powershell -File installer\scripts\prepare-payload.ps1
;   2. (Optional) drop branded BMPs/ICOs into installer\payload\branding\mui\
;   3. makensis installer\Acing-IU-Genesis.nsi
; =============================================================================

!define PRODUCT_NAME        "Acing IU: Genesis"
!define PRODUCT_VERSION     "0.1.0"
!define PRODUCT_PUBLISHER   "Acing IU"
!define PRODUCT_WEB_SITE    "https://github.com/Acing-IU-Matrix/Acing-IU"
!define PRODUCT_DIR_REGKEY  "Software\Microsoft\Windows\CurrentVersion\App Paths\Launch-Acing-IU-Genesis.cmd"
!define PRODUCT_UNINST_KEY  "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
!define PRODUCT_UNINST_ROOT_KEY "HKLM"

!define APP_EXE             "Launch-Acing-IU-Genesis.cmd"

; Branding asset paths (relative to this .nsi file)
!define BRANDING_DIR        "payload\branding\mui"
!define BRANDING_ICON       "payload\branding\acing-iu-icon.ico"

Unicode True
SetCompressor /SOLID lzma
RequestExecutionLevel admin
Name "${PRODUCT_NAME}"
OutFile "output\Acing-IU-Genesis-Setup-v${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\Acing IU\Genesis"
InstallDirRegKey HKLM "${PRODUCT_DIR_REGKEY}" ""
ShowInstDetails show
ShowUnInstDetails show
BrandingText "${PRODUCT_PUBLISHER} — Zero Trust Control Plane"

; =============================================================================
; Modern UI 2 — customization
; Docs: https://nsis.sourceforge.io/Docs/Modern%20UI%202/Readme.html
; =============================================================================
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"
!include "Sections.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"

; -----------------------------------------------------------------------------
; Global UI behaviour
; -----------------------------------------------------------------------------
!define MUI_ABORTWARNING
!define MUI_ABORTWARNING_TEXT "Are you sure you want to quit ${PRODUCT_NAME} Setup?"
!define MUI_ABORTWARNING_CANCEL_DEFAULT

; Installer + uninstaller icons (falls back to NSIS defaults if missing)
!define MUI_ICON   "${NSISDIR}\Contrib\Graphics\Icons\modern-install-blue.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall-blue.ico"

; -----------------------------------------------------------------------------
; Header image (top bar on interior pages) — 150×57 BMP, 24-bit or 8-bit
; Left side of the header; right side shows page title/subtitle
; -----------------------------------------------------------------------------
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP             "${NSISDIR}\Contrib\Graphics\Header\nsis3-metro.bmp"
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
!define MUI_HEADERIMAGE_RIGHT
; Uncomment for RTL builds: !define MUI_HEADERIMAGE_BITMAP_RTL "..."

; -----------------------------------------------------------------------------
; Welcome / Finish sidebar (left panel) — 164×314 BMP
; -----------------------------------------------------------------------------
!define MUI_WELCOMEFINISHPAGE_BITMAP         "${NSISDIR}\Contrib\Graphics\Wizard\nsis3-metro.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_UNWELCOMEFINISHPAGE_BITMAP       "${NSISDIR}\Contrib\Graphics\Wizard\nsis3-metro.bmp"

; -----------------------------------------------------------------------------
; Component page options
; -----------------------------------------------------------------------------
!define MUI_COMPONENTSPAGE_SMALLDESC
; Alternative: !define MUI_COMPONENTSPAGE_NODESC

; -----------------------------------------------------------------------------
; Directory page
; -----------------------------------------------------------------------------
!define MUI_DIRECTORYPAGE_TEXT_TOP \
  "Setup will install ${PRODUCT_NAME} in the following folder.$\r$\n$\r$\n\
Docker Desktop is required for the platform stack component."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Install location"

; -----------------------------------------------------------------------------
; Install files page — show details by default
; -----------------------------------------------------------------------------
!define MUI_INSTFILESPAGE_COLORS "/windows"   ; use system colors; or "FFFFFF 000000"
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_UNFINISHPAGE_NOAUTOCLOSE

; -----------------------------------------------------------------------------
; Welcome page copy
; -----------------------------------------------------------------------------
!define MUI_WELCOMEPAGE_TITLE "Welcome to ${PRODUCT_NAME} Setup"
!define MUI_WELCOMEPAGE_TITLE_3LINES
!define MUI_WELCOMEPAGE_TEXT \
  "This wizard will install ${PRODUCT_NAME} v${PRODUCT_VERSION}.$\r$\n$\r$\n\
${PRODUCT_NAME} is the secure control plane for trusted device intelligence \
and Zero Trust operations.$\r$\n$\r$\n\
Optional components include the Docker platform stack \
(Identity, Device Trust, API Gateway).$\r$\n$\r$\n\
Click Next to continue."

; -----------------------------------------------------------------------------
; Finish page — run app, readme, optional link
; -----------------------------------------------------------------------------
!define MUI_FINISHPAGE_TITLE "Installation Complete"
!define MUI_FINISHPAGE_TITLE_3LINES
!define MUI_FINISHPAGE_TEXT \
  "${PRODUCT_NAME} has been installed on your computer.$\r$\n$\r$\n\
Use the Control Center to start the platform stack and run health checks.$\r$\n$\r$\n\
Click Finish to close this wizard."

!define MUI_FINISHPAGE_RUN "$INSTDIR\application\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Open Acing IU: Genesis Control Center"
!define MUI_FINISHPAGE_RUN_NOTCHECKED

!define MUI_FINISHPAGE_SHOWREADME "$INSTDIR\documentation\INSTALL-NOTES.txt"
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Show installation notes"
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED

!define MUI_FINISHPAGE_LINK "Acing IU on GitHub"
!define MUI_FINISHPAGE_LINK_LOCATION "${PRODUCT_WEB_SITE}"

; -----------------------------------------------------------------------------
; License page
; -----------------------------------------------------------------------------
!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_LICENSEPAGE_CHECKBOX_TEXT "I accept the installation notes and platform terms"
!define MUI_LICENSEPAGE_BUTTON "Next >"

; -----------------------------------------------------------------------------
; Page order
; -----------------------------------------------------------------------------
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "payload\documentation\INSTALL-NOTES.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

; =============================================================================
; Custom page example — “Platform prerequisites” (nsDialogs)
; Shown after components, before directory (optional educational page)
; =============================================================================
Var PrereqDialog
Var PrereqLabel

Function PagePrereq
  !insertmacro MUI_HEADER_TEXT "Platform prerequisites" "Docker Desktop is required for the stack"
  nsDialogs::Create 1018
  Pop $PrereqDialog
  ${If} $PrereqDialog == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 80u \
    "The Docker Platform Stack component needs:$\r$\n$\r$\n\
• Windows 10/11 x64 with virtualization enabled$\r$\n\
• Docker Desktop for Windows (Linux containers)$\r$\n\
• Ports 8080, 5432, 6379 available on localhost$\r$\n$\r$\n\
You can install Core Application only and add the stack later."
  Pop $PrereqLabel

  nsDialogs::Show
FunctionEnd

Function PagePrereqLeave
  ; No validation required — informational only
FunctionEnd

; To enable the custom page, uncomment these two lines and place them in the
; page order above (e.g. after COMPONENTS, before DIRECTORY):
;   Page custom PagePrereq PagePrereqLeave
; (Must be after !insertmacro MUI_LANGUAGE or use MUI_PAGE_CUSTOMFUNCTION_*)

; =============================================================================
; Sections
; =============================================================================
Section "Core Application (required)" SecCore
  SectionIn RO
  SetOutPath "$INSTDIR"

  SetOutPath "$INSTDIR\application"
  File /r "payload\application\*.*"

  SetOutPath "$INSTDIR\branding"
  File /nonfatal /r "payload\branding\*.*"

  SetOutPath "$INSTDIR\documentation"
  File /r "payload\documentation\*.*"

  SetOutPath "$INSTDIR\services"
  File /r "payload\services\*.*"

  CreateDirectory "$INSTDIR\logs"
  CreateDirectory "$INSTDIR\backups"
  CreateDirectory "$INSTDIR\data\knowledge-base"
  CreateDirectory "$INSTDIR\data\research"
  CreateDirectory "$INSTDIR\data\decisions"
  CreateDirectory "$INSTDIR\data\timeline"

  CreateDirectory "$SMPROGRAMS\Acing IU: Genesis"
  CreateShortCut "$SMPROGRAMS\Acing IU: Genesis\Acing IU Genesis.lnk" \
    "$INSTDIR\application\${APP_EXE}"
  CreateShortCut "$SMPROGRAMS\Acing IU: Genesis\Uninstall.lnk" \
    "$INSTDIR\uninst.exe"

  WriteRegStr HKLM "${PRODUCT_DIR_REGKEY}" "" "$INSTDIR\application\${APP_EXE}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayName" "$(^Name)"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "UninstallString" "$INSTDIR\uninst.exe"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoModify" 1
  WriteRegDWORD ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}" "NoRepair" 1

  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

Section "Docker Platform Stack (recommended)" SecDocker
  SetOutPath "$INSTDIR\platform"
  File /r "payload\platform\*.*"

  CreateShortCut "$SMPROGRAMS\Acing IU: Genesis\Start Platform Stack.lnk" \
    "$INSTDIR\application\Start-Platform-Stack.cmd"
SectionEnd

Section "Desktop Shortcut" SecDesktop
  CreateShortCut "$DESKTOP\Acing IU Genesis.lnk" \
    "$INSTDIR\application\${APP_EXE}"
SectionEnd

Section -Post
  DetailPrint "Generating local security token..."
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\services\mcp-server\scripts\generate-token.ps1"'
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} \
    "Control Center, documentation, and local security tooling. Required."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDocker} \
    "PostgreSQL, Redis, Nginx gateway, Identity API, Device Trust API via Docker Compose."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop} \
    "Place a shortcut on the desktop."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

Section Uninstall
  IfFileExists "$INSTDIR\platform\docker-compose.yml" 0 +3
    nsExec::ExecToLog 'docker compose -f "$INSTDIR\platform\docker-compose.yml" down'
    Pop $0

  Delete "$DESKTOP\Acing IU Genesis.lnk"
  RMDir /r "$SMPROGRAMS\Acing IU: Genesis"
  Delete "$INSTDIR\uninst.exe"
  Delete "$INSTDIR\services\mcp-server\.local-token"
  RMDir /r "$INSTDIR\logs"
  RMDir /r "$INSTDIR\application"
  RMDir /r "$INSTDIR\branding"
  RMDir /r "$INSTDIR\documentation"
  RMDir /r "$INSTDIR\services"
  RMDir /r "$INSTDIR\platform"
  RMDir /r "$INSTDIR\data"
  RMDir /r "$INSTDIR\backups"
  RMDir "$INSTDIR"

  DeleteRegKey ${PRODUCT_UNINST_ROOT_KEY} "${PRODUCT_UNINST_KEY}"
  DeleteRegKey HKLM "${PRODUCT_DIR_REGKEY}"
SectionEnd

Function .onInit
  ${If} ${RunningX64}
    SetRegView 64
  ${Else}
    MessageBox MB_ICONSTOP "64-bit Windows is required for ${PRODUCT_NAME}."
    Abort
  ${EndIf}

  SectionSetFlags ${SecDocker} ${SF_SELECTED}

  ; If branded icon is missing, NSIS still compiles when using /nonfatal patterns
  ; for File; MUI_ICON missing file can fail — ensure placeholder or default:
  IfFileExists "${BRANDING_ICON}" +3 0
    ; Leave MUI_ICON as-is; ship a real .ico for release builds
    Nop
FunctionEnd
