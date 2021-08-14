import React from 'react'

class SongPickable extends React.Component {
    render() {
        return (
            <div onClick={this.addToPlaylist}>
                {this.props.title} {this.props.author} play remove
            </div>
        )
    }

    addToPlaylist = () => {
        let data = {
            date: new Date(), // need to change that later
            breaknumber: this.props.breaknumber,
            songid: this.props.id
        }
        fetch('/api/playlist/playlist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
            .then(async r => {
                this.props.done(await r.text()); // use callback to close the window
            });
    }
}

export default class LibraryPickable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            songs: []
        }
        fetch('/api/songs/library', {
            method: 'GET'
        })
            .then(async r => {
                this.setState({ songs: JSON.parse(await r.text()) });
            });
    }
    // TODO: add search
    render() {
        let toRender = []
        let j = 0;
        for (let i of this.state.songs) {
            toRender.push(<SongPickable
                title={i.title}
                author={i.author}
                id={i.id}
                breaknumber={this.props.breaknumber}
                done={this.props.done}
                key={j}
                />)
            j++;
        }

        return (
            <div>
                {toRender}
            </div>
        )
    }
}