// Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCUPqDb_xFs_-_LhwGHFKErug4F-gtM_EQ",
    authDomain: "webdulich-ff78a.firebaseapp.com",
    projectId: "webdulich-ff78a",
    storageBucket: "webdulich-ff78a.firebasestorage.app",
    messagingSenderId: "436989427291",
    appId: "1:436989427291:web:dc670a5b6b11710b75097e",
    measurementId: "G-LWGN05J15Q"
};

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);