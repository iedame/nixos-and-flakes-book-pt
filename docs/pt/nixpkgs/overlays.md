# Overlays

Na seção anterior, aprendemos sobre a sobrescrita de derivations usando
`pkgs.xxx.override { ... }` ou
`pkgs.xxx.overrideAttrs (finalAttrs: previousAttrs: { ... });`. No entanto, essa abordagem
irá gerar uma nova derivation e não modifica a derivation original na instância `pkgs`. Se
a derivation que você deseja sobrescrever também for usada por outros pacotes Nix, eles
ainda usarão a derivation não modificada.

Para modificar globalmente as derivations na instância nixpkgs padrão, o Nix fornece uma
funcionalidade chamada "overlays".

Em ambientes Nix tradicionais, os overlays podem ser configurados globalmente usando os
arquivos `~/.config/nixpkgs/overlays.nix` ou `~/.config/nixpkgs/overlays/*.nix`. No
entanto, com a funcionalidade Flakes, para garantir a reprodutibilidade do sistema, os
overlays não podem depender de configurações fora do repositório Git.

Ao usar `flake.nix` para configurar o NixOS, tanto o Home Manager quanto o NixOS fornecem
a opção `nixpkgs.overlays` para definir overlays. Você pode consultar a seguinte
documentação para mais detalhes:

- [Documentação do Home Manager - `nixpkgs.overlays`](https://nix-community.github.io/home-manager/options.xhtml#opt-nixpkgs.overlays)
- [Código-fonte do Nixpkgs - `nixpkgs.overlays`](https://github.com/NixOS/nixpkgs/blob/30d7dd7e7f2cba9c105a6906ae2c9ed419e02f17/nixos/modules/misc/nixpkgs.nix#L169)

Vamos dar uma olhada em um exemplo de módulo que carrega overlays. Este módulo pode ser
usado como um módulo do Home Manager ou como um módulo do NixOS, pois as definições são as
mesmas:

```nix
# ./overlays/default.nix
{ config, pkgs, lib, ... }:

{
  nixpkgs.overlays = [
    # Overlay 1: Use `self` e `super` para expressar
    # a relação de herança
    (self: super: {
      google-chrome = super.google-chrome.override {
        commandLineArgs =
          "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
      };
    })

    # Overlay 2: Use `final` e `prev` para expressar
    # a relação entre o novo e o antigo
    (final: prev: {
      steam = prev.steam.override {
        extraPkgs = pkgs: with pkgs; [
          keyutils
          libkrb5
          libpng
          libpulseaudio
          libvorbis
          stdenv.cc.cc.lib
          xorg.libXcursor
          xorg.libXi
          xorg.libXinerama
          xorg.libXScrnSaver
        ];
        extraProfile = "export GDK_SCALE=2";
      };
    })

    # Overlay 3: Definir overlays em outros arquivos
    # O conteúdo de ./overlays/overlay3/default.nix é o mesmo que acima:
    # `(final: prev: { xxx = prev.xxx.override { ... }; })`
    (import ./overlay3)
  ];
}
```

No exemplo acima, definimos três overlays.

1. O Overlay 1 modifica a derivation `google-chrome` adicionando um argumento de linha de
   comando para um servidor proxy.
2. O Overlay 2 modifica a derivation `steam` adicionando pacotes extras e variáveis de
   ambiente.
3. O Overlay 3 é definido em um arquivo separado `./overlays/overlay3/default.nix`.

Um exemplo de importação da configuração acima como um módulo NixOS é o seguinte:

```nix
# ./flake.nix
{
  inputs = {
    # ...
  };

  outputs = inputs@{ nixpkgs, ... }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./configuration.nix

          # importar o módulo que contém os overlays
          (import ./overlays)
        ];
      };
    };
  };
}
```

Isso é apenas um exemplo. Por favor, escreva seus próprios overlays de acordo com suas
necessidades.

## Múltiplas Instâncias de nixpkgs com Diferentes Overlays

O `nixpkgs.overlays = [...];` mencionado acima modifica diretamente a instância global
`pkgs`. Se seus overlays fizerem alterações em alguns pacotes de baixo nível, isso pode
impactar outros módulos. Uma desvantagem é o aumento na compilação local (devido à
invalidação do cache), e também pode haver problemas de funcionalidade com os pacotes
afetados.

Se você deseja utilizar overlays apenas em um local específico sem afetar a instância
nixpkgs padrão, você pode instanciar uma nova instância nixpkgs e aplicar seus overlays a
ela. Discutiremos como fazer isso na próxima seção
[Múltiplas Instâncias do Nixpkgs](./multiple-nixpkgs.md).

## Referências

- [Chapter 3. Overlays - nixpkgs Manual](https://nixos.org/manual/nixpkgs/stable/#chap-overlays)
