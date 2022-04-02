import React from 'react'
import Navbutton from '../Navbutton';
import LibraryPickable from './LibraryPickable';

class PlaylistSong extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            admin: props.admin
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.admin !== this.props.admin) {
            this.setState({ admin: this.props.admin });
        }
    }

    render() {
        return (<div className="songpanel">
            <div className="songtime">{ this.props.end }</div>
            <div className="songtitle">{ this.props.title }</div>
            <div className='breakinfo'>
                <div className='songauthor'>{ this.props.author.displayName }</div>
                { this.state.admin ? /* only admin */
                    <button className="removebutton" onClick={ this.delete_me }>
                        <span className="material-icons-round" style={{ fontSize: "16px" }}>close</span>
                    </button>
                : null }
            </div>
        </div>);
        /*
            {this.props.start}
            <br />
            {this.props.end}
            <br />
        */
    }

    delete_me = () => {
        fetch('/api/playlist/playlist', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: this.props.id })
        }).then(r => {
            if (r.ok) {
                this.props.done();
                // refresh playlist
            } else {
                console.log("failed")
            }
        });
    }
}

class Break extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            adding: false, // show window to add song?
            admin: props.admin
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.admin !== this.props.admin) {
            this.setState({ admin: this.props.admin });
        }
    }

    render() {
        let toRender = [];
        // is playlist fetched from server?
        if (this.props.songs instanceof Array) {
            let j = 0;
            for (let i of this.props.songs) {
                let start_date = new Date(i.estTime);
                let end_date = new Date(i.estTime); // idk how to make a copy
                end_date.setSeconds(start_date.getSeconds() + i.song.duration);
                toRender.push(
                    <PlaylistSong
                        admin={this.state.admin}
                        id={i.id}
                        title={i.song.title}
                        author={i.song.author}
                        start={this.formated_time(start_date)}
                        end={this.formated_time(end_date)}
                        key={j}
                        done={this.props.done}
                    />
                );
                j++;
            };
        }

        return (
            <div className="breakpanel" style={ this.props.popup ? {visibility: 'hidden'} : null}>
                <div className="breakinfo">
                    <div className="timestamp">{ String(this.props.start.hour).padStart(2, "0")}:{String(this.props.start.minutes).padStart(2, "0") }</div>
                </div>
                { toRender }
                <div className="breakinfo">
                    <div className="timestampbot">{ String(this.props.end.hour).padStart(2, "0")}:{String(this.props.end.minutes).padStart(2, "0") }</div>
                    <button className="breakbutton" onClick={this.showAdding}><span className="material-icons-round" style={{ fontSize: "16px" }}>add</span></button>
                </div>
            </div>);
    }

    showAdding = () => {
        this.props.openPopup(this.props.breaknumber)
    }

    formated_time = (date) => {
        let h = String(date.getHours()).padStart(2, "0");
        let m = String(date.getMinutes()).padStart(2, "0");
        let s = String(date.getSeconds()).padStart(2, "0");
        return `${h}:${m}:${s}`;
    }
}

