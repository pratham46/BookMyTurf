// Import the functions you need from the SDKs you need
import * as firebase from "firebase";
import firestore from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDynSagvMokwOZ4TEMqXRibIL74O8DspKc",
  authDomain: "bookmyturf-3fc42.firebaseapp.com",
  databaseURL: "https://bookmyturf-3fc42-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "bookmyturf-3fc42",
  storageBucket: "bookmyturf-3fc42.appspot.com",
  messagingSenderId: "256919770691",
  appId: "1:256919770691:web:b191f831d0d3c5a5c0e6f6",
  measurementId: "G-R9K2DW9XEX"
};

// Initialize Firebase
let app;
if (firebase.apps.length === 0) {
  app = [firebase.initializeApp(firebaseConfig),firebase.firestore()];
} else {
  app = firebase.app()
}

const auth = firebase.auth()
export { auth, firestore };
