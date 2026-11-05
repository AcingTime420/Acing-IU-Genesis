using Xunit;

namespace AcingIU.DeviceTrust.PostgresIntegrationTests;

public sealed class DatabaseTargetGuardTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("not a connection string")]
    [InlineData("Host=127.0.0.1;Database=acing_iu")]
    [InlineData("Host=127.0.0.1;Database=_test")]
    [InlineData("Host=remote.example;Database=genesis_test")]
    [InlineData("Host=localhost.evil.example;Database=genesis_test")]
    [InlineData("Host=127.0.0.1,remote.example;Database=genesis_test")]
    [InlineData("Host=localhost,127.0.0.1;Database=genesis_test")]
    [InlineData("Host=localhost:5432;Database=genesis_test")]
    [InlineData("Host=/var/run/postgresql;Database=genesis_test")]
    [InlineData("Database=genesis_test")]
    [InlineData("Server=remote.example;Initial Catalog=genesis_test")]
    [InlineData("Server=127.0.0.1;Initial Catalog=genesis_test")]
    [InlineData("Host=localhost;Host=remote.example;Database=genesis_test")]
    public void UnsafeOrMissingTargetFailsBeforeConnection(string? value) =>
        Assert.Throws<InvalidOperationException>(() => PostgresFixture.GuardDatabase(value, "1"));

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("0")]
    public void ExplicitClusterConfirmationIsRequired(string? confirmation) =>
        Assert.Throws<InvalidOperationException>(() => PostgresFixture.GuardDatabase(
            "Host=127.0.0.1;Database=genesis_test", confirmation));

    [Theory]
    [InlineData("Host=127.0.0.1;Database=genesis_test", "127.0.0.1")]
    [InlineData("Host=localhost;Database=genesis_test", "localhost")]
    [InlineData("Host=::1;Database=genesis_test", "::1")]
    [InlineData("Server=127.0.0.1;Database=genesis_test", "127.0.0.1")]
    [InlineData("Host=remote.example;Host=localhost;Database=genesis_test", "localhost")]
    public void ValidExplicitTargetsFollowDriverParsing(string value, string host)
    {
        var parsed = PostgresFixture.GuardDatabase(value, "1");
        Assert.Equal(host, parsed.Host);
        Assert.Equal("genesis_test", parsed.Database);
    }

    [Fact]
    public void ParserErrorsDoNotExposeConfigurationValues()
    {
        var error = Assert.Throws<InvalidOperationException>(() =>
            PostgresFixture.GuardDatabase("Password=PRIVATE_TEST_MARKER;Unknown Setting=x", "1"));
        Assert.DoesNotContain("PRIVATE_TEST_MARKER", error.ToString());
        Assert.Null(error.InnerException);
    }
}
