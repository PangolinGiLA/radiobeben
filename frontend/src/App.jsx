import LoginPage from "./components/old/Login.jsx";
import Suggestions from "./components/old/Suggestion.jsx";
import Breakes from "./components/old/Playlist.jsx"
import BreaksInput from "./components/old/Breaketime.jsx";
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Navbar from "./components/Navbar.jsx";
import Playlist from "./components/playlist/Playlist.jsx";
import Weekdays from "./components/old/Schedule.jsx";
import Footer from "./components/Footer.jsx";
import React from "react";
import Logout from "./components/old/Logout.jsx";
import Amp from "./components/old/Amp.jsx";

export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			permissions: 0
		}
	}

	componentDidMount() {
		this.get_permissions();
	}

	permissions =  {
		suggestions: 0,
		playlist: 1,
		schedule: 2,
		amp: 3,
		library: 4,
		users: 5
	}

	can = (what, permissions) => {
		return Boolean(permissions & (1 << what));
	}

	get_permissions = async () => {
		const r = await fetch("/api/users/permissions");
		if (r.ok) {
			const permissions = JSON.parse(await r.text());
			this.setState({ permissions: permissions.permissions });
		} else {
			this.setState({ permissions: 0 });
		}
	}

	loggedIn = () => {
		this.get_permissions();
	}

	loggedOut = () => {
		this.setState({permissions: 0});
	}

	playTest = () => {
		fetch("/api/playlist/play", {
			method: "PUT",
			headers: {
                'Content-Type': 'application/json'
            },
			body: JSON.stringify({
				id: 3
			})});
	}

	render() {
		return (
			<Router>
				<div className="App">
					<Navbar />
					<Switch>
						<Route exact path="/">
							<Playlist />
						</Route>
						<Route exact path="/old">
							{this.can(this.permissions.schedule, this.state.permissions) ? <BreaksInput breaktimes={[]} admin={this.state.admin} /> : null }
							{this.state.permissions ? <Logout logout={this.loggedOut}/> : <LoginPage loggedIn={this.loggedIn} /> }
							{this.can(this.permissions.schedule, this.state.permissions) ? <Weekdays /> : null}
							{this.can(this.permissions.amp, this.state.permissions) ? <Amp/> : null}
							<button onClick={this.playTest}>Play Test</button>
						</Route>
						<Route exact path="/playlist">
							<Breakes admin={this.can(this.permissions.playlist, this.state.permissions)}/>
						</Route>
						<Route exact path="/suggestions">
							<Suggestions admin={this.can(this.permissions.suggestions, this.state.permissions)} />
						</Route>
					</Switch>
					<Footer />
				</div>
			</Router>
		);
	}
}

