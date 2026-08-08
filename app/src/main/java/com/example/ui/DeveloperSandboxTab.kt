package com.example.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.SandboxScript
import com.example.ui.theme.*
import kotlin.random.Random
import java.text.SimpleDateFormat
import java.util.Locale

@Composable
fun DeveloperSandboxTab(viewModel: AcingViewModel) {
    val scripts by viewModel.sandboxScriptsState.collectAsStateWithLifecycle()
    val runningScriptId by viewModel.runningScriptId.collectAsStateWithLifecycle()
    val consoleLogs by viewModel.sandboxConsoleLogs.collectAsStateWithLifecycle()
    val cpuUsage by viewModel.sandboxCpuUsage.collectAsStateWithLifecycle()
    val memoryUsage by viewModel.sandboxMemoryUsage.collectAsStateWithLifecycle()
    val networkActivity by viewModel.sandboxNetworkActivity.collectAsStateWithLifecycle()

    var activeSubTab by remember { mutableStateOf("Apps") } // Apps, Telemetry, Network
    var showInstallDialog by remember { mutableStateOf(false) }
    var permissionDialogScript by remember { mutableStateOf<SandboxScript?>(null) }

    // Rolling CPU history for the Canvas visualizer
    val cpuHistory = remember { mutableStateListOf<Float>() }
    LaunchedEffect(cpuUsage) {
        cpuHistory.add(cpuUsage.toFloat())
        if (cpuHistory.size > 20) {
            cpuHistory.removeAt(0)
        }
    }

    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(horizontal = 4.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Upper telemetry snapshot card (Concentric branding)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SlateBg),
            border = BorderStroke(1.dp, SlateBorder),
            shape = RoundedCornerShape(24.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    modifier = Modifier.weight(1f),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(
                                brush = Brush.linearGradient(colors = listOf(RoyalBlue, VividViolet)),
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Settings,
                            contentDescription = "Sandbox Node",
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Acing Developer Sandbox",
                            color = TextDark900,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Text(
                            text = if (runningScriptId != null) "Container ACTIVE: CPU spiked" else "Status: Container IDLE",
                            color = if (runningScriptId != null) SecurityGreen else TextSlate500,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.width(8.dp))

                Button(
                    onClick = { showInstallDialog = true },
                    colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue),
                    shape = RoundedCornerShape(20.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                    modifier = Modifier.height(34.dp).testTag("install_custom_script_btn")
                ) {
                    Icon(Icons.Default.Add, contentDescription = "Add", tint = Color.White, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Install App", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Dynamic Sandbox Resizing Card
        val sandboxPartitionSize by viewModel.sandboxPartitionSize.collectAsStateWithLifecycle()
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            border = BorderStroke(1.dp, SlateBorder),
            shape = RoundedCornerShape(24.dp)
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Refresh,
                            contentDescription = "Resize icon",
                            tint = RoyalBlue,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Sandbox Partition Resizer",
                            color = TextDark900,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            modifier = Modifier.weight(1f)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "${sandboxPartitionSize} MB",
                        color = RoyalBlue,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        modifier = Modifier
                            .background(RoyalBlueLight, RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Slide to allocate dynamic partition size. Allocation directly impacts JVM heap bounds and isolated core execution limits.",
                    color = TextSlate500,
                    fontSize = 11.sp,
                    lineHeight = 14.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("128M", color = TextSlate500, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    Slider(
                        value = sandboxPartitionSize.toFloat(),
                        onValueChange = { viewModel.updateSandboxPartitionSize(it.toInt()) },
                        valueRange = 128f..1024f,
                        steps = 7, // 128, 256, 384, 512, 640, 768, 896, 1024
                        modifier = Modifier.weight(1f).testTag("sandbox_resizing_slider"),
                        colors = SliderDefaults.colors(
                            thumbColor = RoyalBlue,
                            activeTrackColor = RoyalBlue,
                            inactiveTrackColor = SlateBorder
                        )
                    )
                    Text("1024M", color = TextSlate500, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        // Sub-tabs navigation rail (Geometric layout)
        LazyRow(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(bottom = 4.dp)
        ) {
            item {
                SandboxSubTabButton(
                    title = "Virtual Apps",
                    isSelected = activeSubTab == "Apps",
                    icon = Icons.Default.Build,
                    onClick = { activeSubTab = "Apps" },
                    testTag = "subtab_apps"
                )
            }
            item {
                SandboxSubTabButton(
                    title = "Resource Telemetry",
                    isSelected = activeSubTab == "Telemetry",
                    icon = Icons.Default.Refresh,
                    onClick = { activeSubTab = "Telemetry" },
                    testTag = "subtab_telemetry"
                )
            }
            item {
                SandboxSubTabButton(
                    title = "Network Interceptor",
                    isSelected = activeSubTab == "Network",
                    icon = Icons.Default.Share,
                    onClick = { activeSubTab = "Network" },
                    testTag = "subtab_network"
                )
            }
        }

        // Sub-tab content block (Flexible layout)
        Box(
            modifier = Modifier
                .fillMaxWidth()
        ) {
            when (activeSubTab) {
                "Apps" -> VirtualAppsSection(
                    scripts = scripts,
                    runningScriptId = runningScriptId,
                    viewModel = viewModel,
                    onManagePermissions = { permissionDialogScript = it }
                )
                "Telemetry" -> TelemetrySection(
                    cpuHistory = cpuHistory,
                    cpuUsage = cpuUsage,
                    memoryUsage = memoryUsage,
                    runningScriptId = runningScriptId
                )
                "Network" -> NetworkInterceptorSection(
                    networkActivity = networkActivity
                )
            }
        }

        // Persistent Console/Terminal Overlay (Styled dark high-contrast)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)), // Slate 900
            border = BorderStroke(1.dp, SlateBorder),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.fillMaxSize().padding(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(if (runningScriptId != null) SecurityGreen else Color.Gray, CircleShape)
                        )
                        Text(
                            text = "SECURE SANDBOX TERMINAL",
                            color = Color(0xFF94A3B8), // Slate 400
                            fontFamily = FontFamily.Monospace,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                    }

                    if (runningScriptId != null) {
                        Text(
                            text = "STOP PROCESS",
                            color = SecurityRed,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            fontFamily = FontFamily.Monospace,
                            modifier = Modifier
                                .clickable { viewModel.stopSandboxScript() }
                                .background(SecurityRed.copy(alpha = 0.15f), RoundedCornerShape(4.dp))
                                .padding(horizontal = 8.dp, vertical = 2.dp)
                                .testTag("stop_process_btn")
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                HorizontalDivider(color = Color(0xFF1E293B), thickness = 1.dp)

                Spacer(modifier = Modifier.height(4.dp))

                if (consoleLogs.isEmpty()) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Terminal is idle. Run a virtual application from the list to spin up a thread container.",
                            color = Color(0xFF64748B),
                            fontFamily = FontFamily.Monospace,
                            fontSize = 10.sp,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                } else {
                    val terminalScrollState = rememberLazyListState()
                    LazyColumn(
                        state = terminalScrollState,
                        modifier = Modifier
                            .fillMaxSize()
                            .lazyListScrollbar(terminalScrollState, color = RoyalBlue.copy(alpha = 0.5f)),
                        verticalArrangement = Arrangement.spacedBy(3.dp),
                        reverseLayout = true
                    ) {
                        items(consoleLogs.reversed()) { log ->
                            val textColor = when {
                                log.contains("SECURITY_ERR:") -> SecurityRed
                                log.contains("NET:") -> RoyalBlue
                                log.contains("MATRIX_") -> SecurityGreen
                                log.contains("FINISHED:") -> SecurityGreen
                                log.contains("INIT:") -> Color(0xFFE2E8F0)
                                else -> Color(0xFF38BDF8) // Light blue
                            }
                            Text(
                                text = log,
                                color = textColor,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 10.sp,
                                lineHeight = 13.sp
                            )
                        }
                    }
                }
            }
        }
    }

    // Install custom app script dialog
    if (showInstallDialog) {
        InstallScriptDialog(
            onDismiss = { showInstallDialog = false },
            onInstall = { name, desc, code, perms ->
                viewModel.installCustomScript(name, desc, code, perms)
                showInstallDialog = false
            }
        )
    }

    // Manage Permissions Dialog
    permissionDialogScript?.let { script ->
        PermissionManagementDialog(
            script = script,
            onDismiss = { permissionDialogScript = null },
            onUpdate = { newPerms ->
                viewModel.updateScriptPermissions(script.id, newPerms)
                permissionDialogScript = null
            }
        )
    }
}

@Composable
fun SandboxSubTabButton(
    title: String,
    isSelected: Boolean,
    icon: ImageVector,
    onClick: () -> Unit,
    testTag: String
) {
    Surface(
        modifier = Modifier
            .clickable { onClick() }
            .testTag(testTag),
        shape = RoundedCornerShape(16.dp),
        color = if (isSelected) RoyalBlueLight else CardWhite,
        border = BorderStroke(1.dp, if (isSelected) RoyalBlue else SlateBorder)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                tint = if (isSelected) RoyalBlue else TextSlate500,
                modifier = Modifier.size(16.dp)
            )
            Text(
                text = title,
                color = if (isSelected) RoyalBlue else TextDark800,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
fun VirtualAppsSection(
    scripts: List<SandboxScript>,
    runningScriptId: Long?,
    viewModel: AcingViewModel,
    onManagePermissions: (SandboxScript) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        if (scripts.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxWidth().padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text("No sandbox applications loaded.", color = TextSlate500, fontSize = 12.sp)
            }
        } else {
            scripts.forEach { script ->
                val isCurrentRunning = runningScriptId == script.id
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardWhite),
                    border = BorderStroke(1.dp, if (isCurrentRunning) RoyalBlue else SlateBorder),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = script.name,
                                        fontWeight = FontWeight.Bold,
                                        color = TextDark900,
                                        fontSize = 13.sp
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "by ${script.author}",
                                        color = RoyalBlue,
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier
                                            .background(RoyalBlueLight, RoundedCornerShape(6.dp))
                                            .padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = script.description,
                                    color = TextSlate500,
                                    fontSize = 11.sp,
                                    lineHeight = 14.sp
                                )
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                IconButton(
                                    onClick = { onManagePermissions(script) },
                                    modifier = Modifier.size(30.dp).testTag("manage_permissions_btn_${script.id}")
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Lock,
                                        contentDescription = "Manage Permissions",
                                        tint = RoyalBlue,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }

                                if (isCurrentRunning) {
                                    Button(
                                        onClick = { viewModel.stopSandboxScript() },
                                        colors = ButtonDefaults.buttonColors(containerColor = SecurityRed),
                                        shape = RoundedCornerShape(12.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                        modifier = Modifier.height(30.dp).testTag("stop_app_script_${script.id}")
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = "Stop", tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(2.dp))
                                        Text("Stop", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                } else {
                                    Button(
                                        onClick = { viewModel.runSandboxScript(script) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (runningScriptId != null) Color.Gray else RoyalBlue
                                        ),
                                        enabled = runningScriptId == null,
                                        shape = RoundedCornerShape(12.dp),
                                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                                        modifier = Modifier.height(30.dp).testTag("run_app_script_${script.id}")
                                    ) {
                                        Icon(Icons.Default.PlayArrow, contentDescription = "Run", tint = Color.White, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(2.dp))
                                        Text("Run", fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                }

                                if (!script.isDefault) {
                                    IconButton(
                                        onClick = { viewModel.deleteSandboxScript(script.id) },
                                        modifier = Modifier.size(30.dp).testTag("delete_script_btn_${script.id}")
                                    ) {
                                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = SecurityRed, modifier = Modifier.size(18.dp))
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Permissions chips list
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Permissions:", color = TextDark800, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            val perms = script.permissions.split(",").filter { it.isNotEmpty() }
                            if (perms.isEmpty()) {
                                PermissionChip(permission = "NONE_REQUIRED", Color.Gray)
                            } else {
                                perms.forEach { perm ->
                                    val color = when (perm) {
                                        "NETWORK_ACCESS" -> RoyalBlue
                                        "MATRIX_READ" -> SecurityGreen
                                        "MATRIX_WRITE" -> SecurityRed
                                        else -> Color.DarkGray
                                    }
                                    PermissionChip(permission = perm, color = color)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PermissionChip(permission: String, color: Color) {
    Box(
        modifier = Modifier
            .background(color.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
            .border(BorderStroke(1.dp, color.copy(alpha = 0.3f)), RoundedCornerShape(6.dp))
            .padding(horizontal = 6.dp, vertical = 2.dp)
    ) {
        Text(
            text = permission,
            color = color,
            fontWeight = FontWeight.Bold,
            fontSize = 9.sp
        )
    }
}

@Composable
fun TelemetrySection(
    cpuHistory: List<Float>,
    cpuUsage: Int,
    memoryUsage: Int,
    runningScriptId: Long?
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        border = BorderStroke(1.dp, SlateBorder),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Text(
                text = "Isolated Core Performance Metrics",
                fontWeight = FontWeight.Bold,
                color = TextDark900,
                fontSize = 14.sp
            )

            // Dynamic Progress Metrics (CPU & MEMORY Row)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // CPU indicator
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = SlateBg),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, SlateBorder)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("CPU Utilization", color = TextSlate500, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(56.dp)) {
                            CircularProgressIndicator(
                                progress = { cpuUsage.toFloat() / 100f },
                                modifier = Modifier.fillMaxSize(),
                                color = RoyalBlue,
                                strokeWidth = 5.dp,
                                trackColor = SlateBorder
                            )
                            Text(
                                text = "$cpuUsage%",
                                color = TextDark900,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }

                // RAM heap indicator
                Card(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.cardColors(containerColor = SlateBg),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, SlateBorder)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("JVM Sandboxed Heap", color = TextSlate500, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                        Spacer(modifier = Modifier.height(6.dp))
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(56.dp)) {
                            CircularProgressIndicator(
                                progress = { memoryUsage.toFloat() / 128f },
                                modifier = Modifier.fillMaxSize(),
                                color = VividViolet,
                                strokeWidth = 5.dp,
                                trackColor = SlateBorder
                            )
                            Text(
                                text = "${memoryUsage}M",
                                color = TextDark900,
                                fontWeight = FontWeight.Bold,
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            }

            // Real-Time Canvas Area Waveform Graph
            Column(
                modifier = Modifier
                    .height(180.dp)
                    .fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Core Usage History", color = TextDark800, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Text(
                        text = if (runningScriptId != null) "SAMPLING..." else "STABLE (IDLE)",
                        color = if (runningScriptId != null) SecurityGreen else TextSlate500,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Box(
                    modifier = Modifier
                        .height(130.dp)
                        .fillMaxWidth()
                        .background(SlateBg, RoundedCornerShape(16.dp))
                        .border(BorderStroke(1.dp, SlateBorder), RoundedCornerShape(16.dp))
                        .padding(8.dp)
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val width = size.width
                        val height = size.height

                        // Draw Grid lines
                        val gridLines = 4
                        for (i in 1..gridLines) {
                            val y = height * (i.toFloat() / (gridLines + 1))
                            drawLine(
                                color = Color.LightGray.copy(alpha = 0.4f),
                                start = androidx.compose.ui.geometry.Offset(0f, y),
                                end = androidx.compose.ui.geometry.Offset(width, y),
                                strokeWidth = 1f
                            )
                        }

                        if (cpuHistory.size > 1) {
                            val stepX = width / (cpuHistory.size - 1)
                            val path = Path()
                            val fillPath = Path()

                            cpuHistory.forEachIndexed { index, value ->
                                // Map value (0-100) to height coordinate (bottom to top)
                                val x = index * stepX
                                val pct = value.coerceIn(0f, 100f) / 100f
                                val y = height - (pct * height)

                                if (index == 0) {
                                    path.moveTo(x, y)
                                    fillPath.moveTo(x, height)
                                    fillPath.lineTo(x, y)
                                } else {
                                    path.lineTo(x, y)
                                    fillPath.lineTo(x, y)
                                }

                                if (index == cpuHistory.size - 1) {
                                    fillPath.lineTo(x, height)
                                    fillPath.close()
                                }
                            }

                            // Draw gradient area fill
                            drawPath(
                                path = fillPath,
                                brush = Brush.verticalGradient(
                                    colors = listOf(RoyalBlue.copy(alpha = 0.3f), RoyalBlue.copy(alpha = 0.02f))
                                )
                            )

                            // Draw stroke path
                            drawPath(
                                path = path,
                                color = RoyalBlue,
                                style = Stroke(width = 3f)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun NetworkInterceptorSection(
    networkActivity: List<AcingViewModel.NetworkEvent>
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        border = BorderStroke(1.dp, SlateBorder),
        shape = RoundedCornerShape(24.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Virtual Networking Auditing Hub",
                    fontWeight = FontWeight.Bold,
                    color = TextDark900,
                    fontSize = 14.sp
                )
                Text(
                    text = "TOTAL: ${networkActivity.size}",
                    color = RoyalBlue,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .background(RoyalBlueLight, RoundedCornerShape(6.dp))
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                )
            }

            Spacer(modifier = Modifier.height(2.dp))

            if (networkActivity.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxWidth().padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No networking logs recorded. Fire up an application requesting socket connections.",
                        color = TextSlate500,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    networkActivity.forEach { event ->
                        val sdf = SimpleDateFormat("HH:mm:ss", Locale.US)
                        val timestampStr = sdf.format(java.util.Date(event.timestamp))

                        val statusColor = if (event.allowed) SecurityGreen else SecurityRed
                        val statusBg = if (event.allowed) Color(0xFFEBFDF5) else Color(0xFFFEF2F2)

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = SlateBg),
                            border = BorderStroke(1.dp, SlateBorder),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    modifier = Modifier.weight(1f),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .background(statusBg, RoundedCornerShape(8.dp))
                                            .padding(horizontal = 8.dp, vertical = 4.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = if (event.allowed) "${event.status}" else "FAIL",
                                            color = statusColor,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace,
                                            fontSize = 11.sp
                                        )
                                    }

                                    Column {
                                        Text(
                                            text = event.url,
                                            color = TextDark900,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 12.sp,
                                            maxLines = 1
                                        )
                                        Row(
                                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                text = "[$timestampStr]",
                                                color = TextSlate500,
                                                fontSize = 10.sp,
                                                fontFamily = FontFamily.Monospace
                                            )
                                            Text(
                                                text = "Payload: ${event.responseSize}",
                                                color = TextSlate500,
                                                fontSize = 10.sp
                                            )
                                        }
                                    }
                                }

                                Text(
                                    text = if (event.allowed) "RESOLVED" else "BLOCKED",
                                    color = statusColor,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp,
                                    modifier = Modifier
                                        .background(statusColor.copy(alpha = 0.1f), RoundedCornerShape(6.dp))
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun PermissionManagementDialog(
    script: SandboxScript,
    onDismiss: () -> Unit,
    onUpdate: (String) -> Unit
) {
    var permNetwork by remember { mutableStateOf(script.permissions.contains("NETWORK_ACCESS")) }
    var permRead by remember { mutableStateOf(script.permissions.contains("MATRIX_READ")) }
    var permWrite by remember { mutableStateOf(script.permissions.contains("MATRIX_WRITE")) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight()
                .padding(4.dp)
                .testTag("permission_management_dialog"),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            border = BorderStroke(1.dp, SlateBorder)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(RoyalBlueLight, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Shield Icon",
                            tint = RoyalBlue,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Column {
                        Text(
                            text = "Acing Matrix Permissions",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextDark900
                        )
                        Text(
                            text = script.name,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSlate500,
                            maxLines = 1
                        )
                    }
                }

                Text(
                    text = "Configure granular access control policies for this isolated application block.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextDark800,
                    lineHeight = 15.sp
                )

                HorizontalDivider(color = SlateBorder, thickness = 1.dp)

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // NETWORK_ACCESS Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { permNetwork = !permNetwork }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = permNetwork,
                            onCheckedChange = { permNetwork = it },
                            modifier = Modifier.testTag("toggle_perm_network")
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("NETWORK_ACCESS", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text("Allows executing CONNECT socket commands to remote hosts.", color = TextSlate500, fontSize = 10.sp)
                        }
                    }

                    // MATRIX_READ Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { permRead = !permRead }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = permRead,
                            onCheckedChange = { permRead = it },
                            modifier = Modifier.testTag("toggle_perm_read")
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("MATRIX_READ", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text("Allows reading active Knox/Matrix hardware security states.", color = TextSlate500, fontSize = 10.sp)
                        }
                    }

                    // MATRIX_WRITE Toggle
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { permWrite = !permWrite }
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = permWrite,
                            onCheckedChange = { permWrite = it },
                            modifier = Modifier.testTag("toggle_perm_write")
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("MATRIX_WRITE", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text("Allows triggering physical Lockdown or logging direct alerts.", color = TextSlate500, fontSize = 10.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("cancel_perms_btn")
                    ) {
                        Text("Cancel", color = TextSlate500, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val permsList = mutableListOf<String>()
                            if (permNetwork) permsList.add("NETWORK_ACCESS")
                            if (permRead) permsList.add("MATRIX_READ")
                            if (permWrite) permsList.add("MATRIX_WRITE")
                            onUpdate(permsList.joinToString(","))
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.testTag("save_perms_btn")
                    ) {
                        Text("Update Policy", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun InstallScriptDialog(
    onDismiss: () -> Unit,
    onInstall: (name: String, description: String, code: String, permissions: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var desc by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }

    var permNetwork by remember { mutableStateOf(false) }
    var permRead by remember { mutableStateOf(false) }
    var permWrite by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight()
                .padding(4.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            border = BorderStroke(1.dp, SlateBorder)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Install Isolated Application",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextDark900
                )

                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("App Name", fontSize = 12.sp) },
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = RoyalBlue,
                        unfocusedBorderColor = SlateBorder
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("install_app_name_input")
                )

                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Short Description", fontSize = 12.sp) },
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = RoyalBlue,
                        unfocusedBorderColor = SlateBorder
                    ),
                    modifier = Modifier.fillMaxWidth().testTag("install_app_desc_input")
                )

                // Code template suggestions helper
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Application Script Code", color = TextDark800, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    Text(
                        text = "Use Template",
                        color = RoyalBlue,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier
                            .clickable {
                                code = "// Cyber Audit Agent\nGET_MATRIX_STATE\nDELAY 1000\nCONNECT https://acing-reputation.net/verify\nDELAY 1200\nSYSTEM_ALERT Audit successful!"
                                permNetwork = true
                                permRead = true
                                permWrite = true
                            }
                            .background(RoyalBlueLight, RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                            .testTag("use_template_btn")
                    )
                }

                OutlinedTextField(
                    value = code,
                    onValueChange = { code = it },
                    placeholder = {
                        Text(
                            text = "CONNECT https://host.com\nDELAY 1000\nGET_MATRIX_STATE\nTRIGGER_LOCKDOWN\nSYSTEM_ALERT msg",
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    },
                    shape = RoundedCornerShape(12.dp),
                    maxLines = 6,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = RoyalBlue,
                        unfocusedBorderColor = SlateBorder
                    ),
                    textStyle = LocalTextStyle.current.copy(fontFamily = FontFamily.Monospace, fontSize = 11.sp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(110.dp)
                        .testTag("install_app_code_input")
                )

                // Permissions selector checkmarks
                Text("Requested Permission Grants", color = TextDark800, fontWeight = FontWeight.Bold, fontSize = 12.sp)

                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { permNetwork = !permNetwork },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = permNetwork,
                            onCheckedChange = { permNetwork = it },
                            modifier = Modifier.testTag("perm_network_checkbox")
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Column {
                            Text("NETWORK_ACCESS", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            Text("Allows executing CONNECT socket commands to remote hosts.", color = TextSlate500, fontSize = 9.sp)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { permRead = !permRead },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = permRead,
                            onCheckedChange = { permRead = it },
                            modifier = Modifier.testTag("perm_read_checkbox")
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Column {
                            Text("MATRIX_READ", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            Text("Allows reading active Knox/Matrix hardware security states.", color = TextSlate500, fontSize = 9.sp)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { permWrite = !permWrite },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Checkbox(
                            checked = permWrite,
                            onCheckedChange = { permWrite = it },
                            modifier = Modifier.testTag("perm_write_checkbox")
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Column {
                            Text("MATRIX_WRITE", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            Text("Allows triggering physical Lockdown or logging direct alerts.", color = TextSlate500, fontSize = 9.sp)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(4.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss, modifier = Modifier.testTag("cancel_install_btn")) {
                        Text("Cancel", color = TextSlate500, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val permsList = mutableListOf<String>()
                            if (permNetwork) permsList.add("NETWORK_ACCESS")
                            if (permRead) permsList.add("MATRIX_READ")
                            if (permWrite) permsList.add("MATRIX_WRITE")
                            onInstall(
                                name.ifEmpty { "Unnamed Script" },
                                desc.ifEmpty { "Custom user installed sandboxed utility." },
                                code.ifEmpty { "DELAY 1000" },
                                permsList.joinToString(",")
                            )
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.testTag("confirm_install_btn")
                    ) {
                        Text("Install securely", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

private fun Modifier.lazyListScrollbar(
    state: LazyListState,
    color: Color = Color.Gray.copy(alpha = 0.5f)
): Modifier = this.drawWithContent {
    drawContent()
    val layoutInfo = state.layoutInfo
    val totalItemsCount = layoutInfo.totalItemsCount
    if (totalItemsCount > 0) {
        val firstVisibleItem = layoutInfo.visibleItemsInfo.firstOrNull()
        val lastVisibleItem = layoutInfo.visibleItemsInfo.lastOrNull()
        if (firstVisibleItem != null && lastVisibleItem != null) {
            val visibleItemsCount = lastVisibleItem.index - firstVisibleItem.index + 1
            if (visibleItemsCount < totalItemsCount) {
                val viewportHeight = size.height
                val scrollbarHeight = (visibleItemsCount.toFloat() / totalItemsCount.toFloat()) * viewportHeight
                val firstVisiblePercent = firstVisibleItem.index.toFloat() / totalItemsCount.toFloat()
                val scrollbarOffset = firstVisiblePercent * viewportHeight

                drawRoundRect(
                    color = color,
                    topLeft = Offset(size.width - 6f, scrollbarOffset),
                    size = Size(4f, scrollbarHeight),
                    cornerRadius = CornerRadius(2f, 2f)
                )
            }
        }
    }
}
