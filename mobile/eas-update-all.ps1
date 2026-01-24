# Run this script as Administrator in PowerShell
# It will fix permissions and run EAS Update for all branches

$ErrorActionPreference = 'Stop'

# List of branches to update
$branches = @('main', 'staging', 'dev')

# Fix permissions for package.json and package-lock.json
icacls "package.json" /grant obuchel\admin:F
icacls "package-lock.json" /grant obuchel\admin:F

# Run EAS Update for each branch
foreach ($branch in $branches) {
    Write-Host "Publishing update to branch: $branch"
    eas update --branch $branch
}

Write-Host "All EAS updates complete."
