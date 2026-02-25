FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY AuthApi/*.csproj ./AuthApi/
RUN dotnet restore ./AuthApi/AuthApi.csproj

COPY . .
WORKDIR /src/AuthApi
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "AuthApi.dll"]
