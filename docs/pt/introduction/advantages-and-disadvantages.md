# Vantagens e Desvantagens do NixOS

## Vantagens do NixOS

- **Configuração Declarativa, SO como Código**
  - O NixOS usa configuração declarativa para gerenciar todo o ambiente do sistema. Essas
    configurações podem ser gerenciadas diretamente com o Git, permitindo que o sistema
    seja restaurado para qualquer estado histórico, desde que os arquivos de configuração
    sejam preservados (desde que os estados desejados sejam declarados na configuração
    Nix).
  - Os Nix Flakes aprimoram ainda mais a reprodutibilidade utilizando um arquivo de
    travamento de versão, o `flake.lock`, que registra os endereços das fontes de dados,
    valores de hash e outras informações relevantes para todas as dependências. Esse
    design melhora muito a reprodutibilidade do Nix e garante resultados de compilação
    consistentes. Ele se inspira em designs de gerenciamento de pacotes de linguagens de
    programação como Cargo e npm.
- **Capacidade de Personalização do Sistema Altamente Conveniente**
  - Com apenas algumas alterações de configuração, vários componentes do sistema podem ser
    facilmente substituídos. O Nix encapsula todas as operações complexas subjacentes em
    pacotes Nix, fornecendo aos usuários um conjunto conciso de parâmetros declarativos.
  - As modificações são seguras e alternar entre diferentes ambientes de desktop (como
    GNOME, KDE, i3 e sway) é simples, com o mínimo de armadilhas.
- **Capacidade de Reversão**
  - É possível reverter para qualquer estado de sistema anterior, e o NixOS, por padrão,
    ainda inclui todas as versões antigas nas opções de boot, garantindo a capacidade de
    reverter as alterações facilmente. Consequentemente, o Nix é considerado uma das
    abordagens de gerenciamento de pacotes mais estáveis.
- **Sem Problemas de Conflito de Dependência**
  - Cada pacote de software no Nix possui um hash único, que é incorporado em seu caminho
    de instalação, permitindo que múltiplas versões coexistam.
- **A comunidade é ativa, com uma vasta gama de projetos de terceiros.**
  - O repositório de pacotes oficial, nixpkgs, possui inúmeros contribuidores, e muitas
    pessoas compartilham suas configurações Nix. Explorar o ecossistema do NixOS é uma
    experiência empolgante, semelhante à descoberta de um novo continente.

<figure>
  <img src="/nixos-bootloader.avif">
  <figcaption>
    <h4 align="center">
      Todas as versões históricas estão listadas nas opções de boot do NixOS. <br>
      Imagem do
      <a href="https://discourse.nixos.org/t/how-to-make-uefis-grub2-menu-the-same-as-bioss-one/10074" target="_blank" rel="noopener noreferrer">
        NixOS Discourse - 10074
      </a>
    </h4>
  </figcaption>
</figure>

## Desvantagens do NixOS

- **Curva de Aprendizagem Elevada**:
  - Alcançar uma reprodutibilidade completa e evitar as armadilhas associadas ao uso
    inadequado exige aprender sobre o design completo do Nix e gerenciar o sistema de
    forma declarativa, em vez de usar comandos cegamente como `nix-env -i` (similar ao
    `apt-get install`).
- **Documentação Desorganizada**:
  - Atualmente, Nix Flakes ainda é um recurso experimental e a documentação focada
    especificamente nele é limitada. A maioria da documentação da comunidade Nix cobre
    principalmente o arquivo clássico `/etc/nixos/configuration.nix`. Se você quiser
    começar a aprender diretamente com Nix Flakes (`flake.nix`), precisa consultar uma
    quantidade significativa de documentação desatualizada e extrair as informações
    relevantes. Além disso, alguns recursos centrais do Nix, como `imports` e o Sistema de
    Módulos do Nixpkgs, carece de documentação oficial detalhada, exigindo que se recorrer
    à análise do código-fonte.
- **Maior Uso de Espaço em Disco**:
  - Para garantir a capacidade de reverter o sistema a qualquer momento, o Nix retém todos
    os ambientes históricos por padrão, resultando em um maior uso de espaço em disco.
  - Embora esse uso de espaço adicional possa não ser uma preocupação em computadores
    desktop, ele pode se tornar problemático em servidores de nuvem com recursos
    limitados.
- **Mensagens de Erro Obscuras**:
  - Devido ao
    [algoritmo de fusão complexo ](https://discourse.nixos.org/t/best-resources-for-learning-about-the-nixos-module-system/1177/4)
    do [Sistema de Módulos do Nixpkgs](../other-usage-of-flakes/module-system.md), as
    mensagens de erro do NixOS são bastante precárias. Em muitos casos, independentemente
    de você adicionar `--show-trace`, ele só irá te dizer que há um erro no código (a
    mensagem de erro mais comum e confusa é
    [Infinite recursion encountered](https://discourse.nixos.org/t/infinite-recursion-encountered-by-making-module-configurable/23508/2)),
    mas onde exatamente está o erro? O sistema de tipos diz que não sabe, então você
    precisa encontrá-lo por conta própria. Na minha experiência, **a maneira mais simples
    e eficaz de lidar com essas mensagens de erro sem sentido é usar uma "busca binária"
    para restaurar gradualmente o código.**.
  - Este problema é provavelmente a maior dificuldade do NixOS no momento.
- **Implementação Subjacente Mais Complexa**:
  - A abstração declarativa do Nix introduz uma complexidade adicional no código
    subjacente, quando comparado a um código similar em ferramentas imperativas
    tradicionais.
  - Essa complexidade aumenta a dificuldade de implementação e torna mais desafiador fazer
    modificações personalizadas em um nível mais baixo. No entanto, esse fardo recai
    principalmente sobre os mantenedores de pacotes do Nix, já que os usuários comuns têm
    uma exposição limitada às complexidades subjacentes, o que reduz sua carga.

## Resumo

No geral, acredito que o NixOS é adequado para desenvolvedores com um certo nível de
experiência em uso de Linux e conhecimento em programação que desejam ter maior controle
sobre seus sistemas.

Não recomendo que iniciantes sem nenhuma experiência com Linux mergulhem diretamente no
NixOS, pois isso pode levar a uma jornada frustrante.

> Se você tiver outras perguntas sobre o NixOS, pode consultar o último capítulo deste
> livro, [Perguntas Frequentes](../faq/).
