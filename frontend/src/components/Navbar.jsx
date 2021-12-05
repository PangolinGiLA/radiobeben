import "../css/styles.css";
import Navbutton from "./Navbutton";

const Navbar = () => {
	return (
		<div style={{height: "60px"}}>
			<nav className="navbar">
				<div className="title">Playlista</div>
				<div className="navcontainer">
					<Navbutton to="/suggestions" content={ <span className="material-icons-round">add_comment</span> }/>
					<Navbutton to="/playlist" content={ <span className="material-icons-round">playlist_add_check</span> }/>
					{/* more buttons here */}
				</div>
			</nav>	
		</div>
	);
}
 
export default Navbar;
