# Tópicos Avançados

Uma vez que você se familiarize com o NixOS, pode explorar tópicos avançados e mergulhar
mais fundo no ecossistema Nix. A seguir, estão alguns recursos e projetos da comunidade
que podem ajudar a expandir seu conhecimento:

## Comunidade

- [Nix Official - Community](https://nixos.org/community/): Contém informações sobre a
  comunidade Nix, fóruns, chat em tempo real, encontros, RFCs, a arquitetura da equipe
  oficial, etc.
- [Nix Channel Status](https://status.nixos.org/): O status de construção de cada canal do
  Nix.
- [nix-community/NUR](https://github.com/nix-community/NUR): Embora o Nixpkgs contenha um
  grande número de pacotes, alguns não são incluídos por razões como a velocidade de
  revisão e acordos de licenciamento. O NUR é um repositório de pacotes Nix
  descentralizado onde qualquer pessoa pode criar seu próprio repositório Nix e
  adicioná-lo ao NUR para que outros possam usá-lo. Se você quiser usar um pacote que não
  esteja no Nixpkgs, pode tentar encontrá-lo aqui. Se quiser compartilhar seu próprio
  pacote Nix com outras pessoas, pode criar e compartilhar seu próprio repositório Nix de
  acordo com o README do NUR.

## Documentação e Vídeos

- [Eelco Dolstra - The Purely Functional Software Deployment Model - 2006](https://edolstra.github.io/pubs/phd-thesis.pdf):
  A tese de doutorado seminal de Eelco Dolstra sobre o gerenciador de pacotes Nix.
- [Nix Reference Manual](https://nixos.org/manual/nix/stable/package-management/profiles.html):
  Um guia completo sobre o gerenciador de pacotes Nix, abordando seu design e uso a partir
  da linha de comando.
- [nixpkgs Manual](https://nixos.org/manual/nixpkgs/unstable/): O manual do nixpkgs, que
  apresenta seus parâmetros, explica como usar, modificar e empacotar pacotes Nix.
- [NixOS Manual](https://nixos.org/manual/nixos/unstable/): Um manual do usuário para o
  NixOS, fornecendo instruções de configuração para componentes de nível de sistema como
  Wayland/X11 e GPU.
- [nix-pills](https://nixos.org/guides/nix-pills): "Nix Pills" é uma série de guias que
  fornecem uma explicação aprofundada sobre a construção de pacotes de software com o Nix.
  Oferece explicações claras e compreensíveis.
- [nixos-in-production](https://github.com/Gabriella439/nixos-in-production): Este é um
  livro em andamento, hospedado no LeanPub, sobre como introduzir e manter o NixOS em um
  ambiente de produção.

E há muitos vídeos oficiais nos canais da
[NixOS Foundation](https://www.youtube.com/@NixOS-Foundation) e da
[NixCon](https://www.youtube.com/@NixCon) no YouTube. Aqui estão alguns vídeos que são
altamente recomendados:

- [Summer of Nix 2022 — Public Lecture Series](https://www.youtube.com/playlist?list=PLt4-_lkyRrOMWyp5G-m_d1wtTcbBaOxZk):
  Uma série de palestras públicas hospedadas pela NixOS Foundation, apresentadas por
  membros-chave da comunidade Nix (como Eelco Dolstra e Armijn Hemel). O conteúdo abrange
  a história de desenvolvimento do Nix, a história do NixOS e o futuro do Nix, entre
  outros tópicos.
- [Summer of Nix 2023 — Nix Developer Dialogues](https://www.youtube.com/playlist?list=PLt4-_lkyRrOPcBuz_tjm6ZQb-6rJjU3cf):
  Uma série de diálogos entre membros-chave da comunidade Nix em 2023. O conteúdo inclui a
  evolução e os desafios arquitetônicos do Nixpkgs, a exploração do sistema de módulos do
  Nix, uma discussão sobre o ecossistema do Nix, aplicações de IA no Nixpkgs, e a
  aplicação do Nix no campo comercial e na economia de código aberto.

## Técnicas Avançadas e Projetos da Comunidade

Uma vez que você se sinta confortável com Flakes, pode explorar técnicas mais avançadas e
projetos da comunidade. Aqui estão alguns populares para você experimentar:

- [flake-parts](https://github.com/hercules-ci/flake-parts): Simplifica a escrita e a
  manutenção de configurações usando o sistema de módulos Module.
- [flake-utils-plus](https://github.com/gytis-ivaskevicius/flake-utils-plus): Um pacote de
  terceiros que aprimora a configuração de Flakes e fornece recursos poderosos adicionais.

Existem muitos outros projetos valiosos da comunidade que vale a pena explorar. Aqui estão
alguns exemplos:

- [nix-output-monitor](https://github.com/maralorn/nix-output-monitor): Exibe de forma
  elegante o progresso da construção de pacotes Nix, com informações adicionais como tempo
  de construção e log de construção.
- [agenix](https://github.com/ryantm/agenix): Uma ferramenta para gerenciamento de
  segredos.
- [colmena](https://github.com/zhaofengli/colmena): Ferramentas para deployment NixOS
- [nixos-generators](https://github.com/nix-community/nixos-generators): Uma ferramenta
  para gerar ISO/qcow2/... a partir de configurações NixOS.
- [lanzaboote](https://github.com/nix-community/lanzaboote): Habilita a inicialização
  segura (secure boot) para o NixOS.
- [impermanence](https://github.com/nix-community/impermanence): Ajuda a tornar o NixOS
  sem estado e melhora a reprodutibilidade do sistema.
- [devbox](https://github.com/jetpack-io/devbox): Ambientes de desenvolvimento leves e
  reprodutíveis, sem os problemas dos contêineres, alimentados internamente por Nix,
  similar ao earthly.
- [nixpak](https://github.com/nixpak/nixpak): Uma ferramenta para isolar todo tipo de
  aplicações empacotadas com Nix, incluindo as com interfaces gráficas.
- [nixpacks](https://github.com/railwayapp/nixpacks): O Nixpacks recebe um diretório de
  origem e produz uma imagem compatível com OCI que pode ser implantada em qualquer lugar,
  de forma similar aos buildpacks.
- ...

Esses projetos oferecem funcionalidades e ferramentas adicionais que podem aprimorar sua
experiência com o NixOS.

Para mais informações, consulte o
[awesome-nix](https://github.com/nix-community/awesome-nix).
