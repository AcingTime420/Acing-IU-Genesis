package com.example.data

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "acing_settings")
data class AcingSettings(
    @PrimaryKey val id: Int = 1,
    val autoRebootHours: Int = 12,
    val isUsbCControlEnabled: Boolean = false,
    val isCellularLockdownEnabled: Boolean = false,
    val isMatrixSyncEnabled: Boolean = false,
    val isDuressEnabled: Boolean = false,
    val isWalletConnected: Boolean = false,
    val walletAddress: String = ""
)

@Entity(tableName = "acing_logs")
data class AcingLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val timestamp: Long = System.currentTimeMillis(),
    val tag: String,
    val message: String,
    val level: String // INFO, SUCCESS, WARN, ERROR
)

@Entity(tableName = "sandbox_scripts")
data class SandboxScript(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val description: String,
    val code: String,
    val permissions: String, // Comma-separated (e.g., "NETWORK_ACCESS,MATRIX_READ")
    val isDefault: Boolean = false,
    val author: String = "Admin"
)

@Dao
interface AcingDao {
    @Query("SELECT * FROM acing_settings WHERE id = 1 LIMIT 1")
    fun getSettingsFlow(): Flow<AcingSettings?>

    @Query("SELECT * FROM acing_settings WHERE id = 1 LIMIT 1")
    suspend fun getSettings(): AcingSettings?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSettings(settings: AcingSettings)

    @Query("SELECT * FROM acing_logs ORDER BY timestamp DESC LIMIT 200")
    fun getLogsFlow(): Flow<List<AcingLog>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(log: AcingLog)

    @Query("DELETE FROM acing_logs")
    suspend fun clearLogs()

    @Query("SELECT * FROM sandbox_scripts ORDER BY id ASC")
    fun getSandboxScriptsFlow(): Flow<List<SandboxScript>>

    @Query("SELECT * FROM sandbox_scripts WHERE id = :id LIMIT 1")
    suspend fun getSandboxScriptById(id: Long): SandboxScript?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSandboxScript(script: SandboxScript): Long

    @Query("DELETE FROM sandbox_scripts WHERE id = :id")
    suspend fun deleteSandboxScriptById(id: Long)

    @Query("DELETE FROM sandbox_scripts WHERE isDefault = 0")
    suspend fun clearCustomSandboxScripts()
}

@Database(entities = [AcingSettings::class, AcingLog::class, SandboxScript::class], version = 2, exportSchema = false)
abstract class AcingDatabase : RoomDatabase() {
    abstract fun acingDao(): AcingDao

    companion object {
        @Volatile
        private var INSTANCE: AcingDatabase? = null

        fun getDatabase(context: Context): AcingDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AcingDatabase::class.java,
                    "acing_database"
                )
                    .fallbackToDestructiveMigration(true)
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}

class AcingRepository(private val acingDao: AcingDao) {
    val settingsFlow: Flow<AcingSettings?> = acingDao.getSettingsFlow()
    val logsFlow: Flow<List<AcingLog>> = acingDao.getLogsFlow()
    val sandboxScriptsFlow: Flow<List<SandboxScript>> = acingDao.getSandboxScriptsFlow()

    suspend fun getSettings(): AcingSettings {
        return acingDao.getSettings() ?: AcingSettings()
    }

    suspend fun saveSettings(settings: AcingSettings) {
        acingDao.saveSettings(settings)
    }

    suspend fun insertLog(tag: String, message: String, level: String = "INFO") {
        acingDao.insertLog(
            AcingLog(
                tag = tag,
                message = message,
                level = level
            )
        )
    }

    suspend fun clearLogs() {
        acingDao.clearLogs()
    }

    suspend fun saveSandboxScript(script: SandboxScript): Long {
        return acingDao.saveSandboxScript(script)
    }

    suspend fun getSandboxScriptById(id: Long): SandboxScript? {
        return acingDao.getSandboxScriptById(id)
    }

    suspend fun deleteSandboxScriptById(id: Long) {
        acingDao.deleteSandboxScriptById(id)
    }

    suspend fun clearCustomSandboxScripts() {
        acingDao.clearCustomSandboxScripts()
    }
}
