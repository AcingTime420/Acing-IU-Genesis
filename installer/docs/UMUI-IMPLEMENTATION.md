# Ultra-Modern UI (UMUI) — Implementation details

**Project:** [SuperPat45/UltraModernUI](https://github.com/SuperPat45/UltraModernUI) · [ultramodernui.sourceforge.net](https://ultramodernui.sourceforge.net/)  
**License:** zlib/libpng  
**Target:** NSIS 3 **x86** (also large-string special build)

UMUI is **not** “MUI3.” It is a third-party UI package that ships its own headers, skins, and plugins.

---

## 1. What you get

### Two UI modes

| Include | Look | Notes |
|---------|------|--------|
| `UMUI.nsh` | Full ultra-modern skin | Page backgrounds, skinned buttons, extra pages |
| `MUIEx.nsh` | Classic Modern UI + UMUI extras | Familiar MUI layout + new pages/options |

Official **Basic.nsi** uses:

```nsis
!include "UMUI.nsh"
; optional alternative:
; !include "MUIEx.nsh"
```

### Bundled plugins

| Plugin | Role |
|--------|------|
| **SkinnedControls** | Skins buttons and scrollbars |
| **InstallOptionsEx** | Richer custom pages than InstallOptions |
| **nsArray** | Arrays/maps used by some UMUI features |

These install into the NSIS tree with UMUI; you do not usually `!addplugindir` them manually if UMUI is installed correctly.

### Extra pages (beyond MUI2)

Confirm, Abort, AlternativeStartMenu, AdditionalTasks, Information, Maintenance, Update, SetupType, and related uninstall variants.

---

## 2. Install / build environment

1. Install **NSIS 3 x86**.
2. Install **Ultra-Modern UI 2.x** so files land under the NSIS directory, e.g.:
   - `Contrib\UltraModernUI\`
   - `Docs\UltraModernUI\`
   - `Include\UMUI.nsh`, `MUIEx.nsh`
   - Example scripts under `Examples\UltraModernUI\`
3. Default package install path on Vista+ may be under **ProgramData** so examples compile without admin rights.
4. **Pin the UMUI version** in CI (vendored NSIS+UMUI tree or documented installer version). Do not assume macros stay identical across releases.

---

## 3. Minimal script structure (from official Basic.nsi)

```nsis
Name "My App"
OutFile "Setup.exe"
InstallDir "$PROGRAMFILES\My App"
Unicode True
RequestExecutionLevel admin

!include "UMUI.nsh"

; --- Interface ---------------------------------------------------------------
; !define UMUI_SKIN "SoftRed"     ; optional; see Skins folder
!define MUI_ABORTWARNING
!define MUI_UNABORTWARNING
!define UMUI_PAGEBGIMAGE          ; page background from skin
!define UMUI_UNPAGEBGIMAGE

; --- Pages (order matters) ---------------------------------------------------
!insertmacro MUI_PAGE_LICENSE "${NSISDIR}\Docs\UltraModernUI\License.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Section "Main"
  SetOutPath "$INSTDIR"
  ; File ...
  WriteUninstaller "$INSTDIR\Uninstall.exe"
SectionEnd

Section "Uninstall"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir "$INSTDIR"
SectionEnd
```

**Important:** Many page macros remain **`MUI_PAGE_*`** even when using `UMUI.nsh`. UMUI extends MUI; it does not rename every macro to `UMUI_PAGE_*`. Extra pages use `UMUI_PAGE_*` / `UMUI_UNPAGE_*`.

---

## 4. Skins

```nsis
!define UMUI_SKIN "red"        ; or SoftRed, blue, etc.
```

- Skin folders live under `Contrib\UltraModernUI\Skins\<name>\`.
- **`UMUI_CUSTOM_SKIN` is deprecated** — use `UMUI_SKIN` with your custom skin name/folder.
- Button bitmaps can be set explicitly, e.g. (from HeaderBitmapEx.nsi / MUIEx):

```nsis
!define UMUI_BUTTONIMAGE_BMP "${NSISDIR}\Contrib\UltraModernUI\Skins\blue\Button.bmp"
```

Exact BMP names inside a skin vary; inspect the skin directory or UMUI docs for header, left image, button, page background filenames.

Useful graphics-related defines (commonly used):

| Define | Purpose |
|--------|---------|
| `UMUI_SKIN` | Active skin name |
| `UMUI_PAGEBGIMAGE` / `UMUI_UNPAGEBGIMAGE` | Use skin page backgrounds |
| `UMUI_BUTTONIMAGE_BMP` | Button strip bitmap |
| `MUI_HEADERIMAGE` + `MUI_HEADERIMAGE_BITMAP` | Header (MUIEx / hybrid examples) |

---

## 5. Extra page example — Confirm (from official Confirm.nsi)

```nsis
!include "UMUI.nsh"
!include "WinMessages.nsh"

!define UMUI_SKIN "red"
!define MUI_ABORTWARNING
!define MUI_UNABORTWARNING

Var STARTMENU_FOLDER

!insertmacro MUI_PAGE_LICENSE "..."
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY

!define UMUI_ALTERNATIVESTARTMENUPAGE_SETSHELLVARCONTEXT
!define MUI_STARTMENUPAGE_REGISTRY_ROOT "HKCU"
!define MUI_STARTMENUPAGE_REGISTRY_KEY "Software\MyApp"
!define MUI_STARTMENUPAGE_REGISTRY_VALUENAME "Start Menu Folder"
!insertmacro UMUI_PAGE_ALTERNATIVESTARTMENU "Application" $STARTMENU_FOLDER

!define UMUI_CONFIRMPAGE_TEXTBOX confirm_function
!insertmacro UMUI_PAGE_CONFIRM

!insertmacro MUI_PAGE_INSTFILES

Function confirm_function
  !insertmacro UMUI_CONFIRMPAGE_TEXTBOX_ADDLINE "$(UMUI_TEXT_INSTCONFIRM_TEXTBOX_DESTINATION_LOCATION)"
  !insertmacro UMUI_CONFIRMPAGE_TEXTBOX_ADDLINE "      $INSTDIR"
  !insertmacro UMUI_CONFIRMPAGE_TEXTBOX_ADDLINE ""
  ; ... start menu lines with MUI_STARTMENU_WRITE_BEGIN/END ...
FunctionEnd
```

Pattern: **define page options, then `!insertmacro UMUI_PAGE_*`**.

---

## 6. Mapping MUI2 (Genesis) → UMUI

| Genesis MUI2 | UMUI approach |
|--------------|----------------|
| `!include "MUI2.nsh"` | `!include "UMUI.nsh"` (or `MUIEx.nsh`) |
| `MUI_PAGE_WELCOME` | Still available via MUI-compatible pages; enable BG with `UMUI_PAGEBGIMAGE` |
| `MUI_HEADERIMAGE_BITMAP` | Skin system and/or explicit bitmaps; MUIEx keeps header defines |
| `MUI_WELCOMEFINISHPAGE_BITMAP` | Largely replaced by skin left/page images |
| `MUI_FINISHPAGE_RUN` | Same MUI finish defines typically still work when pages are MUI-compatible |
| `Page custom` + nsDialogs | Supported; UMUI 2.0 documents nsDialogs examples |
| Components / Directory / InstFiles | Keep `MUI_PAGE_*` macros |
| Confirm before install | Add `UMUI_PAGE_CONFIRM` |

---

## 7. Official examples to study

Under `Examples/UltraModernUI/` in the UMUI repo:

| Script | Focus |
|--------|--------|
| **Basic.nsi** | Minimal UMUI install |
| **Confirm.nsi** | Skin + Confirm + AlternativeStartMenu |
| **AdditionalTasks.nsi** | Extra tasks page |
| **Maintenance.nsi** | Repair/modify-style flows |
| **Information.nsi** | Info page (UTF-16 LE / LF text) |
| **MultiLanguage.nsi** | Multiple `MUI_LANGUAGE` |
| **HeaderBitmapEx.nsi** | MUIEx + header + button BMP |
| **NSISUltraModernUI.nsi** | Large showcase |

Always open the example that matches the feature you need; macro names are version-sensitive.

---

## 8. Risks for Acing IU Genesis

| Risk | Mitigation |
|------|------------|
| Extra dependency | Vendor NSIS+UMUI in build image or document exact installer version |
| x86 NSIS focus | Confirm your release pipeline uses the build UMUI supports |
| Macro / skin drift | Pin UMUI 2.0.x; don’t upgrade casually |
| CI complexity | Prefer **MUI2 + branded metro BMPs** unless UMUI is a hard design requirement |
| DPI / scaling | Older forum reports of DPI issues vs stock MUI; test on Win10/11 scaling |

---

## 9. Recommendation

- **Production Genesis installer:** keep **`Acing-IU-Genesis.nsi` (MUI2)**.
- **Experiment:** install UMUI locally, compile official `Basic.nsi` / `Confirm.nsi`, then adapt `Acing-IU-Genesis-UMUI.nsi.example` using the patterns above.
- **Do not** treat UMUI as a drop-in rename of every `MUI_*` define without reading the UMUI docs shipped in `Docs\UltraModernUI\`.

---

## References

- GitHub: https://github.com/SuperPat45/UltraModernUI  
- Home: https://ultramodernui.sourceforge.net/  
- NSIS wiki: https://nsis.sourceforge.io/Ultra-Modern_UI  
- Basic example: `Examples/UltraModernUI/Basic.nsi`  
- Confirm example: `Examples/UltraModernUI/Confirm.nsi`  
