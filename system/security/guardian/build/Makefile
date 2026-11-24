KOTLINC ?= kotlinc
OUT_DIR = out
KOTLIN_SRCS = $(wildcard ../core/*.kt ../threat/*.kt ../dashboard/*.kt ../identity/*.kt ../trust/*.kt)

.PHONY: all clean

all:
	mkdir -p $(OUT_DIR)
	$(KOTLINC) $(KOTLIN_SRCS) -include-runtime -d $(OUT_DIR)/guardian.jar
	install -m 755 ../boot/guardian_init.sh ../boot/acing_vault_init ../boot/acing_vault_check_tamper $(OUT_DIR)/
	install -m 755 ../iu_security/iu_security_init ../auth/iu_auth_service $(OUT_DIR)/

clean:
	rm -rf $(OUT_DIR)
