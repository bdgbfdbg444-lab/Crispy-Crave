const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp({
  projectId: "crispy-c9702",
  databaseURL: "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app"
});
exports.requestOtp = functions.https.onCall(async (data, context) => {
  const phone = (data.phone || "").replace(/\D/g, "");
  if (phone.length < 10) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid phone number");
  }

  const db = admin.database();
  const rateLimitRef = db.ref(`OtpRateLimits/${phone}`);
  
  // Rate limiting check
  const rateLimitSnap = await rateLimitRef.once("value");
  const rateLimitData = rateLimitSnap.val();
  const now = Date.now();
  if (rateLimitData && rateLimitData.lastRequestedAt && now - rateLimitData.lastRequestedAt < 120000) {
    throw new functions.https.HttpsError("resource-exhausted", "Please wait 2 minutes before requesting a new code.");
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const reqId = `otp_${now}_${Math.random().toString(36).substring(2, 7)}`;

  // Update rate limit
  await rateLimitRef.set({ lastRequestedAt: now });

  // Store verification code privately
  await db.ref(`OtpVerifications/${phone}`).set({
    code: code,
    expiresAt: now + 5 * 60 * 1000 // 5 minutes
  });

  // Push to PendingOtpRequests for POS to pick up
  await db.ref(`PendingOtpRequests/${reqId}`).set({
    phone: phone,
    otp: code,
    createdAt: now
  });

  return { success: true };
});

exports.verifyAndBind = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  const uid = context.auth.uid;
  const phone = (data.phone || "").replace(/\D/g, "");
  const code = (data.code || "").trim();

  if (!phone || !code) {
    throw new functions.https.HttpsError("invalid-argument", "Phone and code are required.");
  }

  const db = admin.database();
  const verifyRef = db.ref(`OtpVerifications/${phone}`);
  const snap = await verifyRef.once("value");
  const record = snap.val();

  if (!record || record.code !== code) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid verification code.");
  }

  if (Date.now() > record.expiresAt) {
    throw new functions.https.HttpsError("deadline-exceeded", "Verification code expired.");
  }

  // Bind the phone to the user's UID using Admin SDK (bypasses rules)
  const uidToPhoneRef = db.ref(`UidToPhone/${uid}`);
  const existingMapping = await uidToPhoneRef.once("value");
  
  if (existingMapping.exists() && existingMapping.val() !== phone) {
    throw new functions.https.HttpsError("permission-denied", "UID is already bound to a different phone.");
  }

  await uidToPhoneRef.set(phone);
  await verifyRef.remove(); // Burn the OTP

  return { success: true };
});

