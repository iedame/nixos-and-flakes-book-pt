# Acelerando a Depuração de Dotfiles

Após gerenciar nossos Dotfiles com o Home Manager, um problema que podemos encontrar é
que, toda vez que modificamos nossos Dotfiles, precisamos executar
`sudo nixos-rebuild switch` (ou `home-manager switch` se você estiver usando o Home
Manager de forma autônoma) para que as alterações tenham efeito. No entanto, a execução
desse comando recalcula o estado de todo o sistema a cada vez, o que é penoso, mesmo com
os muitos mecanismos de cache já existentes no Nix para acelerar essa computação.

Tomando a minha configuração do Neovim/Emacs como exemplo, eu faço modificações frequentes
nelas, às vezes dezenas ou até centenas de vezes por dia. Ter que esperar o
`nixos-rebuild` rodar por dezenas de segundos toda vez é um puro desperdício de tempo.

Felizmente, o Home Manager fornece uma função [mkOutOfStoreSymlink][mkOutOfStoreSymlink],
que pode criar um link simbólico apontando para o caminho absoluto dos seus Dotfiles,
assim ignorando o próprio Home Manager e permitindo que as suas modificações tenham efeito
imediatamente.

Este método é eficaz sob a premissa de que o conteúdo dos seus Dotfiles não seja gerado
pelo Nix. Por exemplo, minhas configurações do Emacs/Neovim são nativas e são apenas
vinculadas aos locais corretos através das opções `home.file` ou `xdg.configFile` do
Home-Manager (Nix).

A seguir, uma breve explicação de como usar esta função para acelerar a depuração de
Dotfiles.

Supondo que você tenha colocado sua configuração do Neovim em `~/nix-config/home/nvim`,
adicione o seguinte código à sua configuração do Home Manager (por exemplo,
`~/nix-config/home/default.nix`):

```nix
{ config, pkgs, ... }: let
  # caminho para o seu diretório de configuração do nvim
  nvimPath = "${config.home.homeDirectory}/nix-config/home/nvim";
  # caminho para o seu diretório de configuração do Doom Emacs
  doomPath = "${config.home.homeDirectory}/nix-config/home/doom";
in
{
  xdg.configFile."nvim".source = config.lib.file.mkOutOfStoreSymlink nvimPath;
  xdg.configFile."doom".source = config.lib.file.mkOutOfStoreSymlink doomPath;
  # outras configurações
}
```

Após modificar a configuração, rode `sudo nixos-rebuild switch` (ou `home-manager switch`
se você estiver usando o Home Manager de forma autônoma) para aplicar as alterações. A
partir de então, qualquer modificação que você faça em `~/nix-config/home/nvim` ou
`~/nix-config/home/doom` será imediatamente observada pelo Neovim/Emacs.

Dessa forma, você pode gerenciar todos os seus Dotfiles usando um único repositório
nix-config, enquanto configurações não-Nix modificadas frequentemente podem ter efeito
rapidamente, sem serem afetadas pelo Nix.

[mkOutOfStoreSymlink]:
  https://github.com/search?q=repo%3Anix-community%2Fhome-manager%20outOfStoreSymlink&type=code
