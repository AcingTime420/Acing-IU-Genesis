package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.AcingLog
import com.example.data.AcingSettings
import com.example.ui.AcingViewModel
import com.example.ui.DeveloperSandboxTab
import com.example.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale

class MainActivity : ComponentActivity() {
    private val viewModel: AcingViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                Scaffold(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(MaterialTheme.colorScheme.background),
                    contentWindowInsets = WindowInsets.safeDrawing
                ) { innerPadding ->
                    AcingMainContainer(
                        viewModel = viewModel,
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}

@Composable
fun AcingMainContainer(
    viewModel: AcingViewModel,
    modifier: Modifier = Modifier
) {
    val setupStep by viewModel.setupStep.collectAsStateWithLifecycle()

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        if (setupStep < 5) {
            AcingSetupWizard(
                step = setupStep,
                viewModel = viewModel
            )
        } else {
            AcingDeveloperDashboard(
                viewModel = viewModel
            )
        }
    }
}

// Geometric Balance Concentric Logo Badge
@Composable
fun GeometricBalanceLogo(modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .size(80.dp)
            .background(
                brush = Brush.linearGradient(
                    colors = listOf(RoyalBlue, VividViolet)
                ),
                shape = RoundedCornerShape(32.dp)
            ),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .background(Color.Transparent, CircleShape)
                .border(BorderStroke(4.dp, Color.White.copy(alpha = 0.3f)), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .size(16.dp)
                    .background(Color.White, CircleShape)
            )
        }
    }
}

