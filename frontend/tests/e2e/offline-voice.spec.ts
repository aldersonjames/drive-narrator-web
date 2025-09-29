import { test, expect } from '@playwright/test';

test.describe('Offline voice fallback', () => {
  test('queues narration requests when offline and surfaces captions', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.click('text=Allow Microphone');

    await page.context().setOffline(true);

    await page.click('text=Start Trip');

    await expect(page.getByRole('alert')).toHaveText(/offline/i);
    await expect(page.getByText(/captions available/i)).toBeVisible();
  });
});
