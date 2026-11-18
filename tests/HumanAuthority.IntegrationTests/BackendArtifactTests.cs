using System.Reflection;
using System.Runtime.InteropServices;

namespace HumanAuthority.IntegrationTests;

public sealed class BackendArtifactTests
{
    [Fact]
    public void TestsActuallyRunOnDotnet10()
    {
        Assert.Equal(10, Environment.Version.Major);
        Assert.StartsWith(".NET 10.", RuntimeInformation.FrameworkDescription);
    }

    [Theory]
    [InlineData("net8.0", "8.0.0")]
    [InlineData("net10.0", "8.0.0")]
    public void StaleRuntimeArtifactCannotBeLaunched(string tfm, string version)
    {
        var directory = Path.Combine(Path.GetTempPath(), $"authority-runtime-{Guid.NewGuid():N}");
        try
        {
            Directory.CreateDirectory(directory);
            var artifact = Path.Combine(directory, "HumanAuthority.dll");
            File.WriteAllText(artifact, "");
            File.WriteAllText(Path.ChangeExtension(artifact, ".deps.json"), "{}");
            File.WriteAllText(Path.ChangeExtension(artifact, ".runtimeconfig.json"),
                System.Text.Json.JsonSerializer.Serialize(new { runtimeOptions = new {
                    tfm, frameworks = new[] { new { name = "Microsoft.AspNetCore.App", version } }
                }}));
            var error = Assert.Throws<InvalidOperationException>(() =>
                AuthorityFixture.ValidateBackendArtifact(artifact, "Release"));
            Assert.Contains("no older-runtime fallback", error.Message);
        }
        finally { Directory.Delete(directory, recursive: true); }
    }

    [Fact]
    public void ArtifactPathMatchesTestBuildConfiguration()
    {
        var assembly = typeof(AuthorityFixture).Assembly;
        var configuration = assembly.GetCustomAttribute<AssemblyConfigurationAttribute>()!.Configuration;
        var artifact = assembly.GetCustomAttributes<AssemblyMetadataAttribute>()
            .Single(a => a.Key == "HumanAuthorityArtifact").Value!;
        var normalizedArtifact = Path.GetFullPath(artifact);
        Assert.Contains($"{Path.DirectorySeparatorChar}{configuration}{Path.DirectorySeparatorChar}", normalizedArtifact);
        AuthorityFixture.ValidateBackendArtifact(artifact, configuration);
    }

    [Fact]
    public void MissingReleaseArtifactCannotFallBackToDebug()
    {
        var directory = Path.Combine(Path.GetTempPath(), $"authority-artifacts-{Guid.NewGuid():N}");
        try
        {
            Directory.CreateDirectory(Path.Combine(directory, "Debug"));
            File.WriteAllText(Path.Combine(directory, "Debug", "HumanAuthority.dll"), "stale");
            var missing = Path.Combine(directory, "Release", "HumanAuthority.dll");
            var error = Assert.Throws<InvalidOperationException>(
                () => AuthorityFixture.ValidateBackendArtifact(missing, "Release"));
            Assert.Contains(missing, error.Message);
            Assert.Contains("--configuration Release", error.Message);
        }
        finally { Directory.Delete(directory, recursive: true); }
    }

    [Theory]
    [InlineData(".deps.json")]
    [InlineData(".runtimeconfig.json")]
    public void MissingRuntimeFilesFailClearly(string extension)
    {
        var directory = Path.Combine(Path.GetTempPath(), $"authority-artifacts-{Guid.NewGuid():N}");
        try
        {
            Directory.CreateDirectory(directory);
            var artifact = Path.Combine(directory, "HumanAuthority.dll");
            File.WriteAllText(artifact, "");
            File.WriteAllText(Path.ChangeExtension(artifact, ".deps.json"), "{}");
            File.WriteAllText(Path.ChangeExtension(artifact, ".runtimeconfig.json"), "{}");
            var missing = Path.ChangeExtension(artifact, extension);
            File.Delete(missing);
            var error = Assert.Throws<InvalidOperationException>(
                () => AuthorityFixture.ValidateBackendArtifact(artifact, "Release"));
            Assert.Contains(missing, error.Message);
        }
        finally { Directory.Delete(directory, recursive: true); }
    }
}
