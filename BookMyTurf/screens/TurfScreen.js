import React, { useEffect, useState } from 'react'
import { Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Ionicons from '@expo/vector-icons/Ionicons'
import { errorText, fileUrl, pb, venuePitches } from '../auth'
import { Button, ErrorState, Loading } from '../ui/kit'
import { C, F, money, slotLabel } from '../ui/theme'

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function TurfScreen({ navigation, route }) {
  const { id } = route.params
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const [turf, setTurf] = useState(null) // the venue
  const [pitches, setPitches] = useState([]) // bookable turfs inside it
  const [pitchId, setPitchId] = useState(null)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)

  const load = () => Promise.all([pb.collection('turfs').getOne(id), venuePitches(id)])
    .then(([t, ps]) => { setTurf(t); setPitches(ps); setPitchId(ps[0]?.id || null) }, (e) => setError(errorText(e)))
  useEffect(() => { load() }, [id])

  if (!turf) return error ? <ErrorState message={error} onRetry={() => { setError(''); load() }} /> : <Loading />

  const pitch = pitches.find((p) => p.id === pitchId)
  // the picked turf's own photos first, then the venue cover and venue photos
  const photos = [
    ...(pitch?.photos || []).map((f) => [pitch, f]),
    ...[turf.cover, ...(turf.gallery || [])].filter(Boolean).map((f) => [turf, f]),
  ]
  const pickPitch = (pid) => { setPitchId(pid); setPage(0) }
  const photoW = Math.min(width, 900)
  const open = turf.openDays?.length ? DAY_ORDER.filter((d) => turf.openDays.includes(d)) : DAY_ORDER
  const openText = open.length === 7 ? 'Open every day' : `Open ${open.join(', ')}`

  const actions = [
    turf.phone && { icon: 'call', label: 'Call', run: () => Linking.openURL(`tel:${turf.phone.replace(/\s/g, '')}`) },
    turf.mapUrl && { icon: 'navigate', label: 'Directions', run: () => Linking.openURL(turf.mapUrl) },
    { icon: 'share-social', label: 'Share', run: () => Share.share({ message: `${turf.name}, ${turf.area}: ${money(turf.price)} per slot on BookMyTurf${turf.mapUrl ? `\n${turf.mapUrl}` : ''}` }) },
  ].filter(Boolean)

  return (
    <View style={{ flex: 1, backgroundColor: C.field }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          <ScrollView key={pitchId} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / photoW))}
            style={{ width: photoW, alignSelf: 'center' }}>
            {photos.length ? photos.map(([rec, f]) => (
              <Image key={f} source={{ uri: fileUrl(rec, f, '800x450') }} style={{ width: photoW, height: photoW * 0.68 }} accessibilityLabel={`Photo of ${rec.name}`} />
            )) : <View style={{ width: photoW, height: photoW * 0.5, backgroundColor: C.turf }} />}
          </ScrollView>
          {photos.length > 1 && (
            <View style={s.dots}>{photos.map(([, f], i) => <View key={f} style={[s.dot, i === page && s.dotOn]} />)}</View>
          )}
          <Pressable onPress={() => navigation.goBack()} style={[s.back, { top: insets.top + 10 }]} accessibilityRole="button" accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={24} color={C.ink} />
          </Pressable>
        </View>

        <View style={s.body}>
          <Text style={s.name}>{turf.name}</Text>
          <View style={s.row}>
            <Ionicons name="location-outline" size={17} color={C.muted} />
            <Text style={s.meta}>{turf.address || turf.area}</Text>
          </View>

          <View style={s.actions}>
            {actions.map((a) => (
              <Pressable key={a.label} onPress={a.run} style={({ pressed }) => [s.action, pressed && { opacity: 0.7 }]} accessibilityRole="button">
                <Ionicons name={a.icon} size={22} color={C.turf} />
                <Text style={s.actionText}>{a.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.h2}>{pitches.length > 1 ? `Choose a turf (${pitches.length})` : 'Turf'}</Text>
          <View style={{ gap: 10 }}>
            {pitches.map((p) => {
              const on = p.id === pitchId
              return (
                <Pressable key={p.id} onPress={() => pickPitch(p.id)} style={[s.pitch, on && s.pitchOn]}
                  accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${p.name}, ${p.sports.join(', ')}, ${money(p.price)} per slot`}>
                  {p.photos?.length
                    ? <Image source={{ uri: fileUrl(p, p.photos[0], '300x300') }} style={s.pitchImg} />
                    : <View style={[s.pitchImg, { backgroundColor: C.turf }]} />}
                  <View style={{ flex: 1 }}>
                    <Text style={s.pitchName} numberOfLines={1}>{p.name}</Text>
                    <View style={[s.wrap, { gap: 6, marginTop: 4 }]}>
                      {p.sports.map((sp) => <Text key={sp} style={s.tag}>{sp}</Text>)}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={s.pitchPrice}>{money(p.price)}</Text>
                    <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? C.turf : '#B5BEB8'} style={{ marginTop: 4 }} />
                  </View>
                </Pressable>
              )
            })}
            {!pitches.length && <Text style={s.meta}>No turfs are taking bookings here right now.</Text>}
          </View>

          <Text style={s.h2}>Slots</Text>
          <Text style={s.meta}>{openText}. Each slot is 2 hours.</Text>
          <View style={[s.wrap, { marginTop: 10 }]}>
            {(turf.slots || []).map((sl) => <Text key={sl} style={s.slot}>{slotLabel(sl)}</Text>)}
          </View>
        </View>
      </ScrollView>

      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={s.barPrice}>{money(pitch ? pitch.price : turf.price)}</Text>
          <Text style={s.barPer} numberOfLines={1}>{pitch && pitches.length > 1 ? `${pitch.name}, per slot` : 'per 2-hour slot'}</Text>
        </View>
        <Button title="Book a slot" disabled={!pitch} onPress={() => navigation.navigate('Book', { id: turf.id, pitch: pitch.id })} style={{ flex: 1, marginLeft: 18 }} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  back: { position: 'absolute', left: 14, width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  dotOn: { backgroundColor: C.chalk, width: 18 },
  body: { padding: 20 },
  name: { fontFamily: F.display, fontSize: 36, color: C.ink, lineHeight: 38 },
  row: { flexDirection: 'row', gap: 4, marginTop: 6 },
  meta: { fontFamily: F.body, fontSize: 16, color: C.muted, flexShrink: 1 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  action: { flex: 1, backgroundColor: C.chalk, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4 },
  actionText: { fontFamily: F.medium, fontSize: 14, color: C.ink },
  h2: { fontFamily: F.display, fontSize: 22, color: C.ink, marginTop: 26, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pitch: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.chalk, borderRadius: 14, padding: 10, borderWidth: 2, borderColor: C.chalk },
  pitchOn: { borderColor: C.turf },
  pitchImg: { width: 64, height: 64, borderRadius: 10 },
  pitchName: { fontFamily: F.display, fontSize: 21, color: C.ink },
  pitchPrice: { fontFamily: F.display, fontSize: 20, color: C.turf },
  tag: { fontFamily: F.medium, fontSize: 14, color: C.turf, backgroundColor: '#DDEDE2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  slot: { fontFamily: F.medium, fontSize: 15, color: C.ink, borderWidth: 1.5, borderColor: C.line, backgroundColor: C.chalk, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: C.chalk, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderColor: C.line },
  barPrice: { fontFamily: F.display, fontSize: 28, color: C.turf },
  barPer: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: -3 },
})
