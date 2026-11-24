// Top-level build file where you can add configuration options common to all sub-projects/modules.
buildscript {
  dependencies {
    constraints {
      classpath("com.google.guava:guava:33.7.2-jre")
      classpath("org.bouncycastle:bcprov-jdk18on:1.85")
      classpath("org.bouncycastle:bcpkix-jdk18on:1.85")
      classpath("org.bouncycastle:bcutil-jdk18on:1.85")
    }
  }
}

plugins {
  alias(libs.plugins.android.application) apply false
  alias(libs.plugins.kotlin.compose) apply false
  alias(libs.plugins.google.devtools.ksp) apply false
  alias(libs.plugins.roborazzi) apply false
  alias(libs.plugins.secrets) apply false
  alias(libs.plugins.google.services) apply false
}
