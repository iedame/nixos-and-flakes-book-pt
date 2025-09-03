# Empacotamento 101

Conteúdo em andamento (WIP - work in progress). Por favor, consulte os seguintes
documentos de referência para aprender sobre o empacotamento Nix.

## Referências

- [NixOS Series 3: Software Packaging 101](https://lantian.pub/en/article/modify-computer/nixos-packaging.lantian/)
- [How to Learn Nix, Part 28: The standard environment](https://ianthehenry.com/posts/how-to-learn-nix/the-standard-environment/)
- [stdenv - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/stdenv)
- [languages-frameworks - Nixpkgs Manual](https://github.com/NixOS/nixpkgs/tree/nixos-unstable/doc/languages-frameworks)
- [Wrapping packages - NixOS Cookbook](https://wiki.nixos.org/wiki/Nix_Cookbook#Wrapping_packages)
- Ferramentas Úteis:
  - [nurl](https://github.com/nix-community/nurl): Gera chamadas do Nix fetcher a partir
    de URLs de repositórios.
  - [nix-init](https://github.com/nix-community/nix-init): Gera pacotes Nix a partir de
    URLs com pré-busca de hash, inferência de dependências, detecção de licenças e mais.
- Código-Fonte:
  - [pkgs/build-support/trivial-builders/default.nix - runCommand](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/trivial-builders/default.nix#L21-L49)
  - [pkgs/build-support/setup-hooks/make-wrapper.sh](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/setup-hooks/make-wrapper.sh)
  - Relacionado a FHS:
    - [pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvBubblewrap`
    - [pkgs/build-support/build-fhsenv-chroot/default.nix](https://github.com/NixOS/nixpkgs/blob/nixos-25.05/pkgs/build-support/build-fhsenv-bubblewrap/buildFHSEnv.nix):
      `pkgs.buildFHSEnvChroot`
