const Navbutton = (props) => {

	const doAlert = () => {
		alert("This is just a template element to show some styles")
	}

	return (
		<button className="navbutton" onClick={doAlert}>{props.content}</button>
	);
}
 
export default Navbutton;
