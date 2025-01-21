const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    suite('GET /api/stock-prices/', () => {
        // Test 1: Viewing one stock
        test('Viewing one stock: GET /api/stock-prices/', (done) => {
          chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: 'aapl' }) // Example stock symbol
            .end((err, res) => {
              assert.strictEqual(res.status, 200, 'Response status should be 200');
              assert.strictEqual(typeof res.body.stockData, 'object', 'Response should include stockData as an object');
              assert.strictEqual(res.body.stockData.stock, 'aapl', 'Stock symbol should be AAPL');
              assert.strictEqual(typeof res.body.stockData.price, 'number', 'Price should be a number');
              done();
            });
        });
    
        // Test 2: Viewing one stock and liking it
        test('Viewing one stock and liking it: GET /api/stock-prices/', (done) => {
          chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: 'aapl', like: 'true' }) // Like Apple stock
            .end((err, res) => {
              assert.strictEqual(res.status, 200, 'Response status should be 200');
              assert.strictEqual(res.body.stockData.stock, 'aapl', 'Stock symbol should be AAPL');
              assert.strictEqual(typeof res.body.stockData.likes, 'number', 'Likes should be a number');
              assert.ok(res.body.stockData.likes > 0, 'Likes should increase');
              done();
            });
        });
    
        // Test 3: Viewing the same stock and liking it again
        test('Viewing the same stock and liking it again: GET /api/stock-prices/', (done) => {
          chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: 'aapl', like: 'true' }) // Like Apple stock again
            .end((err, res) => {
              assert.strictEqual(res.status, 200, 'Response status should be 200');
              assert.strictEqual(res.body.stockData.stock, 'aapl', 'Stock symbol should be AAPL');
              const firstLikes = res.body.stockData.likes;
    
              // Attempt to like again
              chai.request(server)
                .get('/api/stock-prices')
                .query({ stock: 'aapl', like: 'true' })
                .end((err2, res2) => {
                  assert.strictEqual(res2.status, 200, 'Response status should be 200');
                  assert.strictEqual(res2.body.stockData.likes, firstLikes, 'Likes should not increase for the same IP');
                  done();
                });
            });
        });
    
        // Test 4: Viewing two stocks
        test('Viewing two stocks: GET /api/stock-prices/', (done) => {
          chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: ['aapl', 'msft'] }) // Compare Apple and Microsoft stocks
            .end((err, res) => {
              assert.strictEqual(res.status, 200, 'Response status should be 200');
              assert.strictEqual(Array.isArray(res.body.stockData), true, 'Response should include stockData as an array');
              assert.strictEqual(res.body.stockData.length, 2, 'Response array should contain two stock objects');
              assert.strictEqual(res.body.stockData[0].stock, 'aapl', 'First stock symbol should be AAPL');
              assert.strictEqual(res.body.stockData[1].stock, 'msft', 'Second stock symbol should be MSFT');
              assert.strictEqual(
                typeof res.body.stockData[0].rel_likes,
                'number',
                'Relative likes should be a number'
              );
              done();
            });
        });
    
        // Test 5: Viewing two stocks and liking them
        test('Viewing two stocks and liking them: GET /api/stock-prices/', (done) => {
          chai.request(server)
            .get('/api/stock-prices')
            .query({ stock: ['aapl', 'msft'], like: 'true' }) // Like both Apple and Microsoft stocks
            .end((err, res) => {
              assert.strictEqual(res.status, 200, 'Response status should be 200');
              assert.strictEqual(Array.isArray(res.body.stockData), true, 'Response should include stockData as an array');
              assert.strictEqual(res.body.stockData.length, 2, 'Response array should contain two stock objects');
              assert.strictEqual(res.body.stockData[0].stock, 'aapl', 'First stock symbol should be AAPL');
              assert.strictEqual(res.body.stockData[1].stock, 'msft', 'Second stock symbol should be MSFT');
              assert.ok(
                res.body.stockData[0].likes > 0 && res.body.stockData[1].likes > 0,
                'Likes should increase for both stocks'
              );
              done();
            });
        });
      });
});
