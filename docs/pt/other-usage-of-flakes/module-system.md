# Sistema de Módulos e Opções Personalizadas

Em nossas configurações anteriores do NixOS, definimos vários valores para `options` para
configurar o NixOS ou o Home Manager. Essas `options` na verdade são definidas em dois
locais:

- NixOS:
  [nixpkgs/nixos/modules](https://github.com/NixOS/nixpkgs/tree/25.05/nixos/modules), onde
  todas as opções do NixOS visíveis em <https://search.nixos.org/options> são definidas.
- Home Manager:
  [home-manager/modules](https://github.com/nix-community/home-manager/blob/release-25.05/modules),
  onde você pode encontrar todas as suas opções em
  <https://nix-community.github.io/home-manager/options.xhtml>.

> Se você também estiver usando o nix-darwin, a sua configuração é similar, e o seu
> sistema de módulos é implementado em
> [nix-darwin/modules](https://github.com/LnL7/nix-darwin/tree/master/modules).

A base dos Módulos do NixOS e dos Módulos do Home Manager, mencionados anteriormente, é um
sistema de módulos universal implementado no Nixpkgs, encontrado em
[lib/modules.nix][lib/modules.nix]. A documentação oficial para este sistema de módulos é
fornecida abaixo (mesmo para usuários experientes do NixOS, entender isso pode ser uma
tarefa desafiadora):

- [Module System - Nixpkgs]

Como a documentação do sistema de módulos do Nixpkgs é deficiente, ela recomenda
diretamente a leitura de outro guia, escrito especificamente para o sistema de módulos do
NixOS, que é mais claro, mas pode ainda ser desafiador para os recém-chegados:

- [Writing NixOS Modules - Nixpkgs]

Em resumo, o sistema de módulos é implementado pelo Nixpkgs e não faz parte do gerenciador
de pacotes Nix. Portanto, sua documentação não está incluída na documentação do
gerenciador de pacotes Nix. Além disso, tanto o NixOS quanto o Home Manager são baseados
na implementação do sistema de módulos do Nixpkgs.

## Qual é o objetivo do Sistema de Módulos?

Como usuários comuns, usar as várias opções implementadas pelo NixOS e Home Manager com
base no sistema de módulos é suficiente para atender à maioria das nossas necessidades.
Então, quais os benefícios de nos aprofundarmos no sistema de módulos?

Na discussão anterior sobre a configuração modular, a ideia central era dividir a
configuração em múltiplos módulos e, em seguida, importar esses módulos usando
`imports = [ ... ];`. Este é o uso mais básico do sistema de módulos. No entanto, usar
apenas `imports = [ ... ];` nos permite importar as configurações definidas no módulo como
estão, sem nenhuma personalização, o que limita a flexibilidade. Em configurações simples,
este método é suficiente, mas se a configuração for mais complexa, ele se torna
inadequado.

Para ilustrar a desvantagem, vamos considerar um exemplo. Suponha que eu gerencie quatro
hosts NixOS: A, B, C e D. Quero alcançar os seguintes objetivos, minimizando a repetição
de configuração:

- Todos os hosts (A, B, C e D) precisam habilitar o serviço Docker e configurá-lo para
  iniciar na inicialização.
- O host A deve alterar o storage driver do Docker para `btrfs`, mantendo as outras
  configurações iguais.
- Os hosts B e C, localizados na China, precisam configurar um mirror doméstico na
  configuração do Docker.
- O host C, localizado nos Estados Unidos, não tem requisitos especiais.
- O host D, uma máquina desktop, precisa configurar um proxy HTTP para acelerar os
  downloads do Docker.

Se usarmos puramente `imports`, poderíamos ter que dividir a configuração em vários
módulos como este e, em seguida, importar módulos diferentes para cada host:

```bash
› tree
.
├── docker-default.nix  # Configuração básica do Docker, incluindo a inicialização na inicialização.
├── docker-btrfs.nix    # Importa docker-default.nix e altera o storage driver para btrfs.
├── docker-china.nix    # Importa docker-default.nix e configura um mirror doméstico.
└── docker-proxy.nix    # Importa docker-default.nix e configura um proxy HTTP.
```

Essa configuração não parece redundante? Este é ainda um exemplo simples; se tivermos mais
máquinas com maiores diferenças de configuração, a redundância se torna ainda mais
evidente.

Claramente, precisamos de outros meios para resolver este problema de configuração
redundante, e personalizar algumas de nossas próprias `options` é uma excelente escolha.

Antes de nos aprofundarmos no estudo do sistema de módulos, enfatizo mais uma vez que o
conteúdo a seguir não é necessário para aprender e usar o NixOS. Muitos usuários de NixOS
não personalizaram nenhuma `options` e estão satisfeitos em simplesmente usar `imports`
para atender às suas necessidades. Se você é um iniciante, considere aprender esta parte
quando encontrar problemas que os `imports` não podem resolver. Isso é perfeitamente
aceitável.

## Estrutura Básica e Uso

A estrutura básica dos módulos definidos no Nixpkgs é a seguinte:

```nix
{ config, pkgs, ... }:

{
  imports =
    [ # importa outros módulos aqui
    ];

  options = {
    # ...
  };

  config = {
    # ...
  };
}
```

Entre esses, já estamos familiarizados com `imports = [ ... ];`, mas as outras duas partes
ainda não foram exploradas. Vamos fazer uma breve introdução aqui:

- `options = { ... };`: Similar a declarações de variáveis em linguagens de programação, é
  usado para declarar opções configuráveis.
- `config = { ... };`: Similar a atribuições de variáveis em linguagens de programação, é
  usado para atribuir valores às opções declaradas em `options`.

O uso mais comum é, dentro do mesmo módulo do Nixpkgs, definir valores para outras
`options` em `config = { .. };` com base nos valores atuais declarados em
`options = { ... };`. Isso alcança a funcionalidade de uma configuração parametrizada.

Fica mais fácil de entender com um exemplo direto:

```nix
# ./foo.nix
{ config, lib, pkgs, ... }:

with lib;

let
  cfg = config.programs.foo;
in {
  options.programs.foo = {
    enable = mkEnableOption "the foo program";

    package = mkOption {
      type = types.package;
      default = pkgs.hello;
      defaultText = literalExpression "pkgs.hello";
      description = "foo package to use.";
    };

    extraConfig = mkOption {
      default = "";
      example = ''
        foo bar
      '';
      type = types.lines;
      description = ''
        Extra settings for foo.
      '';
    };
  };

  config = mkIf cfg.enable {
    home.packages = [ cfg.package ];
    xdg.configFile."foo/foorc" = mkIf (cfg.extraConfig != "") {
      text = ''
        # Generated by Home Manager.

        ${cfg.extraConfig}
      '';
    };
  };
}
```

O módulo definido acima introduz três `options`:

- `programs.foo.enable`: Usada para controlar se este módulo deve ser habilitado.
- `programs.foo.package`: Permite a personalização do pacote `foo`, como usar diferentes
  versões, definir diferentes parâmetros de compilação, e assim por diante.
- `programs.foo.extraConfig`: Usada para personalizar o arquivo de configuração de `foo`.

Em seguida, na seção `config`, com base nos valores declarados nessas três variáveis em
`options`, diferentes configurações são aplicadas:

- Se `programs.foo.enable` for `false` ou não for definida, nenhuma configuração é
  aplicada.
  - Isso é alcançado usando `lib.mkIf`.
- Caso contrário,
  - Adiciona `programs.foo.package` a `home.packages` para instalá-lo no ambiente do
    usuário.
  - Escreve o valor de `programs.foo.extraConfig` para `~/.config/foo/foorc`.

Dessa forma, podemos importar este módulo em outro arquivo Nix e obter uma configuração
customizada para `foo` definindo as `options` aqui. Por exemplo:

```nix
# ./bar.nix
{ config, lib, pkgs, ... }:

{
  imports = [
    ./foo.nix
  ];

  programs.foo ={
    enable = true;
    package = pkgs.hello;
    extraConfig = ''
      foo baz
    '';
  };
}
```

No exemplo acima, a forma como atribuímos valores às `options` é, na verdade, um tipo de
abreviação. Quando um módulo contém apenas `config` sem qualquer outra declaração (como
`option` e outros parâmetros especiais do sistema de módulos), podemos omitir o wrapper
`config`, e apenas escrever diretamente o conteúdo de `config` para atribuir um valor à
seção `option` declarada em outros módulos!

## Atribuição e Avaliação Preguiçosa no Sistema de Módulos

O sistema de módulos tira total proveito da característica de avaliação preguiçosa do Nix,
o que é crucial para alcançar a configuração parametrizada.

Vamos começar com um exemplo simples:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ({config, lib, ...}: {
            options = {
              foo = lib.mkOption {
                default = false;
                type = lib.types.bool;
              };
            };

            # Cenário 1 (funciona corretamente)
            config.warnings = if config.foo then ["foo"] else [];

            # Cenário 2 (erro: recursão infinita encontrada)
            # config = if config.foo then { warnings = ["foo"];} else {};

            # Cenário 3 (funciona corretamente)
            # config = lib.mkIf config.foo {warnings = ["foo"];};
          })
        ];
      };
    };
  };
}
```

Nos exemplos 1, 2 e 3 da configuração acima, o valor de `config.warnings` depende do valor
de `config.foo`, mas seus métodos de implementação são diferentes. Salve a configuração
acima como `flake.nix` e, em seguida, use o comando
`nix eval .#nixosConfigurations.test.config.warnings` para testar os exemplos 1, 2 e 3
separadamente. Você descobrirá que os exemplos 1 e 3 funcionam corretamente, enquanto o
exemplo 2 resulta em um erro: `error: infinite recursion encountered`.

