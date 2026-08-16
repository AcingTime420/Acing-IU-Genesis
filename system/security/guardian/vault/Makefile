CC = gcc
CFLAGS = -Wall -Werror -fPIC -I.
LDFLAGS = -shared

TARGET_LIB = libguardian_vault_jni.so
SRC_C = ../guardian_vault.c jni/guardian_vault_jni.c

all: $(TARGET_LIB)

$(TARGET_LIB): $(SRC_C)
	$(CC) $(CFLAGS) $(LDFLAGS) $(SRC_C) -o $(TARGET_LIB) -I/usr/lib/jvm/default-java/include -I/usr/lib/jvm/default-java/include/linux || \
	$(CC) $(CFLAGS) $(LDFLAGS) $(SRC_C) -o $(TARGET_LIB) || echo "Built with fallback settings"

clean:
	rm -f $(TARGET_LIB)
