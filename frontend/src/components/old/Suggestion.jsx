import React from "react";
import { Form, Formik, Field, ErrorMessage } from "formik";
import * as ytdl from "ytdl-core"
import Navbutton from "../Navbutton";

class Suggestion extends React.Component {
    constructor(props) {
        super(props);
        this.id = props.id;
        this.state = {
            status: props.status,
            toAccept: null,
            admin: props.admin
        };
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.admin !== this.props.admin) {
            this.setState({ admin: this.props.admin });
        }
    }

    ytid_to_link(ytid) {
        return "https://youtu.be/" + ytid;
    }

    reject = async () => {
        const r = await fetch('/api/songs/suggestions', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: -1, id: this.id })
        });
        if (r.ok) {
            this.setState({ status: -1 });
            this.props.refresh(true);
        } else {
            this.props.sendNotification(await r.text(), 8000);
        }
    }

    handleSubmitPopup = async (event) => {
        event.preventDefault();
        if (event.target.name.value && event.target.author.value) {
            const data = {
                id: this.props.id,
                name: event.target.name.value,
                author: event.target.author.value,
                status: 1
            };
            const r = await fetch('/api/songs/suggestions', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            if (r.ok) {
                this.whenAccepted();
            } else {
                this.props.sendNotification(await r.text(), 8000);
            }
        }
    }

    accept = async () => {
        this.setState({
            toAccept: <SuggestionPopup
                handleSubmit={this.handleSubmitPopup}
                buttontext={'Pobierz'}
                id={this.props.id}
                name={this.props.name}
                author={this.props.author}
                done={this.whenAccepted}
                sendNotification={this.props.sendNotification}
            />
        });
    }

    whenAccepted = async () => {
        this.setState({ status: 1, toAccept: null });
        this.props.refresh(true);
    }

    render() {
        return (
            <div className={
                (this.state.status === 1) ? 'accepted-bg suggestionpanel' : (
                    (this.state.status === -1) ? 'rejected-bg suggestionpanel' : 'suggestionpanel')
            }>
                <a className="suggsongtitle" href={this.ytid_to_link(this.props.ytid)}>{this.props.name}</a>
                <div>{this.props.author}</div>
                <div>{this.props.views.toLocaleString("en-US")} wyświetleń</div>
                <div className="navcontainer">
                    {this.state.admin && this.state.status === 0 ? <>
                        <Navbutton onClick={this.accept} iconid="done" style={{ marginBottom: "0px" }} />
                        <Navbutton onClick={this.reject} iconid="close" style={{ marginBottom: "0px" }} />
                    </> : null}
                </div>
                {this.state.admin ? this.state.toAccept : null}
            </div>
        );
    }
}

export class SuggestionPopup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: ""
        };
    }

    handleChange = (event) => {
        const name = event.target.value;
        if (name.length > 0) {
            this.setState({ error: "" });
        } else {
            this.setState({ error: "Musisz podać nazwę utworu!" });
        }
    }

    handleKeypress = (e) => {
        let code = e.charCode;
        if (code === 32 || code === 13) { // enter or space
            document.getElementById(e.target.attributes.forwarid.value).click();
        }
    }

    render() {
        return (
            <div>
                <form onSubmit={this.props.handleSubmit}>
                    <input onChange={this.handleChange} defaultValue={this.props.name} className="textbox2" type="text" name="name" />
                    <div>{this.state.error}</div>
                    <AuthorsPickable author={this.props.author} />
                    {this.props.edit ?
                    <div className="songcheckboxes">
                        <label className="songproperties" htmlFor="private_checkbox">Prywatne
                            <input type="checkbox" id="private_checkbox" name="private" defaultChecked={this.props.private} tabIndex={-1} />
                            <span className="darkcheckbox" tabIndex={0} onKeyPress={this.handleKeypress} forwarid="private_checkbox"></span>
                        </label>

                        <label className="songproperties" htmlFor="onlyone_checkbox"> Zmień autora tylko tej piosence
                            <input type="checkbox" id="onlyone_checkbox" name="onlyone" defaultChecked={false} tabIndex={-1} />
                            <span className="darkcheckbox" tabIndex={0} onKeyPress={this.handleKeypress} forwarid="onlyone_checkbox"></span>
                        </label>
                    </div> : null}
                    <button className="nicebutton" type="submit">{this.props.buttontext}</button>
                </form>
            </div>
        );
    }
}

