import React from 'react'

class BreaktimesDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            presets: this.props.presets
        }
    }

    render() {
        let dropdownOptions = [];
        for (let i = 0; i < this.state.presets.length; i++) {
            dropdownOptions.push(<option key={i} value={this.state.presets[i].id}>{this.state.presets[i].name}</option>)
        }
        return (
            <select defaultValue={this.props.selected} name={this.props.weekday + "breaktime"} id={this.props.weekday + "breaktime"}>{dropdownOptions}</select>
        );
    }
}

class VisibilityDropdown extends React.Component {
    render() {
        return (
            <select defaultValue={this.props.value} name={this.props.number + "_visibility"} id={this.props.number + "_visibility"}>
                <option value="0">Prywatny</option>
                <option value="1">Do odczytu</option>
                <option value="2">Publiczny</option>
            </select>
        );
    }
}

class Weekday extends React.Component {
    render() {
        return (
            <div>
                {this.props.name}
                <input defaultChecked={this.props.enabled} type="checkbox" name={this.props.number + "_enabled"} id={this.props.number + "_enabled"} />
                <VisibilityDropdown value={this.props.visibility} number={this.props.number} />
                <BreaktimesDropdown selected={this.props.breaketime} weekday={this.props.number} presets={this.props.presets} />
            </div>
        );
    }
}

export default class Weekdays extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fetched: false,
            data: []
        }
    }

    get_data = async () => {
        const r = await fetch('/api/playlist/weekdays', {
            method: 'GET',
        });
        if (r.ok) {
            this.setState({ data: JSON.parse(await r.text()) });
        } else {
            console.log(await r.text());
        }

        const r2 = await fetch('/api/playlist/breaktimes', {
            method: 'GET',
        });
        if (r.ok) {
            this.setState({ fetched: true, presets: JSON.parse(await r2.text()) });
        } else {
            console.log(await r2.text());
        }

    }

    componentDidMount() {
        this.get_data();
    }

    handleSubmit = async (event) => {
        event.preventDefault();
        let changed = false;
        for (let i = 0; i < 7; i++) {
            let weekday = (i + 1) % 7;
            let data = {
                weekday: weekday,
                isEnabled: event.target.elements[i + "_enabled"].checked,
                breaktimeid: parseInt(event.target.elements[i + "breaktime"].value),
                visibility: parseInt(event.target.elements[i + "_visibility"].value)
            }
            if (data.isEnabled !== this.state.data[weekday].isEnabled
                || data.breaktimeid !== this.state.data[weekday].breaketime.id
                || data.visibility !== this.state.data[weekday].visibility) {
                // need to send data to sever
                const r = await fetch('/api/playlist/schedule', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                if (r.ok) {
                    changed = true;

                } else {
                    console.log(await r.text());
                }
            }
        }
        if (changed) {
            // somehow refresh playlist 
        }
    }

    render() {
        const days = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];
        let toRender = [];
        if (this.state.fetched) {
            for (let i = 0; i < 7; i++) {
                let weekday = (i + 1) % 7; // js bad, sunday is 0
                toRender.push(<Weekday
                    key={i}
                    number={i}
                    visibility={this.state.data[weekday].visibility}
                    enabled={this.state.data[weekday].isEnabled}
                    name={days[i]}
                    breaketime={this.state.data[weekday].breaketime.id}
                    presets={this.state.presets}
                />)
            }
        }
        return (
            <div>
                <form onSubmit={this.handleSubmit}>
                    {toRender}
                    <button type="submit">potwierdź</button>
                </form>
            </div>
        )
    }
}