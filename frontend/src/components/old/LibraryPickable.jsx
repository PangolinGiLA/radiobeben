import React from 'react'

class SongPickable extends React.Component {
    render() {
        return (
            <div onClick={this.addToPlaylist} className='songpanel'>
                <div>
                {this.props.title}
                <div className='floatright'>
                {String(Math.floor(this.props.duration/60))}:{String(this.props.duration%60).padStart(2, '0')}
                </div>
                </div>
                <div>
                {this.props.author.displayName}
                </div>
                
                 
            </div>
        )
    }

    addToPlaylist = () => {
        let data = {
            date: this.props.date,
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
        this.loading = false;
        this.searchText = "";
    }

    scrollstyle = {
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
            toRender.push(<SongPickable
                title={i.title}
                author={i.author}
                id={i.id}
                breaknumber={this.props.breaknumber}
                date={this.props.date}
                done={this.props.done}
                duration={i.duration}
                key={i.id}
            />)
        }

        return (
            <div className='popup'>
                <div className='popupheader'>
                    <span className="headertext">Szukaj</span>
                    <button onClick={this.props.close} className="navbutton" style={{marginRight: "0px"}}><span className="material-icons-round">close</span></button>
                </div> 
                <input className="textbox" type="text" name="searchbox" id="library_search" onChange={this.handleTextChange} />
                <div className="divider" style={{width: "100%"}}></div>
                <div className="songselect" style={this.scrollstyle} onScroll={this.handleScroll}>{toRender}</div>
                <div className="divider" style={{width: "100%", border: "none"}}></div>
            </div>
        )
    }
}
