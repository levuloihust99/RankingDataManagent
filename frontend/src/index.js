import * as React from "react";
import { createRoot } from "react-dom/client";
import ReactDOM from 'react-dom/client';
import './index.css';
import 'semantic-ui-css/semantic.css'
import { App } from "./App"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  // <RouterProvider router={router} />
  <App />
)

// createRoot(document.getElementById("root")).render(
//   <RouterProvider router={router} />
// );

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

