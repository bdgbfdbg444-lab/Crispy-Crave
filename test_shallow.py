import urllib.request
import json

url = "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app/Orders.json?shallow=true"
req = urllib.request.Request(url)
try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode('utf-8'))
    print("Success. Num orders:", len(data) if data else 0)
except urllib.error.HTTPError as e:
    print(f"Error: {e.code} - {e.reason}")