
const Section = (props) => {
	return ( 
		<div style={{ padding: "0px 10px"}}>
			<div className="breakpanel">
				<div className="breakinfo">
					<div className="timestamp">{props.timestamp}</div>
					<button className="breakbutton">+</button>
				</div>
				<div className="songpanel">
					<div>SciCraft Blitz Day 13: Flower Farm / Breeding Cats / Trenches</div>
					<div>Ilmango</div>
				</div>
				<div className="songpanel">
					<div>SciCraft Blitz Day 13: Flower Farm / Breeding Cats / Trenches</div>
					<div>Ilmango</div>
				</div>
				<div className="songpanel">
					<div>SciCraft Blitz Day 13: Flower Farm / Breeding Cats / Trenches</div>
					<div>Ilmango</div>
				</div>
			</div>
		</div>
	);
}
 
export default Section;
