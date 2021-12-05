import { Link } from "react-router-dom";

const Navbutton = (props) => {

	const doAlert = () => {
		alert("This is just a template element to show some styles")
	}

	return (
		<Link to={props.to} className="navbutton">{props.content}</Link>
	);
}
 
export default Navbutton;