Vamos explicar cada caso:

1. Fluxo de avaliação do Exemplo 1: `config.warnings` => `config.foo` => `config`
   1. Primeiro, o Nix tenta computar o valor de `config.warnings`, mas descobre que ele
      depende de `config.foo`.
   2. Em seguida, o Nix tenta computar o valor de `config.foo`, que depende do seu
      `config` externo.
   3. O Nix tenta computar o valor de `config` e, como o conteúdo não usado genuinamente
      por `config.foo` é avaliado de forma preguiçosa pelo Nix, não há dependência
      recursiva em `config.warnings` neste ponto.
   4. A avaliação de `config.foo` é concluída, seguida pela atribuição de
      `config.warnings`, e a computação termina.

2. Exemplo 2: `config` => `config.foo` => `config`
   1. Inicialmente, o Nix tenta computar o valor de `config`, mas descobre que ele depende
      de `config.foo`.
   2. Em seguida, o Nix tenta computar o valor de `config.foo`, que depende do seu
      `config` externo.
   3. O Nix tenta computar o valor de `config`, e isso retorna ao passo 1, levando a uma
      recursão infinita e, eventualmente, a um erro.

3. Exemplo 3: A única diferença em relação ao exemplo 2 é o uso de `lib.mkIf` para
   resolver o problema da recursão infinita.

