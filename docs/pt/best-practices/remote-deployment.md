# Implantação Remota

O design inerente do Nix é bem adequado para o deployment remoto, e a comunidade Nix
oferece diversas ferramentas sob medida para essa finalidade, como o
[NixOps](https://github.com/NixOS/nixops) e o
[colmena](https://github.com/zhaofengli/colmena). Além disso, a ferramenta oficial que
usamos extensivamente, o `nixos-rebuild`, também possui algumas capacidades de deployment
remoto.

Ademais, em cenários de multiarquitetura, o deployment remoto pode aproveitar de forma
ideal o suporte multiarquitetura do Nix. Por exemplo, você pode fazer uma compilação
cruzada de um sistema NixOS aarch64/riscv64 em um host x86_64, seguida de um deployment
remoto para os hosts correspondentes via SSH.

Recentemente, me deparei com uma situação em que fiz a compilação cruzada de uma imagem de
sistema **NixOS** para uma **SBC** **RISCV64** na minha máquina local. Consequentemente,
eu já possuía todos os caches de compilação para construir este sistema localmente. No
entanto, devido à falta de caches binários oficiais para a arquitetura **RISCV64**, a
execução de qualquer programa não instalado diretamente na placa de desenvolvimento (por
exemplo, `nix run nixpkgs#cowsay hello`) desencadeava compilações extensivas. Esse
processo consumia horas, o que era bastante inaceitável.

Ao adotar o deployment remoto, pude aproveitar totalmente o poder computacional da minha
CPU local de alta performance e os extensos caches de compilação. Essa mudança melhorou
vastamente minha experiência e mitigou significativamente o problema de compilação que
antes consumia muito tempo.

Permita-me guiá-lo brevemente através do uso do `colmena` ou `nixos-rebuild` para
deployment remoto.

## Pré-requisitos

Antes de embarcar no deployment remoto, alguns passos preparatórios são necessários:

1. Para evitar falha na verificação de senha sudo do host remoto, escolha um dos seguintes
   métodos:
   1. Faça o deployment como o usuário `root` do host remoto.
   2. Adicione `security.sudo.wheelNeedsPassword = false;` à configuração do host remoto e
      faça um deployment manual uma vez para conceder ao usuário permissões sudo sem
      senha.
      1. **Isso permitirá que programas de nível de usuário obtenham permissões sudo
         silenciosamente, o que representa um risco de segurança**! Portanto, se você
         escolher este método, é aconselhável criar um usuário dedicado para deployment
         remoto, em vez de usar sua conta de usuário regular!
2. Configure a autenticação de chave pública SSH para os hosts remotos.
   1. Use a opção `users.users.<name>.openssh.authorizedKeys.keys` para completar esta
      tarefa.
3. Adicione o registro do Known Hosts do host remoto à sua máquina local. Caso contrário,
   o colmena/nixos-rebuild falhará em fazer o deployment devido à incapacidade de
   verificar a identidade do host remoto.
   1. Use a opção `programs.ssh.knownHosts` para adicionar a chave pública do host remoto
      ao registro do Known Hosts.
4. Use o comando `ssh root@<you-host>` manualmente para verificar se você pode fazer login
   no host remoto.
   1. Se você encontrar algum problema, resolva-o antes de continuar.

É aconselhável usar o usuário `root` para o deployment, pois é mais conveniente e evita as
complexidades das permissões sudo.

Supondo que pretendemos fazer o deployment remotamente usando o usuário root, o passo
inicial envolve configurar a autenticação de chave pública SSH para o usuário root no host
remoto. Para realizar isso, basta adicionar o seguinte conteúdo a qualquer Módulo NixOS na
configuração Nix do host remoto (por exemplo, `configuration.nix`), e então reconstruir o
sistema:

```nix{6-9}
# configuration.nix
{

  # ...

  users.users.root.openssh.authorizedKeys.keys = [
    # TODO Substitua pela sua própria chave pública SSH.
    "ssh-ed25519 AAAAC3Nxxxxx ryan@xxx"
  ];

  # ...
}
```

Além disso, você precisará adicionar a chave privada SSH ao agente SSH na sua máquina
local para autenticação durante o deployment remoto:

```bash
ssh-add ~/.ssh/your-private-key
```

## Fazer o deployment com `colmena`

O `colmena` não usa diretamente o familiar `nixosConfigurations.xxx` para deployment
remoto. Em vez disso, ele personaliza uma saída (outputs) de flake chamada `colmena`.
Embora a estrutura seja similar à de `nixosConfigurations.xxx`, não é idêntica.

No `flake.nix` do seu sistema, adicione uma nova saída (outputs) chamada `colmena`. Um
exemplo simples é mostrado abaixo:

```nix{11-34}
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";

    # ...
  };
  outputs = { self, nixpkgs }: {
    # ...

    # Adicione esta saída (outputs), e o colmena lerá seu conteúdo para deployment remoto.
    colmena = {
      meta = {
        nixpkgs = import nixpkgs { system = "x86_64-linux"; };

        # Este parâmetro funciona de forma similar a `specialArgs` em `nixosConfigurations.xxx`,
        # e é usado para passar argumentos personalizados a todos os submódulos.
        specialArgs = {
          inherit nixpkgs;
        };
      };

      # Nome do host = "my-nixos"
      "my-nixos" = { name, nodes, ... }: {
        # Parâmetros relacionados ao deployment remoto
        deployment.targetHost = "192.168.5.42"; # Endereço IP do host remoto
        deployment.targetUser = "root";  # Nome de usuário do host remoto

        # Este parâmetro funciona de forma similar a modules em `nixosConfigurations.xxx`,
        # e é usado para importar todos os submódulos.
        imports = [
          ./configuration.nix
        ];
      };
    };
  };
}
```

Agora você pode fazer o _deployment_ da sua configuração para o dispositivo:

```bash
nix run nixpkgs#colmena apply
```

Para uso mais avançado, consulte a documentação oficial do colmena em
<https://colmena.cli.rs/unstable/introduction.html>

## Fazer o deployment com `nixos-rebuild`

Usar o `nixos-rebuild` para deployment remoto tem a vantagem de ser similar a fazer o
deployment para um host local. Isso requer apenas alguns parâmetros adicionais para
especificar o endereço IP, o nome de usuário e outros detalhes do host remoto.

Por exemplo, para fazer o deployment da configuração definida em
`nixosConfigurations.my-nixos` do seu flake para um host remoto, use o seguinte comando:

```bash
nixos-rebuild switch --flake .#my-nixos \
  --target-host root@192.168.4.1 --build-host localhost --verbose
```

O comando acima irá construir e fazer o deployment da configuração de `my-nixos` para um
servidor com o IP `192.168.4.1`. O processo de construção do sistema ocorrerá localmente.

Se você preferir construir a configuração no host remoto, substitua
`--build-host localhost` por `--build-host root@192.168.4.1`.

Para evitar o uso repetido de endereços IP, você pode definir aliases de host no
`~/.ssh/config` ou `/etc/ssh/ssh_config` da sua máquina local. Por exemplo:

> Gerar a configuração SSH inteiramente através da configuração Nix é possível, e essa
> tarefa fica a seu cargo.

```bash
› cat ~/.ssh/config

# ......

Host aquamarine
  HostName 192.168.4.1
  Port 22

# ......
```

Com essa configuração, você pode usar aliases de host para o deployment:

```bash
nixos-rebuild switch --flake .#my-nixos --target-host root@aquamarine --build-host root@aquamarine --verbose
```

Isso oferece uma maneira mais conveniente de fazer o deployment usando os aliases de host
definidos.
