# Acing IU: Genesis — Windows Installer

Packages the Control Center, optional Docker platform stack (Identity + Device Trust + Gateway), and local tooling.

**Two script engines are supported** (same payload):

| Engine | Script | Compiler |
|--------|--------|----------|
| **Inno Setup** (default recommendation) | `Acing-IU-Genesis.iss` | `ISCC.exe` |
| **NSIS** (alternative) | `Acing-IU-Genesis.nsi` | `makensis` |

Run `scripts\prepare-payload.ps1` before either compile.

---

## Comparison: Inno Setup vs NSIS vs others

| Criterion | Inno Setup | NSIS | WiX / MSI |
|-----------|------------|------|-----------|
| License | Free (jsoftware) | zlib/libpng (OSI) | MS-PL / open |
| Script style | INI-like + Pascal `[Code]` | Stack-based assembly-like | XML declarative |
| Learning curve | Low–medium | Medium | High (Windows Installer model) |
| Setup.exe size overhead | ~200–400 KB | ~35–50 KB | MSI + burn bootstrapper |
| UI polish | Strong out of the box | Good with MUI2 | Native Windows Installer UI |
| Silent install | `/SILENT` `/VERYSILENT` | `/S` | `msiexec /qn` |
| Elevation | Built-in | `RequestExecutionLevel admin` | Built-in |
| Corporate GPO / SCCM | EXE (acceptable for many) | EXE | **Preferred** (true MSI) |
| Custom actions | Pascal script | Plugins + `nsExec` | Custom actions / CA DLLs |
| Compression | lzma2 | zlib / bzip2 / lzma | cab / external |
| Best for Acing Genesis | **Primary choice** — matches existing `.iss`, simpler maintenance | Solid alternative if you want smaller stub or NSIS plugins | Only if enterprise MSI is mandatory |

**Recommendation for Genesis:** keep **Inno Setup as primary**. NSIS is provided as a drop-in alternative sharing the same `payload\`. Consider WiX later only if partners require MSI for fleet deployment.

---

## Build — Inno Setup

1. Install [Inno Setup 6](https://jrsoftware.org/isinfo.php).
2. Prepare payload and compile:

```powershell
powershell -ExecutionPolicy Bypass -File installer\scripts\prepare-payload.ps1
& "C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\Acing-IU-Genesis.iss
```

3. Output: `installer\output\Acing-IU-Genesis-Setup-v0.1.0.exe`

## Build — NSIS

1. Install [NSIS 3](https://nsis.sourceforge.io/) (includes `makensis`).
2. Prepare payload and compile:

```powershell
powershell -ExecutionPolicy Bypass -File installer\scripts\prepare-payload.ps1
& "C:\Program Files (x86)\NSIS\makensis.exe" installer\Acing-IU-Genesis.nsi
```

3. Output: `installer\output\Acing-IU-Genesis-Setup-v0.1.0.exe`  
   (same name — build one or the other per release, or change `OutFile` / `OutputBaseFilename` to differentiate).

### NSIS features mirrored from Inno

- 64-bit only, admin elevation  
- Components: Core (required), Docker stack (default on), Desktop shortcut  
- Start Menu shortcuts + optional desktop icon  
- Post-install `generate-token.ps1` via `nsExec`  
- Finish page: launch Control Center + show install notes  
- Uninstall: best-effort `docker compose down`, remove files + registry  

---

## Payload layout (shared)

```
installer/
├── Acing-IU-Genesis.iss          # Inno
├── Acing-IU-Genesis.nsi          # NSIS
├── scripts/prepare-payload.ps1
├── output/
└── payload/
    ├── application/              # Launch + Control Center
    ├── branding/                 # add acing-iu-icon.ico for release
    ├── documentation/
    ├── services/mcp-server/scripts/generate-token.ps1
    └── platform/                 # compose + backend sources
```

## Install behaviour

| Step | Action |
|------|--------|
| Files | `%ProgramFiles%\Acing IU\Genesis` (override with directory page or `/D=` / `/DIR=`) |
| Token | Runs `generate-token.ps1` (local MCP token; may seed `platform\.env` JWT key) |
| Optional | Docker Compose platform stack |
| Launch | Control Center: start/stop stack, smoke test, docs, logs |

## Other alternatives (not packaged here)

| Tool | When to use |
|------|-------------|
| **WiX Toolset 5** | Enterprise MSI, Group Policy, AppLocker-friendly deployment |
| **MSIX** | Store / modern packaging, clean uninstall, but weak for Docker-heavy ops tools |
| **Squirrel.Windows / Velopack** | Auto-update focused desktop apps (less ideal for Docker control centers) |
| **Advanced Installer / InstallShield** | Commercial GUIs if budget allows and MSI is required fast |

## Notes

- Docker Desktop is a separate prerequisite for the platform stack.  
- Add `payload\branding\acing-iu-icon.ico` before branded releases.  
- Do not ship placeholder JWT/DB passwords; the token script rewrites `CHANGE_ME_*` when possible.
