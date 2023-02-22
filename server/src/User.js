const ColorEncoder = require("./ColorEncoder.js");
const { uuid } = require("uuidv4");
const { promisify } = require("util");
const md5 = require("md5");
let userdb;
class User {
  constructor(cl) {
    this.cl = cl;
    this.server = this.cl.server;
    this.userdb = userdb;
    this.default_db = {};
  }
  async getUserData() {
    if (!userdb || (userdb instanceof Map && [...userdb.entries()] == [])) {
      await this.setUpDb();
    }
    let _id = md5(this.cl.server._id_Private_Key + this.cl.ip);
    let whattouse;
    whattouse = _id;
    let usertofind = userdb.get(whattouse);
    if (!usertofind) {
      if (
        typeof usertofind == "object" &&
        usertofind.hasOwnProperty("name") &&
        usertofind.name != this.server.defaultUsername
      )
        return;
      userdb.set(whattouse, {
        color: `#${ColorEncoder.intToRGB(
          ColorEncoder.hashCode(_id)
        ).toLowerCase()}`,
        name: this.server.defaultUsername,
        _id: _id,
        tag: undefined,
        token: _id + "." + uuid(),
        permissions:{},
        vanished: false,
        rank: "member",
        ip: this.cl.ip,
      });
      this.updatedb();
    }
    let user = userdb.get(whattouse);
    return {
      color: user.color,
      name: user.name,
      _id: user._id,
      tag: user.tag,
      permissions: user.permissions,
      //token: user.token,
      rank: user.rank,
      vanished: user.vanished,
    };
  }
  async updatedb() {
    const writeFile = promisify(fs.writeFile);
    await writeFile(
      "src/db/users.json",
      JSON.stringify(User.strMapToObj(userdb), null, 2)
    );
    //console.log(JSON.stringify(User.strMapToObj(userdb), null, 2))
  }
  async setUpDb() {
    const writeFile = promisify(fs.writeFile);
    const readdir = promisify(fs.readdir);
    let files = await readdir("src/db/");
    if (!files.includes("users.json")) {
      await writeFile(
        "src/db/users.json",
        JSON.stringify(this.default_db, null, 2)
      );
      userdb = new Map(Object.entries(require("./db/users.json")));
    } else {
      userdb = new Map(Object.entries(require("./db/users.json")));
    }
  }
  static strMapToObj(strMap) {
    return [...strMap.entries()].reduce(
      (obj, [key, value]) => ((obj[key] = value), obj),
      {}
    );
  }
}
module.exports = User;
