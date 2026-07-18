# Backend AI Development & Architecture Guidelines

This is a production-grade Quick Commerce Backend built with Node.js,
Fastify, TypeScript, MongoDB, Mongoose, JWT authentication, Docker, and REST
APIs. It's expected to scale to hundreds of APIs, dozens of business
modules, multiple developers, and future microservices — every change must
preserve clean architecture, scalability, consistency, maintainability, type
safety, and production readiness.

**Status:** target architecture for new work. The current tree (`api/v1/
{auth,admin}` with flat `controllers/services/repositories`, `config/`,
`middlewares/`, `types/`, `utils/`) predates this and has not been migrated —
do not assume `core/`, `shared/`, `jobs/`, DTOs, mappers, or the custom error
hierarchy exist until they're actually built.

## Target folder structure

```text
src/
│
├── api/
│   │
│   ├── v1/
│   │   │
│   │   ├── admin/
│   │   │
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── roles/
│   │   │   ├── permissions/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── categories/
│   │   │   ├── brands/
│   │   │   ├── inventory/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── sellers/
│   │   │   ├── stores/
│   │   │   ├── delivery/
│   │   │   ├── coupons/
│   │   │   ├── promotions/
│   │   │   ├── banners/
│   │   │   ├── analytics/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   ├── notifications/
│   │   │   └── uploads/
│   │   │
│   │   ├── app/
│   │   │
│   │   └── index.ts
│   │
│   └── index.ts
│
├── core/
│   ├── auth/
│   ├── cache/
│   ├── config/
│   ├── database/
│   ├── decorators/
│   ├── exceptions/
│   ├── logger/
│   ├── middlewares/
│   ├── permissions/
│   ├── plugins/
│   ├── validation/
│   └── index.ts
│
├── shared/
│   ├── constants/
│   ├── enums/
│   ├── dto/
│   ├── errors/
│   ├── helpers/
│   ├── interfaces/
│   ├── types/
│   ├── utils/
│   └── validators/
│
├── jobs/
│
├── scripts/
│
├── tests/
│   ├── integration/
│   ├── unit/
│   ├── fixtures/
│   └── mocks/
│
├── app.ts
├── server.ts
└── index.ts
```

## Module structure

Every business module follows the exact same structure:

```text
products/
    controller.ts
    service.ts
    repository.ts
    routes.ts
    model.ts
    schema.ts
    dto.ts
    mapper.ts
    constants.ts
    enums.ts
    types.ts
    index.ts
```

If a module grows large, pluralize each file into its own folder
(`controllers/`, `services/`, `repositories/`, `routes/`, `dto/`, `schemas/`,
`models/`, `mappers/`, `constants/`, `enums/`, `types/`, `utils/`, plus
`index.ts`).

## Development rules

1. **Feature-first architecture.** Every business feature owns its routes,
   controllers, services, repositories, models, DTOs, schemas, enums,
   constants, utilities, mappers, and types. Never scatter a feature across
   the project.
2. **Layer responsibility.** Strictly `Route → Controller → Service →
   Repository → Database`. Never skip a layer.
3. **Controllers** only validate/parse the request, call the service, and
   return the response. Never contain business logic.
4. **Services** contain business logic only (login, inventory calculation,
   order creation, coupon validation, pricing, tax calculation). Never query
   the database directly inside a controller.
5. **Repository layer** is responsible ONLY for database access
   (`findById()`, `findByEmail()`, `create()`, `update()`, `delete()`,
   `aggregate()`, `paginate()`). Never query MongoDB directly inside a
   service.
6. **Models** stay inside their own feature — never one huge shared models
   folder.
7. **DTOs.** Never pass raw request bodies into services — always a DTO
   (`LoginRequestDto`, `CreateProductDto`, `UpdateProductDto`,
   `OrderFilterDto`).
8. **Validation** on every endpoint via Fastify schemas, never duplicated.
9. **Mappers.** Never expose Mongo documents directly — always map entities
   into response DTOs. Never leak `_password`, `__v`, internal IDs, or
   private fields.
