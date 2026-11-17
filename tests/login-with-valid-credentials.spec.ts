// spec: specs/zincbank-login-test-plan.md
// seed: seed.spec.ts

import { test, expect } from '@playwright/test';

/**
 * TC-001: Login with valid credentials
 * Plan section: Happy Path — Successful Login
 *
 * Set ZINC_EMAIL and ZINC_PASSWORD in the local environment before running.
 */
const EMAIL = process.env.ZINC_EMAIL;
const PASSWORD = process.env.ZINC_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('Set ZINC_EMAIL and ZINC_PASSWORD before running this test.');
}

test.describe('Happy Path — Successful Login', () => {
  test('Login with valid credentials', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter the valid email into the Email field
    await page.getByTestId('login-email-input').fill(EMAIL);

    // 3. Enter the valid password into the Password field
    await page.getByTestId('login-password-input').fill(PASSWORD);

    // 4. Click the Sign in button and capture the auth request
    const authResponse = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/auth/v1/token?grant_type=password'),
      { timeout: 15000 }
    );
    await page.getByTestId('login-submit').click();

    // User is redirected to the dashboard
    await expect(page).toHaveURL(/\/dashboard$/);

    // A successful POST to the Supabase auth token endpoint returns 200
    expect((await authResponse).status()).toBe(200);

    // Page title changes to "Dashboard · ZincBank"
    await expect(page).toHaveTitle('Dashboard · ZincBank');

    // Dashboard shows a personalized greeting
    await expect(page.getByTestId('dashboard-welcome')).toHaveText('Welcome, Aziz');

    // Dashboard header exposes the primary navigation
    const navLinks = ['Dashboard', 'Accounts', 'Move money', 'Transactions', 'Cards', 'Profile'];
    for (const name of navLinks) {
      const testId = `nav-${name.toLowerCase().replace(/\s+/g, '-')}`;
      await expect(page.getByTestId(testId)).toBeVisible();
    }
    await expect(page.getByTestId('theme-toggle')).toBeVisible();
    await expect(page.getByTestId('nav-signout')).toBeVisible();

    // Account summary renders: total deposit balance and account cards
    await expect(page.getByTestId('dashboard-total-deposit')).toBeVisible();
    await expect(page.getByRole('link', { name: /Checking/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Savings/ })).toBeVisible();

    // Recent activity section is present
    await expect(page.getByTestId('dashboard-recent-activity')).toBeVisible();
  });

  test('Login with valid credentials using Enter key', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter the valid email into the Email field
    await page.getByTestId('login-email-input').fill(EMAIL);

    // 3. Enter the valid password into the Password field
    const passwordInput = page.getByTestId('login-password-input');
    await passwordInput.fill(PASSWORD);

    // 4. Press Enter to submit the form instead of clicking the Sign in button
    const authResponse = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/auth/v1/token?grant_type=password'),
      { timeout: 15000 }
    );
    await passwordInput.press('Enter');

    // User is redirected to the dashboard
    await expect(page).toHaveURL(/\/dashboard$/);

    // A successful POST to the Supabase auth token endpoint returns 200
    expect((await authResponse).status()).toBe(200);

    // Page title changes to "Dashboard · ZincBank"
    await expect(page).toHaveTitle('Dashboard · ZincBank');

    // Dashboard shows a personalized greeting
    await expect(page.getByTestId('dashboard-welcome')).toHaveText('Welcome, Aziz');
  });
});
