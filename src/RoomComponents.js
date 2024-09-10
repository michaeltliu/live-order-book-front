import {useState} from 'react'
import Plot from 'react-plotly.js'

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
        <button type="submit">Buy</button>
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
        <button type="submit">Sell</button>
      </form>
      {message}
    </>
  )
}

export function UserDataPanel({socket, roomUserData, setRoomId}) {

  function handleDeleteOrder(order_id) {
    socket.emit('delete', order_id);
  }

  function handleExit() {
    socket.emit('exit-room');
    setRoomId('');
  }

  const orderList = roomUserData.orders.map(order => 
    <p>
      {order.order_id}: {order.side} {order.quantity} @ {order.limit} 
      <button onClick={() => handleDeleteOrder(order.order_id)}>Delete Order</button>
    </p>
  );

  const tradeList = roomUserData.trades.map(trade => 
    <p>{trade.buyer_name} {trade.seller_name} {trade.volume} LOTS @ {trade.price}</p>
  );

  return (
    <>
      <p>Username: {roomUserData.username}</p>
      <p>User ID: {roomUserData.user_id}</p>
      <p>Cash: {roomUserData.cash}</p>
      <p>Position: {roomUserData.position}</p>
      Orders: <ul>{orderList}</ul>
      Trades: <ul>{tradeList}</ul>
      <button onClick={() => handleExit()}>Exit Room</button>
    </>
  )
}

export function OrderBook({socket, orderData, ownVolume, volume}) {
  
  function sendBid(limit) {
    socket.emit('buy', limit, volume || "0")
  }

  function sendAsk(limit) {
    socket.emit('sell', limit, volume || "0")
  }
  
  let ownBidVolume = {}
  let ownAskVolume = {}
  ownVolume.forEach(e => {
    if (e.side == 'BUY') {
      ownBidVolume[Math.floor(e.limit)] = (ownBidVolume[Math.floor(e.limit)] || 0) + e.quantity
    }
    else if (e.side == 'SELL') {
      ownAskVolume[Math.floor(e.limit)] = (ownAskVolume[Math.floor(e.limit)] || 0) + e.quantity
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
  )
}

export function PriceHistory({bboHistory, lastDones}) {
  
  return (
    <Plot 
      data={[
        {
          x: lastDones.buy_t.map((d) => new Date(d)),
          y: lastDones.buy_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'green', symbol: 'triangle-up', size: 9},
          name: 'Last done buy aggressor',
        },
        {
          x: lastDones.sell_t.map((d) => new Date(d)),
          y: lastDones.sell_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'red', symbol: 'triangle-down', size: 9},
          name: 'Last done sell aggressor'
        },
        {
          x: bboHistory.bb_t.map((d) => new Date(d)),
          y: bboHistory.bb_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'purple'},
          name: 'Best bid'
        },
        {
          x: bboHistory.bo_t.map((d) => new Date(d)),
          y: bboHistory.bo_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'purple'},
          name: 'Best offer'
        },
        {
          x: bboHistory.bt.map((d) => new Date(d)),
          y: bboHistory.bp,
          type: 'scatter',
          mode: 'lines',
          marker: {color: 'purple'},
          showlegend: false,
          hoverinfo: 'skip'
        },
        {
          x: bboHistory.ot.map((d) => new Date(d)),
          y: bboHistory.op,
          type: 'scatter',
          mode: 'lines',
          marker: {color: 'purple'},
          showlegend: false,
          hoverinfo: 'skip'
        }
      ]}
      layout={{
        title: 'Price History',
        uirevision: true,
        xaxis: {
          title: 'Time'
        },
        yaxis: {
          title: 'Price'
        }
      }}
    />
  )
}
