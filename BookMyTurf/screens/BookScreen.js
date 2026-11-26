import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api, errorText, pb } from '../auth'
import { Button, Chip, ErrorState, Loading } from '../ui/kit'
import { C, F, dateParts, money, slotLabel } from '../ui/theme'

export default function BookScreen({ navigation, route }) {
  const { id, pitch: pitchId } = route.params // venue, and the turf inside it being booked
  const insets = useSafeAreaInsets()
  const [turf, setTurf] = useState(null)
  const [pitch, setPitch] = useState(null)
  const [days, setDays] = useState([])
  const [date, setDate] = useState(null)
  const [avail, setAvail] = useState(null) // { slots, taken, started } for `date`
  const [slot, setSlot] = useState(null)
  const [sport, setSport] = useState(null)
  const [error, setError] = useState('')

  const load = () => Promise.all([pb.collection('turfs').getOne(id), pb.collection('pitches').getOne(pitchId), api.days(id)])
    .then(([t, p, d]) => {
      setTurf(t); setPitch(p); setDays(d.days); setDate(d.days[0] || null)
      if ((p.sports || []).length === 1) setSport(p.sports[0])
      navigation.setOptions({ title: `${t.name}: ${p.name}` })
    })
    .catch((e) => setError(errorText(e)))
  useEffect(() => { load() }, [id, pitchId])

  // Re-check free slots when the date changes and whenever this screen comes back into view.
  useEffect(() => {
    if (!date) return
    setAvail(null); setSlot(null)
    const check = () => api.availability(pitchId, date).then(setAvail, (e) => setError(errorText(e)))
    check()
    return navigation.addListener('focus', check)
  }, [pitchId, date, navigation])

  if (!turf || !pitch) return error ? <ErrorState message={error} onRetry={() => { setError(''); load() }} /> : <Loading />

  const why = (sl) => avail?.taken.includes(sl) ? 'Booked' : (avail?.started || []).includes(sl) ? 'Started' : ''
  const freeCount = (avail?.slots || []).filter((sl) => !why(sl)).length
  const ready = date && slot && sport

  return (
    <View style={{ flex: 1, backgroundColor: C.field }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <Text style={s.h2}>Date</Text>
        {days.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {days.map((d) => {
              const p = dateParts(d)
              const on = d === date
              return (
                <Pressable key={d} onPress={() => setDate(d)} style={[s.day, on && s.dayOn]}
                  accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={p.long}>
                  <Text style={[s.dow, on && { color: C.turfDeep }]}>{isToday(d) ? 'Today' : p.dow}</Text>
                  <Text style={[s.dnum, on && { color: C.ink }]}>{p.day}</Text>
                  <Text style={[s.dmon, on && { color: C.turfDeep }]}>{p.month}</Text>
                </Pressable>
              )
            })}
          </ScrollView>
        ) : <Text style={[s.note, { marginHorizontal: 20 }]}>This turf has no open days in the next two weeks.</Text>}

        <Text style={s.h2}>Time</Text>
        <View style={s.grid}>
          {!avail && date ? <ActivityIndicator color={C.turf} style={{ margin: 16 }} /> : (avail?.slots || []).map((sl) => {
            const reason = why(sl)
            const on = slot === sl
            return (
              <Pressable key={sl} disabled={!!reason} onPress={() => setSlot(sl)}
                style={[s.slot, on && s.slotOn, !!reason && s.slotOff]}
                accessibilityRole="button" accessibilityState={{ selected: on, disabled: !!reason }}
                accessibilityLabel={`${slotLabel(sl)}${reason ? `, ${reason.toLowerCase()}` : ''}`}>
                <Text style={[s.slotTime, !!reason && s.slotTimeOff]}>{slotLabel(sl)}</Text>
                <Text style={[s.slotNote, on && { color: C.turfDeep }]}>{reason || (on ? 'Selected' : 'Free')}</Text>
              </Pressable>
            )
          })}
        </View>
        {avail && !freeCount && <Text style={[s.note, { marginHorizontal: 20 }]}>Every slot is taken on this day. Try another date.</Text>}

        <Text style={s.h2}>Sport</Text>
        <View style={[s.grid, { gap: 8 }]}>
          {(pitch.sports || []).map((sp) => <Chip key={sp} label={sp} selected={sport === sp} onPress={() => setSport(sp)} />)}
        </View>
      </ScrollView>

      <View style={[s.bar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.barMain} numberOfLines={1}>{slot ? slotLabel(slot) : 'Pick a time'}</Text>
          <Text style={s.barSub} numberOfLines={1}>{date ? dateParts(date).long : ''}{date ? ', ' : ''}{money(pitch.price)}</Text>
        </View>
        <Button title="Continue to pay" disabled={!ready} onPress={() => navigation.navigate('Pay', { id, pitch: pitchId, date, slot, sport })} style={{ marginLeft: 12 }} />
      </View>
    </View>
  )
}

function isToday(ymd) {
  return ymd === new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10)
}

const s = StyleSheet.create({
  h2: { fontFamily: F.display, fontSize: 22, color: C.ink, marginTop: 22, marginBottom: 10, marginHorizontal: 20 },
  note: { fontFamily: F.body, fontSize: 15, color: C.muted },
  day: { width: 64, paddingVertical: 10, borderRadius: 12, backgroundColor: C.chalk, alignItems: 'center', borderWidth: 1.5, borderColor: C.line },
  dayOn: { backgroundColor: C.flood, borderColor: C.flood },
  dow: { fontFamily: F.medium, fontSize: 13, color: C.muted },
  dnum: { fontFamily: F.display, fontSize: 26, color: C.ink, lineHeight: 28 },
  dmon: { fontFamily: F.body, fontSize: 13, color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  slot: { width: '47.5%', flexGrow: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.chalk, borderWidth: 1.5, borderColor: C.line },
  slotOn: { backgroundColor: C.flood, borderColor: C.flood },
  slotOff: { backgroundColor: '#E6EBE7', borderColor: '#E6EBE7' },
  slotTime: { fontFamily: F.displaySemi, fontSize: 20, color: C.ink },
  slotTimeOff: { color: '#98A39C', textDecorationLine: 'line-through' },
  slotNote: { fontFamily: F.body, fontSize: 13, color: C.muted },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: C.chalk, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderColor: C.line },
  barMain: { fontFamily: F.semi, fontSize: 16, color: C.ink },
  barSub: { fontFamily: F.body, fontSize: 14, color: C.muted },
})
