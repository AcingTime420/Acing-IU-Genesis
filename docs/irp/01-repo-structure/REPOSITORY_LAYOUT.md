# Canonical repository layout

```
Acing-IU/
├── README.md
├── LICENSE
├── SECURITY.md
├── .gitignore
├── .editorconfig
├── .github/
│   └── workflows/
│       ├── ci.yml                 # build, test, lint, secret scan
│       ├── container.yml          # image build + Trivy
│       └── openapi-lint.yml
├── backend/
│   ├── AcingIU.sln
│   ├── SharedKernel/src/AcingIU.SharedKernel/
│   ├── Identity/src/AcingIU.Identity.Api/
│   └── DeviceTrust/src/AcingIU.DeviceTrust.Api/
├── infrastructure/
│   ├── docker-compose.yml
│   ├── .env.example
│   ├── nginx/
│   ├── postgres/init/
│   ├── redis/
│   └── scripts/
├── installer/                     # Windows packaging (Inno + NSIS)
├── docs/
│   ├── irp/                       # copy or submodule of this IRP
│   ├── adrs/                      # mirrors 09-adrs
│   └── runbooks/
└── tests/
    ├── Identity.UnitTests/
    ├── DeviceTrust.UnitTests/
    └── e2e/
```

## Naming rules

- C# projects: `AcingIU.<Context>.Api`  
- Docker services: `identity`, `device-trust`, `postgres`, `redis`, `gateway`  
- DB tables: `snake_case`  
- HTTP routes: `/api/<context>/...`  

## Branching

| Branch | Purpose |
|--------|---------|
| `main` | Protected; release-ready |
| `develop` | Integration |
| `feature/*` | Workstreams |
| `release/genesis-1.0` | Stabilization |

## Required root files

- `.gitignore` — secrets, bin/obj, node_modules, `.env`, Buddy/Refact noise  
- `.editorconfig` — UTF-8, LF, C# indent 4  
- `SECURITY.md` — vulnerability reporting  
