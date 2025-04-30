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


app.get('/', (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Página Inicial</title>
          </head>
          <body>
            <h1>Página Inicial</h1>
            <nav>
              <ul>
                <li><a href="/blocos"> Blocos</a></li>
                <li><a href="/moradores"> Moradores</a></li>
                <li><a href="/apartamentos"> Apartamentos</a></li>
              </ul>
            </nav>
          </body>
        </html>
      `);
    });
    

app.get('/blocos', (req, res) => {
    const nome = req.query.nome || '';
    const listar = nome ? 'SELECT * FROM blocos WHERE nome LIKE ?' : 'SELECT * FROM blocos';
    const params = nome ? [`%${nome}%`] : [];
    connection.query(listar, params, (err, rows) => {
        if (!err) {
            console.log("Consulta realizada com sucesso!");
            res.send(`
                <html>
                    <head>
                        <title>Pesquisa de Blocos</title>
                    </head>
                    <body>
                        <h1>Pesquisa de Blocos</h1>
                        <form method="GET" action="/blocos">
                            <label for="nome">Pesquisar:</label>
                            <input type="text" name="nome" value="${nome}">
                            <button type="submit">Pesquisar</button>
                            ${nome ? '<button type="button" onclick="window.location.href=\'/blocos\'">Voltar</button>' : ''}
                            <button type="button" onclick="window.location.href='/cadastrar'">Novo Bloco</button>
                        </form>
                        <table>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Descrição</th>
                                <th>Ações</th>
                            </tr>
                            ${rows.map(row => `
                                <tr>
                                    <td>${row.bloco_id}</td>
                                    <td>${row.nome}</td>
                                    <td>${row.descricao}</td>
                                    <td>
                                        <a href="/excluir/${row.bloco_id}">Excluir</a>
                                        <a href="/editar/${row.bloco_id}">Editar</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </body>
                </html>
            `);
        } else {
            console.error('Erro ao listar blocos:', err);
            res.status(500).send('Erro ao listar blocos.');
        }
    });
});

