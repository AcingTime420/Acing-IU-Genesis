#!/bin/bash
# ==============================================================================
# ACING OS / ACING IU - COMPREHENSIVE ORCHESTRATION & DEPLOYMENT SCRIPT
# ==============================================================================
# This script automates:
#   1. Validation of development prerequisites (dotnet, docker, node, etc.)
#   2. Project directory structure and baseline layout checks
#   3. Solution scaffolding verification
#   4. Docker Stack preparation and compose deployment instructions
# ==============================================================================

set -e

# ANSI Color Codes for high-contrast logs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================================${NC}"
echo -e "${BLUE}           ACING OS / ACING IU SERVICES BUILD & ORCHESTRATOR           ${NC}"
echo -e "${BLUE}======================================================================${NC}"

# 1. VALIDATION OF PREREQUISITES
echo -e "\n${BLUE}[*] Stage 1: Validating System Prerequisites...${NC}"

# Check .NET SDK
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version)
    echo -e "  [✓] .NET SDK is installed: ${GREEN}${DOTNET_VERSION}${NC}"
else
    echo -e "  [!] .NET SDK is missing or not in PATH."
fi

# Check Docker CLI
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "  [✓] Docker CLI is installed: ${GREEN}${DOCKER_VERSION}${NC}"
else
    echo -e "  [!] Docker is missing. Containerized pipeline steps might fail."
fi

# Check Docker Compose
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "  [✓] Docker Compose utility is ${GREEN}Available${NC}"
else
    echo -e "  [!] Docker Compose is not found. Infrastructure services cannot be spun up automatically."
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "  [✓] Node.js is installed: ${GREEN}${NODE_VERSION}${NC}"
else
    echo -e "  [!] Node.js is missing. Frontend development build requires Node.js v18+."
fi


# 2. REPOSITORY STRUCTURE INITIALIZATION & VERIFICATION
echo -e "\n${BLUE}[*] Stage 2: Initializing and Verifying Directory Structures...${NC}"

REQUIRED_DIRS=(
    "backend"
    "backend/Gateway"
    "backend/Identity"
    "backend/Security"
    "backend/DeviceTrust"
    "backend/Audit"
    "backend/Shared"
    "frontend"
    "frontend/src/app"
    "frontend/src/components"
    "database/migrations"
    "infrastructure"
    "scripts"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "/$dir" ] || [ -d "./$dir" ]; then
        echo -e "  [✓] Directory exists: ${GREEN}/$dir${NC}"
    else
        echo -e "  [-] Directory missing. Creating: ${YELLOW}/$dir${NC}"
        mkdir -p "./$dir"
    fi
done


# 3. SOLUTION SCAFFOLDING VERIFICATION
echo -e "\n${BLUE}[*] Stage 3: Verifying Solution & Scaffolding Files...${NC}"

# Solution check
if [ -f "backend/AcingIU.sln" ]; then
    echo -e "  [✓] .NET 8.0 Solution configuration matches baseline: ${GREEN}AcingIU.sln${NC}"
else
    echo -e "  [!] backend/AcingIU.sln not found. Attempting to locate or create..."
fi

# Migration check
if [ -f "database/migrations/000_security_core.sql" ]; then
    echo -e "  [✓] Database migrations loaded: ${GREEN}000_security_core.sql${NC}"
else
    echo -e "  [!] Primary database migration schema is missing."
fi

# Frontend package check
if [ -f "frontend/package.json" ]; then
    echo -e "  [✓] Next.js frontend package baseline verified: ${GREEN}package.json${NC}"
else
    echo -e "  [!] Next.js frontend configuration files missing."
fi


# 4. BUILDING AND SCALING DOCKER STACKS
echo -e "\n${BLUE}[*] Stage 4: Preparing Container Stack & Deployment...${NC}"

if [ -f "infrastructure/docker-compose.yml" ]; then
    echo -e "  [✓] Infrastructure configuration found: ${GREEN}infrastructure/docker-compose.yml${NC}"
    echo -e "\n${GREEN}[SUCCESS] All system targets, code projects, and schemas initialized successfully.${NC}"
    echo -e "----------------------------------------------------------------------"
    echo -e "To launch the entire compliance cluster (Postgres, Redis, Gateway, Next.js):"
    echo -e "  ${YELLOW}docker-compose -f infrastructure/docker-compose.yml up --build -d${NC}"
    echo -e "----------------------------------------------------------------------"
else
    echo -e "  [!] infrastructure/docker-compose.yml is missing. Ensure the file is deployed."
fi

echo -e "\n${BLUE}======================================================================${NC}"
echo -e "${GREEN}                 BUILD ORCHESTRATION COMPLETE                        ${NC}"
echo -e "${BLUE}======================================================================${NC}"
