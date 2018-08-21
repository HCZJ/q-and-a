import io from 'socket.io-client';
import { mediaEvents } from './components/classroom/classroom-view';
import { whiteboardEvents, editorEvents } from './components/classroom/control-container';
// import { editorEvents } from './components/classroom/control-container';

const clientSocket = io(window.location.origin);
let roomName = window.location.pathname;

clientSocket.on('connect', () => {
  console.log('Socket connected!');
});

mediaEvents.on('rtc-message', message => {
  console.log('*** MEDIA EVENT ON MESSSAGE', message);
  clientSocket.emit('rtc-message--from-client', message);
});

mediaEvents.on('find-room', room => {
  clientSocket.emit('find-room--from-client', room);
});

mediaEvents.on('rtc-auth', data => {
  clientSocket.emit('rtc-auth--from-client', data);
});

mediaEvents.on('rtc-accept', data => {
  clientSocket.emit('rtc-accept--from-client', data);
});

mediaEvents.on('rtc-hangup', () => {
  clientSocket.emit('rtc-hangup--from-client');
});

whiteboardEvents.on('wb-toggle', () => {
  console.log('CLIENT SOCKET WHITEBOARD TOGGLE EVENT')
  clientSocket.emit('wb-toggle--from-client');
});

whiteboardEvents.on('wb-draw', (start, end, color, lineWidth, eraser) => {
  clientSocket.emit(
    'wb-draw--from-client',
    start,
    end,
    color,
    lineWidth,
    eraser
  );
});

whiteboardEvents.on('wb-clear', () => {
  clientSocket.emit('wb-clear--from-client');
});

editorEvents.on('editor-toggle', () => {
  clientSocket.emit('editor-toggle--from-client');
});

editorEvents.on('editor-content', content => {
  clientSocket.emit('editor-content--from-client', content);
});

editorEvents.on('editor-mode', (mode, name) => {
  console.log('CLIENT SOCKET EDITOR MODE', mode);
  console.log('CLIENT SOCKET EDITOR NAME', name);
  clientSocket.emit('editor-mode--from-client', (mode, name));
});

export default clientSocket;
