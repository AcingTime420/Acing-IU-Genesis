using AcingIU.AiGateway;
using Xunit;

namespace AcingIU.AiGateway.UnitTests;

public sealed class DelegatedActionCoordinatorTests
{
    private static readonly Guid ActorId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ApproverId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    [Fact]
    public async Task Missing_approval_denies_without_execution()
    {
        var executor = new RecordingActionCommitter();
        var verifier = new RecordingApprovalVerifier();
        var audit = new RecordingAuditSink();
        var coordinator = new DelegatedActionCoordinator(executor, verifier, audit, TimeProvider.System);

        var result = await coordinator.ExecuteAsync(Proposal(), null);

        Assert.Equal(DelegatedActionOutcome.Denied, result.Outcome);
        Assert.Equal("approval_required", result.ReasonCode);
        Assert.Equal(0, executor.InvocationCount);
        Assert.Equal(0, verifier.InvocationCount);
        Assert.Equal("ai.action.denied", Assert.Single(audit.Events).EventType);
    }

    [Fact]
    public async Task Mismatched_scope_denies_without_execution()
    {
        var executor = new RecordingActionCommitter();
        var audit = new RecordingAuditSink();
        var proposal = Proposal();
        var verifier = new RecordingApprovalVerifier(Approval(proposal) with { Resource = "project:other" });
        var coordinator = new DelegatedActionCoordinator(executor, verifier, audit, TimeProvider.System);

        var result = await coordinator.ExecuteAsync(proposal, Evidence());

        Assert.Equal(DelegatedActionOutcome.Denied, result.Outcome);
        Assert.Equal("approval_scope_mismatch", result.ReasonCode);
        Assert.Equal(0, executor.InvocationCount);
    }

    [Fact]
    public async Task Payload_digest_mismatch_denies_without_execution()
    {
        var executor = new RecordingActionCommitter();
        var audit = new RecordingAuditSink();
        var proposal = Proposal();
        var verifier = new RecordingApprovalVerifier(Approval(proposal) with { PayloadDigest = "sha256:other" });
        var coordinator = new DelegatedActionCoordinator(executor, verifier, audit, TimeProvider.System);

        var result = await coordinator.ExecuteAsync(proposal, Evidence());

        Assert.Equal(DelegatedActionOutcome.Denied, result.Outcome);
        Assert.Equal("approval_scope_mismatch", result.ReasonCode);
        Assert.Equal(0, executor.InvocationCount);
    }

    [Fact]
    public async Task Expired_approval_denies_without_execution()
    {
        var executor = new RecordingActionCommitter();
        var audit = new RecordingAuditSink();
        var now = new DateTimeOffset(2026, 10, 14, 21, 0, 0, TimeSpan.Zero);
        var proposal = Proposal();
        var verifier = new RecordingApprovalVerifier(Approval(proposal) with { ExpiresAt = now.AddSeconds(-1) });
        var coordinator = new DelegatedActionCoordinator(executor, verifier, audit, new FixedTimeProvider(now));

        var result = await coordinator.ExecuteAsync(proposal, Evidence());

        Assert.Equal(DelegatedActionOutcome.Denied, result.Outcome);
        Assert.Equal("approval_expired", result.ReasonCode);
        Assert.Equal(0, executor.InvocationCount);
    }

    [Fact]
    public async Task Verifier_failure_detail_is_not_exposed_or_audited()
    {
        var executor = new RecordingActionCommitter();
        var verifier = new RecordingApprovalVerifier()
        {
            Result = ApprovalVerificationResult.Denied("database-secret-detail")
        };
        var audit = new RecordingAuditSink();
        var coordinator = new DelegatedActionCoordinator(executor, verifier, audit, TimeProvider.System);

        var result = await coordinator.ExecuteAsync(Proposal(), Evidence());

        Assert.Equal(DelegatedActionOutcome.Denied, result.Outcome);
        Assert.Equal("approval_denied", result.ReasonCode);
        Assert.Equal("approval_denied", Assert.Single(audit.Events).ReasonCode);
        Assert.Equal(0, executor.InvocationCount);
    }

