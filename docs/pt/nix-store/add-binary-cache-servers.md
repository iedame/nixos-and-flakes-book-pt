# Adicionando Servidores de Cache Binário

Já introduzimos os conceitos de Nix Store e cache binário. Agora, veremos como adicionar
múltiplos servidores de cache para acelerar o download de pacotes.

## Por que Adicionar Servidores de Cache {#why-add-cache-servers}

O Nix fornece um servidor de cache oficial,
[https://cache.nixos.org](https://cache.nixos.org), que armazena os resultados de
construção para a maioria dos pacotes de uso comum. No entanto, ele pode não atender a
todas as necessidades dos usuários. Nos seguintes casos, precisamos adicionar servidores
de cache adicionais:

1. Adicionar servidores de cache para alguns projetos de terceiros, como o servidor de
   cache da comunidade Nix,
   [https://nix-community.cachix.org](https://nix-community.cachix.org), o que pode
   melhorar significativamente a velocidade de construção desses projetos de terceiros.
1. Adicionar espelhos (mirror sites) de servidores de cache mais próximos do usuário para
   acelerar os downloads.
1. Adicionar um servidor de cache próprio para acelerar o processo de construção de
   projetos pessoais.

## Como Adicionar Servidores de Cache {#how-to-add-custom-cache-servers}

No Nix, você pode configurar servidores de cache usando as seguintes opções:

1. [substituters](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-substituters):
   É uma lista de strings, e cada string é o endereço de um servidor de cache. O Nix
   tentará encontrar caches nesses servidores na ordem especificada na lista.
2. [trusted-public-keys](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-public-keys):
   Para evitar ataques maliciosos, a opção
   [require-sigs](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-require-sigs)
   é habilitada por padrão. Somente caches com assinaturas que podem ser verificadas por
   qualquer chave pública em `trusted-public-keys` serão usados pelo Nix. Portanto, você
   precisa adicionar a chave pública correspondente aos `substituters` em
   `trusted-public-keys`.
   1. Os dados dos espelhos de cache (cache mirror) são diretamente sincronizados do
      servidor de cache oficial. Portanto, suas chaves públicas são as mesmas do servidor
      de cache oficial, e você pode usar a chave pública do servidor de cache oficial sem
      configuração adicional.
   2. Este mecanismo de verificação de chave pública completamente baseado em confiança
      transfere a responsabilidade pela segurança para os usuários. Se os usuários desejam
      usar um servidor de cache de terceiros para acelerar o processo de construção de uma
      determinada biblioteca, eles devem assumir os riscos de segurança correspondentes e
      decidir se adicionam a chave pública desse servidor de cache a
      `trusted-public-keys`. Para resolver completamente essa questão de confiança, o Nix
      introduziu o recurso experimental
      [ca-derivations](https://wiki.nixos.org/wiki/Ca-derivations), que não depende de
      `trusted-public-keys` para a verificação de assinatura. Usuários interessados podem
      explorar mais.

Você pode configurar os parâmetros `substituters` e `trusted-public-keys` das seguintes
formas:

1. Configurar em `/etc/nix/nix.conf`, uma configuração global que afeta todos os usuários.
   1. Você pode usar `nix.settings.substituters` e `nix.settings.trusted-public-keys` em
      qualquer Módulo NixOS para gerar declarativamente o arquivo `/etc/nix/nix.conf`.
2. Configurar no `flake.nix` de um projeto flake usando `nixConfig.substituters`. Esta
   configuração afeta apenas o flake atual.
3. Definir temporariamente através do parâmetro `--option` do comando `nix`, e esta
   configuração se aplica apenas ao comando atual.

Entre esses três métodos, exceto a primeira configuração global, os outros dois são
configurações temporárias. Se múltiplos métodos forem usados simultaneamente, as
configurações posteriores sobrescreverão diretamente as anteriores.

No entanto, existem riscos de segurança ao definir temporariamente os `substituters`, como
explicado anteriormente sobre as deficiências do mecanismo de verificação de segurança
baseado em `trusted-public-keys`. Para definir `substituters` através do segundo e
terceiro métodos, você precisa atender a uma das seguintes condições:

1. O usuário atual está incluído na lista de parâmetros
   [`trusted-users`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-users)
   em `/etc/nix/nix.conf`.
2. Os `substituters` especificados temporariamente via
   `--option substituters "http://xxx"` estão incluídos na lista de parâmetros
   [`trusted-substituters`](https://nixos.org/manual/nix/stable/command-ref/conf-file#conf-trusted-substituters)
   em `/etc/nix/nix.conf`.

Com base nas informações acima, seguem exemplos dos três métodos de configuração
mencionados.

Primeiro, configure declarativamente os `substituters` e `trusted-public-keys` em nível de
sistema usando `nix.settings` em `/etc/nixos/configuration.nix` ou em qualquer Módulo
NixOS:

```nix{7-27}
{
  lib,
  ...
}: {

  # ...
  nix.settings = {
   # dado aos usuários desta lista o direito de especificar substituters adicionais via:
    #    1. `nixConfig.substituters` em `flake.nix`
    #    2. argumentos de linha de comando `--options substituters http://xxx`
    trusted-users = ["ryan"];

    substituters = [
      # espelho de cache localizado na China
      # status: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # status: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"
    ];

    trusted-public-keys = [
      # a chave pública padrão de cache.nixos.org, já está embutida, não precisa adicionar aqui
      "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
    ];
  };

}
```

O segundo método é configurar `substituters` e `trusted-public-keys` usando `nixConfig` no
`flake.nix`:

> Como mencionado, é essencial configurar `nix.settings.trusted-users` nesta configuração.
> Caso contrário, os `substituters` que definimos aqui não terão efeito.

```nix{5-23,43-47}
{
  description = "NixOS configuration of Ryan Yin";

  # o nixConfig aqui afeta apenas o flake em si, não a configuração do sistema!
  nixConfig = {
    # sobrescreve os substituters padrão
    substituters = [
      # espelho de cache localizado na China
      # status: https://mirror.sjtu.edu.cn/
      "https://mirror.sjtu.edu.cn/nix-channels/store"
      # status: https://mirrors.ustc.edu.cn/status/
      # "https://mirrors.ustc.edu.cn/nix-channels/store"

      "https://cache.nixos.org"

      # servidor de cache da comunidade nix
      "https://nix-community.cachix.org"
    ];
    trusted-public-keys = [
      # chave pública do servidor de cache da comunidade nix
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";

    # omitindo várias configurações...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # dado aos usuários desta lista o direito de especificar substituters adicionais via:
            #    1. `nixConfig.substituters` em `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];
          }
          # omitindo várias configurações...
       ];
      };
    };
  };
}
```

Finalmente, o terceiro método envolve usar o seguinte comando para especificar
temporariamente `substituters` e `trusted-public-keys` durante a implantação:

```bash
sudo nixos-rebuild switch --option substituters "https://nix-community.cachix.org" --option trusted-public-keys "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
```

Escolha um dos três métodos acima para configuração e implantação. Após uma implantação
bem-sucedida, todos os pacotes subsequentes procurarão preferencialmente por caches de
fontes de espelho (mirror sources) domésticas.

> Se o nome do seu sistema (hostname) não for `my-nixos`, você precisa modificar o nome de
> `nixosConfigurations` em `flake.nix` ou usar `--flake /etc/nixos#my-nixos` para
> especificar o nome da configuração.

