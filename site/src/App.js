import React from 'react';
import { ThemeProvider } from './ThemeContext';
import NavBar from './sections/NavBar';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Formats from './sections/Formats';

import Download from './sections/Download';
import OpenSource from './sections/OpenSource';
import Footer from './sections/Footer';

export default function App() {
  return (
    <ThemeProvider>
      <NavBar />
      <Hero />
      <Features />
      <Formats />

      <Download />
      <OpenSource />
      <Footer />
    </ThemeProvider>
  );
}
