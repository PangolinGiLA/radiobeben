import { useState, useEffect, useRef } from "react";
import "../css/styles.css";
import Navbutton from "./Navbutton";

const Footer = (props) => {

	const DefaultUpdateInterval = 5e3; // footer update interval - 5 sec
	const DefaultSongName = "nic";
	const DefaultSpeed = 40; // px per sec

	let [title, setTitle] = useState(DefaultSongName);
	let [animation, setAnimation] = useState(0);

	let isMount = useRef(true);
	let footer = useRef(null);
	let floating = useRef(null);
	let cover = useRef(null);

	let get_song = async () => {
		const r = await fetch("/api/playlist/playing");
		if (r.ok) {
			const data = await r.json();
			return data;
		} else {
			return {playing: false, what: {name: DefaultSongName}};
		}

	}

	let stop = async () => {
		const r = await fetch("/api/playlist/stop");
		if (r.ok) {
			//ok
		}
	}

	const updateTitle = async () => {
		let song = await get_song();
		let name = song.playing ? song.what.title : DefaultSongName;
		setTitle(name);
	}

	const restartAnimation = () => {
		setAnimation(0);
		updateAnimation();
	}

	const updateAnimation = () => {
		const footerWidth = footer.current.offsetWidth - cover.current.offsetWidth - 20;
		const offscreenWidth = Math.abs(footerWidth - floating.current.offsetWidth);
		const speed = (offscreenWidth / DefaultSpeed).toString() + "s"; // const floating speed

		floating.current.style.animation = null;
		void floating.current.offsetWidth; // hack to reset animation

		if (offscreenWidth > 0) { // if title does not fit on screen
			const root = document.querySelector(':root');
			root.style.setProperty("--tx", "-" + offscreenWidth.toString() + "px");

			if (animation === 0) {
				floating.current.style.animation = `move ${speed} linear 1s normal 1 running forwards`;
				floating.current.onanimationend = () => setAnimation(animation === 1 ? 0 : 1);
			}
			else if (animation === 1) {
				floating.current.style.animation = `wait 1s linear 0s normal 1 running`;
				floating.current.onanimationend = () => setAnimation(animation === 1 ? 0 : 1);
			}
		}
		else {
			setAnimation(0);
			floating.current.style.animation = `move ${speed} linear 1s normal 1 paused forwards`;
		}
	}

	useEffect(() => {
		// side effects
		const asyncWrapper = async () => {
			if (isMount.current) {
				isMount.current = false;
				// did mount
				await updateTitle();
				document.querySelector(':root').style.setProperty("--tx", "0px");
				window.addEventListener('resize', restartAnimation);
				let interval = setInterval(() => updateTitle(), DefaultUpdateInterval);


				return () => {
					// will unmount
					window.removeEventListener('resize', restartAnimation);
					clearInterval(interval);
				}
			}
			else {
				// did update
				updateAnimation();
			}
		}; asyncWrapper();
	});

	return (
		<div style={{ height: "50px" }}>
			<nav className="footer" ref={footer} style={{ justifyContent: "none" }}>
				<div className="cover" ref={cover}> { /* all footer features should go inside this */ }
					
					{ props.admin ? /* only admin */
						<div className="navcontainer">
							<Navbutton to="/addsong" iconid="library_add" style={{marginLeft: "10px", marginRight: "0px"}}/>
							<Navbutton onClick={stop} iconid="pause" style={{marginLeft: "10px", marginRight: "0px"}}/>
						</div>
					: null }

					<div className="title">Teraz gra:</div>
				</div>
				<div className="floatingtitle" ref={floating}>
					<span style={{ textAlign: "left" }}>{ title }</span>
				</div>
			</nav>
		</div>
	);
}

export default Footer;
