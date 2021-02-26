import { StrictMode } from 'react';
import ReactDOM from 'react-dom';
import './base.css';
import './index.css';
import './class-file-parser.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <StrictMode>
    <App />
  </StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
