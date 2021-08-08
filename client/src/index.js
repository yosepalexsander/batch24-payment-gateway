import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import "./index.css";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import { UserContextProvider } from "./context/userContext";

// favicon
import Favicon from "./assets/DumbMerch.png";
const favicon = document.getElementById("idFavicon");
favicon.setAttribute("href", Favicon);

// Init Client
const client = new QueryClient();

ReactDOM.render(
  <React.StrictMode>
    <UserContextProvider>
      <QueryClientProvider client={client}>
        <Router>
          <App />
        </Router>
      </QueryClientProvider>
    </UserContextProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
