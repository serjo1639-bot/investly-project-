$TOKEN = -join @([char]0x5B, [char]0x50, [char]0x45, [char]0x52, [char]0x53, [char]0x4F, [char]0x4E, [char]0x5F, [char]0x4E, [char]0x41, [char]0x4D, [char]0x45, [char]0x5D)

$base = 'C:\Users\m.sowan\Desktop\investly-project-\Investly_Backend'

# Fix Project.cs
$f = "$base\Models\Project.cs"
(Get-Content $f -Raw) -replace $TOKEN, 'DescriptionAr' | Set-Content $f -NoNewline

# Fix Notification.cs
$f = "$base\Models\Notification.cs"
(Get-Content $f -Raw) -replace $TOKEN, 'IsRead' | Set-Content $f -NoNewline

# Fix AllInterfaces.cs
$f = "$base\Interfaces\AllInterfaces.cs"
(Get-Content $f -Raw) -replace $TOKEN, 'UpdateProjectDto dto' | Set-Content $f -NoNewline

# Fix DTOs.cs - multiple replacements
$f = "$base\DTOs\DTOs.cs"
$c = Get-Content $f -Raw
$c = $c -replace $TOKEN, 'Token'
$c = $c -replace $TOKEN, 'UserDto'
$c = $c -replace $TOKEN, 'DescriptionAr'
$c = $c -replace $TOKEN, 'DescriptionAr'
$c = $c -replace $TOKEN, 'MinInvestment'
$c = $c -replace $TOKEN, 'DescriptionAr'
$c = $c -replace $TOKEN, 'IsRead'
Set-Content $f $c -NoNewline

# Fix AppDbContext.cs - many replacements
$f = "$base\Data\AppDbContext.cs"
$c = Get-Content $f -Raw
$c = $c -replace $TOKEN, 'e.DescriptionAr'
$c = $c -replace $TOKEN, 'e.DescriptionEn'
$c = $c -replace $TOKEN, 'e.GoalAmount'
$c = $c -replace $TOKEN, 'e.ProjectId'
$c = $c -replace $TOKEN, 'e.NotificationId'
$c = $c -replace $TOKEN, 'e.IsRead'
$c = $c -replace $TOKEN, 'e.Code'
$c = $c -replace $TOKEN, 'e.DocumentUrl'
$c = $c -replace $TOKEN, 'e.MediaId'
$c = $c -replace $TOKEN, 'e.FileName'
$c = $c -replace $TOKEN, 'e.UploaderId'
Set-Content $f $c -NoNewline

Write-Output "Done"
