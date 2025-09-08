![](./docs/public/nixos-and-flakes-book.webp)

# NixOS & Flakes Book (Livro NixOS & Flakes) :hammer_and_wrench: :heart:

Quer saber mais sobre NixOS e Flakes em detalhes? Procurando por um tutorial para
iniciantes? Então você veio ao lugar certo!

:book: Um livro NixOS & Flakes não oficial e com opiniões para iniciantes:
https://nixos-and-flakes.ieda.me/

### Versões Mantidas pelo Autor:

- **English Version**: https://nixos-and-flakes.thiscute.world/
- **中文版**: https://nixos-and-flakes.thiscute.world/zh/

### Versões Mantidas pela Comunidade:

- **Versão em Português**: https://nixos-and-flakes.ieda.me/
- **日本語版**: https://nixos-and-flakes-ja.hayao0819.com/

> Se você estiver usando macOS,
> [ryan4yin/nix-darwin-kickstarter](https://github.com/ryan4yin/nix-darwin-kickstarter)
> pode ser um bom ponto de partida. Você pode aprender a usar o Nix com este livro e usar
> o nix-darwin-kickstarter como ponto de partida para construir sua própria configuração
> Nix.

## Feedback e Discussão

Não sou um especialista em NixOS e o utilizo há menos de 9 meses até agora (fevereiro de
2024), então deve haver alguns equívocos ou exemplos inadequados no livro. Se alguém
encontrar algo incorreto ou tiver quaisquer perguntas/sugestões, por favor, me informe,
abrindo uma issue ou participando da discussão em
[GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions). Terei
o maior prazer em continuar a otimizar o conteúdo deste livro.

A razão pela qual eu escrevi este pequeno livro foi apenas porque ninguém na comunidade o
fez por mim, que era um iniciante na época, então eu escolhi fazê-lo eu mesmo. Embora eu
soubesse que poderia cometer erros, é muito melhor do que não fazer nada.

Minha esperança é que este livro possa ajudar mais pessoas, permitindo que elas
experimentem as alegrias do NixOS. Espero que gostem!

## Introdução aos Flakes

A funcionalidade experimental flakes é um desenvolvimento importante para o Nix. Ela
introduz uma política para gerenciar dependências entre expressões Nix, melhora a
reprodutibilidade, a componibilidade e a usabilidade no ecossistema Nix. Embora ainda seja
um recurso experimental, os flakes são amplamente utilizados pela comunidade Nix.[^1]

Flakes é uma das mudanças mais significativas que o projeto Nix já viu.[^2]

## Uma Palavra de Cautela sobre os Flakes

Os benefícios dos Flakes são evidentes, e toda a comunidade NixOS o adotou de todo o
coração. Atualmente, mais da metade dos usuários utiliza Flakes[^3], o que nos dá a
garantia de que o Flakes não será descontinuado.

:warning: No entanto, é importante notar que o **Flakes ainda é uma funcionalidade
experimental**. Alguns problemas persistem e há a possibilidade de introduzir breaking
changes durante o processo de estabilização. A extensão dessas breaking changes permanece
incerta.

No geral, eu recomendo fortemente que todos usem o Flakes, especialmente porque este livro
gira em torno do NixOS e do Flakes. Contudo, é crucial estar preparado para possíveis
problemas que podem surgir devido às futuras _breaking changes_.

## Contribuição

> _No entanto, uma comunidade real só existe quando seus membros interagem de forma
> significativa, aprofundando a compreensão mútua e levando ao aprendizado._

If you find something which doesn't make sense, or something doesn't seem right, please
make a pull request and please add valid and well-reasoned explanations about your changes
or comments.

Se você encontrar algo que não faça sentido, ou que pareça incorreto, por favor, envie um
pull request e adicione explicações válidas e bem fundamentadas sobre suas alterações ou
comentários.

Antes de enviar um pull request, por favor, consulte as
[diretrizes de contribuição](/.github/CONTRIBUTING.md).

Obrigado a
[todas as pessoas](https://github.com/ryan4yin/nixos-and-flakes-book/graphs/contributors)
que já contribuíram para este projeto!

## Referências

- A capa é baseada na imagem do anime
  "[The Rolling Girls](https://en.wikipedia.org/wiki/The_Rolling_Girls)"
- O logotipo do NixOS é de [NixOS](https://nixos.org/)

## Licença

[NixOS & Flakes Book](https://github.com/ryan4yin/nixos-and-flakes-book) © 2023 por Ryan
Yin é licenciado sob [CC BY-SA 4.0](./LICENSE.md)

[^1]: [Flakes - NixOS Wiki](https://wiki.nixos.org/wiki/Flakes)

[^2]:
    [Flakes are such an obviously good thing](https://grahamc.com/blog/flakes-are-an-obviously-good-thing/)

[^3]:
    [Draft: 1 year roadmap - NixOS Foundation](https://web.archive.org/web/20250317120825/https://nixos-foundation.notion.site/1-year-roadmap-0dc5c2ec265a477ea65c549cd5e568a9)
