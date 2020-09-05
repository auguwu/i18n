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

import type { Server } from '../structures';
import { OPCodes } from '../util/Constants';
import { Router } from 'express';

interface WorkerStats {
  heap: string;
  rss: string;
  cpu: { system: string; user: string; }
  id: number;
}

const router = Router();
router.get('/', (_, res) => res.status(200).json({
  worker: `#${process.env.CLUSTER_ID}`,
  gang: true,
  env: process.env.NODE_ENV
}));

router.get('/health', async (req, res) => {
  const server: Server = req.app.locals.server;

  return res.status(200).json({
    database: server.database.online,
    workers: server.clusters.workers.map(worker => ({
      healthy: worker.healthy,
      online: worker.online,
      id: `#${worker.id}`
    })),
    redis: server.redis.online,
    gc: server.config.analytics.enabled ? server.analytics.gc : null
  });
});

export default { path: '', router };
