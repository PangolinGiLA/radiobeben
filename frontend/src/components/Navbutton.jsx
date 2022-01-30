import { Link } from "react-router-dom";

const Navbutton = (props) => {

	return (
	<> {  (props.to) ?
		<Link to={props.to} className="navbutton" {...props}>
			<span className="material-icons-round">{props.iconid}</span>
		</Link>
		:
		<button className="navbutton" {...props}>
			<span className="material-icons-round">{props.iconid}</span>
		</button>
	} </>
	);
}

export default Navbutton;
