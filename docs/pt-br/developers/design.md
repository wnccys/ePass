# Sistema de Design e Identidade Visual: ePass Web App

Este documento descreve a identidade visual, tokens de cores, tipografia e componentes que definem a interface de usuário da aplicação **ePass**.

---

## 1. Tema Visual e Estética

O ePass utiliza uma estética **"Neon-Forest Web3"**. O design combina tons orgânicos de verde escuro com realces vibrantes em verde-limão neon, estabelecendo um ambiente de alto contraste, otimizado para o modo escuro (dark-mode-first), ideal para ativos esportivos tokenizados.

### Elementos Visuais Principais:
* **Shaders de Grão Interativos**: A tela inicial utiliza `@paper-design/shaders-react` para renderizar uma animação fluida em canvas (`GrainGradient`) misturando verde pinho escuro (`hsl(167, 59%, 14%)`) com verde limão neon brilhante (`hsl(67, 87%, 59%)`).
* **Glassmorphism e Overlays**: Filtros limpos de overlay (`bg-foreground/5`) e bordas finas fornecem hierarquia visual sobre os fundos animados.

---

## 2. Paleta de Cores (Tokens OKLCH)

As cores da aplicação estão definidas como variáveis do Tailwind CSS v4 no arquivo `app/globals.css`.

| Família de Cor | Referência OKLCH / Hex | Uso |
| :--- | :--- | :--- |
| **Lemon Lime** | `oklch(89.95% 0.206 117.22)` (~`#ddf23c`) | Destaques primários, botões interativos e estados hover. |
| **Evergreen** | `oklch(75.73% 0.132 174.13)` (~`#0f3a31`) | Fundos escuros principais, cartões e superfícies profundas. |
| **Pacific Blue** | `oklch(80.90% 0.136 205.59)` (~`#0fa3b1`) | Chamadas secundárias (CTAs), tags de status e realces secundários. |
| **Taupe Grey** | `oklch(58.85% 0.034 35.52)` (~`#65524d`) | Tipografia secundária, indicadores inativos e bordas neutras. |
| **Alabaster Grey**| `oklch(58.86% 0.011 286.07)` (~`#dedee0`) | Texto de apoio, bordas finas e filtros de vidro. |

---

## 3. Tipografia

As fontes são carregadas no layout raiz utilizando os loaders de fontes locais e Google Fonts do Next.js:

* **Fonte Primária (`--font-rodin`)**: Carregada localmente via arquivo `RodinProB.otf`. Utilizada para títulos de seções, barras de navegação e exibição de métricas.
* **Fonte Serifada (`--font-serif`)**: Carregada via Google `Merriweather`. Aplicada ao corpo de texto e descritores longos para fornecer uma leitura confortável e estilo editorial clássico.
* **Fonte de Títulos (`--font-heading`)**: Carregada via Google `Noto Serif`. Reservada para cabeçalhos de páginas e blocos de destaque.

---

## 4. Registros de UI e Layouts

A interface constrói-se sobre as fundações do Shadcn UI, customizada com variáveis de cores OKLCH, juntamente com padrões de designs modernos:

* **Primitivos**: [Shadcn UI](https://ui.shadcn.com) e [Shadcn Space](https://shadcnspace.com/).
* **Layouts e Cards**: Componentes integrados a partir do [21st.dev](https://21st.dev/) (incluindo tabelas de preços modernas e blocos de apresentação de mídia).
* **Configuração do Preset**: O mapeamento de tema compartilhado está disponível no [Preset customizado do Shadcn](https://ui.shadcn.com/create?preset=b5D92K6mXo).

---

## 5. Referências e Inspirações Visuais

O design de grids limpos e estilo dark-mode são influenciados pelas plataformas:
* **[Anticapture](https://anticapture.com/)**: Uso de grids finos, tipografia limpa e alta densidade de informações bem dispostas.
* **[Swaplace](https://swaplace-frontend.vercel.app/)**: Modais imersivos de troca de ativos Web3 e transições suaves.
