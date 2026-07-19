import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AdaptadorChaveValor } from './planning-storage';

export const adaptadorAsyncStorage: AdaptadorChaveValor = {
  obter: (chave) => AsyncStorage.getItem(chave),
  salvar: (chave, valor) => AsyncStorage.setItem(chave, valor),
  remover: (chave) => AsyncStorage.removeItem(chave),
};
