const sequelize = require("../utils/database")

const{DataTypes} = require("sequelize")

const user = sequelize.define("forgot",{
    Resetid:{
        type: DataTypes.STRING
    }, 
email:{
    type:DataTypes.STRING
},
isActive:{
    type:DataTypes.STRING
}
})
module.exports = user