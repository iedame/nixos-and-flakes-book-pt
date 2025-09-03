# Sobrescrevendo com override

No Nix, você pode customizar pacotes `pkgs` usando a função `override`, que permite
definir parâmetros de build customizados e retorna uma nova derivation com os valores
sobrescritos. Vamos dar uma olhada em um exemplo:

```nix
pkgs.fcitx5-rime.override { rimeDataPkgs = [ ./rime-data-flypy ]; }
```

No exemplo acima, sobrescrevemos o parâmetro `rimeDataPkgs` da derivation `fcitx5-rime`
para usar um pacote customizado chamado `rime-data-flypy`. Isso cria uma nova derivation
onde `rimeDataPkgs` é sobrescrito, enquanto outros parâmetros permanecem inalterados.

Para descobrir quais parâmetros de um pacote específico podem ser sobrescritos, existem
algumas abordagens que você pode seguir:

1. Verifique o código-fonte do pacote no repositório Nixpkgs no GitHub, como
   [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix).
   Certifique-se de selecionar o ramo apropriado, como `nixos-unstable`, se você estiver
   usando esse ramo.
2. Use o comando `nix repl -f '<nixpkgs>'` para abrir um REPL (Read-Eval-Print Loop) Nix
   e, em seguida, digite `:e pkgs.fcitx5-rime`. Isso abrirá o código-fonte do pacote em
   seu editor padrão, onde você pode ver todos os parâmetros do pacote. Para aprender o
   uso básico do `nix repl`, você pode digitar `:?` para ver a informação de ajuda.

Usando esses métodos, você pode descobrir os parâmetros de entrada de um pacote e
determinar quais podem ser modificados usando `override`.

Por exemplo, vamos dar uma olhada no código-fonte de
[pkgs.hello](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/applications/misc/hello/default.nix):

```nix
{ callPackage
, lib
, stdenv
, fetchurl
, nixos
, testers
, hello
}:

stdenv.mkDerivation (finalAttrs: {
  pname = "hello";
  version = "2.12.1";

  src = fetchurl {
    url = "mirror://gnu/hello/hello-${finalAttrs.version}.tar.gz";
    sha256 = "sha256-jZkUKv2SV28wsM18tCqNxoCZmLxdYH2Idh9RLibH2yA=";
  };

  doCheck = true;

  # ...
})
```

Neste exemplo, os atributos `pname`, `version`, `src` e `doCheck` podem todos ser
sobrescritos usando `overrideAttrs`. Por exemplo:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  doCheck = false;
});
```

No código acima, usamos `overrideAttrs` para sobrescrever o atributo `doCheck`, enquanto
deixamos os outros atributos inalterados.

Você também pode sobrescrever alguns atributos padrão definidos em `stdenv.mkDerivation`
usando `overrideAttrs`. Por exemplo:

```nix
helloWithDebug = pkgs.hello.overrideAttrs (finalAttrs: previousAttrs: {
  separateDebugInfo = true;
});
```

Neste caso, sobrescrevemos o atributo `separateDebugInfo`, que é definido em
`stdenv.mkDerivation`, e não no código-fonte de `hello`.

Para ver todos os atributos definidos em `stdenv.mkDerivation`, você pode verificar seu
código-fonte usando `nix repl -f '<nixpkgs>'` e digitando `:e stdenv.mkDerivation`.

Isso abrirá o código-fonte em seu editor padrão. Se você é novo no uso do `nix repl`, pode
digitar `:?` para ver a informação de ajuda.
