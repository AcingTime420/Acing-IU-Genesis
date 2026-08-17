# =============================================================================
# Acing IU - Identity API
# Repository-root Docker build context
# =============================================================================

FROM mcr.microsoft.com/dotnet/sdk:8.0@sha256:5dfdb3b19e6900a3dc449760547a0a3fdd1f47900062d274d57e7ab725484c16 AS build

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

FROM mcr.microsoft.com/dotnet/aspnet:8.0@sha256:149d139eb6f11b9be8bc99c4d8cbd14f662d64d83359079ebb59e5f4a97bbefe AS runtime

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends wget \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "AcingIU.Identity.Api.dll"]
