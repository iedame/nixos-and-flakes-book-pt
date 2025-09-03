# Atualizando o Sistema

Com Flakes, atualizar o sistema é simples. Basta executar os seguintes comandos em
`/etc/nixos` ou em qualquer outro local onde você mantenha a configuração:

> **OBSERVAÇÃO**: O diretório `/etc/nixos` pertence e só é gravável pelo `root`. Portanto,
> se o seu flake estiver localizado neste diretório, você precisará usar o `sudo` para
> atualizar quaisquer arquivos de configuração.

```shell
# Atualizar o flake.lock
nix flake update

# Ou atualizar apenas a entrada específica, como o home-manager:
nix flake update home-manager

# Aplicar as atualizações
sudo nixos-rebuild switch --flake .

# Ou para atualizar o flake.lock e aplicar com um único comando (ou seja, o mesmo que executar "nix flake update" antes)
sudo nixos-rebuild switch --recreate-lock-file --flake .
```

Ocasionalmente, você pode encontrar um erro de "sha256 mismatch" ao executar
`nixos-rebuild switch`. Este erro pode ser resolvido atualizando o `flake.lock` usando
`nix flake update`.
