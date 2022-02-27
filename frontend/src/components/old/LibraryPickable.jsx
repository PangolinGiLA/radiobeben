import React from 'react'
import Navbutton from '../Navbutton';

class SongPickable extends React.Component {

    handleKeypress = (e) => {
        let code = e.charCode;
        if (code === 32 || code === 13) { // enter or space
            e.target.click();
        }
    }

    render() {
        return (
            <div onClick={this.addToPlaylist} className='songpanel' tabIndex={0} onKeyPress={this.handleKeypress}>
                <div className="songtitle">
                    <div className='songtitleinner'>
                        {this.props.title}
                    </div>
                    <div className='floatright'>
                        {String(Math.floor(this.props.duration / 60))}:{String(this.props.duration % 60).padStart(2, '0')}
                    </div>
                </div>
                <div className="songauthor">{this.props.author.displayName}</div>
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
                var response = await r.text();
                if (!r.ok) {
                    this.props.sendNotification(JSON.parse(response).error, 8000);
                } else {
                    this.props.sendNotification("Pomyślnie dodano piosenkę do playlisty!", 8000);
                }
                this.props.done(response); // use callback to close the window
            });
    }
}

export default class LibraryPickable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            songs: [],
            order: localStorage.getItem('order') ? localStorage.getItem('order') : "ta"
        }
        this.loading = false;
        this.searchText = "";
    }

    componentDidMount() {
        this.loadData()
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.songs.length !== this.state.songs.length) {
            this.loading = false;
        }
        if (prevState.order !== this.state.order) {
            this.loadData(true);
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
            like: this.searchText,
            order: this.state.order
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
    
    handleOrderChange = (e) => {
        localStorage.setItem("order", e.target.value);
        this.setState({order: e.target.value});
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
                sendNotification={this.props.sendNotification}
            />)
        }

        return (
            <div className="popupcover">
                <div className='popup'>
                    <div className='popupheader'>
                        <span className="headertext">Szukaj</span>
                        <Navbutton onClick={this.props.close} iconid="close" style={{ marginRight: "0px" }} />
                    </div>
                    <div className='formwrapper'>
                        <input className="textbox" type="text" name="searchbox" id="library_search" onChange={this.handleTextChange} />
                        <select name="order" id="order" onChange={this.handleOrderChange} value={this.state.order}>
                            <option value="ta">tytuł rosnąco</option>
                            <option value="td">tytuł malejąco</option>
                            <option value="dd">czas trwania malejąco</option>
                            <option value="da">czas trwania rosnąco</option>
                            <option value="aa">autor rosnąco</option>
                            <option value="ad">autor malejąco</option>
                            <option value="ia">czas dodania rosnąco</option>
                            <option value="id">czas dodania malejąco</option>
                        </select>
                    </div>
                    <div className="divider"></div>
                    <div className="songselect" onScroll={this.handleScroll}>{toRender}</div>
                    <div className="divider" style={{ border: "none" }}></div>
                </div>
            </div>
        )
    }
}
