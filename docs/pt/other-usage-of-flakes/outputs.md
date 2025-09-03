# Flake Outputs

Em `flake.nix`, a seção `outputs` define as diferentes saídas que um flake pode produzir
durante seu processo de build. Um flake pode ter múltiplas saídas simultaneamente, que
podem incluir, entre outras, as seguintes:

- Pacotes Nix: Eles recebem os nomes `apps.<system>.<name>`, `packages.<system>.<name>`,
  ou `legacyPackages.<system>.<name>`. Você pode construir um pacote específico usando o
  comando `nix build .#<name>`.
- Funções auxiliares Nix: Elas recebem o nome `lib.<name>` e servem como bibliotecas para
  outros flakes.
- Ambientes de desenvolvimento Nix: Recebem o nome `devShells` e fornecem ambientes de
  desenvolvimento isolados. Eles podem ser acessados usando o comando `nix develop`.
- Configurações NixOS: Recebem o nome `nixosConfiguration` e representam configurações
  específicas do sistema NixOS. Você pode ativar uma configuração usando o comando
  `nixos-rebuild switch --flake .#<name>`.
- Modelos Nix (templates): Recebem o nome `templates` podem ser usados como ponto de
  partida para criar novos projetos. Você pode gerar um projeto usando o comando
  `nix flake init --template <reference>`.
- Outras saídas definidas pelo usuário: Essas saídas podem ser definidas pelo usuário e
  podem ser usadas por outras ferramentas relacionadas ao Nix.

Consulte a documentação oficial para mais detalhes - [Flakes Check - Nix Manual].

Aqui está um trecho de exemplo da Wiki do NixOS que demonstra a estrutura da seção
`outputs`:

```nix
{
  inputs = {
    # ......
  };

  outputs = { self, ... }@inputs: {
    # Executed by `nix flake check`
    checks."<system>"."<name>" = derivation;
    # Executed by `nix build .#<name>`
    packages."<system>"."<name>" = derivation;
    # Executed by `nix build .`
    packages."<system>".default = derivation;
    # Executed by `nix run .#<name>`
    apps."<system>"."<name>" = {
      type = "app";
      program = "<store-path>";
    };
    # Executed by `nix run . -- <args?>`
    apps."<system>".default = { type = "app"; program = "..."; };

    # Formatter (alejandra, nixfmt or nixpkgs-fmt)
    formatter."<system>" = derivation;
    # Used for nixpkgs packages, also accessible via `nix build .#<name>`
    legacyPackages."<system>"."<name>" = derivation;
    # Overlay, consumed by other flakes
    overlays."<name>" = final: prev: { };
    # Default overlay
    overlays.default = {};
    # Nixos module, consumed by other flakes
    nixosModules."<name>" = { config }: { options = {}; config = {}; };
    # Default module
    nixosModules.default = {};
    # Used with `nixos-rebuild --flake .#<hostname>`
    # nixosConfigurations."<hostname>".config.system.build.toplevel must be a derivation
    nixosConfigurations."<hostname>" = {};
    # Used by `nix develop .#<name>`
    devShells."<system>"."<name>" = derivation;
    # Used by `nix develop`
    devShells."<system>".default = derivation;
    # Hydra build jobs
    hydraJobs."<attr>"."<system>" = derivation;
    # Used by `nix flake init -t <flake>#<name>`
    templates."<name>" = {
      path = "<store-path>";
      description = "template description goes here?";
    };
    # Used by `nix flake init -t <flake>`
    templates.default = { path = "<store-path>"; description = ""; };
  };
}
```

## Referências

- [Flakes Check - Nix Manual]

[Flakes Check - Nix Manual]:
  https://nix.dev/manual/nix/stable/command-ref/new-cli/nix3-flake-check
