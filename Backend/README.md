# Tripora backend

Each service is an ASP.NET Core Web API project with an independent database and a consistent internal layout.

## Service folders

- `Controllers`: HTTP endpoints only. Keep business logic out of these classes.
- `DTOs`: request and response objects used by API endpoints.
- `Models`: domain entities owned by this service.
- `Services`: business rules and application workflows.
- `Data`: Entity Framework `DbContext`, configurations, and migrations.
- `Repositories`: database queries and persistence abstractions.
- `Events`: events this service publishes or consumes.

## Ownership

| Service | Primary responsibility |
| --- | --- |
| User | accounts, login, roles, and profiles |
| Hotel | hotels, rooms, prices, and availability |
| Tour | tour packages, schedules, capacity, and prices |
| Booking | creating and managing bookings |
| Payment | payment processing and refunds |
| Notification | email, SMS, and push notifications |

`Shared` is deliberately small: it holds cross-service contracts and event message definitions, not entity models or database code.
