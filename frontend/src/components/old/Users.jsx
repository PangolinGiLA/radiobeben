import React from "react";

class ChangePassword extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: "",
            old_password: "",
            new_password: "",
            new_password2: ""
        };
    }

    handleInputChange = (event) => {
        const target = event.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    handleSubmit = (event) => {
        event.preventDefault();
        if (this.state.new_password !== this.state.new_password2) {
            this.setState({
                error: "Hasła nie są takie same!"
            });
        } else {
            fetch("/api/users/password", {
                method: "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    old_password: this.state.old_password,
                    new_password: this.state.new_password
                })
            })
                .then(async r => {
                    if (r.ok) {
                        this.props.sendNotification("Hasło zostało zmienione!", 8000);
                        this.setState({
                            error: "",
                            old_password: "",
                            new_password: "",
                            new_password2: "",
                        });
                    } else {
                        this.setState({
                            error: await r.text(),
                        });
                    }
                })
        }
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <div>
                            <input placeholder="Stare hasło" type="password" name="old_password" value={this.state.old_password} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            <input placeholder="Nowe hasło" type="password" name="new_password" value={this.state.new_password} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            <input placeholder="Powtórz nowe hasło" type="password" name="new_password2" value={this.state.new_password2} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            {this.state.error}
                        </div>
                        <div>
                            <input type="submit" value="Zmień hasło" />
                        </div>
                    </div>
                </form>
            </div>
        );
    }
};

class AddUser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: "",
            username: "",
            new_password: "",
            new_password2: "",
            permissions: 0
        };
    }

    handleInputChange = (event) => {
        const target = event.target;
        const value = target.value;
        const name = target.name;

        this.setState({
            [name]: value
        });
    }

    handleSubmit = (event) => {
        event.preventDefault();
        if (this.state.new_password !== this.state.new_password2) {
            this.setState({
                error: "Hasła nie są takie same!"
            });
        } else if (this.state.new_password.length < 8) {
            this.setState({
                error: "Hasło musi mieć conajmniej 8 znaków!"
            });
        } else if (this.state.username.length < 3) {
            this.setState({
                error: "Nazwa użytkownika musi mieć conajmniej 3 znaki!"
            });
        } else {
            fetch("/api/users/register", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    login: this.state.username,
                    password: this.state.new_password,
                    permissions: this.state.permissions
                })
            })
                .then(async r => {
                    if (r.ok) {
                        this.props.sendNotification("Pomyślnie zarejestrowano!", 8000);
                        this.setState({
                            error: "",
                            username: "",
                            new_password: "",
                            new_password2: "",
                            permissions: 0
                        });
                    } else {
                        this.setState({
                            error: await r.text(),
                        });
                    }
                })
        }
    }

    render() {
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <div>
                            <input placeholder="Nazwa użytkownika" type="input" name="username" value={this.state.username} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            <input placeholder="Nowe hasło" type="password" name="new_password" value={this.state.new_password} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            <input placeholder="Powtórz nowe hasło" type="password" name="new_password2" value={this.state.new_password2} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            <input placeholder="Kod uprawnień" type="number" name="permissions" value={this.state.permissions} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            {this.state.error}
                        </div>
                        <div>
                            <input type="submit" value="Zarejestruj" />
                        </div>
                    </div>
                </form>
            </div>
        );
    }
};


export default class Users extends React.Component {
    render() {
        return (
            <div>
                <div>
                    <AddUser sendNotification={this.props.sendNotification} />
                </div>
                <div>
                    <ChangePassword sendNotification={this.props.sendNotification} />
                </div>
            </div>
        )
    }
};