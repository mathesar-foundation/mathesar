<!-- Styles for this component are located in the extra.css file.  -->
<span class="generate-section">
  <button class="button primary-button generate-key-button">Generate Secret Key</button>
  <noscript>
    <div class="no-js-message">Generating a secret key requires JavaScript to work. Please enable JavaScript in your browser.</div>
  </noscript>
  <span class="key-container" style="display: none;">
    <span class="secret-key"></span>
    <button class="button copy-btn">Copy</button>
    <button class="button regenerate-btn">Regenerate</button>
  </span>
</span>

<script>
  function generateDjangoSecretKey(length = 50) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(-_=+)';
    let result = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }

  const generateBtn = document.querySelector('.generate-key-button');
  const keyContainer = document.querySelector('.key-container');
  const secretKeyDiv = document.querySelector('.secret-key');
  const copyBtn = document.querySelector('.copy-btn');
  const regenerateBtn = document.querySelector('.regenerate-btn');

  function showKey() {
    const key = generateDjangoSecretKey();
    secretKeyDiv.textContent = key;
    keyContainer.style.display = 'flex';
  }

  function copyKey() {
    const key = secretKeyDiv.textContent;
    navigator.clipboard.writeText(key).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => copyBtn.textContent = 'Copy', 2000);
    });
  }

  generateBtn.addEventListener('click', () => {
    showKey()
    generateBtn.style.display = 'none';
    copyKey()
  });
  regenerateBtn.addEventListener('click', showKey);

  copyBtn.addEventListener('click', () => {
    copyKey()
  });
</script>