### O Prefixo extra- para Parâmetros de Opções do Nix

Como mencionado, os `substituters` configurados pelos três métodos se sobrescreverão uns
aos outros, mas a situação ideal seria:

1. Em nível de sistema, em `/etc/nix/nix.conf`, configurar apenas os `substituters` e
   `trusted-public-keys` mais genéricos, como servidores de cache oficiais e fontes de
   espelho nacionais.
2. Em cada projeto flake `flake.nix`, configurar os `substituters` e `trusted-public-keys`
   específicos para esse projeto, como servidores de cache não oficiais da comunidade Nix.
3. Ao construir um projeto flake, o Nix deveria mesclar os `substituters` e
   `trusted-public-keys` configurados no `flake.nix` e em `/etc/nix/nix.conf`.

O Nix fornece o
[prefixo `extra-`](https://nixos.org/manual/nix/stable/command-ref/conf-file.html?highlight=extra#file-format)
para alcançar essa funcionalidade de mesclagem.

De acordo com a documentação oficial, se o valor do parâmetro `xxx` for uma lista, o valor
de `extra-xxx` será anexado ao final do parâmetro `xxx`:

Em outras palavras, você pode usá-lo assim:

```nix{7,13,37-60}
{
  description = "NixOS configuration of Ryan Yin";

  # o nixConfig aqui afeta apenas o flake em si, não a configuração do sistema!
  nixConfig = {
    # será anexado aos substituters de nível de sistema
    extra-substituters = [
      # servidor de cache da comunidade nix
      "https://nix-community.cachix.org"
    ];

    # será anexado às chaves públicas confiáveis de nível de sistema
    extra-trusted-public-keys = [
      # chave pública do servidor de cache da comunidade nix
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.05";

    # omitindo várias configurações...
  };

  outputs = inputs@{
      self,
      nixpkgs,
      ...
  }: {
    nixosConfigurations = {
      my-nixos = nixpkgs.lib.nixosSystem {
        system = "x86_64-linux";
        modules = [
          ./hardware-configuration.nix
          ./configuration.nix

          {
            # dado aos usuários desta lista o direito de especificar substituters adicionais via:
            #    1. `nixConfig.substituters` em `flake.nix`
            nix.settings.trusted-users = [ "ryan" ];

            # os substituters e chaves públicas confiáveis de nível de sistema
            nix.settings = {
              substituters = [
                # espelho de cache localizado na China
                # status: https://mirror.sjtu.edu.cn/
                "https://mirror.sjtu.edu.cn/nix-channels/store"
                # status: https://mirrors.ustc.edu.cn/status/
                # "https://mirrors.ustc.edu.cn/nix-channels/store"

                "https://cache.nixos.org"
              ];

              trusted-public-keys = [
                # a chave pública padrão de cache.nixos.org, já está embutida, não precisa adicionar aqui
                "cache.nixos.org-1:6NCHdD59X431o0gWypbMrAURkbJ16ZPMQFGspcDShjY="
              ];
            };

          }
          # omitindo várias configurações...
       ];
      };
    };
  };
}
```

## Acelerar Downloads de Pacotes via um Servidor Proxy {#accelerate-package-downloads-via-a-proxy-server}

> Referenciado do Issue:
> [roaming laptop: network proxy configuration - NixOS/nixpkgs](https://github.com/NixOS/nixpkgs/issues/27535#issuecomment-1178444327)
> Embora seja mencionado que um proxy transparente rodando em seu roteador ou máquina
> local possa resolver completamente a questão da lentidão no download de pacotes no
> NixOS, a configuração é bastante complicada e muitas vezes requer hardware adicional.

Alguns usuários podem preferir acelerar diretamente os downloads de pacotes usando um
proxy HTTP/Socks5 rodando em sua máquina. Aqui está como configurá-lo. O uso de métodos
como `export HTTPS_PROXY=http://127.0.0.1:7890` no Terminal não funcionará, pois o
trabalho real é feito por um processo em segundo plano chamado `nix-daemon`, e não por
comandos executados diretamente no Terminal.

Se você precisa usar um proxy apenas temporariamente, pode definir as variáveis de
ambiente do proxy com os seguintes comandos:

```bash
sudo mkdir -p /run/systemd/system/nix-daemon.service.d/
sudo tee /run/systemd/system/nix-daemon.service.d/override.conf <<EOF
[Service]
Environment="https_proxy=socks5h://localhost:7891"
EOF
sudo systemctl daemon-reload
sudo systemctl restart nix-daemon
```

Após a implantação dessa configuração, você pode verificar se as variáveis de ambiente
foram definidas executando `sudo cat /proc/$(pidof nix-daemon)/environ | tr '\0' '\n'`.

As configurações em `/run/systemd/system/nix-daemon.service.d/override.conf` serão
automaticamente excluídas quando o sistema for reiniciado, ou você pode excluí-las
manualmente e reiniciar o serviço nix-daemon para restaurar as configurações originais.

Se você deseja definir o proxy permanentemente, é recomendado salvar os comandos acima
como um script de shell e executá-lo a cada inicialização do sistema. Alternativamente,
você pode usar um proxy transparente ou TUN e outras soluções de proxy global.

> Também há pessoas na comunidade que definem permanentemente o proxy para o nix-daemon de
> forma declarativa usando `systemd.services.nix-daemon.environment`. No entanto, se o
> proxy encontrar problemas, será muito trabalhoso. O nix-daemon não funcionará
> corretamente, e a maioria dos comandos Nix não será executada corretamente. Além disso,
> a configuração do systemd em si é definida com proteção somente leitura, dificultando a
> modificação ou exclusão das configurações de proxy. Portanto, não é recomendado usar
> este método.

> Ao usar alguns proxies comerciais ou públicos, você pode encontrar erros HTTP 403 ao
> baixar do GitHub. (como descrito em
> [nixos-and-flakes-book/issues/74](https://github.com/ryan4yin/nixos-and-flakes-book/issues/74)).
> Nesses casos, você pode tentar mudar o servidor proxy ou configurar
> [access-tokens](https://github.com/NixOS/nix/issues/6536) para resolver o problema.
