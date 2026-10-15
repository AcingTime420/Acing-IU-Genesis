FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY AcingIU.DeviceTrust.Api.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine3.23@sha256:819714070a3a11a1df9ac9daa614c280e62c6aff7b13c29d3ba5498fcfc45e57 AS runtime
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
