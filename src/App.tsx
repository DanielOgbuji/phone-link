import React from 'react';
//import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import MobileTransfer from './components/MobileTransfer';
import { Toaster } from './components/ui/toaster';

//const system = createSystem(defaultConfig);

export default function App() {
  return (
    <>
      <MobileTransfer />
      <Toaster />
    </>
  );
}
