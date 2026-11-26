import React, { useEffect, useState } from 'react'
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import Ionicons from '@expo/vector-icons/Ionicons'
import { errorText, fileUrl, pb } from '../auth'
import { Button, ErrorState, Field, Loading } from '../ui/kit'
import { C, F, dateParts, money, slotLabel } from '../ui/theme'

// Pay the turf owner by UPI, then enter the reference: that creates the booking (pending until the owner confirms).
export default function PayScreen({ navigation, route }) {
  const { id, pitch: pitchId, date, slot, sport } = route.params
  const [turf, setTurf] = useState(null)
  const [pitch, setPitch] = useState(null)
  const [error, setError] = useState('')
  const [ref, setRef] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')

  const load = () => Promise.all([pb.collection('turfs').getOne(id), pb.collection('pitches').getOne(pitchId)])
    .then(([t, p]) => { setTurf(t); setPitch(p) }, (e) => setError(errorText(e)))
  useEffect(() => { load() }, [id, pitchId])

  if (!turf || !pitch) return error ? <ErrorState message={error} onRetry={() => { setError(''); load() }} /> : <Loading />

  const when = `${dateParts(date).long}, ${slotLabel(slot)}`
  const upiLink = `upi://pay?pa=${encodeURIComponent(turf.upiId)}&pn=${encodeURIComponent(turf.name)}&am=${pitch.price}&cu=INR&tn=${encodeURIComponent(`BookMyTurf ${pitch.name} ${date} ${slot}`)}`

  const openUpi = () => Linking.openURL(upiLink).catch(() =>
    setFormError('No UPI app opened. Scan the QR code or copy the UPI ID instead.'))
  const copy = async () => {
    await Clipboard.setStringAsync(turf.upiId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const confirm = async () => {
    const upiRef = ref.trim()
    if (!/^\d{12}$/.test(upiRef)) return setFormError('The UPI reference is the 12-digit number in your payment app\'s receipt.')
    setBusy(true); setFormError('')
    try {
      const b = await pb.collection('bookings').create({ turf: id, pitch: pitchId, date, slot, sport, upiRef })
      navigation.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'Done', params: { bookingId: b.id } }] })
    } catch (e) {
      setFormError(errorText(e))
      setBusy(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.field }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <View style={s.summary}>
          <Text style={s.amount}>{money(pitch.price)}</Text>
          <Text style={s.for}>{when}</Text>
          <Text style={s.for}>{sport} on {pitch.name}, {turf.name}</Text>
        </View>

        <Text style={s.step}>1. Pay the turf</Text>
        <View style={s.card}>
          {Platform.OS !== 'web' && !!turf.upiId && (
            <Button title="Pay with a UPI app" kind="dark" onPress={openUpi} style={{ marginBottom: 14 }}
              icon={<Ionicons name="phone-portrait-outline" size={20} color={C.chalk} />} />
          )}
          {!!turf.upiQr && (
            <View style={{ alignItems: 'center' }}>
              <Image source={{ uri: fileUrl(turf, turf.upiQr) }} style={s.qr} accessibilityLabel="UPI QR code" />
              <Text style={s.hint}>{Platform.OS === 'web' ? 'Scan with any UPI app' : 'Or scan this QR from another phone'}</Text>
            </View>
          )}
          {!!turf.upiId && (
            <Pressable onPress={copy} style={s.upiRow} accessibilityRole="button" accessibilityLabel={`Copy UPI ID ${turf.upiId}`}>
              <View style={{ flex: 1 }}>
                <Text style={[s.hint, { textAlign: 'left' }]}>UPI ID</Text>
                <Text style={[s.upiId, { textAlign: 'left' }]} selectable>{turf.upiId}</Text>
              </View>
              <Text style={s.copy}>{copied ? 'Copied' : 'Copy'}</Text>
            </Pressable>
          )}
          {!turf.upiId && !turf.upiQr && <Text style={s.hint}>This turf hasn't added payment details yet. Call them to pay.</Text>}
        </View>

        <Text style={s.step}>2. Confirm your payment</Text>
        <View style={s.card}>
          <Field label="UPI reference number" value={ref} onChangeText={(t) => { setRef(t.replace(/\D/g, '')); setFormError('') }}
            keyboardType="number-pad" maxLength={12} placeholder="12 digits from your receipt" />
          {!!formError && <Text style={s.err}>{formError}</Text>}
          <Button title="Confirm booking" onPress={confirm} busy={busy} disabled={ref.length !== 12} />
          <Text style={[s.hint, { marginTop: 10 }]}>The turf owner checks the payment and confirms your slot.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingBottom: 40 },
  summary: { backgroundColor: C.turf, borderRadius: 16, padding: 18, marginBottom: 6 },
  amount: { fontFamily: F.display, fontSize: 44, color: C.flood, lineHeight: 46 },
  for: { fontFamily: F.medium, fontSize: 16, color: C.chalk },
  step: { fontFamily: F.display, fontSize: 22, color: C.ink, marginTop: 20, marginBottom: 10 },
  card: { backgroundColor: C.chalk, borderRadius: 16, padding: 16 },
  qr: { width: 200, height: 200 },
  hint: { fontFamily: F.body, fontSize: 14, color: C.muted, textAlign: 'center' },
  upiRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: C.line },
  upiId: { fontFamily: F.semi, fontSize: 18, color: C.ink, textAlign: 'center' },
  copy: { fontFamily: F.semi, fontSize: 16, color: C.turf, paddingHorizontal: 8 },
  err: { fontFamily: F.medium, fontSize: 14, color: C.rejected, marginBottom: 12 },
})
