const client = require('../db-connection')
async function insertClickOrUpdateData(clickData,socket) {
    if (clickData.type != 'scroll') {
        const selectQuery = `SELECT * FROM client_interaction_data WHERE user_ipaddress = $1 AND x_cordinate = $2 AND y_cordinate = $3 AND element = $4 AND action_type = $5 AND sessionid=$6`;
        const selectValues = [clickData.ip, clickData.x, clickData.y, clickData.element, clickData.type, clickData.sessionid];

        client.query(selectQuery, selectValues, (selectError, selectResults) => {
            if (selectError) {
                // console.error('Error executing the select query:', selectError);
                return;
            }

            // Process the results
            // console.log('Records retrieved:', selectResults.rows);
            let findingIfExists = selectResults.rows.length > 0 ? true : false
            // console.log(findingIfExists)
            const query = 'INSERT INTO client_interaction_data(x_cordinate, y_cordinate,action_type, element, user_ipaddress, date, time,count,userid,sessionid,sessiontime,domain) VALUES($1, $2, $3, $4, $5 ,$6 ,$7,$8,$9,$10,$11,$12)';
            const values = [clickData.x, clickData.y, clickData.type, clickData.element, clickData.ip, clickData.Date, clickData.timeStamp, 1, clickData.userId, clickData.sessionid, clickData.sessiontime, new URL(socket.handshake.auth.pageUrl).origin];
            client.query(query, values, (error, results) => {
                if (error) {
                    // console.error('Error inserting click event data:', error);
                } else {
                    // console.log(`${clickData.type} event data inserted ${values}`);
                }
                // client.end()
            });
            
        });
    }
    else {
        const query = 'INSERT INTO client_interaction_data(scrollx,scrolly,action_type, user_ipaddress, date, time,count,userid,sessionid,sessiontime,domain) VALUES($1, $2, $3, $4, $5 ,$6 ,$7,$8,$9,$10,$11)'
        const data = [clickData.x, clickData.y, clickData.type, clickData.ip, clickData.Date, clickData.timeStamp, 1, clickData.userId, clickData.sessionid, clickData.sessiontime, new URL(socket.handshake.auth.pageUrl).origin]
        try {
            await client.query(query,data)
        }
        catch (e) {
            console.log(e)
            console.log('error in adding scroll data')
        }
    }
    // client.end()


}

module.exports=insertClickOrUpdateData