
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();
  const authB = testEnv.authenticatedContext("userB", { sub: "userB" }).database();
  const unauth = testEnv.unauthenticatedContext().database();

  let results = [];
  async function test(id, path, authDb, op, expectPass, promise) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    const actual = passed ? (expectPass ? "SUCCEED" : "FAIL") : (expectPass ? "FAIL" : "SUCCEED");
    const testResult = `${id} | ${path} | ${authDb === authA ? "authA" : authDb === authB ? "authB" : "unauth"} | ${op} | ${expectPass ? "SUCCEED" : "FAIL"} | ${actual} | ${passed ? "PASS" : "FAIL"}`;
    console.log(testResult);
    results.push(testResult);
  }

  // 1. UsedCoupons
  await test("1A", `UsedCoupons/SUMMER/01000`, authA, "CREATE (User A own phone)", true, authA.ref(`UsedCoupons/SUMMER/01000`).set(true));
  await test("1B", `UsedCoupons/SUMMER/01001`, authA, "CREATE (User A, User B phone)", true, authA.ref(`UsedCoupons/SUMMER/01001`).set(true));
  await test("1C", `UsedCoupons/SUMMER/01001`, authB, "CREATE (User B own phone - already taken)", false, authB.ref(`UsedCoupons/SUMMER/01001`).set(true));
  await test("1D", `UsedCoupons/SUMMER/01000`, authA, "UPDATE (Duplicate claim)", false, authA.ref(`UsedCoupons/SUMMER/01000`).set(true));
  await test("1E", `UsedCoupons/SUMMER/01000`, authA, "UPDATE (Overwrite false)", false, authA.ref(`UsedCoupons/SUMMER/01000`).set(false));
  await test("1F", `UsedCoupons/SUMMER/01000`, authA, "DELETE", false, authA.ref(`UsedCoupons/SUMMER/01000`).remove());
  await test("1G", `UsedCoupons/WINTER/01002`, authA, "CREATE (Malformed payload)", false, authA.ref(`UsedCoupons/WINTER/01002`).set({ hacked: true }));

  // 2. OrderModificationRequests
  const validMod = {
    idempotencyKey: true, trackingToken: "trk", orderDate: "now", customerName: "A", customerPhone: "01000", orderType: "Pickup",
    subtotal: 100, totalAmount: 100, status: "New", items: [{productId: "1", productName: "Burger", quantity: 1, unitPrice: 100}]
  };
  await test("2A", `OrderModificationRequests/M1`, authA, "CREATE (Valid)", true, authA.ref(`OrderModificationRequests/M1`).set(validMod));
  await test("2B", `OrderModificationRequests/M2`, authB, "CREATE (Modifying someone else)", true, authB.ref(`OrderModificationRequests/M2`).set(validMod));
  await test("2C", `OrderModificationRequests/M3`, authA, "CREATE (Wrong phone/missing)", false, authA.ref(`OrderModificationRequests/M3`).set({...validMod, customerPhone: null}));
  await test("2D", `OrderModificationRequests/M4`, authA, "CREATE (Wrong token/missing)", false, authA.ref(`OrderModificationRequests/M4`).set({...validMod, trackingToken: null}));
  await test("2E", `OrderModificationRequests/M5`, authA, "CREATE (Forged Order ID)", true, authA.ref(`OrderModificationRequests/M5`).set(validMod));
  await test("2F", `OrderModificationRequests/M1`, authA, "UPDATE (Overwrite)", false, authA.ref(`OrderModificationRequests/M1`).set(validMod));
  await test("2G", `OrderModificationRequests/M1`, authA, "DELETE", false, authA.ref(`OrderModificationRequests/M1`).remove());
  await test("2H", `OrderModificationRequests/M6`, authA, "CREATE (Forged status)", false, authA.ref(`OrderModificationRequests/M6`).set({...validMod, status: "Accepted"}));
  await test("2I", `OrderModificationRequests/M7`, authA, "CREATE (Malformed schema)", false, authA.ref(`OrderModificationRequests/M7`).set({ status: "New" }));

  // 3. PublicTracking
  const t = "trk1";
  await authA.ref(`PublicTracking/${t}`).set({ OrderNumber: "1", Status: "New", EstimatedDelivery: "30", LastUpdate: "now" });
  await test("3A", `PublicTracking/${t}/IsModifying`, authA, "UPDATE (Valid)", true, authA.ref(`PublicTracking/${t}/IsModifying`).set(true));
  await test("3B", `PublicTracking/${t}/IsModifying`, authA, "UPDATE (Invalid type)", false, authA.ref(`PublicTracking/${t}/IsModifying`).set("true"));
  await test("3C", `PublicTracking/${t}/IsModifying`, authA, "DELETE", false, authA.ref(`PublicTracking/${t}/IsModifying`).remove());
  await test("3D", `PublicTracking/${t}/IsModifying`, authA, "UPDATE (Arbitrary value)", false, authA.ref(`PublicTracking/${t}/IsModifying`).set(123));
  await test("3E", `PublicTracking/${t}`, authA, "UPDATE (Multi-field)", true, authA.ref(`PublicTracking/${t}`).update({ IsModifying: false, ModificationCount: 1 }));
  await test("3F", `PublicTracking/${t}/ModificationCount`, unauth, "UPDATE (Unauth)", false, unauth.ref(`PublicTracking/${t}/ModificationCount`).set(2));
  await test("3G", `PublicTracking/${t}/ModificationCount`, authB, "UPDATE (Auth cross-token)", true, authB.ref(`PublicTracking/${t}/ModificationCount`).set(2));

  await testEnv.cleanup();
}
runTests();

