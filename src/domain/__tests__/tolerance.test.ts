import { describe, it, expect } from 'vitest';
import {
  verificarToleranciaExcesso,
  excedeTolerancia,
  calcularCustoExcesso,
} from '../tolerance';

describe('Domain: tolerance (Verificação de Tolerância e Excesso)', () => {
  it('não deve acusar excesso quando o volume estiver abaixo da tolerância (ex: +3% com limite de 5%)', () => {
    // 250 ml esperado, 257 ml real (+2.8%)
    const resultado = verificarToleranciaExcesso(250, 257, 0.05);

    expect(resultado.excedeu).toBe(false);
    expect(resultado.diferencaMl).toBe(7);
    expect(resultado.limiteMaximoPermitido).toBe(263); // 250 * 1.05 = 262.5 -> 263
  });

  it('não deve acusar excesso quando o volume estiver exatamente no limite da tolerância de 5%', () => {
    // 100 ml esperado, 105 ml real (+5%)
    const resultado = verificarToleranciaExcesso(100, 105, 0.05);

    expect(resultado.excedeu).toBe(false);
    expect(resultado.diferencaMl).toBe(5);
    expect(resultado.percentualExcesso).toBe(5);
  });

  it('deve acusar excesso quando o volume ultrapassar o limite (ex: +200 ml em 250 ml)', () => {
    // 250 ml esperado, 450 ml real (+200 ml / +80%)
    const resultado = verificarToleranciaExcesso(250, 450, 0.05);

    expect(resultado.excedeu).toBe(true);
    expect(resultado.diferencaMl).toBe(200);
    expect(resultado.percentualExcesso).toBe(80);
    expect(resultado.limiteMaximoPermitido).toBe(263);
  });

  it('deve lidar com volume esperado zero', () => {
    const resZero = verificarToleranciaExcesso(0, 50);
    expect(resZero.excedeu).toBe(true);
    expect(resZero.diferencaMl).toBe(50);

    const resAmbosZero = verificarToleranciaExcesso(0, 0);
    expect(resAmbosZero.excedeu).toBe(false);
    expect(resAmbosZero.diferencaMl).toBe(0);
  });

  it('excedeTolerancia: retorna false quando dentro da meta ou tolerância de 5%', () => {
    expect(excedeTolerancia(250, 250, 0.05)).toBe(false);
    expect(excedeTolerancia(260, 250, 0.05)).toBe(false); // 250 * 1.05 = 262.5
    expect(excedeTolerancia(262, 250, 0.05)).toBe(false);
  });

  it('excedeTolerancia: retorna true quando ultrapassa os 5% homologados', () => {
    expect(excedeTolerancia(263, 250, 0.05)).toBe(true); // 263 > 262.5
    expect(excedeTolerancia(450, 250, 0.05)).toBe(true);
  });

  it('calcularCustoExcesso: calcula corretamente o custo do desperdício em reais', () => {
    // 200 ml de produto a R$ 120,00/litro = R$ 24,00
    expect(calcularCustoExcesso(200, 120)).toBe(24.00);

    // 150 ml de produto a R$ 85,00/litro = R$ 12,75
    expect(calcularCustoExcesso(150, 85)).toBe(12.75);

    // Sem excesso ou preço zero
    expect(calcularCustoExcesso(0, 120)).toBe(0);
    expect(calcularCustoExcesso(200, 0)).toBe(0);
  });

  it('deve blindar verificação de tolerância e custos contra NaN, valores negativos e tipos inválidos', () => {
    // NaN ou infinito em volumes
    const resNan = verificarToleranciaExcesso(NaN, 250);
    expect(resNan.excedeu).toBe(true);
    expect(resNan.diferencaMl).toBe(250);

    const resRealNan = verificarToleranciaExcesso(250, NaN);
    expect(resRealNan.excedeu).toBe(false);
    expect(resRealNan.diferencaMl).toBe(0);

    // Valores negativos
    const resNeg = verificarToleranciaExcesso(-100, -50);
    expect(resNeg.excedeu).toBe(false);

    // excedeTolerancia com valores inválidos
    expect(excedeTolerancia(NaN, 100)).toBe(false);
    expect(excedeTolerancia(100, NaN)).toBe(true);
    expect(excedeTolerancia(-50, 100)).toBe(false);

    // calcularCustoExcesso com NaN ou negativo
    expect(calcularCustoExcesso(NaN, 120)).toBe(0);
    expect(calcularCustoExcesso(200, NaN)).toBe(0);
    expect(calcularCustoExcesso(-50, 120)).toBe(0);
    expect(calcularCustoExcesso(200, -80)).toBe(0);
  });
});
