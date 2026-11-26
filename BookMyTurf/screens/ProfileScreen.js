import React, { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { auth, errorText, useAuth } from '../auth'
import { Button, Field } from '../ui/kit'
import { C, F } from '../ui/theme'

// View and edit your details in one place. Turf owners see your name and number on bookings.
export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', phone: '', location: '' })
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { ok, text }

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', location: user.location || '' })
  }, [user?.id, user?.updated])

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setMsg(null) }
  const dirty = user && (form.name !== (user.name || '') || form.phone !== (user.phone || '') || form.location !== (user.location || ''))

  const save = async () => {
    const phone = form.phone.trim()
    if (phone && !/^\+?[0-9 ]{10,15}$/.test(phone)) return setMsg({ ok: false, text: 'Enter a 10-digit mobile number.' })
    setBusy(true)
    try {
      await auth.updateProfile({ name: form.name.trim(), phone, location: form.location.trim() })
      setMsg({ ok: true, text: 'Saved' })
    } catch (e) {
      setMsg({ ok: false, text: errorText(e) })
    } finally {
      setBusy(false)
    }
  }

  const initials = (user?.name || user?.email || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.field }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={[s.header, { paddingTop: insets.top + 24 }]}>
          <View style={s.avatar}><Text style={s.initials}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name} numberOfLines={1}>{user?.name || 'Your profile'}</Text>
            <Text style={s.email} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        <View style={s.body}>
          <Text style={s.h2}>Your details</Text>
          <Text style={s.note}>Turf owners see your name and number when you book.</Text>
          <Field label="Name" value={form.name} onChangeText={set('name')} placeholder="Your name" textContentType="name" />
          <Field label="Mobile number" value={form.phone} onChangeText={set('phone')} placeholder="98XXX XXXXX" keyboardType="phone-pad" textContentType="telephoneNumber" />
          <Field label="Area" value={form.location} onChangeText={set('location')} placeholder="e.g. Andheri" />
          {msg && <Text style={[s.msg, { color: msg.ok ? C.paid : C.rejected }]}>{msg.text}</Text>}
          <Button title="Save changes" kind="dark" onPress={save} busy={busy} disabled={!dirty} />
          <Button title="Log out" kind="ghost" onPress={() => auth.signOut()} style={{ marginTop: 28 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  header: { backgroundColor: C.turf, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingBottom: 22 },
  avatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: C.flood, alignItems: 'center', justifyContent: 'center' },
  initials: { fontFamily: F.display, fontSize: 26, color: C.ink },
  name: { fontFamily: F.display, fontSize: 28, color: C.chalk },
  email: { fontFamily: F.body, fontSize: 15, color: '#BFD6C8' },
  body: { padding: 20, maxWidth: 560, width: '100%', alignSelf: 'center' },
  h2: { fontFamily: F.display, fontSize: 22, color: C.ink },
  note: { fontFamily: F.body, fontSize: 15, color: C.muted, marginBottom: 16, marginTop: 2 },
  msg: { fontFamily: F.medium, fontSize: 15, marginBottom: 12 },
})
