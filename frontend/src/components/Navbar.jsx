import "../css/styles.css";
import Navbutton from "./Navbutton";

const Navbar = () => {
	return (
		<div style={{height: "60px"}}>
			<nav className="navbar">
				<div className="title">Playlista</div>
				<div className="navcontainer">
					<Navbutton content="A"/>
					<Navbutton content="B"/>
					<Navbutton content="C"/>
				</div>
			</nav>	
		</div>
	);
}
 
export default Navbar;
