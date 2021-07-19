import "./css/background.css"
import React from "react";
import { Form, Formik, Field, ErrorMessage } from "formik";

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
            console.log("ajaj");
        }
    }

    accept = async () => {
        this.setState({toAccept: <SuggestionPopup id={this.props.id} name={this.props.name} author={this.props.author} done={this.whenAccepted}/>})
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
                            console.log("ajaj");
                        }
                        setSubmitting(false);
                    }}  
                >
                    <Form>
                        <Field type="text" name="name"/>
                        <ErrorMessage name="name" component="span" className="error" />
                        <Field type="text" name="author"/>
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
        fetch('/api/songs/suggestions', {
            method: 'GET'
        })
        .then(async r => {
            this.setState({suggestions: JSON.parse(await r.text()) })
        });
    }

    render() {
        let toRender = [];
        let j = 0;
        for (let i of this.state.suggestions) {
            toRender.push(<Suggestion key={j} id={i.id} ytid={i.ytid} name={i.name} author={i.author} status={i.status}/>);
            j++;
        };
        return (
            <div>
                {toRender}
            </div>
        )
    }
}
