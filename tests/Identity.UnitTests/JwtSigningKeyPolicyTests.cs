using AcingIU.SharedKernel;
using Xunit;

namespace AcingIU.Identity.UnitTests;

public sealed class JwtSigningKeyPolicyTests
{
    [Fact]
    public void Placeholder_key_is_rejected_outside_development()
    {
        var exception = Assert.Throws<InvalidOperationException>(() =>
            JwtSigningKeyPolicy.EnsureAllowed(
                "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS",
                "Production"));

        Assert.Contains("non-placeholder", exception.Message);
    }

    [Fact]
    public void Placeholder_key_is_allowed_in_development()
    {
        JwtSigningKeyPolicy.EnsureAllowed(
            "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS",
            "Development");
    }

    [Fact]
    public void Short_key_is_rejected_in_all_environments()
    {
        var exception = Assert.Throws<InvalidOperationException>(() =>
            JwtSigningKeyPolicy.EnsureAllowed("short-key", "Development"));

        Assert.Contains("at least 32 characters", exception.Message);
    }

    [Fact]
    public void Strong_key_is_accepted_outside_development()
    {
        JwtSigningKeyPolicy.EnsureAllowed(
            "this_is_a_non_placeholder_signing_key_for_validation_1234",
            "Production");
    }
}
