# ZincBank — Login Functionality Test Plan

| | |
|---|---|
| **Application** | ZincBank (simulated bank for software-testing education) |
| **Under Test** | Login page — `https://zincbank.cydeo.io/login` |
| **Prepared By** | Playwright Test Planner Agent |
| **Version** | 1.0 |
| **Environment** | Staging (remote, HTTPS) |
| **Backend** | Supabase Auth (`rjjnqfkldqarppskdwwl.supabase.co/auth/v1/token?grant_type=password`) |

---

## 1. Objective

Validate the basic login functionality of the ZincBank application, including:

- Successful authentication flows (happy path)
- Form validation and error handling (negative paths)
- Edge cases, boundary conditions, and security-related inputs
- Session behavior (sign out, route protection)
- Navigation links and UI/UX behaviors
- Accessibility of the login form

Each scenario is **independent**, assumes a **blank/fresh state**, and can be executed in any order.

---

## 2. Prerequisites & Test Data

| Item | Value |
|---|---|
| Base URL | `https://zincbank.cydeo.io/login` |
| Valid email | `ZINC_EMAIL` |
| Valid password | `ZINC_PASSWORD` |
| Unregistered email (valid format) | `nonexistent.user@example.com` |
| Browsers | Chromium, Firefox, WebKit (Playwright projects) |
| Viewports | Desktop (1280×720) and mobile (e.g., Pixel 5 / iPhone 12) |

> **Assumption:** All scenarios start at `https://zincbank.cydeo.io/login` in a fresh, logged-out browser context (no saved cookies/local storage). Where a scenario requires prior login, that is stated explicitly.

### Locators / `data-testid` identifiers observed during exploration

| Element | `data-testid` | Notes |
|---|---|---|
| Login page container | `login-page` | `main` element |
| Email input | `login-email-input` | `type=email`, `autocomplete=email`, placeholder `you@example.com`, no `maxlength`/`required` |
| Password input | `login-password-input` | `type=password`, `autocomplete=current-password`, no show/hide toggle |
| Submit button | `login-submit` | Text: "Sign in" |
| Error / info message | `login-error` | Rendered as `role=note` |
| "Open an account" link | `login-apply-link` | Navigates to `/apply` |
| Sign out button (post-login) | `nav-signout` | Located in dashboard/nav header |
| Home "Log in" link | `home-nav-login` | Navigates to `/login` |

> The login `<form>` uses `novalidate` and `method="get"`; **all validation is custom/client-side (React)** plus **server-side auth via Supabase**. Native browser validation tooltips are therefore not expected.

---

## 3. Test Scenarios

### 3.1 Happy Path — Successful Login

#### TC-001: Login with valid credentials
- **Priority:** High
- **Preconditions:** Fresh logged-out session on the login page.
- **Steps:**
  1. Navigate to `https://zincbank.cydeo.io/login`.
  2. Enter `ZINC_EMAIL` into the **Email** field.
  3. Enter `ZINC_PASSWORD` into the **Password** field.
  4. Click the **Sign in** button.
- **Expected Results:**
  - User is redirected to the dashboard at `https://zincbank.cydeo.io/dashboard`.
  - Page title changes to "Dashboard · ZincBank".
  - Dashboard shows a personalized greeting, e.g., **"Welcome, Aziz"**.
  - Dashboard header exposes navigation: Dashboard, Accounts, Move money, Transactions, Cards, Profile, theme toggle, and Sign out.
  - Account summary renders (e.g., "Total deposit balance", Checking/Savings account cards).
  - A successful `POST` to Supabase auth token endpoint returns `200`.
- **Failure Conditions:** No redirect, error message displayed, or dashboard does not render user data.

#### TC-002: Login using Enter key instead of clicking Sign in
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Navigate to the login page.
  2. Fill both Email and Password with valid credentials.
  3. With focus in either field, press **Enter**.
- **Expected Results:** Form submits and user is redirected to `/dashboard` (same as clicking **Sign in**).
- **Failure Conditions:** Nothing happens on Enter, or validation error appears despite valid credentials.

---

### 3.2 Validation & Error Handling

#### TC-003: Submit completely empty form
- **Priority:** High
- **Preconditions:** Fresh logged-out session; both fields empty.
- **Steps:**
  1. Navigate to the login page.
  2. Click **Sign in** without entering anything.
- **Expected Results:**
  - No navigation occurs (URL remains `/login`).
  - An inline note appears with text: **"Enter your email and password."**
  - No network request to the Supabase auth endpoint is issued.
- **Failure Conditions:** Form submits empty values to backend, or no error message shown.

