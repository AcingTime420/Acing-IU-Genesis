# Desktop compilation target used by build.sh and release.yml.
# Scripts are packaged for inspection; no scripts are executed here.
KOTLINC ?= kotlinc
OUT_DIR := out
SOURCES := $(sort $(wildcard ../core/*.kt ../threat/*.kt ../dashboard/*.kt ../identity/*.kt ../trust/*.kt))
SCRIPTS := guardian_init.sh iu_security_init iu_auth_service acing_vault_init acing_vault_check_tamper

.PHONY: all clean
all: $(OUT_DIR)/guardian.jar $(addprefix $(OUT_DIR)/,$(SCRIPTS))

$(OUT_DIR):
	mkdir -p "$@"

# Direct JAR output makes -include-runtime bundle the Kotlin runtime.
$(OUT_DIR)/guardian.jar: $(SOURCES) Makefile | $(OUT_DIR)
	$(KOTLINC) $(SOURCES) -jvm-target 17 -include-runtime -d "$@"

$(OUT_DIR)/guardian_init.sh: ../boot/guardian_init.sh | $(OUT_DIR)
	cp "$<" "$@"
	chmod +x "$@"

$(OUT_DIR)/iu_security_init: ../iu_security/iu_security_init | $(OUT_DIR)
	cp "$<" "$@"
	chmod +x "$@"

$(OUT_DIR)/iu_auth_service: ../auth/iu_auth_service | $(OUT_DIR)
	cp "$<" "$@"
	chmod +x "$@"

$(OUT_DIR)/acing_vault_init: ../boot/acing_vault_init | $(OUT_DIR)
	cp "$<" "$@"
	chmod +x "$@"

$(OUT_DIR)/acing_vault_check_tamper: ../boot/acing_vault_check_tamper | $(OUT_DIR)
	cp "$<" "$@"
	chmod +x "$@"

clean:
	rm -rf -- "$(OUT_DIR)"
