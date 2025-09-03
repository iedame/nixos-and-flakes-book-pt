# A Nova Interface de Linha de Comando

Após habilitar os recursos `nix-command` e `flakes`, você pode começar a usar as
ferramentas de linha de comando da nova geração do Nix fornecidas por [New Nix
Commands][New Nix Commands]. Nesta seção, vamos focar em dois comandos: `nix shell` e
`nix run`. Outros comandos importantes, como o `nix build`, serão discutidos em detalhes
em [`nix develop` e `pkgs.mkShell`](/development/intro.md)

## `nix shell`

O comando `nix shell` permite que você entre em um ambiente com o pacote Nix especificado
e abra um shell interativo dentro desse ambiente:

```shell
# hello não está disponível
› hello
hello: comando não encontrado

# Entre em um ambiente com os pacotes 'hello' e `cowsay`
› nix shell nixpkgs#hello nixpkgs#cowsay

# hello agora está disponível
› hello
Hello, world!

# cowsay também está disponível
› cowsay "Hello, world!"
 _______
< hello >
 -------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||
```

## `nix run`

Por outro lado, o `nix run` cria um ambiente com o pacote Nix especificado e executa esse
pacote diretamente dentro do ambiente (sem instalá-lo no ambiente do sistema):

```shell
# hello não está disponível
› hello
hello: comando não encontrado

# Crie um ambiente com o pacote 'hello' e o execute.
› nix run nixpkgs#hello
Hello, world!
```

Como o `nix run` executa o pacote Nix diretamente, o pacote especificado como argumento
deve gerar um programa executável.

De acordo com a documentação do `nix run --help`, o `nix run` executa o comando
`<out>/bin/<name>`, onde `<out>` ié o diretório raiz da derivation e `<name>` é
selecionado na seguinte ordem:

- O atributo `meta.mainProgram` da derivation.
- O atributo `pname` da derivation.
- O conteúdo do atributo `name` da derivation com o número da versão removido.

Por exemplo, no caso do pacote 'hello' que testamos anteriormente, o nix run na verdade
executa o programa `$out/bin/hello`.

Aqui estão mais dois exemplos com explicações detalhadas dos parâmetros relevantes:

```bash
# Explicação do comando:
#   `nixpkgs#ponysay` significa o pacote 'ponysay' no flake 'nixpkgs'.
# `nixpkgs` é um ID do registro de flakes, e o Nix encontrará o endereço do repositório correspondente no GitHub a partir de <https://github.com/NixOS/flake-registry/blob/master/flake-registry.json>.
# Portanto, este comando cria um novo ambiente, instala e executa o pacote 'ponysay' fornecido pelo flake 'nixpkgs'.
# Observação: Foi mencionado anteriormente que um pacote Nix é uma das saídas de um flake.
echo "Hello Nix" | nix run "nixpkgs#ponysay"

# Este comando tem o mesmo efeito que o anterior, mas usa a URI completa do flake em vez do ID do registro de flakes.
echo "Hello Nix" | nix run "github:NixOS/nixpkgs/nixos-unstable#ponysay"
```

## Casos de Uso Comuns para `nix run` e `nix shell`

Esses comandos são comumente usados para executar programas de forma temporária. Por
exemplo, se eu quiser clonar meu repositório de configuração usando o Git em um novo host
NixOS sem ter o Git instalado, posso usar o seguinte comando:

```bash
nix run nixpkgs#git clone git@github.com:ryan4yin/nix-config.git
```

Como alternativa, posso usar o `nix shell` para entrar em um ambiente com o Git e, em
seguida, executar o comando `git clone`:

```bash
nix shell nixpkgs#git
git clone git@github.com:ryan4yin/nix-config.git
```

[New Nix Commands]: https://nixos.org/manual/nix/stable/command-ref/new-cli/nix.html
