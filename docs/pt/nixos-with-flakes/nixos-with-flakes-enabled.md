# NixOS com Flakes Habilitados

Comparado ao método de configuração padrão atualmente usado no NixOS, os Flakes oferecem
melhor reprodutibilidade. Sua clara definição de estrutura de pacotes suporta
inerentemente dependências de outros repositórios Git, facilitando o compartilhamento de
código. Portanto, este livro sugere o uso de Flakes para gerenciar as configurações do
sistema.

Esta seção descreve como usar Flakes para gerenciar a configuração do sistema NixOS, e
você não precisa saber nada sobre Flakes com antecedência.

## Habilitando o Suporte a Flakes para NixOS {#enable-nix-flakes}

Atualmente, Flakes ainda é uma funcionalidade experimental e não está habilitada por
padrão. Precisamos modificar manualmente o arquivo `/etc/nixos/configuration.nix` para
habilitar a funcionalidade Flakes e a nova ferramenta de linha de comando Nix que a
acompanha:

```nix{12,16}
{ config, pkgs, ... }:

{
  imports = [
    # Incluir os resultados da análise de hardware.
    ./hardware-configuration.nix
  ];

  # ......

  # Habilitar a funcionalidade Flakes e a nova ferramenta de linha de comando Nix
  nix.settings.experimental-features = [ "nix-command" "flakes" ];
  environment.systemPackages = with pkgs; [
    # Flakes clona suas dependências através do comando git,
    # então o git deve ser instalado primeiro
    git
    vim
    wget
  ];
  # Definir o editor padrão como vim
  environment.variables.EDITOR = "vim";

  # ......
}
```

Após fazer essas alterações, execute `sudo nixos-rebuild switch` para aplicar as
modificações. Em seguida, você pode usar a funcionalidade Flakes para gerenciar a
configuração do seu sistema.

A nova ferramenta de linha de comando Nix também oferece algumas funcionalidades
convenientes. Por exemplo, agora você pode usar o comando `nix repl` para abrir um
ambiente interativo Nix. Se estiver interessado, você pode usá-lo para revisar e testar
toda a sintaxe Nix que aprendeu anteriormente.

## Alternando a Configuração do Sistema para flake.nix {#switch-to-flake-nix}

Após habilitar a funcionalidade Flakes, o comando `sudo nixos-rebuild switch` dará
prioridade à leitura do arquivo `/etc/nixos/flake.nix` file, e, se não o encontrar,
tentará usar o `/etc/nixos/configuration.nix`.

Você pode começar usando os modelos oficiais para aprender a escrever um flake. Primeiro,
verifique quais modelos estão disponíveis:

```bash
nix flake show templates
```

Entre eles, o modelo `templates#full` demonstra todos os usos possíveis. Dê uma olhada em
seu conteúdo:

```bash
nix flake init -t templates#full
cat flake.nix
```

Com base neste modelo, crie o arquivo `/etc/nixos/flake.nix` e escreva o conteúdo da
configuração. Todas as modificações subsequentes do sistema serão gerenciadas pelos Nix
Flakes. Aqui está um exemplo do conteúdo:

```nix{16}
{
  description = "Um flake simples para NixOS";

  inputs = {
    # Fonte oficial de pacotes NixOS, usando o ramo nixos-25.05 aqui
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.05";
  };

  outputs = { self, nixpkgs, ... }@inputs: {
    # Por favor, substitua my-nixos pelo seu nome de host
    nixosConfigurations.my-nixos = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        # Importar o configuration.nix anterior que usamos,
        # para que o antigo arquivo de configuração ainda tenha efeito
        ./configuration.nix
      ];
    };
  };
}
```

Aqui definimos um sistema chamado `my-nixos`, com seu arquivo de configuração localizado
em `/etc/nixos/` como `./configuration.nix`. Isso significa que ainda estamos usando a
configuração antiga.

Agora, quando você executa `sudo nixos-rebuild switch` para aplicar a configuração, o
sistema não deve mudar em nada, pois simplesmente mudamos para usar os Nix Flakes, e o
conteúdo da configuração permanece consistente com o anterior.

> Se o nome do seu host não for `my-nixos`, você precisa modificar o nome de
> `nixosConfigurations` em `flake.nix`, ou usar `--flake /etc/nixos#my-nixos` para
> especificar o nome da configuração.

Após a mudança, podemos gerenciar o sistema através da funcionalidade Flakes.

Atualmente, nosso flake inclui estes arquivos:

- `/etc/nixos/flake.nix`: O ponto de entrada para o flake, que é reconhecido e implantado
  quando `sudo nixos-rebuild switch` é executado.
- `/etc/nixos/flake.lock`: O arquivo de bloqueio de versão gerado automaticamente, que
  registra as fontes de dados, os valores de hash e os números de versão de todas as
  entradas em todo o flake, garantindo a reprodutibilidade do sistema.
- `/etc/nixos/configuration.nix`: Este é o nosso arquivo de configuração anterior, que é
  importado como um módulo em `flake.nix`. Atualmente, todas as configurações do sistema
  são escritas neste arquivo.
- `/etc/nixos/hardware-configuration.nix`: ste é o arquivo de configuração de hardware do
  sistema, gerado pelo NixOS, que descreve as informações de hardware do sistema.

## Conclusão

Até este ponto, nós apenas adicionamos um arquivo de configuração muito simples,
`/etc/nixos/flake.nix`, que tem sido apenas um invólucro fino em torno de
`/etc/nixos/configuration.nix`, não oferecendo nenhuma nova funcionalidade e não
introduzindo nenhuma mudança disruptiva.

No conteúdo que se segue no livro, aprenderemos sobre a estrutura e funcionalidade de
`flake.nix` e gradualmente veremos os benefícios que tal invólucro pode trazer.

> Observação: O método de gerenciamento de configuração descrito neste livro NÃO é "Tudo
> em um único arquivo". É recomendado categorizar o conteúdo da configuração em diferentes
> arquivos Nix, e então introduzir esses arquivos de configuração na lista `modules` do
> `flake.nix`, e gerenciá-los com o Git.
>
> Os benefícios desta abordagem são uma melhor organização dos arquivos de configuração e
> uma melhor manutenibilidade da configuração. A seção
> [Modularizando a Configuração do NixOS](./modularize-the-configuration.md) irá explicar
> em detalhes como modularizar sua configuração do NixOS, e
> [ Outras Dicas Úteis - Gerenciando a Configuração do NixOS com Git](./other-useful-tips.md)
> irá introduzir várias melhores práticas para gerenciar a configuração do NixOS com o
> Git.

[nix flake - Nix Manual]:
  https://nixos.org/manual/nix/stable/command-ref/new-cli/nix3-flake#flake-inputs
[nixpkgs/flake.nix]: https://github.com/NixOS/nixpkgs/tree/nixos-25.05/flake.nix
[nixpkgs/nixos/lib/eval-config.nix]:
  https://github.com/NixOS/nixpkgs/tree/nixos-25.05/nixos/lib/eval-config.nix
[Module System - Nixpkgs]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/doc/module-system/module-system.chapter.md
[nixpkgs/nixos-25.05/lib/modules.nix - _module.args]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/lib/modules.nix#L122-L184
[nixpkgs/nixos-25.05/nixos/doc/manual/development/option-types.section.md#L237-L244]:
  https://github.com/NixOS/nixpkgs/blob/nixos-25.05/nixos/doc/manual/development/option-types.section.md?plain=1#L237-L244
