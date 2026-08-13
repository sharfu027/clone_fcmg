# INK FMCG Enterprise ERP — ASP.NET Core 9 Backend

Production-ready ASP.NET Core 9 Clean Architecture foundation solution for the INK FMCG Enterprise ERP.

## Solution Architecture

```text
INK.ERP.sln
│
├── src/
│   ├── INK.ERP.API                 # ASP.NET Core 9 Web API (Controllers, Swagger, ProblemDetails, CORS, Serilog)
│   ├── INK.ERP.Application         # Application Business Rules (Use cases, FluentValidation)
│   ├── INK.ERP.Domain              # Domain Driven Design Core (Entities, Value Objects, Domain Events)
│   ├── INK.ERP.Infrastructure      # External Adapters (EF Core, Repositories, Redis, Services)
│   └── INK.ERP.Shared              # Cross-Cutting Utilities & Result Models
│
└── tests/
    ├── INK.ERP.UnitTests           # xUnit Domain & Application Unit Tests
    └── INK.ERP.IntegrationTests    # WebApplicationFactory API Integration Tests
```

## Clean Architecture Dependency Diagram

```text
             ┌────────────────────────┐
             │       INK.ERP.API      │
             └───────────┬────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Application │ │Infrastructure│ │    Shared    │
└───────┬──────┘ └───────┬──────┘ └──────────────┘
        │                │
        └────────┬───────┘
                 │
                 ▼
          ┌──────────────┐
          │    Domain    │
          └──────────────┘
```

## Configured Enterprise Infrastructure
- **ASP.NET Core 9**: `net9.0` target framework.
- **Central Package Management (CPM)**: Package versions managed centrally via `Directory.Packages.props`.
- **Global Settings**: `Directory.Build.props` enforces `<Nullable>enable</Nullable>`, `<ImplicitUsings>enable</ImplicitUsings>`, and `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.
- **Serilog**: Structured console logging configured via `Serilog.AspNetCore`.
- **Global Exception Handling**: RFC 7807 `ProblemDetails` middleware via `GlobalExceptionHandler.cs`.
- **Health Checks**: `/health` & `api/v1/health` endpoints mapped.
- **Swagger / OpenAPI**: Auto-generated API documentation enabled.
- **CORS**: Multi-origin client access policy (`AllowFrontendClient`).
