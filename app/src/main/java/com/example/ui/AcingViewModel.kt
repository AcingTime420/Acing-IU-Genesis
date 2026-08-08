package com.example.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.data.AcingDatabase
import com.example.data.AcingLog
import com.example.data.AcingRepository
import com.example.data.AcingSettings
import com.example.data.SandboxScript
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random

class AcingViewModel(application: Application) : AndroidViewModel(application) {
    private val repository: AcingRepository

    val settingsState: StateFlow<AcingSettings>
    val logsState: StateFlow<List<AcingLog>>
    val sandboxScriptsState: StateFlow<List<SandboxScript>>

    // Wizard/Setup State: 0=Welcome, 1=Matrix Sync, 2=Security, 3=Restore, 4=Finish, 5=Completed/Main App
    private val _setupStep = MutableStateFlow(0)
    val setupStep: StateFlow<Int> = _setupStep.asStateFlow()

    // Simulation states
    private val _isWiping = MutableStateFlow(false)
    val isWiping: StateFlow<Boolean> = _isWiping.asStateFlow()

    private val _wipeProgress = MutableStateFlow(0f)
    val wipeProgress: StateFlow<Float> = _wipeProgress.asStateFlow()

    private val _blockchainConsensusState = MutableStateFlow("Idle") // Idle, Requesting, Approved, Failed
    val blockchainConsensusState: StateFlow<String> = _blockchainConsensusState.asStateFlow()

    private val _activeFingerprintResult = MutableStateFlow<String?>(null)
    val activeFingerprintResult: StateFlow<String?> = _activeFingerprintResult.asStateFlow()

    // --- Developer Sandbox States ---
    private val _runningScriptId = MutableStateFlow<Long?>(null)
    val runningScriptId: StateFlow<Long?> = _runningScriptId.asStateFlow()

    private val _sandboxConsoleLogs = MutableStateFlow<List<String>>(emptyList())
    val sandboxConsoleLogs: StateFlow<List<String>> = _sandboxConsoleLogs.asStateFlow()

    private val _sandboxCpuUsage = MutableStateFlow(0)
    val sandboxCpuUsage: StateFlow<Int> = _sandboxCpuUsage.asStateFlow()

    private val _sandboxMemoryUsage = MutableStateFlow(0)
    val sandboxMemoryUsage: StateFlow<Int> = _sandboxMemoryUsage.asStateFlow()

    data class NetworkEvent(
        val timestamp: Long = System.currentTimeMillis(),
        val method: String,
        val url: String,
        val status: Int,
        val responseSize: String,
        val allowed: Boolean
    )

    private val _sandboxNetworkActivity = MutableStateFlow<List<NetworkEvent>>(emptyList())
    val sandboxNetworkActivity: StateFlow<List<NetworkEvent>> = _sandboxNetworkActivity.asStateFlow()

    private val _sandboxPartitionSize = MutableStateFlow(512) // Default 512MB
    val sandboxPartitionSize: StateFlow<Int> = _sandboxPartitionSize.asStateFlow()

    private var sandboxJob: Job? = null

    init {
        val database = AcingDatabase.getDatabase(application)
        repository = AcingRepository(database.acingDao())

        settingsState = repository.settingsFlow
            .map { it ?: AcingSettings() }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = AcingSettings()
            )

