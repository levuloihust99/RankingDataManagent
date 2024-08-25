import * as React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from 'react-router-dom'
import ReactDOM from 'react-dom/client';
import './index.css';
import './common.css'
import 'semantic-ui-css/semantic.css'
import { router } from "./router";

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <RouterProvider router={router} />
)
