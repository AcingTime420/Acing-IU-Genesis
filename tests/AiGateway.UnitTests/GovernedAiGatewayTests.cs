using AcingIU.AiGateway;
using Xunit;

namespace AcingIU.AiGateway.UnitTests;

public sealed class GovernedAiGatewayTests
{
    private static readonly Guid ActorId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    [Fact]
    public async Task Disabled_provider_fails_closed_before_invocation()
    {
        var adapter = new FakeProviderAdapter("xai");
        var audit = new RecordingAuditSink();
        var gateway = CreateGateway(adapter, audit, enabled: false);

        var result = await gateway.RequestAdviceAsync(Request("xai", DataClassification.Public));

        Assert.Equal(AiGatewayOutcome.Denied, result.Outcome);
        Assert.Equal("provider_disabled", result.ReasonCode);
        Assert.Equal(0, adapter.InvocationCount);
        AssertAudit(audit, "ai.request.denied", "provider_disabled");
    }

    [Fact]
    public async Task Disallowed_data_classification_is_rejected_before_invocation()
    {
        var adapter = new FakeProviderAdapter("openai");
        var audit = new RecordingAuditSink();
        var gateway = CreateGateway(adapter, audit, maximumClassification: DataClassification.Internal);

        var result = await gateway.RequestAdviceAsync(Request("openai", DataClassification.Restricted));

        Assert.Equal(AiGatewayOutcome.Denied, result.Outcome);
        Assert.Equal("data_classification_denied", result.ReasonCode);
        Assert.Equal(0, adapter.InvocationCount);
        AssertAudit(audit, "ai.request.denied", "data_classification_denied");
    }

    [Fact]
    public async Task Unlisted_use_case_is_rejected_before_invocation()
    {
        var adapter = new FakeProviderAdapter("openai");
        var audit = new RecordingAuditSink();
        var gateway = CreateGateway(adapter, audit);

        var result = await gateway.RequestAdviceAsync(Request("openai", DataClassification.Public, "unapproved.use-case"));

        Assert.Equal(AiGatewayOutcome.Denied, result.Outcome);
        Assert.Equal("use_case_denied", result.ReasonCode);
        Assert.Equal(0, adapter.InvocationCount);
    }

    [Fact]
    public async Task Excessive_output_limit_is_rejected_before_invocation()
    {
        var adapter = new FakeProviderAdapter("openai");
        var audit = new RecordingAuditSink();
        var gateway = CreateGateway(adapter, audit);
        var request = Request("openai", DataClassification.Public) with { MaxOutputTokens = 1_000_000 };

        var result = await gateway.RequestAdviceAsync(request);

        Assert.Equal(AiGatewayOutcome.Denied, result.Outcome);
        Assert.Equal("output_limit_denied", result.ReasonCode);
        Assert.Equal(0, adapter.InvocationCount);
    }

    [Fact]
    public async Task Allowed_request_returns_advisory_output_and_sanitized_audit()
    {
        const string sensitivePrompt = "private prompt content";
        var adapter = new FakeProviderAdapter("openai", "advisory response");
        var audit = new RecordingAuditSink();
        var gateway = CreateGateway(adapter, audit);

        var result = await gateway.RequestAdviceAsync(Request("openai", DataClassification.Internal, prompt: sensitivePrompt));

        Assert.Equal(AiGatewayOutcome.Completed, result.Outcome);
        Assert.Equal("advisory response", result.AdvisoryOutput);
        Assert.Equal(1, adapter.InvocationCount);
        var entry = Assert.Single(audit.Events);
        Assert.Equal("ai.request.completed", entry.EventType);
        Assert.DoesNotContain(sensitivePrompt, entry.ToString(), StringComparison.Ordinal);
        Assert.Null(entry.Detail);
    }

    [Fact]
    public async Task Provider_failure_is_redacted_and_fails_closed()
    {
        var adapter = new FakeProviderAdapter("openai") { Failure = new InvalidOperationException("provider-secret") };
        var audit = new RecordingAuditSink();
        var gateway = CreateGateway(adapter, audit);

        var result = await gateway.RequestAdviceAsync(Request("openai", DataClassification.Public));

        Assert.Equal(AiGatewayOutcome.Failed, result.Outcome);
        Assert.Equal("provider_failure", result.ReasonCode);
        Assert.DoesNotContain("provider-secret", result.ToString(), StringComparison.Ordinal);
        AssertAudit(audit, "ai.request.failed", "provider_failure");
    }

    private static GovernedAiGateway CreateGateway(
        FakeProviderAdapter adapter,
        RecordingAuditSink audit,
        bool enabled = true,
        DataClassification maximumClassification = DataClassification.Internal) =>
        new(
            new[] { adapter },
            new[]
            {
                new AiProviderPolicy(
                    adapter.ProviderName,
                    enabled,
                    maximumClassification,
                    new HashSet<string>(StringComparer.Ordinal) { "security.explanation" })
            },
            audit);

    private static AiAdviceRequest Request(
        string provider,
        DataClassification classification,
        string useCase = "security.explanation",
        string prompt = "Explain the policy result") =>
        new(Guid.NewGuid(), ActorId, provider, useCase, classification, prompt, 512);

    private static void AssertAudit(RecordingAuditSink audit, string eventType, string reasonCode)
    {
        var entry = Assert.Single(audit.Events);
        Assert.Equal(eventType, entry.EventType);
        Assert.Equal(reasonCode, entry.ReasonCode);
    }
}

internal sealed class FakeProviderAdapter(string providerName, string output = "ok") : IAiProviderAdapter
{
    public string ProviderName { get; } = providerName;
    public int InvocationCount { get; private set; }
    public Exception? Failure { get; init; }

    public Task<AiProviderResponse> GenerateAsync(AiAdviceRequest request, CancellationToken cancellationToken)
    {
        InvocationCount++;
        if (Failure is not null)
            throw Failure;

        return Task.FromResult(new AiProviderResponse(output, "test-model", 8, 4));
    }
}

internal sealed class RecordingAuditSink : IAiAuditSink
{
    public List<AiAuditEvent> Events { get; } = new();

    public Task WriteAsync(AiAuditEvent auditEvent, CancellationToken cancellationToken)
    {
        Events.Add(auditEvent);
        return Task.CompletedTask;
    }
}
