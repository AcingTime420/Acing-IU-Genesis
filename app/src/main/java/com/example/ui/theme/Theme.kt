package com.example.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val GeometricBalanceColorScheme = lightColorScheme(
    primary = RoyalBlue,
    secondary = SecurityGreen,
    tertiary = VividViolet,
    background = SlateBg,
    surface = CardWhite,
    surfaceVariant = CardWhiteTrans,
    onPrimary = CardWhite,
    onSecondary = CardWhite,
    onBackground = TextDark900,
    onSurface = TextDark800,
    onSurfaceVariant = TextSlate500,
    error = SecurityRed
)

@Composable
fun MyApplicationTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = GeometricBalanceColorScheme,
        typography = Typography,
        content = content
    )
}
