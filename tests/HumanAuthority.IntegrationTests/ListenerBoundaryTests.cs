using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Reflection;

namespace HumanAuthority.IntegrationTests;

public sealed class ListenerBoundaryTests
{
    [Theory]
    [InlineData("ASPNETCORE_URLS", "http://0.0.0.0:5088")]
    [InlineData("ASPNETCORE_URLS", "http://[::]:5088")]
    [InlineData("ASPNETCORE_URLS", "http://*:5088")]
    [InlineData("ASPNETCORE_URLS", "http://localhost:5088")]
    [InlineData("ASPNETCORE_URLS", "http://127.0.0.1:5088;http://192.0.2.1:5089")]
    [InlineData("ASPNETCORE_HTTP_PORTS", "5088")]
    [InlineData("ASPNETCORE_HTTPS_PORTS", "5443")]
    [InlineData("Kestrel__Endpoints__Public__Url", "http://0.0.0.0:5088")]
    [InlineData("Kestrel__Endpoints__Local__Url", "http://127.0.0.1:5088")]
    public async Task UnsafeOrAlternativeEndpointConfigurationExitsBeforeListening(string key, string value)
    {
        using var process = Start(key, value);
        var stdout = process.StandardOutput.ReadToEndAsync();
        var stderr = process.StandardError.ReadToEndAsync();
        try
        {
            await process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
            Assert.Equal(78, process.ExitCode);
            Assert.Contains("Local authority listener configuration rejected", await stderr);
            Assert.DoesNotContain("Now listening", await stdout);
        }
        finally { if (!process.HasExited) { process.Kill(entireProcessTree: true); await process.WaitForExitAsync(); } }
    }

    [Fact]
    public async Task CommandLineWildcardCannotOverrideSafeEnvironment()
    {
        using var process = Start("ASPNETCORE_URLS", "http://127.0.0.1:5088", "--urls", "http://+:5088");
        var stdout = process.StandardOutput.ReadToEndAsync();
        var stderr = process.StandardError.ReadToEndAsync();
        try
        {
            await process.WaitForExitAsync().WaitAsync(TimeSpan.FromSeconds(10));
            Assert.Equal(78, process.ExitCode);
            Assert.Contains("Local authority listener configuration rejected", await stderr);
            Assert.DoesNotContain("Now listening", await stdout);
        }
        finally { if (!process.HasExited) { process.Kill(entireProcessTree: true); await process.WaitForExitAsync(); } }
    }

    [Fact]
    public async Task ExplicitLoopbackStartsWithoutDatabaseAndFailsReadinessClosed()
    {
        var probe = new TcpListener(IPAddress.Loopback, 0);
        probe.Start();
        var port = ((IPEndPoint)probe.LocalEndpoint).Port;
        probe.Stop();
        using var process = Start("ASPNETCORE_URLS", $"http://127.0.0.1:{port}");
        var stdout = process.StandardOutput.ReadToEndAsync();
        var stderr = process.StandardError.ReadToEndAsync();
        try
        {
            using var http = new HttpClient { Timeout = TimeSpan.FromMilliseconds(500) };
            HttpResponseMessage? response = null;
            for (var attempt = 0; attempt < 100 && !process.HasExited; attempt++)
            {
                try { response = await http.GetAsync($"http://127.0.0.1:{port}/health/ready"); break; }
                catch (HttpRequestException) { }
                catch (TaskCanceledException) { }
                await Task.Delay(50);
            }
            Assert.NotNull(response);
            using (response) Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        }
        finally
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
            await process.WaitForExitAsync();
            await Task.WhenAll(stdout, stderr);
        }
    }

    private static Process Start(string key, string value, params string[] arguments)
    {
        var assembly = typeof(AuthorityFixture).Assembly;
        var artifact = assembly.GetCustomAttributes<AssemblyMetadataAttribute>()
            .Single(a => a.Key == "HumanAuthorityArtifact").Value!;
        var configuration = assembly.GetCustomAttribute<AssemblyConfigurationAttribute>()!.Configuration;
        AuthorityFixture.ValidateBackendArtifact(artifact, configuration);
        var info = new ProcessStartInfo("dotnet") { RedirectStandardOutput = true,
            RedirectStandardError = true, UseShellExecute = false,
            WorkingDirectory = Path.GetDirectoryName(Path.GetFullPath(artifact))! };
        foreach (var existing in info.Environment.Keys.ToArray())
            if (existing.StartsWith("ASPNETCORE_", StringComparison.OrdinalIgnoreCase) ||
                existing.StartsWith("Kestrel", StringComparison.OrdinalIgnoreCase) ||
                existing.StartsWith("ConnectionStrings", StringComparison.OrdinalIgnoreCase) ||
                existing is "DOTNET_URLS" or "URLS" or "HTTP_PORTS" or "HTTPS_PORTS")
                info.Environment.Remove(existing);
        info.Environment["ASPNETCORE_ENVIRONMENT"] = "Test";
        info.Environment["DOTNET_ROLL_FORWARD"] = "LatestPatch";
        info.Environment[key] = value;
        info.ArgumentList.Add(artifact);
        foreach (var argument in arguments) info.ArgumentList.Add(argument);
        return Process.Start(info)!;
    }
}
