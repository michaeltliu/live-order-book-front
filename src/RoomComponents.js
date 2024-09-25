import {useState, useContext, useEffect} from 'react'
import {ThemeContext} from './ThemeContext.js'
import Plot from 'react-plotly.js'
import * as util from './util.js'

export function RoomMenu({handleExit, setPopupOpen}) {
  return (
    <ul className="menu-bar">
      <li><a onClick={() => setPopupOpen(1)}>
        <span className="material-symbols-outlined">monitoring</span>
        <span>Price History</span>
      </a></li>
      <li><a onClick={() => setPopupOpen(2)}>
        <div className="material-symbols-outlined">receipt</div>
        Orders
      </a></li>
      <li><a onClick={() => setPopupOpen(3)}>
        <div className="material-symbols-outlined">history</div>
        Trades
      </a></li>
      <li><a onClick={() => setPopupOpen(4)}>
        <div className="material-symbols-outlined">leaderboard</div>
        Room Info
      </a></li>
      <li><a onClick={handleExit}>
        <div className="material-symbols-outlined">door_open</div>
        Exit Room
      </a></li>
    </ul>
  )
}

export function BuyForm({socket}) {
  const [limitInput, setLimitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (limitInput.trim() !== "" && quantityInput.trim() !== "") {
      socket.emit('buy', limitInput, quantityInput, response => {
        setMessage(response);
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="text" value={limitInput} name="limit" 
        placeholder="Limit Price" onChange={(e)=>setLimitInput(e.target.value)}/><br/>
        <input type="text" value={quantityInput} name="quantity" 
        placeholder="Quantity" onChange={(e)=>setQuantityInput(e.target.value)} /><br/>
        <button class="buy" type="submit">Buy</button>
      </form>
      {message}
    </>
  )
}

export function SellForm({socket}) {
  const [limitInput, setLimitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (limitInput.trim() !== "" && quantityInput.trim() !== "") {
      socket.emit('sell', limitInput, quantityInput, response => {
        setMessage(response);
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="text" value={limitInput} name="limit" 
        placeholder="Limit Price" onChange={(e)=>setLimitInput(e.target.value)}/><br/>
        <input type="text" value={quantityInput} name="quantity" 
        placeholder="Quantity" onChange={(e)=>setQuantityInput(e.target.value)} /><br/>
        <button class="sell" type="submit">Sell</button>
      </form>
      {message}
    </>
  )
}

export function UserDataPanel({socket, roomUserData}) {

  return (
    <div>
      <p>Username: {roomUserData.username}</p>
      <p>User ID: {roomUserData.user_id}</p>
      <p>Cash: {roomUserData.cash}</p>
      <p>Position: {roomUserData.position}</p>
    </div>
  )
}

export function Orders({socket, orders}) {
  function handleDeleteOrder(side, order_id) {
    socket.emit('delete', side, order_id);
  }
  const orderList = orders.map(order => 
    <p>
      {order.creation_time}: {order.side} {order.quantity} @ {order.limit_price} 
      <button onClick={() => handleDeleteOrder(order.side, order.id)}>Delete Order</button>
    </p>
  );
  return (
    <div>
      <h2>Orders</h2>
      <ul>{orderList}</ul>
    </div>
  )
}

export function Trades({trades}) {
  const tradeList = trades.map(trade => 
    <p>{trade.buyer_id} {trade.seller_id} {trade.volume} LOTS @ {trade.price}</p>
  );
  return (
    <div>
      <h2>Trades</h2>
      <ul>{tradeList}</ul>
    </div>
  )
}

export function OrderBook({socket, orderData, ownVolume}) {
  const [quickSendVolume, setQuickSendVolume] = useState(1);
  
  function sendBid(limit) {
    socket.emit('buy', limit, quickSendVolume || "0")
  }

  function sendAsk(limit) {
    socket.emit('sell', limit, quickSendVolume || "0")
  }
  
  let ownBidVolume = {}
  let ownAskVolume = {}
  ownVolume.forEach(e => {
    if (e.side == 'B') {
      ownBidVolume[Math.floor(e.limit_price)] = (ownBidVolume[Math.floor(e.limit_price)] || 0) + e.quantity
    }
    else if (e.side == 'S') {
      ownAskVolume[Math.floor(e.limit_price)] = (ownAskVolume[Math.floor(e.limit_price)] || 0) + e.quantity
    }
  });

  const rows = Array(100).fill().map((_,ind) => { 
    let i = 99 - ind;
    return (
    <tr>
      <td>{ownBidVolume[i] || ""}</td>
      <td onClick={() => sendBid(i)}>{(orderData.bids[i]==null || orderData.bids[i]==0) ? "" : orderData.bids[i]}</td>
      <td>{i}</td>
      <td onClick={() => sendAsk(i)}>{(orderData.asks[i]==null || orderData.asks[i]==0) ? "" : orderData.asks[i]}</td>
      <td>{ownAskVolume[i] || ""}</td>
    </tr>
    )
  }
  )

  return (
    <div>
    <input type="text" value={quickSendVolume} placeholder="Volume" onChange={(e)=>setQuickSendVolume(e.target.value)} />
    <div className="order-book-wrapper">
      <table>
        <thead>
          <tr>
            <th>Own Bid</th>
            <th>Bid Volume</th>
            <th>Price</th>
            <th>Ask Volume</th>
            <th>Own Ask</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
    </div>
  )
}

export function PriceHistory({bboHistory, lastDones}) {
  const ld = util.reduceLastDones(lastDones);
  const bbo = util.reduceBBOHistory(bboHistory);
  const line_t = util.repeatElements(bbo.t);

  const { theme } = useContext(ThemeContext); 

  return (
    <div className="price-history-container">
    <Plot 
      data={[
        {
          x: ld.buy_t,
          y: ld.buy_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'green', symbol: 'triangle-up', size: 9},
          name: 'Last done buy aggressor',
        },
        {
          x: ld.sell_t,
          y: ld.sell_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'red', symbol: 'triangle-down', size: 9},
          name: 'Last done sell aggressor'
        },
        {
          x: bbo.t,
          y: bbo.bp,
          type: 'scatter',
          mode: 'markers',
          marker: {color: '#75E475'},
          name: 'Best bid'
        },
        {
          x: bbo.t,
          y: bbo.op,
          type: 'scatter',
          mode: 'markers',
          marker: {color: '#FF7171'},
          name: 'Best offer'
        },
        {
          x: line_t.slice(1),
          y: util.repeatElements(bbo.bp).slice(0, -1),
          type: 'scatter',
          mode: 'lines',
          marker: {color: '#75E475'},
          showlegend: false,
          hoverinfo: 'skip'
        },
        {
          x: line_t.slice(1),
          y: util.repeatElements(bbo.op).slice(0, -1),
          type: 'scatter',
          mode: 'lines',
          marker: {color: '#FF7171'},
          showlegend: false,
          hoverinfo: 'skip'
        }
      ]}
      layout={{
        title: 'Price History',
        uirevision: true,
        xaxis: {
          title: 'Time',
        },
        yaxis: {
          title: 'Price'
        },
        plot_bgcolor: theme ? "#242424" : "white",
        paper_bgcolor: theme ? "#242424" : "white",
        font: {family:"Roboto", color: theme ? "white" : "black"}
      }}
    />
    </div>
  )
}

export function RoomInfo({roomInfo, playerData}) {
  const [settleValue, setSettleValue] = useState();

  const leaderboard = Object.entries(playerData).map(([key, value]) => 
    <p>
      {key}: Cash {value.cash} position {value.position} 
    </p>
  );

  return (
    <div>
      <h2>Room Info</h2>
      <p>Room name: {roomInfo.room_name}</p>
      <p>Join code: {roomInfo.join_code}</p>
      <p>Creation time: {roomInfo.creation_time}</p>
      <ul>
        {leaderboard}
      </ul>
    </div>
  )
}

export function Popup({popupOpen, setPopupOpen, children}) {
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (popupOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    }
  }, [popupOpen])

  return (
    <div className="modal-overlay">
      <div className={`modal ${theme ? 'dark' : ''}`}>
        <button className="close-button" onClick={() => setPopupOpen(0)}>&times;</button>
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  )
}