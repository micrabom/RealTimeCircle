const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

let active_members = [];
let circle_animation = [];
let pointer = {};

// Render the index page
app.get('/', async (req, res) => {
    res.render('index');
});

io.on('connection', (socket) => {
    let username = '';
    socket.on('submitUsername', (data) => {
        username = data.username;
        active_members.push(username);
        io.emit('active_members', { active_members });
    });

    socket.on('circle_created', (data) => {
        circle_animation.push(data);
        io.emit('circle_animation', circle_animation);
    });

    socket.on('clear', () => {
        circle_animation = [];
        io.emit('circle_animation', circle_animation);
    });
    
    socket.on('pointer_move', (data) => {
        pointers[socket.id] = data;
        io.emit('pointers', { pointer });
    });

    io.emit('active_members', { active_members });
});



server.listen(8000, () => {
    console.log("Server is running on port 8000");
});
