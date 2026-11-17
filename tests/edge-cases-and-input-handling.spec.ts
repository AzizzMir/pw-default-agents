// spec: specs/zincbank-login-test-plan.md

import { test, expect } from '@playwright/test';

const EMAIL = process.env.ZINC_EMAIL;
const PASSWORD = process.env.ZINC_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('Set ZINC_EMAIL and ZINC_PASSWORD before running these tests.');
}

const AUTH_TOKEN_URL = '/auth/v1/token?grant_type=password';

test.describe('Edge Cases & Input Handling', () => {
  test('TC-010: Email case-insensitivity', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter the email in uppercase and the valid password.
    await page.getByTestId('login-email-input').fill(EMAIL.toUpperCase());
    await page.getByTestId('login-password-input').fill(PASSWORD);

    // 3. Submit the form and capture the auth response.
    const authResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().includes(AUTH_TOKEN_URL),
      { timeout: 15000 }
    );
    await page.getByTestId('login-submit').click();

    // Verify the email is accepted regardless of case.
    await expect(page).toHaveURL(/\/dashboard$/);
    expect((await authResponse).status()).toBe(200);
  });

  test('TC-011: Leading and trailing whitespace in email is trimmed', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter the email with surrounding whitespace and the valid password.
    await page.getByTestId('login-email-input').fill(`  ${EMAIL}  `);
    await page.getByTestId('login-password-input').fill(PASSWORD);

    // 3. Submit the form and capture the auth request.
    const authRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && request.url().includes(AUTH_TOKEN_URL),
      { timeout: 15000 }
    );
    await page.getByTestId('login-submit').click();

    // Verify the login succeeds and the submitted email is trimmed.
    await expect(page).toHaveURL(/\/dashboard$/);
    const requestBody = (await authRequest).postDataJSON() as { email?: string } | null;
    expect(requestBody?.email).toBe(EMAIL);
  });

  test('TC-012: Whitespace-only password', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter a valid email and a password containing only spaces.
    await page.getByTestId('login-email-input').fill(EMAIL);
    await page.getByTestId('login-password-input').fill('   ');

    // 3. Submit the form and capture the auth response.
    const authResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().includes(AUTH_TOKEN_URL),
      { timeout: 15000 }
    );
    await page.getByTestId('login-submit').click();

    // Verify the whitespace-only password is rejected.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password.');
    expect((await authResponse).status()).toBe(400);
  });

  test('TC-013: Very long email and password', async ({ page }) => {
    const longEmail = `${'a'.repeat(300)}@gmail.com`;
    const longPassword = 'a'.repeat(500);

    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter a very long email and password.
    const emailInput = page.getByTestId('login-email-input');
    const passwordInput = page.getByTestId('login-password-input');
    await emailInput.fill(longEmail);
    await passwordInput.fill(longPassword);

    // Verify both fields accept the complete input without a maxlength limit.
    await expect(emailInput).toHaveValue(longEmail);
    await expect(passwordInput).toHaveValue(longPassword);

    // 3. Submit the form and capture the auth response.
    const authResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().includes(AUTH_TOKEN_URL),
      { timeout: 15000 }
    );
    await page.getByTestId('login-submit').click();

    // Verify the long credentials are rejected without navigating away or hanging.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password.');
    expect((await authResponse).status()).toBe(400);
  });

  test('TC-014: Special characters in password', async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (error) => pageErrors.push(error));

    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter a valid email and a password containing special characters.
    await page.getByTestId('login-email-input').fill(EMAIL);
    await page.getByTestId('login-password-input').fill('P@ss$w0rd!');

    // 3. Submit the form.
    await page.getByTestId('login-submit').click();

    // Verify the password is rejected cleanly and the page remains usable.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password.');
    await expect(page.getByTestId('login-submit')).toBeEnabled();
    expect(pageErrors).toEqual([]);
  });

  test('TC-015: SQL injection attempt in email field', async ({ page }) => {
    let authRequestSent = false;
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes(AUTH_TOKEN_URL)) {
        authRequestSent = true;
      }
    });

    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter an SQL injection payload in the email field and a password.
    await page.getByTestId('login-email-input').fill("' OR '1'='1' --");
    await page.getByTestId('login-password-input').fill('password');

    // 3. Submit the form.
    await page.getByTestId('login-submit').click();

    // Verify client-side validation rejects the input without an auth request.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Enter your email and password.');
    expect(authRequestSent).toBe(false);
  });

  test('TC-016: XSS script in email field', async ({ page }) => {
    const xssPayload = '<script>alert(1)</script>@example.com';
    let dialogShown = false;

    page.on('dialog', async (dialog) => {
      dialogShown = true;
      await dialog.dismiss();
    });

    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter an XSS payload in the email field and a password.
    const emailInput = page.getByTestId('login-email-input');
    await emailInput.fill(xssPayload);
    await page.getByTestId('login-password-input').fill('password');

    // 3. Submit the form and capture the auth response.
    const authResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' && response.url().includes(AUTH_TOKEN_URL),
      { timeout: 15000 }
    );
    await page.getByTestId('login-submit').click();

    // Verify auth rejects the payload and it does not execute or render as script.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password.');
    await expect(emailInput).toHaveValue(xssPayload);
    await expect(page.locator('script').filter({ hasText: 'alert(1)' })).toHaveCount(0);
    expect((await authResponse).status()).toBe(400);
    expect(dialogShown).toBe(false);
  });
});
