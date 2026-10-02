# =============================================================================
# Acing IU - Device Trust API
# Repository-root Docker build context
# =============================================================================

FROM mcr.microsoft.com/dotnet/sdk:8.0@sha256:5dfdb3b19e6900a3dc449760547a0a3fdd1f47900062d274d57e7ab725484c16 AS build

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

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine@sha256:b288317d8ed45bb763fa95dbc807cf9d36e3bf9373ec2fac6b6548675f1f4b23 AS runtime

WORKDIR /app

# Alpine includes BusyBox wget; verify the health-check dependency during build.
RUN wget --help >/dev/null 2>&1

ENV ASPNETCORE_URLS=http://+:8081
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

# .NET 8 images include the unprivileged 'app' user.
USER app

EXPOSE 8081

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8081/health/live || exit 1

ENTRYPOINT ["dotnet", "AcingIU.DeviceTrust.Api.dll"]
