# Primeiros Passos com o NixOS

Agora que aprendemos o básico da linguagem Nix, podemos começar a usá-la para configurar
nosso sistema NixOS. O arquivo de configuração padrão para o NixOS está localizado em
`/etc/nixos/configuration.nix`. Este arquivo contém toda a configuração declarativa para o
sistema, incluindo definições para fuso horário, idioma, layout de teclado, rede,
usuários, sistema de arquivos e opções de boot.

Para modificar o estado do sistema de maneira reprodutível (o que é altamente
recomendado), precisamos editar manualmente o arquivo `/etc/nixos/configuration.nix` e, em
seguida, executar `sudo nixos-rebuild switch` para aplicar a configuração modificada. Este
comando gera um novo ambiente de sistema com base no arquivo de configuração modificado,
define o novo ambiente como o padrão e preserva o ambiente anterior nas opções de boot do
grub/systemd-boot. Isso garante que sempre podemos reverter para o ambiente antigo, mesmo
se o novo falhar ao iniciar.

Embora `/etc/nixos/configuration.nix` seja o método clássico para configurar o NixOS, ele
depende de fontes de dados configuradas por `nix-channel` e carece de um mecanismo de
bloqueio de versão, tornando difícil garantir a reprodutibilidade do sistema. Uma
abordagem melhor é usar os Flakes, que fornecem reprodutibilidade e facilitam o
gerenciamento da configuração.

Nesta seção, primeiro aprenderemos como gerenciar o NixOS usando o método clássico
(`/etc/nixos/configuration.nix`), e, em seguida, exploraremos os Flakes, que são mais
avançados.

## Configurando o Sistema Usando `/etc/nixos/configuration.nix`

O arquivo `/etc/nixos/configuration.nix` é o método padrão e clássico para configurar o
NixOS. Embora lhe faltem algumas das funcionalidades avançadas dos Flakes, ele ainda é
amplamente utilizado e oferece flexibilidade na configuração do sistema.

Para ilustrar como usar o `/etc/nixos/configuration.nix`, vamos considerar um exemplo onde
habilitamos o SSH e adicionamos um usuário chamado `ryan` ao sistema. Podemos alcançar
isso adicionando o seguinte conteúdo ao `/etc/nixos/configuration.nix`:

```nix{14-38}
# Edite este arquivo de configuração para definir o que deve ser instalado em
# seu sistema. A ajuda está disponível na página de manual de configuration.nix(5)
# e no manual do NixOS (acessível executando 'nixos-help').
{ config, pkgs, ... }:

{
  imports =
    [ # Inclua os resultados da análise de hardware.
      ./hardware-configuration.nix
    ];

  # Omitir configurações anteriores...

  # Adicionar usuário 'ryan'
  users.users.ryan = {
    isNormalUser = true;
    description = "ryan";
    extraGroups = [ "networkmanager" "wheel" ];
    openssh.authorizedKeys.keys = [
        # Substitua pela sua própria chave pública
        "ssh-ed25519 <some-public-key> ryan@ryan-pc"
    ];
    packages = with pkgs; [
      firefox
    #  thunderbird
    ];
  };

  # Habilitar o daemon OpenSSH.
  services.openssh = {
    enable = true;
    settings = {
      X11Forwarding = true;
      PermitRootLogin = "no"; # desabilitar login de root
      PasswordAuthentication = false; # desabilitar login por senha
    };
    openFirewall = true;
  };

  # Omitir o resto da configuração...
}
```

Nesta configuração, declaramos nossa intenção de habilitar o serviço openssh, adicionar
uma chave pública SSH para o usuário `ryan` e desabilitar o login por senha.

Para implantar a configuração modificada, execute `sudo nixos-rebuild switch`. Este
comando irá aplicar as alterações, gerar um novo ambiente de sistema e defini-lo como o
padrão. Agora você pode fazer login no sistema usando SSH com as chaves SSH configuradas.

> Você sempre pode tentar adicionar `--show-trace --print-build-logs --verbose` ao comando
> `nixos-rebuild` para obter uma mensagem de erro detalhada caso encontre algum erro
> durante a implantação.

Lembre-se de que quaisquer alterações reprodutíveis no sistema podem ser feitas
modificando o arquivo `/etc/nixos/configuration.nix` e implantando as alterações com
`sudo nixos-rebuild switch`.

Para encontrar opções de configuração e documentação:

- Use motores de busca como o Google, por exemplo, pesquise por `Chrome NixOS` para
  encontrar informações relacionadas ao NixOS sobre o Chrome. A Wiki do NixOS e o
  código-fonte do Nixpkgs geralmente estão entre os primeiros resultados.
- Utilize a [Pesquisa de Opções do NixOS](https://search.nixos.org/options) para buscar
  palavras-chave.
- Consulte a
  [seção de Configuração](https://nixos.org/manual/nixos/unstable/index.html#ch-configuration)
  no Manual do NixOS para documentação sobre configuração em nível de sistema.
- Busque por palavras-chave diretamente no código-fonte do
  [nixpkgs](https://github.com/NixOS/nixpkgs) no GitHub.

## Referências

- [Overview of the NixOS Linux distribution](https://wiki.nixos.org/wiki/Overview_of_the_NixOS_Linux_distribution)
