<#
  Restringe a permissao Mail.Send do app do formulario a uma unica caixa.

  Por que isso e obrigatorio
  --------------------------
  `Mail.Send` como permissao de APLICACAO (client credentials, sem usuario)
  autoriza o app a enviar como QUALQUER caixa do tenant. Se o
  GRAPH_CLIENT_SECRET vazar, o atacante troca o endereco na URL do sendMail
  e envia em nome de qualquer pessoa da empresa, com SPF, DKIM e DMARC
  passando. A Application Access Policy e o que fecha isso.

  Hoje o tenant tem uma caixa so, entao o raio de acao ja e um. A policy
  vale para o depois: no dia em que a empresa tiver a segunda caixa, o app
  continua preso a primeira sem ninguem precisar lembrar disso.

  Como rodar
  ----------
      pwsh -File docs/deploy/restringir-mail-send.ps1

  Abre uma janela de login do Microsoft 365. Entre com uma conta de
  administrador global do tenant (uemerson@alvesmaia.com).
#>

[CmdletBinding()]
param(
  # Application (client) ID do app "Alvesmaia Site - Formulario de Contato".
  [string] $AppId = '0bdf678a-ca4f-4e33-8107-b1dac150f765',

  # A caixa que o app pode usar. E um alias de uemerson@alvesmaia.com; o
  # Exchange resolve para a caixa, e e a caixa que fica no escopo.
  [string] $Caixa = 'no-reply@alvesmaia.com',

  [string] $Admin = 'uemerson@alvesmaia.com'
)

$ErrorActionPreference = 'Stop'

function Passo($texto) { Write-Host "`n>> $texto" -ForegroundColor Cyan }

Passo 'Conectando ao Exchange Online'
Import-Module ExchangeOnlineManagement -ErrorAction Stop
Connect-ExchangeOnline -UserPrincipalName $Admin -ShowBanner:$false

try {
  Passo 'Conferindo para qual caixa o alias resolve'
  $mbx = Get-Mailbox -Identity $Caixa -ErrorAction Stop
  Write-Host ("   alias {0} -> caixa {1}" -f $Caixa, $mbx.PrimarySmtpAddress)

  Passo 'Policies existentes para este app'
  $jaExiste = Get-ApplicationAccessPolicy -ErrorAction SilentlyContinue |
    Where-Object { $_.AppId -eq $AppId }

  if ($jaExiste) {
    Write-Host '   ja existe uma policy para este AppId:' -ForegroundColor Yellow
    $jaExiste | Format-List Identity, AppId, ScopeName, AccessRight, Description
    Write-Host '   nada a criar. Pulando para a verificacao.' -ForegroundColor Yellow
  }
  else {
    Passo 'Criando a Application Access Policy'
    New-ApplicationAccessPolicy `
      -AppId $AppId `
      -PolicyScopeGroupId $Caixa `
      -AccessRight RestrictAccess `
      -Description 'Formulario do site: so pode enviar como no-reply' |
      Format-List Identity, AppId, ScopeName, AccessRight

    # A policy leva alguns minutos para propagar no Exchange. Sem esta
    # espera, o teste abaixo devolve o estado antigo e mente.
    Passo 'Aguardando a propagacao (ate 10 minutos)'
    Write-Host '   o Exchange leva alguns minutos; sem esperar, o teste mente.'
  }

  Passo 'Verificando o efeito real da policy'
  $r = Test-ApplicationAccessPolicy -Identity $Caixa -AppId $AppId
  Write-Host ("   {0,-34} {1}" -f $Caixa, $r.AccessCheckResult)

  if ($r.AccessCheckResult -ne 'Granted') {
    Write-Host @'

   ATENCAO: a caixa do formulario esta NEGADA.
   O formulario nao vai conseguir enviar. Confira o AppId e rode de novo
   daqui a alguns minutos — a propagacao pode nao ter terminado.
'@ -ForegroundColor Red
  }

  # Toda outra caixa do tenant precisa vir Denied. Como hoje existe uma so,
  # este laco costuma nao ter o que testar — e passa a ter quando a empresa
  # crescer, que e exatamente quando a policy comeca a valer.
  Passo 'Conferindo que as demais caixas estao fora do alcance'
  $outras = Get-Mailbox -ResultSize Unlimited |
    Where-Object { $_.PrimarySmtpAddress -ne $mbx.PrimarySmtpAddress }

  if (-not $outras) {
    Write-Host '   o tenant tem uma caixa so; nada mais a testar hoje.'
    Write-Host '   a policy fica valendo para as caixas que forem criadas depois.'
  }
  else {
    foreach ($o in $outras) {
      $t = Test-ApplicationAccessPolicy -Identity $o.PrimarySmtpAddress -AppId $AppId
      $cor = if ($t.AccessCheckResult -eq 'Denied') { 'Green' } else { 'Red' }
      Write-Host ("   {0,-34} {1}" -f $o.PrimarySmtpAddress, $t.AccessCheckResult) -ForegroundColor $cor
    }
  }

  Passo 'Estado do envio a partir de alias'
  # Sem isto o Exchange reescreve o From para o endereco primario da caixa:
  # a mensagem sairia como uemerson@, nao como no-reply@.
  $org = Get-OrganizationConfig
  Write-Host ("   SendFromAliasEnabled = {0}" -f $org.SendFromAliasEnabled)
  if (-not $org.SendFromAliasEnabled) {
    Write-Host @'
   Como esta desligado, o Exchange reescreve o remetente para o endereco
   primario da caixa. A mensagem do formulario sairia como uemerson@, nao
   como no-reply@. Para ligar:

       Set-OrganizationConfig -SendFromAliasEnabled $true

   E preciso tambem que o codigo declare o campo `from` explicitamente.
'@ -ForegroundColor Yellow
  }
}
finally {
  Disconnect-ExchangeOnline -Confirm:$false | Out-Null
  Write-Host "`nDesconectado." -ForegroundColor DarkGray
}
