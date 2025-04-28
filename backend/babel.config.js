module.exports = {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current', // Configure pour l'environnement Node.js actuel
          },
        },
      ],
    ],
    plugins: [
      [
        'babel-plugin-root-import',
        {
          paths: [
            {
              rootPathPrefix: '~/',
              rootPathSuffix: 'src', // La racine pointe vers le dossier src
            },
          ],
        },
      ],
      '@babel/plugin-transform-runtime', // Optimise les helpers Babel
    ],
  };
  