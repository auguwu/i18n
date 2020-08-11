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

const { Dialect, pipelines } = require('@augu/maru');
const { Signale } = require('signale');
const Hash = require('./hash');

/**
 * Represents a [Database], which handles
 * all concurrent database connections with
 * PostgreSQL
 */
module.exports = class Database {
  /**
   * Creates a new [Database] instance
   * @param {import('./Server')} server The server instance
   */
  constructor(server) {
    /**
     * A Maru [Dialect] instance, which handles all of the connections
     * @type {Dialect}
     */
    this.dialect = new Dialect({
      activeConnections: 3,
      ...server.config.database
    });

    /**
     * Represents a [Signale] logger instance for this [Database] instance
     * @private
     * @type {import('signale').Signale}
     */
    this.logger = new Signale({ scope: 'Database' });

    /**
     * The server instance
     * @type {import('./Server')}
     */
    this.server = server;
  }

  /**
   * Getter to check if this [Database] instance is connected
   */
  get connected() {
    return this.connection !== undefined && this.connection.connected;
  }

  /**
   * Spawns a new connection to PostgreSQL
   */
  async connect() {
    if (this.connected) {
      this.logger.warn('There is already a connection already established');
      return;
    }

    this.connection = this.dialect.createConnection();
    await this.connection.connect()
      .catch(this.logger.error);
    
    this.logger.info('Connected to PostgreSQL!');
  }

  /**
   * Disposes this [Database] instance
   * @returns {Promise<void>}
   */
  dispose() {
    if (!this.connected) {
      this.logger.warn('Can\'t dispose this Database instance if it\'s not connected?');
      return;
    }

    return this.dialect.destroy();
  }

  /**
   * Gets a User model or `null` if not found
   * @param {'id' | 'email' | 'username'} type The type to use
   * @param {string} value The value to get
   * @returns {Promise<User | null>}
   */
  getUser(type, value) {
    return this.connection.query(pipelines.Select('users', [type, value]));
  }

  /**
   * Creates a new User model
   * @param {string} username The user's username
   * @param {string} password The user's password
   * @param {string} email The user's email
   * @returns {Promise<string>} The ID of the user that was created
   */
  async createUser(username, password, email) {
    const salt = Hash.createSalt(password, { digest: 'md5' });
    const id = Hash.createSnowflake(`${username}:${Date.now()}`);

    await this.connection.query(pipelines.Insert({
      values: {
        organisations: [],
        description: '',
        contributor: false,
        translator: false,
        createdAt: new Date(),
        projects: [],
        username,
        password,
        admin: false,
        email,
        salt,
        id
      },
      table: 'users'
    }));

    return id;
  }

  /**
   * Updates a user's account information
   * @param {string} username The user's username
   * @param {{ [x: string]: any }} data The data to supply
   * @returns {Promise<boolean>} If the update was successful or not
   */
  async updateUser(username, data) {
    const user = await this.getUser('username', username);
    const table = {};
    
    if (user === null) return false;
    if (data.hasOwnProperty('username') && user.username !== data.username) {
      const u = await this.getUser('username', data.username);
      if (u === null) {
        table.username = data.username;
      } else {
        throw new TypeError(`Username "${data.username}" is already taken`);
      }
    }
    
    if (data.hasOwnProperty('email') && user.email !== data.email) {
      const u = await this.getUser('email', data.email);
      if (u === null) {
        table.email = data.email;
      } else {
        throw new TypeError(`Email "${data.email}" is already taken`);
      }
    }

    if (data.hasOwnProperty('password') && user.password !== data.password) {
      const salt = Hash.createSalt(data.password, { digest: 'md5' });

      table.salt = salt;
      table.password = data.password;
    }

    if (data.hasOwnProperty('project') && !user.projects.includes(data.project)) {
      const projects = user.projects.concat([data.project]);
      table.projects = projects;
    }

    if (data.hasOwnProperty('organisation') && !user.organisations.includes(data.organisation)) {
      const orgs = user.organisations.concat([data.organisation]);
      table.organisations = orgs;
    }

    if (data.hasOwnProperty('contributor')) {
      if (!['yes', 'no'].includes(data.contributor)) throw new TypeError('Only accepting "yes" or "no"');
      table.contributor = data.contributor;
    }

    if (data.hasOwnProperty('translator')) {
      if (!['yes', 'no'].includes(data.translator)) throw new TypeError('Only accepting "yes" or "no"');
      table.translator = data.translator;
    }

    if (data.hasOwnProperty('description') && user.description !== data.description) {
      table.description = data.description;
    }

    return this.connection.query(pipelines.Update({
      returning: Object.keys(table),
      values: table,
      query: ['username', username],
      table: 'users',
      type: 'set'
    }))
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Removes a user from the database
   * @param {string} id The user's ID
   */
  deleteUser(id) {
    return this.connection.query(pipelines.Delete('users', ['id', id]));
  }

  /**
   * Creates a new project
   * @param {string} name The project's name
   * @param {string} id The ID of the owner
   * @returns {Promise<string>} The ID of the project that was created
   */
  async createProject(name, userID) {
    const id = Hash.createSnowflake(`${name}:${Date.now()}`);
    const user = await this.getUser('id', userID);
    const org = await this.getOrganisation(userID);

    if (user === null || org === null) throw new SyntaxError(`ID "${userID}" didn't cache as a user or organisation`);

    const sql = pipelines.Insert({
      values: {
        translations: {},
        createdAt: new Date(),
        owner: userID,
        type: isOrg ? 'org' : 'user',
        name,
        id
      },
      table: 'projects'
    });

    const table = user === null ? 'organisations' : 'users';
    const list = user === null ? org.projects : user.projects;
    list.push(name);

    const pipe = pipelines.Update({
      values: { projects: list },
      query: ['id', id],
      table,
      type: 'set'
    });

    const batch = this.connection.createBatch()
      .pipe(pipe)
      .pipe(sql);

    await batch.all(); // Executes the batch
    return id;
  }

  /**
   * Gets a project
   * @param {string} name The project's name
   * @returns {Promise<Project | null>} The project or `null` if it wasn't found
   */
  getProject(name) {
    return this.connection.query(pipelines.Select('projects', ['name', name]));
  }

  /**
   * Gets a list of user's projects
   * @param {string} id The user's ID
   * @returns {Promise<Project[]>} The projects created by the user or an empty array
   */
  getUserProjects(id) {
    return this.connection.query(pipelines.Select('projects', ['owner', id]), true)
      .then((results) => {
        if (results === null) return [];
        return results.filter(project => project.type === 'user');
      });
  }

  /**
   * Gets a list of the organisation's projects
   * @param {string} id The organisation's ID
   * @returns {Promise<Project[]>} The projects created by the org or an empty Array
   */
  getOrganisationProjects(id) {
    return this.connection.query(pipelines.Select('projects', ['owner', id]), true)
      .then(results => results === null ? [] : results.filter(p => p.type === 'org'));
  }

  /**
   * Removes a project from the user or organisation's project list and the database
   * @param {string} name The project's name
   * @returns {Promise<boolean>} If it was successful or not
   */
  async deleteProject(name) {
    const project = await this.getProject(name);
    if (project === null) return false;

    if (project.type === 'user') {
      const user = await this.getUser(project.owner);
      const index = user.projects.indexOf(name);
      if (index !== -1) user.projects.splice(index, 1);

      await this.connection.query(pipelines.Update({
        values: { projects: user.projects },
        query: ['id', project.owner],
        table: 'users',
        type: 'set'
      }));
    } else {
      const org = await this.getOrganisation(project.owner);
      const index = org.projects.indexOf(name);
      if (index !== -1) org.projects.splice(index, 1);

      await this.connection.query(pipelines.Update({
        values: { projects: org.projects },
        query: ['id', project.owner],
        table: 'organisations',
        type: 'set'
      }));
    }

    return this.connection.query(pipelines.Delete('projects', ['name', name]))
      .then(() => true)
      .catch(() => false);
  }
};

/**
 * @typedef {object} Organisation Represents the organisations model
 * @prop {OrgPermissions} permissions Object of the permissions by member
 * @prop {string[]} projects The list of projects this organisation has made
 * @prop {string[]} members A list of members (by their ID)
 * @prop {string} [github=null] GitHub organisation link
 * @prop {string} owner The owner's ID
 * @prop {string} name The organisation's name
 * @prop {string} id The organisation's ID
 * 
 * @typedef {object} Project Represents a user or organisation's project
 * @prop {Translations} translations Object of the project's translations (key: file name, value: translations itself as a string)
 * @prop {string} [github=null] GitHub repository URL (if needed)
 * @prop {string} owner The owner's ID
 * @prop {'organisation' | 'user'} type The type of project
 * @prop {string} name The project's name
 * @prop {string} id The project's ID
 * 
 * @typedef {object} User Represents a user's account
 * @prop {string[]} organisations How many organisations the user has made
 * @prop {boolean} contributor If they contributed to any project
 * @prop {string} description The user's description
 * @prop {boolean} translator If they made a translation project
 * @prop {string[]} projects How many projects the user has made
 * @prop {string} username The user's username
 * @prop {string} password The raw password
 * @prop {boolean} admin If the user is an adminstrator or not
 * @prop {string} email The user's email address
 * @prop {string} salt The salt to convert the password
 */