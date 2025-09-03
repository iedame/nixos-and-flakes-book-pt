# Desenvolvimento do Kernel

> Conteúdo em andamento (WIP - work in progress).

Um exemplo de desenvolvimento de kernel com `flake.nix`.

```nix
{
  description = "NixOS running on LicheePi 4A";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05-small";

    # código-fonte do kernel personalizado
    thead-kernel = {
      url = "github:revyos/thead-kernel/lpi4a";
      flake = false;
    };
  };

  outputs = inputs@{
    self
    ,nixpkgs
    ,thead-kernel
    ,... }:
  let
    pkgsKernel = import nixpkgs {
      localSystem = "x86_64-linux";
      crossSystem = {
        config = "riscv64-unknown-linux-gnu";
      };

      overlays = [
        (self: super: {
          # usar gcc 13 para compilar este kernel personalizado
          linuxPackages_thead = super.linuxPackagesFor (super.callPackage ./pkgs/kernel {
            src = thead-kernel;
            stdenv = super.gcc13Stdenv;
            kernelPatches = with super.kernelPatches; [
              bridge_stp_helper
              request_key_helper
            ];
          });
        })
      ];
    };
  in
  {
    nixosConfigurations.lp4a = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";

      specialArgs = {
        inherit nixpkgs pkgsKernel;
      };
      modules = [
        {
          # compilação cruzada deste flake.
          nixpkgs.crossSystem = {
            system = "riscv64-linux";
          };
        }

        ./modules/licheepi4a.nix
        ./modules/sd-image-lp4a.nix
      ];
    };

    # usar `nix develop .#kernel` para entrar no ambiente com o ambiente de construção do kernel personalizado disponível.
    # e então usar `unpackPhase` para descompactar o código-fonte do kernel e entrar nele.
    # então você pode usar `make menuconfig` para configurar o kernel.
    #
    # problema
    #    - usando `make menuconfig` - Não é possível encontrar o pacote ncurses.
    devShells.x86_64-linux.kernel = pkgsKernel.linuxPackages_thead.kernel.dev;

    # usar `nix develop .#fhs` para entrar no ambiente de teste fhs definido aqui.
    devShells.x86_64-linux.fhs = let
      pkgs = import nixpkgs {
        system = "x86_64-linux";
      };
    in
      # o código aqui é principalmente copiado de:
      #    https://wiki.nixos.org/wiki/Linux_kernel#Embedded_Linux_Cross-compile_xconfig_and_menuconfig
      (pkgs.buildFHSUserEnv {
        name = "kernel-build-env";
        targetPkgs = pkgs_: (with pkgs_;
          [
            # precisamos desses pacotes para rodar `make menuconfig` com sucesso.
            pkgconfig
            ncurses

            pkgsKernel.gcc13Stdenv.cc
            gcc
          ]
          ++ pkgs.linux.nativeBuildInputs);
        runScript = pkgs.writeScript "init.sh" ''
          # definir as variáveis de ambiente de compilação cruzada.
          export CROSS_COMPILE=riscv64-unknown-linux-gnu-
          export ARCH=riscv
          export PKG_CONFIG_PATH="${pkgs.ncurses.dev}/lib/pkgconfig:"
          exec bash
        '';
      }).env;
  };
}
```

Com o `flake.nix` acima, posso entrar no ambiente de construção do kernel com
`nix develop .#kernel`, e então usar `unpackPhase` para descompactar o código-fonte do
kernel e entrar no diretório. Mas não consigo usar `make menuconfig` para configurar o
kernel, porque o pacote `ncurses` está faltando neste ambiente.

Para resolver este problema, eu adiciono um ambiente `fhs` para instalar o pacote
`ncurses` e outros pacotes necessários, e então posso usar `nix develop .#fhs` para entrar
neste ambiente e usar `make menuconfig` para configurar o kernel.

## Referências

- [Linux kernel - NixOS Wiki](https://wiki.nixos.org/wiki/Linux_kernel)
- https://github.com/jordanisaacs/kernel-module-flake
