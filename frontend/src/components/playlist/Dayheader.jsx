import Navbutton from "../Navbutton";

const Dayheader = () => {

	// stylized date
	const date = new Date().toLocaleDateString(undefined, { weekday: 'long' }) 
	+ " " + new Date().toLocaleDateString();

	return (  
		<div className="header">
			<div className="datecontainer"> { date } </div>
			<div className="navcontainer">
				<Navbutton content="<"/>
				<Navbutton content=">"/>
			</div>
		</div>
	);
}
 
export default Dayheader;