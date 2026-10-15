import Boot from "./components/Boot.jsx";
import Reticle from "./components/Reticle.jsx";
import Nav from "./components/Nav.jsx";
import Hero from "./components/Hero.jsx";
import Statement from "./components/Statement.jsx";
import Conveyor from "./components/Conveyor.jsx";
import ShiftLog from "./components/ShiftLog.jsx";
import Paper from "./components/Paper.jsx";
import Record from "./components/Record.jsx";
import PartsBin from "./components/PartsBin.jsx";
import CertScanner from "./components/CertScanner.jsx";
import Contact from "./components/Contact.jsx";

export default function App() {
  return (
    <>
      <Boot />
      <Reticle />
      <Nav />
      <main>
        <Hero />
        <Statement />
        <Conveyor />
        <ShiftLog />
        <Paper />
        <Record />
        <PartsBin />
        <CertScanner />
        <Contact />
      </main>
    </>
  );
}
