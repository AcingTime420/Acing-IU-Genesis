using System.Net;

namespace HumanAuthority;

/// <summary>Own the prototype's listener configuration; never rely on a loopback default.</summary>
internal static class LocalAuthorityListener
{
    public static void Configure(WebApplicationBuilder builder)
    {
        // Port-only settings imply wildcard listeners. Reject rather than silently ignore them.
        if (!string.IsNullOrWhiteSpace(builder.Configuration["http_ports"]) ||
            !string.IsNullOrWhiteSpace(builder.Configuration["https_ports"]) ||
            builder.Configuration.GetSection("Kestrel").GetChildren().Any())
            throw Rejected();

        var urls = builder.Configuration["urls"] ?? "http://127.0.0.1:5088";
        var endpoints = new List<IPEndPoint>();
        foreach (var value in urls.Split(';'))
        {
            if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) ||
                uri.Scheme != Uri.UriSchemeHttp || uri.UserInfo.Length != 0 ||
                uri.AbsolutePath != "/" || uri.Query.Length != 0 || uri.Fragment.Length != 0 ||
                !IPAddress.TryParse(uri.Host.Trim('[', ']'), out var address) ||
                !IPAddress.IsLoopback(address) || uri.Port is < 1 or > 65535)
                throw Rejected();
            // Avoid names/DNS and alternate numeric encodings: configuration is literal and reviewable.
            var authority = address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6
                ? $"[{address}]:{uri.Port}" : $"{address}:{uri.Port}";
            if (!string.Equals(value, $"http://{authority}", StringComparison.Ordinal) &&
                !string.Equals(value, $"http://{authority}/", StringComparison.Ordinal))
                throw Rejected();
            endpoints.Add(new IPEndPoint(address, uri.Port));
        }

        builder.WebHost.ConfigureKestrel(options =>
        {
            // Replace the reloadable default Kestrel configuration. Later appsettings reloads must
            // not introduce additional endpoints after the startup validation above.
            options.Configure(new ConfigurationBuilder().Build(), reloadOnChange: false);
            foreach (var endpoint in endpoints.Distinct())
                options.Listen(endpoint.Address, endpoint.Port);
            options.Limits.MaxRequestBodySize = 7 * 1024 * 1024;
        });
    }

    private static LocalAuthorityListenerConfigurationException Rejected() => new();
}

internal sealed class LocalAuthorityListenerConfigurationException() : InvalidOperationException(
    "Local authority listener configuration rejected: use explicit HTTP loopback URLs only; " +
    "port-only and Kestrel overrides are forbidden.");
