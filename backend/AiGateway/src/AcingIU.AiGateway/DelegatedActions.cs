namespace AcingIU.AiGateway;

public enum DelegatedActionOutcome
{
    Executed,
    Denied,
    Failed
}

/// <summary>
/// A proposed action is immutable and contains a digest rather than raw arguments.
/// The executor is responsible for resolving the approved payload through trusted storage.
/// </summary>
public sealed record DelegatedActionProposal(
    Guid ProposalId,
    Guid ActorId,
    string Action,
    string Resource,
    string PayloadDigest);

/// <summary>
/// Opaque evidence presented to a trusted approval verifier. Proof material must never
/// be written to an audit event or returned in an error.
/// </summary>
public sealed record ActionApprovalEvidence(
    Guid ApprovalId,
    string Proof);

public sealed record VerifiedActionApproval(
    Guid ApprovalId,
    Guid ProposalId,
    Guid ApproverId,
    string Action,
    string Resource,
    string PayloadDigest,
    DateTimeOffset ExpiresAt);

public sealed record ApprovalVerificationResult(
    bool IsVerified,
    string ReasonCode,
    VerifiedActionApproval? Approval)
{
    public static ApprovalVerificationResult Verified(VerifiedActionApproval approval) =>
        new(true, "approval_verified", approval);

    public static ApprovalVerificationResult Denied(string reasonCode) =>
        new(false, reasonCode, null);
}

public interface IActionApprovalVerifier
{
    Task<ApprovalVerificationResult> VerifyAsync(
        DelegatedActionProposal proposal,
        ActionApprovalEvidence evidence,
        CancellationToken cancellationToken);
}

public sealed record DelegatedActionResult(
    DelegatedActionOutcome Outcome,
    string ReasonCode)
{
    public static DelegatedActionResult Executed() => new(DelegatedActionOutcome.Executed, "executed");
    public static DelegatedActionResult Denied(string reasonCode) => new(DelegatedActionOutcome.Denied, reasonCode);
    public static DelegatedActionResult Failed(string reasonCode) => new(DelegatedActionOutcome.Failed, reasonCode);
}

/// <summary>
/// Commits an approved action and its success audit as one atomic operation. An
/// implementation must roll back the action when it cannot durably write the supplied
/// audit event and must be idempotent for a proposal identifier.
/// </summary>
public interface IDelegatedActionCommitter
{
    Task CommitAsync(
        DelegatedActionProposal proposal,
        VerifiedActionApproval approval,
        AiAuditEvent successAuditEvent,
        CancellationToken cancellationToken);
}

/// <summary>
/// Separates AI proposals from independently approved execution. It never treats model
/// output as authorization and requires approval to match the exact proposal scope.
/// </summary>
public sealed class DelegatedActionCoordinator
{
    private readonly IDelegatedActionCommitter _committer;
    private readonly IActionApprovalVerifier _approvalVerifier;
    private readonly IAiAuditSink _audit;
    private readonly TimeProvider _timeProvider;

    public DelegatedActionCoordinator(
        IDelegatedActionCommitter committer,
        IActionApprovalVerifier approvalVerifier,
        IAiAuditSink audit,
        TimeProvider? timeProvider = null)
    {
        _committer = committer ?? throw new ArgumentNullException(nameof(committer));
        _approvalVerifier = approvalVerifier ?? throw new ArgumentNullException(nameof(approvalVerifier));
        _audit = audit ?? throw new ArgumentNullException(nameof(audit));
        _timeProvider = timeProvider ?? TimeProvider.System;
    }

