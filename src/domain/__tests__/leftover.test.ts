import { describe, it, expect } from 'vitest';
import { calcularSaldoDevolucao } from '../leftover';

describe('Domain: leftover (Cálculo de Devolução de Sobras)', () => {
  it('deve calcular porcentagem e peso estimado com densidade padrão (0.95)', () => {
    // 400 ml de sobra em lata de 1000 ml
    const saldo = calcularSaldoDevolucao(400, 1000, 0.95);

    expect(saldo.volumeMl).toBe(400);
    expect(saldo.porcentagemPreenchimento).toBe(40);
    expect(saldo.pesoEstimadoGramas).toBe(380); // 400 * 0.95
  });

  it('deve clampear valores que ultrapassem o volume máximo da lata', () => {
    const saldoExcesso = calcularSaldoDevolucao(1200, 1000);

    expect(saldoExcesso.volumeMl).toBe(1000);
    expect(saldoExcesso.porcentagemPreenchimento).toBe(100);
  });

  it('deve retornar zero para volumes negativos ou nulos', () => {
    const saldoZero = calcularSaldoDevolucao(0, 1000);
    expect(saldoZero.volumeMl).toBe(0);
    expect(saldoZero.porcentagemPreenchimento).toBe(0);
    expect(saldoZero.pesoEstimadoGramas).toBe(0);

    const saldoNeg = calcularSaldoDevolucao(-50, 1000);
    expect(saldoNeg.volumeMl).toBe(0);
  });

  it('deve blindar cálculo de sobra contra NaN e parâmetros corrompidos', () => {
    const saldoNan = calcularSaldoDevolucao(NaN, 1000);
    expect(saldoNan.volumeMl).toBe(0);
    expect(saldoNan.porcentagemPreenchimento).toBe(0);
    expect(saldoNan.pesoEstimadoGramas).toBe(0);

    const saldoMaxNan = calcularSaldoDevolucao(500, NaN);
    expect(saldoMaxNan.volumeMl).toBe(500); // fallback para lata padrão de 1000 ml
    expect(saldoMaxNan.porcentagemPreenchimento).toBe(50);

    const saldoDensidadeNeg = calcularSaldoDevolucao(200, 1000, -0.9);
    expect(saldoDensidadeNeg.pesoEstimadoGramas).toBe(190); // fallback para densidade padrão 0.95
  });
});
