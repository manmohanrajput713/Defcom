// Test file to verify crypto functions work correctly
// This can be run in the app to test device key generation

import { getSodium } from './lib/crypto/sodium-stable';

export async function testCryptoFunctions() {
  try {
    console.log('[testCryptoFunctions] Starting crypto function tests...');
    
    const sodium = await getSodium();
    console.log('[testCryptoFunctions] Sodium module loaded successfully');
    
    // Test Ed25519 key generation
    const signingKeyPair = sodium.crypto_sign_keypair();
    console.log('[testCryptoFunctions] Ed25519 key pair generated successfully');
    
    // Test Ed25519 to Curve25519 conversion
    const identityPublic = sodium.crypto_sign_ed25519_pk_to_curve25519(
      signingKeyPair.publicKey
    );
    console.log('[testCryptoFunctions] Ed25519 public key converted to Curve25519 successfully');
    
    const identityPrivate = sodium.crypto_sign_ed25519_sk_to_curve25519(
      signingKeyPair.privateKey
    );
    console.log('[testCryptoFunctions] Ed25519 private key converted to Curve25519 successfully');
    
    // Test X25519 key generation
    const kxKeyPair = sodium.crypto_kx_keypair();
    console.log('[testCryptoFunctions] X25519 key pair generated successfully');
    
    // Test scalar multiplication
    const sharedSecret = sodium.crypto_scalarmult(
      kxKeyPair.privateKey,
      kxKeyPair.publicKey
    );
    console.log('[testCryptoFunctions] Scalar multiplication test successful');
    
    console.log('[testCryptoFunctions] All crypto function tests passed! ✅');
    return true;
    
  } catch (error) {
    console.error('[testCryptoFunctions] Crypto function test failed:', error);
    return false;
  }
}

// Export for use in other parts of the app
export default testCryptoFunctions;
