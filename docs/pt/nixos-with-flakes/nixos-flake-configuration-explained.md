# Entendendo o `flake.nix` {#flake-nix-configuration-explained}

Acima, criamos um arquivo `flake.nix` para gerenciar as configurações do sistema, mas você
pode ainda não ter clareza sobre sua estrutura. Vamos explicar o conteúdo deste arquivo em
detalhes.

## 1. Entradas do Flake (Flake Inputs)

Primeiro, vamos analisar o atributo `inputs`. Ele é um attribute set que define todas as
dependências deste flake. Essas dependências serão passadas como argumentos para a função
`outputs` após serem obtidas:

```nix{2-5,7}
{
  inputs = {
    # Fonte oficial de pacotes NixOS, usando o ramo nixos-25.05 aqui
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # Omitindo configurações anteriores...
  };
}
```

As dependências em `inputs` têm muitos tipos e definições. Pode ser outro flake, um
repositório Git comum ou um caminho local. A seção
[Outros Usos de Flakes - Entradas do Flake](../other-usage-of-flakes/inputs.md) descreve
em detalhes os tipos comuns de dependências e suas definições.

Aqui, definimos apenas uma dependência chamada `nixpkgs`, que é a forma mais comum de
referência em um flake, ou seja, `github:dono/nome/referencia`. A `referencia` aqui pode
ser o nome de um ramo, um commit-id ou uma tag.

Após o `nixpkgs` ser definido em `inputs`, você pode usá-lo nos parâmetros da função
`outputs` subsequente, que é exatamente o que nosso exemplo faz.

## 2. Saídas do Flake (Flake Outputs)

Agora, vamos analisar `outputs`. Ele é uma função que recebe as dependências de `inputs`
como seus parâmetros, e seu valor de retorno é um attribute set, que representa os
resultados da build do flake:

```nix{11-19}
{
  description = "Um flake simples para NixOS";

  inputs = {
    # Fonte oficial de pacotes NixOS, usando o ramo nixos-25.05 aqui
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # O host com o nome de host `my-nixos` usará esta configuração
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        # Importa o configuration.nix anterior que usamos,
        # para que o antigo arquivo de configuração ainda tenha efeito
        ./configuration.nix
      ];
    };
  };
}
```

Os flakes podem ter diversos propósitos e diferentes tipos de saídas. A seção
[Flake Outputs](../other-usage-of-flakes/outputs.md) fornece uma introdução mais
detalhada. Aqui, estamos usando apenas o tipo de saída `nixosConfigurations`, que é usado
para configurar sistemas NixOS.

Quando executamos o comando `sudo nixos-rebuild switch`, ele procura o atributo
`nixosConfigurations.my-nixos` (onde `my-nixos` será o nome do host do seu sistema atual)
no attribute set retornado pela função `outputs` de `/etc/nixos/flake.nix` e usa a
definição lá para configurar seu sistema NixOS.

Na verdade, também podemos personalizar a localização do flake e o nome da configuração do
NixOS em vez de usar os padrões. Isso pode ser feito adicionando o parâmetro `--flake` ao
comando `nixos-rebuild`. Aqui está um exemplo:

```nix
sudo nixos-rebuild switch --flake /path/to/your/flake#your-hostname
```

Uma breve explicação do parâmetro `--flake /path/to/your/flake#your-hostname`:

1. `/path/to/your/flake` é a localização do flake de destino. O caminho padrão é
   `/etc/nixos/`.
2. `#` é um separador, e `your-hostname` é o nome da configuração do NixOS. O
   `nixos-rebuild` usará por padrão o nome do host do seu sistema atual como o nome da
   configuração a ser procurada.

Você pode até mesmo referenciar diretamente um repositório remoto do GitHub como sua fonte
de flake. Por exemplo:

```nix
sudo nixos-rebuild switch --flake github:owner/repo#your-hostname
```

## 3. O Parâmetro Especial `self` da Função `outputs` {#special-parameter-self-of-outputs-function}

Embora não o tenhamos mencionado antes, todo o código de exemplo nas seções anteriores tem
um parâmetro especial a mais na função `outputs`, e vamos introduzir brevemente seu
propósito aqui.

A descrição dele no [nix flake - Nix Manual] é:

> A entrada especial chamada `self` refere-se às saídas e à árvore de origem deste flake.

Isso significa que `self` é o valor de retorno da função `outputs` do flake atual e também
o caminho para a pasta do código-fonte (source tree) do flake atual.

Não estamos usando o parâmetro `self` aqui, mas em alguns exemplos mais complexos (ou
configurações que você possa encontrar online) mais adiante, você verá o uso de `self`.

> Observação: Você pode encontrar algum código onde as pessoas usam `self.outputs` para
> referenciar as saídas do flake atual, o que de fato é possível. No entanto, o Manual do
> Nix não fornece nenhuma explicação para isso, e é considerado um detalhe de
> implementação interna dos flakes. Não é recomendado usar isso em seu próprio código!

## 4. Introdução Simples à Função `nixpkgs.lib.nixosSystem` {#simple-introduction-to-nixpkgs-lib-nixos-system}

**Um Flake pode depender de outros Flakes para utilizar as funcionalidades que eles
fornecem.**

Por padrão, um flake procura por um arquivo `flake.nix` no diretório raiz de cada uma de
suas dependências (ou seja, cada item em `inputs`) e avalia de forma preguiçosa suas
funções `outputs`. Em seguida, ele passa o attribute set retornado por essas funções como
argumentos para sua própria função `outputs`, permitindo-nos usar as funcionalidades
fornecidas pelos outros flakes dentro do nosso flake atual.

Mais precisamente, a avaliação da função `outputs` para cada dependência é preguiçosa.
Isso significa que a função `outputs` de um flake só é avaliada quando é realmente usada,
evitando assim cálculos desnecessários e melhorando a eficiência.

A descrição acima pode ser um pouco confusa, então vamos analisar o processo com o exemplo
de `flake.nix` usado nesta seção. Nosso `flake.nix` declara a dependência
`inputs.nixpkgs`, de modo que o [nixpkgs/flake.nix] será avaliado quando executarmos o
comando `sudo nixos-rebuild switch`.

Do código-fonte do repositório Nixpkgs, podemos ver que sua definição de saídas de flake
inclui o atributo `lib`, e em nosso exemplo, usamos a função `nixosSystem` do atributo
`lib` para configurar nosso sistema NixOS:

```nix{8-13}
{
  inputs = {
    # Fonte oficial de pacotes NixOS, aqui usando o ramo nixos-25.05
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ./configuration.nix
      ];
    };
  };
}
```

O attribute set que segue `nixpkgs.lib.nixosSystem` é o parâmetro da função. Definimos
apenas dois parâmetros aqui:

1. `system`: Este é direto, é o parâmetro de arquitetura do sistema.
2. `modules`: Esta é uma lista de módulos, onde a configuração real do sistema NixOS é
   definida. O próprio arquivo de configuração `/etc/nixos/configuration.nix` é um Módulo
   Nixpkgs, então ele pode ser diretamente adicionado à lista `modules` para ser usado.

Compreender estes conceitos básicos é suficiente para iniciantes. Explorar a função
`nixpkgs.lib.nixosSystem` em detalhes requer um entendimento do sistema de módulos do
Nixpkgs. Leitores que concluíram a seção
[Modularizando a Configuração do NixOS](./modularize-the-configuration.md) podem retornar
ao [nixpkgs/flake.nix] para encontrar a definição de `nixpkgs.lib.nixosSystem`, rastrear
seu código-fonte e estudar sua implementação.

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
