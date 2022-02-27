import React from 'react'
import { SuggestionPopup } from './Suggestion';

class Song extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editing: false
        }
    }

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

    handleSubmitEdit = async (event) => {
        event.preventDefault();
        if (event.target.name.value && event.target.author.value) {
            const data = {
                id: this.props.id,
                name: event.target.name.value,
                author: event.target.author.value,
                isPrivate: event.target.private.checked,
                globalAuthor: !event.target.onlyone.checked
            };
            const r = await fetch('/api/songs/library', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (r.ok) {
                this.edit();
                this.props.refresh(true);
            } else {
                this.props.sendNotification(await r.text(), 8000);
            }
        }
    }

    edit = () => {
        this.setState({ editing: !this.state.editing });
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
            <div className='songpanelnohover'>
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
                        <button className="smallbutton" onClick={this.edit}>
                            <span className="material-icons-round" style={{ fontSize: "16px" }}>settings</span>
                        </button>
                        <button className="smallbutton" onClick={this.delete}>
                            <span className="material-icons-round" style={{ fontSize: "16px" }}>delete</span>
                        </button>
                    </div>

                </div>
                {this.state.editing ?
                <div className='padding-top'>
                    <SuggestionPopup
                        buttontext={'Edytuj'}
                        handleSubmit={this.handleSubmitEdit}
                        edit={true}
                        private={this.props.private}
                        id={this.props.id}
                        name={this.props.title}
                        author={this.props.author}
                        sendNotification={this.props.sendNotification}
                    />
                </div> : null }
            </div>
        )
    }

}

export default class Library extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            songs: [],
            order: localStorage.getItem('order') ? localStorage.getItem('order') : "ta"
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
            toRender.push(<Song
                sendNotification={this.props.sendNotification}
                private={i.isPrivate}
                title={i.title}
                author={i.author.displayName}
                ytid={i.ytid}
                id={i.id}
                refresh={this.loadData}
                key={i.id}
                duration={i.duration}
            />)
        }

        return (<div className='content'>
            <div className='header'></div>
            <div className='formwrapper'>
                <input className='textbox2' placeholder='Szukaj' type="text" name="searchbox" id="library_search" onChange={this.handleTextChange} />
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
            <div className='divider'></div>
            <div className='allsuggestionspanel'>
                <div style={this.scrollstyle} onScroll={this.handleScroll}>{toRender}</div>
            </div>
        </div>
        )
    }
}
