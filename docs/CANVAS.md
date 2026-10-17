# 📊 Project Model Canvas (PMC) — Mada Marcenaria

Este documento consolida o **Project Model Canvas** concebido na fase de iniciação e refinado após a **primeira banca de validação acadêmica** e as reuniões técnicas com a **Mada Marcenaria**.

---

## 🧭 Matriz Visual do Canvas (Pós-Feedback da Banca)

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│     JUSTIFICATIVAS (Passado)    │        OBJETIVO SMART           │        BENEFÍCIOS (Futuro)      │
│ • Falta de controle de sobras   │ Desenvolver e implantar até     │ • Redução de 20% no desperdício │
│ • Fórmulas guardadas "de cabeça"│ nov/2026 um protótipo web       │ • Rastreabilidade ponta a ponta │
│ • Dificuldade de rastreamento   │ tablet-first, capaz de registrar│ • Precificação mais assertiva   │
│ • Consumo Previsto x Real cego  │ e controlar retirada, consumo e │ • Alta adesão do chão de fábrica│
│ • Dependência de papel/manual   │ sobras, reduzindo em 20% o      │ • Estoque confiável sem perdas  │
│                                 │ desperdício de químicos.        │   por vencimento ou abandono    │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│             PRODUTO             │           REQUISITOS            │      STAKEHOLDERS EXTERNOS      │
│ Protótipo web tablet-first para │ • Abordagem Tablet-First        │ • Gestores da Marcenaria (Fábio)│
│ gestão de receitas, cálculo     │ • Cálculo automático por marcas │ • Marceneiros, pintores e       │
│ dinâmico de misturas (Base,     │ • Estrutura relacional cliente/amb│ operadores do chão de fábrica │
│ Catálise, Diluidor, Retardador),│ • Módulos receitas/consumo/sobra│ • Almoxarifado / Estoque        │
│ baixa de consumo e devolução.   │ • Backup diário e exportação    │ *(Cliente final = apenas dado)* │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│            PREMISSAS            │             EQUIPE              │       GRUPO DE ENTREGAS         │
│ • Mada fornece fichas técnicas  │ 1. Gerente de Projeto           │ 1. Doc de Regras de Negócio     │
│ • Sem instalação em servidor    │ 2. Especialista em Banco Dados  │ 2. Modelagem Relacional de Dados│
│   local da empresa (Web Cloud)  │ 3. Especialista em Integração   │ 3. Arquitetura Web & Integração │
│ • Wi-Fi estável na pintura      │ 4. Desenvolvedor Back-end       │ 4. API TypeScript e Lógica      │
│                                 │ 5. Desenvolvedor Front-end / UX │ 5. Protótipo, MVP, Manual e     │
│                                 │                                 │    Treinamento dos Operadores   │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│             RISCOS              │         LINHA DO TEMPO          │             CUSTOS              │
│ • Sujeira/luvas no tablet       │ • 31/08: Escopo e Requisitos    │ • Mão de Obra Acadêmica: R$ 0,00│
│ • Instabilidade de Wi-Fi        │ • 27/10: MVP Funcional          │ • Hospedagem Cloud Piloto: R$ 0 │
│ • Resistência operacional       │ • 06/11: Testes e Validação     │ • Despesas Deslocamento: R$ 150 │
│ • Troca de marca de química     │ • 13/11: Protótipo e Modelagem  │   TOTAL: R$ 150,00              │
│ • Perda de dados (mitigada por  │ • 17/11: Entrega Final + Treino │                                 │
│   backup diário obrigatório)    │                                 │                                 │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```

---

## 1. Por Quê? (Justificativas & Passado)
- **Conhecimento Tácito Centralizado:** As receitas e proporções são guardadas "de cabeça" pelos pintores, gerando dependência individual e erros críticos em caso de ausência ou mudança de produto.
- **Ausência de Controle de Sobras:** Falta de registro formal de devolução de produtos parcialmente consumidos (latas de 1L ou galões abertos).
- **Dificuldade de Rastreabilidade:** Impossibilidade de mapear em qual cliente, projeto, ambiente ou peça cada litro de produto químico (verniz, base PU, catalisador) foi gasto.
- **Ausência de Comparativo:** Incapacidade de confrontar o consumo teórico previsto com o consumo realizado na prática.
- **Registros Manuais:** Vulnerabilidade a erros de anotação em papel e perdas de insumos por vencimento na prateleira.

---

## 2. O Quê? (Objetivo SMART & Produto)

### 🎯 Objetivo SMART
> **"Desenvolver e implantar, até novembro de 2026, um protótipo de sistema web otimizado para tablets, integrado ao sistema existente da empresa, capaz de registrar e controlar a retirada, o consumo e a devolução de materiais utilizados na produção, permitindo comparar o consumo realizado com os parâmetros definidos e contribuindo para uma redução de 20% no desperdício de materiais."**

### 📦 Produto
Protótipo de aplicação web **"tablet-first"**, concebido especificamente para a cabine de pintura da marcenaria:
- Centralização de receitas por tipo de acabamento e fabricante (ex: Sayerlack / Sayersystem);
- Calculadora dinâmica das 4 frações: **Base + Catálise (PU) + Diluidor + Retardador**;
- Apontamento rápido de retirada e consumo por volume;
- Controle de retorno de embalagens parciais (sobras) com leitura e emissão de QR Code;
- Rastreabilidade estruturada no padrão: `Cliente > Projeto > Ambiente > Etapa de Produção`.

---

## 3. Para Quem? (Stakeholders & Benefícios)

### 👥 Stakeholders Diretos (Ajustado após Banca)
- **Gestores da Mada Marcenaria (Fábio / Diretoria):** Validação de regras de negócio, redução de custos e controle de perdas.
- **Operadores de Chão de Fábrica (Pintores e Marceneiros):** Usuários primários no tablet; precisam de interface simples e sem burocracia.
- **Almoxarifado & Compras:** Recebimento de sobras, gestão de prioridade por validade (FEFO) e compras assertivas.
- **Equipe de Desenvolvimento:** 5 acadêmicos responsáveis pela entrega técnica.
- **Instituição de Ensino / Professores:** Avaliação, orientação de engenharia de software e monitoria.

> ⚠️ **Nota metodológica:** O *Cliente Final da marcenaria* foi removido dos stakeholders por recomendação da professora, uma vez que não interage com o sistema nem influencia seu desenho de interface. Ele atua estritamente como **metadado de rastreio** nas ordens de serviço.

### 🚀 Benefícios Esperados
1. **Fim da Dependência de "Memória":** Receitas catalogadas e acessíveis a qualquer operador.
2. **Redução Comprovada de Desperdício (Meta: 20%):** Mitigação de químicos vencidos ou abandonados na fábrica.
3. **Rastreabilidade Fina:** Saber exatamente quem pesou, quando, qual produto e para qual encomenda.
4. **Precificação e Orçamentação Realista:** Histórico consolidado do custo químico por tipo de acabamento.
5. **Confiabilidade de Inventário:** Baixa automática e estoque sempre fidedigno.

---

## 4. Como? (Requisitos, Equipe & Entregas)

### 🛠️ Requisitos Chave
- **Abordagem Tablet-First:** Botões amplos para uso com luvas de proteção, poucos cliques, orientação retrato/paisagem e alto contraste.
- **Arquitetura de Dados Relacional:** Conexão direta entre materiais consumidos, marcas, clientes e ambientes.
- **Módulos Operacionais:** Consulta de Receitas, Calculadora de Mistura, Apontamento de Consumo e Devolução de Sobras.
- **Sistema Anti-Erro (UX Defensiva):** Bloqueios visuais e alertas caso a pesagem declarada ultrapasse os parâmetros técnicos da receita.
- **Rotinas de Resiliência (Amarrado ao Risco):** Rotina diária de backup e exportação automatizada de dados operacionais.

### 👥 Papéis da Equipe
| Função | Atribuição Principal |
| :--- | :--- |
| **1. Gerente de Projeto (PM)** | Coordenação do cronograma, comunicação com a Mada e entregáveis acadêmicos. |
| **2. Especialista em Banco de Dados** | Modelagem relacional (DER), normalização e persistência de dados. |
| **3. Especialista em Integração** | Arquitetura web, testes de rede e integração de dados. |
| **4. Desenvolvedor Back-end** | Criação das APIs e lógica de negócio em TypeScript (cálculo de proporções e regras de sobras). |
| **5. Desenvolvedor Front-end & UX** | Prototipagem Figma, design system tablet-first e implementação web responsiva. |

### 📦 Grupo de Entregas (Revisado)
1. **Entrega 1:** Documentação das regras de negócio e validação inicial com a empresa.
2. **Entrega 2:** Modelagem estrutural do banco de dados relacional.
3. **Entrega 3:** Arquitetura web independente e testes de conectividade em tablet.
4. **Entrega 4:** API estruturada em TypeScript e processamento da lógica de receitas e sobras.
5. **Entrega 5:** Telas web responsivas homologadas, entrega do manual de uso e **Treinamento/Capacitação presencial dos operadores no uso dos tablets**.

---

## 5. Quanto & Quando? (Premissas, Riscos, Cronograma & Custos)

### 📌 Premissas
- A Mada Marcenaria disponibiliza as proporções exatas das receitas de tintas, resinas e vernizes;
- **Aplicação Web Independente:** Sem necessidade de instalação ou intervenção no servidor local físico da empresa (alinhado com a preferência do proprietário Fábio);
- Cobertura de sinal Wi-Fi estável na cabine de pintura e área de preparação.

### 🛡️ Matriz de Riscos & Amarração de Requisitos
- **Infraestrutura:** Quedas de energia ou oscilações de Wi-Fi no galpão *(Mitigação: aplicação leve com cache de dados locais)*.
- **Perda de Dados:** Falhas de armazenamento *(Mitigação: requisito explícito de backup diário e exportação em nuvem)*.
- **Ergonomia Operacional:** Manuseio com luvas, sujeira de solvente ou tintas *(Mitigação: áreas de toque gigantescas, alto contraste e sem gestos complexos)*.
- **Resistência / Baixa Adesão:** Dificuldade de adoção pelos pintores *(Mitigação: treinamento presencial na Entrega 5 e interface "anti-erro" intuitiva)*.
- **Troca de Marca de Insumos:** Incompatibilidade de proporções *(Mitigação: cadastro multimarca onde cada receita é indexada pelo fabricante)*.

### ⏱️ Linha do Tempo
- **31/08:** Levantamento de Requisitos e Definição de Escopo
- **27/10:** Entrega do MVP Funcional e Integração Inicial
- **06/11:** Testes, Validações e Correções Operacionais
- **13/11:** Entrega do Protótipo Visual e Modelagem Final
- **17/11:** Entrega Final, Manual de Uso e Treinamento de Operadores

### 💰 Orçamento do Projeto Piloto
- **Mão de Obra de Desenvolvimento:** R$ 0,00 *(Projeto Acadêmico em Parceria)*
- **Hospedagem Web / Banco Piloto:** R$ 0,00 *(Tier gratuito de nuvem/Vercel/Supabase no piloto)*
- **Despesas Operacionais (Deslocamento para testes e treinamento na fábrica):** R$ 150,00
- **Investimento Total do Piloto:** **R$ 150,00**

---

> 📄 Para consultar as atas completas das reuniões e o parecer detalhado da professora, veja [DECISOES_E_REUNIOES.md](./DECISOES_E_REUNIOES.md).
