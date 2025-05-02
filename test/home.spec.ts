import { test, expect } from '@playwright/test';

test('El usuario puede iniciar sesión con GitHub mockeado', async ({ page }) => {
  // Ir a la página principal
  await page.goto('http://localhost:3000/');

  // Verificar que está en la pantalla de login
  await expect(page.getByText('BIENVENIDO')).toBeVisible();

  // Simular clic en "Continuar con Google" o el mock que tengas (aquí usas tu botón)
  await page.getByText('Continuar con Google').click();

  // Debería redirigir a /dashboard/callings si el login fue exitoso
  await page.waitForURL('**/dashboard/callings');

  // Verificar que la página de dashboard tiene contenido esperado
  await expect(page).toHaveURL(/.*dashboard\/callings/);
});
