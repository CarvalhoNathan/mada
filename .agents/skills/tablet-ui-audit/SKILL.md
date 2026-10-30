---
name: tablet-ui-audit
description: Diretrizes, checklists e padrões de design system para auditar e criar telas e componentes tablet-first (1280x800) para marcenaria/chão de fábrica.
---

# Tablet-First UI & Industrial UX Guidelines (Mada Marcenaria)

Esta skill define os requisitos obrigatórios de interface do projeto **Mada - Gerenciador de Químicos**.
Ela deve ser consultada ao criar, auditar ou refatorar qualquer tela (`src/screens/`) ou componente de interface (`src/components/ui/`).

---

## 🎯 Contexto Operacional: Chão de Fábrica

O sistema roda em tablets industriais instalados ao lado das cabines de pintura e balanças de precisão.
* **Operadores**: Usam luvas grossas de proteção química e frequentemente estão com as mãos sujas.
* **Distância e Postura**: O tablet fica em um suporte ou bancada; o operador muitas vezes lê e interage em pé.
* **Resolução Alvo**: **1280x800 landscape** (formato tablet padrão). Não projete layouts pensando em mobile vertical ou desktop full-HD.

---

## 📏 1. Regras de Ouro de Acessibilidade Física

1. **Alvos de Toque (Touch Targets)**:
   - **Mínimo absoluto para botões secundários**: `64px` de altura/largura (`var(--touch-min)`).
   - **Ações primárias / confirmações de dosagem**: `96px` de altura (`var(--touch-primary)`).
   - **Espaçamento entre botões interativos**: Mínimo de `16px` (`var(--touch-gap)`) para evitar cliques acidentais.

2. **Entrada de Dados (Zero Teclado Virtual do SO)**:
   - **NÃO utilize** `<input type="text">` padrão que abra o teclado virtual do sistema operacional (ele cobre meia tela e é horrível com luvas).
   - Para números e volumes, use [`NumericKeypad`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/NumericKeypad.tsx) ou [`NumberStepper`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/NumberStepper.tsx).
   - Para seleção de opções, use [`ChoiceChips`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/ChoiceChips.tsx).
   - Para autenticação, use [`PinInput`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/PinInput.tsx).

3. **Tipografia e Legibilidade**:
   - **Tamanho mínimo absoluto**: `16px` (`var(--fs-small)`). Nenhum texto ou legenda na aplicação pode ser menor que 16px.
   - **Números de balança e dosagem**: Use `56px` (`var(--fs-number)`), peso 700, mono-espaçado quando possível.
   - **Títulos e Ações**: H1 em `32px`, Botões em `24px` (`var(--fs-button)`).

4. **Sem Rolagem nos Fluxos Críticos**:
   - A tela de pesagem e dosagem (`ScreenDosing`), confirmação de sobra (`ScreenReturn`) e modais de erro **não podem ter scroll vertical**. Toda a informação e botão de ação principal devem estar visíveis simultaneamente dentro de 800px de altura.

---

## 🎨 2. Tokens de Design (`src/styles/tokens.css`)

Nunca use cores hexadecimais ou medidas em pixels arbitrárias inline. Use sempre as variáveis CSS:

| Categoria | Variável CSS | Finalidade |
| :--- | :--- | :--- |
| **Fundo** | `var(--bg)` (`#0D0E11`) | Fundo geral da aplicação (Dark Matte) |
| **Superfície** | `var(--card)` (`#16171B`) | Cards e painéis |
| **Bordas** | `var(--border)` | Delimitação sutil com alto contraste |
| **Ação Principal** | `var(--primary)` (`#2B7FFF`) | Botão de fluxo principal |
| **Sucesso / Na Faixa** | `var(--ok)` (`#22C55E`) | Peso dentro da tolerância |
| **Atenção** | `var(--warn)` (`#F59E0B`) | Perto do limite / Alerta FEFO |
| **Perigo / Bloqueio** | `var(--danger)` (`#EF4444`) | Excesso crítico de catalisador |
| **Tipografia** | `var(--fs-number)`, `var(--fs-h1)`, `var(--fs-button)`, `var(--fs-body)` | Tamanhos fixos do sistema |

---

## 🧩 3. Componentes UI Existentes

Antes de criar um elemento novo, reaproveite os blocos do design system em `src/components/ui/`:
* [`AppShell`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/AppShell.tsx): Casca padrão com header industrial e status de conexão.
* [`Button`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/Button.tsx): Suporta variantes `primary`, `secondary`, `danger`, `success` já configuradas para touch.
* [`Card`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/Card.tsx): Container padrão com cantos arredondados (`var(--radius-card)`).
* [`Badge`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/Badge.tsx): Indicadores de status de produto e lote.
* [`StatusBanner`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/StatusBanner.tsx) e [`PotLifeTimerBanner`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/PotLifeTimerBanner.tsx): Alertas de tempo de vida da mistura.
* [`Modal`](file:///c:/Users/Usuario/Desktop/mada/src/components/ui/Modal.tsx): Janelas de confirmação com foco bloqueante.

---

## ✅ 4. Checklist de Auditoria Rápida

Ao revisar uma tela ou componente, valide item por item:
- [ ] O componente funciona bem na resolução 1280x800 sem quebras de layout?
- [ ] Todos os botões clicáveis têm altura mínima de 64px (ou 96px se ação principal)?
- [ ] Há pelo menos 16px de distância entre botões interativos adjacentes?
- [ ] Nenhum texto possui tamanho inferior a 16px?
- [ ] O contraste visual respeita o tema Dark Matte industrial?
- [ ] Se houver entrada de valores numéricos, foi usado o `NumericKeypad` ou botões de incremento?
- [ ] As mensagens de erro e alertas de tolerância estão com cores semânticas (`--danger`, `--warn`) bem visíveis de longe?

