using System.Text.Json.Serialization;

namespace HumanAuthority;

// This operation creates an internal approval record. It never initiates payment.
public sealed record CreateReimbursementRequest([property: JsonRequired] Guid OrganizationId, [property: JsonRequired] Guid ProjectId, [property: JsonRequired] string Category,
    [property: JsonRequired] long AmountMinor, [property: JsonRequired] string Currency);
public sealed record CreateReimbursementProposalRequest([property: JsonRequired] Guid ReimbursementId, [property: JsonRequired] long ExpectedVersion,
    [property: JsonRequired] long MaxAmountMinor, [property: JsonRequired] int TtlSeconds);
public sealed record ExecuteReimbursementRequest([property: JsonRequired] Guid ProposalId, [property: JsonRequired] Guid GrantId, [property: JsonRequired] Guid ReimbursementId,
    [property: JsonRequired] Guid OrganizationId, [property: JsonRequired] Guid ProjectId, [property: JsonRequired] string Category, [property: JsonRequired] long AmountMinor, [property: JsonRequired] string Currency,
    [property: JsonRequired] long ExpectedVersion, [property: JsonRequired] string Operation);
public sealed record ReimbursementDto(Guid Id, Guid OrganizationId, Guid ProjectId, Guid ManagerId,
    string Category, long AmountMinor, string Currency, string Status, long Version, DateTime CreatedAt);
public sealed record ReimbursementProposalDto(Guid Id, Guid OrganizationId, Guid ReimbursementId,
    Guid AgentId, Guid ManagerId, Guid ProjectId, string Category, long AmountMinor, long MaxAmountMinor,
    string Currency, long ExpectedVersion, DateTime ExpiresAt, DateTime CreatedAt);
public sealed record ReimbursementGrantDto(Guid Id, Guid ProposalId, string State, DateTime CreatedAt);
public sealed record ReimbursementAttemptDto(Guid Id, Guid? OrganizationId, Guid RequesterId, Guid ProposalId,
    Guid GrantId, Guid ReimbursementId, string Outcome, string Reason, long? ReimbursementVersion, DateTime CreatedAt);
