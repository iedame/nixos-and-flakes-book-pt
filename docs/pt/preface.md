# Prefácio

## A Dor dos Iniciantes em NixOS - Documentação e Flakes

O NixOS é uma distribuição Linux altamente distinta, construída sobre o gerenciador de
pacotes Nix, com uma filosofia de design que o diferencia de distribuições tradicionais
como Ubuntu, CentOS, Arch Linux e outras.

Uma das principais vantagens do NixOS sobre outras distribuições reside em sua
reprodutibilidade e configuração declarativa, permitindo aos usuários replicar ambientes
de sistema consistentes em várias máquinas.

Embora o NixOS seja poderoso, sua força também vem com uma complexidade de sistema maior.
Isso o torna mais desafiador para os recém-chegados. Um grande desafio é que o
conhecimento acumulado em outras distribuições Linux não é facilmente transferível para o
NixOS. Outro é que a documentação official e da comunidade é muitas vezes dispensary e
desatualizada. Esses problems têm incomodado muitos iniciantes em NixOS.

Podemos observar essas questões com o recurso experimental do gerenciador de pacotes Nix
chamado Flakes. Inspirado por gerenciadores de pacotes como npm e Cargo, os Flakes usam o
arquivo `flake.nix` para registrar todas as dependências externas e o arquivo `flake.lock`
para travar suas versões. Isso aumenta significativamente a reprodutibilidade e a
componibilidade do gerenciador de pacotes Nix e das configurações do NixOS.

As vantagens dos Flakes os tornaram amplamente populares na comunidade: de acordo com
pesquisas oficiais, mais da metade dos novos repositórios Nix criados no GitHub agora
utilizam Flakes.

No entanto, para manter a estabilidade, a documentação official quase não cobre conteúdo
relacionado a Flakes. Isso deixou muitos usuários de Nix/NixOS confusos. Eles veem todos
usando Flakes e também querem aprender, mas não encontram por onde começar, muitas vezes
tendo que juntar informações dispersas, procurar no código-fonte do Nixpkgs, ou pedir
ajuda a usuários mais experientes.

## A Origem deste Livro

Este livro teve origem em minhas notas dispersas de quando comecei a usar o NixOS.

Em abril deste ano (2023), ao me aprofundar no NixOS, me apaixonei por sua filosofia de
design. Por recomendação de um amigo, conheci o recurso experimental Flakes do Nix. Após
comparar os Flakes com o método de configuração traditional do NixOS, percebi que apenas
um NixOS com o recurso Flakes habilitado atendia às minhas expectativas. Consequentemente,
ignorei completamente a abordagem de configuração traditional do Nix e, em meus primeiros
passos, aprendi diretamente a configurar meu sistema NixOS usando Flakes.

Ao longo do meu processo de aprendizado, descobri que havia pouquíssimos recursos sobre
Flakes para iniciantes. A vasta maioria da documentação focava na abordagem de
configuração traditional do Nix, me forçando a extrair as informações de que precisava de
várias fontes, como o NixOS Wiki, Zero to Nix, Nixpkgs Manual e o código-fonte do Nixpkgs,
desconsiderando qualquer conteúdo não relacionado a Flakes. Essa jornada de aprendizado
foi bastante confusa e dolorosa. Para evitar futuros tropeços, documentei diligentemente
inúmeras notas dispersas à medida que progredia.

Com alguma experiência, no início de maio deste ano, mudei meu PC principal para o NixOS.
Após organizar e refinar minhas notas de iniciante em NixOS, eu as publiquei em meu
blog[^1] e as compartilhei na comunidade chinesa do NixOS. A comunidade chinesa respondeu
positivamente e, com base em seus conselhos, traduzi o artigo para o inglês e o
compartilhei no Reddit, recebendo um forte feedback[^2].

A recepção positiva desse documento compartilhado me encorajou e me motivou a continuar
aprimorando-o. Com atualizações contínuas, o conteúdo deste documento se expandiu para
mais de 20.000 palavras. Alguns leitores sugeriram que a experiência de leitura poderia
set melhorada, o que me levou a atender às suas sugestões[^3]. Como resultado, migrei o
conteúdo do artigo para um repositório no GitHub, criei um site de documentação dedicado e
ajustei a apresentação para que se alinhasse mais com um guia para iniciantes, em vez de
um caderno de anotações pessoal.

E assim, nasceu um livro de código aberto bilíngue, que chamei de "<NixOS & Flakes Book>"
com o título em chinês de "NixOS & Flakes 新手指南" ("NixOS & Flakes Beginner's Guide").