export default class Suggestions extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            suggestions: [],
            admin: props.admin,
            accepted: localStorage.getItem('accepted') === 'true',
            rejected: localStorage.getItem('rejected') === 'true',
            waiting: localStorage.getItem('waiting') === 'true',
            submit: false,
            loading: false
        };
    }

    componentDidMount() {
        this.loadData();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.suggestions !== this.state.suggestions) {
            this.loading = false;
        }
        if (prevProps.admin !== this.props.admin) {
            this.setState({ admin: this.props.admin });
        }
        if (prevState.accepted !== this.state.accepted || prevState.rejected !== this.state.rejected || prevState.waiting !== this.state.waiting) {
            this.loadData(true);
        }
    }

    loadData = (reload = false) => {
        this.setState({ loading: true });
        let before = this.state.suggestions.length > 0 ? this.state.suggestions[this.state.suggestions.length - 1].id : -1;
        before = reload ? -1 : before;
        fetch('/api/songs/suggestions?' + new URLSearchParams({
            limit: 20,
            before: before,
            accepted: this.state.accepted,
            rejected: this.state.rejected,
            waiting: this.state.waiting
        }))
            .then(async r => {
                if (r.ok) {
                    if (reload) {
                        let new_suggestions = JSON.parse(await r.text());
                        this.setState({ suggestions: new_suggestions, loading: false });
                    } else {
                        let new_suggestions = this.state.suggestions.concat(JSON.parse(await r.text()));
                        this.setState({ suggestions: new_suggestions, loading: false });
                    }

                }
            });
    }

    handleScroll = (e) => {
        if (e.target.scrollTop / (e.target.scrollHeight - e.target.clientHeight) > 0.95) {
            if (!this.state.loading) {
                this.loadData();
            }
        }
    }

    handleCheckboxChange = (e) => {
        this.setState({ [e.target.name]: e.target.checked });
        localStorage.setItem(e.target.name, e.target.checked);
    }

    handleKeypress = (e) => {
        let code = e.charCode;
        if (code === 32 || code === 13) { // enter or space
            document.getElementById(e.target.attributes.forwarid.value).click();
        }
    }

    render() {
        let toRender = [];
        for (let i of this.state.suggestions) {
            toRender.push(<Suggestion
                key={i.id}
                id={i.id}
                ytid={i.ytid}
                name={i.name}
                author={i.author}
                status={i.status}
                views={i.views}
                refresh={this.loadData}
                admin={this.state.admin}
                sendNotification={this.props.sendNotification}
            />);

        };
        return (
            <div className="content">

                <div className="filters">
                    <label className="filter" htmlFor="waiting_checkbox">Oczekujace
                        <input type="checkbox" id="waiting_checkbox" name="waiting" onChange={this.handleCheckboxChange} checked={this.state.waiting} tabIndex={-1} />
                        <span className="newcheckbox" tabIndex={0} onKeyPress={this.handleKeypress} forwarid="waiting_checkbox"></span>
                    </label>

                    <label className="filter" htmlFor="accepted_checkbox"> Zaakceptowane
                        <input type="checkbox" id="accepted_checkbox" name="accepted" onChange={this.handleCheckboxChange} checked={this.state.accepted} tabIndex={-1} />
                        <span className="newcheckbox" tabIndex={0} onKeyPress={this.handleKeypress} forwarid="accepted_checkbox"></span>
                    </label>
                    <label className="filter" htmlFor="rejected_checkbox"> Odrzucone
                        <input type="checkbox" id="rejected_checkbox" name="rejected" onChange={this.handleCheckboxChange} checked={this.state.rejected} tabIndex={-1} />
                        <span className="newcheckbox" tabIndex={0} onKeyPress={this.handleKeypress} forwarid="rejected_checkbox"></span>
                    </label>
                </div>

                <Suggest done={this.loadData} sendNotification={this.props.sendNotification} />

                <div className="divider"></div>
                <div className="allsuggestionspanel" onScroll={this.handleScroll}>
                    <div style={{ overflowY: "scroll", maxHeight: "100%", paddingRight: "8px" }}>{toRender}</div>
                </div>
                <div className="divider"></div>
            </div>
        )
    }
}

