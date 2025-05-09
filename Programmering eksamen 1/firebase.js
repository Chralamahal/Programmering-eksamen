// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDjHiyu3pGHPRAKiEmLlIQAPtQ1P5w1hBA",
  authDomain: "database-test-8370e.firebaseapp.com",
  projectId: "database-test-8370e",
  storageBucket: "database-test-8370e.firebasestorage.app",
  messagingSenderId: "1070256616663",
  appId: "1:1070256616663:web:77296d0abf0ff7eeca6c92"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.firestore()