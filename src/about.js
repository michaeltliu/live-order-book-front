import './App.css';

function About() {
    return (
        <div>
            <h1>About LiveOrderBook.xyz</h1>
            <p>
                LiveOrderBook is a social prediction market for sports, politics, or anything you want. 
                Every room features its own simulated order book and exchange, allowing you to trade contracts against friends
                in real-time. Whether you're betting on an NFL game or on random everyday prop bets, LiveOrderBook 
                offers a unique alternative to traditional casinos and sportsbooks. With no preset limitations, 
                every order book is a blank slate, giving you full control over what you want to bet on. To get started, create a room 
                and invite your friends. Submit orders, track market activity, and view price history all from the app. 
                Perfect for those who enjoy forecasting in a dynamic, fair marketplace.
            </p>
            <h3>Example Room 1</h3>
            <p>
                To bet on the upcoming presidential election, create a contract that settles
                to $1 if Kamala Harris is elected and $0 if Donald Trump is elected.
            </p>
            <h3>Example Room 2</h3>
            <p>
                To bet on how the Dallas Cowboys perform this season, create a contract that
                settles in dollars to the number of regular season games they win. For bigger price swings, let the contract 
                pay a dollar for each regular season win over 5, if any.
            </p>
            <h2>Roadmap &amp; Known Bugs</h2>
            <li>Configurable room setings</li>
            <li>Front end UI/UX, especially on mobile</li>
            <li>Handling inactive sessions, page refreshes, and reconnects</li>
            <p>~ ML</p>
            <iframe src="https://docs.google.com/forms/d/e/1FAIpQLScy2ES7_4yuIXgXcxEG6SYfObsCP-ozWbd1cbmUmgY9H6LK7Q/viewform?embedded=true" 
            width="450" height="750" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>
        </div>
    )
}

export default About;