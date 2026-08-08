# NSIS UI layers: MUI → MUI2 → “Modern UI 3”

## Short answer

**There is no official NSIS “Modern UI 3” (MUI3).**

| Name | Status | Include |
|------|--------|---------|
| **Modern UI (MUI 1.x)** | Legacy | `MUI.nsh` |
| **Modern UI 2 (MUI2)** | **Current official** (ships with NSIS 3) | `MUI2.nsh` |
| **Ultra-Modern UI (UMUI)** | Third-party “modern” skin for NSIS 3 | `UMUI.nsh` (separate download) |
| **Graphical Installer / skins** | Commercial / community | Various |

Genesis already uses **MUI2** (`Acing-IU-Genesis.nsi`). That is the correct long-term official baseline.

If someone said “migrate to Modern UI 3,” they usually mean one of:

1. Finish **MUI → MUI2** (if still on MUI 1.8), or  
2. Move from stock MUI2 to a **more modern look** (metro bitmaps, or **Ultra-Modern UI**).

---

## Official path: MUI 1.8 → MUI2

From the [MUI2 documentation](https://nsis.sourceforge.io/Docs/Modern%20UI%202/Readme.html):

1. Replace `!include "MUI.nsh"` with `!include "MUI2.nsh"`.
2. InstallOptions helpers moved out of MUI — use `nsDialogs` for custom pages (Genesis already does this for the optional prerequisites page).
3. Page macros stay the same style: `!insertmacro MUI_PAGE_WELCOME`, etc.
4. Uninstall pages: prefer `MUI_UNPAGE_*` (Genesis already uses full uninstaller MUI flow).

Genesis **does not need** this migration; it is already on MUI2.

---

## Looking more modern on MUI2 (no third-party UI)

Keep MUI2 and only change graphics/defines (already wired in Genesis):

```nsis
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP   "${NSISDIR}\Contrib\Graphics\Header\nsis3-metro.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\nsis3-metro.bmp"
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install-blue.ico"
```

Replace those paths with branded `header.bmp` (150×57), `welcome.bmp` (164×314), and `.ico` when art is ready — see `payload/branding/mui/README.md`.

---

## Optional: Ultra-Modern UI (closest to a “MUI3” experience)

[Ultra-Modern UI](https://nsis.sourceforge.io/Ultra-Modern_UI) / [ultramodernui.sourceforge.net](https://ultramodernui.sourceforge.net/) is a **separate** interface package for NSIS 3 x86. It is not part of stock NSIS.

### Install UMUI

1. Download Ultra-Modern UI for NSIS 3.
2. Copy its `Contrib` files into your NSIS installation (or use a portable NSIS tree).
3. Scripts typically `!include "UMUI.nsh"` instead of `MUI2.nsh`.

### Conceptual mapping (MUI2 → UMUI)

| MUI2 | UMUI (typical) |
|------|----------------|
| `!include "MUI2.nsh"` | `!include "UMUI.nsh"` |
| `MUI_PAGE_WELCOME` | `UMUI_PAGE_WELCOME` / skin-specific pages |
| `MUI_HEADERIMAGE_BITMAP` | Skin bitmap set / theme folder |
| `MUI_FINISHPAGE_RUN` | Equivalent finish actions (check UMUI docs for exact macros) |
| `nsDialogs` custom pages | Still usable; verify page order with UMUI |

UMUI macros and theme file names **differ by version**. Always match the script to the UMUI release you installed. A minimal skeleton is in `Acing-IU-Genesis-UMUI.nsi.example` — treat it as a starting point, not a drop-in until UMUI is installed and macros are verified.

### Tradeoffs

| | MUI2 (recommended) | Ultra-Modern UI |
|--|--------------------|-----------------|
| Ships with NSIS | Yes | No (extra install) |
| CI reproducibility | High | Must vendor UMUI into the build image |
| Maintenance | Official | Community / slower updates |
| Look | Classic wizard + metro BMPs | Closer to “recent” commercial installers |
| Risk | Low | Medium (API drift between UMUI versions) |

**Recommendation for Acing IU Genesis:** stay on **MUI2 + branded metro assets**. Only adopt UMUI if product design explicitly requires that visual style and you can pin UMUI version in the Windows build pipeline.

---

## What not to do

- Do not search for `MUI3.nsh` in stock NSIS — it does not exist.
- Do not confuse **Material UI v3→v4** (web React library) with NSIS.
- Do not mix `MUI.nsh` and `MUI2.nsh` in the same script.

---

## Genesis file map

| File | Role |
|------|------|
| `Acing-IU-Genesis.nsi` | Production installer — **MUI2** |
| `Acing-IU-Genesis-UMUI.nsi.example` | Optional UMUI experiment skeleton |
| `payload/branding/mui/README.md` | BMP/ICO sizes for MUI2 branding |
| `docs/MUI-MIGRATION.md` | This document |
EOF

cat > /home/workdir/artifacts/installer/Acing-IU-Genesis-UMUI.nsi.example << 'EOF'
; =============================================================================
; EXAMPLE ONLY — Ultra-Modern UI skeleton for Acing IU: Genesis
; Requires: NSIS 3 x86 + Ultra-Modern UI installed into the NSIS tree
; https://nsis.sourceforge.io/Ultra-Modern_UI
;
; This is NOT compiled by default. Copy to Acing-IU-Genesis-UMUI.nsi and
; adjust macros to match your UMUI version after installing it.
; =============================================================================

!define PRODUCT_NAME    "Acing IU: Genesis"
!define PRODUCT_VERSION "0.1.0"
!define PRODUCT_PUBLISHER "Acing IU"
!define APP_EXE "Launch-Acing-IU-Genesis.cmd"

Unicode True
SetCompressor /SOLID lzma
RequestExecutionLevel admin
Name "${PRODUCT_NAME}"
OutFile "output\Acing-IU-Genesis-Setup-UMUI-v${PRODUCT_VERSION}.exe"
InstallDir "$PROGRAMFILES64\Acing IU\Genesis"
ShowInstDetails show

; --- UMUI (third-party) ------------------------------------------------------
; After installing Ultra-Modern UI, uncomment and fix paths:
;   !include "UMUI.nsh"
;
; Stock MUI2 fallback so this example still documents structure:
!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "x64.nsh"

!define MUI_ABORTWARNING
!define MUI_ICON   "${NSISDIR}\Contrib\Graphics\Icons\modern-install-blue.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall-blue.ico"

; UMUI uses skins/themes — equivalent intent:
;   !define UMUI_SKIN "blue"          ; example; real names depend on UMUI package
;   !define UMUI_PAGEBGIMAGE
;   !define UMUI_LEFTIMAGE

!define MUI_WELCOMEPAGE_TITLE "Welcome to ${PRODUCT_NAME}"
!define MUI_WELCOMEPAGE_TEXT "UMUI example skeleton — replace includes with UMUI when ready."
!define MUI_FINISHPAGE_RUN "$INSTDIR\application\${APP_EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Open Control Center"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_LANGUAGE "English"

Section "Core Application (required)" SecCore
  SectionIn RO
  SetOutPath "$INSTDIR\application"
  File /r "payload\application\*.*"
  SetOutPath "$INSTDIR\documentation"
  File /r "payload\documentation\*.*"
  SetOutPath "$INSTDIR\services"
  File /r "payload\services\*.*"
  WriteUninstaller "$INSTDIR\uninst.exe"
SectionEnd

Section "Docker Platform Stack" SecDocker
  SetOutPath "$INSTDIR\platform"
  File /r "payload\platform\*.*"
SectionEnd

Section Uninstall
  RMDir /r "$INSTDIR"
SectionEnd

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_ICONSTOP "64-bit Windows required."
    Abort
  ${EndIf}
FunctionEnd
EOF

echo "Migration docs written"
ls -la /home/workdir/artifacts/installer/docs/ /home/workdir/artifacts/installer/*.nsi* 2>/dev/null
