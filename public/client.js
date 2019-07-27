$( document ).ready(function() {

  /*global io*/   
  var socket = io();
  // suppresses ESLint's reference error 
  // socket.io is <script src= 'ed in chat.pug 
  // just before client.js is included

  
  $('form').submit(function(){
    var messageToSend = $('#m').val();
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });

  socket.on('user', function(data) {
    $('#num-users').text(data.currentUsers + ' users online');
    var message = data.name;
    if(data.connected) {
      message += ' has joined the chat.';
    } else {
      message += ' has left the chat.';
    }
    $('#messages').append($('<li>').html('<b>' + message + '</b>'));
  });
  
  // keep overflown message box scrolled to the bottom
  function updateScroll() {
    var element = document.getElementById("messages");
    element.scrollTop = element.scrollHeight;
  }
  socket.on('chat message', function(data) {
    $('#messages').append($('<li>').text(data.name+': '+data.message));
    updateScroll();
  });
});