app.get('/cadastrar', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Cadastrar Novo Bloco</title>
            </head>
            <body>
                <h1>Cadastrar Novo Bloco</h1>
                <form method="POST" action="/cadastrar">
                    <label for="nome">Nome:</label><br>
                    <input type="text" name="nome" required><br><br>
                    <label for="descricao">Descrição:</label><br>
                    <input type="text" name="descricao" required><br><br>
                    <button type="submit">Cadastrar</button>
                </form>
                <button onclick="window.location.href='/blocos'">Voltar</button>
            </body>
        </html>
    `);
});

app.post('/cadastrar', (req, res) => {
    const { nome, descricao } = req.body;
    const sql = 'INSERT INTO blocos (nome, descricao) VALUES (?, ?)';
    connection.query(sql, [nome, descricao], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar bloco:', err);
            res.status(500).send('Erro ao cadastrar bloco.');
        } else {
            res.redirect('/blocos');
        }
    });
});

app.get('/excluir/:id', (req, res) => {
    const id = req.params.id;

    connection.query('DELETE FROM apartamentos WHERE bloco_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erro ao excluir os apartamentos:', err);
            res.status(500).send('Erro ao excluir os apartamentos.');
            return;
        }

        connection.query('DELETE FROM blocos WHERE bloco_id = ?', [id], (err, result) => {
            if (err) {
                console.error('Erro ao excluir o bloco:', err);
                res.status(500).send('Erro ao excluir o bloco.');
                return;
            }

            console.log("Bloco excluído com sucesso!");
            res.redirect('/blocos');
        });
    });
});

app.get('/editar/:id', (req, res) => {
    const id = req.params.id;
    const select = "SELECT * FROM blocos WHERE bloco_id = ?";
    connection.query(select, [id], (err, rows) => {
        if (!err) {
            if (rows.length > 0) {
                console.log("Bloco encontrado com sucesso!");
                res.send(`
                    <html>
                        <head>
                            <title>Editar Bloco</title>
                        </head>
                        <body>
                            <h1>Editar Bloco</h1>
                            <form action="/editar/${id}" method="POST">
                                <label for="nome">Nome:</label><br>
                                <input type="text" name="nome" value="${rows[0].nome}"><br><br>
                                <label for="descricao">Descrição:</label><br>
                                <input type="text" name="descricao" value="${rows[0].descricao}"><br><br>
                                <button type="submit">Salvar</button>
                            </form>
                            <button onclick="window.location.href='/blocos'">Voltar</button>
                        </body>
                    </html>
                `);
            } else {
                console.log('Nenhum bloco encontrado com o id fornecido.');
                res.send('Nenhum bloco encontrado.');
            }
        } else {
            console.error('Erro ao buscar o bloco:', err);
            res.status(500).send('Erro ao buscar o bloco.');
        }
    });
});

app.post('/editar/:id', (req, res) => {
    const id = req.params.id;
    const { nome, descricao } = req.body;
    const update = "UPDATE blocos SET nome = ?, descricao = ? WHERE bloco_id = ?";
    connection.query(update, [nome, descricao, id], (err, result) => {
        if (!err) {
            console.log("Bloco editado com sucesso!");
            res.redirect('/blocos');
        } else {
            console.error('Erro ao editar o bloco:', err);
            res.status(500).send('Erro ao editar o bloco.');
        }
    });
});

app.get('/apartamentos', (req, res) => {
    const numero = req.query.numero || '';
    const listar = numero ? 'SELECT * FROM apartamentos WHERE numero LIKE ?' : 'SELECT * FROM apartamentos';
    const params = numero ? [`%${numero}%`] : [];
    connection.query(listar, params, (err, rows) => {
        if (!err) {
            console.log("Consulta de apartamentos realizada com sucesso!");
            res.send(`
                <html>
                    <head>
                        <title>Relatório de Apartamentos</title>
                    </head>
                    <body>
                        <h1>Relatório de Apartamentos</h1>
                        <form method="GET" action="/apartamentos">
                            <label for="numero">Pesquisar por número:</label>
                            <input type="text" name="numero" value="${numero}">
                            <button type="submit">Pesquisar</button>
                            ${numero ? '<button type="button" onclick="window.location.href=\'/apartamentos\'">Voltar</button>' : ''}
                            <button type="button" onclick="window.location.href='/cadastrar-apartamento'">Novo Apartamento</button>
                        </form>
                        <table>
                            <tr>
                                <th>ID</th>
                                <th>Número</th>
                                <th>Bloco ID</th>
                                <th>Ações</th>
                            </tr>
                            ${rows.map(row => `
                                <tr>
                                    <td>${row.apartamento_id}</td>
                                    <td>${row.numero}</td>
                                    <td>${row.bloco_id}</td>
                                    <td>
                                        <a href="/excluir-apartamento/${row.apartamento_id}">Excluir</a>
                                        <a href="/editar-apartamento/${row.apartamento_id}">Editar</a>
                                    </td>
                                </tr>
                            `).join('')}
                        </table>
                    </body>
                </html>
            `);
        } else {
            console.error('Erro ao listar apartamentos:', err);
            res.status(500).send('Erro ao listar apartamentos.');
        }
    });
});

app.get('/cadastrar-apartamento', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Cadastrar Novo Apartamento</title>
            </head>
            <body>
                <h1>Cadastrar Novo Apartamento</h1>
                <form method="POST" action="/cadastrar-apartamento">
                    <label for="numero">Número:</label><br>
                    <input type="text" name="numero" required><br><br>
                    <label for="bloco_id">Bloco ID:</label><br>
                    <input type="number" name="bloco_id" required><br><br>
                    <button type="submit">Cadastrar</button>
                </form>
                <button onclick="window.location.href='/apartamentos'">Voltar</button>
            </body>
        </html>
    `);
});

