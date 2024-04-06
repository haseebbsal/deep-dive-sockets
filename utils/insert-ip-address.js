const client=require('../db-connection')

function insertIPAddress(ipAddress) {

    // const geoapifyResponse = await axios.get(`https://api.geoapify.com/v1/ipinfo?apiKey=282ccd3ee7ca4e0b94f2eed5d0b9c977&ip=${ipAddress}`);
    //     const locationName = geoapifyResponse.data.location?.country || 'Unknown Location';
    client.query('SELECT * FROM useripadd WHERE user_ip = $1', [ipAddress.ip], (selectError, selectResults) => {
        if (selectError) {
            // console.error('Error querying the database:', selectError);
            return;
        }
        if (selectResults.rows.length > 0) {
            // console.log(`IP Address already exists: ${ipAddress}`);
        } else {
            console.log("city", ipAddress.city)
            console.log("conticountry", ipAddress.country_name)
            console.log("Symbol", ipAddress.country_code)
            console.log("ip addrrss", ipAddress.ip)

            client.query('INSERT INTO useripadd(user_ip,user_city,user_continent_name,user_country_symbol,user_country) VALUES($1,$2,$3,$4,$5)', [ipAddress.ip, ipAddress.city, ipAddress.continent_name, ipAddress.country_code, ipAddress.country_name], (insertError, insertResults) => {
                if (insertError) {
                    // console.error('Error inserting IP address:', insertError);
                } else {
                    // console.log(`IP Address inserted: ${ipAddress}`);
                }
            });
        }
    });
}

module.exports=insertIPAddress