A chave está na função `lib.mkIf`. Ao usar `lib.mkIf` para definir `config`, ela será
avaliada de forma preguiçosa pelo Nix. Isso significa que o cálculo de
`config = lib.mkIf ...` só ocorrerá depois que a avaliação de `config.foo` for concluída.

O sistema de módulos do Nixpkgs oferece uma série de funções semelhantes a `lib.mkIf` para
configuração parametrizada e para a fusão inteligente de módulos:

1. `lib.mkIf`: Já apresentada.
2. `lib.mkOverride` / `lib.mkDefault` / `lib.mkForce`: Já discutidas anteriormente em
   [Modularizando a Configuração do NixOS](../nixos-with-flakes/modularize-the-configuration.md).
3. `lib.mkOrder`, `lib.mkBefore` e `lib.mkAfter`: Conforme mencionado acima.
4. Verifique [Option Definitions - NixOS] para mais funções relacionadas à atribuição
   (definição) de opções.

## Declaração de Opções e Verificação de Tipo

Embora a atribuição seja a funcionalidade mais comumente usada do sistema de módulos, se
você precisar personalizar algumas `options`, também precisará se aprofundar na declaração
de opções e na verificação de tipo. Acho esta parte relativamente simples; é muito mais
fácil do que a atribuição, e você pode entender o básico consultando diretamente a
documentação oficial. Não entrarei em detalhes aqui.

- [Option Declarations - NixOS]
- [Options Types - NixOS]

## Passando Parâmetros Não Padrão para o Sistema de Módulos

