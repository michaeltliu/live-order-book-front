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

export function UserDataPanel({roomUserData}) {

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
  const [quickSendVolume, setQuickSendVolume] = useState('');
  const [volumeBarC, setVolumeBarC] = useState(null);

  function width(volume) {
    const x = parseInt(volumeBarC);
    const c = x > 0 ? x : 100;
    return Math.atan(volume/c) * 200/Math.PI;
  }

  function sendBid(limit) {
    const volume = parseInt(quickSendVolume);
    if (volume > 0) {
      socket.emit('buy', limit, volume);
    }
  }

  function sendAsk(limit) {
    const volume = parseInt(quickSendVolume);
    if (volume > 0) {
      socket.emit('sell', limit, volume);
    }
  }

  function deleteLevel(side, level) {
    socket.emit('delete-level', side, level);
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
    let b = orderData.bids[i];
    let a = orderData.asks[i];
    return (
    <tr>
      <td onClick={() => deleteLevel('B', i)}>{ownBidVolume[i] || ""}</td>
      <td onClick={() => sendBid(i)} style={{direction:'rtl'}}>
        <div className="volume-bar" style={{width: `${width(b)}%`}}>{(b==null || b==0) ? "" : b}</div>
      </td>
      <td>{i}</td>
      <td onClick={() => sendAsk(i)}>
        <div className="volume-bar" style={{width: `${width(a)}%`}}>{(a==null || a==0) ? "" : a}</div>
      </td>
      <td onClick={() => deleteLevel('S', i)}>{ownAskVolume[i] || ""}</td>
    </tr>
    )
  })

  return (
    <div>
    <input type="text" value={quickSendVolume} placeholder="Volume" onChange={(e)=>setQuickSendVolume(e.target.value)} />
    <input type="text" value={volumeBarC} placeholder="Bar Length Setting" onChange={(e)=>setVolumeBarC(e.target.value)} />
    <div className="table-wrapper">
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
          x: bbo.t,
          y: bbo.bp,
          type: 'scatter',
          mode: 'markers',
          marker: {color: '#64d764'},
          name: 'Best bid'
        },
        {
          x: bbo.t,
          y: bbo.op,
          type: 'scatter',
          mode: 'markers',
          marker: {color: '#f85d5d'},
          name: 'Best offer'
        },
        {
          x: line_t.slice(1),
          y: util.repeatElements(bbo.bp).slice(0, -1),
          type: 'scatter',
          mode: 'lines',
          marker: {color: '#64d764'},
          showlegend: false,
          hoverinfo: 'skip'
        },
        {
          x: line_t.slice(1),
          y: util.repeatElements(bbo.op).slice(0, -1),
          type: 'scatter',
          mode: 'lines',
          marker: {color: '#f85d5d'},
          showlegend: false,
          hoverinfo: 'skip'
        },
        {
          x: ld.buy_t,
          y: ld.buy_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'green', symbol: 'triangle-up', size: 10},
          name: 'Last done buy aggressor',
        },
        {
          x: ld.sell_t,
          y: ld.sell_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'red', symbol: 'triangle-down', size: 10},
          name: 'Last done sell aggressor'
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
        plot_bgcolor: theme ? "#1d1d1d" : "white",
        paper_bgcolor: theme ? "#1d1d1d" : "white",
        font: {family:"Roboto", color: theme ? "white" : "black"}
      }}
    />
    </div>
  )
}

export function RoomInfo({roomInfo, playerData}) {
  const [settleValue, setSettleValue] = useState("");

  const leaderboard = Object.entries(playerData).map(([key, value]) => 
    <tr>
      <td>{key}</td>
      <td>{value.cash}</td>
      <td>{value.position}</td>
      <td>{settleValue ? (value.cash + value.position * settleValue || "") : ""}</td>
    </tr>
  );

  return (
    <div>
      <h2>Room Info</h2>
      <p>Room name: {roomInfo.room_name}</p>
      <p>Join code: {roomInfo.join_code}</p>
      <p>Creation time: {roomInfo.creation_time}</p>
      <br/>
      <input type="text" value={settleValue} name="settle-value" 
      placeholder="Settlement value" onChange={(e)=>setSettleValue(e.target.value)}/>
      <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Cash</th>
            <th>Position</th>
            <th>Profit/Loss</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard}
        </tbody>
      </table>
    </div>
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