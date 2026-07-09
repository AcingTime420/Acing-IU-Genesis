JAVAC = javac
KOTLINC = kotlinc

# Define source and output directories
SRC_DIR = ../core
THREAT_SRC_DIR = ../threat
DASHBOARD_SRC_DIR = ../dashboard
BOOT_DIR = ../boot
IU_SECURITY_DIR = ../iu_security
AUTH_DIR = ../auth

OUT_DIR = ./out

# Kotlin source files
KOTLIN_SRCS = $(wildcard $(SRC_DIR)/*.kt) \
               $(wildcard $(THREAT_SRC_DIR)/*.kt) \
               $(wildcard $(DASHBOARD_SRC_DIR)/*.kt) \
               $(SRC_DIR)/AcingVaultEmulator.kt

# Class files will be generated here
CLASSES_DIR = $(OUT_DIR)/classes

# Jar file name
JAR_NAME = guardian.jar
JAR_PATH = $(OUT_DIR)/$(JAR_NAME)

.PHONY: all clean guardian

all: guardian

guardian: $(JAR_PATH) $(OUT_DIR)/guardian_init.sh $(OUT_DIR)/iu_security_init $(OUT_DIR)/iu_auth_service $(OUT_DIR)/acing_vault_init $(OUT_DIR)/acing_vault_check_tamper
	@echo "Acing Guardian Security Platform build complete."

$(CLASSES_DIR): 
	@mkdir -p $(CLASSES_DIR)

$(OUT_DIR): 
	@mkdir -p $(OUT_DIR)

$(JAR_PATH): $(KOTLIN_SRCS) $(CLASSES_DIR)
	@echo "Compiling Kotlin sources..."
	$(KOTLINC) $(KOTLIN_SRCS) -d $(CLASSES_DIR) -include-runtime
	@echo "Creating JAR file..."
	jar -cvf $(JAR_PATH) -C $(CLASSES_DIR) .

$(OUT_DIR)/guardian_init.sh: $(BOOT_DIR)/guardian_init.sh $(OUT_DIR)
	@echo "Copying guardian_init.sh..."
	cp $< $@
	chmod +x $@

$(OUT_DIR)/iu_security_init: $(IU_SECURITY_DIR)/iu_security_init $(OUT_DIR)
	@echo "Copying iu_security_init..."
	cp $< $@
	chmod +x $@

$(OUT_DIR)/iu_auth_service: $(AUTH_DIR)/iu_auth_service $(OUT_DIR)

	@echo "Copying iu_auth_service..."
	cp $< $@
	chmod +x $@

clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(OUT_DIR)

$(OUT_DIR)/acing_vault_init: $(BOOT_DIR)/acing_vault_init $(OUT_DIR)
	@echo "Copying acing_vault_init..."
	cp $< $@
	chmod +x $@

$(OUT_DIR)/acing_vault_check_tamper: $(BOOT_DIR)/acing_vault_check_tamper $(OUT_DIR)
	@echo "Copying acing_vault_check_tamper..."
	cp $< $@
	chmod +x $@
