// ============================================================================
// Entidades do Domínio e Banco de Dados (DER)
// ============================================================================

export interface Operador {
  id: number;
  nome: string;
  papel: string;
  avatar: string;
  pin: string;
  name?: string;
  role?: string;
}

export interface Cliente {
  id: number;
  nome: string;
}

export interface Projeto {
  id: number;
  clienteId: number;
  nome: string;
}

export interface Ambiente {
  id: number;
  projetoId: number;
  nome: string;
  codigoOS: string;
}

export interface PecaLote {
  titulo: string;
  quantidade: string;
  substrato: string;
  area: string;
  volumeEstimado: string;
  title?: string;
  qty?: string;
  substrate?: string;
  estVolume?: string;
}

export interface OrdemServico {
  id: number;
  numero: string;
  clienteId: number;
  projetoId: number;
  ambienteId: number;
  clienteNome: string;
  projetoNome: string;
  ambienteNome: string;
  pecaLote: PecaLote;
}

export interface Marca {
  id: number;
  nome: string;
}

export interface Produto {
  id: number;
  marcaId: number;
  codigo: string;
  nome: string;
  papelPadrao: 'base' | 'catalisador' | 'diluidor' | 'retardador';
  unidade: string;
  densidade: number; // g/ml
  preco?: number;
  prateleiraPadrao: string;
}

export interface Lote {
  id: number;
  produtoId: number;
  produtoNome: string;
  codigo: string;
  validade: string;
  diasAberto: number;
  quantidadeAtual: number; // ml
  statusUrgencia: 'alta' | 'media' | 'normal';
  prateleira: string;
}

export interface ReceitaItem {
  id: number;
  receitaId: number;
  produtoId: number;
  produtoNome: string;
  codigoProduto: string;
  papel: 'base' | 'catalisador' | 'diluidor' | 'retardador';
  proporcao: number; // ex: 0.50 = 50%
  densidade: number; // g/ml
  ordem: number;
}

export interface Receita {
  id: number;
  marcaId: number;
  marcaNome: string;
  codigoFormula: string;
  nome: string;
  descricao: string;
  itens: ReceitaItem[];
}

export interface Preparacao {
  id?: number;
  ordemServicoId: number;
  receitaId: number;
  operadorId: number;
  volumeTotal: number;
  criadaEm: string;
}

export type TipoMovimentacao = 'RETIRADA' | 'DEVOLUCAO' | 'DESCARTE';

export interface Movimentacao {
  id?: number;
  preparacaoId?: number;
  ordemServicoId?: number;
  operadorId?: number;
  loteId: number;
  tipo: TipoMovimentacao;
  quantidade: number;
  justificativa?: string;
  registradaEm: string;
}

// ============================================================================
// Tipos de Interface de Usuário e Compatibilidade
// ============================================================================

export type ScreenId = 'auth' | 'dashboard' | 'os' | 'recipe' | 'dosing' | 'return';

// Aliases para compatibilidade com os componentes existentes
export type Operator = Operador;
export type PieceLot = PecaLote;

export interface RecipeState {
  totalVolume: number;
  proportions: {
    base: number;
    catalisador: number;
    diluidor: number;
    retardador: number;
  };
  densities: {
    base: number;
    catalisador: number;
    diluidor: number;
    retardador: number;
  };
}
