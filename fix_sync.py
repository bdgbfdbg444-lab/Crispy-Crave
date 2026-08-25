path = '../src/RestaurantPOS.UI/Services/FirebaseSyncService.cs'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('publicPayload[$"{phone}/Address"] = c.Address ?? "";', 'if (!string.IsNullOrWhiteSpace(c.Address)) publicPayload[$"{phone}/Address"] = c.Address;')

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
