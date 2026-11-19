using System.Text.Json;
using AuthorityCredentialFiles;

// This candidate is deliberately not wired into the authority CLI until real Windows
// validation succeeds. Never pass credential contents on the command line.
if (!OperatingSystem.IsWindows())
{
    Console.Error.WriteLine("Native Windows credential validation requires Windows.");
    return 78;
}
if (args.Length != 2 || args[0] is not ("read" or "create" or "inspect" or "inspect-parent"))
{
    Console.Error.WriteLine("Expected read, create, inspect or inspect-parent and one local file path.");
    return 64;
}
try
{
    Console.InputEncoding = new System.Text.UTF8Encoding(false, true);
    Console.OutputEncoding = new System.Text.UTF8Encoding(false, true);
    if (args[0] == "inspect-parent")
    {
        WindowsCredentialFile.InspectParent(args[1]);
        Console.WriteLine("{\"validated\":true}");
    }
    else if (args[0] == "create")
    {
        // Bound input before parsing, allocation and any file creation.
        var buffer = new char[WindowsCredentialFile.MaximumBytes + 1];
        var length = 0;
        while (length < buffer.Length)
        {
            var count = Console.In.Read(buffer, length, buffer.Length - length);
            if (count == 0) break;
            length += count;
        }
        if (length > WindowsCredentialFile.MaximumBytes) throw new InvalidDataException();
        using var json = JsonDocument.Parse(new string(buffer, 0, length));
        WindowsCredentialFile.Create(args[1], json.RootElement.GetRawText());
        Console.WriteLine("{\"created\":true}");
    }
    else if (args[0] == "read")
    {
        // Captured IPC response for a future CLI adapter, never a diagnostic/log payload.
        Console.Write(WindowsCredentialFile.Read(args[1]));
    }
    else
    {
        WindowsCredentialFile.Inspect(args[1]);
        Console.WriteLine("{\"validated\":true}");
    }
    return 0;
}
catch
{
    // Do not surface credential text, path, SID, native error strings, or connection data.
    Console.Error.WriteLine("Credential operation rejected; native file controls could not be verified.");
    return 1;
}
