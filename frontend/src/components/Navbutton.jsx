import { Link } from "react-router-dom";

const Navbutton = (props) => {

	return (
	<> {  (props.to) ?
		<Link to={props.to} className="navbutton" {...props}>
			<span className="material-icons-round">{props.iconid}</span>
		</Link>
		:
		<button className={props.small ? "smallbutton" : "navbutton"} {...props}>
			<span className="material-icons-round" style={props.small ? { fontSize: "16px" } : null}>{props.iconid}</span>
		</button>
	} </>
	);
}

export default Navbutton;
