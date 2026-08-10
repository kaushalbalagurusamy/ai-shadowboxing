import { test, expect } from '@playwright/test';

test.describe('AI Shadowboxing Full-Stack E2E Browser Journey', () => {
  test('should load application homepage and display navigation tabs', async ({ page }) => {
    await page.goto('/');

    // Check title and header
    await expect(page).toHaveTitle(/AI Shadowboxing/i);
    await expect(page.locator('h1')).toContainText('AI Shadowboxing');

    // Check navigation tabs (.tab divs)
    await expect(page.locator('.tab', { hasText: 'Practice' })).toBeVisible();
    await expect(page.locator('.tab', { hasText: 'Learn' })).toBeVisible();
    await expect(page.locator('.tab', { hasText: 'Notes' })).toBeVisible();
  });

  test('should switch tabs seamlessly', async ({ page }) => {
    await page.goto('/');

    // Click Learn tab
    await page.locator('.tab', { hasText: 'Learn' }).click();
    await expect(page.locator('#mentorPrompt')).toBeVisible();

    // Click Notes tab
    await page.locator('.tab', { hasText: 'Notes' }).click();
    await expect(page.getByText('Transcript')).toBeVisible();
    await expect(page.getByText('Tool Calls')).toBeVisible();

    // Click Skills tab
    await page.locator('.tab', { hasText: 'Skills' }).click();
    await expect(page.getByText('Deterministic Skill Progression Ladder')).toBeVisible();

    // Click back to Practice tab
    await page.locator('.tab', { hasText: 'Practice' }).click();
    await expect(page.locator('#personaPrompt')).toBeVisible();
  });

  test('should display initial baseline persona prompt', async ({ page }) => {
    await page.goto('/');

    const promptTextarea = page.locator('#personaPrompt');
    await expect(promptTextarea).toBeVisible();
    await expect(promptTextarea).toContainText('first date in a coffee shop');
  });

  test('should display action buttons and input containers', async ({ page }) => {
    await page.goto('/');

    const practiceBtn = page.getByRole('button', { name: /^Practice$/i });
    await expect(practiceBtn).toBeVisible();
  });
});
