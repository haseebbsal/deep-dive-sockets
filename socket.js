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
    console.log(socket.id)
    socket.on('disconnect', () => {
        console.log('user disconnected');
        console.log(socket.id)
    });


    socket.on('on-mousemove', (msg) => {
        const mouseData = {
            type: msg.type,
            x: msg.x,
            y: msg.y,
            element: JSON.parse(msg.element),
            ip: msg.ip,
            userId: msg.userId
        };
        let date = new Date()
        mouseData.timeStamp = `${date.toLocaleTimeString()}`
        mouseData.Date = `${date.toLocaleDateString()}`

        insertClickOrUpdateData(mouseData);
    });




    socket.on('on-click', (msg) => {
        console.log('type', msg.type)
        const clickData = {
            type: msg.type,
            x: msg.x,
            y: msg.y,
            element: JSON.parse(msg.element),
            ip: msg.ip,
            userId: msg.userId
        };
        let date = new Date()
        clickData.timeStamp = `${date.toLocaleTimeString()}`
        clickData.Date = `${date.toLocaleDateString()}`
        insertClickOrUpdateData(clickData);
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
            console.log('userid domain verification search', selectResults.rows)
            if (selectResults.rows.length > 0) {
                client.query('SELECT isverified FROM userdomains WHERE userid = $1 AND domains=$2', [msg.userId, msg.domain], (selectError, selectResults) => {
                    if (selectError) {
                        console.error('Error querying the database:', selectError);
                        return;
                    }
                    console.log('userid domain verification search', selectResults.rows)
                    socket.emit('serverDomainVerification', selectResults.rows[0].isverified)
                    
                 
                    
                });
            }
            else {
                socket.emit('serverDomainVerification', false)
            }
        });
        console.log('clientUserVerification', msg)
    });



    socket.on('reportIP', (msg) => {
        // console.log("Ip address to be inserted is",msg)
        insertIPAddress(msg);
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