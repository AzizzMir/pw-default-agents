// spec: specs/zincbank-login-test-plan.md

import { test, expect } from '@playwright/test';

const EMAIL = process.env.ZINC_EMAIL;
const PASSWORD = process.env.ZINC_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('Set ZINC_EMAIL and ZINC_PASSWORD before running these tests.');
}

test.describe('Validation & Error Handling', () => {
  test('TC-003: Submit completely empty form', async ({ page }) => {
    let authRequestSent = false;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().includes('/auth/v1/token?grant_type=password')
      ) {
        authRequestSent = true;
      }
    });

    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Click Sign in without entering anything.
    await page.getByTestId('login-submit').click();

    // Verify the form stays on the login page and does not send an auth request.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Enter your email and password.');
    expect(authRequestSent).toBe(false);
  });

  test('TC-004: Email provided, password missing', async ({ page }) => {
    let authRequestSent = false;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().includes('/auth/v1/token?grant_type=password')
      ) {
        authRequestSent = true;
      }
    });

    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter the valid email and leave the Password field empty.
    await page.getByTestId('login-email-input').fill(EMAIL);

    // 3. Click Sign in.
    await page.getByTestId('login-submit').click();

    // Verify client-side validation blocks the auth request.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Enter your email and password.');
    expect(authRequestSent).toBe(false);
  });

  test('TC-005: Password provided, email missing', async ({ page }) => {
    let authRequestSent = false;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().includes('/auth/v1/token?grant_type=password')
      ) {
        authRequestSent = true;
      }
    });

    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter the valid password and leave the Email field empty.
    await page.getByTestId('login-password-input').fill(PASSWORD);

    // 3. Click Sign in.
    await page.getByTestId('login-submit').click();

    // Verify client-side validation blocks the auth request.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Enter your email and password.');
    expect(authRequestSent).toBe(false);
  });

  test('TC-006: Invalid email format', async ({ page }) => {
    let authRequestSent = false;
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().includes('/auth/v1/token?grant_type=password')
      ) {
        authRequestSent = true;
      }
    });

    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter a malformed email and a password.
    await page.getByTestId('login-email-input').fill('notanemail');
    await page.getByTestId('login-password-input').fill('somepassword123');

    // 3. Click Sign in.
    await page.getByTestId('login-submit').click();

    // Verify client-side format validation blocks the auth request.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Enter your email and password.');
    expect(authRequestSent).toBe(false);
  });

  test('TC-007: Valid email format with wrong password', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter the valid email and an incorrect password.
    await page.getByTestId('login-email-input').fill(EMAIL);
    await page.getByTestId('login-password-input').fill('wrongpassword123');

    // 3. Click Sign in and capture the auth response.
    const authResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.url().includes('/auth/v1/token?grant_type=password'),
      { timeout: 15000 }
    );
    await page.getByTestId('login-submit').click();

    // Verify the failed auth response and generic error message.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password.');
    expect((await authResponse).status()).toBe(400);
  });

  test('TC-008: Unregistered email with any password', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto('https://zincbank.cydeo.io/login');

    // 2. Enter an unregistered email and a password.
    await page.getByTestId('login-email-input').fill('nonexistent.user@example.com');
    await page.getByTestId('login-password-input').fill('Whatever123!');

    // 3. Click Sign in.
    await page.getByTestId('login-submit').click();

    // Verify the app uses the same generic error as for an incorrect password.
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password.');
  });

  test('TC-009: Error message persists while user edits fields', async ({ page }) => {
    // 1. Navigate to the login page and trigger an invalid-credentials error.
    await page.goto('https://zincbank.cydeo.io/login');
    await page.getByTestId('login-email-input').fill(EMAIL);
    await page.getByTestId('login-password-input').fill('wrongpassword123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password.');

    // 2. Edit the email without submitting the form again.
    await page.getByTestId('login-email-input').fill(`${EMAIL}x`);

    // Verify the existing error remains visible while editing.
    await expect(page.getByTestId('login-error')).toHaveText('Invalid email or password.');
  });
});
