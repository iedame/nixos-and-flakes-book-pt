# Múltiplas Instâncias do Nixpkgs

Na seção
[Fazendo Downgrade ou Upgrade de Pacotes](../nixos-with-flakes/downgrade-or-upgrade-packages.md),
vimos como instanciar múltiplas instâncias distintas do nixpkgs usando o método
`import nixpkgs {...}` e usá-las em qualquer submódulo via `specialArgs`. Existem inúmeras
aplicações para esta técnica, e algumas das mais comuns incluem:

1. Instanciar instâncias do nixpkgs com diferentes IDs de commit para instalar várias
   versões de pacotes de software. Esta abordagem foi usada na seção anterior
   [Fazendo Downgrade ou Upgrade de Pacotes](/nixos-with-flakes/downgrade-or-upgrade-packages.md).

2. Se você deseja utilizar overlays sem afetar a instância nixpkgs padrão, pode instanciar
   uma nova instância nixpkgs e aplicar overlays a ela.
   - O `nixpkgs.overlays = [...];` mencionado na seção anterior sobre Overlays modifica
     diretamente a instância global do nixpkgs. Se seus overlays fizerem alterações em
     alguns pacotes de baixo nível, isso pode impactar outros módulos. Uma desvantagem é o
     aumento na compilação local (devido à invalidação do cache), e também pode haver
     problemas de funcionalidade com os pacotes afetados.

3. Na compilação de arquitetura cruzada (cross-system architecture), você pode instanciar
   múltiplas instâncias do nixpkgs para usar seletivamente a simulação QEMU para
   compilação e compilação cruzada em diferentes locais, ou para adicionar vários
   parâmetros de compilação GCC.

Em conclusão, instanciar múltiplas instâncias do nixpkgs é altamente vantajoso.

## Instanciando `nixpkgs`

Vamos primeiro entender como instanciar uma instância nixpkgs não global. A sintaxe mais
comum é a seguinte:

```nix
{
  # um exemplo simples
  pkgs-xxx = import nixpkgs {
    system = "x86_64-linux";
  };

  # nixpkgs com overlays customizados
  pkgs-yyy = import nixpkgs {
    system = "x86_64-linux";

    overlays = [
      (self: super: {
        google-chrome = super.google-chrome.override {
          commandLineArgs =
            "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
        };
        # ... outros overlays
      })
    ];
  };

  # um exemplo mais complexo (compilação cruzada)
  pkgs-zzz = import nixpkgs {
    localSystem = "x86_64-linux";
    crossSystem = {
      config = "riscv64-unknown-linux-gnu";

      # https://wiki.nixos.org/wiki/Build_flags
      # esta opção equivale a adicionar `-march=rv64gc` a CFLAGS.
      # CFLAGS será usado como os argumentos de linha de comando para gcc/clang.
      gcc.arch = "rv64gc";
      # equivalente a `-mabi=lp64d` em CFLAGS.
      gcc.abi = "lp64d";
    };

    overlays = [
      (self: super: {
        google-chrome = super.google-chrome.override {
          commandLineArgs =
            "--proxy-server='https=127.0.0.1:3128;http=127.0.0.1:3128'";
        };
        # ... outros overlays
      })
    ];
  };
}
```

Aprendemos em nosso estudo da sintaxe Nix:

> A expressão `import` recebe um caminho para outro arquivo Nix como um argumento e
> retorna o resultado da execução desse arquivo Nix. Se o argumento para `import` for um
> caminho de pasta, ele retorna o resultado da execução do arquivo `default.nix` dentro
> dessa pasta.

`nixpkgs` é um flake com um arquivo `default.nix` em seu diretório raiz. Então,
`import nixpkgs` essencialmente retorna o resultado da execução de
[nixpkgs/default.nix](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/default.nix). A
partir deste arquivo, você pode descobrir que a implementação de `import nixpkgs` está em
[pkgs/top-level/impure.nix](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/top-level/impure.nix),
como extraído abaixo:

```nix
# ... pulando algumas linhas

{ # Nós colocamos o `system` legado em `localSystem` se `localSystem` não foi passado.
  # Se nenhum dos dois for passado, assumimos que estamos construindo pacotes na plataforma atual
  # (build, na linguagem GNU Autotools).
  localSystem ? { system = args.system or builtins.currentSystem; }

# Estes são necessários apenas porque a lógica de linha de comando `--arg` do nix não funciona
# com parâmetros sem nome permitidos por ...
, system ? localSystem.system
, crossSystem ? localSystem

, # Fallback: O conteúdo do arquivo de configuração encontrado em $NIXPKGS_CONFIG ou
  # $HOME/.config/nixpkgs/config.nix.
  config ? let
  # ... pulando algumas linhas

, # Overlays são usados para estender a coleção Nixpkgs com coleções adicionais
  # de pacotes. Essas coleções de pacotes são parte do ponto fixo
  # feito por Nixpkgs.
  overlays ? let
  # ... pulando algumas linhas

, crossOverlays ? []

, ...
} @ args:

# Se `localSystem` foi explicitamente passado, o `system` legado não deve
# ser passado, e vice-versa.
assert args ? localSystem -> !(args ? system);
assert args ? system -> !(args ? localSystem);

import ./. (builtins.removeAttrs args [ "system" ] // {
  inherit config overlays localSystem;
})
```

Portanto, `import nixpkgs {...}` efetivamente chama esta função, e o attribute set
subsequente se torna os argumentos para esta função.

## Considerações

Ao criar múltiplas instâncias do nixpkgs, há alguns detalhes a serem lembrados. Aqui estão
alguns problemas comuns a serem considerados:

1. De acordo com o artigo
   [1000 instâncias de nixpkgs](https://discourse.nixos.org/t/1000-instances-of-nixpkgs/17347)
   compartilhado por @fbewivpjsbsby, não é uma boa prática usar `import` para customizar o
   `nixpkgs` em submódulos ou sub-flakes. Isso ocorre porque cada `import` é avaliado
   separadamente, criando uma nova instância do nixpkgs a cada vez. À medida que o número
   de configurações aumenta, isso pode levar a tempos de build mais longos e maior uso de
   memória. Portanto, é recomendado criar todas as instâncias do nixpkgs no arquivo
   `flake.nix`.

2. Ao misturar simulação QEMU e compilação cruzada, deve-se ter cuidado para evitar
   duplicação desnecessária de compilações de pacotes.
