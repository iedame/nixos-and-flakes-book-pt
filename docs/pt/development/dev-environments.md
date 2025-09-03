# Ambientes de Desenvolvimento

No NixOS, temos uma variedade de métodos para configurar ambientes de desenvolvimento, com
a abordagem mais ideal sendo a definição completa de cada ambiente de desenvolvimento de
projeto através de seu próprio `flake.nix`. No entanto, isso pode ser um pouco complicado
na prática, pois requer a criação de um `flake.nix` e a execução de `nix develop` para
cada instância. Para projetos temporários ou quando se quer apenas dar uma olhada no
código, essa abordagem é um tanto exagerada.

Um bom meio-termo é dividir o ambiente de desenvolvimento em três níveis:

1. **Ambiente Global**: Normalmente, refere-se ao ambiente de usuário gerenciado pelo
   home-manager
   - Ferramentas de desenvolvimento universais: `git`, `vim`, `emacs`, `tmux`, e
     similares.
   - SDKs de linguagens comuns e gerenciadores de pacotes: `rust`, `openjdk`, `python`,
     `go`, entre outros.
2. **Ambiente da IDE:**:
   - Tomando o neovim como exemplo, o home-manager cria um wrapper para o neovim que
     encapsula suas dependências em seu próprio ambiente, evitando a contaminação do
     ambiente global.
   - As dependências para os plugins do neovim podem ser adicionadas ao ambiente do neovim
     através do parâmetro `programs.neovim.extraPackages`, garantindo que a IDE funcione
     sem problemas.
   - No entanto, se você usa várias IDEs (como emacs e neovim), elas frequentemente
     dependem de muitos dos mesmos programas (lsp, tree-sitter, debugger, formatter,
     etc.). Para facilitar o gerenciamento, essas dependências compartilhadas podem ser
     colocadas no ambiente global. É preciso ter cuidado com possíveis conflitos de
     dependência com outros programas no ambiente global, principalmente com pacotes
     Python, que são propensos a conflitos.
3. **Ambiente do Projeto**: Cada projeto pode definir seu próprio ambiente de
   desenvolvimento (`devShells`) via `flake.nix`.
   - Para simplificar, você pode criar modelos de `flake.nix` genéricos para linguagens
     comumente usadas com antecedência, que podem ser copiados e modificados conforme
     necessário.
   - O ambiente do projeto tem a maior precedência (adicionado ao início do PATH), e suas
     dependências sobrescreverão aquelas com o mesmo nome no ambiente global. Assim, você
     pode controlar a versão das dependências do projeto via o `flake.nix` do projeto, não
     sendo afetado pelo ambiente global.

## Modelos para Ambientes de Desenvolvimento

Aprendemos como construir ambientes de desenvolvimento, mas é um pouco tedioso escrever
`flake.nix` para cada projeto.

Felizmente, algumas pessoas na comunidade já fizeram isso por nós. Os seguintes
repositórios contêm modelos de ambiente de desenvolvimento para a maioria das linguagens
de programação. Basta copiar e colar:

- [MordragT/nix-templates](https://github.com/MordragT/nix-templates)
- [the-nix-way/dev-templates](https://github.com/the-nix-way/dev-templates)

Se você acha que a estrutura do `flake.nix` ainda é muito complicada e deseja uma forma
mais simples, pode considerar usar o seguinte projeto, que encapsula o Nix de forma mais
completa e oferece aos usuários uma definição mais simples:

- [cachix/devenv](https://github.com/cachix/devenv)

Se você não quer escrever uma única linha de código Nix e apenas quer obter um ambiente de
desenvolvimento reproduzível com o mínimo de custo, aqui está uma ferramenta que pode
atender às suas necessidades:

- [jetpack-io/devbox](https://github.com/jetpack-io/devbox)

## Ambiente de Desenvolvimento para Python

O ambiente de desenvolvimento para Python é muito mais complicado em comparação com
linguagens como Java ou Go, porque ele instala o software no ambiente global por padrão.
Para instalar software para o projeto atual, você deve criar um ambiente virtual primeiro
(diferente de linguagens como JavaScript ou Go, onde ambientes virtuais não são
necessários). Esse comportamento é muito hostil ao Nix.

Por padrão, ao usar o pip em Python, ele instala o software globalmente. No NixOS, a
execução direta de `pip install` resultará em um erro:

```bash
› pip install -r requirements.txt
error: externally-managed-environment

× This environment is externally managed
╰─> This command has been disabled as it tries to modify the immutable
    `/nix/store` filesystem.

    To use Python with Nix and nixpkgs, have a look at the online documentation:
    <https://nixos.org/manual/nixpkgs/stable/#python>.

note: If you believe this is a mistake, please contact your Python installation or OS distribution provider. You can override this, at the risk of breaking your Python installation or OS, by passing --break-system-packages.
hint: See PEP 668 for the detailed specification.
```

Com base na mensagem de erro, `pip install` é diretamente desabilitado pelo NixOS. Mesmo
ao tentar `pip install --user`, ele é desabilitado de forma semelhante. Para melhorar a
reprodutibilidade do ambiente, o Nix elimina completamente esses comandos. Mesmo se
criarmos um novo ambiente usando métodos como `mkShell`, esses comandos ainda resultarão
em erros (presumivelmente porque o próprio comando pip no Nixpkgs foi modificado para
evitar que quaisquer instruções de modificação como `install` sejam executadas).

No entanto, muitos scripts de instalação de projetos são baseados em pip, o que significa
que esses scripts não podem ser usados diretamente. Além disso, o conteúdo no nixpkgs é
limitado, e muitos pacotes do PyPI estão faltando. Isso exige que os usuários os empacotem
eles mesmos, adicionando muita complexidade e esforço mental.

Uma solução é usar o ambiente virtual `venv`. Dentro de um ambiente virtual, você pode
usar comandos como o pip normalmente:

```shell
python -m venv ./env
source ./env/bin/activate
```

Alternativamente, você pode usar uma ferramenta de terceiros chamada `virtualenv`, mas
isso requer uma instalação adicional.

Para aqueles que ainda não confiam no venv criado diretamente com Python, podem preferir
incluir o ambiente virtual no `/nix/store` para torná-lo imutável. Isso pode ser alcançado
instalando diretamente as dependências do `requirements.txt` ou `poetry.toml` usando o
Nix. Existem ferramentas de empacotamento do Nix disponíveis para ajudar com isso:

> Observe que mesmo nesses ambientes, a execução direta de comandos como `pip install`
> ainda falhará. As dependências do Python devem ser instaladas através do `flake.nix`
> porque os dados estão localizados no diretório `/nix/store` e esses comandos de
> modificação só podem ser executados durante a fase de construção do Nix.

- [python venv demo](https://github.com/MordragT/nix-templates/blob/master/python-venv/flake.nix)
- [poetry2nix](https://github.com/nix-community/poetry2nix)

A vantagem dessas ferramentas é que elas utilizam o mecanismo de lock dos Nix Flakes para
melhorar a reprodutibilidade. No entanto, a desvantagem é que elas adicionam uma camada
extra de abstração, tornando o sistema subjacente mais complexo.

Finalmente, em alguns projetos mais complexos, nenhuma das soluções acima pode ser viável.
Nesses casos, a melhor solução é usar contêineres como Docker ou Podman. Os contêineres
têm menos restrições em comparação com o Nix e podem fornecer a melhor compatibilidade.
