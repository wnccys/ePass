import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd();

// Simula sessão de clube via cookie do NextAuth
Given('I am on the new contract page as a club', async ({ page, context }) => {
    // Injeta sessão mockada para bypass de auth em testes
    await context.addCookies([
        {
            name: 'next-auth.session-token',
            value: 'mock-session',
            domain: 'localhost',
            path: '/',
        },
    ]);
    await page.goto('/contracts/new');
    // Se redirecionar para login, força navegação direta (ambiente de dev sem validação de sessão real)
    if (page.url().includes('/login')) {
        await page.goto('/contracts/new');
    }
});

Then('I should see the contract title field', async ({ page }) => {
    await expect(page.getByPlaceholder(/image rights agreement/i)).toBeVisible({ timeout: 10000 });
});

Then('I should see the player wallet address field', async ({ page }) => {
    await expect(page.getByPlaceholder('0x...').first()).toBeVisible({ timeout: 10000 });
});

Then('I should see the attorney wallet address field', async ({ page }) => {
    await expect(page.getByPlaceholder('0x...').nth(1)).toBeVisible({ timeout: 10000 });
});

Then('I should see the document upload area', async ({ page }) => {
    await expect(page.getByText(/drag & drop/i)).toBeVisible({ timeout: 10000 });
});

Then('I should see the caution amount field', async ({ page }) => {
    await expect(page.getByPlaceholder('1000.00')).toBeVisible({ timeout: 10000 });
});

When('I fill the player wallet address with {string}', async ({ page }, value: string) => {
    await page.getByPlaceholder('0x...').first().fill(value);
});

When('I blur the player wallet field', async ({ page }) => {
    await page.getByPlaceholder('0x...').first().blur();
});

Then('I should see a wallet validation error', async ({ page }) => {
    await expect(page.getByText(/invalid/i).first()).toBeVisible({ timeout: 5000 });
});

When('I fill the contract title with {string}', async ({ page }, value: string) => {
    await page.getByPlaceholder(/image rights agreement/i).fill(value);
});

When('I blur the title field', async ({ page }) => {
    await page.getByPlaceholder(/image rights agreement/i).blur();
});

Then('I should see a title validation error', async ({ page }) => {
    await expect(page.getByText(/at least/i).first()).toBeVisible({ timeout: 5000 });
});

Then('I should see the submit button labeled {string}', async ({ page }, label: string) => {
    await expect(page.getByRole('button', { name: label })).toBeVisible({ timeout: 10000 });
});

Then('I should see the IPFS upload zone', async ({ page }) => {
    await expect(page.getByText(/drag & drop/i)).toBeVisible({ timeout: 10000 });
});

Then('the upload zone should mention {string}', async ({ page }, text: string) => {
    await expect(page.getByText(new RegExp(text, 'i')).first()).toBeVisible({ timeout: 10000 });
});
