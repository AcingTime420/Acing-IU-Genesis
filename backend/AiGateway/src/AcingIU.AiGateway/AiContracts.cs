namespace AcingIU.AiGateway;

/// <summary>
/// Classification assigned before content may cross an external-provider boundary.
/// Ordering is intentional so policies can define a maximum permitted level.
/// </summary>
public enum DataClassification
{
    Public = 0,
    Internal = 1,
    Confidential = 2,
    Restricted = 3
}

public enum AiGatewayOutcome
{
    Completed,
    Denied,
    Failed
}

/// <summary>
/// A provider request for advisory output only. This contract cannot execute an action.
/// </summary>
public sealed record AiAdviceRequest(
    Guid RequestId,
    Guid ActorId,
    string Provider,
    string UseCase,
    DataClassification Classification,
    string Prompt,
    int MaxOutputTokens);

public sealed record AiProviderResponse(
    string Output,
    string Model,
    long InputTokens,
    long OutputTokens);

public sealed record AiGatewayResult(
    AiGatewayOutcome Outcome,
    string? AdvisoryOutput,
    string ReasonCode,
    string? Model = null,
    long InputTokens = 0,
    long OutputTokens = 0)
{
    public static AiGatewayResult Denied(string reasonCode) =>
        new(AiGatewayOutcome.Denied, null, reasonCode);

    public static AiGatewayResult Failed(string reasonCode) =>
        new(AiGatewayOutcome.Failed, null, reasonCode);

    public static AiGatewayResult Completed(AiProviderResponse response) =>
        new(
            AiGatewayOutcome.Completed,
            response.Output,
            "completed",
            response.Model,
            response.InputTokens,
            response.OutputTokens);
}

public sealed record AiProviderPolicy(
    string Provider,
    bool Enabled,
    DataClassification MaximumClassification,
    IReadOnlySet<string> AllowedUseCases);

public interface IAiProviderAdapter
{
    string ProviderName { get; }

    Task<AiProviderResponse> GenerateAsync(
        AiAdviceRequest request,
        CancellationToken cancellationToken);
}
