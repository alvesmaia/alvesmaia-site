<#
  Mostra as Application Access Policies do tenant e o efeito real de cada uma.

  Por que existe um script so para ler
  ------------------------------------
  A Application Access Policy nao aparece em interface nenhuma: nem no
  portal do Azure, nem no centro de administracao do Entra, nem no do
  Exchange. PowerShell e o unico jeito de ver que ela esta la — e uma
  protecao invisivel e uma protecao que ninguem confere.

  So le. Nao cria, nao altera, nao apaga.

  Como rodar
  ----------
  Sem login interativo, reaproveitando a sessao do Azure CLI:

      TOKEN=$(az account get-access-token --resource "https://outlook.office365.com" --query accessToken -o tsv) \
        pwsh -File docs/deploy/ver-politicas.ps1

  No PowerShell:

      $env:TOKEN = az account get-access-token --resource "https://outlook.office365.com" --query accessToken -o tsv
      pwsh -File docs/deploy/ver-politicas.ps1
#>

[CmdletBinding()]
param(
  [string] $Organizacao = 'alvesmaia.com',
  [string] $Token = $env:TOKEN
)

$ErrorActionPreference = 'Stop'

if (-not $Token) {
  Write-Host 'Falta o token. Gere com:' -ForegroundColor Red
  Write-Host '  az account get-access-token --resource "https://outlook.office365.com" --query accessToken -o tsv'
  exit 1
}

Import-Module ExchangeOnlineManagement -ErrorAction Stop
Connect-ExchangeOnline -AccessToken $Token -Organization $Organizacao -ShowBanner:$false

try {
  Write-Host "`n== Application Access Policies ==" -ForegroundColor Cyan
  $policies = @(Get-ApplicationAccessPolicy -ErrorAction SilentlyContinue)

  if (-not $policies) {
    Write-Host '   nenhuma. Mail.Send de aplicacao alcanca TODAS as caixas.' -ForegroundColor Red
  }
  else {
    foreach ($p in $policies) {
      Write-Host ("`n   AppId       : " + $p.AppId)
      Write-Host   ("   Escopo      : " + $p.ScopeName)
      Write-Host   ("   Direito     : " + $p.AccessRight)
      Write-Host   ("   Descricao   : " + $p.Description)
    }
  }

  Write-Host "`n== Caixas do tenant e o que o app alcanca ==" -ForegroundColor Cyan
  $caixas = Get-Mailbox -ResultSize Unlimited
  foreach ($p in $policies) {
    Write-Host ("`n   app " + $p.AppId + ":")
    foreach ($m in $caixas) {
      # Test-ApplicationAccessPolicy exige objeto no Entra: a caixa de
      # descoberta do Exchange nao tem, e por isso nao pode ser testada.
      if (-not $m.ExternalDirectoryObjectId) {
        Write-Host ("     {0,-46} (sem objeto no Entra, nao testavel)" -f $m.PrimarySmtpAddress) -ForegroundColor DarkGray
        continue
      }
      $t = Test-ApplicationAccessPolicy -Identity $m.PrimarySmtpAddress -AppId $p.AppId
      $negado = $t.AccessCheckResult -match 'Denied|Negado'
      $cor = if ($negado) { 'DarkGray' } else { 'Yellow' }
      Write-Host ("     {0,-46} {1}" -f $m.PrimarySmtpAddress, $t.AccessCheckResult) -ForegroundColor $cor
    }
  }

  Write-Host "`n== Envio a partir de alias ==" -ForegroundColor Cyan
  # Desligado, o Exchange reescreve o From para o endereco primario da caixa.
  Write-Host ("   SendFromAliasEnabled = " + (Get-OrganizationConfig).SendFromAliasEnabled)

  Write-Host "`n   Em amarelo estao as caixas que o app PODE usar." -ForegroundColor DarkGray
  Write-Host "   Toda caixa fora do escopo precisa aparecer como negada.`n" -ForegroundColor DarkGray
}
finally {
  Disconnect-ExchangeOnline -Confirm:$false | Out-Null
}
