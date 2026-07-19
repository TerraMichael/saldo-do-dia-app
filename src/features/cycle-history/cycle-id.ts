import * as Crypto from 'expo-crypto';

export function gerarUuidCiclo(): string {
  return Crypto.randomUUID();
}
