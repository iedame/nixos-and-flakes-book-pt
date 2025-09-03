# Nix Store e Cache Binário

Aqui, apresentamos uma breve introdução ao Nix Store, cache binário do Nix e conceitos
relacionados, sem aprofundar em configurações e métodos de uso específicos, que serão
abordados em detalhes nos capítulos subsequentes.

## Nix Store

O Nix Store é um dos conceitos centrais do gerenciador de pacotes Nix. Trata-se de um
sistema de arquivos somente leitura (read-only) usado para armazenar todos os arquivos que
requerem imutabilidade, incluindo os resultados da construção de pacotes de software,
metadados dos pacotes e todas as entradas de construção dos pacotes.

O gerenciador de pacotes Nix utiliza a linguagem funcional Nix para descrever pacotes de
software e suas dependências. Cada pacote de software é tratado como a saída de uma função
pura (pure function), e os resultados da construção do pacote são armazenados no Nix
Store.

Os dados no Nix Store possuem um formato de caminho fixo:

```
/nix/store/b6gvzjyb2pg0kjfwrjmg1vfhh54ad73z-firefox-33.1
|--------| |------------------------------| |----------|
diretório da store         digest                  nome
```

Como visto, os caminhos no Nix Store começam com um valor de hash (digest), seguido pelo
nome e número da versão do pacote de software. Este valor de hash é calculado com base em
todas as informações de entrada do pacote de software (parâmetros de construção,
dependências, versões das dependências, etc.). Qualquer alteração nos parâmetros de
construção ou nas dependências resultará em uma mudança no valor de hash, garantindo assim
a unicidade de cada caminho de pacote de software. Além disso, como o Nix Store é um
sistema de arquivos somente leitura, ele garante a imutabilidade dos pacotes de software –
uma vez que um pacote é construído, ele não será alterado.

Como o caminho de armazenamento do resultado da construção é calculado com base em todas
as informações de entrada do processo de construção, a mesma informação de entrada
produzirá o mesmo caminho de armazenamento. Este design também é conhecido como Modelo
Baseado em Entrada (Input-addressed Model).

### Como o NixOS Utiliza o Nix Store

A configuração declarativa do NixOS calcula quais pacotes de software precisam ser
instalados e, em seguida, cria links simbólicos (soft-links) dos caminhos de armazenamento
desses pacotes no Nix Store para `/run/current-system`. Ao modificar variáveis de ambiente
como `PATH` para apontar para a pasta correspondente em `/run/current-system`, a
instalação dos pacotes de software é concluída. A cada vez que uma implantação é
realizada, o NixOS calcula a nova configuração do sistema, limpa os links simbólicos
antigos e recria novos para garantir que o ambiente do sistema corresponda à configuração
declarativa.

O home-manager funciona de forma semelhante, criando links simbólicos dos pacotes de
software configurados pelo usuário para `/etc/profiles/per-user/your-username` e
modificando variáveis de ambiente como `PATH` para apontar para este caminho, instalando
assim os pacotes de software do usuário.

```bash
# Verificar de onde vem o `bash` no ambiente (instalado via NixOS)
› which bash
╭───┬─────────┬─────────────────────────────────┬──────────╮
│ # │ command │              path               │   type   │
├───┼─────────┼─────────────────────────────────┼──────────┤
│ 0 │ bash    │ /run/current-system/sw/bin/bash │ external │
╰───┴─────────┴─────────────────────────────────┴──────────╯

› ls -al /run/current-system/sw/bin/bash
lrwxrwxrwx 15 root root 76 1970年 1月 1日 /run/current-system/sw/bin/bash -> /nix/store/1zslabm02hi75anb2w8zjrqwzgs0vrs3-bash-interactive-5.2p26/bin/bash

# Verificar de onde vem o `cowsay` no ambiente (instalado via home-manager)
› which cowsay
╭───┬─────────┬────────────────────────────────────────┬──────────╮
│ # │ command │                  path                  │   type   │
├───┼─────────┼────────────────────────────────────────┼──────────┤
│ 0 │ cowsay  │ /etc/profiles/per-user/ryan/bin/cowsay │ external │
╰───┴─────────┴────────────────────────────────────────┴──────────╯

› ls -al /etc/profiles/per-user/ryan/bin/cowsay
lrwxrwxrwx 2 root root 72 1970年 1月 1日 /etc/profiles/per-user/ryan/bin/cowsay -> /nix/store/w2czyf82gxz4vy9kzsdhr88112bmc0c1-home-manager-path/bin/cowsay
```

