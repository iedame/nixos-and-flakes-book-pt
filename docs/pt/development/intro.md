# Ambientes de Desenvolvimento no NixOS

A reprodutibilidade do NixOS o torna ideal para a construção de ambientes de
desenvolvimento. No entanto, se você está acostumado com outras distribuições (distros),
pode encontrar problemas porque o NixOS tem sua própria lógica. Explicaremos brevemente
isso a seguir.

Nas seções seguintes, introduziremos como o ambiente de desenvolvimento funciona no NixOS.

## Criando um Ambiente de Shell Personalizado com `nix shell`

A maneira mais simples de criar um ambiente de desenvolvimento é usar o `nix shell`. O
`nix shell` criará um ambiente de shell com o pacote Nix especificado instalado.

Aqui está um exemplo:

```shell
# hello não está disponível
› hello
hello: command not found

# Entrar em um ambiente com os pacotes 'hello' e `cowsay`
› nix shell nixpkgs#hello nixpkgs#cowsay

# hello agora está disponível
› hello
Hello, world!

# cowsay também está disponível
› cowsay "Hello, world!"
 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

O `nix shell` é muito útil quando você apenas quer testar alguns pacotes ou criar
rapidamente um ambiente limpo.

## Criando um Ambiente de Desenvolvimento

O `nix shell` é simples e fácil de usar, mas não é muito flexível. Para um ambiente de
desenvolvimento mais complexo, precisamos usar `pkgs.mkShell` e `nix develop`.

Podemos criar um ambiente de desenvolvimento usando `pkgs.mkShell { ... }` e abrir um
shell Bash interativo desse ambiente de desenvolvimento usando `nix develop`.

Para ver como o `pkgs.mkShell` funciona, vamos dar uma olhada
[em seu código-fonte](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/build-support/mkshell/default.nix).

```nix
{ lib, stdenv, buildEnv }:

# Uma espécie especial de derivação que se destina apenas a ser consumida pelo
# nix-shell.
{ name ? "nix-shell"
, # uma lista de pacotes a serem adicionados ao ambiente do shell
  packages ? [ ]
, # propaga todas as entradas das derivações fornecidas
  inputsFrom ? [ ]
, buildInputs ? [ ]
, nativeBuildInputs ? [ ]
, propagatedBuildInputs ? [ ]
, propagatedNativeBuildInputs ? [ ]
, ...
}@attrs:
let
  mergeInputs = name:
    (attrs.${name} or [ ]) ++
    (lib.subtractLists inputsFrom (lib.flatten (lib.catAttrs name inputsFrom)));

  rest = builtins.removeAttrs attrs [
    "name"
    "packages"
    "inputsFrom"
    "buildInputs"
    "nativeBuildInputs"
    "propagatedBuildInputs"
    "propagatedNativeBuildInputs"
    "shellHook"
  ];
in

