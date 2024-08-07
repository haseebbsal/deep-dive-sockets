const express = require('express')
let app = express()
require('dotenv').config()
const http=require('http')
const { Server } = require('socket.io')
const client = require('./db-connection')
const insertClickOrUpdateData = require('./utils/insert-click-update')
const insertIPAddress=require('./utils/insert-ip-address')


app = http.createServer(app)
const io = new Server(app, {
    cors: {
        origin:'*'
    }
})


io.on('connection', (socket) => {
    console.log('User Connected')
    // console.log(socket.id)
    console.log('connection socketid', socket.handshake.auth.sessionid ? socket.handshake.auth.sessionid:socket.id);
    console.log('connection pageUrl', socket.handshake.auth.pageUrl)
    socket.on('disconnect', async () => {
        let sessionid = socket.handshake.auth.sessionid ? socket.handshake.auth.sessionid:socket.id
        try {
            const checkingSession = await client.query('SELECT * FROM sessionplayer where sessionid=$1', [sessionid])
            if (checkingSession.rows.length > 0) {
                if (checkingSession.rows[0].completed) {
                    console.log('session is completed so gonna use socket id that is created from server')
                    sessionid = socket.id
                }
            }
            
        }
        catch(e){
            console.log(e)
            console.log('error in checking session on disconnect')
        }
        const pageurl = socket.handshake.auth.pageUrl
        console.log('page on disconnection',pageurl)
        // console.log('sessionId',sessionid)
        console.log('user disconnected');
        client.query('SELECT isnavigated FROM sessionplayer where sessionid=$1', [sessionid], async (error, results) => {
            if (error) {
                console.log('Error in finding Navigaton')
            }
            else {
                if (results.rows.length > 0) {
                    console.log('sessionPlayer',results.rows[0])
                    if (!results.rows[0].isnavigated) {
                        const endedat = Date.now()
                        console.log('completed session because there was no navigation')
                        await client.query(`UPDATE sessionplayer SET completed=true , endedat=$2 WHERE sessionid = $1`, [sessionid, endedat])
                    }
                    else {
                        if (results.rows[0].isnavigated == pageurl) {
                            // console.log('click to navigate', results.rows[0].clicktonavigate)
                            const endedat=Date.now()
                            console.log('completed session because there was no navigation after we navigated')
                            await client.query(`UPDATE sessionplayer SET completed=true ,endedat=$2 WHERE sessionid = $1`, [sessionid,endedat])
                        }
                    }
                }
            }
        })
    });


    socket.on('on-mousemove', (msg) => {
        const mouseData = {
            type: msg.type,
            x: msg.x,
            y: msg.y,
            element: JSON.parse(msg.element),
            ip: msg.ip,
            userId: msg.userId,
            sessionid: msg.sessionid
        };
        let date = new Date()
        mouseData.timeStamp = `${date.toLocaleTimeString()}`
        mouseData.Date = `${date.toLocaleDateString()}`
        mouseData.sessiontime=date.getTime()

        insertClickOrUpdateData(mouseData,socket);
    });


    socket.on('on-scroll', (msg) => {
        const scrollData = {
            type: msg.type,
            x: msg.x,
            y: msg.y,
            ip: msg.ip,
            userId: msg.userId,
            sessionid: msg.sessionid
        };
        let date = new Date()
        scrollData.timeStamp = `${date.toLocaleTimeString()}`
        scrollData.Date = `${date.toLocaleDateString()}`
        scrollData.sessiontime = date.getTime()

        insertClickOrUpdateData(scrollData,socket);
    });


   

    socket.on('on-click', async (msg) => {
        console.log('type', msg.type)
        const clickData = {
            type: msg.type,
            x: msg.x,
            y: msg.y,
            element: JSON.parse(msg.element),
            ip: msg.ip,
            userId: msg.userId,
            sessionid:msg.sessionid
        };
        let date = new Date()
        clickData.timeStamp = `${date.toLocaleTimeString()}`
        clickData.Date = `${date.toLocaleDateString()}`
        clickData.sessiontime=date.getTime()
        if (msg.isNavigate) {
            const queryUpdate = `UPDATE sessionplayer SET isnavigated=$2  WHERE sessionid = $1`
            client.query(queryUpdate, [msg.sessionid, msg.isNavigate], (error, results) => {
                if (error) {
                    console.error('Error updating sessionplayer data:', error);
                } else {
                    console.log(`updated Navigation in session to ${msg.isNavigate}`)
                }
            });
        }
        // console.log(socket.handshake.auth.pageUrl)
       
        insertClickOrUpdateData(clickData,socket);
    });

   

    socket.on('AddDomain', (msg) => {
        let updateValues = [msg.userId, msg.domain];
        client.query('SELECT * FROM usersignup WHERE id = $1', [msg.userId], (selectError, selectResults) => {
            if (selectError) {
                console.error('Error querying the database:', selectError);
                return;
            }
            if (selectResults.rows.length > 0) {
                client.query('SELECT * FROM userdomains WHERE userid = $1 AND domains=$2', updateValues, (selectError, selectResults) => {
                    if (selectError) {
                        console.error('Error querying the database:', selectError);
                        return;
                    }
                    if (!(selectResults.rows.length > 0)) {
                        const queryUpdate = 'INSERT INTO userdomains(userid, domains) VALUES($1, $2)'
                        client.query(queryUpdate, updateValues, (error, results) => {
                            if (error) {
                                console.error('Error inserting click event data:', error);
                            } else {

                                console.log(`${msg.domain} inserted into the table `);
                            }
                            // client.end()
                        });
                    }
                });
            }
        });
    })

    socket.on('DomainVerification', (msg) => {

        client.query('SELECT * FROM userdomains WHERE userid = $1 AND domains=$2', [msg.userId, msg.domain], (selectError, selectResults) => {
            if (selectError) {
                console.error('Error querying the database:', selectError);
                return;
            }
            // console.log('userid domain verification search', selectResults.rows)
            if (selectResults.rows.length > 0) {
                client.query('SELECT isverified FROM userdomains WHERE userid = $1 AND domains=$2', [msg.userId, msg.domain], async (selectError, selectResults) => {
                    if (selectError) {
                        console.error('Error querying the database:', selectError);
                        return;
                    }
                    // console.log('userid domain verification search', selectResults.rows)
                    // socket.emit('serverDomainVerification', selectResults.rows[0].isverified)
                    if (selectResults.rows[0].isverified) {
                        if (!msg.sessionid) {
                            const startedat = Date.now()
                            await client.query('INSERT INTO sessionplayer(userid, domain,sessionid,startedat,country,countrycode) VALUES($1, $2,$3,$4,$5,$6)', [msg.userId, msg.domain, socket.id, startedat,msg.country,msg.countrycode])
                            console.log('Session Created sending socket id')
                            socket.emit('serverDomainVerification', {isverified: selectResults.rows[0].isverified,sessionid:socket.id })
                        }
                        else {
                            client.query('SELECT * FROM sessionplayer where sessionid=$1', [msg.sessionid], async (error, results) => {
                                if (error) {
                                    console.log('Error in finding sessionid')
                                }
                                else {
                                    if (results.rows.length > 0) {
                                        if (results.rows[0].completed) {
                                            console.log('session is completed , sending new socket id')
                                            const startedat = Date.now()
                                            await client.query('INSERT INTO sessionplayer(userid, domain,sessionid,startedat,country,countrycode) VALUES($1, $2,$3,$4,$5,$6)', [msg.userId, msg.domain, socket.id, startedat, msg.country, msg.countrycode])
                                            socket.emit('serverDomainVerification', { isverified: selectResults.rows[0].isverified,sessionid:socket.id })
                                        }
                                        else {
                                            // await client.query(`UPDATE sessionplayer SET clicktonavigate=false WHERE sessionid = $1`, [msg.sessionid])
                                            console.log('session is not completed , so using old socket id')
                                            socket.emit('serverDomainVerification', { isverified: selectResults.rows[0].isverified })
                                        }
                                    }
                                    else {
                                        console.log('session id doesnt exist in the table')
                                        const startedat=Date.now()
                                        await client.query('INSERT INTO sessionplayer(userid, domain,sessionid,startedat,country,countrycode) VALUES($1, $2,$3,$4,$5,$6)', [msg.userId, msg.domain, socket.id, startedat, msg.country, msg.countrycode])
                                        socket.emit('serverDomainVerification', { isverified: selectResults.rows[0].isverified, sessionid: socket.id })
                                    }
                                }
                            })
                        }
                    }
                    else {
                        socket.emit('serverDomainVerification', { isverified: selectResults.rows[0].isverified })
                    }
                });
            }
            else {
                socket.emit('serverDomainVerification', { isverified: false })
            }
        });
        // console.log('clientUserVerification', msg)
    });
    socket.on('reportIP', (msg) => {
        // console.log("Ip address to be inserted is",msg)
        insertIPAddress(msg,socket);
    });
})


async function startServer() {
    await client.connect()
    console.log('Database Connected')
    app.listen(process.env.PORT, () => {
        console.log(`Socket Server Started On Port ${process.env.PORT}`)
    })
}

startServer()