# Base image for running the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0@sha256:149d139eb6f11b9be8bc99c4d8cbd14f662d64d83359079ebb59e5f4a97bbefe AS base
WORKDIR /app
EXPOSE 8080

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0@sha256:5dfdb3b19e6900a3dc449760547a0a3fdd1f47900062d274d57e7ab725484c16 AS build
WORKDIR /src
COPY ["Gateway/Gateway.csproj", "Gateway/"]
COPY ["Shared/Shared.csproj", "Shared/"]
RUN dotnet restore "Gateway/Gateway.csproj"
COPY . .
WORKDIR "/src/Gateway"
RUN dotnet build "Gateway.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "Gateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Gateway.dll"]
