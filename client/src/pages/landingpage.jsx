import { useEffect } from 'react';
import './landingpage.css';
import Navbar from '../components/navbar';


function Landingpage() {
    useEffect(() => {
    // Agregar clase al body para manejar padding de navbar
    document.body.classList.add('with-navbar');
    return () => {
      document.body.classList.remove('with-navbar');
    };
  }, []);

  return (
    <div className="landingpage">
      <Navbar />
      <h1>Bienvenido a la pagina Inicial</h1>
      <p>Esta es la pagina inicial de la aplicación.</p>
    </div>
  );
}

export default Landingpage;
