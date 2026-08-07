package com.acing.guardian.identity

import com.acing.guardian.AcingVaultEmulator
import java.security.MessageDigest
import java.time.Duration
import java.time.Instant
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

enum class UserRole {
    VIEWER,
    OPERATOR,
    ADMIN
}

enum class CredentialType {
    PASSWORD,
    STRONG_AUTH_TOKEN
}

data class User(
    val id: String,
    val username: String,
    val roles: Set<UserRole>,
    val activeCredentialIds: MutableSet<String> = mutableSetOf(),
    val createdAt: Instant = Instant.now()
)

data class Credential(
    val id: String,
    val userId: String,
    val type: CredentialType,
    val secretHash: String,
    val createdAt: Instant = Instant.now(),
    val rotatedAt: Instant? = null,
    val revokedAt: Instant? = null
) {
    fun isActive(): Boolean = revokedAt == null
}

data class AuthSession(
    val token: String,
    val userId: String,
    val issuedAt: Instant = Instant.now(),
    val expiresAt: Instant,
    val revokedAt: Instant? = null
) {
    fun isActive(now: Instant = Instant.now()): Boolean =
        revokedAt == null && expiresAt.isAfter(now)
}

class IdentityService(
    private val sessionTtl: Duration = Duration.ofMinutes(30)
) {
    private val usersById = ConcurrentHashMap<String, User>()
    private val usersByUsername = ConcurrentHashMap<String, String>()
    private val credentialsById = ConcurrentHashMap<String, Credential>()
    private val sessionsByToken = ConcurrentHashMap<String, AuthSession>()

    fun provisionUser(username: String, roles: Set<UserRole>): User {
        val normalized = username.trim().lowercase()
        require(normalized.isNotBlank()) { "Username cannot be blank." }

        usersByUsername[normalized]?.let { existingUserId ->
            return usersById.getValue(existingUserId)
        }

        val user = User(
            id = UUID.randomUUID().toString(),
            username = normalized,
            roles = roles
        )
        usersById[user.id] = user
        usersByUsername[normalized] = user.id
        return user
    }

    fun createCredential(userId: String, rawSecret: String, type: CredentialType = CredentialType.PASSWORD): Credential {
        val user = usersById.getValue(userId)
        require(rawSecret.isNotBlank()) { "Credential secret cannot be blank." }

        val credential = Credential(
            id = UUID.randomUUID().toString(),
            userId = userId,
            type = type,
            secretHash = hashSecret(rawSecret)
        )
        credentialsById[credential.id] = credential
        user.activeCredentialIds.add(credential.id)
        storeCredentialInVault(credential.id, rawSecret)
        return credential
    }

    fun rotateCredential(credentialId: String, newRawSecret: String): Credential {
        val current = credentialsById.getValue(credentialId)
        require(newRawSecret.isNotBlank()) { "Credential secret cannot be blank." }

        val updated = current.copy(
            secretHash = hashSecret(newRawSecret),
            rotatedAt = Instant.now()
        )
        credentialsById[credentialId] = updated
        storeCredentialInVault(credentialId, newRawSecret)
        return updated
    }

    fun revokeCredential(credentialId: String): Credential {
        val current = credentialsById.getValue(credentialId)
        val revoked = current.copy(revokedAt = Instant.now())
        credentialsById[credentialId] = revoked
        return revoked
    }

    fun authenticate(username: String, rawSecret: String): AuthSession? {
        val userId = usersByUsername[username.trim().lowercase()] ?: return null
        val user = usersById[userId] ?: return null

        val matchingCredential = user.activeCredentialIds
            .asSequence()
            .mapNotNull(credentialsById::get)
            .firstOrNull { it.isActive() && it.secretHash == hashSecret(rawSecret) }
            ?: return null

        val session = AuthSession(
            token = UUID.randomUUID().toString(),
            userId = matchingCredential.userId,
            expiresAt = Instant.now().plus(sessionTtl)
        )
        sessionsByToken[session.token] = session
        return session
    }

    fun validateSession(token: String): AuthSession? {
        val session = sessionsByToken[token] ?: return null
        return if (session.isActive()) session else null
    }

    fun revokeSession(token: String): AuthSession? {
        val session = sessionsByToken[token] ?: return null
        val revoked = session.copy(revokedAt = Instant.now())
        sessionsByToken[token] = revoked
        return revoked
    }

    private fun hashSecret(secret: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(secret.toByteArray())
        return digest.joinToString("") { "%02x".format(it) }
    }

    private fun storeCredentialInVault(credentialId: String, secret: String) {
        // Integration hook into Acing Vault for key/secret storage.
        // TODO(PROD): Replace raw secret storage with wrapped key material from hardware-backed keystore.
        // TODO(PROD): Integrate biometric and MFA-bound credential unlock policies.
        // TODO(PROD): Emit immutable audit log events for credential create/rotate/revoke actions.
        AcingVaultEmulator.storeSecret("identity:credential:$credentialId", secret.toByteArray())
    }
}
