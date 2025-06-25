import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import Login from './components/Login';  // Asegúrate de que la ruta sea correcta
import Register from './components/Register';  // Asegúrate de que la ruta sea correcta
import './App.css';  // Importa el archivo CSS


const App = () => {
  return (
    <Router>
      <div>
        <h1>Agendamiento de Citas Médicas</h1>

        {/* Aquí se pueden colocar los enlaces de navegación */}
        <nav>
          <Link to="/login">
            <button>Iniciar Sesión</button>
          </Link>
          <Link to="/register">
            <button>Registrar usuario</button>
          </Link>
        </nav>

        {/* Aquí definimos las rutas */}
        <Switch>
          <Route exact path="/login" component={Login} />
          <Route exact path="/register" component={Register} />
        </Switch>
      </div>
    </Router>
  );
};

export default App;
