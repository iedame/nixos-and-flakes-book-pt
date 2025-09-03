# Perguntas Frequentes

## Qual é a diferença entre a capacidade de rollback do NixOS e o rollback de snapshots de sistema do btrfs/zfs?

A diferença reside na natureza dos snapshots. Os snapshots de sistema criados com
btrfs/zfs não contêm o "conhecimento" de como construir este snapshot do zero; ele é
ininterpretável e seu conteúdo está fortemente correlacionado com o ambiente de hardware
atual, tornando difícil reproduzi-lo em outras máquinas.

Por outro lado, a configuração do NixOS é um pedaço de "conhecimento" que pode construir
um SO idêntico do zero. Ela é explicável e pode ser automaticamente construída com apenas
alguns comandos simples. O arquivo de configuração do NixOS serve como documentação de
todas as mudanças feitas no seu SO e também é usado para construir o próprio SO de forma
automática.

O arquivo de configuração do NixOS é como o código-fonte de um programa. Enquanto o
código-fonte estiver intacto, é fácil modificá-lo, revisá-lo ou reconstruir um programa
idêntico. Em contraste, os snapshots de sistema são como programas binários compilados a
partir do código-fonte, tornando muito mais difícil modificá-los ou revisá-los. Além
disso, os snapshots são grandes em tamanho, tornando o compartilhamento ou a migração mais
custosos em comparação com o código-fonte.

No entanto, isso não significa que o NixOS elimine a necessidade de snapshots de sistema.
Como mencionado no Capítulo 1 deste livro, o NixOS só pode garantir a reprodutibilidade
para tudo o que é declarado na configuração declarativa. Outros aspectos do sistema que
não são cobertos pela configuração declarativa, como dados dinâmicos em MySQL/PostgreSQL,
arquivos enviados por usuários, logs de sistema, vídeos, músicas e imagens nos diretórios
home dos usuários, ainda exigem snapshots de sistema ou outros meios de backup.

## Como o Nix se compara a ferramentas de gestão de sistema tradicionais, como o Ansible?