class Breaks extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            breaks: [],
            songs: [],
            admin: props.admin,
            popup: false,
            popup_break: 0,
        }
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.date !== prevProps.date)
            this.loadData();

        if (prevProps.admin !== this.props.admin) {
            this.setState({ admin: this.props.admin });
        }

    }

    loadData = () => {
        fetch('/api/playlist/schedule?' + new URLSearchParams({
            date: this.props.date
        }))
            .then(async r_b => {
                let r_s = await fetch('/api/playlist/playlist?' + new URLSearchParams({
                    date: this.props.date
                }));
                if (r_b.ok && r_s.ok)
                    this.setState({ breaks: JSON.parse(await r_b.text()), songs: JSON.parse(await r_s.text()), popup: false });
            });
        this.closePopup();
    }

    openPopup = (break_numer) => {
        this.setState({ popup: true, popup_break: break_numer });
        this.props.popup(true);
    }

    closePopup = () => {
        this.setState({ popup: false });
        this.props.popup(false);
    }

    render() {
        let toRender = [];
        if (this.state.breaks instanceof Array) {
            let songs = [];
            if (this.state.songs instanceof Array) {
                songs = [...this.state.songs];
            }
            songs.sort((a, b) => { return a.breakNumber - b.breakNumber });
            for (let i = 0; i < this.state.breaks.length; i++) {
                let temp = [];
                // get songs for that break
                while (songs[0] && songs[0].breakNumber === i) {
                    temp.push(songs.shift());
                }
                toRender.push(<Break
                    admin={this.state.admin}
                    songs={temp}
                    start={this.state.breaks[i].start}
                    end={this.state.breaks[i].end}
                    breaknumber={i}
                    date={this.props.date}
                    key={i}
                    done={this.loadData}
                    popup={this.state.popup}
                    openPopup={this.openPopup}
                />)
            }
        }

        return (
            <div style={{ padding: "0px 10px", position: "relative" }} >
                { this.state.popup ? 
                    <LibraryPickable
                        close={this.closePopup}
                        date={this.props.date}
                        breaknumber={this.state.popup_break}
                        done={this.loadData}
                        sendNotification={this.props.sendNotification}
                    />
                : null }
                { toRender }
            </div>
        );
    }
}

export default class Playlist extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            date: this.SQLdate(new Date()),
            admin: props.admin,
            popup: false
        }
        this.dateinput = React.createRef();
        this.daystring = React.createRef();
        this.container = React.createRef();
    }

    setPopupState = (newState) => {
        this.setState({popup : newState});
    }

    updateDayString = () => {
        // I tried to support small screens like 360px width samsungs and xiaomis
        // if sliced name look stupid you can just change it to render empty string
        if (this.dateinput.current.valueAsDate) {
            let name = this.dateinput.current.valueAsDate.toLocaleDateString(undefined, { weekday: 'long' });
            this.daystring.current.innerHTML = (this.container.current.offsetWidth < 380) ? name.slice(0, 3) + "." : name;
        }
        else { // if no day selected in input
            this.daystring.current.innerHTML = "";
        }
    }

    componentDidMount() {
        window.addEventListener("resize", this.updateDayString);
        this.updateDayString(this);
    }

    componentWillUnmount(){
        window.removeEventListener("resize", this.updateDayString);
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.admin !== this.props.admin) {
            this.setState({ admin: this.props.admin });
        }
        this.updateDayString(this);
    }

    addDate = (offset) => {
        return () => {
            let newdate = new Date(this.state.date);
            newdate.setDate(newdate.getDate() + offset);
            this.setState({ date: this.SQLdate(newdate) });
        }
    }
    SQLdate = (date) => {
        let y = String(date.getFullYear());
        let m = String(date.getMonth() + 1).padStart(2, "0");
        let d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`
    }

    setDefaultDate = () => {
        this.setState({ date: this.SQLdate(new Date()) });
    }

    render() {
        return (
            <div className="content">
                <div className="header" ref={this.container} style={ this.state.popup ? {visibility: 'hidden'} : null}>
                    <div className="datecontainer">
                        <input className="dateinput" ref={this.dateinput} type="date" onChange={this.changeDate} value={this.state.date} />
                        <span ref={this.daystring}>{/* Monday */}</span>
                    </div>
                    <div className="navcontainer">
                        <Navbutton onClick={this.addDate(-1)} iconid="navigate_before"/>
                        <Navbutton onClick={this.addDate(1)} iconid="navigate_next"/>
                    </div>
                </div>
                <div className="divider"></div>
                <Breaks sendNotification={this.props.sendNotification} date={this.state.date} admin={this.state.admin} popup={this.setPopupState} />
                <div className="divider"></div>
            </div>
        );
    }

    changeDate = (event) => {
        if (event.target.value === "") {this.setDefaultDate(); }
        else { this.setState({ date: event.target.value }); }
    }
}
