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
        return "youtu.be/" + ytid;
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
    }

    render() {
        return (
            <div className={
                (this.state.status === 1) ? 'accepted-bg' : ((this.state.status === -1) ? 'rejected-bg' : 'neutral-bg')
            }>
                {this.props.name}
                <br />
                {this.props.author}
                <br />
                <a href={this.ytid_to_link(this.props.ytid)}>Link</a>
                <br />
                {this.state.admin ? <button onClick={this.reject}>odrzuć</button>: null}
                {this.state.admin ? <button onClick={this.accept}>akceptuj</button> : null}
                {this.state.admin ? this.state.toAccept :null}
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

    scrollstyle = {
        height: "150px",
        overflowY: "scroll"
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
            limit: 2,
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
                refresh={this.loadData}
                admin = {this.state.admin}
            />);

        };
        return (
            <div>
                <input type="checkbox" id="accepted_checkbox" name="accepted" onChange={this.handleCheckboxChange} checked={this.state.accepted}/>
                <label htmlFor="accepted_checkbox">Zaakceptowane</label>
                <input type="checkbox" id="rejected_checkbox" name="rejected" onChange={this.handleCheckboxChange} checked={this.state.rejected}/>
                <label htmlFor="rejected_checkbox">Odrzucone</label>
                <input type="checkbox" id="waiting_checkbox" name="waiting" onChange={this.handleCheckboxChange} checked={this.state.waiting}/>
                <label htmlFor="waiting_checkbox">Oczekujace</label>
                <Suggest done={this.loadData} />
                <div style={this.scrollstyle} onScroll={this.handleScroll}>
                    {toRender}
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
                            this.props.done();
                        } else {
                            console.log(await r.text());
                        }
                        setSubmitting(false);
                    }}
                >
                    <Form>
                        <Field type="text" name="ytlink"></Field>
                        <ErrorMessage name="ytlink" component="span" className="error" />
                        <button type="submit">Sugeruj</button>
                    </Form>
                </Formik>
            </div>
        );
    }
}
