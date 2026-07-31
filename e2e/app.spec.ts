import { test, expect } from '@playwright/test';

test.describe('AI Shadowboxing Full-Stack E2E Browser Journey', () => {
  test('should load application homepage and display navigation tabs', async ({ page }) => {
    await page.goto('/');

    // Check title and header
    await expect(page).toHaveTitle(/AI Shadowboxing/i);
    await expect(page.locator('h1')).toContainText('AI Shadowboxing');

    // Check navigation tabs (.tab divs)
    await expect(page.locator('.tab', { hasText: 'Date' })).toBeVisible();
    await expect(page.locator('.tab', { hasText: 'Mentor' })).toBeVisible();
    await expect(page.locator('.tab', { hasText: 'Notes' })).toBeVisible();
  });

  test('should switch tabs seamlessly', async ({ page }) => {
    await page.goto('/');

    // Click Mentor tab
    await page.locator('.tab', { hasText: 'Mentor' }).click();
    await expect(page.getByText('Mentor Avatar')).toBeVisible();

    // Click Notes tab
    await page.locator('.tab', { hasText: 'Notes' }).click();
    await expect(page.getByText('Transcript')).toBeVisible();
    await expect(page.getByText('Tool Calls')).toBeVisible();

    // Click back to Date tab
    await page.locator('.tab', { hasText: 'Date' }).click();
    await expect(page.getByText('Scenario Challenge')).toBeVisible();
  });

  test('should update system prompt when scenario preset is selected', async ({ page }) => {
    await page.goto('/');

    const presetSelect = page.locator('#presetSelect');
    await expect(presetSelect).toBeVisible();

    // Select Challenging scenario preset
    await presetSelect.selectOption('intellectual_lawyer');
    
    // Check prompt textarea updated
    const promptTextarea = page.locator('#personaPrompt');
    await expect(promptTextarea).toContainText('corporate litigation partner');
  });

  test('should display action buttons and input containers', async ({ page }) => {
    await page.goto('/');

    const dateBtn = page.getByRole('button', { name: /^Date$/i });
    await expect(dateBtn).toBeVisible();
  });
});
