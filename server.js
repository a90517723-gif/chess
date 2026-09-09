const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Chess } = require('chess.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// مشاركة الملفات الثابتة في مجلد public
app.use(express.static('public'));

let players = {}; // تخزين معرّفات اللاعبين
let game = new Chess(); // إنشاء لعبة شطرنج جديدة

io.on('connection', (socket) => {
    console.log('لاعب جديد متصل:', socket.id);

    // تعيين لون القطع للاعب المتصل
    if (!players.white) {
        players.white = socket.id;
        socket.emit('playerType', 'w'); // أبيض
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerType', 'b'); // أسود
    } else {
        socket.emit('playerType', 'spectator'); // مشاهد فقط
    }

    // إرسال حالة اللوحة الحالية
    socket.emit('boardState', game.fen());

    // استقبال الحركة من أحد اللاعبين
    socket.on('move', (moveData) => {
        try {
            // تطبيق الحركة في محرك اللعبة
            const move = game.move(moveData);
            if (move) {
                // بث الحركة وحالة اللوحة الجديدة لجميع المتصلين
                io.emit('move', moveData);
                io.emit('boardState', game.fen());
            }
        } catch (e) {
            console.log('حركة غير قانونية:', e.message);
        }
    });

    // عند مغادرة لاعب
    socket.on('disconnect', () => {
        if (socket.id === players.white) delete players.white;
        if (socket.id === players.black) delete players.black;
        console.log('لاعب غادر:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`الخادم يعمل على الرابط: http://localhost:${PORT}`);
});