import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, Then } = createBdd();

Given('I open the login page', async ({ page }) => {
    await page.goto('/login');
});

Given('I try to access the contracts page', async ({ page }) => {
    await page.goto('/contracts');
});

Given('I try to access the new contract page', async ({ page }) => {
    await page.goto('/contracts/new');
});

Then('I should see the login heading', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
});

Then('I should see the Google sign-in button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible({ timeout: 10000 });
});
