import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as ImagePicker from 'expo-image-picker'
import { errorText, fileUrl, myTurf, pb, toUpload } from '../auth'
import { ErrorState, Loading } from '../ui/kit'
import { C, F } from '../ui/theme'

const PAD = 16
const GAP = 10

// Photos shown to customers: the venue's gallery, or one turf's photos when opened with { pitch: id }.
// Two-column grid; last tile adds more.
export default function GalleryImage({ route, navigation }) {
  const pitchId = route.params?.pitch
  const col = pitchId ? 'pitches' : 'turfs'
  const field = pitchId ? 'photos' : 'gallery'
  const { width } = useWindowDimensions()
  const [turf, setTurf] = useState(null) // the venue or the pitch
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => (pitchId ? pb.collection('pitches').getOne(pitchId) : myTurf()).then((r) => {
    setTurf(r)
    if (pitchId) navigation.setOptions({ title: `${r.name}: photos` })
  }, (e) => setError(errorText(e)))
  useEffect(() => { load() }, [pitchId])

  const run = async (body) => {
    setBusy(true)
    try {
      setTurf(await pb.collection(col).update(turf.id, body))
      setError('')
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const pickImages = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 })
    if (!r.canceled) run({ [`${field}+`]: await Promise.all(r.assets.map(toUpload)) })
  }

  if (!turf) return error ? <ErrorState message={error} onRetry={load} /> : <Loading />

  // tile size from the window (capped like the other screens' 640 max width)
  const tile = Math.floor((Math.min(width, 640) - PAD * 2 - GAP) / 2)
  const photos = turf[field] || []

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.field }} contentContainerStyle={s.body}>
      <Text style={s.note}>
        {photos.length ? `${photos.length} photo${photos.length > 1 ? 's' : ''} shown to players${pitchId ? ' when they pick this turf' : ' at the top of your venue page'}.` : 'No photos yet. Players book more when they can see the pitch.'}
      </Text>
      {!!error && <Text style={s.err}>{error}</Text>}
      <View style={s.grid}>
        {photos.map((f) => (
          <View key={f} style={[s.tile, { width: tile, height: tile * 0.75 }]}>
            <Image source={{ uri: fileUrl(turf, f, '800x450') }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <Pressable onPress={() => run({ [`${field}-`]: [f] })} disabled={busy} style={s.remove}
              accessibilityRole="button" accessibilityLabel="Remove photo" hitSlop={8}>
              <Ionicons name="trash" size={16} color={C.chalk} />
            </Pressable>
          </View>
        ))}
        <Pressable onPress={pickImages} disabled={busy} style={[s.tile, s.add, { width: tile, height: tile * 0.75 }]}
          accessibilityRole="button" accessibilityLabel="Add photos">
          {busy ? <ActivityIndicator color={C.turf} /> : (
            <>
              <Ionicons name="add-circle" size={34} color={C.turf} />
              <Text style={s.addText}>Add photos</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  body: { padding: PAD, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
  note: { fontFamily: F.body, fontSize: 15, color: C.muted, marginBottom: 14 },
  err: { fontFamily: F.medium, fontSize: 15, color: C.rejected, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#E3E9E4' },
  remove: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(19,32,26,0.75)', alignItems: 'center', justifyContent: 'center' },
  add: { backgroundColor: C.chalk, borderWidth: 1.5, borderColor: C.line, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addText: { fontFamily: F.semi, fontSize: 15, color: C.turf, marginTop: 4 },
})
