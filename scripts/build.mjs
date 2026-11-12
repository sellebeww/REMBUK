// Copyright (c) 2026 Vassel Goleyu. All rights reserved.
// Build: bundel packages/core menjadi skrip peramban dan tulis config.js dari environment.
import { build } from 'esbuild';
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const coreOnly = process.argv.includes('--core-only');

mkdirSync(join(root, 'public/app/js/vendor'), { recursive: true });

await build({
  entryPoints: [join(root, 'packages/core/src/index.ts')],
  outfile: join(root, 'public/app/js/vendor/rembuk-core.js'),
  bundle: true,
  format: 'iife',
  globalName: 'RembukCore',
  target: 'es2020',
  minify: false,
  banner: { js: '/* Copyright (c) 2026 Vassel Goleyu. Dibangkitkan dari packages/core; jangan diedit langsung. */' },
});

if (!coreOnly) {
  const url = process.env.REMBUK_SUPABASE_URL ?? '';
  const anon = process.env.REMBUK_SUPABASE_ANON_KEY ?? '';
  const config = { supabaseUrl: url, supabaseAnonKey: anon, mode: url && anon ? 'supabase' : 'demo' };
  writeFileSync(
    join(root, 'public/app/config.js'),
    `/* Dibangkitkan oleh scripts/build.mjs. Kunci anon Supabase bersifat publik; jangan pernah menaruh service role di sini. */\nwindow.REMBUK_CONFIG = ${JSON.stringify(config)};\n`,
  );
  // Service worker: daftar berkas aplikasi + versi dari hash isinya, agar cache diperbarui saat berkas berubah.
  const appDir = join(root, 'public/app');
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
  const files = walk(appDir).map((f) => f.slice(appDir.length + 1).replaceAll('\\', '/')).filter((f) => f !== 'sw.js').sort();
  const hash = createHash('sha256');
  for (const f of files) hash.update(f).update(readFileSync(join(appDir, f)));
  const assets = ['./', ...files];
  const sw = readFileSync(join(root, 'scripts/sw.template.js'), 'utf8')
    .replace('__VERSION__', hash.digest('hex').slice(0, 12))
    .replace('__ASSETS__', JSON.stringify(assets));
  writeFileSync(join(appDir, 'sw.js'), sw);
  console.log(`build ok, mode=${config.mode}, ${assets.length} berkas offline`);
} else {
  console.log('build core ok');
}
