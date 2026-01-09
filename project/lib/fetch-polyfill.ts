// Polyfill to ensure fetch is available for Supabase
// This prevents dynamic imports of @supabase/node-fetch
import 'react-native-url-polyfill/auto';

// Make sure fetch is globally available
if (typeof global.fetch === 'undefined') {
  // @ts-ignore
  global.fetch = fetch;
}

if (typeof global.Headers === 'undefined') {
  // @ts-ignore
  global.Headers = Headers;
}

if (typeof global.Request === 'undefined') {
  // @ts-ignore
  global.Request = Request;
}

if (typeof global.Response === 'undefined') {
  // @ts-ignore
  global.Response = Response;
}

// Create a mock module for @supabase/node-fetch to prevent bundling errors
// This prevents Supabase from trying to import Node.js-specific fetch
const mockNodeFetch = fetch;

// Mock the @supabase/node-fetch module
if (typeof globalThis !== 'undefined') {
  // @ts-ignore
  globalThis['@supabase/node-fetch'] = {
    default: mockNodeFetch,
    fetch: mockNodeFetch,
  };
}

// Handle the specific "false" import issue
// This happens when Supabase tries to conditionally import node-fetch
const createMockModule = (name: string) => ({
  default: mockNodeFetch,
  fetch: mockNodeFetch,
  [name]: mockNodeFetch,
});

// Mock various module names that might be imported
const mockModules = {
  '@supabase/node-fetch': createMockModule('@supabase/node-fetch'),
  'node-fetch': createMockModule('node-fetch'),
  'undici': createMockModule('undici'),
  'false': createMockModule('false'),
};

// Export the fetch function as default for @supabase/node-fetch compatibility
const nodeFetch = fetch;

// Export both default and named exports to match what Supabase expects
export default nodeFetch;
export { nodeFetch as fetch };
export { nodeFetch };

// Export mock modules for different import patterns
export const mockNodeFetchModule = mockNodeFetch;
export const mockUndiciModule = mockNodeFetch;

// Also export as a CommonJS module for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = nodeFetch;
  module.exports.default = nodeFetch;
  module.exports.fetch = nodeFetch;
  module.exports.mockNodeFetchModule = mockNodeFetch;
  module.exports.mockUndiciModule = mockNodeFetch;
}

