import './landingpage.css';
import Navbar from '../components/navbar';

function Landingpage() {
  return (
    <div className="landingpage">
      <Navbar />
      <h1>Bienvenido a la pagina Inicial</h1>
      <p>Esta es la pagina inicial de la aplicación.</p>
    </div>
  );
}

export default Landingpage;
