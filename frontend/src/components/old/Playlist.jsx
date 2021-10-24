import React from 'react'
import LibraryPickable from './LibraryPickable';

class PlaylistSong extends React.Component {
    render() {
        return (<div className="songpanel">
            <div>{this.props.title}</div>
            <div>{this.props.author}</div>
            <div>{this.props.start} - {this.props.end}</div>
            <button onClick={this.delete_me}>x</button>
        </div>);
        /*
            idk how to make jsx comments
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
            body: JSON.stringify({id: this.props.id})
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
            adding: false // show window to add song?
        };
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
                        id={i.id}
                        title={i.song.title}
                        author={i.song.author}
                        start={start_date.toISOString()}
                        end={end_date.toISOString()}
                        key={j}
                        done={this.props.done}
                    />
                );
                j++;
            };
        }

        return (
            <div className="breakpanel">
                <div className="breakinfo">
                    <div className="timestamp"> {this.props.start.hour}:{this.props.start.minutes} </div>
                    <div className="breakbutton" onClick={this.showAdding}><span className="material-icons-round" style={{fontSize: "16px"}}>&#xE145;</span></div>
                </div>
                {toRender}
                <div className="timestamp"> {this.props.end.hour}:{this.props.end.minutes} </div>
                {this.state.adding ?
                    <LibraryPickable
                        date={this.props.date}
                        breaknumber={this.props.breaknumber}
                        done={this.addingDone}
                    /> : null}
            </div>);
    }

    addingDone = (err) => {
        this.setState({ adding: false }); // hide library
        this.props.done();
    }

    showAdding = () => {
        this.setState({ adding: true }); // show library
    }
}

class Breaks extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            breaks: [],
            songs: []
        }
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps) {
        if (this.props.date !== prevProps.date)
            this.loadData();
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
                    this.setState({ breaks: JSON.parse(await r_b.text()), songs: JSON.parse(await r_s.text()) })
            });
    }

    render() {
        let toRender = [];
        if (this.state.breaks instanceof Array) {
            let songs = [];
            if (this.state.songs instanceof Array) {
                songs = this.state.songs;
            }
            for (let i = 0; i < this.state.breaks.length; i++) {
                let temp = [];
                // get songs for that break
                while (songs[0] && songs[0].breakNumber === i) {
                    temp.push(songs.shift());
                }
                toRender.push(<Break
                    songs={temp}
                    start={this.state.breaks[i].start}
                    end={this.state.breaks[i].end}
                    breaknumber={i}
                    date={this.props.date}
                    key={i}
                    done={this.loadData}
                />)
            }
        }

        return (
            <div style={{ padding: "0px 10px" }} >{toRender} </div>
        );
    }
}

export default class Playlist extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            date: new Date().toISOString().slice(0, 10)
        }
    }

    addDate = (offset) => {
        return () => {
            let newdate = new Date(this.state.date);
            newdate.setDate(newdate.getDate() + offset);
            this.setState({date: newdate.toISOString().slice(0, 10)});
        }
    }

    render() {
        return (
            <div className="content">
                <div className="header">
                    <input className="datecontainer" type="date" onChange={this.changeDate} value={this.state.date}/>
                    <div className="navcontainer">
                        <button className="navbutton" onClick={this.addDate(-1)}><span className="material-icons-round">&#xE408;</span></button>
                        <button className="navbutton" onClick={this.addDate(1)}><span className="material-icons-round">&#xE409;</span></button>
                    </div>
                </div>
                <div className="divider"></div>
                <Breaks date={this.state.date} />
                <div className="divider"></div>
            </div>
        );
    }

    changeDate = (event) => {
        this.setState({ date: event.target.value });
    }
}
