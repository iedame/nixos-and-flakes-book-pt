# Executando Binários Baixados no NixOS

Como o NixOS não segue rigorosamente o Filesystem Hierarchy Standard (FHS), binários
baixados da internet podem não funcionar diretamente no NixOS. No entanto, há vários
métodos disponíveis para fazê-los funcionar corretamente.

Para um guia abrangente que apresenta dez abordagens diferentes para executar binários
baixados no NixOS, recomendo a leitura do artigo
[Diferentes métodos para executar um executável não-NixOS no NixOS (em Inglês)](https://unix.stackexchange.com/questions/522822/different-methods-to-run-a-non-nixos-executable-on-nixos)
e dê uma olhada em [nix-alien](https://github.com/thiagokokada/nix-alien). Ou, se você tem
familiaridade com o Docker, executar o binário em um contêiner Docker também é uma ótima
escolha.

Entre esses métodos, eu pessoalmente prefiro criar um ambiente FHS para executar o
binário, pois ele se mostra tanto conveniente quanto fácil de usar. Para configurar esse
ambiente, você pode adicionar o seguinte código a um de seus módulos Nix:

```nix
{ config, pkgs, lib, ... }:

{
  # ......omitindo muitas configurações

  environment.systemPackages = with pkgs; [
    # ......omitindo muitos pacotes

    # Crie um ambiente FHS usando o comando `fhs`, permitindo a execução de pacotes não-NixOS no NixOS!
    (let base = pkgs.appimageTools.defaultFhsEnvArgs; in
      pkgs.buildFHSUserEnv (base // {
      name = "fhs";
      targetPkgs = pkgs:
        # pkgs.buildFHSUserEnv fornece apenas um ambiente FHS mínimo,
        # carecendo de muitos pacotes básicos necessários para a maioria dos softwares.
        # Portanto, precisamos adicioná-los manualmente.
        #
        # pkgs.appimageTools fornece os pacotes básicos exigidos pela maioria dos softwares.
        (base.targetPkgs pkgs) ++ (with pkgs; [
          pkg-config
          ncurses
          # Sinta-se à vontade para adicionar mais pacotes aqui, se necessário.
        ]
      );
      profile = "export FHS=1";
      runScript = "bash";
      extraOutputsToInstall = ["dev"];
    }))
  ];

  # ......omitindo muitas configurações
}
```

Após aplicar a configuração atualizada, você pode usar o comando `fhs` para entrar no
ambiente FHS e, em seguida, executar o binário que você baixou, por exemplo:

```shell
# Ativar o FHS me coloca em um shell que se assemelha a um ambiente Linux "normal".
$ fhs
# Verifique o que temos em /usr/bin.
(fhs) $ ls /usr/bin
# Tente executar um binário não-NixOS baixado da internet.
(fhs) $ ./bin/code
```

## Referências

- [Tips&Tricks for NixOS Desktop - NixOS
  Discourse][Tips&Tricks for NixOS Desktop - NixOS Discourse]: Esta postagem oferece uma
  coleção de dicas e truques úteis para usuários de desktop do NixOS.
- [nix-alien](https://github.com/thiagokokada/nix-alien): Executar Binários Não-Patchados
  no Nix/NixOS
- [nix-ld](https://github.com/Mic92/nix-ld): Executar binários dinâmicos não-patchados no
  NixOS
- [NixOS: Packaging Closed Source Software (& Binary Distributed Ones) - Lan Tian @ Blog](https://lantian.pub/en/article/modify-computer/nixos-packaging.lantian/#examples-closed-source-software--binary-distributed-ones)

[Tips&Tricks for NixOS Desktop - NixOS Discourse]:
  https://discourse.nixos.org/t/tips-tricks-for-nixos-desktop/28488
