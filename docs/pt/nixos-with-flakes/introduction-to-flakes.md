# Introdução aos Flakes

A funcionalidade experimental flakes é um desenvolvimento importante para o Nix. Ela
introduz uma política para gerenciar dependências entre expressões Nix, melhora a
reprodutibilidade, a componibilidade e a usabilidade no ecossistema Nix. Embora ainda seja
um recurso experimental, os flakes são amplamente utilizados pela comunidade Nix.[^1]

Flakes é uma das mudanças mais significativas que o projeto Nix já viu.[^2]

Em termos simples, se você já trabalhou com JavaScript/Go/Rust/Python, deve estar
familiarizado com arquivos como `package.json`/`go.mod`/`Cargo.toml`/`pyproject.toml`.
Nessas linguagens de programação, esses arquivos são usados para descrever as dependências
entre pacotes de software e como construir projetos.

Da mesma forma, os gerenciadores de pacotes nessas linguagens de programação também usam
arquivos como `package-lock.json`/`go.sum`/`Cargo.lock`/`poetry.lock` para bloquear as
versões das dependências, garantindo a reprodutibilidade dos projetos.

Flakes empresta ideias desses gerenciadores de pacotes para aprimorar a reprodutibilidade,
a componibilidade e a usabilidade do ecossistema Nix.

Flakes introduz o `flake.nix`, similar ao `package.json`, para descrever as dependências
entre pacotes Nix e como construir projetos. Além disso, ele fornece o `flake.lock`,
semelhante ao `package-lock.json`, para bloquear as versões das dependências, garantindo a
reprodutibilidade do projeto.

Por outro lado, as funcionalidades experimentais dos flakes não quebraram o design
original do Nix no nível do usuário. Os dois novos arquivos `flake.nix`/`flake.lock`
introduzidos pelos flakes são apenas um wrapper para outras configurações Nix. Nos
capítulos seguintes, veremos que as funcionalidades dos flakes fornecem uma nova e mais
conveniente maneira de gerenciar as dependências entre as expressões Nix com base no
design original do Nix.

## Uma Palavra de Cautela sobre os Flakes <Badge type="danger" text="caution" />

Os benefícios dos flakes são evidentes, e toda a comunidade NixOS os adotou de todo o
coração. Atualmente, mais da metade dos usuários utiliza flakes[^3], o que nos dá a
garantia de que os flakes não serão descontinuados.

:warning: No entanto, é importante notar que flakes ainda é uma funcionalidade
experimental. Alguns problemas persistem, e existe a possibilidade de introduzir mudanças
breaking changes durante o processo de estabilização. A extensão dessas breaking changes
ainda é incerta.

No geral, eu recomendo fortemente que todos usem flakes, especialmente porque este livro
gira em torno do NixOS e de flakes. No entanto, é crucial estar preparado para problemas
potenciais que podem surgir devido a futuras _breaking changes_.

## Quando os Flakes Serão Estabilizados?

Eu me aprofundei em alguns detalhes sobre os flakes:

