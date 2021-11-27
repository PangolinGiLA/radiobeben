import React from 'react'

class Song extends React.Component {
    render() {
        return (
            <div>
               <a href="">{this.props.title}</a> {this.props.author} <button>usuń</button> <button>play</button>
            </div>
        )
    }

}

export default class Library extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            songs: []
        }
        this.loading = false;
        this.searchText = "";
    }

    scrollstyle = {
        height: "10px",
        overflowY: "scroll"
    }

    componentDidMount() {
        this.loadData()
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.songs.length !== this.state.songs.length) {
            this.loading = false;
        }
    }

    loadData = (clear) => {
        this.loading = true;
        let new_songs = [];
        if (clear)
            new_songs = [];
        else
            new_songs = this.state.songs;
        fetch('/api/songs/library?' + new URLSearchParams({
            limit: 2,
            before: new_songs.length,
            like: this.searchText
        }))
            .then(async r => {
                if (r.ok) {
                    new_songs = new_songs.concat(JSON.parse(await r.text()));
                    this.setState({ songs: new_songs });
                }
            });
    }

    handleScroll = (e) => {
        if (e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight) > 0.95) {
            if (!this.loading) {
                this.loadData();
            }
        }
    }

    handleTextChange = (e) => {
        if (e.target.value !== this.searchText) {
            this.searchText = e.target.value;
            this.loadData(true);
        }
    }

    render() {
        let toRender = []
        for (let i of this.state.songs) {
            toRender.push(<SongPickable
                title={i.title}
                author={i.author}
                id={i.id}
                breaknumber={this.props.breaknumber}
                date={this.props.date}
                done={this.props.done}
                key={i.id}
            />)
        }

        return (
            <div>
                <input type="text" name="searchbox" id="library_search" onChange={this.handleTextChange} />
                <div style={this.scrollstyle} onScroll={this.handleScroll}>{toRender}</div>
            </div>
        )
    }
}
