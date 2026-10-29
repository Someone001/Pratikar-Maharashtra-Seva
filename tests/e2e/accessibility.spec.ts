import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.1 AA Accessibility Audit', () => {
  test('Onboarding View should have no WCAG AA violations', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Helplines & Official SOP View should have no WCAG AA violations', async ({ page }) => {
    await page.goto('/');

    // Quick onboarding through safety check
    await page.getByRole('button', { name: /start/i }).click();
    await page.getByText('Yes, I am safe right now').click();
    await page.getByText('No, under 18 years old').click();
    await page.getByText('I am an adult helper assisting on their behalf').click();
    await page.getByPlaceholder('Enter a strong passphrase or PIN (minimum 8 characters)').fill('safe-password-2026');
    await page.getByPlaceholder('Re-enter your passphrase').fill('safe-password-2026');
    await page.getByRole('button', { name: 'Create Encrypted Vault & Continue' }).click();

    // Navigate to helplines
    await page.getByRole('link', { name: /helplines/i }).click();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

