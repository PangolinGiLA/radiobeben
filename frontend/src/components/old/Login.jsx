import { ErrorMessage, Formik, Form, Field } from "formik";
import React, { useState } from "react";

export default function LoginPage(props) {
    const [error, setError] = useState('');
    return (<div>
        <p>{error}</p>
        <Formik
            initialValues={{
                login: '', password: '',
            }}
            validate={(values) => {
                const errors = {};
                if (!values.login) {
                    errors.login = "Wpisz login!";
                }
                if (!values.password) {
                    errors.password = "Wpisz hasło!";
                }
                return errors;
            }}
            onSubmit={async (values, { setSubmitting, setFieldError }) => {
                const data = {
                    login: values.login,
                    password: values.password,
                };
                const r = await fetch('/api/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                if (r.status === 200) {
                    props.loggedIn();
                    setError("");
                } else {
                    setError(await r.text());
                }
                setSubmitting(false);
            }}
        >
            <Form>
                <Field type="text" name="login" />
                <ErrorMessage name="login" component="span" className="error" />
                <Field type="password" name="password" />
                <ErrorMessage name="password" component="span" className="error" />
                <input type="submit" value={"Zaloguj się"}/>
            </Form>
        </Formik>
    </div>
    );
}
