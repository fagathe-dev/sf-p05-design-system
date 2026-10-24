// =============================================================================
// compile-scss.js — Compile chaque assets/scss/ds-*.scss vers public/css/
// -----------------------------------------------------------------------------
// node scripts/compile-scss.js               développement : CSS lisible + source maps
// node scripts/compile-scss.js --mode build  production : CSS minifié, échec = code 1
// node scripts/compile-scss.js --watch       recompile les seuls points d'entrée
//                                            touchés par le fichier modifié
// =============================================================================

const sass = require('sass');
const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

const args = process.argv.slice(2);
const isBuild =
  args.includes('--mode') && args[args.indexOf('--mode') + 1] === 'build';
const isWatch = args.includes('--watch');

const inputDir = path.resolve('assets/scss');
const outDir = path.resolve('public/css');

// Dépendances de chaque point d'entrée (fichiers chargés lors de la dernière
// compilation) : en watch, seuls les points d'entrée concernés sont recompilés
const dependencies = new Map();

const time = () => new Date().toLocaleTimeString();
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

// Relus à chaque passe : un nouveau ds-*.scss est pris en compte sans redémarrer
const getEntryPoints = () =>
  fs
    .readdirSync(inputDir)
    .filter((file) => /^ds-.+\.scss$/.test(file))
    .map((file) => path.join(inputDir, file));

// N'écrit que si le contenu a changé (évite les rechargements inutiles)
const writeIfChanged = (file, content) => {
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === content) return;
  fs.writeFileSync(file, content);
};

const compileEntry = (entry) => {
  const name = path.basename(entry, '.scss');
  const cssFile = path.join(outDir, `${name}.css`);
  const mapFile = `${cssFile}.map`;
  const start = performance.now();

  try {
    const result = sass.compile(entry, {
      style: isBuild ? 'compressed' : 'expanded',
      sourceMap: !isBuild,
      sourceMapIncludeSources: !isBuild,
    });

    dependencies.set(
      entry,
      new Set(
        result.loadedUrls
          .filter((url) => url.protocol === 'file:')
          .map((url) => fileURLToPath(url)),
      ),
    );

    let css = result.css;
    if (result.sourceMap) {
      writeIfChanged(mapFile, JSON.stringify(result.sourceMap));
      css += `\n\n/*# sourceMappingURL=${path.basename(mapFile)} */\n`;
    } else if (fs.existsSync(mapFile)) {
      fs.rmSync(mapFile); // Pas de source map obsolète en production
    }
    writeIfChanged(cssFile, css);

    const duration = Math.round(performance.now() - start);
    console.log(
      `[${time()}] ✅ ${name}.css (${kb(Buffer.byteLength(css))}, ${duration} ms)`,
    );
    return true;
  } catch (error) {
    console.error(`[${time()}] ❌ ${name}.scss\n${error.message}\n`);
    return false;
  }
};

const compileAll = () => {
  const entries = getEntryPoints();
  if (entries.length === 0) {
    console.warn(
      `[${time()}] ⚠️ Aucun fichier ds-*.scss dans ${path.relative('.', inputDir)}`,
    );
    return true;
  }
  return entries.map(compileEntry).every(Boolean);
};

fs.mkdirSync(outDir, { recursive: true });
const ok = compileAll();

if (!isWatch) {
  process.exitCode = ok ? 0 : 1;
} else {
  const watched = path.relative('.', inputDir).split(path.sep).join('/');
  console.log(`👀 Watching ${watched} for changes...`);
  const changed = new Set();
  let timeout;

  fs.watch(inputDir, { recursive: true }, (_event, filename) => {
    if (!filename || !filename.endsWith('.scss')) return;
    changed.add(path.join(inputDir, filename));

    // Debounce : regroupe les écritures rapprochées (sauvegarde multiple, git…)
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const files = [...changed];
      changed.clear();

      // Un partial importé par aucun point d'entrée n'a pas d'effet : il sera
      // pris en compte dès que le fichier qui l'importe sera modifié
      getEntryPoints()
        .filter((entry) => {
          const deps = dependencies.get(entry);
          // Point d'entrée nouveau ou jamais compilé avec succès : on le recompile
          return !deps || files.some((file) => file === entry || deps.has(file));
        })
        .forEach(compileEntry);
    }, 100);
  });
}
