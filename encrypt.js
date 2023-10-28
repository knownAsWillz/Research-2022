const fs = require('fs');
const crypto = require('crypto');

const secretKey = '$C&F)J@NcRfUjXn2r4u7x!A%D*G-KaPd';

const dataBuffer = fs.readFileSync('researchDatabase2.json');
const jsonString = dataBuffer.toString();
const data = JSON.parse(jsonString);

const cipher = crypto.createCipher('aes-256-cbc', secretKey);
let encrypted = cipher.update(jsonString, 'utf-8', 'hex');
encrypted += cipher.final('hex');

fs.writeFileSync('encryptedResearchDatabase.enc', encrypted, 'utf-8');

console.log('Encryption successful!');
