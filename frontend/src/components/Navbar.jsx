import "../css/styles.css";
import Navbutton from "./Navbutton";

const Navbar = () => {
	return (
		<div style={{height: "60px"}}>
			<nav className="navbar">
				<div className="title">Playlista</div>
				<div className="navcontainer">
					<Navbutton content={ <span className="material-icons-round">&#xE88A;</span> }/>
					{/* more buttons here */}
				</div>
			</nav>	
		</div>
	);
}
 
export default Navbar;
