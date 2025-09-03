import { defineConfig } from "vitepress"

export const pt = defineConfig({
  lang: "pt-BR",
  description: "Um livro não oficial e com opiniões para iniciantes",

  themeConfig: {
    nav: [
      { text: "Início", link: "/" },
      { text: "Prefácio", link: "/preface.md" },
      { text: "Primeiros Passos", link: "/introduction/index.md" },
      { text: "Boas Práticas", link: "/best-practices/intro.md" },
    ],
    sidebar: [
      {
        text: "Prefácio",
        items: [{ text: "Prefácio", link: "/preface.md" }],
      },
      {
        text: "Primeiros Passos",
        items: [
          { text: "Introdução", link: "/introduction/index.md" },
          {
            text: "Vantagens e Desvantagens",
            link: "/introduction/advantages-and-disadvantages.md",
          },
          {
            text: "Instalação",
            link: "/introduction/installation.md",
          },
        ],
      },
      {
        text: "A Linguagem Nix",
        items: [{ text: "Noções Básicas", link: "/the-nix-language/index.md" }],
      },
      {
        text: "NixOS com Flakes",
        items: [
          {
            text: "Primeiros Passos com o NixOS",
            link: "/nixos-with-flakes/get-started-with-nixos.md",
          },
          {
            text: "Introdução aos Flakes",
            link: "/nixos-with-flakes/introduction-to-flakes.md",
          },
          {
            text: "NixOS com Flakes Habilitados",
            link: "/nixos-with-flakes/nixos-with-flakes-enabled.md",
          },
          {
            text: "Entendendo o flake.nix",
            link: "/nixos-with-flakes/nixos-flake-configuration-explained.md",
          },
          {
            text: "A Capacidade de Combinação dos Flakes com o Sistema de Módulos do Nixpkgs",
            link: "/nixos-with-flakes/nixos-flake-and-module-system.md",
          },
          {
            text: "Primeiros Passos com o Home Manager",
            link: "/nixos-with-flakes/start-using-home-manager.md",
          },
          {
            text: "Modularizando a Configuração",
            link: "/nixos-with-flakes/modularize-the-configuration.md",
          },
          {
            text: "Atualizando o Sistema",
            link: "/nixos-with-flakes/update-the-system.md",
          },
          {
            text: "Fazendo Downgrade ou Upgrade de Pacotes",
            link: "/nixos-with-flakes/downgrade-or-upgrade-packages.md",
          },
          {
            text: "Outras Dicas Úteis",
            link: "/nixos-with-flakes/other-useful-tips.md",
          },
        ],
      },
      {
        text: "Uso Avançado do Nixpkgs",
        items: [
          { text: "Introdução", link: "/nixpkgs/intro.md" },
          { text: "callPackage", link: "/nixpkgs/callpackage.md" },
          { text: "Sobrescrevendo com override", link: "/nixpkgs/overriding.md" },
          { text: "Overlays", link: "/nixpkgs/overlays.md" },
          {
            text: "Múltiplas Instâncias do Nixpkgs",
            link: "/nixpkgs/multiple-nixpkgs.md",
          },
        ],
      },
      {
        text: "Nix Store e Cache Binário",
        items: [
          { text: "Introdução", link: "/nix-store/intro.md" },
          {
            text: "Adicionando Servidores de Cache Binário",
            link: "/nix-store/add-binary-cache-servers.md",
          },
          {
            text: "Hospedando seu Próprio Servidor de Cache Binário",
            link: "/nix-store/host-your-own-binary-cache-server.md",
          },
        ],
      },
      {
        text: "Boas Práticas",
        items: [
          { text: "Introdução", link: "/best-practices/intro.md" },
          {
            text: "Executando Binários Baixados no NixOS",
            link: "/best-practices/run-downloaded-binaries-on-nixos.md",
          },
          {
            text: "Simplificando Comandos Relacionados ao NixOS",
            link: "/best-practices/simplify-nixos-related-commands.md",
          },
          {
            text: "Acelerando a Depuração de Dotfiles",
            link: "/best-practices/accelerating-dotfiles-debugging.md",
          },
          {
            text: "NIX_PATH Personalizado e Registro de Flake",
            link: "/best-practices/nix-path-and-flake-registry.md",
          },
          {
            text: "Implantação Remota",
            link: "/best-practices/remote-deployment.md",
          },
          {
            text: "Depurando Derivations e Nix Expressions",
            link: "/best-practices/debugging.md",
          },
        ],
      },

      {
        text: "Outros Usos de Flakes",
        items: [
          { text: "Introdução", link: "/other-usage-of-flakes/intro.md" },
          {
            text: "Flake Inputs",
            link: "/other-usage-of-flakes/inputs.md",
          },
          {
            text: "Flake Outputs",
            link: "/other-usage-of-flakes/outputs.md",
          },
          {
            text: "A Nova Interface de Linha de Comando",
            link: "/other-usage-of-flakes/the-new-cli.md",
          },
          {
            text: "Sistema de Módulos e Opções Personalizadas",
            link: "/other-usage-of-flakes/module-system.md",
          },
          {
            text: "[WIP] Testando",
            link: "/other-usage-of-flakes/testing.md",
          },
        ],
      },
      {
        text: "Ambientes de Desenvolvimento no NixOS",
        items: [
          {
            text: "nix shell, nix develop e pkgs.runCommand",
            link: "/development/intro.md",
          },
          {
            text: "Ambientes de Desenvolvimento",
            link: "/development/dev-environments.md",
          },
          {
            text: "[WIP] Empacotamento 101",
            link: "/development/packaging-101.md",
          },
          {
            text: "Compilação Multiplataforma",
            link: "/development/cross-platform-compilation.md",
          },
          {
            text: "Construção Distribuída",
            link: "/development/distributed-building.md",
          },
          {
            text: "[WIP] Desenvolvimento de Kernel",
            link: "/development/kernel-development.md",
          },
        ],
      },
      {
        text: "Tópicos Avançados",
        items: [{ text: "Tópicos Avançados", link: "/advanced-topics/index.md" }],
      },
      {
        text: "Perguntas Frequentes",
        items: [{ text: "Perguntas Frequentes", link: "/faq/index.md" }],
      },
    ],
  },
})