O conteúdo deste livro de código aberto evoluiu passo a passo à medida que eu usava o
NixOS e interagia com os leitores. A sensação de realização com o feedback positivo dos
leitores tem sido a minha maior motivação para as atualizações. O feedback de alguns
leitores foi imensamente útil em sua "evolução". Inicialmente, eu só queria compartilhar
minhas experiências com o NixOS de uma maneira um tanto casual, mas, inesperadamente, isso
se transformou em um livro de código aberto. Seu número de leitores no exterior até
superou o do meu próprio país, e ele ganhou muitas estrelas - um resultado que eu jamais
poderia ter previsto.

Sou grato a todos os amigos que contribuíram para este livro e ofereceram sugestões, e
agradeço a todo o apoio e incentivo dos leitores. Sem todos vocês, o conteúdo deste livro
poderia ter permanecido restrito ao meu blog pessoal, e ele não teria alcançado sua forma
atual.

## Os Recursos deste Livro

1. Focado em NixOS e Flakes, desconsiderando a abordagem de configuração traditional do
   Nix.
2. Para iniciantes, com explicações da perspectiva de novatos em NixOS que já possuem
   alguma experiência com o uso de Linux e programação.
3. Aprendizagem progressiva, passo a passo.
4. A maioria dos capítulos deste livro oferece links de referência ao final, tornando mais
   fácil para os leitores aprofundarem-se nos tópicos e avaliarem a credibilidade do
   conteúdo.
5. Conteúdo coerente, bem organizado e estruturado. Os leitores podem tanto ler o livro de
   forma gradual quanto encontrar rapidamente a informação de que precisam.

## Doação

Se este livro foi útil para você, por favor, considere fazer uma doação para apoiar seu
desenvolvimento.

- GitHub: <https://github.com/sponsors/ryan4yin>
- Patreon: <https://patreon.com/ryan4yin>
- Buy me a coffee: <https://buymeacoffee.com/ryan4yin>
- 爱发电: <https://afdian.com/a/ryan4yin>
- Ethereum: `0xB74Aa43C280cDc8d8236952400bF6427E4390855`

## Feedback e Discussão

Eu não sou um especialista em NixOS, e só tenho usado o NixOS por menos de 9 meses até
agora (Fevereiro de 2024). Então, deve haver alguns equívocos ou casos complexos no livro.
Se alguém encontrar algo incorreto ou tiver quaisquer perguntas ou sugestões, basta me
avisar abrindo uma issue ou participando da discussão em
[GitHub Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions). Fico
feliz em continuar a aprimorar o conteúdo deste livro.

A razão pela qual escrevi este pequeno livro foi simplesmente porque ninguém na comunidade
o fez por mim, que era um iniciante na época, então decidi fazer eu mesmo. Mesmo sabendo
que poderia cometer errors, é muito melhor do que não fazer nada.

Minha esperança é que este livro possa ajudar mais pessoas, permitindo que elas
experimentem as alegrias do NixOS. Espero que gostem!

## Feedback e Discussões Históricas sobre Este Livro

Feedback e Discussões Relacionadas em Inglês:

- [[2023-05-11] NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-22] Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/updates_nixos_nix_flakes_a_guide_for_beginners/)
- [[2023-06-24] An unofficial NixOS & Flakes book for beginners - Discourse](https://discourse.nixos.org/t/an-unofficial-nixos-flakes-book-for-beginners/29561)
- [[2023-07-06] This isn't an issue but it has to be said: - Discussions](https://github.com/ryan4yin/nixos-and-flakes-book/discussions/43)

Feedback e Discussões em Chinês:

- [[2023-05-09] NixOS 与 Nix Flakes 新手入门 - v2ex 社区](https://www.v2ex.com/t/938569#reply45)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - v2ex 社区](https://www.v2ex.com/t/951190#reply9)
- [[2023-06-24] NixOS 与 Flakes | 一份非官方的新手指南 - 0xffff 社区](https://0xffff.one/d/1547-nixos-yu-flakes-yi-fen-fei-guan)

[^1]:
    [NixOS & Nix Flakes - A Guide for Beginners - This Cute World](https://thiscute.world/en/posts/nixos-and-flake-basics/)

[^2]:
    [NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/13dxw9d/nixos_nix_flakes_a_guide_for_beginners/)

[^3]:
    [Updates: NixOS & Nix Flakes - A Guide for Beginners - Reddit](https://www.reddit.com/r/NixOS/comments/14fvz1q/comment/jp4xhj3/?context=3)
