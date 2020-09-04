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

import { Middleware, Stopwatch } from '../structures';
import onFinished from 'on-finished';

const mod: Middleware = (req, res, next) => {
  next();

  const { method, originalUrl } = req;
  const stopwatch = new Stopwatch();
  stopwatch.start();

  onFinished(res, (error, resp) => {
    if (error) return;

    const { statusCode } = resp;
    const level = statusCode >= 500
      ? 'error'
      : statusCode >= 400
        ? 'warn'
        : statusCode >= 300
          ? 'info'
          : 'info';

    const time = stopwatch.end();
    const { server } = req.app.locals;
    const message = `Request made to "${method} ${originalUrl}" (~${time.toFixed(2)}ms) | User-Agent: ${req.headers['user-agent'] || 'None Set'}`;

    server.logger[level].apply(server.logger, [message]);
  });
};

export default mod;
