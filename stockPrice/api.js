'use strict';

const { error } = require('console');
const { resolve } = require('path');

module.exports = function (app) {
  const https = require('http');
  const crypto = require('crypto');

  function hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  const likesData = {}; // in-memory storage for likes

  const fetchStockPrice = async (symbol) => {
    const apiUrl = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${symbol}/quote`;
    
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to feth stock price for ${symbol}: ${response.statusText}`);
      }
      const data = await response.json();
      if (data, data.latestPrice) {
        return data.latestPrice;
      } else {
        throw new Error(`Stock price not found for ${symbol}`);
      }
    } catch(err) {
        console.error('Error fetching stock price: ', err.message);
        throw error;
    }
  }

  app.route('/api/stock-prices')
    .get(async function (req, res){
      const { stock, like } = req.query;
      const userIP = hashIP(req.ip);
      console.log(stock, like, userIP);

      try {
        // handle single or dual stock queries
        const stocks = Array.isArray(stock) ? stock : [stock];
        const results = [];
        for (const symbol of stocks) {
          // fetch data from api
          const price = await fetchStockPrice(symbol);
          console.log(symbol, price);
          if (!likesData[symbol]) {
            likesData[symbol] = { likes: 0, likedBy: new Set() };
          }
          if (like == 'true' && !likesData[symbol].likedBy.has(userIP)) {
            likesData[symbol].likes++;
            likesData[symbol].likedBy.add(userIP);
          }
          results.push({
            stock: symbol,
            price,
            likes: likesData[symbol].likes,
          });
        }

        if (results.length === 1) {
          res.json({ stockData: results[0]});
        } else {
          const relLikes = results[0].likes - results[1].likes;
          res.json({
            stockData: [
              {...results[0], rel_likes: relLikes},
              {...results[1], rel_likes: -relLikes}
            ]
          })
        }
      } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Unable to fetch stock data' });
      }
    });
    
};
