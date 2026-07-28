# MUI2 branding assets

The NSIS script defaults to stock NSIS 3 “metro” bitmaps so it compiles without custom art.

To brand the installer, create these files and point the `!define` lines in `Acing-IU-Genesis.nsi` at them:

| File | Size | Use |
|------|------|-----|
| `header.bmp` | **150 × 57** | Top header on interior pages (`MUI_HEADERIMAGE_BITMAP`) |
| `welcome.bmp` | **164 × 314** | Left sidebar on Welcome + Finish (`MUI_WELCOMEFINISHPAGE_BITMAP`) |
| `../acing-iu-icon.ico` | multi-size 16–256 | Installer + uninstaller icon (`MUI_ICON` / `MUI_UNICON`) |

## Format rules

- BMP only for header/welcome (not PNG/JPEG).
- Prefer **24-bit** BMP; 8-bit OK.
- No RLE compression.
- Design left-side content carefully — MUI may clip edges.
- For `MUI_HEADERIMAGE_RIGHT`, the bitmap sits on the right; leave space for title text on the left.

## Switch script to branded assets

In `Acing-IU-Genesis.nsi`, replace the `${NSISDIR}\Contrib\Graphics\...` paths with:

```nsis
!define MUI_ICON                         "payload\branding\acing-iu-icon.ico"
!define MUI_UNICON                       "payload\branding\acing-iu-icon.ico"
!define MUI_HEADERIMAGE_BITMAP           "payload\branding\mui\header.bmp"
!define MUI_WELCOMEFINISHPAGE_BITMAP     "payload\branding\mui\welcome.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP   "payload\branding\mui\welcome.bmp"
```

## Optional UI defines (already used or available)

```nsis
!define MUI_HEADERIMAGE_RIGHT              ; header image on right
!define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
!define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH
!define MUI_COMPONENTSPAGE_SMALLDESC       ; short descriptions under list
!define MUI_INSTFILESPAGE_COLORS "/windows"
!define MUI_LICENSEPAGE_CHECKBOX
!define MUI_FINISHPAGE_LINK "..."
!define MUI_FINISHPAGE_LINK_LOCATION "https://..."
```

## Custom nsDialogs page

`PagePrereq` / `PagePrereqLeave` are included in the script as an example.
To show it in the wizard, add after the components page macros:

```nsis
Page custom PagePrereq PagePrereqLeave
```

(Place among the other page inserts; order matters.)
