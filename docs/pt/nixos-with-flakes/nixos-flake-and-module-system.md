# A Capacidade de Combinação dos Flakes com o Sistema de Módulos do Nixpkgs

## Estrutura do Módulo Nixpkgs Explicada {#simple-introduction-to-nixpkgs-module-structure}

> O funcionamento detalhado deste sistema de módulos será introduzido na seção a seguir
> [Modularizando a Configuração do NixOS](./modularize-the-configuration.md). Aqui,
> abordaremos apenas alguns conhecimentos básicos.

Você deve estar se perguntando por que o arquivo de configuração
`/etc/nixos/configuration.nix` adere à definição de Módulo Nixpkgs e pode ser referenciado
diretamente dentro do `flake.nix`.

Para entender isso, precisamos primeiro aprender sobre a origem do sistema de módulos do
Nixpkgs e seu propósito.

Todo o código de implementação do NixOS é armazenado no diretório
[Nixpkgs/nixos](https://github.com/NixOS/nixpkgs/tree/master/nixos), e a maioria desses
códigos-fonte é escrita na linguagem Nix. Para escrever e manter uma quantidade tão grande
de código Nix e para permitir que os usuários personalizem de forma flexível várias
funções de seu sistema NixOS, um sistema modular para o código Nix é essencial.

Este sistema modular para o código Nix também é implementado dentro do repositório Nixpkgs
e é usado principalmente para modularizar as configurações do sistema NixOS. No entanto,
ele também é amplamente utilizado em outros contextos, como nix-darwin e home-manager.
Como o NixOS é construído sobre este sistema modular, é natural que seus arquivos de
configuração, incluindo `/etc/nixos/configuration.nix`, sejam Módulos Nixpkgs.

Antes de nos aprofundarmos no conteúdo subsequente, é essencial ter um entendimento básico
de como este sistema de módulos opera.

Aqui está uma estrutura simplificada de um Módulo Nixpkgs:

```nix
{lib, config, options, pkgs, ...}:
{
  # Importando outros Módulos
  imports = [
    # ...
    ./xxx.nix
  ];
  for.bar.enable = true;
  # Outras declarações de opção
  # ...
}
```

A definição é na verdade uma função Nix, e ela tem cinco **parâmetros que são gerados e
injetados automaticamente e sem declaração** pelo **sistema de módulos**:

1. `lib`: Uma biblioteca de funções embutida incluída com o nixpkgs, oferecendo muitas
   funções práticas para operar expressões Nix.
   - Para mais informações, veja <https://nixos.org/manual/nixpkgs/stable/#id-1.4>.
2. `config`: Um set de valores de todas as opções no ambiente atual, que será usado
   extensivamente na seção subsequente sobre o sistema de módulos.
3. `options`: Um set de todas as opções definidas em todos os Módulos no ambiente atual.
4. `pkgs`: Uma coleção contendo todos os pacotes nixpkgs, juntamente com várias funções
   utilitárias relacionadas.
   - Na fase de iniciante, você pode considerar que seu valor padrão é
     `nixpkgs.legacyPackages."${system}"`, e o valor de `pkgs` pode ser customizado
     através da opção `nixpkgs.pkgs`.
5. `modulesPath`: Um parâmetro disponível apenas no NixOS, que é um caminho que aponta
   para
   [nixpkgs/nixos/modules](https://github.com/NixOS/nixpkgs/tree/nixos-25.05/nixos/modules).
   - Ele é definido em
     [nixpkgs/nixos/lib/eval-config-minimal.nix#L43](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/lib/eval-config-minimal.nix#L43).
   - É tipicamente usado para importar Módulos NixOS adicionais e pode ser encontrado na
     maioria dos arquivos `hardware-configuration.nix` gerados automaticamente pelo NixOS.

## Passando Parâmetros Não Padrão para Submódulos {#pass-non-default-parameters-to-submodules}

Se você precisar passar outros parâmetros não padrão para os submódulos, será necessário
usar alguns métodos especiais para especificar manualmente esses parâmetros não padrão.

O sistema de módulos do Nixpkgs oferece duas maneiras de passar parâmetros não padrão:

1. O parâmetro `specialArgs` da função `nixpkgs.lib.nixosSystem`.
2. Usando a opção `_module.args` em qualquer módulo para passar parâmetros.

A documentação oficial para esses dois parâmetros está profundamente enterrada e é vaga e
difícil de entender. Se os leitores estiverem interessados, incluirei os links aqui:

1. `specialArgs`: Existem menções dispersas relacionadas a ele no Manual do NixOS e no
   Manual do Nixpkgs.
   - Manual do Nixpkgs: [Module System - Nixpkgs]
   - Manual do NixOS NixOS:
     [nixpkgs/nixos-25.05/nixos/doc/manual/development/option-types.section.md#L237-L244]
1. `_module.args`:
   - Manual do NixOS:
     [Appendix A. Configuration Options](https://nixos.org/manual/nixos/stable/options#opt-_module.args)
   - Código-fonte: [nixpkgs/nixos-25.05/lib/modules.nix - _module.args]

Em resumo, `specialArgs` e `_module.args` exigem um attribute set como seu valor, e eles
servem ao mesmo propósito, passando todos os parâmetros no attribute set para todos os
submódulos. A diferença entre eles é:

1. A opção `_module.args` pode ser usada em qualquer módulo para passar parâmetros uns
   para os outros, o que é mais flexível do que `specialArgs`, que só pode ser usado na
   função `nixpkgs.lib.nixosSystem`.
1. `_module.args` é declarado dentro de um módulo, então ele deve ser avaliado depois que
   todos os módulos forem avaliados antes de poder ser usado. Isso significa que se você
   usar os parâmetros passados através de `_module.args` em `imports = [ ... ];`, isso
   resultará em um erro de `recursão infinita`. Neste caso, você deve usar `specialArgs`
   em vez disso.

Eu, pessoalmente, prefiro `specialArgs` porque é mais direto e fácil de usar, e o estilo
de nomenclatura de `_xxx` faz com que pareça algo interno que não é adequado para uso em
arquivos de configuração de usuário.

Suponha que você queira passar uma certa dependência para um submódulo para uso. Você pode
usar o parâmetro `specialArgs` para passar as `inputs` para todos os submódulos:

```nix{13}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    another-input.url = "github:username/repo-name/branch-name";
  };

  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      # Define todos os parâmetros de inputs como argumentos especiais para todos os submódulos,
      # para que você possa usar diretamente todas as dependências em inputs nos submódulos
      specialArgs = { inherit inputs; };
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

Ou você pode obter o mesmo efeito usando a opção `_module.args`:

```nix{14}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
    another-input.url = "github:username/repo-name/branch-name";
  };
  outputs = inputs@{ self, nixpkgs, another-input, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ./configuration.nix
        {
          # Define todos os parâmetros de inputs como argumentos especiais para todos os submódulos,
          # para que você possa usar diretamente todas as dependências em inputs nos submódulos
          _module.args = { inherit inputs; };
        }
      ];
    };
  };
}
```

Escolha um dos dois métodos acima para modificar sua configuração, e então você poderá
usar o parâmetro `inputs` em `/etc/nixos/configuration.nix`. O sistema de módulos irá
automaticamente corresponder às `inputs` definidas em `specialArgs` e injetá-las em todos
os submódulos que exigem este parâmetro:

```nix{3}
# O Nix irá corresponder pelo nome e injetar automaticamente as inputs
# de specialArgs/_module.args no terceiro parâmetro desta função
{ config, pkgs, inputs, ... }:
{
  # ...
}
```

A próxima seção demonstrará como usar `specialArgs`/`_module.args` para instalar software
de sistema a partir de outras fontes de flake.

## Instalando Software de Sistema a Partir de Outras Fontes de Flake {#install-system-packages-from-other-flakes}

O requisito mais comum para gerenciar um sistema é instalar software, e já vimos na seção
anterior como instalar pacotes do repositório oficial nixpkgs usando
`environment.systemPackages`. Esses pacotes vêm todos do repositório oficial nixpkgs.

Agora, aprenderemos como instalar pacotes de software a partir de outras fontes de flake,
o que é muito mais flexível do que instalar diretamente do nixpkgs. O principal caso de
uso é instalar a versão mais recente de um software que ainda não foi adicionado ou
atualizado no Nixpkgs.

Tomando o editor Helix como exemplo, aqui está como compilar e instalar diretamente o ramo
master do Helix.

Primeiro, adicione a fonte de dados de entrada do helix ao `flake.nix`:

```nix{6,12,18}
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";

    # editor helix, usar o ramo master
    helix.url = "github:helix-editor/helix/master";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = { inherit inputs; };
      modules = [
        ./configuration.nix

        # Este módulo funciona da mesma forma que o parâmetro specialArgs que usamos acima
        # escolha um dos dois métodos para usar
        # { _module.args = { inherit inputs; };}
      ];
    };
  };
}
```

Em seguida, você pode referenciar esta fonte de dados de entrada de flake em
`configuration.nix`:

```nix{1,10}
{ config, pkgs, inputs, ... }:
{
  # ...
  environment.systemPackages = with pkgs; [
    git
    vim
    wget
    # Aqui, o pacote helix é instalado a partir da fonte de dados de entrada helix
    inputs.helix.packages."${pkgs.system}".helix
  ];
  # ...
}
```

Faça as alterações necessárias e implante com `sudo nixos-rebuild switch`. A implantação
levará muito mais tempo desta vez porque o Nix irá compilar o programa Helix inteiro a
partir do código-fonte.

Após a implantação, você pode testar e verificar a instalação diretamente usando o comando
`hx` no terminal.

Além disso, se você apenas quiser experimentar a versão mais recente do Helix e decidir se
a instala em seu sistema mais tarde, há uma maneira mais simples de fazer isso em um único
comando (mas como mencionado anteriormente, a compilação a partir do código-fonte levará
muito tempo):

```bash
nix run github:helix-editor/helix/master
```

Nós nos aprofundaremos mais no uso de `nix run` na seção a seguir
[Uso da Nova CLI](../other-usage-of-flakes/the-new-cli.md).

## Aproveitando Funcionalidades de Outros Pacotes de Flakes

Na verdade, esta é a funcionalidade principal dos Flakes — um flake pode depender de
outros flakes, permitindo-lhe utilizar as funcionalidades que eles fornecem. É como
incorporamos funcionalidades de outras bibliotecas ao escrever programas em TypeScript,
Go, Rust e outras linguagens de programação.

O exemplo acima, usando a versão mais recente do Flake oficial do Helix, ilustra esta
funcionalidade. Mais casos de uso serão discutidos mais tarde, e aqui estão alguns
exemplos referenciados para menção futura:

- [Primeiros Passos com o Home Manager](./start-using-home-manager.md): Isso introduz o
  Home-Manager da comunidade como uma dependência, permitindo a utilização direta das
  funcionalidades fornecidas por este Flake.
- [Fazendo Downgrade ou Upgrade de Pacotes](./downgrade-or-upgrade-packages.md): Aqui,
  diferentes versões do Nixpkgs são introduzidas como dependências, permitindo uma seleção
  flexível de pacotes de várias versões do Nixpkgs.

## Mais Tutoriais sobre Flakes

Até este ponto, aprendemos como usar Flakes para configurar sistemas NixOS. Se você tiver
mais perguntas sobre Flakes ou quiser aprender de forma mais aprofundada, por favor,
consulte diretamente os seguintes documentos oficiais/semi-oficiais:

- Documentação oficial dos Flakes do Nix:
  - [Nix flakes - Nix Manual](https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake)
  - [Flakes - nix.dev](https://nix.dev/concepts/flakes)
- Uma série de tutoriais de Eelco Dolstra (O criador do Nix) sobre Flakes:
  - [Nix Flakes, Part 1: An introduction and tutorial (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-05-25-flakes/)
  - [Nix Flakes, Part 2: Evaluation caching (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-06-25-eval-cache/)
  - [Nix Flakes, Part 3: Managing NixOS systems (Eelco Dolstra, 2020)](https://www.tweag.io/blog/2020-07-31-nixos-flakes/)
- Outros documentos úteis:
  - [Practical Nix Flakes](https://serokell.io/blog/practical-nix-flakes)

[nix flake - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake#flake-inputs
[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-25.05/flake.nix
[nixpkgs/nixos/lib/eval-config.nix]:
  https://github.com/NixOS/nixpkgs/tree/nixos-25.05/nixos/lib/eval-config.nix
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/doc/module-system/module-system.chapter.md
[nixpkgs/nixos-25.05/lib/modules.nix - _module.args]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/lib/modules.nix#L122-L184
[nixpkgs/nixos-25.05/nixos/doc/manual/development/option-types.section.md#L237-L244]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/doc/manual/development/option-types.section.md?plain=1#L237-L244
