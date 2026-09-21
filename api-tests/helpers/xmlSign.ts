import fs from 'fs';
import forge from 'node-forge';
import { SignedXml } from 'xml-crypto';

const RSA_SHA1 = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';
const SHA1 = 'http://www.w3.org/2000/09/xmldsig#sha1';
const C14N_COMMENTS = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments';
const ENVELOPED = 'http://www.w3.org/2000/09/xmldsig#enveloped-signature';

function loadP12(p12Path: string, password: string) {
  const der = forge.util.createBuffer(fs.readFileSync(p12Path).toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(forge.asn1.fromDer(der), false, password);

  const keyBag = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
    forge.pki.oids.pkcs8ShroudedKeyBag
  ]![0];
  const certBag = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag]![0];

  const privateKey = keyBag.key as forge.pki.rsa.PrivateKey;
  const cert = certBag.cert as forge.pki.Certificate;

  return {
    privateKeyPem: forge.pki.privateKeyToPem(privateKey),
    certPem: forge.pki.certificateToPem(cert),
    publicKey: cert.publicKey as forge.pki.rsa.PublicKey,
  };
}

const bigIntToBase64 = (n: forge.jsbn.BigInteger) => {
  let hex = n.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  return forge.util.encode64(forge.util.hexToBytes(hex));
};

// Подписывает XML по XMLDSig (enveloped, RSA-SHA1, C14N with comments)
export function signXml(xml: string, p12Path: string, password: string): string {
  const { privateKeyPem, certPem, publicKey } = loadP12(p12Path, password);
  const certBase64 = certPem.replace(/-----(BEGIN|END) CERTIFICATE-----|\r?\n/g, '');

  const sig = new SignedXml({
    privateKey: privateKeyPem,
    signatureAlgorithm: RSA_SHA1,
    canonicalizationAlgorithm: C14N_COMMENTS,
    // как в примере документации: KeyValue + X509Data
    getKeyInfoContent: () =>
      `<KeyValue><RSAKeyValue><Modulus>${bigIntToBase64(publicKey.n)}</Modulus>` +
      `<Exponent>${bigIntToBase64(publicKey.e)}</Exponent></RSAKeyValue></KeyValue>` +
      `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`,
  });

  sig.addReference({
    xpath: '/*',
    transforms: [ENVELOPED],
    digestAlgorithm: SHA1,
    isEmptyUri: true,
  });

  sig.computeSignature(xml, { location: { reference: '/*', action: 'append' } });
  return sig.getSignedXml();
}