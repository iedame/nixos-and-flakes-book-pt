# Modularizando a Configuração

Neste ponto, o esqueleto de todo o sistema está configurado. A estrutura de configuração
atual em `/etc/nixos` deve ser a seguinte:

```
$ tree
.
├── flake.lock
├── flake.nix
├── home.nix
└── configuration.nix
```

As funções desses quatro arquivos são:

- `flake.lock`: Um arquivo de bloqueio de versão gerado automaticamente, que registra
  todas as fontes de entrada, valores de hash e números de versão de todo o flake para
  garantir a reprodutibilidade.
- `flake.nix`: O arquivo de entrada que será reconhecido e implantado ao executar
  `sudo nixos-rebuild switch`. Veja
  [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes) para todas as opções de
  `flake.nix`.
- `configuration.nix`: Importado como um módulo Nix em flake.nix. Toda a configuração em
  nível de sistema está atualmente escrita aqui. Veja
  [Configuração - Manual do NixOS](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
  para todas as opções de configuration.nix.
- `home.nix`: Importado pelo Home-Manager como a configuração do usuário `ryan` em
  flake.nix, contendo toda a configuração de `ryan` e gerenciando a pasta home de `ryan`.
  Veja
  [Apêndice A. Opções de Configuração - Home-Manager](https://nix-community.github.io/home-manager/options.xhtml)
  para todas as opções de home.nix.

Ao modificar esses arquivos, você pode mudar declarativamente o estado do sistema e do
diretório home.

No entanto, à medida que a configuração cresce, depender apenas de `configuration.nix` e
`home.nix` pode levar a arquivos inchados e difíceis de manter. Uma solução melhor é usar
o sistema de módulos do Nix para dividir a configuração em múltiplos módulos Nix e
escrevê-los de forma classificada.

A linguagem Nix fornece uma
[função import](https://nix.dev/tutorials/nix-language.html#import) com uma regra
especial:

> Se o parâmetro de `import` for um caminho de pasta, ele retornará o resultado da
> execução do arquivo `default.nix` nessa pasta.

O sistema de módulos do Nixpkgs fornece um parâmetro similar, `imports`, que aceita uma
lista de arquivos `.nix` e **mescla** toda a configuração definida nesses arquivos no
módulo Nix atual.

Note que `imports` não irá simplesmente sobrescrever configurações duplicadas, mas irá
tratá-las de forma mais razoável. Por exemplo, se `program.packages = [...]` for definido
em múltiplos módulos, então `imports` irá mesclar todos os `program.packages` definidos em
todos os módulos Nix em uma única lista. Attribute sets também podem ser mesclados
corretamente. O comportamento específico pode ser explorado por você mesmo.

> Eu só encontrei uma descrição de `imports` em
> [Manual Oficial do Nixpkgs-Unstable - Parâmetros evalModules](https://nixos.org/manual/nixpkgs/unstable/#module-system-lib-evalModules-parameters):
> `Uma lista de módulos. Estes são mesclados para formar a configuração final.` É um pouco
> ambíguo...

Com a ajuda de `imports`, podemos dividir `home.nix` e `configuration.nix` em múltiplos
módulos Nix definidos em diferentes arquivos `.nix`. Vamos ver um exemplo de módulo
chamado `packages.nix`:

```nix
{
  config,
  pkgs,
  ...
}: {
  imports = [
    (import ./special-fonts-1.nix {inherit config pkgs;}) # (1)
    ./special-fonts-2.nix # (2)
  ];

  fontconfig.enable = true;
}
```

Este módulo carrega outros dois módulos na seção imports, a saber, `special-fonts-1.nix` e
`special-fonts-2.nix`. Ambos os arquivos são módulos por si mesmos e se parecem com isso:

```nix
{ config, pkgs, ...}: {
    # Configurações ...
}
```

Ambas as declarações de import acima são equivalentes nos parâmetros que recebem:

- A declaração `(1)` importa a função em `special-fonts-1.nix` e a chama passando
  `{config = config; pkgs = pkgs}`. Basicamente, usa o valor de retorno da chamada (outro
  attribute set de configuração parcial) dentro da lista `imports`.

- A declaração `(2)` define um caminho para um módulo, cuja função o Nix carregará
  automaticamente ao montar a configuração `config`. Ele passará todos os argumentos
  correspondentes da função em `packages.nix` para a função carregada em
  `special-fonts-2.nix`, o que resulta em
  `import ./special-fonts-2.nix {config = config; pkgs = pkgs}`.

Aqui está um bom exemplo inicial de modularização da configuração, altamente recomendado:

- [Misterio77/nix-starter-configs](https://github.com/Misterio77/nix-starter-configs)

Um exemplo mais complicado,
[ryan4yin/nix-config/i3-kickstarter](https://github.com/ryan4yin/nix-config/tree/i3-kickstarter),
é a configuração do meu sistema NixOS anterior com o gerenciador de janelas i3. Sua
estrutura é a seguinte:

```shell
├── flake.lock
├── flake.nix
├── home
│   ├── default.nix         # aqui importamos todos os submódulos por imports = [...]
│   ├── fcitx5              # configuração do método de entrada fcitx5
│   │   ├── default.nix
│   │   └── rime-data-flypy
│   ├── i3                  # configuração do gerenciador de janelas i3
│   │   ├── config
│   │   ├── default.nix
│   │   ├── i3blocks.conf
│   │   ├── keybindings
│   │   └── scripts
│   ├── programs
│   │   ├── browsers.nix
│   │   ├── common.nix
│   │   ├── default.nix   # aqui importamos todos os módulos na pasta programs por imports = [...]
│   │   ├── git.nix
│   │   ├── media.nix
│   │   ├── vscode.nix
│   │   └── xdg.nix
│   ├── rofi              #  configuração do lançador rofi
│   │   ├── configs
│   │   │   ├── arc_dark_colors.rasi
│   │   │   ├── arc_dark_transparent_colors.rasi
│   │   │   ├── power-profiles.rasi
│   │   │   ├── powermenu.rasi
│   │   │   ├── rofidmenu.rasi
│   │   │   └── rofikeyhint.rasi
│   │   └── default.nix
│   └── shell            # configuração relacionada a shell/terminal
│       ├── common.nix
│       ├── default.nix
│       ├── nushell
│       │   ├── config.nu
│       │   ├── default.nix
│       │   └── env.nu
│       ├── starship.nix
│       └── terminals.nix
├── hosts
│   ├── msi-rtx4090      # Configuração da minha máquina principal
│   │   ├── default.nix  # Este é o antigo configuration.nix, mas a maior parte do conteúdo foi dividida em módulos.
│   │   └── hardware-configuration.nix  # configuração relacionada a hardware e disco, gerada automaticamente pelo nixos
│   └── my-nixos       # configuração da minha máquina de teste
│       ├── default.nix
│       └── hardware-configuration.nix
├── modules          # alguns módulos NixOS comuns que podem ser reutilizados
│   ├── i3.nix
│   └── system.nix
└── wallpaper.jpg    # papel de parede
```

Não há necessidade de seguir a estrutura acima. Você pode organizar sua configuração da
maneira que preferir. A chave é usar `imports` para importar todos os submódulos para o
módulo principal.

## `lib.mkOverride`, `lib.mkDefault` e `lib.mkForce`

No Nix, algumas pessoas usam `lib.mkDefault` e `lib.mkForce` para definir valores. Essas
funções são projetadas para definir valores padrão ou forçar valores de opções.

Você pode explorar o código-fonte de `lib.mkDefault` e `lib.mkForce` executando
`nix repl -f '<nixpkgs>'` e, em seguida, digitando `:e lib.mkDefault`. Para saber mais
sobre `nix repl`, digite `:?` para a informação de ajuda.

Aqui está o código-fonte:

```nix
  # ......

  mkOverride = priority: content:
    { _type = "override";
      inherit priority content;
    };

  mkOptionDefault = mkOverride 1500; # priority of option defaults
  mkDefault = mkOverride 1000; # used in config sections of non-user modules to set a default
  mkImageMediaOverride = mkOverride 60; # image media profiles can be derived by inclusion into host config, hence needing to override host config, but do allow user to mkForce
  mkForce = mkOverride 50;
  mkVMOverride = mkOverride 10; # used by ‘nixos-rebuild build-vm’

  # ......
```

Em resumo, `lib.mkDefault` é usado para definir valores padrão de opções com uma
prioridade de 1000 internamente, e `lib.mkForce` é usado para forçar valores de opções com
uma prioridade de 50 internamente. Se você definir um valor de uma opção diretamente, ele
será definido com uma prioridade padrão de 1000, a mesma de `lib.mkDefault`.

Quanto menor o valor de `priority`, maior a prioridade real. Como resultado, `lib.mkForce`
tem uma prioridade maior que `lib.mkDefault`. Se você definir múltiplos valores com a
mesma prioridade, o Nix irá lançar um erro.

Usar essas funções pode ser muito útil para modularizar a configuração. Você pode definir
valores padrão em um módulo de baixo nível (módulo base) e forçar valores em um módulo de
alto nível.

Por exemplo, na minha configuração em
[ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-server.nix](https://github.com/ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-server.nix#L32),
eu defino valores padrão assim:

```nix{6}
{ lib, pkgs, ... }:

{
  # ......

  nixpkgs.config.allowUnfree = lib.mkDefault false;

  # ......
}
```

Em seguida, para minha máquina desktop, eu sobrescrevo o valor em
[ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-desktop.nix](https://github.com/ryan4yin/nix-config/blob/c515ea9/modules/nixos/core-desktop.nix#L18)
assim:

```nix{10}
{ lib, pkgs, ... }:

{
  # importa o módulo base
  imports = [
    ./core-server.nix
  ];

  # sobrescreve o valor padrão definido no módulo base
  nixpkgs.config.allowUnfree = lib.mkForce true;

  # ......
}
```

## `lib.mkOrder`, `lib.mkBefore` e `lib.mkAfter`

Além de `lib.mkDefault` e `lib.mkForce`, também existem `lib.mkBefore` e `lib.mkAfter`,
que são usados para definir a ordem de mesclagem de **opções do tipo lista**. Essas
funções contribuem ainda mais para a modularização da configuração.

> Não encontrei a documentação oficial para opções do tipo lista, mas entendo que são
> tipos cujos resultados de mesclagem estão relacionados à ordem da mesclagem. De acordo
> com este entendimento, tanto os tipos `list` quanto `string` são opções do tipo lista, e
> essas funções podem de fato ser usadas nesses dois tipos na prática.

Como mencionado anteriormente, quando você define múltiplos valores com a mesma
**prioridade de sobrescrita**, o Nix irá lançar um erro. No entanto, usando `lib.mkOrder`,
`lib.mkBefore` ou `lib.mkAfter`, você pode definir múltiplos valores com a mesma
prioridade de sobrescrita, e eles serão mesclados na ordem que você especificar.

Para examinar o código-fonte de `lib.mkBefore`, você pode executar
`nix repl -f '<nixpkgs>'` e, em seguida, digitar `:e lib.mkBefore`. Para saber mais sobre
`nix repl`, digite `:?` para a informação de ajuda:

```nix
  # ......

  mkOrder = priority: content:
    { _type = "order";
      inherit priority content;
    };

  mkBefore = mkOrder 500;
  defaultOrderPriority = 1000;
  mkAfter = mkOrder 1500;

  # ......
```

Portanto, `lib.mkBefore` é um atalho para `lib.mkOrder 500`, e `lib.mkAfter` is a um
atalho para `lib.mkOrder 1500`.

Para testar o uso de `lib.mkBefore` e `lib.mkAfter`, vamos criar um projeto Flake simples:

```nix{10-38}
# flake.nix
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  outputs = {nixpkgs, ...}: {
    nixosConfigurations = {
      "my-nixos" = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";

        modules = [
          ({lib, ...}: {
            programs.bash.shellInit = lib.mkBefore ''
              echo 'insert before default'
            '';
            programs.zsh.shellInit = lib.mkBefore "echo 'insert before default';";
            nix.settings.substituters = lib.mkBefore [
              "https://nix-community.cachix.org"
            ];
          })

          ({lib, ...}: {
            programs.bash.shellInit = lib.mkAfter ''
              echo 'insert after default'
            '';
            programs.zsh.shellInit = lib.mkAfter "echo 'insert after default';";
            nix.settings.substituters = lib.mkAfter [
              "https://ryan4yin.cachix.org"
            ];
          })

          ({lib, ...}: {
            programs.bash.shellInit = ''
              echo 'this is default'
            '';
            programs.zsh.shellInit = "echo 'this is default';";
            nix.settings.substituters = [
              "https://nix-community.cachix.org"
            ];
          })
        ];
      };
    };
  };
}
```

O flake acima contém o uso de `lib.mkBefore` e `lib.mkAfter` em strings de múltiplas
linhas, strings de linha única e listas. Vamos testar os resultados:

```bash
# Exemplo 1: mesclagem de string de múltiplas linhas
› echo $(nix eval .#nixosConfigurations.my-nixos.config.programs.bash.shellInit)
trace: warning: system.stateVersion is not set, defaulting to 25.05. Read why this matters on https://nixos.org/manual/nixos/stable/options.html#opt-system.stateVersio
n.
"echo 'insert before default'

echo 'this is default'

if [ -z \"$__NIXOS_SET_ENVIRONMENT_DONE\" ]; then
 . /nix/store/60882lm9znqdmbssxqsd5bgnb7gybaf2-set-environment
fi



echo 'insert after default'
"

# exemplo 2: mesclagem de string de linha única
› echo $(nix eval .#nixosConfigurations.my-nixos.config.programs.zsh.shellInit)
"echo 'insert before default';
echo 'this is default';
echo 'insert after default';"

# Exemplo 3: mesclagem de lista
› nix eval .#nixosConfigurations.my-nixos.config.nix.settings.substituters
[ "https://nix-community.cachix.org" "https://nix-community.cachix.org" "https://cache.nixos.org/" "https://ryan4yin.cachix.org" ]

```

Como você pode ver, `lib.mkBefore` e `lib.mkAfter` podem definir a ordem de mesclagem de
strings de múltiplas linhas, strings de linha única e listas. A ordem de mesclagem é a
mesma da ordem de definição.

> Para uma introdução mais aprofundada ao sistema de módulos, consulte
> [Sistema de Módulos e Opções Customizadas](../other-usage-of-flakes/module-system.md).

## Referências

- [Nix modules: Improving Nix's discoverability and usability](https://cfp.nixcon.org/nixcon2020/talk/K89WJY/)
- [Module System - Nixpkgs](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/doc/module-system/module-system.chapter.md)