    [Fact]
    public async Task Explicit_matching_approval_allows_exact_action_once()
    {
        var executor = new RecordingActionCommitter();
        var audit = new RecordingAuditSink();
        var proposal = Proposal();
        var verifier = new RecordingApprovalVerifier(Approval(proposal));
        var coordinator = new DelegatedActionCoordinator(executor, verifier, audit, TimeProvider.System);

        var result = await coordinator.ExecuteAsync(proposal, Evidence());

        Assert.Equal(DelegatedActionOutcome.Executed, result.Outcome);
        Assert.Equal(1, executor.InvocationCount);
        Assert.Empty(audit.Events);
        var entry = Assert.IsType<AiAuditEvent>(executor.SuccessAuditEvent);
        Assert.Equal("ai.action.executed", entry.EventType);
        Assert.Equal(proposal.Action, entry.Action);
        Assert.Equal(proposal.Resource, entry.Resource);
    }

    [Fact]
    public async Task Executor_failure_is_redacted_and_recorded()
    {
        var executor = new RecordingActionCommitter { Failure = new InvalidOperationException("sensitive-detail") };
        var audit = new RecordingAuditSink();
        var proposal = Proposal();
        var verifier = new RecordingApprovalVerifier(Approval(proposal));
        var coordinator = new DelegatedActionCoordinator(executor, verifier, audit, TimeProvider.System);

        var result = await coordinator.ExecuteAsync(proposal, Evidence());

        Assert.Equal(DelegatedActionOutcome.Failed, result.Outcome);
        Assert.Equal("execution_failure", result.ReasonCode);
        Assert.DoesNotContain("sensitive-detail", result.ToString(), StringComparison.Ordinal);
        Assert.Equal("ai.action.failed", Assert.Single(audit.Events).EventType);
    }

    private static DelegatedActionProposal Proposal() =>
        new(Guid.NewGuid(), ActorId, "expense.approve", "project:phoenix", "sha256:test-payload");

    private static ActionApprovalEvidence Evidence() =>
        new(Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), "opaque-test-proof");

    private static VerifiedActionApproval Approval(DelegatedActionProposal proposal) =>
        new(
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            proposal.ProposalId,
            ApproverId,
            proposal.Action,
            proposal.Resource,
            proposal.PayloadDigest,
            DateTimeOffset.UtcNow.AddMinutes(10));
}

internal sealed class RecordingActionCommitter : IDelegatedActionCommitter
{
    public int InvocationCount { get; private set; }
    public Exception? Failure { get; init; }
    public AiAuditEvent? SuccessAuditEvent { get; private set; }

    public Task CommitAsync(
        DelegatedActionProposal proposal,
        VerifiedActionApproval approval,
        AiAuditEvent successAuditEvent,
        CancellationToken cancellationToken)
    {
        InvocationCount++;
        if (Failure is not null)
            throw Failure;

        SuccessAuditEvent = successAuditEvent;
        return Task.CompletedTask;
    }
}

internal sealed class RecordingApprovalVerifier(VerifiedActionApproval? approval = null) : IActionApprovalVerifier
{
    public int InvocationCount { get; private set; }
    public ApprovalVerificationResult? Result { get; init; }

    public Task<ApprovalVerificationResult> VerifyAsync(
        DelegatedActionProposal proposal,
        ActionApprovalEvidence evidence,
        CancellationToken cancellationToken)
    {
        InvocationCount++;
        return Task.FromResult(Result ?? (approval is null
            ? ApprovalVerificationResult.Denied("approval_denied")
            : ApprovalVerificationResult.Verified(approval)));
    }
}

internal sealed class FixedTimeProvider(DateTimeOffset utcNow) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => utcNow;
}
