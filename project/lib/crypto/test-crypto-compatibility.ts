// Test crypto compatibility between encryption and decryption
import { getSodium } from './sodium-stable';

export async function testCryptoCompatibility() {
  try {
    console.log('[testCryptoCompatibility] Starting crypto compatibility test...');
    
    const sodium = await getSodium();
    
    // Test 1: Basic XChaCha20-Poly1305 encryption/decryption
    console.log('[testCryptoCompatibility] Test 1: Basic XChaCha20-Poly1305...');
    const testMessage = "Hello, World!";
    const testKey = sodium.crypto_aead_xchacha20poly1305_ietf_keygen();
    const testNonce = sodium.crypto_aead_xchacha20poly1305_ietf_noncegen();
    
    console.log('[testCryptoCompatibility] Generated test data:', {
      messageLength: testMessage.length,
      keyLength: testKey.length,
      nonceLength: testNonce.length
    });
    
    const ciphertext = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      testMessage,
      null, // no additional data
      null, // no nonce (uses generated one)
      testKey
    );
    
    console.log('[testCryptoCompatibility] Encryption successful, ciphertext length:', ciphertext.length);
    
    const decrypted = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext,
      null, // no additional data
      testNonce,
      testKey
    );
    
    if (!decrypted) {
      console.error('[testCryptoCompatibility] Test 1 FAILED: Decryption returned null');
      return false;
    }
    
    const decryptedText = new TextDecoder().decode(decrypted);
    if (decryptedText !== testMessage) {
      console.error('[testCryptoCompatibility] Test 1 FAILED: Decrypted text does not match');
      return false;
    }
    
    console.log('[testCryptoCompatibility] Test 1 PASSED: Basic encryption/decryption works');
    
    // Test 2: Test with associated data
    console.log('[testCryptoCompatibility] Test 2: XChaCha20-Poly1305 with associated data...');
    const testAD = "associated-data";
    const ciphertext2 = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      testMessage,
      testAD,
      null,
      testKey
    );
    
    const decrypted2 = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      ciphertext2,
      testAD,
      testNonce,
      testKey
    );
    
    if (!decrypted2) {
      console.error('[testCryptoCompatibility] Test 2 FAILED: Decryption with AD returned null');
      return false;
    }
    
    const decryptedText2 = new TextDecoder().decode(decrypted2);
    if (decryptedText2 !== testMessage) {
      console.error('[testCryptoCompatibility] Test 2 FAILED: Decrypted text with AD does not match');
      return false;
    }
    
    console.log('[testCryptoCompatibility] Test 2 PASSED: Encryption/decryption with AD works');
    
    // Test 3: Test key derivation
    console.log('[testCryptoCompatibility] Test 3: Key derivation...');
    const testInput = new Uint8Array(32);
    crypto.getRandomValues(testInput);
    
    const derived = sodium.crypto_auth_hmacsha256(testInput, new Uint8Array(32));
    console.log('[testCryptoCompatibility] Key derivation successful, derived length:', derived.length);
    
    // Test 4: Test Ed25519 to Curve25519 conversion
    console.log('[testCryptoCompatibility] Test 4: Ed25519 to Curve25519 conversion...');
    const ed25519KeyPair = sodium.crypto_sign_keypair();
    const curve25519Public = sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519KeyPair.publicKey);
    const curve25519Private = sodium.crypto_sign_ed25519_sk_to_curve25519(ed25519KeyPair.privateKey);
    
    console.log('[testCryptoCompatibility] Key conversion successful:', {
      ed25519PublicLength: ed25519KeyPair.publicKey.length,
      ed25519PrivateLength: ed25519KeyPair.privateKey.length,
      curve25519PublicLength: curve25519Public.length,
      curve25519PrivateLength: curve25519Private.length,
      curve25519PublicAllZeros: curve25519Public.every(byte => byte === 0),
      curve25519PrivateAllZeros: curve25519Private.every(byte => byte === 0)
    });
    
    if (curve25519Public.every(byte => byte === 0) || curve25519Private.every(byte => byte === 0)) {
      console.error('[testCryptoCompatibility] Test 4 FAILED: Converted keys are all zeros');
      return false;
    }
    
    console.log('[testCryptoCompatibility] Test 4 PASSED: Ed25519 to Curve25519 conversion works');
    
    // Test 5: Test scalar multiplication
    console.log('[testCryptoCompatibility] Test 5: Scalar multiplication...');
    const testKeyPair = sodium.crypto_kx_keypair();
    const sharedSecret = sodium.crypto_scalarmult(curve25519Private, testKeyPair.publicKey);
    
    console.log('[testCryptoCompatibility] Scalar multiplication successful:', {
      sharedSecretLength: sharedSecret.length,
      sharedSecretAllZeros: sharedSecret.every(byte => byte === 0)
    });
    
    if (sharedSecret.every(byte => byte === 0)) {
      console.error('[testCryptoCompatibility] Test 5 FAILED: Shared secret is all zeros');
      return false;
    }
    
    console.log('[testCryptoCompatibility] Test 5 PASSED: Scalar multiplication works');
    
    console.log('[testCryptoCompatibility] All tests PASSED! ✅');
    return true;
    
  } catch (error) {
    console.error('[testCryptoCompatibility] Test failed:', error);
    return false;
  }
}

// Export for use in other parts of the app
export default testCryptoCompatibility;
