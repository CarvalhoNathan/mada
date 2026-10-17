import { describe, it, expect } from 'vitest';
import { verificarToleranciaExcesso } from '../tolerance';

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
});
