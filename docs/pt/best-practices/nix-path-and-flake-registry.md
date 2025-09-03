# NIX_PATH Personalizado e Registro de Flake

## Introdução ao NIX_PATH {#nix-path-introduction}

O caminho de busca do **Nix** é controlado pela variável de ambiente `NIX_PATH`, que segue
o mesmo formato da variável de ambiente `PATH` do Linux, consistindo de múltiplos caminhos
separados por dois-pontos.

Caminhos em expressões do Nix que se parecem com `<name>` são resolvidos para o caminho
com o nome `name` definido no `NIX_PATH`.

Este padrão de uso não é mais recomendado com o recurso Flakes, porque resulta em
construções que dependem de uma variável de ambiente mutável, a `NIX_PATH`, o que
compromete a reprodutibilidade.

No entanto, em certos cenários, ainda precisamos usar o `NIX_PATH`, scomo quando usamos
frequentemente o comando `nix repl '<nixpkgs>'`, que utiliza o Nixpkgs encontrado através
da busca pelo `NIX_PATH`.

## Introdução ao Registro de Flakes {#flakes-registry-introduction}

O Registro de Flakes é um centro para registro de Flakes que nos ajuda a usar IDs mais
curtos em vez de endereços longos de repositório de flake ao usar comandos como `nix run`,
`nix shell`, e outros.

Por padrão, o Nix procura o endereço do repositório correspondente no GitHub para este ID
a partir de <https://github.com/NixOS/flake-registry/blob/master/flake-registry.json>.

Por exemplo, se executarmos `nix run nixpkgs#ponysay hello`, o Nix irá automaticamente
recuperar o endereço do repositório do GitHub para `nixpkgs` a partir do arquivo JSON
mencionado. Ele então baixa o repositório, localiza o `flake.nix` dentro, e executa o
pacote `ponysay` correspondente.

## NIX_PATH Personalizado e Registro de Flake {#custom-nix-path-and-flake-registry-1}

> **NOTA: Iniciantes devem pular esta seção! Desabilitar o `nix-channel` de forma
> incorreta pode causar algumas dores de cabeça.**

Os papéis do `NIX_PATH` e do Registro de Flakes foram explicados anteriormente. No uso
diário, nós geralmente queremos que o `nixpkgs` usado em comandos como
`nix repl '<nixpkgs>'` e `nix run nixpkgs#ponysay hello` corresponda ao `nixpkgs`. do
sistema. Isso é feito por padrão a partir do [NixOS 24.05][automatic flake registry]. Além
disso, embora o `nix-channel` possa coexistir com o recurso Flakes, na prática, os Flakes
podem substituí-lo completamente, então podemos também desabilitá-lo.

[automatic flake registry]: https://github.com/NixOS/nixpkgs/pull/254405

Na sua configuração do NixOS, adicionar o seguinte módulo irá cumprir os requisitos
mencionados:

```nix
{ nixpkgs, ... }: {
  nix.channel.enable = false; # Remover ferramentas e configurações relacionadas ao nix-channel, pois usamos flakes no lugar.

  # isso é definido automaticamente por nixpkgs.lib.nixosSystem
  # mas pode ser necessário caso não se esteja usando isso:
  # nixpkgs.flake.source = nixpkgs;
}
```

## Referências

- [Chapter 15. Nix Search Paths - Nix Pills](https://nixos.org/guides/nix-pills/nix-search-paths.html)