O comando `nix develop`, por outro lado, adiciona diretamente os caminhos de armazenamento
dos pacotes de software a variáveis de ambiente como `PATH` e `LD_LIBRARY_PATH`,
permitindo que o ambiente de shell recém-criado utilize diretamente esses pacotes de
software ou bibliotecas.

Por exemplo, no repositório do código-fonte deste livro,
[ryan4yin/nixos-and-flakes-book](https://github.com/ryan4yin/nixos-and-flakes-book), após
a execução do comando `nix develop`, podemos inspecionar o conteúdo da variável de
ambiente `PATH`:

```bash
› nix develop
node v20.9.0
› env | egrep '^PATH'
PATH=/nix/store/h13fnmpm8m28qypsba2xysi8a90crphj-pre-commit-3.6.0/bin:/nix/store/2mqyvwp96d4jynsnzgacdk5rg1kx2a9a-node2nix-1.11.0/bin:/nix/store/a1hckfqzyys4rfgbdy5kmb5w0zdr55i5-nodejs-20.9.0/bin:/nix/store/gjrfcl2bhv7kbj883k7b18n2aprgv4rf-pnpm-8.10.2/bin:/nix/store/z6jfxqyj1wq62iv1gn5b5d9ms6qigkg0-yarn-1.22.19/bin:/nix/store/2k5irl2cfw5m37r3ibmpq4f7jndb41a8-prettier-3.0.3/bin:/nix/store/zrs710jpfn7ngy5z4c6rrwwjq33b2a0y-git-2.42.0/bin:/nix/store/dkmyyrkyl0racnhsaiyf7rxf43yxhx92-typos-1.16.23/bin:/nix/store/imli2in1nr1h8qh7zh62knygpl2zj66l-alejandra-3.0.0/bin:/nix/store/85jldj870vzcl72yz03labc93bwvqayx-patchelf-0.15.0/bin:/nix/store/90h6k8ylkgn81k10190v5c9ldyjpzgl9-gcc-wrapper-12.3.0/bin:/nix/store/hf2gy3km07d5m0p1lwmja0rg9wlnmyr7-gcc-12.3.0/bin:/nix/store/cx01qk0qyylvkgisbwc7d3pk8sliccgh-glibc-2.38-27-bin/bin:/nix/store/bblyj5b3ii8n6v4ra0nb37cmi3lf8rz9-coreutils-9.3/bin:/nix/store/1alqjnr40dsk7cl15l5sn5y2zdxidc1v-binutils-wrapper-2.40/bin:/nix/store/1fn92b0783crypjcxvdv6ycmvi27by0j-binutils-2.40/bin:/nix/store/bblyj5b3ii8n6v4ra0nb37cmi3lf8rz9-coreutils-9.3/bin:/nix/store/l974pi8a5yqjrjlzmg6apk0jwjv81yqw-findutils-4.9.0/bin:/nix/store/8q25nyfirzsng6p57yp8hsaldqqbc7dg-diffutils-3.10/bin:/nix/store/9c5qm297qnvwcf7j0gm01qrslbiqz8rs-gnused-4.9/bin:/nix/store/rx2wig5yhpbwhnqxdy4z7qivj9ln7fab-gnugrep-3.11/bin:/nix/store/7wfya2k95zib8jl0jk5hnbn856sqcgfk-gawk-5.2.2/bin:/nix/store/xpidksbd07in3nd4sjx79ybwwy81b338-gnutar-1.35/bin:/nix/store/202iqv4bd7lh6f7fpy48p7q4d96lqdp7-gzip-1.13/bin:/nix/store/ik7jardq92dxw3fnz3vmlcgi9c8dwwdq-bzip2-1.0.8-bin/bin:/nix/store/v4iswb5kwj33l46dyh2zqh0nkxxlr3mz-gnumake-4.4.1/bin:/nix/store/q1c2flcykgr4wwg5a6h450hxbk4ch589-bash-5.2-p15/bin:/nix/store/cbj1ph7zi009m53hxs90idl1f5i9i941-patch-2.7.6/bin:/nix/store/76z4cjs7jj45ixk12yy6k5z2q2djk2jb-xz-5.4.4-bin/bin:/nix/store/qmfxld7qhk8qxlkx1cm4bkplg1gh6jgj-file-5.45/bin:/home/ryan/.local/bin:/home/ryan/go/bin:/home/ryan/.config/emacs/bin:/home/ryan/.local/bin:/home/ryan/go/bin:/home/ryan/.config/emacs/bin:/nix/store/jsc6jydv5zjpb3dvh0lxw2dzxmv3im9l-kitty-0.32.1/bin:/nix/store/ihpdcszhj8bdmyr0ygvalqw9zagn0jjz-imagemagick-7.1.1-28/bin:/nix/store/2bm2yd5jqlwf6nghlyp7z88g28j9n8r0-ncurses-6.4-dev/bin:/run/wrappers/bin:/guix/current/bin:/home/ryan/.guix-home/profile/bin:/home/ryan/.guix-profile/bin:/home/ryan/.nix-profile/bin:/nix/profile/bin:/home/ryan/.local/state/nix/profile/bin:/etc/profiles/per-user/ryan/bin:/nix/var/nix/profiles/default/bin:/run/current-system/sw/bin:/nix/store/c53f8hagyblvx52zylsnqcc0b3nxbrcl-binutils-wrapper-2.40/bin:/nix/store/fpagbmzdplgky01grwhxcsazvhynv1nz-pciutils-3.10.0/bin:/nix/store/4cjqvbp1jbkps185wl8qnbjpf8bdy8j9-gcc-wrapper-13.2.0/bin
```

Fica claro que o `nix develop` adicionou os caminhos de armazenamento de muitos pacotes de
software diretamente à variável de ambiente `PATH`.

## Coleta de Lixo do Nix Store

O Nix Store é um sistema de armazenamento centralizado onde todas as entradas e saídas da
construção de pacotes de software são armazenadas. Com o uso do sistema, o número de
pacotes de software no Nix Store aumentará, e o espaço em disco ocupado se tornará maior.

Para evitar que o Nix Store cresça indefinidamente, o gerenciador de pacotes Nix fornece
um mecanismo de coleta de lixo (garbage collection) para o Nix Store local, a fim de
limpar dados antigos e recuperar espaço de armazenamento.

De acordo com o
[Capítulo 11. O Coletor de Lixo - nix pills](https://nixos.org/guides/nix-pills/garbage-collector),
o comando `nix-store --gc` realiza a coleta de lixo percorrendo recursivamente todos os
links simbólicos no diretório `/nix/var/nix/gcroots/` para encontrar todos os pacotes
referenciados e excluir aqueles que não são mais referenciados. O comando
`nix-collect-garbage --delete-old` vai um passo além, primeiro excluindo todos os perfis
antigos ([profiles](https://nixos.org/manual/nix/stable/command-ref/files/profiles)) e, em
seguida, executando o comando `nix-store --gc` para limpar os pacotes que não são mais
referenciados.

É importante notar que os resultados de construção de comandos como `nix build` e
`nix develop` não são automaticamente adicionados a `/nix/var/nix/gcroots/`, portanto,
esses resultados de construção podem ser limpos pelo mecanismo de coleta de lixo. Você
pode usar `nix-instantiate` com `keep-outputs = true` e outros meios para evitar isso, mas
atualmente prefiro configurar meu próprio servidor de cache binário (binary cache server)
e configurar um tempo de cache mais longo (por exemplo, um ano), para então enviar dados
para o servidor de cache. Desta forma, é possível compartilhar resultados de construção
entre várias máquinas e evitar que os resultados de construção locais sejam limpos pelo
mecanismo de coleta de lixo local, atingindo dois objetivos em um.

## Cache Binário

O design do Nix e do Nix Store garante a imutabilidade dos pacotes de software, permitindo
que os resultados da construção sejam compartilhados diretamente entre múltiplas máquinas.
Enquanto essas máquinas usarem as mesmas informações de entrada para construir um pacote,
elas obterão o mesmo caminho de saída, e o Nix pode reutilizar os resultados de construção
de outras máquinas em vez de reconstruir o pacote, acelerando assim a instalação dos
pacotes de software.

O cache binário do Nix é projetado com base nesta funcionalidade; é uma implementação do
Nix Store que armazena dados em um servidor remoto em vez de localmente. Quando
necessário, o gerenciador de pacotes Nix baixa os resultados de construção correspondentes
do servidor remoto para o `/nix/store` local, evitando o demorado processo de construção
local.

O Nix fornece um servidor de cache binário oficial em <https://cache.nixos.org>, que
armazena em cache os resultados de construção para a maioria dos pacotes em nixpkgs para
arquiteturas de CPU comuns. Quando você executa um comando de construção Nix em sua
máquina local, o Nix primeiro tenta encontrar o cache binário correspondente no servidor
de cache. Se encontrado, ele fará o download direto do arquivo de cache, ignorando a
demorada compilação local e acelerando significativamente o processo de construção.

## Modelo de Confiança do Cache Binário do Nix

O Modelo Baseado em Entrada (Input-addressed Model) garante apenas que a mesma entrada
produzirá o mesmo caminho de saída, mas não garante a unicidade do conteúdo de saída. Isso
significa que, mesmo com as mesmas informações de entrada, múltiplas construções do mesmo
pacote de software podem produzir conteúdos de saída diferentes.

Embora o Nix tenha tomado medidas como desabilitar o acesso à rede no ambiente de
construção e usar carimbos de data e hora fixos (fixed timestamps) para minimizar a
incerteza, ainda existem alguns fatores incontroláveis que podem influenciar o processo de
construção e produzir conteúdos de saída diferentes. Essas diferenças no conteúdo de saída
geralmente não afetam a funcionalidade do pacote de software, mas representam um desafio
para o compartilhamento seguro do cache binário – a incerteza no conteúdo de saída torna
difícil determinar se o cache binário baixado do servidor de cache foi realmente
construído com as informações de entrada declaradas e se contém conteúdo malicioso.

Para resolver isso, o gerenciador de pacotes Nix usa um mecanismo de assinatura de chave
pública-privada para verificar a fonte e a integridade do cache binário. Isso transfere a
responsabilidade pela segurança para o usuário. Se você deseja usar um servidor de cache
não oficial para acelerar o processo de construção, você deve adicionar a chave pública
desse servidor a `trusted-public-keys` e assumir os riscos de segurança associados – o
servidor de cache pode fornecer dados em cache que incluem conteúdo malicioso.

### Modelo Baseado em Conteúdo (Content-addressed Model)

O
[RFC062 - content-addressed store paths](https://github.com/NixOS/rfcs/blob/master/rfcs/0062-content-addressed-paths.md)
é uma tentativa da comunidade de melhorar a consistência dos resultados de construção. Ele
propõe uma nova maneira de calcular os caminhos de armazenamento com base nos resultados
de construção (saídas) em vez das informações de entrada (entradas). Este design garante a
consistência nos resultados de construção – se os resultados de construção forem
diferentes, os caminhos de armazenamento também serão diferentes, evitando assim a
incerteza no conteúdo de saída inerente ao modelo baseado em entrada.

No entanto, esta abordagem ainda está em fase experimental e não foi amplamente adotada.

## Referências

- [Nix Store - Nix Manual](https://nixos.org/manual/nix/stable/store/)
