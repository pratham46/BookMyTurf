import React, { useCallback, useRef, useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { DAYS, SLOTS, errorText, fileUrl, myPitches, myTurf, pb, pitchReady, toUpload } from '../auth'
import { Button, Chip, ErrorState, Field, Loading } from '../ui/kit'
import { C, F, money, slotLabel } from '../ui/theme'

const toForm = (t) => ({
  name: t.name || '', area: t.area || '', phone: t.phone || '',
  address: t.address || '', mapUrl: t.mapUrl || '', slots: t.slots || [], openDays: t.openDays || [],
})
// toggle v in list, keeping the canonical order of `all`
const toggle = (all, list, v) => all.filter((x) => (x === v ? !list.includes(v) : list.includes(x)))

// Owner edits the venue (shared details, timings, open days) and manages the turfs inside it.
// Each turf has its own name, sports, price and photos (PitchScreen); slots are booked per turf.
export default function TurfSettings({ navigation }) {
  const insets = useSafeAreaInsets()
  const [turf, setTurf] = useState(null)
  const [pitches, setPitches] = useState([])
  const [form, setForm] = useState(null)
  const [cover, setCover] = useState(null) // newly picked asset
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null) // { ok, text }

  const reset = (t) => { setTurf(t); setForm(toForm(t)); setCover(null) }
  const load = useCallback(() => {
    myTurf().then(async (t) => { setPitches(await myPitches(t.id)); if (!dirtyRef.current) reset(t) }).catch((e) => setError(errorText(e)))
  }, [])
  // reload on focus (turf list, approval); unsaved venue edits are kept
  const dirtyRef = useRef(false)
  useFocusEffect(load)

  if (!form) return error ? <ErrorState message={error} onRetry={load} /> : <Loading />

  const dirty = !!cover || JSON.stringify(form) !== JSON.stringify(toForm(turf))
  dirtyRef.current = dirty
  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setMsg(null) }

  const pickCover = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [16, 9], quality: 0.8 })
    if (!r.canceled) { setCover(r.assets[0]); setMsg(null) }
  }

  const save = async () => {
    const fail = (text) => setMsg({ ok: false, text })
    if (!form.name.trim()) return fail('Venue name is required.')
    if (form.mapUrl && !/^https?:\/\//.test(form.mapUrl.trim())) return fail('Map link must start with http:// or https://')
    if (!form.slots.length) return fail('Pick at least one slot.')
    setBusy(true)
    try {
      const body = { ...form, name: form.name.trim(), area: form.area.trim(), phone: form.phone.trim(), address: form.address.trim(), mapUrl: form.mapUrl.trim() }
      if (cover) body.cover = await toUpload(cover)
      reset(await pb.collection('turfs').update(turf.id, body))
      setMsg({ ok: true, text: 'Saved. Players see the changes now.' })
    } catch (e) {
      fail(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const coverUri = cover ? cover.uri : fileUrl(turf, turf.cover, '800x450')

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.field }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[s.header, { paddingTop: insets.top + 18 }]}>
          <Text style={s.h1}>Your venue</Text>
          <Text style={s.sub}>{turf.approved ? 'Live: players see these details.' : 'Pending approval: fill these in and set up at least one turf so BookMyTurf can approve you.'}</Text>
        </View>

        <View style={s.body}>
          <Pressable onPress={pickCover} style={s.cover} accessibilityRole="button" accessibilityLabel="Change cover photo">
            {coverUri
              ? <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <Ionicons name="image-outline" size={40} color={C.muted} />}
            <View style={s.coverTag}>
              <Ionicons name="camera" size={16} color={C.ink} />
              <Text style={s.coverTagText}>{coverUri ? 'Change cover' : 'Add cover photo'}</Text>
            </View>
          </Pressable>

          <View style={s.headRow}>
            <Text style={[s.h2, { marginBottom: 0 }]}>Turfs</Text>
            <Text style={s.legend}>{pitches.length} at this venue</Text>
          </View>
          <Text style={s.note}>Each turf is booked separately and has its own sports, price and photos.</Text>
          <View style={s.card}>
            {pitches.map((p, i) => (
              <Pressable key={p.id} onPress={() => navigation.navigate('Pitch', { id: p.id })} accessibilityRole="button"
                style={({ pressed }) => [s.row, i > 0 && s.rowLine, pressed && { backgroundColor: C.field }]}>
                {p.photos?.length
                  ? <Image source={{ uri: fileUrl(p, p.photos[0], '300x300') }} style={s.thumb} />
                  : <View style={[s.thumb, s.thumbEmpty]}><Ionicons name="football-outline" size={20} color={C.muted} /></View>}
                <View style={{ flex: 1 }}>
                  <Text style={s.rowTitle} numberOfLines={1}>{p.name}</Text>
                  <Text style={[s.rowSub, !pitchReady(p) && { color: C.pending }]} numberOfLines={1}>
                    {pitchReady(p) ? `${money(p.price)} · ${p.sports.join(', ')} · ${p.photos?.length || 0} photo${p.photos?.length === 1 ? "" : "s"}` : 'Add price and sports'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.muted} />
              </Pressable>
            ))}
            <Pressable onPress={() => navigation.navigate('Pitch')} accessibilityRole="button"
              style={({ pressed }) => [s.row, pitches.length > 0 && s.rowLine, pressed && { backgroundColor: C.field }]}>
              <View style={[s.thumb, s.thumbAdd]}><Ionicons name="add" size={26} color={C.ink} /></View>
              <Text style={[s.rowTitle, { flex: 1 }]}>Add another turf</Text>
            </Pressable>
          </View>

          <Text style={s.h2}>Venue</Text>
          <Field label="Venue name" value={form.name} onChangeText={set('name')} placeholder="e.g. Green Field Arena" />
          <Field label="Area" value={form.area} onChangeText={set('area')} placeholder="e.g. Andheri" />
          <Field label="Contact number for players" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" placeholder="98XXX XXXXX" />
          <Field label="Address" value={form.address} onChangeText={set('address')} multiline placeholder="Full address" style={{ minHeight: 84, textAlignVertical: 'top' }} />
          <Field label="Google Maps link" value={form.mapUrl} onChangeText={set('mapUrl')} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://maps.app.goo.gl/..." />

          <Pressable onPress={() => navigation.navigate('Gallery')} style={[s.card, s.row]} accessibilityRole="button">
            <View style={[s.thumb, s.thumbEmpty]}><Ionicons name="images-outline" size={20} color={C.turf} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Venue photos</Text>
              <Text style={s.rowSub}>{turf.gallery?.length || 0} photo{turf.gallery?.length === 1 ? "" : "s"} of the whole venue</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={C.muted} />
          </Pressable>

          <Text style={s.h2}>Slots</Text>
          <Text style={s.note}>Timings for every turf here. Tap to switch a slot on or off.</Text>
          <View style={s.chips}>
            {SLOTS.map((v) => <Chip key={v} label={slotLabel(v)} selected={form.slots.includes(v)} onPress={() => set('slots')(toggle(SLOTS, form.slots, v))} />)}
          </View>

          <Text style={s.h2}>Open days</Text>
          <Text style={s.note}>None picked = open every day.</Text>
          <View style={s.chips}>
            {DAYS.map((v) => <Chip key={v} label={v} selected={form.openDays.includes(v)} onPress={() => set('openDays')(toggle(DAYS, form.openDays, v))} />)}
          </View>
        </View>
      </ScrollView>

      <View style={s.saveBar}>
        {msg && <Text style={[s.msg, { color: msg.ok ? C.paid : C.rejected }]}>{msg.text}</Text>}
        <Button title={dirty ? 'Save changes' : 'All changes saved'} kind="dark" onPress={save} busy={busy} disabled={!dirty} />
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  header: { backgroundColor: C.turf, paddingHorizontal: 20, paddingBottom: 18 },
  h1: { fontFamily: F.display, fontSize: 34, color: C.chalk },
  sub: { fontFamily: F.body, fontSize: 15, color: '#BFD6C8', marginTop: 2 },
  body: { padding: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  cover: { height: 180, borderRadius: 14, backgroundColor: '#E3E9E4', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverTag: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.flood, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  coverTagText: { fontFamily: F.semi, fontSize: 14, color: C.ink },
  h2: { fontFamily: F.display, fontSize: 22, color: C.ink, marginTop: 22, marginBottom: 10 },
  note: { fontFamily: F.body, fontSize: 14, color: C.muted, marginTop: -6, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  headRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 22, marginBottom: 10 },
  legend: { fontFamily: F.body, fontSize: 14, color: C.muted },
  card: { backgroundColor: C.chalk, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12 },
  rowLine: { borderTopWidth: 1, borderColor: C.line },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  thumbEmpty: { backgroundColor: '#E3EEE7', alignItems: 'center', justifyContent: 'center' },
  thumbAdd: { backgroundColor: C.flood, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: F.semi, fontSize: 16, color: C.ink },
  rowSub: { fontFamily: F.body, fontSize: 14, color: C.muted, marginTop: 1 },
  saveBar: { padding: 12, paddingHorizontal: 16, backgroundColor: C.chalk, borderTopWidth: 1, borderColor: C.line },
  msg: { fontFamily: F.medium, fontSize: 15, marginBottom: 8, textAlign: 'center' },
})
