import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

Given('I open the landing page', async ({ page }) => {
    await page.goto('/');
});

Then('I should see the main heading containing {string}', async ({ page }, text: string) => {
    await expect(page.locator('h1')).toContainText(text);
});

Then('I should see a link to the login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /Begin/i }).first();
    await expect(loginLink).toBeVisible();
});

When('I click the login page link', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /Begin/i }).first();
    await loginLink.click();
});

Then('I should be redirected to the login page', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/, { timeout: 15000 });
});

Then('I should see the header {string}', async ({ page }, text: string) => {
    await expect(page.getByText(text)).toBeVisible();
});
