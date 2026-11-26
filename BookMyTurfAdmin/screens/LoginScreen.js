import React, { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { auth } from '../auth'
import { Button, Field } from '../ui/kit'
import { C, F } from '../ui/theme'
import AuthLayout from './AuthLayout'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // On success App.js swaps to the signed-in screens.
  const login = async () => {
    setBusy(true); setError('')
    try {
      await auth.signIn(email, password)
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Run your turf."
      subtitle="Owner login: bookings, payments and slots."
      footer={
        <Pressable onPress={() => navigation.navigate('Register')} accessibilityRole="link" style={{ padding: 8 }}>
          <Text style={{ fontFamily: F.body, fontSize: 16, color: '#BFD6C8', textAlign: 'center' }}>
            Own a turf? <Text style={{ fontFamily: F.semi, color: C.flood }}>List it on BookMyTurf</Text>
          </Text>
        </Pressable>
      }
    >
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
        keyboardType="email-address" textContentType="username" autoComplete="email" placeholder="you@example.com" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry
        textContentType="password" autoComplete="password" placeholder="Your password" onSubmitEditing={login} />
      {!!error && <Text style={{ fontFamily: F.medium, color: C.rejected, marginBottom: 12 }}>{error}</Text>}
      <Button title="Log in" onPress={login} busy={busy} style={{ marginBottom: 12 }} />
    </AuthLayout>
  )
}