#### TC-004: Email provided, password missing
- **Priority:** High
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `ZINC_EMAIL` in Email.
  2. Leave Password empty.
  3. Click **Sign in**.
- **Expected Results:** Inline note **"Enter your email and password."** appears; no navigation; no backend request.
- **Failure Conditions:** Request is sent to backend with empty password, or error text is misleading.

#### TC-005: Password provided, email missing
- **Priority:** High
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `ZINC_PASSWORD` in Password.
  2. Leave Email empty.
  3. Click **Sign in**.
- **Expected Results:** Inline note **"Enter your email and password."** appears; no navigation; no backend request.
- **Failure Conditions:** Request is sent to backend with empty email.

#### TC-006: Invalid email format (syntactically malformed)
- **Priority:** High
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `notanemail` in Email.
  2. Enter `somepassword123` in Password.
  3. Click **Sign in**.
- **Expected Results:**
  - Inline note **"Enter your email and password."** appears (client-side format validation).
  - No request is sent to the Supabase auth endpoint (blocked client-side).
  - No navigation.
- **Failure Conditions:** Request reaches backend, or a more specific/technical error is shown.

#### TC-007: Valid email format with wrong password
- **Priority:** High
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `ZINC_EMAIL` in Email.
  2. Enter `wrongpassword123` in Password.
  3. Click **Sign in**.
- **Expected Results:**
  - Inline note **"Invalid email or password."** appears.
  - A `POST` to Supabase auth endpoint returns `400` with error code `invalid_credentials`.
  - URL remains `/login`; a console network error (400) is logged in the browser devtools (expected).
- **Failure Conditions:** Login succeeds, error message differs from expected, or app crashes/navigates away.

#### TC-008: Unregistered email with any password (user enumeration check)
- **Priority:** High
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `nonexistent.user@example.com` in Email.
  2. Enter `Whatever123!` in Password.
  3. Click **Sign in**.
- **Expected Results:** Generic message **"Invalid email or password."** — identical to TC-007 (no user enumeration).
- **Failure Conditions:** A distinct message such as "No account found" or "Email not registered" reveals whether the account exists.

#### TC-009: Error message persists while user edits fields
- **Priority:** Low
- **Preconditions:** Trigger an error first (e.g., TC-007 steps).
- **Steps:**
  1. Trigger the "Invalid email or password." error.
  2. Without resubmitting, type additional characters into the Email field.
  3. Observe the error note.
- **Expected Results (observed):** Error message remains visible until the form is resubmitted; it is **not** cleared on input change.
- **Failure Conditions:** Error disappears while typing (acceptable UX change — document it) or error remains stale after a successful re-submit.


---

### 3.3 Edge Cases & Input Handling

#### TC-010: Email case-insensitivity (uppercase email)
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `ZINC_EMAIL` in Email.
  2. Enter the valid password.
  3. Click **Sign in**.
- **Expected Results:** Login succeeds and user is redirected to `/dashboard` (email comparison is case-insensitive).
- **Failure Conditions:** Login fails due to case sensitivity.

#### TC-011: Leading/trailing whitespace in email is trimmed
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `  ZINC_EMAIL  ` (leading/trailing spaces) in Email.
  2. Enter the valid password.
  3. Click **Sign in**.
- **Expected Results:** Login succeeds; the request body submitted to Supabase contains the trimmed email `"ZINC_EMAIL"` (verified via network request body).
- **Failure Conditions:** Login fails, or untrimmed email is sent to the backend.

#### TC-012: Whitespace-only password
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter a valid email.
  2. Enter `   ` (spaces only) in Password.
  3. Click **Sign in**.
- **Expected Results:** Login is rejected with **"Invalid email or password."** (verify actual behavior and record). No navigation occurs.
- **Failure Conditions:** Whitespace password authenticates successfully.

#### TC-013: Very long email / password (boundary / stress)
- **Priority:** Low
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter an email of ~300 characters ending in a valid domain (e.g., `"a".repeat(300) + "@gmail.com"`).
  2. Enter a password of 500 characters.
  3. Click **Sign in**.
- **Expected Results (observed):**
  - Fields accept the long input (no `maxlength` client-side enforcement).
  - Login is rejected with **"Invalid email or password."**; the page does not crash or hang.
- **Failure Conditions:** Page crashes, becomes unresponsive, or long input causes layout breakage.

#### TC-014: Special characters in password
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter a valid email.
  2. Enter a password containing special characters (e.g., `P@ss$w0rd!`).
  3. Click **Sign in**.
