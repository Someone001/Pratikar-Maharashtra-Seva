import { test, expect } from '@playwright/test';

test.describe('Pratikar PWA E2E Journey', () => {
  test('Complete Victim and Helper User Journey', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Onboarding and Legal Disclaimers
    await expect(page.getByText('What Pratikar Does')).toBeVisible();
    await expect(page.getByText('What Pratikar is NOT')).toBeVisible();
    await expect(page.getByText('Rule 3(2)(b)')).toBeVisible();

    // Advance to Age Verification
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText('Age Safety Verification')).toBeVisible();

    // 2. Test Minor Protection Stop Safeguard
    await page.getByText('No, under 18 years old').click();
    await expect(page.getByText('Immediate Child Protection Protocol')).toBeVisible();
    await expect(page.getByText('1098').first()).toBeVisible();
    await expect(page.getByText('cybercrime.gov.in').first()).toBeVisible();

    // Advance as adult helper
    await page.getByText('I am an adult helper assisting on their behalf').click();

    // 3. Vault Setup
    await expect(page.getByText('Create Your Local Vault Passphrase')).toBeVisible();
    await page.getByPlaceholder('Enter a strong passphrase or PIN (minimum 8 characters)').fill('safe-password-2026');
    await page.getByPlaceholder('Re-enter your passphrase').fill('safe-password-2026');
    await page.getByRole('button', { name: 'Create Encrypted Vault & Continue' }).click();

    // 4. Main App Navigation & Case Creation
    await expect(page.getByText('24-Hour Redress Action Guide')).toBeVisible();

    // Navigate to Cases
    await page.getByRole('link', { name: 'Cases' }).click();
    await expect(page.getByText('Case Management')).toBeVisible();

    // Create a new case
    await page.getByRole('button', { name: 'New Case' }).first().click();
    await page.getByPlaceholder('e.g., Case 1').fill('Instagram Threat Incident');
    await page.getByLabel('Reporting Mode').selectOption('self');
    await page.getByLabel('Being threatened with sharing / sextortion / blackmail').check();
    await page.getByRole('button', { name: 'Save Case' }).click();

    await expect(page.getByText('Instagram Threat Incident')).toBeVisible();

    // 5. Navigate to Action Guide and Generate Complaint
    await page.getByRole('link', { name: 'Action Guide' }).click();
    await expect(page.getByText('Step 1 of 5').first()).toBeVisible();

    // Jump to Step 3: Takedown Notice
    await page.getByRole('button', { name: /Send 24-Hour/i }).click();
    await expect(page.getByText('Target Platform for Complaint:')).toBeVisible();
    await expect(page.getByText('URGENT STATUTORY NOTICE')).toBeVisible();
    await expect(page.getByText('Rule 3(2)(b)').first()).toBeVisible();

    // Copy legal notice
    await page.getByRole('button', { name: /copy legal notice text/i }).click();

    // Start 24h timer
    await page.getByRole('button', { name: 'Start 24-Hour Timer →' }).click();
    await expect(page.getByText('Statutory 24-Hour Removal Deadline')).toBeVisible();

    // 6. Navigate to Evidence Vault
    await page.getByRole('link', { name: 'Evidence Vault' }).click();
    await expect(page.getByText('Tamper-Evident Evidence Vault')).toBeVisible();
    await expect(page.getByText('Absolute Zero Image Storage Policy')).toBeVisible();
    await expect(page.getByText('Hash chain verified')).toBeVisible();

    // Add note entry
    await page.getByRole('button', { name: 'Add Evidence Record' }).first().click();
    await page.getByPlaceholder(/record factual observations/i).fill('Received blackmail message on DM');
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page.getByText('Received blackmail message on DM')).toBeVisible();
    await expect(page.getByText('Hash chain verified: all cryptographic links intact.')).toBeVisible();

    // 7. Case Summary for Law Enforcement Printout
    await page.getByRole('link', { name: 'Summary' }).click();
    await expect(page.getByText('NCII Redress & Evidence Summary')).toBeVisible();
    await expect(page.getByText('Instagram Threat Incident')).toBeVisible();
    await expect(page.getByText('SHA-256 Chain Intact')).toBeVisible();

    // 8. Helplines & SOP View
    await page.getByRole('link', { name: 'Helplines & SOP' }).click();
    await expect(page.getByText('Official Channels & Legal SOP')).toBeVisible();
    await expect(page.getByText('National Cybercrime Helpline 1930')).toBeVisible();
    await expect(page.getByText('11 November 2025').first()).toBeVisible();
  });
});
