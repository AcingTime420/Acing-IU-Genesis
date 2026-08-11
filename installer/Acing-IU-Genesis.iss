; =============================================================================
; Acing IU: Genesis — Inno Setup installer
; Build with Inno Setup 6+ on Windows:
;   ISCC.exe installer\Acing-IU-Genesis.iss
; Or open in the Inno Setup IDE and compile.
;
; Prerequisites before compile:
;   1. Run installer\scripts\prepare-payload.ps1  (copies backend/infra docs + launchers)
;   2. Place branding assets under payload\branding\
; =============================================================================

#define MyAppName "Acing IU: Genesis"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "Acing IU"
#define MyAppURL "https://github.com/Acing-IU-Matrix/Acing-IU"
#define MyAppExeName "Launch-Acing-IU-Genesis.cmd"

[Setup]
AppId={{70A4E8AE-221D-4D01-A74D-AC1F0BA15A6C}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\Acing IU\Genesis
; Prefer Program Files for standard installs; override with /DIR= if needed
; Legacy path D:\Acing IU\Genesis remains valid via command-line /DIR=
DefaultGroupName=Acing IU: Genesis
DisableProgramGroupPage=yes
LicenseFile=
OutputDir=output
OutputBaseFilename=Acing-IU-Genesis-Setup-v{#MyAppVersion}
SetupIconFile=
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
UninstallDisplayIcon={app}\branding\acing-iu-icon.ico
SetupLogging=yes
MinVersion=10.0
InfoBeforeFile=payload\documentation\INSTALL-NOTES.txt

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional icons:"; Flags: unchecked
Name: "dockerstack"; Description: "Include Docker Compose platform stack scripts (recommended)"; GroupDescription: "Components:"; Flags: checkedonce

[Files]
; Application launchers and control scripts
Source: "payload\application\*"; DestDir: "{app}\application"; Flags: ignoreversion recursesubdirs createallsubdirs

; Branding
Source: "payload\branding\*"; DestDir: "{app}\branding"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; MCP / local security helper scripts
Source: "payload\services\*"; DestDir: "{app}\services"; Flags: ignoreversion recursesubdirs createallsubdirs

; Documentation shipped with the installer
Source: "payload\documentation\*"; DestDir: "{app}\documentation"; Flags: ignoreversion recursesubdirs createallsubdirs

; Platform stack (compose + env example) — optional task
Source: "payload\platform\*"; DestDir: "{app}\platform"; Flags: ignoreversion recursesubdirs createallsubdirs; Tasks: dockerstack

[Dirs]
Name: "{app}\logs"
Name: "{app}\backups"
Name: "{app}\data\knowledge-base"
Name: "{app}\data\research"
Name: "{app}\data\decisions"
Name: "{app}\data\timeline"
Name: "{app}\documentation"
Name: "{app}\platform"

[Icons]
Name: "{group}\Acing IU: Genesis"; Filename: "{app}\application\{#MyAppExeName}"; WorkingDir: "{app}\application"
Name: "{group}\Start Platform Stack (Docker)"; Filename: "{app}\application\Start-Platform-Stack.cmd"; WorkingDir: "{app}\platform"; Tasks: dockerstack
Name: "{group}\Uninstall Acing IU: Genesis"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Acing IU: Genesis"; Filename: "{app}\application\{#MyAppExeName}"; WorkingDir: "{app}\application"; Tasks: desktopicon

[Run]
; Generate a local machine token used by MCP / local tooling
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\services\mcp-server\scripts\generate-token.ps1"""; \
  WorkingDir: "{app}\services\mcp-server"; \
  StatusMsg: "Generating a local security token..."; \
  Flags: runhidden waituntilterminated

; Open Control Center after install
Filename: "{app}\application\{#MyAppExeName}"; \
  Description: "Open Acing IU: Genesis Control Center"; \
  Flags: postinstall nowait skipifsilent

[UninstallDelete]
Type: filesandordirs; Name: "{app}\logs"
Type: files; Name: "{app}\services\mcp-server\.local-token"

[Code]
function InitializeSetup(): Boolean;
begin
  Result := True;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;
end;
