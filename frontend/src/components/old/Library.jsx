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
            })
        });
    }

    render() {
        var songjsx
        if (this.props.ytid !== undefined) {
            let link = "https://www.youtube.com/watch?v=" + this.props.ytid;
            songjsx = <a href={link}>{this.props.title}</a>
        } else {
            songjsx = this.props.title
        }
        return (
            <div className='songpanel'>
                <div className="songtitle">
                    <div className='songtitleinner'>
                        {songjsx}
                    </div>
                    <div className='floatright'>
                        {String(Math.floor(this.props.duration / 60))}:{String(this.props.duration % 60).padStart(2, '0')}
                    </div>
                </div>
                <div className='breakinfo'>
                    <div className="songauthor">{this.props.author}</div>
                    <div className='navcontainer'>
                        <button className="smallbutton" onClick={this.play}>
                            <span className="material-icons-round" style={{ fontSize: "16px" }}>play_arrow</span>
                        </button>
                        <button className="smallbutton" onClick={this.delete}>
                            <span className="material-icons-round" style={{ fontSize: "16px" }}>delete</span>
                        </button>
                    </div>

                </div>
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
        maxHeight: "100%",
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
                duration={i.duration}
            />)
        }

        return (<div className='content'>
            <div className='header'></div>
            <div className='formwrapper'>
                <input className='textbox2' placeholder='Szukaj' type="text" name="searchbox" id="library_search" onChange={this.handleTextChange} />
            </div>
            <div className='divider'></div>
            <div className='allsuggestionspanel'>
                <div style={this.scrollstyle} onScroll={this.handleScroll}>{toRender}</div>
            </div>
        </div>
        )
    }
}
