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
            console.log(await r.text());
        }
    }

    accept = async () => {
        this.setState({
            toAccept: <SuggestionPopup
                id={this.props.id}
                name={this.props.name}
                author={this.props.author}
                done={this.whenAccepted}
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
                {this.state.admin ? <button className="navbutton" onClick={this.accept}><span className="material-icons-round">done</span></button> : null}
                {this.state.admin ? <button className="navbutton" onClick={this.reject}><span className="material-icons-round">close</span></button> : null}
                </div>
               {this.state.admin ? this.state.toAccept : null}
            </div>
        );
    }
}

class SuggestionPopup extends React.Component {
    render() {
        return (
            <div>
                <Formik
                    initialValues={{
                        name: this.props.name, author: this.props.author,
                    }}
                    validate={(values) => {
                        const errors = {};
                        if (!values.author) {
                            errors.name = "Tytuł nie może być pusty!";
                        }
                        if (!values.author) {
                            errors.author = "Autor nie może być pusty!";
                        }
                        return errors;
                    }}
                    onSubmit={async (values, { setSubmitting, setFieldError }) => {
                        const data = {
                            id: this.props.id,
                            name: values.name,
                            author: values.author,
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
                            console.log(await r.text());
                        }
                        setSubmitting(false);
                    }}
                >
                    <Form>
                        <Field type="text" name="name" />
                        <ErrorMessage name="name" component="span" className="error" />
                        <Field type="text" name="author" />
                        <ErrorMessage name="author" component="span" className="error" />
                        <button type="submit">pobierz</button>
                    </Form>
                </Formik>
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
                        <Suggest done={this.loadData} />
                    </div>
                    <div className="divider"></div>
                    <div className="allsuggestionspanel" onScroll={this.handleScroll}>
                        {toRender}
                    </div>
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
                    onSubmit={async (values, { setSubmitting, setFieldError }) => {
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
                            console.log(await r.text());
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

class AuthorDropdown extends React.Component {

}