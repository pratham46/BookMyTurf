import React, { useCallback, useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { SPORTS, errorText, fileUrl, myTurf, pb } from '../auth'
import { Button, Chip, ErrorState, Field, Loading } from '../ui/kit'
import { C, F } from '../ui/theme'

// Add (no params) or edit ({ id }) one turf inside the owner's venue: name, sports, price, photos.
export default function PitchScreen({ route, navigation }) {
  const id = route.params?.id
  const [pitch, setPitch] = useState(null) // saved record; null while new
  const [form, setForm] = useState(id ? null : { name: '', price: '', sports: [] })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const reset = (p) => { setPitch(p); setForm({ name: p.name, price: p.price ? String(p.price) : '', sports: p.sports || [] }) }
  // reload on focus so the photo count is fresh after the photos screen
  const load = useCallback(() => { if (id) pb.collection('pitches').getOne(id).then(reset, (e) => setError(errorText(e))) }, [id])
  useFocusEffect(load)

  if (!form) return error ? <ErrorState message={error} onRetry={load} /> : <Loading />

  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setMsg(''); setConfirmDelete(false) }
  const toggleSport = (sp) => set('sports')(SPORTS.filter((x) => (x === sp ? !form.sports.includes(sp) : form.sports.includes(x))))
  const dirty = !pitch || form.name !== pitch.name || form.price !== (pitch.price ? String(pitch.price) : '') || form.sports.join() !== (pitch.sports || []).join()

  const save = async () => {
    const price = Number(form.price)
    if (!form.name.trim()) return setMsg('Give this turf a name players will recognise, e.g. "Turf A" or "Box Cricket".')
    if (!Number.isInteger(price) || price <= 0) return setMsg('Enter the price per slot in whole rupees.')
    if (!form.sports.length) return setMsg('Pick at least one sport.')
    setBusy(true)
    try {
      const body = { name: form.name.trim(), price, sports: form.sports }
      if (pitch) {
        reset(await pb.collection('pitches').update(pitch.id, body))
        setMsg('Saved')
      } else {
        const venue = await myTurf()
        const p = await pb.collection('pitches').create({ ...body, venue: venue.id })
        navigation.setParams({ id: p.id })
        reset(p)
        setMsg('Turf added. Now add some photos of it.')
      }
    } catch (e) {
      setMsg(/unique/i.test(errorText(e)) ? 'You already have a turf with that name.' : errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirmDelete) return setConfirmDelete(true)
    setBusy(true)
    try {
      await pb.collection('pitches').delete(pitch.id)
      navigation.goBack()
    } catch (e) {
      setMsg(errorText(e)); setBusy(false); setConfirmDelete(false)
    }
  }

  const photos = pitch?.photos || []

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.field }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.body}>
        <Field label="Name" value={form.name} onChangeText={set('name')} placeholder="e.g. Turf A (5-a-side)" />
        <Field label="Price per slot (₹)" value={form.price} onChangeText={set('price')} keyboardType="number-pad" placeholder="999" />

        <Text style={s.label}>Sports played here</Text>
        <View style={s.chips}>
          {SPORTS.map((sp) => <Chip key={sp} label={sp} selected={form.sports.includes(sp)} onPress={() => toggleSport(sp)} />)}
        </View>

        {!!msg && <Text style={[s.msg, { color: /^(Saved|Turf added)/.test(msg) ? C.paid : C.rejected }]}>{msg}</Text>}
        <Button title={pitch ? (dirty ? 'Save changes' : 'All changes saved') : 'Add turf'} kind="dark" onPress={save} busy={busy} disabled={!dirty} />

        {pitch && (
          <>
            <Text style={s.h2}>Photos</Text>
            <Pressable onPress={() => navigation.navigate('Gallery', { pitch: pitch.id })} style={s.photosRow} accessibilityRole="button">
              {photos.length
                ? <Image source={{ uri: fileUrl(pitch, photos[0], '300x300') }} style={s.thumb} />
                : <View style={[s.thumb, s.thumbEmpty]}><Ionicons name="images-outline" size={24} color={C.muted} /></View>}
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle}>{photos.length ? `${photos.length} photo${photos.length > 1 ? 's' : ''}` : 'No photos yet'}</Text>
                <Text style={s.rowSub}>Players see these when they pick this turf</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={C.muted} />
            </Pressable>

            <Button title={confirmDelete ? 'Tap again to delete this turf' : 'Delete turf'} kind="ghost" onPress={remove}
              disabled={busy} style={{ marginTop: 32, borderColor: confirmDelete ? C.rejected : C.line }} />
            <Text style={s.hint}>Turfs with upcoming bookings can't be deleted. Past bookings are kept.</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  body: { padding: 20, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  label: { fontFamily: F.medium, fontSize: 14, color: C.muted, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  msg: { fontFamily: F.medium, fontSize: 15, marginBottom: 12 },
  h2: { fontFamily: F.display, fontSize: 22, color: C.ink, marginTop: 28, marginBottom: 10 },
  photosRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.chalk, borderRadius: 14, padding: 12 },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbEmpty: { backgroundColor: '#E3E9E4', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: F.semi, fontSize: 16, color: C.ink },
  rowSub: { fontFamily: F.body, fontSize: 14, color: C.muted },
  hint: { fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: 'center', marginTop: 8 },
})
