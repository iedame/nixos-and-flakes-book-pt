# Primeiros Passos com o Home Manager

Como mencionei anteriormente, o NixOS só consegue gerenciar a configuração em nível de
sistema. Para gerenciar a configuração em nível de usuário no diretório Home, precisamos
instalar o Home Manager.

De acordo com o
[Manual Oficial do Home Manager](https://nix-community.github.io/home-manager/index.xhtml),
para instalar o Home Manager como um módulo do NixOS, primeiro precisamos criar o
`/etc/nixos/home.nix`. Aqui está um exemplo de seu conteúdo:

```nix
{ config, pkgs, ... }:

{
    # TODO por favor, mude o nome de usuário e o diretório home para os seus
  home.username = "ryan";
  home.homeDirectory = "/home/ryan";

  # linka o arquivo de configuração no diretório atual para o local especificado no diretório home
  # home.file.".config/i3/wallpaper.jpg".source = ./wallpaper.jpg;

  # linka todos os arquivos em `./scripts` para `~/.config/i3/scripts`
  # home.file.".config/i3/scripts" = {
  #   source = ./scripts;
  #   recursive = true;    # linka recursivamente
  #   executable = true;   # torna todos os arquivos executáveis
  # };

  # codifica o conteúdo do arquivo diretamente no arquivo de configuração nix
  # home.file.".xxx".text = ''
  #    xxx
  # '';

  # define o tamanho do cursor e dpi para monitor 4k
  xresources.properties = {
    "Xcursor.size" = 16;
    "Xft.dpi" = 172;
  };

  # Pacotes que devem ser instalados para o perfil do usuário.
  home.packages = with pkgs; [
    # aqui estão algumas ferramentas de linha de comando que eu uso frequentemente
    # sinta-se à vontade para adicionar as suas ou remover algumas delas

    neofetch
    nnn # gerenciador de arquivos de terminal

    # arquivos
    zip
    xz
    unzip
    p7zip

    # utilitários
    ripgrep # pesquisa recursivamente diretórios por um padrão regex
    jq # Um processador JSON de linha de comando leve e flexível
    yq-go # processador yaml https://github.com/mikefarah/yq
    eza # Um substituto moderno para ‘ls’
    fzf # Um localizador fuzzy de linha de comando

    # ferramentas de rede
    mtr # Uma ferramenta de diagnóstico de rede
    iperf3
    dnsutils  # `dig` + `nslookup`
    ldns # substituto do `dig`, ele fornece o comando `drill`
    aria2 # Um utilitário de download de linha de comando multi-protocolo e multi-fonte
    socat # substituto do openbsd-netcat
    nmap # Um utilitário para descoberta de rede e auditoria de segurança
    ipcalc  # é uma calculadora para os endereços IPv4/v6

    # diversos
    cowsay
    file
    which
    tree
    gnused
    gnutar
    gawk
    zstd
    gnupg

    # relacionados ao nix
    #
    # ele fornece o comando `nom` que funciona como o `nix`
    # com um log de saída mais detalhado
    nix-output-monitor

    # produtividade
    hugo # gerador de site estático
    glow # visualizador de markdown no terminal

    btop  # substituto do htop/nmon
    iotop # monitoramento de E/S
    iftop # monitoramento de rede

    # monitoramento de chamadas de sistema
    strace # monitoramento de chamadas de sistema
    ltrace # monitoramento de chamadas de biblioteca
    lsof # lista arquivos abertos

    # ferramentas de sistema
    sysstat
    lm_sensors # para o comando `sensors`
    ethtool
    pciutils # lspci
    usbutils # lsusb
  ];

  # configuração básica do git, por favor, mude para a sua
  programs.git = {
    enable = true;
    userName = "Ryan Yin";
    userEmail = "xiaoyin_c@qq.com";
  };

  # starship - um prompt personalizável para qualquer shell
  programs.starship = {
    enable = true;
    # configurações personalizadas
    settings = {
      add_newline = false;
      aws.disabled = true;
      gcloud.disabled = true;
      line_break.disabled = true;
    };
  };

  # alacritty - um emulador de terminal multiplataforma e acelerado por GPU
  programs.alacritty = {
    enable = true;
    # configurações personalizadas
    settings = {
      env.TERM = "xterm-256color";
      font = {
        size = 12;
        draw_bold_text_with_bright_colors = true;
      };
      scrolling.multiplier = 5;
      selection.save_to_clipboard = true;
    };
  };

  programs.bash = {
    enable = true;
    enableCompletion = true;
    # TODO adicione seu bashrc personalizado aqui
    bashrcExtra = ''
      export PATH="$PATH:$HOME/bin:$HOME/.local/bin:$HOME/go/bin"
    '';

    # defina alguns aliases, sinta-se à vontade para adicionar mais ou remover alguns
    shellAliases = {
      k = "kubectl";
      urldecode = "python3 -c 'import sys, urllib.parse as ul; print(ul.unquote_plus(sys.stdin.read()))'";
      urlencode = "python3 -c 'import sys, urllib.parse as ul; print(ul.quote_plus(sys.stdin.read()))'";
    };
  };

  # Este valor determina com qual release do Home Manager sua
  # configuração é compatível. Isso ajuda a evitar quebras
  # quando um novo release do Home Manager introduz
  # mudanças incompatíveis com versões anteriores.
  #
  # Você pode atualizar o Home Manager sem alterar este valor. Veja
  # as notas de lançamento do Home Manager para uma lista de alterações
  # na versão de estado em cada release.
  home.stateVersion = "25.05";
}
```

Após adicionar o `/etc/nixos/home.nix`, você precisa importar este novo arquivo de
configuração em `/etc/nixos/flake.nix` para usá-lo. Use o seguinte comando para gerar um
exemplo na pasta atual para referência:

```shell
nix flake new example -t github:nix-community/home-manager#nixos
```

Depois de ajustar os parâmetros, o conteúdo de `/etc/nixos/flake.nix` é o seguinte:

```nix
{
  description = "NixOS configuration";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";
    # home-manager, usado para gerenciar a configuração do usuário
    home-manager = {
      url = "github:nix-community/home-manager/release-25.05";
      # A palavra-chave `follows` em inputs é usada para herança.
      # Aqui, `inputs.nixpkgs` do home-manager é mantido consistente com
      # o `inputs.nixpkgs` do flake atual,
      # para evitar problemas causados por diferentes versões do nixpkgs.
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{ nixpkgs, home-manager, ... }: {
    nixosConfigurations = {
      # TODO por favor, mude o nome do host para o seu
      my-nixos = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./configuration.nix

          # torna o home-manager um módulo do nixos
          # para que a configuração do home-manager seja implantada automaticamente ao executar `nixos-rebuild switch`
          home-manager.nixosModules.home-manager
          {
            home-manager.useGlobalPkgs = true;
            home-manager.useUserPackages = true;

            # TODO substitua ryan pelo seu nome de usuário
            home-manager.users.ryan = import ./home.nix;

            # Opcionalmente, use home-manager.extraSpecialArgs para passar argumentos para home.nix
          }
        ];
      };
    };
  };
}
```

Em seguida, execute `sudo nixos-rebuild switch` para aplicar a configuração, e o
home-manager será instalado automaticamente.

> Se o nome do host do seu sistema não for `my-nixos`, você precisará modificar o nome de
> `nixosConfigurations` em `flake.nix`, ou usar `--flake /etc/nixos#my-nixos` para
> especificar o nome da configuração.

Após a instalação, todos os pacotes e configurações de nível de usuário podem ser
gerenciados através do `/etc/nixos/home.nix`. Ao executar `sudo nixos-rebuild switch`, a
configuração do home-manager será aplicada automaticamente. (**Não é necessário executar
`home-manager switch` manualmente!**)

Para encontrar as opções que podemos usar em `home.nix`, consulte os seguintes documentos:

- [Home Manager - Appendix A. Configuration Options](https://nix-community.github.io/home-manager/options.xhtml):
  Uma lista de todas as opções, é recomendado buscar por palavras-chave nela.
  - [Home Manager Option Search](https://mipmip.github.io/home-manager-option-search/) é
    outra ferramenta de pesquisa de opções com uma melhor UI.
- [home-manager](https://github.com/nix-community/home-manager): Algumas opções não estão
  listadas na documentação oficial, ou a documentação não é clara o suficiente. Você pode
  pesquisar e ler diretamente o código-fonte correspondente neste repositório do
  home-manager.

## Home Manager vs NixOS

Existem muitos pacotes de software ou configurações que podem ser definidos usando Módulos
NixOS (`configuration.nix`) ou Home Manager (`home.nix`), o que causa um dilema de
escolha: **Qual é a diferença entre colocar pacotes de software ou arquivos de
configuração em Módulos NixOS versus Home Manager, e como se deve tomar uma decisão**?

Primeiro, vamos ver as diferenças: pacotes de software e arquivos de configuração
instalados via Módulos NixOS são globais para o sistema inteiro. Configurações globais
geralmente são armazenadas em `/etc`, e o software instalado em todo o sistema é acessível
em qualquer ambiente de usuário.

Por outro lado, configurações e software instalados via Home Manager serão vinculados ao
diretório Home do respectivo usuário. O software instalado só está disponível no ambiente
de usuário correspondente e se torna inutilizável quando se muda para outro usuário.

Com base nessas características, o uso geral recomendado é:

- Módulos NixOS: Instale componentes centrais do sistema e outros pacotes de software ou
  configurações necessários para todos os usuários.
  - Por exemplo, se você quer que um pacote de software continue funcionando quando você
    muda para o usuário root, ou se você quer que uma configuração se aplique em todo o
    sistema, você deve instalá-lo usando Módulos NixOS.
- Home Manager: Use o Home Manager para todas as outras configurações e software.

Os benefícios desta abordagem são:

1. Software e serviços em segundo plano instalados no nível do sistema muitas vezes são
   executados com privilégios de root. Evitar instalações desnecessárias de software no
   nível do sistema pode reduzir os riscos de segurança do sistema.
1. Muitas configurações no Home Manager são universais para NixOS, macOS e outras
   distribuições Linux. Escolher o Home Manager para instalar software e configurar
   sistemas pode melhorar a portabilidade das configurações.
1. Se você precisar de suporte multiusuário, o software e as configurações instalados via
   Home Manager podem isolar melhor os diferentes ambientes de usuário, prevenindo
   conflitos de configuração e de versão de software entre os usuários.

## Como usar pacotes instalados pelo Home Manager com acesso privilegiado?

A primeira coisa que vem à mente é mudar para `root`, mas então qualquer pacote instalado
pelo usuário atual através do `home.nix` ficará indisponível. Vamos tomar o `kubectl` como
exemplo (ele é pré-instalado via `home.nix`):

```sh
# 1. kubectl está disponível
› kubectl | head
kubectl controls the Kubernetes cluster manager.

 Find more information at: https://kubernetes.io/docs/reference/kubectl/
......

# 2. mudar usuário para `root`
› sudo su

# 3. kubectl não está mais disponível
> kubectl
Error: nu::shell::external_command

  × External command failed
   ╭─[entry #1:1:1]
 1 │ kubectl
   · ───┬───
   ·    ╰── executable was not found
   ╰────
  help: No such file or directory (os error 2)


/home/ryan/nix-config> exit
```

A solução é usar `sudo` para executar o comando, o que temporariamente concede ao usuário
atual a habilidade de executar o comando como um usuário privilegiado (`root`):

```sh
› sudo kubectl
kubectl controls the Kubernetes cluster manager.
...
```
