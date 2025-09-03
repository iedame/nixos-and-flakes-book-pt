# Depurando Derivations e Nix Expressions

## Exibir mensagens de erro detalhadas

Você pode sempre tentar adicionar `--show-trace --print-build-logs --verbose` ao comando
`nixos-rebuild` para obter a mensagem de erro detalhada se encontrar algum problema
durante o deployment. Por exemplo:

```bash
cd /etc/nixos
sudo nixos-rebuild switch --flake .#myhost --show-trace --print-build-logs --verbose

# Versão mais concisa
sudo nixos-rebuild switch --flake .#myhost --show-trace -L -v
```

## Depurando com `nix repl`

> NOTA: Se você desabilitou o `NIX_PATH`, você não conseguirá usar a sintaxe como
> `<nixpkgs>`. Em vez disso, você deve usar `nix repl -f flake:nixpkgs` para carregar o
> nixpkgs.

Usamos frequentemente o nix repl `<nixpkgs>` ao longo deste guia para examinar o
código-fonte. É uma ferramenta poderosa que nos ajuda a entender como as coisas funcionam
no Nix.`

Vamos dar uma olhada mais de perto na mensagem de ajuda do nix repl:

```shell
› nix repl -f '<nixpkgs>'
Bem-vindo(a) ao Nix 2.13.3. Digite :? para ajuda.

Carregando instalável ''...
Adicionadas 17755 variáveis.
nix-repl> :?
Os seguintes comandos estão disponíveis:

  <expr>        Avaliar e exibir expressão
  <x> = <expr>  Associar expressão a uma variável
  :a <expr>     Adicionar atributos do conjunto resultante ao escopo
  :b <expr>     Construir uma derivação
  :bl <expr>    Construir uma derivação, criando raízes de GC no diretório de trabalho
  :e <expr>     Abrir pacote ou função no $EDITOR
  :i <expr>     Construir derivação, depois instalar o resultado no perfil atual
  :l <path>     Carregar expressão do Nix e adicioná-la ao escopo
  :lf <ref>     Carregar o Nix flake e adicioná-lo ao escopo
  :p <expr>     Avaliar e exibir expressão recursivamente
  :q            Sair do nix-repl
  :r            Recarregar todos os arquivos
  :sh <expr>    Construir as dependências da derivação e, depois, iniciar o nix-shell
  :t <expr>     Descrever resultado da avaliação
  :u <expr>     Construir a derivação, depois iniciar o nix-shell
  :doc <expr>   Exibir documentação de uma função embutida
  :log <expr>   Exibir logs de uma derivação
  :te [bool]    Habilitar, desabilitar ou alternar a exibição de rastros para erros
```

Existem algumas expressões que uso frequentemente: `:lf <ref>` e `:e <expr>`.

O comando `:e <expr>` é muito intuitivo, então não vou entrar em detalhes sobre ele. Em
vez disso, vamos focar em `:lf <ref>`:

```nix
# mude para o diretório do seu repositório nix-config
› cd ~/nix-config/

# inicie nix repl
› nix repl
Welcome to Nix 2.13.3. Type :? for help.

# carregue o meu nix flake e adicione-o ao escopo
nix-repl> :lf .
Added 16 variables.

# pressione <TAB> para ver o que temos no escopo
nix-repl><TAB>
# ......omitindo algumas saídas (outputs)
__isInt                          nixosConfigurations
__isList                         null
__isPath                         outPath
__isString                       outputs
__langVersion                    packages
# ......omitindo algumas saídas (outputs)


# verificar o que há em inputs
nix-repl> inputs.<TAB>
inputs.agenix            inputs.nixpkgs
inputs.darwin            inputs.nixpkgs-darwin
inputs.home-manager      inputs.nixpkgs-unstable
inputs.hyprland          inputs.nixpkgs-wayland
inputs.nil
inputs.nixos-generators

# verificar o que há em inputs.nil
nix-repl> inputs.nil.packages.
inputs.nil.packages.aarch64-darwin
inputs.nil.packages.aarch64-linux
inputs.nil.packages.x86_64-darwin
inputs.nil.packages.x86_64-linux

# verificar as saídas do meu nix flake
nix-repl> outputs.nixosConfigurations.<TAB>
outputs.nixosConfigurations.ai
outputs.nixosConfigurations.aquamarine
outputs.nixosConfigurations.kana
outputs.nixosConfigurations.ruby

nix-repl> outputs.nixosConfigurations.ai.<TAB>
outputs.nixosConfigurations.ai._module
outputs.nixosConfigurations.ai._type
outputs.nixosConfigurations.ai.class
outputs.nixosConfigurations.ai.config
outputs.nixosConfigurations.ai.extendModules
outputs.nixosConfigurations.ai.extraArgs
outputs.nixosConfigurations.ai.options
outputs.nixosConfigurations.ai.pkgs
outputs.nixosConfigurations.ai.type

nix-repl> outputs.nixosConfigurations.ai.config.
outputs.nixosConfigurations.ai.config.age
outputs.nixosConfigurations.ai.config.appstream
outputs.nixosConfigurations.ai.config.assertions
outputs.nixosConfigurations.ai.config.boot
outputs.nixosConfigurations.ai.config.console
outputs.nixosConfigurations.ai.config.containers
# ......omitindo algumas saídas (outputs)

nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activation
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.activationPackage
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.emptyActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableDebugInfo
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.enableNixpkgsReleaseCheck
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraActivationPath
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraBuilderCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraOutputsToInstall
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.extraProfileCommands
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file
# ......omitindo algumas saídas (outputs)


nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.BROWSER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.DELTA_PAGER
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.EDITOR
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
# ......omitindo algumas saídas (outputs)

# verificar o valor de TERM
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.sessionVariables.TERM
"xterm-256color"


# verificar todos os arquivos definidos por `home.file`
nix-repl> outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file.<TAB>
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bash_profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..bashrc
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/fcitx5/profile-bak
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/config
outputs.nixosConfigurations.ai.config.home-manager.users.ryan.home.file..config/i3/i3blocks.conf
#......
```

Como você pode ver, depois de carregar seu Nix flake no REPL, você pode verificar cada
atributo do flake. Essa capacidade é muito conveniente para fins de depuração.

## Funções de depuração fornecidas por nixpkgs

TODO

## Depuração usando `NIX_DEBUG` em derivação

TODO

## Referências

- [How to make nix build display all commands executed by make?](https://www.reddit.com/r/NixOS/comments/14stdgy/how_to_make_nix_build_display_all_commands/)
  - use `NIX_DEBUG=7` em derivação
- [Collection of functions useful for debugging broken nix expressions.](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/lib/debug.nix)
