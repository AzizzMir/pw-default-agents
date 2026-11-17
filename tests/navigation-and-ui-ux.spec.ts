// spec: specs/zincbank-login-test-plan.md

import { test, expect } from '@playwright/test';

const LOGIN_URL = 'https://zincbank.cydeo.io/login';

test.describe('Navigation & UI/UX', () => {
  test('TC-021: "Open an account" link on login page', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto(LOGIN_URL);

    // 2. Click the "Open an account" link below the form.
    await page.getByRole('link', { name: 'Open an account' }).click();

    // Verify navigation to the account application page.
    await expect(page).toHaveURL('https://zincbank.cydeo.io/apply');
    await expect(page).toHaveTitle('Open an account · ZincBank');
  });

  test('TC-022: "ZincBank home" link on login page', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto(LOGIN_URL);

    // 2. Click the ZincBank logo / home link.
    await page.getByRole('link', { name: 'ZincBank home' }).click();

    // Verify navigation to the marketing home page.
    await expect(page).toHaveURL('https://zincbank.cydeo.io/');
  });

  test('TC-023: Home page "Log in" navigation link', async ({ page }) => {
    // 1. Navigate to the marketing home page.
    await page.goto('https://zincbank.cydeo.io/');

    // 2. Click "Log in" in the header navigation.
    await page.getByTestId('home-nav-login').click();

    // Verify navigation to the login page and that the form renders.
    await expect(page).toHaveURL(LOGIN_URL);
    await expect(page.getByTestId('login-email-input')).toBeVisible();
  });

  test('TC-024: Password field masking', async ({ page }) => {
    // 1. Navigate to the login page.
    await page.goto(LOGIN_URL);

    // 2. Type text into Password and inspect its masking behavior.
    const passwordInput = page.getByTestId('login-password-input');
    await passwordInput.fill('masked-password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: /show password|hide password/i })).toHaveCount(0);
  });

  test('TC-025: Autocomplete attributes present', async ({ page }) => {
    // 1. Navigate to the login page and inspect the Email and Password inputs.
    await page.goto(LOGIN_URL);

    await expect(page.getByTestId('login-email-input')).toHaveAttribute('autocomplete', 'email');
    await expect(page.getByTestId('login-password-input')).toHaveAttribute(
      'autocomplete',
      'current-password'
    );
  });

  test('TC-026: Form labels and placeholders', async ({ page }) => {
    // 1. Navigate to the login page and inspect its form markup and rendered content.
    await page.goto(LOGIN_URL);

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByTestId('login-email-input')).toHaveAttribute(
      'placeholder',
      'you@example.com'
    );
    await expect(page.getByRole('heading', { name: 'Sign in to ZincBank' })).toBeVisible();
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
});
