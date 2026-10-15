# =============================================================================
# Acing IU - Identity API
# Repository-root Docker build context
# =============================================================================

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

COPY backend/SharedKernel/src/AcingIU.SharedKernel/AcingIU.SharedKernel.csproj backend/SharedKernel/src/AcingIU.SharedKernel/
COPY backend/Identity/src/AcingIU.Identity.Api/AcingIU.Identity.Api.csproj backend/Identity/src/AcingIU.Identity.Api/

RUN dotnet restore backend/Identity/src/AcingIU.Identity.Api/AcingIU.Identity.Api.csproj

COPY backend/SharedKernel/src/AcingIU.SharedKernel/ backend/SharedKernel/src/AcingIU.SharedKernel/
COPY backend/Identity/src/AcingIU.Identity.Api/ backend/Identity/src/AcingIU.Identity.Api/

RUN dotnet publish backend/Identity/src/AcingIU.Identity.Api/AcingIU.Identity.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0.32-alpine3.24@sha256:cf6f271f1c106dcb4dd403e7b3dc03b0c508dabef348c51fd6a709b12cda69b0 AS runtime

WORKDIR /app

RUN wget --help >/dev/null 2>&1

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

USER app

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "AcingIU.Identity.Api.dll"]
