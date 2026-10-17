import {
  Operador,
  OrdemServico,
  Ambiente,
  Produto,
  Lote,
  Receita,
  Movimentacao,
} from '../types';

export interface OperadorRepository {
  listar(): Promise<Operador[]>;
  buscarPorId(id: number): Promise<Operador | undefined>;
  autenticar(operadorId: number, pin: string): Promise<boolean>;
  validarSupervisorPin(pin: string): Promise<boolean>;
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
}

export interface ReceitaRepository {
  listar(): Promise<Receita[]>;
  buscarPorId(id: number): Promise<Receita | undefined>;
  buscarPorCodigoFormula(codigo: string): Promise<Receita | undefined>;
}

export interface MovimentacaoRepository {
  registrar(movimentacao: Movimentacao): Promise<Movimentacao>;
  listar(): Promise<Movimentacao[]>;
}
