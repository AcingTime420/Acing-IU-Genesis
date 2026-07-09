#!/bin/bash

BLUE=\033[0;34m
NC=\033[0m # No Color

OUTPUT_DIR="./out"

mkdir -p "$OUTPUT_DIR"

build_security_platform() {
    echo -e "${BLUE}Building Acing Guardian Security Platform...${NC}"
    # Navigate to the build directory of the security platform
    (cd system/security/guardian/build && make)
    # Assuming 'make' in the guardian/build directory produces guardian.img or similar
    # For now, we'll just copy the generated JAR and scripts
    mkdir -p "$OUTPUT_DIR/security/guardian"
    cp system/security/guardian/build/out/guardian.jar "$OUTPUT_DIR/security/guardian/"
    cp system/security/guardian/build/out/guardian_init.sh "$OUTPUT_DIR/security/guardian/"
    cp system/security/guardian/build/out/iu_security_init "$OUTPUT_DIR/security/guardian/"
    cp system/security/guardian/build/out/iu_auth_service "$OUTPUT_DIR/security/guardian/"
}

build_system_image() {
    echo -e "${BLUE}Building Acing OS system image...${NC}"
    # Placeholder for actual system image build process
    # This is where other parts of the OS would be built
    echo "System image build placeholder."

    # Call the security platform build function
    build_security_platform
}

# Main build process
build_system_image

echo -e "${BLUE}Acing OS build process completed.${NC}"
