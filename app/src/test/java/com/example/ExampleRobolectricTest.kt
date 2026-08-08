package com.example

import android.app.Application
import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.example.ui.AcingViewModel
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.delay
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [36])
class ExampleRobolectricTest {

  @Test
  fun `read string from context`() {
    val context = ApplicationProvider.getApplicationContext<Context>()
    val appName = context.getString(R.string.app_name)
    assertEquals("Acing IU", appName)
  }

  @Test
  fun test_sandbox_operations() = runBlocking {
    val app = ApplicationProvider.getApplicationContext<Application>()
    val viewModel = AcingViewModel(app)

    // Verify sandbox can install a custom script securely
    viewModel.installCustomScript(
        name = "Test Intrusion Guard",
        description = "A unit testing mock script.",
        code = "DELAY 100",
        permissions = "NETWORK_ACCESS"
    )

    // Stop execution to ensure state resets cleanly
    viewModel.stopSandboxScript()
    assertEquals(null, viewModel.runningScriptId.value)
  }

  @Test
  fun test_sandbox_permission_management() = runBlocking {
    val app = ApplicationProvider.getApplicationContext<Application>()
    val db = com.example.data.AcingDatabase.getDatabase(app)
    val dao = db.acingDao()

    // 1. Save a new script with custom permissions
    val script = com.example.data.SandboxScript(
        name = "Dynamic Core Guard",
        description = "A custom testing script.",
        code = "DELAY 100",
        permissions = "NETWORK_ACCESS"
    )
    val id = dao.saveSandboxScript(script)

    // 2. Retrieve script and verify initial permissions
    val savedScript = dao.getSandboxScriptById(id)
    assertNotNull("Script should be inserted and retrieved", savedScript)
    assertEquals("NETWORK_ACCESS", savedScript!!.permissions)

    // 3. Update permissions to "MATRIX_READ,MATRIX_WRITE"
    val updatedScript = savedScript.copy(permissions = "MATRIX_READ,MATRIX_WRITE")
    dao.saveSandboxScript(updatedScript)

    // 4. Retrieve again and verify they are successfully updated
    val retrievedScript = dao.getSandboxScriptById(id)
    assertNotNull("Updated script should be found", retrievedScript)
    assertEquals("MATRIX_READ,MATRIX_WRITE", retrievedScript!!.permissions)
  }
}
