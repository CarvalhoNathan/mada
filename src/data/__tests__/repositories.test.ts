import { describe, it, expect, beforeEach } from 'vitest';
import {
  MockLoteRepository,
  MockMovimentacaoRepository,
  MockOperadorRepository,
} from '../mock/mockRepositories';

describe('MockLoteRepository & Ciclo de Sobras', () => {
  let loteRepo: MockLoteRepository;

  beforeEach(() => {
    // Limpa localStorage simulado
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    loteRepo = new MockLoteRepository();
  });

  it('deve listar os lotes iniciais padrão', async () => {
    const lotes = await loteRepo.listar();
    expect(lotes.length).toBeGreaterThan(0);
  });

  it('deve adicionar uma sobra devolvida e incluí-la no topo dos prioritários FEFO', async () => {
    const sobraCriada = await loteRepo.adicionarSobra({
      produtoId: 1,
      produtoNome: 'Verniz PU Sayersystem (Sobra)',
      codigo: 'SOBRA-TESTE-01',
      validade: '2026-11-20',
      diasAberto: 1,
      quantidadeAtual: 350,
      statusUrgencia: 'alta',
      prateleira: 'A-01 (Prateleira de Sobras)',
    });

    expect(sobraCriada.id).toBeDefined();
    expect(sobraCriada.codigo).toBe('SOBRA-TESTE-01');
    expect(sobraCriada.quantidadeAtual).toBe(350);

    const prioritarios = await loteRepo.listarPrioritariosFEFO();
    const achouSobra = prioritarios.find((l) => l.codigo === 'SOBRA-TESTE-01');
    expect(achouSobra).toBeDefined();
  });

  it('deve atualizar o saldo de um lote após consumo', async () => {
    const lotes = await loteRepo.listar();
    const primeiro = lotes[0];
    const saldoOriginal = primeiro.quantidadeAtual;

    await loteRepo.atualizarQuantidade(primeiro.id, saldoOriginal - 200);
    const atualizado = await loteRepo.buscarPorCodigo(primeiro.codigo);

    expect(atualizado?.quantidadeAtual).toBe(saldoOriginal - 200);
  });
});

describe('MockMovimentacaoRepository', () => {
  let movRepo: MockMovimentacaoRepository;

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    movRepo = new MockMovimentacaoRepository();
  });

  it('deve registrar movimentações de RETIRADA, DEVOLUCAO e DESCARTE', async () => {
    const mov1 = await movRepo.registrar({
      tipo: 'RETIRADA',
      loteId: 1,
      quantidade: 500,
      ordemServicoId: 1,
      operadorId: 1,
      registradaEm: new Date().toISOString(),
    });

    const mov2 = await movRepo.registrar({
      tipo: 'DEVOLUCAO',
      loteId: 1,
      quantidade: 150,
      justificativa: 'Sobra de lata',
      registradaEm: new Date().toISOString(),
    });

    const mov3 = await movRepo.registrar({
      tipo: 'DESCARTE',
      loteId: 1,
      quantidade: 50,
      justificativa: 'Contaminação',
      registradaEm: new Date().toISOString(),
    });

    const todas = await movRepo.listar();
    expect(todas).toHaveLength(3);
    expect(mov1.id).toBe(1);
    expect(mov2.tipo).toBe('DEVOLUCAO');
    expect(mov3.tipo).toBe('DESCARTE');
  });
});

describe('MockOperadorRepository (Segurança e Autenticação de PIN)', () => {
  let operadorRepo: MockOperadorRepository;

  beforeEach(() => {
    operadorRepo = new MockOperadorRepository();
  });

  it('deve autenticar pintor com PIN correto e rejeitar PIN incorreto', async () => {
    // Carlos Silva (id 1, PIN "1234")
    const authOk = await operadorRepo.autenticar(1, '1234');
    expect(authOk).toBe(true);

    const authFail = await operadorRepo.autenticar(1, '0000');
    expect(authFail).toBe(false);
  });

  it('deve blindar autenticação contra valores nulos, não numéricos ou tentativas de injeção', async () => {
    expect(await operadorRepo.autenticar(NaN, '1234')).toBe(false);
    expect(await operadorRepo.autenticar(1, null as unknown as string)).toBe(false);
    expect(await operadorRepo.autenticar(1, undefined as unknown as string)).toBe(false);
    expect(await operadorRepo.autenticar(1, "' OR '1'='1")).toBe(false);
  });

  it('deve validar PIN mestre do supervisor e rejeitar PINs inválidos', async () => {
    // Fábio: PIN mestre "9999" ou alternativo "8888"
    expect(await operadorRepo.validarSupervisorPin('9999')).toBe(true);
    expect(await operadorRepo.validarSupervisorPin(' 9999 ')).toBe(true); // com espaços aparados
    expect(await operadorRepo.validarSupervisorPin('8888')).toBe(true);
    expect(await operadorRepo.validarSupervisorPin('1234')).toBe(false);
    expect(await operadorRepo.validarSupervisorPin(null as unknown as string)).toBe(false);
  });

  it('deve cadastrar novo operador, permitir autenticação com seu PIN e restaurar no reset', async () => {
    const iniciais = await operadorRepo.listar();
    const criado = await operadorRepo.adicionar({
      nome: 'João Mendes',
      papel: 'Aplicador PU • Cabine 02',
      cabineId: 'CABINE-02',
      cabineNome: 'Cabine 02',
      avatar: '',
      pin: '4321',
    });

    expect(criado.id).toBeGreaterThan(iniciais.length);
    expect(criado.nome).toBe('João Mendes');
    expect(await operadorRepo.autenticar(criado.id, '4321')).toBe(true);
    expect(await operadorRepo.autenticar(criado.id, '1234')).toBe(false);

    const aposCadastro = await operadorRepo.listar();
    expect(aposCadastro.length).toBe(iniciais.length + 1);

    await operadorRepo.resetar();
    const aposReset = await operadorRepo.listar();
    expect(aposReset.length).toBe(iniciais.length);
  });

  it('deve rejeitar cadastro de operador sem nome ou com PIN inválido', async () => {
    await expect(
      operadorRepo.adicionar({
        nome: '   ',
        papel: 'Aplicador PU',
        avatar: '',
        pin: '4321',
      })
    ).rejects.toThrow();

    await expect(
      operadorRepo.adicionar({
        nome: 'João Mendes',
        papel: 'Aplicador PU',
        avatar: '',
        pin: '12',
      })
    ).rejects.toThrow();
  });
});
