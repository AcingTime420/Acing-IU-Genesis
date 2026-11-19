using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Security.AccessControl;
using System.Security.Principal;
using AuthorityCredentialFiles;

namespace AuthorityCredentialFiles.Tests;

public sealed class WindowsFactAttribute : FactAttribute
{
    public WindowsFactAttribute()
    {
        if (!OperatingSystem.IsWindows()) Skip = "Native Windows file/ACL execution required; Linux is not verification.";
    }
}

[SupportedOSPlatform("windows")]
public sealed class NativeWindowsTests : IDisposable
{
    private readonly string directory;
    private string FilePath => Path.Combine(directory, "synthetic.json");
    private const string Fixture = "{\"human\":{\"credential\":\"synthetic-only-not-live\"}}";
    public NativeWindowsTests()
    {
        directory = Path.Combine(Path.GetTempPath(), "genesis-native-acl-" + Guid.NewGuid().ToString("N"));
        new DirectoryInfo(directory).Create(WindowsCredentialFile.PrivateDirectorySecurity());
    }
    public void Dispose() => Directory.Delete(directory, recursive: true);

    [WindowsFact]
    public void CreateAndReadUseProtectedCurrentOwnerAclFromCreation()
    {
        Assert.Equal(10, Environment.Version.Major);
        WindowsCredentialFile.Create(FilePath, Fixture);
        WindowsCredentialFile.Inspect(FilePath);
        Assert.Equal(Fixture, WindowsCredentialFile.Read(FilePath));
        var security = new FileInfo(FilePath).GetAccessControl();
        Assert.True(security.AreAccessRulesProtected);
        using var identity = WindowsIdentity.GetCurrent();
        Assert.Equal(identity.User, security.GetOwner(typeof(SecurityIdentifier)));
    }

    [WindowsFact]
    public void ExistingFileIsNotOverwritten()
    {
        WindowsCredentialFile.Create(FilePath, Fixture);
        Assert.ThrowsAny<IOException>(() => WindowsCredentialFile.Create(FilePath, "{}"));
        Assert.Equal(Fixture, WindowsCredentialFile.Read(FilePath));
    }

    [WindowsFact]
    public void ExtraEveryoneAllowIsRejectedWithoutChangingItsAcl()
    {
        WindowsCredentialFile.Create(FilePath, Fixture);
        var file = new FileInfo(FilePath);
        var security = file.GetAccessControl();
        security.AddAccessRule(new FileSystemAccessRule(new SecurityIdentifier("S-1-1-0"), FileSystemRights.ReadData, AccessControlType.Allow));
        file.SetAccessControl(security);
        var before = file.GetAccessControl().GetSecurityDescriptorSddlForm(AccessControlSections.Access);
        Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Read(FilePath));
        Assert.Equal(before, file.GetAccessControl().GetSecurityDescriptorSddlForm(AccessControlSections.Access));
    }

    [WindowsFact]
    public void AdministratorsAreNotAnImplicitExtraCredentialTrustee()
    {
        WindowsCredentialFile.Create(FilePath, Fixture);
        var file = new FileInfo(FilePath);
        var security = file.GetAccessControl();
        security.AddAccessRule(new FileSystemAccessRule(new SecurityIdentifier("S-1-5-32-544"), FileSystemRights.ReadData, AccessControlType.Allow));
        file.SetAccessControl(security);
        Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Read(FilePath));
    }

    [WindowsFact]
    public void UnprotectedInheritedFileAclIsRejected()
    {
        // Plain creation inherits the parent's ACEs; even trusted inherited access is
        // intentionally rejected so this file's future policy cannot follow parent changes.
        File.WriteAllText(FilePath, Fixture);
        Assert.False(new FileInfo(FilePath).GetAccessControl().AreAccessRulesProtected);
        Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Read(FilePath));
    }

    [WindowsFact]
    public void NullDaclIsRejected()
    {
        WindowsCredentialFile.Create(FilePath, Fixture);
        var file = new FileInfo(FilePath);
        var security = file.GetAccessControl();
        security.SetSecurityDescriptorSddlForm("D:NO_ACCESS_CONTROL", AccessControlSections.Access);
        file.SetAccessControl(security);
        Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Read(FilePath));
    }

    [WindowsFact]
    public void PermissiveParentPreventsCreationBeforeWriting()
    {
        var dir = new DirectoryInfo(directory);
        var security = dir.GetAccessControl();
        security.AddAccessRule(new FileSystemAccessRule(new SecurityIdentifier("S-1-1-0"), FileSystemRights.ReadData, AccessControlType.Allow));
        dir.SetAccessControl(security);
        Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Create(FilePath, Fixture));
        Assert.False(File.Exists(FilePath));
    }

    [WindowsFact]
    public void AlternateStreamsUncAndRelativePathsAreRejected()
    {
        foreach (var path in new[] { FilePath + ":alternate", "relative.json", @"\\server\share\file.json", @"\\?\C:\file.json" })
            Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Create(path, Fixture));
    }

    [WindowsFact]
    public void HardLinkedCredentialsAreRejected()
    {
        WindowsCredentialFile.Create(FilePath, Fixture);
        var link = Path.Combine(directory, "hardlink.json");
        Assert.True(CreateHardLinkW(link, FilePath, IntPtr.Zero), "Native hard-link fixture creation must succeed; do not skip coverage.");
        Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Read(FilePath));
        Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Read(link));
    }

    [WindowsFact]
    public void DirectoryJunctionCannotRedirectCredentialAccess()
    {
        var target = Path.Combine(directory, "target");
        new DirectoryInfo(target).Create(WindowsCredentialFile.PrivateDirectorySecurity());
        var file = Path.Combine(target, "synthetic.json");
        WindowsCredentialFile.Create(file, Fixture);
        var junction = Path.Combine(directory, "junction");
        var info = new ProcessStartInfo("cmd.exe") { UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true };
        foreach (var argument in new[] { "/d", "/c", "mklink", "/J", junction, target }) info.ArgumentList.Add(argument);
        using var process = Process.Start(info)!;
        var stdout = process.StandardOutput.ReadToEndAsync();
        var stderr = process.StandardError.ReadToEndAsync();
        try
        {
            Assert.True(process.WaitForExit(10000), "Junction fixture command timed out.");
            Assert.Equal(0, process.ExitCode);
            Assert.Throws<UnauthorizedAccessException>(() => WindowsCredentialFile.Read(Path.Combine(junction, "synthetic.json")));
        }
        finally
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
            process.WaitForExit();
            Task.WaitAll(stdout, stderr);
            if (Directory.Exists(junction)) Directory.Delete(junction); // remove link, not its target
        }
    }

    [WindowsFact]
    public void ConcurrentCreateHasOneWinnerAndNoOverwrite()
    {
        var success = 0;
        Parallel.For(0, 8, _ =>
        {
            try { WindowsCredentialFile.Create(FilePath, Fixture); Interlocked.Increment(ref success); }
            catch (IOException) { }
        });
        Assert.Equal(1, success);
        Assert.Equal(Fixture, WindowsCredentialFile.Read(FilePath));
    }

    [WindowsFact]
    public void OversizeOrInvalidJsonNeverCreatesAFile()
    {
        Assert.Throws<InvalidDataException>(() => WindowsCredentialFile.Create(FilePath, new string('x', WindowsCredentialFile.MaximumBytes + 1)));
        Assert.ThrowsAny<System.Text.Json.JsonException>(() => WindowsCredentialFile.Create(FilePath, "not-json"));
        Assert.False(File.Exists(FilePath));
    }

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool CreateHardLinkW(string newName, string existingName, IntPtr security);
}
