# Construção Distribuída

A construção distribuída pode acelerar significativamente o processo de construção
utilizando múltiplas máquinas. No entanto, para usuários comuns do NixOS, a construção
distribuída pode não ser muito útil, já que o `cache.nixos.org` fornece a grande maioria
dos caches para a arquitetura `x86_64`.

A construção distribuída é particularmente valiosa em cenários onde nenhum cache está
disponível, tais como:

1. Usuários de arquiteturas `RISC-V` ou `ARM64`, , especialmente `RISC-V`, pois há muito
   poucos caches para essas arquiteturas no repositório de cache oficial. A compilação
   local é frequentemente necessária.
2. Usuários que personalizam bastante seus sistemas. Os pacotes no repositório de cache
   oficial são construídos com configurações padrão. Se você modificar os parâmetros de
   construção, o cache oficial não é aplicável, e a compilação local é necessária. Por
   exemplo, em cenários de sistemas embarcados (embedded scenarios), a personalização do
   kernel subjacente, drivers, etc., é frequentemente exigida, levando à necessidade de
   compilação local.

## Configurando a Construção Distribuída

Atualmente, não há documentação oficial para a construção distribuída. No entanto, forneci
um exemplo de configuração de construção distribuída (um módulo NixOS) abaixo, junto com
alguns documentos de referência recomendados no final desta seção.

```nix
{ ... }: {

  ####################################################################
  #
  #  Configuração do NixOS para Construção Remota / Construção Distribuída
  #
  ####################################################################

  # Definir o max-jobs local para 0 para forçar a construção remota (desabilitar a construção local).
  # nix.settings.max-jobs = 0;
  nix.distributedBuilds = true;
  nix.buildMachines =
    let
      sshUser = "ryan";
      # Caminho para a chave SSH na máquina local.
      sshKey = "/home/ryan/.ssh/ai-idols";
      systems = [
        # Arquitetura nativa.
        "x86_64-linux"

        # Arquitetura emulada usando binfmt_misc e qemu-user.
        "aarch64-linux"
        "riscv64-linux"
      ];
      # Todos os recursos de sistema disponíveis estão mal documentados aqui:
      # https://github.com/NixOS/nix/blob/e503ead/src/libstore/globals.hh#L673-L687
      supportedFeatures = [
        "benchmark"
        "big-parallel"
        "kvm"
      ];
    in
      [
        # O Nix parece sempre priorizar a construção remota.
        # Para aproveitar a CPU de alto desempenho da máquina local, não defina o maxJobs do construtor remoto muito alto.
        {
          # Alguns dos meus construtores remotos estão rodando NixOS
          # e têm o mesmo sshUser, sshKey, systems, etc.
          inherit sshUser sshKey systems supportedFeatures;

          # O hostName deve ser:
          #    1. Um nome de host que pode ser resolvido por DNS.
          #    2. O endereço IP do construtor remoto.
          #    3. Um alias de host definido globalmente em /etc/ssh/ssh_config.
          hostName = "aquamarine";
          # max-jobs do construtor remoto.
          maxJobs = 3;
          # speedFactor é um número inteiro com sinal,
          # mas parece que não é usado pelo Nix e não tem efeito.
          speedFactor = 1;
        }
        {
          inherit sshUser sshKey systems supportedFeatures;
          hostName = "ruby";
          maxJobs = 2;
          speedFactor = 1;
        }
        {
          inherit sshUser sshKey systems supportedFeatures;
          hostName = "kana";
          maxJobs = 2;
          speedFactor = 1;
        }
      ];
  # Opcional: Útil quando o construtor tem uma conexão de internet mais rápida que a sua.
	nix.extraOptions = ''
		builders-use-substitutes = true
	'';

  # Definir os aliases de host para construtores remotos.
  # Esta configuração será escrita em /etc/ssh/ssh_config.
  programs.ssh.extraConfig = ''
    Host ai
      HostName 192.168.5.100
      Port 22

    Host aquamarine
      HostName 192.168.5.101
      Port 22

    Host ruby
      HostName 192.168.5.102
      Port 22

    Host kana
      HostName 192.168.5.103
      Port 22
  '';

  # Definir as chaves de host para construtores remotos para que o Nix possa verificar todos os construtores remotos.
  # Esta configuração será escrita em /etc/ssh/ssh_known_hosts.
  programs.ssh.knownHosts = {
    # 星野 愛久愛海, Hoshino Aquamarine
    aquamarine = {
      hostNames = [ "aquamarine" "192.168.5.101" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDnCQXlllHoLX5EvU+t6yP/npsmuxKt0skHVeJashizE";
    };

    # 星野 瑠美衣, Hoshino Rubii
    ruby = {
      hostNames = [ "ruby" "192.168.5.102" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIE7n11XxB8B3HjdyAsL3PuLVDZxWCzEOUTJAY8+goQmW";
    };

    # 有馬 かな, Arima Kana
    kana = {
      hostNames = [ "kana" "192.168.5.103" ];
      publicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ3dDLOZERP1nZfRz3zIeVDm1q2Trer+fWFVvVXrgXM1";
    };
  };
}
```

## Limitações

Aqui estão alguns problemas e limitações observados:

1. Você não pode especificar quais hosts usar no momento da construção. Você só pode
   especificar uma lista de hosts no arquivo de configuração, e o Nix seleciona
   automaticamente os hosts disponíveis.
2. Ao escolher um host, o Nix sempre prefere o host remoto em relação ao host local, mesmo
   que o host local tenha um desempenho melhor. Isso pode resultar na subutilização da CPU
   do host local.
3. A menor unidade de construção distribuída é uma derivação (derivation). Ao construir
   pacotes grandes, outras máquinas podem permanecer ociosas por um longo período,
   esperando que o pacote grande seja construído. Isso pode levar ao desperdício de
   recursos.

## Referências

- [Distributed build - NixOS Wiki](https://wiki.nixos.org/wiki/Distributed_build)
- [Document available system features - nix#7380](https://github.com/NixOS/nix/issues/7380)
- [Distributed builds seem to disable local builds - nix#2589](https://github.com/NixOS/nix/issues/2589)
- [Offloading NixOS builds to a faster machine](https://sgt.hootr.club/molten-matter/nix-distributed-builds/)
- [tests/nixos/remote-builds.nix - Nix Source Code](https://github.com/NixOS/nix/blob/713836112/tests/nixos/remote-builds.nix#L46)