class Suggest extends React.Component {
    render() {
        return (
            <Formik
                validateOnChange={false}
                validateOnBlur={false}
                initialValues={{
                    ytlink: ""
                }}
                validate={values => {
                    const errors = {};
                    if (!values.ytlink) {
                        errors.ytlink = "Wpisz link!";
                    }
                    else if (!ytdl.validateURL(values.ytlink)) {
                        errors.ytlink = "Niepoprawny link!";
                    }
                    return errors;
                }}
                onSubmit={async (values, { setSubmitting, resetForm }) => {
                    resetForm({}) // why reset?
                    const data = {
                        ytid: ytdl.getVideoID(values.ytlink)
                    };
                    const r = await fetch('/api/songs/suggestions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                    if (r.ok) {
                        this.props.done(true);
                    } else {
                        this.props.sendNotification(await r.text(), 8000);
                    }
                    setSubmitting(false);
                }}
            >
                <Form>
                    <div className="formwrapper">
                        <Field className="textbox" style={{ maxWidth: "640px" }} type="text" name="ytlink" autoComplete="off" placeholder="tutaj wpisz link"></Field>
                        <button className="formbutton" type="submit">Sugeruj</button>
                    </div>
                    <ErrorMessage className="errormsg" name="ytlink" component="span">
                        {msg => <div className="formwrapper"><div className="formerror">{msg}</div></div>}
                    </ErrorMessage>
                </Form>
            </Formik>
        );
    }
}

class AuthorPickable extends React.Component {
    render() {
        return (
            <div onClick={this.select} className='authorpanel'>
                {this.props.displayName}
            </div>
        )
    }
    select = () => {
        this.props.done(this.props.displayName);
    }
}

export class AuthorsPickable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            authors: [],
            selected: this.props.author,
            inputText: this.props.author
        }
        this.loading = false;
        this.searchText = "";
    }

    scrollstyle = {
        overflowY: "scroll"
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.authors.length !== this.state.authors.length) {
            this.loading = false;
        }
    }

    loadData = (clear) => {
        this.loading = true;
        let new_authors = [];
        if (clear)
            new_authors = [];
        else
            new_authors = this.state.authors;
        fetch('/api/songs/authors?' + new URLSearchParams({
            limit: 20,
            before: new_authors.length,
            like: this.searchText
        }))
            .then(async r => {
                if (r.ok) {
                    new_authors = new_authors.concat(JSON.parse(await r.text()));
                    this.setState({ authors: new_authors });
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
            this.setState({ inputText: e.target.value });
            this.loadData(true);
        }
    }

    done = (selected) => {
        this.setState({ inputText: selected, selected: selected });
    }

    searching_start = () => {
        this.setState({ selected: "" });
        this.loadData(true);
    }
    doNothing = () => { }

    render() {
        let toRender = []
        for (let i of this.state.authors) {
            toRender.push(<AuthorPickable
                displayName={i.displayName}
                id={i.id}
                done={this.done}
                key={i.id}
            />)
        }

        return (
            <div>
                <input className="textbox2" placeholder="Autor" type="text" name="author" id="library_search_active" autoComplete="off" value={this.state.inputText} onChange={this.handleTextChange} onFocus={this.searching_start} />
                {this.state.selected === "" ?
                    <div className="authorselect" style={this.scrollstyle} onScroll={this.handleScroll}>{toRender}</div> : null}
            </div>
        )
    }
}
