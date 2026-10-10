
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";

async function runTests() {
  const projectId = "crispy-c9702";
  const rules = readFileSync("database.rules.json", "utf8");
  const testEnv = await initializeTestEnvironment({ projectId, database: { rules, host: "127.0.0.1", port: 9000 } });
  
  await testEnv.clearDatabase();
  const authA = testEnv.authenticatedContext("userA").database();
  const authB = testEnv.authenticatedContext("userB").database();

  let results = [];
  async function test(id, path, authDb, op, expectPass, promise) {
    let passed = false;
    try {
      if (expectPass) { await assertSucceeds(promise); passed = true; }
      else { await assertFails(promise); passed = true; }
    } catch(err) { passed = false; }
    const actual = passed ? (expectPass ? "SUCCEED" : "FAIL") : (expectPass ? "FAIL" : "SUCCEED");
    const testResult = `${id} | ${path} | ${authDb === authA ? "authA" : "authB"} | ${op} | ${expectPass ? "SUCCEED" : "FAIL"} | ${actual} | ${passed ? "PASS" : "FAIL"}`;
    console.log(testResult);
    results.push(testResult);
  }

  // A. create with uid + phone
  await test("A", `PublicCustomers/01000`, authA, "CREATE (uid+phone)", true, authA.ref(`PublicCustomers/01000`).update({ uid: "userA", Phone: "01000", TotalOrders: 0 }));
  
  // B. create with uid only
  await test("B", `PublicCustomers/01001`, authA, "CREATE (uid only)", false, authA.ref(`PublicCustomers/01001`).set({ uid: "userA" }));
  
  // C. create with mismatched Phone vs $phone
  await test("C", `PublicCustomers/01002`, authA, "CREATE (mismatched phone)", false, authA.ref(`PublicCustomers/01002`).set({ uid: "userA", Phone: "99999" }));
  
  // D. update own Name/Address
  await test("D", `PublicCustomers/01000`, authA, "UPDATE (Name/Address)", true, authA.ref(`PublicCustomers/01000`).update({ Name: "John", Address: "123 St" }));
  
  // E. update own TotalOrders
  await test("E", `PublicCustomers/01000`, authA, "UPDATE (TotalOrders)", false, authA.ref(`PublicCustomers/01000`).update({ TotalOrders: 5 }));
  
  // F. update own TotalSpent
  await test("F", `PublicCustomers/01000`, authA, "UPDATE (TotalSpent)", false, authA.ref(`PublicCustomers/01000`).update({ TotalSpent: 500 }));
  
  // G. update own LastOrderDate
  await test("G", `PublicCustomers/01000`, authA, "UPDATE (LastOrderDate)", false, authA.ref(`PublicCustomers/01000`).update({ LastOrderDate: "now" }));
  
  // H. wrong-user update
  await test("H", `PublicCustomers/01000`, authB, "UPDATE (wrong user)", false, authB.ref(`PublicCustomers/01000`).update({ Name: "Hacker" }));
  
  // I. UID change
  await test("I", `PublicCustomers/01000`, authA, "UPDATE (UID change)", false, authA.ref(`PublicCustomers/01000`).update({ uid: "userB" }));
  
  // J. arbitrary sibling
  await test("J", `PublicCustomers/01000`, authA, "UPDATE (arbitrary sibling)", false, authA.ref(`PublicCustomers/01000`).update({ admin: true }));

  await testEnv.cleanup();
}
runTests();




