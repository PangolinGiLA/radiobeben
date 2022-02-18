import "../css/styles.css";
import Navbutton from "./Navbutton";
import { withRouter } from "react-router-dom";
import { useEffect, useState } from "react";

const Navbar = (props) => {

	const [notification, setNotification] = useState("");

	useEffect(() => {
		setNotification(props.notification);
	}, [props.notification]);

	const address_map = {
		"/library": "Biblioteka",
		"/suggestions": "Sugerowanie",
		"/playlist": "Playlista",
		"/old": "Śmieci Administratora",
		"/addsong": "Dodaj piosenkę",
		"/users": "Użytkownicy"
	}

	return (
		<div style={{height: "60px"}}>
			<nav className="navbar">
				<div className="title">{ address_map[props.location.pathname] }</div>
				{ (notification !== "") ? /* show only when there is a notification */
					/* TODO move this or make mobile friendly */
					<div className="notification">{ notification }</div>
				: null }
				<div className="navcontainer">
					<Navbutton to="/suggestions" iconid="add_comment"/>
					<Navbutton to="/playlist" iconid="playlist_add_check"/>
					{ props.admin ? /* only admin */
						<Navbutton to="/library" iconid="library_books"/>
					: null }
				</div>
			</nav>	
		</div>
	);
}
 
export default withRouter(Navbar);
