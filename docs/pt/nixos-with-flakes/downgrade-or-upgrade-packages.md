# Fazendo Downgrade ou Upgrade de Pacotes

Ao trabalhar com Flakes, você pode encontrar situações em que precisa fazer o downgrade ou
upgrade de certos pacotes para resolver bugs ou problemas de compatibilidade. Em Flakes,
as versões dos pacotes e os valores de hash estão diretamente vinculados ao commit do Git
de sua entrada de flake. Para modificar a versão de um pacote, você precisa bloquear o
commit do Git da entrada de flake.

Aqui está um exemplo de como você pode adicionar múltiplas entradas nixpkgs, cada uma
usando um commit ou ramo diferente do Git:

```nix{8-13,19-20,27-44}
{
  description = "NixOS configuration of Ryan Yin";

  inputs = {
    # Padrão para o ramo nixos-unstable
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    # Último ramo estável do nixpkgs, usado para rollback de versão
    # A última versão atual é 25.05
    nixpkgs-stable.url = "github:nixos/nixpkgs/nixos-25.05";

    # Você também pode usar um hash de commit específico do git para bloquear a versão
    nixpkgs-fd40cef8d.url = "github:nixos/nixpkgs/fd40cef8d797670e203a27a91e4b8e6decf0b90c";
  };

  outputs = inputs@{
    self,
    nixpkgs,
    nixpkgs-stable,
    nixpkgs-fd40cef8d,
    ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem rec {
        system = "x86_64-linux";

        # O parâmetro specialArgs passa as instâncias nixpkgs não padrão para outros módulos nix
        specialArgs = {
          # Para usar pacotes do nixpkgs-stable,
          # primeiro configuramos alguns parâmetros para ele
          pkgs-stable = import nixpkgs-stable {
            # Referir-se ao parâmetro system do escopo externo recursivamente
            inherit system;
            # Para usar o Chrome, precisamos permitir a instalação de software não livre.
            config.allowUnfree = true;
          };
          pkgs-fd40cef8d = import nixpkgs-fd40cef8d {
            inherit system;
            config.allowUnfree = true;
          };
        };

        modules = [
          ./hosts/my-nixos

          # Omitir outras configurações...
        ];
      };
    };
  };
}
```

No exemplo acima, definimos múltiplas entradas nixpkgs: `nixpkgs`, `nixpkgs-stable` e
`nixpkgs-fd40cef8d`. Cada entrada corresponde a um commit ou ramo diferente do Git.

Em seguida, você pode referenciar os pacotes de `pkgs-stable` ou `pkgs-fd40cef8d` dentro
do seu submódulo. Aqui está um exemplo de um submódulo do Home Manager:

```nix{4-7,13,25}
{
  pkgs,
  config,
  # O Nix irá procurar e injetar este parâmetro
  # de specialArgs em flake.nix
  pkgs-stable,
  # pkgs-fd40cef8d,
  ...
}:

{
  # Use pacotes de `pkgs-stable` em vez de `pkgs`
  home.packages = with pkgs-stable; [
    firefox-wayland

    # O suporte ao Chrome Wayland estava quebrado no ramo nixos-unstable,
    # então voltamos para o ramo estável por enquanto.
    # Referência: https://github.com/swaywm/sway/issues/7562
    google-chrome
  ];

  programs.vscode = {
    enable = true;
    # Referir-se ao vscode de `pkgs-stable` em vez de `pkgs`
    package = pkgs-stable.vscode;
  };
}
```

## Fixando a versão de um pacote com um overlay

A abordagem acima é perfeita para pacotes de aplicação, mas às vezes você precisa
substituir bibliotecas usadas por esses pacotes. É aqui que os
[Overlays](../nixpkgs/overlays.md) brilham! Os Overlays podem editar ou substituir
qualquer atributo de um pacote, mas por enquanto vamos apenas fixar um pacote a uma versão
diferente do nixpkgs. A principal desvantagem de editar uma dependência com um overlay é
que sua instalação Nix irá recompilar todos os pacotes instalados que dependem dela, mas
sua situação pode exigir isso para correções de bugs específicos.

```nix
# overlays/mesa.nix
{ config, pkgs, lib, pkgs-fd40cef8d, ... }:
{
  nixpkgs.overlays = [
    # Overlay: Use `self` e `super` para expressar
    # a relação de herança
    (self: super: {
      mesa = pkgs-fd40cef8d.mesa;
    })
  ];
}
```

## Aplicando a nova configuração

Ao ajustar a configuração conforme mostrado acima, você pode implantá-la usando
`sudo nixos-rebuild switch`. Isso fará o downgrade das suas versões do
Firefox/Chrome/VSCode para as correspondentes a `nixpkgs-stable` ou `nixpkgs-fd40cef8d`.

> De acordo com
> [1000 instâncias de nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347),
> não é uma boa prática usar `import` em submódulos ou subflakes para personalizar o
> `nixpkgs`. Cada `import` cria uma nova instância do nixpkgs, o que aumenta o tempo de
> build e o uso de memória à medida que a configuração cresce. Para evitar esse problema,
> criamos todas as instâncias do nixpkgs em `flake.nix`.
