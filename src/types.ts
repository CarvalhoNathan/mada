// ============================================================================
// Entidades do Domínio e Banco de Dados (DER)
// ============================================================================

export interface Operador {
  id: number;
  nome: string;
  papel: string;
  avatar: string;
  pin: string;
  cabineId?: string;
  cabineNome?: string;
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
  acabamentoSugerido?: string;
  title?: string;
  qty?: string;
  substrate?: string;
  estVolume?: string;
}

export interface AmbienteOS {
  id: number;
  nome: string;
  lotesPecas: PecaLote[];
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
  ambientesObra?: AmbienteOS[];
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
  criteriosDevolucao?: CriterioChecklistProduto[];
  configuracaoTecnicaHomologada?: boolean;
  potLifeMinutos?: number;
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
  potLifeMinutos?: number; // Tempo técnico homologado para a mistura catalisada
  procedimentoOficialPotLifeExpirado?: string; // Estrutura preparada para futuro procedimento validado pela empresa
  itens: ReceitaItem[];
}

export type StatusPreparacao =
  | 'PREPARACAO_EM_ANDAMENTO'
  | 'APLICACAO_CONCLUIDA'
  | 'POT_LIFE_EXPIRADO'
  | 'DEVOLUCAO_PENDENTE'
  | 'DEVOLUCAO_EM_ANDAMENTO'
  | 'DEVOLUCAO_CONCLUIDA'
  | 'PREPARACAO_ENCERRADA'
  | 'OCORRENCIA_REGISTRADA';

export type StatusAplicacao =
  | 'PREPARACAO_EM_ANDAMENTO'
  | 'POT_LIFE_EXPIRADO'
  | 'OCORRENCIA_REGISTRADA'
  | 'APLICACAO_CONCLUIDA';

export type StatusPotLife =
  | 'NORMAL'
  | 'PROXIMO_LIMITE'
  | 'POT_LIFE_EXPIRADO';

export type StatusDevolucaoPreparacao =
  | 'DEVOLUCAO_PENDENTE'
  | 'DEVOLUCAO_EM_ANDAMENTO'
  | 'AGUARDANDO_CONFERENCIA'
  | 'DEVOLUCAO_CONCLUIDA';

export type StatusItemDevolucao =
  | 'PENDENTE'
  | 'DEVOLVIDO_AO_ESTOQUE'
  | 'EMBALAGEM_ESGOTADA'
  | 'DESCARTADO_COMO_REFUGO'
  | 'PENDENTE_DE_CONFERENCIA';

export type LocalMistura = 'bequer' | 'pistola' | 'outro_recipiente';

export interface ResiduoMisturaOcorrencia {
  id: string;
  preparacaoId: string;
  ordemServicoId: number;
  ordemServicoNumero: string;
  receitaId: number;
  receitaNome: string;
  operadorId: number;
  operadorNome: string;
  cabineId: string;
  quantidadeRestanteMl?: number;
  localMistura: LocalMistura;
  registradaEm: string;
  situacaoPotLife: StatusPotLife;
  ocorrenciaRelacionada: string;
  procedimentoAdotado?: string;
}

export interface CriterioChecklistProduto {
  id: string;
  label: string;
  shortLabel: string;
  obrigatorio: boolean;
  motivoReprovacao: string;
}

export interface ItemDevolucaoComponente {
  id: string;
  preparacaoId: string;
  receitaItemId: number;
  produtoId: number;
  produtoNome: string;
  codigoProduto: string;
  papel: 'base' | 'catalisador' | 'diluidor' | 'retardador';
  loteId: number;
  loteCodigo: string;
  embalagemId?: string;
  prateleiraOrigem: string;
  quantidadeRetiradaMl: number;
  saldoInicialLataMl: number;
  saldoRestanteInformadoMl: number;
  destino?: StatusItemDevolucao;
  status: StatusItemDevolucao;
  checklistAprovado: Record<string, boolean>;
  motivoReprovacao?: string;
  avaliadoPorId?: number;
  avaliadoPorNome?: string;
  responsavelMovimentacaoId?: number;
  responsavelMovimentacaoNome?: string;
  registradoEm?: string;
  codigoEtiquetaGerada?: string;
  loteSobraGeradoCodigo?: string;
  etiquetaImpressa?: boolean;
}

export interface Preparacao {
  id: string;
  ordemServicoId: number;
  ordemServicoNumero: string;
  clienteNome: string;
  projetoNome: string;
  ambienteNome: string;
  receitaId: number;
  receitaNome: string;
  operadorId: number;
  operadorNome: string;
  cabineId?: string;
  cabineNome?: string;
  volumeTotal: number;
  criadaEm: string;
  dosagemConcluidaEm?: string;
  potLifeMinutos?: number;
  potLifeExpiradoEm?: string;
  aplicacaoIniciadaEm?: string;
  aplicacaoConcluidaEm?: string;
  encerradaEm?: string;
  status: StatusPreparacao;
  statusAplicacao?: StatusAplicacao;
  statusPotLife?: StatusPotLife;
  statusDevolucao?: StatusDevolucaoPreparacao;
  itensDevolucao: ItemDevolucaoComponente[];
  ocorrenciasMistura?: ResiduoMisturaOcorrencia[];
}

export type TipoMovimentacao = 'RETIRADA' | 'DEVOLUCAO' | 'DESCARTE';

export interface Movimentacao {
  id?: number;
  identificadorUnico?: string;
  preparacaoId?: string;
  componenteItemId?: string;
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

export type ScreenId = 'auth' | 'dashboard' | 'os' | 'recipe' | 'dosing' | 'return' | 'inventory' | 'manager';

export interface ItemSolicitacaoCompra {
  id: string;
  produtoId: number;
  produtoNome: string;
  codigoProduto: string;
  quantidadeSugerida: string;
  motivo: 'estoque_critico' | 'validade_vencida' | 'demanda_os';
  urgencia: 'alta' | 'media';
  solicitadoEm: string;
  solicitadoPor: string;
}

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
