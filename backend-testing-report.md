# Investly Backend Testing Report

Date: 2026-06-09

Branch tested: `Backend-Work`

Commit tested: `f0d785c fix: stabilize backend api recovery`

Backend URL: `http://localhost:5000`

## Summary

| # | Test Category | Result |
|---:|---|---|
| 1 | Build Verification | Passed |
| 2 | Functional Testing | Passed |
| 3 | Integration & API Testing | Passed |
| 4 | Security Testing | Passed |
| 5 | Load & Performance Testing | Passed for local baseline |
| 6 | Unit Testing | Not available yet because there is no test project |

## Build Verification

| # | Check | Result |
|---:|---|---|
| 1 | `dotnet build` | Passed with 0 errors |
| 2 | Backend startup | Passed |
| 3 | Swagger JSON | Passed |

Note: The backend still has nullable warnings. These are warnings, not build errors.

## Functional Testing

| # | Test Case | Result |
|---:|---|---|
| 1 | Register investor without `CompanyName` | Passed |
| 2 | Register entrepreneur | Passed |
| 3 | Login temporary admin test user | Passed |
| 4 | Create investor profile | Passed |
| 5 | Get investor profile | Passed |
| 6 | Create entrepreneur profile | Passed |
| 7 | Get entrepreneur profile | Passed |
| 8 | Get investor wallet | Passed |
| 9 | Deposit into wallet | Passed |
| 10 | Get wallet transactions | Passed |
| 11 | Entrepreneur creates project | Passed |
| 12 | Get project details | Passed |
| 13 | Submit project | Passed |
| 14 | Admin approves project | Passed |
| 15 | Add project view | Passed |
| 16 | Investor creates investment | Passed |
| 17 | Get investment details | Passed |
| 18 | Confirm investment | Passed |
| 19 | Get my investments | Passed |
| 20 | Get portfolio summary | Passed |
| 21 | Admin dashboard with recent activities | Passed |
| 22 | Admin stats | Passed |
| 23 | Admin projects | Passed |
| 24 | Admin investments | Passed |
| 25 | Admin activity logs | Passed |
| 26 | Send admin notification | Passed |
| 27 | Investor notifications | Passed |
| 28 | Unread notification count | Passed |
| 29 | Mark notifications read with empty list | Passed |

## Integration & API Testing

| # | Test Case | Result |
|---:|---|---|
| 1 | Swagger JSON reachable | Passed |
| 2 | Swagger path count is 55 | Passed |
| 3 | Root helper `/` hidden from Swagger | Passed |
| 4 | Public projects list | Passed |
| 5 | Featured projects | Passed |
| 6 | Categories | Passed |
| 7 | Auth `/me` after investor registration | Passed |
| 8 | Auth `/me` after entrepreneur registration | Passed |

## Security Testing

| # | Test Case | Expected | Result |
|---:|---|---|---|
| 1 | Wallet without token | `401 Unauthorized` | Passed |
| 2 | Public registration cannot create Admin role | `403 Forbidden` on admin endpoint | Passed |
| 3 | Investor cannot approve project | `403 Forbidden` | Passed |
| 4 | Investor cannot access another user's wallet | `403 Forbidden` | Passed |
| 5 | Investor cannot access admin user list | `403 Forbidden` | Passed |
| 6 | Admin can access user list | `200 OK` | Passed |

## Load & Performance Testing

Local load test:

| # | Metric | Result |
|---:|---|---:|
| 1 | Total requests | 1,000 |
| 2 | Concurrency | 50 |
| 3 | Successful requests | 1,000 |
| 4 | Failed requests | 0 |
| 5 | Requests per second | 1,614.53 |
| 6 | Average response time | 28.90 ms |
| 7 | P50 response time | 26.14 ms |
| 8 | P95 response time | 48.27 ms |
| 9 | P99 response time | 70.13 ms |
| 10 | Max response time | 90.04 ms |

Endpoints used in load test:

| # | Endpoint | Requests | Success |
|---:|---|---:|---:|
| 1 | `GET /api/Projects?page=1&pageSize=10` | 250 | 250 |
| 2 | `GET /api/Projects/categories` | 250 | 250 |
| 3 | `GET /api/Projects/featured` | 250 | 250 |
| 4 | `GET /swagger/v1/swagger.json` | 250 | 250 |

## 1 Million Users Question

This local test does not prove the app can handle 1 million users.

The current backend can handle normal graduation-project testing locally, but 1 million users would require production infrastructure such as:

| # | Requirement | Why It Matters |
|---:|---|---|
| 1 | Cloud hosting / multiple backend instances | One Rider/local server cannot serve 1 million users |
| 2 | Load balancer | Distributes traffic across servers |
| 3 | Production SQL Server sizing | Local SQL Server is not enough |
| 4 | Database indexing and query optimization | Prevents slow queries under large data |
| 5 | Caching | Reduces repeated database reads |
| 6 | Background jobs | Keeps slow work out of API requests |
| 7 | Real load test tool | Needed to simulate thousands of virtual users |
| 8 | Monitoring | Tracks CPU, memory, database, errors, latency |

Practical conclusion:

The backend passed local functional, API, security, and baseline load tests. It is suitable to continue graduation-project testing. It is not yet proven or architected for 1 million real users.

## Notes

- Temporary test users and test projects were created in the local `InvestlyDb` database.
- A temporary admin test user was assigned the Admin role directly in the local database only to test admin endpoints.
- No real email password was used.
- No code was pushed during this testing phase.
