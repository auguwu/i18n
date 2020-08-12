/**
 * Copyright (c) 2020 August
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { version } = require('../../package.json');
const { Router } = require('../structures');

const router = new Router('/');

// Why aren't we using arrow functions?
//
// Well, this router has a custom `this`
// context (the server instance), so
// if we wanna access the database, then we use `function`
// instead of arrow functions, if you don't need to do anything
// with the server, use arrow functions
router.get('/', function (_, res) {
  // this looks ugly but i could care less lol
  const endpoints = [];
  this.routes.forEach(router => {
    endpoints.push(...router.getEndpoints());
  });
  
  return res.status(200).send({
    statusCode: 200,
    message: 'Visit the documentation at https://github.com/auguwu/Monori/tree/master/docs/API.md',
    version: `v${version}`,
    endpoints
  });
});

router.get('/favicon.ico', () => res.status(404).send('Cannot GET /favicon.ico'));

module.exports = router;