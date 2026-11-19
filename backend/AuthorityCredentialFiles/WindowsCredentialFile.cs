using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using System.Security.AccessControl;
using System.Security.Principal;
using System.Text;
using System.Text.Json;
using Microsoft.Win32.SafeHandles;

namespace AuthorityCredentialFiles;

/// <summary>Windows-only, handle-validated credential file candidate. No ACL repair of existing files.</summary>
[SupportedOSPlatform("windows")]
public static class WindowsCredentialFile
{
    public const int MaximumBytes = 1024 * 1024;
    private const uint ReadControl = 0x00020000;
    private const uint BackupSemantics = 0x02000000;
    private const uint OpenReparsePoint = 0x00200000;
    private const uint PersistentAcls = 0x00000008;
    private static readonly SecurityIdentifier SystemSid = new("S-1-5-18");

    public static void Create(string path, string json)
    {
        var bytes = new UTF8Encoding(false, true).GetBytes(json);
        if (bytes.Length > MaximumBytes) throw new InvalidDataException();
        using var parsed = JsonDocument.Parse(bytes);
        path = CanonicalPath(path);
        using var parents = LockParents(path);
        var security = PrivateFileSecurity();
        // FileSecurity is supplied to the native create call, not applied after a public write.
        using var stream = new FileInfo(path).Create(FileMode.CreateNew,
            FileSystemRights.Read | FileSystemRights.Write | FileSystemRights.Synchronize,
            FileShare.None, 4096, FileOptions.WriteThrough, security);
        ValidateFile(stream.SafeFileHandle);
        stream.Write(bytes);
        stream.Flush(flushToDisk: true);
        // A failed write leaves an exclusively-created, private partial file. Never overwrite
        // or delete by a raced path on failure; operator recovery must choose a new file.
    }

    public static string Read(string path)
    {
        path = CanonicalPath(path);
        using var parents = LockParents(path);
        using var handle = Open(path, directory: false);
        ValidateFile(handle);
        using var stream = new FileStream(handle, FileAccess.Read);
        if (stream.Length > MaximumBytes) throw new InvalidDataException();
        var buffer = new byte[MaximumBytes + 1];
        var count = 0;
        while (count < buffer.Length)
        {
            var read = stream.Read(buffer, count, buffer.Length - count);
            if (read == 0) break;
            count += read;
        }
        if (count > MaximumBytes) throw new InvalidDataException();
        var text = new UTF8Encoding(false, true).GetString(buffer, 0, count);
        using var parsed = JsonDocument.Parse(text);
        return text;
    }

    public static void InspectParent(string path)
    {
        path = CanonicalPath(path);
        using var parents = LockParents(path);
    }

    public static void Inspect(string path)
    {
        path = CanonicalPath(path);
        using var parents = LockParents(path);
        using var handle = Open(path, directory: false);
        ValidateFile(handle);
    }

    public static DirectorySecurity PrivateDirectorySecurity()
    {
        var acl = new DirectorySecurity();
        var current = CurrentUser();
        acl.SetOwner(current);
        acl.SetAccessRuleProtection(isProtected: true, preserveInheritance: false);
        foreach (var sid in new[] { current, SystemSid })
            acl.AddAccessRule(new FileSystemAccessRule(sid, FileSystemRights.FullControl,
                InheritanceFlags.ContainerInherit | InheritanceFlags.ObjectInherit,
                PropagationFlags.None, AccessControlType.Allow));
        return acl;
    }

    private static FileSecurity PrivateFileSecurity()
    {
        var acl = new FileSecurity();
        var current = CurrentUser();
        acl.SetOwner(current);
        acl.SetAccessRuleProtection(isProtected: true, preserveInheritance: false);
        foreach (var sid in new[] { current, SystemSid })
            acl.AddAccessRule(new FileSystemAccessRule(sid, FileSystemRights.FullControl, AccessControlType.Allow));
        return acl;
    }

    private static SecurityIdentifier CurrentUser()
    {
        using var identity = WindowsIdentity.GetCurrent(TokenAccessLevels.Query);
        return identity.User ?? throw new UnauthorizedAccessException();
    }

    private static string CanonicalPath(string path)
    {
        // Reject UNC, device namespaces, ADS and relative paths. No network filesystem is supported.
        if (path.Length < 4 || !char.IsAsciiLetter(path[0]) || path[1] != ':' ||
            path[2] != '\\' || path[3..].Contains(':')) throw new UnauthorizedAccessException();
        if (path.Split('\\').Skip(1).Any(part => part is "." or ".." ||
            part.EndsWith(' ') || part.EndsWith('.') || part.Length == 0)) throw new UnauthorizedAccessException();
        var full = Path.GetFullPath(path);
        if (!string.Equals(full, path, StringComparison.OrdinalIgnoreCase)) throw new UnauthorizedAccessException();
        if (new DriveInfo(Path.GetPathRoot(full)!).DriveType != DriveType.Fixed) throw new UnauthorizedAccessException();
        return full;
    }

    private static ParentLease LockParents(string path)
    {
        var lease = new ParentLease();
        try
        {
            // Hold every ancestor without FILE_SHARE_DELETE, preventing its replacement/rename
            // while the final path is opened/created. Reparse checks use each opened handle.
            var root = Path.GetPathRoot(path)!;
            var directory = Path.GetDirectoryName(path)!;
            var components = directory[root.Length..].Split('\\', StringSplitOptions.RemoveEmptyEntries);
            var current = root;
            var handle = Open(current, directory: true);
            lease.Handles.Add(handle);
            ValidateShape(handle, directory: true);
            foreach (var component in components)
            {
                current = Path.Combine(current, component);
                handle = Open(current, directory: true);
                lease.Handles.Add(handle);
                ValidateShape(handle, directory: true);
            }
            ValidateAcl(lease.Handles[^1]);
            for (var ancestor = new DirectoryInfo(directory); ancestor is not null; ancestor = ancestor.Parent)
            {
                var metadata = Path.Combine(ancestor.FullName, ".git");
                if (File.Exists(metadata) || Directory.Exists(metadata)) throw new UnauthorizedAccessException();
            }
            return lease;
        }
        catch { lease.Dispose(); throw; }
    }

