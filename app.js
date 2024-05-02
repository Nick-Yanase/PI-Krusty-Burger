//require do express e handlebars
const express = require("express");
const app = express();
const session = require("express-session");
const path = require("path");
const post = require('./models/post');
const produto = require('./models/produto')
const bcrypt = require('bcryptjs')
const handlebars = require("express-handlebars").engine;

const { resolveSOA } = require("dns");

//criando a sessão
app.use(session({
  secret: 'sua-chave-secreta',
  resave: false,
  saveUninitialized: false
}));

//require do body-parser para pegar os dados do form
const bodyParser = require("body-parser");

//config engines
app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//definindo acesso a pasta publica
app.use(express.static("public"));

//config do bodyparser para leitura do post
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//rota inicial
app.get("/", (req, res) => {
  produto.findAll().then((produto)=>{
    res.render("index");
  }).catch((erro)=>{
    console.log("erro ao buscar usuarios:" + erro);
      res.status(500).send("Erro ao buscar usuarios");
  })
});

app.get('/carrinho', (req,res)=>{
  res.render('cart')
})


app.get("/cadastrarProduto", (req, res) => {
  res.render("cadProduto");
});

//rota post Cadastrar produto
app.post("/cadastrarProd", (req, res) => {
  produto.create({
    nome: req.body.nome,
    descricao: req.body.descricao,
    valor: req.body.valor,
    colecao: req.body.colecao,
  })
    .then(() => {
      res.redirect("/cadastrarProduto");
    })
    .catch((erro) => {
      console.log("Falha ao cadastrar os dados" + erro);
    });
});
//rota cadastro
app.get("/signin", (req, res) => {
  res.render("signin");
});


app.get("/editarProduto/:id", (req, res) => {
  const produtoId = req.params.id;
  produto.findByPk(produtoId)
    .then((produtos) => {
      res.render("editarProduto", { produto : produtos });
    })
    .catch((erro) => {
      console.error("Erro ao buscar usuario para ediçao", erro);
    });
});

app.post("/editarProd/:id", (req, res) => {
  const produtoId = req.params.id;
  const { nome, descricao, valor, colecao } = req.body;
  produto.update(
    { nome, descricao, valor, colecao },
    { where: { id: produtoId } }
  )
    .then(() => {
      res.redirect("/listar");
    })
    .catch((err) => {
      console.error("Erro ao atualizar usuário:", err);
      res.status(500).send("Erro ao atualizar usuário");
    });
});

//metodo post do signin
app.post("/signin", async (req, res) => {

  const existingPost = await post.findOne({where: {email : req.body.email}})

  if(existingPost){
    return res.render('signin', {
      message: 'Esse email está em uso!'
      })
  }else{
  let pass = req.body.pass;
  let hashPassword = await bcrypt.hash(pass, 8);
  post.create({
    nome: req.body.name,
    email: req.body.email,
    cpf: req.body.cpf,
    pass: hashPassword
    
  }).then(()=>{
    res.redirect('/login')
  }).catch((erro) =>{
    console.log("Falha ao cadastrar os dados " + erro)
  })
}});

app.post("/editar/:id/excluir", (req, res) => {
  const produtoId = req.params.id;
  Produto.destroy({
    where: {
      id: produtoId,
    },
  })
    .then(() => {
      res.redirect("/listar");
    })
    .catch((err) => {
      console.error("Erro ao excluir usuário:", err);
      res.status(500).send("Erro ao excluir usuário");
    });
});

//rota tela protect
app.get("/protect" , (req, res) =>{
  res.render("protect");
})

app.get("/user/perfil/:id", (req,res) =>{
  post.findAll({where: {"id" : req.params.id}}).then((posts)=>{
    res.render("user_info", {post: posts})
  })

  //   try {
//     const usuario = req.session.user;

//     res.render('user_info', { post });
//   } catch (error) {
//     console.log("Erro ao renderizar o perfil:", error);
//     res.status(500).send("Erro ao renderizar o perfil");
//   }
 })

//rota login
app.get("/login", (req, res) => {
  res.render("login");
});

//método post do login
app.post("/login", async function (req, res) {
  // Pega os valores digitados pelo usuário
  const {email, pass} = req.body;
  try {
    // Procurar usuário pelo email fornecido
    const user = await post.findOne({ where: { email } });

    if (user) {
      // Se o usuário for encontrado, comparar a senha fornecida com a senha armazenada usando bcrypt
      const hashedPass = user.pass;
      const match = await bcrypt.compare(pass, hashedPass);

      if (match) {
        // Se as senhas corresponderem, o login é bem-sucedido
        req.session.user = email;
        console.log("Login feito com sucesso!");
        res.redirect("/user/perfil");
      } else {
        // Se as senhas não corresponderem, retornar uma mensagem de erro
        console.log("Login incorreto!");
        res.render("login", {
          message: "Login incorreto! Verifique suas credenciais e tente novamente"
        });
      }
    } else {
      // Se o usuário não for encontrado, retornar uma mensagem de erro
      console.log("Este email não existe!");
      res.render("login", {
        message: "Este email não existe!"
      });
    }
  } catch (error) {
    // Se ocorrer algum erro durante a consulta ao banco de dados, retornar uma mensagem de erro
    console.log("Erro ao consultar banco de dados:", error);
    res.status(500).send("Erro interno ao fazer login");
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

app.get("s", verificaAutenticacao, (req, res) => {
  res.render("alterar-senha");
});

app.post("/alterar-senha", async (req, res) => {
  try {
    const novaSenha = req.body.novaSenha;
    const usuarioId = req.session.user;

    // Criptografar a nova senha
    const hashNovaSenha = await bcrypt.hash(novaSenha, 8);

    // Atualizar a senha no banco de dados usando o Sequelize
    const user = await post.findOne({ where: { email: usuarioId } });

    if (user) {
      user.pass = hashNovaSenha;
      await user.save();

      console.log("Senha atualizada com sucesso");
      res.redirect("/perfil");
    } else {
      console.log("Usuário não encontrado");
      res.status(404).send("Usuário não encontrado");
    }
  } catch (error) {
    console.log("Erro ao atualizar senha:", error);
    res.status(500).send("Erro ao atualizar senha");
  }
});

function verificaAutenticacao(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect("/login"); //redirecionar para /login quando o usuário não estiver logado
  }
}

//executa servidor
app.listen("3000", () => {
  console.log("Server on");
});