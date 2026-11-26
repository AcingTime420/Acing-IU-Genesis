namespace HumanAuthority.IntegrationTests;

public sealed class DatabaseGuardTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("Host=127.0.0.1;Database=genesis")]
    [InlineData("Host=remote.example;Database=genesis_test")]
    [InlineData("Host=/var/run/postgresql/other;Database=genesis_test")]
    [InlineData("Host=localhost,remote.example;Database=genesis_test")]
    public void UnsafeOrMissingDatabaseFailsRatherThanSkipping(string? connectionString) =>
        Assert.Throws<InvalidOperationException>(() => AuthorityFixture.GuardDatabase(connectionString));

    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("localhost")]
    [InlineData("::1")]
    [InlineData("/var/run/postgresql")]
    public void OnlyExplicitLocalIsolatedDatabasesPass(string host) =>
        Assert.Equal("genesis_test", AuthorityFixture.GuardDatabase($"Host={host};Database=genesis_test").Database);
}
