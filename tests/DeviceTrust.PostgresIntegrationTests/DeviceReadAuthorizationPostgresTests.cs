using AcingIU.DeviceTrust.Api.Data;
using AcingIU.DeviceTrust.Api.Models;
using AcingIU.DeviceTrust.Api.Services;
using Xunit;

namespace AcingIU.DeviceTrust.PostgresIntegrationTests;

public sealed class DeviceReadAuthorizationPostgresTests(PostgresFixture database) : IClassFixture<PostgresFixture>
{
    [Fact]
    public async Task Owner_can_read_owned_device()
    {
        var actor = Guid.NewGuid();
        var hw = $"READ-OWNER-{Guid.NewGuid():N}";
        try
        {
            await database.SeedUserAsync(actor);
            var expectedDevice = await database.SeedDeviceAsync(hw, actor);
            var result = await CreateService().GetDeviceForCallerAsync(hw, actor, false, null);
            Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
            Assert.Equal(expectedDevice, result.Device!.DeviceId);
        }
        finally
        {
            await database.CleanupAsync(actor, hw);
        }
    }

    [Fact]
    public async Task Non_owner_is_denied_and_audited()
    {
        var actor = Guid.NewGuid();
        var owner = Guid.NewGuid();
        var hw = $"READ-NONOWNER-{Guid.NewGuid():N}";
        try
        {
            await database.SeedUserAsync(actor);
            await database.SeedUserAsync(owner);
            await database.SeedDeviceAsync(hw, owner);
            var result = await CreateService().GetDeviceForCallerAsync(hw, actor, false, "non-owner");
            Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
            Assert.Null(result.Device);
            Assert.Equal(1, await CountAuditAsync(actor));
        }
        finally
        {
            await database.CleanupAsync(actor, hw);
            await database.DeleteUserAsync(owner);
        }
    }

    [Fact]
    public async Task Unknown_device_is_denied_without_creating_a_row()
    {
        var actor = Guid.NewGuid();
        var hw = $"READ-UNKNOWN-{Guid.NewGuid():N}";
        try
        {
            await database.SeedUserAsync(actor);
            var result = await CreateService().GetDeviceForCallerAsync(hw, actor, false, "unknown");
            Assert.Equal(DeviceAccessOutcome.NotFound, result.Outcome);
            Assert.Null(result.Device);
            Assert.False(await DeviceExistsAsync(hw));
            Assert.Equal(1, await CountAuditAsync(actor));
        }
        finally
        {
            await database.CleanupAsync(actor, hw);
        }
    }

    [Theory]
    [InlineData("Admin")]
    [InlineData("Operator")]
    public async Task Privileged_caller_can_read_another_users_device(string role)
    {
        var actor = Guid.NewGuid();
        var owner = Guid.NewGuid();
        var hw = $"READ-{role.ToUpperInvariant()}-{Guid.NewGuid():N}";
        try
        {
            await database.SeedUserAsync(actor);
            await database.SeedUserAsync(owner);
            var expectedDevice = await database.SeedDeviceAsync(hw, owner);
            var result = await CreateService().GetDeviceForCallerAsync(hw, actor, true, role);
            Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
            Assert.Equal(expectedDevice, result.Device!.DeviceId);
        }
        finally
        {
            await database.CleanupAsync(actor, hw);
            await database.DeleteUserAsync(owner);
        }
    }

    [Fact]
    public async Task Admin_can_read_unowned_device()
    {
        var actor = Guid.NewGuid();
        var hw = $"READ-UNOWNED-{Guid.NewGuid():N}";
        try
        {
            await database.SeedUserAsync(actor);
            var expectedDevice = await database.SeedDeviceAsync(hw, null);
            var result = await CreateService().GetDeviceForCallerAsync(hw, actor, true, "admin-unowned");
            Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
            Assert.Equal(expectedDevice, result.Device!.DeviceId);
        }
        finally
        {
            await database.CleanupAsync(actor, hw);
        }
    }

