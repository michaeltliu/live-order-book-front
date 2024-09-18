export function reduceBBOHistory(bboHistory) {
  return bboHistory.reduce(
    (acc, bbo) => {
      const bboTime = new Date(bbo.bbo_time);
      acc.t.push(bboTime);
      acc.bp.push(bbo.best_bid);
      acc.op.push(bbo.best_offer);

      return acc;
    },
    { t: [], bp: [], op: []}
  )
}

export function reduceLastDones(lastDones) {
  return lastDones.reduce(
    (acc, trade) => {
      const creationTime = new Date(trade.creation_time);
  
      if (trade.buy_aggr) {
        acc.buy_t.push(creationTime);
        acc.buy_p.push(trade.price);
      } else {
        acc.sell_t.push(creationTime);
        acc.sell_p.push(trade.price);
      }
  
      return acc;
    },
    { buy_t: [], buy_p: [], sell_t: [], sell_p: [] }
  );
}

export function repeatElements(arr, k=2) {
  const result = new Array(arr.length * k);
  let index = 0;

  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < k; j++) {
      result[index++] = arr[i];
    }
  }

  return result;
}