app.post('/cadastrar-apartamento', (req, res) => {
    const { numero, bloco_id } = req.body;
    const sql = 'INSERT INTO apartamentos (numero, bloco_id) VALUES (?, ?)';
    connection.query(sql, [numero, bloco_id], (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar apartamento:', err);
            res.status(500).send('Erro ao cadastrar apartamento.');
        } else {
            res.redirect('/apartamentos');
        }
    });
});

app.get('/excluir-apartamento/:id', (req, res) => {
    const id = req.params.id;
    connection.query('DELETE FROM apartamentos WHERE apartamento_id = ?', [id], (err, result) => {
        if (err) {
            console.error('Erro ao excluir o apartamento:', err);
            res.status(500).send('Erro ao excluir o apartamento.');
        } else {
            console.log("Apartamento excluído com sucesso!");
            res.redirect('/apartamentos');
        }
    });
});

app.get('/editar-apartamento/:id', (req, res) => {
    const id = req.params.id;
    const select = "SELECT * FROM apartamentos WHERE apartamento_id = ?";
    connection.query(select, [id], (err, rows) => {
        if (!err) {
            if (rows.length > 0) {
                console.log("Apartamento encontrado com sucesso!");
                res.send(`
                    <html>
                        <head>
                            <title>Editar Apartamento</title>
                        </head>
                        <body>
                            <h1>Editar Apartamento</h1>
                            <form action="/editar-apartamento/${id}" method="POST">
                                <label for="numero">Número:</label><br>
                                <input type="text" name="numero" value="${rows[0].numero}"><br><br>
                                <label for="bloco_id">Bloco ID:</label><br>
                                <input type="number" name="bloco_id" value="${rows[0].bloco_id}"><br><br>
                                <button type="submit">Salvar</button>
                            </form>
                            <button onclick="window.location.href='/apartamentos'">Voltar</button>
                        </body>
                    </html>
                `);
            } else {
                console.log('Nenhum apartamento encontrado com o apartamento_id fornecido.');
                res.send('Nenhum apartamento encontrado.');
            }
        } else {
            console.error('Erro ao buscar o apartamento:', err);
            res.status(500).send('Erro ao buscar o apartamento.');
        }
    });
});



