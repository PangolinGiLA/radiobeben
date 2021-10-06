import React from 'react'

class BreakTime extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: '' }
        this.now = props.now;
        this.t_min = props.t_min;
        this.t_max = props.t_max;
        this.id = props.id;
        this.b_id = props.b_id;
        this.set_time = props.setTime;
        this.end = props.end;

    }

    componentDidMount() {
        this.update_errors({ target: { value: this.meToStr() } }, false); // simulate correct argument
    }

    componentDidUpdate(props) {
        if (props.now !== this.now || this.t_min !== props.t_min || this.t_max !== props.t_max) {
            this.now = props.now;
            this.t_min = props.t_min;
            this.t_max = props.t_max;
            //console.log(this.b_id, this.end);
            this.update_errors({ target: { value: this.meToStr() } }, false); // simulate correct argument
        }
    }

    meToStr = () => {
        return this.timeToStr(this.now);
    }

    timeToStr = (time) => {
        return String(time.hour).padStart(2, '0') + ":" + String(time.minute).padStart(2, '0');
    }

    handleInputChange = (e) => {
        this.update_errors(e, true);
    }

    update_errors = (e, setstate) => {
        let temp = e.target.value.split(":");
        if (Array.isArray(temp)) {
            if (temp.length === 2) {
                temp[0] = parseInt(temp[0]); temp[1] = parseInt(temp[1]);
                if (temp[0] > this.t_min.hour || (temp[0] === this.t_min.hour && temp[1] > this.t_min.minute)) {
                    if (temp[0] < this.t_max.hour || (temp[0] === this.t_max.hour && temp[1] < this.t_max.minute)) {
                        this.now.hour = temp[0];
                        this.now.minute = temp[1];
                        if (setstate) {
                            this.set_time(this.now, this.b_id, this.end);
                        }
                        this.setState({ error: "" })
                    } else {
                        this.setState({ error: "Niepoprawny czas!" }); // not a good error message - maybe i'll change that in future
                    }
                } else {
                    this.setState({ error: "Niepoprawny czas!" });
                }
            } else {
                //this.setState({ error: "Niepoprawny format godziny!" })
            }
        } else {
            //this.setState({ error: "Niepoprawny format godziny!" })
        }
    }

    render() {
        return (
            <div>
                <input type="time" name={this.id} id={this.id} defaultValue={this.meToStr()} onChange={this.handleInputChange} />
                <div>{this.state.error}</div>
            </div>
        )
    }
}

class BreakeTimeInput extends React.Component {
    constructor(props) {
        super(props);
        this.t_min = props.t_min;
        this.now1 = props.now1;
        this.now2 = props.now2;
        this.b_id = props.b_id;
        this.set_time = props.setTime;
    }

    render() {
        return (
            <div>
                <BreakTime
                    b_id={this.b_id}
                    end={false}
                    setTime={this.set_time}
                    t_min={this.t_min}
                    now={this.now1}
                    t_max={{ hour: 23, minute: 59 }}
                /> do
                <BreakTime
                    b_id={this.b_id}
                    end={true}
                    setTime={this.set_time}
                    t_min={this.now1}
                    now={this.now2}
                    t_max={{ hour: 23, minute: 59 }}
                />
            </div>
        )

    }
}

// renders Breaketimes object to edit it
export default class BreaksInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = { breaktimes: props.breaktimes, errors: "" }; // Array
        let keys = [];
        for (let i = 0; i < this.state.breaktimes.length; i++) {
            keys.push(i);
        }
        this.keys = keys;
        this.last = this.state.breaktimes.length;
    }

    set_time = (time, break_n, end) => {
        let new_breaktimes = this.state.breaktimes;
        if (end) {
            new_breaktimes[break_n].end = time;
        } else {
            new_breaktimes[break_n].start = time;
        }
        //console.log(new_breaktimes);
        this.setState({ breaktimes: new_breaktimes });

    }

    add_break = () => {
        let new_breaktimes = this.state.breaktimes;
        if (new_breaktimes[new_breaktimes.length - 1].end !== { hour: 23, minute: 59 }) {
            new_breaktimes.push({ start: this.add_time(1, new_breaktimes[new_breaktimes.length - 1].end), end: this.add_time(2, new_breaktimes[new_breaktimes.length - 1].end) })
            this.keys.push(this.last);
            this.last++;
        } else {
            this.setState({ errors: "Ostatnia przerwa kończy się za późno aby dodać kolejną!" });
        }
        this.setState({ breaktimes: new_breaktimes })
    }

    add_time = (minutes, start_time) => {
        var time = this.my_time_to_Date(start_time);
        time.setMinutes(time.getMinutes() + minutes)
        return this.Date_to_my_time(time);
    }

    my_time_to_Date = (time) => {
        var new_time = new Date();
        new_time.setHours(time.hour);
        new_time.setMinutes(time.minute);
        return new_time;
    }

    Date_to_my_time = (date) => {
        return { hour: date.getHours(), minute: date.getMinutes() };
    }

    remove_break = (number) => {
        return () => {
            if (this.state.breaktimes.length > 0) {
                let new_breaktimes = this.state.breaktimes;
                new_breaktimes.splice(number, 1);
                this.keys.splice(number, 1);
                console.log(new_breaktimes)
                this.setState({ breaktimes: new_breaktimes })
            }
        }
    }

    render() {
        let toRender = [];
        if (this.state.breaktimes.length > 0) {

            toRender.push(<BreakeTimeInput key={this.keys[0]} b_id={0} setTime={this.set_time} t_min={{ hour: 0, minute: 0 }} now1={this.state.breaktimes[0].start} now2={this.state.breaktimes[0].end} />)
            toRender.push(<input key={-this.keys[0]-1} type="button" value="-" onClick={this.remove_break(0)} />)
        }
        for (let i = 1; i < this.state.breaktimes.length; i++) {
            toRender.push(<BreakeTimeInput key={this.keys[i]} b_id={i} setTime={this.set_time} t_min={this.state.breaktimes[i - 1].end} now1={this.state.breaktimes[i].start} now2={this.state.breaktimes[i].end} />)
            toRender.push(<input key={-this.keys[i]-1} type="button" value="-" onClick={this.remove_break(i)} />)
        }
        return (
            <div>
                <input type="button" value="+" onClick={this.add_break} />
                {toRender}
                {this.state.errors}
            </div>
        );
    }
}
