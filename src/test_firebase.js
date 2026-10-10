import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  databaseURL: "https://crispy-c9702-default-rtdb.europe-west1.firebasedatabase.app/",
  apiKey: "AIzaSy..." // wait, do I have the apiKey? Yes, in firebase.js!
};
