const db = require("./banco")

const Produtos = db.sequelize.define("produtos",{
    id:{
        type: db.Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome:{
        type: db.Sequelize.STRING,
        allowNull:false
    },
    descricao:{
        type: db.Sequelize.STRING,
        allowNull: false
    },
    valor:{
        type: db.Sequelize.DOUBLE,
        allowNull: false
    },
    colecao:{
        type: db.Sequelize.STRING,
        allowNull: false
    },
})

//Produtos.sync({force: true})

module.exports = Produtos