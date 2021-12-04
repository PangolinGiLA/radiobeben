import React from "react";

export default class Amp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            amp_mode: 0
        }
    }

    componentDidMount() {
        this.get_amp_mode();
    }

    get_amp_mode = async () => {
        let r = await fetch('/api/playlist/amp');
        let data = await r.json();
        this.setState({
            amp_mode: data.mode
        });
    }

    handleChange = (event) => {
        event.preventDefault();
        this.set_amp_mode(parseInt(event.target.value));
    }

    set_amp_mode = async (mode) => {
        const r = await fetch('/api/playlist/amp', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: mode
            })
        });
        if (r.ok) {
            this.get_amp_mode();
        }
    }
    
    render() {
        return (
            <div>
                <input type="radio" id="ON" name="amp_mode" value="0" onChange={this.handleChange} checked={this.state.amp_mode === 0}/>
                <label htmlFor="ON">ON</label>
                <input type="radio" id="AUTO" name="amp_mode" value="1" onChange={this.handleChange} checked={this.state.amp_mode === 1}/>
                <label htmlFor="AUTO">AUTO</label>
                <input type="radio" id="OFF" name="amp_mode" value="2" onChange={this.handleChange} checked={this.state.amp_mode === 2}/>
                <label htmlFor="OFF">OFF</label>
            </div>    
        )
    }
}