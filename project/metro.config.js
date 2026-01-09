// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add polyfills for crypto and other node modules
config.resolver.extraNodeModules = {
  crypto: require.resolve('expo-standard-web-crypto'),
  // Mock problematic Node.js modules
  '@supabase/node-fetch': require.resolve('./lib/fetch-polyfill.ts'),
  'node-fetch': require.resolve('./lib/fetch-polyfill.ts'),
  'undici': require.resolve('./lib/fetch-polyfill.ts'),
};

// Configure source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

// Add asset extensions for libsodium wasm files
config.resolver.assetExts = [...config.resolver.assetExts, 'wasm'];

// Add custom resolver to handle Supabase imports
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle Supabase Node.js specific imports by providing a polyfill
  if (moduleName === '@supabase/node-fetch' || 
      moduleName === 'node-fetch' || 
      moduleName === 'undici' ||
      moduleName.includes('node-fetch') ||
      moduleName.includes('undici') ||
      moduleName === 'false') {
    // Return a path to a polyfill instead of empty module
    return {
      type: 'sourceFile',
      filePath: require.resolve('./lib/fetch-polyfill.ts'),
    };
  }
  
  // Use default resolver for everything else
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

// Add platform-specific extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;

