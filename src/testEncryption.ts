import "dotenv/config";

import {
  encryptSeed,
  decryptSeed
} from "./utils/encryption.js";

const seed = "sEd7AbCdEf123456";

const encrypted = encryptSeed(seed);

console.log(encrypted);

console.log(decryptSeed(encrypted));