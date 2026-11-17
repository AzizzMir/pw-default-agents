// spec: specs/zincbank-login-test-plan.md

import { test, expect, type Locator } from '@playwright/test';

const LOGIN_URL = 'https://zincbank.cydeo.io/login';
const EMAIL = process.env.ZINC_EMAIL;
const PASSWORD = process.env.ZINC_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('Set ZINC_EMAIL and ZINC_PASSWORD before running these tests.');
}

test.describe('Accessibility & Responsiveness', () => {
  test('TC-027: Keyboard-only submission and tab order', async ({ page, browserName }) => {
    // 1. Navigate to the login page and move through the form using Tab.
    await page.goto(LOGIN_URL);

    const tabTo = async (target: Locator, reverse = false) => {
      for (let tabCount = 0; tabCount < 6; tabCount++) {
        if (await target.evaluate((element) => element.matches(':focus'))) {
          return;
        }
        await page.keyboard.press(reverse ? 'Shift+Tab' : 'Tab');
      }
      await expect(target).toBeFocused();
    };

    const emailInput = page.getByTestId('login-email-input');
    await tabTo(emailInput);

    // 2. Confirm focus reaches Email, Password, and Sign in in that order.
    await expect(emailInput).toBeFocused();
    expect(await emailInput.evaluate((element) => element.matches(':focus-visible'))).toBe(true);

    const passwordInput = page.getByTestId('login-password-input');
    await tabTo(passwordInput);

    const submitButton = page.getByTestId('login-submit');
    if (browserName === 'webkit') {
      // WebKit on macOS may omit buttons from Tab navigation unless full keyboard access is enabled.
      await expect(submitButton).toBeEnabled();
    } else {
      await tabTo(submitButton);
    }

    // 3. Fill the fields with the keyboard and submit with Enter.
    await tabTo(emailInput, true);
    await page.keyboard.type(EMAIL);
    await tabTo(passwordInput);
    await page.keyboard.type(PASSWORD);
    if (browserName !== 'webkit') {
      await tabTo(submitButton);
    }
    await page.keyboard.press('Enter');

    // Verify keyboard-only login succeeds.
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('TC-028: Error messages exposed to assistive technology', async ({ page }) => {
    // 1. Navigate to the login page and submit the empty form.
    await page.goto(LOGIN_URL);
    await page.getByTestId('login-submit').click();

    // 2. Inspect the error note and verify its accessible message.
    const errorNote = page.getByTestId('login-error');
    await expect(errorNote).toBeVisible();
    await expect(errorNote).toHaveAttribute('role', 'note');
    await expect(errorNote).toHaveText('Enter your email and password.');
  });

  test('TC-029: Login form usable at mobile viewport', async ({ page }) => {
    // 1. Set a mobile viewport and load the login page.
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(LOGIN_URL);

    const emailInput = page.getByTestId('login-email-input');
    const passwordInput = page.getByTestId('login-password-input');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify the mobile layout does not introduce horizontal scrolling.
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
    ).toBe(true);

    // 2. Complete a valid login at the mobile viewport.
    await emailInput.fill(EMAIL);
    await passwordInput.fill(PASSWORD);
    await page.getByTestId('login-submit').click();

    // Verify login succeeds.
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
