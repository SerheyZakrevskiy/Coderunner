# Testing Strategy

This document describes manual and functional testing of the CodeRunner project.

## Testing Goals

The goal of testing is to verify that the system correctly supports:

- user registration and authentication;
- guest code execution;
- authenticated code execution;
- execution history;
- execution details;
- sandbox isolation;
- timeout handling;
- compile/runtime error handling;
- API documentation;
- health monitoring.

## Test Environment

- OS: Windows 11
- Docker Desktop
- Node.js 22
- PostgreSQL 16
- Redis 7
- Backend: NestJS
- Frontend: Next.js
- Worker: NestJS + BullMQ
- Browser: Google Chrome

## Manual Test Cases

| ID    | Test Case                    | Steps                                            | Expected Result                                          | Status |
| ----- | ---------------------------- | ------------------------------------------------ | -------------------------------------------------------- | ------ |
| TC-01 | Open dashboard as guest      | Open `/` without JWT token                       | Dashboard opens, editor is available                     | Passed |
| TC-02 | Guest Python execution       | Run `print(123)` as guest                        | Status `completed`, stdout `123`                         | Passed |
| TC-03 | Guest JavaScript execution   | Run `console.log(123)` as guest                  | Status `completed`, stdout `123`                         | Passed |
| TC-04 | Guest C++ execution          | Run simple C++ Hello World                       | Status `completed`, stdout contains text                 | Passed |
| TC-05 | Python timeout               | Run `while True: pass`                           | Status `timeout`, stderr contains timeout message        | Passed |
| TC-06 | JavaScript timeout           | Run `while (true) {}`                            | Status `timeout`, stderr contains timeout message        | Passed |
| TC-07 | C++ compile error            | Run C++ code with syntax error                   | Status `failed`, stderr contains compiler error          | Passed |
| TC-08 | C++ runtime error            | Run C++ code with `vector.at(10)`                | Status `failed`, stderr contains runtime error           | Passed |
| TC-09 | User registration            | Register new user with valid email/password/name | User is created, JWT token returned                      | Passed |
| TC-10 | User login                   | Login with valid credentials                     | JWT token returned, redirect to profile/dashboard        | Passed |
| TC-11 | Invalid login                | Login with wrong credentials                     | Error message is shown                                   | Passed |
| TC-12 | Profile access without login | Open `/profile` without JWT token                | Redirect to `/login`                                     | Passed |
| TC-13 | Profile statistics           | Open `/profile` after login                      | User statistics and recent runs are displayed            | Passed |
| TC-14 | Run history                  | Execute code as authenticated user               | Run appears in profile and recent runs                   | Passed |
| TC-15 | Run details                  | Open run details page                            | Code, stdout, stderr, status and exit code are displayed | Passed |
| TC-16 | Swagger documentation        | Open `/api/docs`                                 | Swagger UI opens and shows API endpoints                 | Passed |
| TC-17 | Health check                 | Open `/health`                                   | API, database and Redis statuses are returned            | Passed |
| TC-18 | Theme switcher               | Switch Dark/Light theme                          | UI theme changes and persists                            | Passed |
| TC-19 | CI pipeline                  | Push code to GitHub                              | Backend, worker and frontend builds pass                 | Passed |

## Sandbox Security Checks

| Check                | Implementation               | Status |
| -------------------- | ---------------------------- | ------ |
| CPU limit            | Docker `--cpus=0.5`          | Passed |
| Memory limit         | Docker `--memory=128m/256m`  | Passed |
| Network isolation    | Docker `--network=none`      | Passed |
| Process limit        | Docker `--pids-limit=64`     | Passed |
| Read-only filesystem | Docker `--read-only`         | Passed |
| Temporary filesystem | Docker `--tmpfs`             | Passed |
| Execution timeout    | Worker timeout using `execa` | Passed |

## CI/CD Testing

The project uses GitHub Actions CI pipeline.

The CI workflow checks:

- backend build;
- worker build;
- frontend build;
- Prisma Client generation.

CI status: Passed.

## Conclusion

Manual and functional testing confirmed that the main project features work correctly:

- code execution works for Python, JavaScript and C++;
- sandbox restrictions are applied;
- timeout and error handling work correctly;
- authentication and user history work correctly;
- API documentation and health monitoring are available;
- CI pipeline successfully validates the project build.
