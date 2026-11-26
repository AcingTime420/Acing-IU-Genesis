namespace AcingIU.AiGateway;

/// <summary>
/// Enforces the server-side provider boundary defined by ADR-007. Provider output is
/// advisory and cannot invoke delegated actions through this type.
/// </summary>
public sealed class GovernedAiGateway
{
    private const int MaximumOutputTokenCeiling = 32_768;

    private readonly IReadOnlyDictionary<string, IAiProviderAdapter> _adapters;
    private readonly IReadOnlyDictionary<string, AiProviderPolicy> _policies;
    private readonly IAiAuditSink _audit;
    private readonly TimeProvider _timeProvider;

    public GovernedAiGateway(
        IEnumerable<IAiProviderAdapter> adapters,
        IEnumerable<AiProviderPolicy> policies,
        IAiAuditSink audit,
        TimeProvider? timeProvider = null)
    {
        ArgumentNullException.ThrowIfNull(adapters);
        ArgumentNullException.ThrowIfNull(policies);
        ArgumentNullException.ThrowIfNull(audit);

        _adapters = adapters.ToDictionary(x => x.ProviderName, StringComparer.OrdinalIgnoreCase);
        _policies = policies.ToDictionary(x => x.Provider, StringComparer.OrdinalIgnoreCase);
        _audit = audit;
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<AiGatewayResult> RequestAdviceAsync(
        AiAdviceRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        var validationFailure = ValidateRequest(request);
        if (validationFailure is not null)
            return await DenyAsync(request, validationFailure, cancellationToken);

        if (!_policies.TryGetValue(request.Provider, out var policy) || !policy.Enabled)
            return await DenyAsync(request, "provider_disabled", cancellationToken);

        if (!policy.AllowedUseCases.Contains(request.UseCase))
            return await DenyAsync(request, "use_case_denied", cancellationToken);

        if (request.Classification > policy.MaximumClassification)
            return await DenyAsync(request, "data_classification_denied", cancellationToken);

        if (!_adapters.TryGetValue(request.Provider, out var adapter))
            return await DenyAsync(request, "provider_adapter_unavailable", cancellationToken);

        try
        {
            var response = await adapter.GenerateAsync(request, cancellationToken);
            await WriteAuditAsync(request, "ai.request.completed", "completed", cancellationToken);
            return AiGatewayResult.Completed(response);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await WriteAuditAsync(request, "ai.request.cancelled", "request_cancelled", CancellationToken.None);
            throw;
        }
        catch
        {
            await WriteAuditAsync(request, "ai.request.failed", "provider_failure", cancellationToken);
            return AiGatewayResult.Failed("provider_failure");
        }
    }

    private static string? ValidateRequest(AiAdviceRequest request)
    {
        if (request.RequestId == Guid.Empty || request.ActorId == Guid.Empty)
            return "invalid_identity";
        if (string.IsNullOrWhiteSpace(request.Provider) || string.IsNullOrWhiteSpace(request.UseCase))
            return "invalid_routing";
        if (string.IsNullOrWhiteSpace(request.Prompt))
            return "invalid_prompt";
        if (request.MaxOutputTokens is <= 0 or > MaximumOutputTokenCeiling)
            return "output_limit_denied";

        return null;
    }

    private async Task<AiGatewayResult> DenyAsync(
        AiAdviceRequest request,
        string reasonCode,
        CancellationToken cancellationToken)
    {
        await WriteAuditAsync(request, "ai.request.denied", reasonCode, cancellationToken);
        return AiGatewayResult.Denied(reasonCode);
    }

    private Task WriteAuditAsync(
        AiAdviceRequest request,
        string eventType,
        string reasonCode,
        CancellationToken cancellationToken) =>
        _audit.WriteAsync(
            new AiAuditEvent(
                eventType,
                request.ActorId,
                request.RequestId,
                request.Provider,
                request.UseCase,
                reasonCode,
                _timeProvider.GetUtcNow()),
            cancellationToken);
}
