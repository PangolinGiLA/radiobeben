import React from "react";
import { Form, Formik, Field, ErrorMessage } from "formik";
import * as ytdl from "ytdl-core"

class Suggestion extends React.Component {
    constructor(props) {
        super(props);
        this.id = props.id;
        this.state = {
            status: props.status,
            toAccept: null
        };
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
                <button onClick={this.reject}>odrzuć</button>
                <button onClick={this.accept}>akceptuj</button>
                {this.state.toAccept}
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
            suggestions: []
        };
    }

    componentDidMount() {
        this.loadData();
    }

    loadData = () => {
        fetch('/api/songs/suggestions', {
            method: 'GET'
        })
            .then(async r => {
                this.setState({ suggestions: JSON.parse(await r.text()) })
            });
    }

    render() {
        let toRender = [];
        for (let i of this.state.suggestions) {
            toRender.push(<Suggestion 
                key={i.id} 
                d={i.id} 
                ytid={i.ytid} 
                name={i.name} 
                author={i.author} 
                status={i.status}
                refresh={this.loadData}
                />);
        };
        return (
            <div>
                <Suggest done={this.loadData} />
                {toRender}
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