10. **Response format** is always consistent:
    - Success: `{ "success": true, "message": "Success", "data": {}, "meta": {} }`
    - Error: `{ "success": false, "message": "Validation failed", "errors": [] }`
11. **Pagination.** Every listing endpoint supports `page`, `limit`,
    `search`, `sort`, `filters`, and returns metadata.
12. **Enums** for statuses, roles, permissions, order states, payment
    states, inventory states — never hardcoded.
13. **Constants** for limits, regex, collection names, headers, cookie
    names, JWT keys, storage keys, timeouts, messages, routes — never
    hardcoded.
14. **Type safety.** Never `any`. Every request, response, DTO, model,
    repository, and service is fully typed.
15. **Error handling.** Never throw generic errors — use custom error
    classes (`ValidationError`, `UnauthorizedError`, `ForbiddenError`,
    `ConflictError`, `NotFoundError`, `InternalServerError`).
16. **Logging.** Never `console.log` — use the centralized logger. Every log
    includes timestamp, request ID, user ID, route, method, execution time.
17. **Configuration** always comes from typed config files (JWT, Mongo,
    Redis, S3, SMTP, rate limits, uploads, environment) — never hardcoded.
18. **Authentication** (JWT, refresh tokens, permissions, roles, guards,
    decorators) is isolated inside `core/auth`.
19. **Authorization.** Permission checks are never duplicated — always via
    centralized authorization middleware/decorators.
20. **Middleware.** Global middleware lives in `core/middlewares`; feature
    middleware lives inside its feature.
21. **Plugins.** Fastify plugins live in `core/plugins` — never registered
    inside feature modules.
22. **Shared utilities** — only truly reusable ones go in `shared/utils`;
    feature utilities stay inside the feature.
23. **Helpers.** Business-specific helpers stay inside modules; generic
    helpers go in `shared/helpers`.
24. **Database.** Never expose Mongoose models outside repositories —
    repositories are the only layer allowed to talk to MongoDB.
25. **Transactions** for complex write operations wherever applicable.
26. **Background jobs** (emails, notifications, inventory sync, cleanup,
    analytics) are implemented as jobs, never inline in controllers.
27. **Security.** Always validate/sanitize input, escape output when
    needed, hash passwords, never expose secrets, never trust client input,
    validate JWTs, rate-limit where required.
28. **API versioning.** All public APIs stay versioned (`/api/v1/`,
    `/api/v2/`) — never remove an old version without a migration path.
29. **Naming convention.** Controllers: `UserController`. Services:
    `UserService`. Repositories: `UserRepository`. DTOs: `CreateUserDto`.
    Enums: `UserStatus`. Models: `UserModel`. Files: kebab-case.
30. **Imports.** Always absolute, never long relative chains.
31. **Tests.** Every feature supports unit tests, integration tests, test
    fixtures, and mock data — business logic must always be testable.
32. **Documentation.** Public APIs document request, response, validation,
    error codes, and permissions.
33. **Reusability.** Before creating a service/utility/helper/middleware/
    decorator/repository, search for an existing implementation first.
34. **Single responsibility.** One responsibility per file. No God services,
    no God controllers, no massive repositories.
35. **Performance.** Optimize indexes, aggregation, pagination, projection,
    bulk operations. Avoid unnecessary queries and unnecessary fields.
36. **Maintain existing patterns.** Search for a similar implementation
    first and reuse it — never introduce a second pattern for the same
    problem.
37. **Backward compatibility.** Never break existing APIs without
    versioning; never change response structures without migration.
38. **Code quality.** Small functions, focused classes, avoid nested logic,
    extract reusable code, prefer composition over duplication.
39. **Mandatory checklist before generating code:** search existing
    implementation → reuse existing architecture → follow feature-first
    structure → respect controller → service → repository flow → never
    duplicate code → use DTOs/schemas/repositories/typed responses/enums/
    constants/custom errors/centralized logging → keep modules isolated →
    preserve API consistency → ensure production readiness, scalability,
    security, and maintainability.
