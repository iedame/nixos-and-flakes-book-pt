# Simplificando comandos relacionados ao NixOS

Para simplificar comandos relacionados ao NixOS, eu utilizo o
[just](https://github.com/casey/just), o que se mostra muito conveniente.

Como alternativa, você também pode usar ferramentas similares como o Makefile ou o
[cargo-make](https://github.com/sagiegurari/cargo-make) para essa finalidade. Aqui
fornecerei minha abordagem como referência.

Abaixo está um exemplo de como o meu Justfile se parece:

> O Justfile mais recente que estou usando:
> [ryan4yin/nix-config/Justfile](https://github.com/ryan4yin/nix-config/blob/main/Justfile)

```Makefile
# just é um executor de comandos, e o Justfile é muito similar ao Makefile, mas mais simples.

############################################################################
#
#  Comandos Nix relacionados à máquina local
#
############################################################################

deploy:
  nixos-rebuild switch --flake . --use-remote-sudo

debug:
  nixos-rebuild switch --flake . --use-remote-sudo --show-trace --verbose

up:
  nix flake update

# Atualizar o input específico
# uso: make upp i=home-manager
upp:
  nix flake update $(i)

history:
  nix profile history --profile /nix/var/nix/profiles/system

repl:
  nix repl -f flake:nixpkgs

clean:
  # remove todas as gerações com mais de 7 dias
  sudo nix profile wipe-history --profile /nix/var/nix/profiles/system  --older-than 7d

gc:
  # coletar o lixo de todas as entradas não utilizadas do Nix store
  sudo nix-collect-garbage --delete-old

############################################################################
#
#  Comandos relacionados ao meu cluster de compilação distribuída e remota
#
############################################################################

add-idols-ssh-key:
  ssh-add ~/.ssh/ai-idols

aqua: add-idols-ssh-key
  nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo

aqua-debug: add-idols-ssh-key
  nixos-rebuild --flake .#aquamarine --target-host aquamarine --build-host aquamarine switch --use-remote-sudo --show-trace --verbose

ruby: add-idols-ssh-key
  nixos-rebuild --flake .#ruby --target-host ruby --build-host ruby switch --use-remote-sudo

ruby-debug: add-idols-ssh-key
  nixos-rebuild --flake .#ruby --target-host ruby --build-host ruby switch --use-remote-sudo --show-trace --verbose

kana: add-idols-ssh-key
  nixos-rebuild --flake .#kana --target-host kana --build-host kana switch --use-remote-sudo

kana-debug: add-idols-ssh-key
  nixos-rebuild --flake .#kana --target-host kana --build-host kana switch --use-remote-sudo --show-trace --verbose

idols: aqua ruby kana

idols-debug: aqua-debug ruby-debug kana-debug
```

Salve este `Justfile` no diretório raiz do seu Nix flake. Depois, pode usar `just deploy`
para implantar a configuração na minha máquina local e `just idols` para implantar a
configuração em todos os meus servidores remotos.

Essa abordagem simplifica a execução de comandos do NixOS, abstraindo-os por trás de nomes
de alvos no Justfile, o que proporciona uma experiência mais amigável e conveniente."
