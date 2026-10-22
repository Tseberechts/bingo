# License issuance secrets

`license-private.b64` holds the Ed25519 PKCS8 private key (DER, base64) used by `scripts/issue-license.js`.

This folder is gitignored except this README. Keep the private key offline / backed up securely. Only the public key in `game/license-public-key.js` ships with the app.

Generate a new pair (then update the public key module):

```bash
node -e "const {generateKeyPairSync}=require('crypto'); const {privateKey,publicKey}=generateKeyPairSync('ed25519'); console.log('PUBLIC', publicKey.export({type:'spki',format:'der'}).toString('base64')); console.log('PRIVATE', privateKey.export({type:'pkcs8',format:'der'}).toString('base64'));"
```