stdenv.mkDerivation ({
  inherit name;

  buildInputs = mergeInputs "buildInputs";
  nativeBuildInputs = packages ++ (mergeInputs "nativeBuildInputs");
  propagatedBuildInputs = mergeInputs "propagatedBuildInputs";
  propagatedNativeBuildInputs = mergeInputs "propagatedNativeBuildInputs";

  shellHook = lib.concatStringsSep "\n" (lib.catAttrs "shellHook"
    (lib.reverseList inputsFrom ++ [ attrs ]));

  phases = [ "buildPhase" ];

  # ......

  # quando a construção distribuída está habilitada, prefira construir localmente
  preferLocalBuild = true;
} // rest)
```

`pkgs.mkShell { ... }` é uma derivação (derivation) especial (pacote Nix). Seu `name`,
`buildInputs` e outros parâmetros são personalizáveis, e `shellHook` é um parâmetro
especial que será executado quando `nix develop` entrar no ambiente.

Aqui está um `flake.nix` que define um ambiente de desenvolvimento com o Node.js 18
instalado:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # o sistema deve corresponder ao sistema em que você está rodando
    # system = "x86_64-linux";
    system = "x86_64-darwin";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs {
        inherit system;
      };
    in pkgs.mkShell {
      # criar um ambiente com nodejs_18, pnpm e yarn
      packages = with pkgs; [
        nodejs_18
        nodePackages.pnpm
        (yarn.override { nodejs = nodejs_18; })
      ];

      shellHook = ''
        echo "node `node --version`"
      '';
    };
  };
}
```

Crie uma pasta vazia, salve a configuração acima como `flake.nix` e, em seguida, execute
`nix develop` (ou, mais precisamente, você pode usar `nix develop .#default`), A versão
atual do nodejs será exibida, e agora você pode usar `node`, `pnpm` e `yarn` sem
problemas.

## Usando zsh/fish/... em vez de bash

O `pkgs.mkShell` usa `bash` por padrão, mas você também pode usar `zsh` ou `fish`
adicionando `exec <your-shell>` no `shellHook`.

Aqui está um exemplo:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # o sistema deve corresponder ao sistema em que você está rodando
    # system = "x86_64-linux";
    system = "x86_64-darwin";
  in {
    devShells."${system}".default = let
      pkgs = import nixpkgs {
        inherit system;
      };
    in pkgs.mkShell {
      # criar um ambiente com nodejs_18, pnpm e yarn
      packages = with pkgs; [
        nodejs_18
        nodePackages.pnpm
        (yarn.override { nodejs = nodejs_18; })
        nushell
      ];

      shellHook = ''
        echo "node `node --version`"
        exec nu
      '';
    };
  };
}
```

Com a configuração acima, o `nix develop` entrará no ambiente REPL do nushell.

## Criando um Ambiente de Desenvolvimento com `pkgs.runCommand`

A derivação criada pelo `pkgs.mkShell` não pode ser usada diretamente, mas deve ser
acessada via `nix develop`.

É realmente possível criar um wrapper de shell contendo os pacotes necessários via
`pkgs.stdenv.mkDerivation`, que pode então ser executado diretamente no ambiente.

Usar `mkDerivation` diretamente é um pouco complicado, e o Nixpkgs fornece algumas funções
mais simples para nos ajudar a criar esses wrappers, como `pkgs.runCommand`.

Exemplo:

```nix
{
  description = "A Nix-flake-based Node.js development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
  };

  outputs = { self , nixpkgs ,... }: let
    # o sistema deve corresponder ao sistema em que você está rodando
    # system = "x86_64-linux";
    system = "x86_64-darwin";
  in {
    packages."${system}".dev = let
      pkgs = import nixpkgs {
        inherit system;
      };
      packages = with pkgs; [
          nodejs_20
          nodePackages.pnpm
          nushell
      ];
    in pkgs.runCommand "dev-shell" {
      # Dependências que devem existir no ambiente de tempo de execução
      buildInputs = packages;
      # Dependências que só devem existir no ambiente de construção
      nativeBuildInputs = [ pkgs.makeWrapper ];
    } ''
      mkdir -p $out/bin/
      ln -s ${pkgs.nushell}/bin/nu $out/bin/dev-shell
      wrapProgram $out/bin/dev-shell --prefix PATH : ${pkgs.lib.makeBinPath packages}
    '';
  };
}
```

Em seguida, execute `nix run .#dev` ou `nix shell .#dev --command 'dev-shell'`, Você
entrará em uma sessão do nushell, onde poderá usar os comandos `node` e `pnpm`
normalmente, e a versão do node será a 20.

O wrapper gerado desta forma é um arquivo executável, que na verdade não depende do
comando `nix run` ou `nix shell`.

Por exemplo, podemos instalar diretamente este wrapper através do
`environment.systemPackages` do NixOS e, em seguida, executá-lo diretamente:

```nix
{pkgs, lib, ...}:{

  environment.systemPackages = [
    # Instalar o wrapper no sistema
    (let
      packages = with pkgs; [
          nodejs_20
          nodePackages.pnpm
          nushell
      ];
    in pkgs.runCommand "dev-shell" {
      # Dependências que devem existir no ambiente de tempo de execução
      buildInputs = packages;
      # Dependências que só devem existir no ambiente de construção
      nativeBuildInputs = [ pkgs.makeWrapper ];
    } ''
      mkdir -p $out/bin/
      ln -s ${pkgs.nushell}/bin/nu $out/bin/dev-shell
      wrapProgram $out/bin/dev-shell --prefix PATH : ${pkgs.lib.makeBinPath packages}
    '')
  ];
}
```

