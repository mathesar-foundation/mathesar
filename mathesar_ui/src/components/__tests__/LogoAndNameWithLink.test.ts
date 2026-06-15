import '@testing-library/jest-dom';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { afterEach, beforeEach } from 'vitest';

let LogoAndNameWithLink: typeof import('../LogoAndNameWithLink.svelte').default;
let resolvedUiTheme: typeof import('@mathesar/utils/uiThemePreference').resolvedUiTheme;

function installLocalStorage() {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      clear: () => storage.clear(),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  });
}

beforeEach(async () => {
  installLocalStorage();
  ({ resolvedUiTheme } = await import('@mathesar/utils/uiThemePreference'));
  ({ default: LogoAndNameWithLink } = await import(
    '../LogoAndNameWithLink.svelte'
  ));
  resolvedUiTheme.set('light');
});

const defaultCommonData = {
  current_release_tag_name: '0.0.0',
  mathesar_instance_name: 'Branded Mathesar',
  mathesar_app_header_logo_url: null,
  mathesar_app_header_logo_dark_url: null,
  supported_languages: { en: 'English' },
  is_authenticated: false,
  is_sso_login_required: false,
  per_user_databases_enabled: false,
  file_backends: null,
  routing_context: 'anonymous',
};

function setCommonData(overrides = {}) {
  const data = { ...defaultCommonData, ...overrides };
  const script = document.createElement('script');
  script.id = 'common-data';
  script.type = 'application/json';
  script.textContent = JSON.stringify(data);
  document.body.appendChild(script);
}

function renderLogo(overrides = {}) {
  setCommonData(overrides);
  return render(LogoAndNameWithLink, {
    props: {
      href: '/',
    },
  });
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  resolvedUiTheme.set('light');
});

test('renders the default Mathesar logo when no custom logo is configured', () => {
  const { container, getByRole } = renderLogo();

  expect(getByRole('link', { name: 'Branded Mathesar home' })).toHaveAttribute(
    'href',
    '/',
  );
  expect(container.querySelector('img.custom-logo')).not.toBeInTheDocument();
  expect(container.querySelector('.mathesar-name')).toBeInTheDocument();
});

test('renders a custom app header logo when configured', () => {
  const { container } = renderLogo({
    mathesar_app_header_logo_url: '/branding-assets/app-header/',
  });

  const logo = container.querySelector('img.custom-logo');

  expect(logo).toHaveAttribute('src', '/branding-assets/app-header/');
  expect(logo).toHaveAttribute('alt', '');
  expect(logo).toHaveAttribute('aria-hidden', 'true');
});

test('uses the dark app header logo when dark mode is active', async () => {
  const { container } = renderLogo({
    mathesar_app_header_logo_url: '/branding-assets/app-header/',
    mathesar_app_header_logo_dark_url: '/branding-assets/app-header-dark/',
  });

  expect(container.querySelector('img.custom-logo')).toHaveAttribute(
    'src',
    '/branding-assets/app-header/',
  );

  resolvedUiTheme.set('dark');
  await tick();

  expect(container.querySelector('img.custom-logo')).toHaveAttribute(
    'src',
    '/branding-assets/app-header-dark/',
  );
});

test('falls back to the default Mathesar logo when a custom logo fails to load', async () => {
  const { container } = renderLogo({
    mathesar_app_header_logo_url: '/branding-assets/missing/',
  });

  const logo = container.querySelector('img.custom-logo');
  expect(logo).toBeInTheDocument();

  if (logo) {
    await fireEvent.error(logo);
  }
  await tick();

  expect(container.querySelector('img.custom-logo')).not.toBeInTheDocument();
  expect(container.querySelector('.mathesar-name')).toBeInTheDocument();
});
