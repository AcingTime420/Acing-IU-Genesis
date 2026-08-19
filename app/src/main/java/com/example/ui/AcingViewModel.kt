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
            insertSystemLog("BOOT", "TEST FIXTURE — simulated baseline startup; no device state verified.", "INFO")
            insertSystemLog("CHIPSET", "TEST FIXTURE — simulated chipset metadata; no hardware query performed.", "INFO")
            insertSystemLog("SECURITY", "SIMULATOR — non-operational security demonstration; no Knox integration.", "INFO")
            insertSystemLog("MATRIX", "SIMULATOR — no external trust-chain connection is performed.", "WARN")
            if (existing.isWalletConnected) {
                insertSystemLog("MATRIX", "Acing ID Verified: ${existing.walletAddress.take(8)}...[Success]", "SUCCESS")
                insertSystemLog("SYSTEM", "Acing IU One UI 8.0 baseline active.", "SUCCESS")
            } else {
                insertSystemLog("SYSTEM", "Acing Setup Wizard required for first run.", "WARN")
            }

            // Seed a clearly non-operational demonstration only when no scripts exist.
            val scripts = repository.sandboxScriptsFlow.first()
            if (scripts.isEmpty()) {
                repository.saveSandboxScript(
                    SandboxScript(
                        name = "TEST FIXTURE — Non-operational Sandbox Demonstration",
                        description = "SIMULATOR — simulated output only. No device connection, ADB, Fastboot, firmware download, unpack, write, install, flash, rooting, or compliance validation is performed.",
                        code = "SYSTEM_ALERT TEST FIXTURE — simulated non-operational sandbox demonstration.
DELAY 250
SYSTEM_ALERT No device connection or device-changing operation was performed.",
                        permissions = "",
                        isDefault = true,
                        author = "Acing IU Quality Engineering"
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
            _activeFingerprintResult.value = "TEST FIXTURE — simulated biometric input: $fingerName"
            insertSystemLog("SIMULATOR", "TEST FIXTURE — biometric demonstration only; no device security action was performed.", "INFO")
            if (fingerName == "Left Pinky") {
                insertSystemLog("SIMULATOR", "TEST FIXTURE — FRP, wipe, reboot, rooting, and device-changing operations are disabled pending Authorized Device Lab validation.", "WARN")
            }
        }
    }

    fun resetFingerprintResult() {
        _activeFingerprintResult.value = null
    }

    // Persistent FRP data block wipe sequence (simulation)
    fun runPersistentWipeSequence() {
        _isWiping.value = false
        _wipeProgress.value = 0f
        _blockchainConsensusState.value = "Disabled"
        viewModelScope.launch {
            insertSystemLog("SIMULATOR", "TEST FIXTURE — persistent wipe demonstration is disabled; no device partition, FRP, or recovery operation was performed.", "WARN")
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
            insertSystemLog("SIMULATOR", "TEST FIXTURE — simulated sandbox container size set to ${newSize}MB; no device partition changed.", "INFO")
            addSandboxConsoleLog("TEST FIXTURE — simulated sandbox container size changed; no device partition changed.")
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

                // The sandbox is a simulator. Device, bridge, and network-like commands are disabled.
                if (line.startsWith("CONNECT ") || line.startsWith("TRIGGER_LOCKDOWN") ||
                    line.contains("ADB", ignoreCase = true) || line.contains("FASTBOOT", ignoreCase = true) ||
                    line.contains("FLASH", ignoreCase = true) || line.contains("ROOT", ignoreCase = true) ||
                    line.contains("WIPE", ignoreCase = true)) {
                    addSandboxConsoleLog("TEST FIXTURE — command disabled; no network, device bridge, firmware, rooting, wipe, or device-changing operation was performed.")
                    continue
                }

                // Simulate base processing load only.
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
                        insertSystemLog("SIMULATOR", "TEST FIXTURE — [${script.name}] $msg", "INFO")
                        addSandboxConsoleLog("TEST FIXTURE — simulated sandbox event recorded; no device audit trail was modified.")
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
