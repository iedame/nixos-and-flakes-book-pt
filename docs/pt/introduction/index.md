![](/nixos-and-flakes-book.webp)

# Introdução ao Nix e ao NixOS

O Nix é um gerenciador de pacotes declarativo que permite aos usuários declarar o estado
desejado do sistema em arquivos de configuração (configuração declarativa), e ele se
responsabiliza por atingir esse estado.

> Em termos simples, "configuração declarativa" significa que os usuários só precisam
> declarar o resultado desejado. Por exemplo, se você declarar que quer substituir o
> gerenciador de janelas i3 por sway, o Nix irá te ajudar a atingir esse objetivo. Você
> não precisa se preocupar com os detalhes subjacentes, como quais pacotes o sway exige
> para a instalação, quais pacotes relacionados ao i3 precisam ser desinstalados, ou os
> ajustes necessários na configuração do sistema e nas variáveis de ambiente para o sway.
> O Nix lida automaticamente com esses detalhes para o usuário (desde que os pacotes Nix
> relacionados a sway e i3 sejam projetados corretamente).

O NixOS, uma distribuição Linux construída sobre o gerenciador de pacotes Nix, pode ser
descrito como "SO como Código". Ele emprega arquivos de configuração Nix declarativos para
descrever todo o estado do sistema operacional.

Um sistema operacional é composto por diversos pacotes de software, arquivos de
configuração e dados de texto/binários, tudo isso representando o estado atual do sistema.
A configuração declarativa consegue gerenciar apenas a parte estática desse estado. Dados
dinâmicos, como dados do PostgreSQL, MySQL ou MongoDB, não podem ser gerenciados de forma
eficaz por meio de uma configuração declarativa (não é viável deletar todos os novos dados
do PostgreSQL que não foram declarados na configuração a cada implantação). Portanto, o
NixOS se concentra principalmente em gerenciar a parte estática do estado do sistema de
forma declarativa. Os dados dinâmicos, juntamente com o conteúdo do diretório home do
usuário, permanecem inalterados pelo NixOS ao reverter para uma geração anterior.

Embora não seja possível alcançar uma reprodutibilidade completa do sistema, o diretório
`/home`, sendo um diretório importante do usuário, contém muitos arquivos de configuração
necessários: os [Dotfiles](https://wiki.archlinux.org/title/Dotfiles). Um projeto
significativo da comunidade, chamado
[home-manager](https://github.com/nix-community/home-manager), foi projetado para
gerenciar pacotes e arquivos de configuração em nível de usuário dentro do diretório home
do usuário.

Devido às características do Nix, como ser declarativo e reprodutível, ele não se limita a
gerenciar ambientes de desktop, sendo também amplamente utilizado para gerenciar ambientes
de desenvolvimento, ambientes de compilação, máquinas virtuais em nuvem e a construção de
imagens de contêineres. [NixOps](https://github.com/NixOS/nixops) (um projeto oficial do
Nix) e [colmena](https://github.com/zhaofengli/colmena) (um projeto da comunidade) são
ambas ferramentas operacionais baseadas em Nix.

## Por que NixOS?

Eu conheci o gerenciador de pacotes Nix pela primeira vez há vários anos. Ele utiliza a
linguagem Nix para descrever a configuração do sistema. O NixOS, a distribuição Linux
construída sobre ele, permite reverter o sistema para qualquer estado anterior (embora
apenas o estado declarado nos arquivos de configuração Nix possa ser revertido). Embora
parecesse impressionante, achei problemático aprender uma nova linguagem e escrever código
para instalar pacotes, então não dei prosseguimento na época.

No entanto, recentemente, enfrentei inúmeros problemas de ambiente ao usar o EndeavourOS,
e resolvê-los consumiu uma quantidade significativa da minha energia, me deixando exausto.
Após uma cuidadosa consideração, percebi que a falta de controle de versão e de mecanismos
de reversão no EndeavourOS me impedia de restaurar o sistema quando os problemas surgiam.

Foi então que decidi mudar para o NixOS.

Para minha surpresa, o NixOS superou minhas expectativas. O aspecto mais impressionante é
que agora posso restaurar todo o meu ambiente i3 e todos os meus pacotes de uso comum em
um novo host NixOS com apenas um comando: `sudo nixos-rebuild switch --flake .`. É
realmente fantástico!

A capacidade de reversão e a reprodutibilidade do NixOS me deram uma enorme confiança -
não temo mais quebrar o sistema. Eu até me aventurei a experimentar coisas novas no NixOS,
como o compositor hyprland. Anteriormente, no EndeavourOS, eu não teria ousado mexer com
compositores tão novos, pois qualquer problema no sistema teria envolvido uma solução de
problemas manual significativa usando várias "gambiaras".

À medida que me aprofundo cada vez mais em NixOS e Nix, percebo que eles também são muito
adequados para gerenciar a configuração de múltiplos hosts de forma síncrona. Atualmente,
meu [nix-config](https://github.com/ryan4yin/nix-config) pessoal gerencia a configuração
de muitos hosts de forma síncrona:

- Desktops
  - 1 Macbook Pro 2022 (M2 aarch64).
  - 1 Macbook Pro 2024 (M4Pro aarch64).
  - 1 PC desktop com NixOS (amd64).
- Servidores
  - 10+ máquinas virtuais com NixOS (amd64).
  - Várias placas de desenvolvimento para aarch64 e riscv64.

O ambiente de desenvolvimento de três computadores desktop é gerenciado pelo Home Manager,
a configuração principal é completamente compartilhada, e a configuração modificada em
qualquer host pode ser sincronizada de forma transparente para outros hosts através do
Git.

O Nix quase me isolou completamente das diferenças entre o SO e a arquitetura na base das
três máquinas, e a experiência foi muito tranquila!
