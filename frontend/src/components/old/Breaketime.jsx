import React from 'react'

class BreakTime extends React.Component {
    constructor(props) {
        super(props);
        this.state = {error: ''}
        this.now = props.now;
        this.t_min = props.t_min;
        this.t_max = props.t_max;
        this.id = props.id;
    }

    componentDidMount() {
        this.handleInputChange({target: {value: this.meToStr()}}); // simulate correct argument
    }

    meToStr = () => {
        return this.timeToStr(this.now);
    }
    
    timeToStr = (time) => {
        return String(time.hour).padStart(2, '0') + ":" + String(time.minute).padStart(2, '0');
    }

    handleInputChange = (e) => {
        let temp = e.target.value.split(":");
        if (Array.isArray(temp)) {
            if (temp.length === 2) {
                temp[0] = parseInt(temp[0]); temp[1] = parseInt(temp[1]);
                if (temp[0] > this.t_min.hour || (temp[0] === this.t_min.hour && temp[1] > this.t_min.minute)) {
                    if (temp[0] < this.t_max.hour || (temp[0] === this.t_max.hour && temp[1] < this.t_max.minute)) {
                        this.now.hour = temp[0];
                        this.now.minute = temp[1];
                        this.setState({error: ""})
                    } else {
                        this.setState({error: "Niepoprawny czas!"}); // not a good error message - maybe i'll change that in future
                    }
                } else {
                    this.setState({error: "Niepoprawny czas!"});
                }
            } else {
                this.setState({error: "Nieapoprawny format godziny!"})
            }
        } else {
            this.setState({error: "Niepoprawny format godziny!"})
        }
    }

    render() {
        return(
            <div>
                <input type="time" name={this.id} id={this.id} defaultValue={this.meToStr()} onChange={this.handleInputChange}/>
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
        return {hour: date.getHours(), minute: date.getMinutes()};
    }

    render() {
        return(
            <div>
                <BreakTime 
                    t_min={this.t_min} 
                    now={this.now1} 
                    t_max={{hour:23, minute: 59}}
                /> do 
                <BreakTime
                    t_min={this.now1} 
                    now={this.now2} 
                    t_max={{hour:23, minute: 59}}
                />
            </div>
        )
            
    }
}

// renders Breaketimes object to edit it
export default class BreaksInput extends React.Component {
    constructor(props) {
        super(props);
        this.breaktimes = props.breaktimes; // Array
    }

    render() {
        let toRender = [];
        if (this.breaktimes.length > 0) {
            toRender.push(<BreakeTimeInput t_min={{hour:0, minute:0}} now1={this.breaktimes[0].start} now2={this.breaktimes[0].end}/>)
        }
        for (let i = 1; i < this.breaktimes.length; i++) {
            toRender.push(<BreakeTimeInput t_min={this.breaktimes[i-1].end} now1={this.breaktimes[i].start} now2={this.breaktimes[i].end}/>)
        }
        return(
            <div>
                {toRender}
            </div>
        );
    }
}
