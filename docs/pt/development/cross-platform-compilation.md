# Compilação Multiplataforma

Em qualquer plataforma Linux, existem duas maneiras de fazer a compilação multiplataforma.
Por exemplo, para construir um programa `aarch64-linux` em um host `x86_64-linux`, você
pode usar os seguintes métodos:

1. Use o toolchain de compilação cruzada para compilar o programa `aarch64`.
   - A desvantagem é que você não pode usar o cache binário do NixOS e precisa compilar
     tudo sozinho (a compilação cruzada também tem um cache, mas basicamente não há nada
     nele).
   - As vantagens são que você não precisa emular o conjunto de instruções e o desempenho
     é alto.
2. Use QEMU para emular a arquitetura `aarch64` ae, em seguida, compile o programa no
   emulador.
   - A desvantagem é que o conjunto de instruções é emulado e o desempenho é ruim.
   - A vantagem é que você pode usar o cache binário do NixOS e não precisa compilar tudo
     sozinho.

Se você usar o método um, não precisa habilitar `binfmt_misc`, mas precisa executar a
compilação através do toolchain de compilação cruzada.

Se você usar o método dois, precisa habilitar o `binfmt_misc` da arquitetura `aarch64` na
configuração do NixOS da máquina de construção.

## Compilação Cruzada

O `nixpkgs` fornece um conjunto de plataformas host pré-definidas para compilação cruzada,
chamadas `pkgsCross`. Você pode explorá-las no `nix repl`.

```shell
› nix repl '<nixpkgs>'
warning: future versions of Nix will require using `--file` to load a file
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 19273 variables.
nix-repl> pkgsCross.<TAB>
pkgsCross.aarch64-android             pkgsCross.msp430
pkgsCross.aarch64-android-prebuilt    pkgsCross.musl-power
pkgsCross.aarch64-darwin              pkgsCross.musl32
pkgsCross.aarch64-embedded            pkgsCross.musl64
pkgsCross.aarch64-multiplatform       pkgsCross.muslpi
pkgsCross.aarch64-multiplatform-musl  pkgsCross.or1k
pkgsCross.aarch64be-embedded          pkgsCross.pogoplug4
pkgsCross.arm-embedded                pkgsCross.powernv
pkgsCross.armhf-embedded              pkgsCross.ppc-embedded
pkgsCross.armv7a-android-prebuilt     pkgsCross.ppc64
pkgsCross.armv7l-hf-multiplatform     pkgsCross.ppc64-musl
pkgsCross.avr                         pkgsCross.ppcle-embedded
pkgsCross.ben-nanonote                pkgsCross.raspberryPi
pkgsCross.fuloongminipc               pkgsCross.remarkable1
pkgsCross.ghcjs                       pkgsCross.remarkable2
pkgsCross.gnu32                       pkgsCross.riscv32
pkgsCross.gnu64                       pkgsCross.riscv32-embedded
pkgsCross.i686-embedded               pkgsCross.riscv64
pkgsCross.iphone32                    pkgsCross.riscv64-embedded
pkgsCross.iphone32-simulator          pkgsCross.rx-embedded
pkgsCross.iphone64                    pkgsCross.s390
pkgsCross.iphone64-simulator          pkgsCross.s390x
pkgsCross.loongarch64-linux           pkgsCross.sheevaplug
pkgsCross.m68k                        pkgsCross.vc4
pkgsCross.mingw32                     pkgsCross.wasi32
pkgsCross.mingwW64                    pkgsCross.x86_64-darwin
pkgsCross.mips-linux-gnu              pkgsCross.x86_64-embedded
pkgsCross.mips64-linux-gnuabi64       pkgsCross.x86_64-freebsd
pkgsCross.mips64-linux-gnuabin32      pkgsCross.x86_64-netbsd
pkgsCross.mips64el-linux-gnuabi64     pkgsCross.x86_64-netbsd-llvm
pkgsCross.mips64el-linux-gnuabin32    pkgsCross.x86_64-unknown-redox
pkgsCross.mipsel-linux-gnu
pkgsCross.mmix
```

Se você quiser definir o `pkgs` para um toolchain de compilação cruzada globalmente em um
flake, você só precisa adicionar um Módulo em `flake.nix`, como mostrado abaixo:

