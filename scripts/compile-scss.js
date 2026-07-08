const sass = require('sass');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isBuild =
  args.includes('--mode') && args[args.indexOf('--mode') + 1] === 'build';
const isWatch = args.includes('--watch'); // Détection du flag watch[cite: 40]

const inputDir = 'assets/scss';
const outdir = 'public/css';

// Création du dossier de destination s'il n'existe pas[cite: 40]
if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });

// Récupération dynamique des fichiers d'entrée ds-*.scss
function getEntryPoints() {
  if (!fs.existsSync(inputDir)) return [];

  return fs
    .readdirSync(inputDir)
    .filter((file) => file.startsWith('ds-') && file.endsWith('.scss'))
    .map((file) => path.join(inputDir, file));
}

// Fonction de compilation isolée et dynamisée[cite: 40]
function compileSass() {
  const entryPoints = getEntryPoints();

  if (entryPoints.length === 0) {
    console.warn(
      `[${new Date().toLocaleTimeString()}] ⚠️ Aucun fichier ds-*.scss trouvé dans ${inputDir}`,
    );
    return;
  }

  entryPoints.forEach((entryPoint) => {
    // Génération du nom de fichier de sortie (ds-xyz.scss -> ds-xyz.css)
    const filename = path.basename(entryPoint);
    const outfile = filename.replace('.scss', '.css');
    const outputPath = path.join(outdir, outfile);

    try {
      const result = sass.compile(entryPoint, {
        style: isBuild ? 'compressed' : 'expanded', // Gestion du mode build[cite: 40]
      });
      fs.writeFileSync(outputPath, result.css); // Écriture du fichier[cite: 40]
      const time = new Date().toLocaleTimeString();
      console.log(
        `[${time}] ✅ SCSS compiled: ${filename} -> ${outdir}/${outfile}`,
      );
    } catch (error) {
      console.error(
        `[${new Date().toLocaleTimeString()}] ❌ SCSS compilation failed for ${filename}:`,
        error.message,
      );
    }
  });
}

// 1. On lance une première compilation au démarrage[cite: 40]
compileSass();

// 2. Si mode watch activé, on écoute le dossier[cite: 40]
if (isWatch) {
  console.log(`👀 Watching SCSS files in ${inputDir} for changes...`);
  let timeout;

  // Écoute récursive de tout le dossier scss[cite: 40]
  fs.watch(inputDir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.scss')) {
      // Debounce : on annule la précédente compilation si elle date de moins de 100ms[cite: 40]
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        compileSass();
      }, 100);
    }
  });
}
