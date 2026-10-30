const form = document.querySelector('#review-form');
const message = document.querySelector('#form-message');
const requestCount = document.querySelector('#request-count');
const walletStatus = document.querySelector('#wallet-status');
const balanceResult = document.querySelector('#balance-result');
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
let connectedAccount = null;
const bscUsdContract = '0x55d398326f99059ff775485246999027b3197955';

fetch('/api/stats').then((res) => res.json()).then((data) => {
  if (requestCount) requestCount.textContent = String(data.reviewRequests).padStart(2, '0');
}).catch(() => { if (requestCount) requestCount.textContent = '—'; });

const chains = {
  'BNB Chain': { id: '0x38', coin: 'BNB' },
};

function prettyAmount(raw, decimals) {
  const value = BigInt(raw);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, '0').slice(0, 6).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : String(whole);
}

function decodeString(hex) {
  const data = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (!data || /^0+$/.test(data)) return '';
  let byteOffset = 0;
  let byteLength;
  if (data.length >= 128) {
    const offset = Number(BigInt(`0x${data.slice(0, 64)}`)) * 2;
    const lengthStart = offset;
    byteLength = Number(BigInt(`0x${data.slice(lengthStart, lengthStart + 64)}`));
    byteOffset = lengthStart + 64;
  } else {
    byteLength = 32;
  }
  const bytes = new Uint8Array(Math.min(byteLength, 64));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(data.slice(byteOffset + i * 2, byteOffset + i * 2 + 2), 16);
  return new TextDecoder().decode(bytes).replace(/\0+$/, '').trim();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.classList.remove('error');
  balanceResult.textContent = '';
  if (!window.ethereum) {
    message.textContent = 'No browser wallet found. Open this page in Trust Wallet or another wallet-enabled browser.';
    message.classList.add('error');
    return;
  }
  const network = form.elements.network.value;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  message.textContent = 'Waiting for wallet permission…';
  try {
    if (!connectedAccount) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      connectedAccount = accounts[0] || null;
      if (!connectedAccount) throw new Error('No account was shared.');
      walletStatus.textContent = `${connectedAccount.slice(0, 6)}…${connectedAccount.slice(-4)} connected · read only`;
      window.ethereum.on?.('accountsChanged', (next) => {
        connectedAccount = next[0] || null;
        walletStatus.textContent = connectedAccount ? `${connectedAccount.slice(0, 6)}…${connectedAccount.slice(-4)} connected · read only` : 'Wallet disconnected';
      });
      window.ethereum.on?.('chainChanged', () => { balanceResult.textContent = 'Network changed. Run the balance check again.'; });
    }
    message.textContent = 'Reading public blockchain data…';
    const selectedChain = chains[network];
    const activeChain = await window.ethereum.request({ method: 'eth_chainId' });
    if (activeChain.toLowerCase() !== selectedChain.id) throw new Error(`Switch your wallet to ${network}, then try again.`);
    const [rawBalance, decimalsHex, symbolHex] = await Promise.all([
      window.ethereum.request({ method: 'eth_call', params: [{ to: bscUsdContract, data: `0x70a08231${connectedAccount.slice(2).toLowerCase().padStart(64, '0')}` }, 'latest'] }),
      window.ethereum.request({ method: 'eth_call', params: [{ to: bscUsdContract, data: '0x313ce567' }, 'latest'] }),
      window.ethereum.request({ method: 'eth_call', params: [{ to: bscUsdContract, data: '0x95d89b41' }, 'latest'] })
    ]);
    const decimals = Number(BigInt(decimalsHex));
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error('The contract returned invalid token decimals.');
    const symbol = decodeString(symbolHex) || 'Token';
    balanceResult.innerHTML = `<strong>${prettyAmount(rawBalance, decimals)} ${symbol.replace(/[&<>"']/g, '')}</strong><span>${network} · token balance from public chain data</span>`;
    message.textContent = 'Balance read complete. This is not a security audit or authenticity check.';
  } catch (error) {
    message.textContent = error.code === 4001 ? 'Wallet connection was declined.' : (error.message || 'Could not read this token contract on the selected network.');
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
