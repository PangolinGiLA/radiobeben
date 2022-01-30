import React from "react";
import { AuthorsPickable } from "./Suggestion";
import * as ytdl from "ytdl-core"
import { withRouter } from "react-router-dom";
import Navbutton from "../Navbutton";

class AddSong extends React.Component {
    render() {
        return (<div className="content">
            <AddSongPopup sendNotification={this.props.sendNotification} back={this.props.history.goBack}/>
        </div>)
    }
}

class AddSongPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: ""
        };
    }

    handleChange = (event) => {
        const link = event.target.value;
        if (link.length === 0) {
            this.setState({ error: "Podaj link!" });
        } else if (!ytdl.validateURL(link)) {
            this.setState({ error: "Niepoprawny link!" });
        } else {
            this.setState({ error: "" });
        }
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        if (event.target.ytlink.value) {
            const data = {
                ytid: ytdl.getVideoID(event.target.ytlink.value),
                name: event.target.name.value,
                author: event.target.author.value,
            };
            const r = await fetch('/api/songs/library', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (r.ok) {
                this.props.sendNotification("Pobieranie piosenki rozpoczęte!", 8000);
                this.props.back();
            } else {
                this.props.sendNotification(await r.text(), 8000);
            }
        }
    }

    close = () => {
        this.props.back()
    }

    render() {
        return (
            <div style={{padding: "20px"}}>
            <div className="breakpanel">
                <form onSubmit={this.handleSubmit}>
                    <div className="popupheader">
                        <div className="headertext">Dodaj piosenkę</div>
                        <Navbutton onClick={this.close} iconid="close" style={{marginRight: "0px"}}/>
                    </div>
                    
                    <div className="songtitle">puste pole oznacza zostawienie wartości z youtuba</div>
                    <input type="text" className="textbox2" placeholder="Link" name="ytlink" onChange={this.handleChange} />
                    <div>{this.state.error}</div>
                    <input placeholder="Tytuł" defaultValue={this.props.name} className="textbox2" type="text" name="name" />
                    <AuthorsPickable author={""} />
                    <button className="nicebutton" type="submit">Pobierz</button>
                </form>
            </div>
            </div>
        );
    }
}

export default withRouter(AddSong);