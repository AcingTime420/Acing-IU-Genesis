using System.Diagnostics;
using System.Reflection;

namespace AuthorityCredentialFiles.Tests;

public sealed class PlatformRefusalTests
{
    [Fact]
    public async Task NonWindowsExecutableRefusesBeforeOpeningCredentialPath()
    {
        if (OperatingSystem.IsWindows()) return; // native ACL suite is the Windows coverage
        var artifact = typeof(PlatformRefusalTests).Assembly.GetCustomAttributes<AssemblyMetadataAttribute>()
            .Single(a => a.Key == "CredentialHelperArtifact").Value!;
        Assert.True(File.Exists(artifact));
        var info = new ProcessStartInfo("dotnet") { RedirectStandardOutput = true,
            RedirectStandardError = true, UseShellExecute = false };
        info.ArgumentList.Add(artifact); info.ArgumentList.Add("read"); info.ArgumentList.Add(@"C:\not-opened.json");
        using var process = Process.Start(info)!;
        var stdout = process.StandardOutput.ReadToEndAsync(); var stderr = process.StandardError.ReadToEndAsync();
        try
        {
            await process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
            Assert.Equal(78, process.ExitCode);
            Assert.Empty(await stdout);
            Assert.Contains("requires Windows", await stderr);
        }
        finally { if (!process.HasExited) { process.Kill(entireProcessTree: true); await process.WaitForExitAsync(); } }
    }
}