- [[RFC 0136] A Plan to Stabilize Flakes and the New CLI Incrementally](https://github.com/NixOS/rfcs/pull/136):
  Um plano para estabilizar incrementalmente os flakes e a nova CLI, que foi aceito.
- [CLI stabilization effort](https://github.com/NixOS/nix/issues/7701): Uma issue que
  acompanha o progresso do esforço de estabilização da Nova CLI.
- [Why Are Flakes Still Experimental? - NixOS Discourse](https://discourse.nixos.org/t/why-are-flakes-still-experimental/29317):
  Um post discutindo por que os flakes ainda são considerados experimentais.
- [Flakes Are Such an Obviously Good Thing - Graham Christensen](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/):
  Um artigo enfatizando as vantagens dos flakes enquanto sugere áreas para melhoria em seu
  design e processo de desenvolvimento.
- [ teaching Nix 3 CLI and Flakes #281 - nix.dev](https://github.com/NixOS/nix.dev/issues/281):
  Uma issue sobre "Ensinar Nix 3 CLI e Flakes" no nix.dev, cuja conclusão é que não
  devemos promover funcionalidades instáveis no nix.dev.

Após analisar esses recursos, parece que os flakes podem ser (ou não...) estabilizados em
até dois anos, possivelmente acompanhados de algumas breaking changes.

## A Nova CLI e a CLI Clássica

O Nix introduziu duas funcionalidades experimentais, `nix-command` e `flakes`, no ano
de 2020. Essas funcionalidades trouxeram uma nova interface de linha de comando (referida
como a Nova CLI), uma definição padronizada da estrutura de pacotes Nix (conhecida como a
funcionalidade Flakes), e funcionalidades como o `flake.lock`, semelhante a arquivos de
bloqueio de versão em cargo/npm. Apesar de serem experimentais a partir de 1º de fevereiro
de 2024, essas funcionalidades ganharam ampla adoção dentro da comunidade Nix devido à sua
significativa melhoria nas capacidades do Nix.

A atual Nova CLI do Nix (a funcionalidade experimental `nix-command`) está fortemente
acoplada à funcionalidade experimental Flakes. Embora existam esforços em andamento para
separá-las explicitamente, usar flakes essencialmente exige o uso da Nova CLI. Neste
livro, que serve como um guia para iniciantes em NixOS e Flakes, é necessário introduzir
as diferenças entre a Nova CLI, da qual os flakes dependem, e a CLI antiga.

Aqui, listamos a antiga CLI do Nix e os conceitos relacionados que não são mais
necessários ao usar a Nova CLI e os flakes (`nix-command` e `flakes`). Ao pesquisar, você
pode substituí-los pelos comandos correspondentes da Nova CLI (exceto para
`nix-collect-garbage`, já que atualmente não há alternativa para este comando):

1. `nix-channel`: O `nix-channel` gerencia versões de entradas como o nixpkgs através de
   canais estáveis/instáveis, semelhante às listas de pacotes usadas por outras
   ferramentas de gerenciamento de pacotes, como apt/yum/pacman. É isso que
   tradicionalmente fornece o `<nixpkgs>` na linguagem Nix.
   1. Nos flakes, a funcionalidade do `nix-channel` é substituída pelo Registro de Flakes
      (`nix registry`) para fornecer "alguma versão global não especificada do nixpkgs"
      para uso interativo da CLI (por exemplo, `nix run nixpkgs#hello`). Ao usar um
      `flake.nix`, as versões das entradas são gerenciadas no próprio flake.
   2. Os flakes usam a seção `inputs` no `flake.nix` para gerenciar as versões do nixpkgs
      e de outras entradas em cada flake em vez de usar um estado global.
2. `nix-env`: O `nix-env` é uma ferramenta de linha de comando central para o Nix
   clássico, usada para gerenciar pacotes de software no ambiente do usuário.
   1. Ele instala pacotes a partir das fontes de dados adicionadas pelo `nix-channel`,
      fazendo com que a versão do pacote instalado seja influenciada pelo canal. Pacotes
      instalados com `nix-env` não são automaticamente registrados na configuração
      declarativa do Nix e são completamente independentes de seu controle, tornando-os
      difíceis de reproduzir em outras máquinas. Atualizar pacotes instalados por
      `nix-env` é lento e pode produzir resultados inesperados porque o nome do atributo
      onde o pacote foi encontrado no nixpkgs não é salvo.

      Portanto, não é recomendado usar este comando diretamente.

   2. O comando correspondente na Nova CLI é o `nix profile`. essoalmente, não o recomendo
      para iniciantes.

3. `nix-shell`: O `nix-shell` cria um ambiente shell temporário, o que é útil para
   desenvolvimento e testes.
   1. Nova CLI: Esta ferramenta é dividida em três subcomandos: `nix develop`,
      `nix shell`, e `nix run`. Discutiremos esses três comandos em detalhes no capítulo
      "[Desenvolvimento](../development/intro.md)" chapter.
4. `nix-build`:O `nix-build` constrói pacotes Nix e coloca os resultados da build em
   `/nix/store`, mas não os registra na configuração declarativa do Nix.
   1. Nova CLI: O `nix-build` é substituído pelo `nix build`.
5. `nix-collect-garbage`: Comando de coleta de lixo usado para limpar Objetos de Store não
   utilizados em `/nix/store`.
   1. Existe um comando similar na Nova CLI, `nix store gc --debug`, mas ele não limpa as
      gerações de perfil, então atualmente não há alternativa para este comando.
6. E outros comandos menos comumente usados não estão listados aqui.
   1. Você pode consultar a lista detalhada de comparação de comandos em
      [Tente explicar os comandos do nix](https://qiita.com/Sumi-Sumi/items/6de9ee7aab10bc0dbead?_x_tr_sl=auto&_x_tr_tl=en&_x_tr_hl=en).

[^1]: [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes)

[^2]:
    [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)

[^3]:
    [Draft: 1 year roadmap - NixOS Foundation](https://web.archive.org/web/20250317120825/https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
