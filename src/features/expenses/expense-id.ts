import * as Crypto from 'expo-crypto';

import type { GeradorIdGasto } from './register-expense';

export const gerarUuidGasto: GeradorIdGasto = () => Crypto.randomUUID();
