import { useState, useEffect, useRef } from "react";
import "../css/styles.css";

const Footer = () => {

	let [animate, setAnimate] = useState("paused");
	let title = useRef(null);

	let get_song = async () => {
		const r = await fetch("/api/playlist/playling");
		const data = await r.json();
		console.log(data);
		// data.playing
		// data.progress
		// data.what.title
		// and more
		// just call this function from time to time
		// to get the current song
		// and update the progress bar as you wish
	}

	let stop = async () => {
		const r = await fetch("/api/playlist/stop");
		if (r.ok) {
			//ok
		}
	}

	// if not enough space to fit text it will float from right to left (check in dev tools with mobile view)
	// listen to current song change as well once it's implemented
	useEffect(() => {
		
		const setAnimation = () => {

			console.log(title.current.offsetWidth, window.innerWidth - 130);

			if (title.current.offsetWidth > window.innerWidth - 130) {
				setAnimate("running");
			}
			else {
				title.current.style.animation = null;
				void title.current.offsetWidth; // magic spell to reset animation
				title.current.style.animation = "move 10s linear 1s normal infinite";
				setAnimate("paused");
			}
			title.current.style.animationPlayState = animate;
		}

		setAnimation();
		window.addEventListener('resize', setAnimation);
	});

	return (
		<div style={{height: "50px"}}>
			<nav className="footer" style={{justifyContent: "none"}}>
				<div className="cover"><div className="title">Teraz gra:</div></div>
				<div className="floatingtitle" style={{animation: "move 10s linear 0s normal infinite"}} ref={title}>
					{ "Wiz Khalifa - See You Again ft. Charlie Puth [Official Video] Furious 7 Soundtrack." }
				</div>
			</nav>	
		</div>
	);
}
 
export default Footer;