Adicione a configuração acima a qualquer Módulo NixOS, em seguida, implante-a com
`sudo nixos-rebuild switch`, e você poderá entrar no ambiente de desenvolvimento
diretamente com o comando `dev-shell`, que é a característica especial de
`pkgs.runCommand` em comparação com `pkgs.mkShell`.

Código-fonte relacionado:

- [pkgs/build-support/trivial-builders/default.nix - runCommand](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/trivial-builders/default.nix#L21-L49)
- [pkgs/build-support/setup-hooks/make-wrapper.sh](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/setup-hooks/make-wrapper.sh)

## Entrar no Ambiente de Construção de Qualquer Pacote Nix

Agora vamos dar uma olhada em `nix develop`. Primeiro, leia a documentação de ajuda
exibida por `nix develop --help`:

```
Name
    nix develop - run a bash shell that provides the build environment of a derivation

Synopsis
    nix develop [option...] installable
# ......
```

Ele nos diz que `nix develop` aceita um parâmetro `installable`, o que significa que
podemos entrar no ambiente de desenvolvimento de qualquer pacote Nix instalável através
dele, não apenas o ambiente criado por `pkgs.mkShell`.

Por padrão, `nix develop`tentará usar os seguintes atributos nas saídas do flake:

- `devShells.<system>.default`
- `packages.<system>.default`

Se usarmos `nix develop /path/to/flake#<name>` para especificar o endereço do pacote flake
e o nome da saída do flake, então `nix develop` tentará os seguintes atributos nas saídas
do flake:

- `devShells.<system>.<name>`
- `packages.<system>.<name>`
- `legacyPackages.<system>.<name>`

Agora vamos testá-lo. Primeiro, teste para confirmar que não temos `c++`, `g++` e outros
comandos relacionados à compilação no ambiente atual:

```shell
ryan in 🌐 aquamarine in ~
› c++
c++: command not found

ryan in 🌐 aquamarine in ~
› g++
g++: command not found
```

Em seguida, use `nix develop` para entrar no ambiente de construção do pacote `hello` no
`nixpkgs`:

```shell
# logar no ambiente de construção do pacote `hello`
ryan in 🌐 aquamarine in ~
› nix develop nixpkgs#hello

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› env | grep CXX
CXX=g++

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› c++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

ryan in 🌐 aquamarine in ~ via ❄️  impure (hello-2.12.1-env)
› g++ --version
g++ (GCC) 12.3.0
Copyright (C) 2022 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

Podemos ver que a variável de ambiente `CXX` foi definida e que os comandos `c++`, `g++` e
outros agora podem ser usados normalmente.

Além disso, também podemos chamar cada fase de construção do pacote `hello` normalmente:

> A ordem de execução padrão de todas as fases de construção de um pacote Nix é:
> `$prePhases unpackPhase patchPhase $preConfigurePhases configurePhase $preBuildPhases buildPhase checkPhase $preInstallPhases installPhase fixupPhase installCheckPhase $preDistPhases distPhase $postPhases`

```shell
# descompactar o código-fonte
ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› unpackPhase
unpacking source archive /nix/store/pa10z4ngm0g83kx9mssrqzz30s84vq7k-hello-2.12.1.tar.gz
source root is hello-2.12.1
setting SOURCE_DATE_EPOCH to timestamp 1653865426 of file hello-2.12.1/ChangeLog

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› ls
hello-2.12.1

ryan in 🌐 aquamarine in /tmp/xxx via ❄️  impure (hello-2.12.1-env)
› cd hello-2.12.1/

# gerar Makefile
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via ❄️  impure (hello-2.12.1-env)
› configurePhase
configure flags: --prefix=/tmp/xxx/outputs/out --prefix=/tmp/xxx/outputs/out
checking for a BSD-compatible install... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/install -c
checking whether build environment is sane... yes
checking for a thread-safe mkdir -p... /nix/store/02dr9ymdqpkb75vf0v1z2l91z2q3izy9-coreutils-9.3/bin/mkdir -p
checking for gawk... gawk
checking whether make sets $(MAKE)... yes
checking whether make supports nested variables... yes
checking for gcc... gcc
# ......
checking that generated files are newer than configure... done
configure: creating ./config.status
config.status: creating Makefile
config.status: creating po/Makefile.in
config.status: creating config.h
config.status: config.h is unchanged
config.status: executing depfiles commands
config.status: executing po-directories commands
config.status: creating po/POTFILES
config.status: creating po/Makefile

# construir o pacote
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env) took 2s
› buildPhase
build flags: SHELL=/run/current-system/sw/bin/bash
make  all-recursive
make[1]: Entering directory '/tmp/xxx/hello-2.12.1'
# ......
ranlib lib/libhello.a
gcc  -g -O2   -o hello src/hello.o  ./lib/libhello.a
make[2]: Leaving directory '/tmp/xxx/hello-2.12.1'
make[1]: Leaving directory '/tmp/xxx/hello-2.12.1'