O Nix não é usado apenas para gerenciar ambientes de desktop, mas também é amplamente
empregado para a gestão em lote de servidores em nuvem. O
[NixOps](https://github.com/NixOS/nixops) oficial da comunidade NixOS e o
[colmena](https://github.com/zhaofengli/colmena) desenvolvido pela comunidade são
ferramentas projetadas especificamente para este caso de uso.

Quando comparado a ferramentas tradicionais amplamente utilizadas como o Ansible, o Nix
apresenta as seguintes vantagens principais:

1. Um dos maiores problemas com o Ansible é que cada deployment se baseia em mudanças
   incrementais no estado atual do sistema. O estado atual do sistema, assim como os
   snapshots mencionados anteriormente, não é ininterpretável e é difícil de reproduzir. O
   NixOS, por sua vez, declara o estado final do sistema por meio de seus arquivos de
   configuração, fazendo com que o resultado do deployment seja independente do estado
   atual do sistema, e deployments repetidos não causem problemas.
2. Nix Flakes usa um arquivo de bloqueio de versão (`flake.lock`) para fixar o valor de
   hash, o número da versão, a fonte de dados e outras informações de todas as
   dependências, o que melhora enormemente a reprodutibilidade do sistema. Ferramentas
   tradicionais como o Ansible não possuem esse recurso, o que as torna pouco
   reprodutíveis.
   1. É por isso que o Docker é tão popular — ele oferece, a um custo muito menor, um
      ambiente de sistema reprodutível em uma ampla gama de máquinas, algo que ferramentas
      tradicionais de Ops, como o Ansible, não conseguem.
3. O Nix proporciona um alto grau de facilidade na personalização do sistema ao blindar os
   detalhes de implementação subjacentes com uma camada de abstração declarativa, de modo
   que os usuários precisam se preocupar apenas com seus requisitos essenciais.
   Ferramentas como o Ansible possuem abstrações muito mais fracas.
   1. Se você já usou uma ferramenta de configuração declarativa como o Terraform ou o
      Kubernetes, isso deve ser fácil de entender. Quanto mais complexos forem os
      requisitos, maior será o benefício da configuração declarativa.

## Quais são as vantagens do Nix em comparação com a tecnologia de contêineres Docker?

Nix e tecnologias de contêineres como Docker têm casos de uso que se sobrepõem, tais como:

1. Muitas pessoas usam o Nix para gerenciar ambientes de desenvolvimento e build, como
   discutido neste livro. Por outro lado, tecnologias como
   [Dev Containers](https://github.com/devcontainers/spec), que constroem ambientes de
   desenvolvimento baseados em contêineres, também são populares.
2. A área de DevOps/SRE é atualmente dominada por tecnologias de contêineres baseadas em
   Dockerfiles. Distribuições comumente usadas como Ubuntu/Debian são frequentemente
   utilizadas dentro de contêineres, e também existem opções maduras disponíveis para a
   máquina host. Nesse contexto, quais vantagens significativas a migração para o NixOS
   oferece?

Em relação ao primeiro ponto, o de "gerenciar ambientes de desenvolvimento e build", o Nix
oferece uma experiência de ambiente de desenvolvimento que se assemelha muito a trabalhar
diretamente na máquina host. Isso apresenta várias vantagens sobre os Dev Containers,
conforme descrito a seguir:

1. O Nix não utiliza namespaces para isolamento de sistema de arquivos e rede, permitindo
   uma interação fácil com o sistema de arquivos da máquina host (incluindo /dev para
   dispositivos externos) e o ambiente de rede dentro do ambiente de desenvolvimento
   criado pelo Nix. Por outro lado, contêineres exigem várias mapeamentos para permitir a
   comunicação entre o contêiner e o sistema de arquivos da máquina host, o que às vezes
   pode levar a problemas de permissões de arquivo.
2. Devido à ausência de um forte isolamento, ambientes de desenvolvimento Nix não têm
   problemas para suportar aplicações GUI. Executar programas com interface gráfica nesse
   ambiente é tão fluído quanto executá-los no ambiente do sistema.

Em outras palavras, o Nix oferece uma experiência de desenvolvimento que é a mais próxima
da máquina host, sem um isolamento forte. Os desenvolvedores podem usar ferramentas de
desenvolvimento e depuração familiares nesse ambiente, e sua experiência de
desenvolvimento anterior pode ser migrada de forma transparente. Por outro lado, se Dev
Containers forem usados, os desenvolvedores podem encontrar vários problemas relacionados
à comunicação com o sistema de arquivos, ambiente de rede, permissões de usuário e a
incapacidade de usar ferramentas de depuração GUI devido ao forte isolamento.

Se decidirmos usar o Nix para gerenciar todos os ambientes de desenvolvimento, então a
criação de contêineres Docker baseados em Nix proporcionaria o mais alto nível de
consistência. Além disso, a adoção de uma arquitetura tecnológica unificada para todos os
ambientes reduz significativamente os custos de manutenção de infraestrutura. Isso
responde ao segundo ponto mencionado anteriormente: quando o gerenciamento de ambientes de
desenvolvimento com Nix é um pré-requisito, a utilização do NixOS para imagens base de
contêineres e servidores na nuvem oferece vantagens distintas.

## erro: collision between `...` and `...`

Esse erro ocorre quando você instala dois pacotes que dependem da mesma biblioteca, mas
com versões diferentes, no mesmo perfil (módulo home ou módulo nixos).

Por exemplo, se você tiver a seguinte configuração:

```nix
{
   # como módulo nixos
   # environment.systemPackages = with pkgs; [
   #
   # ou como módulo home manager
   home.packages = with pkgs; [
     lldb

     (python311.withPackages (ps:
       with ps; [
         ipython
         pandas
         requests
         pyquery
         pyyaml
       ]
     ))
   ];
}
```

Isso causará o seguinte erro:

```bash
error: builder for '/nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv' failed with exit code 25;
       last 1 log lines:
       > error: collision between `/nix/store/kvq0gvz6jwggarrcn9a8ramsfhyh1h9d-lldb-14.0.6/lib/python3.11/site-packages/six.py'
and `/nix/store/370s8inz4fc9k9lqk4qzj5vyr60q166w-python3-3.11.6-env/lib/python3.11/site-packages/six.py'
       For full logs, run 'nix log /nix/store/n3scj3s7v9jsb6y3v0fhndw35a9hdbs6-home-manager-path.drv'.
```

Aqui estão algumas soluções:

1. Separe os dois pacotes em dois **perfis** diferentes. Por exemplo, você pode instalar
   `lldb` via `environment.systemPackages` e `python311` via `home.packages`.
2. Diferentes versões do Python3 são tratadas como pacotes distintos. Portanto, você pode
   mudar a sua versão customizada do Python3 para `python310` para evitar o conflito.
3. Use `override` para sobrescrever a versão da biblioteca utilizada pelo pacote, de forma
   que ela seja consistente com a versão utilizada pelo outro pacote.

```nix
{
  # como módulo nixos
  # environment.systemPackages = with pkgs; [
  #
  # ou como módulo home manager
  home.packages = let
    custom-python3 = (pkgs.python311.withPackages (ps:
      with ps; [
        ipython
        pandas
        requests
        pyquery
        pyyaml
      ]
    ));
  in
    with pkgs; [
      # sobrescrevendo a versão do python3
      # NOTA: Isso irá disparar um rebuild do lldb, o que leva tempo.
      (lldb.override {
        python3 = custom-python3;
      })

      custom-python3
  ];
}
```
