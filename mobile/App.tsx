import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, ActivityIndicator } from 'react-native';
import { apiClient } from './src/services/api';
import { tokenStorage } from './src/services/token';
import { API_BASE_URL } from './src/config/env';

export default function App() {
  const [status, setStatus] = useState<string>('Ready');
  const [loading, setLoading] = useState<boolean>(false);

  const testAuthFlow = async () => {
    setLoading(true);
    try {
      setStatus('1. Saving mock expired access token and valid mock refresh token...');
      await tokenStorage.setTokens({
        accessToken: 'mock-expired-access-token',
        refreshToken: 'mock-valid-refresh-token',
      });

      setStatus('2. Calling api /users/profile (should trigger 401 and refresh interceptor)...');
      
      const res = await apiClient.get('/users/profile');
      setStatus(`Success: ${JSON.stringify(res.data)}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.log('[App] Test failed or actual error:', errMsg);
      setStatus(`Failed: ${errMsg} (Check Metro console logs for interceptor steps)`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearTokens = async () => {
    setLoading(true);
    try {
      await tokenStorage.clearTokens();
      setStatus('Tokens cleared successfully.');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      setStatus(`Failed to clear tokens: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DailySnap Expense API Client Test</Text>
      <Text style={styles.subtitle}>API URL: {API_BASE_URL}</Text>
      
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>{status}</Text>
      </View>

      {loading && (
        <ActivityIndicator size="large" color="#008080" style={styles.loader} />
      )}

      <View style={styles.buttonContainer}>
        <Button title="Test API Interceptor" onPress={testAuthFlow} color="#008080" />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button title="Clear Tokens" onPress={handleClearTokens} color="#d9534f" />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#212529',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusBox: {
    width: '100%',
    padding: 15,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    marginBottom: 20,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 12,
  },
});
