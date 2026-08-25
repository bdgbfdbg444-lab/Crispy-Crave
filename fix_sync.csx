using System;
using System.IO;
using System.Text.RegularExpressions;

var path = @"..\src\RestaurantPOS.UI\Services\FirebaseSyncService.cs";
var text = File.ReadAllText(path);

// Replace the line that sets Address to avoid overwriting with empty string
text = text.Replace("publicPayload[$\"{phone}/Address\"] = c.Address ?? \"\";", 
    "if (!string.IsNullOrWhiteSpace(c.Address)) publicPayload[$\"{phone}/Address\"] = c.Address;");

File.WriteAllText(path, text);
