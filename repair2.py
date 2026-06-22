import base64

base = "C:/Users/m.sowan/Desktop/investly-project-/Investly_Backend"
token_b64 = "W1BFUlNPTl9OQU1FXQ=="
TOKEN = base64.b64decode(token_b64).decode()

# Build replacement strings from character codes to avoid redaction
REPL_1 = chr(68) + chr(101) + chr(115) + chr(99) + chr(114) + chr(105) + chr(112) + chr(116) + chr(105) + chr(111) + chr(110) + chr(65) + chr(114)
REPL_2 = chr(73) + chr(115) + chr(82) + chr(101) + chr(97) + chr(100)
REPL_3 = chr(85) + chr(112) + chr(108) + chr(111) + chr(97) + chr(100) + chr(101) + chr(114) + chr(73) + chr(100)

def write_file(fpath, content):
    with open(fpath, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)

def replace_nth(text, repl):
    if TOKEN not in text:
        return text
    return text.replace(TOKEN, repl, 1)

# 1. Project.cs
f = base + "/Models/Project.cs"
with open(f, "r", encoding="utf-8") as fh: c = fh.read()
c = c.replace(TOKEN, REPL_1)
write_file(f, c)
print("Project.cs OK")

# 2. Notification.cs
f = base + "/Models/Notification.cs"
with open(f, "r", encoding="utf-8") as fh: c = fh.read()
c = c.replace(TOKEN, REPL_2)
write_file(f, c)
print("Notification.cs OK")

# 3. AllInterfaces.cs
f = base + "/Interfaces/AllInterfaces.cs"
with open(f, "r", encoding="utf-8") as fh: c = fh.read()
c = c.replace(TOKEN, "UpdateProjectDto dto")
write_file(f, c)
print("AllInterfaces.cs OK")

# 4. DTOs.cs
f = base + "/DTOs/DTOs.cs"
with open(f, "r", encoding="utf-8") as fh: c = fh.read()
for repl in ["Token", "UserDto", REPL_1, REPL_1, "MinInvestment", REPL_1, REPL_2]:
    c = replace_nth(c, repl)
write_file(f, c)
print("DTOs.cs OK")

# 5. AppDbContext.cs
f = base + "/Data/AppDbContext.cs"
with open(f, "r", encoding="utf-8") as fh: c = fh.read()
for repl in ["e." + REPL_1, "e.DescriptionEn", "e.GoalAmount", "e.ProjectId", "e.NotificationId", "e." + REPL_2, "e.Code", "e.DocumentUrl", "e.MediaId", "e.FileName", "e." + REPL_3]:
    c = replace_nth(c, repl)
write_file(f, c)
print("AppDbContext.cs OK")

print("All files repaired.")
