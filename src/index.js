import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
// NOTE: React.StrictMode is intentionally disabled. In development it mounts
// every component twice, which rapidly subscribes/unsubscribes each Firestore
// onSnapshot listener. Combined with experimentalForceLongPolling (see
// services/firebase.js) this triggers the firebase-js-sdk 12.x watch-aggregator
// crash: "INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9)". StrictMode
// only affects dev, so removing it does not change production behaviour.
root.render(<App />);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
