import {
  OperadorRepository,
  OsRepository,
  ProdutoRepository,
  LoteRepository,
  ReceitaRepository,
  MovimentacaoRepository,
} from './repositories';
import {
  MockOperadorRepository,
  MockOsRepository,
  MockProdutoRepository,
  MockLoteRepository,
  MockReceitaRepository,
  MockMovimentacaoRepository,
} from './mock';

export * from './repositories';
export * from './mock/mockData';

const dataSource = import.meta.env.VITE_DATA_SOURCE || 'mock';

function createRepositories() {
  if (dataSource === 'supabase') {
    throw new Error('Integração com Supabase ainda não implementada.');
  }

  // Padrão: implementação em memória com dados simulados
  return {
    operadorRepository: new MockOperadorRepository() as OperadorRepository,
    osRepository: new MockOsRepository() as OsRepository,
    produtoRepository: new MockProdutoRepository() as ProdutoRepository,
    loteRepository: new MockLoteRepository() as LoteRepository,
    receitaRepository: new MockReceitaRepository() as ReceitaRepository,
    movimentacaoRepository: new MockMovimentacaoRepository() as MovimentacaoRepository,
  };
}

export const repositories = createRepositories();

export const {
  operadorRepository,
  osRepository,
  produtoRepository,
  loteRepository,
  receitaRepository,
  movimentacaoRepository,
} = repositories;
