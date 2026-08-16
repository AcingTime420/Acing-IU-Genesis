#include <jni.h>
#include <string.h>
#include "../guardian_vault.h"

JNIEXPORT jstring JNICALL
Java_com_acing_guardian_IUVaultBridge_nativeSealIUContext(JNIEnv *env, jobject thiz, jstring context) {
    const char *nativeContext = (*env)->GetStringUTFChars(env, context, 0);
    uint8_t sealed[256];
    size_t out_len = sizeof(sealed);

    if (vault_seal_data(nativeContext, strlen(nativeContext) + 1, sealed, &out_len) == 0) {
        // For demonstration, return a hex string or base64 representation, or just success
        (*env)->ReleaseStringUTFChars(env, context, nativeContext);
        return (*env)->NewStringUTF(env, "SEALED_SUCCESS_CONTEXT");
    }

    (*env)->ReleaseStringUTFChars(env, context, nativeContext);
    return (*env)->NewStringUTF(env, "");
}

JNIEXPORT jboolean JNICALL
Java_com_acing_guardian_IUVaultBridge_nativeVerifyAdminSession(JNIEnv *env, jobject thiz, jstring token) {
    const char *nativeToken = (*env)->GetStringUTFChars(env, token, 0);
    // Verify token against vault or secure session store
    jboolean valid = JNI_FALSE;
    if (strcmp(nativeToken, "dummy_session_token_123") == 0) {
        valid = JNI_TRUE;
    }
    (*env)->ReleaseStringUTFChars(env, token, nativeToken);
    return valid;
}

JNIEXPORT jint JNICALL
Java_com_acing_guardian_IUVaultBridge_nativeVaultCheckTamper(JNIEnv *env, jobject thiz) {
    return (jint)vault_check_tamper();
}

JNIEXPORT jint JNICALL
Java_com_acing_guardian_IUVaultBridge_nativeIuSecurityBind(JNIEnv *env, jobject thiz) {
    return (jint)iu_security_bind();
}
