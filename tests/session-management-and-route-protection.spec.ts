// spec: specs/zincbank-login-test-plan.md

import { test, expect, type Page } from '@playwright/test';

const EMAIL = process.env.ZINC_EMAIL;
const PASSWORD = process.env.ZINC_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('Set ZINC_EMAIL and ZINC_PASSWORD before running these tests.');
}

async function login(page: Page) {
  await page.goto('https://zincbank.cydeo.io/login');
  await page.getByTestId('login-email-input').fill(EMAIL);
  await page.getByTestId('login-password-input').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByTestId('dashboard-welcome')).toBeVisible();
}

test.describe('Session Management & Route Protection', () => {
  test.describe.configure({ mode: 'serial' });

  test('TC-017: Sign out returns user to login page', async ({ page }) => {
    // 1. Log in successfully.
    await login(page);

    // 2. Click Sign out and capture the Supabase logout response.
    const logoutResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/auth/v1/logout?scope=global'),
      { timeout: 15000 }
    );
    await page.getByTestId('nav-signout').click();

    // Verify logout succeeds and the user is redirected to login.
    await expect(page).toHaveURL(/\/login$/);
    expect((await logoutResponse).status()).toBe(204);

    // 3. Verify the dashboard is no longer accessible without authentication.
    await page.goto('https://zincbank.cydeo.io/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('TC-018: Unauthenticated access to protected routes redirects to login', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/accounts',
      '/move-money',
      '/transactions',
      '/cards',
      '/profile',
    ];

    for (const route of protectedRoutes) {
      // 1. Navigate directly to each protected route while logged out.
      await page.goto(`https://zincbank.cydeo.io${route}`);

      // Verify unauthenticated users are redirected to login.
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByTestId('login-email-input')).toBeVisible();
    }
  });

  test('TC-019: Visiting login while already authenticated', async ({ page }) => {
    // 1. Log in successfully.
    await login(page);

    // 2. Navigate to the login page while the session is still active.
    await page.goto('https://zincbank.cydeo.io/login');

    // Verify the login form is shown without an automatic redirect.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-email-input')).toBeVisible();

    // Verify the authenticated session remains valid.
    await page.goto('https://zincbank.cydeo.io/dashboard');
    await expect(page.getByTestId('dashboard-welcome')).toBeVisible();
  });

  test('TC-020: Session survives navigation and reload within the app', async ({ page }) => {
    // 1. Log in successfully.
    await login(page);

    // 2. Navigate to Accounts and reload the page.
    await page.goto('https://zincbank.cydeo.io/accounts');
    await expect(page).toHaveURL(/\/accounts$/);
    await page.reload();

    // Verify the session is retained on the protected route after reload.
    await expect(page).toHaveURL(/\/accounts$/);
    await expect(page.getByTestId('nav-signout')).toBeVisible();

    // 3. Visit Login and then Dashboard.
    await page.goto('https://zincbank.cydeo.io/login');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-email-input')).toBeVisible();

    await page.goto('https://zincbank.cydeo.io/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-welcome')).toBeVisible();
  });
});
