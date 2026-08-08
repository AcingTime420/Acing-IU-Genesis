using AcingIU.SharedKernel;
using Xunit;

namespace AcingIU.Identity.UnitTests;

public class ResultTests
{
    [Fact]
    public void Success_preserves_value()
    {
        var r = Result<int>.Success(42);
        Assert.True(r.IsSuccess);
        Assert.Equal(42, r.Value);
        Assert.Null(r.Error);
        Assert.Equal(200, r.StatusCode);
    }

    [Fact]
    public void Fail_preserves_error_and_status()
    {
        var r = Result<string>.Fail("nope", 409);
        Assert.False(r.IsSuccess);
        Assert.Equal("nope", r.Error);
        Assert.Equal(409, r.StatusCode);
    }

    [Fact]
    public void Map_transforms_success()
    {
        var r = Result<int>.Success(2).Map(x => x * 3);
        Assert.True(r.IsSuccess);
        Assert.Equal(6, r.Value);
    }

    [Fact]
    public void Map_preserves_failure()
    {
        var r = Result<int>.Fail("x", 400).Map(x => x * 3);
        Assert.False(r.IsSuccess);
        Assert.Equal("x", r.Error);
        Assert.Equal(400, r.StatusCode);
    }

    [Fact]
    public void ProblemDetailsResponse_Create_sets_fields()
    {
        var p = ProblemDetailsResponse.Create(401, "Unauthorized", "bad token", "trace-1");
        Assert.Equal(401, p.Status);
        Assert.Equal("Unauthorized", p.Title);
        Assert.Equal("bad token", p.Detail);
        Assert.Equal("trace-1", p.TraceId);
        Assert.Contains("401", p.Type);
    }
}
