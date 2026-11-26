import React, { useState } from 'react'
import { Pressable, Text } from 'react-native'
import { auth } from '../auth'
import { Button, Field } from '../ui/kit'
import { C, F } from '../ui/theme'
import AuthLayout from './AuthLayout'

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Creates the account and signs in; App.js then shows the signed-in screens.
  const register = async () => {
    if (!name.trim()) return setError('Enter your name so turf owners know who booked.')
    setBusy(true); setError('')
    try {
      await auth.register(email, password, { name: name.trim() })
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Join the game."
      subtitle="Book turfs across Mumbai in a few taps."
      footer={
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="link" style={{ padding: 8 }}>
          <Text style={{ fontFamily: F.body, fontSize: 16, color: '#BFD6C8', textAlign: 'center' }}>
            Already have an account? <Text style={{ fontFamily: F.semi, color: C.flood }}>Log in</Text>
          </Text>
        </Pressable>
      }
    >
      <Field label="Name" value={name} onChangeText={setName} textContentType="name" autoComplete="name" placeholder="Your name" />
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
        keyboardType="email-address" textContentType="username" autoComplete="email" placeholder="you@example.com" />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry
        textContentType="newPassword" autoComplete="new-password" placeholder="At least 8 characters" onSubmitEditing={register} />
      {!!error && <Text style={{ fontFamily: F.medium, color: C.rejected, marginBottom: 12 }}>{error}</Text>}
      <Button title="Create account" onPress={register} busy={busy} style={{ marginBottom: 12 }} />
    </AuthLayout>
  )
}
