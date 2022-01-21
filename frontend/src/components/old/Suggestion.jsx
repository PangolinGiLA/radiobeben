import React from "react";
import { Form, Formik, Field, ErrorMessage } from "formik";
import * as ytdl from "ytdl-core"

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

    accept = async () => {
        this.setState({
            toAccept: <SuggestionPopup
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
                (this.state.status === 1) ? 'accepted-bg suggestionpanel' : ((this.state.status === -1) ? 'rejected-bg suggestionpanel' : 'neutral-bg suggestionpanel')
            }>
                <div className="suggsongtitle">
                    <a className="suggsongtitle" href={this.ytid_to_link(this.props.ytid)}>{this.props.name}</a>
                </div>
                <div>
                    {this.props.author}
                </div>
                <div>{this.props.views.toLocaleString("en-US")} wyświetleń</div>
                <div className="navcontainer">
                    {this.state.admin && this.state.status === 0 ? <button className="navbutton" onClick={this.accept}><span className="material-icons-round">done</span></button> : null}
                    {this.state.admin && this.state.status === 0 ? <button className="navbutton" onClick={this.reject}><span className="material-icons-round">close</span></button> : null}
                </div>
                {this.state.admin ? this.state.toAccept : null}
            </div>
        );
    }
}

class SuggestionPopup extends React.Component {
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

    handleSubmit = async (event) => {
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
                this.props.done();
            } else {
                this.props.sendNotification(await r.text(), 8000);
            }
        }
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <input onChange={this.handleChange} defaultValue={this.props.name} className="textbox2" type="text" name="name" />
                    <div>{this.state.error}</div>
                    <AuthorsPickable author={this.props.author} />
                    <button className="nicebutton" type="submit">Pobierz</button>
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
        };
        this.loading = false;
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
        this.loading = true;
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
                        this.setState({ suggestions: new_suggestions });
                    } else {
                        let new_suggestions = this.state.suggestions.concat(JSON.parse(await r.text()));
                        this.setState({ suggestions: new_suggestions });
                    }

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

    handleCheckboxChange = (e) => {
        this.setState({ [e.target.name]: e.target.checked });
        localStorage.setItem(e.target.name, e.target.checked);
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
            <div>
                <div className="content">
                    <div className="filters">
                        <div>
                            <label className="filter" htmlFor="waiting_checkbox">Oczekujace
                                <input type="checkbox" id="waiting_checkbox" name="waiting" onChange={this.handleCheckboxChange} checked={this.state.waiting} />
                                <span className="newcheckbox"></span>
                            </label>

                        </div>
                        <div>
                            <label className="filter" htmlFor="accepted_checkbox"> Zaakceptowane
                                <input type="checkbox" id="accepted_checkbox" name="accepted" onChange={this.handleCheckboxChange} checked={this.state.accepted} />
                                <span className="newcheckbox"></span>

                            </label>
                        </div>
                        <div>
                            <label className="filter" htmlFor="rejected_checkbox"> Odrzucone
                                <input type="checkbox" id="rejected_checkbox" name="rejected" onChange={this.handleCheckboxChange} checked={this.state.rejected} />
                                <span className="newcheckbox"></span>
                            </label>
                        </div>
                    </div>
                    <div className="filters">
                        <Suggest done={this.loadData} sendNotification={this.props.sendNotification} />
                    </div>
                    <div className="divider"></div>
                    <div className="allsuggestionspanel" onScroll={this.handleScroll}>
                        {toRender}
                    </div>
                    <div className="divider"></div>
                </div>

            </div>
        )
    }
}

class Suggest extends React.Component {
    render() {
        return (
            <div>
                <Formik
                    initialValues={{
                        ytlink: ""
                    }}
                    validate={values => {
                        const errors = {};
                        if (!values.ytlink)
                            errors.ytlink = "Wpisz link!";
                        else if (!ytdl.validateURL(values.ytlink))
                            errors.ytlink = "Niepoprawny link!"
                        return errors;
                    }}
                    onSubmit={async (values, { setSubmitting, resetForm }) => {
                        resetForm({})
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
                        <div className="suggestbox">
                            <Field className="textbox" type="text" name="ytlink"></Field>
                            <button type="submit">Sugeruj</button>
                        </div>
                        <ErrorMessage className="errormsg" name="ytlink" component="span" />
                    </Form>
                </Formik>
            </div>
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

class AuthorsPickable extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            authors: [],
            selected: this.props.author
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
            this.loadData(true);
        }
    }

    done = (selected) => {
        this.setState({ selected: selected });
    }

    searching_start = () => {
        this.searchText = this.state.selected;
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
                {this.state.selected === "" ?
                    <input className="textbox2" type="text" name="author" id="library_search_active" autoComplete="off" onChange={this.handleTextChange} /> :
                    <input className="textbox2" type="text" name="author" id="library_search" value={this.state.selected} onChange={this.doNothing} onFocus={this.searching_start} />}
                {this.state.selected === "" ?
                    <div className="authorselect" style={this.scrollstyle} onScroll={this.handleScroll}>{toRender}</div> : null}
            </div>
        )
    }
}
