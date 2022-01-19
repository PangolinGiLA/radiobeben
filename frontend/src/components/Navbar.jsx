import "../css/styles.css";
import Navbutton from "./Navbutton";
import { withRouter } from "react-router-dom";

const Navbar = (props) => {

	const address_map = {
		"/library": "Biblioteka",
		"/suggestions": "Sugerowanie",
		"/playlist": "Playlista",
		"/old": "Śmieci Administratora"
	}

	return (
		<div style={{height: "60px"}}>
			<nav className="navbar">
				<div className="title">{address_map[props.location.pathname]}</div>
				<div className="navcontainer">
					<Navbutton to="/suggestions" content={ <span className="material-icons-round">add_comment</span> }/>
					<Navbutton to="/playlist" content={ <span className="material-icons-round">playlist_add_check</span> }/>
					{props.admin ?
					<Navbutton to="/library" content={ <span className="material-icons-round">library_books</span> }/> : null }
					{/* more buttons here */}
				</div>
			</nav>	
		</div>
	);
}
 
export default withRouter(Navbar);
