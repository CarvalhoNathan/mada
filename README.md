<div align="center">

# 🪵 Gerenciador de Químicos

**Receitas exatas, estoque sob controle e desperdício zero no setor de pintura.**

Sistema web _tablet-first_ para marcenarias de alto padrão: calcula misturas químicas dinâmicas, trava erros de dosagem, rastreia o consumo por cliente e ambiente, controla tempo de vida útil (*pot life*) e dá nova vida às sobras.

[![Status](https://img.shields.io/badge/status-MVP%20em%20desenvolvimento-F59E0B)](#-status-e-roadmap)
[![Demo Online](https://img.shields.io/badge/demo-GitHub%20Pages-2ea44f?logo=github&logoColor=white)](https://carvalhonathan.github.io/mada/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React%2019-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite%208-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![UX](https://img.shields.io/badge/UX-tablet--first-3B82F6)](#-telas)
[![Tests](https://img.shields.io/badge/Vitest-25%20passed-success?logo=vitest&logoColor=white)](#-testes-e-qualidade)

🔗 **Acesse a Demonstração Online:** [https://carvalhonathan.github.io/mada/](https://carvalhonathan.github.io/mada/)

![Visão geral do sistema](docs/screens/hero.png)

</div>

---

## 💡 O problema

Em uma marcenaria de alto padrão, o setor de pintura e acabamento utiliza insumos de alto custo (bases PU, catalisadores alifáticos, diluidores, retardadores e vernizes bi-componentes). Historicamente, as receitas e proporções de mistura vivem na cabeça dos pintores.

> _"Composição e mistura, eles sabem de cabeça, e isso é um problema. Preferiria ter um tablet com as receitas, sabe? E eles darem baixa no que forem usando, e associar para qual cliente e ambiente, devolve a lata pro estoque com os valores..."_  
> — **Fabio, gestor da Mada Marcenaria**

As consequências práticas desse modelo tácito são:
- Proporções incorretas que comprometem a secagem e a cura da laca;
- Latas abertas retornando à prateleira sem medição de saldo;
- Produtos caros vencendo no almoxarifado por falta de prioridade;
- Impossibilidade de apurar o custo real de química por ambiente e cliente;
- Perda total de misturas catalisadas por expiração do tempo de trabalho (*pot life*).

---

## ✨ A solução

|     | Funcionalidade                     | O que resolve na prática                                                             |
| :-: | :--------------------------------- | :----------------------------------------------------------------------------------- |
| 📱  | **Interface Tablet-First**         | Teclas táteis de 90px, alto contraste e uso em pé com luvas e mãos sujas.           |
| 🧪  | **Receitas & Fórmulas Dinâmicas**  | Informe o volume final desejado e o sistema calcula Base, Catálise, Diluidor e Retardador. |
| 🛑  | **Trava Anti-Erro Crítico**        | Alerta vermelho impeditivo se a dosagem ultrapassar a tolerância (+5% / +200ml), com PIN de liberação. |
| ⏱️  | **Controle de Pot Life**           | Cronômetro regressivo de 20 min com alerta sonoro/visual e registro de descarte de refugo químico. |
| 📅  | **Prioridade por Validade (FEFO)** | Destaca latas abertas e lotes próximos do vencimento ("Use Primeiro").               |
| 🏷️  | **QR Code Universal**              | Leitura via câmera frontal (tablet em suporte de parede) com retículo laser animado e fallback canvas. |
| 📦  | **Gestão de Estoque & Compras**    | Entrada ágil de novos lotes e geração de Lista de Solicitação de Compras de insumos. |
| 📊  | **Painel Gerencial Executivo**     | Gráfico interativo de auditoria (*Scrub Chart*), KPIs de desperdício em R$ e exportação em CSV. |

---

## 🔄 Fluxo operacional

```mermaid
flowchart LR
    A["📋 Ordem de Serviço<br/>Cliente → Projeto → Ambiente"] --> B["🧪 Receita + Calculadora Dinâmica"]
    B --> C["⚖️ Dosagem em Béquer<br/>Trava anti-erro (+5%)"]
    C --> D["⏱️ Pot Life (20 min)<br/>Monitor de cura química"]
    D --> E["✅ Consumo rateado na OS"]
    C --> F["♻️ Devolução de Sobra<br/>Nova etiqueta QR com saldo"]
    D -.->|tempo esgotado| G["🗑️ Descarte Consciente<br/>Registro de refugo químico"]
```

---

## 🖼️ Telas e Módulos

| Login Rápido | Dashboard Operacional | Vinculação de OS |
| :---: | :---: | :---: |
| ![Login](docs/screens/01-login.png) | ![Dashboard](docs/screens/02-dashboard.png) | ![Vincular OS](docs/screens/03-os.png) |
| PIN de 4 dígitos (Apple HIG) e teclado tátil | Ações primárias e alerta FEFO | Cliente, projeto e ambiente em poucos toques |

| Receita & Proporções | Dosagem em Béquer | Trava de Tolerância | Devolução & Sobras |
| :---: | :---: | :---: | :---: |
| ![Receita](docs/screens/04-receita.png) | ![Dosagem](docs/screens/05-dosagem.png) | ![Alerta](docs/screens/06-alerta.png) | ![Devolução](docs/screens/07-devolucao.png) |
| Cálculo em frações proporcionais | Visualizador de béquer com nível líquido | Bloqueio por excesso com PIN supervisor | Etiqueta de sobra com QR Code e saldo |

---

## 🎯 Impacto esperado

- **−20% de desperdício** de químicos no setor de pintura (meta de projeto até novembro de 2026).
- **Eliminação de receitas "de cabeça":** padronização do catálogo Sayersystem / Sayerlack e homologados.
- **Rastreabilidade total de custo:** histórico financeiro rateado por cliente, projeto e ambiente.
- **Redução drástica de perdas por validade:** garantia de uso de latas abertas antes da violação de novos frascos.
- **Preservação de ferramentas e peças:** alerta rigoroso contra aplicação de produto com catalisação vencida.

---

## 🚀 Experimente na Prática (Test Drive em 2 Minutos)

Pronto para ver a solução em ação? Acesse a **[Demonstração Online no GitHub Pages](https://carvalhonathan.github.io/mada/)** e siga este roteiro guiado para testar os principais diferenciais do produto:

1. **Entrada na Cabine:** No login, selecione um operador (ex: *Carlos Silva*) e digite o PIN `1234`.
2. **Vinculação de OS:** Toque em `NOVA PREPARAÇÃO` e escolha uma Ordem de Serviço ou clique em `SIMULAR LEITURA QR` para carregar o cliente e ambiente automaticamente.
3. **Cálculo da Mistura:** Selecione o acabamento desejado (ex: *Laca PU Alto Brilho Sayerlack*). Altere o volume total para `1.000 ml` e observe o recálculo dinâmico e proporcional das 4 frações (Base, Catálise PU, Diluidor e Retardador).
4. **Trava Anti-Erro em Ação:** Na dosagem em béquer, adicione intencionalmente mais de +5% de produto em um componente. O **Modal de Bloqueio Crítico** impedirá o avanço. Digite o PIN de supervisor `9999` para autorizar a justificativa.
5. **Monitor de Pot Life:** Conclua a preparação e veja o cronômetro regressivo de **20 minutos** entrar em ação no topo da aplicação, alertando sobre o tempo hábil antes da cura irreversível do PU.
6. **Auditoria Gerencial & Estoque:** Abra o menu lateral no canto superior esquerdo e explore:
   - **Painel do Gestor:** Gráfico tátil interativo (*Scrub Chart*), KPIs de desperdício em R$ e exportação de histórico em CSV.
   - **Gestão de Estoque:** Visualização de insumos por FEFO ("Use Primeiro"), registro de novos lotes e lista de compras.

---

## 🏗️ Arquitetura

O sistema adota os princípios de **Clean Architecture** e **Repository Pattern**, isolando rigorosamente a interface tátil das regras matemáticas puras de mistura e da fonte de dados (mock / Supabase).

```mermaid
flowchart TB
    subgraph Frontend ["📱 Aplicação Tablet & Desktop (React 19 + TypeScript)"]
        UI["Componentes Táteis & Design System (src/components/ui/)"]
        SC["Telas Operacionais & Gestão (src/screens/)"]
        DM["Regras de Negócio Puras (src/domain/)"]
    end

    subgraph DataLayer ["🗄️ Camada de Dados & Repositórios (src/data/)"]
        REP["Interfaces Repositories (src/data/repositories.ts)"]
        MOCK["Mock Repositories + LocalStorage (src/data/mock/)"]
        SUPA[("Supabase / PostgreSQL Client (Planejado)")]
    end

    UI --> SC
    SC --> DM
    SC --> REP
    REP -->|VITE_DATA_SOURCE=mock| MOCK
    REP -.->|VITE_DATA_SOURCE=supabase| SUPA
```

> 📘 **Dossiê Técnico de Engenharia:** Para a árvore de diretórios detalhada, especificação do motor *Dual-Engine* de QR Code e todas as decisões ergonômicas de chão de fábrica, consulte **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## 🧰 Tecnologias

| Camada | Tecnologia | Situação |
| :--- | :--- | :--- |
| **Interface & Aplicação** | React 19, TypeScript, HTML5 semântico, CSS com Tokens | Implementado |
| **Tipografia & Design** | Geist Sans & Geist Mono, Design System Industrial de Alto Contraste | Implementado |
| **Ferramenta de Build** | Vite 8 (dev server em `localhost:3000`, HMR ultra rápido) | Implementado |
| **Camada de Dados (MVP)** | Repositórios em memória com persistência em `localStorage` | Implementado |
| **Regras de Negócio** | Módulos determinísticos puros em TypeScript isolados | Implementado |
| **Qualidade & Testes** | Vitest (25 testes unitários), ESLint 10 (Flat Config), Prettier | Implementado |
| **Scanner QR Code** | Dual-Engine: `BarcodeDetector` nativo + decodificador canvas `jsQR` | Implementado |
| **Banco de Dados Real** | PostgreSQL via Supabase (integração em modo de leitura) | Planejado |

---

## 🧪 Testes e qualidade

O projeto conta com ferramentas integradas de verificação estática, formatação e testes unitários automatizados:

- **Testes unitários (`npm run test`):** 25 testes em 5 arquivos com Vitest, cobrindo com rigor matemático as proporções de misturas, tolerâncias de dosagem, algoritmo FEFO e repositórios.
- **Análise estática (`npm run lint`):** ESLint 10 configurado para TypeScript e React.
- **Checagem estrita de tipos (`npm run typecheck`):** Validação com `tsc --noEmit`.
- **Build de produção (`npm run build`):** Otimização e minificação pelo Vite.

```bash
npm run test        # Executa a suíte de 25 testes unitários via Vitest
npm run lint        # Validação de regras e consistência de código
npm run typecheck   # Checagem rigorosa de tipos TypeScript
npm run build       # Gera os artefatos prontos para produção na pasta dist/
```

---

## 🚧 Status e roadmap

> O projeto é um **MVP demonstrável e funcional**. A conexão final com o banco de produção da marcenaria está arquitetada e aguarda a concessão das credenciais do Supabase.

### ✅ Já implementado no MVP

- [x] **Autenticação Tátil:** Teclado numérico PIN de 4 dígitos nos padrões Apple HIG, com resposta visual rápida e suporte a senha mestre de supervisor.
- [x] **Dashboard do Chão de Fábrica:** Painel de botões gigantes para operação em pé e card de aviso FEFO ("Use Primeiro").
- [x] **Identificação de Ordem de Serviço:** Rastreabilidade estruturada em três níveis (Cliente → Projeto → Ambiente).
- [x] **Calculadora Dinâmica de Mistura:** Cálculo instantâneo das frações de Base, Catálise, Diluidor e Retardador por volume total desejado.
- [x] **Dosagem em Béquer com Visualizador:** Visualização tátil do nível do líquido em tempo real, teclado numérico embutido e NumberStepper.
- [x] **Trava Anti-Erro Crítico:** Modal de bloqueio que impede misturas erradas (+5% ou +200ml) sem autorização do encarregado.
- [x] **Monitor de Pot Life (20 min):** Contagem regressiva em tempo real com avisos visuais de urgência e registro de autodescarte de refugo químico.
- [x] **Devolução de Sobras:** Cálculo automático de saldo remanescente na lata e emissão de etiqueta de sobra com QR Code.
- [x] **Scanner QR Dual-Engine com Mira Laser:** Câmera frontal com espelhamento para tablets em parede e suporte universal a Safari e Android.
- [x] **Gestão de Estoque e Compras:** Visualização de inventário, cadastro/recebimento de novos lotes e lista de reposição para compras.
- [x] **Painel Gerencial & Auditoria:** KPIs consolidados, gráfico interativo de consumo (*Scrub Chart*) e exportação do histórico em formato CSV.
- [x] **Qualidade:** 25 testes unitários automatizados cobrindo lógica matemática e repositórios.

### 📋 Próximos passos

- [ ] Conexão direta com as tabelas de produtos do Supabase da Mada Marcenaria (em modo leitura).
- [ ] Importação automatizada das Ordens de Serviço a partir do ERP da fábrica.
- [ ] Camada de sincronização offline via IndexedDB / Service Worker para resiliência a quedas de Wi-Fi.
- [ ] Homologação assistida com os operadores nas cabines de pintura.

---

## 📚 Documentação complementar

Acesse a **[Central de Documentação (docs/README.md)](docs/README.md)** para o índice completo e navegável de todos os documentos estratégicos e técnicos:

| Documento | Conteúdo |
| :--- | :--- |
| **[Arquitetura de Software](ARCHITECTURE.md)** | Diagramas detalhados, separação de camadas, decisões de engenharia fabril e árvore de arquivos |
| **[Documentação do Projeto](docs/PROJETO.md)** | Contexto de negócio, requisitos funcionais (RF), não-funcionais (RNF) e objetivos SMART |
| **[Project Model Canvas (PMC)](docs/CANVAS.md)** | Matriz visual de planejamento estratégico pós-banca acadêmica |
| **[Decisões e Reuniões](docs/DECISOES_E_REUNIOES.md)** | Atas de reuniões com o gestor Fabio e alinhamentos de bancas da faculdade |
| **[Guia de Design de Fábrica](docs/DESIGN.md)** | Diretrizes ergonômicas para uso de telas táteis em ambientes agressivos |
| **[Design System](docs/DESIGN_SYSTEM.md)** | Especificação canônica dos tokens de cor, tipografia Geist e componentes táteis |

---

## ▶️ Como executar o projeto localmente

### Pré-requisitos

- **Node.js:** `>=24.18.0` (definido em `.nvmrc` e no `package.json`).
- **npm:** Gerenciador de pacotes padrão do Node.

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/carvalhonathan/mada.git

# 2. Acesse a pasta do projeto
cd mada

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse no navegador através do endereço: `http://localhost:3000`.

> 💡 **Demonstração Online:** Caso prefira testar sem instalar dependências locais, utilize a versão publicada no GitHub Pages: [https://carvalhonathan.github.io/mada/](https://carvalhonathan.github.io/mada/)

---

### 👤 Operadores e PINs de teste (Dados Simulados)

| Perfil | Nome | PIN de Teste | Papel no Protótipo |
| :--- | :--- | :--- | :--- |
| **Operador** | Carlos Silva | `1234` | Pintor Líder • Cabine 01 |
| **Operador** | Ana Souza | `1234` | Aplicadora PU • Cabine 02 |
| **Operador** | Marcos Lima | `1234` | Auxiliar de Cabine |
| **Supervisor** | Fabio | `9999` (ou `1234`) | Liberação de excesso crítico e auditoria |

---

## 👥 Equipe & Contribuições

Projeto de curricularização acadêmica desenvolvido em parceria com a **Mada Marcenaria** (São Bernardo do Campo, SP):

| Integrante | Atribuições & Papel no Projeto | Contato / Links |
| :--- | :--- | :--- |
| **Nathan Carvalho** | **Liderança Técnica & Desenvolvimento Full Stack:** Arquitetura do sistema, engenharia de software, desenvolvimento Front-end & UI/UX *tablet-first*, regras de negócio em TypeScript, testes automatizados e deploy. | [![GitHub](https://img.shields.io/badge/GitHub-carvalhonathan-181717?logo=github)](https://github.com/carvalhonathan) &bull; [![E-mail](https://img.shields.io/badge/E--mail-fariasnathan75%40gmail.com-blue?logo=gmail&logoColor=white)](mailto:fariasnathan75@gmail.com) |
| **Gabriel** | **Relações com a Empresa Parceira & Documentação:** Contato inicial com a Mada Marcenaria, alinhamento nas reuniões com Fabio e apoio no levantamento e refinamento de documentação. | — |
| **Andrey** | **Suporte a Reuniões & Documentação:** Levantamento de anotações e atas das reuniões com a empresa parceira e auxílio na documentação acadêmica. | — |

> 🪵 Desenvolvido para modernização e gestão de acabamento químico no setor de pintura e laca PU.

---

## 📄 Licença e uso

Projeto acadêmico e profissional em processo de homologação junto à empresa parceira. Todos os direitos reservados.