    [Fact]
    public async Task Owner_can_update_enrolled_device_and_success_is_audited()
    {
        var actor = Guid.NewGuid();
        var hw = $"WRITE-OWNER-{Guid.NewGuid():N}";
        try
        {
            await database.SeedUserAsync(actor);
            await database.SeedDeviceAsync(hw, actor);
            var result = await CreateService().SubmitTelemetryAsync(Telemetry(hw), actor, false, "owner-write");
            Assert.Equal(DeviceAccessOutcome.Allowed, result.Outcome);
            Assert.Equal(100, result.Device!.TrustScore);
            Assert.Equal(1, await CountAuditAsync(actor));
        }
        finally
        {
            await database.CleanupAsync(actor, hw);
        }
    }

    [Fact]
    public async Task Cross_owner_and_unknown_telemetry_are_rejected_without_enrollment()
    {
        var actor = Guid.NewGuid();
        var owner = Guid.NewGuid();
        var hw = $"WRITE-OTHER-{Guid.NewGuid():N}";
        var unknown = $"WRITE-UNKNOWN-{Guid.NewGuid():N}";
        try
        {
            await database.SeedUserAsync(actor);
            await database.SeedUserAsync(owner);
            await database.SeedDeviceAsync(hw, owner);
            var service = CreateService();
            Assert.Equal(DeviceAccessOutcome.NotFound,
                (await service.SubmitTelemetryAsync(Telemetry(hw), actor, false, "cross-owner")).Outcome);
            Assert.Equal(90, await database.ReadTrustScoreAsync(hw));
            Assert.Equal(DeviceAccessOutcome.NotFound,
                (await service.SubmitTelemetryAsync(Telemetry(unknown), actor, false, "unknown")).Outcome);
            Assert.False(await DeviceExistsAsync(unknown));
        }
        finally
        {
            await database.CleanupAsync(actor, hw, unknown);
            await database.DeleteUserAsync(owner);
        }
    }

    [Fact]
    public async Task Required_success_audit_failure_rolls_back_telemetry()
    {
        var actor = Guid.NewGuid();
        var hw = $"WRITE-AUDIT-FAIL-{Guid.NewGuid():N}";
        var suffix = Guid.NewGuid().ToString("N");
        var functionName = $"fail_audit_{suffix}";
        var triggerName = $"fail_audit_trigger_{suffix}";
        try
        {
            await database.SeedUserAsync(actor);
            await database.SeedDeviceAsync(hw, actor);
            await database.CreateAuditFailureTriggerAsync(functionName, triggerName, actor);
            await Assert.ThrowsAsync<Npgsql.PostgresException>(() =>
                CreateService().SubmitTelemetryAsync(Telemetry(hw), actor, false, "audit-failure"));
            Assert.Equal(90, await database.ReadTrustScoreAsync(hw));
        }
        finally
        {
            await database.DropAuditFailureTriggerAsync(functionName, triggerName);
            await database.CleanupAsync(actor, hw);
        }
    }

    private TrustService CreateService() =>
        new(new DeviceRepository(new TestDbConnectionFactory(database.ConnectionString)), new TrustScoreEngine());

    private static TelemetrySubmitRequest Telemetry(string hw) => new()
    {
        HwIdentifier = hw,
        SocModel = "test-soc",
        SelinuxStatus = "Enforcing",
        BootloaderLocked = true,
        PartitionsUnmodified = true,
        KnoxWarrantyFuseIntact = true
    };

    private async Task<long> CountAuditAsync(Guid actor)
    {
        await using var connection = database.CreateConnection();
        await connection.OpenAsync();
        await using var command = new Npgsql.NpgsqlCommand(
            "SELECT count(*) FROM security_audit_logs WHERE actor = @actor", connection);
        command.Parameters.AddWithValue("actor", actor.ToString("D"));
        return (long)(await command.ExecuteScalarAsync())!;
    }

    private async Task<bool> DeviceExistsAsync(string hw)
    {
        await using var connection = database.CreateConnection();
        await connection.OpenAsync();
        await using var command = new Npgsql.NpgsqlCommand(
            "SELECT EXISTS(SELECT 1 FROM registered_devices WHERE hw_identifier = @hw)", connection);
        command.Parameters.AddWithValue("hw", hw);
        return (bool)(await command.ExecuteScalarAsync())!;
    }
}
