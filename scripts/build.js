const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

(async () => {
  const root = path.join(__dirname, '..');
  const outdir = path.join(root, 'dist');
  if (!fs.existsSync(outdir)) fs.mkdirSync(outdir, { recursive: true });

  try {
    await esbuild.build({
      entryPoints: [path.join(root, 'app.js')],
      bundle: true,
      minify: true,
      sourcemap: true,
      outfile: path.join(outdir, 'app.js'),
      target: ['es2017'],
      define: { 'process.env.NODE_ENV': '"production"' }
    });

    // Copy static assets
    fs.copyFileSync(path.join(root, 'index.html'), path.join(outdir, 'index.html'));
    fs.copyFileSync(path.join(root, 'style.css'), path.join(outdir, 'style.css'));

    console.log('Build completed: dist/ created');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
