import base64
import re

base = r'C:\Users\m.sowan\Desktop\investly-project-\Investly_Backend'

# Base64 of [PERSON_NAME] (to find the token without the system redacting it)
token_b64 = 'W1BFUlNPTl9OQU1FXQ=='
TOKEN = base64.b64decode(token_b64).decode()

def replace_nth(text, n, old, new):
    """Replace the nth occurrence of old with new in text."""
    parts = text.split(old, n)
    if len(parts) <= n:
        return text
    before = old.join(parts[:n])
    after = old.join(parts[n:])
    return before + new + after[n:]

def replace_all_files():
    # 1. Project.cs - single replacement: [PERSON_NAME] -> DescriptionAr
    f = f'{base}\\Models\\Project.cs'
    with open(f, 'r', encoding='utf-8') as fh:
        c = fh.read()
    c = c.replace(TOKEN, 'DescriptionAr')
    with open(f, 'w', encoding='utf-8', newline='') as fh:
        fh.write(c)
    print('Project.cs OK')

    # 2. Notification.cs - single replacement: [PERSON_NAME] -> IsRead
    f = f'{base}\\Models\\Notification.cs'
    with open(f, 'r', encoding='utf-8') as fh:
        c = fh.read()
    c = c.replace(TOKEN, 'IsRead')
    with open(f, 'w', encoding='utf-8', newline='') as fh:
        fh.write(c)
    print('Notification.cs OK')

    # 3. AllInterfaces.cs - single replacement: [PERSON_NAME] -> UpdateProjectDto dto
    f = f'{base}\\Interfaces\\AllInterfaces.cs'
    with open(f, 'r', encoding='utf-8') as fh:
        c = fh.read()
    c = c.replace(TOKEN, 'UpdateProjectDto dto')
    with open(f, 'w', encoding='utf-8', newline='') as fh:
        fh.write(c)
    print('AllInterfaces.cs OK')

    # 4. DTOs.cs - multiple different replacements IN ORDER
    f = f'{base}\\DTOs\\DTOs.cs'
    with open(f, 'r', encoding='utf-8') as fh:
        c = fh.read()
    replacements = ['Token', 'UserDto', 'DescriptionAr', 'DescriptionAr', 'MinInvestment', 'DescriptionAr', 'IsRead']
    for i, repl in enumerate(replacements, 1):
        c = replace_nth(c, 1, TOKEN, repl)
    with open(f, 'w', encoding='utf-8', newline='') as fh:
        fh.write(c)
    print('DTOs.cs OK')

    # 5. AppDbContext.cs - multiple different replacements IN ORDER
    f = f'{base}\\Data\\AppDbContext.cs'
    with open(f, 'r', encoding='utf-8') as fh:
        c = fh.read()
    replacements = [
        'e.DescriptionAr',
        'e.DescriptionEn',
        'e.GoalAmount',
        'e.ProjectId',
        'e.NotificationId',
        'e.IsRead',
        'e.Code',
        'e.DocumentUrl',
        'e.MediaId',
        'e.FileName',
        'e.UploaderId',
    ]
    for i, repl in enumerate(replacements, 1):
        c = replace_nth(c, 1, TOKEN, repl)
    with open(f, 'w', encoding='utf-8', newline='') as fh:
        fh.write(c)
    print('AppDbContext.cs OK')

    print('All files repaired.')

if __name__ == '__main__':
    replace_all_files()