```nix{15-20}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      # native platform
      system = "x86_64-linux";
      modules = [

        # add this module, to enable cross-compilation.
        {
          nixpkgs.crossSystem = {
            # target platform
            system = "riscv64-linux";
          };
        }

        # ...... other modules
      ];
    };
  };
}
```

A opção `nixpkgs.crossSystem` é usada para definir o `pkgs` para um toolchain de
compilação cruzada, para que todo o conteúdo construído seja da arquitetura
`riscv64-linux`.

## Compilar Através de Sistema Emulado

O segundo método é fazer a compilação cruzada através do sistema emulado. Este método não
requer um toolchain de compilação cruzada.

Para usar este método, primeiro sua máquina de construção precisa habilitar o módulo
binfmt_misc na configuração. Se sua máquina de construção for NixOS, adicione a seguinte
configuração ao seu Módulo NixOS para habilitar o sistema de construção simulado das
arquiteturas `aarch64-linux` e `riscv64-linux`:

```nix{6}
{ ... }:
{
  # ......

  # Enable binfmt emulation.
  boot.binfmt.emulatedSystems = [ "aarch64-linux" "riscv64-linux" ];

  # ......
}
```

Quanto ao `flake.nix`, seu método de configuração é muito simples, ainda mais simples do
que a configuração da compilação cruzada, como mostrado abaixo:

```nix{11}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
  };

  outputs = inputs@{ self, nixpkgs, ... }: {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      # native platform
      system = "riscv64-linux";
      modules = [
        # ...... other modules
      ];
    };
  };
}
```

Você não precisa adicionar nenhum módulo adicional, apenas especifique `system` como
`riscv64-linux`. O Nix detectará automaticamente se o sistema atual é `riscv64-linux`
durante a construção. Se não for, ele construirá automaticamente através do sistema
emulado (QEMU). Para os usuários, essas operações subjacentes são completamente
transparentes.

## Linux binfmt_misc

A seção anterior apenas forneceu uma introdução sobre como usar o sistema emulado do Nix,
mas se você quiser entender os detalhes subjacentes, aqui está uma breve introdução.

`binfmt_misc` é um recurso do kernel Linux, que significa Kernel Support for miscellaneous
Binary Formats (Suporte do Kernel para Formatos Binários Diversos). Ele permite que o
Linux execute programas para quase qualquer arquitetura de CPU, incluindo X86_64, ARM64,
RISCV64 e outras.

Para habilitar o `binfmt_misc` para executar programas em vários formatos, duas coisas são
necessárias: um método de identificação específico para o formato binário e a localização
do interpretador correspondente. Embora o `binfmt_misc` pareça poderoso, sua implementação
é surpreendentemente fácil de entender. Funciona de forma semelhante à maneira como o
interpretador Bash determina o interpretador a ser usado lendo a primeira linha de um
arquivo de script (por exemplo, `#!/usr/bin/env python3`). O `binfmt_misc` define um
conjunto de regras, como ler o número mágico em um local específico no arquivo binário ou
determinar o formato do arquivo executável com base na extensão do arquivo (por exemplo,
.exe, .py). Em seguida, ele invoca o interpretador correspondente para executar o
programa. O formato de arquivo executável padrão no Linux é ELF, mas o `binfmt_misc`
expande as possibilidades de execução permitindo que uma ampla gama de arquivos binários
seja executada usando seus respectivos interpretadores.

Para registrar um formato de programa binário, você precisa escrever uma linha no formato
`:name:type:offset:magic:mask:interpreter:flags` no arquivo
`/proc/sys/fs/binfmt_misc/register`. A explicação detalhada do formato está fora do escopo
desta discussão.

Como escrever manualmente as informações de registro para `binfmt_misc` pode ser
complicado, a comunidade oferece um contêiner para auxiliar no registro automático. Este
contêiner é chamado `binfmt` e executá-lo instalará vários emuladores `binfmt_misc`. Aqui
está um exemplo:

```shell
# Register all architectures
podman run --privileged --rm tonistiigi/binfmt:latest --install all

# Register only common arm/riscv architectures
docker run --privileged --rm tonistiigi/binfmt --install arm64,riscv64,arm
```

