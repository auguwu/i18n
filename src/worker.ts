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

import type { EnvConfig } from './util/models';
import { Server, Logger } from './structures';
import { existsSync } from 'fs';
import { Features } from './util/Constants';
import { worker } from 'cluster';
import { parse } from '@augu/dotenv';
import { join } from 'path';
import Util from './util';
import os from 'os';

const logger = new Logger();
if (!Util.isNode10()) process.exit(1);
if (!existsSync(join(__dirname, '..', '.env'))) process.exit(1);

const config = parse<EnvConfig>({
  populate: false,
  delimiter: ',',
  file: join(__dirname, '..', '.env'),
  schema: {
    DATABASE_ACTIVE_CONNECTIONS: {
      default: 3,
      type: 'int'
    },
    GITHUB_CLIENT_SECRET: {
      default: undefined,
      type: 'string'
    },
    GITHUB_CALLBACK_URL: {
      default: undefined,
      type: 'string'
    },
    CLUSTER_WORKER_COUNT: {
      default: os.cpus().length,
      type: 'int'
    },
    ANALYTICS_FEATURES: {
      default: [],
      oneOf: Features,
      type: 'array'
    },
    CLUSTER_RETRY_LIMIT: {
      default: 5,
      type: 'int'
    },
    REDIS_PASSWORD: {
      default: undefined,
      type: 'string'
    },
    DATABASE_USERNAME: 'string',
    DATABASE_PASSWORD: 'string',
    GITHUB_CLIENT_ID: {
      default: undefined,
      type: 'string'
    },
    FRONTEND_URL: {
      default: 'https://localhost:3000',
      type: 'string'
    },
    CLUSTER_IPC_PORT: {
      default: 9934,
      type: 'int'
    },
    GITHUB_ENABLED: {
      default: false,
      type: 'boolean'
    },
    GITHUB_SCOPES: {
      default: undefined,
      type: 'array'
    },
    DATABASE_NAME: {
      default: 'monori',
      type: 'string'
    },
    DATABASE_HOST: 'string',
    DATABASE_PORT: 'int',
    REDIS_DB_ID: {
      default: 3,
      type: 'int'
    },
    REDIS_HOST: {
      default: 'localhost',
      type: 'string'
    },
    REDIS_PORT: {
      default: 6379,
      type: 'string'
    },
    ANALYTICS: {
      default: false,
      type: 'boolean'
    },
    NODE_ENV: {
      default: 'development',
      oneOf: ['development', 'production'],
      type: 'string'
    },
    PORT: {
      default: 4428,
      type: 'int'
    }
  }
});

const server = new Server(config);
server.listen(false);

process.on('SIGINT', () => {
  logger.warn(`Worker #${worker.id} | Closed worker process`);

  server.close();
  process.exit(0);
});
