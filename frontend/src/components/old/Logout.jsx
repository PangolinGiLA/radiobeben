import React from "react";

export default class Logout extends React.Component {
    logout = () => {
        fetch("/api/users/logout")
        .then(r => {
            if (r.ok) {
                this.props.logout();
            }
        })
    }
    render () {
        return (
            <button onClick={this.logout}>Wyloguj się</button>
        )
    }
}