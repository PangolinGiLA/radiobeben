import React from 'react'

class PlaylistSong extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: props.title,
            author: props.author,
            start: props.start,
            end: props.end
        };
    }
    render() {
        return (<div>
            {this.state.title}
            <br />
            {this.state.author}
            <br />
            {this.state.start}
            <br />
            {this.state.end}
            <br />
        </div>);
    }

    delete_me() {
        // TODO
    }
}

class Break extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            songs: props.songs, // this is an array
            start: props.start, // this is an object with hour and minutes
            end: props.end // same as above
        };
    }
    render() {
        let toRender = [];
        // is playlist fetched from server?
        if (this.state.songs instanceof Array) {
            let j = 0;
            for (let i of this.state.songs) {
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
                {this.state.start.hour}:{this.state.start.minutes}
                <br />
                {toRender}
                <br />
                {this.state.end.hour}:{this.state.end.minutes}
            </div>);
            // TODO: add song to playlist button
    }
}

export default class Breaks extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            breaks: [],
            songs: []
        }
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
        let toRender = []
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
                    key={i}
                />)
            }
        }

        return (
            <div>
                {toRender}
            </div>);
    }
}