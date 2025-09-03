# Outras Dicas Úteis

## Exibir Mensagens de Erro Detalhadas

Você sempre pode tentar adicionar `--show-trace --print-build-logs --verbose` ao comando
`nixos-rebuild` para obter uma mensagem de erro detalhada caso encontre algum erro durante
a implantação. Por exemplo:

```bash
cd /etc/nixos
sudo nixos-rebuild switch --flake .#myhost --show-trace --print-build-logs --verbose

# A more concise version
sudo nixos-rebuild switch --flake .#myhost --show-trace -L -v
```

## Gerenciando a Configuração com Git

A configuração do NixOS, sendo um conjunto de arquivos de texto, é ideal para o controle
de versão com o Git. Isso permite um _rollback_ fácil para uma versão anterior em caso de
problemas.

> OBSERVAÇÃO: Ao usar o Git, o Nix ignora todos os arquivos que não são rastreados pelo
> Git. Se você encontrar um erro no Nix indicando que um determinado arquivo não foi
> encontrado, pode ser porque você não o adicionou com `git add`.

Por padrão, o NixOS coloca a configuração em `/etc/nixos`, o que requer permissões de root
para modificação, tornando-o inconveniente para o uso diário. Felizmente, os Flakes podem
ajudar a resolver esse problema, permitindo que você coloque seu flake em qualquer lugar
de sua preferência.

Por exemplo, você pode colocar seu flake em `~/nixos-config` e criar um link simbólico em
`/etc/nixos` da seguinte forma:

```shell
sudo mv /etc/nixos /etc/nixos.bak  # Faz backup da configuração original
sudo ln -s ~/nixos-config /etc/nixos

# Implanta o flake.nix localizado no local padrão (/etc/nixos)
sudo nixos-rebuild switch
```

Dessa forma, você pode usar o Git para gerenciar a configuração em `~/nixos-config`. A
configuração pode ser modificada com permissões de nível de usuário comum e não exige a
propriedade de root.

Outra abordagem é excluir o `/etc/nixos` diretamente e especificar o caminho do arquivo de
configuração cada vez que você o implanta:

```shell
sudo mv /etc/nixos /etc/nixos.bak
cd ~/nixos-config

# `--flake .#my-nixos` deploys the flake.nix located in
# diretório atual, e o nome da nixosConfiguration é `my-nixos`
sudo nixos-rebuild switch --flake .#my-nixos
```

Escolha o método que melhor se adapta a você. Depois disso, o rollback do sistema se torna
simples. Basta voltar para o commit anterior e implantá-lo:

```shell
cd ~/nixos-config
# Volta para o commit anterior
git checkout HEAD^1
# Implanta o flake.nix localizado no diretório atual,
# com o nome da nixosConfiguration `my-nixos`
sudo nixos-rebuild switch --flake .#my-nixos
```

Operações mais avançadas do Git não são abordadas aqui, mas, em geral, o rollback pode ser
realizado diretamente usando o Git. Somente em casos de falhas completas do sistema você
precisaria reiniciar no gerenciador de boot e iniciar o sistema a partir de uma versão
histórica anterior.

## Visualizando e Excluindo Dados Históricos

Como mencionado anteriormente, cada implantação do NixOS cria uma nova versão, e todas as
versões são adicionadas às opções de boot do sistema. Além de reiniciar o computador, você
pode consultar todas as versões históricas disponíveis usando o seguinte comando:

```shell
nix profile history --profile /nix/var/nix/profiles/system
```

Para limpar as versões históricas e liberar espaço de armazenamento, use o seguinte
comando:

```shell
# Excluir todas as versões históricas com mais de 7 dias
sudo nix profile wipe-history --older-than 7d --profile /nix/var/nix/profiles/system

# Excluir o histórico não fará a coleta de lixo dos pacotes não utilizados, você precisa executar o comando gc manualmente como root:
sudo nix-collect-garbage --delete-old

# Devido à seguinte issue, você precisa executar o comando gc como usuário para excluir os dados históricos do home-manager:
# https://github.com/NixOS/nix/issues/8508
nix-collect-garbage --delete-old
```

## Por que alguns pacotes são instalados?

Para descobrir por que um pacote está instalado, você pode usar o seguinte comando:

1. Entre em um shell com `nix-tree` e `rg` disponíveis:
   `nix shell nixpkgs#nix-tree nixpkgs#ripgrep`
1. ` nix-store --gc --print-roots | rg -v '/proc/' | rg -Po '(?<= -> ).*' | xargs -o nix-tree`
1. `/<nome-do-pacote>` para encontrar o pacote que você deseja verificar.
1. `w` para mostrar por quais pacotes o pacote é dependido, e a cadeia de dependência
   completa.

## Reduzindo o Uso de Disco

A seguinte configuração pode ser adicionada à sua configuração do NixOS para ajudar a
reduzir o uso de disco:

```nix
{ lib, pkgs, ... }:

{
  # ...

  # Limita o número de gerações a serem mantidas
  boot.loader.systemd-boot.configurationLimit = 10;
  # boot.loader.grub.configurationLimit = 10;

  # Realiza a coleta de lixo semanalmente para manter o uso de disco baixo
  nix.gc = {
    automatic = true;
    dates = "weekly";
    options = "--delete-older-than 1w";
  };

  # Otimiza o armazenamento
  # Você também pode otimizar o store manualmente via:
  #    nix-store --optimise
  # Consulte o seguinte link para mais detalhes:
  # https://nixos.org/manual/nix/stable/command-ref/conf-file.html#conf-auto-optimise-store
  nix.settings.auto-optimise-store = true;
}
```

Ao incorporar esta configuração, você pode gerenciar e otimizar melhor o uso de disco do
seu sistema NixOS.
