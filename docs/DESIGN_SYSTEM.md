# 🎨 Design System — Gerenciador de Químicos (Mada Marcenaria)

> **Contexto de Operação:** Tablet industrial em modo paisagem (`1280x800`).  
> **Usuário:** Operadores em pé, com luvas de proteção e mãos sujas, sob iluminação industrial da cabine de pintura PU.  
> **Stack:** React + TypeScript + CSS Variables (`tokens.css`).

---

## 1. Regras Estritas de Cores (Semântica Única)

Cada cor possui **um único significado**, empregado de forma invariável em toda a aplicação:

| Token          | Hex / Valor | Significado Único              | Regra de Uso                                                                          |
| :------------- | :---------- | :----------------------------- | :------------------------------------------------------------------------------------ |
| `--bg`         | `#0F1419`   | Fundo da aplicação             | Fundo escuro absoluto de alto contraste.                                              |
| `--card`       | `#1B232C`   | Superfície de cartões          | Painéis, listas e áreas de conteúdo.                                                  |
| `--border`     | `#2C3947`   | Delimitação de cartões         | Bordas estruturais com espessura 1.5px a 2px.                                         |
| `--text`       | `#F5F7FA`   | Texto principal                | Leitura nítida sob reflexo de luz fabril.                                             |
| `--text-muted` | `#AAB4BF`   | Texto secundário               | **Mínimo absoluto**: nunca usar cinza mais escuro que este sobre o fundo.             |
| `--primary`    | `#3B82F6`   | **Ação Principal / Navegação** | Botões de avançar, seleção ativa e foco tátil.                                        |
| `--ok`         | `#22C55E`   | **Sucesso / Homologado**       | Etapa concluída, tolerância respeitada, integridade validada.                         |
| `--warn`       | `#F59E0B`   | **Atenção / Tolerância**       | Validade próxima (FEFO), produto aberto. **NUNCA usar como botão de ação principal**. |
| `--danger`     | `#EF4444`   | **Erro Crítico / Perigo**      | Sobredose, desconexão de rede, refugo. **NUNCA usar como botão de ação padrão**.      |

> 📌 **Variantes `-soft`:** Cada cor semântica possui sua variante translúcida (`rgba(~15%)`) utilizada exclusivamente em fundos de alertas, chips e banners informativos.

---

## 2. Tipografia & Escala (Inter / Atkinson Hyperlegible)

**Regra Inegociável:** Nenhum texto na aplicação pode ter tamanho inferior a **16px** (`--fs-small`). Evitar caixa alta longa; usar apenas em etiquetas e rótulos curtos.

- `--fs-number`: `56px` (peso 700) — Valores numéricos de pesagem e volume (ml / g).
- `--fs-h1`: `32px` (peso 700) — Títulos principais de tela.
- `--fs-h2`: `24px` (peso 700) — Subtítulos de módulo e cabeçalhos de cartão.
- `--fs-button`: `24px` (peso 600) — Texto de botões operacionais.
- `--fs-body`: `20px` (peso 400/600) — Textos explicativos e instruções de processo.
- `--fs-small`: `16px` (peso 500) — **Mínimo absoluto** para rótulos de rodapé e badges.

---

## 3. Ergonomia Tátil Chão de Fábrica

- **Alvo Mínimo de Toque:** `--touch-min: 64px` (botões secundários, inputs e chips).
- **Alvo Primário de Ação:** `--touch-primary: 96px` (botão principal de rodapé ou ações de impacto).
- **Espaçamento entre Alvos:** Mínimo de **16px** entre qualquer elemento clicável para evitar toques acidentais com luvas.
- **Raios:** `16px` (cartões e botões); `999px` (etiquetas e chips de status).
- **Feedback Tátil:** Todo clique/toque deve responder instantaneamente com `transform: scale(0.97)` e elevação de brilho.

---

## 4. Guia Rápido de Componentes (Quando Usar Cada Um)

