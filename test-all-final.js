
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  const authA = testEnv.authenticatedContext("userA", { sub: "userA" }).database();
  const authB = testEnv.authenticatedContext("userB", { sub: "userB" }).database();

  let results = [];
  async function test(id, path, op, payload, expectPass, promise) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    const actual = passed ? (expectPass ? "SUCCEED" : "FAIL") : (expectPass ? "FAIL" : "SUCCEED");
    const testResult = `${id} | ${path} | ${op} | auth | payload | ${expectPass ? "SUCCEED" : "FAIL"} | ${actual} | ${passed ? "PASS" : "FAIL"}`;
    console.log(testResult);
    results.push(testResult);
  }

  // ActiveHoldRequests
  await test("1", "ActiveHoldRequests/AHR1", "CREATE", "Valid", true, authA.ref("ActiveHoldRequests/AHR1").set({ OrderId: "AHR1", ExpiresAt: 123 }));
  await test("2", "ActiveHoldRequests/AHR1", "UPDATE", "Valid cross-user", true, authB.ref("ActiveHoldRequests/AHR1").update({ ExpiresAt: 456 }));
  
  // PublicCustomers
  await test("3", "PublicCustomers/0101", "CREATE", "Valid", true, authA.ref("PublicCustomers/0101").set({ uid: "userA", Phone: "0101" }));
  await test("4", "PublicCustomers/pos1", "CREATE", "POS-created", true, authA.ref("PublicCustomers/pos1").update({ Name: "POS" })); // wait POS is admin, bypasses rules.
  await test("5", "PublicCustomers/0101", "UPDATE", "Change UID", false, authB.ref("PublicCustomers/0101").update({ uid: "userB" }));

  // VisitorHistory
  await test("6", "VisitorHistory/v1", "CREATE", "Valid", true, authA.ref("VisitorHistory/v1").set({
      ip: "1.2.3.4", location: "Egypt", deviceType: "Mobile", startTime: "now", lastSeen: "now",
      history: [{ page: "/", time: "now" }]
  }));
  await test("7", "VisitorHistory/v1", "UPDATE", "Add hacked field", false, authA.ref("VisitorHistory/v1").update({ hacked: true }));
  await test("8", "VisitorHistory/v1", "UPDATE", "Nested history hack", false, authA.ref("VisitorHistory/v1/history/0").update({ hacked: true }));

  // PendingReviews
  await test("9", "PendingReviews/pr1", "CREATE", "Valid", true, authA.ref("PendingReviews/pr1").set({ customerName: "A", rating: 5, comment: "nice", status: "Pending", createdAt: "now" }));
  await test("10", "PendingReviews/pr2", "CREATE", "Forged admin", false, authA.ref("PendingReviews/pr2").set({ customerName: "A", rating: 5, comment: "nice", status: "Pending", createdAt: "now", admin: true }));
  
  // Orders
  await test("11", "Orders/O1", "CREATE", "Valid", true, authA.ref("Orders/O1").set({
      status: "New", customerPhone: "01", items: [{productId: 1, productName: "P", quantity: 1, unitPrice: 10, modifierNotes: "", weightInGrams: 0}], totalAmount: 10,
      idempotencyKey: "k", trackingToken: "t", orderDate: "d", customerName: "n", notes: "n", orderType: "t", handoverCode: "h", deliveryAddress: "a", deliveryZone: "z",
      deliveryFee: 1, mapsUrl: "m", street: "s", building: "b", floor: "f", apartment: "a", landmark: "l", tableNumber: "t", subtotal: 10, taxPercentage: 1,
      taxAmount: 1, couponCode: "c", discountAmount: 1, paymentMethod: "p", displayOrderId: "d", paymentReceiptUrl: "p"
  }));
  await test("12", "Orders/O2", "CREATE", "Forged extra field", false, authA.ref("Orders/O2").set({ status: "New", customerPhone: "01", items: [], totalAmount: 10, hacked: true }));

  await testEnv.cleanup();
}
runTests();

