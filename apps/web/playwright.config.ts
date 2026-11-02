import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { defineConfig } from '@playwright/test';
import chromium from '@sparticuz/chromium';

// Prefer a normal, locally installed Chromium when E2E_CHROMIUM_PATH is set.
// Otherwise use the pinned Linux/x64 test binary and its bundled support files.
// This avoids system package installation and browser downloads during tests.
const bundled = !process.env.E2E_CHROMIUM_PATH;
let executablePath = process.env.E2E_CHROMIUM_PATH;
if (bundled) {
  if (process.platform !== 'linux' || process.arch !== 'x64') {
    throw new Error(
      'The bundled test browser requires Linux/x64. Set E2E_CHROMIUM_PATH to a local Chromium.',
    );
  }
  const require = createRequire(import.meta.url);
  const packageDirectory = dirname(require.resolve('@sparticuz/chromium'));
  const { inflate } = require(join(packageDirectory, 'lambdafs.cjs')) as {
    inflate: (path: string) => Promise<string>;
  };
  executablePath = await chromium.executablePath();
  const libraries = await inflate(join(packageDirectory, '../../bin/al2023.tar.br'));
  const fonts = await inflate(join(packageDirectory, '../../bin/fonts.tar.br'));
  process.env.LD_LIBRARY_PATH = [join(libraries, 'lib'), process.env.LD_LIBRARY_PATH]
    .filter(Boolean)
    .join(':');
  process.env.FONTCONFIG_PATH = fonts;
}

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath,
      // Do not use chromium.args: it disables web security and site isolation.
      // Only the container/headless compatibility flags are needed here.
      args: bundled
        ? ['--no-sandbox', '--disable-setuid-sandbox', '--no-zygote', '--disable-dev-shm-usage']
        : ['--disable-dev-shm-usage'],
    },
  },
  // Never run state-changing tests against the interactive demo database.
  webServer: [
    {
      command: '.venv/bin/python -m uvicorn iesmmg.main:app --host 127.0.0.1 --port 8001',
      cwd: '../../services/api',
      url: 'http://127.0.0.1:8001/api/v1/system/health',
      env: {
        PYTHONPATH: 'src',
        IESMMG_ENV: 'test',
        IESMMG_DATABASE_URL: 'sqlite:///:memory:',
        IESMMG_SIMULATE: 'false',
        IESMMG_SECURE_COOKIES: 'false',
        IESMMG_EXTRA_ORIGIN: '',
      },
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: 'npm run dev -- --port 3001 --strictPort',
      url: 'http://127.0.0.1:3001',
      env: { API_PROXY_TARGET: 'http://127.0.0.1:8001' },
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
