// Catch module/dependency failures as well as errors from the renderer constructor.
try {
  await import('./main.mjs?v=20261108-3');
} catch (error) {
  document.getElementById('loading').hidden = true;
  document.getElementById('error').hidden = false;
  document.getElementById('error-text').textContent = 'En spelfil kunde inte laddas. Kontrollera anslutningen och försök igen.';
  document.getElementById('retry').onclick = () => location.reload();
  console.error(error);
}
