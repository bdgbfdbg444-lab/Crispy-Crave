
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  await testEnv.clearDatabase();
  const authA = testEnv.authenticatedContext("userA").database();
  const authB = testEnv.authenticatedContext("userB").database();

  // Create base customer
  await authA.ref(`PublicCustomers/01000`).update({ uid: "userA", Phone: "01000", TotalOrders: 0 });

  let results = [];
  async function test(id, path, authDb, op, expectPass, promise) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    console.log(`${id} | ${expectPass ? "SUCCEED" : "FAIL"} | ${passed ? "PASS" : "FAIL"}`);
  }

  // 1. Valid address write
  await test("1", `PublicCustomers/01000/addresses`, authA, "valid address", true, 
    authA.ref(`PublicCustomers/01000/addresses`).set([
      { id: "123", fullAddress: "123 Main St", zone: "A", isDefault: true, lat: 10.0, lng: 20.0 }
    ])
  );

  // 2. Invalid address type
  await test("2", `PublicCustomers/01000/addresses`, authA, "invalid type", false, 
    authA.ref(`PublicCustomers/01000/addresses/0`).update({ lat: "not_a_number" })
  );

  // 3. Arbitrary nested field
  await test("3", `PublicCustomers/01000/addresses`, authA, "arbitrary field", false, 
    authA.ref(`PublicCustomers/01000/addresses/0`).update({ hackField: true })
  );

  // 4. Wrong user update
  await test("4", `PublicCustomers/01000/addresses`, authB, "wrong user", false, 
    authB.ref(`PublicCustomers/01000/addresses`).set([])
  );

  // 5. Delete address
  await test("5", `PublicCustomers/01000/addresses/0`, authA, "delete address", true, 
    authA.ref(`PublicCustomers/01000/addresses/0`).remove()
  );

  await testEnv.cleanup();
}
runTests();

