module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Handle dynamic imports for Supabase
      [
        'module-resolver',
        {
          alias: {
            '@supabase/node-fetch': './lib/fetch-polyfill.ts',
            'node-fetch': './lib/fetch-polyfill.ts',
            'undici': './lib/fetch-polyfill.ts',
          },
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      ],
    ],
  };
};
