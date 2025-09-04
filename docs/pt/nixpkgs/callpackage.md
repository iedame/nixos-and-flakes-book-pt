# `pkgs.callPackage`

`pkgs.callPackage` é usado para parametrizar a construção de Nix Derivations. Para
entender seu propósito, vamos primeiro considerar como definiríamos um pacote Nix (também
conhecido como Derivation) sem usar `pkgs.callPackage`.

## 1. Sem `pkgs.callPackage`

Podemos definir um pacote Nix usando um código como este:

```nix
pkgs.writeShellScriptBin "hello" ''echo "hello, ryan!"''
```

Para verificar, você pode usar o `nix repl`, e verá que o resultado é de fato uma
_Derivation_:

```shell
› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.5. Type :? for help.

Loading installable ''...
Added 19203 variables.

nix-repl> pkgs.writeShellScriptBin "hello" '' echo "hello, xxx!" ''
«derivation /nix/store/zhgar12vfhbajbchj36vbbl3mg6762s8-hello.drv»
```

Embora a definição desta Derivation seja bastante concisa, a maioria das Derivations no
nixpkgs são muito mais complexas. Em seções anteriores, introduzimos e usamos
extensivamente o método `import xxx.nix` para importar expressões Nix de outros arquivos
Nix, o que pode melhorar a manutenibilidade do código.

1. Para melhorar a manutenibilidade, você pode armazenar a definição da Derivation em um
   arquivo separado, por exemplo, `hello.nix`.
   1. No entanto, o contexto dentro do `hello.nix` por si só não inclui a variável `pkgs`.
      Portanto, você precisará modificar seu conteúdo para passar `pkgs` como um parâmetro
      para `hello.nix`.
2. Nos locais onde você precisa usar esta Derivation, você pode usar
   `import ./hello.nix pkgs` para importar `hello.nix` e usar `pkgs` como um parâmetro
   para executar a função definida dentro dele.

Vamos continuar a verificar isso usando `nix repl`, e você verá que o resultado ainda é
uma Derivation:

```shell
› cat hello.nix
pkgs:
  pkgs.writeShellScriptBin "hello" '' echo "hello, xxx!" ''

› nix repl -f '<nixpkgs>'
Welcome to Nix 2.13.5. Type :? for help.

warning: Nix search path entry '/nix/var/nix/profiles/per-user/root/channels' does not exist, ignoring
Loading installable ''...
Added 19203 variables.

nix-repl> import ./hello.nix pkgs
«derivation /nix/store/zhgar12vfhbajbchj36vbbl3mg6762s8-hello.drv»
```

## 2. Usando `pkgs.callPackage`

No exemplo anterior, sem `pkgs.callPackage`, passamos `pkgs` diretamente como um parâmetro
para `hello.nix`. No entanto, esta abordagem tem algumas desvantagens:

1. Todas as outras dependências da Derivation `hello` estão fortemente acopladas a `pkgs`.
   1. Se precisarmos de dependências customizadas, temos que modificar `pkgs` ou o
      conteúdo de `hello.nix`, o que pode ser complicado.
2. Nos casos em que o `hello.nix` se torna complexo, é difícil determinar de quais
   Derivations de `pkgs` ele depende, tornando a análise das dependências entre as
   Derivations difícil.

