namespace AcingIU.SharedKernel;

/// <summary>
/// Lightweight monadic result for service-layer outcomes without throwing.
/// </summary>
public readonly struct Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    private Result(bool success, T? value, string? error, int statusCode)
    {
        IsSuccess = success;
        Value = value;
        Error = error;
        StatusCode = statusCode;
    }

    public static Result<T> Success(T value, int statusCode = 200) =>
        new(true, value, null, statusCode);

    public static Result<T> Fail(string error, int statusCode = 400) =>
        new(false, default, error, statusCode);

    public Result<TOut> Map<TOut>(Func<T, TOut> map) =>
        IsSuccess ? Result<TOut>.Success(map(Value!), StatusCode) : Result<TOut>.Fail(Error!, StatusCode);
}

public readonly struct Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    private Result(bool success, string? error, int statusCode)
    {
        IsSuccess = success;
        Error = error;
        StatusCode = statusCode;
    }

    public static Result Success(int statusCode = 200) => new(true, null, statusCode);
    public static Result Fail(string error, int statusCode = 400) => new(false, error, statusCode);
}
