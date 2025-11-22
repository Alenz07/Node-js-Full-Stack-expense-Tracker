const{Sequelize} = require("sequelize")
const sequelize = new Sequelize('first', 'root', process.env.DATABASEPASSWORD, {
    host: 'localhost',
    dialect: 'mysql',
    port: 3300
  });
  (async()=>{
    
    try{
        await sequelize.authenticate()
        console.log("Connected successfully")
    }
    catch(error){
        console.log("Some error")
    }
  }) ()
  module.exports = sequelize