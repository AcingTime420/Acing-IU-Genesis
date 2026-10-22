# =============================================================================
# Acing IU - Device Trust API
# Repository-root Docker build context
# =============================================================================

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY backend/SharedKernel/src/AcingIU.SharedKernel/AcingIU.SharedKernel.csproj backend/SharedKernel/src/AcingIU.SharedKernel/
COPY backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/AcingIU.DeviceTrust.Api.csproj backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/

RUN dotnet restore backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/AcingIU.DeviceTrust.Api.csproj

COPY backend/SharedKernel/src/AcingIU.SharedKernel/ backend/SharedKernel/src/AcingIU.SharedKernel/
COPY backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/ backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/

RUN dotnet publish backend/DeviceTrust/src/AcingIU.DeviceTrust.Api/AcingIU.DeviceTrust.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0.13-alpine3.24@sha256:284a1c3072bae5cb3b063e80e135f701b8477b3bcaf8a3cfb6e513a585ed3acf AS runtime

WORKDIR /app

RUN wget --help >/dev/null 2>&1

ENV ASPNETCORE_URLS=http://+:8081
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

USER app

EXPOSE 8081

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8081/health/live || exit 1

ENTRYPOINT ["dotnet", "AcingIU.DeviceTrust.Api.dll"]
