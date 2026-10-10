
import fs from "fs";
const rules = {
  "rules": {
    ".read": false,
    ".write": false,

    "menu": { ".read": true },
    "WebsiteData": { ".read": true },
    "WebsiteDraft": { ".read": true },
    "StoreStatus": { ".read": true },
    "Coupons": { ".read": true },
    "ApprovedReviews": { ".read": true },
    "version": { ".read": true },
    "Blacklist": { "$phone": { ".read": true } },
    "OrderTracking": { "$orderId": { ".read": true } },

    "PendingOtpRequests": {
      "$reqId": {
        ".write": "auth != null && !data.exists() && newData.child(\"uid\").val() === auth.uid",
        ".validate": "newData.hasChildren([\"phone\", \"uid\", \"otp\", \"createdAt\"])",
        "phone": { ".validate": "newData.isString()" },
        "uid": { ".validate": "newData.isString()" },
        "otp": { ".validate": "newData.isString()" },
        "createdAt": { ".validate": "newData.isNumber() || newData.isString()" },
        "$other": { ".validate": false }
      }
    },
    "Orders": {
      "$orderId": {
        ".write": "auth != null && !data.exists()",
        ".validate": "newData.hasChildren([\"idempotencyKey\", \"trackingToken\", \"orderDate\", \"customerName\", \"customerPhone\", \"orderType\", \"subtotal\", \"totalAmount\", \"status\", \"items\"])",
        "idempotencyKey": { ".validate": "true" },
        "trackingToken": { ".validate": "newData.isString()" },
        "orderDate": { ".validate": "newData.isString()" },
        "customerName": { ".validate": "newData.isString()" },
        "customerPhone": { ".validate": "newData.isString()" },
        "notes": { ".validate": "newData.isString()" },
        "orderType": { ".validate": "newData.isString()" },
        "handoverCode": { ".validate": "newData.isString()" },
        "deliveryAddress": { ".validate": "newData.isString()" },
        "deliveryZone": { ".validate": "newData.isString()" },
        "deliveryFee": { ".validate": "newData.isNumber()" },
        "mapsUrl": { ".validate": "newData.isString()" },
        "lat": { ".validate": "newData.isNumber() || !newData.exists()" },
        "lng": { ".validate": "newData.isNumber() || !newData.exists()" },
        "street": { ".validate": "newData.isString()" },
        "building": { ".validate": "newData.isString()" },
        "floor": { ".validate": "newData.isString()" },
        "apartment": { ".validate": "newData.isString()" },
        "landmark": { ".validate": "newData.isString()" },
        "tableNumber": { ".validate": "newData.isString()" },
        "subtotal": { ".validate": "newData.isNumber()" },
        "taxPercentage": { ".validate": "newData.isNumber()" },
        "taxAmount": { ".validate": "newData.isNumber()" },
        "couponCode": { ".validate": "newData.isString()" },
        "discountAmount": { ".validate": "newData.isNumber()" },
        "totalAmount": { ".validate": "newData.isNumber()" },
        "paymentMethod": { ".validate": "newData.isString()" },
        "status": { ".validate": "newData.val() === \"New\"" },
        "displayOrderId": { ".validate": "newData.isString()" },
        "paymentReceiptUrl": { ".validate": "newData.isString()" },
        "items": {
          "$index": {
            ".validate": "newData.hasChildren([\"productId\", \"productName\", \"quantity\", \"unitPrice\"])",
            "productId": { ".validate": "newData.isNumber() || newData.isString()" },
            "productName": { ".validate": "newData.isString()" },
            "quantity": { ".validate": "newData.isNumber()" },
            "unitPrice": { ".validate": "newData.isNumber()" },
            "modifierNotes": { ".validate": "newData.isString()" },
            "weightInGrams": { ".validate": "newData.isNumber()" },
            "$other": { ".validate": false }
          }
        },
        "$other": { ".validate": false }
      }
    },
    "OrderModificationRequests": {
      "$modId": {
        ".write": "auth != null && !data.exists()",
        ".validate": "newData.hasChildren([\"idempotencyKey\", \"trackingToken\", \"orderDate\", \"customerName\", \"customerPhone\", \"orderType\", \"subtotal\", \"totalAmount\", \"status\", \"items\"])",
        "idempotencyKey": { ".validate": "true" },
        "trackingToken": { ".validate": "newData.isString()" },
        "orderDate": { ".validate": "newData.isString()" },
        "customerName": { ".validate": "newData.isString()" },
        "customerPhone": { ".validate": "newData.isString()" },
        "notes": { ".validate": "newData.isString()" },
        "orderType": { ".validate": "newData.isString()" },
        "handoverCode": { ".validate": "newData.isString()" },
        "deliveryAddress": { ".validate": "newData.isString()" },
        "deliveryZone": { ".validate": "newData.isString()" },
        "deliveryFee": { ".validate": "newData.isNumber()" },
        "mapsUrl": { ".validate": "newData.isString()" },
        "lat": { ".validate": "newData.isNumber() || !newData.exists()" },
        "lng": { ".validate": "newData.isNumber() || !newData.exists()" },
        "street": { ".validate": "newData.isString()" },
        "building": { ".validate": "newData.isString()" },
        "floor": { ".validate": "newData.isString()" },
        "apartment": { ".validate": "newData.isString()" },
        "landmark": { ".validate": "newData.isString()" },
        "tableNumber": { ".validate": "newData.isString()" },
        "subtotal": { ".validate": "newData.isNumber()" },
        "taxPercentage": { ".validate": "newData.isNumber()" },
        "taxAmount": { ".validate": "newData.isNumber()" },
        "couponCode": { ".validate": "newData.isString()" },
        "discountAmount": { ".validate": "newData.isNumber()" },
        "totalAmount": { ".validate": "newData.isNumber()" },
        "paymentMethod": { ".validate": "newData.isString()" },
        "status": { ".validate": "newData.val() === \"New\"" },
        "displayOrderId": { ".validate": "newData.isString()" },
        "paymentReceiptUrl": { ".validate": "newData.isString()" },
        "items": {
          "$index": {
            ".validate": "newData.hasChildren([\"productId\", \"productName\", \"quantity\", \"unitPrice\"])",
            "productId": { ".validate": "newData.isNumber() || newData.isString()" },
            "productName": { ".validate": "newData.isString()" },
            "quantity": { ".validate": "newData.isNumber()" },
            "unitPrice": { ".validate": "newData.isNumber()" },
            "modifierNotes": { ".validate": "newData.isString()" },
            "weightInGrams": { ".validate": "newData.isNumber()" },
            "$other": { ".validate": false }
          }
        },
        "$other": { ".validate": false }
      }
    },
    "ActiveHoldRequests": {
      "$orderId": {
        ".write": "auth != null && (!data.exists() ? newData.child(\"uid\").val() === auth.uid : data.child(\"uid\").val() === auth.uid && (!newData.exists() || newData.child(\"uid\").val() === auth.uid))",
        ".validate": "newData.hasChildren([\"OrderId\", \"ExpiresAt\", \"uid\"]) || !newData.exists()",
        "OrderId": { ".validate": "newData.isString()" },
        "CustomerName": { ".validate": "newData.isString()" },
        "CustomerPhone": { ".validate": "newData.isString()" },
        "StartedAt": { ".validate": "newData.isNumber()" },
        "ExpiresAt": { ".validate": "newData.isNumber()" },
        "uid": { ".validate": "newData.isString()" },
        "$other": { ".validate": false }
      }
    },
    "PublicTracking": {
      "$token": {
        ".read": true,
        ".write": "auth != null && !data.exists()",
        ".validate": "newData.hasChildren([\"Status\", \"OrderNumber\", \"EstimatedDelivery\", \"LastUpdate\"])",
        "OrderNumber": { ".validate": "newData.isString() && (!data.exists() || newData.val() === data.val())" },
        "Status": { ".validate": "newData.isString() && newData.val() === \"New\" && (!data.exists() || newData.val() === data.val())" },
        "EstimatedDelivery": { ".validate": "newData.isString() && (!data.exists() || newData.val() === data.val())" },
        "LastUpdate": { ".validate": "newData.isString() && (!data.exists() || newData.val() === data.val())" },
        "IsModifying": {
          ".write": "auth != null && newData.exists()",
          ".validate": "newData.isBoolean()" 
        },
        "ModificationExpiresAt": { 
          ".write": "auth != null && newData.exists()",
          ".validate": "newData.isNumber() || newData.isString()" 
        },
        "ModificationCount": {
          ".write": "auth != null && newData.exists()",
          ".validate": "newData.isNumber()"
        },
        "ModificationExpired": {
          ".write": "auth != null && newData.exists()",
          ".validate": "newData.isBoolean()"
        },
        "$other": { ".validate": false }
      }
    },
    "UsedCoupons": {
      "$code": {
        "$phone": {
          ".write": "auth != null && !data.exists()",
          ".validate": "newData.val() === true"
        }
      }
    },
    "PendingReviews": {
      "$reviewId": {
        ".write": "auth != null && !data.exists()",
        ".validate": "newData.hasChildren([\"customerName\", \"rating\", \"comment\", \"status\", \"createdAt\"])",
        "customerName": { ".validate": "newData.isString()" },
        "rating": { ".validate": "newData.isNumber()" },
        "comment": { ".validate": "newData.isString()" },
        "imageUrl": { ".validate": "newData.isString() || !newData.exists()" },
        "status": { ".validate": "newData.val() === \"Pending\"" },
        "createdAt": { ".validate": "newData.isString()" },
        "$other": { ".validate": false }
      }
    },
    "PublicCustomers": {
      "$phone": {
        ".read": "auth != null && data.child(\"uid\").val() === auth.uid",
        ".validate": "newData.hasChildren([\"uid\", \"Phone\"]) && newData.child(\"Phone\").val() === $phone",
        "uid": { 
          ".write": "auth != null && (!data.exists() || data.val() === auth.uid) && newData.val() === auth.uid",
          ".validate": "newData.isString()" 
        },
        "Phone": { 
          ".write": "auth != null && (!data.exists() || data.parent().child(\"uid\").val() === auth.uid) && newData.val() === $phone",
          ".validate": "newData.isString()" 
        },
        "Name": { 
          ".write": "auth != null && (!data.exists() || data.parent().child(\"uid\").val() === auth.uid)",
          ".validate": "newData.isString()" 
        },
        "Address": { 
          ".write": "auth != null && (!data.exists() || data.parent().child(\"uid\").val() === auth.uid)",
          ".validate": "newData.isString()" 
        },
        "Email": { 
          ".write": "auth != null && (!data.exists() || data.parent().child(\"uid\").val() === auth.uid)",
          ".validate": "newData.isString()" 
        },
        "addresses": { 
          ".write": "auth != null && (!data.exists() || data.parent().child(\"uid\").val() === auth.uid)",
          "$index": {
            ".validate": "newData.hasChildren([\"id\", \"fullAddress\", \"zone\"])",
            "id": { ".validate": "newData.isString()" },
            "label": { ".validate": "newData.isString() || !newData.exists()" },
            "fullAddress": { ".validate": "newData.isString()" },
            "zone": { ".validate": "newData.isString()" },
            "street": { ".validate": "newData.isString() || !newData.exists()" },
            "building": { ".validate": "newData.isString() || !newData.exists()" },
            "floor": { ".validate": "newData.isString() || !newData.exists()" },
            "apartment": { ".validate": "newData.isString() || !newData.exists()" },
            "landmark": { ".validate": "newData.isString() || !newData.exists()" },
            "lat": { ".validate": "newData.isNumber() || !newData.exists()" },
            "lng": { ".validate": "newData.isNumber() || !newData.exists()" },
            "isDefault": { ".validate": "newData.isBoolean() || !newData.exists()" },
            "isOutOfZone": { ".validate": "newData.isBoolean() || !newData.exists()" },
            "$other": { ".validate": false }
          }
        },
        "Zone": { 
          ".write": "auth != null && (!data.exists() || data.parent().child(\"uid\").val() === auth.uid)",
          ".validate": "newData.isString()" 
        },
        "zone": { 
          ".write": "auth != null && (!data.exists() || data.parent().child(\"uid\").val() === auth.uid)",
          ".validate": "newData.isString()" 
        },
        "TotalOrders": { 
          ".write": "auth != null && !data.exists() && newData.val() === 0",
          ".validate": "newData.isNumber()" 
        },
        "TotalSpent": { 
          ".write": "auth != null && !data.exists() && newData.val() === 0",
          ".validate": "newData.isNumber()" 
        },
        "LastOrderDate": { 
          ".validate": "newData.isString()" 
        },
        "$other": { ".validate": false }
      }
    },
    "UidToPhone": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid && !data.exists()",
        ".validate": "newData.isString()"
      }
    },
    "VisitorHistory": {
      "$sessionId": { 
        ".write": "newData.exists()",
        ".validate": "newData.hasChildren([\"ip\", \"location\", \"deviceType\", \"startTime\", \"lastSeen\", \"history\"])",
        "ip": { ".validate": "newData.isString()" },
        "location": { ".validate": "newData.isString()" },
        "deviceType": { ".validate": "newData.isString()" },
        "startTime": { ".validate": "newData.isString()" },
        "lastSeen": { ".validate": "newData.isString()" },
        "history": {
          "$index": {
            ".validate": "newData.hasChildren([\"page\", \"time\"])",
            "page": { ".validate": "newData.isString()" },
            "time": { ".validate": "newData.isString()" },
            "$other": { ".validate": false }
          }
        },
        "$other": { ".validate": false }
      }
    },
    "_analytics": {
      "online": {
        "$sessionId": {
          ".write": "!newData.exists() || newData.hasChildren([\"page\", \"timestamp\"])",
          ".validate": "!newData.exists() || newData.hasChildren([\"page\", \"startTime\", \"timestamp\", \"deviceType\", \"ip\", \"location\", \"history\"])",
          "page": { ".validate": "newData.isString()" },
          "startTime": { ".validate": "newData.isString()" },
          "timestamp": { ".validate": "newData.isString()" },
          "isOrdering": { ".validate": "newData.isBoolean()" },
          "deviceType": { ".validate": "newData.isString()" },
          "ip": { ".validate": "newData.isString()" },
          "location": { ".validate": "newData.isString()" },
          "history": {
            "$index": {
              ".validate": "newData.hasChildren([\"page\", \"time\"])",
              "page": { ".validate": "newData.isString()" },
              "time": { ".validate": "newData.isString()" },
              "$other": { ".validate": false }
            }
          },
          "$other": { ".validate": false }
        }
      },
      "daily": {
        "$date": {
          ".write": "newData.exists() && newData.hasChildren()",
          "totalPageViews": { ".validate": "newData.isNumber()" },
          "uniqueVisitors": { ".validate": "newData.isNumber()" },
          "hourly": {
            "$hour": {
              "pageViews": { ".validate": "newData.isNumber()" },
              "$other": { ".validate": false }
            }
          },
          "$other": { ".validate": false }
        }
      }
    }
  }
};
fs.writeFileSync("database.rules.json", JSON.stringify(rules, null, 2));

