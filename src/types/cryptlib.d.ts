declare module 'cryptlib' {
  const cryptLib: {
    encrypt(plainText: string, key: string, iv: string): string;
    decrypt(cipherText: string, key: string, iv: string): string;
    getHashSha256(text: string, keySize: number): string; // returns hex string
    generateRandomString(length: number): string;
  };
  export default cryptLib;
}