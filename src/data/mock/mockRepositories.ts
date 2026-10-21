import {
  Operador,
  OrdemServico,
  Ambiente,
  Produto,
  Lote,
  Receita,
  Movimentacao,
} from '../../types';
import {
  OperadorRepository,
  OsRepository,
  ProdutoRepository,
  LoteRepository,
  ReceitaRepository,
  MovimentacaoRepository,
} from '../repositories';
import {
  MOCK_OPERADORES,
  MOCK_SUPERVISOR,
  MOCK_ORDENS_SERVICO,
  MOCK_AMBIENTES,
  MOCK_PRODUTOS,
  MOCK_LOTES,
  MOCK_RECEITAS,
} from './mockData';
import { ordenarLotesFEFO } from '../../domain/fefo';

export class MockOperadorRepository implements OperadorRepository {
  private operadores = [...MOCK_OPERADORES];

  async listar(): Promise<Operador[]> {
    return [...this.operadores];
  }

  async buscarPorId(id: number): Promise<Operador | undefined> {
    return this.operadores.find(o => o.id === id);
  }

  async autenticar(operadorId: number, pin: string): Promise<boolean> {
    const op = this.operadores.find(o => o.id === operadorId);
    if (!op) return false;
    return op.pin === pin;
  }

  async validarSupervisorPin(pin: string): Promise<boolean> {
    const limpo = pin.trim();
    return limpo === MOCK_SUPERVISOR.pin || limpo === MOCK_SUPERVISOR.pinAlternativo;
  }
}

export class MockOsRepository implements OsRepository {
  private ordens = [...MOCK_ORDENS_SERVICO];
  private ambientes = [...MOCK_AMBIENTES];

  async listar(): Promise<OrdemServico[]> {
    return [...this.ordens];
  }

  async buscarPorId(id: number): Promise<OrdemServico | undefined> {
    return this.ordens.find(o => o.id === id);
  }

  async buscarPorNumero(numero: string): Promise<OrdemServico | undefined> {
    return this.ordens.find(o => o.numero === numero);
  }

  async listarAmbientes(): Promise<Ambiente[]> {
    return [...this.ambientes];
  }
}

export class MockProdutoRepository implements ProdutoRepository {
  private produtos = [...MOCK_PRODUTOS];

  async listar(): Promise<Produto[]> {
    return [...this.produtos];
  }

  async buscarPorId(id: number): Promise<Produto | undefined> {
    return this.produtos.find(p => p.id === id);
  }
}

const STORAGE_KEYS = {
  LOTES: 'mada_lotes',
  MOVIMENTACOES: 'mada_movimentacoes',
};

function loadStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Silenciosamente ignora em caso de modo restrito
  }
}

export class MockLoteRepository implements LoteRepository {
  private lotes: Lote[];

  constructor() {
    this.lotes = loadStorage<Lote[]>(STORAGE_KEYS.LOTES, [...MOCK_LOTES]);
  }

  async listar(): Promise<Lote[]> {
    return [...this.lotes];
  }

  async listarPrioritariosFEFO(): Promise<Lote[]> {
    return ordenarLotesFEFO(this.lotes);
  }

  async buscarPorCodigo(codigo: string): Promise<Lote | undefined> {
    return this.lotes.find(l => l.codigo === codigo);
  }

  async adicionarSobra(novoLote: Omit<Lote, 'id'>): Promise<Lote> {
    const proximoId = this.lotes.reduce((max, l) => Math.max(max, l.id), 0) + 1;
    const criado: Lote = {
      ...novoLote,
      id: proximoId,
    };
    this.lotes = [criado, ...this.lotes];
    saveStorage(STORAGE_KEYS.LOTES, this.lotes);
    return criado;
  }

  async atualizarQuantidade(id: number, novaQuantidade: number): Promise<void> {
    this.lotes = this.lotes.map(l => (l.id === id ? { ...l, quantidadeAtual: novaQuantidade } : l));
    saveStorage(STORAGE_KEYS.LOTES, this.lotes);
  }

  async resetar(): Promise<void> {
    this.lotes = [...MOCK_LOTES];
    saveStorage(STORAGE_KEYS.LOTES, this.lotes);
  }
}

export class MockReceitaRepository implements ReceitaRepository {
  private receitas = [...MOCK_RECEITAS];

  async listar(): Promise<Receita[]> {
    return [...this.receitas];
  }

  async buscarPorId(id: number): Promise<Receita | undefined> {
    return this.receitas.find(r => r.id === id);
  }

  async buscarPorCodigoFormula(codigo: string): Promise<Receita | undefined> {
    return this.receitas.find(r => r.codigoFormula === codigo);
  }
}

export class MockMovimentacaoRepository implements MovimentacaoRepository {
  private movimentacoes: Movimentacao[];

  constructor() {
    this.movimentacoes = loadStorage<Movimentacao[]>(STORAGE_KEYS.MOVIMENTACOES, []);
  }

  async registrar(movimentacao: Movimentacao): Promise<Movimentacao> {
    const nova: Movimentacao = {
      ...movimentacao,
      id: this.movimentacoes.length + 1,
      registradaEm: movimentacao.registradaEm || new Date().toISOString(),
    };
    this.movimentacoes = [nova, ...this.movimentacoes];
    saveStorage(STORAGE_KEYS.MOVIMENTACOES, this.movimentacoes);
    return nova;
  }

  async listar(): Promise<Movimentacao[]> {
    return [...this.movimentacoes];
  }

  async resetar(): Promise<void> {
    this.movimentacoes = [];
    saveStorage(STORAGE_KEYS.MOVIMENTACOES, this.movimentacoes);
  }
}
