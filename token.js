import { Tiktoken } from "js-tiktoken/lite";
import o200k_base from "js-tiktoken/ranks/o200k_base";

const enc = new Tiktoken(o200k_base);

const userQuery = 'What is the capital of France?';
const tokens = enc.encode(userQuery);

console.log("Tokens:", tokens);

const decoded = enc.decode(tokens);
console.log("Decoded:", decoded);