app.get('/moradores', (req, res) => {
      const nome = req.query.nome || '';
      const listar = nome ? 'SELECT * FROM moradores WHERE nome LIKE ?' : 'SELECT * FROM moradores';
      const params = nome ? [`%${nome}%`] : [];
      connection.query(listar, params, (err, rows) => {
        if (!err) {
          console.log("Consulta realizada com sucesso!");
          res.send(`
            <html>
              <head>
                <title>Pesquisa de Moradores</title>
              </head>
              <body>
                <h1>Pesquisa de Moradores</h1>
                <form method="GET" action="/moradores">
                  <label for="nome">Pesquisar:</label>
                  <input type="text" name="nome" value="${nome}">
                  <button type="submit">Pesquisar</button>
                  ${nome ? '<button type="button" onclick="window.location.href=\'/moradores\'">Voltar</button>' : ''}
                  <button type="button" onclick="window.location.href='/cadastrar'">Novo Morador</button>
                </form>
                <table>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Telefone</th>
                    <th>Email</th>
                    <th>Ações</th>
                  </tr>
                  ${rows.map(row => `
                    <tr>
                      <td>${row.morador_id}</td>
                      <td>${row.nome}</td>
                      <td>${row.cpf}</td>
                      <td>${row.telefone}</td>
                      <td>${row.email}</td>
                      <td>
                        <a href="/excluir/${row.morador_id}">Excluir</a>
                        <a href="/editar/${row.morador_id}">Editar</a>
                      </td>
                    </tr>
                  `).join('')}
                </table>
              </body>
            </html>
          `);
        } else {
          console.error('Erro ao listar moradores:', err);
          res.status(500).send('Erro ao listar moradores.');
        }
      });
    });
    
    app.get('/cadastrar', (req, res) => {
      res.send(`
        <html>
          <head>
            <title>Cadastrar Novo Morador</title>
          </head>
          <body>
            <h1>Cadastrar Novo Morador</h1>
            <form method="POST" action="/cadastrar">
              <label for="nome">Nome:</label><br>
              <input type="text" name="nome" required><br><br>
              <label for="cpf">CPF:</label><br>
              <input type="text" name="cpf" required><br><br>
              <label for="telefone">Telefone:</label><br>
              <input type="text" name="telefone"><br><br>
              <label for="email">Email:</label><br>
              <input type="email" name="email"><br><br>
              <button type="submit">Cadastrar</button>
            </form>
            <button onclick="window.location.href='/moradores'">Voltar</button>
          </body>
        </html>
      `);
    });
    
    app.post('/cadastrar', (req, res) => {
      const { nome, cpf, telefone, email } = req.body;
      const sql = 'INSERT INTO moradores (nome, cpf, telefone, email) VALUES (?, ?, ?, ?)';
      connection.query(sql, [nome, cpf, telefone, email], (err, result) => {
        if (err) {
          console.error('Erro ao cadastrar morador:', err);
          res.status(500).send('Erro ao cadastrar morador.');
        } else {
          res.redirect('/moradores');
        }
      });
    });
    
    app.get('/excluir/:id', (req, res) => {
      const id = req.params.id;
      connection.query('DELETE FROM moradores WHERE morador_id = ?', [id], (err, result) => {
        if (err) {
          console.error('Erro ao excluir morador:', err);
          res.status(500).send('Erro ao excluir morador.');
        } else {
          console.log("Morador excluído com sucesso!");
          res.redirect('/moradores');
        }
      });
    });
    
    app.get('/editar/:id', (req, res) => {
      const id = req.params.id;
      const select = "SELECT * FROM moradores WHERE morador_id = ?";
      connection.query(select, [id], (err, rows) => {
        if (!err) {
          if (rows.length > 0) {
            console.log("Morador encontrado com sucesso!");
            res.send(`
              <html>
                <head>
                  <title>Editar Morador</title>
                </head>
                <body>
                  <h1>Editar Morador</h1>
                  <form action="/editar/${id}" method="POST">
                    <label for="nome">Nome:</label><br>
                    <input type="text" name="nome" value="${rows[0].nome}"><br><br>
                    <label for="cpf">CPF:</label><br>
                    <input type="text" name="cpf" value="${rows[0].cpf}"><br><br>
                    <label for="telefone">Telefone:</label><br>
                    <input type="text" name="telefone" value="${rows[0].telefone}"><br><br>
                    <label for="email">Email:</label><br>
                    <input type="email" name="email" value="${rows[0].email}"><br><br>
                    <button type="submit">Salvar</button>
                  </form>
                  <button onclick="window.location.href='/moradores'">Voltar</button>
                </body>
              </html>
            `);
          } else {
            console.log('Nenhum morador encontrado com o id fornecido.');
            res.send('Nenhum morador encontrado.');
          }
        } else {
          console.error('Erro ao buscar o morador:', err);
          res.status(500).send('Erro ao buscar o morador.');
        }
      });
    });
    
    app.post('/editar/:id', (req, res) => {
      const id = req.params.id;
      const { nome, cpf, telefone, email } = req.body;
      const update = "UPDATE moradores SET nome = ?, cpf = ?, telefone = ?, email = ? WHERE morador_id = ?";
      connection.query(update, [nome, cpf, telefone, email, id], (err, result) => {
        if (!err) {
          console.log("Morador editado com sucesso!");
          res.redirect('/moradores');
        } else {
          console.error('Erro ao editar o morador:', err);
          res.status(500).send('Erro ao editar o morador.');
        }
      });
    });

app.listen(8083, () => {
    console.log("Servidor rodando na url http://localhost:8083");
});