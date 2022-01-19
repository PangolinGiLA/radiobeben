import { useState, useEffect, useRef } from "react";
import "../css/styles.css";

const Footer = (props) => {

	let [speed, setSpeed] = useState("10s");
	let [animation, setAnimation] = useState(0);

	let footer = useRef(null);
	let title = useRef(null);
	let floating = useRef(null);
	let cover = useRef(null);
	let isMount = useRef(true);

	const DefaultUpdateInterval = 5e3; // footer update interval - 5 sec
	const DefaultSongName = "nic";
	const DefaultSpeed = 40; // px per sec

	let get_song = async () => {
		const r = await fetch("/api/playlist/playing");
		const data = await r.json();
		return data;
	}

	let stop = async () => {
		const r = await fetch("/api/playlist/stop");
		if (r.ok) {
			//ok
		}
	}

	useEffect(() => {

		const restartAnimation = () => {
			setAnimation(0);
			updateAnimation();
		}

		const updateAnimation = () => {
			const footerWidth = footer.current.offsetWidth - cover.current.offsetWidth - 20;
			const offscreenWidth = footerWidth - floating.current.offsetWidth;

			if (floating.current.offsetWidth > footerWidth) {
				const root = document.querySelector(':root');
				root.style.setProperty("--tx", offscreenWidth.toString() + "px");
				setSpeed(Math.abs(offscreenWidth / DefaultSpeed).toString() + "s"); // const floating speed

				floating.current.style.animation = null;
				void floating.current.offsetWidth; // hack to reset animation

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
				floating.current.style.animation = null;
				void floating.current.offsetWidth; // hack to reset animation
				floating.current.style.animation = `move ${speed} linear 1s normal 1 paused forwards`;
			}
		}

		const updateTitle = async () => {
			let data = await get_song(); // fetch
			let newTitle = data.playing ? data.what.title : DefaultSongName;
			if (title.current.innerHTML !== newTitle) {
				title.current.innerHTML = newTitle;
				restartAnimation();
			}
		}

		// side effects
		const asyncWrapper = async () => {
			if (isMount.current) {
				isMount.current = false;
				// did mount
				document.querySelector(':root').style.setProperty("--tx", "0px");
				await updateTitle();
				window.addEventListener('resize', restartAnimation);
				let interval = setInterval(() => updateTitle(), DefaultUpdateInterval);

				return () => {
					// will unmount
					clearInterval(interval)
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
			<nav className="footer" style={{ justifyContent: "none" }} ref={footer}>
				{props.admin ? <div className="navcontainer">
					<button onClick={stop} className="controlbutton material-icons-round">library_add</button>
					<button onClick={stop} className="controlbutton material-icons-round">pause</button>
				</div> : null}

				<div className="cover" ref={cover}><div className="title">Teraz gra:</div></div>
				<div className="floatingtitle" ref={floating}>
					<span ref={title} style={{ textAlign: "left" }} >{ /* title will be here */}</span>
				</div>
			</nav>
		</div>
	);
}

export default Footer;
