import urllib.request
import json

url = "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app/Orders.json?orderBy=%22customerPhone%22&equalTo=%2201012345678%22"
req = urllib.request.Request(url)
try:
    response = urllib.request.urlopen(req)
    data = json.loads(response.read().decode('utf-8'))
    print("Success. Num orders:", len(data) if isinstance(data, dict) else len(data))
except urllib.error.HTTPError as e:
    print(f"Error: {e.code} - {e.reason}")
    print(e.read().decode('utf-8'))