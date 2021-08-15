import Section from './Section.jsx';
import Dayheader from './Dayheader.jsx';

const Playlist = () => {
    return (  
        <div className="content">
            <Dayheader/>
            <div className="divider"/>
            <Section timestamp="7:50"/>
            <Section timestamp="8:45"/>
            <Section timestamp="9:40"/>
      </div>
    );
}
 
export default Playlist;