- **Expected Results:** Login is rejected cleanly with **"Invalid email or password."** (no uncaught errors; page remains usable).
- **Failure Conditions:** Application error, console exception, or partial data displayed.

#### TC-015: SQL injection attempt in email field
- **Priority:** High (security)
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `' OR '1'='1' --` in Email.
  2. Enter `password` in Password.
  3. Click **Sign in**.
- **Expected Results (observed):**
  - Input is rejected client-side by email-format validation → **"Enter your email and password."**
  - No request is sent to the backend.
  - Login does **not** succeed.
- **Failure Conditions:** Injection string authenticates or reaches the backend unescaped.

#### TC-016: XSS script in email field
- **Priority:** High (security)
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Enter `<script>alert(1)</script>@example.com` (or similar XSS payload) in Email.
  2. Enter any password.
  3. Click **Sign in**.
- **Expected Results:** Payload is treated as plain text; no script executes; input is rejected or safely handled; no `alert()` dialog appears.
- **Failure Conditions:** Script executes, `alert` dialog appears, or unescaped HTML renders in the DOM.


---

### 3.4 Session Management & Route Protection

#### TC-017: Sign out returns user to login page
- **Priority:** High
- **Preconditions:** Authenticated session (login first via TC-001).
- **Steps:**
  1. Log in successfully.
  2. Click the **Sign out** button (header, `nav-signout`).
- **Expected Results:**
  - User is redirected to `/login`.
  - A `POST` to Supabase logout endpoint (`/auth/v1/logout?scope=global`) returns `204`.
  - Dashboard is no longer accessible without re-authentication.
- **Failure Conditions:** Sign out does not redirect, or the session persists after sign out.

#### TC-018: Unauthenticated access to protected route redirects to login
- **Priority:** High
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Navigate directly to `https://zincbank.cydeo.io/dashboard` (and repeat for `/accounts`, `/move-money`, `/transactions`, `/cards`, `/profile`).
- **Expected Results:** User is redirected to `/login`; protected content is never rendered.
- **Failure Conditions:** Protected page renders, or redirect loops.

#### TC-019: Visiting /login while already authenticated
- **Priority:** Medium
- **Preconditions:** Authenticated session.
- **Steps:**
  1. Log in successfully.
  2. Navigate to `https://zincbank.cydeo.io/login`.
- **Expected Results (observed):** Login form is displayed; the user is **not** automatically redirected to the dashboard. (Session is still valid — `/dashboard` remains reachable.) Record as current behavior.
- **Failure Conditions:** (Document expected product decision — some apps redirect authenticated users away from `/login`.)

#### TC-020: Session survives navigation/reload within the app
- **Priority:** Medium
- **Preconditions:** Authenticated session.
- **Steps:**
  1. Log in successfully.
  2. Navigate to `/accounts`, then reload the page.
  3. Visit `/login` and then `/dashboard`.
- **Expected Results:** Session persists (user remains authenticated across pages and reloads; dashboard loads without re-login).
- **Failure Conditions:** User is logged out on navigation or reload.

---

### 3.5 Navigation & UI/UX

#### TC-021: "Open an account" link on login page
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session on login page.
- **Steps:**
  1. Click the **"Open an account"** link below the form.
- **Expected Results:** User is navigated to `https://zincbank.cydeo.io/apply` (title "Open an account · ZincBank").
- **Failure Conditions:** Link is broken, or wrong destination.

#### TC-022: "ZincBank home" link on login page
- **Priority:** Low
- **Preconditions:** Fresh logged-out session on login page.
- **Steps:**
  1. Click the **ZincBank** logo / "ZincBank home" link.
- **Expected Results:** User is navigated to `https://zincbank.cydeo.io/` (marketing home page).
- **Failure Conditions:** Link is broken.

#### TC-023: Home page "Log in" navigation link
- **Priority:** Low
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Navigate to `https://zincbank.cydeo.io/`.
  2. Click **"Log in"** in the header navigation.
- **Expected Results:** User is navigated to `/login`.
- **Failure Conditions:** Link is broken or login form does not render.

#### TC-024: Password field masking
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Type text into the Password field.
  2. Inspect the input type and visually confirm character masking.
- **Expected Results (observed):**
  - Input is `type=password`; typed characters are masked (dots).
  - There is **no** show/hide (reveal) password toggle.
- **Failure Conditions:** Password is rendered in plain text.

#### TC-025: Autocomplete attributes present
- **Priority:** Low
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Inspect the Email and Password inputs in the DOM.
- **Expected Results (observed):**
  - Email: `autocomplete="email"`.
  - Password: `autocomplete="current-password"`.
