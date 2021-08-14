import React from 'react'
import LibraryPickable from './LibraryPickable';

class PlaylistSong extends React.Component {
    render() {
        return (<div>
            {this.props.title}
            <br />
            {this.props.author}
            <br />
        </div>);
        /*
            idk how to make jsx comments
            {this.props.start}
            <br />
            {this.props.end}
            <br />
        */
    }

    delete_me() {
        // TODO
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
                        title={i.song.title}
                        author={i.song.author}
                        start={start_date.toISOString()}
                        end={end_date.toISOString()}
                        key={j}
                    />
                );
                j++;
            };
        }

        return (
            <div>
                {this.props.start.hour}:{this.props.start.minutes}
                <br />
                {toRender}
                <br />
                {this.props.end.hour}:{this.props.end.minutes}
                <button onClick={this.showAdding}>dodaj</button>
                {this.state.adding ? <LibraryPickable breaknumber={this.props.breaknumber} done={this.addingDone} /> : null}
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

export default class Breaks extends React.Component {
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

    loadData = () => {
        fetch('/api/playlist/schedule', {
            method: 'GET'
        })
            .then(async r_b => {
                let r_s = await fetch('/api/playlist/playlist', {
                    method: 'GET'
                });
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
                    key={i}
                    done={this.loadData}
                />)
            }
        }

        return (
            <div>
                {toRender}
            </div>);
    }
}