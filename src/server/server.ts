
import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';

// Initialize express app
const app = express();
const server = http.createServer(app);

// Configure middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../../dist')));

// WebSocket server setup
const wss = new WebSocketServer({ server });

// Track active connections and calls
const clients = new Map();
const activeCalls = new Map();
const userSessions = new Map();

// WebSocket connection handler
wss.on('connection', (ws) => {
  const clientId = crypto.randomUUID();
  clients.set(ws, { id: clientId });
  console.log(`Client connected: ${clientId}`);

  // Send current user count to all clients
  broadcastUserCount();

  // Message handler
  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message.toString());
      console.log(`Received message from ${clientId}:`, msg.type);
      
      // Handle different message types
      switch (msg.type) {
        case 'incoming_call':
          handleIncomingCall(ws, msg);
          break;
        
        case 'offer':
          forwardToCallPeer(ws, msg);
          break;
          
        case 'answer':
          forwardToCallPeer(ws, msg);
          break;
          
        case 'ice-candidate':
          forwardToCallPeer(ws, msg);
          break;
          
        case 'accept_call':
          handleAcceptCall(ws, msg);
          break;
          
        case 'hangup':
          handleHangup(ws, msg);
          break;
          
        case 'chat_message':
          broadcastChatMessage(ws, msg);
          break;
          
        default:
          console.warn(`Unknown message type: ${msg.type}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: 'Invalid message format'
      }));
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    const clientData = clients.get(ws);
    if (clientData) {
      console.log(`Client disconnected: ${clientId}`);
      
      // Notify peers if this client was in any calls
      for (const [callId, call] of activeCalls.entries()) {
        if (call.caller === ws || call.callee === ws) {
          const peer = call.caller === ws ? call.callee : call.caller;
          if (peer && peer.readyState === ws.OPEN) {
            peer.send(JSON.stringify({
              type: 'peer_disconnected',
              callId
            }));
          }
          activeCalls.delete(callId);
        }
      }
      
      // Remove from clients list
      clients.delete(ws);
      
      // Remove from user sessions if present
      for (const [userId, session] of userSessions.entries()) {
        if (session.ws === ws) {
          userSessions.delete(userId);
          break;
        }
      }
      
      // Broadcast updated user count
      broadcastUserCount();
    }
  });
});

// Helper Functions for WebSocket communication
function broadcastUserCount() {
  const count = clients.size;
  const message = JSON.stringify({ type: 'user_count', count });
  
  for (const client of clients.keys()) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

function handleIncomingCall(caller, msg) {
  const { callId } = msg;
  
  // Store call details
  activeCalls.set(callId, { caller, time: Date.now() });
  
  // Find an available peer
  let foundPeer = false;
  
  for (const client of clients.keys()) {
    // Don't call yourself
    if (client !== caller && client.readyState === client.OPEN) {
      // Check if the client is not in another call
      let clientInCall = false;
      for (const call of activeCalls.values()) {
        if (call.caller === client || call.callee === client) {
          clientInCall = true;
          break;
        }
      }
      
      if (!clientInCall) {
        client.send(JSON.stringify({
          type: 'incoming_call',
          callId,
          from: clients.get(caller)?.id || 'Anonymous'
        }));
        foundPeer = true;
        break;
      }
    }
  }
  
  if (!foundPeer) {
    caller.send(JSON.stringify({
      type: 'error',
      data: 'No available peers'
    }));
    activeCalls.delete(callId);
  }
}

function handleAcceptCall(callee, msg) {
  const { callId } = msg;
  const call = activeCalls.get(callId);
  
  if (call && call.caller) {
    // Update call record with callee
    call.callee = callee;
    
    // Notify caller that call was accepted
    call.caller.send(JSON.stringify({
      type: 'call_joined',
      callId
    }));
    
    // Notify other clients that this call is taken
    for (const client of clients.keys()) {
      if (client !== callee && client !== call.caller && client.readyState === client.OPEN) {
        client.send(JSON.stringify({
          type: 'call_taken',
          callId
        }));
      }
    }
  } else {
    callee.send(JSON.stringify({
      type: 'error',
      data: 'Call not found or expired'
    }));
  }
}

function handleHangup(client, msg) {
  const { callId } = msg;
  const call = activeCalls.get(callId);
  
  if (call) {
    const peer = call.caller === client ? call.callee : call.caller;
    if (peer && peer.readyState === peer.OPEN) {
      peer.send(JSON.stringify({
        type: 'hangup',
        callId
      }));
    }
    activeCalls.delete(callId);
  }
}

function forwardToCallPeer(sender, msg) {
  const { callId } = msg;
  const call = activeCalls.get(callId);
  
  if (call) {
    const receiver = call.caller === sender ? call.callee : call.caller;
    if (receiver && receiver.readyState === receiver.OPEN) {
      receiver.send(JSON.stringify(msg));
    }
  }
}

function broadcastChatMessage(sender, msg) {
  const senderData = clients.get(sender);
  const { content, timestamp, isPrivate, recipientId } = msg;
  
  // Generate a message id
  const messageId = crypto.randomUUID();
  
  const messageData = {
    type: 'chat_message',
    message: {
      id: messageId,
      senderId: senderData?.id || 'anonymous',
      content,
      timestamp: timestamp || new Date().toISOString(),
      isPrivate: Boolean(isPrivate)
    }
  };
  
  // If it's a private message, only send to the recipient
  if (isPrivate && recipientId) {
    const recipientSession = userSessions.get(recipientId);
    if (recipientSession && recipientSession.ws.readyState === recipientSession.ws.OPEN) {
      recipientSession.ws.send(JSON.stringify(messageData));
      // Also send back to sender
      sender.send(JSON.stringify(messageData));
    } else {
      sender.send(JSON.stringify({
        type: 'error',
        data: 'Recipient not found or offline'
      }));
    }
  } else {
    // Broadcast to all connected clients
    for (const client of clients.keys()) {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(messageData));
      }
    }
  }
}

// API routes
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // This is a mock authentication - in a real app, validate against a database
  if (username && password) {
    const userId = `user_${Math.random().toString(36).substring(2, 9)}`;
    res.json({ 
      success: true, 
      user: { 
        id: userId,
        name: username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        status: 'online'
      }
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/messages', (req, res) => {
  const { content, senderId, recipientId } = req.body;
  
  // In a real app, this would save to a database
  const message = {
    id: crypto.randomUUID(),
    senderId,
    recipientId,
    content,
    timestamp: new Date(),
    type: 'text',
    isPrivate: Boolean(recipientId)
  };
  
  res.json({ success: true, message });
});

app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  
  // In a real app, fetch from database
  // For now, return mock data
  res.json({
    success: true,
    friends: [
      {
        id: '1',
        user: {
          id: 'friend1',
          name: 'Alex Johnson',
          status: 'online',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
        },
        status: 'accepted',
        addedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        user: {
          id: 'friend2',
          name: 'Sarah Chen',
          status: 'busy',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        },
        status: 'accepted',
        addedAt: new Date('2024-01-10'),
      }
    ]
  });
});

// Catch-all handler to support client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default server;
