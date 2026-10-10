const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getDatabase, ref, set } = require('firebase/database');

const firebaseConfig = {
  databaseURL: "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app/",
  apiKey: "AIzaSyBnxmjVjKisKpejJl6opSZIKJcKIwCJXts"
};

async function test() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  try {
    const cred = await signInAnonymously(auth);
    const uid = cred.user.uid;
    console.log('Logged in with uid:', uid);
    
    await set(ref(db, `ActiveHoldRequests/test1234`), {
      OrderId: 'test1234',
      CustomerName: 'test name',
      CustomerPhone: '12345678',
      StartedAt: Date.now(),
      uid: uid,
      ExpiresAt: Date.now() + 300000
    });
    console.log('Successfully wrote ActiveHoldRequests');
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
