const { withNativeFederation, shareAll, DEFAULT_SKIP_LIST } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'bank',

  exposes: {
    './Bootstrap': './src/bootstrap.ts',
    './Mount': './src/mount.ts',
    './Component': './src/remote-entry.ts',
  },

  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },

  // Importante para un build limpio en browser:
  // evitamos que Native Federation intente preparar/bundlear paquetes de Angular/Devkit/Node como "shared npm packages".
  skip: [
    ...DEFAULT_SKIP_LIST,
    (pkg) => pkg.startsWith('@angular/'),
    (pkg) => pkg.startsWith('@angular-devkit/'),
    (pkg) => pkg.startsWith('@google/genai'),
    'typescript',
    'rxjs',
    'rxjs/ajax',
    'rxjs/fetch',
    'rxjs/testing',
    'rxjs/webSocket',
  ],
});