`pkgs.callPackage`, como uma ferramenta para parametrizar a construção de Derivations,
resolve esses problemas. Vamos dar uma olhada em seu código-fonte e comentários
[nixpkgs/lib/customisation.nix#L101-L121](https://github.com/NixOS/nixpkgs/blob/fe138d3/lib/customisation.nix#L101-L121):

```nix
  /* Call the package function in the file `fn` with the required
    arguments automatically.  The function is called with the
    arguments `args`, but any missing arguments are obtained from
    `autoArgs`.  This function is intended to be partially
    parameterised, e.g.,

      callPackage = callPackageWith pkgs;
      pkgs = {
        libfoo = callPackage ./foo.nix { };
        libbar = callPackage ./bar.nix { };
      };

    If the `libbar` function expects an argument named `libfoo`, it is
    automatically passed as an argument.  Overrides or missing
    arguments can be supplied in `args`, e.g.

      libbar = callPackage ./bar.nix {
        libfoo = null;
        enableX11 = true;
      };
  */
  callPackageWith = autoArgs: fn: args:
    let
      f = if lib.isFunction fn then fn else import fn;
      fargs = lib.functionArgs f;

      # All arguments that will be passed to the function
      # This includes automatic ones and ones passed explicitly
      allArgs = builtins.intersectAttrs fargs autoArgs // args;

    # ......
```

Em essência, `pkgs.callPackage` é usado como `pkgs.callPackage fn args`, wonde o
placeholder `fn` é um arquivo ou função Nix, e `args` é um _attribute set_. Veja como
funciona:

1. `pkgs.callPackage fn args` primeiro verifica se `fn` é uma função ou um arquivo. Se for
   um arquivo, ele importa a função definida dentro dele.
   1. Após esta etapa, você tem uma função, tipicamente com parâmetros como `lib`,
      `stdenv`, `fetchurl` e, possivelmente, alguns parâmetros customizados.
2. Em seguida, `pkgs.callPackage fn args` mescla `args` com o attribute set `pkgs`. Se
   houver conflitos, os parâmetros em `args` irão sobrescrever aqueles em `pkgs`.
3. Então, `pkgs.callPackage fn args` extrai os parâmetros da função `fn` do attribute set
   mesclado e os usa para executar a função.
4. O resultado da execução da função é uma Derivation, que é um pacote Nix.

Como pode ser um arquivo ou função Nix, usado como argumento para `pkgs.callPackage`? Você
pode examinar exemplos que usamos antes em
[Uso Avançado do Nixpkgs - Introdução:](./intro.md): `hello.nix`, `fcitx5-rime.nix`,
`vscode/with-extensions.nix` e `firefox/common.nix`. Todos eles podem ser importados
usando `pkgs.callPackage`.

Por exemplo, se você definiu uma configuração de kernel customizada do NixOS em
`kernel.nix` e tornou o nome do ramo de desenvolvimento e o código-fonte do kernel
configuráveis:

```nix
{
  lib,
  stdenv,
  linuxManualConfig,

  src,
  boardName,
  ...
}:
(linuxManualConfig {
  version = "5.10.113-thead-1520";
  modDirVersion = "5.10.113";

  inherit src lib stdenv;

  # caminho do arquivo para o arquivo de configuração de kernel gerado (o `.config` gerado por make menuconfig)
  #
  # aqui está um uso especial para gerar um caminho de arquivo a partir de uma string
  configfile = ./. + "${boardName}_config";

  allowImportFromDerivation = true;
})
```

Você pode usar `pkgs.callPackage ./hello.nix {}` em qualquer módulo Nix para importá-lo e
usá-lo, substituindo qualquer um de seus parâmetros conforme necessário:

```nix
{ lib, pkgs, pkgsKernel, kernel-src, ... }:

{
  # ......

  boot = {
    # ......
    kernelPackages = pkgs.linuxPackagesFor (pkgs.callPackage ./pkgs/kernel {
        src = kernel-src;  # o código-fonte do kernel é passado como um `specialArgs` e injetado neste módulo.
        boardName = "licheepi4a";  # o nome da placa, usado para gerar o caminho do arquivo de configuração do kernel.
    });

  # ......
}
```

Como mostrado acima, usando `pkgs.callPackage`, você pode passar `src` e `boardName`
diferentes para a função definida em `kernel.nix`, para gerar diferentes pacotes de
kernel. Isso permite que você adapte o mesmo `kernel.nix` a diferentes códigos-fonte de
kernel e placas de desenvolvimento.

As vantagens de `pkgs.callPackage` são:

1. As definições de Derivation são parametrizadas, e todas as dependências da Derivation
   são os parâmetros da função em sua definição. Isso facilita a análise das dependências
   entre as Derivations.

2. Todas as dependências e outros parâmetros customizados da Derivation podem ser
   facilmente substituídos usando o segundo parâmetro de `pkgs.callPackage`, aprimorando
   enormemente a reutilização da Derivation.

3. Ao mesmo tempo em que alcança as duas funcionalidades acima, não aumenta a complexidade
   do código, já que todas as dependências em `pkgs` podem ser injetadas automaticamente.

Portanto, é sempre recomendado usar `pkgs.callPackage` para definir Derivations.

## Referências

- [Chapter 13. Callpackage Design Pattern - Nix Pills](https://nixos.org/guides/nix-pills/callpackage-design-pattern.html)
- [callPackage, a tool for the lazy - The Summer of Nix](https://summer.nixos.org/blog/callpackage-a-tool-for-the-lazy/)
- [Document what callPackage does and its preconditions - Nixpkgs Issues](https://github.com/NixOS/nixpkgs/issues/36354)
