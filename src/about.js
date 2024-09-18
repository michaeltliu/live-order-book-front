import './App.css';
import {Link} from 'react-router-dom';

function About() {
    return (
        <div className="margin">
            <Link to="/">Login</Link>
            <h1>About LiveOrderBook.xyz</h1>
            <p>
                LiveOrderBook is built as a platform for betting on real-world events against friends. 
                Every room features its own simulated order book and exchange, allowing you to trade contracts
                in real-time. Whether you're betting on an NFL game or on random everyday prop bets, LiveOrderBook 
                offers a unique alternative to traditional casinos
                and sportsbooks. With no preset limitations or restrictions, every order book is a blank slate,
                giving you full control over the contracts you create and trade. To get started, create a room 
                and invite your friends. Submit orders, track market activity, and view price history all from the app. 
                Perfect for those who enjoy forecasting in a dynamic, fair marketplace!
            </p>
            <h3>Example Room 1</h3>
            <p>
                To bet on the upcoming presidential election, create a contract that settles
                to $1 if Kamala Harris is elected and $0 if Donald Trump is elected.
            </p>
            <h3>Example Room 2</h3>
            <p>
                To bet on how the Dallas Cowboys perform this season, create a contract that
                settles in dollars to the number of regular season games they win.
            </p>
            <h2>Roadmap &amp; Known Bugs</h2>
            <li>Popup box with stats for all the users in a room</li>
            <li>Configurable room setings</li>
            <li>Front end UI/UX, especially on mobile</li>
            <li>Handling inactive sessions and reconnects</li>
            <li>There may be a slight delay when joining a room after a period of server inactivity. 
                Please be patient and try pressing the join button a few times if it doesn't respond immediately.</li>
            <p>~ ML</p>
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLScy2ES7_4yuIXgXcxEG6SYfObsCP-ozWbd1cbmUmgY9H6LK7Q/viewform?embedded=true" 
            width="520" height="750" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>
        </div>
    )
}

export default About;