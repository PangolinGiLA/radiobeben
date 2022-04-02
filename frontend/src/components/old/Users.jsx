import React from "react";
import Navbutton from "../Navbutton";

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
            <div className="allsuggestionspanel">
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <div className="padding">
                            <input className="textbox" placeholder="Stare hasło" type="password" name="old_password" value={this.state.old_password} onChange={this.handleInputChange} />
                        </div>
                        <div className="padding">
                            <input className="textbox" placeholder="Nowe hasło" type="password" name="new_password" value={this.state.new_password} onChange={this.handleInputChange} />
                        </div>
                        <div className="padding">
                            <input className="textbox" placeholder="Powtórz nowe hasło" type="password" name="new_password2" value={this.state.new_password2} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            {this.state.error}
                        </div>
                        <div>
                            <input className="nicebutton" type="submit" value="Zmień hasło" />
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
        console.log(event.target);
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
                    permissions: event.target.permissions.value
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
                            permissions: 31
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
            <div className="allsuggestionspanel">
                <form onSubmit={this.handleSubmit}>
                    <div>
                        <div className="padding">
                            <input className="textbox" placeholder="Nazwa użytkownika" type="input" name="username" value={this.state.username} onChange={this.handleInputChange} />
                        </div>
                        <div className="padding">
                            <input className="textbox" placeholder="Nowe hasło" type="password" name="new_password" value={this.state.new_password} onChange={this.handleInputChange} />
                        </div>
                        <div className="padding">
                            <input className="textbox" placeholder="Powtórz nowe hasło" type="password" name="new_password2" value={this.state.new_password2} onChange={this.handleInputChange} />
                        </div>
                        <div>
                            <UserConfig number={-1} user={{ permissions: 31 }} />
                        </div>
                        <div>
                            {this.state.error}
                        </div>
                        <div>
                            <input className="nicebutton" type="submit" value="Zarejestruj" />
                        </div>
                    </div>
                </form>
            </div>
        );
    }
};

class UserList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            users: [],
        };
    }

    componentDidMount() {
        this.get_users();
    }

    get_users = () => {
        fetch("/api/users/users")
            .then(r => r.json())
            .then(r => {
                this.setState({
                    users: r
                });
            });
    }

    render() {

        let toRender = [];

        for (let i = 0; i < this.state.users.length; i++) {
            toRender.push(
                <UserEntry number={i} sendNotification={this.props.sendNotification} done={this.get_users} user={this.state.users[i]} key={i} />
            );
        }

        return (
            <div className="allsuggestionspanel">
                {toRender}
            </div>
        )
    }
};

class UserEntry extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            config: false
        }
    }

    deleteMe = () => {
        fetch("/api/users/users", {
            method: "DELETE",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: this.props.user.id
            })
        })
            .then(r => {
                if (r.ok) {
                    this.props.sendNotification("Pomyślnie usunięto użytkownika!", 8000);
                    this.props.done();
                } else {
                    this.props.sendNotification("Coś poszło nie tak!", 8000);
                }
            });
    }

    openConfig = () => {
        this.setState({ config: !this.state.config });
    }

    render() {
        return (
            <div>
                <div className="userinfo">
                    <div className="userconfigname">{this.props.user.login}</div>
                    <div className="navcontainer">
                        <div> <Navbutton onClick={this.deleteMe} iconid="delete" small={1} /> </div>
                        <div> <Navbutton onClick={this.openConfig} iconid="settings" small={1} /> </div>
                    </div>
                </div>
                <div>
                    {this.state.config ? <UserConfig hasSubmit={1} number={this.props.number} user={this.props.user} sendNotification={this.props.sendNotification} done={this.props.done} /> : null}
                </div>
            </div>

        );
    }
};

class SmallCheckbox extends React.Component {
    change = () => {
        this.props.click(this.props.id);
    }
    render() {
        return (
            <label className="userfilter" htmlFor={this.props.id + this.props.number}>{this.props.name}
                <input onChange={this.change} type="checkbox" id={this.props.id + this.props.number} name={this.props.name} checked={this.props.checked} tabIndex={-1} />
                <span className="smallcheckbox" tabIndex={0} forwarid={this.props.id + this.props.number}></span>
            </label>
        )
    }
}

class UserConfig extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: props.user.permissions
        }
    }

    permissions = {
        suggestions: 0,
        playlist: 1,
        schedule: 2,
        amp: 3,
        library: 4,
        users: 5
    }

    can = (what, permissions) => {
        return Boolean(permissions & (1 << what));
    }

    change = (id) => {
        this.setState({
            value: this.state.value ^ (1 << this.permissions[id])
        });
    }

    submit = () => {
        fetch("/api/users/permissions", {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: this.props.user.id,
                permissions: this.state.value
            })
        })
            .then(r => {
                if (r.ok) {
                    this.props.sendNotification("Pomyślnie zmieniono uprawnienia!", 8000);
                } else {
                    this.props.sendNotification("Coś poszło nie tak!", 8000);
                }
            });
    }

    render() {
        let checkboxes = [];
        let keys = Object.keys(this.permissions);
        for (let i = 0; i < keys.length; i++) {
            checkboxes.push(
                <SmallCheckbox
                    key={i}
                    number={this.props.number}
                    id={keys[i]}
                    name={keys[i]}
                    checked={this.can(this.permissions[keys[i]], this.state.value)}
                    click={this.change}
                />
            );
        }

        return (
            <div className="userfilters">
                <input type="hidden" value={this.state.value} name="permissions" />
                {checkboxes}
                {this.props.hasSubmit ? <Navbutton iconid="done" onClick={this.submit} small={1} /> : null}
            </div>
        )
    }

}

export default class Users extends React.Component {
    render() {
        return (
            <div>
                {this.props.admin ? <div className="divider"></div> : null}
                <div>
                    {this.props.admin ? <AddUser sendNotification={this.props.sendNotification} /> : null}
                </div>
                <div className="divider" ></div>
                <div>
                    <ChangePassword sendNotification={this.props.sendNotification} />
                    <div className="divider" ></div>
                </div>
                <div>
                    {this.props.admin ? <UserList sendNotification={this.props.sendNotification} /> : null}
                </div>
                {this.props.admin ? <div className="divider" ></div> : null}
            </div>
        )
    }
};