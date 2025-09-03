# Hospedando seu Próprio Servidor de Cache Binário

## Introdução

O cache binário do Nix é uma implementação do Nix Store que armazena dados em um servidor
remoto em vez de localmente, facilitando o compartilhamento de caches binários entre
várias máquinas.

O servidor de cache binário oficial do Nix fornece apenas binários construídos com
parâmetros padrão. Se você personalizou os parâmetros de construção ou está usando pacotes
de fora do Nixpkgs, o Nix não encontrará o cache binário correspondente, resultando em
construções locais.

Confiar apenas no seu Nix Store local `/nix/store` pode ser complicado, pois você
precisaria reconstruir todos os seus pacotes personalizados em cada máquina, o que pode
consumir muito tempo e memória. Essa situação se agrava em plataformas de menor
desempenho, como o Raspberry Pi.

Este documento mostrará como configurar seu próprio servidor de cache binário do Nix
usando um serviço S3 (como o MinIO) para compartilhar resultados de construção entre
máquinas e resolver os problemas mencionados.

## Pré-requisitos

1. Um host NixOS
1. Servidor MinIO implantado
   1. Se não, você pode seguir o
      [guia de implantação oficial do MinIO](https://min.io/docs/minio/linux/operations/installation.html).
1. O servidor MinIO precisa de um certificado digital TLS válido, que pode ser público ou
   privado. Este exemplo usará `https://minio.homelab.local` com um certificado privado.
1. Instalar o `minio-client`

## Gerando uma Senha

```bash
nix run nixpkgs#pwgen -- -c -n -y -s -B 32 1
# => oenu1Yuch3rohz2ahveid0koo4giecho
```

## Configurando o Cliente MinIO

Instale o cliente de linha de comando do MinIO, `mc`.

```nix
{ pkgs, ... }:
{
  environment.systemPackages = with pkgs; [
    minio-client # Alternativas para os comandos ls, cp, mkdir, diff e rsync para sistemas de arquivos e armazenamento de objetos
  ];
}
```

Crie o arquivo `~/.mc/config.json` com o seguinte conteúdo (substitua os parâmetros-chave
pelos seus):

```json
{
  "version": "10",
  "aliases": {
    "s3": {
      "url": "https://s3.homelab.local",
      "accessKey": "minio",
      "secretKey": "oenu1Yuch3rohz2ahveid0koo4giecho",
      "api": "s3v4",
      "path": "auto"
    }
  }
}
```

Como o Nix interagirá diretamente com o bucket S3, precisamos configurar as credenciais S3
para todas as máquinas que precisam de acesso ao cache binário do Nix.

Crie o arquivo `~/.aws/credentials` com o seguinte conteúdo (substitua
`<nixbuildersecret>` with pela senha gerada pelo comando `pwgen`).

```conf
[nixbuilder]
aws_access_key_id=nixbuilder
aws_secret_access_key=<nixbuildersecret>
```

## Configurando o Bucket S3 como Cache Binário

Crie o bucket `nix-cache` usando o cliente MinIO:

```bash
mc mb s3/nix-cache
```

Crie o usuário `nixbuilder` para o MinIO e atribua-lhe uma senha:

```bash
mc admin user add s3 nixbuilder <PASSWORD>
```

Crie um arquivo chamado `nix-cache-write.json` no diretório de trabalho atual com o
seguinte conteúdo:

```json
{
  "Id": "AuthenticatedWrite",
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AuthenticatedWrite",
      "Action": [
        "s3:AbortMultipartUpload",
        "s3:GetBucketLocation",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:ListBucketMultipartUploads",
        "s3:ListMultipartUploadParts",
        "s3:PutObject"
      ],
      "Effect": "Allow",
      "Resource": ["arn:aws:s3:::nix-cache", "arn:aws:s3:::nix-cache/*"],
      "Principal": "nixbuilder"
    }
  ]
}
```

Agora, crie uma política para fazer o upload de arquivos para o S3 usando o arquivo
`nix-cache-write.json`:

```bash
mc admin policy create s3 nix-cache-write nix-cache-write.json
```

Associe a política S3 que acabamos de criar ao usuário `nixbuilder`:

```bash
mc admin policy attach s3 nix-cache-write -user nixbuilder
```

Permita que usuários anônimos baixem arquivos sem autenticação, para que todos os
servidores Nix possam buscar dados diretamente deste cache S3:

```bash
mc anonymous set download s3/nix-cache
```

Finalmente, adicione o arquivo `nix-cache-info` ao diretório raiz do bucket S3, pois o Nix
requer este arquivo para registrar algumas informações relacionadas ao cache binário:

```bash
cat > nix-cache-info <<EOF
StoreDir: /nix/store
WantMassQuery: 1
Priority: 40
EOF
# Copie `nix-cache-info` para o bucket S3
mc cp ./nix-cache-info s3/nix-cache/nix-cache-info
```

## Gerando o Par de Chaves de Assinatura

Como mencionado anteriormente, o cache binário do Nix usa um mecanismo de assinatura de
chave pública para verificar a origem e a integridade dos dados, então precisamos gerar um
par de chaves para a nossa máquina de construção do Nix assinar o cache binário. O nome da
chave é arbitrário, mas os desenvolvedores do NixOS recomendam fortemente usar o domínio
do cache seguido por um número inteiro, para que, se a chave precisar ser revogada ou
regenerada, você possa simplesmente incrementar o número no final.

```bash
nix key generate-secret --key-name s3.homelab.local-1 > ~/.config/nix/secret.key
nix key convert-secret-to-public < ~/.config/nix/secret.key > ~/.config/nix/public.key
cat ~/.config/nix/public.key
# => s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs=
```

## Usando o Cache Binário S3 no flake.nix

Adicione o seguinte ao seu `configuration.nix` ou a qualquer módulo NixOS personalizado:

```nix
{
  nix = {
    settings = {
      # O substituter será anexado aos substituters padrão ao buscar pacotes.
      extra-substituters = [
        "https://s3.homelab.local/nix-cache/"
      ];
      extra-trusted-public-keys = [
        "s3.homelab.local-1:m0J/oDlLEuG6ezc6MzmpLCN2MYjssO3NMIlr9JdxkTs="
      ];
    };
  };
}
```

Reconstrua o sistema para começar a usar nosso recém-criado cache binário S3:

```bash
sudo nixos-rebuild switch --upgrade --flake .#<HOST>
```

## Enviando Caminhos do Store para o Cache Binário

Assine alguns caminhos no store local.

```bash
nix store sign --recursive --key-file ~/.config/nix/secret.key /run/current-system
```

Copie esses caminhos para o cache:

```bash
nix copy --to 's3://nix-cache?profile=nixbuilder&endpoint=s3.homelab.local' /run/current-system
```

## Adicionando Política de Expiração Automática de Objetos

```bash
mc ilm rule add s3/nix-cache --expire-days "DAYS"
# Por exemplo: mc ilm rule add s3/nix-cache --expire-days "7"
```

Isso definirá uma política de expiração para objetos no bucket S3, garantindo que eles
sejam automaticamente removidos após um número especificado de dias.

Isso é útil para manter o tamanho do cache gerenciável e garantir que binários
desatualizados não sejam armazenados indefinidamente.

## Referências

- [Blog post by Jeff on Nix binary caches](https://jcollie.github.io/nixos/2022/04/27/nixos-binary-cache-2022.html)
- [Binary cache in the NixOS wiki](https://wiki.nixos.org/wiki/Binary_Cache)
- [Serving a Nox store via S3 in the NixOS manual](https://nixos.org/manual/nix/stable/package-management/s3-substituter.html)
- [Serving a Nix store via HTTP in the NixOS manual](https://nixos.org/manual/nix/stable/package-management/binary-cache-substituter.html)