| Componente                  | Quando Usar                                                    | Estados Obrigatórios                                                                                                                                     |
| :-------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Button`**                | Ações explícitas de fluxo. Tamanho `md` (64px) ou `lg` (96px). | Normal, Pressionado (`.97`), Desabilitado, Carregando. Variante `danger` exige `holdToConfirm` (1,5s com barra de progresso) para ações destrutivas.     |
| **`Card`**                  | Agrupamento de informações.                                    | Padrão, Selecionável (borda azul + check), Alerta Warn (borda âmbar), Alerta Danger (borda vermelha).                                                    |
| **`NumberStepper`**         | Ajuste tátil de dosagem e pesagem.                             | Botões `−` e `+` de 64px, valor central em 56px. Se ultrapassar o limite, entra em estado "acima da tolerância" com borda vermelha e banner explicativo. |
| **`NumericKeypad`**         | Digitação de PIN do operador ou valores exatos.                | Teclas de 90px com feedback tátil. Inclui teclas dedicadas de `Limpar` e `⌫ Apagar`.                                                                     |
| **`PinInput`**              | Identificação por crachá/código do pintor.                     | 4 bolinhas de 64px. Estado de erro aciona animação de `shake` + contorno vermelho.                                                                       |
| **`StatusBanner`**          | Faixa de largura total no topo da tela.                        | Usada para quedas de Wi-Fi ou falhas de sistema, desabilitando automaticamente os botões de salvar.                                                     |
| **`Badge` (Chip)**          | Rótulo semântico de dados.                                     | Texto >= 16px, formato pílula (`999px`), sempre combinando **Ícone + Texto** (acessibilidade).                                                           |
| **`StepIndicator`**         | Orientação no fluxo produtivo de 3 etapas.                     | Concluída (verde + check), Ativa (azul), Pendente (cinza).                                                                                               |
| **`Modal`**                 | Parada obrigatória ou intertravamento.                         | Variante `critical` com cabeçalho vermelho, valor excedente em 56px e no máximo uma frase de explicação.                                                 |
| **`ChoiceChips`**           | Escolha entre poucas opções (ex: justificativas).              | Opções grandes de toque único. **Regra: NUNCA vem opção pré-selecionada**.                                                                               |
| **`ChecklistRow`**          | Verificação de integridade química antes da baixa.             | Linhas grandes (>= 72px). O operador toca em qualquer lugar da linha. **Regra: NUNCA vem pré-marcada**.                                                  |
| **`AppShell`**              | Estrutura mestra do tablet (1280x800).                         | Cabeçalho fixo (logo + operador + conexão) + Conteúdo sem rolagem + Barra inferior fixa (Voltar à esquerda, Primário à direita).                         |
| **`KpiCard` & `DataTable`** | Painel gerencial e telemetria para desktop (PC).               | Versão compacta e densa para o supervisor Fábio acompanhar consumo, orçado vs. real e desvios.                                                           |

---

## 5. Regras Invioláveis de Acessibilidade & UX

1. **Contraste mínimo 4.5:1** em todo e qualquer elemento visual.
2. **Nunca use apenas cor** para informar um estado (use sempre Ícone + Texto).
3. **Sem gestos ocultos:** Proibido depender de `hover`, duplo clique ou arrastar (drag and drop).
4. **Sem rolagem vertical no tablet:** As telas operacionais principais devem caber estritamente na área útil de 1280x800.

## 6. ADENDO (correções)

1. Texto nos botões: branco sobre primary e danger; #0F1419 sobre ok e warn.
2. Primary alterado para #2563EB (contraste >= 4.5:1 com texto branco).
3. Feedback de toque: scale(0.97) + brightness(0.9).
4. holdToConfirm (1,5s) apenas em: confirmar desperdício, descartar sobra como
   refugo. "Cancelar preparação" usa modal de confirmação simples.
5. Painel de gerência (desktop): DataTable e KpiCard podem usar 14px; o tablet
   continua com mínimo de 16px.
6. Novos componentes: Toast (aparece no topo, some sozinho em 3s, nunca cobre
   botões) e SidebarNav (menu lateral: Visão geral, Receitas, Produtos e marcas,
   Estoque, Sobras, Relatórios).
7. AppShell: cabeçalho com foto + nome do operador logado, chip de Wi-Fi e
   chip de servidor.
8. Tokens: espaçamento 8/16/24/32/48; variantes -soft = cor a 15% de opacidade;
   anel de foco 3px em primary; sombra mínima.
