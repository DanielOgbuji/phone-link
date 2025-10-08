//import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
//import { ThemeProvider } from "next-themes"
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { Provider } from '../src/components/ui/provider'
import { Toaster } from "../src/components/ui/toaster";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider>
      <App />
      <Toaster />
    </Provider>
  </React.StrictMode>,
)