Já apresentamos como usar `specialArgs` e `_module.args` para passar parâmetros adicionais
para outras funções de Módulos em
[Gerenciando seu NixOS com Flakes](../nixos-with-flakes/nixos-with-flakes-enabled.md#pass-non-default-parameters-to-submodules).
Não é necessária nenhuma outra elaboração aqui.

## Como Importar Módulos de Forma Seletiva {#selectively-import-modules}

Nos exemplos acima, apresentamos como habilitar ou desabilitar certas funcionalidades por
meio de opções customizadas. No entanto, nossas implementações de código estão todas no
mesmo arquivo Nix. Se nossos módulos estiverem espalhados por arquivos diferentes, como
podemos realizar a importação seletiva?

Vamos primeiro analisar alguns padrões de uso incorretos comuns e, em seguida, apresentar
a maneira correta de fazê-lo.

### Uso Incorreto #1 - Usando `imports` em `config = { ... };` {#wrong-usage-1}

O primeiro pensamento pode ser usar o `imports` diretamente em `config = { ... };`, assim:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ({config, lib, ...}: {
            options = {
              foo = lib.mkOption {
                default = false;
                type = lib.types.bool;
              };
            };
            config = lib.mkIf config.foo {
              # Usar imports em config causará um erro
              imports = [
                {warnings = ["foo"];}
                # ... omitir outros módulos ou caminhos de arquivos
              ];
            };
          })
        ];
      };
    };
  };
}
```

Mas isso não irá funcionar. Você pode tentar salvar o `flake.nix` acima em um novo
diretório e, em seguida, executar `nix eval .#nixosConfigurations.test.config.warnings`.
Um erro como `error: The option 'imports' does not exist.` será encontrado.

Isso ocorre porque `config` é um attribute set comum, enquanto `imports` é um parâmetro
especial do sistema de módulos. Não existe uma definição como `config.imports`.

### Uso Correto #1 - Defina `options` Individuais para Todos os Módulos que Exigem Importação Condicional {#correct-usage-1}

Este é o método mais recomendado. Os módulos nos sistemas NixOS são implementados dessa
forma, e uma busca por `enable` em <https://search.nixos.org/options> mostrará um grande
número de módulos do sistema que podem ser habilitados ou desabilitados através da option
`enable`.

O método de escrita específico foi introduzido na seção anterior
[Estrutura Básica e Uso](#basic-structure-and-usage) e não será repetido aqui.

A desvantagem deste método é que todos os módulos Nix que exigem importação condicional
precisam ser modificados, movendo todas as declarações de configuração no módulo para o
bloco de código `config = { ... };`, aumentando a complexidade do código e sendo menos
amigável para iniciantes.

### Uso Correto #2 - Use `lib.optionals` em `imports = [];` {#correct-usage-2}

A principal vantagem desse método é que ele é muito mais simples do que os métodos
apresentados anteriormente, não exigindo modificação no conteúdo do módulo, apenas usando
`lib.optionals` em `imports` para decidir se um módulo deve ser importado ou não.

> Detalhes sobre como `lib.optionals` funciona: <https://noogle.dev/f/lib/optionals>

Vamos ver um exemplo diretamente:

```nix
# ./flake.nix
{
  description = "NixOS Flake for Test";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "test" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        specialArgs = { enableFoo = true; };
        modules = [
          ({config, lib, enableFoo ? false, ...}: {
            imports =
              [
                 # Outros Módulos
              ]
              # Use lib.optionals para decidir se deve importar foo.nix
              ++ (lib.optionals (enableFoo) [./foo.nix]);
          })
        ];
      };
    };
  };
}
```

```nix
# ./foo.nix
{ warnings = ["foo"];}
```

Salve os dois arquivos Nix acima em uma pasta e, em seguida, execute
`nix eval .#nixosConfigurations.test.config.warnings` nessa pasta. A operação será normal:

```bash
› nix eval .#nixosConfigurations.test.config.warnings
[ "foo" ]
```

Uma coisa a se notar aqui é que você não pode usar os parâmetros passados por
`_module.args` em `imports =[ ... ];`. Já fornecemos uma explicação detalhada na seção
anterior
[Passando Parâmetros Não Padrão para Submódulos](../nixos-with-flakes/nixos-flake-and-module-system#pass-non-default-parameters-to-submodules).

## Referências

- [Best resources for learning about the NixOS module system? - Discourse](https://discourse.nixos.org/t/best-resources-for-learning-about-the-nixos-module-system/1177/4)
- [NixOS modules - NixOS Wiki](https://wiki.nixos.org/wiki/NixOS_modules)
- [NixOS: config argument - NixOS Wiki](https://wiki.nixos.org/wiki/NixOS:config_argument)
- [Module System - Nixpkgs]
- [Writing NixOS Modules - Nixpkgs]

[lib/modules.nix]: https://github.com/NixOS/nixpkgs/blob/nixos-25.05/lib/modules.nix#L995
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/doc/module-system/module-system.chapter.md
[Writing NixOS Modules - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/doc/manual/development/writing-modules.chapter.md
[Option Definitions - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/doc/manual/development/option-def.section.md
[Option Declarations - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/doc/manual/development/option-declarations.section.md
[Options Types - NixOS]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/doc/manual/development/option-types.section.md
