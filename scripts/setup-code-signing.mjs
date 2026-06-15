#!/usr/bin/env node
/**
 * Generates RSA key pair for Re.Pack CodeSigningPlugin and embeds the public
 * key into the travel-host native projects (RepackPublicKey).
 *
 * Run once: pnpm setup:code-signing
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const privateKeyPath = path.join(rootDir, 'code-signing.pem');
const publicKeyPath = path.join(rootDir, 'code-signing.pem.pub');
const hostDir = path.join(rootDir, 'apps', 'travel-host');
const iosPlistPath = path.join(hostDir, 'ios', 'TravelHost', 'Info.plist');
const androidStringsPath = path.join(
  hostDir,
  'android',
  'app',
  'src',
  'main',
  'res',
  'values',
  'strings.xml'
);

function ensureKeyPair() {
  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    console.log('Code signing keys already exist.');
    return;
  }

  console.log('Generating code-signing.pem (empty passphrase)...');
  execSync(
    `ssh-keygen -t rsa -b 4096 -m PEM -f "${privateKeyPath}" -N ""`,
    { stdio: 'inherit' }
  );
  execSync(
    `openssl rsa -in "${privateKeyPath}" -pubout -outform PEM -out "${publicKeyPath}"`,
    { stdio: 'inherit' }
  );
  console.log('Key pair created.');
}

function embedIosPublicKey(publicKey) {
  const plist = fs.readFileSync(iosPlistPath, 'utf8');
  const keyBlock = `\t<key>RepackPublicKey</key>\n\t<string>${publicKey}</string>\n`;

  if (plist.includes('<key>RepackPublicKey</key>')) {
    const updated = plist.replace(
      /<key>RepackPublicKey<\/key>\s*<string>[\s\S]*?<\/string>/,
      `<key>RepackPublicKey</key>\n\t<string>${publicKey}</string>`
    );
    fs.writeFileSync(iosPlistPath, updated);
    return;
  }

  const updated = plist.replace('</dict>\n</plist>', `${keyBlock}</dict>\n</plist>`);
  fs.writeFileSync(iosPlistPath, updated);
}

function embedAndroidPublicKey(publicKey) {
  const strings = fs.readFileSync(androidStringsPath, 'utf8');
  const escaped = publicKey.replace(/\n/g, '\\n');
  const entry = `  <string name="RepackPublicKey" translatable="false">${escaped}</string>\n`;

  if (strings.includes('name="RepackPublicKey"')) {
    const updated = strings.replace(
      /<string name="RepackPublicKey"[\s\S]*?<\/string>/,
      `<string name="RepackPublicKey" translatable="false">${escaped}</string>`
    );
    fs.writeFileSync(androidStringsPath, updated);
    return;
  }

  const updated = strings.replace('</resources>', `${entry}</resources>`);
  fs.writeFileSync(androidStringsPath, updated);
}

ensureKeyPair();

const publicKey = fs.readFileSync(publicKeyPath, 'utf8').trim();
embedIosPublicKey(publicKey);
embedAndroidPublicKey(publicKey);

console.log('Embedded RepackPublicKey into travel-host iOS and Android.');
console.log('Private key:', privateKeyPath);
console.log('Public key:', publicKeyPath);
