import {
  Operador,
  OrdemServico,
  Ambiente,
  Produto,
  Lote,
  Receita,
  Movimentacao,
  Preparacao,
  ResiduoMisturaOcorrencia,
} from '../../types';
import {
  OperadorRepository,
  OsRepository,
  ProdutoRepository,
  LoteRepository,
  ReceitaRepository,
  MovimentacaoRepository,
  PreparacaoRepository,
  ResiduoMisturaRepository,
} from '../repositories';
import {
  MOCK_OPERADORES,
  MOCK_SUPERVISOR,
  MOCK_ORDENS_SERVICO,
  MOCK_AMBIENTES,
  MOCK_PRODUTOS,
  MOCK_LOTES,
  MOCK_RECEITAS,
  MOCK_PREPARACOES_INICIAIS,
} from './mockData';
import { ordenarLotesFEFO } from '../../domain/fefo';
import {
  filtrarPreparacoesPendentesDevolucao,
  filtrarPreparacoesEmConferencia,
  filtrarPreparacoesHistoricoConcluido,
} from '../../domain/returnFlow';
import { buscarAplicacaoAtivaPorCabine } from '../../domain/operationalLocks';

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
  PREPARACOES: 'mada_preparacoes',
  RESIDUOS_MISTURA: 'mada_residuos_mistura',
};

const inMemoryStore = new Map<string, string>();

function loadStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }
  } catch {
    // fallback to in-memory store
  }
  const mem = inMemoryStore.get(key);
  return mem ? JSON.parse(mem) : fallback;
}