        logsState = repository.logsFlow
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = emptyList()
            )

        sandboxScriptsState = repository.sandboxScriptsFlow
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = emptyList()
            )

        // Seed initial logs to demonstrate a live boot sequence, and pre-populate sandbox apps
        viewModelScope.launch {
            val existing = repository.getSettings()
            if (existing.isWalletConnected) {
                // If already completed wizard, set step to 5 (main app)
                _setupStep.value = 5
            }
            
            // Add a few boot logs if empty
            insertSystemLog("BOOT", "Initializing Acing IU Kernel Baseline SM-S938U...", "INFO")
            insertSystemLog("CHIPSET", "Snapdragon 8 Elite detected (8 Cores @ up to 4.47 GHz)", "INFO")
            insertSystemLog("SECURITY", "Knox Matrix Security Architecture loading...", "INFO")
            insertSystemLog("MATRIX", "Connecting to Acing Matrix Private Trust Chain node...", "WARN")
            if (existing.isWalletConnected) {
                insertSystemLog("MATRIX", "Acing ID Verified: ${existing.walletAddress.take(8)}...[Success]", "SUCCESS")
                insertSystemLog("SYSTEM", "Acing IU One UI 8.0 baseline active.", "SUCCESS")
            } else {
                insertSystemLog("SYSTEM", "Acing Setup Wizard required for first run.", "WARN")
            }

            // Seed default sandbox scripts if none exist
            val scripts = repository.sandboxScriptsFlow.first()
            if (scripts.isEmpty()) {
                repository.saveSandboxScript(
                    SandboxScript(
                        name = "Network Vulnerability Scanner",
                        description = "Simulates polling several trusted servers and security APIs to fetch active threats.",
                        code = "CONNECT https://node1.acing.matrix/reputation\nCONNECT https://threat-intel.net/v2/live-exploits\nDELAY 1200\nCONNECT https://google.com/dns-query\nSYSTEM_ALERT Port scan lookup finalized by Network Scanner Daemon.",
                        permissions = "NETWORK_ACCESS",
                        isDefault = true,
                        author = "MatrixSec"
                    )
                )
                repository.saveSandboxScript(
                    SandboxScript(
                        name = "Acing Policy Auditing Agent",
                        description = "Automated baseline check of the hardware & radio port controls. Compares against Knox specs.",
                        code = "GET_MATRIX_STATE\nDELAY 1500\nSYSTEM_ALERT Policy and encryption state audit successfully logged.",
                        permissions = "MATRIX_READ",
                        isDefault = true,
                        author = "KnoxGuard"
                    )
                )
                repository.saveSandboxScript(
                    SandboxScript(
                        name = "Intrusion Panic Daemon",
                        description = "Active network watchdog. Automatically locks down physical USB-C ports on detection of anomalies.",
                        code = "CONNECT https://external.watchdog/health\nDELAY 800\nGET_MATRIX_STATE\nDELAY 500\nSYSTEM_ALERT [CRITICAL] Anomaly detected in remote telemetry. Launching hardware lockdown!\nTRIGGER_LOCKDOWN\nSYSTEM_ALERT Active lockdown executed.",
                        permissions = "NETWORK_ACCESS,MATRIX_READ,MATRIX_WRITE",
                        isDefault = true,
                        author = "CoreGuard"
                    )
                )
                repository.saveSandboxScript(
                    SandboxScript(
                        name = "RootMaster Lab Dissect Suite",
                        description = "Automated firmware dissection pipeline. Unpacks super.img, converts sparse raw, and validates S25 Ultra baseline hashes.",
                        code = "SYSTEM_ALERT Initializing RootMaster Lab Dissection Suite...\nDELAY 500\nSYSTEM_ALERT STEP 1: Unpacking S25_Ultra_Stock2026_05_04.rar archive...\nDELAY 1000\nSYSTEM_ALERT STEP 2: Sparse image conversion: simg2img super.img super.raw.img\nDELAY 1200\nSYSTEM_ALERT STEP 3: Dynamic partition unpacking: lpunpack super.raw.img output/\nDELAY 1000\nCONNECT https://firmware-database.acing.org/s938u-baseline-hashes\nDELAY 800\nSYSTEM_ALERT STEP 4: SHA-256 Checksum Verification: MATCHED system.img (VRU3CXH2)\nDELAY 600\nSYSTEM_ALERT STEP 5: Optimizing device internal storage caches via ADB pm trim-caches...\nDELAY 1000\nSYSTEM_ALERT Finalizing RootMaster OS pipeline: SUCCESS. Device fully compliant.",
                        permissions = "NETWORK_ACCESS,MATRIX_READ",
                        isDefault = true,
                        author = "RootMasterLab"
                    )
                )
            }
        }
    }

    private suspend fun insertSystemLog(tag: String, message: String, level: String) {
        repository.insertLog(tag, message, level)
    }

    fun setSetupStep(step: Int) {
        _setupStep.value = step
        viewModelScope.launch {
            insertSystemLog("SETUP", "Onboarding screen changed to step $step", "INFO")
        }
    }

    fun completeSetup() {
        _setupStep.value = 5
        viewModelScope.launch {
            val current = settingsState.value
            // Make sure wallet is marked connected if we finished setup
            val walletAddr = if (current.walletAddress.isEmpty()) generateMockWalletAddress() else current.walletAddress
            repository.saveSettings(current.copy(isWalletConnected = true, walletAddress = walletAddr))
            insertSystemLog("SETUP", "Setup wizard completed! Transitioning to Acing Foundation Launcher.", "SUCCESS")
        }
    }

    fun restartSetup() {
        _setupStep.value = 0
        viewModelScope.launch {
            insertSystemLog("SETUP", "Restarting Setup Wizard for evaluation.", "WARN")
        }
    }

    fun connectWallet() {
        viewModelScope.launch {
            insertSystemLog("WALLET", "Initiating wallet connection request...", "INFO")
            delay(1000)
            val addr = generateMockWalletAddress()
            val current = settingsState.value
            repository.saveSettings(current.copy(isWalletConnected = true, walletAddress = addr))
            insertSystemLog("WALLET", "Connected to Acing Matrix Blockchain Node. Wallet: $addr", "SUCCESS")
            insertSystemLog("MATRIX", "Decentralized device-to-device trust synchronization completed.", "SUCCESS")
        }
    }

    fun disconnectWallet() {
        viewModelScope.launch {
            val current = settingsState.value
            repository.saveSettings(current.copy(isWalletConnected = false, walletAddress = ""))
            insertSystemLog("WALLET", "Disconnected from Matrix Blockchain.", "WARN")
            insertSystemLog("MATRIX", "Trust synchronization terminated. Security falls back to local.", "WARN")
        }
    }

    fun updateAutoReboot(hours: Int) {
        viewModelScope.launch {
            val current = settingsState.value
            repository.saveSettings(current.copy(autoRebootHours = hours))
            insertSystemLog("POLICY", "Auto-Reboot Timer updated to $hours hours.", "INFO")
        }
    }

    fun toggleUsbCControl(enabled: Boolean) {
        viewModelScope.launch {
            val current = settingsState.value
            repository.saveSettings(current.copy(isUsbCControlEnabled = enabled))
            val msg = if (enabled) "USB-C Port Control enabled. Blocking data transmission (charging only)." else "USB-C Port Control disabled. Standard data+charge mode active."
            insertSystemLog("HARDWARE", msg, if (enabled) "SUCCESS" else "WARN")
        }
    }

    fun toggleCellularLockdown(enabled: Boolean) {
        viewModelScope.launch {
            val current = settingsState.value
            repository.saveSettings(current.copy(isCellularLockdownEnabled = enabled))
            val msg = if (enabled) "2G/3G Lockdown active. Interception vector blocked." else "Legacy cellular lockdown deactivated. 2G/3G bands available."
            insertSystemLog("RADIO", msg, if (enabled) "SUCCESS" else "WARN")
        }
    }

    fun toggleMatrixSync(enabled: Boolean) {
        viewModelScope.launch {
            val current = settingsState.value
            repository.saveSettings(current.copy(isMatrixSyncEnabled = enabled))
            val msg = if (enabled) "Acing Matrix Decentralized Sync enabled. Replicating policies across blockchain." else "Acing Matrix Sync disabled. Policy changes kept local."
            insertSystemLog("MATRIX", msg, if (enabled) "SUCCESS" else "WARN")
        }
    }

    fun toggleDuressErasure(enabled: Boolean) {
        viewModelScope.launch {
            val current = settingsState.value
            repository.saveSettings(current.copy(isDuressEnabled = enabled))
            val msg = if (enabled) "Duress Erasure active. Emergency Reset sequence mapped." else "Duress Erasure disabled."
            insertSystemLog("SECURITY", msg, if (enabled) "SUCCESS" else "WARN")
        }
    }

    fun clearLogHistory() {
        viewModelScope.launch {
            repository.clearLogs()
            insertSystemLog("SYSTEM", "Log history cleared by administrator.", "INFO")
        }
    }

    // Biometric scanner trigger
    fun simulateFingerprint(fingerName: String) {
        viewModelScope.launch {
            _activeFingerprintResult.value = "Scanning $fingerName..."
            insertSystemLog("BIOMETRICS", "Analyzing biometric sensor reading on Snapdragon 8 Elite...", "INFO")
            delay(800)

            when (fingerName) {
                "Right Thumb" -> {
                    _activeFingerprintResult.value = "Right Thumb: Default Unlock Active"
                    insertSystemLog("BIOMETRICS", "Right Thumb Match! Action: Launching default One UI Launcher.", "SUCCESS")
                }
                "Right Index" -> {
                    _activeFingerprintResult.value = "Right Index: Launching Wallet"
                    insertSystemLog("BIOMETRICS", "Right Index Match! Action: Opening Acing Matrix Security Wallet.", "SUCCESS")
                }
                "Left Ring" -> {
                    _activeFingerprintResult.value = "Left Ring: Lockdown Triggered!"
                    insertSystemLog("BIOMETRICS", "Left Ring Match! Action: Emergency Acing Lockdown Activated.", "WARN")
                    // Automatically turn on security toggles as part of the lockdown!
                    val current = settingsState.value
                    repository.saveSettings(current.copy(
                        isUsbCControlEnabled = true,
                        isCellularLockdownEnabled = true
                    ))
                    insertSystemLog("HARDWARE", "USB-C Port Control auto-locked.", "SUCCESS")
                    insertSystemLog("RADIO", "2G/3G Lockdown auto-activated.", "SUCCESS")
                }
                "Left Pinky" -> {
                    _activeFingerprintResult.value = "Left Pinky: FRP Wipe Initiated!"
                    insertSystemLog("BIOMETRICS", "Left Pinky Match! Action: Authorized FRP Persistent Wipe Sequence started.", "ERROR")
                    runPersistentWipeSequence()
                }
            }
        }
    }

    fun resetFingerprintResult() {
        _activeFingerprintResult.value = null
    }

    // Persistent FRP data block wipe sequence (simulation)
    fun runPersistentWipeSequence() {
        if (_isWiping.value) return
        _isWiping.value = true
        _wipeProgress.value = 0f
        _blockchainConsensusState.value = "Requesting"

        viewModelScope.launch {
            insertSystemLog("FRP_AUDIT", "Fingerprint trigger verified: Left Pinky (Authorized Owner PIN equivalent)", "WARN")
            delay(1000)

            // Step 1: Blockchain consensus check
            insertSystemLog("MATRIX", "Querying trust chain consensus. Need 3 of 5 nodes authorized.", "INFO")
            delay(1200)

            val isConnected = settingsState.value.isWalletConnected
            if (!isConnected) {
                insertSystemLog("MATRIX", "Consensus: Network wallet disconnected. Attempting Local Offline Cryptographic Fallback...", "WARN")
                delay(1200)
                _blockchainConsensusState.value = "Fallback Approved"
                insertSystemLog("MATRIX", "Local Fallback SUCCESS: 3/5 offline trust shares matched via Secure Enclave keys.", "SUCCESS")
                delay(1000)
            } else {
                _blockchainConsensusState.value = "Approved"
                insertSystemLog("MATRIX", "Consensus Approved: 4/5 peers validated Acing Matrix Identity.", "SUCCESS")
                delay(800)
            }

            // Step 2: Access partition
            insertSystemLog("FRP_AUDIT", "Target partition resolved: persistent (Persistent Data Block)", "INFO")
            insertSystemLog("FRP_AUDIT", "FRP lock status: ACTIVE", "WARN")
            delay(1000)

            // Step 3: Wiping process
            insertSystemLog("FRP_AUDIT", "Sending clear() command to PersistentDataBlockManager...", "WARN")
            for (i in 1..5) {
                _wipeProgress.value = i * 0.2f
                delay(800)
                insertSystemLog("FRP_AUDIT", "Overwriting blocks: ${(i * 20)}% zero-filled.", "INFO")
            }

            // Step 4: Verification
            insertSystemLog("FRP_AUDIT", "FRP lock partition successfully erased! Flag EXTRA_WIPE_PERSISTENT_DATA = true", "SUCCESS")
            insertSystemLog("SYSTEM", "MasterClear intent sent. Device is prepared for a clean, unlocked start.", "SUCCESS")
            delay(1500)

            // Reset states
            _isWiping.value = false
            _wipeProgress.value = 0f
            _blockchainConsensusState.value = "Idle"

            // Reboot simulator to the setup wizard
            _setupStep.value = 0
            val current = settingsState.value
            // Reset connection to simulate completely fresh start
            repository.saveSettings(current.copy(isWalletConnected = false, walletAddress = ""))
            insertSystemLog("SYSTEM", "Simulating system reboot...", "WARN")
            delay(800)
            insertSystemLog("BOOT", "Initializing Acing IU Kernel Baseline SM-S938U...", "INFO")
            insertSystemLog("BOOT", "Fresh boot detected. Setup wizard starting...", "SUCCESS")
        }
    }

    private fun generateMockWalletAddress(): String {
        val chars = "0123456789abcdef"
        val hex = (1..40).map { chars[Random.nextInt(chars.length)] }.joinToString("")
        return "0x$hex"
    }

    // --- Sandbox Management Functions ---
    fun installCustomScript(name: String, description: String, code: String, permissions: String, author: String = "User") {
        viewModelScope.launch {
            repository.saveSandboxScript(
                SandboxScript(
                    name = name,
                    description = description,
                    code = code,
                    permissions = permissions,
                    isDefault = false,
                    author = author
                )
            )
            insertSystemLog("DEVELOPER", "New isolated sandbox app installed: $name", "SUCCESS")
        }
    }

    fun updateScriptPermissions(id: Long, newPermissions: String) {
        viewModelScope.launch {
            val script = repository.getSandboxScriptById(id)
            if (script != null) {
                val updated = script.copy(permissions = newPermissions)
                repository.saveSandboxScript(updated)
                insertSystemLog("DEVELOPER", "Updated permissions for sandbox app '${script.name}': [$newPermissions]", "INFO")
                addSandboxConsoleLog("SYSTEM: Updated permissions to [$newPermissions] for ${script.name}")
            }
        }
    }

    fun deleteSandboxScript(id: Long) {
        viewModelScope.launch {
            if (_runningScriptId.value == id) {
                stopSandboxScript()
            }
            repository.deleteSandboxScriptById(id)
            insertSystemLog("DEVELOPER", "Sandbox app removed (ID: $id)", "INFO")
        }
    }

    fun updateSandboxPartitionSize(newSize: Int) {
        _sandboxPartitionSize.value = newSize
        viewModelScope.launch {
            insertSystemLog("DEVELOPER", "Dynamic partition resized: Secure Sandbox container resized to ${newSize}MB.", "INFO")
            addSandboxConsoleLog("SYSTEM: Dynamic partition resized: Secure Sandbox container resized to ${newSize}MB.")
        }
    }

    fun addSandboxConsoleLog(message: String) {
        val sdf = SimpleDateFormat("HH:mm:ss.SSS", Locale.US)
        val formatted = "[${sdf.format(Date())}] $message"
        _sandboxConsoleLogs.value = _sandboxConsoleLogs.value + formatted
    }

    fun addNetworkEvent(method: String, url: String, status: Int, responseSize: String, allowed: Boolean) {
        val event = NetworkEvent(
            method = method,
            url = url,
            status = status,
            responseSize = responseSize,
            allowed = allowed
        )
        _sandboxNetworkActivity.value = listOf(event) + _sandboxNetworkActivity.value
    }

    fun stopSandboxScript() {
        sandboxJob?.cancel()
        sandboxJob = null
        _runningScriptId.value = null
        _sandboxCpuUsage.value = 0
        _sandboxMemoryUsage.value = 0
        addSandboxConsoleLog("SYSTEM: Sandbox context terminated by user request.")
    }

    fun runSandboxScript(script: SandboxScript) {
        // Stop currently running script first
        sandboxJob?.cancel()
        _runningScriptId.value = script.id
        _sandboxConsoleLogs.value = emptyList()
        _sandboxNetworkActivity.value = emptyList()

        sandboxJob = viewModelScope.launch {
            addSandboxConsoleLog("INIT: Initializing secure virtual container for '${script.name}'...")
            delay(400)
            addSandboxConsoleLog("INIT: Restricting virtual permissions: [${script.permissions.ifEmpty { "NONE" }}]")
            addSandboxConsoleLog("INIT: VM Baseline 1.0 allocated. Executing compilation baseline...")
            delay(500)
            addSandboxConsoleLog("START: Running isolated thread pool...")
            
            val lines = script.code.split("\n")
            val hasNetwork = script.permissions.contains("NETWORK_ACCESS")
            val hasMatrixRead = script.permissions.contains("MATRIX_READ")
            val hasMatrixWrite = script.permissions.contains("MATRIX_WRITE")

            for (rawLine in lines) {
                val line = rawLine.trim()
                if (line.isEmpty() || line.startsWith("#") || line.startsWith("//")) {
                    continue
                }

                // Simulate base processing load
                _sandboxCpuUsage.value = Random.nextInt(12, 35)
                _sandboxMemoryUsage.value = Random.nextInt(14, 28)

                if (line.startsWith("CONNECT ")) {
                    val url = line.substringAfter("CONNECT ").trim()
                    addSandboxConsoleLog("VM_SYS: Processing networking command -> $line")
                    delay(300)
                    if (hasNetwork) {
                        addSandboxConsoleLog("NET: DNS query lookup for '${url.substringAfter("://").substringBefore("/")}'...")
                        _sandboxCpuUsage.value = Random.nextInt(45, 75)
                        _sandboxMemoryUsage.value = Random.nextInt(32, 54)
                        delay(400)
                        addSandboxConsoleLog("NET: Sending secure request to $url")
                        _sandboxCpuUsage.value = Random.nextInt(70, 95)
                        _sandboxMemoryUsage.value = Random.nextInt(60, 92)
                        delay(500)
                        val size = "${Random.nextInt(1, 15)}.${Random.nextInt(0, 9)} KB"
                        addSandboxConsoleLog("NET: [200 OK] Received $size payload.")
                        addNetworkEvent("GET", url, 200, size, true)
                    } else {
                        addSandboxConsoleLog("SECURITY_ERR: Attempted CONNECT to $url but NETWORK_ACCESS is DENIED.")
                        addNetworkEvent("GET", url, 403, "0 B", false)
                        delay(300)
                    }
                } else if (line == "GET_MATRIX_STATE") {
                    addSandboxConsoleLog("VM_SYS: Reading external properties -> $line")
                    delay(300)
                    if (hasMatrixRead) {
                        addSandboxConsoleLog("MATRIX_READ: Synchronized security state parameters:")
                        val settings = settingsState.value
                        addSandboxConsoleLog("  * USB-C Port Lock: ${settings.isUsbCControlEnabled}")
                        addSandboxConsoleLog("  * Radio Lockdown: ${settings.isCellularLockdownEnabled}")
                        addSandboxConsoleLog("  * Matrix Sync: ${settings.isMatrixSyncEnabled}")
                        addSandboxConsoleLog("  * Sync Node Addr: ${if (settings.isWalletConnected) settings.walletAddress else "Not Connected"}")
                        addSandboxConsoleLog("  * Auto-Reboot: ${settings.autoRebootHours} hours")
                    } else {
                        addSandboxConsoleLog("SECURITY_ERR: Read operation blocked. MATRIX_READ permission is DENIED.")
                    }
                    delay(400)
                } else if (line == "TRIGGER_LOCKDOWN") {
                    addSandboxConsoleLog("VM_SYS: Writing Matrix policies -> $line")
                    delay(300)
                    if (hasMatrixWrite) {
                        addSandboxConsoleLog("MATRIX_WRITE: Sending emergency physical lockdown directive...")
                        delay(500)
                        val current = settingsState.value
                        repository.saveSettings(current.copy(
                            isUsbCControlEnabled = true,
                            isCellularLockdownEnabled = true
                        ))
                        insertSystemLog("HARDWARE", "USB-C Port Control locked by Sandbox Application [${script.name}].", "SUCCESS")
                        insertSystemLog("RADIO", "2G/3G Lockdown activated by Sandbox Application [${script.name}].", "SUCCESS")
                        addSandboxConsoleLog("MATRIX_WRITE: Ports locked and 2G/3G radio disabled successfully.")
                    } else {
                        addSandboxConsoleLog("SECURITY_ERR: Write operation blocked. MATRIX_WRITE permission is DENIED.")
                    }
                    delay(400)
                } else if (line.startsWith("SYSTEM_ALERT ")) {
                    val msg = line.substringAfter("SYSTEM_ALERT ").trim()
                    addSandboxConsoleLog("VM_SYS: Direct log operation -> $line")
                    delay(300)
                    if (hasMatrixWrite) {
                        insertSystemLog("SANDBOX", "[${script.name}] $msg", "WARN")
                        addSandboxConsoleLog("SYSTEM: Custom event log written to Knox Firmware audit trail.")
                    } else {
                        addSandboxConsoleLog("SECURITY_ERR: Write operation blocked. MATRIX_WRITE permission is DENIED.")
                    }
                    delay(400)
                } else if (line.startsWith("DELAY ")) {
                    val ms = line.substringAfter("DELAY ").toLongOrNull() ?: 500L
                    addSandboxConsoleLog("VM_SYS: Suspend command -> delay($ms ms)")
                    _sandboxCpuUsage.value = Random.nextInt(1, 4)
                    delay(ms)
                } else {
                    // Generic code line interpretation
                    addSandboxConsoleLog("VM_VM: Executing statement -> '$line'")
                    _sandboxCpuUsage.value = Random.nextInt(25, 60)
                    _sandboxMemoryUsage.value = _sandboxMemoryUsage.value + Random.nextInt(1, 4)
                    delay(400)
                }
            }
            
            _sandboxCpuUsage.value = 0
            _sandboxMemoryUsage.value = 0
            addSandboxConsoleLog("FINISHED: Execution ended cleanly. Sandbox container released.")
            _runningScriptId.value = null
        }
    }
}
