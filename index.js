const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
 
 
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'gestaoCondominios',
    port: 3306
});

connection.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados!');
    }
});

connection.connect(function(err){
    if(err){
        console.error('Erro ', err);
        return
    }
    console.log("Conexão ok")
});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json())
app.use(express.urlencoded({extended: true}));

app.listen(8083, function(){
    console.log("Servidor rodando na url http://localhost:8083")
})