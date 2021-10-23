import LoginPage from "./components/old/Login.jsx";
import Suggestions from "./components/old/Suggestion.jsx";
import Breakes from "./components/old/Playlist.jsx"
import BreaksInput from "./components/old/Breaketime.jsx";
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from "./components/Navbar.jsx";
import Playlist from "./components/playlist/Playlist.jsx";
import Weekdays from "./components/old/Schedule.jsx";

const App = () => {

  // testing only
  let tmin = {hour: 8, minutes: 0}
  let tmax = {hour: 8, minutes: 30}
  let now = {hour: 8, minutes: 20}
  let breaktimes = [
    {
      start: {
        hour: 8,
        minutes: 0
      },
      end:{
        hour: 8,
        minutes: 10
      }
    },
    {
      start: {
        hour: 8,
        minutes: 20
      },
      end:{
        hour: 8,
        minutes: 30
      }
    }
  ]
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Switch>
          <Route exact path="/">
            <Playlist/>
          </Route>
          <Route exact path="/old">
            <BreaksInput breaktimes={breaktimes}/>
            <LoginPage />
            <Suggestions />
            <Weekdays/>
          </Route>
          <Route exact path="/old/playlist">
            <Breakes/>
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
 
export default App;
