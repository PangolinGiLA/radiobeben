import React from 'react'

class Song extends React.Component {
    delete = () => {
        fetch('/api/songs/song', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: this.props.id
            })
        })
            .then(async r => {
                if (r.ok) {
                    this.props.refresh(true);
                }
            })
    }

	play = () => {
		fetch("/api/playlist/play", {
			method: "PUT",
			headers: {
                'Content-Type': 'application/json'
            },
			body: JSON.stringify({
				id: this.props.id
			})});
	}
    
    render() {
        if (this.props.ytid !== undefined)
        {
            let link = "https://www.youtube.com/watch?v=" + this.props.ytid;
            var songjsx = <div><a href={link}>{this.props.title}</a> {this.props.author} <button onClick={this.delete}>usuń</button> <button onClick={this.play}>play</button></div>
        } else {
            var songjsx = <div>{this.props.title} {this.props.author} <button onClick={this.delete}>usuń</button> <button onClick={this.play}>play</button> </div>
        }
        return songjsx;
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
        height: "200px",
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
            limit: 20,
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
            toRender.push(<Song
                title={i.title}
                author={i.author.displayName}
                ytid={i.ytid}
                id={i.id}
                refresh={this.props.loadData}
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