O módulo `binfmt_misc` foi introduzido na versão 2.6.12-rc2 do Linux e passou por várias
pequenas mudanças na funcionalidade desde então. No Linux 4.8, a flag "F" (fix binary) foi
adicionada, permitindo que o interpretador seja invocado corretamente em namespaces de
montagem e ambientes chroot. Para funcionar corretamente em contêineres onde várias
arquiteturas precisam ser construídas, a flag "F" é necessária. Portanto, a versão do
kernel precisa ser 4.8 ou superior.

Em resumo, o `binfmt_misc` oferece transparência em comparação com a chamada explícita de
um interpretador para executar programas de arquitetura não nativa. Com o `binfmt_misc`,
os usuários não precisam mais se preocupar com qual interpretador usar ao executar um
programa. Ele permite que programas de qualquer arquitetura sejam executados diretamente.
A flag "F" configurável é um benefício adicional, pois carrega o programa interpretador na
memória durante a instalação e permanece inalterada por mudanças subsequentes no ambiente.

## Toolchain de Construção Personalizado

Às vezes, podemos precisar usar um toolchain personalizado para a construção, como usar
nosso próprio gcc, ou usar nosso próprio musl libc, etc. Esta modificação pode ser
alcançada através de overlays.

Por exemplo, vamos tentar usar uma versão diferente do gcc e testá-la através do
`nix repl`:

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.3. Type :? for help.

Loading installable ''...
Added 17755 variables.

# replace gcc through overlays, this will create a new instance of nixpkgs
nix-repl> a = import <nixpkgs> { crossSystem = { config = "riscv64-unknown-linux-gnu"; }; overlays = [ (self: super: { gcc = self.gcc12; }) ]; }

# check the gcc version, it is indeed changed to 12.2
nix-repl> a.pkgsCross.riscv64.stdenv.cc
«derivation /nix/store/jjvvwnf3hzk71p65x1n8bah3hrs08bpf-riscv64-unknown-linux-gnu-stage-final-gcc-wrapper-12.2.0.drv»

# take a look at the default pkgs, it is still 11.3
nix-repl> pkgs.pkgsCross.riscv64.stdenv.cc
«derivation /nix/store/pq3g0wq3yfc4hqrikr03ixmhqxbh35q7-riscv64-unknown-linux-gnu-stage-final-gcc-wrapper-11.3.0.drv»
```

Então, como usar este método em Flakes? O exemplo de `flake.nix` é o seguinte:

```nix{13-20}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05-small";
  };

  outputs = { self, nixpkgs, ... }:
  {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        {
          nixpkgs.crossSystem = {
            config = "riscv64-unknown-linux-gnu";
          };

          # replace gcc with gcc12 through overlays
          nixpkgs.overlays = [ (self: super: { gcc = self.gcc12; }) ];
        }

        # other modules ......
      ];
    };
  };
}
```

`nixpkgs.overlays` é usado para modificar a instância `pkgs` globalmente, e a instância
`pkgs` modificada terá efeito sobre todo o flake. Isso provavelmente causará uma grande
quantidade de cache missing e, portanto, exigirá a construção de um grande número de
pacotes Nix localmente.

Para evitar este problema, uma maneira melhor é criar uma nova instância `pkgs` e usar
essa instância apenas ao construir os pacotes que queremos modificar. O exemplo de
`flake.nix` é o seguinte:

```nix{10-19,34-37}
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05-small";
  };

  outputs = { self, nixpkgs, ... }: let
    # create a new pkgs instance with overlays
    pkgs-gcc12 = import nixpkgs {
      localSystem = "x86_64-linux";
      crossSystem = {
        config = "riscv64-unknown-linux-gnu";
      };

      overlays = [
        (self: super: { gcc = self.gcc12; })
      ];
    };
  in {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      specialArgs = {
        # pass the new pkgs instance to the module
        inherit pkgs-gcc12;
      };
      modules = [
        {
          nixpkgs.crossSystem = {
            config = "riscv64-unknown-linux-gnu";
          };
        }

        ({pkgs-gcc12, ...}: {
          # use the custom pkgs instance to build the package hello
          environment.systemPackages = [ pkgs-gcc12.hello ];
        })

        # other modules ......
      ];
    };
  };
}
```

Através do método acima, podemos facilmente personalizar o toolchain de construção de
alguns pacotes sem afetar a construção de outros pacotes.

## Referências

- [Cross compilation - nix.dev](https://nix.dev/tutorials/cross-compilation)
