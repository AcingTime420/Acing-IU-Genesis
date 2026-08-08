# Acing IU Documentation Hub

Welcome to the **Acing IU** Technical Documentation repository. This directory contains the complete architectural specifications, system designs, requirement documents, and execution roadmaps for building the security-first Acing IU platform.

## Documentation Structure

*   [**SRS.md (Software Requirements Specification)**](./SRS.md): Comprehensive functional and non-functional requirements detailing the Knox-style security framework and primary system capabilities.
*   [**Architecture.md (System Architecture)**](./Architecture.md): Complete architecture diagram specifications, system boundary mappings, logical/physical component structures, and sequence flows.
*   [**Database.md (Data Model & Schema)**](./Database.md): Entity-relationship definitions, database strategies, and detailed PostgreSQL schema setups (including table setups for Identity, sessions, and device trust).
*   [**API.md (API Specifications)**](./API.md): Comprehensive REST API endpoint definitions for Identity, MFA, policy evaluation, and device tracking.
*   [**Roadmap.md (Implementation Roadmap)**](./Roadmap.md): Sprint-by-sprint release schedule, milestones, and definition of done (DoD) from Sprint S0 to production.
*   [**Testing.md (Verification & Testing)**](./Testing.md): Verification methodologies, unit tests, Robolectric setup, API integration validation, and automated health checks.
*   [**OTA_Testing.md (Wireless Device OTA Performance)**](./OTA_Testing.md): Standardized RF performance parameters (TRP, TIS, C-TIS, A-GNSS) and uncertainty limits integrated from CTIA v3.8.2.

---

## High-Level Vision
Acing IU is a Knox-inspired, zero-trust infrastructure platform centering identity, system policy compliance, and hardware-attested device trust score assessments before granting access to downstream modules (Device Center, Research Center, AI Workspace, and Analytics).
