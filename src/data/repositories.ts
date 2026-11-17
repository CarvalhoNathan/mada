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
} from '../types';

export interface OperadorRepository {
  listar(): Promise<Operador[]>;
  buscarPorId(id: number): Promise<Operador | undefined>;
  adicionar(operador: Omit<Operador, 'id'>): Promise<Operador>;
  autenticar(operadorId: number, pin: string): Promise<boolean>;
  validarSupervisorPin(pin: string): Promise<boolean>;
  resetar(): Promise<void>;
}

export interface OsRepository {
  listar(): Promise<OrdemServico[]>;
  buscarPorId(id: number): Promise<OrdemServico | undefined>;
  buscarPorNumero(numero: string): Promise<OrdemServico | undefined>;
  listarAmbientes(): Promise<Ambiente[]>;
}

export interface ProdutoRepository {
  listar(): Promise<Produto[]>;
  buscarPorId(id: number): Promise<Produto | undefined>;
}

export interface LoteRepository {
  listar(): Promise<Lote[]>;
  listarPrioritariosFEFO(): Promise<Lote[]>;
  buscarPorCodigo(codigo: string): Promise<Lote | undefined>;
  adicionarSobra(lote: Omit<Lote, 'id'>): Promise<Lote>;
  atualizarQuantidade(id: number, novaQuantidade: number): Promise<void>;
  resetar(): Promise<void>;
}

export interface ReceitaRepository {
  listar(): Promise<Receita[]>;
  buscarPorId(id: number): Promise<Receita | undefined>;
  buscarPorCodigoFormula(codigo: string): Promise<Receita | undefined>;
}

export interface MovimentacaoRepository {
  registrar(movimentacao: Movimentacao): Promise<Movimentacao>;
  listar(): Promise<Movimentacao[]>;
  resetar(): Promise<void>;
}

export interface PreparacaoRepository {
  listar(): Promise<Preparacao[]>;
  listarPendentesDevolucao(): Promise<Preparacao[]>;
  listarEmConferencia(): Promise<Preparacao[]>;
  listarHistoricoConcluidas(): Promise<Preparacao[]>;
  buscarAplicacaoAtivaPorCabine(cabineId: string): Promise<Preparacao | undefined>;
  buscarPorId(id: string): Promise<Preparacao | undefined>;
  salvar(preparacao: Preparacao): Promise<Preparacao>;
  resetar(): Promise<void>;
}

export interface ResiduoMisturaRepository {
  registrar(ocorrencia: ResiduoMisturaOcorrencia): Promise<ResiduoMisturaOcorrencia>;
  listar(): Promise<ResiduoMisturaOcorrencia[]>;
  listarPorPreparacao(preparacaoId: string): Promise<ResiduoMisturaOcorrencia[]>;
  resetar(): Promise<void>;
}