// SETUP WIZARD (Onboarding screens)
@Composable
fun AcingSetupWizard(
    step: Int,
    viewModel: AcingViewModel
) {
    val settings by viewModel.settingsState.collectAsStateWithLifecycle()
    val isWiping by viewModel.isWiping.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Upper Visual Banner (using customized Geometric theme style)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(140.dp),
            shape = RoundedCornerShape(32.dp),
            border = BorderStroke(1.dp, SlateBorder),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                Image(
                    painter = painterResource(id = R.drawable.img_acing_banner),
                    contentDescription = "Acing cyber visualization",
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(Color.Transparent, Color(0x99F8F9FF)),
                                startY = 50f
                            )
                        )
                )
                // App Logo / Version badge
                Surface(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(16.dp),
                    shape = RoundedCornerShape(16.dp),
                    color = Color.White.copy(alpha = 0.9f),
                    border = BorderStroke(1.dp, RoyalBlue.copy(alpha = 0.2f))
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Security",
                            tint = RoyalBlue,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "SM-S938U Baseline",
                            style = MaterialTheme.typography.labelMedium,
                            color = TextDark900,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }

        // Onboarding Screen Content
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            when (step) {
                0 -> WelcomeScreen(viewModel)
                1 -> MatrixSyncScreen(viewModel, settings)
                2 -> AdvancedSecurityOnboarding(viewModel, settings)
                3 -> RestoreOnboardingScreen(viewModel)
                4 -> FinishOnboardingScreen(viewModel)
            }
        }

        // Step Dots Navigation Indicators
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Steps indicator
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                for (i in 0..4) {
                    Box(
                        modifier = Modifier
                            .size(if (i == step) 24.dp else 8.dp, 8.dp)
                            .clip(CircleShape)
                            .background(if (i == step) RoyalBlue else SlateBorder)
                    )
                }
            }

            // Navigation Buttons
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (step > 0) {
                    OutlinedButton(
                        onClick = { viewModel.setSetupStep(step - 1) },
                        border = BorderStroke(1.dp, SlateBorder),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = TextSlate500),
                        shape = RoundedCornerShape(32.dp),
                        modifier = Modifier
                            .height(50.dp)
                            .testTag("setup_prev_button")
                    ) {
                        Text("Back", fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                    }
                }

                Button(
                    onClick = {
                        if (step == 4) {
                            viewModel.completeSetup()
                        } else {
                            viewModel.setSetupStep(step + 1)
                        }
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = RoyalBlue,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(32.dp),
                    modifier = Modifier
                        .height(50.dp)
                        .testTag("setup_next_button")
                ) {
                    Text(
                        text = if (step == 4) "Finish" else "Next",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForward,
                        contentDescription = "Next icon",
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

// SETUP SCREEN 1: WELCOME
@Composable
fun WelcomeScreen(viewModel: AcingViewModel) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth()
    ) {
        GeometricBalanceLogo(modifier = Modifier.padding(bottom = 12.dp))
        
        Text(
            text = "Welcome to Acing IU",
            style = MaterialTheme.typography.headlineLarge,
            color = TextDark900,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Powered by the Acing Matrix Foundation. The decentralized mobile security environment for Samsung Galaxy S25 Ultra.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSlate500,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(modifier = Modifier.height(28.dp))
        Button(
            onClick = { viewModel.setSetupStep(1) },
            colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue, contentColor = Color.White),
            shape = RoundedCornerShape(32.dp),
            contentPadding = PaddingValues(horizontal = 32.dp, vertical = 16.dp),
            modifier = Modifier
                .height(56.dp)
                .testTag("wizard_start_button")
        ) {
            Icon(Icons.Default.PlayArrow, contentDescription = "Start Icon")
            Spacer(modifier = Modifier.width(8.dp))
            Text("Start Onboarding", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

// SETUP SCREEN 2: MATRIX SYNC
@Composable
fun MatrixSyncScreen(viewModel: AcingViewModel, settings: AcingSettings) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(RoyalBlueLight, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Share,
                contentDescription = "Matrix Sync",
                tint = RoyalBlue,
                modifier = Modifier.size(36.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Matrix Identity",
            style = MaterialTheme.typography.titleLarge,
            color = TextDark900,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Your identity establishes a decentralized trust chain. Verified for SM-S938U firmware baseline. Connect your wallet node below.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSlate500,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(modifier = Modifier.height(24.dp))

        if (settings.isWalletConnected) {
            Surface(
                color = CardWhite,
                border = BorderStroke(1.dp, SecurityGreen),
                shape = RoundedCornerShape(24.dp),
                shadowElevation = 2.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Verified",
                        tint = SecurityGreen,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Matrix Identity Connected", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text(
                            text = settings.walletAddress,
                            color = TextSlate500,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedButton(
                onClick = { viewModel.disconnectWallet() },
                colors = ButtonDefaults.outlinedButtonColors(contentColor = SecurityRed),
                border = BorderStroke(1.dp, SecurityRed.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(32.dp),
                modifier = Modifier
                    .height(50.dp)
                    .testTag("disconnect_wallet_button")
            ) {
                Text("Disconnect Node", fontWeight = FontWeight.Bold)
            }
        } else {
            Button(
                onClick = { viewModel.connectWallet() },
                colors = ButtonDefaults.buttonColors(containerColor = RoyalBlue, contentColor = Color.White),
                shape = RoundedCornerShape(32.dp),
                contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp),
                modifier = Modifier
                    .height(54.dp)
                    .testTag("connect_wallet_button")
            ) {
                Icon(Icons.Default.Lock, contentDescription = "Connect Wallet Icon")
                Spacer(modifier = Modifier.width(8.dp))
                Text("Connect Matrix Wallet", fontWeight = FontWeight.Bold)
            }
        }
    }
}

// SETUP SCREEN 3: SECURITY
@Composable
fun AdvancedSecurityOnboarding(viewModel: AcingViewModel, settings: AcingSettings) {
    Column(
        horizontalAlignment = Alignment.Start,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = "Advanced Security",
            style = MaterialTheme.typography.titleLarge,
            color = TextDark900,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "Acing IU includes decentralized protection features. Toggle below to establish baseline partitions:",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSlate500,
            textAlign = TextAlign.Center,
            modifier = Modifier
                .align(Alignment.CenterHorizontally)
                .padding(bottom = 16.dp)
                .padding(horizontal = 8.dp)
        )

        // USB-C Control
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            border = BorderStroke(1.dp, SlateBorder),
            shape = RoundedCornerShape(24.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(RoyalBlueLight, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = "USB", tint = RoyalBlue, modifier = Modifier.size(20.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("USB-C Port Control", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Block external data; allow charging only.", color = TextSlate500, fontSize = 11.sp)
                    }
                }
                Switch(
                    checked = settings.isUsbCControlEnabled,
                    onCheckedChange = { viewModel.toggleUsbCControl(it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = RoyalBlue,
                        uncheckedBorderColor = SlateBorder
                    ),
                    modifier = Modifier.testTag("wizard_usbc_switch")
                )
            }
        }

        // Cellular Lockdown
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 6.dp),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            border = BorderStroke(1.dp, SlateBorder),
            shape = RoundedCornerShape(24.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(RoyalBlueLight, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = "Cellular", tint = RoyalBlue, modifier = Modifier.size(20.dp))
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("2G/3G Radio Lockdown", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Shield from Stingray-style cellular exploits.", color = TextSlate500, fontSize = 11.sp)
                    }
                }
                Switch(
                    checked = settings.isCellularLockdownEnabled,
                    onCheckedChange = { viewModel.toggleCellularLockdown(it) },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = Color.White,
                        checkedTrackColor = RoyalBlue,
                        uncheckedBorderColor = SlateBorder
                    ),
                    modifier = Modifier.testTag("wizard_cellular_switch")
                )
            }
        }
    }
}

// SETUP SCREEN 4: RESTORE
@Composable
fun RestoreOnboardingScreen(viewModel: AcingViewModel) {
    val coroutineScope = rememberCoroutineScope()
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .size(72.dp)
                .background(RoyalBlueLight, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Lock,
                contentDescription = "Restore icon",
                tint = RoyalBlue,
                modifier = Modifier.size(36.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Secure Data Migration",
            style = MaterialTheme.typography.titleLarge,
            color = TextDark900,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Restore secure backup partitions, keys, and Knox trust credentials cleanly from your Acing Cloud or Samsung Smart Switch.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSlate500,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedButton(
            onClick = {
                coroutineScope.launch {
                    viewModel.clearLogHistory()
                    viewModel.completeSetup()
                }
            },
            colors = ButtonDefaults.outlinedButtonColors(contentColor = RoyalBlue),
            border = BorderStroke(1.5.dp, RoyalBlue),
            shape = RoundedCornerShape(32.dp),
            modifier = Modifier
                .height(54.dp)
                .testTag("smart_switch_restore_button")
        ) {
            Icon(Icons.Default.Refresh, contentDescription = "Smart Switch")
            Spacer(modifier = Modifier.width(8.dp))
            Text("Simulate Smart Switch Import", fontWeight = FontWeight.Bold)
        }
    }
}

// SETUP SCREEN 5: FINISH
@Composable
fun FinishOnboardingScreen(viewModel: AcingViewModel) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .size(80.dp)
                .background(Color(0xFFEBFDF5), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.CheckCircle,
                contentDescription = "Finish Check mark",
                tint = SecurityGreen,
                modifier = Modifier.size(48.dp)
            )
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "You're all set!",
            style = MaterialTheme.typography.headlineMedium,
            color = TextDark900,
            fontWeight = FontWeight.Bold
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(
            text = "Your Acing IU environment is ready. Welcome to a decentralized security foundation on the S25 Ultra baseline.",
            style = MaterialTheme.typography.bodyMedium,
            color = TextSlate500,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 24.dp)
        )
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = { viewModel.completeSetup() },
            colors = ButtonDefaults.buttonColors(containerColor = SecurityGreen, contentColor = Color.White),
            shape = RoundedCornerShape(32.dp),
            contentPadding = PaddingValues(horizontal = 32.dp, vertical = 14.dp),
            modifier = Modifier
                .height(56.dp)
                .testTag("wizard_finish_btn")
        ) {
            Text("Finish", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

// DEVELOPER DASHBOARD CONTROL CENTER
@Composable
fun AcingDeveloperDashboard(
    viewModel: AcingViewModel
) {
    val settings by viewModel.settingsState.collectAsStateWithLifecycle()
    val logs by viewModel.logsState.collectAsStateWithLifecycle()
    val isWiping by viewModel.isWiping.collectAsStateWithLifecycle()
    val wipeProgress by viewModel.wipeProgress.collectAsStateWithLifecycle()
    val consensusState by viewModel.blockchainConsensusState.collectAsStateWithLifecycle()
    val activeFingerprintResult by viewModel.activeFingerprintResult.collectAsStateWithLifecycle()

    var activeTab by remember { mutableStateOf("Toggles") } // Toggles, Biometrics, Logs, Sandbox

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(20.dp)
    ) {
        // App Header with Baseline
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Acing Matrix",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextDark900,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "SM-S938U Baseline • One UI 8.0 Mirror",
                    style = MaterialTheme.typography.labelMedium,
                    color = RoyalBlue,
                    fontWeight = FontWeight.Bold
                )
            }
            IconButton(
                onClick = { viewModel.restartSetup() },
                modifier = Modifier
                    .background(Color.White, CircleShape)
                    .border(BorderStroke(1.dp, SlateBorder), CircleShape)
                    .testTag("wizard_restart_icon_button")
            ) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = "Restart Wizard",
                    tint = TextSlate500
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Persistent FRP Wipe simulation overlay/alert when running
        AnimatedVisibility(
            visible = isWiping,
            enter = fadeIn(),
            exit = fadeOut()
        ) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = SecurityRed.copy(alpha = 0.05f)),
                border = BorderStroke(1.5.dp, SecurityRed),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        CircularProgressIndicator(
                            progress = { wipeProgress },
                            color = SecurityRed,
                            strokeWidth = 3.dp,
                            modifier = Modifier.size(24.dp),
                        )
                        Text(
                            text = "FRP PARTITION WIPE IN PROGRESS",
                            color = SecurityRed,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Wiping '/persistent' (Persistent Data Block) securely. Verification tied to trust chain consensus.",
                        color = TextDark800,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    LinearProgressIndicator(
                        progress = { wipeProgress },
                        color = SecurityRed,
                        trackColor = SlateBorder,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(4.dp))
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Matrix Consensus: $consensusState",
                            color = TextSlate500,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "${(wipeProgress * 100).toInt()}% Complete",
                            color = TextDark900,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }

        // Active Fingerprint Action Dialog/Alert
        activeFingerprintResult?.let { result ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = CardWhite),
                border = BorderStroke(1.5.dp, SecurityGreen),
                shape = RoundedCornerShape(24.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(Color(0xFFEBFDF5), CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "Fingerprint Success",
                                tint = SecurityGreen,
                                modifier = Modifier.size(20.dp)
                              )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("Biometric Trigger Fired", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            Text(result, color = TextSlate500, fontSize = 11.sp)
                        }
                    }
                    Text(
                        text = "Dismiss",
                        color = SecurityGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        modifier = Modifier
                            .clickable { viewModel.resetFingerprintResult() }
                            .padding(8.dp)
                            .testTag("dismiss_fingerprint_dialog")
                    )
                }
            }
        }

        // Wallet address status strip (Glassmorphic White Card)
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = CardWhite),
            border = BorderStroke(1.dp, SlateBorder),
            shape = RoundedCornerShape(24.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .background(
                                if (settings.isWalletConnected) Color(0xFFEBFDF5) else Color(0xFFFFFBEB),
                                CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Wallet",
                            tint = if (settings.isWalletConnected) SecurityGreen else SecurityOrange,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = if (settings.isWalletConnected) "Acing Matrix: Synced" else "Matrix Sync: Unconnected",
                            color = TextDark900,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                        Text(
                            text = if (settings.isWalletConnected) settings.walletAddress.take(24) + "..." else "Setup blockchain validation",
                            color = TextSlate500,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }

                Button(
                    onClick = {
                        if (settings.isWalletConnected) viewModel.disconnectWallet() else viewModel.connectWallet()
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (settings.isWalletConnected) SlateBg else RoyalBlue,
                        contentColor = if (settings.isWalletConnected) TextDark800 else Color.White
                    ),
                    shape = RoundedCornerShape(24.dp),
                    border = if (settings.isWalletConnected) BorderStroke(1.dp, SlateBorder) else null,
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                    modifier = Modifier
                        .height(38.dp)
                        .testTag("dashboard_wallet_toggle_btn")
                ) {
                    Text(
                        text = if (settings.isWalletConnected) "Disconnect" else "Sync Node",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Premium Navigation Tabs (Geometric Balance aligned styling)
        TabRow(
            selectedTabIndex = when (activeTab) {
                "Toggles" -> 0
                "Biometrics" -> 1
                "Logs" -> 2
                "Sandbox" -> 3
                else -> 0
            },
            containerColor = Color.Transparent,
            contentColor = RoyalBlue,
            indicator = { tabPositions ->
                TabRowDefaults.SecondaryIndicator(
                    modifier = Modifier.tabIndicatorOffset(
                        tabPositions[when (activeTab) {
                            "Toggles" -> 0
                            "Biometrics" -> 1
                            "Logs" -> 2
                            "Sandbox" -> 3
                            else -> 0
                        }]
                    ),
                    color = RoyalBlue,
                    height = 3.dp
                )
            }
        ) {
            val tabItems = listOf(
                "Toggles" to "tab_toggles",
                "Biometrics" to "tab_biometrics",
                "Logs" to "tab_logs",
                "Sandbox" to "tab_sandbox"
            )
            tabItems.forEach { (tabName, tag) ->
                val label = if (tabName == "Logs") "Firmware" else tabName
                Tab(
                    selected = activeTab == tabName,
                    onClick = { activeTab = tabName },
                    modifier = Modifier.testTag(tag),
                    selectedContentColor = RoyalBlue,
                    unselectedContentColor = TextSlate500
                ) {
                    Box(
                        modifier = Modifier
                            .padding(horizontal = 4.dp, vertical = 12.dp)
                            .fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            fontWeight = FontWeight.Bold,
                            fontSize = 11.sp,
                            maxLines = 1,
                            softWrap = false,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Tab Content view
        Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
            when (activeTab) {
                "Toggles" -> DashboardTogglesTab(viewModel, settings)
                "Biometrics" -> BiometricTriggersTab(viewModel, settings, isWiping)
                "Logs" -> LogsConsoleTab(viewModel, logs)
                "Sandbox" -> DeveloperSandboxTab(viewModel)
            }
        }
    }
}

// TOGGLES TAB VIEW
@Composable
fun DashboardTogglesTab(viewModel: AcingViewModel, settings: AcingSettings) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = CardWhite),
                border = BorderStroke(1.dp, SlateBorder),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .background(RoyalBlueLight, CircleShape),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Refresh, contentDescription = "Timer", tint = RoyalBlue, modifier = Modifier.size(18.dp))
                            }
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Auto-Reboot Timer", color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text("Reboot automatically after inactivity.", color = TextSlate500, fontSize = 11.sp)
                            }
                        }
                        Text(
                            text = "${settings.autoRebootHours} Hrs",
                            color = RoyalBlue,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Slider(
                        value = settings.autoRebootHours.toFloat(),
                        onValueChange = { viewModel.updateAutoReboot(it.toInt()) },
                        valueRange = 1f..48f,
                        steps = 47,
                        colors = SliderDefaults.colors(
                            thumbColor = RoyalBlue,
                            activeTrackColor = RoyalBlue,
                            inactiveTrackColor = SlateBorder
                        ),
                        modifier = Modifier.testTag("auto_reboot_slider")
                    )
                }
            }
        }

        item {
            ToggleControlItem(
                icon = Icons.Default.Settings,
                title = "USB-C Port Control",
                desc = "Charge-only mode; completely block external data interception.",
                checked = settings.isUsbCControlEnabled,
                onCheckedChange = { viewModel.toggleUsbCControl(it) },
                testTag = "toggle_usbc"
            )
        }

        item {
            ToggleControlItem(
                icon = Icons.Default.Warning,
                title = "2G/3G Radio Lockdown",
                desc = "Shield from Stingray interceptors & vintage cellular signal exploits.",
                checked = settings.isCellularLockdownEnabled,
                onCheckedChange = { viewModel.toggleCellularLockdown(it) },
                testTag = "toggle_cellular"
            )
        }

        item {
            ToggleControlItem(
                icon = Icons.Default.Share,
                title = "Acing Matrix Sync",
                desc = "Sync configurations securely across private trusted blockchain.",
                checked = settings.isMatrixSyncEnabled,
                onCheckedChange = { viewModel.toggleMatrixSync(it) },
                testTag = "toggle_matrix_sync"
            )
        }

        item {
            ToggleControlItem(
                icon = Icons.Default.Warning,
                title = "Duress Erasure PIN",
                desc = "Alternate panic PIN triggers a clean authorized FRP erasure.",
                checked = settings.isDuressEnabled,
                onCheckedChange = { viewModel.toggleDuressErasure(it) },
                testTag = "toggle_duress"
            )
        }
    }
}