- **Failure Conditions:** Autocomplete attributes missing (degrades password-manager UX).

#### TC-026: Form labels and placeholders
- **Priority:** Low
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Inspect the form markup and rendered page.
- **Expected Results (observed):**
  - Visible labels: **Email** and **Password** (properly associated via `for`/`id`).
  - Email placeholder: `you@example.com`.
  - Page heading: **"Sign in to ZincBank"** with subheading "Welcome back".
- **Failure Conditions:** Labels not associated with inputs, or placeholder acts as the only label.


---

### 3.6 Accessibility & Responsiveness

#### TC-027: Keyboard-only submission and tab order
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Using the keyboard, Tab from the page load.
  2. Confirm focus order reaches Email → Password → Sign in.
  3. Fill fields via keyboard and submit with Enter (see TC-002).
- **Expected Results:** All fields and the submit button are reachable and operable via keyboard; focus is visibly indicated.
- **Failure Conditions:** Focus is trapped, invisible, or an element is not keyboard-operable.

#### TC-028: Error messages exposed to assistive technology
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session.
- **Steps:**
  1. Trigger a validation error (e.g., empty form submit).
  2. Inspect the error element (`role="note"`, `data-testid="login-error"`).
- **Expected Results (observed):** Error note uses a semantic `role="note"` region so it can be surfaced to screen readers; error text matches the expected messages documented above.
- **Failure Conditions:** Error is only conveyed via color/styling with no accessible text.

#### TC-029: Login form usable at mobile viewport
- **Priority:** Medium
- **Preconditions:** Fresh logged-out session; viewport set to a mobile size (e.g., 375×812).
- **Steps:**
  1. Load the login page at a mobile viewport.
  2. Complete TC-001 (valid login).
- **Expected Results:** Form renders without horizontal scroll, fields remain usable, login succeeds.
- **Failure Conditions:** Layout breaks, inputs overlap, or login is impossible at mobile size.

---

## 4. Known Behaviors / Observations (recorded during exploration)

These are factual observations captured while exploring `https://zincbank.cydeo.io/login` and can serve as a baseline for automated assertions:

1. **Client vs. server validation split**
   - Empty fields, missing password, and malformed email → **"Enter your email and password."** (client-side; no network request).
   - Valid-format email with wrong password or unregistered email → **"Invalid email or password."** (server-side; Supabase returns `400`, `x-sb-error-code: invalid_credentials`).
2. **No user enumeration** — identical generic error for wrong password and unknown account.
3. **Email normalization** — case-insensitive and trimmed client-side before submission (confirmed via request body).
4. **No input length caps** — long inputs accepted client-side (no `maxlength`).
5. **Error persistence** — error note does not clear as the user types; it is replaced on the next submit.
6. **Password UX** — masked, no show/hide toggle.
7. **Form semantics** — `novalidate`, so no native browser validation bubbles; all validation is custom React code.
8. **Session behavior** — `/login` does not auto-redirect authenticated users to `/dashboard`; protected routes (`/dashboard`, `/accounts`, etc.) redirect unauthenticated users to `/login`; home `/` is public.
9. **Console noise** — failed auth produces an expected browser console error: `Failed to load resource: the server responded with a status of 400` (network-level; acceptable).
10. **Success signal** — on success the URL becomes `/dashboard`, title becomes "Dashboard · ZincBank", and Supabase token endpoint returns `200`.

---

## 5. Recommended Playwright Coverage Mapping

| Scenario(s) | Suggested Playwright project / tags |
|---|---|
| TC-001, TC-002, TC-007, TC-008, TC-017, TC-018 | `chromium` — smoke suite |
| TC-003 → TC-006 (validation) | All browsers (`chromium`, `firefox`, `webkit`) |
| TC-010, TC-011, TC-012, TC-013, TC-014 | All browsers |
| TC-015, TC-016 | `chromium` + `webkit` |
| TC-027, TC-028 | `chromium` + axe/screen-reader checks |
| TC-029 | Mobile viewports (Pixel 5, iPhone 12) |

---

## 6. Exit Criteria

- All High-priority scenarios pass in Chromium.
- Medium-priority scenarios pass across at least two browser engines.
- No console `Uncaught` exceptions during normal or error flows (expected 400 network logs excluded).
- No security-critical failure (TC-015, TC-016) permits unauthorized access or script execution.

---

## 7. Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-11-16 | Playwright Test Planner Agent | Initial test plan created after live exploration of `zincbank.cydeo.io/login`. |