# rodar o programa construído
ryan in 🌐 aquamarine in /tmp/xxx/hello-2.12.1 via C v12.3.0-gcc via ❄️  impure (hello-2.12.1-env)
› ./hello
Hello, world!
```

Esse uso é principalmente para depurar o processo de construção de um pacote Nix, ou para
executar alguns comandos no ambiente de construção de um pacote Nix.

## `nix build`

O comando `nix build` é usado para construir um pacote de software e cria um link
simbólico (symbolic link) chamado `result` no diretório atual, que aponta para o resultado
da construção.

Aqui está um exemplo:

```bash
# Construir o pacote 'ponysay' do flake 'nixpkgs'
nix build "nixpkgs#ponysay"
# Usar o comando 'ponysay' construído
› ./result/bin/ponysay 'hey buddy!'
 ____________
< hey buddy! >
 ------------
     \
      \
       \
       ▄▄  ▄▄ ▄ ▄
    ▀▄▄▄█▄▄▄▄▄█▄▄▄
   ▀▄███▄▄██▄██▄▄██
  ▄██▄███▄▄██▄▄▄█▄██
 █▄█▄██▄█████████▄██
  ▄▄█▄█▄▄▄▄▄████████
 ▀▀▀▄█▄█▄█▄▄▄▄▄█████         ▄   ▄
    ▀▄████▄▄▄█▄█▄▄██       ▄▄▄▄▄█▄▄▄
    █▄██▄▄▄▄███▄▄▄██    ▄▄▄▄▄▄▄▄▄█▄▄
    ▀▄▄██████▄▄▄████    █████████████
       ▀▀▀▀▀█████▄▄ ▄▄▄▄▄▄▄▄▄▄██▄█▄▄▀
            ██▄███▄▄▄▄█▄▄▀  ███▄█▄▄▄█▀
            █▄██▄▄▄▄▄████   ███████▄██
            █▄███▄▄█████    ▀███▄█████▄
            ██████▀▄▄▄█▄█    █▄██▄▄█▄█▄
           ███████ ███████   ▀████▄████
           ▀▀█▄▄▄▀ ▀▀█▄▄▄▀     ▀██▄▄██▀█
                                ▀  ▀▀█
```

## Usando `nix profile` para gerenciar Ambientes de Desenvolvimento e Ambientes de Entretenimento

`nix develop` é uma ferramenta para criar e gerenciar múltiplos ambientes de usuário e
alternar para diferentes ambientes quando necessário.

Ao contrário do `nix develop`, o `nix profile` gerencia o ambiente de sistema do usuário,
em vez de criar um ambiente de shell temporário. Portanto, é mais compatível com IDEs como
JetBrains IDE/VSCode e não terá o problema de não conseguir usar o ambiente de
desenvolvimento configurado na IDE.

TODO: Isso está em andamento. Precisa ser revisado.

## Outros Comandos

Existem outros comandos como `nix flake init`, que você pode explorar em [New Nix
Commands][New Nix Commands]. Para informações mais detalhadas, por favor, consulte a
documentação.

## Referências

- [pkgs.mkShell - nixpkgs manual](https://nixos.org/manual/nixpkgs/stable/#sec-pkgs-mkShell)
- [A minimal nix-shell](https://fzakaria.com/2021/08/02/a-minimal-nix-shell.html)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- [One too many shell, Clearing up with nix' shells nix shell and nix-shell - Yannik Sander](https://blog.ysndr.de/posts/guides/2021-12-01-nix-shells/)
- [Shell Scripts - NixOS Wiki](https://wiki.nixos.org/wiki/Shell_Scripts)

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
