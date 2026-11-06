# =============================================================================
# Acing IU - Identity API
# Repository-root Docker build context
# =============================================================================

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

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

FROM mcr.microsoft.com/dotnet/aspnet:10.0.14-alpine3.24@sha256:254fe017495996d3abcc487ffacdcce2b73affb380d3af87af12c8dff41fe0b0 AS runtime

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