function saveStorage<T>(key: string, val: T): void {
  const serialized = JSON.stringify(val);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized);
    }
  } catch {
    // fallback to in-memory store
  }
  inMemoryStore.set(key, serialized);
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
    // Evita duplicação da mesma movimentação de componente (DEVOLUCAO ou DESCARTE)
    if (
      movimentacao.componenteItemId &&
      (movimentacao.tipo === 'DEVOLUCAO' || movimentacao.tipo === 'DESCARTE')
    ) {
      const jaRegistrada = this.movimentacoes.find(
        (m) =>
          m.componenteItemId === movimentacao.componenteItemId &&
          (m.tipo === 'DEVOLUCAO' || m.tipo === 'DESCARTE')
      );
      if (jaRegistrada) {
        return jaRegistrada;
      }
    }

    const proximoId = this.movimentacoes.reduce((max, m) => Math.max(max, m.id || 0), 0) + 1;
    const nova: Movimentacao = {
      ...movimentacao,
      id: proximoId,
      identificadorUnico:
        movimentacao.identificadorUnico ||
        `MOV-${proximoId}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
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

export class MockPreparacaoRepository implements PreparacaoRepository {
  private preparacoes: Preparacao[];

  constructor() {
    const loaded = loadStorage<Preparacao[]>(
      STORAGE_KEYS.PREPARACOES,
      JSON.parse(JSON.stringify(MOCK_PREPARACOES_INICIAIS))
    );
    const prepAnaTemplate = MOCK_PREPARACOES_INICIAIS.find((p) => p.id === 'PREP-2026-8842');
    const existingAnaIdx = loaded.findIndex((p) => p.id === 'PREP-2026-8842');
    const freshTimestamp = new Date(Date.now() - (10 * 60 + 35) * 1000).toISOString();

    if (prepAnaTemplate && existingAnaIdx === -1) {
      loaded.push({
        ...JSON.parse(JSON.stringify(prepAnaTemplate)),
        criadaEm: freshTimestamp,
        dosagemConcluidaEm: freshTimestamp,
      });
    } else if (
      existingAnaIdx >= 0 &&
      !loaded[existingAnaIdx].aplicacaoConcluidaEm &&
      loaded[existingAnaIdx].status !== 'PREPARACAO_ENCERRADA'
    ) {
      const startMs = loaded[existingAnaIdx].dosagemConcluidaEm
        ? new Date(loaded[existingAnaIdx].dosagemConcluidaEm!).getTime()
        : 0;
      const elapsedSec = (Date.now() - startMs) / 1000;
      if (elapsedSec > 23 * 60 || elapsedSec < 0) {
        loaded[existingAnaIdx] = {
          ...loaded[existingAnaIdx],
          criadaEm: freshTimestamp,
          dosagemConcluidaEm: freshTimestamp,
          statusPotLife: 'NORMAL',
        };
      }
    }
    this.preparacoes = loaded;
  }

  async listar(): Promise<Preparacao[]> {
    return [...this.preparacoes];
  }

  async listarPendentesDevolucao(): Promise<Preparacao[]> {
    return filtrarPreparacoesPendentesDevolucao(this.preparacoes);
  }

  async listarEmConferencia(): Promise<Preparacao[]> {
    return filtrarPreparacoesEmConferencia(this.preparacoes);
  }

  async listarHistoricoConcluidas(): Promise<Preparacao[]> {
    return filtrarPreparacoesHistoricoConcluido(this.preparacoes);
  }

  async buscarAplicacaoAtivaPorCabine(cabineId: string): Promise<Preparacao | undefined> {
    return buscarAplicacaoAtivaPorCabine(this.preparacoes, cabineId);
  }

  async buscarPorId(id: string): Promise<Preparacao | undefined> {
    return this.preparacoes.find((p) => p.id === id);
  }

  async salvar(preparacao: Preparacao): Promise<Preparacao> {
    const idx = this.preparacoes.findIndex((p) => p.id === preparacao.id);
    if (idx >= 0) {
      this.preparacoes = this.preparacoes.map((p, i) => (i === idx ? { ...preparacao } : p));
    } else {
      this.preparacoes = [{ ...preparacao }, ...this.preparacoes];
    }
    saveStorage(STORAGE_KEYS.PREPARACOES, this.preparacoes);
    return { ...preparacao };
  }

  async resetar(): Promise<void> {
    const freshTimestamp = new Date(Date.now() - (10 * 60 + 35) * 1000).toISOString();
    this.preparacoes = JSON.parse(JSON.stringify(MOCK_PREPARACOES_INICIAIS)).map(
      (p: Preparacao) =>
        p.id === 'PREP-2026-8842'
          ? { ...p, criadaEm: freshTimestamp, dosagemConcluidaEm: freshTimestamp }
          : p
    );
    saveStorage(STORAGE_KEYS.PREPARACOES, this.preparacoes);
  }
}

export class MockResiduoMisturaRepository implements ResiduoMisturaRepository {
  private ocorrencias: ResiduoMisturaOcorrencia[];

  constructor() {
    this.ocorrencias = loadStorage<ResiduoMisturaOcorrencia[]>(
      STORAGE_KEYS.RESIDUOS_MISTURA,
      []
    );
  }

  async registrar(ocorrencia: ResiduoMisturaOcorrencia): Promise<ResiduoMisturaOcorrencia> {
    const idx = this.ocorrencias.findIndex((o) => o.id === ocorrencia.id);
    if (idx >= 0) {
      this.ocorrencias = this.ocorrencias.map((o, i) => (i === idx ? { ...ocorrencia } : o));
    } else {
      this.ocorrencias = [{ ...ocorrencia }, ...this.ocorrencias];
    }
    saveStorage(STORAGE_KEYS.RESIDUOS_MISTURA, this.ocorrencias);
    return { ...ocorrencia };
  }

  async listar(): Promise<ResiduoMisturaOcorrencia[]> {
    return [...this.ocorrencias];
  }

  async listarPorPreparacao(preparacaoId: string): Promise<ResiduoMisturaOcorrencia[]> {
    return this.ocorrencias.filter((o) => o.preparacaoId === preparacaoId);
  }

  async resetar(): Promise<void> {
    this.ocorrencias = [];
    saveStorage(STORAGE_KEYS.RESIDUOS_MISTURA, this.ocorrencias);
  }
}
