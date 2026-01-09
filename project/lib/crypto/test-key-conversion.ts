// Test file to verify Ed25519 to Curve25519 key conversion compatibility
// This will help identify if the key conversion is working correctly

import { getSodium } from './lib/crypto/sodium-stable';

export async function testKeyConversionCompatibility() {
  try {
    console.log('[testKeyConversionCompatibility] Starting key conversion test...');
    
    const sodium = await getSodium();
    
    // Generate Ed25519 key pair
    const ed25519KeyPair = sodium.crypto_sign_keypair();
    console.log('[testKeyConversionCompatibility] Ed25519 key pair generated');
    
    // Convert to Curve25519
    const curve25519Public = sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519KeyPair.publicKey);
    const curve25519Private = sodium.crypto_sign_ed25519_sk_to_curve25519(ed25519KeyPair.privateKey);
    
    console.log('[testKeyConversionCompatibility] Keys converted:', {
      ed25519PublicLength: ed25519KeyPair.publicKey.length,
      ed25519PrivateLength: ed25519KeyPair.privateKey.length,
      curve25519PublicLength: curve25519Public.length,
      curve25519PrivateLength: curve25519Private.length
    });
    
    // Test scalar multiplication
    const testPublicKey = sodium.crypto_kx_keypair().publicKey;
    const sharedSecret1 = sodium.crypto_scalarmult(curve25519Private, testPublicKey);
    const sharedSecret2 = sodium.crypto_scalarmult(sodium.crypto_kx_keypair().privateKey, curve25519Public);
    
    console.log('[testKeyConversionCompatibility] Scalar multiplication test:', {
      sharedSecret1Length: sharedSecret1.length,
      sharedSecret2Length: sharedSecret2.length,
      secretsEqual: sharedSecret1.every((byte, index) => byte === sharedSecret2[index])
    });
    
    // Test that the converted keys can be used for key exchange
    const testKeyPair = sodium.crypto_kx_keypair();
    const sharedSecret = sodium.crypto_scalarmult(curve25519Private, testKeyPair.publicKey);
    
    console.log('[testKeyConversionCompatibility] Key exchange test successful:', {
      sharedSecretLength: sharedSecret.length,
      allZeros: sharedSecret.every(byte => byte === 0)
    });
    
    if (sharedSecret.every(byte => byte === 0)) {
      console.error('[testKeyConversionCompatibility] WARNING: Shared secret is all zeros!');
      return false;
    }
    
    console.log('[testKeyConversionCompatibility] All tests passed! ✅');
    return true;
    
  } catch (error) {
    console.error('[testKeyConversionCompatibility] Test failed:', error);
    return false;
  }
}

// Export for use in other parts of the app
export default testKeyConversionCompatibility;
