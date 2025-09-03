# Uso Avançado do Nixpkgs

`callPackage`, `Overriding` e `Overlays` são as técnicas ocasionalmente usadas no Nix para
customizar o método de build de pacotes Nix.

Sabemos que muitos programas têm um grande número de parâmetros de build que precisam ser
configurados, e diferentes usuários podem querer usar diferentes parâmetros de build. É
aqui que o `Overriding` e os `Overlays` são úteis. Deixe-me dar alguns exemplos que
encontrei:

1. [`fcitx5-rime.nix`](https://github.com/NixOS/nixpkgs/blob/e4246ae1e7f78b7087dce9c9da10d28d3725025f/pkgs/tools/inputmethods/fcitx5/fcitx5-rime.nix):
   Por padrão, o `fcitx5-rime` usa `rime-data` como o valor de `rimeDataPkgs`, mas este
   parâmetro pode ser customizado por `override`.
2. [`vscode/with-extensions.nix`](https://github.com/NixOS/nixpkgs/blob/nixos-23.05/pkgs/applications/editors/vscode/with-extensions.nix):
   Este pacote para o VS Code também pode ser customizado sobrescrevendo o valor de
   `vscodeExtensions`, Assim, podemos instalar alguns plugins customizados no VS Code.
   - [`nix-vscode-extensions`](https://github.com/nix-community/nix-vscode-extensions):
     Este é um gerenciador de plugins do VS Code implementado através da sobrescrita de
     `vscodeExtensions`.
3. [`firefox/common.nix`](https://github.com/NixOS/nixpkgs/blob/416ffcd08f1f16211130cd9571f74322e98ecef6/pkgs/applications/networking/browsers/firefox/common.nix):
   O Firefox também tem muitos parâmetros personalizáveis.
4. ...

Em suma, `callPackage`, `Overriding` e `Overlays` podem ser usados para customizar os
parâmetros de build de pacotes Nix.