    private static SafeFileHandle Open(string path, bool directory)
    {
        // No share-write for the credential; parent leases allow writes but never replacement.
        var share = directory ? 3u : 1u; // FILE_SHARE_READ | optional FILE_SHARE_WRITE; no DELETE
        var handle = Native.CreateFileW(path, ReadControl | (directory ? 0x80u : 0x80000000u),
            share, IntPtr.Zero, 3, OpenReparsePoint | (directory ? BackupSemantics : 0u), IntPtr.Zero);
        if (handle.IsInvalid) { handle.Dispose(); throw new Win32Exception(Marshal.GetLastWin32Error()); }
        return handle;
    }

    private static void ValidateFile(SafeFileHandle handle)
    {
        ValidateShape(handle, directory: false);
        ValidateAcl(handle);
    }

    private static void ValidateShape(SafeFileHandle handle, bool directory)
    {
        if (Native.GetFileType(handle) != 1 || !Native.GetFileInformationByHandle(handle, out var info))
            throw new UnauthorizedAccessException();
        if ((info.Attributes & 0x400) != 0 || ((info.Attributes & 0x10) != 0) != directory ||
            (!directory && info.Links != 1)) throw new UnauthorizedAccessException();
        if (!Native.GetVolumeInformationByHandleW(handle, null, 0, out _, out _, out var flags, null, 0) ||
            (flags & PersistentAcls) == 0) throw new UnauthorizedAccessException();
    }

    private static void ValidateAcl(SafeFileHandle handle)
    {
        var error = Native.GetSecurityInfo(handle, 1, 1 | 4, out _, out _, out _, out _, out var descriptor);
        if (error != 0 || descriptor == IntPtr.Zero) throw new UnauthorizedAccessException();
        try
        {
            var length = Native.GetSecurityDescriptorLength(descriptor);
            if (length == 0 || length > 1024 * 1024) throw new UnauthorizedAccessException();
            var binary = new byte[length]; Marshal.Copy(descriptor, binary, 0, binary.Length);
            var security = new RawSecurityDescriptor(binary, 0);
            var current = CurrentUser();
            if (security.Owner is null || !current.Equals(security.Owner) ||
                !security.ControlFlags.HasFlag(ControlFlags.DiscretionaryAclPresent) ||
                !security.ControlFlags.HasFlag(ControlFlags.DiscretionaryAclProtected) ||
                security.DiscretionaryAcl is null || security.DiscretionaryAcl.Count == 0)
                throw new UnauthorizedAccessException();
            var currentAllowed = false;
            foreach (GenericAce entry in security.DiscretionaryAcl)
            {
                // Reject object/callback/conditional/unknown and inherited ACEs instead of
                // pretending to evaluate access conditions. SYSTEM is the sole extra trustee.
                if (entry is not CommonAce ace || ace.IsCallback ||
                    (ace.AceFlags & AceFlags.Inherited) != 0 ||
                    ace.AceQualifier != AceQualifier.AccessAllowed ||
                    (!current.Equals(ace.SecurityIdentifier) && !SystemSid.Equals(ace.SecurityIdentifier)))
                    throw new UnauthorizedAccessException();
                if (current.Equals(ace.SecurityIdentifier) &&
                    (ace.AceFlags & AceFlags.InheritOnly) == 0 &&
                    (ace.AccessMask & (int)FileSystemRights.FullControl) == (int)FileSystemRights.FullControl)
                    currentAllowed = true;
            }
            if (!currentAllowed) throw new UnauthorizedAccessException();
        }
        finally { Native.LocalFree(descriptor); }
    }

    private sealed class ParentLease : IDisposable
    {
        public List<SafeFileHandle> Handles { get; } = [];
        public void Dispose() { for (var i = Handles.Count - 1; i >= 0; i--) Handles[i].Dispose(); }
    }

    private static class Native
    {
        [StructLayout(LayoutKind.Sequential)]
        internal struct FileInformation
        {
            public uint Attributes;
            public System.Runtime.InteropServices.ComTypes.FILETIME Creation, Access, Write;
            public uint VolumeSerial, SizeHigh, SizeLow, Links, IndexHigh, IndexLow;
        }
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        internal static extern SafeFileHandle CreateFileW(string name, uint access, uint share,
            IntPtr security, uint disposition, uint flags, IntPtr template);
        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        internal static extern bool GetFileInformationByHandle(SafeFileHandle file, out FileInformation info);
        [DllImport("kernel32.dll", SetLastError = true)]
        internal static extern uint GetFileType(SafeFileHandle file);
        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        internal static extern bool GetVolumeInformationByHandleW(SafeFileHandle file, StringBuilder? volume,
            uint volumeLength, out uint serial, out uint componentLength, out uint flags,
            StringBuilder? filesystem, uint filesystemLength);
        [DllImport("advapi32.dll", SetLastError = true)]
        internal static extern uint GetSecurityInfo(SafeFileHandle file, uint type, uint information,
            out IntPtr owner, out IntPtr group, out IntPtr dacl, out IntPtr sacl, out IntPtr descriptor);
        [DllImport("advapi32.dll")]
        internal static extern uint GetSecurityDescriptorLength(IntPtr descriptor);
        [DllImport("kernel32.dll")]
        internal static extern IntPtr LocalFree(IntPtr memory);
    }
}
