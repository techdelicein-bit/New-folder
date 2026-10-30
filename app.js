const form = document.querySelector('#review-form');
const message = document.querySelector('#form-message');
const requestCount = document.querySelector('#request-count');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');

fetch('/api/stats').then((res) => res.json()).then((data) => {
  requestCount.textContent = String(data.reviewRequests).padStart(2, '0');
}).catch(() => { requestCount.textContent = '—'; });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  message.classList.remove('error');
  message.textContent = 'Submitting your request…';
  try {
    const response = await fetch('/api/verifications', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: form.address.value, network: form.network.value })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not submit your request.');
    message.textContent = `${result.message} Request ID: ${result.id.slice(0, 8)}.`;
    form.address.value = '';
    const stats = await fetch('/api/stats').then((res) => res.json());
    requestCount.textContent = String(stats.reviewRequests).padStart(2, '0');
  } catch (error) {
    message.textContent = error.message;
    message.classList.add('error');
  } finally { button.disabled = false; }
});

menu.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(isOpen));
});
nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false');
}));
