namespace AcingIU.SharedKernel;

/// <summary>RFC 9457-inspired problem details payload.</summary>
public sealed class ProblemDetailsResponse
{
    public string Type { get; set; } = "about:blank";
    public string Title { get; set; } = string.Empty;
    public int Status { get; set; }
    public string? Detail { get; set; }
    public string? TraceId { get; set; }
    public string? Instance { get; set; }

    public static ProblemDetailsResponse Create(int status, string title, string? detail, string? traceId = null) =>
        new()
        {
            Type = $"https://acing.iu/problems/{status}",
            Title = title,
            Status = status,
            Detail = detail,
            TraceId = traceId
        };
}
