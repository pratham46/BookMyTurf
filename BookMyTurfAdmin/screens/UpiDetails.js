import React, { useEffect, useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { errorText, fileUrl, myTurf, pb, toUpload } from '../auth'
import { Button, ErrorState, Field, Loading } from '../ui/kit'
import { C, F } from '../ui/theme'

// UPI ID + QR that customers pay to before entering their UPI reference.
export default function UpiDetails({ navigation }) {
  const [turf, setTurf] = useState(null)
  const [id, setId] = useState('')
  const [qr, setQr] = useState(null) // newly picked asset
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () => myTurf().then((t) => { setTurf(t); setId(t.upiId || '') }, (e) => setError(errorText(e)))
  useEffect(() => { load() }, [])

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 })
    if (!r.canceled) setQr(r.assets[0])
  }

  const save = async () => {
    const upiId = id.trim()
    if (!/^[\w.\-]{2,}@[a-zA-Z][\w.\-]*$/.test(upiId)) return setMsg('Enter a valid UPI ID, e.g. name@okbank')
    setBusy(true); setMsg('')
    try {
      const body = { upiId }
      if (qr) body.upiQr = await toUpload(qr)
      await pb.collection('turfs').update(turf.id, body)
      navigation.goBack()
    } catch (e) {
      setMsg(errorText(e))
      setBusy(false)
    }
  }

  if (!turf) return error ? <ErrorState message={error} onRetry={load} /> : <Loading />
  const qrUri = qr ? qr.uri : fileUrl(turf, turf.upiQr)

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.field }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
        <Text style={s.note}>Players pay this UPI ID, then send you the payment's reference number. You check it in your bank app and mark the booking paid.</Text>

        <Field label="UPI ID" value={id} onChangeText={(v) => { setId(v); setMsg('') }} placeholder="name@okbank" autoCapitalize="none" autoCorrect={false} />

        <Text style={s.label}>QR code (optional)</Text>
        <Pressable onPress={pickImage} style={s.qr} accessibilityRole="button" accessibilityLabel={qrUri ? 'Change QR code' : 'Add QR code'}>
          {qrUri ? <Image source={{ uri: qrUri }} style={StyleSheet.absoluteFill} resizeMode="contain" /> : (
            <>
              <Ionicons name="qr-code-outline" size={44} color={C.muted} />
              <Text style={s.qrText}>Upload your UPI QR</Text>
            </>
          )}
        </Pressable>
        {qrUri && <Button title="Change QR" kind="ghost" onPress={pickImage} style={{ marginTop: 10 }} />}

        {!!msg && <Text style={s.err}>{msg}</Text>}
        <Button title="Save UPI details" kind="dark" onPress={save} busy={busy} style={{ marginTop: 20 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  body: { padding: 20, paddingBottom: 32, maxWidth: 560, width: '100%', alignSelf: 'center' },
  note: { fontFamily: F.body, fontSize: 15, color: C.muted, marginBottom: 18, lineHeight: 21 },
  label: { fontFamily: F.medium, fontSize: 14, color: C.muted, marginBottom: 6 },
  qr: { width: 220, height: 220, alignSelf: 'center', borderRadius: 14, backgroundColor: C.chalk, borderWidth: 1.5, borderColor: C.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  qrText: { fontFamily: F.medium, fontSize: 15, color: C.muted, marginTop: 8 },
  err: { fontFamily: F.medium, fontSize: 15, color: C.rejected, marginTop: 14 },
})