@Composable
fun ToggleControlItem(
    icon: ImageVector,
    title: String,
    desc: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    testTag: String
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardWhite),
        border = BorderStroke(1.dp, SlateBorder),
        shape = RoundedCornerShape(24.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(modifier = Modifier.weight(1f), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(38.dp)
                        .background(RoyalBlueLight, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(imageVector = icon, contentDescription = title, tint = RoyalBlue, modifier = Modifier.size(20.dp))
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(text = title, color = TextDark900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(text = desc, color = TextSlate500, fontSize = 11.sp)
                }
            }
            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color.White,
                    checkedTrackColor = RoyalBlue,
                    uncheckedTrackColor = SlateBg,
                    uncheckedBorderColor = SlateBorder
                ),
                modifier = Modifier.testTag(testTag)
            )
        }
    }
}

// BIOMETRICS TAB VIEW
@Composable
fun BiometricTriggersTab(viewModel: AcingViewModel, settings: AcingSettings, isWiping: Boolean) {
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        Text(
            text = "Snapdragon 8 Elite Biometric Triggers",
            color = TextDark900,
            fontWeight = FontWeight.Bold,
            fontSize = 15.sp
        )
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            text = "Simulate different registered fingers on the ultrasonic scanner to execute system routines instantly.",
            color = TextSlate500,
            fontSize = 12.sp
        )

        Spacer(modifier = Modifier.height(16.dp))

        val fingers = listOf(
            Triple("Right Thumb", "Default Unlock", "Launches standard One UI Home screen"),
            Triple("Right Index", "Acing Wallet", "Connects / accesses Acing Secure Node"),
            Triple("Left Ring", "Acing Lockdown", "Deactivates data ports & legacy radio bands"),
            Triple("Left Pinky", "Authorized FRP Reset", "Authenticates and triggers persistent wipe")
        )

        val scrollState = rememberLazyListState()
        LazyColumn(
            state = scrollState,
            verticalArrangement = Arrangement.spacedBy(10.dp),
            modifier = Modifier.lazyListScrollbar(scrollState, color = RoyalBlue.copy(alpha = 0.5f))
        ) {
            items(fingers) { finger ->
                val isResetFinger = finger.first == "Left Pinky"
                Card(
                    onClick = {
                        viewModel.simulateFingerprint(finger.first)
                    },
                    enabled = !isWiping,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("finger_" + finger.first.lowercase(Locale.ROOT).replace(" ", "_")),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isResetFinger) Color(0xFFFEF2F2) else CardWhite
                    ),
                    border = BorderStroke(
                        width = 1.dp,
                        color = if (isResetFinger) SecurityRed.copy(alpha = 0.3f) else SlateBorder
                    ),
                    shape = RoundedCornerShape(24.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.size(40.dp),
                            shape = CircleShape,
                            color = if (isResetFinger) SecurityRed.copy(alpha = 0.1f) else RoyalBlueLight
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.Lock,
                                    contentDescription = "Fingerprint sensor",
                                    tint = if (isResetFinger) SecurityRed else RoyalBlue,
                                    modifier = Modifier.size(22.dp)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = finger.first,
                                    color = TextDark900,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = finger.second,
                                    color = if (isResetFinger) SecurityRed else SecurityGreen,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier
                                        .background(
                                            (if (isResetFinger) SecurityRed else SecurityGreen).copy(alpha = 0.1f),
                                            RoundedCornerShape(6.dp)
                                        )
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                            Text(
                                text = finger.third,
                                color = TextSlate500,
                                fontSize = 11.sp
                            )
                        }

                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = "Execute Simulation",
                            tint = if (isResetFinger) SecurityRed else TextSlate500,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

// LOGS TAB VIEW
@Composable
fun LogsConsoleTab(viewModel: AcingViewModel, logs: List<AcingLog>) {
    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Live Partition & Firmware Audit",
                color = TextDark900,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                modifier = Modifier.weight(1f)
            )

            TextButton(
                onClick = { viewModel.clearLogHistory() },
                colors = ButtonDefaults.textButtonColors(contentColor = RoyalBlue),
                modifier = Modifier.testTag("clear_logs_button")
            ) {
                Icon(Icons.Default.Delete, contentDescription = "Clear Logs", modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Clear console", fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        Card(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = SlateBg),
            border = BorderStroke(1.dp, SlateBorder),
            shape = RoundedCornerShape(24.dp)
        ) {
            if (logs.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Console is silent. Trigger biometrics or toggle settings to see live events.",
                        color = TextSlate500,
                        fontSize = 12.sp,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(32.dp)
                    )
                }
            } else {
                val scrollState = rememberLazyListState()
                LazyColumn(
                    state = scrollState,
                    modifier = Modifier
                        .fillMaxSize()
                        .lazyListScrollbar(scrollState, color = RoyalBlue.copy(alpha = 0.5f))
                        .padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    items(logs) { log ->
                        val sdf = SimpleDateFormat("HH:mm:ss", Locale.US)
                        val timeStr = sdf.format(java.util.Date(log.timestamp))

                        val levelColor = when (log.level) {
                            "SUCCESS" -> SecurityGreen
                            "WARN" -> SecurityOrange
                            "ERROR" -> SecurityRed
                            else -> RoyalBlue
                        }

                        val levelBg = when (log.level) {
                            "SUCCESS" -> Color(0xFFEBFDF5)
                            "WARN" -> Color(0xFFFFFBEB)
                            "ERROR" -> Color(0xFFFEF2F2)
                            else -> Color(0xFFEBF0FF)
                        }

                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(CardWhite, RoundedCornerShape(12.dp))
                                .border(BorderStroke(1.dp, SlateBorder), RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "[$timeStr]",
                                        color = TextSlate500,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium
                                    )
                                    Text(
                                        text = log.tag,
                                        color = levelColor,
                                        fontWeight = FontWeight.Bold,
                                        fontFamily = FontFamily.Monospace,
                                        fontSize = 11.sp
                                    )
                                }
                                Text(
                                    text = log.level,
                                    color = levelColor,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace,
                                    fontSize = 10.sp,
                                    modifier = Modifier
                                        .background(levelBg, RoundedCornerShape(4.dp))
                                        .padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = log.message,
                                color = TextDark800,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                lineHeight = 15.sp
                            )
                        }
                    }
                }
            }
        }
    }
}

fun Modifier.lazyListScrollbar(
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
