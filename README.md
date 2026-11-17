# ZincBank Playwright Tests

End-to-end browser tests for the ZincBank login experience at
[`https://zincbank.cydeo.io`](https://zincbank.cydeo.io). The application is remote; this
repository contains the Playwright tests and test plan, not the application source.

## Requirements

- Node.js LTS and npm
- Playwright browser binaries for Chromium, Firefox, and WebKit
- Valid ZincBank test credentials for scenarios that log in

## Setup

Install dependencies and browser binaries:

```sh
npm ci
npx playwright install
```

Create a `.env` file in the project root with the test account credentials:

```dotenv
ZINC_EMAIL=your-test-account-email
ZINC_PASSWORD=your-test-account-password
```

The Playwright configuration loads `.env` automatically. Keep real credentials private:
`.env` is ignored by Git and must not be committed. CI environments also need to provide
`ZINC_EMAIL` and `ZINC_PASSWORD`.

## Run tests

Run the full suite in all configured browsers:

```sh
npx playwright test
```

Run a specific spec:

```sh
npx playwright test tests/navigation-and-ui-ux.spec.ts
```

Run a specific browser project:

```sh
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

The Firefox and WebKit projects depend on earlier browser projects in the Playwright
configuration. To run only one project without its dependencies, add `--no-deps`.

Open the HTML report after a run:

```sh
npx playwright show-report
```

## Test coverage

The ZincBank scenarios are documented in [`specs/zincbank-login-test-plan.md`](specs/zincbank-login-test-plan.md).

| Spec | Coverage |
| --- | --- |
| `tests/login-with-valid-credentials.spec.ts` | Successful login (TC-001–002) |
| `tests/validation-and-error-handling.spec.ts` | Form validation and errors (TC-003–009) |
| `tests/edge-cases-and-input-handling.spec.ts` | Email/password edge cases (TC-010–016) |
| `tests/session-management-and-route-protection.spec.ts` | Sessions and protected routes (TC-017–020) |
| `tests/navigation-and-ui-ux.spec.ts` | Navigation and login form UX (TC-021–026) |
| `tests/accessibility-and-responsiveness.spec.ts` | Keyboard access, error semantics, and mobile layout (TC-027–029) |

`tests/example.spec.ts` is the Playwright starter example and tests `playwright.dev`.
