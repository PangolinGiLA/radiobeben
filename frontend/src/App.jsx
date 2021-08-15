import LoginPage from "./components/old/Login.jsx";
import Suggestions from "./components/old/Suggestion.jsx";
import Breakes from "./components/old/Playlist.jsx"

import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from "./components/Navbar.jsx";
import Playlist from "./components/playlist/Playlist.jsx";

const App = () => {

  return (
    <Router>
      <div className="App">
        <Navbar />
        <Switch>
          <Route exact path="/">
            <Playlist/>
          </Route>
          <Route exact path="/old">
            <LoginPage />
            <Suggestions />
            <Breakes />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
 
export default App;
