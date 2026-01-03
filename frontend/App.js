import React, { useState, useRef } from 'react';
import { SafeAreaView, View, Text, TextInput, Button, FlatList, ScrollView, ActivityIndicator } from 'react-native';
import { io } from 'socket.io-client';

export default function App() {
  const [serverUrl, setServerUrl] = useState('colmate-production.up.railway.app');
  const [university, setUniversity] = useState('');
  const [interests, setInterests] = useState('');
  const [status, setStatus] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [roomId, setRoomId] = useState(null);
  const [peerProfile, setPeerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const socketRef = useRef(null);

  function validateForm() {
    setValidationError('');
    if (!university.trim()) {
      setValidationError('University is required');
      return false;
    }
    if (!interests.trim()) {
      setValidationError('At least one interest is required');
      return false;
    }
    return true;
  }

  function connectAndJoin() {
    if (!validateForm()) return;

    setIsLoading(true);
    const socket = io(serverUrl, { autoConnect: false });
    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => {
      setStatus('connected');
      const profile = { university, interests: interests.split(',').map(s => s.trim()).filter(Boolean) };
      socket.emit('joinQueue', profile);
      setStatus('searching');
      setMessages([]);
    });

    socket.on('matched', (data) => {
      const { roomId, peerId, peerProfile } = data;
      setRoomId(roomId);
      setPeerProfile(peerProfile);
      setStatus('matched');
      setIsLoading(false);
      setMessages([{ text: `✓ Matched with ${peerProfile.university || 'someone'}! Say hi :)`, isSystem: true }]);
    });

    socket.on('messageReceived', (msg) => {
      setMessages(prev => [...prev, { id: msg.id, text: msg.content, sender: msg.sender, isSystem: false, createdAt: msg.createdAt }]);
    });

    socket.on('disconnect', () => setStatus('disconnected'));
  }

  function sendMessage() {
    if (!messageInput.trim() || !roomId || !socketRef.current) return;
    socketRef.current.emit('sendMessage', { roomId, content: messageInput });
    setMessages(prev => [...prev, { text: messageInput, sender: 'you', isSystem: false }]);
    setMessageInput('');
  }

  function disconnect() {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setStatus('idle');
    setRoomId(null);
    setPeerProfile(null);
    setMessages([]);
    setMessageInput('');
    setIsLoading(false);
  }

  function rematch() {
    disconnect();
    setTimeout(() => connectAndJoin(), 500);
  }

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#007AFF' }}>ColMate</Text>

      {status === 'idle' && (
        <ScrollView>
          <Text style={{ marginTop: 8, fontWeight: '600' }}>Server URL</Text>
          <TextInput
            value={serverUrl}
            onChangeText={setServerUrl}
            style={{ borderWidth: 1, padding: 8, marginBottom: 12, backgroundColor: '#fff', borderRadius: 4, borderColor: '#ddd' }}
          />
          <Text style={{ marginTop: 8, fontWeight: '600' }}>University</Text>
          <TextInput
            value={university}
            onChangeText={setUniversity}
            placeholder="e.g., State University"
            style={{ borderWidth: 1, padding: 8, marginBottom: 4, backgroundColor: '#fff', borderRadius: 4, borderColor: '#ddd' }}
          />
          <Text style={{ marginTop: 8, fontWeight: '600' }}>Interests (comma separated)</Text>
          <TextInput
            value={interests}
            onChangeText={setInterests}
            placeholder="e.g., Gaming, Music, Art"
            style={{ borderWidth: 1, padding: 8, marginBottom: 8, backgroundColor: '#fff', borderRadius: 4, borderColor: '#ddd' }}
          />
          {validationError && <Text style={{ color: 'red', marginBottom: 12, fontWeight: '500' }}>✗ {validationError}</Text>}
          <Button title="Connect & Join Queue" onPress={connectAndJoin} color="#007AFF" />
        </ScrollView>
      )}

      {status !== 'idle' && (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#666', fontWeight: '600' }}>Status: {status}</Text>
            {status === 'matched' && <Button title="End & Rematch" onPress={rematch} color="#FF3B30" />}
          </View>

          {status === 'searching' && (
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={{ marginTop: 12, color: '#666' }}>Finding your match...</Text>
            </View>
          )}

          {status === 'matched' && peerProfile && (
            <>
              <View style={{ backgroundColor: '#e8f4f8', padding: 12, marginBottom: 12, borderRadius: 6 }}>
                <Text style={{ fontWeight: 'bold', color: '#333' }}>Chatting with:</Text>
                <Text style={{ fontSize: 16, marginTop: 4 }}>{peerProfile.university}</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  Interests: {(peerProfile.interests || []).join(', ')}
                </Text>
              </View>

              <FlatList
                data={messages}
                keyExtractor={(item, idx) => item.id || String(idx)}
                renderItem={({ item }) => (
                  <View
                    style={{
                      backgroundColor: item.isSystem ? '#fff3cd' : item.sender === 'you' ? '#d4edda' : '#fff',
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 8,
                      alignSelf: item.sender === 'you' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      borderWidth: item.isSystem ? 0 : 1,
                      borderColor: item.sender === 'you' ? '#28a745' : '#ddd'
                    }}
                  >
                    <Text style={{ fontSize: 14, color: '#333' }}>{item.text}</Text>
                  </View>
                )}
                scrollEnabled
                style={{ flex: 1, marginBottom: 12 }}
              />

              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                <TextInput
                  value={messageInput}
                  onChangeText={setMessageInput}
                  placeholder="Type a message..."
                  style={{ flex: 1, borderWidth: 1, padding: 10, borderRadius: 4, backgroundColor: '#fff', borderColor: '#ddd', marginRight: 8 }}
                />
                <Button title="Send" onPress={sendMessage} color="#007AFF" />
              </View>
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
