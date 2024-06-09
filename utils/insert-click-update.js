const client = require('../db-connection')
function insertClickOrUpdateData(clickData) {
    const selectQuery = `SELECT * FROM client_interaction_data WHERE user_ipaddress = $1 AND x_cordinate = $2 AND y_cordinate = $3 AND element = $4 AND action_type = $5 AND sessionid=$6`;
    const selectValues = [clickData.ip, clickData.x, clickData.y, clickData.element, clickData.type,clickData.sessionid];

    client.query(selectQuery, selectValues, (selectError, selectResults) => {
        if (selectError) {
            // console.error('Error executing the select query:', selectError);
            return;
        }

        // Process the results
        // console.log('Records retrieved:', selectResults.rows);
        let findingIfExists = selectResults.rows.length > 0 ? true : false
        // console.log(findingIfExists)
        const query = 'INSERT INTO client_interaction_data(x_cordinate, y_cordinate,action_type, element, user_ipaddress, date, time,count,userid,sessionid,sessiontime) VALUES($1, $2, $3, $4, $5 ,$6 ,$7,$8,$9,$10,$11)';
        const values = [clickData.x, clickData.y, clickData.type, clickData.element, clickData.ip, clickData.Date, clickData.timeStamp, 1, clickData.userId, clickData.sessionid,clickData.sessiontime];
        if (!findingIfExists) {
            client.query(query, values, (error, results) => {
                if (error) {
                    // console.error('Error inserting click event data:', error);
                } else {
                    // console.log(`${clickData.type} event data inserted ${values}`);
                }
                // client.end()
            });
        }
        else {

            let count = Number(selectResults.rows[0].count)
            // console.log(count)
            let updateValues = [clickData.ip, clickData.x, clickData.y, clickData.element, count + 1, clickData.userId, clickData.sessionid];
            const queryUpdate = `UPDATE client_interaction_data SET count=$5  WHERE user_ipaddress = $1 AND x_cordinate = $2 AND y_cordinate = $3 AND element = $4 AND userid = $6 AND sessionid=$7`
            client.query(queryUpdate, updateValues, (error, results) => {
                if (error) {
                    console.error('Error inserting click event data:', error);
                } else {

                    // console.log(`${clickData.type} event data updated ${values}`);
                }
                // client.end()
            });
        }
    });

    // client.end()


}

module.exports=insertClickOrUpdateData