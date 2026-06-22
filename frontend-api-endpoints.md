# Investly Backend API Paths For Frontend Team

## Base URLs

| # | Environment | Base URL |
|---:|---|---|
| 1 | Rider / local browser | `http://localhost:5000/api` |
| 2 | Android emulator | `http://10.0.2.2:5000/api` |
| 3 | Physical phone | `http://YOUR_PC_LAN_IP:5000/api` |

For protected endpoints, send the JWT token like this:

```http
Authorization: Bearer YOUR_TOKEN
```

## Auth

| # | Feature | Method | Path |
|---:|---|---|---|
| 1 | Login | `POST` | `/Auth/login` |
| 2 | Login by email | `POST` | `/Auth/login-email` |
| 3 | Register | `POST` | `/Auth/register` |
| 4 | Current user | `GET` | `/Auth/me` |
| 5 | Get profile | `GET` | `/Auth/profile` |
| 6 | Update profile | `PUT` | `/Auth/profile` |
| 7 | Change password | `POST` | `/Auth/change-password` |
| 8 | Logout | `POST` | `/Auth/logout` |

## Projects

| # | Feature | Method | Path |
|---:|---|---|---|
| 9 | Projects list | `GET` | `/Projects` |
| 10 | Featured projects | `GET` | `/Projects/featured` |
| 11 | Project details | `GET` | `/Projects/{id}` |
| 12 | Project categories | `GET` | `/Projects/categories` |
| 13 | Create project | `POST` | `/Projects` |
| 14 | Update project | `PUT` | `/Projects/{id}` |
| 15 | Delete project | `DELETE` | `/Projects/{id}` |
| 16 | Submit project | `POST` | `/Projects/{id}/submit` |
| 17 | Add project view | `POST` | `/Projects/{id}/views` |

## Investments

| # | Feature | Method | Path |
|---:|---|---|---|
| 18 | My investments | `GET` | `/Investments/my` |
| 19 | Investment details | `GET` | `/Investments/{id}` |
| 20 | Create investment | `POST` | `/Investments` |
| 21 | Confirm investment | `POST` | `/Investments/{id}/confirm` |
| 22 | Cancel investment | `POST` | `/Investments/{id}/cancel` |
| 23 | Portfolio summary | `GET` | `/Investments/portfolio/summary` |

## Wallet

| # | Feature | Method | Path |
|---:|---|---|---|
| 24 | My wallet | `GET` | `/Wallet` |
| 25 | Deposit | `POST` | `/Wallet/deposit` |
| 26 | Withdraw | `POST` | `/Wallet/withdraw` |
| 27 | Wallet transactions | `GET` | `/Wallet/transactions` |

## Notifications

| # | Feature | Method | Path |
|---:|---|---|---|
| 28 | Notifications | `GET` | `/Notifications` |
| 29 | Unread notifications count | `GET` | `/Notifications/unread-count` |
| 30 | Mark notifications read | `POST` | `/Notifications/mark-read` |

## Media

| # | Feature | Method | Path |
|---:|---|---|---|
| 31 | Upload media | `POST` | `/Media/upload` |
| 32 | Project media | `GET` | `/Media/project/{projectId}` |
| 33 | Delete media | `DELETE` | `/Media/{id}` |

## Users And Profiles

| # | Feature | Method | Path |
|---:|---|---|---|
| 34 | Get user | `GET` | `/Users/{id}` |
| 35 | Update user | `PUT` | `/Users/{id}` |
| 36 | User wallet | `GET` | `/Users/{id}/wallet` |
| 37 | Create investor profile | `POST` | `/Users/investor-profile` |
| 38 | Get investor profile | `GET` | `/Users/investor-profile` |
| 39 | Create entrepreneur profile | `POST` | `/Users/entrepreneur-profile` |
| 40 | Get entrepreneur profile | `GET` | `/Users/entrepreneur-profile` |

## Admin Endpoints

These are for the admin dashboard only, not the mobile investor/entrepreneur app.

| # | Feature | Method | Path |
|---:|---|---|---|
| 41 | Admin dashboard | `GET` | `/Admin/dashboard` |
| 42 | Admin stats | `GET` | `/Admin/stats` |
| 43 | Admin users | `GET` | `/Admin/users` |
| 44 | Admin projects | `GET` | `/Admin/projects` |
| 45 | Approve project | `POST` | `/Admin/projects/{id}/approve` |
| 46 | Reject project | `POST` | `/Admin/projects/{id}/reject` |
| 47 | Ban user | `POST` | `/Admin/users/{id}/ban` |
| 48 | Unban user | `POST` | `/Admin/users/{id}/unban` |
| 49 | Suspend user | `POST` | `/Admin/users/{id}/suspend` |
| 50 | Unsuspend user | `POST` | `/Admin/users/{id}/unsuspend` |
| 51 | Admin payments | `GET` | `/Admin/payments` |
| 52 | Admin investments | `GET` | `/Admin/investments` |
| 53 | Send notification | `POST` | `/Admin/notifications/send` |
| 54 | Activity logs | `GET` | `/Admin/activity-logs` |
| 55 | Pending KYC | `GET` | `/Admin/kyc/pending` |
| 56 | Approve KYC | `POST` | `/Admin/kyc/{id}/approve` |
| 57 | Reject KYC | `POST` | `/Admin/kyc/{id}/reject` |