    public async Task<DelegatedActionResult> ExecuteAsync(
        DelegatedActionProposal proposal,
        ActionApprovalEvidence? approvalEvidence,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(proposal);

        var proposalFailure = ValidateProposal(proposal);
        if (proposalFailure is not null)
        {
            await WriteAuditAsync(proposal, null, "ai.action.denied", proposalFailure, cancellationToken);
            return DelegatedActionResult.Denied(proposalFailure);
        }

        if (approvalEvidence is null)
        {
            await WriteAuditAsync(proposal, null, "ai.action.denied", "approval_required", cancellationToken);
            return DelegatedActionResult.Denied("approval_required");
        }

        if (approvalEvidence.ApprovalId == Guid.Empty || string.IsNullOrWhiteSpace(approvalEvidence.Proof))
        {
            await WriteAuditAsync(proposal, null, "ai.action.denied", "invalid_approval_evidence", cancellationToken);
            return DelegatedActionResult.Denied("invalid_approval_evidence");
        }

        var verification = await _approvalVerifier.VerifyAsync(proposal, approvalEvidence, cancellationToken);
        if (!verification.IsVerified || verification.Approval is null)
        {
            var reasonCode = NormalizeVerifierDenial(verification.ReasonCode);
            await WriteAuditAsync(proposal, null, "ai.action.denied", reasonCode, cancellationToken);
            return DelegatedActionResult.Denied(reasonCode);
        }

        var approval = verification.Approval;
        var approvalFailure = ValidateVerifiedApproval(proposal, approvalEvidence, approval);
        if (approvalFailure is not null)
        {
            await WriteAuditAsync(proposal, approval, "ai.action.denied", approvalFailure, cancellationToken);
            return DelegatedActionResult.Denied(approvalFailure);
        }

        try
        {
            var successAudit = CreateAuditEvent(proposal, approval, "ai.action.executed", "executed");
            await _committer.CommitAsync(proposal, approval, successAudit, cancellationToken);
            return DelegatedActionResult.Executed();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            await WriteAuditAsync(
                proposal,
                approval,
                "ai.action.cancelled",
                "execution_cancelled",
                CancellationToken.None);
            throw;
        }
        catch
        {
            await WriteAuditAsync(proposal, approval, "ai.action.failed", "execution_failure", cancellationToken);
            return DelegatedActionResult.Failed("execution_failure");
        }
    }

    private static string? ValidateProposal(DelegatedActionProposal proposal)
    {
        if (proposal.ProposalId == Guid.Empty || proposal.ActorId == Guid.Empty ||
            string.IsNullOrWhiteSpace(proposal.Action) || string.IsNullOrWhiteSpace(proposal.Resource) ||
            string.IsNullOrWhiteSpace(proposal.PayloadDigest))
            return "invalid_proposal";

        return null;
    }

    private string? ValidateVerifiedApproval(
        DelegatedActionProposal proposal,
        ActionApprovalEvidence evidence,
        VerifiedActionApproval approval)
    {
        if (approval.ApproverId == Guid.Empty)
            return "invalid_approver";
        if (approval.ExpiresAt <= _timeProvider.GetUtcNow())
            return "approval_expired";
        if (approval.ApprovalId == Guid.Empty || approval.ApprovalId != evidence.ApprovalId ||
            approval.ProposalId != proposal.ProposalId ||
            !string.Equals(approval.Action, proposal.Action, StringComparison.Ordinal) ||
            !string.Equals(approval.Resource, proposal.Resource, StringComparison.Ordinal) ||
            !string.Equals(approval.PayloadDigest, proposal.PayloadDigest, StringComparison.Ordinal))
            return "approval_scope_mismatch";

        return null;
    }

    private static string NormalizeVerifierDenial(string reasonCode) =>
        reasonCode switch
        {
            "approval_denied" => reasonCode,
            "approval_expired" => reasonCode,
            "approval_invalid" => reasonCode,
            "approval_not_found" => reasonCode,
            "approval_revoked" => reasonCode,
            _ => "approval_denied"
        };

    private Task WriteAuditAsync(
        DelegatedActionProposal proposal,
        VerifiedActionApproval? approval,
        string eventType,
        string reasonCode,
        CancellationToken cancellationToken) =>
        _audit.WriteAsync(CreateAuditEvent(proposal, approval, eventType, reasonCode), cancellationToken);

    private AiAuditEvent CreateAuditEvent(
        DelegatedActionProposal proposal,
        VerifiedActionApproval? approval,
        string eventType,
        string reasonCode) =>
        new(
            eventType,
            proposal.ActorId,
            proposal.ProposalId,
            "internal",
            "delegated-action",
            reasonCode,
            _timeProvider.GetUtcNow(),
            proposal.Action,
            proposal.Resource,
            approval?.ApproverId);
}
