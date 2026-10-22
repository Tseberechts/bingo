/**
 * Ed25519 SPKI public key (DER, base64) used to verify paid license keys.
 * The matching private key lives only on Arkastro issuance machines (see secrets/).
 */
const LICENSE_PUBLIC_KEY_DER_B64 = 'MCowBQYDK2VwAyEApNtdtEBBnmT6aMb4S6SRJi8fTuuFUpIwgGlmVa15Es8=';

module.exports = {
  LICENSE_PUBLIC_KEY_DER_B64,
};
